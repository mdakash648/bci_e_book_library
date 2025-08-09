import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

class FirebaseService {
  // Default admin secret key (will be replaced by database value)
  DEFAULT_ADMIN_SECRET_KEY = 'admin123456';

  // Create user account with Firebase Auth
  async createUserWithEmailAndPassword(email, password) {
    try {
      const normalizedEmail = (email || '').trim().toLowerCase();
      
      // Check if Firebase is properly initialized
      if (!auth().app) {
        return { success: false, error: 'Firebase not initialized' };
      }
      
      const userCredential = await auth().createUserWithEmailAndPassword(normalizedEmail, password);
      
      // Ensure user is available
      if (userCredential?.user) {
        await userCredential.user.reload();
        if (userCredential.user.uid) {
          return { success: true, user: userCredential.user };
        }
      }
      return { success: false, error: 'Auth user was not created. Check Firebase configuration.' };
    } catch (error) {
      return { success: false, error: `${error.code || 'auth/error'}: ${error.message}` };
    }
  }

  // Create user account with phone number
  async createUserWithPhoneNumber(phoneNumber, password, otp) {
    try {
      // First verify the OTP
      const otpVerification = await this.verifyOTP(phoneNumber, otp);
      if (!otpVerification.success) {
        return { success: false, error: otpVerification.error };
      }

      // Create email for Firebase Auth (since we can't use phone auth on free plan)
      const email = `${phoneNumber.replace(/[^0-9]/g, '')}@temp.com`;
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Sign in with email and password
  async signInWithEmailAndPassword(email, password) {
    try {
      const normalizedEmail = (email || '').trim().toLowerCase();
      const userCredential = await auth().signInWithEmailAndPassword(normalizedEmail, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Sign in with phone number
  async signInWithPhoneNumber(phoneNumber, password = '', otp = '') {
    try {
      // Determine authentication method
      const useOTP = otp && otp.trim();
      const usePassword = password && password.trim();
      
      if (!useOTP && !usePassword) {
        return { success: false, error: 'Please provide either OTP or password' };
      }
      
      if (useOTP && usePassword) {
        return { success: false, error: 'Please use either OTP or password, not both' };
      }

      // Create email for Firebase Auth (since phone auth requires Blaze plan)
      const email = `${phoneNumber.replace(/[^0-9]/g, '')}@temp.com`;
      
      if (useOTP) {
        // OTP authentication
        const otpVerification = await this.verifyOTP(phoneNumber, otp);
        if (!otpVerification.success) {
          return { success: false, error: otpVerification.error };
        }
        
        // For OTP login, we need to check if user exists
        try {
          const userCredential = await auth().signInWithEmailAndPassword(email, 'tempPassword123');
          return { success: true, user: userCredential.user };
        } catch (error) {
          if (error.code === 'auth/user-not-found') {
            return { success: false, error: 'Account not found. Please register first.' };
          }
          return { success: false, error: error.message };
        }
      } else {
        // Password authentication
        const userCredential = await auth().signInWithEmailAndPassword(email, password);
        return { success: true, user: userCredential.user };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Save user data to Firestore
  async saveUserData(userId, userData) {
    try {
      await firestore().collection('users').doc(userId).set({
        ...userData,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get admin secret key from Firestore
  async getAdminSecretKey() {
    try {
      const doc = await firestore().collection('system').doc('admin').get();
      if (doc.exists && doc.data().secretKey) {
        return { success: true, secretKey: doc.data().secretKey };
      } else {
        // If no admin key in database, use default and create it
        const defaultKey = this.DEFAULT_ADMIN_SECRET_KEY;
        await this.setAdminSecretKey(defaultKey);
        return { success: true, secretKey: defaultKey };
      }
    } catch (error) {
      // Fallback to default key
      return { success: true, secretKey: this.DEFAULT_ADMIN_SECRET_KEY };
    }
  }

  // Get complete admin key information including last updated by
  async getAdminKeyInfo() {
    try {
      const doc = await firestore().collection('system').doc('admin').get();
      if (doc.exists) {
        return { success: true, data: doc.data() };
      } else {
        // If no admin key in database, create default
        const defaultKey = this.DEFAULT_ADMIN_SECRET_KEY;
        await this.setAdminSecretKey(defaultKey);
        return { success: true, data: { secretKey: defaultKey } };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Set admin secret key in Firestore
  async setAdminSecretKey(secretKey, userInfo = null) {
    try {
      const updateData = {
        secretKey: secretKey,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      };

      // Add user info if provided
      if (userInfo) {
        updateData.lastUpdatedBy = {
          name: userInfo.name || 'Unknown',
          email: userInfo.email || 'Unknown',
          userId: userInfo.userId || 'Unknown',
        };
      }

      await firestore().collection('system').doc('admin').set(updateData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Validate admin secret key against database
  async validateAdminSecretKey(secretKey) {
    try {
      const result = await this.getAdminSecretKey();
      if (result.success) {
        return secretKey === result.secretKey;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  // Update admin secret key (admin only)
  async updateAdminSecretKey(userId, newSecretKey) {
    try {
      // Verify user is admin
      const userData = await this.getUserData(userId);
      if (!userData.success || userData.data.role !== 'admin') {
        return { success: false, error: 'Only admins can update the secret key' };
      }

      // Prepare user info for audit trail
      const userInfo = {
        name: userData.data.name || 'Unknown',
        email: userData.data.email || userData.data.identifier || 'Unknown',
        userId: userId,
      };

      // Update the secret key in database with user info
      const result = await this.setAdminSecretKey(newSecretKey, userInfo);
      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: 'Failed to update admin secret key' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Verify auth user exists for email
  async verifyAuthUserForEmail(email) {
    try {
      const methods = await auth().fetchSignInMethodsForEmail(email);
      return { success: true, exists: Array.isArray(methods) && methods.length > 0, methods };
    } catch (error) {
      return { success: false, error: `${error.code || 'auth/error'}: ${error.message}` };
    }
  }

  // Get user data from Firestore
  async getUserData(userId) {
    try {
      const doc = await firestore().collection('users').doc(userId).get();
      if (doc.exists) {
        return { success: true, data: doc.data() };
      } else {
        return { success: false, error: 'User not found' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email) {
    try {
      await auth().sendPasswordResetEmail(email);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Send password reset SMS (for phone numbers)
  async sendPasswordResetSMS(phoneNumber) {
    try {
      // In a real app, you'd implement SMS verification
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Generate OTP for phone verification
  async generateOTP(phoneNumber) {
    try {
      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
      
      // Store OTP in Firestore
      await firestore().collection('otp_codes').doc(phoneNumber).set({
        otp: otp,
        phoneNumber: phoneNumber,
        createdAt: firestore.FieldValue.serverTimestamp(),
        expiresAt: expiresAt,
        used: false,
      });

      // In a real app, you would send this OTP via SMS
      // For now, we'll return it for testing purposes
      return { success: true, otp: otp, message: 'OTP sent successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Verify OTP for phone number
  async verifyOTP(phoneNumber, otp) {
    try {
      const doc = await firestore().collection('otp_codes').doc(phoneNumber).get();
      
      if (!doc.exists) {
        return { success: false, error: 'No OTP found for this phone number' };
      }

      const otpData = doc.data();
      const now = new Date();
      const expiresAt = otpData.expiresAt.toDate();

      // Check if OTP is expired
      if (now > expiresAt) {
        // Clean up expired OTP
        await firestore().collection('otp_codes').doc(phoneNumber).delete();
        return { success: false, error: 'OTP has expired' };
      }

      // Check if OTP is already used
      if (otpData.used) {
        return { success: false, error: 'OTP has already been used' };
      }

      // Check if OTP matches
      if (otpData.otp !== otp) {
        return { success: false, error: 'Invalid OTP' };
      }

      // Mark OTP as used
      await firestore().collection('otp_codes').doc(phoneNumber).update({
        used: true,
        verifiedAt: firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, message: 'OTP verified successfully' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Sign out
  async signOut() {
    try {
      await auth().signOut();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get current user
  getCurrentUser() {
    return auth().currentUser;
  }

  // Listen to auth state changes
  onAuthStateChanged(callback) {
    return auth().onAuthStateChanged(callback);
  }
}

export default new FirebaseService();

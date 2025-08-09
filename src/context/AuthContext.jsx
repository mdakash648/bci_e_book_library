import React, { createContext, useState, useContext, useEffect } from 'react';
import firebaseService from '../services/firebaseService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = firebaseService.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Get additional user data from Firestore
        const userDataResult = await firebaseService.getUserData(firebaseUser.uid);
        
        if (userDataResult.success) {
          const completeUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email || userDataResult.data.identifier,
            phoneNumber: firebaseUser.phoneNumber,
            ...userDataResult.data,
          };
          setUser(completeUser);
          setIsAuthenticated(true);
        } else {
          // If no Firestore data, create basic user object
          const basicUser = {
            id: firebaseUser.uid,
            email: firebaseUser.email || 'Unknown',
            phoneNumber: firebaseUser.phoneNumber,
            name: firebaseUser.displayName || 'User',
            role: 'user', // Default to user role
          };
          setUser(basicUser);
          setIsAuthenticated(true);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (identifier, password = '', otp = '') => {
    try {
      // Determine if identifier is email or phone
      const isEmail = identifier.includes('@');
      
      if (isEmail) {
        // Email login - password required
        if (!password) {
          return { success: false, error: 'Password is required for email login' };
        }
        const result = await firebaseService.signInWithEmailAndPassword(identifier, password);
        return result;
      } else {
        // Phone login - either OTP or password
        if (!otp && !password) {
          return { success: false, error: 'Please provide either OTP or password' };
        }
        
        if (otp && password) {
          return { success: false, error: 'Please use either OTP or password, not both' };
        }
        
        // Use OTP if provided, otherwise use password
        const result = await firebaseService.signInWithPhoneNumber(identifier, password, otp);
        return result;
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const register = async (name, identifier, password, isAdmin = false, secretKey = '', inputType = 'email', otp = '') => {
    try {
      // Validate admin secret key if registering as admin
      if (isAdmin) {
        if (!secretKey) {
          return { success: false, error: 'Admin secret key is required' };
        }
        
        // Validate against database
        const isValidAdminKey = await firebaseService.validateAdminSecretKey(secretKey);
        if (!isValidAdminKey) {
          return { success: false, error: 'Invalid admin secret key' };
        }
      }

      // Create user account with Firebase
      let result;
      if (inputType === 'email') {
        result = await firebaseService.createUserWithEmailAndPassword(identifier, password);
      } else {
        result = await firebaseService.createUserWithPhoneNumber(identifier, password, otp);
      }
      
      if (result.success) {
        // Save additional user data to Firestore
        const userData = {
          name: name,
          role: isAdmin ? 'admin' : 'user',
          inputType: inputType,
          identifier: identifier,
          createdAt: new Date().toISOString(),
        };
        
        const saveResult = await firebaseService.saveUserData(result.user.uid, userData);
        
        if (saveResult.success) {
          // Refresh user data to ensure role is properly loaded
          setTimeout(async () => {
            await refreshUserData();
          }, 1000); // Small delay to ensure Firestore data is available
          return { success: true, user: result.user };
        } else {
          // Even if Firestore save fails, the user is created in Firebase Auth
          return { success: true, user: result.user };
        }
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  // Generate OTP for phone verification
  const generateOTP = async (phoneNumber) => {
    try {
      const result = await firebaseService.generateOTP(phoneNumber);
      return result;
    } catch (error) {
      console.error('Generate OTP error:', error);
      return { success: false, error: error.message };
    }
  };

  const verifyOTP = async (otp) => {
    try {
      if (!pendingUser) {
        return { success: false, error: 'No pending registration found' };
      }

      // For now, we'll use a simple OTP verification
      // In a real app, you'd implement Firebase Phone Auth or a custom OTP system
      if (otp === '123456') { // Mock OTP for testing
        // User is already created in Firebase, just update the state
        setUser(pendingUser);
        setIsAuthenticated(true);
        setPendingUser(null);
        return { success: true };
      } else {
        return { success: false, error: 'Invalid OTP' };
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      return { success: false, error: error.message };
    }
  };

  const resetPassword = async (identifier, inputType = 'email') => {
    try {
      let result;
      if (inputType === 'email') {
        result = await firebaseService.sendPasswordResetEmail(identifier);
      } else {
        result = await firebaseService.sendPasswordResetSMS(identifier);
      }
      
      return result;
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }
  };

  const updateAdminSecretKey = async (currentPassword, newSecretKey) => {
    try {
      // Validate current password
      if (!currentPassword) {
        return { success: false, error: 'Current password is required' };
      }

      // Validate new secret key
      if (!newSecretKey || newSecretKey.length < 6) {
        return { success: false, error: 'New secret key must be at least 6 characters long' };
      }

      // Update the admin secret key using Firebase service
      const result = await firebaseService.updateAdminSecretKey(user?.id, newSecretKey);
      
      return result;
    } catch (error) {
      console.error('Admin secret key update error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      const result = await firebaseService.signOut();
      if (result.success) {
        setUser(null);
        setIsAuthenticated(false);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  // Refresh user data from Firestore
  const refreshUserData = async () => {
    try {
      const currentUser = firebaseService.getCurrentUser();
      if (currentUser) {
        const userDataResult = await firebaseService.getUserData(currentUser.uid);
        if (userDataResult.success) {
          const updatedUser = {
            id: currentUser.uid,
            email: currentUser.email || userDataResult.data.identifier,
            phoneNumber: currentUser.phoneNumber,
            ...userDataResult.data,
          };
          setUser(updatedUser);
          return { success: true, user: updatedUser };
        } else {
          return { success: false, error: userDataResult.error };
        }
      } else {
        return { success: false, error: 'No current user' };
      }
    } catch (error) {
      console.error('Refresh user data error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    verifyOTP,
    resetPassword,
    updateAdminSecretKey,
    logout,
    refreshUserData,
    generateOTP,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 
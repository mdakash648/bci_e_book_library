import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, getAuth, signInWithCredential } from '@react-native-firebase/auth';

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: '869110077398-7s9apln6ub0pp90p3grbl8efaabjemeh.apps.googleusercontent.com', // This is the web client ID from google-services.json
  offlineAccess: true,
  hostedDomain: '',
  forceCodeForRefreshToken: true,
});

class GoogleSignInService {
  constructor() {
    this.auth = getAuth();
  }

  // Check if device supports Google Play Services
  async hasPlayServices() {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      return true;
    } catch (error) {
      console.error('Google Play Services error:', error);
      return false;
    }
  }

  // Check if user is already signed in with Google
  async isSignedIn() {
    try {
      return await GoogleSignin.isSignedIn();
    } catch (error) {
      console.error('Check sign-in status error:', error);
      return false;
    }
  }

  // Sign in with Google
  async signIn() {
    try {
      // Check if device supports Google Play Services
      const hasPlayServices = await this.hasPlayServices();
      if (!hasPlayServices) {
        return { success: false, error: 'Google Play Services not available' };
      }

      // Get the user's ID token
      const signInResult = await GoogleSignin.signIn();

      // Try the new style of google-sign in result, from v13+ of that module
      let idToken = signInResult.data?.idToken;
      if (!idToken) {
        // if you are using older versions of google-signin, try old style result
        idToken = signInResult.idToken;
      }
      
      if (!idToken) {
        throw new Error('No ID token found');
      }

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      const userCredential = await signInWithCredential(this.auth, googleCredential);
      
      return { 
        success: true, 
        user: userCredential.user,
        additionalUserInfo: userCredential.additionalUserInfo 
      };
    } catch (error) {
      console.error('Google Sign-In error:', error);
      
      // Handle specific error cases
      if (error.code === 'SIGN_IN_CANCELLED') {
        return { success: false, error: 'Sign-in was cancelled by user' };
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        return { success: false, error: 'Google Play Services not available' };
      } else if (error.code === 'SIGN_IN_REQUIRED') {
        return { success: false, error: 'Sign-in required' };
      } else if (error.code === 'INVALID_ACCOUNT') {
        return { success: false, error: 'Invalid account' };
      } else if (error.code === 'SIGN_IN_FAILED') {
        return { success: false, error: 'Sign-in failed' };
      }
      
      return { success: false, error: error.message || 'Google Sign-In failed' };
    }
  }

  // Sign out from Google
  async signOut() {
    try {
      await GoogleSignin.signOut();
      return { success: true };
    } catch (error) {
      console.error('Google Sign-Out error:', error);
      return { success: false, error: error.message };
    }
  }

  // Get current user info from Google
  async getCurrentUser() {
    try {
      const userInfo = await GoogleSignin.getCurrentUser();
      return { success: true, user: userInfo };
    } catch (error) {
      console.error('Get current user error:', error);
      return { success: false, error: error.message };
    }
  }

  // Revoke access
  async revokeAccess() {
    try {
      await GoogleSignin.revokeAccess();
      return { success: true };
    } catch (error) {
      console.error('Revoke access error:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new GoogleSignInService();


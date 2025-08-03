import React, { createContext, useState, useContext } from 'react';

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

  // TODO: Replace with actual admin secret key from Firebase/backend
  const ADMIN_SECRET_KEY = 'admin123456';

  const login = async (identifier, password, inputType = 'email') => {
    try {
      // TODO: Implement Firebase authentication
      console.log('Logging in with:', { identifier, password, inputType });
      
      // Simulate successful login
      const mockUser = {
        id: '1',
        identifier: identifier,
        name: 'Test User',
        role: 'user', // Default to user role
        inputType: inputType,
      };
      
      setUser(mockUser);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const register = async (name, identifier, password, isAdmin = false, secretKey = '', inputType = 'email') => {
    try {
      // TODO: Implement Firebase registration
      console.log('Registering with:', { name, identifier, password, isAdmin, secretKey, inputType });
      
      // Validate admin secret key if registering as admin
      if (isAdmin) {
        if (!secretKey) {
          return { success: false, error: 'Admin secret key is required' };
        }
        
        if (secretKey !== ADMIN_SECRET_KEY) {
          return { success: false, error: 'Invalid admin secret key' };
        }
      }
      
      // Store pending user data for OTP verification
      const pendingUserData = {
        id: Date.now().toString(),
        identifier: identifier,
        name: name,
        role: isAdmin ? 'admin' : 'user',
        password: password, // In real app, this would be hashed
        inputType: inputType,
      };
      
      setPendingUser(pendingUserData);
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  };

  const verifyOTP = async (otp) => {
    try {
      // TODO: Implement actual OTP verification with Firebase
      console.log('Verifying OTP:', otp);
      
      if (!pendingUser) {
        return { success: false, error: 'No pending registration found' };
      }

      // Simulate OTP verification (in real app, verify with backend)
      if (otp === '123456') { // Mock OTP for testing
        // Create the user after successful verification
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
      // TODO: Implement Firebase password reset
      console.log('Resetting password for:', { identifier, inputType });
      
      // Simulate password reset (in real app, send email/SMS via Firebase)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For testing purposes, always return success
      // In real app, check if identifier exists in database
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }
  };

  const updateAdminSecretKey = async (currentPassword, newSecretKey) => {
    try {
      // TODO: Implement Firebase admin secret key update
      console.log('Updating admin secret key:', { currentPassword, newSecretKey });
      
      // Validate current password (in real app, verify with Firebase)
      if (!currentPassword) {
        return { success: false, error: 'Current password is required' };
      }

      // For testing purposes, accept any password
      // In real app, verify the current password with Firebase
      if (currentPassword.length < 6) {
        return { success: false, error: 'Invalid current password' };
      }

      // Validate new secret key
      if (!newSecretKey || newSecretKey.length < 6) {
        return { success: false, error: 'New secret key must be at least 6 characters long' };
      }

      // Simulate update process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update the admin secret key (in real app, update in Firebase)
      // For now, we'll just log it
      console.log('Admin secret key updated to:', newSecretKey);
      
      return { success: true };
    } catch (error) {
      console.error('Admin secret key update error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setPendingUser(null);
  };

  const value = {
    user,
    isAuthenticated,
    pendingUser,
    login,
    register,
    verifyOTP,
    resetPassword,
    updateAdminSecretKey,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 
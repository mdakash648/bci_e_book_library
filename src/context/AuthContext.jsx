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

  const login = async (email, password) => {
    try {
      // TODO: Implement Firebase authentication
      console.log('Logging in with:', email, password);
      
      // Simulate successful login
      const mockUser = {
        id: '1',
        email: email,
        name: 'Test User',
        role: 'user', // Default to user role
      };
      
      setUser(mockUser);
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const register = async (name, email, password, isAdmin = false, secretKey = '') => {
    try {
      // TODO: Implement Firebase registration
      console.log('Registering with:', { name, email, password, isAdmin, secretKey });
      
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
        email: email,
        name: name,
        role: isAdmin ? 'admin' : 'user',
        password: password, // In real app, this would be hashed
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

  const resetPassword = async (email) => {
    try {
      // TODO: Implement Firebase password reset
      console.log('Resetting password for:', email);
      
      // Simulate password reset (in real app, send email via Firebase)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For testing purposes, always return success
      // In real app, check if email exists in database
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
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
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 
import React, { createContext, useState, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const lightTheme = {
    // Background colors
    background: '#F8F9FA',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    
    // Text colors
    primaryText: '#1C1C1E',
    secondaryText: '#8E8E93',
    tertiaryText: '#C7C7CC',
    
    // Brand colors
    primary: '#007AFF',
    secondary: '#5856D6',
    accent: '#FF6B35',
    
    // Status colors
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    
    // Border colors
    border: '#E5E5EA',
    separator: '#F1F1F1',
    
    // Shadow
    shadow: 'rgba(0, 0, 0, 0.08)',
    
    // Special colors
    avatarBackground: '#E7F0FF',
    roleBadgeUser: '#E7F0FF',
    roleBadgeAdmin: '#FFF1EB',
    roleBadgeUserBorder: '#007AFF',
    roleBadgeAdminBorder: '#FF6B35',
    roleBadgeUserText: '#007AFF',
    roleBadgeAdminText: '#FF6B35',
    
    // Input colors
    inputBackground: '#F2F2F7',
    inputBorder: '#E5E5EA',
    placeholderText: '#8E8E93',
  };

  const darkTheme = {
    // Background colors
    background: '#000000',
    surface: '#1C1C1E',
    card: '#2C2C2E',
    
    // Text colors
    primaryText: '#FFFFFF',
    secondaryText: '#EBEBF5',
    tertiaryText: '#8E8E93',
    
    // Brand colors
    primary: '#0A84FF',
    secondary: '#5E5CE6',
    accent: '#FF6B35',
    
    // Status colors
    success: '#30D158',
    warning: '#FF9F0A',
    error: '#FF453A',
    
    // Border colors
    border: '#38383A',
    separator: '#38383A',
    
    // Shadow
    shadow: 'rgba(0, 0, 0, 0.3)',
    
    // Special colors
    avatarBackground: '#0A84FF',
    roleBadgeUser: '#0A84FF',
    roleBadgeAdmin: '#FF6B35',
    roleBadgeUserBorder: '#0A84FF',
    roleBadgeAdminBorder: '#FF6B35',
    roleBadgeUserText: '#FFFFFF',
    roleBadgeAdminText: '#FFFFFF',
    
    // Input colors
    inputBackground: '#1C1C1E',
    inputBorder: '#38383A',
    placeholderText: '#8E8E93',
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const value = {
    isDarkMode,
    theme,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

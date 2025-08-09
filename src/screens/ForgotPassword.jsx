import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';

const ForgotPassword = ({ navigation }) => {
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const { resetPassword, generateOTP, verifyOTP, changePasswordForPhone } = useAuth();

  // Firebase Auth REST API key (safe for client usage)
  const FIREBASE_WEB_API_KEY = 'AIzaSyBK1vp_ohqygTWCah2pkz4dH8GJc1IuDY8';

  const checkEmailExists = async (email) => {
    const normalized = (email || '').trim().toLowerCase();
    if (!normalized) return false;
    try {
      const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=${FIREBASE_WEB_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: normalized,
            continueUri: 'https://example.com',
          }),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        const msg = json?.error?.message || '';
        if (msg.includes('INVALID_EMAIL') || msg.includes('MISSING_EMAIL')) {
          return false;
        }
        return false;
      }
      return Boolean(json?.registered);
    } catch (err) {
      console.warn('checkEmailExists error:', err?.message || err);
      return false;
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const cleanPhone = (phone || '').replace(/\D/g, '');
    return cleanPhone.length >= 10;
  };

  const getInputType = (input) => {
    const trimmed = (input || '').trim();
    if (trimmed.length === 0) return 'email';
    const digitsOnly = trimmed.replace(/\D/g, '');
    if (validatePhone(trimmed) && digitsOnly.length >= 10) return 'phone';
    if (validateEmail(trimmed)) return 'email';
    return 'email';
  };

  const getInputIcon = () => {
    const inputType = getInputType(identifier);
    switch (inputType) {
      case 'email':
        return 'mail-outline';
      case 'phone':
        return 'call-outline';
      default:
        return 'person-outline';
    }
  };

  const getInputPlaceholder = () => {
    const inputType = getInputType(identifier);
    switch (inputType) {
      case 'email':
        return 'Enter your email address';
      case 'phone':
        return 'Enter your phone number';
      default:
        return 'Enter your email or phone number';
    }
  };

  const getKeyboardType = () => {
    const inputType = getInputType(identifier);
    switch (inputType) {
      case 'email':
        return 'email-address';
      case 'phone':
        // Do not switch to numeric keypad for phone input
        return 'default';
      default:
        return 'default';
    }
  };

  const getResetMessage = () => {
    const inputType = getInputType(identifier);
    switch (inputType) {
      case 'email':
        return 'We\'ve sent a password reset link to your email address. Please check your inbox and follow the instructions.';
      case 'phone':
        return 'A password reset link has been sent to the email associated with your phone number. Please check your inbox to proceed.';
      default:
        return 'We\'ve sent a password reset link to your account. Please check your inbox or messages and follow the instructions.';
    }
  };

  const handleIdentifierChange = (value) => {
    const digitsOnly = (value || '').replace(/\D/g, '');
    if (digitsOnly.length >= 10) {
      setIdentifier(digitsOnly.slice(0, 11));
    } else {
      setIdentifier(value);
      setOtp('');
      setOtpSent(false);
    }
  };

  const handleSendOTP = async () => {
    if (!identifier) {
      Alert.alert('Error', 'Please enter your phone number first');
      return;
    }
    setOtpLoading(true);
    try {
      const result = await generateOTP(identifier);
      if (result.success) {
        Alert.alert(
          'OTP Sent',
          `Your OTP is: ${result.otp}`,
          [
            {
              text: 'Auto Fill',
              onPress: () => {
                setOtp(result.otp);
                setOtpSent(true);
              },
            },
            { text: 'OK', style: 'cancel' },
          ]
        );
        setOtpSent(true);
      } else {
        Alert.alert('Error', result.error || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!identifier) {
      Alert.alert('Error', 'Please enter your email address or phone number');
      return;
    }

    const inputType = getInputType(identifier);

    setIsLoading(true);
    try {
      if (inputType === 'email') {
        const normalized = (identifier || '').trim().toLowerCase();
        const result = await resetPassword(normalized, 'email');
        if (result.success) {
          Alert.alert('Reset Link Sent', getResetMessage(), [
            { text: 'OK', onPress: () => navigation.navigate('Login') },
          ]);
        } else {
          Alert.alert('Error', result.error || 'Failed to send reset link. Please try again.');
        }
      } else {
        // Phone number flow
        if (!otpVerified) {
          // Step 1: Verify OTP
          if (!otp.trim()) {
            Alert.alert('Error', 'Please enter the OTP sent to your phone');
            setIsLoading(false);
            return;
          }
          const verifyResult = await verifyOTP(identifier, otp);
          if (verifyResult.success) {
            setOtpVerified(true);
            Alert.alert('Success', 'OTP verified. Please enter your new password.');
          } else {
            Alert.alert('Error', verifyResult.error || 'Invalid OTP. Please try again.');
          }
        } else {
          // Step 2: Change Password
          if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters long.');
            setIsLoading(false);
            return;
          }
          const result = await changePasswordForPhone(identifier, newPassword, otp);
          if (result.success) {
            Alert.alert('Success', 'Password changed successfully.', [
              { text: 'OK', onPress: () => navigation.navigate('Login') },
            ]);
          } else {
            Alert.alert('Error', result.error || 'Failed to change password.');
          }
        }
      }
    } catch (error) {
      const code = (error?.code || '').toString();
      let message = 'Failed to send reset link. Please try again.';
      if (
        code.includes('auth/invalid-email') ||
        code.includes('auth/user-not-found') ||
        code.includes('auth/missing-email')
      ) {
        message = 'Please enter a valid email registered with your account.';
      }
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            disabled={isLoading}
          >
            <Icon name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <View style={styles.header}>
            <Icon name="lock-open" size={80} color="#007AFF" />
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Don't worry! It happens. Please enter the email address or phone number associated with your account.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Icon name={getInputIcon()} size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={getInputPlaceholder()}
                placeholderTextColor="#999"
                value={identifier}
                onChangeText={handleIdentifierChange}
                keyboardType={getKeyboardType()}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
              />
            </View>

            {getInputType(identifier) === 'phone' && (
              <View style={styles.otpContainer}>
                <View style={styles.otpInputContainer}>
                  <Icon name="key-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.otpInput}
                    placeholder="Enter OTP"
                    placeholderTextColor="#999"
                    value={otp}
                    onChangeText={(value) => {
                      setOtp(value);
                      // Auto-reveal new password field when OTP reaches 6 digits
                      if ((value || '').trim().length >= 6) {
                        // no-op: visibility is computed below but this ensures immediate state update
                      }
                    }}
                    secureTextEntry={!showOtp}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    onPress={() => setShowOtp(!showOtp)}
                    style={styles.eyeIcon}
                    disabled={isLoading}
                  >
                    <Icon
                      name={showOtp ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.sendOtpButton, otpLoading && styles.sendOtpButtonDisabled]}
                  onPress={handleSendOTP}
                  disabled={otpLoading}
                >
                  <Text style={styles.sendOtpButtonText}>
                    {otpLoading ? 'Sending...' : 'Send OTP'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {getInputType(identifier) === 'phone' && otpVerified && (
              <View style={styles.inputContainer}>
                <Icon name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter new password"
                  placeholderTextColor="#999"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeIcon}
                  disabled={isLoading}
                >
                  <Icon
                    name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              <Text style={styles.resetButtonText}>
                {isLoading
                  ? 'Processing...'
                  : getInputType(identifier) === 'phone'
                    ? otpVerified ? 'Change Password' : 'Verify OTP'
                    : 'Send Reset Link'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.helpContainer}>
            <Text style={styles.helpText}>
              Remember your password?{' '}
              <Text
                style={styles.linkText}
                onPress={() => navigation.navigate('Login')}
              >
                Sign in here
              </Text>
            </Text>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoBox}>
              <Icon name="information-circle-outline" size={20} color="#007AFF" />
              <Text style={styles.infoText}>
                We'll send you a link to reset your password. The link will expire in 1 hour.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 45,
    left: 20,
    zIndex: 10,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
    flexWrap: 'wrap',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  formContainer: {
    marginBottom: 30,
  },
  inputContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  resetButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  resetButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  helpContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  helpText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  infoContainer: {
    marginTop: 20,
  },
  infoBox: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 12,
    lineHeight: 20,
  },
  otpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  otpInputContainer: {
    flex: 0.7,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  otpInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  sendOtpButton: {
    flex: 0.3,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sendOtpButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default ForgotPassword; 
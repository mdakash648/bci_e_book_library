import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';

const Login = ({ navigation }) => {
  const { login, generateOTP } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [authMethod, setAuthMethod] = useState('password'); // 'password' or 'otp'

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  };

  const getInputType = (value) => {
    const trimmed = (value || '').trim();
    if (trimmed.length === 0) return 'email';
    const firstChar = trimmed.charAt(0);
    if (/[0-9+]/.test(firstChar)) return 'phone';
    if (validatePhone(trimmed)) return 'phone';
    if (validateEmail(trimmed)) return 'email';
    return 'email';
  };

  const getInputIcon = () => {
    const inputType = getInputType(identifier);
    return inputType === 'phone' ? 'call-outline' : 'mail-outline';
  };

  const getInputPlaceholder = () => {
    const inputType = getInputType(identifier);
    return inputType === 'phone' ? 'Phone Number' : 'Email Address';
  };

  const getKeyboardType = () => {
    const inputType = getInputType(identifier);
    return inputType === 'phone' ? 'phone-pad' : 'email-address';
  };

  const handleSendOTP = async () => {
    if (!identifier.trim()) {
      Alert.alert('Error', 'Please enter your phone number first');
      return;
    }

    const inputType = getInputType(identifier);
    if (inputType !== 'phone') {
      Alert.alert('Error', 'Please enter a valid phone number');
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
                setAuthMethod('otp');
                setOtpSent(true);
              },
            },
            { text: 'OK', style: 'cancel' },
          ]
        );
        setOtpSent(true);
        setAuthMethod('otp');
      } else {
        Alert.alert('Error', result.error || 'Failed to send OTP');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!identifier.trim()) {
      Alert.alert('Error', 'Please enter your email or phone number');
      return;
    }

    const inputType = getInputType(identifier);
    
    if (inputType === 'phone') {
      // For phone login, check if user provided OTP or password
      if (otp.trim() && password.trim()) {
        Alert.alert('Error', 'Please use either OTP or password, not both');
        return;
      }
      
      if (!otp.trim() && !password.trim()) {
        Alert.alert('Error', 'Please enter either OTP or password');
        return;
      }

      // Determine auth method based on what user provided
      const method = otp.trim() ? 'otp' : 'password';
      setAuthMethod(method);
    } else {
      // For email login, password is required
      if (!password.trim()) {
        Alert.alert('Error', 'Please enter your password');
        return;
      }
    }

    setIsLoading(true);
    try {
      const result = await login(identifier, password, otp);
      if (result.success) {
        Alert.alert('Success', 'Login successful!');
      } else {
        const friendly = getFriendlyLoginError(result.error);
        Alert.alert('Error', friendly);
      }
    } catch (error) {
      const friendly = getFriendlyLoginError(error?.message);
      Alert.alert('Error', friendly);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIdentifierChange = (value) => {
    const detectedType = getInputType(value);
    if (detectedType === 'phone') {
      const digitsOnly = (value || '').replace(/\D/g, '').slice(0, 11);
      setIdentifier(digitsOnly);
      setAuthMethod('password');
    } else {
      setIdentifier(value);
      setOtp('');
      setOtpSent(false);
      setAuthMethod('password');
    }
  };

  const inputType = getInputType(identifier);

  const getFriendlyLoginError = (errorMsg) => {
    const msg = (errorMsg || '').toLowerCase();
    if (
      msg.includes('invalid-credential') ||
      msg.includes('wrong-password') ||
      msg.includes('user-not-found') ||
      msg.includes('account not found')
    ) {
      return 'Please, Enter correct credential';
    }
    return 'Login failed. Please try again.';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Image
            source={require('../../asset/logo/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        <View style={styles.form}>
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

          {inputType === 'email' && (
            <View style={styles.inputContainer}>
              <Icon name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!isLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                disabled={isLoading}
              >
                <Icon
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          )}

          {inputType === 'phone' && (
            <>
              {/* Password option for phone */}
              <View style={styles.inputContainer}>
                <Icon name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password (optional)"
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    if (value.trim()) {
                      setAuthMethod('password');
                      setOtp('');
                    }
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  disabled={isLoading}
                >
                  <Icon
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              {/* OTP option for phone */}
              <View style={styles.otpContainer}>
                <View style={styles.otpInputContainer}>
                  <Icon name="shield-checkmark-outline" size={20} color="#666" style={styles.otpIcon} />
                  <TextInput
                    style={styles.otpInput}
                    placeholder="OTP (optional)"
                    placeholderTextColor="#999"
                    value={otp}
                    onChangeText={(value) => {
                      setOtp(value);
                      if (value.trim()) {
                        setAuthMethod('otp');
                        setPassword('');
                      }
                    }}
                    keyboardType="number-pad"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
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

              {/* Auth method indicator */}
              <View style={styles.authMethodIndicator}>
                <Text style={styles.authMethodText}>
                  {authMethod === 'otp' ? '🔐 Using OTP Authentication' : 
                   authMethod === 'password' ? '🔑 Using Password Authentication' : 
                   '📱 Choose authentication method'}
                </Text>
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={isLoading}>
            <Text style={styles.signUpText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  form: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 8,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#007AFF',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#666',
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  googleButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    flexWrap: 'wrap',
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  signUpButton: {
    paddingHorizontal: 4,
  },
  signUpText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sendOtpButton: {
    flex: 0.3,
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
  sendOtpButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  sendOtpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
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
  otpIcon: {
    marginRight: 12,
  },
  otpInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  authMethodIndicator: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  authMethodText: {
    fontSize: 14,
    color: '#007AFF',
    textAlign: 'center',
    fontWeight: '500',
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
});

export default Login; 
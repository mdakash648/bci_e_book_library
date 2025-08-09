import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

const ProfileEdit = () => {
  const { user, updateProfile } = useAuth();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState(user?.role || 'user');
  const [secretKey, setSecretKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveChanges = async () => {
    if (password && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (role === 'admin' && !secretKey) {
      Alert.alert('Error', 'Admin secret key is required to become an admin.');
      return;
    }

    setIsLoading(true);
    const updates = {};
    if (name.trim() && name.trim() !== user.name) {
      updates.name = name.trim();
    }
    if (password) {
      updates.password = password;
    }
    if (role !== user.role) {
      updates.role = role;
      if (role === 'admin') {
        updates.secretKey = secretKey;
      }
    }

    if (Object.keys(updates).length === 0) {
      Alert.alert('No Changes', 'There are no changes to save.');
      setIsLoading(false);
      return;
    }

    const result = await updateProfile(updates);
    setIsLoading(false);

    if (result.success) {
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert('Error', result.error || 'Failed to update profile');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.primaryText }]}>Edit Profile</Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Update your account details</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
            <Icon name="person-outline" size={20} color={theme.secondaryText} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.primaryText }]}
              placeholder="Full Name"
              placeholderTextColor={theme.placeholderText}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
            <Icon name="lock-closed-outline" size={20} color={theme.secondaryText} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.primaryText }]}
              placeholder="New Password"
              placeholderTextColor={theme.placeholderText}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Icon name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={24} color={theme.secondaryText} />
            </TouchableOpacity>
          </View>

          <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
            <Icon name="lock-closed-outline" size={20} color={theme.secondaryText} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: theme.primaryText }]}
              placeholder="Confirm New Password"
              placeholderTextColor={theme.placeholderText}
              secureTextEntry={!showPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <View style={[styles.pickerContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
            <Picker
              selectedValue={role}
              onValueChange={(itemValue) => setRole(itemValue)}
              style={[styles.picker, { color: theme.primaryText }]}
              dropdownIconColor={theme.secondaryText}
              mode="dropdown"
            >
              <Picker.Item label="User" value="user" color={theme.primaryText} />
              <Picker.Item label="Admin" value="admin" color={theme.primaryText} />
            </Picker>
          </View>

          {role === 'admin' && (
            <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
              <Icon name="key-outline" size={20} color={theme.secondaryText} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.primaryText }]}
                placeholder="Admin Secret Key"
                placeholderTextColor={theme.placeholderText}
                secureTextEntry={!showSecretKey}
                value={secretKey}
                onChangeText={setSecretKey}
              />
              <TouchableOpacity onPress={() => setShowSecretKey(!showSecretKey)}>
                <Icon name={showSecretKey ? 'eye-off-outline' : 'eye-outline'} size={24} color={theme.secondaryText} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: theme.primary }, isLoading && { backgroundColor: theme.tertiaryText }]}
          onPress={handleSaveChanges}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>{isLoading ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 5,
  },
  formContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
  },
  pickerContainer: {
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
  },
  picker: {
    height: 50,
    width: '100%',
  },
  saveButton: {
    margin: 20,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ProfileEdit;

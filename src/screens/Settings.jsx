import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import firebaseService from '../services/firebaseService';

const Settings = () => {
  const navigation = useNavigation();
  const { logout, user, refreshUserData } = useAuth();
  const [showSecretKeyModal, setShowSecretKeyModal] = useState(false);
  const [showViewKeyModal, setShowViewKeyModal] = useState(false);
  const [newSecretKey, setNewSecretKey] = useState('');
  const [currentSecretKey, setCurrentSecretKey] = useState('');
  const [lastUpdatedBy, setLastUpdatedBy] = useState(null);
  const [showNewSecretKey, setShowNewSecretKey] = useState(false);
  const [showCurrentSecretKey, setShowCurrentSecretKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
          },
        },
      ]
    );
  };

  const loadCurrentAdminKey = async () => {
    try {
      const result = await firebaseService.getAdminSecretKey();
      if (result.success) {
        setCurrentSecretKey(result.secretKey);
        // Get additional info about who last updated the key
        const adminDoc = await firebaseService.getAdminKeyInfo();
        if (adminDoc.success && adminDoc.data.lastUpdatedBy) {
          setLastUpdatedBy(adminDoc.data.lastUpdatedBy);
        }
      }
    } catch (error) {
      console.error('Error loading admin key:', error);
    }
  };

  const handleViewSecretKey = async () => {
    await loadCurrentAdminKey();
    setShowViewKeyModal(true);
  };

  const handleUpdateSecretKey = async () => {
    if (!newSecretKey) {
      Alert.alert('Error', 'Please enter the new secret key');
      return;
    }

    if (newSecretKey.length < 6) {
      Alert.alert('Error', 'Secret key must be at least 6 characters long');
      return;
    }

    setIsLoading(true);
    try {
      const result = await firebaseService.updateAdminSecretKey(user?.id, newSecretKey);
      if (result.success) {
        Alert.alert('Success', 'Admin secret key updated successfully!');
        setShowSecretKeyModal(false);
        setNewSecretKey('');
        await loadCurrentAdminKey(); // Refresh the current key
      } else {
        Alert.alert('Error', result.error || 'Failed to update secret key');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToDefault = async () => {
    Alert.alert(
      'Reset Admin Key',
      'This will reset the admin key to the default value (admin123456). Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              const result = await firebaseService.setAdminSecretKey('admin123456');
              if (result.success) {
                Alert.alert('Success', 'Admin key reset to default value');
                await loadCurrentAdminKey();
                setShowViewKeyModal(false);
              } else {
                Alert.alert('Error', 'Failed to reset admin key');
              }
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRefreshUserData = async () => {
    setRefreshing(true);
    try {
      const result = await refreshUserData();
      if (result.success) {
        Alert.alert('Success', 'User data refreshed successfully');
      } else {
        Alert.alert('Error', 'Failed to refresh user data');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setRefreshing(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customize your experience</Text>
        {user && (
          <View style={styles.userInfoContainer}>
            <Text style={styles.userInfo}>
              Logged in as: {
                user?.identifier ||
                user?.phoneNumber ||
                (user?.email?.endsWith('@temp.com')
                  ? user.email.replace('@temp.com', '')
                  : user?.email)
              }
            </Text>
            <View style={styles.roleContainer}>
              <Text style={[styles.roleText, { color: user.role === 'admin' ? '#FF6B35' : '#007AFF' }]}>
                Role: {user.role?.toUpperCase() || 'USER'}
              </Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={handleRefreshUserData}
                disabled={refreshing}
              >
                <Icon 
                  name="refresh" 
                  size={16} 
                  color="#007AFF" 
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
      
      {/* About */}
      <View>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Version</Text>
          <Text style={styles.settingValue}>1.0.0</Text>
        </TouchableOpacity>
      </View>

      {/* Account */}
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.settingItem} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.settingText}>Profile</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Change Password</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Privacy</Text>
            <Text style={styles.settingArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Admin Settings */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Admin Settings</Text>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handleViewSecretKey}
            >
              <Icon name="eye-outline" size={20} color="#007AFF" style={styles.settingIcon} />
              <Text style={styles.settingText}>View Current Secret Key</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => setShowSecretKeyModal(true)}
            >
              <Icon name="key-outline" size={20} color="#007AFF" style={styles.settingIcon} />
              <Text style={styles.settingText}>Update Admin Secret Key</Text>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Actions</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="log-out-outline" size={20} color="#FF3B30" style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* View Secret Key Modal */}
      <Modal
        visible={showViewKeyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowViewKeyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Current Admin Secret Key</Text>
              <TouchableOpacity
                onPress={() => setShowViewKeyModal(false)}
                disabled={isLoading}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                This is the current secret key used for admin registration.
              </Text>

              <View style={styles.keyDisplayContainer}>
                <Text style={styles.keyLabel}>Secret Key:</Text>
                <View style={styles.keyValueContainer}>
                  <Text style={styles.keyValue}>
                    {showCurrentSecretKey ? currentSecretKey : '••••••••••••••••'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowCurrentSecretKey(!showCurrentSecretKey)}
                    style={styles.eyeIcon}
                  >
                    <Icon
                      name={showCurrentSecretKey ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {lastUpdatedBy && (
                <View style={styles.lastUpdatedContainer}>
                  <Text style={styles.lastUpdatedLabel}>Last Updated By:</Text>
                  <Text style={styles.lastUpdatedName}>{lastUpdatedBy.name}</Text>
                  <Text style={styles.lastUpdatedEmail}>{lastUpdatedBy.email}</Text>
                </View>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleResetToDefault}
                  disabled={isLoading}
                >
                  <Text style={styles.resetButtonText}>
                    {isLoading ? 'Resetting...' : 'Reset to Default'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowViewKeyModal(false)}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Update Secret Key Modal */}
      <Modal
        visible={showSecretKeyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSecretKeyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Update Admin Secret Key</Text>
              <TouchableOpacity
                onPress={() => setShowSecretKeyModal(false)}
                disabled={isLoading}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalSubtitle}>
                Enter a new secret key for admin registration. The key must be at least 6 characters long.
              </Text>

              <View style={styles.inputContainer}>
                <Icon name="key-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="New Secret Key"
                  value={newSecretKey}
                  onChangeText={setNewSecretKey}
                  secureTextEntry={!showNewSecretKey}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowNewSecretKey(!showNewSecretKey)}
                  style={styles.eyeIcon}
                  disabled={isLoading}
                >
                  <Icon
                    name={showNewSecretKey ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowSecretKeyModal(false)}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.updateButton, isLoading && styles.updateButtonDisabled]}
                  onPress={handleUpdateSecretKey}
                  disabled={isLoading}
                >
                  <Text style={styles.updateButtonText}>
                    {isLoading ? 'Updating...' : 'Update'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  userInfo: {
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  userInfoContainer: {
    marginTop: 10,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  refreshButton: {
    padding: 5,
    marginLeft: 10,
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginLeft: 20,
  },
  settingItem: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  settingValue: {
    fontSize: 16,
    color: '#666',
  },
  settingArrow: {
    fontSize: 18,
    color: '#ccc',
  },
  logoutButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logoutIcon: {
    marginRight: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  keyDisplayContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  keyLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  keyValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  keyValue: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#333',
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  updateButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginLeft: 10,
  },
  updateButtonDisabled: {
    backgroundColor: '#ccc',
  },
  updateButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 10,
  },
  resetButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  lastUpdatedContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  lastUpdatedLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  lastUpdatedName: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 2,
  },
  lastUpdatedEmail: {
    fontSize: 14,
    color: '#666',
  },
});

export default Settings; 
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
  Switch,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import firebaseService from '../services/firebaseService';

const Settings = () => {
  const navigation = useNavigation();
  const { logout, user, refreshUserData } = useAuth();
  const { theme, isDarkMode, toggleTheme } = useTheme();
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
        // Debug: Log user data to console
        console.log('Updated user data:', result.user);
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

  const getDisplayIdentifier = () => {
    // For Google Sign-In users, show their email
    if (user?.inputType === 'google' || user?.photoURL) {
      return user?.email || user?.identifier;
    }
    
    return (
      user?.identifier ||
      user?.phoneNumber ||
      (user?.email?.endsWith('@temp.com') ? user.email.replace('@temp.com', '') : user?.email)
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.primaryText }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>Customize your experience</Text>

        {user && (
          <View style={[styles.profileCard, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            {user?.photoURL ? (
              <Image 
                source={{ uri: user.photoURL }} 
                style={styles.avatarImage}
                defaultSource={require('../../asset/logo/logo.png')}
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: theme.avatarBackground }]}>
                <Text style={[styles.avatarText, { color: theme.primary }]}>
                  {(user?.name || user?.displayName || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.primaryText }]}>
                {user?.name || user?.displayName || 'User'}
              </Text>
              <Text style={[styles.profileId, { color: theme.secondaryText }]}>{getDisplayIdentifier()}</Text>
              <View style={[
                styles.roleBadge, 
                { 
                  backgroundColor: isAdmin ? theme.roleBadgeAdmin : theme.roleBadgeUser, 
                  borderColor: isAdmin ? theme.roleBadgeAdminBorder : theme.roleBadgeUserBorder 
                }
              ]}>
                <Text style={[
                  styles.roleBadgeText, 
                  { color: isAdmin ? theme.roleBadgeAdminText : theme.roleBadgeUserText }
                ]}>
                  {isAdmin ? 'ADMIN' : 'USER'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={[styles.quickAction, { backgroundColor: theme.card, shadowColor: theme.shadow }]} onPress={() => navigation.navigate('Profile')}>
          <Icon name="person-circle-outline" size={22} color={theme.primary} />
          <Text style={[styles.quickActionText, { color: theme.primaryText }]}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickAction, { backgroundColor: theme.card, shadowColor: theme.shadow }]} onPress={() => navigation.navigate('Privacy')}>
          <Icon name="lock-closed-outline" size={22} color={theme.primary} />
          <Text style={[styles.quickActionText, { color: theme.primaryText }]}>Privacy</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickAction, { backgroundColor: theme.card, shadowColor: theme.shadow }]} onPress={handleLogout}>
          <Icon name="log-out-outline" size={22} color={theme.error} />
          <Text style={[styles.quickActionText, { color: theme.error }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Appearance */}
        <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
          <Text style={[styles.cardTitle, { color: theme.primaryText }]}>Appearance</Text>
          <View style={[styles.rowItem, { borderTopColor: theme.separator }]}>
            <View style={styles.rowLeft}>
              <Icon name={isDarkMode ? "moon" : "sunny"} size={20} color={theme.primary} style={styles.rowIcon} />
              <Text style={[styles.rowText, { color: theme.primaryText }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ false: theme.separator, true: theme.primary }}
              thumbColor={isDarkMode ? theme.surface : theme.surface}
              ios_backgroundColor={theme.separator}
            />
          </View>
        </View>

        {/* Account */}
        <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
          <Text style={[styles.cardTitle, { color: theme.primaryText }]}>Account</Text>
          <TouchableOpacity style={[styles.rowItem, { borderTopColor: theme.separator }]} onPress={() => navigation.navigate('Profile')}>
            <View style={styles.rowLeft}>
              <Icon name="id-card-outline" size={20} color={theme.primary} style={styles.rowIcon} />
              <Text style={[styles.rowText, { color: theme.primaryText }]}>Profile</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={theme.tertiaryText} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.rowItem, { borderTopColor: theme.separator }]} onPress={() => navigation.navigate('Privacy')}>
            <View style={styles.rowLeft}>
              <Icon name="shield-checkmark-outline" size={20} color={theme.primary} style={styles.rowIcon} />
              <Text style={[styles.rowText, { color: theme.primaryText }]}>Privacy</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={theme.tertiaryText} />
          </TouchableOpacity>
        </View>

        {/* Admin Settings */}
        {isAdmin && (
          <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            <Text style={[styles.cardTitle, { color: theme.primaryText }]}>Admin Settings</Text>
            <TouchableOpacity style={[styles.rowItem, { borderTopColor: theme.separator }]} onPress={handleViewSecretKey}>
              <View style={styles.rowLeft}>
                <Icon name="eye-outline" size={20} color={theme.accent} style={styles.rowIcon} />
                <Text style={[styles.rowText, { color: theme.primaryText }]}>View Current Secret Key</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={theme.tertiaryText} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.rowItem, { borderTopColor: theme.separator }]} onPress={() => setShowSecretKeyModal(true)}>
              <View style={styles.rowLeft}>
                <Icon name="key-outline" size={20} color={theme.accent} style={styles.rowIcon} />
                <Text style={[styles.rowText, { color: theme.primaryText }]}>Update Admin Secret Key</Text>
              </View>
              <Icon name="chevron-forward" size={20} color={theme.tertiaryText} />
            </TouchableOpacity>
          </View>
        )}

        {/* About */}
        <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
          <Text style={[styles.cardTitle, { color: theme.primaryText }]}>About</Text>
          <View style={[styles.rowItem, { borderTopColor: theme.separator }]}>
            <View style={styles.rowLeft}>
              <Icon name="information-circle-outline" size={20} color={theme.primary} style={styles.rowIcon} />
              <Text style={[styles.rowText, { color: theme.primaryText }]}>Version</Text>
            </View>
            <Text style={[styles.versionText, { color: theme.secondaryText }]}>1.0.0</Text>
          </View>
        </View>

        {/* Debug Section - Only show in development */}
        {__DEV__ && (
          <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
            <Text style={[styles.cardTitle, { color: theme.primaryText }]}>Debug Info</Text>
            <TouchableOpacity style={[styles.rowItem, { borderTopColor: theme.separator }]} onPress={handleRefreshUserData}>
              <View style={styles.rowLeft}>
                <Icon name="refresh-outline" size={20} color={theme.primary} style={styles.rowIcon} />
                <Text style={[styles.rowText, { color: theme.primaryText }]}>
                  {refreshing ? 'Refreshing...' : 'Refresh User Data'}
                </Text>
              </View>
              <Icon name="chevron-forward" size={20} color={theme.tertiaryText} />
            </TouchableOpacity>
            <View style={[styles.rowItem, { borderTopColor: theme.separator }]}>
              <View style={styles.rowLeft}>
                <Icon name="bug-outline" size={20} color={theme.primary} style={styles.rowIcon} />
                <Text style={[styles.rowText, { color: theme.primaryText }]}>User Type</Text>
              </View>
              <Text style={[styles.versionText, { color: theme.secondaryText }]}>
                {user?.inputType || 'unknown'}
              </Text>
            </View>
            <View style={[styles.rowItem, { borderTopColor: theme.separator }]}>
              <View style={styles.rowLeft}>
                <Icon name="image-outline" size={20} color={theme.primary} style={styles.rowIcon} />
                <Text style={[styles.rowText, { color: theme.primaryText }]}>Has Photo</Text>
              </View>
              <Text style={[styles.versionText, { color: theme.secondaryText }]}>
                {user?.photoURL ? 'Yes' : 'No'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* View Secret Key Modal */}
      <Modal
        visible={showViewKeyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowViewKeyModal(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.primaryText }]}>Current Admin Secret Key</Text>
              <TouchableOpacity
                onPress={() => setShowViewKeyModal(false)}
                disabled={isLoading}
              >
                <Icon name="close" size={24} color={theme.secondaryText} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalSubtitle, { color: theme.secondaryText }]}>
                This is the current secret key used for admin registration.
              </Text>

              <View style={[styles.keyDisplayContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                <Text style={[styles.keyLabel, { color: theme.primaryText }]}>Secret Key:</Text>
                <View style={styles.keyValueContainer}>
                  <Text style={[styles.keyValue, { color: theme.primaryText }]}>
                    {showCurrentSecretKey ? currentSecretKey : '••••••••••••••••'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowCurrentSecretKey(!showCurrentSecretKey)}
                    style={styles.eyeIcon}
                  >
                    <Icon
                      name={showCurrentSecretKey ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={theme.secondaryText}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {lastUpdatedBy && (
                <View style={[styles.lastUpdatedContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                  <Text style={[styles.lastUpdatedLabel, { color: theme.primaryText }]}>Last Updated By:</Text>
                  <Text style={[styles.lastUpdatedName, { color: theme.primary }]}>{lastUpdatedBy.name}</Text>
                  <Text style={[styles.lastUpdatedEmail, { color: theme.secondaryText }]}>{lastUpdatedBy.email}</Text>
                </View>
              )}

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.resetButton, { backgroundColor: theme.error }]}
                  onPress={handleResetToDefault}
                  disabled={isLoading}
                >
                  <Text style={styles.resetButtonText}>
                    {isLoading ? 'Resetting...' : 'Reset to Default'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}
                  onPress={() => setShowViewKeyModal(false)}
                  disabled={isLoading}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.secondaryText }]}>Close</Text>
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
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.primaryText }]}>Update Admin Secret Key</Text>
              <TouchableOpacity
                onPress={() => setShowSecretKeyModal(false)}
                disabled={isLoading}
              >
                <Icon name="close" size={24} color={theme.secondaryText} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalSubtitle, { color: theme.secondaryText }]}>
                Enter a new secret key for admin registration. The key must be at least 6 characters long.
              </Text>

              <View style={[styles.inputContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                <Icon name="key-outline" size={20} color={theme.secondaryText} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.primaryText }]}
                  placeholder="New Secret Key"
                  placeholderTextColor={theme.placeholderText}
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
                    color={theme.secondaryText}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}
                  onPress={() => setShowSecretKeyModal(false)}
                  disabled={isLoading}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.secondaryText }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.updateButton, { backgroundColor: theme.primary }, isLoading && { backgroundColor: theme.tertiaryText }]}
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
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 10,
  },
  profileCard: {
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 14,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
  },
  profileId: {
    fontSize: 13,
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  quickAction: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    elevation: 1,
  },
  quickActionText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  card: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    paddingVertical: 8,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  rowItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowIcon: {
    marginRight: 12,
  },
  rowText: {
    fontSize: 15,
  },
  versionText: {
    fontSize: 14,
  },
  // Legacy styles kept for modals & forms
  userInfo: {
    fontSize: 14,
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
  section: {
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 20,
  },
  settingItem: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    flex: 1,
  },
  settingValue: {
    fontSize: 16,
  },
  settingArrow: {
    fontSize: 18,
  },
  logoutButton: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  logoutIcon: {
    marginRight: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  keyDisplayContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  keyLabel: {
    fontSize: 14,
    fontWeight: 'bold',
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
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
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
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  updateButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginLeft: 10,
  },
  updateButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  resetButton: {
    flex: 1,
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
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
  },
  lastUpdatedLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lastUpdatedName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  lastUpdatedEmail: {
    fontSize: 14,
  },
});

export default Settings; 
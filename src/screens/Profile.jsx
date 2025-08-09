import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import Icon from 'react-native-vector-icons/Ionicons';

const Profile = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const { theme } = useTheme();

  const getIdentifier = () => {
    if (user?.inputType === 'phone') {
      return user.phoneNumber;
    }
    return user?.email?.endsWith('@temp.com') ? user.email.replace('@temp.com', '') : user?.email;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.primaryText }]}>My Profile</Text>
        <Text style={[styles.subtitle, { color: theme.secondaryText }]}>View and manage your account details</Text>
      </View>

      <View style={[styles.profileContainer, { backgroundColor: theme.card, shadowColor: theme.shadow }]}>
        <View style={styles.infoRow}>
          <Icon name="person-circle-outline" size={24} color={theme.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.label, { color: theme.secondaryText }]}>Name</Text>
            <Text style={[styles.value, { color: theme.primaryText }]}>{user?.name || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Icon name="mail-outline" size={24} color={theme.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.label, { color: theme.secondaryText }]}>{user?.inputType === 'phone' ? 'Phone Number' : 'Email'}</Text>
            <Text style={[styles.value, { color: theme.primaryText }]}>{getIdentifier() || 'N/A'}</Text>
          </View>
        </View>
        
        <View style={styles.infoRow}>
          <Icon name="shield-checkmark-outline" size={24} color={theme.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={[styles.label, { color: theme.secondaryText }]}>Role</Text>
            <Text style={[styles.value, { color: theme.primaryText }]}>{user?.role?.toUpperCase() || 'USER'}</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.editButton, { backgroundColor: theme.primary }]}
        onPress={() => navigation.navigate('ProfileEdit')}
      >
        <Icon name="create-outline" size={20} color="#fff" />
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
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
  },
  subtitle: {
    fontSize: 16,
    marginTop: 5,
  },
  profileContainer: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },
  infoTextContainer: {
    marginLeft: 15,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 18,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    paddingVertical: 15,
    borderRadius: 12,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default Profile;

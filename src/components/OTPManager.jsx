import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';

const OTPManager = () => {
  const [otpList, setOtpList] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadOTPs = async () => {
    setLoading(true);
    try {
      const snapshot = await firestore().collection('otp_codes').get();
      const otps = [];
      snapshot.forEach(doc => {
        otps.push({
          id: doc.id,
          ...doc.data(),
        });
      });
      setOtpList(otps);
    } catch (error) {
      Alert.alert('Error', 'Failed to load OTPs');
    } finally {
      setLoading(false);
    }
  };

  const clearExpiredOTPs = async () => {
    setLoading(true);
    try {
      const snapshot = await firestore().collection('otp_codes').get();
      const now = new Date();
      let clearedCount = 0;

      snapshot.forEach(async (doc) => {
        const data = doc.data();
        if (data.expiresAt && data.expiresAt.toDate() < now) {
          await doc.ref.delete();
          clearedCount++;
        }
      });

      Alert.alert('Success', `Cleared ${clearedCount} expired OTPs`);
      loadOTPs();
    } catch (error) {
      Alert.alert('Error', 'Failed to clear expired OTPs');
    } finally {
      setLoading(false);
    }
  };

  const clearAllOTPs = async () => {
    Alert.alert(
      'Clear All OTPs',
      'Are you sure you want to clear all OTPs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const snapshot = await firestore().collection('otp_codes').get();
              snapshot.forEach(async (doc) => {
                await doc.ref.delete();
              });
              Alert.alert('Success', 'All OTPs cleared');
              loadOTPs();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear OTPs');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    loadOTPs();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>OTP Manager</Text>
      <Text style={styles.subtitle}>Development tool for managing OTP codes</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={loadOTPs}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Loading...' : 'Refresh OTPs'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.clearButton, loading && styles.buttonDisabled]}
          onPress={clearExpiredOTPs}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Clearing...' : 'Clear Expired'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.clearAllButton, loading && styles.buttonDisabled]}
          onPress={clearAllOTPs}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Clearing...' : 'Clear All'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.otpList}>
        <Text style={styles.listTitle}>Active OTPs ({otpList.length})</Text>
        {otpList.map((otp, index) => (
          <View key={otp.id} style={styles.otpItem}>
            <Text style={styles.otpPhone}>{otp.phoneNumber}</Text>
            <Text style={styles.otpCode}>OTP: {otp.otp}</Text>
            <Text style={styles.otpStatus}>
              Status: {otp.used ? 'Used' : 'Active'}
            </Text>
            <Text style={styles.otpExpiry}>
              Expires: {otp.expiresAt ? otp.expiresAt.toDate().toLocaleString() : 'Unknown'}
            </Text>
          </View>
        ))}
        {otpList.length === 0 && (
          <Text style={styles.noOtpText}>No active OTPs found</Text>
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>OTP System Info:</Text>
        <Text style={styles.infoText}>
          • OTPs are stored in Firestore{'\n'}
          • 6-digit codes with 10-minute expiry{'\n'}
          • Used for phone number verification{'\n'}
          • Works with Firebase free plan{'\n'}
          • In production, send via SMS service
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  clearButton: {
    backgroundColor: '#FF9500',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  clearAllButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonDisabled: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  otpList: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  otpItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  otpPhone: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  otpCode: {
    fontSize: 14,
    color: '#007AFF',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  otpStatus: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  otpExpiry: {
    fontSize: 12,
    color: '#666',
  },
  noOtpText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 15,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
  },
});

export default OTPManager;

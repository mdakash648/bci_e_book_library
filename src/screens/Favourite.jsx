import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

const Favourite = () => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Favourites</Text>
        <Text style={styles.subtitle}>Your saved books</Text>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.bookItem}>
          <Text style={styles.bookTitle}>The Great Gatsby</Text>
          <Text style={styles.bookAuthor}>F. Scott Fitzgerald</Text>
        </View>
        <View style={styles.bookItem}>
          <Text style={styles.bookTitle}>To Kill a Mockingbird</Text>
          <Text style={styles.bookAuthor}>Harper Lee</Text>
        </View>
        <View style={styles.bookItem}>
          <Text style={styles.bookTitle}>1984</Text>
          <Text style={styles.bookAuthor}>George Orwell</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No favourite books yet</Text>
          <Text style={styles.emptySubtext}>Start adding books to your favourites</Text>
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
  },
  content: {
    flex: 1,
    padding: 20,
  },
  bookItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bookTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
});

export default Favourite; 
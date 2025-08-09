import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const Section = ({ title, children }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>{title}</Text>
      <Text style={[styles.sectionBody, { color: theme.secondaryText }]}>{children}</Text>
    </View>
  );
};

const Privacy = () => {
  const { theme } = useTheme();
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.primaryText }]}>Privacy Policy</Text>
          <Text style={[styles.subtitle, { color: theme.secondaryText }]}>How we collect, use, and protect your information</Text>
        </View>

        <View style={styles.content}>
          <Section title="Information We Collect">
            We collect the information you provide when you create an account such as your name, email or phone
            number, and your app activity like saved favourites. We do not collect unnecessary personal
            information.
          </Section>

          <Section title="How We Use Your Information">
            We use your information to create and manage your account, authenticate your access, sync your data
            across devices, send important service updates, and improve the app experience.
          </Section>

          <Section title="Data Storage and Security">
            Your data is stored securely using Firebase services. We apply industry-standard security measures and
            restrict access to authorized personnel only. Despite our best efforts, no method of transmission or
            storage is 99% secure.
          </Section>

          <Section title="Third-Party Services">
            We use trusted third-party services (e.g., Firebase) for authentication and data storage. These
            providers process data on our behalf in accordance with their own privacy policies.
          </Section>

          <Section title="Your Choices and Rights">
            You can update your profile details, request a password reset, and sign out at any time. You may also
            contact us to request deletion of your account and related data, subject to legal obligations.
          </Section>

          <Section title="Children's Privacy">
            Our app is intended for users aged 13 and above. We do not knowingly collect information from children
            under 13. If you believe a child has provided us information, please contact us and we will remove it.
          </Section>

          <Section title="Changes to This Policy">
            We may update this policy to reflect changes in our practices or legal requirements. We will notify you
            of significant changes within the app.
          </Section>

          <Section title="Contact Us">
            If you have questions about privacy or this policy, please contact our support team via the details
            provided in the app store listing.
          </Section>
        </View>
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
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionBody: {
    fontSize: 15,
    lineHeight: 22,
  },
});

export default Privacy;

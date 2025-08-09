import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Firebase is automatically initialized in React Native Firebase
// The configuration is read from google-services.json (Android) and GoogleService-Info.plist (iOS)
console.log('Firebase initialized with project:', auth().app.options.projectId);

export { auth, firestore };

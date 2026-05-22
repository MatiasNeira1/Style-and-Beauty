import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyPlaceholder',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'stylebeauty-test.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'stylebeauty-test',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'stylebeauty-test.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789012:web:abc123def456'
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

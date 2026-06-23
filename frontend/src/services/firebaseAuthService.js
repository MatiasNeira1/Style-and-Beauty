import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getIdToken,
  getIdTokenResult,
  reauthenticateWithCredential,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
} from 'firebase/auth';
import { firebaseAuth } from './firebaseClient.js';

// Configurar idioma en español para correos y plantillas de Firebase
firebaseAuth.languageCode = 'es';

function toSession(firebaseUser, tokenResult) {
  const rol = tokenResult.claims?.rol || tokenResult.claims?.role || null;
  const normalizedRole = rol ? String(rol).toUpperCase() : null;

  return {
    user: {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      emailVerified: firebaseUser.emailVerified,
      rol: normalizedRole,
      role: normalizedRole ? normalizedRole.toLowerCase() : null,
    },
    token: tokenResult.token,
    claims: tokenResult.claims || {},
  };
}

export const firebaseAuthService = {
  async login(email, password) {
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    const tokenResult = await getIdTokenResult(credential.user, true);
    return toSession(credential.user, tokenResult);
  },

  async register(email, password) {
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    const token = await getIdToken(credential.user, true);
    return {
      user: {
        uid: credential.user.uid,
        email: credential.user.email,
        emailVerified: credential.user.emailVerified,
        rol: 'CLIENTE',
        role: 'cliente',
      },
      token,
    };
  },

  async refreshSession(firebaseUser = firebaseAuth.currentUser) {
    if (!firebaseUser) return null;
    const tokenResult = await getIdTokenResult(firebaseUser, true);
    return toSession(firebaseUser, tokenResult);
  },

  async resetPassword(email) {
    await sendPasswordResetEmail(firebaseAuth, email);
  },

  async changePassword(currentPassword, newPassword) {
    const currentUser = firebaseAuth.currentUser;
    if (!currentUser?.email) {
      const error = new Error('La sesion expiro.');
      error.code = 'auth/requires-recent-login';
      throw error;
    }

    const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
    await reauthenticateWithCredential(currentUser, credential);
    await updatePassword(currentUser, newPassword);
  },

  logout() {
    return signOut(firebaseAuth);
  },
};

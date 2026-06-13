import {
  createUserWithEmailAndPassword,
  getIdToken,
  getIdTokenResult,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { firebaseAuth } from './firebaseClient.js';

function toSession(firebaseUser, tokenResult) {
  const rol = tokenResult.claims?.rol || tokenResult.claims?.role || null;
  const normalizedRole = rol ? String(rol).toUpperCase() : null;

  return {
    user: {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
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

  logout() {
    return signOut(firebaseAuth);
  },
};

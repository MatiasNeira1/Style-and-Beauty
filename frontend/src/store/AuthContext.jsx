import { createContext, useContext, useState, useEffect } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch ID token and claims
        const tokenResult = await firebaseUser.getIdTokenResult();
        const role = tokenResult.claims.rol || 'CLIENTE';
        
        // Save token to localStorage for apiClient (or apiClient could use auth.currentUser.getIdToken())
        const token = await firebaseUser.getIdToken();
        localStorage.setItem('style_beauty_token', token);

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          role: role.toLowerCase(), // admin, employee, or cliente
        });
      } else {
        setUser(null);
        localStorage.removeItem('style_beauty_token');
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw new Error('Credenciales inválidas o error de conexión.');
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const register = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Backend automatically registers client role if they hit the proper endpoint, but for now we just create the user.
      return userCredential.user;
    } catch (error) {
      throw new Error('Error al registrar la cuenta.');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, isAuthenticated: !!user, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

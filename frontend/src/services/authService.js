import { AUTH_API_BASE_URL, request } from './apiClient.js';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { firebaseApp } from './firebaseClient.js';

const auth = getAuth(firebaseApp);

export const authService = {
  createUser: (payload) => request({ baseURL: AUTH_API_BASE_URL, url: '/api/auth/crear-usuario', method: 'POST', authRequired: true, data: payload }),
  registerClient: (payload) => request({ baseURL: AUTH_API_BASE_URL, url: '/api/auth/registrar-cliente', method: 'POST', data: payload }),
  assignRole: (payload) => request({ baseURL: AUTH_API_BASE_URL, url: '/api/auth/asignar-rol', method: 'POST', authRequired: true, data: payload }),

  registerUserWithVerification: async (profileData, password) => {
    // 1. Crear la cuenta en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, profileData.emailContacto, password);
    const user = userCredential.user;

    // 2. Enviar el correo de verificación inmediatamente
    await sendEmailVerification(user);
    
    // 3. Cerrar la sesión activa que Firebase inicia por defecto
    await signOut(auth);
    
    return user;
  }
};

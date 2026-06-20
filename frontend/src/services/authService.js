import { AUTH_API_BASE_URL, request } from './apiClient.js';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseApp } from './firebaseClient.js';

const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

export const authService = {
  createUser: (payload) => request({ baseURL: AUTH_API_BASE_URL, url: '/api/auth/crear-usuario', method: 'POST', authRequired: true, data: payload }),
  registerClient: (payload) => request({ baseURL: AUTH_API_BASE_URL, url: '/api/auth/registrar-cliente', method: 'POST', data: payload }),
  assignRole: (payload) => request({ baseURL: AUTH_API_BASE_URL, url: '/api/auth/asignar-rol', method: 'POST', authRequired: true, data: payload }),

  registerUserWithVerification: async (profileData, password) => {
    // 1. Crear la cuenta en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, profileData.emailContacto, password);
    const user = userCredential.user;
    
    // 2. Guardar en Firestore INMEDIATAMENTE
    const userDocRef = doc(db, 'usuarios', user.uid);
    await setDoc(userDocRef, {
      email: user.email,
      rol: 'cliente',
      nombre: profileData.nombre,
      apellidos: profileData.apellidos || '',
      rut: profileData.rut || '',
      telefono: profileData.telefono || '',
      fechaNacimiento: profileData.fechaNacimiento || '',
      genero: profileData.genero || '',
      estado: 'activo',
      fechaRegistro: serverTimestamp(),
    });

    // 3. Enviar el correo de verificación
    await sendEmailVerification(user);
    
    return user;
  }
};

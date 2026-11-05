import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";

export interface FirebaseEnvConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

export const firebaseConfig: FirebaseEnvConfig = {
  apiKey: ((import.meta as any).env || {}).VITE_FIREBASE_API_KEY,
  authDomain: ((import.meta as any).env || {}).VITE_FIREBASE_AUTH_DOMAIN,
  projectId: ((import.meta as any).env || {}).VITE_FIREBASE_PROJECT_ID,
  storageBucket: ((import.meta as any).env || {}).VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ((import.meta as any).env || {}).VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: ((import.meta as any).env || {}).VITE_FIREBASE_APP_ID,
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

if (isFirebaseConfigured()) {
  try {
    appInstance = getApps().length === 0 ? initializeApp(firebaseConfig as Record<string, string>) : getApps()[0];
    dbInstance = getFirestore(appInstance);
    authInstance = getAuth(appInstance);
  } catch (error) {
    console.warn("[Firebase] Falha ao inicializar SDK com as credenciais fornecidas:", error);
  }
}

export { appInstance as firebaseApp, dbInstance as firestoreDb, authInstance as firebaseAuth };

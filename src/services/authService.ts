import { firebaseAuth, isFirebaseConfigured } from "../config/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";

export interface AuthUserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export class AuthService {
  private static googleProvider = (() => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    return provider;
  })();

  static isConfigured(): boolean {
    return isFirebaseConfigured() && firebaseAuth !== null;
  }

  static async handleRedirectResult(): Promise<AuthUserProfile | null> {
    if (!this.isConfigured() || !firebaseAuth) return null;
    try {
      const result = await getRedirectResult(firebaseAuth);
      if (result && result.user) {
        return {
          uid: result.user.uid,
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL
        };
      }
      return null;
    } catch (error: any) {
      console.error("[AuthService] Erro ao recuperar resultado de redirect:", error?.code, error?.message);
      throw error;
    }
  }

  static async loginWithGoogle(): Promise<AuthUserProfile | null> {
    if (!this.isConfigured() || !firebaseAuth) {
      console.warn("[AuthService] Firebase Auth nao configurado.");
      return null;
    }

    try {
      // Tentativa primaria com Popup
      const result = await signInWithPopup(firebaseAuth, this.googleProvider);
      const user = result.user;
      return {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL
      };
    } catch (error: any) {
      console.warn("[AuthService] Falha ou bloqueio no Popup. Codigo:", error?.code, error?.message);
      
      // Fallback para redirect se o popup for bloqueado, fechado ou impedido por politicas de iframe/cross-origin
      if (
        error?.code === "auth/popup-blocked" ||
        error?.code === "auth/popup-closed-by-user" ||
        error?.code === "auth/cancelled-popup-request" ||
        error?.code === "auth/internal-error"
      ) {
        console.info("[AuthService] Iniciando fallback com signInWithRedirect...");
        await signInWithRedirect(firebaseAuth, this.googleProvider);
        return null;
      }
      throw error;
    }
  }

  static async logout(): Promise<void> {
    if (!this.isConfigured() || !firebaseAuth) return;
    try {
      await signOut(firebaseAuth);
    } catch (error) {
      console.error("[AuthService] Erro ao realizar logout:", error);
      throw error;
    }
  }

  static subscribeToAuthChanges(callback: (user: AuthUserProfile | null) => void): () => void {
    if (!this.isConfigured() || !firebaseAuth) {
      callback(null);
      return () => {};
    }

    return onAuthStateChanged(firebaseAuth, (user: User | null) => {
      if (user) {
        callback({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL
        });
      } else {
        callback(null);
      }
    });
  }
}

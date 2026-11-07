import { firestoreDb, isFirebaseConfigured } from "../config/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { SpesMundiStorageState } from "../types/education";

export class FirebaseSyncService {
  private static readonly COLLECTION_NAME = "users";
  private static readonly DATA_DOC_ID = "spesmundi_data";

  static isReady(): boolean {
    return isFirebaseConfigured() && firestoreDb !== null;
  }

  static async syncRemoteState(userId: string, state: SpesMundiStorageState): Promise<boolean> {
    if (!this.isReady() || !firestoreDb || !userId) {
      return false;
    }

    try {
      const docRef = doc(firestoreDb, this.COLLECTION_NAME, userId, "app", this.DATA_DOC_ID);
      const writePromise = setDoc(docRef, {
        ...state,
        lastSyncedAt: new Date().toISOString()
      }, { merge: true });

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout na sincronização remota do Firestore (4s)")), 4000);
      });

      await Promise.race([writePromise, timeoutPromise]);
      return true;
    } catch (error) {
      console.warn("[FirebaseSync] Falha ou timeout ao sincronizar dados na nuvem:", error);
      return false;
    }
  }

  static async fetchRemoteState(userId: string): Promise<SpesMundiStorageState | null> {
    if (!this.isReady() || !firestoreDb || !userId) {
      return null;
    }

    try {
      const docRef = doc(firestoreDb, this.COLLECTION_NAME, userId, "app", this.DATA_DOC_ID);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as SpesMundiStorageState;
        return data;
      }
      return null;
    } catch (error) {
      console.warn("[FirebaseSync] Falha ao buscar dados do usuario na nuvem:", error);
      return null;
    }
  }
}

import { describe, it, expect } from "vitest";
import { FirebaseSyncService } from "../services/firebaseSyncService";
import { isFirebaseConfigured } from "../config/firebase";

describe("FirebaseSyncService (Desacoplado)", () => {
  it("deve verificar se as variaveis de ambiente estao ativas ou ausentes", () => {
    const configured = isFirebaseConfigured();
    expect(typeof configured).toBe("boolean");
  });

  it("deve retornar null graciosamente se nao passar userId", async () => {
    const remote = await FirebaseSyncService.fetchRemoteState("");
    expect(remote).toBeNull();
  });

  it("deve retornar false graciosamente se sincronizar sem userId", async () => {
    const success = await FirebaseSyncService.syncRemoteState("", {} as any);
    expect(success).toBe(false);
  });
});

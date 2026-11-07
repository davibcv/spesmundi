import React from "react";
import { ActiveView } from "../types/education";
import { AuthUserProfile } from "../services/authService";
import { Sparkles, Compass, TreePine, Award, Home, LogIn, LogOut, Cloud, RefreshCw, AlertCircle, X } from "lucide-react";

interface NavbarProps {
  currentView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  childName: string;
  currentUser: AuthUserProfile | null;
  isSyncing: boolean;
  authLoading: boolean;
  authError: string | null;
  onClearError: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onSaveAndSync?: () => Promise<boolean | void> | void | boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  childName,
  currentUser,
  isSyncing,
  authLoading,
  authError,
  onClearError,
  onLogin,
  onLogout,
  onSaveAndSync
}) => {
  const [saveFeedback, setSaveFeedback] = React.useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showSuccessModal, setShowSuccessModal] = React.useState<boolean>(false);

  const handleManualSave = async () => {
    if (saveFeedback === "saving") return;
    setSaveFeedback("saving");
    try {
      if (onSaveAndSync) {
        const savePromise = onSaveAndSync();
        const timeoutPromise = new Promise<void>((_, reject) => {
          setTimeout(() => reject(new Error("Timeout de interface ao salvar")), 5000);
        });
        await Promise.race([savePromise, timeoutPromise]);
      }
      setSaveFeedback("saved");
      setShowSuccessModal(true);
      setTimeout(() => setSaveFeedback("idle"), 2500);
    } catch {
      setSaveFeedback("error");
      setTimeout(() => setSaveFeedback("idle"), 3000);
    }
  };
  const navItems = [
    { id: "home" as ActiveView, label: "Inicio", icon: Home },
    { id: "activities" as ActiveView, label: "Atividades", icon: Compass },
    { id: "current-state" as ActiveView, label: "Estado Atual", icon: Award },
    { id: "knowledge-tree" as ActiveView, label: "Arvore do Conhecimento", icon: TreePine },
  ];

  return (
    <>
      <header style={{
        borderBottom: "1px solid var(--border-light)",
        backgroundColor: "rgba(255, 253, 249, 0.95)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 40,
        padding: "0.85rem 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div 
          onClick={() => onNavigate("home")} 
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "0.75rem" }}
        >
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "var(--rose-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--rose-deep)",
            border: "1px solid var(--border-delicate)"
          }}>
            <Sparkles size={18} />
          </div>
          <div>
            <span style={{
              fontFamily: "var(--font-serif)",
              fontSize: "1.35rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "0.03em"
            }}>
              Spes Mundi
            </span>
            <span style={{
              display: "block",
              fontSize: "0.72rem",
              color: "var(--rose-burnished)",
              letterSpacing: "0.05em",
              textTransform: "uppercase"
            }}>
              Formacao de {childName}
            </span>
              <span style={{ display: "inline-block", marginLeft: "0.4rem", padding: "0.1rem 0.4rem", fontSize: "0.65rem", fontWeight: 700, borderRadius: "4px", backgroundColor: "var(--rose-soft)", color: "var(--rose-deep)", border: "1px solid var(--border-delicate)" }}>v 0.8.3</span>
            </div>
          </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <nav style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.55rem 0.95rem",
                    borderRadius: "var(--radius-btn)",
                    fontSize: "0.88rem",
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "var(--rose-deep)" : "var(--text-secondary)",
                    backgroundColor: isActive ? "var(--rose-soft)" : "transparent",
                    border: isActive ? "1px solid var(--border-delicate)" : "1px solid transparent",
                    transition: "all 0.2s ease"
                  }}
                >
                  <Icon size={16} color={isActive ? "var(--rose-deep)" : "var(--rose-burnished)"} />
                  <span>{item.label}</span>
                </button>
              );
            })}
            {onSaveAndSync && (
              <button
                type="button"
                onClick={handleManualSave}
                disabled={saveFeedback === "saving"}
                title="Salvar alterações e sincronizar com o Firebase"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.55rem 0.85rem",
                  borderRadius: "var(--radius-btn)",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  cursor: saveFeedback === "saving" ? "not-allowed" : "pointer",
                  color: saveFeedback === "saved" ? "#166534" : saveFeedback === "error" ? "#991b1b" : "var(--rose-deep)",
                  backgroundColor: saveFeedback === "saved" ? "#dcfce7" : saveFeedback === "error" ? "#fee2e2" : "var(--rose-soft)",
                  border: "1px solid var(--border-delicate)",
                  transition: "all 0.2s ease",
                  opacity: saveFeedback === "saving" ? 0.7 : 1
                }}
              >
                <span style={{ fontSize: "1rem", lineHeight: 1 }}>💾</span>
                <span>
                  {saveFeedback === "saving"
                    ? "Salvando..."
                    : saveFeedback === "saved"
                    ? "Salvo!"
                    : saveFeedback === "error"
                    ? "Erro ao salvar"
                    : "Salvar"}
                </span>
              </button>
            )}
          </nav>

          <div style={{ width: "1px", height: "24px", backgroundColor: "var(--border-light)" }} />

          {authLoading ? (
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Carregando...</div>
          ) : currentUser ? (
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {isSyncing ? (
                  <RefreshCw size={14} className="spin" color="var(--rose-burnished)" />
                ) : (
                  <Cloud size={14} color="#2e7d32" />
                )}
                <span>{isSyncing ? "Sincronizando..." : "Sincronizado"}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || "Usuario"}
                    style={{ width: "30px", height: "30px", borderRadius: "50%", border: "1px solid var(--border-delicate)" }}
                  />
                ) : (
                  <div style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    backgroundColor: "var(--rose-soft)",
                    color: "var(--rose-deep)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.8rem",
                    fontWeight: 600
                  }}>
                    {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : "U"}
                  </div>
                )}
                <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-primary)", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {currentUser.displayName || currentUser.email || "Conectado"}
                </span>
                <button
                  type="button"
                  onClick={onLogout}
                  title="Desconectar"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0.35rem",
                    borderRadius: "6px",
                    backgroundColor: "transparent",
                    color: "var(--text-muted)",
                    cursor: "pointer"
                  }}
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onLogin}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                backgroundColor: "var(--rose-antique)",
                color: "#FFF",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(163, 64, 80, 0.25)"
              }}
            >
              <LogIn size={15} />
              <span>Entrar com Google</span>
            </button>
          )}
        </div>
      </header>

      {authError && (
        <div style={{
          backgroundColor: "#fef2f2",
          borderBottom: "1px solid #fecaca",
          padding: "0.6rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "#991b1b",
          fontSize: "0.83rem"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertCircle size={16} />
            <span>{authError}</span>
          </div>
          <button
            type="button"
            onClick={onClearError}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#991b1b",
              display: "flex",
              alignItems: "center"
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}
      {showSuccessModal && (
        <div
          role="dialog"
          aria-modal="true"
          data-testid="save-success-modal"
          onClick={() => setShowSuccessModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(2px)",
            cursor: "pointer"
          }}
        >
          <div
            onClick={() => setShowSuccessModal(false)}
            style={{
              backgroundColor: "#ffffff",
              padding: "1.75rem 2.25rem",
              borderRadius: "16px",
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.75rem",
              border: "1px solid var(--border-light, #e2e8f0)",
              textAlign: "center"
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                backgroundColor: "#dcfce7",
                color: "#166534",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.6rem"
              }}
            >
              ✓
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "#1e293b"
              }}
            >
              Salvo com sucesso
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: "0.85rem",
                color: "#64748b"
              }}
            >
              Toque em qualquer lugar da tela para fechar
            </p>
          </div>
        </div>
      )}
    </>
  );
};

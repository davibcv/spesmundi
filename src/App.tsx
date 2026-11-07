import { useState } from "react";
import { ActiveView } from "./types/education";
import { Navbar } from "./components/Navbar";
import { HomeView } from "./components/HomeView";
import { ActivitiesView } from "./components/ActivitiesView";
import { CurrentStateView } from "./components/CurrentStateView";
import { KnowledgeTreeView } from "./components/KnowledgeTreeView";
import { useSpesMundi } from "./hooks/useSpesMundi";

export default function App() {
  const [currentView, setCurrentView] = useState<ActiveView>("home");
  const spes = useSpesMundi();

  if (spes.isHydrating) {
    return (
      <div style={{
        minHeight: "100vh",
        backgroundColor: "var(--bg-primary)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center"
      }}>
        <div style={{
          maxWidth: "420px",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          padding: "2.5rem 2rem",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)",
          border: "1px solid var(--border-light, #e2e8f0)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          <div style={{
            width: "48px",
            height: "48px",
            border: "3px solid #e2e8f0",
            borderTopColor: "var(--accent-primary, #3b82f6)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            marginBottom: "1.5rem"
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <h2 style={{
            fontFamily: "var(--font-serif, Georgia, serif)",
            fontSize: "1.35rem",
            color: "var(--text-main, #1e293b)",
            marginBottom: "0.5rem"
          }}>
            Spes Mundi
          </h2>
          <p style={{
            fontSize: "0.9rem",
            color: "var(--text-muted, #64748b)",
            lineHeight: "1.5",
            margin: 0
          }}>
            Carregando formação educativa e sincronizando com o último salvamento...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)", display: "flex", flexDirection: "column" }}>
      <Navbar
        currentView={currentView}
        onNavigate={setCurrentView}
        childName={spes.state.child.name}
        currentUser={spes.currentUser}
        isSyncing={spes.isSyncing}
        authLoading={spes.authLoading}
        authError={spes.authError}
        onClearError={spes.clearAuthError}
        onLogin={spes.loginWithGoogle}
        onLogout={spes.logout}
        onSaveAndSync={spes.saveAndSyncNow}
      />

      <main style={{ flex: 1 }}>
        {currentView === "home" && (
          <HomeView
            onNavigate={setCurrentView}
            child={spes.state.child}
            age={spes.detailedAge}
            onUpdateChild={spes.updateChild}
            onRefresh={spes.refresh}
          />
        )}

        {currentView === "activities" && (
          <ActivitiesView
            childName={spes.state.child.name}
            childAge={spes.detailedAge}
            tree={spes.state.tree}
            activities={spes.state.activities}
            onSaveActivity={spes.saveActivity}
            onApplyInitialAlignment={spes.applyInitialAlignment}
            onDeleteActivity={spes.deleteActivity}
            recurringActivities={spes.state.recurringActivities || []}
            onSaveRecurringActivity={spes.saveRecurringActivity}
            onRecordRecurringUsage={spes.recordRecurringActivityUsage}
            onDeleteRecurringActivity={spes.deleteRecurringActivity}
          />
        )}

        {currentView === "current-state" && (
          <CurrentStateView
            childName={spes.state.child.name}
            age={spes.detailedAge}
            treeWithScores={spes.aggregatedTree}
          />
        )}

        {currentView === "knowledge-tree" && (
          <KnowledgeTreeView
            tree={spes.state.tree}
            onAddNode={spes.addTreeNode}
            onUpdateNode={spes.updateTreeNode}
            onDeleteNode={spes.deleteTreeNode}
          />
        )}
      </main>

      <footer style={{
        borderTop: "1px solid var(--border-light)",
        padding: "2rem 1.5rem",
        textAlign: "center",
        fontSize: "0.82rem",
        color: "var(--text-muted)",
        backgroundColor: "var(--ivory)"
      }}>
        <p>Spes Mundi &mdash; Acompanhamento Educativo e Formacao Integral</p>
        <p style={{ fontSize: "0.75rem", marginTop: "0.3rem" }}>
          Persistencia em Nuvem e Autenticacao Integrada
        </p>
      </footer>
    </div>
  );
}

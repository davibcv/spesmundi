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
            onDeleteActivity={spes.deleteActivity}
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

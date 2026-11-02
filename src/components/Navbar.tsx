import React from "react";
import { ActiveView } from "../types/education";
import { Sparkles, Compass, TreePine, Award, Home } from "lucide-react";

interface NavbarProps {
  currentView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  childName: string;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, childName }) => {
  const navItems = [
    { id: "home" as ActiveView, label: "Início", icon: Home },
    { id: "activities" as ActiveView, label: "Atividades", icon: Compass },
    { id: "current-state" as ActiveView, label: "Estado Atual", icon: Award },
    { id: "knowledge-tree" as ActiveView, label: "Árvore do Conhecimento", icon: TreePine },
  ];

  return (
    <header style={{
      borderBottom: "1px solid var(--border-light)",
      backgroundColor: "rgba(255, 253, 249, 0.92)",
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
            Formação de {childName}
          </span>
        </div>
      </div>

      <nav style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
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
      </nav>
    </header>
  );
};

import React from "react";
import { ConsolidationLevel, CONSOLIDATION_LEVELS_META } from "../types/education";

interface ConsolidationRulerProps {
  value?: ConsolidationLevel;
  onChange: (level: ConsolidationLevel) => void;
  compact?: boolean;
}

export const ConsolidationRuler: React.FC<ConsolidationRulerProps> = ({
  value,
  onChange,
  compact = false
}) => {
  const levels: ConsolidationLevel[] = [1, 2, 3, 4, 5];
  const activeMeta = value ? CONSOLIDATION_LEVELS_META[value] : undefined;

  return (
    <div style={{ margin: compact ? "0.35rem 0" : "0.85rem 0" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: compact ? "0.25rem" : "0.45rem"
      }}>
        <span style={{
          fontSize: compact ? "0.75rem" : "0.82rem",
          fontWeight: 600,
          color: "var(--text-secondary)",
          letterSpacing: "0.02em"
        }}>
          Grau de Consolidação:
        </span>
        {activeMeta && (
          <span style={{
            fontSize: compact ? "0.72rem" : "0.8rem",
            fontWeight: 600,
            color: "var(--rose-burnished)"
          }}>
            {activeMeta.title}
          </span>
        )}
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        gap: compact ? "0.25rem" : "0.5rem",
        background: "rgba(0, 0, 0, 0.03)",
        padding: compact ? "0.3rem" : "0.5rem",
        borderRadius: "8px",
        border: "1px solid var(--border-delicate)"
      }}>
        {levels.map((lvl) => {
          const meta = CONSOLIDATION_LEVELS_META[lvl];
          const isSelected = value === lvl;
          return (
            <button
              key={lvl}
              type="button"
              onClick={() => onChange(lvl)}
              title={meta.title + ": " + meta.description}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: compact ? "0.25rem 0.2rem" : "0.45rem 0.3rem",
                borderRadius: "6px",
                border: isSelected ? "1.5px solid var(--rose-burnished)" : "1px solid transparent",
                backgroundColor: isSelected ? "var(--rose-burnished)" : "var(--bg-accent)",
                color: isSelected ? "#ffffff" : "var(--text-primary)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: isSelected ? "0 2px 4px rgba(0,0,0,0.1)" : "none"
              }}
            >
              <span style={{
                fontSize: compact ? "0.8rem" : "0.95rem",
                fontWeight: 700,
                lineHeight: 1
              }}>
                {lvl}
              </span>
              {!compact && (
                <span style={{
                  fontSize: "0.68rem",
                  marginTop: "0.2rem",
                  opacity: isSelected ? 0.95 : 0.75,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  maxWidth: "100%"
                }}>
                  {meta.shortLabel}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeMeta && !compact && (
        <p style={{
          margin: "0.45rem 0 0 0",
          fontSize: "0.78rem",
          lineHeight: 1.4,
          color: "var(--text-muted)",
          fontStyle: "italic"
        }}>
          {activeMeta.description}
        </p>
      )}
    </div>
  );
};

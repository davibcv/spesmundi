import React, { useState } from "react";
import { KnowledgeNode } from "../types/education";
import { TreeNodeModal } from "./TreeNodeModal";
import { TreePine, Plus, Edit2, ChevronDown, ChevronRight, Info, Trash2 } from "lucide-react";

interface KnowledgeTreeViewProps {
  tree: KnowledgeNode;
  onAddNode: (parentId: string, data: { name: string; description: string }) => void;
  onUpdateNode: (targetId: string, updates: { name?: string; description?: string }) => void;
  onDeleteNode: (targetId: string) => void;
}

export const KnowledgeTreeView: React.FC<KnowledgeTreeViewProps> = ({
  tree,
  onAddNode,
  onUpdateNode,
  onDeleteNode
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>(tree.id);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    [tree.id]: true,
    "branch-criacao": true,
    "branch-proximo": true
  });
  const [modalMode, setModalMode] = useState<"add-sub" | "edit" | null>(null);
  const [activeModalNode, setActiveModalNode] = useState<KnowledgeNode | null>(null);

  const findInTree = (node: KnowledgeNode, id: string): KnowledgeNode | null => {
    if (node.id === id) return node;
    if (!node.children) return null;
    for (const child of node.children) {
      const found = findInTree(child, id);
      if (found) return found;
    }
    return null;
  };

  const selectedNode = findInTree(tree, selectedNodeId) || tree;

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenAdd = (node: KnowledgeNode, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveModalNode(node);
    setModalMode("add-sub");
  };

  const handleOpenEdit = (node: KnowledgeNode, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveModalNode(node);
    setModalMode("edit");
  };

  const handleDelete = (node: KnowledgeNode, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (node.id === tree.id) {
      alert("O principio primeiro e fundamental (Raiz Suprema) nao pode ser excluido.");
      return;
    }
    const hasChildren = node.children && node.children.length > 0;
    const confirmMessage = hasChildren
      ? "Deseja realmente excluir \"" + node.name + "\" e todos os seus subconjuntos vinculados?"
      : "Deseja realmente excluir o subconjunto \"" + node.name + "\"?";

    if (window.confirm(confirmMessage)) {
      onDeleteNode(node.id);
      if (selectedNodeId === node.id) {
        setSelectedNodeId(tree.id);
      }
    }
  };

  const handleSave = (name: string, description: string) => {
    const target = activeModalNode || selectedNode;
    if (modalMode === "edit") {
      onUpdateNode(target.id, { name, description });
    } else if (modalMode === "add-sub") {
      onAddNode(target.id, { name, description });
      setExpandedNodes(prev => ({ ...prev, [target.id]: true }));
    }
    setModalMode(null);
    setActiveModalNode(null);
  };

  const renderTreeItem = (node: KnowledgeNode, depth = 0) => {
    if (node.isArchived) return null;
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = !!expandedNodes[node.id];
    const isSelected = selectedNode.id === node.id;
    const isRoot = node.id === tree.id;

    return (
      <div key={node.id} style={{ marginLeft: depth > 0 ? "1.5rem" : "0", marginTop: "0.45rem" }}>
        <div
          onClick={() => setSelectedNodeId(node.id)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.65rem 0.95rem",
            backgroundColor: isSelected ? "var(--rose-soft)" : depth === 0 ? "var(--bg-accent)" : "var(--bg-card)",
            border: isSelected ? "1px solid var(--rose-antique)" : "1px solid var(--border-light)",
            borderRadius: "10px",
            cursor: "pointer"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flex: 1, minWidth: 0 }}>
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleExpand(node.id, e)}
                style={{
                  color: "var(--rose-burnished)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "22px",
                  height: "22px",
                  borderRadius: "4px"
                }}
              >
                {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
              </button>
            ) : (
              <div style={{ width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "var(--border-delicate)" }} />
              </div>
            )}

            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <span style={{
                fontSize: depth === 0 ? "1.02rem" : "0.9rem",
                fontWeight: depth === 0 ? 600 : 500,
                color: "var(--text-primary)",
                fontFamily: depth <= 1 ? "var(--font-serif)" : "var(--font-sans)"
              }}>
                {node.name}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginLeft: "0.5rem" }}>
            <button
              type="button"
              title="Adicionar subconjunto"
              onClick={(e) => handleOpenAdd(node, e)}
              style={{
                padding: "0.3rem",
                borderRadius: "6px",
                color: "var(--rose-burnished)",
                backgroundColor: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Plus size={14} />
            </button>

            <button
              type="button"
              title="Editar"
              onClick={(e) => handleOpenEdit(node, e)}
              style={{
                padding: "0.3rem",
                borderRadius: "6px",
                color: "var(--text-secondary)",
                backgroundColor: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <Edit2 size={14} />
            </button>

            {!isRoot && (
              <button
                type="button"
                title="Excluir"
                onClick={(e) => handleDelete(node, e)}
                style={{
                  padding: "0.3rem",
                  borderRadius: "6px",
                  color: "var(--rose-deep)",
                  backgroundColor: "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div style={{ borderLeft: "1px solid var(--border-light)", marginLeft: "0.65rem" }}>
            {node.children!.map(child => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const isSelectedRoot = selectedNode.id === tree.id;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2.5rem 1.5rem" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2.4rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>
          Arvore Organica do Conhecimento
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.02rem", lineHeight: 1.6 }}>
          Hierarquia teleologica baseada no bem, na verdade e na caridade. Voce pode criar, editar ou excluir subconjuntos e ramos conforme as necessidades formativas da crianca.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 1.2fr) minmax(280px, 0.8fr)", gap: "2rem", alignItems: "start" }}>
        <div style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "var(--radius-card)",
          border: "1px solid var(--border-light)",
          padding: "1.75rem",
          boxShadow: "var(--shadow-subtle)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.15rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <TreePine size={20} color="var(--rose-burnished)" />
              Estrutura Ramificada
            </h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Use os botoes em cada linha para acoes rapidas
            </span>
          </div>

          <div style={{ marginTop: "0.5rem" }}>
            {renderTreeItem(tree)}
          </div>
        </div>

        <div style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "var(--radius-card)",
          border: "1px solid var(--border-light)",
          padding: "1.75rem",
          boxShadow: "var(--shadow-subtle)",
          position: "sticky",
          top: "2rem"
        }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--rose-burnished)", fontSize: "0.82rem", fontWeight: 600, textTransform: "uppercase" }}>
                <Info size={16} /> Detalhes do Elemento
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => handleOpenAdd(selectedNode)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.35rem 0.7rem",
                    borderRadius: "6px",
                    backgroundColor: "var(--rose-soft)",
                    color: "var(--rose-deep)",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    cursor: "pointer"
                  }}
                >
                  <Plus size={14} /> Subconjunto
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(selectedNode)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.35rem 0.7rem",
                    borderRadius: "6px",
                    backgroundColor: "var(--bg-accent)",
                    border: "1px solid var(--border-delicate)",
                    color: "var(--text-primary)",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    cursor: "pointer"
                  }}
                >
                  <Edit2 size={14} /> Editar
                </button>
                {!isSelectedRoot && (
                  <button
                    type="button"
                    onClick={() => handleDelete(selectedNode)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.35rem 0.7rem",
                      borderRadius: "6px",
                      backgroundColor: "rgba(163, 64, 80, 0.12)",
                      border: "1px solid rgba(163, 64, 80, 0.25)",
                      color: "var(--rose-deep)",
                      fontSize: "0.8rem",
                      fontWeight: 500,
                      cursor: "pointer"
                    }}
                  >
                    <Trash2 size={14} /> Excluir
                  </button>
                )}
              </div>
            </div>

            <h3 style={{ fontSize: "1.5rem", color: "var(--text-primary)", marginBottom: "0.4rem" }}>{selectedNode.name}</h3>
            <div style={{
              display: "inline-block",
              fontSize: "0.75rem",
              padding: "0.2rem 0.6rem",
              borderRadius: "6px",
              backgroundColor: "var(--rose-soft)",
              color: "var(--rose-deep)",
              marginBottom: "1.25rem",
              border: "1px solid var(--border-delicate)"
            }}>
              ID: {selectedNode.id}
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <span style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.35rem" }}>
                Descricao e Finalidade
              </span>
              <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.65 }}>
                {selectedNode.description}
              </p>
            </div>

            <div>
              <span style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-muted)", marginBottom: "0.45rem" }}>
                Relacao de Pertencimento
              </span>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", backgroundColor: "var(--bg-subtle)", padding: "0.85rem", borderRadius: "8px", border: "1px solid var(--border-light)" }}>
                {isSelectedRoot ? (
                  <span>Principio Primeiro e Fundamental (Raiz Suprema inalteravel)</span>
                ) : (
                  <span>Subordinado teleologicamente aos principios superiores da criacao e do proximo.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalMode && (activeModalNode || selectedNode) && (
        <TreeNodeModal
          mode={modalMode}
          node={activeModalNode || selectedNode}
          onClose={() => {
            setModalMode(null);
            setActiveModalNode(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

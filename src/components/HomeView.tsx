import React, { useState } from 'react';
import { ActiveView, ChildProfile, DetailedAge } from '../types/education';
import { StorageService } from '../services/storageService';
import { Heart, Compass, BookOpen, Download, Upload, Check } from 'lucide-react';

interface HomeViewProps {
  onNavigate: (view: ActiveView) => void;
  child: ChildProfile;
  age: DetailedAge;
  onUpdateChild: (data: Partial<ChildProfile>) => void;
  onRefresh: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate, child, age, onUpdateChild, onRefresh }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(child.name);
  const [birthDate, setBirthDate] = useState(child.birthDate);
  const [feedback, setFeedback] = useState('');

  const handleSaveChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !birthDate) return;
    onUpdateChild({ name: name.trim(), birthDate });
    setIsEditing(false);
    setFeedback('Cadastro atualizado com sucesso!');
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleExport = () => {
    const data = StorageService.exportBackupJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'spes_mundi_backup.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content && StorageService.importBackupJSON(content)) {
        onRefresh();
        setFeedback('Backup restaurado com sucesso!');
        setTimeout(() => setFeedback(''), 3000);
      } else {
        alert('Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3.5rem 1.5rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', color: 'var(--text-primary)', marginBottom: '0.75rem', fontWeight: 500 }}>
          Spes Mundi
        </h1>
        <p style={{ color: 'var(--rose-deep)', fontSize: '1.15rem', fontStyle: 'italic', marginBottom: '1.25rem', fontFamily: 'var(--font-serif)' }}>
          Acompanhamento educativo de {child.name} &mdash; {age.formatted}
        </p>
        <p style={{ maxWidth: '720px', margin: '0 auto', color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.7 }}>
          Auxílio aos pais na educação integral dos filhos, estruturada sobre o princípio primeiro:
          <strong style={{ display: 'block', marginTop: '0.4rem', color: 'var(--rose-burnished)', letterSpacing: '0.05em' }}>
            AMAR A DEUS E AO PRÓXIMO
          </strong>
        </p>
      </div>

      {feedback && (
        <div style={{ maxWidth: '500px', margin: '0 auto 2rem', padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: 'var(--rose-soft)', border: '1px solid var(--border-delicate)', color: 'var(--rose-deep)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <Check size={16} /> <span>{feedback}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
        <div onClick={() => onNavigate('activities')} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-card)', padding: '2.25rem', cursor: 'pointer', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--rose-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rose-deep)', marginBottom: '1.25rem' }}><BookOpen size={24} /></div>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.6rem' }}>1. Atividades Cotidianas</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>Descreva os momentos educativos, conversas e observações da natureza para análise pedagógica por IA.</p>
        </div>

        <div onClick={() => onNavigate('current-state')} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-card)', padding: '2.25rem', cursor: 'pointer', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--rose-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rose-deep)', marginBottom: '1.25rem' }}><Compass size={24} /></div>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.6rem' }}>2. Estado Atual</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>Acompanhe a pontuação agregada e os níveis de desenvolvimento calculados dinamicamente conforme a idade exata.</p>
        </div>

        <div onClick={() => onNavigate('knowledge-tree')} style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-card)', padding: '2.25rem', cursor: 'pointer', boxShadow: 'var(--shadow-subtle)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--rose-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--rose-deep)', marginBottom: '1.25rem' }}><Heart size={24} /></div>
          <h3 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: '0.6rem' }}>3. Árvore do Conhecimento</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>Gerencie a estrutura hierárquica viva, criando, editando e organizando subconjuntos com integridade garantida.</p>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--bg-accent)', border: '1px solid var(--border-delicate)', borderRadius: 'var(--radius-card)', padding: '1.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--rose-burnished)', fontWeight: 600 }}>Perfil da Criança e Dados</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 600 }}>{child.name}</span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Nascimento: {child.birthDate} ({age.formatted})</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button type='button' onClick={() => setIsEditing(!isEditing)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-delicate)', color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer' }}>
            {isEditing ? 'Fechar Edição' : 'Editar Cadastro'}
          </button>
          <button type='button' onClick={handleExport} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-delicate)', color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer' }}>
            <Download size={14} /> <span>Backup JSON</span>
          </button>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-delicate)', color: 'var(--text-primary)', fontSize: '0.85rem', cursor: 'pointer' }}>
            <Upload size={14} /> <span>Restaurar</span>
            <input type='file' accept='.json' onChange={handleImport} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {isEditing && (
        <form onSubmit={handleSaveChild} style={{ marginTop: '1rem', backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-card)', border: '1px solid var(--border-light)', display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--rose-burnished)', marginBottom: '0.3rem' }}>Nome da Criança</label>
            <input type='text' value={name} onChange={e => setName(e.target.value)} required style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-delicate)', fontSize: '0.9rem' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--rose-burnished)', marginBottom: '0.3rem' }}>Data de Nascimento (YYYY-MM-DD)</label>
            <input type='date' value={birthDate} onChange={e => setBirthDate(e.target.value)} required style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-delicate)', fontSize: '0.9rem' }} />
          </div>
          <button type='submit' style={{ padding: '0.55rem 1.25rem', borderRadius: '6px', backgroundColor: 'var(--rose-antique)', color: '#FFF', fontSize: '0.88rem', cursor: 'pointer', fontWeight: 600 }}>Salvar Cadastro</button>
        </form>
      )}
    </div>
  );
};

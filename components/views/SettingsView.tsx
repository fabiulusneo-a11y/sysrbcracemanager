
import React, { useState, useEffect } from 'react';
import { Cloud, CheckCircle, RefreshCcw, Settings, ExternalLink, Database, Save, AlertTriangle } from 'lucide-react';
import { isSupabaseConfigured, saveSupabaseConfig } from '../../services/databaseService';

interface SettingsViewProps {
  onDataChanged: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onDataChanged }) => {
  const [url, setUrl] = useState(localStorage.getItem('RBC_SUPABASE_URL') || 'https://jrgzsvjarnaiwxzwkeve.supabase.co');
  const [key, setKey] = useState(localStorage.getItem('RBC_SUPABASE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyZ3pzdmphcm5haXd4endrZXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTkyNTgsImV4cCI6MjA4MTY3NTI1OH0.tLmJix-r76m58BzJgUFJsg0xZiApJQ2NLZvOBvEu9Cw');
  const [isConfigured, setIsConfigured] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    setIsConfigured(isSupabaseConfigured());
  }, []);

  const handleSave = () => {
    setSaveStatus('saving');
    saveSupabaseConfig(url, key);
    setTimeout(() => {
      setSaveStatus('saved');
      setIsConfigured(isSupabaseConfigured());
      // Em vez de apenas carregar dados, recarregamos a aplicação para garantir que o listener de auth reinicie com a nova instância
      setTimeout(() => window.location.reload(), 500);
    }, 800);
  };

  const handleClear = () => {
    if (confirm("Deseja resetar para as configurações padrão do sistema?")) {
        localStorage.removeItem('RBC_SUPABASE_URL');
        localStorage.removeItem('RBC_SUPABASE_KEY');
        setUrl('https://jrgzsvjarnaiwxzwkeve.supabase.co');
        setKey('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyZ3pzdmphcm5haXd4endrZXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTkyNTgsImV4cCI6MjA4MTY3NTI1OH0.tLmJix-r76m58BzJgUFJsg0xZiApJQ2NLZvOBvEu9Cw');
        setIsConfigured(true);
        location.reload();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <Settings className="text-blue-500" />
          Configurações Cloud
        </h2>
        <p className="text-slate-400">
          O sistema está configurado para o banco de dados oficial da equipe.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Setup Card */}
        <div className="lg:col-span-2 bg-slate-900 p-8 rounded-2xl border border-slate-800 space-y-6 shadow-lg">
          <div className="flex items-center gap-3 text-slate-100">
            <Database size={24} className="text-blue-500" />
            <h3 className="font-bold text-xl">Conexão Supabase</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">URL do Projeto</label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Chave de Acesso (Anon Key)</label>
              <input
                type="password"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saveStatus !== 'idle'}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {saveStatus === 'saving' ? <RefreshCcw className="animate-spin" size={18} /> : <Save size={18} />}
              {saveStatus === 'saved' ? 'Configuração Salva!' : 'Atualizar Conexão'}
            </button>
            {localStorage.getItem('RBC_SUPABASE_URL') && (
                <button
                    onClick={handleClear}
                    className="px-6 py-3 border border-red-900/30 text-red-500 hover:bg-red-900/10 rounded-xl transition-all font-bold"
                >
                    Resetar p/ Padrão
                </button>
            )}
          </div>

          <div className="p-4 bg-blue-900/10 rounded-xl border border-blue-900/20">
              <div className="flex gap-3">
                  <AlertTriangle size={18} className="text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">
                      O sistema já vem pré-configurado. Altere estes campos apenas se desejar usar um banco de dados diferente do oficial.
                  </p>
              </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 space-y-4 flex flex-col h-full shadow-lg border-blue-500/20">
          <div className="flex items-center gap-3 text-blue-500">
            <Cloud size={32} />
            <h3 className="font-bold text-xl">Status Cloud</h3>
          </div>
          
          <div className="flex items-center gap-2 text-green-500 bg-green-950/20 p-3 rounded-lg border border-green-900/30">
            <CheckCircle size={20} />
            <span className="font-bold">Sincronizado</span>
          </div>
          
          <p className="text-sm text-slate-400 flex-grow">
            Todas as alterações feitas em qualquer dispositivo (PC ou Celular) são atualizadas em tempo real no banco oficial.
          </p>
          
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            Painel Administrativo
            <ExternalLink size={18} />
          </a>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;

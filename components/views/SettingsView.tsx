import React, { useState, useEffect, useRef } from 'react';
import { Cloud, CheckCircle, RefreshCcw, Settings, ExternalLink, Database, Save, Download, Upload, Loader2, Info } from 'lucide-react';
import { isSupabaseConfigured, saveSupabaseConfig, fetchAllData, restoreFromBackup } from '../../services/databaseService';
import { AppData } from '../../types';

interface SettingsViewProps {
  onDataChanged: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onDataChanged }) => {
  const [url, setUrl] = useState(localStorage.getItem('RBC_SUPABASE_URL') || 'https://jrgzsvjarnaiwxzwkeve.supabase.co');
  const [key, setKey] = useState(localStorage.getItem('RBC_SUPABASE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyZ3pzdmphcm5haXd4endrZXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTkyNTgsImV4cCI6MjA4MTY3NTI1OH0.tLmJix-r76m58BzJgUFJsg0xZiApJQ2NLZvOBvEu9Cw');
  const [isConfigured, setIsConfigured] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [restoreStatus, setRestoreStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsConfigured(isSupabaseConfigured());
  }, []);

  const handleSave = () => {
    setSaveStatus('saving');
    saveSupabaseConfig(url, key);
    setTimeout(() => {
      setSaveStatus('saved');
      setIsConfigured(isSupabaseConfigured());
      setTimeout(() => window.location.reload(), 500);
    }, 800);
  };

  const handleExportBackup = async () => {
      try {
          const data = await fetchAllData();
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `rbc_motorsport_backup_dados_${new Date().toISOString().split('T')[0]}.json`;
          a.click();
      } catch (e) {
          alert("Erro ao gerar backup.");
      }
  };

  const handleImportClick = () => {
      fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.name.endsWith('.rar') || file.name.endsWith('.zip')) {
          alert("Arquivo Comprimido Detectado!\n\nPor favor, extraia o arquivo usando o WinRAR ou 7-Zip primeiro. O sistema precisa do arquivo .json que está dentro dele.");
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
          try {
              const content = event.target?.result as string;
              let backupData: AppData;
              
              try {
                  backupData = JSON.parse(content);
              } catch (parseError) {
                  throw new Error("O arquivo não é um JSON válido.");
              }

              if (!backupData.events || !backupData.members) {
                  throw new Error("Arquivo de backup com estrutura incompatível.");
              }

              if (confirm("ATENÇÃO: Isso apagará todos os dados atuais do banco e restaurará a versão do arquivo selecionado. Deseja continuar?")) {
                  setRestoreStatus('processing');
                  await restoreFromBackup(backupData);
                  setRestoreStatus('success');
                  onDataChanged();
                  alert("Restauração concluída com sucesso!");
              }
          } catch (err: any) {
              console.error(err);
              setRestoreStatus('error');
              alert("Erro na Restauração: " + err.message);
          } finally {
              setRestoreStatus('idle');
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      };
      reader.readAsText(file);
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
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
          <Settings className="text-blue-500" />
          Configurações do Sistema
        </h2>
        <p className="text-slate-400 text-sm">
          Gerencie a conexão cloud e a integridade dos dados da sua equipe.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* Status Card */}
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 space-y-4 flex flex-col shadow-lg border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-blue-500">
              <Cloud size={32} />
              <h3 className="font-bold text-xl text-slate-100">Status da Conexão</h3>
            </div>
            <div className="flex items-center gap-2 text-green-500 bg-green-950/20 px-4 py-2 rounded-full border border-green-900/30">
              <CheckCircle size={18} />
              <span className="font-black text-[10px] uppercase tracking-widest">Sincronizado</span>
            </div>
          </div>
          
          <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">
            Seus dados estão protegidos e sincronizados em tempo real com o servidor cloud da RBC Motorsport. 
            Todas as alterações feitas em qualquer dispositivo são propagadas instantaneamente para a equipe.
          </p>
          
          <div className="pt-4">
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-6 py-3 rounded-xl transition-all text-xs border border-slate-700 uppercase tracking-widest"
            >
              Console Admin Supabase
              <ExternalLink size={16} />
            </a>
          </div>
        </div>

        {/* Backup & Restore Section */}
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 space-y-6 shadow-lg">
          <div className="flex items-center gap-3 text-slate-100">
            <RefreshCcw size={24} className="text-amber-500" />
            <h3 className="font-bold text-xl">Backup & Restauração</h3>
          </div>
          
          <p className="text-sm text-slate-400 leading-relaxed">
            Exporte uma cópia de segurança de todos os registros (Membros, Veículos e Eventos). 
            Recomendamos fazer este download antes de realizar alterações em massa no banco de dados.
          </p>

          <div className="p-4 bg-amber-950/20 rounded-xl border border-amber-900/30 flex items-start gap-3">
            <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-400 leading-normal font-medium uppercase tracking-wide">
              O arquivo de backup (.json) contém apenas os dados brutos. Ele não armazena configurações de layout ou código-fonte.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
                onClick={handleExportBackup}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-700 text-[10px] uppercase tracking-[0.2em]"
            >
                <Download size={18} />
                Gerar Backup (.json)
            </button>
            <button
                onClick={handleImportClick}
                disabled={restoreStatus === 'processing'}
                className="bg-amber-600 hover:bg-amber-700 disabled:bg-slate-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20 text-[10px] uppercase tracking-[0.2em]"
            >
                {restoreStatus === 'processing' ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                Restaurar Base
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept=".json"
            />
          </div>
        </div>

        {/* Setup Card */}
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 space-y-6 shadow-lg">
          <div className="flex items-center gap-3 text-slate-100">
            <Database size={24} className="text-blue-500" />
            <h3 className="font-bold text-xl">Configuração de Banco de Dados</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">URL da Instância</label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Chave de API (Anon Key)</label>
              <input
                type="password"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-4 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={handleSave}
              disabled={saveStatus !== 'idle'}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 uppercase tracking-[0.2em] text-[10px]"
            >
              {saveStatus === 'saving' ? <RefreshCcw className="animate-spin" size={18} /> : <Save size={18} />}
              {saveStatus === 'saved' ? 'Configurações Salvas!' : 'Aplicar Credenciais Cloud'}
            </button>
            {localStorage.getItem('RBC_SUPABASE_URL') && (
                <button
                    onClick={handleClear}
                    className="px-8 py-4 border border-red-900/30 text-red-500 hover:bg-red-900/10 rounded-xl transition-all font-black uppercase tracking-[0.2em] text-[10px]"
                >
                    Resetar Padrão
                </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
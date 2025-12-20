
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/views/Dashboard';
import MembersView from './components/views/MembersView';
import CitiesView from './components/views/CitiesView';
import ChampionshipsView from './components/views/ChampionshipsView';
import EventsView from './components/views/EventsView';
import VehiclesView from './components/views/VehiclesView';
import SettingsView from './components/views/SettingsView';
import LoginView from './components/views/LoginView';
import { ViewState, AppData, Event, Championship, City, Member, Vehicle } from './types';
import { Menu, X, Cloud, Loader2, Database, AlertCircle, Info, RefreshCw, Zap } from 'lucide-react';
import { sqlInsert, sqlUpdate, sqlDelete, fetchAllData, isSupabaseConfigured, onAuthStateChange } from './services/databaseService';
import { User as SupabaseUser } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [data, setData] = useState<AppData | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [configMissing, setConfigMissing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<{title: string, msg: string} | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isDemo, setIsDemo] = useState(localStorage.getItem('RBC_DEMO_MODE') === 'true');

  const loadData = async () => {
    if (!isSupabaseConfigured() && !isDemo) {
        setConfigMissing(true);
        return;
    }
    setLoading(true);
    try {
      const allData = await fetchAllData();
      setData(allData);
      setErrorMessage(null);
      setConfigMissing(false);
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      if (!isDemo) {
        setErrorMessage("Erro de conexão: Não foi possível obter os dados do Supabase.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Se estiver no modo demo, não precisamos ouvir o auth do Supabase para iniciar
    if (isDemo) {
        setIsInitializing(false);
        loadData();
        return;
    }

    const { data: { subscription } } = onAuthStateChange((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadData();
      } else {
        setData(null);
        setIsInitializing(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isDemo]);

  useEffect(() => {
    if (user || isDemo) {
      setIsInitializing(false);
    }
  }, [data, user, isDemo]);

  const handleDemoLogin = () => {
    setIsDemo(true);
    localStorage.setItem('RBC_DEMO_MODE', 'true');
    // Força recarregamento do estado
    window.location.reload();
  };

  const addItem = async (table: string, item: any) => {
    if (isDemo) {
        setWarningMessage({ title: 'Modo Demonstração', msg: 'No modo demo, as alterações são apenas visuais e não são persistidas permanentemente.' });
        return;
    }
    setLoading(true);
    try {
      await sqlInsert(table, item);
      await loadData();
    } catch (e: any) {
      setErrorMessage("Erro ao salvar: " + (e.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  const updateItem = async (table: string, item: any) => {
    if (isDemo) {
        setWarningMessage({ title: 'Modo Demonstração', msg: 'No modo demo, as alterações são apenas visuais e não são persistidas permanentemente.' });
        return;
    }
    setLoading(true);
    try {
      const { id, ...rest } = item;
      await sqlUpdate(table, id, rest);
      await loadData();
    } catch (e: any) {
      setErrorMessage("Erro ao atualizar: " + (e.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (table: string, id: string | number) => {
    if (isDemo) {
        setWarningMessage({ title: 'Modo Demonstração', msg: 'No modo demo, as exclusões não são persistidas permanentemente.' });
        return;
    }
    if (!data) return;
    
    if (table === 'championships' || table === 'cities' || table === 'members') {
        const inUse = data.events.some(e => {
            if (table === 'championships') return e.championshipId === id;
            if (table === 'cities') return e.cityId === id;
            if (table === 'members') return e.memberIds.includes(String(id));
            return false;
        });

        if (inUse) {
            const msg = table === 'members' 
                ? 'Este integrante está escalado em eventos. Remova-o dos eventos antes de excluir.'
                : 'Este item está vinculado a eventos existentes e não pode ser excluído.';
            setWarningMessage({ title: 'Bloqueio de Exclusão', msg });
            return;
        }
    }

    setLoading(true);
    try {
      await sqlDelete(table, id);
      await loadData();
    } catch (e: any) {
      setErrorMessage("Erro ao excluir: " + (e.message || "O servidor recusou a exclusão."));
    } finally {
      setLoading(false);
    }
  };

  const handleEditEventNavigation = (id: string) => {
    setEditingEventId(id);
    setCurrentView('events');
  };

  const handleLogout = () => {
    if (isDemo) {
        localStorage.removeItem('RBC_DEMO_MODE');
        setIsDemo(false);
        window.location.reload();
    }
  };

  if (!user && !isDemo && !isInitializing) {
    return <LoginView onDemoLogin={handleDemoLogin} />;
  }

  if (isInitializing) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-8">
        <div className="relative mb-8 text-center">
          <div className="absolute inset-0 bg-red-600/10 blur-3xl rounded-full"></div>
          <Loader2 size={48} className="text-red-500 animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">RBC Motorsport</h1>
          <p className="text-slate-500 text-sm">Validando acesso...</p>
        </div>
      </div>
    );
  }

  const appData = data || { cities: [], championships: [], members: [], events: [], vehicles: [] };

  return (
    <div className="h-screen bg-slate-950 flex text-slate-100 overflow-hidden relative">
      {loading && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
                <Loader2 size={40} className="text-red-500 animate-spin" />
                <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">Sincronizando...</span>
            </div>
        </div>
      )}

      {/* Warning Modal */}
      {warningMessage && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
                  <div className="flex items-center gap-3 text-amber-500 mb-4">
                      <Info size={24} />
                      <h3 className="font-bold text-lg">{warningMessage.title}</h3>
                  </div>
                  <p className="text-slate-400 text-sm mb-6">{warningMessage.msg}</p>
                  <button onClick={() => setWarningMessage(null)} className="w-full bg-slate-800 hover:bg-slate-700 py-2.5 rounded-xl font-bold transition-colors">
                      Entendido
                  </button>
              </div>
          </div>
      )}

      {isDemo && (
          <div className="fixed bottom-4 right-4 z-[150] animate-bounce">
              <div className="bg-amber-600 text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 border-2 border-amber-400 font-black text-xs uppercase italic tracking-tighter">
                  <Zap size={14} /> Modo de Demonstração Ativo
              </div>
          </div>
      )}

      <div className="md:hidden fixed top-0 left-0 w-full bg-slate-900 border-b border-slate-800 text-white z-20 flex items-center justify-between p-4 shadow-md">
        <span className="font-bold text-lg">RBC Motorsport</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <div className={`fixed inset-0 z-20 bg-black/50 transition-opacity md:hidden ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)}></div>
      
      <div className={`fixed md:static inset-y-0 left-0 z-30 transition-transform duration-300 transform md:transform-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
         <Sidebar currentView={currentView} onChangeView={(view) => { setCurrentView(view); setIsMobileMenuOpen(false); }} />
      </div>

      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto h-full bg-slate-950">
        <div className="max-w-7xl mx-auto min-h-full">
           {errorMessage && data && (
               <div className="mb-6 bg-red-900/20 border border-red-800 p-4 rounded-xl flex items-center gap-3 text-red-400 animate-in slide-in-from-top duration-300">
                   <AlertCircle size={20} />
                   <p className="font-medium">{errorMessage}</p>
                   <button onClick={() => setErrorMessage(null)} className="ml-auto p-1 hover:bg-red-900/40 rounded"><X size={16} /></button>
               </div>
           )}

           {configMissing && currentView !== 'settings' ? (
               <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
                   <div className="p-4 bg-amber-900/20 border border-amber-800/50 rounded-2xl">
                       <Database size={48} className="text-amber-500 mx-auto mb-4" />
                       <h2 className="text-2xl font-bold mb-2">Conexão Necessária</h2>
                       <p className="text-slate-400 max-w-md">As credenciais do Supabase não foram encontradas. Por favor, configure a URL e a Chave Anon para continuar.</p>
                   </div>
                   <button onClick={() => setCurrentView('settings')} className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-red-900/20">Ir para Configurações</button>
               </div>
           ) : (
            currentView === 'dashboard' ? <Dashboard data={appData} onChangeView={setCurrentView} onEditEvent={handleEditEventNavigation} /> :
            currentView === 'members' ? <MembersView members={appData.members} events={appData.events} championships={appData.championships} cities={appData.cities} onAdd={m => addItem('members', m)} onUpdate={m => updateItem('members', m)} onDelete={id => deleteItem('members', id)} /> :
            currentView === 'vehicles' ? <VehiclesView vehicles={appData.vehicles} onAdd={v => addItem('vehicles', v)} onUpdate={v => updateItem('vehicles', v)} onDelete={id => deleteItem('vehicles', id)} /> :
            currentView === 'cities' ? <CitiesView cities={appData.cities} events={appData.events} championships={appData.championships} onAdd={c => addItem('cities', c)} onUpdate={c => updateItem('cities', c)} onDelete={id => deleteItem('cities', id)} /> :
            currentView === 'championships' ? <ChampionshipsView championships={appData.championships} events={appData.events} cities={appData.cities} members={appData.members} onAdd={c => addItem('championships', c)} onUpdate={c => updateItem('championships', c)} onDelete={id => deleteItem('championships', id)} onUpdateEvent={e => updateItem('events', e)} onAddEvent={e => addItem('events', e)} /> :
            currentView === 'events' ? <EventsView data={appData} onAdd={e => addItem('events', e)} onUpdate={e => updateItem('events', e)} onDelete={id => deleteItem('events', id)} initialEditingId={editingEventId} onClearEditingId={() => setEditingEventId(null)} /> :
            currentView === 'settings' ? <SettingsView onDataChanged={loadData} /> : <Dashboard data={appData} onChangeView={setCurrentView} onEditEvent={handleEditEventNavigation} />
           )}
        </div>
      </main>
    </div>
  );
};

export default App;

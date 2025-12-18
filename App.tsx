
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/views/Dashboard';
import MembersView from './components/views/MembersView';
import CitiesView from './components/views/CitiesView';
import ChampionshipsView from './components/views/ChampionshipsView';
import EventsView from './components/views/EventsView';
import { ViewState, AppData, Member, City, Championship, Event } from './types';
import { Menu, X, Database as DbIcon, Loader2 } from 'lucide-react';
import { initDatabase, sqlInsert, sqlUpdate, sqlDelete, fetchAllData } from './services/databaseService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [data, setData] = useState<AppData | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  useEffect(() => {
    const setup = async () => {
      try {
        const initialData = await initDatabase();
        setData(initialData);
      } catch (error) {
        console.error("Erro ao inicializar SQLite:", error);
      } finally {
        setIsInitializing(false);
      }
    };
    setup();
  }, []);

  const refreshData = () => {
    setData(fetchAllData());
  };

  const addItem = (table: string, item: any) => {
    sqlInsert(table, item);
    refreshData();
  };

  const updateItem = (table: string, item: any) => {
    const { id, ...rest } = item;
    sqlUpdate(table, id, rest);
    refreshData();
  };

  const deleteItem = (key: keyof AppData, table: string, id: string) => {
    if (!data) return;
    if (table === 'championships' || table === 'cities') {
        const inUse = data.events.some(e => 
            (table === 'championships' && e.championshipId === id) || 
            (table === 'cities' && e.cityId === id)
        );
        if (inUse) {
            alert(`Não é possível excluir. Este item está vinculado a eventos existentes.`);
            return;
        }
    }
    sqlDelete(table, id);
    refreshData();
  };

  const handleEditEventNavigation = (id: string) => {
    setEditingEventId(id);
    setCurrentView('events');
  };

  if (isInitializing) {
    return (
      <div className="h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-8">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-red-600/20 blur-3xl rounded-full"></div>
          <div className="relative bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl flex flex-col items-center">
            <DbIcon size={64} className="text-red-600 mb-6 animate-pulse" />
            <Loader2 size={32} className="text-slate-400 animate-spin mb-4" />
            <h1 className="text-xl font-bold mb-2">RBC Race Manager</h1>
            <p className="text-slate-500 text-sm">Inicializando Banco de Dados SQL...</p>
          </div>
        </div>
      </div>
    );
  }

  const appData = data || { cities: [], championships: [], members: [], events: [] };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard data={appData} onChangeView={setCurrentView} onEditEvent={handleEditEventNavigation} />;
      case 'members':
        return (
          <MembersView 
            members={appData.members} 
            events={appData.events}
            championships={appData.championships}
            cities={appData.cities}
            onAdd={m => addItem('members', m)} 
            onUpdate={m => updateItem('members', m)} 
            onDelete={id => deleteItem('members', 'members', id)} 
          />
        );
      case 'cities':
        return (
          <CitiesView 
            cities={appData.cities} 
            events={appData.events}
            championships={appData.championships}
            onAdd={c => addItem('cities', c)} 
            onUpdate={c => updateItem('cities', c)} 
            onDelete={id => deleteItem('cities', 'cities', id)} 
          />
        );
      case 'championships':
        return (
          <ChampionshipsView 
            championships={appData.championships} 
            events={appData.events}
            cities={appData.cities}
            members={appData.members}
            onAdd={c => addItem('championships', c)} 
            onUpdate={c => updateItem('championships', c)} 
            onDelete={id => deleteItem('championships', 'championships', id)} 
            onUpdateEvent={e => updateItem('events', e)}
            onAddEvent={e => addItem('events', e)}
          />
        );
      case 'events':
        return (
            <EventsView 
                data={appData} 
                onAdd={e => addItem('events', e)} 
                onUpdate={e => updateItem('events', e)} 
                onDelete={id => deleteItem('events', 'events', id)}
                initialEditingId={editingEventId}
                onClearEditingId={() => setEditingEventId(null)}
            />
        );
      default:
        return <Dashboard data={appData} onChangeView={setCurrentView} onEditEvent={handleEditEventNavigation} />;
    }
  };

  return (
    <div className="h-screen bg-slate-950 flex text-slate-100 overflow-hidden">
      <div className="md:hidden fixed top-0 left-0 w-full bg-slate-900 border-b border-slate-800 text-white z-20 flex items-center justify-between p-4 shadow-md">
        <span className="font-bold text-lg">RBC Race Manager</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <div className={`
        fixed inset-0 z-20 bg-black/50 transition-opacity md:hidden
        ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `} onClick={() => setIsMobileMenuOpen(false)}></div>
      
      <div className={`
        fixed md:static inset-y-0 left-0 z-30 transition-transform duration-300 transform md:transform-none
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
         <Sidebar currentView={currentView} onChangeView={(view) => { setCurrentView(view); setIsMobileMenuOpen(false); }} />
      </div>

      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto h-full scrollbar-hide bg-slate-950">
        <div className="max-w-7xl mx-auto min-h-full">
           {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;

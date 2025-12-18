
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/views/Dashboard';
import MembersView from './components/views/MembersView';
import CitiesView from './components/views/CitiesView';
import ChampionshipsView from './components/views/ChampionshipsView';
import EventsView from './components/views/EventsView';
import AIAssistantView from './components/views/AIAssistantView';
import { ViewState, AppData, Member, City, Championship, Event } from './types';
import { Menu, X } from 'lucide-react';

const INITIAL_DATA: AppData = {
  cities: [],
  championships: [],
  members: [],
  events: []
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [data, setData] = useState<AppData>(() => {
    try {
      const saved = localStorage.getItem('racetrack_data');
      if (!saved) return INITIAL_DATA;
      
      const parsed = JSON.parse(saved);
      // Basic validation to ensure structure is correct
      return {
        cities: Array.isArray(parsed.cities) ? parsed.cities : [],
        championships: Array.isArray(parsed.championships) ? parsed.championships : [],
        members: Array.isArray(parsed.members) ? parsed.members : [],
        events: Array.isArray(parsed.events) ? parsed.events : []
      };
    } catch (error) {
      console.error("Erro ao carregar dados do LocalStorage:", error);
      return INITIAL_DATA;
    }
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // State to handle "Edit on Click" from Dashboard
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('racetrack_data', JSON.stringify(data));
    } catch (error) {
      console.error("Erro ao salvar dados no LocalStorage:", error);
    }
  }, [data]);

  // Generic Handlers
  const addItem = (key: keyof AppData, item: any) => {
    setData(prev => ({ ...prev, [key]: [...prev[key], item] }));
  };

  const updateItem = (key: keyof AppData, item: any) => {
    setData(prev => ({
      ...prev,
      [key]: (prev[key] as any[]).map(i => i.id === item.id ? item : i)
    }));
  };

  const deleteItem = (key: keyof AppData, id: string) => {
    if (key === 'championships' || key === 'cities') {
        // Prevent deletion if in use (simple check)
        const inUse = data.events.some(e => 
            (key === 'championships' && e.championshipId === id) || 
            (key === 'cities' && e.cityId === id)
        );
        if (inUse) {
            alert(`Não é possível excluir. Este item está vinculado a eventos existentes.`);
            return;
        }
    }
    setData(prev => ({
      ...prev,
      [key]: (prev[key] as any[]).filter(i => i.id !== id)
    }));
  };

  const handleBulkImport = (newEvents: Event[], newChamps: Championship[], newCities: City[], newMembers: Member[]) => {
      setData(prev => ({
          events: [...prev.events, ...newEvents],
          championships: [...prev.championships, ...newChamps],
          cities: [...prev.cities, ...newCities],
          members: [...prev.members, ...newMembers]
      }));
      setCurrentView('events');
  };

  // Action to navigate to edit specific event
  const handleEditEventNavigation = (id: string) => {
    setEditingEventId(id);
    setCurrentView('events');
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard data={data} onChangeView={setCurrentView} onEditEvent={handleEditEventNavigation} />;
      case 'members':
        return (
          <MembersView 
            members={data.members} 
            events={data.events}
            championships={data.championships}
            cities={data.cities}
            onAdd={m => addItem('members', m)} 
            onUpdate={m => updateItem('members', m)} 
            onDelete={id => deleteItem('members', id)} 
          />
        );
      case 'cities':
        return (
          <CitiesView 
            cities={data.cities} 
            events={data.events}
            championships={data.championships}
            onAdd={c => addItem('cities', c)} 
            onUpdate={c => updateItem('cities', c)} 
            onDelete={id => deleteItem('cities', id)} 
          />
        );
      case 'championships':
        return (
          <ChampionshipsView 
            championships={data.championships} 
            events={data.events}
            cities={data.cities}
            members={data.members}
            onAdd={c => addItem('championships', c)} 
            onUpdate={c => updateItem('championships', c)} 
            onDelete={id => deleteItem('championships', id)} 
            onUpdateEvent={e => updateItem('events', e)}
            onAddEvent={e => addItem('events', e)}
          />
        );
      case 'events':
        return (
            <EventsView 
                data={data} 
                onAdd={e => addItem('events', e)} 
                onUpdate={e => updateItem('events', e)} 
                onDelete={id => deleteItem('events', id)}
                initialEditingId={editingEventId}
                onClearEditingId={() => setEditingEventId(null)}
            />
        );
      case 'ai-import':
        return <AIAssistantView data={data} onImportEvents={handleBulkImport} />;
      default:
        return <Dashboard data={data} onChangeView={setCurrentView} onEditEvent={handleEditEventNavigation} />;
    }
  };

  return (
    <div className="h-screen bg-slate-950 flex text-slate-100 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-slate-900 border-b border-slate-800 text-white z-20 flex items-center justify-between p-4 shadow-md">
        <span className="font-bold text-lg">RBC Race Manager</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar (Desktop & Mobile Overlay) */}
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

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 pt-20 md:pt-8 overflow-y-auto h-full scrollbar-hide bg-slate-950">
        <div className="max-w-7xl mx-auto min-h-full">
           {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;

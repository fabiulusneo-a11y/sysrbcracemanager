
import React from 'react';
import { LayoutDashboard, Calendar, Trophy, Users, MapPin, BrainCircuit, PlusCircle } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  const mainItems: { id: ViewState; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'events', label: 'Calendário de Eventos', icon: Calendar },
    { id: 'championships', label: 'Campeonatos', icon: Trophy },
    { id: 'members', label: 'Integrantes', icon: Users },
    { id: 'cities', label: 'Cidades', icon: MapPin },
  ];

  const actionItems: { id: ViewState; label: string; icon: React.ElementType }[] = [
    { id: 'ai-import', label: 'Importação Inteligente', icon: BrainCircuit },
  ];

  const renderLink = (item: { id: ViewState; label: string; icon: React.ElementType }) => {
    const Icon = item.icon;
    const isActive = currentView === item.id;
    return (
        <button
          key={item.id}
          onClick={() => onChangeView(item.id)}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
            isActive 
              ? 'bg-red-600 text-white shadow-lg shadow-red-900/50' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Icon size={20} />
          <span className="font-medium text-sm">{item.label}</span>
        </button>
    );
  }

  return (
    <div className="w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col h-full border-r border-slate-800">
      <div className="p-6 flex items-center space-x-2 border-b border-slate-800">
        <div className="w-8 h-8 bg-red-600 rounded-md flex items-center justify-center transform -skew-x-12">
            <span className="font-bold text-white skew-x-12">R</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight">RBC Race Manager</h1>
      </div>
      
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Menu Principal
        </div>
        {mainItems.map(renderLink)}

        <div className="mt-8 px-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Ações Rápidas
        </div>
        {/* Shortcut to new event (uses events view but labelled differently) */}
        <button
          onClick={() => onChangeView('events')}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <PlusCircle size={20} />
          <span className="font-medium text-sm">Novo Evento Manual</span>
        </button>
        {actionItems.map(renderLink)}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center space-x-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold">
            TM
          </div>
          <div>
            <p className="text-sm font-medium text-white">Team Manager</p>
            <p className="text-xs text-slate-400">Admin</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;


import React from 'react';
import { LayoutDashboard, Calendar, Trophy, Users, MapPin, PlusCircle, Settings, LogOut } from 'lucide-react';
import { ViewState } from '../types';
import { signOut } from '../services/databaseService';

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

  const handleSignOut = async () => {
    if (confirm("Deseja realmente sair do sistema?")) {
        try {
            await signOut();
            // Força o recarregamento para limpar estados da memória e garantir redirecionamento
            window.location.reload();
        } catch (e) {
            console.error("Erro ao sair:", e);
            // Mesmo com erro no servidor, forçamos o reload para tentar limpar o estado local
            window.location.reload();
        }
    }
  };

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
        <h1 className="text-xl font-bold tracking-tight uppercase">RBC Motorsport</h1>
      </div>
      
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <div className="px-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Menu Principal
        </div>
        {mainItems.map(renderLink)}

        <div className="mt-8 px-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Sistema
        </div>
        <button
          onClick={() => onChangeView('settings')}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 mb-1 ${
            currentView === 'settings' 
              ? 'bg-slate-700 text-white' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Settings size={20} />
          <span className="font-medium text-sm">Configurações</span>
        </button>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 text-slate-400 hover:bg-red-900/20 hover:text-red-400"
        >
          <LogOut size={20} />
          <span className="font-medium text-sm">Sair do Sistema</span>
        </button>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center space-x-3 p-3 bg-slate-800 rounded-lg border border-slate-700">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center text-[10px] font-black">
            RBC
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">Gerenciador</p>
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Acesso Autorizado</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

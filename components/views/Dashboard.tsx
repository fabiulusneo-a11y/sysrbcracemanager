
import React from 'react';
import { AppData, Event } from '../../types';
import { CalendarDays, MapPin, Users, Trophy, ChevronRight, CheckCircle, HelpCircle } from 'lucide-react';

interface DashboardProps {
  data: AppData;
  onChangeView: (view: any) => void;
  onEditEvent?: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ data, onChangeView, onEditEvent }) => {
  // Helper to safely parse date string "YYYY-MM-DD" to local date object for display/logic
  const getDisplayDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // 1. Filter events starting from today
  const futureEvents = [...data.events]
    .filter(e => {
        const eventDate = getDisplayDate(e.date);
        const today = new Date();
        today.setHours(0,0,0,0);
        return eventDate >= today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 2. Group events by date string (YYYY-MM-DD)
  const groupedEvents: Record<string, Event[]> = {};
  futureEvents.forEach(event => {
      if (!groupedEvents[event.date]) {
          groupedEvents[event.date] = [];
      }
      groupedEvents[event.date].push(event);
  });

  // 3. Take all unique dates in chronological order (guaranteed by futureEvents sort)
  const upcomingDates = Array.from(new Set(futureEvents.map(e => e.date)));

  const stats = [
    { label: 'Eventos Futuros', value: futureEvents.length, icon: CalendarDays, color: 'bg-blue-600', textColor: 'text-blue-100' },
    { label: 'Integrantes Ativos', value: data.members.filter(m => m.active !== false).length, icon: Users, color: 'bg-green-600', textColor: 'text-green-100' },
    { label: 'Campeonatos', value: data.championships.length, icon: Trophy, color: 'bg-yellow-600', textColor: 'text-yellow-100' },
    { label: 'Cidades Cadastradas', value: data.cities.length, icon: MapPin, color: 'bg-purple-600', textColor: 'text-purple-100' },
  ];

  const getChampName = (id: string) => data.championships.find(c => c.id === id)?.name || 'Desconhecido';
  const getCityInfo = (id: string) => {
    const city = data.cities.find(c => c.id === id);
    return city ? `${city.name} - ${city.state}` : 'Local a definir';
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Visão Geral</h2>
          <p className="text-slate-400">Bem-vindo ao painel de controle.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800 flex items-center space-x-4">
            <div className={`${stat.color} p-3 rounded-lg ${stat.textColor}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-100">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-6">
        <div className="w-full bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/20">
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              <CalendarDays className="text-red-500" size={20} />
              Próximas Corridas
            </h3>
            <button onClick={() => onChangeView('events')} className="text-sm text-red-500 font-medium hover:text-red-400 flex items-center gap-1">
                Ver todas <ChevronRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-slate-800 max-h-[700px] overflow-y-auto">
            {upcomingDates.length === 0 ? (
              <div className="p-12 text-center text-slate-500 italic">Nenhum evento futuro agendado.</div>
            ) : (
              upcomingDates.map((dateKey) => {
                const dateObj = getDisplayDate(dateKey);
                const eventsOnThisDate = groupedEvents[dateKey];

                return (
                    <div key={dateKey} className="p-4 flex flex-col sm:flex-row gap-4 items-start hover:bg-slate-950/30 transition-colors">
                        {/* Date Column */}
                        <div className="bg-slate-800 text-red-500 flex flex-col items-center justify-center w-14 h-14 rounded-lg border border-slate-700 flex-shrink-0 shadow-inner">
                            <span className="text-[10px] font-bold uppercase tracking-tighter">{dateObj.toLocaleString('pt-BR', { month: 'short' })}</span>
                            <span className="text-2xl font-bold leading-none">{dateObj.getDate()}</span>
                        </div>
                        
                        {/* Events Container - Side by Side */}
                        <div className="flex-grow flex flex-wrap gap-3 w-full">
                            {eventsOnThisDate.map(event => {
                                const isConfirmed = event.confirmed !== false;
                                return (
                                    <div 
                                        key={event.id}
                                        onClick={() => onEditEvent && onEditEvent(event.id)} 
                                        className="flex-1 min-w-[280px] bg-slate-800/40 hover:bg-slate-700/60 border border-slate-700/50 rounded-lg p-4 cursor-pointer transition-all group flex justify-between items-center shadow-sm"
                                        title="Clique para editar"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-slate-200 text-sm">{getChampName(event.championshipId)}</h4>
                                                <span className={`flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                                                    isConfirmed ? 'bg-green-900/20 text-green-400 border-green-800/50' : 'bg-amber-900/20 text-amber-500 border-amber-800/50'
                                                }`}>
                                                    {isConfirmed ? <CheckCircle size={8} /> : <HelpCircle size={8} />}
                                                    {isConfirmed ? 'Confirmado' : 'Indefinido'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 font-medium">{event.stage}</p>
                                            <div className="flex items-center gap-1.5 mt-2 text-slate-500">
                                                <MapPin size={12} className="text-slate-600" />
                                                <span className="text-[11px]">{getCityInfo(event.cityId)}</span>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-700 group-hover:text-red-500 transition-all transform group-hover:translate-x-1" />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

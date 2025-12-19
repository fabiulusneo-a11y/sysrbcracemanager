
import React, { useState } from 'react';
import { Championship, Event, City, Member } from '../../types';
import { Plus, Trash2, Edit2, Trophy, ArrowLeft, Calendar, MapPin, CheckCircle, HelpCircle, X, ToggleLeft, ToggleRight, Users, AlertCircle, Check } from 'lucide-react';

interface ChampionshipsViewProps {
  championships: Championship[];
  events: Event[];
  cities: City[];
  members: Member[];
  onAdd: (champ: Championship) => void;
  onUpdate: (champ: Championship) => void;
  onDelete: (id: string) => void;
  onUpdateEvent: (event: Event) => void;
  onAddEvent: (event: Event) => void;
}

const ChampionshipsView: React.FC<ChampionshipsViewProps> = ({ 
    championships, 
    events, 
    cities, 
    members,
    onAdd, 
    onUpdate, 
    onDelete, 
    onUpdateEvent,
    onAddEvent
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedChampId, setSelectedChampId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '' });

  // Event Editing/Adding Modal State
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [newEventData, setNewEventData] = useState<Omit<Event, 'id'>>({
    championshipId: '',
    cityId: '',
    date: new Date().toISOString().split('T')[0],
    stage: '',
    memberIds: [],
    confirmed: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate({ id: editingId, ...formData });
    } else {
      onAdd({ id: crypto.randomUUID(), ...formData });
    }
    closeModal();
  };

  const openModal = (champ?: Championship) => {
    if (champ) {
      setEditingId(champ.id);
      setFormData({ name: champ.name });
    } else {
      setEditingId(null);
      setFormData({ name: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '' });
  };

  const openAddEventModal = () => {
    if (!selectedChampId) return;
    setNewEventData({
        championshipId: selectedChampId,
        cityId: cities[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        stage: `Etapa ${(events.filter(e => e.championshipId === selectedChampId).length + 1)}`,
        memberIds: [],
        confirmed: true
    });
    setIsAddEventModalOpen(true);
  };

  const handleAddEventSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onAddEvent({ id: crypto.randomUUID(), ...newEventData });
      setIsAddEventModalOpen(false);
  };

  const handleEventUpdateSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingEvent) {
          onUpdateEvent(editingEvent);
          setEditingEvent(null);
      }
  };

  const getCityName = (id: string) => {
    const c = cities.find(city => city.id === id);
    return c ? `${c.name} - ${c.state}` : 'N/A';
  };

  const getChampName = (id: string) => championships.find(c => c.id === id)?.name || 'N/A';

  const getDisplayDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Availability Logic for member selection
  const getConflictingEvent = (memberId: string, date: string, excludeEventId?: string) => {
    if (!date) return null;
    return events.find(e => 
      e.date === date && 
      e.id !== excludeEventId && 
      e.memberIds.includes(memberId)
    );
  };

  const toggleMemberInNewEvent = (memberId: string) => {
    const conflict = getConflictingEvent(memberId, newEventData.date);
    if (conflict && !newEventData.memberIds.includes(memberId)) return;

    setNewEventData(prev => {
        const ids = prev.memberIds.includes(memberId)
            ? prev.memberIds.filter(id => id !== memberId)
            : [...prev.memberIds, memberId];
        return { ...prev, memberIds: ids };
    });
  };

  const toggleMemberInEditingEvent = (memberId: string) => {
    if (!editingEvent) return;
    const conflict = getConflictingEvent(memberId, editingEvent.date, editingEvent.id);
    if (conflict && !editingEvent.memberIds.includes(memberId)) return;

    setEditingEvent(prev => {
        if (!prev) return null;
        const ids = prev.memberIds.includes(memberId)
            ? prev.memberIds.filter(id => id !== memberId)
            : [...prev.memberIds, memberId];
        return { ...prev, memberIds: ids };
    });
  };

  const sortedChampionships = [...championships].sort((a, b) => 
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

  const sortedCities = [...cities].sort((a, b) => 
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

  // Sort Members alphabetically for the lists
  const sortedMembersList = [...members].sort((a, b) => 
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

  if (selectedChampId) {
    const selectedChamp = championships.find(c => c.id === selectedChampId);
    const champEvents = events
        .filter(e => e.championshipId === selectedChampId)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setSelectedChampId(null)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">{selectedChamp?.name}</h2>
                    <p className="text-slate-400">Calendário Completo de Provas</p>
                </div>
            </div>
            <button 
                onClick={openAddEventModal}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-bold shadow-lg shadow-red-900/20"
            >
                <Plus size={18} />
                Adicionar Nova Etapa
            </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
            {champEvents.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                    <Calendar className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                    <p className="text-slate-500">Nenhuma etapa cadastrada para este campeonato.</p>
                </div>
            ) : (
                champEvents.map(event => {
                    const d = getDisplayDate(event.date);
                    const isConfirmed = event.confirmed !== false;
                    return (
                        <div key={event.id} className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-6 group hover:border-red-500/30 transition-all">
                             <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 bg-slate-800 rounded-lg border border-slate-700">
                                <span className="text-xs font-bold text-red-500 uppercase">{d.toLocaleDateString('pt-BR', { month: 'short' })}</span>
                                <span className="text-2xl font-bold text-white leading-none">{d.getDate()}</span>
                            </div>
                            <div className="flex-grow">
                                <div className="flex items-center gap-3">
                                    <h4 className="font-bold text-slate-200 text-lg">{event.stage}</h4>
                                    <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                                        isConfirmed ? 'bg-green-900/20 text-green-400 border-green-800/50' : 'bg-amber-900/20 text-amber-500 border-amber-800/50'
                                    }`}>
                                        {isConfirmed ? <CheckCircle size={10} /> : <HelpCircle size={10} />}
                                        {isConfirmed ? 'Confirmado' : 'Indefinido'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                                    <MapPin size={14} className="text-slate-500" />
                                    {getCityName(event.cityId)}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                <button 
                                    onClick={() => setEditingEvent({ ...event })}
                                    className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                                >
                                    <Edit2 size={16} />
                                    <span>Alterar</span>
                                </button>
                            </div>
                        </div>
                    );
                })
            )}
        </div>

        {/* Modal: Adicionar Evento */}
        {isAddEventModalOpen && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
                <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 sticky top-0 z-10">
                        <h3 className="font-bold text-slate-100 flex items-center gap-2">
                            <Plus size={18} className="text-red-500" />
                            Nova Etapa: {selectedChamp?.name}
                        </h3>
                        <button onClick={() => setIsAddEventModalOpen(false)} className="text-slate-500 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleAddEventSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome da Etapa</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 outline-none"
                                    value={newEventData.stage}
                                    onChange={e => setNewEventData({ ...newEventData, stage: e.target.value })}
                                    placeholder="Ex: Etapa 5"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Data</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 outline-none [color-scheme:dark]"
                                    value={newEventData.date}
                                    onChange={e => setNewEventData({ ...newEventData, date: e.target.value, memberIds: [] })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cidade / Local</label>
                            <select
                                required
                                className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 outline-none"
                                value={newEventData.cityId}
                                onChange={e => setNewEventData({ ...newEventData, cityId: e.target.value })}
                            >
                                <option value="" disabled>Selecione uma cidade...</option>
                                {sortedCities.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} - {c.state}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Confirmação</label>
                            <button
                                type="button"
                                onClick={() => setNewEventData({ ...newEventData, confirmed: !newEventData.confirmed })}
                                className={`w-full flex items-center justify-between rounded-lg border p-2.5 transition-colors ${
                                    newEventData.confirmed ? 'bg-green-900/10 border-green-800/50 text-green-400' : 'bg-amber-900/10 border-amber-800/50 text-amber-500'
                                }`}
                            >
                                <div className="flex items-center gap-2 text-sm font-bold uppercase">
                                    {newEventData.confirmed ? <CheckCircle size={18} /> : <HelpCircle size={18} />}
                                    {newEventData.confirmed ? 'Confirmado' : 'Indefinido'}
                                </div>
                                {newEventData.confirmed ? <ToggleRight className="text-green-500" /> : <ToggleLeft className="text-amber-600" />}
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Integrantes Disponíveis</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border border-slate-700 rounded-lg p-3 bg-slate-950 max-h-48 overflow-y-auto">
                                {sortedMembersList.filter(m => m.active).map(member => {
                                    const isSelected = newEventData.memberIds.includes(member.id);
                                    const conflict = getConflictingEvent(member.id, newEventData.date);
                                    const isUnavailable = !!conflict;
                                    
                                    return (
                                        <div 
                                            key={member.id}
                                            onClick={() => !isUnavailable && toggleMemberInNewEvent(member.id)}
                                            className={`p-2 rounded border flex flex-col gap-0.5 transition-all select-none text-xs
                                                ${isSelected ? 'bg-red-900/30 border-red-800 text-red-300' : 'bg-slate-900 border-slate-800 text-slate-400'}
                                                ${isUnavailable ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer hover:border-slate-600'}
                                            `}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold truncate">{member.name}</span>
                                                {isSelected && <Check size={12} />}
                                                {isUnavailable && <AlertCircle size={12} className="text-red-500" />}
                                            </div>
                                            <span className="text-[10px] text-slate-500">{member.role}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                            <button type="button" onClick={() => setIsAddEventModalOpen(false)} className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors font-medium">Cancelar</button>
                            <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition-colors shadow-lg shadow-red-900/20">Salvar Etapa</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Modal: Editar Evento Existente (Full Version) */}
        {editingEvent && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
                <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 sticky top-0 z-10">
                        <h3 className="font-bold text-slate-100 flex items-center gap-2">
                            <Edit2 size={18} className="text-red-500" />
                            Editar {editingEvent.stage}
                        </h3>
                        <button onClick={() => setEditingEvent(null)} className="text-slate-500 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleEventUpdateSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome da Etapa</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 outline-none"
                                    value={editingEvent.stage}
                                    onChange={e => setEditingEvent({ ...editingEvent, stage: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Data</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 outline-none [color-scheme:dark]"
                                    value={editingEvent.date}
                                    onChange={e => setEditingEvent({ ...editingEvent, date: e.target.value, memberIds: [] })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cidade / Local</label>
                            <select
                                required
                                className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 outline-none"
                                value={editingEvent.cityId}
                                onChange={e => setEditingEvent({ ...editingEvent, cityId: e.target.value })}
                            >
                                {sortedCities.map(c => (
                                    <option key={c.id} value={c.id}>{c.name} - {c.state}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Status da Etapa</label>
                            <button
                                type="button"
                                onClick={() => setEditingEvent({ ...editingEvent, confirmed: !editingEvent.confirmed })}
                                className={`w-full flex items-center justify-between rounded-lg border p-2.5 transition-colors ${
                                    editingEvent.confirmed ? 'bg-green-900/10 border-green-800/50 text-green-400' : 'bg-amber-900/10 border-amber-800/50 text-amber-500'
                                }`}
                            >
                                <div className="flex items-center gap-2 text-sm font-bold uppercase">
                                    {editingEvent.confirmed ? <CheckCircle size={18} /> : <HelpCircle size={18} />}
                                    {editingEvent.confirmed ? 'Confirmado' : 'Indefinido'}
                                </div>
                                {editingEvent.confirmed ? <ToggleRight className="text-green-500" /> : <ToggleLeft className="text-amber-600" />}
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Escala de Integrantes</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border border-slate-700 rounded-lg p-3 bg-slate-950 max-h-48 overflow-y-auto">
                                {sortedMembersList.filter(m => m.active || editingEvent.memberIds.includes(m.id)).map(member => {
                                    const isSelected = editingEvent.memberIds.includes(member.id);
                                    const conflict = getConflictingEvent(member.id, editingEvent.date, editingEvent.id);
                                    const isUnavailable = !!conflict;
                                    
                                    return (
                                        <div 
                                            key={member.id}
                                            onClick={() => !isUnavailable && toggleMemberInEditingEvent(member.id)}
                                            className={`p-2 rounded border flex flex-col gap-0.5 transition-all select-none text-xs
                                                ${isSelected ? 'bg-red-900/30 border-red-800 text-red-300' : 'bg-slate-900 border-slate-800 text-slate-400'}
                                                ${isUnavailable ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer hover:border-slate-600'}
                                                ${!member.active ? 'border-dashed' : ''}
                                            `}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold truncate">{member.name} {!member.active && '(Inativo)'}</span>
                                                {isSelected && <Check size={12} />}
                                                {/* Fixed: Wrapped AlertCircle in a span with the title attribute to fix property error */}
                                                {isUnavailable && conflict && (
                                                    <span title={`Já escalado em: ${getChampName(conflict.championshipId)}`}>
                                                        <AlertCircle size={12} className="text-red-500" />
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-[10px] text-slate-500">{member.role}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                            <button type="button" onClick={() => setEditingEvent(null)} className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors font-medium">Descartar</button>
                            <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition-colors shadow-lg shadow-red-900/20">Salvar Alterações</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Campeonatos</h2>
          <p className="text-slate-400">Lista de Campeonatos</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          <span>Novo Campeonato</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedChampionships.map((champ) => (
          <div key={champ.id} className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 p-5 hover:border-red-500/50 transition-colors group relative">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSelectedChampId(champ.id)}>
                    <div className="w-10 h-10 rounded-lg bg-amber-900/30 border border-amber-900/50 text-amber-500 flex items-center justify-center">
                        <Trophy size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-200 hover:text-red-500 transition-colors">{champ.name}</h3>
                    </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 shadow-sm p-1 rounded-lg border border-slate-700">
                    <button onClick={(e) => { e.stopPropagation(); openModal(champ); }} className="p-1.5 text-slate-400 hover:text-blue-400 rounded">
                        <Edit2 size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(champ.id); }} className="p-1.5 text-slate-400 hover:text-red-400 rounded">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
          </div>
        ))}
        {sortedChampionships.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-800 rounded-xl text-slate-500">
                Nenhum campeonato ativo.
            </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4 text-white">{editingId ? 'Editar Campeonato' : 'Novo Campeonato'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome do Campeonato</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Campeonato Verde"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChampionshipsView;

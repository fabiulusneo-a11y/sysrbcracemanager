
import React, { useState } from 'react';
import { Member, Event, Championship, City } from '../../types';
import { Plus, Trash2, Edit2, User, ArrowLeft, Calendar, MapPin, Trophy, ToggleLeft, ToggleRight } from 'lucide-react';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';

interface MembersViewProps {
  members: Member[];
  events: Event[];
  championships: Championship[];
  cities: City[];
  onAdd: (member: Member) => void;
  onUpdate: (member: Member) => void;
  onDelete: (id: string) => void;
}

const MembersView: React.FC<MembersViewProps> = ({ members, events, championships, cities, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', role: '', active: true });
  
  // Novo estado para exclusão
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; member: Member | null }>({
    isOpen: false,
    member: null
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

  const openModal = (member?: Member) => {
    if (member) {
      setEditingId(member.id);
      setFormData({ 
        name: member.name, 
        role: member.role, 
        active: member.active !== undefined ? member.active : true 
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', role: '', active: true });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', role: '', active: true });
  };

  const getChampName = (id: string) => championships.find(c => c.id === id)?.name || 'N/A';
  const getCityName = (id: string) => {
      const c = cities.find(city => city.id === id);
      return c ? `${c.name} - ${c.state}` : 'N/A';
  };
  const getDisplayDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const sortedMembers = [...members].sort((a, b) => 
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

  if (selectedMemberId) {
    const selectedMember = members.find(m => m.id === selectedMemberId);
    const memberEvents = events
        .filter(e => e.memberIds.includes(selectedMemberId))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setSelectedMemberId(null)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-slate-100">{selectedMember?.name}</h2>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            selectedMember?.active ? 'bg-green-900/20 text-green-400 border-green-800' : 'bg-slate-800 text-slate-500 border-slate-700'
                        }`}>
                            {selectedMember?.active ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-slate-400">{selectedMember?.role}</p>
                      <span className="text-slate-600">•</span>
                      <p className="text-red-500 font-bold text-sm">
                        {memberEvents.length} {memberEvents.length === 1 ? 'evento agendado' : 'eventos agendados'}
                      </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {memberEvents.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                        <Calendar className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                        <p className="text-slate-500">Este integrante ainda não foi convocado para nenhum evento.</p>
                    </div>
                ) : (
                    memberEvents.map(event => {
                        const d = getDisplayDate(event.date);
                        return (
                            <div key={event.id} className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex items-center gap-6">
                                <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 bg-slate-800 rounded-lg border border-slate-700">
                                    <span className="text-xs font-bold text-red-500 uppercase">{d.toLocaleDateString('pt-BR', { month: 'short' })}</span>
                                    <span className="text-2xl font-bold text-white leading-none">{d.getDate()}</span>
                                </div>
                                <div className="flex-grow space-y-1">
                                    <div className="flex items-center gap-2 text-amber-500">
                                        <Trophy size={14} />
                                        <span className="text-xs font-bold uppercase tracking-wider">{getChampName(event.championshipId)}</span>
                                    </div>
                                    <h4 className="font-bold text-slate-200 text-lg">{event.stage}</h4>
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <MapPin size={14} className="text-slate-500" />
                                        {getCityName(event.cityId)}
                                    </div>
                                </div>
                                <div className="hidden md:block">
                                    <span className="px-3 py-1 bg-red-900/20 text-red-400 border border-red-900/50 rounded-full text-xs font-bold uppercase">
                                        Convocado
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-100">Integrantes</h2>
          <p className="text-slate-400">Gestão da equipe técnica e pilotos.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          <span>Novo Integrante</span>
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-950 border-b border-slate-800">
                <th className="p-4 font-semibold text-slate-400 text-sm">Nome</th>
                <th className="p-4 font-semibold text-slate-400 text-sm">Função</th>
                <th className="p-4 font-semibold text-slate-400 text-sm">Status</th>
                <th className="p-4 font-semibold text-slate-400 text-sm text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
                {sortedMembers.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500">Nenhum integrante cadastrado.</td>
                    </tr>
                ) : (
                    sortedMembers.map((member) => (
                    <tr key={member.id} className={`hover:bg-slate-800/50 group transition-colors ${!member.active ? 'opacity-60' : ''}`}>
                        <td className="p-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${member.active ? 'bg-slate-800 text-slate-500' : 'bg-slate-900 text-slate-700'}`}>
                                <User size={16} />
                            </div>
                            <span 
                                className={`font-medium cursor-pointer hover:text-red-500 transition-colors ${member.active ? 'text-slate-200' : 'text-slate-500 italic'}`}
                                onClick={() => setSelectedMemberId(member.id)}
                            >
                                {member.name}
                            </span>
                        </div>
                        </td>
                        <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            member.active ? 'bg-blue-900/30 text-blue-300 border-blue-900/50' : 'bg-slate-800/50 text-slate-500 border-slate-700'
                        }`}>
                            {member.role}
                        </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                              member.active ? 'text-green-500 border-green-900/50' : 'text-slate-500 border-slate-800'
                          }`}>
                              {member.active ? 'Ativo' : 'Desligado'}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); openModal(member); }} 
                                title="Editar" 
                                className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, member }); }} 
                                title="Excluir" 
                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                        </td>
                    </tr>
                    ))
                )}
            </tbody>
            </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4 text-white">{editingId ? 'Editar Integrante' : 'Novo Integrante'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: João Silva"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Função</label>
                    <select
                    required
                    className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    >
                        <option value="" disabled>Selecione...</option>
                        <option value="Piloto">Piloto</option>
                        <option value="Mecânico">Mecânico</option>
                        <option value="Chefe de Equipe">Chefe de Equipe</option>
                        <option value="Telemetrista">Telemetrista</option>
                        <option value="Apoio">Apoio</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                    <button
                        type="button"
                        onClick={() => setFormData({ ...formData, active: !formData.active })}
                        className={`w-full flex items-center justify-between rounded-lg border p-2.5 transition-colors ${
                            formData.active ? 'bg-green-900/10 border-green-800/50 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                    >
                        <span className="text-sm font-medium">{formData.active ? 'Ativo' : 'Inativo'}</span>
                        {formData.active ? <ToggleRight className="text-green-500" /> : <ToggleLeft className="text-slate-600" />}
                    </button>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Exclusão customizado */}
      <DeleteConfirmModal 
        isOpen={deleteModal.isOpen}
        itemName={deleteModal.member?.name || ''}
        title="Excluir Integrante"
        description="Ao excluir este integrante, ele será removido permanentemente da lista. Verifique se não há eventos pendentes vinculados."
        onClose={() => setDeleteModal({ isOpen: false, member: null })}
        onConfirm={() => deleteModal.member && onDelete(deleteModal.member.id)}
      />
    </div>
  );
};

export default MembersView;

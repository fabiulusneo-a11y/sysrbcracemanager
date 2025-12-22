
import React, { useState } from 'react';
// Changed Equipment to Model as it is the correctly exported member from types
import { Model } from '../../types';
import { Plus, Trash2, Edit2, Package, Search, ChevronDown, Tag, ShieldCheck } from 'lucide-react';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';

interface EquipmentsViewProps {
  equipments: Model[];
  onAdd: (equipment: Model) => void;
  onUpdate: (equipment: Model) => void;
  onDelete: (id: string | number) => void;
}

const EquipmentsView: React.FC<EquipmentsViewProps> = ({ equipments, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formData, setFormData] = useState<{type: string, brand: string, model: string}>({ 
    type: '', 
    brand: '',
    model: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; equipment: Model | null }>({
    isOpen: false,
    equipment: null
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate({ id: editingId, ...formData });
    } else {
      onAdd({ id: 'new', ...formData });
    }
    closeModal();
  };

  const openModal = (equipment?: Model) => {
    if (equipment) {
      setEditingId(equipment.id);
      setFormData({ 
        type: equipment.type, 
        brand: equipment.brand || '',
        model: equipment.model || ''
      });
    } else {
      setEditingId(null);
      setFormData({ type: '', brand: '', model: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ type: '', brand: '', model: '' });
  };

  const filteredEquipments = equipments.filter(e => 
    e.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.model.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => String(a.type).localeCompare(String(b.type)));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 uppercase tracking-tight italic">Equipamentos RBC</h2>
          <p className="text-slate-400 text-sm">Gestão de ferramentas e ativos técnicos.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold shadow-lg shadow-red-900/40 active:scale-95"
        >
          <Plus size={18} />
          <span>Cadastrar Equipamento</span>
        </button>
      </div>

      <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
        <div className="p-4 bg-slate-950/50 border-b border-slate-800">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                    type="text" 
                    placeholder="Filtrar por tipo, marca ou modelo..." 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800">
                <th className="p-5 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Tipo</th>
                <th className="p-5 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Marca</th>
                <th className="p-5 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Modelo</th>
                <th className="p-5 font-bold text-slate-500 text-[10px] uppercase tracking-widest text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
                {filteredEquipments.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="p-12 text-center text-slate-500 italic text-sm">Nenhum equipamento registrado na base de dados.</td>
                    </tr>
                ) : (
                    filteredEquipments.map((eq) => (
                    <tr key={eq.id} className="hover:bg-slate-800/40 group transition-colors">
                        <td className="p-5">
                            <div className="flex items-center gap-4">
                                <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700 shadow-inner group-hover:border-slate-600 transition-colors">
                                    <Package className="text-blue-500" size={20} />
                                </div>
                                <span className="font-bold text-slate-100 uppercase tracking-tight">{eq.type}</span>
                            </div>
                        </td>
                        <td className="p-5">
                            <span className="text-sm text-slate-400 font-bold uppercase">{eq.brand || '---'}</span>
                        </td>
                        <td className="p-5">
                            <span className="text-sm text-slate-400 font-bold uppercase tracking-tight">{eq.model || '---'}</span>
                        </td>
                        <td className="p-5 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-2">
                            <button 
                                type="button"
                                onClick={() => openModal(eq)} 
                                className="p-2.5 text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-xl transition-all"
                                title="Editar"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                type="button"
                                onClick={() => setDeleteModal({ isOpen: true, equipment: eq })} 
                                className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-xl transition-all"
                                title="Remover"
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-md p-8 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[95vh]">
            <h3 className="text-xl font-black mb-8 text-white uppercase italic tracking-tight border-l-4 border-red-600 pl-4">{editingId ? 'Editar Equipamento' : 'Novo Equipamento'}</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Tipo de Equipamento</label>
                <div className="relative">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
                    <input
                      type="text"
                      required
                      className="w-full rounded-xl bg-slate-950 border-slate-700 border p-4 pl-12 text-white focus:ring-2 focus:ring-red-600 outline-none font-bold placeholder:text-slate-800 transition-all uppercase"
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                      placeholder="EX: PNEUMÁTICA"
                    />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Marca / Fabricante</label>
                  <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
                      <input
                        type="text"
                        required
                        className="w-full rounded-xl bg-slate-950 border-slate-700 border p-4 pl-12 text-white focus:ring-2 focus:ring-red-600 outline-none font-bold placeholder:text-slate-800 transition-all uppercase"
                        value={formData.brand}
                        onChange={e => setFormData({ ...formData, brand: e.target.value })}
                        placeholder="EX: MAKITA"
                      />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Modelo</label>
                  <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
                      <input
                        type="text"
                        required
                        className="w-full rounded-xl bg-slate-950 border-slate-700 border p-4 pl-12 text-white focus:ring-2 focus:ring-red-600 outline-none font-bold placeholder:text-slate-800 transition-all uppercase"
                        value={formData.model}
                        onChange={e => setFormData({ ...formData, model: e.target.value })}
                        placeholder="EX: DTW1002Z"
                      />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-10">
                <button type="submit" className="w-full py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 font-black transition-all shadow-xl shadow-red-900/30 uppercase tracking-widest text-sm active:scale-95">Salvar Equipamento</button>
                <button type="button" onClick={closeModal} className="w-full py-3 text-slate-500 hover:text-slate-300 rounded-xl transition-colors font-bold text-xs uppercase tracking-widest">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal 
        isOpen={deleteModal.isOpen}
        itemName={`${deleteModal.equipment?.type} - ${deleteModal.equipment?.model}` || ''}
        title="Excluir Equipamento"
        description="Esta ação removerá o equipamento permanentemente do inventário da RBC Motorsport."
        onClose={() => setDeleteModal({ isOpen: false, equipment: null })}
        onConfirm={() => deleteModal.equipment && onDelete(deleteModal.equipment.id)}
      />
    </div>
  );
};

export default EquipmentsView;

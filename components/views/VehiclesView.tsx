
import React, { useState } from 'react';
import { Vehicle, VehicleType } from '../../types';
import { Plus, Trash2, Edit2, Truck, CarFront, Bus, Search, ToggleLeft, ToggleRight, ChevronDown, ShieldCheck, Tag } from 'lucide-react';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';

interface VehiclesViewProps {
  vehicles: Vehicle[];
  onAdd: (vehicle: Vehicle) => void;
  onUpdate: (vehicle: Vehicle) => void;
  onDelete: (id: string | number) => void;
}

const VehiclesView: React.FC<VehiclesViewProps> = ({ vehicles, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formData, setFormData] = useState<{type: VehicleType, plate: string, brand: string, model: string, status: boolean}>({ 
    type: 'Carro', 
    plate: '', 
    brand: '',
    model: '',
    status: true 
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; vehicle: Vehicle | null }>({
    isOpen: false,
    vehicle: null
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

  const openModal = (vehicle?: Vehicle) => {
    if (vehicle) {
      setEditingId(vehicle.id);
      setFormData({ 
        type: vehicle.type as VehicleType, 
        plate: vehicle.plate, 
        brand: vehicle.brand || '',
        model: vehicle.model || '',
        status: vehicle.status !== undefined ? vehicle.status : true 
      });
    } else {
      setEditingId(null);
      setFormData({ type: 'Carro', plate: '', brand: '', model: '', status: true });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ type: 'Carro', plate: '', brand: '', model: '', status: true });
  };

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'Caminhão': return <Truck className="text-blue-500" size={20} />;
      case 'Van': return <Bus className="text-purple-500" size={20} />;
      default: return <CarFront className="text-red-500" size={20} />;
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => String(a.plate).localeCompare(String(b.plate)));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 uppercase tracking-tight italic">Frota RBC</h2>
          <p className="text-slate-400 text-sm">Controle de veículos e logística de competição.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-bold shadow-lg shadow-red-900/40 active:scale-95"
        >
          <Plus size={18} />
          <span>Cadastrar Veículo</span>
        </button>
      </div>

      <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 overflow-hidden">
        <div className="p-4 bg-slate-950/50 border-b border-slate-800">
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                    type="text" 
                    placeholder="Filtrar por placa, marca ou modelo..." 
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
                <th className="p-5 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Identificação (Placa)</th>
                <th className="p-5 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Veículo (Marca / Modelo)</th>
                <th className="p-5 font-bold text-slate-500 text-[10px] uppercase tracking-widest">Categoria</th>
                <th className="p-5 font-bold text-slate-500 text-[10px] uppercase tracking-widest text-center">Status</th>
                <th className="p-5 font-bold text-slate-500 text-[10px] uppercase tracking-widest text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
                {filteredVehicles.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-500 italic text-sm">Nenhum veículo registrado na base de dados.</td>
                    </tr>
                ) : (
                    filteredVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className={`hover:bg-slate-800/40 group transition-colors ${!vehicle.status ? 'bg-slate-950/30' : ''}`}>
                        <td className="p-5">
                            <div className="flex items-center gap-4">
                                <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700 shadow-inner group-hover:border-slate-600 transition-colors">
                                    {getVehicleIcon(vehicle.type)}
                                </div>
                                <span className="font-mono text-xl font-black text-slate-100 tracking-widest uppercase">{vehicle.plate}</span>
                            </div>
                        </td>
                        <td className="p-5">
                            <div className="flex flex-col">
                                <span className="text-sm text-slate-200 font-bold uppercase">{vehicle.brand || '---'}</span>
                                <span className="text-xs text-slate-500 font-medium uppercase tracking-tight">{vehicle.model || '---'}</span>
                            </div>
                        </td>
                        <td className="p-5">
                            <span className="text-sm text-slate-400 font-bold uppercase tracking-tight">{vehicle.type}</span>
                        </td>
                        <td className="p-5 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                vehicle.status ? 'bg-green-900/20 text-green-400 border-green-800/50' : 'bg-red-900/10 text-red-500 border-red-900/20'
                            }`}>
                                {vehicle.status ? 'Ativo' : 'Inativo'}
                            </span>
                        </td>
                        <td className="p-5 text-right">
                        <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-0 translate-x-2">
                            <button 
                                type="button"
                                onClick={() => openModal(vehicle)} 
                                className="p-2.5 text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-xl transition-all"
                                title="Editar veículo"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                type="button"
                                onClick={() => setDeleteModal({ isOpen: true, vehicle })} 
                                className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-xl transition-all"
                                title="Remover veículo"
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
            <h3 className="text-xl font-black mb-8 text-white uppercase italic tracking-tight border-l-4 border-red-600 pl-4">{editingId ? 'Editar Registro' : 'Novo Registro'}</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Tipo de Unidade</label>
                <div className="relative">
                    <select
                        required
                        className="w-full rounded-xl bg-slate-950 border-slate-700 border p-4 text-white focus:ring-2 focus:ring-red-600 outline-none appearance-none font-bold cursor-pointer transition-all hover:border-slate-600"
                        value={formData.type}
                        onChange={e => setFormData({ ...formData, type: e.target.value as VehicleType })}
                    >
                        <option value="Carro">Carro</option>
                        <option value="Van">Van</option>
                        <option value="Caminhão">Caminhão</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={18} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        placeholder="EX: SCANIA"
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
                        placeholder="EX: R440"
                      />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Placa / Identificador</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-xl bg-slate-950 border-slate-700 border p-4 text-white focus:ring-2 focus:ring-red-600 outline-none font-mono uppercase text-2xl font-black tracking-[0.2em] placeholder:text-slate-800 transition-all text-center"
                  value={formData.plate}
                  onChange={e => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                  placeholder="ABC-1234"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1">Status do Veículo</label>
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, status: !formData.status })}
                    className={`w-full flex items-center justify-between rounded-xl border p-4 transition-all ${
                        formData.status ? 'bg-green-900/10 border-green-800/50 text-green-400' : 'bg-red-900/10 border-red-900/20 text-red-500'
                    }`}
                >
                    <span className="text-xs font-black uppercase tracking-widest">{formData.status ? 'Ativo' : 'Inativo'}</span>
                    {formData.status ? <ToggleRight className="text-green-500" size={28} /> : <ToggleLeft className="text-red-500" size={28} />}
                </button>
              </div>

              <div className="flex flex-col gap-3 mt-10">
                <button type="submit" className="w-full py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 font-black transition-all shadow-xl shadow-red-900/30 uppercase tracking-widest text-sm active:scale-95">Salvar Veículo</button>
                <button type="button" onClick={closeModal} className="w-full py-3 text-slate-500 hover:text-slate-300 rounded-xl transition-colors font-bold text-xs uppercase tracking-widest">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal 
        isOpen={deleteModal.isOpen}
        itemName={deleteModal.vehicle?.plate || ''}
        title="Excluir Veículo"
        description="Esta ação removerá o veículo permanentemente da lista de ativos da RBC Motorsport."
        onClose={() => setDeleteModal({ isOpen: false, vehicle: null })}
        onConfirm={() => deleteModal.vehicle && onDelete(deleteModal.vehicle.id)}
      />
    </div>
  );
};

export default VehiclesView;

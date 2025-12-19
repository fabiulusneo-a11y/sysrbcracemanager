
import React, { useState } from 'react';
import { City, Event, Championship } from '../../types';
import { Plus, Trash2, Edit2, MapPin, ArrowLeft, Calendar, Trophy } from 'lucide-react';

interface CitiesViewProps {
  cities: City[];
  events: Event[];
  championships: Championship[];
  onAdd: (city: City) => void;
  onUpdate: (city: City) => void;
  onDelete: (id: string) => void;
}

const CitiesView: React.FC<CitiesViewProps> = ({ cities, events, championships, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', state: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate({ id: editingId, ...formData });
    } else {
      onAdd({ id: crypto.randomUUID(), ...formData });
    }
    closeModal();
  };

  const openModal = (city?: City) => {
    if (city) {
      setEditingId(city.id);
      setFormData({ name: city.name, state: city.state });
    } else {
      setEditingId(null);
      setFormData({ name: '', state: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', state: '' });
  };

  const handleDelete = (e: React.MouseEvent, city: City) => {
    e.stopPropagation();
    if (confirm(`Deseja realmente excluir a cidade "${city.name}"?`)) {
      const confirmation = prompt(`Para confirmar a exclusão, digite o nome da cidade ("${city.name}"):`);
      if (confirmation?.trim().toLowerCase() === city.name.trim().toLowerCase()) {
        onDelete(city.id);
      } else if (confirmation !== null) {
        alert("O nome digitado não corresponde ao registro. Operação cancelada.");
      }
    }
  };

  const getChampName = (id: string) => championships.find(c => c.id === id)?.name || 'N/A';
  
  const getDisplayDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Sort cities by name in ascending order for the main table
  const sortedCities = [...cities].sort((a, b) => 
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

  // Drill-down Detail View
  if (selectedCityId) {
    const selectedCity = cities.find(c => c.id === selectedCityId);
    const cityEvents = events
        .filter(e => e.cityId === selectedCityId)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setSelectedCityId(null)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
                <ArrowLeft size={20} />
            </button>
            <div>
                <h2 className="text-2xl font-bold text-slate-100">{selectedCity?.name} - {selectedCity?.state}</h2>
                <p className="text-slate-400">Cronograma de Eventos no Local</p>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
            {cityEvents.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                    <Calendar className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                    <p className="text-slate-500">Nenhum evento agendado para esta cidade.</p>
                </div>
            ) : (
                cityEvents.map(event => {
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
                                <p className="text-xs text-slate-500">{d.getFullYear()}</p>
                            </div>
                            <div className="hidden sm:block text-right">
                                <span className="px-3 py-1 bg-blue-900/20 text-blue-400 border border-blue-900/50 rounded-full text-xs font-bold uppercase">
                                    Etapa Local
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
          <h2 className="text-2xl font-bold text-slate-100">Cidades</h2>
          <p className="text-slate-400">Locais de realização dos eventos.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          <span>Nova Cidade</span>
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800">
              <th className="p-4 font-semibold text-slate-400 text-sm">Cidade</th>
              <th className="p-4 font-semibold text-slate-400 text-sm">Estado (UF)</th>
              <th className="p-4 font-semibold text-slate-400 text-sm text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {sortedCities.map((city) => (
              <tr key={city.id} className="hover:bg-slate-800/50 group transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-slate-500" />
                    <span 
                        className="font-medium text-slate-200 cursor-pointer hover:text-red-500 transition-colors"
                        onClick={() => setSelectedCityId(city.id)}
                    >
                        {city.name}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                    <span className="font-mono text-sm bg-slate-800 px-2 py-1 rounded text-slate-400 border border-slate-700">{city.state}</span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openModal(city)} className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={(e) => handleDelete(e, city)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
             {sortedCities.length === 0 && (
                <tr>
                    <td colSpan={3} className="p-8 text-center text-slate-500">Nenhuma cidade cadastrada.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-sm p-6">
            <h3 className="text-xl font-bold mb-4 text-white">{editingId ? 'Editar Cidade' : 'Nova Cidade'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome da Cidade</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Interlagos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Estado (UF)</label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none uppercase"
                  value={formData.state}
                  onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                  placeholder="SP"
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

export default CitiesView;

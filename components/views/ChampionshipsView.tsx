
import React, { useState } from 'react';
import { Championship, Event, City, Member } from '../../types';
import { Plus, Trash2, Edit2, Trophy, ArrowLeft, Calendar, MapPin, CheckCircle, HelpCircle, X, ToggleLeft, ToggleRight, Users, AlertCircle, Check, Printer } from 'lucide-react';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';

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
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; champ: Championship | null }>({
    isOpen: false,
    champ: null
  });

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

  const getCityName = (id: string) => {
    const c = cities.find(city => city.id === id);
    return c ? `${c.name} - ${c.state}` : 'N/A';
  };

  const getDisplayDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const handlePrint = () => {
    const selectedChamp = championships.find(c => c.id === selectedChampId);
    const champEvents = events
        .filter(e => e.championshipId === selectedChampId)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      alert("Habilite pop-ups para visualizar o relatório.");
      return;
    }

    const tableRows = champEvents.map((event, index) => {
      const d = getDisplayDate(event.date);
      const isConfirmed = event.confirmed !== false;
      return `
        <tr>
          <td style="text-align: center; border-bottom: 1px solid #eee; color: #999; font-weight: 700;">${index + 1}</td>
          <td style="white-space: nowrap; border-bottom: 1px solid #eee;">${d.toLocaleDateString('pt-BR')}</td>
          <td style="font-weight: 800; color: #000; border-bottom: 1px solid #eee;">${event.stage}</td>
          <td style="border-bottom: 1px solid #eee;">${getCityName(event.cityId)}</td>
          <td style="text-align: center; border-bottom: 1px solid #eee;">
            <div style="display: inline-block; padding: 1px 6px; border: 1px solid #ddd; border-radius: 3px; font-size: 8px; font-weight: 800; text-transform: uppercase; background: ${isConfirmed ? '#f0fdf4' : '#fffbeb'}; color: ${isConfirmed ? '#166534' : '#92400e'};">
              ${isConfirmed ? 'Confirmado' : 'Indefinido'}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    reportWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>RBC - ${selectedChamp?.name}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap" rel="stylesheet">
        <style>
          @page { size: A4; margin: 1cm; }
          body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: #fff; color: #333; font-size: 10px; line-height: 1.2; }
          
          table { width: 100%; border-collapse: collapse; page-break-inside: auto; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          
          .report-header-content { border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-end; }
          .report-header-content h1 { margin: 0; font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; color: #000; }
          .meta { text-align: right; font-size: 8px; color: #666; font-weight: 600; }

          th { text-align: left; padding: 6px 8px; background: #f8fafc; border-bottom: 1.5px solid #000; font-size: 8px; font-weight: 900; text-transform: uppercase; color: #000; }
          td { padding: 5px 8px; vertical-align: middle; }

          .summary-first-page { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; margin-bottom: 15px; }
          .summary-first-page label { font-size: 7px; font-weight: 800; text-transform: uppercase; color: #9ca3af; letter-spacing: 1px; }
          .summary-first-page h2 { margin: 0; font-size: 16px; font-weight: 900; color: #000; }
          .summary-first-page p { margin: 3px 0 0 0; font-weight: 600; color: #666; font-size: 9px; }
          
          .print-toolbar {
            position: fixed; top: 0; left: 0; right: 0; background: #000; color: #fff; padding: 8px 20px;
            display: flex; justify-content: space-between; align-items: center; z-index: 1000;
          }
          .btn-print {
            background: #ef4444; color: #fff; border: none; padding: 6px 12px; border-radius: 4px;
            font-weight: 800; font-size: 10px; cursor: pointer; text-transform: uppercase;
          }

          @media print {
            .print-toolbar, .print-toolbar-spacer { display: none !important; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="print-toolbar">
          <span style="font-weight: 800; font-size: 9px; text-transform: uppercase; letter-spacing: 1px;">Relatório de Competições RBC (Modo Compacto)</span>
          <button class="btn-print" onclick="window.print()">IMPRIMIR AGORA (A4)</button>
        </div>
        <div style="height: 40px;" class="print-toolbar-spacer"></div>

        <div style="padding: 15px;">
          <table>
            <thead>
              <tr>
                <th colspan="5" style="background: transparent; border: none; padding: 0;">
                  <div class="report-header-content">
                    <div>
                      <h1>RBC Motorsport</h1>
                      <div style="font-weight: 700; color: #666; text-transform: uppercase; font-size: 9px; margin-top: 2px;">Cronograma de Etapas • ${selectedChamp?.name}</div>
                    </div>
                    <div class="meta">
                      EMISSÃO: <b>${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</b>
                    </div>
                  </div>
                </th>
              </tr>
              <tr>
                <th style="width: 30px; text-align: center;">Nº</th>
                <th style="width: 12%;">Data</th>
                <th style="width: 35%;">Etapa / Descrição</th>
                <th style="width: 35%;">Cidade / Localização</th>
                <th style="text-align: center; width: 12%;">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="5" style="padding: 0; border: none;">
                   <div class="summary-first-page">
                      <label>Campeonato Selecionado</label>
                      <h2>${selectedChamp?.name}</h2>
                      <p>Total de <b>${champEvents.length} eventos</b> agendados no sistema.</p>
                   </div>
                </td>
              </tr>
              ${champEvents.length > 0 ? tableRows : '<tr><td colspan="5" style="text-align: center; padding: 30px; color: #999;">Nenhuma etapa registrada.</td></tr>'}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5" style="text-align: center; font-size: 7px; color: #999; padding-top: 30px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">
                  Página gerada via RBC Motorsport Management System • Modo de Alta Densidade
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </body>
      </html>
    `);
    reportWindow.document.close();
  };

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

  const sortedChampionships = [...championships].sort((a, b) => 
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
                <button onClick={() => setSelectedChampId(null)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-100">{selectedChamp?.name}</h2>
                    <p className="text-slate-400">Calendário de Provas</p>
                </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
                <button onClick={handlePrint} title="Imprimir Relatório" className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700 shadow-sm">
                    <Printer size={20} />
                </button>
                <button onClick={openAddEventModal} className="flex-grow sm:flex-grow-0 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors font-bold shadow-lg shadow-red-900/20">
                    <Plus size={18} />
                    Nova Etapa
                </button>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
            {champEvents.length === 0 ? (
                <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                    <Calendar className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                    <p className="text-slate-500">Nenhuma etapa cadastrada.</p>
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
                                        {isConfirmed ? 'Confirmado' : 'Indefinido'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                                    <MapPin size={14} className="text-slate-500" />
                                    {getCityName(event.cityId)}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                <button type="button" onClick={() => setEditingEvent({ ...event })} className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium">
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
                        <button type="button" onClick={() => setIsAddEventModalOpen(false)} className="text-slate-500 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleAddEventSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome da Etapa</label>
                                <input type="text" required className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 outline-none" value={newEventData.stage} onChange={e => setNewEventData({ ...newEventData, stage: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Data</label>
                                <input type="date" required className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 outline-none [color-scheme:dark]" value={newEventData.date} onChange={e => setNewEventData({ ...newEventData, date: e.target.value, memberIds: [] })} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                            <button type="button" onClick={() => setIsAddEventModalOpen(false)} className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
                            <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition-colors">Salvar Etapa</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* Modal: Editar Evento */}
        {editingEvent && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
                <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 sticky top-0 z-10">
                        <h3 className="font-bold text-slate-100 flex items-center gap-2">
                            <Edit2 size={18} className="text-red-500" />
                            Editar {editingEvent.stage}
                        </h3>
                        <button type="button" onClick={() => setEditingEvent(null)} className="text-slate-500 hover:text-white">
                            <X size={20} />
                        </button>
                    </div>
                    <form onSubmit={handleEventUpdateSubmit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nome da Etapa</label>
                                <input type="text" required className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 outline-none" value={editingEvent.stage} onChange={e => setEditingEvent({ ...editingEvent, stage: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Data</label>
                                <input type="date" required className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 outline-none [color-scheme:dark]" value={editingEvent.date} onChange={e => setEditingEvent({ ...editingEvent, date: e.target.value, memberIds: [] })} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                            <button type="button" onClick={() => setEditingEvent(null)} className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">Descartar</button>
                            <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold transition-colors">Salvar Alterações</button>
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
        <button onClick={() => openModal()} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
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
                    <button type="button" onClick={(e) => { e.stopPropagation(); openModal(champ); }} className="p-1.5 text-slate-400 hover:text-blue-400 rounded">
                        <Edit2 size={14} />
                    </button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, champ }); }} className="p-1.5 text-slate-400 hover:text-red-400 rounded">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-md p-6">
            <h3 className="text-xl font-bold mb-4 text-white">{editingId ? 'Editar Campeonato' : 'Novo Campeonato'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome do Campeonato</label>
                <input type="text" required className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Campeonato Verde" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal isOpen={deleteModal.isOpen} itemName={deleteModal.champ?.name || ''} title="Excluir Campeonato" description="A exclusão do campeonato removerá todas as referências nos calendários." onClose={() => setDeleteModal({ isOpen: false, champ: null })} onConfirm={() => deleteModal.champ && onDelete(deleteModal.champ.id)} />
    </div>
  );
};

export default ChampionshipsView;

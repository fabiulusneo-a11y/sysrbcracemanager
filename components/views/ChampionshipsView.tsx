
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
    stage: '01',
    memberIds: [],
    vehicleIds: [],
    modelForecast: [],
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

    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const dd = now.getDate().toString().padStart(2, '0');
    const hh = now.getHours().toString().padStart(2, '0');
    const min = now.getMinutes().toString().padStart(2, '0');
    const timestamp = `${yy}${mm}${dd}-${hh}${min}`;
    
    const reportBaseName = "Cronograma de Etapas - ";
    const champName = selectedChamp?.name || "Campeonato";
    const fullFileName = `${reportBaseName}${champName} ${timestamp}`;

    const tableRows = champEvents.map((event, index) => {
      const d = getDisplayDate(event.date);
      const isConfirmed = event.confirmed !== false;
      return `
        <tr>
          <td style="text-align: center; border-bottom: 1px solid #ddd; color: #666; font-weight: 700; padding: 8px 4px;">${index + 1}</td>
          <td style="white-space: nowrap; border-bottom: 1px solid #ddd; padding: 8px 4px;">${d.toLocaleDateString('pt-BR')}</td>
          <td style="font-weight: 800; color: #000; border-bottom: 1px solid #ddd; padding: 8px 4px;">${event.stage}</td>
          <td style="border-bottom: 1px solid #ddd; padding: 8px 4px;">${getCityName(event.cityId)}</td>
          <td style="text-align: center; border-bottom: 1px solid #ddd; padding: 8px 4px;">
            <div style="display: inline-block; padding: 2px 8px; border: 1.5px solid #ccc; border-radius: 4px; font-size: 8px; font-weight: 900; text-transform: uppercase; background: ${isConfirmed ? '#f0fdf4' : '#fffbeb'}; color: ${isConfirmed ? '#166534' : '#92400e'};">
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
        <title>${fullFileName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap" rel="stylesheet">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
        <style>
          @page { size: A4; margin: 0; }
          body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: #f8fafc; color: #1e293b; font-size: 11px; line-height: 1.3; }
          .pdf-wrapper { 
            background: #fff; 
            width: 794px; 
            margin: 0 auto; 
            padding: 40px; 
            box-sizing: border-box;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
            min-height: 1123px;
          }
          table { width: 100%; border-collapse: collapse; }
          .header-table { width: 100%; margin-bottom: 20px; border-bottom: 3px solid #000; }
          .header-left h1 { margin: 0; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; color: #000; }
          .header-right { text-align: right; font-size: 9px; color: #64748b; font-weight: 700; }
          th { text-align: left; padding: 10px 8px; background: #f1f5f9; border-bottom: 2px solid #000; font-size: 9px; font-weight: 900; text-transform: uppercase; color: #000; }
          .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
          .summary-card label { font-size: 8px; font-weight: 900; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px; display: block; margin-bottom: 4px; }
          .summary-card h2 { margin: 0; font-size: 18px; font-weight: 900; color: #000; text-transform: uppercase; }
          .summary-card p { margin: 5px 0 0 0; font-weight: 700; color: #475569; font-size: 10px; }
          .print-toolbar {
            position: fixed; top: 0; left: 0; right: 0; background: #0f172a; color: #fff; padding: 12px 24px;
            display: flex; justify-content: space-between; align-items: center; z-index: 1000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.4);
          }
          .toolbar-brand { display: flex; align-items: center; gap: 10px; }
          .toolbar-actions { display: flex; gap: 10px; }
          .btn {
            border: none; padding: 8px 18px; border-radius: 6px;
            font-weight: 800; font-size: 10px; cursor: pointer; text-transform: uppercase;
            transition: all 0.2s ease; display: flex; align-items: center; gap: 8px;
          }
          .btn-print { background: #dc2626; color: #fff; }
          .btn-pdf { background: #2563eb; color: #fff; }
          .btn-close { background: #475569; color: #fff; }
          @media print {
            .print-toolbar, .print-toolbar-spacer { display: none !important; }
            body { background: #fff; padding: 0; }
            .pdf-wrapper { box-shadow: none; margin: 0; width: 100%; padding: 0; }
          }
        </style>
        <script>
          function downloadPDF() {
            const element = document.getElementById('capture-area');
            const fileName = "${fullFileName}.pdf";
            window.scrollTo(0,0);
            const opt = {
              margin: 0,
              filename: fileName,
              image: { type: 'jpeg', quality: 1.0 },
              html2canvas: { scale: 2, useCORS: true, letterRendering: true, backgroundColor: '#ffffff' },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            const btn = document.querySelector('.btn-pdf');
            btn.innerHTML = 'Processando...';
            html2pdf().from(element).set(opt).save().then(() => { btn.innerHTML = 'Baixar PDF (.pdf)'; });
          }
        </script>
      </head>
      <body>
        <div class="print-toolbar">
          <div class="toolbar-brand">
            <div style="width: 28px; height: 28px; background: #dc2626; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 900; font-style: italic;">R</div>
            <div>
              <div style="font-weight: 900; font-size: 12px; letter-spacing: 0.5px; color: #fff;">RBC MOTORSPORT</div>
              <div style="font-weight: 700; font-size: 8px; color: #94a3b8; text-transform: uppercase;">Relatório Digital de Cronograma</div>
            </div>
          </div>
          <div class="toolbar-actions">
            <button class="btn btn-close" onclick="window.close()">Fechar</button>
            <button class="btn btn-pdf" onclick="downloadPDF()">Baixar PDF (.pdf)</button>
            <button class="btn btn-print" onclick="window.print()">Imprimir</button>
          </div>
        </div>
        <div style="height: 70px;" class="print-toolbar-spacer"></div>
        <div id="capture-area" class="pdf-wrapper">
          <table class="header-table">
            <tr>
              <td class="header-left">
                <h1>RBC Motorsport</h1>
                <div style="font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 10px; margin-top: 4px;">Cronograma Oficial de Competições</div>
              </td>
              <td class="header-right">
                EMISSÃO DO DOCUMENTO<br>
                <b style="color: #000; font-size: 10px;">${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</b>
              </td>
            </tr>
          </table>
          <div class="summary-card">
            <label>Campeonato Selecionado</label>
            <h2>${selectedChamp?.name}</h2>
            <p>Este documento contém a escala de <b>${champEvents.length} etapas</b> registradas.</p>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 35px; text-align: center;">Nº</th>
                <th style="width: 15%;">Data</th>
                <th style="width: 30%;">Etapa</th>
                <th style="width: 30%;">Cidade / Localização</th>
                <th style="text-align: center; width: 10%;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${champEvents.length > 0 ? tableRows : '<tr><td colspan="5" style="text-align: center; padding: 40px; color: #94a3b8; font-weight: 700;">Nenhuma etapa agendada para este campeonato.</td></tr>'}
            </tbody>
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
    
    // Buscar etapas atuais do campeonato e ordenar por data
    const champEvents = events
        .filter(e => e.championshipId === selectedChampId)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const nextCount = champEvents.length + 1;
    
    // Lógica de Data: 28 dias após a última etapa ou hoje se for a primeira
    let nextDate = new Date().toISOString().split('T')[0];
    if (champEvents.length > 0) {
        const lastEvent = champEvents[champEvents.length - 1];
        const [year, month, day] = lastEvent.date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);
        dateObj.setDate(dateObj.getDate() + 28);
        
        const y = dateObj.getFullYear();
        const m = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d = String(dateObj.getDate()).padStart(2, '0');
        nextDate = `${y}-${m}-${d}`;
    }

    setNewEventData({
        championshipId: selectedChampId,
        cityId: '',
        date: nextDate,
        stage: String(nextCount).padStart(2, '0'),
        memberIds: [],
        vehicleIds: [],
        modelForecast: [],
        confirmed: true
    });
    setIsAddEventModalOpen(true);
  };

  const handleAddEventSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newEventData.cityId) return;
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
                <button onClick={handlePrint} title="Gerar Relatório / PDF" className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700 shadow-sm flex items-center gap-2">
                    <Printer size={20} />
                    <span className="text-xs font-bold uppercase hidden sm:inline">Relatório</span>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Identificação da Etapa</label>
                                <input type="text" required className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 outline-none" value={newEventData.stage} onChange={e => setNewEventData({ ...newEventData, stage: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Data</label>
                                <input type="date" required className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 outline-none [color-scheme:dark]" value={newEventData.date} onChange={e => setNewEventData({ ...newEventData, date: e.target.value })} />
                            </div>
                            <div className="md:col-span-2 lg:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cidade / Local</label>
                                <select 
                                    required 
                                    className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 outline-none"
                                    value={newEventData.cityId}
                                    onChange={e => setNewEventData({ ...newEventData, cityId: e.target.value })}
                                >
                                    <option value="" disabled>Selecione a cidade...</option>
                                    {cities.map(c => <option key={c.id} value={c.id}>{c.name} - {c.state}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                            <button type="button" onClick={() => setIsAddEventModalOpen(false)} className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
                            <button 
                              type="submit" 
                              disabled={!newEventData.cityId}
                              className={`px-6 py-2 rounded-lg font-bold transition-colors ${!newEventData.cityId ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
                            >
                              Salvar Etapa
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}

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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Identificação da Etapa</label>
                                <input type="text" required className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 outline-none" value={editingEvent.stage} onChange={e => setEditingEvent({ ...editingEvent, stage: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Data</label>
                                <input type="date" required className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 outline-none [color-scheme:dark]" value={editingEvent.date} onChange={e => setEditingEvent({ ...editingEvent, date: e.target.value })} />
                            </div>
                            <div className="md:col-span-2 lg:col-span-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cidade / Local</label>
                                <select 
                                    required 
                                    className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 outline-none"
                                    value={editingEvent.cityId}
                                    onChange={e => setEditingEvent({ ...editingEvent, cityId: e.target.value })}
                                >
                                    <option value="" disabled>Selecione a cidade...</option>
                                    {cities.map(c => <option key={c.id} value={c.id}>{c.name} - {c.state}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                            <button type="button" onClick={() => setEditingEvent(null)} className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">Descartar</button>
                            <button 
                              type="submit" 
                              disabled={!editingEvent.cityId}
                              className={`px-6 py-2 rounded-lg font-bold transition-colors ${!editingEvent.cityId ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-red-600 text-white hover:bg-red-700'}`}
                            >
                              Salvar Alterações
                            </button>
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

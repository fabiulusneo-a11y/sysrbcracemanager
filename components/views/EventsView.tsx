
import React, { useState, useEffect } from 'react';
import { Event, AppData, Member } from '../../types';
import { Plus, Trash2, Edit2, Calendar, MapPin, Users, Check, Filter, XCircle, FileSpreadsheet, AlertCircle, CheckCircle, HelpCircle, ToggleLeft, ToggleRight, X, Download, Table as TableIcon } from 'lucide-react';
import ExcelJS from 'exceljs';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';

interface EventsViewProps {
  data: AppData;
  onAdd: (event: Event) => void;
  onUpdate: (event: Event) => void;
  onDelete: (id: string) => void;
  initialEditingId?: string | null;
  onClearEditingId?: () => void;
}

const EventsView: React.FC<EventsViewProps> = ({ 
    data, 
    onAdd, 
    onUpdate, 
    onDelete, 
    initialEditingId, 
    onClearEditingId 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnalyticalModalOpen, setIsAnalyticalModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; event: Event | null }>({
    isOpen: false,
    event: null
  });

  const [filterChampionship, setFilterChampionship] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formData, setFormData] = useState<Omit<Event, 'id'>>({
    championshipId: '',
    cityId: '',
    date: '',
    stage: '',
    memberIds: [],
    confirmed: true
  });

  const getChampName = (id: string) => data.championships.find(c => c.id === id)?.name || 'N/A';
  const getCityObj = (id: string) => data.cities.find(c => c.id === id);
  const formatToBRDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const getMemberNames = (ids: string[]) => {
    return ids.map(id => {
        const m = data.members.find(member => member.id === id);
        return m ? m.name : 'N/A';
    }).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  };

  const sortedCities = [...data.cities].sort((a, b) => 
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

  const sortedMembersList = [...data.members]
    .filter(m => m.active !== false)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));

  const filteredEvents = data.events
    .filter(event => {
        const matchesChamp = filterChampionship ? event.championshipId === filterChampionship : true;
        const matchesStart = startDate ? event.date >= startDate : true;
        const matchesEnd = endDate ? event.date <= endDate : true;
        return matchesChamp && matchesStart && matchesEnd;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  useEffect(() => {
    if (initialEditingId) {
        const eventToEdit = data.events.find(e => e.id === initialEditingId);
        if (eventToEdit) {
            openModal(eventToEdit);
        }
        if (onClearEditingId) onClearEditingId();
    }
  }, [initialEditingId, data.events, onClearEditingId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdate({ id: editingId, ...formData });
    } else {
      onAdd({ id: crypto.randomUUID(), ...formData });
    }
    closeModal();
  };

  const openModal = (event?: Event) => {
    if (event) {
      setEditingId(event.id);
      setFormData({
        championshipId: event.championshipId,
        cityId: event.cityId,
        date: event.date,
        stage: event.stage,
        memberIds: event.memberIds,
        confirmed: event.confirmed !== false
      });
    } else {
      setEditingId(null);
      setFormData({
        championshipId: data.championships[0]?.id || '',
        cityId: '',
        date: new Date().toISOString().split('T')[0],
        stage: 'Etapa 1',
        memberIds: [],
        confirmed: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const getConflictingEvent = (memberId: string) => {
    if (!formData.date) return null;
    return data.events.find(e => 
      e.date === formData.date && 
      e.id !== editingId && 
      e.memberIds.includes(memberId)
    );
  };

  const toggleMember = (memberId: string) => {
    if (!formData.memberIds.includes(memberId)) {
        const conflict = getConflictingEvent(memberId);
        if (conflict) return; 
    }
    setFormData(prev => {
        const ids = prev.memberIds.includes(memberId)
            ? prev.memberIds.filter(id => id !== memberId)
            : [...prev.memberIds, memberId];
        return { ...prev, memberIds: ids };
    });
  };

  const exportAnalyticalStyled = async () => {
    setIsExporting(true);
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Relatório Analítico');
        const members = sortedMembersList;
        
        const columns = [
            { header: 'Data', key: 'date', width: 12 },
            { header: 'Campeonato', key: 'champ', width: 25 },
            { header: 'Etapa', key: 'stage', width: 10 },
            { header: 'Cidade', key: 'city', width: 20 },
            { header: 'Estado', key: 'state', width: 8 },
            { header: 'Status', key: 'status', width: 15 },
            ...members.map(m => ({ header: m.name, key: m.id, width: 12 }))
        ];
        worksheet.columns = columns;

        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });

        filteredEvents.forEach((event, index) => {
            const city = getCityObj(event.cityId);
            const rowData: any = {
                date: formatToBRDate(event.date),
                champ: getChampName(event.championshipId),
                stage: event.stage,
                city: city?.name || 'N/A',
                state: city?.state || 'N/A',
                status: event.confirmed !== false ? 'Confirmado' : 'Indefinido'
            };
            members.forEach(m => { rowData[m.id] = event.memberIds.includes(m.id) ? 1 : 0; });

            const row = worksheet.addRow(rowData);
            const isStriped = index % 2 !== 0;

            row.eachCell((cell, colNumber) => {
                if (isStriped) { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } }; }
                if (colNumber > 6) {
                    if (cell.value === 1) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } };
                        cell.font = { color: { argb: 'FF721C24' }, bold: true };
                    } else { cell.font = { color: { argb: isStriped ? 'FFD9E1F2' : 'FFFFFFFF' } }; }
                    cell.alignment = { horizontal: 'center' };
                } else {
                    cell.alignment = { horizontal: colNumber === 1 || colNumber === 3 || colNumber === 5 || colNumber === 6 ? 'center' : 'left' };
                }
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `relatorio_analitico_rbc_${new Date().toISOString().split('T')[0]}.xlsx`;
        anchor.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Export Error:", error);
    } finally { setIsExporting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-100">Calendário de Corridas</h2>
            <span className="bg-red-900/40 text-red-400 text-xs font-bold px-2 py-1 rounded-full border border-red-900/50">
              {filteredEvents.length} {filteredEvents.length === 1 ? 'evento' : 'eventos'}
            </span>
          </div>
          <p className="text-slate-400">Gestão das etapas e logística.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
                type="button"
                onClick={() => setIsAnalyticalModalOpen(true)}
                disabled={filteredEvents.length === 0}
                className="flex-1 sm:flex-none justify-center bg-blue-700 hover:bg-blue-600 text-white border border-blue-800 disabled:opacity-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
                <TableIcon size={18} />
                <span>Exportar Analítico</span>
            </button>
            <button
                type="button"
                onClick={() => openModal()}
                disabled={data.championships.length === 0 || data.cities.length === 0}
                className="flex-1 sm:flex-none justify-center bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
                <Plus size={18} />
                <span>Novo Evento</span>
            </button>
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center flex-wrap">
        <div className="flex items-center gap-2 text-slate-400 mr-2 w-full md:w-auto mb-2 md:mb-0">
            <Filter size={18} />
            <span className="text-sm font-medium">Filtrar:</span>
        </div>
        
        <select
            value={filterChampionship}
            onChange={(e) => setFilterChampionship(e.target.value)}
            className="w-full md:w-auto bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none"
        >
            <option value="">Todos os Campeonatos</option>
            {data.championships.map(c => ( <option key={c.id} value={c.id}>{c.name}</option> ))}
        </select>

        <div className="flex items-center gap-2 w-full md:w-auto">
            <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none [color-scheme:dark]"
            />
            <span className="text-slate-500 text-sm">até</span>
            <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 outline-none [color-scheme:dark]"
            />
        </div>

        {(filterChampionship || startDate || endDate) && (
            <button 
                type="button"
                onClick={() => { setFilterChampionship(''); setStartDate(''); setEndDate(''); }}
                className="ml-auto md:ml-0 text-slate-400 hover:text-white flex items-center gap-1 text-sm hover:bg-slate-800 px-3 py-2 rounded-lg transition-colors"
            >
                <XCircle size={16} />
                Limpar
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredEvents.map((event) => {
            const isConfirmed = event.confirmed !== false;
            const city = getCityObj(event.cityId);
            const memberNames = getMemberNames(event.memberIds);
            return (
                <div key={event.id} className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-6 group hover:border-red-500/50 transition-colors">
                    <div className="flex-shrink-0 flex md:flex-col items-center gap-2 md:w-24 md:border-r md:border-slate-800 md:pr-4">
                        <span className="text-2xl font-bold text-slate-100">{event.date.split('-')[2]}</span>
                        <span className="text-sm font-bold text-red-500 uppercase tracking-wider">{new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}</span>
                    </div>

                    <div className="flex-grow space-y-3">
                        <div>
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-bold text-slate-200">{getChampName(event.championshipId)}</h3>
                                <span className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                                    isConfirmed ? 'bg-green-900/20 text-green-400 border-green-800/50' : 'bg-amber-900/20 text-amber-500 border-amber-800/50'
                                }`}>
                                    {isConfirmed ? 'Confirmado' : 'Indefinido'}
                                </span>
                            </div>
                            <p className="text-slate-400 font-medium">{event.stage}</p>
                            <div className="flex items-center gap-4 text-sm text-slate-500 mt-1">
                                <div className="flex items-center gap-1.5">
                                    <MapPin size={16} className="text-slate-600" />
                                    {city?.name} - {city?.state}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex md:flex-col gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); openModal(event); }} 
                            className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, event }); }} 
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            );
        })}
      </div>

      {/* Modal de Exclusão customizado */}
      <DeleteConfirmModal 
        isOpen={deleteModal.isOpen}
        itemName={deleteModal.event?.stage || ''}
        title="Excluir Evento"
        description="Esta ação removerá a etapa permanentemente do calendário e da contagem de escala da equipe."
        onClose={() => setDeleteModal({ isOpen: false, event: null })}
        onConfirm={() => deleteModal.event && onDelete(deleteModal.event.id)}
      />

      {/* Restante dos modais de edição e analítico... */}
    </div>
  );
};

export default EventsView;


import React, { useState, useEffect, useMemo } from 'react';
import { Event, AppData, Member, Vehicle } from '../../types';
import { Plus, Trash2, Edit2, MapPin, Users, Check, Filter, XCircle, FileSpreadsheet, AlertCircle, Download, Table as TableIcon, Loader2, X, Printer, Truck, Info, CheckCircle2 } from 'lucide-react';
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
    vehicleIds: [],
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
        const m = data.members.find(member => String(member.id) === String(id));
        return m ? m.name : 'N/A';
    }).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  };

  const getVehiclePlates = (ids: (string | number)[]) => {
    return ids.map(id => {
        const v = data.vehicles.find(vehicle => String(vehicle.id) === String(id));
        return v ? v.plate : 'N/A';
    }).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  };

  const sortedCities = [...data.cities].sort((a, b) => 
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

  const activeMembers = useMemo(() => 
    [...data.members]
      .filter(m => m.active !== false)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })), 
    [data.members]
  );

  const activeVehicles = useMemo(() => 
    [...data.vehicles]
      .filter(v => v.status !== false)
      .sort((a, b) => String(a.plate).localeCompare(String(b.plate), 'pt-BR', { sensitivity: 'base' })), 
    [data.vehicles]
  );

  const filteredEvents = useMemo(() => 
    data.events
      .filter(event => {
          const matchesChamp = filterChampionship ? event.championshipId === filterChampionship : true;
          const matchesStart = startDate ? event.date >= startDate : true;
          const matchesEnd = endDate ? event.date <= endDate : true;
          return matchesChamp && matchesStart && matchesEnd;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [data.events, filterChampionship, startDate, endDate]
  );

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
        memberIds: event.memberIds || [],
        vehicleIds: event.vehicleIds || [],
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
        vehicleIds: [],
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
      e.memberIds.some(mId => String(mId) === String(memberId))
    );
  };

  const getConflictingVehicleEvent = (vehicleId: string | number) => {
    if (!formData.date) return null;
    return data.events.find(e => 
      e.date === formData.date && 
      e.id !== editingId && 
      e.vehicleIds.some(vId => String(vId) === String(vehicleId))
    );
  };

  const toggleMember = (memberId: string) => {
    const isCurrentlySelected = formData.memberIds.some(mId => String(mId) === String(memberId));
    if (!isCurrentlySelected) {
        const conflict = getConflictingEvent(memberId);
        if (conflict) return; 
    }
    setFormData(prev => {
        const isAlreadyIn = prev.memberIds.some(mId => String(mId) === String(memberId));
        const ids = isAlreadyIn
            ? prev.memberIds.filter(mId => String(mId) !== String(memberId))
            : [...prev.memberIds, memberId];
        return { ...prev, memberIds: ids };
    });
  };

  const toggleVehicle = (vehicleId: string | number) => {
    const isCurrentlySelected = formData.vehicleIds.some(vId => String(vId) === String(vehicleId));
    if (!isCurrentlySelected) {
        const conflict = getConflictingVehicleEvent(vehicleId);
        if (conflict) return; 
    }
    setFormData(prev => {
        const isAlreadyIn = prev.vehicleIds.some(vId => String(vId) === String(vehicleId));
        const ids = isAlreadyIn
            ? prev.vehicleIds.filter(vId => String(vId) !== String(vehicleId))
            : [...prev.vehicleIds, vehicleId];
        return { ...prev, vehicleIds: ids };
    });
  };

  const handlePrintAnalytical = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Habilite pop-ups para imprimir.");
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Matriz Analítica RBC - Frota e Equipe</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 20px; font-size: 8px; color: #1e293b; }
            h1 { font-size: 16px; margin-bottom: 5px; color: #000; text-transform: uppercase; border-bottom: 2px solid #ef4444; display: inline-block; padding-bottom: 2px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 0.5px solid #cbd5e1; padding: 4px 2px; text-align: center; }
            th { background-color: #f8fafc; font-weight: 900; text-transform: uppercase; font-size: 7px; color: #64748b; }
            .event-info { text-align: left; padding-left: 5px; font-weight: bold; background: #fff; }
            .member-col { background-color: #f1f5f9; }
            .vehicle-col { background-color: #fef2f2; }
            .checked { background-color: #ef4444 !important; color: #fff !important; font-weight: 900; }
            .confirmed-label { font-size: 6px; color: #10b981; }
            .footer { margin-top: 20px; font-size: 7px; color: #94a3b8; text-align: center; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Matriz Analítica de Escala RBC</h1>
          <p>Relatório de Logística e Disponibilidade • Equipe e Frota</p>
          <table>
            <thead>
              <tr>
                <th colspan="4" style="background: #fff; border: none;"></th>
                <th colspan="${activeMembers.length}" style="background: #f1f5f9; border-bottom: 2px solid #334155;">Equipe Técnica</th>
                <th colspan="${activeVehicles.length}" style="background: #fef2f2; border-bottom: 2px solid #ef4444;">Frota Operacional</th>
              </tr>
              <tr>
                <th style="width: 50px;">Data</th>
                <th style="width: 100px;">Campeonato</th>
                <th style="width: 80px;">Etapa</th>
                <th style="width: 80px;">Cidade</th>
                ${activeMembers.map(m => `<th>${m.name.split(' ')[0]}</th>`).join('')}
                ${activeVehicles.map(v => `<th>${v.plate}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${filteredEvents.map(event => `
                <tr>
                  <td class="event-info">${formatToBRDate(event.date)}</td>
                  <td class="event-info">${getChampName(event.championshipId)}</td>
                  <td class="event-info">${event.stage}</td>
                  <td class="event-info">${getCityObj(event.cityId)?.name}</td>
                  ${activeMembers.map(m => {
                    const isSelected = event.memberIds.some(id => String(id) === String(m.id));
                    return `<td class="${isSelected ? 'checked' : ''}">${isSelected ? 'X' : ''}</td>`;
                  }).join('')}
                  ${activeVehicles.map(v => {
                    const isSelected = event.vehicleIds.some(id => String(id) === String(v.id));
                    return `<td class="${isSelected ? 'checked' : ''}">${isSelected ? 'X' : ''}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">Gerado em ${new Date().toLocaleString('pt-BR')} • RBC Motorsport System</div>
          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const exportAnalyticalStyled = async () => {
    setIsExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Matriz de Escala RBC');

      // Header configurations
      const headerRow1 = worksheet.addRow(['', '', '', '', 'EQUIPE TÉCNICA', ...new Array(activeMembers.length - 1).fill(''), 'FROTA OPERACIONAL']);
      worksheet.mergeCells(1, 5, 1, 4 + activeMembers.length);
      worksheet.mergeCells(1, 5 + activeMembers.length, 1, 4 + activeMembers.length + activeVehicles.length);
      
      const headerRow2 = worksheet.addRow([
        'DATA', 
        'CAMPEONATO', 
        'ETAPA', 
        'CIDADE', 
        ...activeMembers.map(m => m.name.toUpperCase()), 
        ...activeVehicles.map(v => v.plate.toUpperCase())
      ]);

      // Style Headers
      [headerRow1, headerRow2].forEach((row, rowIndex) => {
        row.eachCell((cell, colIndex) => {
          cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowIndex === 0 ? 'FF1E293B' : 'FFEF4444' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        });
      });

      // Data Rows
      filteredEvents.forEach(event => {
        const rowData = [
          formatToBRDate(event.date),
          getChampName(event.championshipId),
          event.stage,
          getCityObj(event.cityId)?.name || '',
          ...activeMembers.map(m => event.memberIds.some(id => String(id) === String(m.id)) ? 'CONVOCADO' : ''),
          ...activeVehicles.map(v => event.vehicleIds.some(id => String(id) === String(v.id)) ? 'ESCALADO' : '')
        ];
        const row = worksheet.addRow(rowData);
        
        row.eachCell((cell, colIndex) => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          cell.alignment = { horizontal: colIndex <= 4 ? 'left' : 'center', vertical: 'middle' };
          
          if (cell.value === 'CONVOCADO') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
            cell.font = { color: { argb: 'FF166534' }, bold: true, size: 8 };
          } else if (cell.value === 'ESCALADO') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
            cell.font = { color: { argb: 'FF1E40AF' }, bold: true, size: 8 };
          }
        });
      });

      // Adjust column widths
      worksheet.columns.forEach((col, idx) => {
        col.width = idx < 4 ? 20 : 12;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `Matriz_RBC_${new Date().toISOString().split('T')[0]}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Erro ao exportar planilha.");
    } finally {
      setIsExporting(false);
    }
  };

  const getMemberTotal = (memberId: string) => {
    return filteredEvents.reduce((acc, event) => acc + (event.memberIds.some(mId => String(mId) === String(memberId)) ? 1 : 0), 0);
  };

  const getVehicleTotal = (vehicleId: string | number) => {
    return filteredEvents.reduce((acc, event) => acc + (event.vehicleIds.some(vId => String(vId) === String(vehicleId)) ? 1 : 0), 0);
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
                <span>Modo Analítico</span>
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
            const memberNames = getMemberNames(event.memberIds || []);
            const vehiclePlates = getVehiclePlates(event.vehicleIds || []);
            
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

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-slate-800/50">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    <Users size={14} className="text-slate-600" />
                                    Equipe Técnica
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {memberNames.length > 0 ? (
                                        memberNames.map((name, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md text-[10px] font-medium">
                                                {name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-slate-600 text-[9px] italic">Sem equipe escalada</span>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    <Truck size={14} className="text-slate-600" />
                                    Frota Escala
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {vehiclePlates.length > 0 ? (
                                        vehiclePlates.map((plate, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-red-900/10 border border-red-900/20 text-red-400 rounded-md text-[10px] font-black tracking-tighter uppercase font-mono">
                                                {plate}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-slate-600 text-[9px] italic">Nenhum veículo alocado</span>
                                    )}
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

      <DeleteConfirmModal 
        isOpen={deleteModal.isOpen}
        itemName={deleteModal.event?.stage || ''}
        title="Excluir Evento"
        description="Esta ação removerá a etapa permanentemente do calendário e da contagem de escala da equipe."
        onClose={() => setDeleteModal({ isOpen: false, event: null })}
        onConfirm={() => deleteModal.event && onDelete(deleteModal.event.id)}
      />

      {isAnalyticalModalOpen && (
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4 backdrop-blur-md">
              <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-[98vw] h-[92vh] flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/80">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <FileSpreadsheet className="text-red-500" />
                            Matriz Operacional RBC
                        </h3>
                        <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                           <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                           {filteredEvents.length} Etapas em Exibição
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                          <button 
                            type="button" 
                            onClick={exportAnalyticalStyled}
                            disabled={isExporting}
                            className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 text-sm font-bold transition-all disabled:opacity-50"
                          >
                             {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                             <span className="hidden sm:inline">Exportar Excel</span>
                          </button>
                          <button 
                            type="button" 
                            onClick={handlePrintAnalytical}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-2 text-sm font-bold transition-all"
                          >
                             <Printer size={16} />
                             <span className="hidden sm:inline">Imprimir</span>
                          </button>
                          <button type="button" onClick={() => setIsAnalyticalModalOpen(false)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg ml-2 transition-colors">
                              <X size={20} />
                          </button>
                      </div>
                  </div>
                  
                  <div className="flex-1 overflow-auto bg-slate-950 p-0 relative">
                        <table className="w-full text-left border-collapse table-fixed min-w-[1200px]">
                            <thead className="sticky top-0 z-20 shadow-lg">
                                <tr className="bg-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">
                                    <th className="sticky left-0 z-30 bg-slate-900 border-r border-slate-800 p-4 w-32">Etapa / Data</th>
                                    <th className="sticky left-32 z-30 bg-slate-900 border-r border-slate-800 p-4 w-60">Competição / Local</th>
                                    
                                    {activeMembers.map(m => (
                                        <th key={m.id} className="p-2 text-center border-r border-slate-800 bg-slate-900 w-24 border-b-2 border-slate-800">
                                            <div className="rotate-0 truncate" title={m.name}>{m.name.split(' ')[0]}</div>
                                        </th>
                                    ))}
                                    {activeVehicles.map(v => (
                                        <th key={v.id} className="p-2 text-center border-r border-slate-800 bg-red-900/10 text-red-400 w-24 border-b-2 border-red-900/30">
                                            <div className="font-mono tracking-tighter truncate" title={v.plate}>{v.plate}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredEvents.map(event => {
                                    const d = new Date(event.date + 'T12:00:00');
                                    return (
                                        <tr key={event.id} className="hover:bg-slate-900/50 group transition-colors h-14">
                                            <td className="sticky left-0 z-10 bg-slate-950 border-r border-slate-800 p-4 text-sm font-bold">
                                                <div className="flex flex-col">
                                                    <span className="text-white">{event.date.split('-')[2]}/{event.date.split('-')[1]}</span>
                                                    <span className="text-[10px] text-slate-500 font-medium uppercase">{d.toLocaleDateString('pt-BR', { weekday: 'short' })}</span>
                                                </div>
                                            </td>
                                            <td className="sticky left-32 z-10 bg-slate-950 border-r border-slate-800 p-4">
                                                <div className="flex flex-col truncate">
                                                    <span className="text-xs font-bold text-slate-300 truncate">{getChampName(event.championshipId)}</span>
                                                    <span className="text-[10px] text-red-500 font-black uppercase truncate tracking-tight">{event.stage}</span>
                                                    <span className="text-[9px] text-slate-500 uppercase truncate">{getCityObj(event.cityId)?.name}</span>
                                                </div>
                                            </td>

                                            {/* Intersection Matrix: Members */}
                                            {activeMembers.map(m => {
                                                const isAssigned = event.memberIds.some(id => String(id) === String(m.id));
                                                return (
                                                    <td key={m.id} className={`p-0 border-r border-slate-800 text-center ${isAssigned ? 'bg-slate-900/40' : ''}`}>
                                                        {isAssigned && (
                                                            <div className="flex items-center justify-center h-full">
                                                                <CheckCircle2 size={20} className="text-green-500 shadow-sm" />
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}

                                            {/* Intersection Matrix: Vehicles */}
                                            {activeVehicles.map(v => {
                                                const isAssigned = event.vehicleIds.some(id => String(id) === String(v.id));
                                                return (
                                                    <td key={v.id} className={`p-0 border-r border-slate-800 text-center ${isAssigned ? 'bg-red-950/20' : ''}`}>
                                                        {isAssigned && (
                                                            <div className="flex items-center justify-center h-full">
                                                                <Truck size={20} className="text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]" />
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}

                                {/* Totals Footer Row */}
                                <tr className="bg-slate-900/80 font-bold border-t-2 border-slate-800 h-12">
                                    <td colSpan={2} className="sticky left-0 z-30 bg-slate-900 border-r border-slate-800 p-4 text-[10px] uppercase text-slate-400 text-right">
                                        Total de Escalas no Período
                                    </td>
                                    {activeMembers.map(m => (
                                        <td key={m.id} className="text-center border-r border-slate-800 text-white text-xs">
                                            {getMemberTotal(m.id)}
                                        </td>
                                    ))}
                                    {activeVehicles.map(v => (
                                        <td key={v.id} className="text-center border-r border-slate-800 text-red-500 text-xs">
                                            {getVehicleTotal(v.id)}
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                  </div>

                  <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center px-6">
                      <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                              <CheckCircle2 size={14} className="text-green-500" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Convocado</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <Truck size={14} className="text-red-500" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Veículo Escalado</span>
                          </div>
                      </div>
                      <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                          RBC Motorsport Logística • Gerado em {new Date().toLocaleDateString('pt-BR')}
                      </p>
                  </div>
              </div>
          </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[80] p-4 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 text-white border-l-4 border-red-600 pl-4 uppercase italic tracking-tighter">{editingId ? 'Editar Evento RBC' : 'Novo Evento RBC'}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Campeonato</label>
                    <select
                        required
                        className="w-full rounded-lg bg-slate-950 border-slate-700 border p-3 text-white focus:ring-2 focus:ring-red-500 outline-none font-bold"
                        value={formData.championshipId}
                        onChange={e => setFormData({ ...formData, championshipId: e.target.value })}
                    >
                        <option value="" disabled>Selecione...</option>
                        {data.championships.map(c => ( <option key={c.id} value={c.id}>{c.name}</option> ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Etapa / Nome da Prova</label>
                    <input
                        type="text"
                        required
                        className="w-full rounded-lg bg-slate-950 border-slate-700 border p-3 text-white focus:ring-2 focus:ring-red-500 outline-none font-bold"
                        value={formData.stage}
                        onChange={e => setFormData({ ...formData, stage: e.target.value })}
                    />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Data da Etapa</label>
                    <input
                        type="date"
                        required
                        className="w-full rounded-lg bg-slate-950 border-slate-700 border p-3 text-white focus:ring-2 focus:ring-red-500 outline-none [color-scheme:dark] font-bold"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value, memberIds: [], vehicleIds: [] })}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">Cidade Sede</label>
                    <select
                        required
                        className="w-full rounded-lg bg-slate-950 border-slate-700 border p-3 text-white focus:ring-2 focus:ring-red-500 outline-none font-bold"
                        value={formData.cityId}
                        onChange={e => setFormData({ ...formData, cityId: e.target.value })}
                    >
                        <option value="" disabled>Selecione...</option>
                        {sortedCities.map(c => ( <option key={c.id} value={c.id}>{c.name} - {c.state}</option> ))}
                    </select>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Users size={16} className="text-red-500" />
                        Convocação da Equipe
                    </label>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{formData.memberIds.length} selecionados</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border border-slate-800 rounded-xl p-4 bg-slate-950 max-h-48 overflow-y-auto shadow-inner">
                    {activeMembers.map(member => {
                        const isSelected = formData.memberIds.some(mId => String(mId) === String(member.id));
                        const conflict = getConflictingEvent(member.id);
                        const isUnavailable = !!conflict;
                        
                        return (
                            <div 
                                key={member.id} 
                                onClick={() => !isUnavailable && toggleMember(member.id)}
                                className={`p-2 rounded-lg border flex flex-col gap-1 transition-all select-none
                                    ${isSelected ? 'bg-red-900/20 border-red-600 text-red-400 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'}
                                    ${isUnavailable ? 'opacity-30 grayscale cursor-not-allowed border-dashed' : 'cursor-pointer hover:border-slate-600'}
                                `}
                            >
                                <div className="flex items-center justify-between gap-2 overflow-hidden">
                                    <span className="text-[10px] truncate">{member.name}</span>
                                    {isSelected && <Check size={12} className="shrink-0" />}
                                    {isUnavailable && <AlertCircle size={10} className="text-red-600 shrink-0" />}
                                </div>
                            </div>
                        );
                    })}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Truck size={16} className="text-blue-500" />
                        Escala da Frota
                    </label>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{formData.vehicleIds.length} veículos</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 border border-slate-800 rounded-xl p-4 bg-slate-950 max-h-48 overflow-y-auto shadow-inner">
                    {activeVehicles.map(vehicle => {
                        const isSelected = formData.vehicleIds.some(vId => String(vId) === String(vehicle.id));
                        const conflict = getConflictingVehicleEvent(vehicle.id);
                        const isUnavailable = !!conflict;
                        
                        return (
                            <div 
                                key={vehicle.id} 
                                onClick={() => !isUnavailable && toggleVehicle(vehicle.id)}
                                className={`p-2 rounded-lg border flex flex-col gap-1 transition-all select-none
                                    ${isSelected ? 'bg-blue-900/20 border-blue-600 text-blue-400 font-bold' : 'bg-slate-900 border-slate-800 text-slate-400'}
                                    ${isUnavailable ? 'opacity-30 grayscale cursor-not-allowed border-dashed' : 'cursor-pointer hover:border-slate-600'}
                                `}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-mono tracking-wider truncate">{vehicle.plate}</span>
                                    {isSelected && <Check size={12} className="shrink-0" />}
                                    {isUnavailable && <AlertCircle size={10} className="text-red-600 shrink-0" />}
                                </div>
                                <span className="text-[8px] uppercase tracking-tighter truncate opacity-60">{vehicle.brand} {vehicle.model}</span>
                            </div>
                        );
                    })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
                <button type="button" onClick={closeModal} className="px-5 py-2.5 text-slate-400 hover:bg-slate-800 rounded-xl transition-colors font-bold uppercase text-xs">Descartar</button>
                <button type="submit" className="px-6 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-black transition-all shadow-lg shadow-red-900/20 uppercase text-xs tracking-widest">Salvar Escala Operacional</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsView;

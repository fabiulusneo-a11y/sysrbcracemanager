
import React, { useState, useEffect, useMemo } from 'react';
import { Event, AppData, Member, Vehicle, Model, ModelForecast } from '../../types';
import { Plus, Trash2, Edit2, MapPin, Users, Check, Filter, XCircle, FileSpreadsheet, AlertCircle, Download, Table as TableIcon, Loader2, X, Printer, Truck, CheckCircle2, Package, Hash } from 'lucide-react';
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
    modelForecast: [],
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

  const getModelForecastSummary = (forecast: ModelForecast[]) => {
    return forecast.map(f => {
        const m = data.models.find(mod => String(mod.id) === String(f.modelId));
        return m ? `${m.model} (${f.quantity})` : 'N/A';
    }).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  };

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

  const alphabetizedModels = useMemo(() => 
    [...data.models]
      .sort((a, b) => String(a.model).localeCompare(String(b.model), 'pt-BR', { sensitivity: 'base' })),
    [data.models]
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

  const totals = useMemo(() => {
    const memberTotals: Record<string, number> = {};
    const vehicleTotals: Record<string, number> = {};
    const modelTotals: Record<string, number> = {};

    activeMembers.forEach(m => memberTotals[m.id] = 0);
    activeVehicles.forEach(v => vehicleTotals[v.id] = 0);
    alphabetizedModels.forEach(mod => modelTotals[mod.id] = 0);

    filteredEvents.forEach(event => {
      event.memberIds.forEach(id => { if (memberTotals[id] !== undefined) memberTotals[id]++; });
      event.vehicleIds.forEach(id => { if (vehicleTotals[id] !== undefined) vehicleTotals[id]++; });
      event.modelForecast?.forEach(f => { if (modelTotals[f.modelId] !== undefined) modelTotals[f.modelId] += f.quantity; });
    });

    return { members: memberTotals, vehicles: vehicleTotals, models: modelTotals };
  }, [filteredEvents, activeMembers, activeVehicles, alphabetizedModels]);

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
        modelForecast: event.modelForecast || [],
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
        modelForecast: [],
        confirmed: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handlePrintAnalytical = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Habilite pop-ups para imprimir.");
      return;
    }

    const dateCounts: Record<string, number> = {};
    filteredEvents.forEach(e => {
      dateCounts[e.date] = (dateCounts[e.date] || 0) + 1;
    });

    const renderedDates = new Set<string>();

    const htmlContent = `
      <html>
        <head>
          <title>Matriz Analítica RBC - Frota, Equipe e Modelos</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 20px; font-size: 8px; color: #1e293b; margin: 0; }
            .toolbar { 
              position: fixed; top: 0; left: 0; right: 0; 
              background: #1e293b; color: white; padding: 10px 20px; 
              display: flex; justify-content: flex-end; gap: 10px; 
              z-index: 1000; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .toolbar button { 
              padding: 6px 15px; border: none; border-radius: 4px; 
              font-weight: 800; font-size: 10px; cursor: pointer; text-transform: uppercase;
            }
            .btn-print { background: #ef4444; color: white; }
            .btn-close { background: #64748b; color: white; }
            .content-wrapper { padding-top: 50px; }
            h1 { font-size: 16px; margin-bottom: 5px; color: #000; text-transform: uppercase; border-bottom: 2px solid #ef4444; display: inline-block; padding-bottom: 2px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { border: 0.5px solid #cbd5e1; padding: 4px 2px; text-align: center; vertical-align: middle; font-size: 7px; line-height: 1; }
            th { background-color: #f8fafc; font-weight: 900; text-transform: uppercase; font-size: 6px; color: #64748b; }
            tfoot td { background-color: #f1f5f9; font-weight: 900; border-top: 2px solid #000; font-size: 7px; color: #000; }
            .date-cell-merged { border: 2px solid #64748b !important; font-weight: 900 !important; background-color: #f1f5f9 !important; color: #0f172a !important; font-size: 8px !important; }
            .event-info { text-align: left; padding-left: 5px; font-weight: 900; text-transform: uppercase; font-size: 7px; color: #64748b; background: #fff; line-height: 1.2; }
            .checked { background-color: #ef4444 !important; color: #fff !important; font-weight: 900; font-size: 7px; }
            .checked-qty { background-color: #3b82f6 !important; color: #fff !important; font-weight: 900; font-size: 7px; }
            tr.date-group-separator td { border-bottom: 2.5px solid #ef4444 !important; }
            @media print { .toolbar { display: none !important; } .content-wrapper { padding-top: 0 !important; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="toolbar">
            <button class="btn-print" onclick="window.print()">Imprimir</button>
            <button class="btn-close" onclick="window.close()">Fechar</button>
          </div>
          <div class="content-wrapper">
            <h1>Matriz Analítica de Escala RBC</h1>
            <table>
              <thead>
                <tr>
                  <th colspan="4" style="background: #fff; border: none;"></th>
                  <th colspan="${activeMembers.length}" style="background: #f1f5f9; border-bottom: 2px solid #334155;">Equipe (${activeMembers.length})</th>
                  <th colspan="${activeVehicles.length}" style="background: #fef2f2; border-bottom: 2px solid #ef4444;">Frota (${activeVehicles.length})</th>
                  <th colspan="${alphabetizedModels.length}" style="background: #eff6ff; border-bottom: 2px solid #3b82f6;">Modelos (${alphabetizedModels.length})</th>
                </tr>
                <tr>
                  <th style="width: 50px;">Data</th>
                  <th style="width: 100px;">Campeonato</th>
                  <th style="width: 80px;">Etapa</th>
                  <th style="width: 80px;">Cidade</th>
                  ${activeMembers.map(m => `<th>${m.name.split(' ')[0]}</th>`).join('')}
                  ${activeVehicles.map(v => `<th>${v.plate}</th>`).join('')}
                  ${alphabetizedModels.map(mod => `<th>${String(mod.model).substring(0,8)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${filteredEvents.map((event, index) => {
                  const isFirstOfDate = !renderedDates.has(event.date);
                  const rowspan = isFirstOfDate ? dateCounts[event.date] : 0;
                  if (isFirstOfDate) renderedDates.add(event.date);
                  const isLastOfDateGroup = index === filteredEvents.length - 1 || filteredEvents[index + 1].date !== event.date;
                  const rowClass = isLastOfDateGroup ? 'date-group-separator' : '';
                  return `
                    <tr class="${rowClass}">
                      ${isFirstOfDate ? `<td rowspan="${rowspan}" class="date-cell-merged" style="text-align: center;">${formatToBRDate(event.date)}</td>` : ''}
                      <td class="event-info">${getChampName(event.championshipId)}</td>
                      <td class="event-info">${event.stage}</td>
                      <td class="event-info">${getCityObj(event.cityId)?.name || 'N/A'}</td>
                      ${activeMembers.map(m => {
                        const isSelected = event.memberIds.some(id => String(id) === String(m.id));
                        return `<td class="${isSelected ? 'checked' : ''}">${isSelected ? 'X' : ''}</td>`;
                      }).join('')}
                      ${activeVehicles.map(v => {
                        const isSelected = event.vehicleIds.some(id => String(id) === String(v.id));
                        return `<td class="${isSelected ? 'checked' : ''}">${isSelected ? 'X' : ''}</td>`;
                      }).join('')}
                      ${alphabetizedModels.map(mod => {
                        const forecastItem = event.modelForecast?.find(f => String(f.modelId) === String(mod.id));
                        const qty = forecastItem?.quantity || 0;
                        return `<td class="${qty > 0 ? 'checked-qty' : ''}">${qty > 0 ? qty : ''}</td>`;
                      }).join('')}
                    </tr>
                  `;
                }).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" style="text-align: right; padding-right: 10px;">TOTAIS</td>
                  ${activeMembers.map(m => `<td>${totals.members[m.id]}</td>`).join('')}
                  ${activeVehicles.map(v => `<td>${totals.vehicles[v.id]}</td>`).join('')}
                  ${alphabetizedModels.map(mod => `<td>${totals.models[mod.id]}</td>`).join('')}
                </tr>
              </tfoot>
            </table>
          </div>
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
      worksheet.addRow([
        '', '', '', '', 
        `EQUIPE (${activeMembers.length})`, ...new Array(activeMembers.length - 1).fill(''), 
        `FROTA (${activeVehicles.length})`, ...new Array(activeVehicles.length - 1).fill(''), 
        `PREVISÃO DE MODELOS (${alphabetizedModels.length})`
      ]);
      worksheet.mergeCells(1, 5, 1, 4 + activeMembers.length);
      worksheet.mergeCells(1, 5 + activeMembers.length, 1, 4 + activeMembers.length + activeVehicles.length);
      worksheet.mergeCells(1, 5 + activeMembers.length + activeVehicles.length, 1, 4 + activeMembers.length + activeVehicles.length + alphabetizedModels.length);
      
      worksheet.addRow([
        'DATA', 
        'CAMPEONATO', 
        'ETAPA', 
        'CIDADE', 
        ...activeMembers.map(m => m.name.toUpperCase()), 
        ...activeVehicles.map(v => v.plate.toUpperCase()),
        ...alphabetizedModels.map(mod => String(mod.model).toUpperCase())
      ]);

      filteredEvents.forEach(event => {
        worksheet.addRow([
          formatToBRDate(event.date),
          getChampName(event.championshipId),
          event.stage,
          getCityObj(event.cityId)?.name || '',
          ...activeMembers.map(m => event.memberIds.some(id => String(id) === String(m.id)) ? 'X' : ''),
          ...activeVehicles.map(v => event.vehicleIds.some(id => String(id) === String(v.id)) ? 'X' : ''),
          ...alphabetizedModels.map(mod => {
              const forecastItem = event.modelForecast?.find(f => String(f.modelId) === String(mod.id));
              return forecastItem ? forecastItem.quantity : '';
          })
        ]);
      });

      worksheet.addRow([
        'TOTAIS', '', '', '',
        ...activeMembers.map(m => totals.members[m.id]),
        ...activeVehicles.map(v => totals.vehicles[v.id]),
        ...alphabetizedModels.map(mod => totals.models[mod.id])
      ]);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `Matriz_RBC_Escala_${new Date().toISOString().split('T')[0]}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Erro ao exportar planilha.");
    } finally {
      setIsExporting(false);
    }
  };

  const toggleMember = (id: string) => {
    const current = [...formData.memberIds];
    const index = current.findIndex(mId => String(mId) === String(id));
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(id);
    }
    setFormData({ ...formData, memberIds: current });
  };

  const toggleVehicle = (id: string | number) => {
    const current = [...formData.vehicleIds];
    const index = current.findIndex(vId => String(vId) === String(id));
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(id);
    }
    setFormData({ ...formData, vehicleIds: current });
  };

  const handleModelQtyChange = (modelId: string | number, qty: number) => {
      const current = [...(formData.modelForecast || [])];
      const index = current.findIndex(f => String(f.modelId) === String(modelId));
      
      if (qty <= 0) {
          if (index > -1) current.splice(index, 1);
      } else {
          if (index > -1) {
              current[index].quantity = qty;
          } else {
              current.push({ modelId, quantity: qty });
          }
      }
      setFormData({ ...formData, modelForecast: current });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 italic uppercase tracking-tighter">Escala de Etapas</h2>
          <p className="text-slate-400">Gestão operacional de competições.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
                type="button"
                onClick={() => setIsAnalyticalModalOpen(true)}
                disabled={filteredEvents.length === 0}
                className="flex-1 sm:flex-none justify-center bg-blue-700 hover:bg-blue-600 text-white border border-blue-800 disabled:opacity-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
                <TableIcon size={18} />
                <span>Matriz Operacional</span>
            </button>
            <button
                onClick={() => openModal()}
                className="flex-1 sm:flex-none justify-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-bold shadow-lg shadow-red-900/20"
            >
                <Plus size={18} />
                <span>Agendar Etapa</span>
            </button>
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center flex-wrap">
        <div className="flex items-center gap-2 text-slate-400 mr-2 w-full md:w-auto">
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
            const memberNames = getMemberNames(event.memberIds || []);
            const vehiclePlates = getVehiclePlates(event.vehicleIds || []);
            const modelSummary = getModelForecastSummary(event.modelForecast || []);
            const d = new Date(event.date + 'T12:00:00');
            return (
                <div key={event.id} className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-6 group hover:border-red-500/50 transition-colors">
                    <div className="flex-shrink-0 flex md:flex-col items-center gap-2 md:w-24 md:border-r md:border-slate-800 md:pr-4">
                        <span className="text-2xl font-bold text-slate-100">{d.getDate()}</span>
                        <span className="text-sm font-bold text-red-500 uppercase tracking-wider">{d.toLocaleDateString('pt-BR', { month: 'short' })}</span>
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
                            <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-sm">
                                <MapPin size={14} className="text-slate-600" />
                                {data.cities.find(c => c.id === event.cityId)?.name}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-2 border-t border-slate-800/50">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    <Users size={14} className="text-slate-600" />
                                    Equipe ({memberNames.length})
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {memberNames.map((name, idx) => (
                                        <span key={idx} className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md text-[10px]">
                                            {name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    <Truck size={14} className="text-slate-600" />
                                    Frota ({vehiclePlates.length})
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {vehiclePlates.map((plate, idx) => (
                                        <span key={idx} className="px-2 py-0.5 bg-blue-900/10 border border-blue-900/20 text-blue-400 rounded-md text-[10px] font-mono font-bold">
                                            {plate}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    <Package size={14} className="text-slate-600" />
                                    Modelos ({modelSummary.length})
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {modelSummary.map((summary, idx) => (
                                        <span key={idx} className="px-2 py-0.5 bg-green-900/10 border border-green-900/20 text-green-400 rounded-md text-[10px] font-bold uppercase tracking-tight">
                                            {summary}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex md:flex-col gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openModal(event)} className="p-2 text-slate-500 hover:text-blue-400 rounded-lg transition-colors">
                            <Edit2 size={18} />
                        </button>
                        <button onClick={() => setDeleteModal({ isOpen: true, event })} className="p-2 text-slate-500 hover:text-red-400 rounded-lg transition-colors">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            );
        })}
      </div>

      {isAnalyticalModalOpen && (
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4 backdrop-blur-md">
              <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-[98vw] h-[92vh] flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/80">
                      <div className="flex items-center gap-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <FileSpreadsheet className="text-red-500" />
                            Matriz Operacional RBC
                        </h3>
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
                          <button type="button" onClick={handlePrintAnalytical} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-2 text-sm font-bold transition-all">
                             <Printer size={16} />
                             <span className="hidden sm:inline">Imprimir</span>
                          </button>
                          <button type="button" onClick={() => setIsAnalyticalModalOpen(false)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg ml-2 transition-colors">
                              <X size={20} />
                          </button>
                      </div>
                  </div>
                  <div className="flex-1 overflow-auto bg-slate-950 p-0 relative custom-scrollbar">
                        <table className="w-full text-left border-collapse table-auto min-w-max">
                            <thead className="sticky top-0 z-20 shadow-lg">
                                <tr className="bg-slate-950 text-[9px] font-black text-slate-400 uppercase tracking-widest h-8 border-b border-slate-800">
                                    <th className="sticky left-0 z-30 bg-slate-950 border-r border-slate-800 p-0">
                                      <div className="w-[80px]"></div>
                                    </th>
                                    <th className="sticky left-[80px] z-30 bg-slate-950 border-r border-slate-800 p-0">
                                      <div className="w-[200px]"></div>
                                    </th>
                                    <th colSpan={activeMembers.length} className="text-center border-r border-slate-800 bg-slate-900/50">Equipe (${activeMembers.length})</th>
                                    <th colSpan={activeVehicles.length} className="text-center border-r border-slate-800 bg-red-950/30 text-red-500">Frota (${activeVehicles.length})</th>
                                    <th colSpan={alphabetizedModels.length} className="text-center border-r border-slate-800 bg-blue-950/30 text-blue-400">Modelos (${alphabetizedModels.length})</th>
                                </tr>
                                <tr className="bg-slate-900 text-[10px] font-bold text-slate-500 uppercase tracking-widest h-10">
                                    <th className="sticky left-0 z-30 bg-slate-900 border-r border-slate-800 p-4 w-[80px] min-w-[80px] whitespace-nowrap">Data</th>
                                    <th className="sticky left-[80px] z-30 bg-slate-900 border-r border-slate-800 p-4 w-[200px] min-w-[200px] whitespace-nowrap">Campeonato / Etapa</th>
                                    {activeMembers.map(m => (
                                        <th key={m.id} className="p-2 text-center border-r border-slate-800 bg-slate-900 min-w-[80px] whitespace-nowrap">
                                            {m.name.split(' ')[0]}
                                        </th>
                                    ))}
                                    {activeVehicles.map(v => (
                                        <th key={v.id} className="p-2 text-center border-r border-slate-800 bg-red-900/10 text-red-400 min-w-[80px] whitespace-nowrap">
                                            {v.plate}
                                        </th>
                                    ))}
                                    {alphabetizedModels.map(mod => (
                                        <th key={mod.id} className="p-2 text-center border-r border-slate-800 bg-blue-900/10 text-blue-400 min-w-[80px] whitespace-nowrap">
                                            {String(mod.model).substring(0,8)}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {filteredEvents.map(event => {
                                    const d = new Date(event.date + 'T12:00:00');
                                    return (
                                        <tr key={event.id} className="hover:bg-slate-900/50 group transition-colors h-14">
                                            <td className="sticky left-0 z-10 bg-slate-950 border-r border-slate-800 p-4 text-sm font-bold w-[80px]">
                                                {d.getDate()}/{d.getMonth()+1}
                                            </td>
                                            <td className="sticky left-[80px] z-10 bg-slate-950 border-r border-slate-800 p-4 w-[200px]">
                                                <div className="flex flex-col truncate w-full">
                                                    <span className="text-xs font-bold text-slate-300 truncate block">{getChampName(event.championshipId)}</span>
                                                    <span className="text-[10px] text-red-500 font-black uppercase truncate block">{event.stage}</span>
                                                </div>
                                            </td>
                                            {activeMembers.map(m => {
                                                const isAssigned = event.memberIds.some(id => String(id) === String(m.id));
                                                return (
                                                    <td key={m.id} className={`p-0 border-r border-slate-800 text-center ${isAssigned ? 'bg-slate-900/40' : ''}`}>
                                                        {isAssigned && <CheckCircle2 size={18} className="text-green-500 mx-auto" />}
                                                    </td>
                                                );
                                            })}
                                            {activeVehicles.map(v => {
                                                const isAssigned = event.vehicleIds.some(id => String(id) === String(v.id));
                                                return (
                                                    <td key={v.id} className={`p-0 border-r border-slate-800 text-center ${isAssigned ? 'bg-red-950/20' : ''}`}>
                                                        {isAssigned && <Truck size={18} className="text-red-500 mx-auto" />}
                                                    </td>
                                                );
                                            })}
                                            {alphabetizedModels.map(mod => {
                                                const forecast = event.modelForecast?.find(f => String(f.modelId) === String(mod.id));
                                                const qty = forecast?.quantity || 0;
                                                return (
                                                    <td key={mod.id} className={`p-0 border-r border-slate-800 text-center font-black text-xs ${qty > 0 ? 'bg-blue-950/20 text-blue-400' : 'text-slate-800'}`}>
                                                        {qty > 0 ? qty : ''}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="sticky bottom-0 z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.3)]">
                                <tr className="bg-slate-900 text-[10px] font-black uppercase h-10 border-t border-slate-700">
                                    <td className="sticky left-0 z-30 bg-slate-900 border-r border-slate-800 p-4" colSpan={2}>Somatórios Totais:</td>
                                    {activeMembers.map(m => (
                                        <td key={m.id} className="p-2 text-center border-r border-slate-800 bg-slate-900 text-white">
                                            {totals.members[m.id]}
                                        </td>
                                    ))}
                                    {activeVehicles.map(v => (
                                        <td key={v.id} className="p-2 text-center border-r border-slate-800 bg-red-900/20 text-red-500">
                                            {totals.vehicles[v.id]}
                                        </td>
                                    ))}
                                    {alphabetizedModels.map(mod => (
                                        <td key={mod.id} className="p-2 text-center border-r border-slate-800 bg-blue-900/20 text-blue-400">
                                            {totals.models[mod.id]}
                                        </td>
                                    ))}
                                </tr>
                            </tfoot>
                        </table>
                  </div>
              </div>
          </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50 sticky top-0 z-10">
              <h3 className="text-xl font-black text-white italic uppercase tracking-tight">{editingId ? 'Editar Evento' : 'Novo Evento'}</h3>
              <button onClick={closeModal} className="text-slate-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Campeonato</label>
                  <select required className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-red-500 outline-none" value={formData.championshipId} onChange={e => setFormData({ ...formData, championshipId: e.target.value })}>
                    <option value="" disabled>Selecione...</option>
                    {data.championships.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Etapa / Descrição</label>
                  <input type="text" required className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-red-500 outline-none" value={formData.stage} onChange={e => setFormData({ ...formData, stage: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Data</label>
                  <input type="date" required className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-red-500 outline-none [color-scheme:dark]" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cidade / Local</label>
                  <select required className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-red-500 outline-none" value={formData.cityId} onChange={e => setFormData({ ...formData, cityId: e.target.value })}>
                    <option value="" disabled>Selecione...</option>
                    {data.cities.map(c => <option key={c.id} value={c.id}>{c.name} - {c.state}</option>)}
                  </select>
                </div>
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Status</label>
                    <button type="button" onClick={() => setFormData({...formData, confirmed: !formData.confirmed})} className={`w-full p-3 rounded-xl border font-bold uppercase text-xs ${formData.confirmed ? 'bg-green-900/20 text-green-400 border-green-800 text-green-400' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                        {formData.confirmed ? 'Confirmado' : 'Indefinido'}
                    </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block border-b border-slate-800 pb-2">Equipe Técnica ({formData.memberIds.length})</label>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {activeMembers.map(member => {
                      const isSelected = formData.memberIds.some(mId => String(mId) === String(member.id));
                      return (
                        <button key={member.id} type="button" onClick={() => toggleMember(member.id)} className={`p-2 rounded-lg border text-left text-[11px] transition-all ${isSelected ? 'bg-red-900/20 border-red-500/50 text-white font-bold' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                          {member.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block border-b border-slate-800 pb-2">Logística de Frota ({formData.vehicleIds.length})</label>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {activeVehicles.map(vehicle => {
                      const isSelected = formData.vehicleIds.some(vId => String(vId) === String(vehicle.id));
                      return (
                        <button key={vehicle.id} type="button" onClick={() => toggleVehicle(vehicle.id)} className={`p-2 rounded-lg border text-left text-[11px] font-mono transition-all ${isSelected ? 'bg-blue-900/20 border-blue-500/50 text-white font-bold' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                          {vehicle.plate}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest block border-b border-slate-800 pb-2">Previsão de Equipamentos ({formData.modelForecast?.length || 0})</label>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {alphabetizedModels.map(mod => {
                      const forecast = formData.modelForecast?.find(f => String(f.modelId) === String(mod.id));
                      const quantity = forecast?.quantity || 0;
                      return (
                        <div key={mod.id} className={`flex items-center gap-2 p-2 rounded-lg border transition-all ${quantity > 0 ? 'bg-green-900/10 border-green-500/30' : 'bg-slate-900 border-slate-800'}`}>
                          <span className={`flex-grow text-[11px] font-bold uppercase truncate ${quantity > 0 ? 'text-green-400' : 'text-slate-500'}`}>
                            {mod.model}
                          </span>
                          <div className="relative w-16">
                              <Hash className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-600" size={10} />
                              <input 
                                type="text"
                                inputMode="numeric"
                                pattern="\d*"
                                className="w-full bg-slate-950 border border-slate-700 rounded p-1 pl-5 text-[10px] font-black text-white outline-none focus:ring-1 focus:ring-green-500 text-center"
                                value={quantity || ''}
                                placeholder="0"
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    handleModelQtyChange(mod.id, parseInt(val) || 0);
                                }}
                              />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-slate-800">
                <button type="button" onClick={closeModal} className="px-6 py-3 text-slate-400 hover:bg-slate-800 rounded-xl font-bold text-xs uppercase transition-colors">Descartar</button>
                <button type="submit" className="px-10 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black text-xs uppercase transition-all shadow-xl shadow-red-900/30">Salvar Etapa</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal 
        isOpen={deleteModal.isOpen}
        itemName={`${getChampName(deleteModal.event?.championshipId || '')} - ${deleteModal.event?.stage}`}
        title="Excluir Evento"
        description="Esta ação removerá permanentemente o evento do calendário RBC Motorsport."
        onClose={() => setDeleteModal({ isOpen: false, event: null })}
        onConfirm={() => deleteModal.event && onDelete(deleteModal.event.id)}
      />
    </div>
  );
};

export default EventsView;

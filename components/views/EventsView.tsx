
import React, { useState, useEffect, useMemo } from 'react';
import { Event, AppData, Member, Vehicle, Model, ModelForecast } from '../../types';
import { Plus, Trash2, Edit2, MapPin, Users, Check, Filter, XCircle, FileSpreadsheet, AlertCircle, Download, Table as TableIcon, Loader2, X, Printer, Truck, CheckCircle2, Package, Hash, AlertTriangle, Trophy, Calendar as CalendarIcon, Info, FileText } from 'lucide-react';
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

  const [formData, setFormData] = useState<Omit<Event, 'id'>>({
    championshipId: '',
    cityId: '',
    date: new Date().toISOString().split('T')[0],
    stage: '01',
    memberIds: [],
    vehicleIds: [],
    modelForecast: [],
    confirmed: true
  });

  const [filterChampionship, setFilterChampionship] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const occupiedResources = useMemo(() => {
    const dateToSearch = formData.date;
    const otherEvents = data.events.filter(e => 
      e.date === dateToSearch && String(e.id) !== String(editingId)
    );

    return {
      members: otherEvents.flatMap(e => e.memberIds.map(String)),
      vehicles: otherEvents.flatMap(e => e.vehicleIds.map(String))
    };
  }, [data.events, formData.date, editingId]);

  const clearFilters = () => {
    setFilterChampionship('');
    setStartDate('');
    setEndDate('');
  };

  useEffect(() => {
    if (initialEditingId) {
        const eventToEdit = data.events.find(e => String(e.id) === String(initialEditingId));
        if (eventToEdit) {
            openModal(eventToEdit);
        }
        onClearEditingId?.();
    }
  }, [initialEditingId, data.events]);

  const getChampName = (id: string) => data.championships.find(c => String(c.id) === String(id))?.name || 'N/A';
  const getCityObj = (id: string) => data.cities.find(c => String(c.id) === String(id));
  
  const formatToBRDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
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
          const matchesChamp = filterChampionship ? String(event.championshipId) === String(filterChampionship) : true;
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

  const handlePrintAnalytical = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Habilite pop-ups para visualizar o relatório.");
      return;
    }

    const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
    const fileName = `Matriz_Operacional_RBC_${timestamp}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>${fileName}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
        <style>
          @page { size: A4 landscape; margin: 10mm 5mm 15mm 5mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { 
            font-family: 'Inter', sans-serif; 
            margin: 0; 
            padding: 10px; 
            background: #fff; 
            color: #000; 
            font-size: 10px; 
            line-height: 1.1; 
          }
          
          .print-toolbar {
            position: fixed; top: 0; left: 0; right: 0; background: #0f172a; color: #fff; padding: 10px 20px;
            display: flex; justify-content: space-between; align-items: center; z-index: 1000;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .btn {
            border: none; padding: 8px 16px; border-radius: 6px;
            font-weight: 700; font-size: 11px; cursor: pointer; text-transform: uppercase;
            transition: all 0.2s; display: flex; align-items: center; gap: 8px;
          }
          .btn-print { background: #dc2626; color: #fff; }
          .btn-close { background: #475569; color: #fff; }

          #report-container { background: #fff; padding: 5px; width: 100%; margin: 0 auto; }

          .header-main { margin-top: 50px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 3px solid #000; padding-bottom: 10px; }
          .header-main h1 { margin: 0; font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; }
          .header-subtitle { font-weight: 800; font-size: 12px; text-transform: uppercase; color: #475569; }

          /* Tabela Principal */
          table { border-collapse: collapse; border: 2.5px solid #000; width: 100%; table-layout: auto; }
          th, td { border: 1.2px solid #000; padding: 4px 3px; text-align: center; vertical-align: middle; color: #000; }
          
          /* Repetição de cabeçalho em múltiplas páginas */
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }

          /* Seções Coloridas */
          .section-info { background-color: #d9e2f3 !important; font-weight: 900; }
          .section-equipe { background-color: #e2f0d9 !important; font-weight: 900; }
          .section-frota { background-color: #ffffff !important; font-weight: 900; }
          .section-modelos { background-color: #fff2cc !important; font-weight: 900; }

          /* AJUSTE RIGOROSO DE ALTURA: 75px */
          .vertical-header {
            height: 75px !important;
            width: 28px;
            padding: 0 !important;
            position: relative;
            vertical-align: bottom;
          }
          .v-container {
            width: 28px;
            height: 75px !important;
            position: relative;
            margin: 0 auto;
          }
          .v-text {
            position: absolute;
            bottom: 5px;
            left: 50%;
            transform: rotate(-90deg);
            transform-origin: left bottom;
            white-space: nowrap;
            font-size: 9px;
            font-weight: 800;
            text-align: left;
            width: 65px; 
            display: block;
            margin-left: -4px; 
            text-transform: uppercase;
          }

          /* Alinhamento de altura para células horizontais do sub-cabeçalho */
          .h-align { height: 75px !important; }

          .mark-cell { background-color: #fee2e2 !important; font-weight: 900; color: #dc2626 !important; }
          .total-row { background-color: #f8fafc !important; font-weight: 900; }
          .total-row td { border-top: 2.5px solid #000; font-weight: 900; padding: 8px 4px; }

          /* Footer de Impressão Nativa */
          .footer-doc { 
            display: none; 
          }

          @media print {
            .print-toolbar { display: none !important; }
            .header-main { margin-top: 0; }
            body { padding-bottom: 20mm; }
            
            .footer-doc { 
              display: flex !important; 
              position: fixed; 
              bottom: 0; 
              left: 0; 
              right: 0; 
              border-top: 1.5px solid #000; 
              padding: 8px 15px; 
              justify-content: space-between;
              align-items: center;
              background: #fff;
              font-size: 9px; 
              font-weight: 800; 
            }
          }
        </style>
      </head>
      <body>
        <div class="print-toolbar">
          <div style="font-weight: 800; font-size: 14px;">MATRIZ OPERACIONAL RBC</div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-close" onclick="window.close()">Fechar</button>
            <button class="btn btn-print" style="background: #2563eb;" onclick="window.print()">Exportar PDF / Imprimir</button>
          </div>
        </div>

        <div id="report-container">
          <div class="header-main">
            <div>
              <h1>RBC MOTORSPORT</h1>
              <div class="header-subtitle">MATRIZ OPERACIONAL E LOGÍSTICA</div>
            </div>
            <div style="text-align: right; font-size: 11px; font-weight: 700;">
              EMISSÃO: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th colspan="4" class="section-info">INFORMAÇÕES DO EVENTO</th>
                <th colspan="${activeMembers.length}" class="section-equipe">EQUIPE TÉCNICA</th>
                <th colspan="${activeVehicles.length}" class="section-frota">FROTA</th>
                <th colspan="${alphabetizedModels.length}" class="section-modelos">MODELOS</th>
              </tr>
              <tr>
                <th class="h-align" style="width: 65px; font-weight: 900;">DATA</th>
                <th class="h-align" style="width: 150px; text-align: left; padding-left: 8px; font-weight: 900;">CAMPEONATO</th>
                <th class="h-align" style="width: 60px; font-weight: 900;">ETAPA</th>
                <th class="h-align" style="width: 120px; text-align: left; padding-left: 8px; font-weight: 900;">CIDADE</th>
                ${activeMembers.map(m => `
                  <th class="vertical-header">
                    <div class="v-container">
                        <span class="v-text">${m.name}</span>
                    </div>
                  </th>`).join('')}
                ${activeVehicles.map(v => `
                  <th class="vertical-header">
                    <div class="v-container">
                        <span class="v-text">${v.plate}</span>
                    </div>
                  </th>`).join('')}
                ${alphabetizedModels.map(mod => `
                  <th class="vertical-header">
                    <div class="v-container">
                        <span class="v-text">${mod.model}</span>
                    </div>
                  </th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${filteredEvents.map(event => `
                <tr>
                  <td style="font-weight: 800;">${formatToBRDate(event.date).substring(0,5)}</td>
                  <td style="text-align: left; padding-left: 8px; font-weight: 700;">${getChampName(event.championshipId)}</td>
                  <td style="font-weight: 600;">${event.stage}</td>
                  <td style="text-align: left; padding-left: 8px;">${getCityObj(event.cityId)?.name || ''}</td>
                  ${activeMembers.map(m => {
                    const has = event.memberIds.some(id => String(id) === String(m.id));
                    return `<td class="${has ? 'mark-cell' : ''}">${has ? '1' : ''}</td>`;
                  }).join('')}
                  ${activeVehicles.map(v => {
                    const has = event.vehicleIds.some(id => String(id) === String(v.id));
                    return `<td class="${has ? 'mark-cell' : ''}">${has ? '1' : ''}</td>`;
                  }).join('')}
                  ${alphabetizedModels.map(mod => {
                    const f = event.modelForecast?.find(f => String(f.modelId) === String(mod.id));
                    return `<td style="font-weight: 800; background-color: #fffbeb !important;">${f?.quantity || ''}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="4" style="text-align: right; padding-right: 15px; font-weight: 900; text-transform: uppercase;">TOTAIS:</td>
                ${activeMembers.map(m => `<td style="font-weight: 900;">${totals.members[m.id]}</td>`).join('')}
                ${activeVehicles.map(v => `<td style="font-weight: 900;">${totals.vehicles[v.id]}</td>`).join('')}
                ${alphabetizedModels.map(mod => `<td style="font-weight: 900;">${totals.models[mod.id]}</td>`).join('')}
              </tr>
            </tfoot>
          </table>

          <div class="footer-doc">
            <div>RBC MOTORSPORT - SISTEMA DE GESTÃO E LOGÍSTICA</div>
            <div>Matriz Operacional RBC</div>
          </div>
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
      const worksheet = workbook.addWorksheet('Matriz RBC');
      
      worksheet.addRow(['INFORMAÇÕES', '', '', '', 'EQUIPE', ...new Array(activeMembers.length - 1).fill(''), 'FROTA', ...new Array(activeVehicles.length - 1).fill(''), 'MODELOS']);
      worksheet.addRow(['DATA', 'CAMPEONATO', 'ETAPA', 'CIDADE', ...activeMembers.map(m => m.name), ...activeVehicles.map(v => v.plate), ...alphabetizedModels.map(mod => mod.model)]);

      filteredEvents.forEach(event => {
        worksheet.addRow([
          formatToBRDate(event.date),
          getChampName(event.championshipId),
          event.stage,
          getCityObj(event.cityId)?.name || '',
          ...activeMembers.map(m => event.memberIds.some(id => String(id) === String(m.id)) ? 1 : ''),
          ...activeVehicles.map(v => event.vehicleIds.some(id => String(id) === String(v.id)) ? 1 : ''),
          ...alphabetizedModels.map(mod => {
              const f = event.modelForecast?.find(f => String(f.modelId) === String(mod.id));
              return f ? f.quantity : '';
          })
        ]);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Matriz_RBC_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
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
        cityId: data.cities[0]?.id || '',
        date: new Date().toISOString().split('T')[0],
        stage: '01',
        memberIds: [],
        vehicleIds: [],
        modelForecast: [],
        confirmed: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
        onUpdate({ id: editingId, ...formData });
    } else {
        onAdd({ id: crypto.randomUUID(), ...formData });
    }
    setIsModalOpen(false);
  };

  const toggleMember = (id: string) => {
    const idStr = String(id);
    if (occupiedResources.members.includes(idStr)) return;

    setFormData(prev => {
        const exists = prev.memberIds.some(mid => String(mid) === idStr);
        return {
            ...prev,
            memberIds: exists 
                ? prev.memberIds.filter(mid => String(mid) !== idStr) 
                : [...prev.memberIds, id]
        };
    });
  };

  const toggleVehicle = (id: string | number) => {
    const idStr = String(id);
    if (occupiedResources.vehicles.includes(idStr)) return;

    setFormData(prev => {
        const exists = prev.vehicleIds.some(vid => String(vid) === idStr);
        return {
            ...prev,
            vehicleIds: exists 
                ? prev.vehicleIds.filter(vid => String(vid) !== idStr) 
                : [...prev.vehicleIds, id]
        };
    });
  };

  const setModelQty = (modelId: string | number, value: number) => {
    const qty = Math.max(0, value);
    setFormData(prev => {
        const idStr = String(modelId);
        const exists = prev.modelForecast.some(f => String(f.modelId) === String(idStr));
        
        if (qty === 0) {
            return { ...prev, modelForecast: prev.modelForecast.filter(f => String(f.modelId) !== String(idStr)) };
        }
        
        if (!exists) {
            return { ...prev, modelForecast: [...prev.modelForecast, { modelId, quantity: qty }] };
        }
        
        return {
            ...prev,
            modelForecast: prev.modelForecast.map(f => String(f.modelId) === String(idStr) ? { ...f, quantity: qty } : f)
        };
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 italic uppercase tracking-tighter">Escala de Etapas</h2>
          <p className="text-slate-400 text-sm">Controle de escala analítica RBC.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
            <button type="button" onClick={() => setIsAnalyticalModalOpen(true)} className="flex-1 sm:flex-none justify-center bg-blue-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm font-bold">
                <TableIcon size={18} />
                <span>Matriz Operacional</span>
            </button>
            <button onClick={() => openModal()} className="flex-1 sm:flex-none justify-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-bold shadow-lg">
                <Plus size={18} />
                <span>Agendar Etapa</span>
            </button>
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center shadow-sm">
        <div className="flex items-center gap-2 text-slate-500 mr-2 shrink-0">
            <Filter size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Filtros</span>
        </div>
        <select 
            value={filterChampionship} 
            onChange={(e) => setFilterChampionship(e.target.value)} 
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none w-full lg:w-72 focus:ring-1 focus:ring-red-500 transition-all shrink-0"
        >
            <option value="">Todos Campeonatos</option>
            {data.championships.map(c => ( <option key={c.id} value={c.id}>{c.name}</option> ))}
        </select>
        <div className="flex items-center gap-2 w-full lg:flex-1 lg:max-w-md">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm [color-scheme:dark] w-full focus:ring-1 focus:ring-red-500 transition-all" />
            <span className="text-slate-600 font-bold text-xs uppercase shrink-0">à</span>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm [color-scheme:dark] w-full focus:ring-1 focus:ring-red-500 transition-all" />
        </div>
        <button 
            onClick={clearFilters}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-900/10 hover:bg-red-900/20 text-red-500 rounded-lg text-xs font-black uppercase tracking-widest transition-all border border-red-900/20 w-full lg:w-auto shrink-0"
        >
            <XCircle size={14} />
            Limpar Filtros
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredEvents.length === 0 ? (
            <div className="p-20 text-center bg-slate-900/50 border-2 border-dashed border-slate-800 rounded-2xl">
                <CalendarIcon className="mx-auto text-slate-700 mb-4" size={48} />
                <p className="text-slate-500 font-medium">Nenhum evento encontrado para os filtros aplicados.</p>
            </div>
        ) : (
            filteredEvents.map((event) => {
                const d = new Date(event.date + 'T12:00:00');
                const isConfirmed = event.confirmed !== false;
                return (
                    <div key={event.id} className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col items-stretch gap-4 group hover:border-red-500/50 transition-all">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                            <div className="flex flex-col items-center w-20 border-r border-slate-800 pr-6 shrink-0">
                                <span className="text-3xl font-black text-slate-100 leading-none">{d.getDate()}</span>
                                <span className="text-xs font-bold text-red-500 uppercase tracking-widest">{d.toLocaleDateString('pt-BR', { month: 'short' })}</span>
                                <span className="text-[10px] text-slate-600 font-bold mt-1">{d.getFullYear()}</span>
                            </div>
                            <div className="flex-grow space-y-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-black text-slate-100 uppercase tracking-tight text-lg">{getChampName(event.championshipId)}</h3>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${
                                        isConfirmed ? 'bg-green-900/20 text-green-400 border-green-800/50' : 'bg-amber-900/20 text-amber-500 border-amber-800/50'
                                    }`}>
                                        {isConfirmed ? 'Confirmado' : 'Indefinido'}
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                        <Trophy size={14} className="text-slate-600" />
                                        {event.stage}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={14} className="text-slate-600" />
                                        {getCityObj(event.cityId)?.name || 'Local Indefinido'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                <button onClick={() => openModal(event)} className="p-2.5 text-slate-400 hover:text-blue-400 hover:bg-blue-900/10 rounded-xl transition-all"><Edit2 size={18} /></button>
                                <button onClick={() => setDeleteModal({ isOpen: true, event })} className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-900/10 rounded-xl transition-all"><Trash2 size={18} /></button>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800/50 flex flex-wrap gap-6">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <Users size={12} />
                                    <span>Equipe ({event.memberIds.length})</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {event.memberIds.length === 0 ? (
                                        <span className="text-[10px] text-slate-700 italic">Nenhum escalado</span>
                                    ) : (
                                        event.memberIds.map(id => {
                                            const member = data.members.find(m => String(m.id) === String(id));
                                            return member ? (
                                                <span key={id} className="px-2 py-0.5 bg-slate-800/60 text-slate-300 border border-slate-700/50 rounded text-[9px] font-bold">
                                                    {member.name.split(' ')[0]}
                                                </span>
                                            ) : null;
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <Truck size={12} />
                                    <span>Frota ({event.vehicleIds.length})</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {event.vehicleIds.length === 0 ? (
                                        <span className="text-[10px] text-slate-700 italic">Nenhum veículo</span>
                                    ) : (
                                        event.vehicleIds.map(id => {
                                            const vehicle = data.vehicles.find(v => String(v.id) === String(v.id));
                                            return vehicle ? (
                                                <span key={id} className="px-2 py-0.5 bg-blue-900/10 text-blue-400 border border-blue-900/30 rounded text-[9px] font-black font-mono tracking-wider">
                                                    {vehicle.plate}
                                                </span>
                                            ) : null;
                                        })
                                    )}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    <Package size={12} />
                                    <span>Modelos ({event.modelForecast?.length || 0})</span>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {(!event.modelForecast || event.modelForecast.length === 0) ? (
                                        <span className="text-[10px] text-slate-700 italic">Sem previsão</span>
                                    ) : (
                                        event.modelForecast.map(f => {
                                            const model = data.models.find(m => String(m.id) === String(f.modelId));
                                            return model ? (
                                                <span key={f.modelId} className="px-2 py-0.5 bg-green-900/10 text-green-400 border-green-900/30 rounded text-[9px] font-black">
                                                    {model.model} <span className="text-white ml-1 font-mono">({f.quantity})</span>
                                                </span>
                                            ) : null;
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })
        )}
      </div>

      {isAnalyticalModalOpen && (
          <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-[100] p-4 backdrop-blur-md">
              <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-[98vw] h-[95vh] flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/80">
                      <h3 className="text-sm font-black text-white flex items-center gap-2 uppercase italic tracking-widest">Matriz Operacional RBC</h3>
                      <div className="flex items-center gap-3">
                          <button onClick={exportAnalyticalStyled} disabled={isExporting} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold transition-all disabled:opacity-50">
                             {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                             Excel
                          </button>
                          <button onClick={handlePrintAnalytical} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold">
                             <Printer size={14} />
                             Imprimir / Exportar PDF
                          </button>
                          <button onClick={() => setIsAnalyticalModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"><X size={18} /></button>
                      </div>
                  </div>
                  <div className="flex-1 overflow-auto bg-slate-950 custom-scrollbar relative">
                        <table className="w-full text-center border-collapse text-[10px]">
                            <thead className="sticky top-0 z-30 bg-slate-900 text-white">
                                <tr>
                                    <th className="p-2 border border-slate-700 bg-slate-900 sticky left-0 z-40" colSpan={4}>INFORMAÇÕES</th>
                                    <th className="p-2 border border-slate-700 bg-slate-900" colSpan={activeMembers.length}>EQUIPE</th>
                                    <th className="p-2 border border-slate-700 bg-slate-900" colSpan={activeVehicles.length}>FROTA</th>
                                    <th className="p-2 border border-slate-700 bg-slate-900" colSpan={alphabetizedModels.length}>MODELOS</th>
                                </tr>
                                <tr>
                                    <th className="p-2 border border-slate-700 bg-slate-900 sticky left-0 z-40">DATA</th>
                                    <th className="p-2 border border-slate-700 bg-slate-900 sticky left-[40px] z-40">CAMP.</th>
                                    <th className="p-2 border border-slate-700 bg-slate-900">ETAPA</th>
                                    <th className="p-2 border border-slate-700 bg-slate-900">CIDADE</th>
                                    {activeMembers.map(m => <th key={m.id} className="p-2 border border-slate-700 min-w-[80px] text-[10px] uppercase">{m.name}</th>)}
                                    {activeVehicles.map(v => <th key={v.id} className="p-2 border border-slate-700 min-w-[80px] text-[10px] uppercase">{v.plate}</th>)}
                                    {alphabetizedModels.map(mod => <th key={mod.id} className="p-2 border border-slate-700 min-w-[80px] text-[10px] uppercase">{mod.model}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800 text-slate-300">
                                {filteredEvents.map(event => (
                                    <tr key={event.id} className="h-10 hover:bg-slate-900/50">
                                        <td className="p-2 border border-slate-800 sticky left-0 z-20 bg-slate-950 text-[10px]">{formatToBRDate(event.date).substring(0,5)}</td>
                                        <td className="p-2 border border-slate-800 sticky left-[40px] z-20 bg-slate-950 text-left truncate text-[10px]">{getChampName(event.championshipId)}</td>
                                        <td className="p-2 border border-slate-800 text-[10px]">{event.stage}</td>
                                        <td className="p-2 border border-slate-800 text-left truncate text-[10px]">{getCityObj(event.cityId)?.name}</td>
                                        {activeMembers.map(m => {
                                            const active = event.memberIds.some(id => String(id) === String(m.id));
                                            return <td key={m.id} className={`border border-slate-800 text-[10px] ${active ? 'bg-red-900/30 text-red-500 font-bold' : ''}`}>{active ? '1' : ''}</td>;
                                        })}
                                        {activeVehicles.map(v => {
                                            const active = event.vehicleIds.some(id => String(id) === String(v.id));
                                            return <td key={v.id} className={`border border-slate-800 text-[10px] ${active ? 'bg-red-900/30 text-red-500 font-bold' : ''}`}>{active ? '1' : ''}</td>;
                                        })}
                                        {alphabetizedModels.map(mod => {
                                            const f = event.modelForecast?.find(f => String(f.modelId) === String(mod.id));
                                            return <td key={mod.id} className="border border-slate-800 font-bold text-[10px]">{f?.quantity || ''}</td>;
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="sticky bottom-0 z-30 bg-slate-900 text-white font-bold">
                                <tr>
                                    <td className="p-2 border border-slate-700 sticky left-0 z-40 bg-slate-900 text-[10px]" colSpan={4}>TOTAIS</td>
                                    {activeMembers.map(m => <td key={m.id} className="p-2 border border-slate-700 text-[10px]">{totals.members[m.id]}</td>)}
                                    {activeVehicles.map(v => <td key={v.id} className="p-2 border border-slate-700 text-[10px]">{totals.vehicles[v.id]}</td>)}
                                    {alphabetizedModels.map(mod => <td key={mod.id} className="p-2 border border-slate-700 text-[10px]">{totals.models[mod.id]}</td>)}
                                </tr>
                            </tfoot>
                        </table>
                  </div>
              </div>
          </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110] p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
                        {editingId ? <Edit2 className="text-white" size={20} /> : <Plus className="text-white" size={24} />}
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tight">{editingId ? 'Editar Agendamento' : 'Novo Agendamento'}</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Escala Técnica RBC Motorsport</p>
                    </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-500 hover:text-white transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
                        <CalendarIcon size={18} className="text-red-500" />
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Informações da Etapa</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Campeonato</label>
                            <select 
                                required 
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-white font-bold text-sm focus:ring-2 focus:ring-red-600 outline-none"
                                value={formData.championshipId}
                                onChange={e => setFormData({...formData, championshipId: e.target.value})}
                            >
                                <option value="" disabled>Selecione...</option>
                                {data.championships.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Cidade / Local</label>
                            <select 
                                required 
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-white font-bold text-sm focus:ring-2 focus:ring-red-600 outline-none"
                                value={formData.cityId}
                                onChange={e => setFormData({...formData, cityId: e.target.value})}
                            >
                                <option value="" disabled>Selecione...</option>
                                {data.cities.map(c => <option key={c.id} value={c.id}>{c.name} - {c.state}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Data da Prova</label>
                            <input 
                                type="date" 
                                required 
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-white font-bold text-sm focus:ring-2 focus:ring-red-600 outline-none [color-scheme:dark]"
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                            />
                        </div>
                        <div className="lg:col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nome da Etapa</label>
                            <input 
                                type="text" 
                                required 
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-white font-bold text-sm focus:ring-2 focus:ring-red-600 outline-none placeholder:text-slate-800"
                                placeholder="EX: 01 / FINAL"
                                value={formData.stage}
                                onChange={e => setFormData({...formData, stage: e.target.value})}
                            />
                        </div>
                        <div className="lg:col-span-2 flex items-end">
                            <button
                                type="button"
                                onClick={() => setFormData({...formData, confirmed: !formData.confirmed})}
                                className={`w-full flex items-center justify-between rounded-xl border p-3.5 transition-all ${
                                    formData.confirmed ? 'bg-green-900/10 border-green-800/50 text-green-400' : 'bg-amber-900/10 border-amber-900/20 text-amber-500'
                                }`}
                            >
                                <span className="text-[10px] font-black uppercase tracking-widest">{formData.confirmed ? 'Evento Confirmado' : 'Evento Indefinido'}</span>
                                {formData.confirmed ? <CheckCircle2 size={20} className="text-green-500" /> : <AlertTriangle size={20} className="text-amber-500" />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
                        <Users size={18} className="text-blue-500" />
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Escala de Equipe</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {activeMembers.length === 0 ? (
                            <p className="col-span-full text-center text-slate-600 italic text-sm py-4">Nenhum integrante ativo para escalar.</p>
                        ) : (
                            activeMembers.map(member => {
                                const idStr = String(member.id);
                                const isSelected = formData.memberIds.some(mid => String(mid) === idStr);
                                const isOccupied = occupiedResources.members.includes(idStr);
                                
                                return (
                                    <div 
                                        key={member.id}
                                        onClick={() => toggleMember(member.id)}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                                            isSelected 
                                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20' 
                                                : isOccupied
                                                    ? 'bg-slate-900/50 border-red-900/30 text-slate-600 cursor-not-allowed opacity-60 grayscale'
                                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                                        }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-white/20' : 'bg-slate-800'}`}>
                                            {isOccupied ? <X size={10} className="text-red-500" /> : <Check size={14} className={isSelected ? 'opacity-100' : 'opacity-0'} />}
                                        </div>
                                        <div className="overflow-hidden flex-grow">
                                            <p className="text-[11px] font-black truncate uppercase tracking-tight">{member.name}</p>
                                            <div className="flex items-center justify-between">
                                                <p className={`text-[8px] font-bold uppercase ${isSelected ? 'text-blue-100' : 'text-slate-600'}`}>{member.role}</p>
                                                {isOccupied && <span className="text-[7px] bg-red-900/20 text-red-500 px-1 rounded font-black">OCUPADO</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
                        <Truck size={18} className="text-purple-500" />
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Frota e Logística</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {activeVehicles.length === 0 ? (
                            <p className="col-span-full text-center text-slate-600 italic text-sm py-4">Nenhum veículo disponível na frota.</p>
                        ) : (
                            activeVehicles.map(vehicle => {
                                const idStr = String(vehicle.id);
                                const isSelected = formData.vehicleIds.some(vid => String(vid) === idStr);
                                const isOccupied = occupiedResources.vehicles.includes(idStr);
                                
                                return (
                                    <div 
                                        key={vehicle.id}
                                        onClick={() => toggleVehicle(vehicle.id)}
                                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                                            isSelected 
                                                ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/20' 
                                                : isOccupied
                                                    ? 'bg-slate-900/50 border-red-900/30 text-slate-600 cursor-not-allowed opacity-60 grayscale'
                                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-600'
                                        }`}
                                    >
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-white/20' : 'bg-slate-800'}`}>
                                            {isOccupied ? <X size={10} className="text-red-500" /> : <Check size={14} className={isSelected ? 'opacity-100' : 'opacity-0'} />}
                                        </div>
                                        <div className="flex-grow">
                                            <p className="text-xs font-black uppercase tracking-widest">{vehicle.plate}</p>
                                            <div className="flex items-center justify-between">
                                                <p className={`text-[8px] font-bold uppercase ${isSelected ? 'text-purple-100' : 'text-slate-600'}`}>{vehicle.brand} {vehicle.model}</p>
                                                {isOccupied && <span className="text-[7px] bg-red-900/20 text-red-500 px-1 rounded font-black">EM USO</span>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-800 pb-2">
                        <Package size={18} className="text-amber-500" />
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Previsão de Ativos / Modelos</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {alphabetizedModels.length === 0 ? (
                            <p className="col-span-full text-center text-slate-600 italic text-sm py-4">Nenhum modelo cadastrado.</p>
                        ) : (
                            alphabetizedModels.map(model => {
                                const forecast = formData.modelForecast.find(f => String(f.modelId) === String(model.id));
                                const qty = forecast?.quantity || 0;
                                return (
                                    <div key={model.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between group hover:border-amber-900/40 transition-colors">
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{model.type}</p>
                                            <p className="text-xs font-bold text-slate-300 truncate uppercase">{model.model}</p>
                                        </div>
                                        <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
                                            <input 
                                                type="number"
                                                min="0"
                                                className={`w-16 bg-transparent text-center text-sm font-black p-2 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                                    qty > 0 ? 'text-white' : 'text-slate-700'
                                                }`}
                                                placeholder="0"
                                                value={qty || ''}
                                                onChange={(e) => setModelQty(model.id, parseInt(e.target.value) || 0)}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-start gap-4 mt-8">
                    <Info size={24} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-slate-500 font-bold uppercase leading-relaxed tracking-wider">
                        O sistema detecta automaticamente se um integrante ou veículo já está escalado em outro evento na mesma data. Itens ocupados são bloqueados para garantir a consistência operacional.
                    </p>
                </div>
            </form>

            <div className="p-6 border-t border-slate-800 bg-slate-950/80 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="px-6 py-3 text-slate-400 hover:text-white font-black uppercase text-xs tracking-widest transition-colors"
              >
                Descartar
              </button>
              <button 
                onClick={handleSubmit}
                className="px-8 py-3 bg-red-600 text-white rounded-xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-red-900/30 hover:bg-red-700 transition-all active:scale-95"
              >
                Gravar Escala RBC
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal 
        isOpen={deleteModal.isOpen} 
        itemName={getChampName(deleteModal.event?.championshipId || '') + ' - ' + deleteModal.event?.stage} 
        title="Excluir Agendamento" 
        description="Esta ação removerá permanentemente esta etapa do cronograma e todas as suas escalas associadas." 
        onClose={() => setDeleteModal({ isOpen: false, event: null })} 
        onConfirm={() => deleteModal.event && onDelete(deleteModal.event.id)} 
      />
    </div>
  );
};

export default EventsView;

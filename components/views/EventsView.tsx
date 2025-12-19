
import React, { useState, useEffect } from 'react';
import { Event, AppData, Member } from '../../types';
import { Plus, Trash2, Edit2, MapPin, Users, Check, Filter, XCircle, FileSpreadsheet, AlertCircle, Download, Table as TableIcon, Loader2, X, Printer } from 'lucide-react';
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

  const handlePrintAnalytical = () => {
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      alert("Habilite pop-ups para visualizar o relatório.");
      return;
    }

    const memberHeaders = sortedMembersList.map(m => `
        <th class="rotate-header">
            <div><span>${m.name}</span></div>
        </th>
    `).join('');

    const tableRows = filteredEvents.map((event, idx) => {
        const city = getCityObj(event.cityId);
        const isConfirmed = event.confirmed !== false;
        const memberCells = sortedMembersList.map(member => {
            const isConvocado = event.memberIds.includes(member.id);
            return `
                <td class="cell-data ${isConvocado ? 'is-selected' : 'is-empty'}">
                    ${isConvocado ? '1' : '0'}
                </td>
            `;
        }).join('');

        return `
            <tr>
                <td style="text-align: center; border: 1px solid #94a3b8;">${formatToBRDate(event.date)}</td>
                <td style="font-weight: 800; border: 1px solid #94a3b8;">${getChampName(event.championshipId)}</td>
                <td style="text-align: center; border: 1px solid #94a3b8;">${event.stage.replace(/\D/g, '') || (idx+1)}</td>
                <td style="border: 1px solid #94a3b8;">${city?.name || 'N/A'}</td>
                <td style="text-align: center; border: 1px solid #94a3b8;">${city?.state || '??'}</td>
                <td style="text-align: center; border: 1px solid #94a3b8;">
                    <div class="status-badge ${isConfirmed ? 'status-confirmed' : 'status-pending'}">
                        ${isConfirmed ? 'CONFIRM' : 'INDEF'}
                    </div>
                </td>
                ${memberCells}
            </tr>
        `;
    }).join('');

    const totalsRow = sortedMembersList.map(member => {
        const total = getMemberTotal(member.id);
        return `<td style="text-align: center; font-weight: 900; background: #fee2e2; color: #b91c1c; border: 1px solid #ef4444; font-size: 9px;">${total}</td>`;
    }).join('');

    reportWindow.document.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Matriz RBC - ${new Date().toLocaleDateString('pt-BR')}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap" rel="stylesheet">
        <style>
          @page { size: A4 landscape; margin: 0.8cm 0.8cm 1.5cm 0.8cm; }
          body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; background: #fff; color: #0D0D0D; font-size: 8px; line-height: 1.1; counter-reset: page; }
          
          table { width: 100%; border-collapse: collapse; table-layout: fixed; border: 1px solid #94a3b8; }
          thead { display: table-header-group; }
          
          .report-header { border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-start; }
          .report-header h1 { margin: 0; font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; color: #000; }
          .record-count { font-size: 10px; font-weight: 800; color: #ef4444; text-transform: uppercase; margin-top: 2px; }
          
          th { padding: 4px; background: #d9d9d9; color: #0D0D0D; font-size: 7px; font-weight: 900; text-transform: uppercase; border: 1px solid #94a3b8; }
          td { padding: 3px 4px; vertical-align: middle; word-wrap: break-word; }

          /* Zebra Striping */
          tbody tr:nth-child(even) { background-color: #f1f5f9; }
          tbody tr:nth-child(odd) { background-color: #ffffff; }

          .rotate-header { height: 95px; white-space: nowrap; vertical-align: bottom; padding: 0 !important; }
          .rotate-header > div { transform: rotate(180deg); writing-mode: vertical-rl; width: 25px; margin: 0 auto; }
          .rotate-header span { font-size: 7px; font-weight: 900; letter-spacing: 0.5px; }

          .cell-data { text-align: center; font-weight: 800; font-size: 9px; border: 1px solid #94a3b8; }
          .is-selected { color: #b91c1c; background-color: #fef2f2 !important; }
          .is-empty { color: #cbd5e1; }

          .status-badge { font-size: 6px; font-weight: 900; text-transform: uppercase; padding: 1px 3px; border-radius: 2px; display: inline-block; }
          .status-confirmed { border: 1px solid #166534; color: #166534; background: #f0fdf4; }
          .status-pending { border: 1px solid #92400e; color: #92400e; background: #fffbeb; }

          .print-toolbar {
            position: fixed; top: 0; left: 0; right: 0; background: #111; color: #fff; padding: 6px 20px;
            display: flex; justify-content: space-between; align-items: center; z-index: 1000;
          }
          .btn-print {
            background: #ef4444; color: #fff; border: none; padding: 5px 10px; border-radius: 4px;
            font-weight: 800; font-size: 9px; cursor: pointer; text-transform: uppercase;
          }

          /* Rodapé Fixo para Impressão */
          #footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 30px;
            display: none;
            justify-content: space-between;
            align-items: center;
            font-size: 7px;
            color: #94a3b8;
            font-weight: 700;
            text-transform: uppercase;
            border-top: 1px solid #cbd5e1;
            background: white;
            padding: 0 10px;
          }

          .page-counter::after {
            content: "Página " counter(page) " / " counter(pages);
          }

          @media print {
            .print-toolbar { display: none !important; }
            body { padding: 0; }
            thead { display: table-header-group; }
            th { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: #d9d9d9 !important; color: #0D0D0D !important; }
            #footer { display: flex !important; }
          }
        </style>
      </head>
      <body>
        <div class="print-toolbar">
          <span style="font-weight: 800; font-size: 9px; text-transform: uppercase; letter-spacing: 1px;">Matriz Analítica RBC Motorsport (Paisagem)</span>
          <button class="btn-print" onclick="window.print()">Imprimir Agora (A4)</button>
        </div>
        <div style="height: 35px;"></div>

        <div class="report-header">
            <div>
                <h1>RBC Motorsport</h1>
                <div class="record-count">Total de Registros: ${filteredEvents.length} eventos no período</div>
                <div style="font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 7px; margin-top: 1px;">Matriz Analítica de Convocação de Equipe</div>
            </div>
            <div style="text-align: right; font-size: 7px; color: #94a3b8;">
                DATA DE EMISSÃO: <b>${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</b>
            </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 60px;">Data</th>
              <th style="width: 140px; text-align: left;">Campeonato</th>
              <th style="width: 20px;">Et.</th>
              <th style="width: 100px; text-align: left;">Cidade</th>
              <th style="width: 25px;">UF</th>
              <th style="width: 45px;">Status</th>
              ${memberHeaders}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
          <tfoot>
            <tr style="border-top: 2px solid #000; background: #f1f5f9;">
                <td colspan="6" style="text-align: right; font-weight: 900; font-size: 8px; text-transform: uppercase; border: 1px solid #94a3b8;">Soma das Convocações:</td>
                ${totalsRow}
            </tr>
          </tfoot>
        </table>

        <div id="footer">
            <span>RBC Motorsport • Gerado via RBC System</span>
            <span>Documento Técnico • Configuração A4 Paisagem</span>
            <span class="page-counter"></span>
        </div>
      </body>
      </html>
    `);
    reportWindow.document.close();
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
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
            cell.font = { color: { argb: 'FF0D0D0D' }, bold: true };
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
                if (isStriped) { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; }
                if (colNumber > 6) {
                    if (cell.value === 1) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
                        cell.font = { color: { argb: 'FFB91C1C' }, bold: true };
                    } else { cell.font = { color: { argb: 'FF94A3B8' } }; }
                    cell.alignment = { horizontal: 'center' };
                }
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `matriz_rbc_${new Date().toISOString().split('T')[0]}.xlsx`;
        anchor.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Export Error:", error);
    } finally { setIsExporting(false); }
  };

  const getMemberTotal = (memberId: string) => {
    return filteredEvents.reduce((acc, event) => acc + (event.memberIds.includes(memberId) ? 1 : 0), 0);
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
                        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/50">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                <Users size={14} className="text-slate-600" />
                                Equipe Convocada
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {memberNames.length > 0 ? (
                                    memberNames.map((name, idx) => (
                                        <span key={idx} className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md text-[10px] font-medium">
                                            {name}
                                        </span>
                                    ))
                                ) : (
                                    <span className="text-amber-600 text-[10px] font-bold italic flex items-center gap-1">
                                        <AlertCircle size={10} />
                                        Sem escala definida
                                    </span>
                                )}
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
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <FileSpreadsheet className="text-blue-500" />
                            Matriz Analítica de Convocação
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={handlePrintAnalytical}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all border border-slate-700"
                          >
                              <Printer size={16} />
                              <span>Imprimir</span>
                          </button>
                          <button 
                            type="button"
                            onClick={exportAnalyticalStyled}
                            disabled={isExporting}
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-green-900/20 disabled:opacity-50"
                          >
                              {isExporting ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
                              <span>{isExporting ? 'Processando...' : 'Exportar Excel'}</span>
                          </button>
                          <button type="button" onClick={() => setIsAnalyticalModalOpen(false)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg ml-2">
                              <X size={20} />
                          </button>
                      </div>
                  </div>
                  
                  <div className="flex-1 overflow-auto bg-white p-0 relative">
                      <div className="min-w-max inline-block align-top">
                        <table className="border-collapse table-auto">
                            <thead className="sticky top-0 z-40">
                                <tr className="bg-[#0f172a] text-white">
                                    <th className="p-2 border border-white/10 text-[10px] font-bold uppercase tracking-wider sticky left-0 z-50 bg-[#0f172a] w-[85px] text-center align-middle">Data</th>
                                    <th className="p-2 border border-white/10 text-[10px] font-bold uppercase tracking-wider sticky left-[85px] z-50 bg-[#0f172a] w-[180px] text-left align-middle">Campeonato</th>
                                    <th className="p-2 border border-white/10 text-[10px] font-bold uppercase tracking-wider w-[45px] text-center align-middle">Et.</th>
                                    <th className="p-2 border border-white/10 text-[10px] font-bold uppercase tracking-wider w-[120px] text-left align-middle">Cidade</th>
                                    <th className="p-2 border border-white/10 text-[10px] font-bold uppercase tracking-wider w-[35px] text-center align-middle">UF</th>
                                    <th className="p-2 border border-white/10 text-[10px] font-bold uppercase tracking-wider w-[80px] text-center align-middle">Status</th>
                                    {sortedMembersList.map(member => (
                                        <th key={member.id} className="p-2 border border-white/10 relative bg-[#0f172a] w-[40px] min-w-[40px] text-center align-middle">
                                            <span className="[writing-mode:vertical-rl] rotate-180 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-white leading-none inline-block">
                                                {member.name}
                                            </span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="z-10 relative">
                                {filteredEvents.map((event, idx) => {
                                    const city = getCityObj(event.cityId);
                                    const champName = getChampName(event.championshipId);
                                    const isConfirmed = event.confirmed !== false;
                                    const rowBgClass = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50';
                                    
                                    return (
                                        <tr key={event.id} className={`border-b border-slate-200 transition-colors hover:bg-blue-50/50 ${rowBgClass}`}>
                                            <td className={`p-2 border border-slate-200 font-mono text-[10px] text-slate-900 font-semibold sticky left-0 z-30 text-center ${rowBgClass}`}>
                                                {formatToBRDate(event.date)}
                                            </td>
                                            <td className={`p-2 border border-slate-200 font-bold text-slate-900 text-[10px] sticky left-[85px] z-30 ${rowBgClass}`}>
                                                <div className="truncate max-w-[170px]">{champName}</div>
                                            </td>
                                            <td className={`p-2 border border-slate-200 text-[10px] text-slate-800 text-center font-medium ${rowBgClass}`}>
                                                {event.stage.replace(/\D/g, '') || (idx + 1).toString().padStart(2, '0')}
                                            </td>
                                            <td className={`p-2 border border-slate-200 text-[10px] text-slate-800 truncate max-w-[110px] font-medium ${rowBgClass}`}>
                                                {city?.name || 'N/A'}
                                            </td>
                                            <td className={`p-2 border border-slate-200 text-[10px] text-slate-800 text-center font-medium ${rowBgClass}`}>
                                                {city?.state || '??'}
                                            </td>
                                            <td className={`p-2 border border-slate-200 text-center ${rowBgClass}`}>
                                                <span className={`text-[8px] font-bold px-1 py-0.5 rounded border inline-block ${
                                                    isConfirmed ? 'bg-green-100 text-green-800 border-green-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                                                }`}>
                                                    {isConfirmed ? 'CONFIRM' : 'INDEF'}
                                                </span>
                                            </td>
                                            {sortedMembersList.map(member => {
                                                const isConvocado = event.memberIds.includes(member.id);
                                                return (
                                                    <td key={member.id} className={`p-1 border border-slate-200 text-center text-[11px] font-bold ${isConvocado ? 'bg-red-50 text-red-600' : 'text-slate-300'} ${rowBgClass}`}>
                                                        {isConvocado ? '1' : '0'}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="sticky bottom-0 z-40 shadow-[0_-2px_4px_rgba(0,0,0,0.1)]">
                                <tr className="bg-slate-200 font-bold border-t-2 border-slate-400">
                                    <td colSpan={6} className="p-2 text-right text-[10px] uppercase tracking-wider text-black sticky left-0 bg-slate-200 z-50 border border-slate-300">
                                        Total de Convocações:
                                    </td>
                                    {sortedMembersList.map(member => (
                                        <td key={member.id} className="p-1 text-center border border-slate-300 text-[11px] font-bold bg-red-100 text-red-700">
                                            {getMemberTotal(member.id)}
                                        </td>
                                    ))}
                                </tr>
                            </tfoot>
                        </table>
                        {filteredEvents.length === 0 && (
                            <div className="p-20 text-center flex flex-col items-center justify-center gap-4 bg-white w-full">
                                <AlertCircle size={48} className="text-slate-300" />
                                <p className="text-slate-500 font-bold text-lg">Nenhum evento encontrado nos dados.</p>
                                <p className="text-slate-400 text-sm">Verifique os filtros de data ou se há eventos cadastrados.</p>
                            </div>
                        )}
                      </div>
                  </div>
                  
                  <div className="p-2 bg-slate-50 border-t border-slate-300 flex items-center justify-between text-[10px] text-slate-700">
                      <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                              <span className="font-bold text-red-600 text-xs">1</span>
                              <span className="uppercase tracking-tighter font-medium">Escalado</span>
                          </div>
                          <div className="flex items-center gap-1">
                              <span className="font-bold text-slate-300 text-xs">0</span>
                              <span className="uppercase tracking-tighter font-medium">Livre</span>
                          </div>
                      </div>
                      <p className="font-bold uppercase tracking-tight">
                          PREVIEW OPERACIONAL • {filteredEvents.length} EVENTOS • {sortedMembersList.length} INTEGRANTES
                      </p>
                  </div>
              </div>
          </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[80] p-4 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 text-white">{editingId ? 'Editar Evento' : 'Novo Evento'}</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Campeonato</label>
                    <select
                        required
                        className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 outline-none"
                        value={formData.championshipId}
                        onChange={e => setFormData({ ...formData, championshipId: e.target.value })}
                    >
                        <option value="" disabled>Selecione...</option>
                        {data.championships.map(c => ( <option key={c.id} value={c.id}>{c.name}</option> ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Etapa</label>
                    <input
                        type="text"
                        required
                        className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 outline-none"
                        value={formData.stage}
                        onChange={e => setFormData({ ...formData, stage: e.target.value })}
                    />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Data</label>
                    <input
                        type="date"
                        required
                        className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 outline-none [color-scheme:dark]"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value, memberIds: [] })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Cidade</label>
                    <select
                        required
                        className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 outline-none"
                        value={formData.cityId}
                        onChange={e => setFormData({ ...formData, cityId: e.target.value })}
                    >
                        <option value="" disabled>Selecione...</option>
                        {sortedCities.map(c => ( <option key={c.id} value={c.id}>{c.name} - {c.state}</option> ))}
                    </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Integrantes Convocados</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 border border-slate-700 rounded-lg p-3 bg-slate-950 max-h-64 overflow-y-auto">
                    {sortedMembersList.map(member => {
                        const isSelected = formData.memberIds.includes(member.id);
                        const conflict = getConflictingEvent(member.id);
                        const isUnavailable = !!conflict;
                        
                        return (
                            <div 
                                key={member.id} 
                                onClick={() => !isUnavailable && toggleMember(member.id)}
                                className={`p-2 rounded border flex flex-col gap-1 transition-all select-none
                                    ${isSelected ? 'bg-red-900/30 border-red-800 text-red-300' : 'bg-slate-900 border-slate-800 text-slate-400'}
                                    ${isUnavailable ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer hover:border-slate-600'}
                                `}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium truncate">{member.name}</span>
                                    {isSelected && <Check size={14} />}
                                    {isUnavailable && <AlertCircle size={14} className="text-red-500" />}
                                </div>
                            </div>
                        );
                    })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors">Salvar Evento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsView;


import React, { useState, useEffect } from 'react';
import { Event, AppData, Member } from '../../types';
import { Plus, Trash2, Edit2, Calendar, MapPin, Users, Check, Filter, XCircle, FileSpreadsheet, AlertCircle, CheckCircle, HelpCircle, ToggleLeft, ToggleRight, X, Download, Table as TableIcon } from 'lucide-react';
import ExcelJS from 'exceljs';

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
  
  // Filter State
  const [filterChampionship, setFilterChampionship] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Form State
  const [formData, setFormData] = useState<Omit<Event, 'id'>>({
    championshipId: '',
    cityId: '',
    date: '',
    stage: '',
    memberIds: [],
    confirmed: true
  });

  // Helpers
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

  // Sort Cities for dropdowns
  const sortedCities = [...data.cities].sort((a, b) => 
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

  // Sort Members alphabetically for matrix columns
  const sortedMembersList = [...data.members]
    .filter(m => m.active !== false)
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }));

  // Filtered Events
  const filteredEvents = data.events
    .filter(event => {
        const matchesChamp = filterChampionship ? event.championshipId === filterChampionship : true;
        const matchesStart = startDate ? event.date >= startDate : true;
        const matchesEnd = endDate ? event.date <= endDate : true;
        return matchesChamp && matchesStart && matchesEnd;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Handle Initial Editing ID (from Dashboard navigation)
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

  const handleDelete = (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    const eventName = event.stage;
    if (confirm(`Deseja realmente excluir o evento "${eventName}"?`)) {
      const confirmation = prompt(`Para confirmar a exclusão, digite o nome da etapa ("${eventName}"):`);
      if (confirmation?.trim().toLowerCase() === eventName.trim().toLowerCase()) {
        onDelete(event.id);
      } else if (confirmation !== null) {
        alert("O nome digitado não corresponde ao registro. Operação cancelada.");
      }
    }
  };

  // Availability Logic
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

  // Export Analytical Logic using ExcelJS for styling
  const exportAnalyticalStyled = async () => {
    setIsExporting(true);
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Relatório Analítico');

        const members = sortedMembersList;
        
        // Define Columns
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

        // Header Styling
        const headerRow = worksheet.getRow(1);
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' } // Blue
            };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Data Rows
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

            members.forEach(m => {
                rowData[m.id] = event.memberIds.includes(m.id) ? 1 : 0;
            });

            const row = worksheet.addRow(rowData);
            const isStriped = index % 2 !== 0;

            // Row Styling
            row.eachCell((cell, colNumber) => {
                // Background
                if (isStriped) {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFD9E1F2' } // Light Blue stripe
                    };
                }

                // Member cell logic (Red highlight if 1)
                if (colNumber > 6) {
                    if (cell.value === 1) {
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFF8D7DA' } // Light Red
                        };
                        cell.font = { color: { argb: 'FF721C24' }, bold: true };
                    } else {
                        cell.font = { color: { argb: isStriped ? 'FFD9E1F2' : 'FFFFFFFF' } }; // Hide 0s
                    }
                    cell.alignment = { horizontal: 'center' };
                } else {
                    cell.alignment = { horizontal: colNumber === 1 || colNumber === 3 || colNumber === 5 || colNumber === 6 ? 'center' : 'left' };
                }

                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        // Total Row
        const totalRowData: any = { date: 'Total', champ: filteredEvents.length };
        members.forEach(m => {
            totalRowData[m.id] = filteredEvents.filter(e => e.memberIds.includes(m.id)).length;
        });
        const totalRow = worksheet.addRow(totalRowData);
        totalRow.eachCell((cell, colNumber) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF4472C4' }
            };
            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
            cell.alignment = { horizontal: 'center' };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Generate and download
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
    } finally {
        setIsExporting(false);
    }
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
                onClick={() => setIsAnalyticalModalOpen(true)}
                disabled={filteredEvents.length === 0}
                className="flex-1 sm:flex-none justify-center bg-blue-700 hover:bg-blue-600 text-white border border-blue-800 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
                <TableIcon size={18} />
                <span>Exportar Analítico</span>
            </button>
            <button
                onClick={() => openModal()}
                disabled={data.championships.length === 0 || data.cities.length === 0}
                className="flex-1 sm:flex-none justify-center bg-red-600 hover:bg-red-700 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-sm"
            >
                <Plus size={18} />
                <span>Novo Evento</span>
            </button>
        </div>
      </div>

      {/* Filters Bar */}
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
            {data.championships.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
            ))}
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
                onClick={() => { setFilterChampionship(''); setStartDate(''); setEndDate(''); }}
                className="ml-auto md:ml-0 text-slate-400 hover:text-white flex items-center gap-1 text-sm hover:bg-slate-800 px-3 py-2 rounded-lg transition-colors"
            >
                <XCircle size={16} />
                Limpar
            </button>
        )}
      </div>

      {/* Main List Display */}
      <div className="grid grid-cols-1 gap-4">
        {filteredEvents.length === 0 ? (
             <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                <Calendar className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                <h3 className="text-lg font-medium text-slate-300">Nenhum evento encontrado</h3>
                <p className="text-slate-500">Adicione etapas manually ou ajuste os filtros.</p>
            </div>
        ) : (
            filteredEvents.map((event) => {
                const isConfirmed = event.confirmed !== false;
                const city = getCityObj(event.cityId);
                const memberNames = getMemberNames(event.memberIds);
                return (
                    <div key={event.id} className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-6 group hover:border-red-500/50 transition-colors">
                        <div className="flex-shrink-0 flex md:flex-col items-center gap-2 md:w-24 md:border-r md:border-slate-800 md:pr-4">
                            <span className="text-2xl font-bold text-slate-100">{event.date.split('-')[2]}</span>
                            <span className="text-sm font-bold text-red-500 uppercase tracking-wider">{new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}</span>
                            <span className="text-xs text-slate-500">{event.date.split('-')[0]}</span>
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

                            {/* EXIBIÇÃO DOS INTEGRANTES NO CARD */}
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
                            <button onClick={() => openModal(event)} className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors">
                                <Edit2 size={18} />
                            </button>
                            <button onClick={(e) => handleDelete(e, event)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                );
            })
        )}
      </div>

      {/* ANALYTICAL REPORT MODAL (PREVIEW) */}
      {isAnalyticalModalOpen && (
          <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 backdrop-blur-md">
              <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-[95vw] h-[90vh] flex flex-col overflow-hidden animate-fade-in">
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
                      <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <FileSpreadsheet className="text-blue-500" />
                            Relatório Analítico de Convocação
                        </h3>
                        <p className="text-sm text-slate-500">Visão matricial por integrante (Ordem Alfabética)</p>
                      </div>
                      <div className="flex items-center gap-4">
                          <button 
                            onClick={exportAnalyticalStyled}
                            disabled={isExporting}
                            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-green-900/20 disabled:opacity-50"
                          >
                              {isExporting ? <span className="animate-spin">⌛</span> : <Download size={18} />}
                              {isExporting ? 'Processando...' : 'Baixar Excel (XLSX)'}
                          </button>
                          <button onClick={() => setIsAnalyticalModalOpen(false)} className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg">
                              <X size={24} />
                          </button>
                      </div>
                  </div>

                  <div className="flex-1 overflow-auto p-6 bg-slate-100">
                      <div className="border border-slate-300 rounded overflow-hidden shadow-sm bg-white overflow-x-auto">
                          <table className="w-max min-w-full text-[11px] text-left border-collapse table-auto">
                              <thead className="sticky top-0 z-20">
                                  <tr className="bg-[#4472c4] border-b border-slate-400">
                                      <th className="p-2 text-white font-bold border-r border-slate-400 w-px whitespace-nowrap sticky left-0 z-30 bg-[#4472c4]">Data</th>
                                      <th className="p-2 text-white font-bold border-r border-slate-400 max-w-[200px] sticky left-[70px] z-30 bg-[#4472c4]">Campeonato</th>
                                      <th className="p-2 text-white font-bold border-r border-slate-400 w-px text-center whitespace-nowrap">Etapa</th>
                                      <th className="p-2 text-white font-bold border-r border-slate-400 max-w-[150px] whitespace-nowrap overflow-hidden text-ellipsis">Cidade</th>
                                      <th className="p-2 text-white font-bold border-r border-slate-400 w-px text-center px-2">UF</th>
                                      <th className="p-2 text-white font-bold border-r border-slate-400 w-px text-center whitespace-nowrap px-4">Status</th>
                                      {sortedMembersList.map(m => (
                                          <th key={m.id} className="p-2 text-white font-bold border-r border-slate-400 text-center min-w-[70px] max-w-[150px] bg-[#4472c4] whitespace-nowrap overflow-hidden text-ellipsis">
                                              {m.name}
                                          </th>
                                      ))}
                                  </tr>
                              </thead>
                              <tbody>
                                  {filteredEvents.map((event, idx) => {
                                      const city = getCityObj(event.cityId);
                                      const rowBg = idx % 2 === 0 ? 'bg-[#d9e1f2]' : 'bg-white';
                                      return (
                                          <tr key={event.id} className={`${rowBg} border-b border-slate-300 hover:bg-blue-200/40 transition-colors`}>
                                              <td className={`p-1.5 border-r border-slate-300 font-medium text-slate-800 sticky left-0 z-10 whitespace-nowrap ${rowBg}`}>{formatToBRDate(event.date)}</td>
                                              <td className={`p-1.5 border-r border-slate-300 font-medium text-slate-800 sticky left-[70px] z-10 ${rowBg} max-w-[200px] truncate`}>{getChampName(event.championshipId)}</td>
                                              <td className="p-1.5 border-r border-slate-300 text-center text-slate-700 whitespace-nowrap">{event.stage}</td>
                                              <td className="p-1.5 border-r border-slate-300 text-slate-700 truncate max-w-[150px]">{city?.name}</td>
                                              <td className="p-1.5 border-r border-slate-300 text-center text-slate-700">{city?.state}</td>
                                              <td className="p-1.5 border-r border-slate-300 text-center whitespace-nowrap">
                                                  <span className="text-[9px] font-bold text-slate-600">
                                                      {event.confirmed !== false ? 'Confirmado' : 'Indefinido'}
                                                  </span>
                                              </td>
                                              {sortedMembersList.map(member => {
                                                  const isPresent = event.memberIds.includes(member.id);
                                                  return (
                                                      <td key={member.id} className={`p-1.5 border-r border-slate-300 text-center font-bold ${isPresent ? 'bg-[#f8d7da] text-[#721c24]' : 'text-slate-200'}`}>
                                                          {isPresent ? '1' : '0'}
                                                      </td>
                                                  );
                                              })}
                                          </tr>
                                      );
                                  })}
                                  {/* Total Row */}
                                  <tr className="bg-[#4472c4] text-white font-bold sticky bottom-0 z-20">
                                      <td className="p-2 border-r border-slate-400 sticky left-0 z-30 bg-[#4472c4]">Total</td>
                                      <td className="p-2 border-r border-slate-400 sticky left-[70px] z-30 bg-[#4472c4]">{filteredEvents.length}</td>
                                      <td className="p-2 border-r border-slate-400" colSpan={4}></td>
                                      {sortedMembersList.map(member => {
                                          const count = filteredEvents.filter(e => e.memberIds.includes(member.id)).length;
                                          return (
                                              <td key={member.id} className="p-2 text-center border-r border-slate-400 bg-[#4472c4] min-w-[70px]">
                                                  {count}
                                              </td>
                                          );
                                      })}
                                  </tr>
                              </tbody>
                          </table>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* EVENT FORM MODAL */}
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
                        {data.championships.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
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
                        placeholder="Ex: Etapa 1"
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
                        {sortedCities.map(c => (
                            <option key={c.id} value={c.id}>{c.name} - {c.state}</option>
                        ))}
                    </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Confirmação da Etapa</label>
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, confirmed: !formData.confirmed })}
                    className={`w-full flex items-center justify-between rounded-lg border p-2.5 transition-colors ${
                        formData.confirmed ? 'bg-green-900/10 border-green-800/50 text-green-400' : 'bg-amber-900/10 border-amber-800/50 text-amber-500'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        {formData.confirmed ? <CheckCircle size={18} /> : <HelpCircle size={18} />}
                        <span className="text-sm font-bold uppercase">{formData.confirmed ? 'Confirmado' : 'Indefinido'}</span>
                    </div>
                    {formData.confirmed ? <ToggleRight className="text-green-500" /> : <ToggleLeft className="text-amber-600" />}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-3">Integrantes Disponíveis (Ordem Alfabética)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 border border-slate-700 rounded-lg p-3 bg-slate-950 max-h-64 overflow-y-auto">
                    {sortedMembersList.map(member => {
                        const isSelected = formData.memberIds.includes(member.id);
                        const conflictingEvent = getConflictingEvent(member.id);
                        const isUnavailable = !!conflictingEvent;
                        
                        return (
                            <div 
                                key={member.id} 
                                onClick={() => !isUnavailable && toggleMember(member.id)}
                                className={`
                                    p-2 rounded border flex flex-col gap-1 transition-all select-none
                                    ${isSelected ? 'bg-red-900/30 border-red-800 text-red-300' : 'bg-slate-900 border-slate-800 text-slate-400'}
                                    ${isUnavailable ? 'opacity-50 grayscale cursor-not-allowed bg-slate-950 border-slate-900' : 'cursor-pointer hover:border-slate-600'}
                                `}
                            >
                                <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-medium truncate">{member.name}</span>
                                {isSelected && <Check size={14} className="flex-shrink-0" />}
                                {isUnavailable && (
                                    <span title="Já convocado para outro evento nesta data">
                                        <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                                    </span>
                                )}
                                </div>
                                <div className="text-[10px] text-slate-500">{member.role}</div>
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

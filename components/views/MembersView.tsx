
import React, { useState } from 'react';
import { Member, Event, Championship, City, UserRole } from '../../types';
import { Plus, Trash2, Edit2, User, ArrowLeft, Calendar, MapPin, Trophy, ToggleLeft, ToggleRight, Printer, X, Mail, ShieldCheck } from 'lucide-react';
import DeleteConfirmModal from '../modals/DeleteConfirmModal';

interface MembersViewProps {
  members: Member[];
  events: Event[];
  championships: Championship[];
  cities: City[];
  onAdd: (member: Member) => void;
  onUpdate: (member: Member) => void;
  onDelete: (id: string) => void;
}

const MembersView: React.FC<MembersViewProps> = ({ members, events, championships, cities, onAdd, onUpdate, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{name: string, role: string, active: boolean, email: string, usertype: UserRole}>({ 
    name: '', 
    role: '', 
    active: true, 
    email: '',
    usertype: 'User'
  });
  
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; member: Member | null }>({
    isOpen: false,
    member: null
  });

  const getChampName = (id: string) => championships.find(c => c.id === id)?.name || 'N/A';
  const getCityName = (id: string) => {
      const c = cities.find(city => city.id === id);
      return c ? `${c.name} - ${c.state}` : 'N/A';
  };
  const getDisplayDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const handlePrint = () => {
    const selectedMember = members.find(m => m.id === selectedMemberId);
    const memberEvents = events
        .filter(e => e.memberIds.includes(selectedMemberId || ''))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
      alert("Habilite pop-ups para visualizar o relatório.");
      return;
    }

    const tableRows = memberEvents.map((event, index) => {
      const d = getDisplayDate(event.date);
      const isConfirmed = event.confirmed !== false;
      return `
        <tr>
          <td style="text-align: center; border-bottom: 1px solid #eee; color: #999; font-weight: 700;">${index + 1}</td>
          <td style="white-space: nowrap; border-bottom: 1px solid #eee;">${d.toLocaleDateString('pt-BR')}</td>
          <td style="font-weight: 700; border-bottom: 1px solid #eee;">${getChampName(event.championshipId)}</td>
          <td style="border-bottom: 1px solid #eee;">${event.stage}</td>
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
        <title>Relatório RBC - ${selectedMember?.name}</title>
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

          .summary-header { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 6px; padding: 10px; margin-bottom: 15px; }
          .summary-header label { font-size: 7px; font-weight: 800; text-transform: uppercase; color: #9ca3af; letter-spacing: 1px; }
          .summary-header h2 { margin: 0; font-size: 16px; font-weight: 900; color: #000; }
          .summary-header p { margin: 3px 0 0 0; font-weight: 600; color: #666; font-size: 9px; }
          
          .print-toolbar {
            position: fixed; top: 0; left: 0; right: 0; background: #111; color: #fff; padding: 8px 20px;
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
          <span style="font-weight: 800; font-size: 9px; text-transform: uppercase; letter-spacing: 1px;">Relatório Individual RBC (Modo Compacto)</span>
          <button class="btn-print" onclick="window.print()">Imprimir Agora</button>
        </div>
        <div style="height: 40px;" class="print-toolbar-spacer"></div>

        <div style="padding: 15px;">
          <table>
            <thead>
              <tr>
                <th colspan="6" style="background: transparent; border: none; padding: 0;">
                  <div class="report-header-content">
                    <div>
                      <h1>RBC Motorsport</h1>
                      <div style="font-weight: 700; color: #666; text-transform: uppercase; font-size: 9px; margin-top: 2px;">Escala Individual de Equipe</div>
                    </div>
                    <div class="meta">
                      EMISSÃO: <b>${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}</b>
                    </div>
                  </div>
                </th>
              </tr>
              <tr>
                <th style="width: 30px; text-align: center;">Nº</th>
                <th style="width: 10%;">Data</th>
                <th style="width: 25%;">Campeonato</th>
                <th style="width: 20%;">Etapa</th>
                <th style="width: 25%;">Localização</th>
                <th style="text-align: center; width: 10%;">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="6" style="padding: 0; border: none;">
                   <div class="summary-header">
                      <label>Integrante</label>
                      <h2>${selectedMember?.name}</h2>
                      <p>Cargo: <b>${selectedMember?.role}</b> | Atividades: <b>${memberEvents.length} registros</b>.</p>
                   </div>
                </td>
              </tr>
              ${memberEvents.length > 0 ? tableRows : '<tr><td colspan="6" style="text-align: center; padding: 30px; color: #999;">Nenhum registro encontrado.</td></tr>'}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="6" style="text-align: center; font-size: 7px; color: #999; padding-top: 30px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">
                  Documento Técnico • Gerado via RBC Motorsport Management System
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

  const openModal = (member?: Member) => {
    if (member) {
      setEditingId(member.id);
      setFormData({ 
        name: member.name, 
        role: member.role, 
        active: member.active !== undefined ? member.active : true,
        email: member.email || '',
        usertype: member.usertype || 'User'
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', role: '', active: true, email: '', usertype: 'User' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', role: '', active: true, email: '', usertype: 'User' });
  };

  const sortedMembers = [...members].sort((a, b) => 
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

  const getUserTypeBadge = (type?: UserRole) => {
    switch(type) {
      case 'Master':
        return <span className="bg-purple-900/40 text-purple-300 border border-purple-800 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">Master</span>;
      case 'Admin':
        return <span className="bg-blue-900/40 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">Admin</span>;
      default:
        return <span className="bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider">User</span>;
    }
  };

  if (selectedMemberId) {
    const selectedMember = members.find(m => m.id === selectedMemberId);
    const memberEvents = events
        .filter(e => e.memberIds.includes(selectedMemberId))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setSelectedMemberId(null)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-slate-100">{selectedMember?.name}</h2>
                            <div className="flex gap-2">
                                {getUserTypeBadge(selectedMember?.usertype)}
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                    selectedMember?.active ? 'bg-green-900/20 text-green-400 border-green-800' : 'bg-slate-800 text-slate-500 border-slate-700'
                                }`}>
                                    {selectedMember?.active ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-slate-400">{selectedMember?.role}</p>
                          {selectedMember?.email && (
                            <>
                              <span className="text-slate-600">•</span>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Mail size={12} />
                                {selectedMember.email}
                              </div>
                            </>
                          )}
                        </div>
                    </div>
                </div>
                
                <button 
                    onClick={handlePrint}
                    title="Imprimir Escala Individual"
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700 shadow-sm"
                >
                    <Printer size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {memberEvents.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50">
                        <Calendar className="mx-auto h-12 w-12 text-slate-600 mb-3" />
                        <p className="text-slate-500">Este integrante ainda não foi convocado para nenhum evento.</p>
                    </div>
                ) : (
                    memberEvents.map(event => {
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
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <MapPin size={14} className="text-slate-500" />
                                        {getCityName(event.cityId)}
                                    </div>
                                </div>
                                <div className="hidden md:block">
                                    <span className="px-3 py-1 bg-red-900/20 text-red-400 border border-red-900/50 rounded-full text-xs font-bold uppercase">
                                        Convocado
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
          <h2 className="text-2xl font-bold text-slate-100">Integrantes</h2>
          <p className="text-slate-400">Gestão da equipe técnica e pilotos.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={18} />
          <span>Novo Integrante</span>
        </button>
      </div>

      <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-slate-950 border-b border-slate-800">
                <th className="p-4 font-semibold text-slate-400 text-sm">Nome</th>
                <th className="p-4 font-semibold text-slate-400 text-sm">Tipo / Acesso</th>
                <th className="p-4 font-semibold text-slate-400 text-sm">Status</th>
                <th className="p-4 font-semibold text-slate-400 text-sm text-right">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
                {sortedMembers.length === 0 ? (
                    <tr>
                        <td colSpan={4} className="p-8 text-center text-slate-500">Nenhum integrante cadastrado.</td>
                    </tr>
                ) : (
                    sortedMembers.map((member) => (
                    <tr key={member.id} className={`hover:bg-slate-800/50 group transition-colors ${!member.active ? 'opacity-60' : ''}`}>
                        <td className="p-4">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${member.active ? 'bg-slate-800 text-slate-500' : 'bg-slate-900 text-slate-700'}`}>
                                <User size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span 
                                    className={`font-medium cursor-pointer hover:text-red-500 transition-colors ${member.active ? 'text-slate-200' : 'text-slate-500 italic'}`}
                                    onClick={() => setSelectedMemberId(member.id)}
                                >
                                    {member.name}
                                </span>
                                {member.email && <span className="text-[10px] text-slate-500 font-mono">{member.email}</span>}
                            </div>
                        </div>
                        </td>
                        <td className="p-4">
                            <div className="flex flex-col gap-1.5 items-start">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                                    member.active ? 'bg-blue-900/30 text-blue-300 border-blue-900/50' : 'bg-slate-800/50 text-slate-500 border-slate-700'
                                }`}>
                                    {member.role}
                                </span>
                                {getUserTypeBadge(member.usertype)}
                            </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border ${
                                member.active ? 'text-green-500 border-green-900/50' : 'text-slate-500 border-slate-800'
                            }`}>
                                {member.active ? 'Ativo' : 'Bloqueado'}
                            </span>
                            {member.email && (
                                <div title="Possui e-mail de acesso" className="text-blue-500">
                                    <Mail size={12} />
                                </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); openModal(member); }} 
                                title="Editar" 
                                className="p-2 text-slate-500 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setDeleteModal({ isOpen: true, member }); }} 
                                title="Excluir" 
                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
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
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-800 w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4 text-white">{editingId ? 'Editar Integrante' : 'Novo Integrante'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: João Silva"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1 flex justify-between items-center">
                    E-mail de Acesso
                    <span className="text-[10px] text-slate-500 font-normal italic">Deve ser o mesmo usado no Login</span>
                </label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                    <input
                    type="email"
                    className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 pl-10 text-white focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-slate-800"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                    placeholder="usuario@acesso.com"
                    />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Tipo de Usuário</label>
                    <div className="relative">
                        <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={16} />
                        <select
                        required
                        className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 pl-10 text-white focus:ring-2 focus:ring-red-500 outline-none appearance-none"
                        value={formData.usertype}
                        onChange={e => setFormData({ ...formData, usertype: e.target.value as UserRole })}
                        >
                            <option value="Master">Master</option>
                            <option value="Admin">Admin</option>
                            <option value="User">User</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Cargo / Função</label>
                    <select
                    required
                    className="w-full rounded-lg bg-slate-950 border-slate-700 border p-2.5 text-white focus:ring-2 focus:ring-red-500 outline-none"
                    value={formData.role}
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    >
                        <option value="" disabled>Selecione...</option>
                        <option value="Piloto">Piloto</option>
                        <option value="Mecânico">Mecânico</option>
                        <option value="Chefe de Equipe">Chefe de Equipe</option>
                        <option value="Telemetrista">Telemetrista</option>
                        <option value="Apoio">Apoio</option>
                        <option value="Administrador">Administrador</option>
                    </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Status de Acesso</label>
                <button
                    type="button"
                    onClick={() => setFormData({ ...formData, active: !formData.active })}
                    className={`w-full flex items-center justify-between rounded-lg border p-2.5 transition-colors ${
                        formData.active ? 'bg-green-900/10 border-green-800/50 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                >
                    <span className="text-sm font-medium">{formData.active ? 'Ativo (Acesso Permitido)' : 'Bloqueado (Acesso Negado)'}</span>
                    {formData.active ? <ToggleRight className="text-green-500" /> : <ToggleLeft className="text-slate-600" />}
                </button>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors shadow-lg shadow-red-900/20">Salvar Integrante</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <DeleteConfirmModal 
        isOpen={deleteModal.isOpen}
        itemName={deleteModal.member?.name || ''}
        title="Excluir Integrante"
        description="Ao excluir este integrante, ele perderá imediatamente o acesso ao sistema se tiver um e-mail vinculado."
        onClose={() => setDeleteModal({ isOpen: false, member: null })}
        onConfirm={() => deleteModal.member && onDelete(deleteModal.member.id)}
      />
    </div>
  );
};

export default MembersView;

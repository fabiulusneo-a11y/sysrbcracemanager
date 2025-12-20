
import React, { useState } from 'react';
import { parseScheduleFromText } from '../../services/geminiService';
import { AppData, ParsedEventRaw, Event, Championship, City, Member } from '../../types';
import { BrainCircuit, ArrowRight, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AIAssistantViewProps {
  data: AppData;
  onImportEvents: (newEvents: Event[], newChamps: Championship[], newCities: City[], newMembers: Member[]) => void;
}

const AIAssistantView: React.FC<AIAssistantViewProps> = ({ data, onImportEvents }) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewData, setPreviewData] = useState<ParsedEventRaw[] | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const handleParse = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    setPreviewData(null);
    setSuccessMsg('');
    try {
      const parsed = await parseScheduleFromText(inputText);
      setPreviewData(parsed);
    } catch (error) {
      alert("Erro ao processar com IA. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmImport = () => {
    if (!previewData) return;

    // Local Logic to map parsed data to existing entities or create new ones
    const newEvents: Event[] = [];
    const newChamps: Championship[] = [];
    const newCities: City[] = [];
    const newMembers: Member[] = [];

    // Helper maps to track IDs during this batch import
    const champMap = new Map<string, string>(); // Name -> ID
    const cityMap = new Map<string, string>(); // Name -> ID
    const memberMap = new Map<string, string>(); // Name -> ID

    // Pre-fill maps with existing data
    data.championships.forEach(c => champMap.set(c.name.toLowerCase(), c.id));
    data.cities.forEach(c => cityMap.set(c.name.toLowerCase(), c.id));
    data.members.forEach(m => memberMap.set(m.name.toLowerCase(), m.id));

    previewData.forEach(item => {
        // 1. Resolve Championship
        let champId = champMap.get(item.championshipName.toLowerCase());
        if (!champId) {
            // Check if we already staged it in this batch
            const existingNew = newChamps.find(c => c.name.toLowerCase() === item.championshipName.toLowerCase());
            if (existingNew) {
                champId = existingNew.id;
            } else {
                champId = crypto.randomUUID();
                const newC: Championship = { id: champId, name: item.championshipName };
                newChamps.push(newC);
                champMap.set(item.championshipName.toLowerCase(), champId); // Add to map for subsequent items
            }
        }

        // 2. Resolve City
        let cityId = cityMap.get(item.cityName.toLowerCase());
        if (!cityId) {
             const existingNew = newCities.find(c => c.name.toLowerCase() === item.cityName.toLowerCase());
             if (existingNew) {
                 cityId = existingNew.id;
             } else {
                cityId = crypto.randomUUID();
                const newC: City = { id: cityId, name: item.cityName, state: item.stateCode || 'XX' };
                newCities.push(newC);
                cityMap.set(item.cityName.toLowerCase(), cityId);
             }
        }

        // 3. Resolve Members
        const eventMemberIds: string[] = [];
        item.memberNames.forEach(mName => {
            let mId = memberMap.get(mName.toLowerCase());
            if (!mId) {
                const existingNew = newMembers.find(m => m.name.toLowerCase() === mName.toLowerCase());
                if (existingNew) {
                    mId = existingNew.id;
                } else {
                    mId = crypto.randomUUID();
                    const newM: Member = { id: mId, name: mName, role: 'Novo', active: true }; // Default role
                    newMembers.push(newM);
                    memberMap.set(mName.toLowerCase(), mId);
                }
            }
            if(mId) eventMemberIds.push(mId);
        });

        // 4. Create Event
        // Fixed: Added missing vehicleIds property which is required by Event interface
        newEvents.push({
            id: crypto.randomUUID(),
            championshipId: champId!,
            cityId: cityId!,
            date: item.date,
            stage: item.stageName,
            memberIds: eventMemberIds,
            vehicleIds: [],
            confirmed: true // Default to true for imported events
        });
    });

    onImportEvents(newEvents, newChamps, newCities, newMembers);
    setSuccessMsg(`Importação realizada com sucesso! ${newEvents.length} eventos adicionados.`);
    setPreviewData(null);
    setInputText('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <BrainCircuit className="text-purple-500" />
            Importação Inteligente
        </h2>
        <p className="text-slate-400">Cole textos de e-mails, PDFs ou WhatsApp. A IA irá estruturar o calendário para você.</p>
      </div>

      <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
        <label className="block text-sm font-medium text-slate-400 mb-2">Texto do Calendário</label>
        <textarea
            className="w-full h-48 p-4 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none resize-none font-mono text-sm"
            placeholder={`Exemplo:
Campeonato Verde.
Etapa 1 = 01/01/2026; Local: Guarulhos, SP; Integrantes: João, Lucas`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
        ></textarea>
        
        <div className="mt-4 flex justify-end">
            <button
                onClick={handleParse}
                disabled={isLoading || !inputText}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-all"
            >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <BrainCircuit size={20} />}
                Processar com IA
            </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-green-900/20 border border-green-800 text-green-300 p-4 rounded-lg flex items-center gap-3 animate-fade-in">
            <CheckCircle size={24} />
            <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {previewData && (
        <div className="bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden animate-fade-in">
            <div className="p-4 bg-purple-900/20 border-b border-purple-800/50 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-purple-300">Pré-visualização</h3>
                    <p className="text-xs text-purple-400">Verifique os dados antes de confirmar a importação.</p>
                </div>
                <button 
                    onClick={confirmImport}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
                >
                    Confirmar Importação <ArrowRight size={16} />
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-950 text-slate-400 font-medium">
                        <tr>
                            <th className="p-3">Data</th>
                            <th className="p-3">Campeonato / Etapa</th>
                            <th className="p-3">Local</th>
                            <th className="p-3">Equipe</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {previewData.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                                <td className="p-3 font-mono text-slate-300">{item.date}</td>
                                <td className="p-3">
                                    <div className="font-bold text-slate-200">{item.championshipName}</div>
                                    <div className="text-xs text-slate-500">{item.stageName}</div>
                                </td>
                                <td className="p-3 text-slate-300">
                                    {item.cityName} <span className="text-xs bg-slate-800 border border-slate-700 px-1 rounded ml-1 text-slate-400">{item.stateCode}</span>
                                </td>
                                <td className="p-3 text-slate-400 max-w-xs truncate">
                                    {item.memberNames.join(', ')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-4 bg-yellow-900/20 text-yellow-200 text-xs flex items-start gap-2 border-t border-yellow-800/30">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0 text-yellow-500" />
                <p>O sistema irá criar automaticamente novos Campeonatos, Cidades e Integrantes caso não encontre correspondência exata pelo nome.</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistantView;

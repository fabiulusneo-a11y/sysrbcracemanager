
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

    const newEvents: Event[] = [];
    const newChamps: Championship[] = [];
    const newCities: City[] = [];
    const newMembers: Member[] = [];

    const champMap = new Map<string, string>();
    const cityMap = new Map<string, string>();
    const memberMap = new Map<string, string>();

    data.championships.forEach(c => champMap.set(c.name.toLowerCase(), c.id));
    data.cities.forEach(c => cityMap.set(c.name.toLowerCase(), c.id));
    data.members.forEach(m => memberMap.set(m.name.toLowerCase(), m.id));

    previewData.forEach(item => {
        // 1. Resolve Championship
        let champId = champMap.get(item.championshipName.toLowerCase());
        if (!champId) {
            const existingNew = newChamps.find(c => c.name.toLowerCase() === item.championshipName.toLowerCase());
            if (existingNew) {
                champId = existingNew.id;
            } else {
                champId = crypto.randomUUID();
                newChamps.push({ id: champId, name: item.championshipName });
                champMap.set(item.championshipName.toLowerCase(), champId);
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
                newCities.push({ id: cityId, name: item.cityName, state: item.stateCode || 'XX' });
                cityMap.set(item.cityName.toLowerCase(), cityId);
             }
        }

        // 3. Resolve Members
        const eventMemberIds: string[] = [];
        (item.memberNames || []).forEach(mName => {
            let mId = memberMap.get(mName.toLowerCase());
            if (!mId) {
                const existingNew = newMembers.find(m => m.name.toLowerCase() === mName.toLowerCase());
                if (existingNew) {
                    mId = existingNew.id;
                } else {
                    mId = crypto.randomUUID();
                    newMembers.push({ id: mId, name: mName, role: 'Novo', active: true });
                    memberMap.set(mName.toLowerCase(), mId);
                }
            }
            if(mId) eventMemberIds.push(mId);
        });

        // 4. Create Event
        newEvents.push({
            id: crypto.randomUUID(),
            championshipId: champId!,
            cityId: cityId!,
            date: item.date,
            stage: item.stageName,
            memberIds: eventMemberIds,
            vehicleIds: [],
            // Corrected to modelForecast to match the Event interface
            modelForecast: [],
            confirmed: true
        });
    });

    onImportEvents(newEvents, newChamps, newCities, newMembers);
    setSuccessMsg(`Importação realizada! ${newEvents.length} eventos adicionados.`);
    setPreviewData(null);
    setInputText('');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                <BrainCircuit className="text-purple-500" />
                Importação com IA
            </h2>
            <p className="text-slate-400">Cole o cronograma. A IA detecta integrantes, campeonatos e cidades.</p>
        </div>
      </div>

      <div className="bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-800">
        <textarea
            className="w-full h-48 p-4 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none resize-none font-mono text-sm"
            placeholder={`Exemplo:
Copa Truck - Etapa 2 em Cascavel dia 15/06/2026. 
Mecânicos: João e Marcos.`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
        ></textarea>
        
        <div className="mt-4 flex justify-end">
            <button
                onClick={handleParse}
                disabled={isLoading || !inputText}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 disabled:text-slate-500 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-900/20"
            >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <BrainCircuit size={20} />}
                Processar com Gemini
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
                <h3 className="font-bold text-purple-300">Resumo da Extração</h3>
                <button 
                    onClick={confirmImport}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-black flex items-center gap-2 shadow-sm transition-colors uppercase tracking-widest"
                >
                    Confirmar <ArrowRight size={16} />
                </button>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                        <tr>
                            <th className="p-4">Data</th>
                            <th className="p-4">Competição</th>
                            <th className="p-4">Equipe</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {previewData.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                                <td className="p-4 font-mono text-slate-300">{item.date}</td>
                                <td className="p-4">
                                    <div className="font-bold text-slate-100 uppercase">{item.championshipName}</div>
                                    <div className="text-[10px] text-red-500 font-black">{item.stageName} • {item.cityName}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-1">
                                        {item.memberNames.map((n, i) => (
                                            <span key={i} className="bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[10px]">{n}</span>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-4 bg-yellow-900/10 text-yellow-500 text-[10px] font-bold uppercase flex items-center gap-2 border-t border-slate-800">
                <AlertCircle size={14} />
                Novos itens detectados serão adicionados automaticamente à base de dados.
            </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistantView;

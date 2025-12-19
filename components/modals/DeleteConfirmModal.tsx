
import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  title: string;
  description?: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  title,
  description
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [step, setStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (!isOpen) {
      setConfirmText('');
      setStep(1);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (step === 1) {
      setStep(2);
    } else {
      if (confirmText.trim().toLowerCase() === itemName.trim().toLowerCase()) {
        onConfirm();
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-red-950/20 p-4 border-b border-red-900/20 flex justify-between items-center">
          <div className="flex items-center gap-2 text-red-500">
            <AlertTriangle size={20} />
            <h3 className="font-bold uppercase tracking-wider text-sm">{title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {step === 1 ? (
            <>
              <p className="text-slate-300 font-medium">
                Deseja realmente excluir <span className="text-white font-bold">"{itemName}"</span>?
              </p>
              <p className="text-slate-500 text-sm">
                {description || "Esta ação não poderá ser desfeita e os dados vinculados podem ser afetados."}
              </p>
            </>
          ) : (
            <>
              <p className="text-slate-300 text-sm">
                Para confirmar a exclusão, digite o nome exato abaixo:
              </p>
              <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-center">
                <span className="text-red-500 font-mono font-bold">{itemName}</span>
              </div>
              <input
                autoFocus
                type="text"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-red-500 outline-none transition-all"
                placeholder="Digite aqui..."
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && confirmText.toLowerCase() === itemName.toLowerCase() && handleConfirm()}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl font-bold text-slate-400 hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={step === 2 && confirmText.trim().toLowerCase() !== itemName.trim().toLowerCase()}
            className={`flex-1 px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              step === 1 
                ? 'bg-slate-800 text-white hover:bg-slate-700' 
                : 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-30 disabled:grayscale'
            }`}
          >
            <Trash2 size={18} />
            {step === 1 ? 'Continuar' : 'Confirmar Exclusão'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;

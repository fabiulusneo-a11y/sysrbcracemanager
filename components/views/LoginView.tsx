
import React, { useState } from 'react';
import { signIn, signUp } from '../../services/databaseService';
import { Loader2, AlertCircle, Mail, Lock, LogIn, UserPlus, Info, CheckCircle2 } from 'lucide-react';

const LoginView: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isLogin) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        setSuccess("Conta pré-registrada! Verifique seu e-mail para confirmar a ativação.");
        // Opcional: Voltar para login após sucesso no cadastro
        setTimeout(() => setIsLogin(true), 5000);
      }
    } catch (err: any) {
      console.error(err);
      let message = err.message || "Erro ao processar solicitação.";
      if (err.message?.includes("Invalid login credentials")) message = "E-mail ou senha incorretos.";
      if (err.message?.includes("User already registered")) message = "Este e-mail já possui uma conta ativa.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background animado e decorativo */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-red-600 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600 rounded-full blur-[150px] animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-8 md:p-10">
          <div className="flex flex-col items-center mb-10">
            <div className="w-20 h-20 bg-red-600 rounded-2xl flex items-center justify-center transform -skew-x-12 mb-6 shadow-2xl shadow-red-900/40 border-t-2 border-red-500">
              <span className="font-black text-4xl text-white skew-x-12 italic">R</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">RBC Motorsport</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] mt-2">Team Management</p>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl mb-8 border border-slate-800">
            <button 
                onClick={() => { setIsLogin(true); setError(null); setSuccess(null); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${isLogin ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Entrar
            </button>
            <button 
                onClick={() => { setIsLogin(false); setError(null); setSuccess(null); }}
                className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${!isLogin ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
                Primeiro Acesso
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2 bg-red-950/30 border border-red-800/50 text-red-400">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <p className="font-medium leading-relaxed">{error}</p>
              </div>
            )}

            {success && (
              <div className="p-4 rounded-xl flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2 bg-green-950/30 border border-green-800/50 text-green-400">
                <CheckCircle2 className="shrink-0 mt-0.5" size={18} />
                <p className="font-medium leading-relaxed">{success}</p>
              </div>
            )}

            {!isLogin && !error && !success && (
                <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-xl flex gap-3 text-blue-400">
                    <Info size={18} className="shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold uppercase leading-normal tracking-wide">
                        Importante: Sua conta só poderá ser criada se seu e-mail já tiver sido cadastrado pela administração.
                    </p>
                </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">E-mail Corporativo</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors" size={18} />
                <input
                  type="email"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-slate-800 font-medium"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Senha</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors" size={18} />
                <input
                  type="password"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder:text-slate-800 font-medium"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-slate-800 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] mt-8 shadow-2xl shadow-red-900/20 active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={22} />
              ) : (
                <>
                  {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                  <span>{isLogin ? 'Acessar Painel' : 'Validar & Criar'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-800 text-center">
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed">
              Sistema de Uso Exclusivo da Equipe RBC Motorsport
              <br />
              <span className="text-slate-700">Acesso monitorado e restrito</span>
            </p>
          </div>
        </div>

        <p className="mt-10 text-center text-slate-700 text-[10px] font-black uppercase tracking-[0.3em]">
          &copy; {new Date().getFullYear()} RBC Development Team
        </p>
      </div>
    </div>
  );
};

export default LoginView;

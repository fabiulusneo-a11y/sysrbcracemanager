
import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { City, Championship, Member, Event, AppData } from '../types';

const DEFAULT_SUPABASE_URL = 'https://jrgzsvjarnaiwxzwkeve.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyZ3pzdmphcm5haXd4endrZXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTkyNTgsImV4cCI6MjA4MTY3NTI1OH0.tLmJix-r76m58BzJgUFJsg0xZiApJQ2NLZvOBvEu9Cw';

const getKeys = () => {
  return {
    url: localStorage.getItem('RBC_SUPABASE_URL') || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL,
    key: localStorage.getItem('RBC_SUPABASE_KEY') || process.env.SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY
  };
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = (): SupabaseClient => {
  if (supabaseInstance) return supabaseInstance;
  const { url, key } = getKeys();
  if (!url || !key) throw new Error("Configuração do Supabase ausente.");
  supabaseInstance = createClient(url, key);
  return supabaseInstance;
};

// --- AUTH FUNCTIONS ---

/**
 * Verifica se um e-mail está autorizado na tabela de integrantes.
 */
export const isEmailAuthorized = async (email: string): Promise<{ authorized: boolean; active: boolean }> => {
  const client = getSupabase();
  const cleanEmail = email.trim().toLowerCase();

  try {
    const { data: anyMembers, error: countError } = await client
      .from('members')
      .select('id')
      .limit(1);

    if (!countError && (!anyMembers || anyMembers.length === 0)) {
      console.warn("Nenhum integrante encontrado no banco. Permitindo acesso de bootstrap.");
      return { authorized: true, active: true };
    }

    const { data, error } = await client
      .from('members')
      .select('id, active, email')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (error) {
      if (error.code === '42703') {
        throw new Error("Erro de Banco de Dados: A coluna 'email' não foi encontrada na tabela 'members'.");
      }
      return { authorized: false, active: false };
    }

    if (!data) return { authorized: false, active: false };
    return { authorized: true, active: data.active !== false };
  } catch (err: any) {
    if (err.message?.includes("coluna 'email'")) throw err;
    console.error("Falha na validação de autorização:", err);
    return { authorized: false, active: false };
  }
};

export const signIn = async (email: string, password: string) => {
  const client = getSupabase();
  const cleanEmail = email.trim();
  
  const { data: authData, error: authError } = await client.auth.signInWithPassword({ 
    email: cleanEmail, 
    password 
  });
  if (authError) throw authError;

  try {
    const authStatus = await isEmailAuthorized(cleanEmail);
    if (!authStatus.authorized) {
        await client.auth.signOut();
        throw new Error("Acesso não autorizado.");
    }
    if (!authStatus.active) {
        await client.auth.signOut();
        throw new Error("Seu acesso foi desativado.");
    }
  } catch (e: any) {
    if (e.message?.includes("Erro de Banco de Dados")) return authData;
    throw e;
  }
  return authData;
};

export const signUp = async (email: string, password: string) => {
  const client = getSupabase();
  const cleanEmail = email.trim();

  const authStatus = await isEmailAuthorized(cleanEmail);
  if (!authStatus.authorized) {
    throw new Error("E-mail não autorizado para cadastro.");
  }

  const { data, error } = await client.auth.signUp({ 
    email: cleanEmail, 
    password,
    options: { emailRedirectTo: window.location.origin }
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const client = getSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
};

export const onAuthStateChange = (callback: (user: SupabaseUser | null) => void) => {
  const client = getSupabase();
  return client.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
};

// --- DATA FUNCTIONS ---

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getKeys();
  return url.length > 0 && key.length > 0;
};

export const saveSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem('RBC_SUPABASE_URL', url);
  localStorage.setItem('RBC_SUPABASE_KEY', key);
  supabaseInstance = null;
};

export const fetchAllData = async (): Promise<AppData> => {
  const client = getSupabase();
  const [
    { data: cities },
    { data: championships },
    { data: members },
    { data: events }
  ] = await Promise.all([
    client.from('cities').select('*').order('name'),
    client.from('championships').select('*').order('name'),
    client.from('members').select('*').order('name'),
    client.from('events').select('*').order('date')
  ]);

  return {
    cities: cities || [],
    championships: championships || [],
    members: (members || []).map(m => ({ ...m, active: m.active !== false })),
    events: (events || []).map(e => ({
      id: e.id,
      championshipId: e.championship_id,
      cityId: e.city_id,
      date: e.date,
      stage: e.stage,
      memberIds: e.member_ids || [],
      confirmed: e.confirmed
    }))
  };
};

/**
 * Normaliza os dados antes de enviar para o Supabase.
 * Resolve especificamente o erro de e-mail vazio duplicado.
 */
const formatPayload = (table: string, data: any) => {
  const formattedData = { ...data };
  
  // Tratamento de E-mail: Se estiver vazio ou for string vazia, vira NULL no banco.
  // Isso permite que múltiplos integrantes não tenham e-mail sem violar a regra de UNICIDADE.
  if ('email' in formattedData) {
    if (formattedData.email === '' || formattedData.email === null || formattedData.email === undefined) {
      formattedData.email = null;
    } else {
      formattedData.email = formattedData.email.trim().toLowerCase();
    }
  }

  if (table === 'events') {
    if (data.championshipId) formattedData.championship_id = data.championshipId;
    if (data.cityId) formattedData.city_id = data.cityId;
    if (data.memberIds) formattedData.member_ids = data.memberIds;
    delete formattedData.championshipId;
    delete formattedData.cityId;
    delete formattedData.memberIds;
  }
  return formattedData;
};

export const sqlInsert = async (table: string, data: any) => {
  const client = getSupabase();
  const payload = formatPayload(table, data);
  const { error } = await client.from(table).insert([payload]);
  if (error) throw error;
};

export const sqlUpdate = async (table: string, id: string, data: any) => {
  const client = getSupabase();
  const payload = formatPayload(table, data);
  const { error } = await client.from(table).update(payload).eq('id', id);
  if (error) throw error;
};

export const sqlDelete = async (table: string, id: string) => {
  const client = getSupabase();
  const { error } = await client.from(table).delete().eq('id', id);
  if (error) throw error;
};

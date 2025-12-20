
import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { City, Championship, Member, Event, AppData, Vehicle } from '../types';

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

export const isEmailAuthorized = async (email: string): Promise<{ authorized: boolean; active: boolean }> => {
  const client = getSupabase();
  const cleanEmail = email.trim().toLowerCase();
  try {
    const { data: anyMembers, error: countError } = await client.from('members').select('id').limit(1);
    if (!countError && (!anyMembers || anyMembers.length === 0)) return { authorized: true, active: true };
    const { data, error } = await client.from('members').select('id, active, email').ilike('email', cleanEmail).maybeSingle();
    if (error || !data) return { authorized: false, active: false };
    return { authorized: true, active: data.active !== false };
  } catch (err) {
    return { authorized: false, active: false };
  }
};

export const signIn = async (email: string, password: string) => {
  const client = getSupabase();
  const { data: authData, error: authError } = await client.auth.signInWithPassword({ email: email.trim(), password });
  if (authError) throw authError;
  const authStatus = await isEmailAuthorized(email.trim());
  if (!authStatus.authorized) {
      await client.auth.signOut();
      throw new Error("Acesso não autorizado.");
  }
  return authData;
};

export const signUp = async (email: string, password: string) => {
  const client = getSupabase();
  const authStatus = await isEmailAuthorized(email.trim());
  if (!authStatus.authorized) throw new Error("E-mail não autorizado.");
  const { data, error } = await client.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin } });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const client = getSupabase();
  await client.auth.signOut();
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
    { data: events },
    { data: vehicles }
  ] = await Promise.all([
    client.from('cities').select('*').order('name'),
    client.from('championships').select('*').order('name'),
    client.from('members').select('*').order('name'),
    client.from('events').select('*').order('date'),
    client.from('vehicles').select('*').order('placa')
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
      vehicleIds: e.vehicle_ids || [],
      confirmed: e.confirmed
    })),
    vehicles: (vehicles || []).map(v => ({ 
      id: v.id,
      type: v.tipo,   
      plate: v.placa, 
      brand: v.marca,
      model: v.modelo,
      status: v.status !== false 
    }))
  };
};

const formatPayload = (table: string, data: any) => {
  if (table === 'vehicles') {
    return {
      tipo: data.type,
      placa: data.plate,
      marca: data.brand,
      modelo: data.model,
      status: data.status === true
    };
  }

  const formattedData = { ...data };
  if ('email' in formattedData) {
    if (!formattedData.email) formattedData.email = null;
    else formattedData.email = formattedData.email.trim().toLowerCase();
  }
  if (table === 'events') {
    if (data.championshipId) formattedData.championship_id = data.championshipId;
    if (data.cityId) formattedData.city_id = data.cityId;
    if (data.memberIds) formattedData.member_ids = data.memberIds;
    if (data.vehicleIds) formattedData.vehicle_ids = data.vehicleIds;
    delete formattedData.championshipId;
    delete formattedData.cityId;
    delete formattedData.memberIds;
    delete formattedData.vehicleIds;
  }
  return formattedData;
};

export const sqlInsert = async (table: string, data: any) => {
  const client = getSupabase();
  const payload = formatPayload(table, data);
  const { error } = await client.from(table).insert([payload]);
  if (error) throw error;
};

export const sqlUpdate = async (table: string, id: string | number, data: any) => {
  const client = getSupabase();
  // Fixed: Removed incorrect line that called formatPayload with extra arguments
  const formattedPayload = formatPayload(table, data);
  const { error } = await client.from(table).update(formattedPayload).eq('id', id);
  if (error) throw error;
};

export const sqlDelete = async (table: string, id: string | number) => {
  const client = getSupabase();
  const { error } = await client.from(table).delete().eq('id', id);
  if (error) throw error;
};

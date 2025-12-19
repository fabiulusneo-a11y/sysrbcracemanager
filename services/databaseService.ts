
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { City, Championship, Member, Event, AppData } from '../types';

// Credenciais Internas do Sistema
const DEFAULT_SUPABASE_URL = 'https://jrgzsvjarnaiwxzwkeve.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyZ3pzdmphcm5haXd4endrZXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTkyNTgsImV4cCI6MjA4MTY3NTI1OH0.tLmJix-r76m58BzJgUFJsg0xZiApJQ2NLZvOBvEu9Cw';

// Tenta obter das variáveis de ambiente, do localStorage ou usa as fixas do sistema
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

  if (!url || !key) {
    throw new Error("Configuração do Supabase ausente. Verifique a URL e a Chave Anon.");
  }

  supabaseInstance = createClient(url, key);
  return supabaseInstance;
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getKeys();
  return url.length > 0 && key.length > 0;
};

export const saveSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem('RBC_SUPABASE_URL', url);
  localStorage.setItem('RBC_SUPABASE_KEY', key);
  supabaseInstance = null; // Reseta a instância para forçar nova criação
};

export const initDatabase = async (): Promise<AppData> => {
  if (!isSupabaseConfigured()) {
    return { cities: [], championships: [], members: [], events: [] };
  }
  return fetchAllData();
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

  const formattedEvents: Event[] = (events || []).map(e => ({
    id: e.id,
    championshipId: e.championship_id,
    cityId: e.city_id,
    date: e.date,
    stage: e.stage,
    memberIds: e.member_ids || [],
    confirmed: e.confirmed
  }));

  return {
    cities: cities || [],
    championships: championships || [],
    members: members || [],
    events: formattedEvents
  };
};

export const sqlInsert = async (table: string, data: any) => {
  const client = getSupabase();
  const formattedData = { ...data };
  if (table === 'events') {
    formattedData.championship_id = data.championshipId;
    formattedData.city_id = data.cityId;
    formattedData.member_ids = data.memberIds;
    delete formattedData.championshipId;
    delete formattedData.cityId;
    delete formattedData.memberIds;
  }
  
  const { error } = await client.from(table).insert([formattedData]);
  if (error) throw error;
};

export const sqlUpdate = async (table: string, id: string, data: any) => {
  const client = getSupabase();
  const formattedData = { ...data };
  if (table === 'events') {
    if (data.championshipId) formattedData.championship_id = data.championshipId;
    if (data.cityId) formattedData.city_id = data.cityId;
    if (data.memberIds) formattedData.member_ids = data.memberIds;
    delete formattedData.championshipId;
    delete formattedData.cityId;
    delete formattedData.memberIds;
  }

  const { error } = await client.from(table).update(formattedData).eq('id', id);
  if (error) throw error;
};

export const sqlDelete = async (table: string, id: string) => {
  const client = getSupabase();
  const { error } = await client.from(table).delete().eq('id', id);
  if (error) throw error;
};

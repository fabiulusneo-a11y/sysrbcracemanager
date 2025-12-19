
export interface City {
  id: string;
  name: string;
  state: string; // UF like SP, SC, PR
}

export interface Championship {
  id: string;
  name: string;
}

export interface Member {
  id: string;
  name: string;
  role: string; // e.g., Piloto, Mecânico, Chefe de Equipe
  active: boolean; // Status of the member in the company
}

export interface Event {
  id: string;
  championshipId: string;
  cityId: string;
  date: string; // ISO format YYYY-MM-DD
  stage: string; // e.g., "Etapa 1", "Final"
  memberIds: string[];
  confirmed: boolean; // Status for Confirmado/Indefinido
}

export interface ParsedEventRaw {
  championshipName: string;
  stageName: string;
  date: string;
  cityName: string;
  stateCode: string;
  memberNames: string[];
}

export type ViewState = 'dashboard' | 'events' | 'championships' | 'cities' | 'members' | 'settings';

export interface AppData {
  cities: City[];
  championships: Championship[];
  members: Member[];
  events: Event[];
}

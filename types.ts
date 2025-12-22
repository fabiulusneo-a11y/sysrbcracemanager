
export interface City {
  id: string;
  name: string;
  state: string; // UF like SP, SC, PR
}

export interface Championship {
  id: string;
  name: string;
}

export type UserRole = 'Master' | 'Admin' | 'User';

export interface Member {
  id: string;
  name: string;
  role: string; // e.g., Piloto, Mecânico, Chefe de Equipe
  active: boolean; // Status of the member in the company
  email?: string; // Email for system access authorization
  usertype?: UserRole; // Permissão de acesso (Master, Admin, User)
}

export type VehicleType = 'Carro' | 'Van' | 'Caminhão';

export interface Vehicle {
  id: string | number; 
  type: VehicleType;
  plate: string;
  brand: string;
  model: string;
  status: boolean;
}

export interface Model {
  id: string | number;
  type: string;
  brand: string;
  model: string;
}

export interface ModelForecast {
  modelId: string | number;
  quantity: number;
}

export interface Event {
  id: string;
  championshipId: string;
  cityId: string;
  date: string; // ISO format YYYY-MM-DD
  stage: string; // e.g., "Etapa 1", "Final"
  memberIds: string[];
  vehicleIds: (string | number)[];
  modelForecast: ModelForecast[]; // Alterado de modelIds para modelForecast
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

export type ViewState = 'dashboard' | 'events' | 'championships' | 'cities' | 'members' | 'vehicles' | 'models' | 'settings';

export interface AppData {
  cities: City[];
  championships: Championship[];
  members: Member[];
  events: Event[];
  vehicles: Vehicle[];
  models: Model[];
}

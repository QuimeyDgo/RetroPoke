export interface Pokemon {
  id: number;
  name: string;
  types: string[];
  sprite: string;
  description: string;
  height: number;
  weight: number;
  evolutionChain: EvolutionStep[];
}

export interface EvolutionStep {
  name: string;
  minLevel: number | null;
  item: string | null;
  trigger: string;
}

export interface GenerationInfo {
  id: number;
  name: string;
  region: string;
  description: string;
  startId: number;
  mapUrl: string;
}

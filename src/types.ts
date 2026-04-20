/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum Biome {
  WATER = 1,
  SAND = 2,
  GRASS = 3,
  FOREST = 4,
  MOUNTAIN = 5,
}

export enum SpeciesType {
  HUMANS = 'Humanos del Alba',
  ORCS = 'Orcos de la Ceniza',
  ELVES = 'Elfos de la Raíz Eterna',
  DWARFS = 'Enanos de la Piedra Profunda',
}

export enum Era {
  TRIBAL = 0,
  KINGDOM = 1,
  IMPERIAL = 2,
  ENLIGHTENED = 3,
  MECHANICAL = 4,
  TECHNOLOGICAL = 5,
}

export interface AIPersonality {
  aggression: number; // 0-100
  honor: number;
  greed: number;
  fear: number;
  expansionism: number;
  betrayalMemory: number;
  tradeValue: number;
  ecologySensitivity: number;
  resourceNeed: number;
  borderTolerance: number;
  respectForStrength: number;
}

export interface SpeciesConfig {
  type: SpeciesType;
  color: string;
  preferredBiomes: Biome[];
  avoidBiomes: Biome[];
  description: string;
  personality: AIPersonality;
  uniqueTrait: string;
  uniqueTraitDesc: string;
}

export interface EvolutionTraits {
  strength: number;
  intelligence: number;
  fertility: number;
  vitality: number; // Max health bonus
}

export interface City {
  id: string;
  name: string;
  species: SpeciesType;
  x: number;
  y: number;
  population: number;
  resources: number;
  wealth: number;
  tradeVolume: number;
  techLevel: number;
  level: number;
  era: Era;
}

export enum FleetType {
  TRADE = 'Mercante',
  WAR = 'Galeón de Guerra',
}

export interface Fleet {
  id: string;
  species: SpeciesType;
  type: FleetType;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  cargo: number; // For trade fleets
  alive: boolean;
  originCityId: string;
  targetCityId?: string;
}

export interface Agent {
  id: string;
  species: SpeciesType;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  energy: number;
  age: number;
  alive: boolean;
  cityId?: string;
  generation: number;
  wealth: number;
  traits: EvolutionTraits;
}

export interface WorldConfig {
  width: number;
  height: number;
  preset: 'islands' | 'ancient' | 'continent';
  populationSize: 'small' | 'medium' | 'large' | 'huge';
}

export enum RelationType {
  WAR = 'Guerra',
  NEUTRAL = 'Neutral',
  ALLIANCE = 'Alianza',
}

export interface DiplomacyRecord {
  points: number; // -100 to 100
  relation: RelationType;
  lastWarTick: number;
}

export interface HistoryEvent {
  tick: number;
  message: string;
  type: 'war' | 'peace' | 'alliance' | 'city' | 'evolution' | 'trade' | 'discovery' | 'naval';
  color?: string;
}

export interface TradeRoute {
  id: string;
  fromId: string;
  toId: string;
  type: 'land' | 'sea';
  points: {x: number, y: number}[];
  active: boolean;
  intensity: number; // 0-1
  level: number; // 0: Trail, 1: Dirt road, 2: Stone/Roman road
  security: number; // 0-1 (investment in road safety)
}

export interface GameState {
  grid: Biome[][];
  agents: Agent[];
  cities: City[];
  fleets: Fleet[];
  tradeRoutes: TradeRoute[];
  tick: number;
  isPaused: boolean;
  gameSpeed: number;
  selectedBiome: Biome;
  selectedSpecies: SpeciesType | null; 
  editorActive: boolean;
  interventionActive: boolean;
  diplomacy: Record<string, DiplomacyRecord>;
  history: HistoryEvent[];
  activeSpecies: SpeciesType[];
}

export const BIOME_COLORS: Record<Biome, string> = {
  [Biome.WATER]: '#1e4a8a', 
  [Biome.SAND]: '#fde047',  
  [Biome.GRASS]: '#4ade80', 
  [Biome.FOREST]: '#166534', 
  [Biome.MOUNTAIN]: '#4b5563', 
};

export const SPECIES_SPECS: Record<SpeciesType, SpeciesConfig> = {
  [SpeciesType.HUMANS]: {
    type: SpeciesType.HUMANS,
    color: '#3b82f6', 
    preferredBiomes: [Biome.GRASS, Biome.SAND],
    avoidBiomes: [Biome.WATER, Biome.MOUNTAIN],
    description: 'Adaptables y ambiciosos, los humanos dominan el arte de la organización y el comercio. Valoran las leyes y el progreso técnico por encima de la tradición antigua. Su historia está marcada por reinos resilientes y diplomacia pragmática.',
    personality: {
      aggression: 50, honor: 60, greed: 70, fear: 40, expansionism: 75,
      betrayalMemory: 60, tradeValue: 80, ecologySensitivity: 30,
      resourceNeed: 60, borderTolerance: 50, respectForStrength: 60,
    },
    uniqueTrait: 'Adaptabilidad',
    uniqueTraitDesc: 'Mayor generación de oro y reducción de penalizaciones en biomas diversos.',
  },
  [SpeciesType.ORCS]: {
    type: SpeciesType.ORCS,
    color: '#ef4444', 
    preferredBiomes: [Biome.SAND, Biome.MOUNTAIN],
    avoidBiomes: [Biome.WATER, Biome.FOREST],
    description: 'Nacidos en las tierras yermas, los orcos siguen el código del hierro y la sangre. Su sociedad tribal glorifica la fuerza y el honor en combate. No buscan entender el mundo, sino conquistarlo a través de la voluntad pura.',
    personality: {
      aggression: 85, honor: 70, greed: 55, fear: 20, expansionism: 80,
      betrayalMemory: 85, tradeValue: 20, ecologySensitivity: 10,
      resourceNeed: 75, borderTolerance: 30, respectForStrength: 95,
    },
    uniqueTrait: 'Furia de Clan',
    uniqueTraitDesc: 'Unidades más resistentes y gran capacidad de asedio/asalto.',
  },
  [SpeciesType.ELVES]: {
    type: SpeciesType.ELVES,
    color: '#10b981', 
    preferredBiomes: [Biome.FOREST, Biome.GRASS],
    avoidBiomes: [Biome.SAND, Biome.WATER],
    description: 'Guardianes de los bosques milenarios, los elfos ven el tiempo como un río lento. Prefieren la armonía natural y el desarrollo de artes místicas. Son protectores feroces de sus tierras, aunque rara vez buscan la expansión agresiva.',
    personality: {
      aggression: 35, honor: 80, greed: 20, fear: 35, expansionism: 30,
      betrayalMemory: 75, tradeValue: 50, ecologySensitivity: 95,
      resourceNeed: 40, borderTolerance: 65, respectForStrength: 45,
    },
    uniqueTrait: 'Tierra Viva',
    uniqueTraitDesc: 'Los bosques otorgan sustento extra y defensas naturales impenetrables.',
  },
  [SpeciesType.DWARFS]: {
    type: SpeciesType.DWARFS,
    color: '#f59e0b', 
    preferredBiomes: [Biome.MOUNTAIN, Biome.GRASS],
    avoidBiomes: [Biome.WATER, Biome.SAND],
    description: 'Moradores de las salas bajo la montaña, los enanos son maestros de la ingeniería y la forja. Poseen una memoria legendaria para las deudas y los agravios. Su sociedad es sólida como la piedra que tallan.',
    personality: {
      aggression: 45, honor: 90, greed: 75, fear: 25, expansionism: 40,
      betrayalMemory: 100, tradeValue: 70, ecologySensitivity: 15,
      resourceNeed: 80, borderTolerance: 40, respectForStrength: 85,
    },
    uniqueTrait: 'Fortaleza Profunda',
    uniqueTraitDesc: 'Bonificación masiva en minería y fortalezas casi inexpugnables.',
  },
};

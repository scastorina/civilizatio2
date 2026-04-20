/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Biome, SpeciesType, Agent, WorldConfig, GameState, City, SPECIES_SPECS, RelationType, DiplomacyRecord, HistoryEvent, Era, Fleet, FleetType, TradeRoute } from '../types';

export class Engine {
  static getDiplomacyKey(s1: SpeciesType, s2: SpeciesType): string {
    return [s1, s2].sort().join('|');
  }

  static initializeDiplomacy(): Record<string, DiplomacyRecord> {
    const species = Object.values(SpeciesType) as SpeciesType[];
    const diplomacy: Record<string, DiplomacyRecord> = {};
    for (let i = 0; i < species.length; i++) {
      for (let j = i + 1; j < species.length; j++) {
        diplomacy[this.getDiplomacyKey(species[i], species[j])] = {
          points: 0,
          relation: RelationType.NEUTRAL,
          lastWarTick: 0
        };
      }
    }
    return diplomacy;
  }

  static generateWorld(config: WorldConfig): Biome[][] {
    const { width, height, preset } = config;
    let grid: Biome[][] = Array(height).fill(null).map(() => Array(width).fill(Biome.WATER));

    // Base generation based on preset
    switch (preset) {
      case 'islands':
        this.generateIslands(grid, width, height);
        break;
      case 'ancient':
        this.generateAncient(grid, width, height);
        break;
      case 'continent':
        this.generateContinent(grid, width, height);
        break;
    }

    // Pass multiple smoothing passes
    for (let i = 0; i < 3; i++) {
      grid = this.smooth(grid, width, height);
    }

    return grid;
  }

  private static generateIslands(grid: Biome[][], w: number, h: number) {
    const numSeeds = 25;
    for (let i = 0; i < numSeeds; i++) {
      const sx = Math.floor(Math.random() * w);
      const sy = Math.floor(Math.random() * h);
      const biome = [Biome.GRASS, Biome.FOREST, Biome.SAND][Math.floor(Math.random()*3)];
      this.blob(grid, sx, sy, 4 + Math.random() * 6, biome);
    }
    // Add some random mountains to islands
    for(let i=0; i<10; i++) {
        this.blob(grid, Math.random()*w, Math.random()*h, 2+Math.random()*2, Biome.MOUNTAIN);
    }
  }

  private static generateAncient(grid: Biome[][], w: number, h: number) {
    for (let i = 0; i < 20; i++) {
       const tx = Math.floor(Math.random() * w);
       const ty = Math.floor(Math.random() * h);
       const lat = ty / h;
       let target: Biome = Biome.GRASS;
       if (lat < 0.2 || lat > 0.8) target = Biome.MOUNTAIN;
       else if (lat < 0.35 || lat > 0.65) target = Biome.FOREST;
       else if (lat > 0.4 && lat < 0.6) target = Biome.SAND;
       this.blob(grid, tx, ty, 4 + Math.random() * 6, target);
    }
  }

  private static generateContinent(grid: Biome[][], w: number, h: number) {
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.4;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        if (dist < radius * (0.8 + Math.random() * 0.4)) {
          grid[y][x] = Biome.GRASS;
        }
      }
    }
    this.blob(grid, cx, cy, radius * 0.3, Biome.MOUNTAIN);
  }

  private static blob(grid: Biome[][], x: number, y: number, r: number, type: Biome) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const targetX = Math.floor(x + dx);
        const targetY = Math.floor(y + dy);
        if (targetX >= 0 && targetX < grid[0].length && targetY >= 0 && targetY < grid.length) {
          if (Math.sqrt(dx * dx + dy * dy) < r) {
            grid[targetY][targetX] = type;
          }
        }
      }
    }
  }

  private static smooth(grid: Biome[][], w: number, h: number): Biome[][] {
    const newGrid = grid.map(row => [...row]);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const neighbors: Record<number, number> = {};
        for (let ny = -1; ny <= 1; ny++) {
          for (let nx = -1; nx <= 1; nx++) {
            const b = grid[y + ny][x + nx];
            neighbors[b] = (neighbors[b] || 0) + 1;
          }
        }
        let maxCount = 0;
        let bestBiome = grid[y][x];
        for (const [biome, count] of Object.entries(neighbors)) {
          if (count > maxCount) {
            maxCount = count;
            bestBiome = Number(biome);
          }
        }
        if (maxCount >= 5) {
          newGrid[y][x] = bestBiome;
        }
      }
    }
    return newGrid;
  }

  static spawnAgents(grid: Biome[][], size: 'small' | 'medium' | 'large' | 'huge', activeSpecies: SpeciesType[]): Agent[] {
    const count = size === 'small' ? 8 : size === 'medium' ? 16 : size === 'large' ? 32 : 64;
    const agents: Agent[] = [];
    const h = grid.length;
    const w = grid[0].length;

    for (let i = 0; i < count; i++) {
      let x, y;
      let attempts = 0;
      do {
        x = Math.floor(Math.random() * w);
        y = Math.floor(Math.random() * h);
        attempts++;
      } while (
        attempts < 100 && 
        (grid[y][x] === Biome.WATER || grid[y][x] === Biome.MOUNTAIN)
      );

      agents.push({
        id: Math.random().toString(36).substr(2, 9),
        species: activeSpecies[i % activeSpecies.length],
        x,
        y,
        health: 100,
        maxHealth: 100,
        energy: 100,
        age: 0,
        alive: true,
        generation: 1,
        wealth: 20,
        traits: {
          strength: 10 + Math.random() * 5,
          intelligence: 10 + Math.random() * 5,
          fertility: 0.5 + Math.random() * 1.5,
          vitality: 10 + Math.random() * 5,
        }
      });
    }
    return agents;
  }

  static tryDiscoverSpecies(tick: number, activeSpecies: SpeciesType[]): { newSpecies: SpeciesType, event: HistoryEvent } | null {
    const allSpecies = Object.values(SpeciesType) as SpeciesType[];
    if (activeSpecies.length >= allSpecies.length) return null;

    // Discover every 400 ticks approximately
    if (tick % 400 === 0 && tick > 0) {
      const remaining = allSpecies.filter(s => !activeSpecies.includes(s));
      if (remaining.length > 0) {
        const discovered = remaining[Math.floor(Math.random() * remaining.length)];
        const spec = SPECIES_SPECS[discovered];
        return {
          newSpecies: discovered,
          event: {
            tick,
            message: `¡Una nueva cultura emerge! Los ${discovered} han sido avistados en las fronteras del mundo conocido.`,
            type: 'evolution',
            color: spec.color
          }
        };
      }
    }
    return null;
  }

  static spawnNewSpeciesInitial(grid: Biome[][], species: SpeciesType): Agent[] {
    const agents: Agent[] = [];
    const h = grid.length;
    const w = grid[0].length;
    for (let i = 0; i < 3; i++) { // Spawn a small group
      let x, y;
      let attempts = 0;
      do {
        x = Math.floor(Math.random() * w);
        y = Math.floor(Math.random() * h);
        attempts++;
      } while (attempts < 100 && (grid[y][x] === Biome.WATER || grid[y][x] === Biome.MOUNTAIN));
      
      agents.push({
        id: Math.random().toString(36).substr(2, 9),
        species: species,
        x, y,
        health: 100, maxHealth: 100, energy: 100, age: 0, alive: true, generation: 1, wealth: 30,
        traits: { strength: 12, intelligence: 12, fertility: 1.2, vitality: 12 }
      });
    }
    return agents;
  }

  static generateName(species: SpeciesType): string {
    const names: Record<string, string[]> = {
      [SpeciesType.HUMANS]: ['Mysh', 'Iva', 'Aldrin', 'Sera', 'Brum', 'Kael'],
      [SpeciesType.ORCS]: ['Grom', 'Throk', 'Mok', 'Garak', 'Ursh', 'Zul'],
      [SpeciesType.ELVES]: ['Luthil', 'Aeris', 'Faen', 'Thal', 'Relan', 'Yuvil'],
      [SpeciesType.DWARFS]: ['Thorin', 'Gloin', 'Bari', 'Durin', 'Kili', 'Fili'],
    };
    const list = names[species] || ['Nadie'];
    return list[Math.floor(Math.random() * list.length)] + `(${Math.floor(Math.random()*100)})`;
  }

  static generateCulture(species: SpeciesType): string {
    const cultures: Record<string, string[]> = {
      [SpeciesType.HUMANS]: ['Riru', 'Solaris', 'Nordia', 'Arath'],
      [SpeciesType.ORCS]: ['Colmillo', 'Sangre', 'Hierro', 'Ceniza'],
      [SpeciesType.ELVES]: ['Estelar', 'Floral', 'Ancestral', 'Místico'],
      [SpeciesType.DWARFS]: ['Montaña', 'Forja', 'Piedra', 'Oro'],
    };
    const list = cultures[species] || ['Común'];
    return list[Math.floor(Math.random() * list.length)] + `[${Math.floor(Math.random()*1000)}]`;
  }

  static updateCity(city: City, tick: number, grid: Biome[][]): { city: City, event?: HistoryEvent } {
    const newCity = { ...city, resources: { ...city.resources }, stats: { ...city.stats } };
    let event: HistoryEvent | undefined = undefined;

    // 1. Demographics & Time
    newCity.stats.age += 1;
    if (tick % 50 === 0) {
       // Natural growth
       const births = Math.floor(newCity.population * 0.05) + 1;
       newCity.stats.births += births;
       newCity.population += births;

       const deaths = Math.floor(newCity.population * 0.02);
       newCity.stats.deaths += deaths;
       newCity.population -= deaths;
    }

    // 2. Resource Gathering (Terrain Aware)
    const radius = 3;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const tx = Math.floor(newCity.x + dx);
        const ty = Math.floor(newCity.y + dy);
        if (tx >= 0 && tx < grid[0].length && ty >= 0 && ty < grid.length) {
          const b = grid[ty][tx];
          if (Math.random() < 0.02) {
             if (b === Biome.GRASS) newCity.resources.wheat += 1;
             if (b === Biome.MOUNTAIN) newCity.resources.stone += 1;
             if (b === Biome.FOREST) newCity.resources.wood += 1;
             if (b === Biome.MOUNTAIN && Math.random() < 0.1) newCity.resources.iron += 1;
             newCity.resources.meat += 0.2;
          }
        }
      }
    }

    // 3. Economy & Production
    if (newCity.resources.wheat >= 5) {
      const bakeCount = Math.floor(newCity.resources.wheat / 5);
      newCity.resources.wheat -= bakeCount * 5;
      newCity.resources.bread += bakeCount;
    }
    newCity.resources.gold = Math.floor(newCity.wealth / 10);

    // Capitalist growth requirements
    const nextLevelReq = {
      pop: city.level * 15,
      wealth: city.level * 100 * Math.pow(2, city.level - 1)
    };
    
    if (newCity.population >= nextLevelReq.pop && newCity.wealth >= nextLevelReq.wealth) {
      newCity.level += 1;
      newCity.wealth -= nextLevelReq.wealth * 0.5;
      
      // Update Era based on level
      const oldEra = newCity.era;
      if (newCity.level >= 15) newCity.era = Era.TECHNOLOGICAL;
      else if (newCity.level >= 12) newCity.era = Era.MECHANICAL;
      else if (newCity.level >= 9) newCity.era = Era.ENLIGHTENED;
      else if (newCity.level >= 6) newCity.era = Era.IMPERIAL;
      else if (newCity.level >= 3) newCity.era = Era.KINGDOM;

      if (newCity.era !== oldEra) {
        event = {
          tick,
          message: `¡Gran Avance! ${city.name} ha entrado en la ERA de ${Era[newCity.era]}.`,
          type: 'evolution',
          color: '#fbbf24'
        };
      } else {
        event = {
          tick,
          message: `La prosperidad de ${city.name} ha permitido un salto al nivel ${newCity.level}.`,
          type: 'city',
          color: SPECIES_SPECS[city.species].color
        };
      }
    }

    // Technological Discovery based on trade volume and species personality
    const spec = SPECIES_SPECS[city.species];
    const techMultiplier = 1 + (spec.personality.tradeValue / 100);
    const nextTechReq = Math.pow(newCity.techLevel + 1, 2) * 40 / techMultiplier;
    
    if (newCity.tradeVolume >= nextTechReq) {
      newCity.techLevel += 1;
      event = {
        tick,
        message: `¡Hito Científico! ${city.name} alcanza el nivel tecnológico ${newCity.techLevel}.`,
        type: 'discovery',
        color: '#60a5fa'
      };
    }

    return { city: newCity, event };
  }

  static buildSpatialMap(agents: Agent[]): Map<string, Agent[]> {
    const map = new Map<string, Agent[]>();
    agents.forEach(a => {
      if (!a.alive) return;
      const key = `${a.x},${a.y}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    });
    return map;
  }

  static updateAgent(
    agent: Agent, 
    grid: Biome[][], 
    spatialMap: Map<string, Agent[]>, 
    speciesPopulations: Record<string, number>,
    totalPopulation: number,
    cities: City[], 
    diplomacy: Record<string, DiplomacyRecord>,
    tick: number
  ): { agent: Agent, newAgents: Agent[], newCity?: City, diplomacyDelta?: { key: string, points: number }, event?: HistoryEvent, tradeEvent?: { cityId: string, wealth: number, trade: number }[] } {
    if (!agent.alive) return { agent, newAgents: [] };

    const newAgent = { ...agent };
    newAgent.age += 1;
    let diplomacyDelta: { key: string, points: number } | undefined = undefined;
    let event: HistoryEvent | undefined = undefined;
    let tradeDeltas: { cityId: string, wealth: number, trade: number }[] = [];
    
    const spec = SPECIES_SPECS[agent.species];
    const personality = spec.personality;
    const currentBiome = grid[newAgent.y][newAgent.x];
    const isPreferred = spec.preferredBiomes.includes(currentBiome);
    const isAvoided = spec.avoidBiomes.includes(currentBiome);

    // Environmental Interaction - SOFTENED for better early survival
    if (isPreferred) {
      newAgent.energy += 4; // Increased gain
      newAgent.wealth += 0.5 * (1 + personality.greed / 100);
      if (newAgent.health < newAgent.maxHealth) newAgent.health += 2;
    } else if (isAvoided) {
      newAgent.energy -= 2; // Decays slower
      if (personality.ecologySensitivity > 70) newAgent.energy -= 1;
    } else {
      newAgent.energy -= 0.5; // Decays slower
      newAgent.wealth += 0.1;
    }

    // Nearby interaction - OPTIMIZED WITH SPATIAL MAP
    const nearby: Agent[] = [];
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const nx = agent.x + dx;
        const ny = agent.y + dy;
        const nearbyAgents = spatialMap.get(`${nx},${ny}`);
        if (nearbyAgents) {
          nearbyAgents.forEach(other => {
            if (other.id !== agent.id) nearby.push(other);
          });
        }
      }
    }

    nearby.forEach(other => {
      const otherSpec = SPECIES_SPECS[other.species];
      
      // Trade Logic
      const tradeChance = 0.05 * (personality.tradeValue / 50);
      if (Math.random() < tradeChance) {
        if (agent.cityId && other.cityId && agent.cityId !== other.cityId) {
          const tradeValue = (5 + (agent.traits.intelligence / 2)) * (1 + personality.greed / 100);
          const techValue = agent.species !== other.species ? 15 : 3;

          tradeDeltas.push({ cityId: agent.cityId, wealth: tradeValue, trade: techValue });
          tradeDeltas.push({ cityId: other.cityId, wealth: tradeValue, trade: techValue });
        }
      }

      if (other.species !== agent.species) {
        const key = this.getDiplomacyKey(agent.species, other.species);
        const record = diplomacy[key];
        
        // Peace Drift
        if (record.relation !== RelationType.WAR) {
          const driftProb = 0.005 * (1 - personality.aggression / 150);
          if (Math.random() < driftProb) {
            diplomacyDelta = { key, points: 1 };
          }
        }

        // Conflict check driven by Aggression and Resource Need
        const conflictProb = 0.05 * (personality.aggression / 50);
        if (record.relation === RelationType.WAR && Math.random() < conflictProb) {
          // Combat
          const damage = Math.floor(agent.traits.strength / 2);
          other.health -= damage;
          newAgent.energy -= 4;
          diplomacyDelta = { key, points: -2 };
        }
      }
    });

    // Movement - OPTIMIZED WITH SPATIAL MAP
    if (newAgent.energy > 15) {
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]];
      const randomDir = dirs[Math.floor(Math.random() * dirs.length)];
      const targetX = newAgent.x + randomDir[0];
      const targetY = newAgent.y + randomDir[1];

      if (
        targetX >= 0 && targetX < grid[0].length &&
        targetY >= 0 && targetY < grid.length &&
        grid[targetY][targetX] !== Biome.WATER &&
        grid[targetY][targetX] !== Biome.MOUNTAIN
      ) {
        const agentsAtTarget = spatialMap.get(`${targetX},${targetY}`);
        const occupiedObj = agentsAtTarget ? agentsAtTarget.find(a => a.id !== agent.id) : null;
        
        if (!occupiedObj) {
          newAgent.x = targetX;
          newAgent.y = targetY;
        } else if (occupiedObj.species !== agent.species) {
          const key = this.getDiplomacyKey(agent.species, occupiedObj.species);
          if (diplomacy[key]?.relation === RelationType.WAR) {
            occupiedObj.health -= Math.floor(agent.traits.strength / 3);
            newAgent.health -= 1;
          }
        }
      }
    }

    const offspring: Agent[] = [];
    // Increased population control & Reproduction for larger worlds
    const globalPopCap = 500;
    const speciesPop = speciesPopulations[agent.species] || 0;
    const speciesCap = 100; // Increased cap

    if (
      totalPopulation < globalPopCap && 
      speciesPop < speciesCap &&
      newAgent.energy > 80 && 
      newAgent.age > 20 && 
      newAgent.age < 250 && 
      newAgent.wealth > 40
    ) {
      const reproProb = 0.02 * newAgent.traits.fertility;
      if (Math.random() < reproProb) {
        newAgent.energy -= 60;
        newAgent.wealth -= 30;
        offspring.push({
          id: Math.random().toString(36).substr(2, 9),
          species: agent.species,
          x: agent.x,
          y: agent.y,
          health: 120,
          maxHealth: agent.maxHealth + (Math.random() - 0.4) * 5,
          energy: 60,
          age: 0,
          alive: true,
          generation: agent.generation + 1,
          wealth: 15,
          traits: {
            strength: agent.traits.strength + (Math.random() - 0.45) * 2,
            intelligence: agent.traits.intelligence + (Math.random() - 0.45) * 2,
            fertility: Math.max(0.1, agent.traits.fertility + (Math.random() - 0.5) * 0.2),
            vitality: agent.traits.vitality + (Math.random() - 0.45) * 2,
          },
          cityId: agent.cityId
        });
      }
    }

    // City Founding
    let createdCity: City | undefined = undefined;
    const foundationProb = 0.01 * (personality.expansionism / 50);
    if (!newAgent.cityId && newAgent.traits.intelligence > 12 && newAgent.wealth > 50 && Math.random() < foundationProb) {
        const cityNear = cities.some(c => Math.abs(c.x - newAgent.x) < 4 && Math.abs(c.y - newAgent.y) < 4);
        if (!cityNear) {
          newAgent.wealth -= 40;
        
        let cityName = '';
        const names: Record<string, string[]> = {
          [SpeciesType.HUMANS]: ['Castellón', 'Vanguardia', 'Bastión del Oro', 'Puerto Real', 'Alba'],
          [SpeciesType.ORCS]: ['Garra de Hierro', 'Cráneo Roto', 'Horda de Basalto', 'Fortaleza Roja', 'Colmillo'],
          [SpeciesType.ELVES]: ['Luna de Plata', 'Bosque Eterno', 'Santuario Arcano', 'Raíz Sagrada', 'Silvania'],
          [SpeciesType.DWARFS]: ['Yunque Profundo', 'Martillo de Piedra', 'Vena de Hierro', 'Karak', 'Mina Dorada'],
        };
        const currentNames = names[agent.species] || ['Colonia'];
        cityName = currentNames[Math.floor(Math.random() * currentNames.length)] + '_' + Math.random().toString(36).substr(2, 2);

        createdCity = {
          id: 'city_' + Math.random().toString(36).substr(2, 5),
          name: cityName,
          species: agent.species,
          x: newAgent.x,
          y: newAgent.y,
          population: 1,
          wealth: 100,
          tradeVolume: 0,
          techLevel: 1,
          level: 1,
          era: Era.TRIBAL,
          resources: {
            wheat: 5, stone: 0, iron: 0, gold: 50, bread: 10, wood: 10, meat: 5
          },
          stats: {
            births: 1,
            deaths: 0,
            age: 0,
            infected: 0,
            leader: this.generateName(agent.species),
            culture: this.generateCulture(agent.species),
            kingdom: `El Gran Reino de ${cityName}`
          }
        };
        newAgent.cityId = createdCity.id;
        event = {
          tick,
          message: `${agent.species} funda ${createdCity.name}. Comienza la era Tribal.`,
          type: 'city',
          color: spec.color
        };
      }
    }

    // Health and aging (Smarter & Longer lifespan for visibility)
    if (newAgent.energy <= 0) newAgent.health -= 2;
    if (newAgent.age > 400 + newAgent.traits.vitality * 5) newAgent.health -= 5;
    if (newAgent.health <= 0) newAgent.alive = false;

    if (agent.cityId && Math.random() < 0.1) {
        tradeDeltas.push({ cityId: agent.cityId, wealth: 1, trade: 0.1 });
    }

    // Evolution milestone
    if (newAgent.generation % 10 === 0 && agent.generation !== newAgent.generation) {
      event = {
        tick,
        message: `La estirpe de un ${agent.species} ha alcanzado la generación ${newAgent.generation}`,
        type: 'evolution',
        color: spec.color
      };
    }

    return { agent: newAgent, newAgents: offspring, newCity: createdCity, diplomacyDelta, event, tradeEvent: tradeDeltas };
  }

  static isCoastal(city: City, grid: Biome[][]): boolean {
    const { x, y } = city;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < grid[0].length && ny >= 0 && ny < grid.length) {
          if (grid[ny][nx] === Biome.WATER) return true;
        }
      }
    }
    return false;
  }

  static updateFleet(
    fleet: Fleet,
    grid: Biome[][],
    allFleets: Fleet[],
    cities: City[],
    diplomacy: Record<string, DiplomacyRecord>,
    tick: number
  ): { fleet: Fleet, event?: HistoryEvent, tradeResult?: { cityId: string, wealth: number }[] } {
    if (!fleet.alive) return { fleet };
    const newFleet = { ...fleet };
    let event: HistoryEvent | undefined = undefined;
    let tradeResult: { cityId: string, wealth: number }[] = [];

    // Navigation logic
    const moveToward = (tx: number, ty: number) => {
      const dx = Math.sign(tx - newFleet.x);
      const dy = Math.sign(ty - newFleet.y);
      
      // Strict terrain check
      const nx = newFleet.x + dx;
      const ny = newFleet.y + dy;
      const isWater = (x: number, y: number) => x >= 0 && x < grid[0].length && y >= 0 && y < grid.length && grid[y][x] === Biome.WATER;
      
      if (isWater(nx, ny)) {
        newFleet.x = nx;
        newFleet.y = ny;
      } else {
        // Try to slide along obstacles (standard 8-direction pathing)
        const others = [[dx, 0], [0, dy], [-dx, dy], [dx, -dy]];
        for (const [ox, oy] of others) {
          const sx = newFleet.x + ox;
          const sy = newFleet.y + oy;
          if (isWater(sx, sy)) {
            newFleet.x = sx;
            newFleet.y = sy;
            return;
          }
        }
      }
    };

    if (newFleet.type === FleetType.TRADE && newFleet.targetCityId) {
      const target = cities.find(c => c.id === newFleet.targetCityId);
      if (target) {
        const dist = Math.sqrt((target.x - newFleet.x) ** 2 + (target.y - newFleet.y) ** 2);
        if (dist < 2) {
          // Trade completed
          tradeResult.push({ cityId: newFleet.targetCityId, wealth: 50 });
          tradeResult.push({ cityId: newFleet.originCityId, wealth: 50 });
          newFleet.alive = false; // Disband after trade
          event = { 
            tick, 
            message: `Un mercante de ${newFleet.species} ha desembarcado en ${target.name}.`, 
            type: 'trade', 
            color: '#10b981' 
          };
        } else {
          moveToward(target.x, target.y);
        }
      } else {
        newFleet.alive = false;
      }
    } else if (newFleet.type === FleetType.WAR) {
      // Priority 1: Enemy fleets
      const enemyFleet = allFleets.find(f => 
        f.alive && 
        f.id !== newFleet.id && 
        diplomacy[this.getDiplomacyKey(newFleet.species, f.species)]?.relation === RelationType.WAR
      );

      if (enemyFleet) {
        const dist = Math.sqrt((enemyFleet.x - newFleet.x) ** 2 + (enemyFleet.y - newFleet.y) ** 2);
        if (dist < 2) {
          enemyFleet.health -= 15;
          newFleet.health -= 8;
          if (Math.random() < 0.2) {
            event = { 
              tick, 
              message: `¡Esfuerzo de guerra! Batalla naval entre ${newFleet.species} y ${enemyFleet.species}.`, 
              type: 'naval', 
              color: '#ef4444' 
            };
          }
        } else {
          moveToward(enemyFleet.x, enemyFleet.y);
        }
      } else {
        // Priority 2: Enemy coastal cities
        const enemyCity = cities.find(c => 
          c.species !== newFleet.species && 
          this.isCoastal(c, grid) &&
          diplomacy[this.getDiplomacyKey(newFleet.species, c.species)]?.relation === RelationType.WAR
        );

        if (enemyCity) {
          const dist = Math.sqrt((enemyCity.x - newFleet.x) ** 2 + (enemyCity.y - newFleet.y) ** 2);
          if (dist < 2.5) {
            // Bombard city
            tradeResult.push({ cityId: enemyCity.id, wealth: -20 });
            newFleet.health -= 2; // Small attrition
            if (Math.random() < 0.05) {
              event = { 
                tick, 
                message: `La flota de ${newFleet.species} está bombardeando las costas de ${enemyCity.name}.`, 
                type: 'war', 
                color: '#b91c1c' 
              };
            }
          } else {
            moveToward(enemyCity.x, enemyCity.y);
          }
        } else {
          // Patrol
          moveToward(newFleet.x + (Math.random() - 0.5) * 10, newFleet.y + (Math.random() - 0.5) * 10);
        }
      }
    }

    if (newFleet.health <= 0) newFleet.alive = false;
    return { fleet: newFleet, event, tradeResult };
  }

  static spawnManualAgent(x: number, y: number, species: SpeciesType): Agent {
    return {
      id: Math.random().toString(36).substr(2, 9),
      species: species,
      x,
      y,
      health: 120,
      maxHealth: 120,
      energy: 100,
      age: 0,
      alive: true,
      generation: 1,
      wealth: 50,
      traits: {
        strength: 15,
        intelligence: 15,
        fertility: 1.5,
        vitality: 15,
      }
    };
  }

  static manageTradeRoutes(cities: City[], currentRoutes: TradeRoute[], grid: Biome[][]): TradeRoute[] {
    const routes = [...currentRoutes.filter(r => r.active)];
    
    // Cleanup routes where cities no longer exist
    const cityIds = new Set(cities.map(c => c.id));
    const cleanedRoutes = routes.filter(r => cityIds.has(r.fromId) && cityIds.has(r.toId));

    // Update existing routes
    cleanedRoutes.forEach(route => {
      const c1 = cities.find(c => c.id === route.fromId);
      const c2 = cities.find(c => c.id === route.toId);
      if (c1 && c2) {
        // Upgrade road if cities are rich
        if (route.level < 2 && c1.wealth > 1000 && c2.wealth > 1000 && Math.random() < 0.05) {
          route.level++;
          c1.wealth -= 200;
          c2.wealth -= 200;
        }
        // Investment in security
        if (route.security < 1 && (c1.wealth > 800 || c2.wealth > 800) && Math.random() < 0.02) {
          route.security = Math.min(1, route.security + 0.1);
          c1.wealth -= 50;
        }

        // Banditry Mechanic: Routes with low security can be robbed
        const robberyChance = 0.005 * (1 - route.security);
        if (Math.random() < robberyChance) {
          const loss = Math.floor(c1.wealth * 0.05);
          c1.wealth -= loss;
          c2.wealth -= loss;
          // Security naturally improves slightly after a tragedy as cities react
          route.security = Math.min(1, route.security + 0.05);
        }
      }
    });

    // Try to create new routes if we have space
    if (cleanedRoutes.length < 25 && cities.length >= 2) {
      const c1 = cities[Math.floor(Math.random() * cities.length)];
      const c2 = cities[Math.floor(Math.random() * cities.length)];

      if (c1.id !== c2.id && !cleanedRoutes.find(r => (r.fromId === c1.id && r.toId === c2.id) || (r.fromId === c2.id && r.toId === c1.id))) {
        const dist = Math.sqrt((c1.x - c2.x) ** 2 + (c1.y - c2.y) ** 2);
        if (dist < 50) {
          const isSea = this.isCoastal(c1, grid) && this.isCoastal(c2, grid);
          
          // Try to find a valid midpoint for the terrain type
          let midX = (c1.x + c2.x)/2;
          let midY = (c1.y + c2.y)/2;
          
          let validMid = false;
          let attempts = 0;
          while (!validMid && attempts < 5) {
            const tx = midX + (Math.random()-0.5)*15;
            const ty = midY + (Math.random()-0.5)*15;
            const rx = Math.floor(tx); const ry = Math.floor(ty);
            if (rx >= 0 && rx < grid[0].length && ry >= 0 && ry < grid.length) {
                const biome = grid[ry][rx];
                if (isSea ? (biome === Biome.WATER) : (biome !== Biome.WATER)) {
                    midX = tx; midY = ty;
                    validMid = true;
                }
            }
            attempts++;
          }

          cleanedRoutes.push({
            id: Math.random().toString(36).substr(2, 9),
            fromId: c1.id,
            toId: c2.id,
            type: isSea ? 'sea' : 'land',
            points: [
              {x: c1.x, y: c1.y},
              {x: midX, y: midY},
              {x: c2.x, y: c2.y}
            ],
            active: true,
            intensity: 0.5 + Math.random() * 0.5,
            level: 0,
            security: 0.1
          });
        }
      }
    }

    return cleanedRoutes;
  }
}

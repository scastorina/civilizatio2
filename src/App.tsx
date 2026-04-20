/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { ConfigMenu } from './components/ConfigMenu';
import { Biome, Agent, GameState, WorldConfig, SPECIES_SPECS, BIOME_COLORS, SpeciesType, City, RelationType, Era, Fleet, FleetType } from './types';
import { Engine } from './game/engine';
import { 
  Play, Pause, RefreshCw, Save, FolderOpen, 
  Settings, ScrollText, UserPlus,
  Mountain, Users, Zap, Microscope,
  Eraser, Flame, Undo2, LogOut, Info,
  X, Briefcase, Heart, Skull, Biohazard, Clock, Baby,
  Coins, Gem, Beef, Wheat, HardHat, Pickaxe,
  Hammer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ToolCategory = 'terrain' | 'life' | 'powers' | 'inspect' | 'settings' | null;

// City Inspector Modal Matching the Screenshot
const CityInspector = ({ city, onClose }: { city: City, onClose: () => void }) => {
  if (!city) return null;
  const spec = SPECIES_SPECS[city.species];
  
  const ResourceItem = ({ icon: Icon, value, color }: any) => (
    <div className="flex items-center gap-1">
      <Icon size={14} className={color} />
      <span className="text-[10px] font-bold font-mono">{Math.floor(value)}</span>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
    >
      <div className="w-[420px] bg-[#3a3a3a] border-[4px] border-[#222] rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
        {/* Header */}
        <div className="bg-[#4a4a4a] p-4 flex justify-between items-center border-b-[4px] border-[#222]">
           <div className="flex-1 text-center">
              <span className="bg-black/40 px-6 py-1 rounded-lg text-yellow-500 font-black uppercase tracking-[0.2em] shadow-inner border border-white/5">
                {city.name}
              </span>
           </div>
           <button onClick={onClose} className="bg-red-600 p-1 rounded-lg border-2 border-[#111] hover:bg-red-500">
              <X size={20} className="text-white" />
           </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
           {/* Top Stats Row */}
           <div className="flex justify-evenly items-center gap-2">
              <div className="flex flex-col items-center gap-1 bg-black/20 p-2 rounded-xl flex-1 border border-white/5">
                 <Users size={18} className="text-blue-400" />
                 <span className="text-xs font-black text-blue-300">{city.population}</span>
              </div>
              <div className="flex flex-col items-center gap-1 bg-black/20 p-2 rounded-xl flex-1 border border-white/5">
                 <Briefcase size={18} className="text-orange-400" />
                 <span className="text-xs font-black text-orange-300">{city.level}</span>
              </div>
              <div className="flex flex-col items-center gap-1 bg-black/20 p-2 rounded-xl flex-1 border border-white/5">
                 <Heart size={18} className="text-red-400" />
                 <span className="text-xs font-black text-red-300">100%</span>
              </div>
           </div>

           {/* Resources Grid (From Screenshot) */}
           <div className="grid grid-cols-4 gap-4 bg-black/40 p-4 rounded-2xl border-2 border-[#111] shadow-inner">
              <ResourceItem icon={Coins} value={city.resources.gold} color="text-yellow-500" />
              <ResourceItem icon={Wheat} value={city.resources.wheat} color="text-amber-500" />
              <ResourceItem icon={Pickaxe} value={city.resources.stone} color="text-gray-400" />
              <ResourceItem icon={Hammer} value={city.resources.iron} color="text-blue-200" />
              <ResourceItem icon={Gem} value={city.wealth} color="text-indigo-400" />
              <ResourceItem icon={Beef} value={city.resources.meat} color="text-red-300" />
              <ResourceItem icon={Info} value={city.resources.bread} color="text-orange-200" />
              <ResourceItem icon={Settings} value={city.tradeVolume} color="text-white/40" />
           </div>

           {/* Details List */}
           <div className="space-y-3 font-mono text-[11px] uppercase font-bold text-white/70">
              <div className="flex justify-between border-b border-white/5 pb-1">
                 <span className="text-orange-400/70">Líder</span>
                 <span className="text-blue-400 underline decoration-dotted cursor-help">{city.stats.leader}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                 <span className="text-orange-400/70">Cultura</span>
                 <span className="text-green-400">{city.stats.culture}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                 <span className="text-orange-400/70">Reino</span>
                 <span className="text-blue-500">{city.stats.kingdom}</span>
              </div>
              <div className="flex justify-between pt-2">
                 <span className="flex items-center gap-2"><Clock size={12} className="text-orange-500" /> Edad de la Aldea</span>
                 <span className="text-yellow-600">{city.stats.age}</span>
              </div>
              <div className="flex justify-between">
                 <span className="flex items-center gap-2"><Baby size={12} className="text-green-500" /> Nacimientos</span>
                 <span className="text-yellow-600">{city.stats.births}</span>
              </div>
              <div className="flex justify-between">
                 <span className="flex items-center gap-2"><Skull size={12} className="text-red-500" /> Muertes</span>
                 <span className="text-yellow-600">{city.stats.deaths}</span>
              </div>
              <div className="flex justify-between">
                 <span className="flex items-center gap-2"><Biohazard size={12} className="text-green-300" /> Infectados</span>
                 <span className="text-green-300">0</span>
              </div>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [worldConfig, setWorldConfig] = useState<WorldConfig | null>(null);
  const [showMenu, setShowMenu] = useState(true);
  
  // WorldBox UI States
  const [activeCategory, setActiveCategory] = useState<ToolCategory>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedBiome, setSelectedBiome] = useState<Biome>(Biome.GRASS);
  const [showChronology, setShowChronology] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

  const lastTickRef = useRef<number>(0);
  const requestRef = useRef<number | null>(null);

  const startGame = (config: WorldConfig) => {
    const allSpecies = Object.values(SpeciesType) as SpeciesType[];
    const initialSpecies = allSpecies.sort(() => 0.5 - Math.random()).slice(0, 3);
    const grid = Engine.generateWorld(config);
    const agents = Engine.spawnAgents(grid, config.populationSize, initialSpecies);
    
    setGameState({
      grid,
      agents,
      cities: [],
      fleets: [],
      tradeRoutes: [],
      tick: 0,
      isPaused: false,
      gameSpeed: 1,
      selectedBiome: Biome.GRASS,
      selectedSpecies: null,
      editorActive: false,
      interventionActive: false,
      diplomacy: Engine.initializeDiplomacy(),
      history: [{ tick: 0, message: "El mundo ha sido creado. Comienza la era de las leyendas.", type: 'evolution' }],
      activeSpecies: initialSpecies
    });
    setWorldConfig(config);
    setShowMenu(false);
  };

  const update = useCallback((time: number) => {
    if (!gameState || gameState.isPaused) {
      requestRef.current = requestAnimationFrame(update);
      return;
    }

    const interval = 200 / gameState.gameSpeed;
    if (time - lastTickRef.current >= interval) {
      setGameState(prev => {
        if (!prev) return null;
        
        const newCities = [...prev.cities];
        const allNewAgents: Agent[] = [];
        const newDiplomacy = { ...prev.diplomacy };
        const newHistory = [...prev.history];
        const activeSpecies = [...prev.activeSpecies];

        const spatialMap = Engine.buildSpatialMap(prev.agents);
        const speciesPopulations = prev.agents.reduce((acc, a) => {
          if (a.alive) acc[a.species] = (acc[a.species] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const totalPopulation = prev.agents.filter(a => a.alive).length;

        const discovery = Engine.tryDiscoverSpecies(prev.tick, activeSpecies);
        if (discovery) {
          activeSpecies.push(discovery.newSpecies);
          newHistory.unshift(discovery.event);
          const newArrivals = Engine.spawnNewSpeciesInitial(prev.grid, discovery.newSpecies);
          allNewAgents.push(...newArrivals);
        }
        
        const citiesMap = new Map(newCities.map(c => [c.id, c]));
        
        prev.agents.forEach(a => {
          if (!a.alive) return;
          const result = Engine.updateAgent(a, prev.grid, spatialMap, speciesPopulations, totalPopulation, prev.cities, prev.diplomacy, prev.tick);
          allNewAgents.push(result.agent);
          if (result.newAgents.length > 0) allNewAgents.push(...result.newAgents);
          if (result.newCity) {
            newCities.push(result.newCity);
            citiesMap.set(result.newCity.id, result.newCity);
          }
          if (result.event) newHistory.unshift(result.event);
          
          if (result.tradeEvent) {
             result.tradeEvent.forEach(delta => {
                const targetCity = citiesMap.get(delta.cityId);
                if (targetCity) {
                   targetCity.wealth += delta.wealth;
                   targetCity.tradeVolume += delta.trade;
                }
             });
          }

          if (result.diplomacyDelta) {
            const { key, points } = result.diplomacyDelta;
            const record = { ...(newDiplomacy[key] as any) };
            const [s1, s2] = key.split('|');
            record.points += points;
            
            if (record.relation !== RelationType.WAR && record.points < -50) {
              record.relation = RelationType.WAR;
              record.lastWarTick = prev.tick;
              newHistory.unshift({ tick: prev.tick, message: `¡Guerra! Los ${s1} y ${s2} han desenvainado el acero.`, type: 'war', color: '#ef4444' });
            } else if (record.relation === RelationType.WAR && record.points > 0) {
              record.relation = RelationType.NEUTRAL;
              newHistory.unshift({ tick: prev.tick, message: `Paz armada entre ${s1} y ${s2}. Las hostilidades cesan.`, type: 'peace' });
            }
            newDiplomacy[key] = record;
          }
        });

        const newRoutes = Engine.manageTradeRoutes(newCities, prev.tradeRoutes, prev.grid);
        const allNewFleets: Fleet[] = [...prev.fleets].filter(f => f.alive);
        newCities.forEach(city => {
          if (city.wealth > 300 && Engine.isCoastal(city, prev.grid)) {
            const cityFleets = allNewFleets.filter(f => f.originCityId === city.id);
            if (cityFleets.length < 3 && Math.random() < 0.01) {
              const type = Math.random() < 0.7 ? FleetType.TRADE : FleetType.WAR;
              const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
              for (const [dx, dy] of dirs) {
                const nx = city.x + dx; const ny = city.y + dy;
                if (nx >= 0 && nx < prev.grid[0].length && ny >= 0 && ny < prev.grid.length && prev.grid[ny][nx] === Biome.WATER) {
                  let targetCityId: string | undefined = undefined;
                  if (type === FleetType.TRADE) {
                    const potentialTargets = newCities.filter(c => c.id !== city.id && Engine.isCoastal(c, prev.grid));
                    targetCityId = potentialTargets[Math.floor(Math.random() * potentialTargets.length)]?.id;
                  }
                  if (targetCityId || type === FleetType.WAR) {
                    allNewFleets.push({
                      id: 'fleet_' + Math.random().toString(36).substr(2, 5),
                      species: city.species, type, x: nx, y: ny, health: 120, maxHealth: 120, cargo: type === FleetType.TRADE ? 100 : 0, alive: true, originCityId: city.id, targetCityId
                    });
                    break;
                  }
                }
              }
            }
          }
        });

        const updatedFleets: Fleet[] = [];
        allNewFleets.forEach(f => {
          const result = Engine.updateFleet(f, prev.grid, allNewFleets, newCities, newDiplomacy, prev.tick);
          updatedFleets.push(result.fleet);
          if (result.tradeResult) {
            result.tradeResult.forEach(tr => {
              const targetCity = citiesMap.get(tr.cityId);
              if (targetCity) targetCity.wealth += tr.wealth;
            });
          }
        });

        const cityPopulations = allNewAgents.reduce((acc, a) => {
          if (a.cityId && a.alive) acc[a.cityId] = (acc[a.cityId] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const updatedCities = newCities.map(city => {
          const population = cityPopulations[city.id] || 0;
          return Engine.updateCity({ ...city, population }, prev.tick, prev.grid).city;
        });

        return {
          ...prev,
          agents: allNewAgents,
          cities: updatedCities.filter(c => c.population > 0),
          fleets: updatedFleets,
          tradeRoutes: newRoutes,
          diplomacy: newDiplomacy,
          history: newHistory.slice(0, 50),
          activeSpecies,
          tick: prev.tick + 1,
        };
      });
      lastTickRef.current = time;
    }
    requestRef.current = requestAnimationFrame(update);
  }, [gameState]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [update]);

  // WorldBox interactions
  const handleTileClick = (x: number, y: number) => {
    if (!gameState) return;

    if (activeCategory === 'life' && selectedTool) {
      const species = selectedTool as SpeciesType;
      const newAgent = Engine.spawnManualAgent(x, y, species);
      setGameState(prev => prev ? { ...prev, agents: [...prev.agents, newAgent] } : null);
      return;
    }

    if (activeCategory === 'terrain') {
      setGameState(prev => {
        if (!prev) return null;
        const newGrid = prev.grid.map(row => [...row]);
        newGrid[y][x] = selectedBiome;
        return { ...prev, grid: newGrid };
      });
      return;
    }

    if (selectedTool === 'eraser') {
       setGameState(prev => {
         if (!prev) return null;
         return {
           ...prev,
           agents: prev.agents.filter(a => Math.abs(a.x-x) > 2 || Math.abs(a.y-y) > 2),
           cities: prev.cities.filter(c => Math.abs(c.x-x) > 3 || Math.abs(c.y-y) > 3)
         };
       });
    }
  };

  const saveGame = () => {
    if (!gameState) return;
    localStorage.setItem('worldbox_clone_save', JSON.stringify(gameState));
    alert('Progreso sellado.');
  };

  const loadGame = () => {
    const saved = localStorage.getItem('worldbox_clone_save');
    if (saved) {
      setGameState(JSON.parse(saved));
      setShowMenu(false);
    }
  };

  if (showMenu) {
    return (
      <div className="min-h-screen bg-[#0c0b09] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/castle/1920/1080?blur=10')] bg-cover opacity-20" />
        <div className="z-10 w-full max-w-md">
          <ConfigMenu onStart={startGame} />
          {localStorage.getItem('worldbox_clone_save') && (
            <button 
              onClick={loadGame}
              className="mt-6 w-full flex items-center justify-center gap-3 py-4 bg-[#78350f] text-white rounded-2xl font-bold uppercase"
            >
              <FolderOpen className="w-5 h-5" /> Retomar Crónica
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!gameState) return null;

  const categories = [
    { id: 'terrain' as ToolCategory, icon: Mountain, label: 'Tierras' },
    { id: 'life' as ToolCategory, icon: Users, label: 'Vida' },
    { id: 'powers' as ToolCategory, icon: Zap, label: 'Poderes' },
    { id: 'inspect' as ToolCategory, icon: Microscope, label: 'Datos' },
    { id: 'settings' as ToolCategory, icon: Settings, label: 'Menú' },
  ];

  return (
    <div className="viewport-container text-white font-sans selection:bg-yellow-900/30 overflow-hidden bg-black select-none">
      {/* Background Canvas */}
      <div className="absolute inset-0 z-0">
         <GameCanvas 
          grid={gameState.grid} 
          agents={gameState.agents} 
          cities={gameState.cities} 
          fleets={gameState.fleets} 
          tradeRoutes={gameState.tradeRoutes} 
          onTileClick={handleTileClick}
          onCityClick={(city) => setSelectedCityId(city?.id || null)}
          selectedCityId={selectedCityId}
          editorActive={activeCategory === 'terrain'} 
          interventionActive={activeCategory === 'life'}
          inspectActive={activeCategory === 'inspect'}
        />
      </div>

      <AnimatePresence>
        {selectedCityId && gameState.cities.find(c => c.id === selectedCityId) && (
          <CityInspector 
            city={gameState.cities.find(c => c.id === selectedCityId)!} 
            onClose={() => setSelectedCityId(null)} 
          />
        )}
      </AnimatePresence>

      {/* World Stats - Top Left */}
      <div className="absolute top-4 left-4 flex flex-col gap-1 z-20 pointer-events-none">
         <div className="flex items-center gap-2 bg-black/70 px-3 py-1 rounded-lg backdrop-blur-md border border-white/10">
            <span className="text-[10px] text-white/50 uppercase tracking-tighter">Año {gameState.tick}</span>
         </div>
         <div className="flex items-center gap-2 bg-black/70 px-3 py-1 rounded-lg backdrop-blur-md border border-white/10">
            <span className="text-[10px] text-white/50 uppercase tracking-tighter">Vivos: {gameState.agents.filter(a => a.alive).length}</span>
         </div>
      </div>

      {/* BOTTOM TOOLBAR (WorldBox Style) */}
      <div className="absolute bottom-0 left-0 right-0 z-50 flex flex-col items-center">
        <AnimatePresence>
          {activeCategory && (
            <motion.div
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
              className="mb-4 bg-[#2a2a2a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col gap-4 max-w-[95vw]"
            >
              <div className="flex gap-4 overflow-x-auto no-scrollbar">
                {activeCategory === 'terrain' && Object.entries(BIOME_COLORS).map(([biome, color]) => (
                  <button key={biome} onClick={() => setSelectedBiome(Number(biome))} className={`w-14 h-14 rounded-xl border-2 transition-all ${selectedBiome === Number(biome) ? 'border-yellow-500 scale-110' : 'border-transparent opacity-60'}`}>
                    <div className="w-8 h-8 mx-auto rounded shadow-inner" style={{ backgroundColor: color }} />
                  </button>
                ))}
                {activeCategory === 'life' && Object.entries(SPECIES_SPECS).map(([type, spec]) => (
                  <button key={type} onClick={() => setSelectedTool(type)} className={`w-16 h-16 flex flex-col items-center justify-center gap-2 rounded-xl border-2 transition-all ${selectedTool === type ? 'border-yellow-500 bg-white/10 scale-110' : 'border-transparent opacity-60'}`}>
                    <div className="w-8 h-8 rounded-full border-2" style={{ backgroundColor: spec.color, borderColor: spec.color }} />
                    <span className="text-[8px] font-bold uppercase truncate">{type.split(' ')[0]}</span>
                  </button>
                ))}
                {activeCategory === 'powers' && (
                   <div className="flex gap-4">
                      <button onClick={() => setSelectedTool('eraser')} className={`w-14 h-14 flex flex-col items-center justify-center rounded-xl border-2 ${selectedTool === 'eraser' ? 'border-red-500 bg-red-500/10' : 'border-transparent opacity-60'}`}>
                         <Eraser size={24} />
                      </button>
                      <button className="w-14 h-14 flex items-center justify-center rounded-xl border-transparent opacity-20 cursor-not-allowed"><Flame size={24} /></button>
                   </div>
                )}
                {activeCategory === 'settings' && (
                   <div className="flex gap-4">
                      <button onClick={saveGame} className="w-14 h-14 flex items-center justify-center rounded-xl opacity-80 hover:bg-white/5"><Save size={24} /></button>
                      <button onClick={() => startGame(worldConfig!)} className="w-14 h-14 flex items-center justify-center rounded-xl opacity-80 hover:bg-white/5 text-red-500"><RefreshCw size={24} /></button>
                      <button onClick={() => setShowChronology(!showChronology)} className="w-14 h-14 flex items-center justify-center rounded-xl opacity-80 hover:bg-white/5"><ScrollText size={24} /></button>
                   </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full bg-[#1c1c1c] border-t border-white/10 px-8 py-3 flex justify-evenly items-center shadow-2xl">
           {categories.map(cat => (
             <button key={cat.id} onClick={() => setActiveCategory(activeCategory === cat.id ? null : cat.id)} className={`flex flex-col items-center gap-1 transition-all ${activeCategory === cat.id ? 'translate-y-[-8px]' : ''}`}>
                <div className={`p-3 rounded-2xl transition-all ${activeCategory === cat.id ? 'bg-[#ff4b2b] text-white' : 'bg-white/5 text-white/40'}`}>
                   <cat.icon size={26} />
                </div>
                <span className={`text-[8px] uppercase font-black transition-opacity ${activeCategory === cat.id ? 'opacity-100' : 'opacity-40'}`}>{cat.label}</span>
             </button>
           ))}
        </div>
      </div>

      {/* CHRONOLOGY OVERLAY */}
      <AnimatePresence>
        {showChronology && (
           <motion.div initial={{ opacity: 0, x: -100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -100 }}
             className="absolute left-6 top-6 bottom-40 w-80 bg-black/80 backdrop-blur-md rounded-3xl p-6 border border-white/10 z-50 flex flex-col gap-4"
           >
              <div className="flex justify-between items-center">
                 <h2 className="text-xs font-black uppercase text-yellow-500 tracking-widest flex items-center gap-2"><ScrollText size={16} /> Crónicas</h2>
                 <button onClick={() => setShowChronology(false)} className="text-white/20"><Undo2 size={16} /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
                 {gameState.history.map((event, i) => (
                    <div key={i} className="text-[10px] leading-relaxed font-serif italic border-l-2 border-white/5 pl-3">
                       <span style={{ color: event.color }}>{event.message}</span>
                    </div>
                 ))}
              </div>
           </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 right-4 pointer-events-none opacity-40 text-[10px] uppercase font-bold text-right">
         [Click] Intervenir Mundo
      </div>
    </div>
  );
}

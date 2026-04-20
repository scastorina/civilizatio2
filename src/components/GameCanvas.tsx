/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Biome, Agent, BIOME_COLORS, SPECIES_SPECS, City, SpeciesType, Era, Fleet, FleetType, TradeRoute } from '../types';
import { Engine } from '../game/engine';

interface GameCanvasProps {
  grid: Biome[][];
  agents: Agent[];
  cities: City[];
  fleets: Fleet[];
  tradeRoutes: TradeRoute[];
  onTileClick: (x: number, y: number) => void;
  editorActive: boolean;
  interventionActive: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ grid, agents, cities, fleets, tradeRoutes, onTileClick, editorActive, interventionActive }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const terrainCacheRef = useRef<HTMLCanvasElement | null>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 0.8 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  const TILE_SIZE = 48;
  const requestRef = useRef<number>();

  const drawTerrainCache = useCallback(() => {
    if (grid.length === 0) return;
    const targetW = grid[0].length * TILE_SIZE;
    const targetH = grid.length * TILE_SIZE;

    const cache = document.createElement('canvas');
    cache.width = targetW;
    cache.height = targetH;
    const ctx = cache.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;

    grid.forEach((row, y) => {
      row.forEach((biome, x) => {
        const tx = x * TILE_SIZE;
        const ty = y * TILE_SIZE;

        ctx.fillStyle = BIOME_COLORS[biome];
        ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);

        ctx.save();
        ctx.translate(tx, ty);

        const baseSeed = (x * 374761397 + y * 668265263) >>> 0;
        let s = baseSeed;

        if (biome === Biome.GRASS) {
          ctx.fillStyle = 'rgba(0,0,0,0.06)';
          for (let i = 0; i < 20; i++) {
            s = (s * 1103515245 + 12345) >>> 0;
            const rx = (s % 100) / 100 * TILE_SIZE;
            s = (s * 1103515245 + 12345) >>> 0;
            const ry = (s % 100) / 100 * TILE_SIZE;
            ctx.fillRect(rx, ry, 1, 1 + ((s % 2) + 1));
          }
        } else if (biome === Biome.MOUNTAIN) {
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.beginPath(); ctx.moveTo(TILE_SIZE / 2, 8); ctx.lineTo(TILE_SIZE * 0.9, TILE_SIZE * 0.9); ctx.lineTo(TILE_SIZE * 0.1, TILE_SIZE * 0.9); ctx.fill();
        } else if (biome === Biome.FOREST) {
          ctx.fillStyle = '#1a2e05'; ctx.fillRect(TILE_SIZE / 2 - 2, TILE_SIZE / 2 + 5, 4, 10);
          ctx.fillStyle = '#2d3e1d'; ctx.beginPath(); ctx.moveTo(TILE_SIZE / 2 - 12, TILE_SIZE / 2 + 5); ctx.lineTo(TILE_SIZE / 2, TILE_SIZE / 2 - 15); ctx.lineTo(TILE_SIZE / 2 + 12, TILE_SIZE / 2 + 5); ctx.fill();
        }
        ctx.restore();
      });
    });

    terrainCacheRef.current = cache;
  }, [grid]);

  useEffect(() => {
    drawTerrainCache();
  }, [drawTerrainCache]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const time = performance.now() / 1000;

    // Responsive Canvas Resizing
    const parent = canvas.parentElement;
    if (parent) {
      if (canvas.width !== parent.clientWidth * dpr) {
        canvas.width = parent.clientWidth * dpr;
        canvas.height = parent.clientHeight * dpr;
      }
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    // 1. DRAW TERRAIN
    if (terrainCacheRef.current) {
      ctx.drawImage(terrainCacheRef.current, 0, 0);
    }

    // 2. DRAW TRADE ROUTES (Detailed Paths & Evolution)
    tradeRoutes.forEach(route => {
      const start = cities.find(c => c.id === route.fromId);
      const end = cities.find(c => c.id === route.toId);
      if (!start || !end) return;

      const sx = start.x * TILE_SIZE + TILE_SIZE / 2;
      const sy = start.y * TILE_SIZE + TILE_SIZE / 2;
      const ex = end.x * TILE_SIZE + TILE_SIZE / 2;
      const ey = end.y * TILE_SIZE + TILE_SIZE / 2;

      ctx.save();
      if (route.type === 'sea') {
        ctx.setLineDash([12, 6]);
        ctx.strokeStyle = '#3b82f633';
        ctx.lineWidth = 2;
      } else {
        // Land Route Styles: Trail -> Dirt -> Paved
        if (route.level === 0) { // Trail
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = '#78350f44';
          ctx.lineWidth = 1;
        } else if (route.level === 1) { // Dirt road
          ctx.setLineDash([]);
          ctx.strokeStyle = '#92400e66';
          ctx.lineWidth = 3;
        } else { // Paved/Roman road
          ctx.setLineDash([]);
          ctx.strokeStyle = '#4b556388';
          ctx.lineWidth = 5;
          ctx.stroke();
          ctx.strokeStyle = '#6b7280cc';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 4]); // Stone pattern
        }
      }
      
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      if (route.points && route.points.length > 2) {
        route.points.slice(1, -1).forEach(p => ctx.lineTo(p.x * TILE_SIZE + TILE_SIZE/2, p.y * TILE_SIZE + TILE_SIZE/2));
      }
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.restore();

      // Animated units (Merchants, Ships, Citizens)
      const unitCount = Math.floor(route.intensity * 3) + 1;
      for (let i = 0; i < unitCount; i++) {
        const offset = (i / unitCount);
        const progress = (time * 0.1 + offset) % 1;
        
        let tx, ty, angle;
        if (route.points && route.points.length >= 3) {
            const segmentCount = route.points.length - 1;
            const segmentIdx = Math.floor(progress * segmentCount);
            const segmentProgress = (progress * segmentCount) % 1;
            const p1 = route.points[segmentIdx];
            const p2 = route.points[segmentIdx + 1];
            const p1x = p1.x * TILE_SIZE + TILE_SIZE/2;
            const p1y = p1.y * TILE_SIZE + TILE_SIZE/2;
            const p2x = p2.x * TILE_SIZE + TILE_SIZE/2;
            const p2y = p2.y * TILE_SIZE + TILE_SIZE/2;
            tx = p1x + (p2x - p1x) * segmentProgress;
            ty = p1y + (p2y - p1y) * segmentProgress;
            angle = Math.atan2(p2y - p1y, p2x - p1x);
        } else {
            tx = sx + (ex - sx) * progress;
            ty = sy + (ey - sy) * progress;
            angle = Math.atan2(ey - sy, ex - sx);
        }

        ctx.save();
        ctx.translate(tx, ty);
        ctx.rotate(angle);
        
        if (route.type === 'sea') {
          // Ship Visual
          ctx.fillStyle = '#3d2b1f';
          ctx.beginPath();
          ctx.moveTo(-10, 0); ctx.lineTo(10, 0); ctx.lineTo(12, -4); ctx.lineTo(-12, -4); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(8, -4); ctx.lineTo(0, -18); ctx.closePath(); ctx.fill();
        } else {
          // Merchant/Caravan/Walking Person
          if (progress < 0.5) { // Person
            ctx.fillStyle = '#4b5563';
            ctx.beginPath(); ctx.arc(Math.sin(time*10)*2, -8, 3, 0, Math.PI*2); ctx.fill(); 
            ctx.fillRect(-2, -5, 4, 5);
          } else { // Wagon/Carriage
            ctx.fillStyle = '#78350f'; ctx.fillRect(-8, -8, 16, 7);
            ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(-5, 0, 3, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(5, 0, 3, 0, Math.PI*2); ctx.fill();
          }
        }
        ctx.restore();
      }
    });

    // 3. DRAW CITIES (3D Architecture & Details)
    cities.forEach(city => {
      const cx = city.x * TILE_SIZE + TILE_SIZE / 2;
      const cy = city.y * TILE_SIZE + TILE_SIZE / 2;
      const spec = SPECIES_SPECS[city.species] || { color: '#ffffff' };
      const level = city.level || 1;
      const isCoast = Engine.isCoastal(city, grid);
      const citySeed = city.id.split('').reduce((a, b) => (a * 31 + b.charCodeAt(0)) | 0, 0) >>> 0;
      let s = citySeed; const nextR = () => { s = (s * 1103515245 + 12345) >>> 0; return (s % 1000) / 1000; };
      const territoryRadius = (1.5 + level * 0.6) * TILE_SIZE;

      // Pixelated Territorial Border (WorldBox style)
      ctx.save();
      ctx.lineWidth = 4; ctx.strokeStyle = spec.color + '88';
      ctx.beginPath();
      for (let i = 0; i <= 32; i++) {
        const angle = (i / 32) * Math.PI * 2;
        const x = cx + Math.cos(angle) * territoryRadius;
        const y = cy + Math.sin(angle) * territoryRadius * 0.9;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke(); ctx.fillStyle = spec.color + '0f'; ctx.fill(); ctx.restore();

      // Farmlands (Villages usually have crops around them)
      if (level >= 1) {
          ctx.save();
          const farmCount = 3 + level;
          for (let i = 0; i < farmCount; i++) {
              const fa = nextR() * Math.PI * 2;
              const fd = (0.5 + nextR() * 0.4) * territoryRadius;
              const fx = cx + Math.cos(fa) * fd;
              const fy = cy + Math.sin(fa) * fd;
              const fS = TILE_SIZE * 0.45;
              ctx.fillStyle = '#78350f'; ctx.fillRect(fx - fS/2, fy - fS/2, fS, fS); // Soil
              ctx.fillStyle = '#4ade80'; ctx.fillRect(fx - fS/2 + 2, fy - fS/2 + 2, fS/2, fS/2); // Crops
          }
          ctx.restore();
      }

      // Architecture
      ctx.save();
      ctx.translate(cx, cy);
      const cityDensity = 5 + level * 3;
      for (let i = 0; i < cityDensity; i++) {
        const d = (0.15 + nextR() * 0.75) * territoryRadius * 0.4;
        const a = nextR() * Math.PI * 2;
        const px = Math.cos(a) * d; const py = Math.sin(a) * d;
        const bSize = 8 + nextR() * 10 + level; const hShift = nextR() * 10 + level * 2;
        
        ctx.save();
        ctx.translate(px, py);
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(2, 2, bSize, hShift/2);
        
        const buildType = nextR();
        // Roof colors (WorldBox style)
        let roofColor = '#ef4444'; // Red
        if (city.species === SpeciesType.ELVES) roofColor = '#3b82f6'; // Blue
        if (city.species === SpeciesType.DWARFS) roofColor = '#64748b'; // Slate/Grey
        if (city.species === SpeciesType.ORCS) roofColor = '#450a0a'; // Dark Red
        
        // Base
        ctx.fillStyle = '#d1d5db'; ctx.fillRect(-bSize/2, -hShift, bSize, hShift);
        // Windows
        ctx.fillStyle = '#334155'; ctx.fillRect(-bSize/4, -hShift/2, 3, 3); ctx.fillRect(bSize/4-3, -hShift/2, 3, 3);
        // Roof (Detailed Gable)
        ctx.fillStyle = roofColor;
        ctx.beginPath(); ctx.moveTo(-bSize/2-2, -hShift); ctx.lineTo(0, -hShift-bSize/1.1); ctx.lineTo(bSize/2+2, -hShift); ctx.closePath(); ctx.fill();
        // Cap
        ctx.fillStyle = '#111'; ctx.fillRect(-1, -hShift-bSize/1.1, 2, 2);
        
        ctx.restore();
      }

      // Stronghold (Town Hall)
      const sSize = 28 + level * 7; const sHeight = 25 + level * 8;
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(5, 5, sSize, sHeight); // Shadow
      ctx.fillStyle = '#94a3b8'; ctx.fillRect(-sSize/2, -sHeight, sSize, sHeight); // Stone Body
      // Door
      ctx.fillStyle = '#451a03'; ctx.fillRect(-4, -8, 8, 8);
      // Main Roof
      let mRoof = '#dc2626';
      if (city.species === SpeciesType.ELVES) mRoof = '#2563eb';
      if (city.species === SpeciesType.ORCS) mRoof = '#111';
      ctx.fillStyle = mRoof;
      ctx.beginPath(); ctx.moveTo(-sSize/2-4, -sHeight); ctx.lineTo(0, -sHeight - sSize/1.4); ctx.lineTo(sSize/2+4, -sHeight); ctx.closePath(); ctx.fill();
      
      ctx.restore();
    });

    // 4. DRAW FLEETS
    fleets.forEach(fleet => {
      if (!fleet.alive) return;
      const fx = fleet.x * TILE_SIZE + TILE_SIZE / 2;
      const fy = fleet.y * TILE_SIZE + TILE_SIZE / 2;
      const spec = SPECIES_SPECS[fleet.species] || { color: '#ffffff' };
      ctx.save(); ctx.translate(fx, fy + Math.sin(time * 2) * 3);
      ctx.fillStyle = '#3d2b1f'; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(0, 10, 12, 0); ctx.lineTo(15, -4); ctx.lineTo(-15, -4); ctx.fill();
      ctx.fillStyle = fleet.type === FleetType.TRADE ? '#f8fafc' : spec.color;
      ctx.beginPath(); ctx.moveTo(0, -2); ctx.lineTo(0, -25); ctx.lineTo(15, -10); ctx.closePath(); ctx.fill();
      if (fleet.type === FleetType.WAR) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke(); }
      ctx.restore();
    });

    // 5. DRAW AGENTS
    agents.forEach(agent => {
      if (!agent.alive) return;
      const x = agent.x * TILE_SIZE + TILE_SIZE / 2;
      const y = agent.y * TILE_SIZE + TILE_SIZE / 2;
      const spec = SPECIES_SPECS[agent.species] || { color: '#ffffff' };
      const t = time + parseInt(agent.id.slice(-3), 36)/100;
      const bob = Math.sin(t * 8) * 3;
      ctx.save(); ctx.translate(x, y + bob);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(0, 12, 10, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.shadowBlur = 10; ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.fillStyle = '#000'; ctx.fillRect(-11, -13, 22, 26);
      ctx.fillStyle = spec.color; ctx.fillRect(-9, -11, 18, 22);
      ctx.fillStyle = '#ffe4e6'; ctx.beginPath(); ctx.arc(0, -14, 7, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    });

    // 6. DRAW CITY LABELS
    cities.forEach(city => {
      const cx = city.x * TILE_SIZE + TILE_SIZE / 2;
      const cy = city.y * TILE_SIZE + TILE_SIZE / 2;
      const sHeight = 20 + city.level * 10;
      ctx.save();
      ctx.translate(cx, cy); ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      const labelW = city.name.length * 9 + 24;
      ctx.fillRect(-labelW/2, -sHeight - 48, labelW, 42);
      ctx.strokeStyle = '#d2b48c'; ctx.lineWidth = 1.5; ctx.strokeRect(-labelW/2, -sHeight - 48, labelW, 42);
      ctx.fillStyle = '#fff'; ctx.font = 'bold 15px serif'; ctx.fillText(city.name, 0, -sHeight - 29);
      ctx.fillStyle = '#d2b48c'; ctx.font = '10px Inter'; ctx.fillText(`Nivel ${city.level}`, 0, -sHeight - 16);
      ctx.restore();
    });

    ctx.restore();

    // minimap
    const mini = minimapRef.current;
    if (mini && terrainCacheRef.current) {
      const miniCtx = mini.getContext('2d');
      if (miniCtx) {
        const mW = mini.width;
        const mH = mini.height;
        miniCtx.clearRect(0,0,mW,mH);
        miniCtx.drawImage(terrainCacheRef.current, 0, 0, mW, mH);
        
        cities.forEach(c => {
          miniCtx.fillStyle = SPECIES_SPECS[c.species].color;
          const mx = (c.x / grid[0].length) * mW;
          const my = (c.y / grid.length) * mH;
          miniCtx.beginPath(); miniCtx.arc(mx, my, 4, 0, Math.PI*2); miniCtx.fill();
          miniCtx.strokeStyle = '#fff'; miniCtx.lineWidth = 1; miniCtx.stroke();
        });

        const vw = (canvas.width / dpr) / (grid[0].length * TILE_SIZE * camera.zoom);
        const vh = (canvas.height / dpr) / (grid.length * TILE_SIZE * camera.zoom);
        miniCtx.strokeStyle = 'rgba(255,255,255,0.8)';
        miniCtx.lineWidth = 2;
        miniCtx.strokeRect((-camera.x / (grid[0].length * TILE_SIZE * camera.zoom)) * mW, (-camera.y / (grid.length * TILE_SIZE * camera.zoom)) * mH, vw * mW, vh * mH);
      }
    }

    requestRef.current = requestAnimationFrame(render);
  }, [grid, agents, cities, fleets, tradeRoutes, camera, drawTerrainCache]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(render);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [render]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (editorActive || interventionActive) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const mx = (e.clientX - rect.left - camera.x) / camera.zoom;
        const my = (e.clientY - rect.top - camera.y) / camera.zoom;
        onTileClick(Math.floor(mx / TILE_SIZE), Math.floor(my / TILE_SIZE));
      }
    } else {
      setIsDragging(true);
      setLastMouse({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - lastMouse.x;
      const dy = e.clientY - lastMouse.y;
      setCamera(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      setLastMouse({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = -e.deltaY;
    const zoomDelta = delta > 0 ? 1.1 : 0.9;
    
    const newZoom = Math.max(0.05, Math.min(4, camera.zoom * zoomDelta));
    const effectiveDelta = newZoom / camera.zoom;

    setCamera(prev => ({
      zoom: newZoom,
      x: mouseX - (mouseX - prev.x) * effectiveDelta,
      y: mouseY - (mouseY - prev.y) * effectiveDelta,
    }));
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[85vh] bg-[#0c0b09] overflow-hidden cursor-move select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />
      
      {/* Minimap */}
      <div className="absolute top-4 left-4 w-48 h-32 bg-black/80 border-4 border-[#3d2b1f] rounded-xl overflow-hidden shadow-2xl pointer-events-none z-50">
        <canvas ref={minimapRef} width={192} height={128} className="w-full h-full opacity-80" />
        <div className="absolute top-1 left-2 text-[8px] font-bold text-[#d2b48c]/60 uppercase tracking-widest">Gran Mapa</div>
      </div>

      {(editorActive || interventionActive) && (
        <div className="absolute top-20 left-4 carved-wood px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest text-[#d2b48c] animate-pulse z-50">
          {editorActive ? 'Modo Arquitecto Activo' : 'Poder de Intervención Listo'}
        </div>
      )}

      {/* Zoom HUD */}
      <div className="absolute bottom-20 left-4 flex flex-col gap-2 z-40">
        <button 
          onClick={() => setCamera(p => ({
            ...p, 
            zoom: Math.min(4, p.zoom * 1.25)
          }))} 
          className="w-12 h-12 carved-wood rounded-xl flex items-center justify-center font-bold text-[#d2b48c] shadow-2xl active:scale-90 transition-transform"
        >
          <span className="text-2xl">+</span>
        </button>
        <button 
          onClick={() => setCamera(p => ({
            ...p, 
            zoom: Math.max(0.05, p.zoom * 0.75)
          }))} 
          className="w-12 h-12 carved-wood rounded-xl flex items-center justify-center font-bold text-[#d2b48c] shadow-2xl active:scale-90 transition-transform"
        >
          <span className="text-2xl">-</span>
        </button>
        <button 
          onClick={() => setCamera({ x: 0, y: 0, zoom: 0.8 })} 
          className="w-12 h-12 carved-stone rounded-xl flex items-center justify-center font-bold text-[#d2b48c] shadow-2xl active:scale-90 transition-transform mt-2"
        >
          <span className="text-[10px] uppercase">RST</span>
        </button>
      </div>
    </div>
  );
};

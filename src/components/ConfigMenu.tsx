/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { WorldConfig, BIOME_COLORS, Biome } from '../types';
import { Settings, Play, Map as MapIcon, Users } from 'lucide-react';

interface ConfigMenuProps {
  onStart: (config: WorldConfig) => void;
}

export const ConfigMenu: React.FC<ConfigMenuProps> = ({ onStart }) => {
  const [config, setConfig] = React.useState<WorldConfig>({
    width: 100,
    height: 60,
    preset: 'ancient',
    populationSize: 'medium',
  });

  return (
    <div className="max-w-md w-full p-10 floating-medieval-panel rounded-[40px]">
      <div className="parchment-bg p-8 rounded-3xl border-4 border-[#5a4738] shadow-2xl relative overflow-hidden">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 bg-[#4a3728] rounded-2xl text-[#d2b48c] border-2 border-[#5a4738] shadow-lg">
            <Settings className="w-6 h-6 rotate-90" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-yellow-900 leading-none font-serif tracking-tight">Civilizatio</h1>
            <p className="text-sm text-yellow-800/60 mt-1 font-serif italic">Configura tu Gran Crónica</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Dimensiones */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-yellow-900 mb-4 uppercase tracking-[0.2em]">
              <Play className="w-4 h-4 scale-75" /> Escala del Mundo
            </label>
            <div className="flex gap-2">
              {[
                { w: 60, h: 40, label: 'Normal' },
                { w: 120, h: 80, label: 'Grande' },
                { w: 200, h: 140, label: 'Gigante' }
              ].map((dim) => (
                <button
                  key={dim.label}
                  onClick={() => setConfig({ ...config, width: dim.w, height: dim.h })}
                  className={`flex-1 py-3 px-2 rounded-xl border-2 font-bold transition-all active:scale-95 text-[10px] ${
                    config.width === dim.w 
                      ? 'border-yellow-800 bg-[#4a3728] text-[#d2b48c] shadow-lg' 
                      : 'border-black/5 bg-black/5 text-yellow-900/60'
                  }`}
                >
                  {dim.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mapa Preset */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-yellow-900 mb-4 uppercase tracking-[0.2em]">
              <MapIcon className="w-4 h-4" /> Tipo de Tierras
            </label>
            <div className="grid grid-cols-1 gap-3">
              {[
                { id: 'islands', label: 'Islas del Reino', desc: 'Pequeños archipiélagos dispersos.' },
                { id: 'ancient', label: 'Mundo Antiguo', desc: 'Bandas de temperatura ecuatorial.' },
                { id: 'continent', label: 'Gran Continente', desc: 'Masa central rodeada de océano.' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setConfig({ ...config, preset: p.id as any })}
                  className={`flex flex-col items-start p-4 rounded-xl border-2 transition-all transition-transform active:scale-95 ${
                    config.preset === p.id 
                      ? 'border-yellow-700 bg-yellow-900/10 text-yellow-900 shadow-inner' 
                      : 'border-black/5 bg-black/5 text-yellow-900/60 hover:border-yellow-700/30'
                  }`}
                >
                  <span className="font-bold font-serif">{p.label}</span>
                  <span className="text-[10px] opacity-80 italic">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Población */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-yellow-900 mb-4 uppercase tracking-[0.2em]">
              <Users className="w-4 h-4" /> Población Inicial
            </label>
            <div className="flex gap-2">
              {['small', 'medium', 'large', 'huge'].map((s) => (
                <button
                  key={s}
                  onClick={() => setConfig({ ...config, populationSize: s as any })}
                  className={`flex-1 py-3 px-2 rounded-xl border-2 font-bold transition-all active:scale-95 text-[10px] ${
                    config.populationSize === s 
                      ? 'border-yellow-800 bg-[#4a3728] text-[#d2b48c] shadow-lg' 
                      : 'border-black/5 bg-black/5 text-yellow-900/60'
                  }`}
                >
                  {s === 'small' ? 'Escasa' : s === 'medium' ? 'Próspera' : s === 'large' ? 'Masiva' : 'Global'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => onStart(config)}
            className="w-full flex items-center justify-center gap-3 py-5 carved-wood rounded-2xl font-bold shadow-2xl transition-all hover:-translate-y-1 active:translate-y-0 text-lg uppercase tracking-widest"
          >
            <Play className="w-5 h-5 fill-current" />
            Engendrar Mundo
          </button>
        </div>
      </div>
    </div>
  );
};

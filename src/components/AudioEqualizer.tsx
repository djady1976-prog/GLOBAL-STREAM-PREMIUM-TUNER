/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sliders, RotateCcw } from 'lucide-react';
import { ThemeConfig, EQ_FREQUENCIES, EQ_PRESETS } from '../types';

interface AudioEqualizerProps {
  eqWeights: number[]; // 7 elements, -12 to +12 dB
  onChangeBand: (index: number, value: number) => void;
  activeEqPresetId: string;
  onSelectPreset: (presetId: string) => void;
  theme: ThemeConfig;
  locale: any;
}

export default function AudioEqualizer({
  eqWeights,
  onChangeBand,
  activeEqPresetId,
  onSelectPreset,
  theme,
  locale,
}: AudioEqualizerProps) {
  
  // Format standard frequencies to readable labels (e.g., 60Hz, 1kHz, 15kHz)
  const formatFreq = (freq: number) => {
    return freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
  };

  const handleReset = () => {
    onSelectPreset('flat');
  };

  // Generate SVG spline points for response curve
  // Width will map to 7 channels.
  const svgWidth = 320;
  const svgHeight = 60;
  const points = eqWeights.map((gain, i) => {
    const x = (i / (eqWeights.length - 1)) * (svgWidth - 20) + 10;
    // Map -12dB to height-10, +12dB to 10
    const y = svgHeight / 2 - (gain / 12) * (svgHeight / 2 - 8);
    return { x, y };
  });

  // Calculate SVG curve path using bezier smooth connections
  let pathD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cpX1 = curr.x + (next.x - curr.x) / 2;
      const cpY1 = curr.y;
      const cpX2 = curr.x + (next.x - curr.x) / 2;
      const cpY2 = next.y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${next.x} ${next.y}`;
    }
  }

  return (
    <div className="bg-black/70 backdrop-blur-md rounded-2xl border p-5 shadow-xl shadow-black/40 select-none overflow-auto resize min-h-[220px] min-w-[280px] relative"
         style={{ borderColor: theme.accentHex + '25' }} id="equalizer-panel">
      
      {/* Equalizer Title Headers */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-2 border-b border-stone-800/65">
        <div className="flex items-center gap-2">
          <Sliders size={16} style={{ color: theme.accentHex }} />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-300">
            {locale.equalizer}
          </span>
        </div>

        {/* Dynamic Reset controls */}
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono hover:bg-stone-800 border border-stone-800 cursor-pointer transition-colors duration-200"
          style={{ color: theme.accentHex }}
        >
          <RotateCcw size={10} />
          <span>RESET FLAT</span>
        </button>
      </div>

      {/* Preset selection buttons block */}
      <div className="mb-4">
        <label className="font-mono text-[9px] text-slate-500 uppercase tracking-widest block mb-2">
          {locale.theme.split(' ')[0]} PRESETS
        </label>
        <div className="flex flex-wrap gap-1.5" id="presets-container">
          {EQ_PRESETS.map((p) => {
            const active = activeEqPresetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onSelectPreset(p.id)}
                className={`px-2.5 py-1 text-[10px] rounded font-mono border transition-all duration-200 cursor-pointer ${
                  active
                    ? 'font-bold bg-stone-900 border-stone-600'
                    : 'text-slate-400 bg-black/40 border-stone-800 hover:text-slate-200 hover:border-stone-700'
                }`}
                style={{
                  color: active ? theme.accentHex : '',
                  boxShadow: active ? `0 0 6px ${theme.glowColor}25` : 'none',
                }}
              >
                {/* Translate local preset names */}
                {p.name[locale.exportFilename.includes('ro') ? 'ro' : locale.exportFilename.includes('it') ? 'it' : 'en']}
              </button>
            );
          })}
          {activeEqPresetId === 'custom' && (
            <span
              className="px-2.5 py-1 text-[10px] rounded font-mono font-bold border border-rose-500/30 text-rose-400 bg-stone-900 shadow-xs"
            >
              {locale.customPreset}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* SVG frequency diagram curve block */}
        <div className="md:col-span-1 hidden md:flex flex-col items-center bg-[#030303] py-3 px-2 rounded border border-stone-800/40 relative h-32 justify-center">
          <div className="absolute top-1 left-2 font-mono text-[8px] text-slate-500 tracking-wider">
            {locale.frequencyTitle}
          </div>
          
          <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="stroke-2 fill-none overflow-visible">
            {/* Center zero decibel guide line */}
            <line
              x1="5"
              y1={svgHeight / 2}
              x2={svgWidth - 5}
              y2={svgHeight / 2}
              stroke="#2e2e2e"
              strokeDasharray="2,2"
            />
            {/* Filled response glow area */}
            <path
              d={`${pathD} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`}
              fill={`url(#eqGlow-${theme.id})`}
              className="opacity-15 transition-all duration-300"
            />
            {/* Spline trace line */}
            <path
              d={pathD}
              stroke={theme.accentHex}
              className="transition-all duration-300"
              style={{ filter: `drop-shadow(0px 0px 3px ${theme.glowColor})` }}
            />
            {/* Sliders node points represent peaks */}
            {points.map((p, idx) => (
              <circle
                key={idx}
                cx={p.x}
                cy={p.y}
                r="3"
                fill="#ffffff"
                className="transition-all duration-300"
              />
            ))}

            {/* Gradient definition */}
            <defs>
              <linearGradient id={`eqGlow-${theme.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.accentHex} />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Legend bounds */}
          <div className="w-full flex justify-between px-2 text-[8px] font-mono text-stone-600 mt-2">
            <span>60Hz</span>
            <span>1kHz</span>
            <span>15kHz</span>
          </div>
        </div>

        {/* 7 Vertical Equalizer Sliders block */}
        <div className="md:col-span-2 flex justify-between items-end gap-1.5 h-32 pt-2 px-1 relative">
          
          {/* db Level Mark lines behind the sliders */}
          <div className="absolute left-0 right-0 top-3 bottom-8 flex flex-col justify-between pointer-events-none opacity-5 px-1 py-1">
            <div className="border-t border-dashed border-white w-full flex justify-between text-[7px] font-mono"><span className="bg-black/90 px-1">+12dB</span></div>
            <div className="border-t border-dashed border-white w-full flex justify-between text-[7px] font-mono"><span className="bg-black/90 px-1">0dB</span></div>
            <div className="border-t border-dashed border-white w-full flex justify-between text-[7px] font-mono"><span className="bg-black/90 px-1">-12dB</span></div>
          </div>

          {eqWeights.map((gain, i) => (
            <div key={i} className="flex flex-col items-center flex-1 h-full justify-end relative z-10">
              
              {/* dB Value readout */}
              <span className="font-mono text-[9px] font-semibold mb-1" style={{ color: gain === 0 ? '#6b7280' : theme.accentHex }}>
                {gain > 0 ? `+${gain}` : gain}
              </span>
              
              {/* Slider Input track */}
              <div className="h-18 flex items-center justify-center relative group">
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={gain}
                  onChange={(e) => onChangeBand(i, parseInt(e.target.value))}
                  orient="vertical" // standard Firefox helper
                  className="accent-emerald-500 h-full w-4 appearance-none rounded-lg bg-stone-900 border border-stone-800 cursor-pointer sliding-vertical-range"
                  style={{
                    writingMode: 'bt-lr', // vintage browser fallback
                    WebkitAppearance: 'slider-vertical', // Safari/Webkit vertical specification
                    accentColor: theme.accentHex
                  }}
                />
              </div>

              {/* Freq Channel tag */}
              <span className="font-mono text-[9px] text-stone-500 mt-2 font-bold select-none">
                {formatFreq(EQ_FREQUENCIES[i])}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Corner Resize Grip */}
      <div className="absolute bottom-1.5 right-1.5 pointer-events-none opacity-40 select-none hidden sm:block" style={{ color: theme.accentHex }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 0L0 10M10 4L4 10M10 8L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

    </div>
  );
}

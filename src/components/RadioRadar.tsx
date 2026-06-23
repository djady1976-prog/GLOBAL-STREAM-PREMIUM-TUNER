/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Radio, ShieldAlert, Wifi, Activity, Cpu, Target } from 'lucide-react';
import { RadioStation, ThemeConfig } from '../types';

interface RadioRadarProps {
  stations: RadioStation[];
  selectedStation: RadioStation;
  playbackState: 'stopped' | 'connecting' | 'buffering' | 'playing' | 'error';
  onSelectStation: (station: RadioStation) => void;
  theme: ThemeConfig;
  locale: any;
}

// Deterministic helper to place stations stably on a polar coordinate grid
function getStationPhysicalAttributes(station: RadioStation) {
  let hash = 0;
  const name = station.id ?? station.name;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Radius: 0.25 to 0.85 (percentage of radar boundaries)
  const radius = 0.25 + (Math.abs((hash >> 8) % 100) / 100) * 0.55;
  // Angle: 0 to 360 degrees (in radians)
  const angle = (Math.abs(hash % 360) * Math.PI) / 180;
  // Power: 5kW to 125kW based on index/id hashes
  const power = 5 + Math.abs((hash >> 4) % 13) * 10;
  // Virtual FM frequency: 87.5 to 108.0 MHz
  const frequency = 87.5 + (Math.abs(hash >> 3) % 205) * 0.1;
  
  return { radius, angle, power, frequency };
}

export default function RadioRadar({
  stations,
  selectedStation,
  playbackState,
  onSelectStation,
  theme,
  locale,
}: RadioRadarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Constant 300x300 visual coordinates to prevent layout stretching or ellipse distortion
  const R_WIDTH = 300;
  const R_HEIGHT = 300;
  
  // Local state to display "radar targets under active sweeping cursor"
  const [hoveredStation, setHoveredStation] = useState<(RadioStation & { power: number; frequency: number }) | null>(null);
  const [sweepAngle, setSweepAngle] = useState(0);

  // Dynamic state for real-time tuning carrier deviation physics
  const [fluctuatingOffset, setFluctuatingOffset] = useState(0);
  const [multipathBars, setMultipathBars] = useState<number[]>([1, 1, 1, 1, 1]);

  // Compute positions of active curated or listed stations
  const mappedStations = useMemo(() => {
    // Limit to 45 stations max on radar to avoid excessive screen clutter
    return stations.slice(0, 45).map((station) => {
      const attrs = getStationPhysicalAttributes(station);
      return {
        ...station,
        ...attrs,
      };
    });
  }, [stations]);

  // Live carrier fluctuations simulation when connecting or buffering
  useEffect(() => {
    const timer = setInterval(() => {
      if (playbackState === 'playing') {
        // Locked tightly, very minor analog warmth hover (±0.01 MHz)
        setFluctuatingOffset((Math.random() - 0.5) * 0.01);
        setMultipathBars([
          70 + Math.floor(Math.random() * 20),
          85 + Math.floor(Math.random() * 15),
          90 + Math.floor(Math.random() * 10),
          82 + Math.floor(Math.random() * 12),
          75 + Math.floor(Math.random() * 18),
        ]);
      } else if (playbackState === 'connecting' || playbackState === 'buffering') {
        // Searching... fluctuates aggressively trying to capture phase-lock loop carrier
        setFluctuatingOffset((Math.sin(Date.now() * 0.01) * 0.15) + (Math.random() - 0.5) * 0.05);
        setMultipathBars([
          20 + Math.floor(Math.random() * 30),
          15 + Math.floor(Math.random() * 40),
          30 + Math.floor(Math.random() * 25),
          10 + Math.floor(Math.random() * 45),
          25 + Math.floor(Math.random() * 30),
        ]);
      } else {
        // Off, drifts widely or zero
        setFluctuatingOffset(0);
        setMultipathBars([0, 0, 0, 0, 0]);
      }
    }, 150);

    return () => clearInterval(timer);
  }, [playbackState]);

  // Active target details of selected station
  const activeStationAttributes = useMemo(() => {
    return getStationPhysicalAttributes(selectedStation);
  }, [selectedStation]);

  // CANVAS RADAR RENDERING CONTEXT
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId: number;
    let angle = 0;

    // Keep track of blip fade out physics (phosphor persistence counts)
    const blipPersistence = new Map<string, number>();

    const runRadarSweep = () => {
      frameId = requestAnimationFrame(runRadarSweep);

      const width = R_WIDTH;
      const height = R_HEIGHT;
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const maxRadius = Math.min(centerX, centerY) * 0.88;

      // Update scan-sweeper rotation angle
      angle = (angle + 0.015) % (Math.PI * 2);
      setSweepAngle(angle);

      // --- 1. RADAR GRID BASE (CIRCULAR CONCENTRIC RINGS) ---
      ctx.shadowBlur = 0;
      ctx.strokeStyle = theme.accentHex + '18';
      ctx.lineWidth = 1;

      // Polar grid concentric circles
      for (let r = 0.25; r <= 1.0; r += 0.25) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, maxRadius * r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Drawing cross hairs axis lines
      ctx.strokeStyle = theme.accentHex + '12';
      ctx.beginPath();
      ctx.moveTo(centerX - maxRadius, centerY);
      ctx.lineTo(centerX + maxRadius, centerY);
      ctx.moveTo(centerX, centerY - maxRadius);
      ctx.lineTo(centerX, centerY + maxRadius);
      ctx.stroke();

      // Outer edge scale tick markers
      ctx.strokeStyle = theme.accentHex + '33';
      for (let i = 0; i < 360; i += 30) {
        const rad = (i * Math.PI) / 180;
        const tickStart = maxRadius;
        const tickEnd = maxRadius + 4;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.cos(rad) * tickStart, centerY + Math.sin(rad) * tickStart);
        ctx.lineTo(centerX + Math.cos(rad) * tickEnd, centerY + Math.sin(rad) * tickEnd);
        ctx.stroke();
      }

      // --- 2. THE SWEEPING ANTENNA ARM / BEAM ---
      // Drawing a filled sector representing fade projection (phosphor decay)
      const numFadeSlices = 40;
      const sliceWidth = 0.015;

      for (let s = 0; s < numFadeSlices; s++) {
        const opacity = (1.0 - s / numFadeSlices) * 0.18;
        const sliceAngle = angle - s * sliceWidth;
        ctx.fillStyle = theme.accentHex + Math.floor(opacity * 255).toString(16).padStart(2, '0');
        
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, maxRadius, sliceAngle, sliceAngle + sliceWidth, false);
        ctx.closePath();
        ctx.fill();
      }

      // Main razor blade sweeper front edge line
      ctx.strokeStyle = theme.accentHex + 'bd';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 4;
      ctx.shadowColor = theme.accentHex;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(angle) * maxRadius, centerY + Math.sin(angle) * maxRadius);
      ctx.stroke();

      // Center glowing transceiver tower
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fill();

      // --- 3. STATION TARGET BLIPS ---
      mappedStations.forEach((station) => {
        const stationX = centerX + Math.cos(station.angle) * (station.radius * maxRadius);
        const stationY = centerY + Math.sin(station.angle) * (station.radius * maxRadius);

        const isCurrent = station.id === selectedStation.id;

        // Calculate angular gap between sweeping beam and station target radial
        const radarBearing = station.angle;
        let deltaAngle = angle - radarBearing;
        while (deltaAngle < 0) deltaAngle += Math.PI * 2;
        deltaAngle = deltaAngle % (Math.PI * 2);

        // Sweeper actively hits target (within 9 degrees of sweeper front)
        const sweepHit = deltaAngle <= 0.16;

        let level = blipPersistence.get(station.id) || 0;
        if (sweepHit) {
          level = 1.0; // Charge phosphor instantly to max
        } else {
          level = Math.max(0, level - 0.006); // slowly decay phosphor
        }
        blipPersistence.set(station.id, level);

        // Skip drawing entirely if it's not the selected one and faded to black
        if (level === 0 && !isCurrent) return;

        // Radiate signal circles for actively sintonized target
        if (isCurrent && playbackState === 'playing') {
          const ringRadius = 5 + (Date.now() % 1600) * 0.012;
          const ringOpacity = Math.max(0, 1.0 - (Date.now() % 1600) / 1600);
          ctx.strokeStyle = theme.accentHex + Math.floor(ringOpacity * 140).toString(16).padStart(2, '0');
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(stationX, stationY, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw the target blip circle
        ctx.shadowBlur = isCurrent ? 8 : level * 10;
        ctx.shadowColor = isCurrent ? '#ef4444' : theme.accentHex;
        
        // Render current tuned station as distinctive target in red-alert colorways
        if (isCurrent) {
          ctx.fillStyle = '#ef4444'; // Red Lock
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1;
          ctx.beginPath();
          // Cross hair target
          ctx.arc(stationX, stationY, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Reticle Ring
          ctx.strokeStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(stationX, stationY, 9, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Standard phosphor target blip (glow matches sweep trail)
          const baseOpacity = Math.floor(level * 255).toString(16).padStart(2, '0');
          ctx.fillStyle = theme.accentHex + baseOpacity;
          ctx.beginPath();
          ctx.arc(stationX, stationY, 4, 0, Math.PI * 2);
          ctx.fill();

          // Subtle label showing power or acronym when illuminated
          if (level > 0.45) {
            ctx.fillStyle = '#a1a1aa';
            ctx.font = '7px monospace';
            ctx.shadowBlur = 0;
            ctx.textAlign = 'center';
            ctx.fillText(
              `${station.name.substring(0, 4).toUpperCase()} (${station.power}k)`,
              stationX,
              stationY - 8
            );
          }
        }
      });
    };

    runRadarSweep();
    return () => cancelAnimationFrame(frameId);
  }, [mappedStations, theme, selectedStation.id, playbackState]);

  // Click inside canvas map calculation to select station towers
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Translate screen resolution coordinates to 300x300 canvas backing store coordinates
    const clickX = ((e.clientX - rect.left) / rect.width) * R_WIDTH;
    const clickY = ((e.clientY - rect.top) / rect.height) * R_HEIGHT;

    const centerX = R_WIDTH / 2;
    const centerY = R_HEIGHT / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.88;

    let closestStation: typeof mappedStations[number] | null = null;
    let closestDistance = 16; // Click tolerance boundary 16px

    mappedStations.forEach((station) => {
      const targetX = centerX + Math.cos(station.angle) * (station.radius * maxRadius);
      const targetY = centerY + Math.sin(station.angle) * (station.radius * maxRadius);

      const dx = clickX - targetX;
      const dy = clickY - targetY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestStation = station;
      }
    });

    if (closestStation) {
      onSelectStation(closestStation);
    }
  };

  // Tracking dynamic hover movements over canvas objects
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Translate screen resolution coordinates to 300x300 canvas backing store coordinates
    const mx = ((e.clientX - rect.left) / rect.width) * R_WIDTH;
    const my = ((e.clientY - rect.top) / rect.height) * R_HEIGHT;

    const centerX = R_WIDTH / 2;
    const centerY = R_HEIGHT / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.88;

    let found: typeof mappedStations[number] | null = null;
    mappedStations.forEach((station) => {
      const targetX = centerX + Math.cos(station.angle) * (station.radius * maxRadius);
      const targetY = centerY + Math.sin(station.angle) * (station.radius * maxRadius);

      const distance = Math.sqrt(Math.pow(mx - targetX, 2) + Math.pow(my - targetY, 2));
      if (distance < 12) {
        found = station;
      }
    });

    setHoveredStation(found);
  };

  return (
    <div
      ref={containerRef}
      className="rounded-2xl border bg-black/70 backdrop-blur-md shadow-xl shadow-black/40 p-5 flex flex-col gap-4 select-none relative overflow-auto resize min-h-[240px] min-w-[280px]"
      style={{ borderColor: theme.accentHex + '25' }}
      id="radar-emission-module"
    >
      {/* Module Title Accent */}
      <div className="flex items-center justify-between border-b border-stone-850 pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Target size={15} className="animate-spin text-red-500 shrink-0" style={{ animationDuration: '6s' }} />
          <span className="font-mono text-[10.5px] font-black uppercase text-slate-100 tracking-wider">
            {locale.lang === 'ROMÂNĂ' ? 'RADAR EMISIE COORDONATE' : locale.lang === 'LINGUA' ? 'RILIEVO RADAR POTENZA' : 'EMISSION POWER RADAR'}
          </span>
        </div>
        <span className="font-mono text-[8px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded leading-none shrink-0 font-bold uppercase">
          {playbackState === 'playing' ? 'DOPPLER ENCODING ON' : 'RADAR IDLE'}
        </span>
      </div>

      {/* Main Dual Grid: Radar on left (Canvas), Real-time carrier lock telemetry on right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        
        {/* RADAR RING VIEW (Span L-7) */}
        <div className="md:col-span-7 flex justify-center items-center bg-[#000402] border border-stone-900 rounded-xl p-4 relative h-[240px]">
          <canvas
            ref={canvasRef}
            width={300}
            height={300}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={() => setHoveredStation(null)}
            className="cursor-crosshair block aspect-square max-h-[210px]"
          />

          {/* Floater tracking tooltips */}
          {hoveredStation && (
            <div className="absolute top-2 left-2 z-20 bg-stone-950/95 border border-stone-800 p-2 rounded-lg font-mono text-[9px] pointer-events-none max-w-[150px] shadow-2xl">
              <p className="font-black text-white truncate">{hoveredStation.name}</p>
              <p className="text-stone-400 font-bold uppercase">{hoveredStation.country}</p>
              <p className="text-amber-400 mt-1 font-bold">{hoveredStation.frequency.toFixed(1)} MHz</p>
              <div className="flex justify-between text-[8px] text-stone-500 border-t border-stone-900 pt-1 mt-1">
                <span>POWER:</span>
                <span className="font-bold text-slate-300">{hoveredStation.power} kW</span>
              </div>
            </div>
          )}

          {/* Simple user note floating on top bottom center */}
          <div className="absolute bottom-2 inset-x-0 mx-auto text-center pointer-events-none">
            <span className="text-[7.5px] font-mono text-zinc-600 bg-stone-950 px-2.5 py-1 border border-stone-900 rounded-full font-semibold uppercase tracking-wider">
              {locale.lang === 'ROMÂNĂ' ? 'APĂSAȚI PE BULINE PENTRU ACORD DIRECT' : locale.lang === 'LINGUA' ? 'FHI CLICK SUI BLIP PER SINTONIZZARE' : 'CLICK BLIPS TO TUNE INSTANTLY'}
            </span>
          </div>
        </div>

        {/* TELEMETRY CARRIER ACQUISITION PANEL (Span L-5) */}
        <div className="md:col-span-5 h-[240px] flex flex-col justify-between bg-black/95 border border-stone-900 rounded-xl p-4 font-mono">
          
          {/* Virtual Frequency dial & Carrier stability */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-bold">
              <span className="text-stone-500">CARRIER MATCH</span>
              <span
                style={{
                  color:
                    playbackState === 'playing'
                      ? theme.accentHex
                      : playbackState === 'connecting' || playbackState === 'buffering'
                      ? '#eab308'
                      : '#ef4444',
                }}
                className={`font-black ${playbackState !== 'stopped' ? 'animate-pulse' : ''}`}
              >
                {playbackState === 'playing' ? 'PLL SYNC LOCKED' : playbackState === 'connecting' || playbackState === 'buffering' ? 'HUNTING PHASES...' : 'STANDBY'}
              </span>
            </div>

            {/* Virtual Dial frequency LCD display */}
            <div className="bg-[#020302] border border-stone-900/60 p-3 rounded-lg flex flex-col items-center justify-center relative overflow-hidden" style={{ borderColor: theme.accentHex + '25' }}>
              <div className="absolute top-1 left-2 text-[8px] text-stone-600 font-bold uppercase">Synthesized V-FM</div>
              
              {/* Frequency readout */}
              <div className="text-xl sm:text-2xl font-black text-white hover:scale-105 transition-transform duration-250 mt-1 flex items-baseline gap-1" style={{ textShadow: `0 0 10px ${theme.glowColor}15` }}>
                <span className="font-sans font-extrabold tracking-tight">
                  {(activeStationAttributes.frequency + fluctuatingOffset).toFixed(2)}
                </span>
                <span className="text-[10px] font-mono tracking-wider font-bold text-stone-500">MHz</span>
              </div>

              {/* Precise drift meter deviation */}
              <div className="text-[8px] flex gap-1 justify-center w-full font-bold pt-1.5 border-t border-stone-900 text-stone-500">
                <span>DRIFT:</span>
                <span
                  className="font-mono font-bold"
                  style={{ color: playbackState === 'playing' ? '#10b981' : playbackState !== 'stopped' ? '#eab308' : '#ef4444' }}
                >
                  {playbackState === 'playing'
                    ? `${(fluctuatingOffset * 1000).toFixed(1)} kHz`
                    : playbackState !== 'stopped'
                    ? 'WAITING SYNC...'
                    : '---'}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time carrier deviation visual graphic meter */}
          <div className="space-y-1.5">
            <span className="text-[8px] text-zinc-500 font-black tracking-widest uppercase block">
              {locale.lang === 'ROMÂNĂ' ? 'DEVIAȚIE SEMNAL RF GRAFIC' : 'REAL-TIME CARRIER DEVIATION'}
            </span>
            <div className="h-6 bg-black border border-stone-950 p-1 rounded-sm flex items-center justify-between relative overflow-hidden">
              {/* Central lock point target line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-red-500/20 z-10" />

              {/* Floating tuning needle represent alignment deviation */}
              {playbackState !== 'stopped' ? (
                <div
                  className="absolute top-0 bottom-0 w-1 bg-yellow-450 z-20 transition-all duration-100"
                  style={{
                    backgroundColor: playbackState === 'playing' ? theme.accentHex : '#eab308',
                    left: `${50 + (fluctuatingOffset * (playbackState === 'playing' ? 200 : 25))} %`,
                    boxShadow: `0 0 8px ${theme.accentHex}`,
                  }}
                />
              ) : (
                <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-zinc-700 z-10" />
              )}

              {/* Dynamic grid ticks */}
              <div className="w-full flex justify-between px-1 text-[7px] text-[#27272a] select-none">
                <span>◀ L-OFF</span>
                <span>• LOCK •</span>
                <span>R-OFF ▶</span>
              </div>
            </div>
          </div>

          {/* Decibel power and multipath RDS quality bars */}
          <div className="space-y-2">
            <div className="flex justify-between text-[8px] font-black tracking-wider uppercase text-zinc-500">
              <span>MULTIPATH DECAY LEVEL</span>
              <span className="text-slate-350">{activeStationAttributes.power} kW EMISSION</span>
            </div>

            <div className="flex gap-1.5 items-end justify-between h-10 px-1 bg-zinc-950/20 rounded-md">
              {multipathBars.map((barVal, index) => (
                <div key={index} className="flex-1 flex flex-col justify-end h-full">
                  <div
                    className="w-full rounded-xs transition-all duration-150"
                    style={{
                      height: `${Math.max(2, barVal)}%`,
                      backgroundColor:
                        playbackState === 'playing'
                          ? theme.accentHex
                          : playbackState !== 'stopped'
                          ? '#eab308'
                          : '#27272a',
                      opacity: 0.15 + (index / 5) * 0.85,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Quick specs read in lower footer layout */}
          <div className="text-[7.5px] text-zinc-600 font-bold border-t border-stone-900 pt-2 flex items-center justify-between gap-1.5 leading-none">
            <div className="flex items-center gap-1">
              <Cpu size={10} style={{ color: theme.accentHex }} />
              <span>DECIMATOR DSP V9</span>
            </div>
            <span>STACION DE CARGA: ACTIVE</span>
          </div>

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

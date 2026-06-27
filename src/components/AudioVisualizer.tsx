/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { Activity, BarChart2, Waves, Sliders, Disc } from 'lucide-react';
import { ThemeConfig } from '../types';

export type VisualizerMode = 'bars' | 'led' | 'oscilloscope' | 'circle';

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
  theme: ThemeConfig;
  isSimulated: boolean;
  isPlaying: boolean;
  audioVolume: number;
  mode: VisualizerMode;
  onChangeMode: (mode: VisualizerMode) => void;
}

export default function AudioVisualizer({
  analyserNode,
  theme,
  isSimulated,
  isPlaying,
  audioVolume,
  mode,
  onChangeMode,
}: AudioVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const smoothDataArrayRef = useRef<Float32Array | null>(null);
  const [dimensions, setDimensions] = useState({ width: 450, height: 160 });

  // Update canvas sizing dynamically using ResizeObserver as instructed in standard specifications
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        // Keep a minimum ratio or hard size to look neat
        setDimensions({
          width: Math.max(280, width),
          height: Math.max(100, height === 0 ? 160 : height),
        });
      }
    });

    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    // Persist smooth data array over animation frames
    if (!smoothDataArrayRef.current || smoothDataArrayRef.current.length !== bufferLength) {
      smoothDataArrayRef.current = new Float32Array(bufferLength);
    }
    const smoothDataArray = smoothDataArrayRef.current;

    // Peak arrays for Continuous Bars mode - lingering peak peaks for precisely 1 second
    const peakValues = new Float32Array(bufferLength);
    const peakHoldTimes = new Float32Array(bufferLength);

    // Peak arrays for LED Matrix mode - col-wise indices, held for 1 second
    const ledNumCols = 30;
    const ledPeakValues = new Float32Array(ledNumCols);
    const ledPeakHoldTimes = new Float32Array(ledNumCols);

    // Frame-by-frame draw logic
    const draw = () => {
      animationId = requestAnimationFrame(draw);

      const { width, height } = dimensions;
      ctx.clearRect(0, 0, width, height);

      // Web Audio actual data fetch vs Procedural Beat simulation fallback
      if (analyserNode && !isSimulated && isPlaying) {
        if (mode === 'oscilloscope') {
          analyserNode.getByteTimeDomainData(dataArray);
        } else {
          analyserNode.getByteFrequencyData(dataArray);
        }
      } else if (isPlaying) {
        // Procedural simulation to guarantee visual response on CORS-blocked streams or standalone actions
        const now = Date.now() * 0.002;
        const volumeScaling = Math.max(0.2, audioVolume);
        
        for (let i = 0; i < bufferLength; i++) {
          if (mode === 'oscilloscope') {
            // Oscilloscope sine waves combination
            const val = 128 + Math.sin(i * 0.15 + now * 4) * 35 * volumeScaling * Math.sin(now * 0.5 + i * 0.02)
                            + Math.cos(i * 0.05 - now * 2) * 15 * volumeScaling;
            dataArray[i] = Math.max(0, Math.min(255, val));
          } else {
            // Spectrum bars simulation: low, mid, high frequencies
            let baseFrequencyGlow = 0;
            if (i < bufferLength * 0.15) {
              // Bass frequencies
              baseFrequencyGlow = Math.sin(now * 5.2 + (i % 3)) * 60 + 130 + Math.sin(now * 0.6) * 40;
            } else if (i < bufferLength * 0.6) {
              // Mid frequencies
              baseFrequencyGlow = Math.cos(now * 2.8 + i * 0.1) * 50 + 90 + Math.sin(now * 8.0) * 20;
            } else {
              // High frequencies
              baseFrequencyGlow = Math.sin(now * 9.5 + i * 0.5) * 30 + 40 + Math.cos(now * 1.2) * 15;
            }

            // Attenuate higher frequencies as in standard sounds
            const rollOff = 1 - (i / bufferLength) * 0.65;
            const absoluteVal = Math.max(10, baseFrequencyGlow * rollOff * volumeScaling);
            dataArray[i] = Math.min(255, absoluteVal);
          }
        }
      } else {
        // Flat/Off state with static subtle noise or idle zero flat lines
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = mode === 'oscilloscope' ? 128 : 2;
        }
      }

      // Dampen rapid transitions with custom temporal smoothing factor (0.83 smooth filter)
      for (let i = 0; i < bufferLength; i++) {
        const val = dataArray[i];
        if (mode === 'oscilloscope') {
          smoothDataArray[i] = val; // No lag on time-domain waves
        } else {
          smoothDataArray[i] = smoothDataArray[i] * 0.83 + val * 0.17;
        }
      }

      // ----------------------------------------------------
      // DRAW MODE: SOLID CONTINUOUS SPECTRUM BARS
      // ----------------------------------------------------
      if (mode === 'bars') {
        const barWidth = (width / bufferLength) * 1.4;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          // Attenuate visual range slightly for presentation
          const percent = smoothDataArray[i] / 255;
          barHeight = percent * height * 0.92;

          // Peak holding computations (stay 1 second = 1000ms before falling)
          if (barHeight >= peakValues[i]) {
            peakValues[i] = barHeight;
            peakHoldTimes[i] = Date.now() + 1000;
          } else {
            if (Date.now() > peakHoldTimes[i]) {
              // Fall down smoothly
              peakValues[i] -= height * 0.007;
              if (peakValues[i] < 0) peakValues[i] = 0;
            }
          }

          // Build gradient for active spectrum columns
          const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
          gradient.addColorStop(0, theme.accentHex + '22');
          gradient.addColorStop(0.5, theme.accentHex + '88');
          gradient.addColorStop(1, theme.accentHex);

          ctx.fillStyle = gradient;
          ctx.shadowBlur = 4;
          ctx.shadowColor = theme.accentHex;

          ctx.fillRect(x, height - barHeight - 2, barWidth - 1, barHeight + 2);

          // Render lingering peak caps
          if (peakValues[i] > 0) {
            ctx.fillStyle = '#ffffff'; // beautiful white peak cap
            ctx.shadowBlur = 5;
            ctx.shadowColor = theme.accentHex;
            ctx.fillRect(x, height - peakValues[i] - 4, barWidth - 1, 2);
          }

          x += barWidth;
        }
      }
      
      // ----------------------------------------------------
      // DRAW MODE: VINTAGE HI-FI GRID LED BLOCKS
      // ----------------------------------------------------
      else if (mode === 'led') {
        const numCols = 30;
        const numRows = 14;
        const cellGap = 2;
        const cellWidth = (width - (numCols - 1) * cellGap) / numCols;
        const cellHeight = (height - (numRows - 1) * cellGap) / numRows;

        // Group spectral ranges into 30 buckets
        const bucketSize = Math.max(1, Math.floor(bufferLength / numCols));

        for (let col = 0; col < numCols; col++) {
          // Find maximum value in this frequency bucket
          let sumValue = 0;
          for (let b = 0; b < bucketSize; b++) {
            const index = col * bucketSize + b;
            if (index < bufferLength) {
              sumValue += smoothDataArray[index];
            }
          }
          const val = sumValue / bucketSize;

          // How many LED blocks should light up for this column?
          const activeBlocks = Math.round((val / 255) * numRows);

          // Peak holding computations for LED Matrix (1 second hold)
          if (activeBlocks >= ledPeakValues[col]) {
            ledPeakValues[col] = activeBlocks;
            ledPeakHoldTimes[col] = Date.now() + 1000;
          } else {
            if (Date.now() > ledPeakHoldTimes[col]) {
              ledPeakValues[col] -= 0.15; // drop smoothly down row indices
              if (ledPeakValues[col] < 0) ledPeakValues[col] = 0;
            }
          }

          const currentPeakBlock = Math.round(ledPeakValues[col]);

          for (let row = 0; row < numRows; row++) {
            const isLit = row < activeBlocks;
            const isPeak = row === (currentPeakBlock - 1) && currentPeakBlock > 0;
            const gridX = col * (cellWidth + cellGap);
            // Draw bottom-up
            const gridY = height - (row + 1) * (cellHeight + cellGap);

            if (isLit) {
              // Color coding depending on height segment (Green-Yellow-Red of classic VU meters)
              const ratio = row / numRows;
              let BlockFillColor = theme.accentHex;
              
              if (ratio > 0.85) {
                BlockFillColor = '#f43f5e'; // Red alerts
              } else if (ratio > 0.65) {
                BlockFillColor = '#eab308'; // Orange Warns
              }

              ctx.fillStyle = BlockFillColor;
              ctx.shadowBlur = 3;
              ctx.shadowColor = BlockFillColor;
              ctx.fillRect(gridX, gridY, cellWidth, cellHeight);
            } else if (isPeak) {
              // Draw peak block
              const ratio = row / numRows;
              let PeakColor = '#ffffff'; // White high-fidelity peak segment
              if (ratio > 0.85) {
                PeakColor = '#f43f5e';
              } else if (ratio > 0.65) {
                PeakColor = '#eab308';
              } else {
                PeakColor = theme.accentHex;
              }

              ctx.fillStyle = PeakColor;
              ctx.shadowBlur = 8;
              ctx.shadowColor = PeakColor;
              ctx.fillRect(gridX, gridY, cellWidth, cellHeight);
            } else {
              // Dim background grids representing unlit crystals - clear styling with dark accents
              ctx.fillStyle = '#111315';
              ctx.shadowBlur = 0;
              ctx.shadowColor = 'transparent';
              ctx.fillRect(gridX, gridY, cellWidth, cellHeight);
              
              // Draw small inner outline
              ctx.strokeStyle = 'rgba(63, 63, 70, 0.1)';
              ctx.strokeRect(gridX + 0.5, gridY + 0.5, cellWidth - 1, cellHeight - 1);
            }
          }
        }
      }

      // ----------------------------------------------------
      // DRAW MODE: OSCILLOSCOPE (ANALOG SINE WAVEFORM)
      // ----------------------------------------------------
      else if (mode === 'oscilloscope') {
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = theme.accentHex;
        ctx.shadowBlur = 10;
        ctx.shadowColor = theme.accentHex;

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();

        // Draw horizontal raster line on grid background
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = theme.accentHex + '15';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }
      
      // ----------------------------------------------------
      // DRAW MODE: CIRCLE SOUNDSTAGE (NEON RADIAL ORB)
      // ----------------------------------------------------
      else if (mode === 'circle') {
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.22;

        // Calculate responsive pulse based on bass energy
        let bassSum = 0;
        const bassLimit = Math.max(1, Math.floor(bufferLength * 0.15));
        for (let i = 0; i < bassLimit; i++) {
          bassSum += smoothDataArray[i];
        }
        const avgBass = (bassSum / bassLimit) / 255;
        const pulseRadius = baseRadius + avgBass * 18;

        // Draw ambient background circular glow
        const glowGrad = ctx.createRadialGradient(centerX, centerY, pulseRadius * 0.5, centerX, centerY, pulseRadius * 2);
        glowGrad.addColorStop(0, theme.accentHex + '11');
        glowGrad.addColorStop(0.5, theme.accentHex + '05');
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius * 2, 0, Math.PI * 2);
        ctx.fill();

        // Draw central core circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        ctx.strokeStyle = theme.accentHex + '44';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 12;
        ctx.shadowColor = theme.accentHex;
        ctx.stroke();

        // Radiating spokes/bars around circle perimeter
        const numSpokes = 72; // high density elegant spokes
        const angleStep = (Math.PI * 2) / numSpokes;

        for (let i = 0; i < numSpokes; i++) {
          // Map spoke index to frequency buffer index
          const dataIdx = Math.floor((i / numSpokes) * (bufferLength * 0.8)); // avoid highest empty bins
          const percent = smoothDataArray[dataIdx] / 255;
          const spokeLength = Math.max(4, percent * Math.min(width, height) * 0.45);

          const angle = i * angleStep;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);

          const startX = centerX + cos * pulseRadius;
          const startY = centerY + sin * pulseRadius;

          const endX = centerX + cos * (pulseRadius + spokeLength);
          const endY = centerY + sin * (pulseRadius + spokeLength);

          // Build elegant gradient for radiating spoke
          const spokeGrad = ctx.createLinearGradient(startX, startY, endX, endY);
          spokeGrad.addColorStop(0, theme.accentHex);
          spokeGrad.addColorStop(0.7, theme.accentHex + '99');
          spokeGrad.addColorStop(1, '#ffffff');

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);

          ctx.strokeStyle = spokeGrad;
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.shadowBlur = 6;
          ctx.shadowColor = theme.accentHex;
          ctx.stroke();

          // Optional: Add tiny high-fidelity white dots at the tip of very loud spokes
          if (percent > 0.6) {
            ctx.fillStyle = '#ffffff';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ffffff';
            ctx.beginPath();
            ctx.arc(endX, endY, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Draw inner circular dial ring (dash pattern)
        ctx.shadowBlur = 0;
        ctx.lineWidth = 1;
        ctx.strokeStyle = theme.accentHex + '25';
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius - 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]); // restore continuous

        // Draw center solid micro-ring
        ctx.fillStyle = theme.accentHex + '1a';
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius - 18, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // Trigger loop execution
    draw();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyserNode, dimensions, mode, theme, isSimulated, isPlaying, audioVolume]);

  return (
    <div className="w-full flex flex-col bg-black/70 backdrop-blur-md rounded-2xl border p-5 shadow-xl shadow-black/40 relative select-none overflow-auto resize min-h-[220px] min-w-[280px]"
         style={{ borderColor: theme.accentHex + '25' }} id="spectrum-panel">
      
      {/* Header Panel with Stats / Selector Controls */}
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-800/60">
        <div className="flex items-center gap-2">
          <Activity size={16} className="animate-pulse" style={{ color: theme.accentHex }} />
          <span className="font-mono text-xs font-bold uppercase tracking-wider" style={{ color: theme.accentHex }}>
            {mode === 'led' ? 'LED BAR MATRIX' : mode === 'bars' ? 'SPECTRUM FFT' : mode === 'oscilloscope' ? 'ANALOG WAVEFORM' : 'CIRCULAR COIL'}
          </span>
          {isSimulated && isPlaying && (
            <span className="text-[10px] font-mono border border-yellow-500/30 text-yellow-500/80 px-1.5 py-0.5 rounded animate-pulse">
              SIMULATOR LINK
            </span>
          )}
          {!isSimulated && isPlaying && (
            <span className="text-[10px] font-mono border border-emerald-500/30 text-emerald-400 px-1.5 py-0.5 rounded uppercase tracking-widest text-[9px]">
              DIRECT LINE LOCK
            </span>
          )}
        </div>

        {/* Visualizer Mode selector buttons */}
        <div className="flex gap-1" id="visualizer-selectors">
          <button
            onClick={() => onChangeMode('led')}
            title="LED Matrix Mode"
            className={`p-1.5 rounded cursor-pointer transition-all duration-200 ${
              mode === 'led' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:text-stone-300'
            }`}
            style={{ color: mode === 'led' ? theme.accentHex : '' }}
          >
            <Sliders size={14} />
          </button>
          <button
            onClick={() => onChangeMode('bars')}
            title="Continuous FFT Bars Mode"
            className={`p-1.5 rounded cursor-pointer transition-all duration-200 ${
              mode === 'bars' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:text-stone-300'
            }`}
            style={{ color: mode === 'bars' ? theme.accentHex : '' }}
          >
            <BarChart2 size={14} />
          </button>
          <button
            onClick={() => onChangeMode('oscilloscope')}
            title="Oscilloscope Mode"
            className={`p-1.5 rounded cursor-pointer transition-all duration-200 ${
              mode === 'oscilloscope' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:text-stone-300'
            }`}
            style={{ color: mode === 'oscilloscope' ? theme.accentHex : '' }}
          >
            <Waves size={14} />
          </button>
          <button
            onClick={() => onChangeMode('circle')}
            title="Circular Soundstage Mode"
            className={`p-1.5 rounded cursor-pointer transition-all duration-200 ${
              mode === 'circle' ? 'bg-stone-800 text-white' : 'text-stone-500 hover:text-stone-300'
            }`}
            style={{ color: mode === 'circle' ? theme.accentHex : '' }}
          >
            <Disc size={14} />
          </button>
        </div>
      </div>

      {/* Grid Canvas Container */}
      <div ref={containerRef} className="w-full h-80 sm:h-[340px] border border-stone-800/40 rounded bg-[#010302] overflow-hidden relative">
        {/* Retro scanline background filter overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[size:100%_4px,_6px_100%]" />
        
        {/* Subtle grid marking lines */}
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 pointer-events-none opacity-5">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="border-r border-b border-white" />
          ))}
        </div>

        <canvas
          ref={canvasRef}
          width={dimensions.width}
          height={dimensions.height}
          className="absolute inset-0 block w-full h-full"
        />
      </div>

      {/* Frequency Bands Legend Axis */}
      <div className="flex justify-between items-center px-2 pt-2.5 text-[9px] font-mono font-bold text-stone-500 tracking-tight select-none border-t border-stone-900/40 mt-1" id="axis-frequency-bars">
        <span className="flex flex-col items-center">
          <span className="w-0.5 h-1 bg-stone-800 mb-0.5" />
          <span>30Hz</span>
        </span>
        <span className="hidden sm:flex flex-col items-center">
          <span className="w-0.5 h-1 bg-stone-800 mb-0.5" />
          <span>80Hz</span>
        </span>
        <span className="flex flex-col items-center">
          <span className="w-0.5 h-1 bg-stone-800 mb-0.5" />
          <span>150Hz</span>
        </span>
        <span className="hidden sm:flex flex-col items-center">
          <span className="w-0.5 h-1 bg-stone-800 mb-0.5" />
          <span>350Hz</span>
        </span>
        <span className="flex flex-col items-center">
          <span className="w-0.5 h-1 bg-stone-800 mb-0.5" />
          <span>1KHz</span>
        </span>
        <span className="hidden sm:flex flex-col items-center">
          <span className="w-0.5 h-1 bg-stone-800 mb-0.5" />
          <span>2.5KHz</span>
        </span>
        <span className="flex flex-col items-center">
          <span className="w-0.5 h-1 bg-stone-800 mb-0.5" />
          <span>6KHz</span>
        </span>
        <span className="hidden sm:flex flex-col items-center">
          <span className="w-0.5 h-1 bg-stone-800 mb-0.5" />
          <span>10KHz</span>
        </span>
        <span className="flex flex-col items-center">
          <span className="w-0.5 h-1 bg-stone-800 mb-0.5" />
          <span>16KHz</span>
        </span>
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

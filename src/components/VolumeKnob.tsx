/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { ThemeConfig } from '../types';

interface VolumeKnobProps {
  volume: number; // 0 to 1
  onChange: (newVol: number) => void;
  theme: ThemeConfig;
  label: string;
}

export default function VolumeKnob({ volume, onChange, theme, label }: VolumeKnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.8);

  const percentage = Math.round(volume * 100);

  // Convert volume (0-1) to angle.
  // We want a sweet spot of 270 degrees total rotation.
  // Angle goes from -135deg (min volume) to +135deg (max volume)
  const minAngle = -135;
  const maxAngle = 135;
  const angle = minAngle + volume * (maxAngle - minAngle);

  const handleMuteToggle = () => {
    if (isMuted) {
      onChange(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume > 0 ? volume : 0.8);
      onChange(0);
      setIsMuted(true);
    }
  };

  const calculateVolumeFromEvent = (clientX: number, clientY: number) => {
    if (!knobRef.current) return;
    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate angle in radians from center to mouse position
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    let rad = Math.atan2(dy, dx); // range [-PI, PI]

    // Convert rad range into degrees, offset to align with our physical knob
    // Atan2 gives 0 when mouse is to the right, PI/2 when mouse is down, -PI/2 when up, etc.
    // Let's offset so that -Y (up) is 0, +X is 90, +Y is 180, -X is 270.
    let deg = (rad * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;

    // Map 0-360deg to our 270deg range.
    // Our active span is from 225deg (min, pointing bottom-left) to 135deg (max, pointing bottom-right)
    // Let's normalize around -135 (which is 225) to +135 (which is 135)
    let relativeDeg = deg - 180; // center facing directly up is 0deg, bottom is 180deg
    if (relativeDeg < -180) relativeDeg += 360;
    if (relativeDeg > 180) relativeDeg -= 360;

    // Constrain to our physical rotation limit
    let clampedDeg = Math.max(minAngle, Math.min(maxAngle, relativeDeg));

    // Convert to 0-1 volume scale
    const rawValue = (clampedDeg - minAngle) / (maxAngle - minAngle);
    // Keep it in [0, 1]
    const clampedValue = Math.max(0, Math.min(1, rawValue));
    
    onChange(clampedValue);
    if (clampedValue > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    calculateVolumeFromEvent(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    if (e.touches[0]) {
      calculateVolumeFromEvent(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      calculateVolumeFromEvent(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      if (e.touches[0]) {
        calculateVolumeFromEvent(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  // Support scroll wheel interaction
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    const nextVol = Math.max(0, Math.min(1, volume + delta));
    onChange(nextVol);
    if (nextVol > 0 && isMuted) setIsMuted(false);
  };

  // Generate ticks around the knob
  const numTicks = 15;
  const ticks = Array.from({ length: numTicks }).map((_, i) => {
    const tickAngle = minAngle + (i / (numTicks - 1)) * (maxAngle - minAngle);
    const active = tickAngle <= angle && volume > 0 && !isMuted;
    return (
      <div
        key={i}
        className="absolute w-0.5 h-2 rounded-full transition-colors duration-200"
        style={{
          transform: `rotate(${tickAngle}deg) translateY(-46px)`,
          left: 'calc(50% - 1px)',
          top: 'calc(50% - 1px)',
          backgroundColor: active ? theme.accentHex : '#374151',
          boxShadow: active ? `0 0 4px ${theme.glowColor}` : 'none',
        }}
      />
    );
  });

  return (
    <div className="flex flex-col items-center justify-center p-5 rounded-2xl border select-none transition-colors duration-300 bg-black/70 backdrop-blur-md shadow-xl shadow-black/40 h-full w-full"
         style={{ borderColor: theme.accentHex + '25' }}>
      <span className="font-mono text-xxs tracking-widest text-slate-500 mb-6 uppercase text-center block" id="volume-label">
        {label}
      </span>

      <div className="relative w-28 h-28 flex items-center justify-center">
        {/* Ticks ring */}
        {ticks}

        {/* Outer bevel ring */}
        <div
          ref={knobRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onWheel={handleWheel}
          className={`relative w-20 h-20 rounded-full bg-linear-to-b from-stone-800 to-stone-950 flex items-center justify-center cursor-pointer shadow-xl border border-stone-700/60 transition-transform duration-100 ${
            isDragging ? 'scale-102' : ''
          }`}
          style={{
            boxShadow: isDragging ? `0 0 15px ${theme.glowColor}40, inset 0 2px 4px rgba(255,255,255,0.1)` : 'inset 0 2px 4px rgba(255,255,255,0.05)'
          }}
        >
          {/* Lathed aluminium concentric texture circle */}
          <div className="w-16 h-16 rounded-full bg-stone-900 border border-stone-800/80 flex items-center justify-center relative shadow-inner">
            {/* Real metal gleam simulation */}
            <div className="absolute inset-0 rounded-full bg-radial from-transparent to-black/40" />

            {/* Pointer notch */}
            <div
              className="absolute w-1 h-6 rounded-full top-1 left-1/2 -ml-0.5 origin-[center_100%] transition-transform duration-75"
              style={{
                transform: `rotate(${angle}deg) translateY(0px)`,
                backgroundColor: isMuted || volume === 0 ? '#6b7280' : theme.accentHex,
                boxShadow: isMuted || volume === 0 ? 'none' : `0 0 6px ${theme.glowColor}`
              }}
            />

            {/* Center digital readout */}
            <div className="w-8 h-8 rounded-full bg-stone-950 border border-stone-800 flex items-center justify-center z-10">
              <span className="font-mono text-xxs font-bold" style={{ color: isMuted || volume === 0 ? '#4b5563' : theme.accentHex }}>
                {isMuted ? 'M' : percentage}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick control button block */}
      <button
        onClick={handleMuteToggle}
        id="btn-mute"
        className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-xs border cursor-pointer hover:bg-stone-900 transition-all duration-200"
        style={{
          borderColor: isMuted || volume === 0 ? '#ef444455' : theme.accentHex + '44',
          color: isMuted || volume === 0 ? '#f87171' : theme.accentHex
        }}
      >
        {isMuted || volume === 0 ? (
          <>
            <VolumeX size={14} className="animate-pulse" />
            <span className="text-xxs">MUTED</span>
          </>
        ) : (
          <>
            <Volume2 size={14} />
            <span className="text-xxs">STEREO</span>
          </>
        )}
      </button>
    </div>
  );
}

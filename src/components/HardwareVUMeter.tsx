/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { ThemeConfig } from '../types';

interface HardwareVUMeterProps {
  analyserNode: AnalyserNode | null;
  theme: ThemeConfig;
  isSimulated: boolean;
  isPlaying: boolean;
  audioVolume: number;
}

export default function HardwareVUMeter({
  analyserNode,
  theme,
  isSimulated,
  isPlaying,
  audioVolume,
}: HardwareVUMeterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sizing dimensions state
  const [dimensions, setDimensions] = useState({ width: 320, height: 90 });

  // Physics states for needles (Left & Right)
  const leftPosRef = useRef(0);
  const leftVelRef = useRef(0);
  const rightPosRef = useRef(0);
  const rightVelRef = useRef(0);

  // Lingering peak levels for peak LEDs (0..1)
  const leftPeakRef = useRef(0);
  const rightPeakRef = useRef(0);
  const leftPeakTimeRef = useRef(0);
  const rightPeakTimeRef = useRef(0);

  // Resize handling
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setDimensions({
          width: Math.max(260, width),
          height: 95,
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
    let lastTime = performance.now();

    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const draw = (nowTime: number) => {
      animationId = requestAnimationFrame(draw);

      // Compute delta-time for physics updates (cap at 100ms)
      const dt = Math.min(0.1, (nowTime - lastTime) / 1000);
      lastTime = nowTime;

      const { width, height } = dimensions;
      
      // Handle high DPI displays
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Fetch dynamic audio parameters
      let targetL = 0;
      let targetR = 0;

      // Detect if there's real Web Audio activity (avoid flat lines if CORS blocking outputs silent noise)
      let hasRealSignal = false;

      if (analyserNode && !isSimulated && isPlaying) {
        analyserNode.getByteTimeDomainData(dataArray);
        
        // Find maximum peak levels in Left (first half) and Right (second half) parts of buffer
        let maxDevL = 0;
        let maxDevR = 0;
        const half = Math.floor(bufferLength / 2);

        for (let i = 0; i < bufferLength; i++) {
          const val = dataArray[i];
          if (val !== 128 && val !== 0) {
            hasRealSignal = true;
          }
          const dev = Math.abs(val - 128);
          if (i < half) {
            if (dev > maxDevL) maxDevL = dev;
          } else {
            if (dev > maxDevR) maxDevR = dev;
          }
        }

        if (hasRealSignal) {
          // Normalize (deviation of 128 means full amplitude peak 1.0)
          // Add a preamp gain of 1.4 to make visual needle bounce lively on normal streams
          targetL = Math.min(1.15, (maxDevL / 128) * 1.4);
          targetR = Math.min(1.15, (maxDevR / 128) * 1.4);
        }
      }

      // Procedural fallback if simulation requested, no signal, or stream is paused
      if (!hasRealSignal || isSimulated || !isPlaying) {
        if (isPlaying) {
          const t = nowTime * 0.003;
          const vol = Math.max(0.1, audioVolume);
          
          // Generate bouncy organic envelope simulating stereophonic peaks
          const noiseL = Math.sin(t * 3.4) * 0.22 + Math.cos(t * 7.1) * 0.12 + Math.sin(t * 11.8) * 0.05;
          const noiseR = Math.sin(t * 3.1 + 0.6) * 0.22 + Math.cos(t * 7.9) * 0.12 + Math.cos(t * 10.5) * 0.05;
          
          const basePeakL = 0.45 + noiseL;
          const basePeakR = 0.45 + noiseR;

          // Multiply volume scaling
          targetL = Math.min(1.15, Math.max(0.02, basePeakL * vol * (0.85 + Math.random() * 0.15)));
          targetR = Math.min(1.15, Math.max(0.02, basePeakR * vol * (0.85 + Math.random() * 0.15)));
        } else {
          // Return to rest position slowly
          targetL = 0;
          targetR = 0;
        }
      }

      // Physical spring-loaded movement dynamics for organic heavy vintage meters
      const springK = 220.0; // Spring tightness (attack and tracking stiffness)
      const damping = 11.5;  // Dampening coefficient to achieve slightly lazy, oil-damped mechanical swing
      const mass = 1.0;

      // LEFT Needle Physics
      const forceL = springK * (targetL - leftPosRef.current) - damping * leftVelRef.current;
      const accL = forceL / mass;
      leftVelRef.current += accL * dt;
      leftPosRef.current += leftVelRef.current * dt;

      // Bounce left off the mechanical stop pins
      if (leftPosRef.current < 0) {
        leftPosRef.current = 0;
        leftVelRef.current = 0;
      }
      if (leftPosRef.current > 1.18) {
        leftPosRef.current = 1.18;
        leftVelRef.current = -leftVelRef.current * 0.25; // bouncy collision!
      }

      // RIGHT Needle Physics
      const forceR = springK * (targetR - rightPosRef.current) - damping * rightVelRef.current;
      const accR = forceR / mass;
      rightVelRef.current += accR * dt;
      rightPosRef.current += rightVelRef.current * dt;

      // Bounce right off the mechanical stop pins
      if (rightPosRef.current < 0) {
        rightPosRef.current = 0;
        rightVelRef.current = 0;
      }
      if (rightPosRef.current > 1.18) {
        rightPosRef.current = 1.18;
        rightVelRef.current = -rightVelRef.current * 0.25; // bouncy collision!
      }

      // Peak Hold LEDs tracking
      if (leftPosRef.current >= leftPeakRef.current) {
        leftPeakRef.current = leftPosRef.current;
        leftPeakTimeRef.current = nowTime;
      } else if (nowTime - leftPeakTimeRef.current > 650) {
        // Slow bleed-off
        leftPeakRef.current = leftPeakRef.current * 0.9 + leftPosRef.current * 0.1;
      }

      if (rightPosRef.current >= rightPeakRef.current) {
        rightPeakRef.current = rightPosRef.current;
        rightPeakTimeRef.current = nowTime;
      } else if (nowTime - rightPeakTimeRef.current > 650) {
        // Slow bleed-off
        rightPeakRef.current = rightPeakRef.current * 0.9 + rightPosRef.current * 0.1;
      }

      // --- DRAW CANVAS ARTWORK ---
      ctx.clearRect(0, 0, width, height);

      // Total width is divided between two dial cards side-by-side
      const dialWidth = (width - 15) / 2;
      const dialHeight = height - 6;

      const accentColor = theme.accentHex;
      const glowColor = theme.glowColor;

      const drawSingleVU = (xStart: number, currentPos: number, peakVal: number, label: string) => {
        // 1. Panel Background base card shape
        ctx.fillStyle = '#050406';
        ctx.strokeStyle = '#18171d';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(xStart, 3, dialWidth, dialHeight, 8);
        ctx.fill();
        ctx.stroke();

        // 2. Overlay a subtle soft warm display backlight/graining
        const textCenterY = dialHeight - 5;
        const pivotX = xStart + dialWidth / 2;
        const pivotY = dialHeight + 35; // Center of needle rotation arc
        const arcRadius = dialHeight * 1.05; // Extend needle radius

        // Accent backlight gradient (vintage look, color matched to active theme!)
        const glowRad = ctx.createRadialGradient(pivotX, pivotY - 20, 10, pivotX, pivotY - 20, arcRadius * 1.1);
        glowRad.addColorStop(0, accentColor + '20'); // center glow
        glowRad.addColorStop(0.6, accentColor + '08'); // soft edge
        glowRad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowRad;
        ctx.beginPath();
        ctx.arc(pivotX, pivotY, arcRadius + 10, Math.PI * 1.25, Math.PI * 1.75);
        ctx.lineTo(pivotX, pivotY);
        ctx.closePath();
        ctx.fill();

        // 3. Draw Arc markings of the dB dial scales
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#27262d';
        ctx.beginPath();
        ctx.arc(pivotX, pivotY, arcRadius, Math.PI * 1.30, Math.PI * 1.70);
        ctx.stroke();

        // Draw smaller secondary arc below for tick offsets
        ctx.strokeStyle = '#1d1c22';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(pivotX, pivotY, arcRadius - 8, Math.PI * 1.30, Math.PI * 1.70);
        ctx.stroke();

        // 4. Tickmarks and text annotations
        // Map normalized peak value (0..1.15) to radial angular range (1.30PI to 1.70PI)
        const getAngle = (val: number) => {
          // 0.0 -> Math.PI * 1.31
          // 1.00 (0dB) -> Math.PI * 1.62
          // 1.18 (+3dB overflow) -> Math.PI * 1.69
          const startAngle = Math.PI * 1.315;
          const range = Math.PI * 0.36;
          return startAngle + val * range;
        };

        const drawTick = (val: number, isStrong: boolean, isRed: boolean, labelStr?: string) => {
          const angle = getAngle(val);
          const outerR = arcRadius;
          const innerR = arcRadius - (isStrong ? 7 : 4);

          const cos = Math.cos(angle);
          const sin = Math.sin(angle);

          ctx.strokeStyle = isRed ? '#ef4444' : '#575560';
          ctx.lineWidth = isStrong ? 1.5 : 0.8;
          ctx.beginPath();
          ctx.moveTo(pivotX + cos * innerR, pivotY + sin * innerR);
          ctx.lineTo(pivotX + cos * outerR, pivotY + sin * outerR);
          ctx.stroke();

          // Text values
          if (labelStr !== undefined) {
            ctx.fillStyle = isRed ? '#ef4444' : '#888693';
            ctx.font = 'bold 7px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const textR = arcRadius - 13;
            ctx.fillText(labelStr, pivotX + cos * textR, pivotY + sin * textR);
          }
        };

        // Draw standard calibration ticks: -20, -10, -7, -5, -3, -1, 0, +1, +2, +3 dB
        // We linearize the meter dial aesthetically 
        drawTick(0.00, true, false, '-20');
        drawTick(0.15, false, false);
        drawTick(0.30, true, false, '-10');
        drawTick(0.42, false, false);
        drawTick(0.55, true, false, '-5');
        drawTick(0.68, true, false, '-3');
        drawTick(0.80, true, false, '-1');
        drawTick(0.92, true, true, '0'); // Peak red transition point
        drawTick(1.00, true, true, '+1');
        drawTick(1.08, false, true);
        drawTick(1.15, true, true, '+3');

        // Draw warning RED arc segment above 0dB point
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(pivotX, pivotY, arcRadius + 1.5, getAngle(0.92), getAngle(1.155));
        ctx.stroke();

        // 5. Draw the Actual Physical Metallic Stop Pins (Left resting pins and Right warning overflow pins)
        const drawPin = (angle: number) => {
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          ctx.fillStyle = '#6b7280';
          ctx.beginPath();
          ctx.arc(pivotX + cos * (arcRadius + 2), pivotY + sin * (arcRadius + 2), 1.2, 0, Math.PI * 2);
          ctx.fill();
        };
        drawPin(Math.PI * 1.305); // Left rest pin
        drawPin(Math.PI * 1.698); // Right overflow limit pin

        // 6. Draw Label Texts (stereo mode name: CH-L / CH-R & dynamic stats)
        ctx.fillStyle = '#44424e';
        ctx.font = 'black 8px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, pivotX, pivotY - (arcRadius * 0.58));

        ctx.fillStyle = accentColor + '70';
        ctx.font = 'semibold 6.5px "JetBrains Mono", monospace';
        ctx.fillText('ANALOG LEVEL v2.4', pivotX, pivotY - (arcRadius * 0.73));

        // 7. PEAK LEVEL TIER LED BLINKERS
        // When dynamic peak value overrides some limit values (0dB), flash a mini discrete hardware LED
        const isBlinking = peakVal >= 0.91;
        const ledX = pivotX + (dialWidth * 0.38);
        const ledY = 16;
        
        // LED background circle
        ctx.fillStyle = isBlinking ? '#ef4444' : '#1f1519';
        ctx.beginPath();
        ctx.arc(ledX, ledY, 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#655e7a';
        ctx.font = '500 5px "JetBrains Mono", monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText('PK', ledX - 4, ledY);

        // Blinking halo aura
        if (isBlinking) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
          ctx.beginPath();
          ctx.arc(ledX, ledY, 5.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // 8. Draw the dynamic NEEDLE pointing from rotation pivot points
        const targetAngle = getAngle(currentPos);
        const cosNeedle = Math.cos(targetAngle);
        const sinNeedle = Math.sin(targetAngle);

        // Highlight needle with theme-accent color, or warm red as it hits warning heights
        const dynamicNeedleColor = currentPos > 0.91 ? '#dc2626' : theme.accentHex;

        // Shadow for premium layered look
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1.5;

        // Needle core wire line
        ctx.lineWidth = 1.25;
        ctx.strokeStyle = dynamicNeedleColor;
        ctx.beginPath();
        ctx.moveTo(pivotX + cosNeedle * 12, pivotY + sinNeedle * 12);
        ctx.lineTo(pivotX + cosNeedle * (arcRadius + 2), pivotY + sinNeedle * (arcRadius + 2));
        ctx.stroke();

        // Disable shadows for other drawings
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // 9. Dial pivot centerpiece knob (Screw / Dial mechanical base core)
        ctx.fillStyle = '#100e12';
        ctx.strokeStyle = '#27252f';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pivotX, pivotY, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner glowing core
        ctx.fillStyle = dynamicNeedleColor;
        ctx.beginPath();
        ctx.arc(pivotX, pivotY, 3.5, 0, Math.PI * 2);
        ctx.fill();
      };

      // Draw LEFT and RIGHT channels
      drawSingleVU(3, leftPosRef.current, leftPeakRef.current, 'CHANNEL LEFT (dB)');
      drawSingleVU(dialWidth + 12, rightPosRef.current, rightPeakRef.current, 'CHANNEL RIGHT (dB)');
    };

    // Trigger loop safely
    animationId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [analyserNode, dimensions, isSimulated, isPlaying, theme, audioVolume]);

  return (
    <div
      ref={containerRef}
      className="w-full bg-[#020202]/95 border border-stone-900 rounded-xl relative select-none h-[100px] overflow-hidden group flex items-center justify-center p-1 cursor-pointer"
      id="hardware-vu-deck"
      title="Dynamic Hardware Stereophonic peak VU monitors"
    >
      <canvas
        ref={canvasRef}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          display: 'block'
        }}
      />
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { ShieldCheck, Info, Sparkles, Download, Upload, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { ThemeConfig, UserSettings } from '../types';

interface AboutModalProps {
  onClose: () => void;
  theme: ThemeConfig;
  locale: any;
  settings: UserSettings;
  onImportSettings: (imported: Partial<UserSettings>) => void;
}

export default function AboutModal({
  onClose,
  theme,
  locale,
  settings,
  onImportSettings,
}: AboutModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'idle' | 'success' | 'error'; msg: string }>({
    type: 'idle',
    msg: '',
  });

  const handleExport = () => {
    // Collect settings to JSON string
    const settingsJsonStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([settingsJsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Download link setup
    const link = document.createElement('a');
    link.href = url;
    link.download = locale.exportFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const contentStr = event.target?.result as string;
        const parsed = JSON.parse(contentStr);

        // Sanity validation of imported fields
        if (typeof parsed !== 'object' || !parsed) {
          throw new Error('Not an object');
        }

        // Apply imported settings back cleanly via callback
        onImportSettings(parsed);

        setImportStatus({
          type: 'success',
          msg: locale.settingsSuccess,
        });

        // Auto clear success message after 4s
        setTimeout(() => {
          setImportStatus({ type: 'idle', msg: '' });
        }, 4000);

      } catch (err) {
        setImportStatus({
          type: 'error',
          msg: locale.settingsError,
        });
        setTimeout(() => {
          setImportStatus({ type: 'idle', msg: '' });
        }, 4000);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
      <div
        className="w-full max-w-lg bg-stone-950 border rounded-2xl overflow-hidden shadow-2xl relative flex flex-col"
        style={{ borderColor: theme.accentHex + '44' }}
      >
        {/* Glow Header Block */}
        <div
          className="p-5 border-b flex justify-between items-center bg-stone-900/40 relative overflow-hidden"
          style={{ borderColor: theme.accentHex + '22' }}
        >
          {/* Subtle decoration accent glow */}
          <div
            className="absolute top-0 left-10 right-10 h-[2px]"
            style={{
              background: `linear-gradient(90deg, transparent, ${theme.accentHex}, transparent)`,
              boxShadow: `0 0 10px ${theme.glowColor}`
            }}
          />

          <div className="flex items-center gap-2.5">
            <Info size={18} style={{ color: theme.accentHex }} />
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-slate-100">
              {locale.about}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-stone-800 text-stone-400 hover:text-white hover:bg-stone-900 cursor-pointer transition-colors duration-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body with developer info and spec list */}
        <div className="p-6 space-y-6 font-mono text-xs">
          
          {/* Developer Attribution Card */}
          <div className="bg-stone-900/40 border border-stone-800/80 p-5 rounded-xl text-center space-y-3 relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none opacity-5 bg-radial from-violet-500/30 to-transparent" />
            
            <Sparkles size={24} className="mx-auto block animate-pulse" style={{ color: theme.accentHex }} />
            
            <div className="space-y-1">
              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest block">
                {locale.developerLabel}
              </span>
              <h1 className="text-lg font-black tracking-tight text-white glow-text" style={{ textShadow: `0 0 8px ${theme.glowColor}` }}>
                ANDREI ADRIAN BUTA
              </h1>
            </div>

            <p className="text-xxs text-stone-400 max-w-sm mx-auto leading-relaxed">
              Premium high-fidelity audio receiver engineered to deliver seamless online radio streams from over 190 countries with high-resolution digital audio processing.
            </p>
          </div>

          {/* Machine specifications plate list */}
          <div className="space-y-1 bg-black/60 p-4 rounded-xl border border-stone-900">
            <div className="flex justify-between py-1 border-b border-stone-900">
              <span className="text-stone-500 text-[10px] uppercase font-bold">DEVICE MODEL:</span>
              <span className="text-stone-300 font-bold">GSR-9000 MULTI-DECK CHASSIS</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-900">
              <span className="text-stone-500 text-[10px] uppercase font-bold">FIRMWARE VERSION:</span>
              <span className="text-emerald-500 font-bold">V1.4.2 [RELEASE STATE]</span>
            </div>
            <div className="flex justify-between py-1 border-b border-stone-900">
              <span className="text-stone-500 text-[10px] uppercase font-bold">EQUALIZER CHANNELS:</span>
              <span className="text-stone-300">7 BANDS DUAL-MONO</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-stone-500 text-[10px] uppercase font-bold">DYNAMIC ENGINE:</span>
              <span className="text-stone-300">WEB AUDIO CONTEXT SENSOR</span>
            </div>
          </div>

          {/* Import / Export Settings block */}
          <div className="space-y-3 p-4 border rounded-xl bg-stone-900/10" style={{ borderColor: theme.accentHex + '22' }}>
            <div className="font-mono text-[10px] text-stone-400 font-bold uppercase tracking-wider">
              {locale.lang === 'ROMÂNĂ' ? 'CONFIGURATOR SALVARE AUDIO' : locale.lang === 'LINGUA' ? 'CONFIGURAZIONE SALVATAGGIO AUDIO' : 'AUDIO PROFILE SAVE ENGINE'}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExport}
                className="py-2 px-3 rounded-lg bg-stone-900 hover:bg-stone-800 text-white border border-stone-800 text-xs font-bold font-mono tracking-wide flex items-center justify-center gap-1.5 cursor-pointer hover:border-stone-700 transition-colors duration-200"
              >
                <Download size={13} style={{ color: theme.accentHex }} />
                <span>{locale.exportSettings}</span>
              </button>

              <button
                onClick={handleImportClick}
                className="py-2 px-3 rounded-lg bg-stone-900 hover:bg-stone-800 text-white border border-stone-800 text-xs font-bold font-mono tracking-wide flex items-center justify-center gap-1.5 cursor-pointer hover:border-stone-700 transition-colors duration-200"
              >
                <Upload size={13} style={{ color: theme.accentHex }} />
                <span>{locale.importSettings}</span>
              </button>
            </div>

            {/* Ghost input element */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Display feedback status messages */}
            {importStatus.type === 'success' && (
              <div className="p-2 bg-emerald-950/50 border border-emerald-500/30 text-emerald-400 rounded-lg text-xxs flex items-center gap-2 animate-fade-in font-semibold">
                <CheckCircle2 size={13} className="shrink-0" />
                <span>{importStatus.msg}</span>
              </div>
            )}
            {importStatus.type === 'error' && (
              <div className="p-2 bg-rose-950/50 border border-rose-500/30 text-rose-400 rounded-lg text-xxs flex items-center gap-2 animate-fade-in font-semibold">
                <AlertCircle size={13} className="shrink-0" />
                <span>{importStatus.msg}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-stone-500 text-[9px] bg-stone-900/10 p-2.5 rounded-lg border border-stone-900/30 leading-relaxed">
            <ShieldCheck size={14} className="shrink-0 text-stone-400" />
            <span>This device adheres to secure data sandboxing. Settings are stored offline locally within your clean web storage container.</span>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-4 bg-stone-950 border-t border-stone-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 border border-stone-800 cursor-pointer transition-colors duration-200"
          >
            {locale.close}
          </button>
        </div>

      </div>
    </div>
  );
}

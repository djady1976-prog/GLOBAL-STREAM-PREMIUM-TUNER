/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Monitor, CreditCard as FileCode, CheckCircle2, Download, Trash2, X, Laptop } from 'lucide-react';
import { ThemeConfig } from '../types';
import { CURATED_STATIONS } from '../stations';

interface WindowsSetupProps {
  onClose: () => void;
  theme: ThemeConfig;
  locale: any;
}

export default function WindowsSetup({ onClose, theme, locale }: WindowsSetupProps) {
  const [activeTab, setActiveTab] = useState<'pwa' | 'bat' | 'standalone'>('standalone');
  const [downloaded, setDownloaded] = useState(false);
  const [standaloneDownloaded, setStandaloneDownloaded] = useState(false);

  const handleDownloadBat = () => {
    const appUrl = window.location.href;
    const batContent = `@echo off
:: GLOBAL STREAM RADIO WINDOWS SHORTCUT INSTALLER
:: Designed for Windows 10 & Windows 11
echo =======================================================
echo    GLOBAL STREAM RADIO - WINDOWS SHORTCUT CONFIGURATOR
echo =======================================================
echo.
echo Installing desktop shortcut for: %username%
echo Target URL: ${appUrl}
echo.

set SHORTCUT_NAME=Global Stream Radio
set TARGET_URL=${appUrl}
set DESKTOP_DIR=%USERPROFILE%\\Desktop
set SHORTCUT_PATH=%DESKTOP_DIR%\\%SHORTCUT_NAME%.url

:: Write the Internet Shortcut file structure
echo [InternetShortcut] > "%SHORTCUT_PATH%"
echo URL=%TARGET_URL% >> "%SHORTCUT_PATH%"
echo IconIndex=131 >> "%SHORTCUT_PATH%"
echo IconFile=%SystemRoot%\\System32\\shell32.dll >> "%SHORTCUT_PATH%"

echo [InfoTip] >> "%SHORTCUT_PATH%"
echo Premium Online Radio Sintonizzatore >> "%SHORTCUT_PATH%"

if exist "%SHORTCUT_PATH%" (
    echo [SUCCESS] Shortcut successfully created on your Desktop!
    echo Name: %SHORTCUT_NAME%
    echo.
    echo To uninstall, simply delete the shortcut from your desktop.
) else (
    echo [ERROR] Failed to write to desktop folder.
)
echo.
pause
`;

    const blob = new Blob([batContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'install_global_radio.bat';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloaded(true);
  };

  const handleDownloadStandalone = () => {
    const stationsJson = JSON.stringify(CURATED_STATIONS, null, 2);

    const htmlContent = `<!DOCTYPE html>
<html lang="ro">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Global Stream Radio - Standalone Player</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #0c0d0c;
        }
        .font-mono {
            font-family: 'JetBrains Mono', monospace;
        }
        /* Custom scrollbar */
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }
        ::-webkit-scrollbar-track {
            background: #080908;
        }
        ::-webkit-scrollbar-thumb {
            background: #1f2d22;
            border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #12c46a;
        }
        .glowing-border {
            box-shadow: 0 0 15px rgba(18, 196, 106, 0.15);
        }
        .glowing-text {
            text-shadow: 0 0 8px rgba(18, 196, 106, 0.4);
        }
    </style>
</head>
<body class="text-stone-300 min-h-screen flex flex-col selection:bg-emerald-500 selection:text-black">

    <!-- Header Frame -->
    <header class="border-b border-[#12c46a]/20 bg-[#0c0d0c] px-4 py-3.5 flex justify-between items-center relative overflow-hidden shrink-0">
        <!-- Laser Accent Line -->
        <div class="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#12c46a] to-transparent"></div>
        <div class="flex items-center gap-3">
            <div class="p-2 bg-[#12c46a]/10 border border-[#12c46a]/30 rounded-xl relative">
                <i data-lucide="radio" class="w-5 h-5 text-[#12c46a] animate-pulse"></i>
            </div>
            <div>
                <h1 class="text-sm font-bold text-white tracking-widest font-mono uppercase">GLOBAL STREAM RADIO</h1>
                <p class="text-[10px] text-gray-500 font-mono">STANDALONE OFFLINE EDITION • VER. 2.5</p>
            </div>
        </div>
        <div class="flex items-center gap-4 bg-[#080908] px-3 py-1.5 rounded-lg border border-stone-800/80">
            <span class="flex items-center gap-1.5 font-mono text-[10px] text-[#12c46a]">
                <span class="w-2 h-2 rounded-full bg-[#12c46a] animate-ping"></span>
                ONLINE PLUGGED
            </span>
            <span class="text-stone-600">|</span>
            <span class="font-mono text-[10px] text-stone-500">HTML5 ENGINE</span>
        </div>
    </header>

    <!-- Main Workspace -->
    <main class="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 bg-[#090a09]">
        
        <!-- Left Column: Search & Stations list -->
        <section class="w-full md:w-[380px] border-r border-[#12c46a]/10 flex flex-col bg-[#0b0c0b] shrink-0">
            <!-- Search & Filter Controls -->
            <div class="p-4 border-b border-stone-900 space-y-3">
                <div class="relative">
                    <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-600">
                        <i data-lucide="search" class="w-4 h-4"></i>
                    </span>
                    <input id="search-input" type="text" placeholder="Caută posturi din toată lumea..." 
                        class="w-full pl-9 pr-4 py-2 bg-[#060706] text-stone-200 border border-stone-800 rounded-xl text-xs font-mono placeholder:text-stone-600 focus:outline-none focus:border-[#12c46a]/50 focus:ring-1 focus:ring-[#12c46a]/30 transition-all">
                </div>
                <!-- Mini Search filters -->
                <div class="flex items-center gap-1.5 text-[10px] font-mono">
                    <span class="text-stone-600">Cauta in:</span>
                    <button onclick="setSearchFilter('name')" id="filter-name" class="px-2.5 py-1 rounded bg-[#12c46a]/10 text-[#12c46a] border border-[#12c46a]/20 font-bold">Nume</button>
                    <button onclick="setSearchFilter('country')" id="filter-country" class="px-2.5 py-1 rounded bg-stone-900 text-stone-500 border border-transparent font-medium hover:text-stone-300">Țară</button>
                    <button onclick="setSearchFilter('tag')" id="filter-tag" class="px-2.5 py-1 rounded bg-stone-900 text-stone-500 border border-transparent font-medium hover:text-stone-300">Tag-uri</button>
                </div>
            </div>

            <!-- Stations List View -->
            <div class="flex-1 overflow-y-auto p-3 space-y-2" id="stations-container">
                <!-- Programmatically populated list -->
            </div>
        </section>

        <!-- Right Column: Premium Player Control Deck -->
        <section class="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 space-y-6">
            
            <!-- Glowing Player Main Panel -->
            <div class="bg-[#0b0d0c] border border-[#12c46a]/20 rounded-2xl p-5 glowing-border relative overflow-hidden flex flex-col lg:flex-row gap-6">
                <!-- Background decoration radar lines -->
                <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-950/20 via-transparent to-transparent opacity-40 pointer-events-none"></div>

                <!-- Visual LCD Tuning Display Screen -->
                <div class="flex-1 bg-[#050605] border border-stone-900 rounded-xl p-4 flex flex-col justify-between relative min-h-[140px] font-mono select-none">
                    <div class="flex justify-between items-center text-[10px] text-stone-500">
                        <span class="flex items-center gap-1.5">
                            <span class="w-1.5 h-1.5 rounded-full bg-[#12c46a] animate-ping" id="status-beam-dot"></span>
                            TUNING FREQUENCY SYSTEM
                        </span>
                        <span id="display-signal">LOCK OK • 98%</span>
                    </div>

                    <div class="my-3 flex flex-col justify-center">
                        <div class="text-[9px] text-[#12c46a] font-bold tracking-widest uppercase mb-1.5 text-center px-2 py-0.5 bg-[#12c46a]/5 border border-[#12c46a]/15 rounded w-fit self-center" id="display-status-badge">
                            PAUZĂ / STANDBY
                        </div>
                        <div class="text-lg md:text-xl font-bold text-white text-center tracking-wide truncate max-w-full font-mono mt-1" id="display-station-name">
                            -- Global Stream Deck --
                        </div>
                        <div class="text-[11px] text-[#12c46a] text-center font-bold tracking-widest mt-1.5 font-mono opacity-80" id="display-station-metadata">
                            Așteptare acord ... Selectați un post radio
                        </div>
                    </div>

                    <div class="flex justify-between items-center text-[9px] text-stone-600 border-t border-stone-900/60 pt-2">
                        <span id="display-location">LOCAȚIE: GLOBAL</span>
                        <span id="display-bitrate">FORMAT: --</span>
                    </div>
                </div>

                <!-- Visual Soundizer Spectrum Canvas -->
                <div class="w-full lg:w-[260px] h-[140px] bg-[#050605] border border-stone-900 rounded-xl relative overflow-hidden flex flex-col justify-between shrink-0">
                    <div class="absolute top-2 left-2 text-[8px] font-mono text-stone-600 uppercase tracking-widest z-10">Real-Time Graphic Spectrum</div>
                    <canvas id="visualizer-canvas" class="w-full h-full block"></canvas>
                </div>
            </div>

            <!-- Equalizer & Presets Box -->
            <div class="bg-[#0b0c0b] border border-stone-900 rounded-2xl p-4 space-y-4">
                <div class="flex flex-wrap justify-between items-center gap-2">
                    <h3 class="text-xs font-bold text-white tracking-wider uppercase font-mono flex items-center gap-2">
                        <i data-lucide="sliders" class="w-4 h-4 text-[#12c46a]"></i>
                        EGALIZATOR AUDIO GRAFIC (BIQUAD FILTERS)
                    </h3>
                    <!-- Presets Selector -->
                    <div class="flex items-center gap-1.5 text-[10px] font-mono font-bold">
                        <button onclick="setEqPreset('flat')" id="preset-flat" class="px-2 py-0.5 rounded bg-[#12c46a]/10 text-[#12c46a] border border-[#12c46a]/20">Flat</button>
                        <button onclick="setEqPreset('bass')" id="preset-bass" class="px-2 py-0.5 rounded bg-stone-900 text-stone-500 border border-transparent hover:text-stone-300">Bass Boost</button>
                        <button onclick="setEqPreset('vocal')" id="preset-vocal" class="px-2 py-0.5 rounded bg-stone-900 text-stone-500 border border-transparent hover:text-stone-300">Vocal</button>
                        <button onclick="setEqPreset('electronic')" id="preset-electronic" class="px-2 py-0.5 rounded bg-stone-900 text-stone-500 border border-transparent hover:text-stone-300">Club</button>
                    </div>
                </div>

                <!-- Sliders grid -->
                <div class="grid grid-cols-5 gap-4 pt-1 pb-2">
                    <div class="flex flex-col items-center gap-2 font-mono text-[9px]">
                        <span class="text-[#12c46a]" id="val-60hz">0dB</span>
                        <div class="h-28 flex items-center">
                            <input oninput="updateBiquadFilter(0, this.value)" type="range" min="-12" max="12" value="0" step="1" 
                                class="accent-[#12c46a] h-full bg-[#070807] rounded-lg border border-stone-800/80 outline-none w-5 cursor-pointer" style="writing-mode: vertical-lr; direction: rtl;">
                        </div>
                        <span class="text-stone-600 font-bold">60Hz</span>
                    </div>

                    <div class="flex flex-col items-center gap-2 font-mono text-[9px]">
                        <span class="text-[#12c46a]" id="val-230hz">0dB</span>
                        <div class="h-28 flex items-center">
                            <input oninput="updateBiquadFilter(1, this.value)" type="range" min="-12" max="12" value="0" step="1" 
                                class="accent-[#12c46a] h-full bg-[#070807] rounded-lg border border-stone-800/80 outline-none w-5 cursor-pointer" style="writing-mode: vertical-lr; direction: rtl;">
                        </div>
                        <span class="text-stone-600 font-bold">230Hz</span>
                    </div>

                    <div class="flex flex-col items-center gap-2 font-mono text-[9px]">
                        <span class="text-[#12c46a]" id="val-910hz">0dB</span>
                        <div class="h-28 flex items-center">
                            <input oninput="updateBiquadFilter(2, this.value)" type="range" min="-12" max="12" value="0" step="1" 
                                class="accent-[#12c46a] h-full bg-[#070807] rounded-lg border border-stone-800/80 outline-none w-5 cursor-pointer" style="writing-mode: vertical-lr; direction: rtl;">
                        </div>
                        <span class="text-stone-600 font-bold">910Hz</span>
                    </div>

                    <div class="flex flex-col items-center gap-2 font-mono text-[9px]">
                        <span class="text-[#12c46a]" id="val-4khz">0dB</span>
                        <div class="h-28 flex items-center">
                            <input oninput="updateBiquadFilter(3, this.value)" type="range" min="-12" max="12" value="0" step="1" 
                                class="accent-[#12c46a] h-full bg-[#070807] rounded-lg border border-stone-800/80 outline-none w-5 cursor-pointer" style="writing-mode: vertical-lr; direction: rtl;">
                        </div>
                        <span class="text-stone-600 font-bold">4kHz</span>
                    </div>

                    <div class="flex flex-col items-center gap-2 font-mono text-[9px]">
                        <span class="text-[#12c46a]" id="val-14khz">0dB</span>
                        <div class="h-28 flex items-center">
                            <input oninput="updateBiquadFilter(4, this.value)" type="range" min="-12" max="12" value="0" step="1" 
                                class="accent-[#12c46a] h-full bg-[#070807] rounded-lg border border-stone-800/80 outline-none w-5 cursor-pointer" style="writing-mode: vertical-lr; direction: rtl;">
                        </div>
                        <span class="text-stone-600 font-bold">14kHz</span>
                    </div>
                </div>
            </div>

            <!-- Controls Console Dock -->
            <div class="bg-[#0b0c0b] border border-stone-900 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <!-- Big Action buttons -->
                <div class="flex items-center gap-3">
                    <button onclick="controlPlayPrev()" title="Postul Anterior" class="p-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-white transition cursor-pointer">
                        <i data-lucide="skip-back" class="w-4 h-4"></i>
                    </button>
                    <button onclick="controlPlayToggle()" id="btn-toggle-play" class="px-6 py-3 rounded-xl bg-[#12c46a] hover:bg-[#10b15e] text-black font-bold flex items-center gap-2 transition cursor-pointer active:scale-95 shadow-lg shadow-[#12c46a]/10">
                        <i data-lucide="play" id="icon-play-btn" class="w-4 h-4 fill-current"></i>
                        <span id="text-play-btn">REPRODUCE</span>
                    </button>
                    <button onclick="controlStop()" title="Oprește complet" class="p-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-white transition cursor-pointer">
                        <i data-lucide="square" class="w-4 h-4"></i>
                    </button>
                    <button onclick="controlPlayNext()" title="Postul Următor" class="p-3 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-white transition cursor-pointer">
                        <i data-lucide="skip-forward" class="w-4 h-4"></i>
                    </button>
                </div>

                <!-- Volume knob bar -->
                <div class="flex items-center gap-3.5 bg-[#050605] border border-stone-900/60 p-2.5 px-4 rounded-xl font-mono text-xs w-full md:w-64">
                    <span class="text-stone-500 uppercase tracking-wider text-[10px] font-bold">VOL:</span>
                    <input oninput="updateVolume(this.value)" id="volume-slider" type="range" min="0" max="100" value="70" 
                        class="accent-[#12c46a] w-full h-1 bg-stone-900 rounded-lg cursor-pointer">
                    <span id="text-volume" class="text-stone-350 w-10 text-right">70 %</span>
                </div>
            </div>

            <!-- Terminal Diagnostics Log -->
            <div class="bg-[#050605] border border-stone-900 rounded-xl p-3 font-mono text-[10px] text-stone-500 space-y-1">
                <div class="flex justify-between text-stone-600 font-bold border-b border-stone-950 pb-1.5 uppercase text-[9px] tracking-wider">
                    <span>Sistem Log Diagnostics console</span>
                    <span>Direct Connection Feed</span>
                </div>
                <div id="diagnostics-logs" class="space-y-1 max-h-24 overflow-y-auto pt-1 text-stone-500">
                    <div>[03:10:02] INITIALIZING GLOBAL STEREO STREAM ENGINE...</div>
                    <div>[03:10:02] AudioContext successfully primed. Waiting for dynamic user interaction...</div>
                    <div>[03:10:03] Standalone DB connection resolved: ${CURATED_STATIONS.length} international channels pre-cached.</div>
                </div>
            </div>

        </section>
    </main>

    <!-- Footer Status -->
    <footer class="bg-[#080908] border-t border-stone-900 px-4 py-2.5 text-[9px] font-mono text-stone-600 flex justify-between tracking-wide shrink-0">
        <span>GLOBAL DECK SYSTEM • PRODUS STANDALONE PORTABIL</span>
        <span>Apasă ALT + F4 pentru a închide aplicația</span>
    </footer>

    <!-- HTML5 Audio Core element -->
    <audio id="audio-engine"></audio>

    <script>
        const CURATED_STATIONS = ${stationsJson};

        let currentStation = CURATED_STATIONS[0];
        let playbackState = 'stopped';
        let favorites = JSON.parse(localStorage.getItem('standalone_radio_favorites') || '[]');
        let searchFilter = 'name';
        
        let audioCtx = null;
        let sourceNode = null;
        let filters = [];
        let volumeNode = null;
        let analyzer = null;

        const canvas = document.getElementById('visualizer-canvas');
        const ctx = canvas.getContext('2d');
        let animationFrameId = null;

        function resizeCanvas() {
            canvas.width = canvas.parentElement.clientWidth * 2;
            canvas.height = canvas.parentElement.clientHeight * 2;
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        function initAudioContext() {
            if (audioCtx) return;
            try {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                audioCtx = new AudioContextClass();
                
                const audio = document.getElementById('audio-engine');
                sourceNode = audioCtx.createMediaElementSource(audio);

                const frequencies = [60, 230, 910, 4000, 14000];
                let lastNode = sourceNode;

                frequencies.forEach((freq) => {
                    const filter = audioCtx.createBiquadFilter();
                    filter.frequency.value = freq;
                    filter.Q.value = 1.0;
                    filter.gain.value = 0;
                    filter.type = 'peaking';
                    
                    lastNode.connect(filter);
                    filters.push(filter);
                    lastNode = filter;
                });

                volumeNode = audioCtx.createGain();
                updateVolume(document.getElementById('volume-slider').value);
                lastNode.connect(volumeNode);
                lastNode = volumeNode;

                analyzer = audioCtx.createAnalyser();
                analyzer.fftSize = 64;
                lastNode.connect(analyzer);
                analyzer.connect(audioCtx.destination);
                
                logDiagnostic('[AQU] Audio Graph Biquad nodes linked successfully. FFT and EQ active.');
            } catch (e) {
                console.warn('Could not initialize complete audio context graph. Fallback mode:', e);
                logDiagnostic('[WARN] Fallback Audio Engine active.');
            }
        }

        function logDiagnostic(msg) {
            const container = document.getElementById('diagnostics-logs');
            const time = new Date().toTimeString().split(' ')[0];
            const div = document.createElement('div');
            div.innerHTML = '<span class="text-stone-700">[' + time + ']</span> ' + msg;
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
        }

        function renderStations() {
            const query = document.getElementById('search-input').value.toLowerCase().trim();
            const container = document.getElementById('stations-container');
            container.innerHTML = '';

            const filtered = CURATED_STATIONS.filter(station => {
                if (!query) return true;
                if (searchFilter === 'name') {
                    return station.name.toLowerCase().includes(query);
                } else if (searchFilter === 'country') {
                    return station.country.toLowerCase().includes(query) || station.language.toLowerCase().includes(query);
                } else if (searchFilter === 'tag') {
                    return station.tags && station.tags.some(t => t.toLowerCase().includes(query));
                }
                return true;
            });

            if (filtered.length === 0) {
                container.innerHTML = '<div class="text-stone-650 font-mono text-[10px] text-center py-8">Niciun post găsit pentru filtrarea selectată.</div>';
                return;
            }

            filtered.forEach(station => {
                const isSelected = station.id === currentStation.id;
                const isFav = favorites.includes(station.id);

                const item = document.createElement('div');
                item.className = 'p-3 rounded-xl border font-mono transition-all cursor-pointer select-none relative group ' + 
                    (isSelected 
                        ? 'bg-[#12c46a]/10 border-[#12c46a]/40 shadow-sm shadow-[#12c46a]/5' 
                        : 'bg-[#080908]/95 border-stone-850/80 hover:bg-[#0c0d0c] hover:border-stone-750');

                item.innerHTML = '<div class="flex justify-between items-start gap-1">' +
                    '<div class="flex-1 min-w-0" onclick="selectStation(\\'' + station.id + '\\')">' +
                        '<div class="text-[11px] font-bold ' + (isSelected ? 'text-white' : 'text-stone-300') + ' truncate">' + station.name + '</div>' +
                        '<div class="text-[9px] text-stone-500 truncate mt-0.5 flex items-center gap-1">' +
                            '<span class="bg-stone-900 px-1 rounded text-stone-400 font-bold">' + (station.format || 'MP3') + '</span>' +
                            '<span>' + station.country + '</span>' +
                        '</div>' +
                    '</div>' +
                    '<button onclick="toggleFavorite(event, \\'' + station.id + '\\')" class="p-1 text-stone-600 hover:text-[#12c46a] transition self-center shrink-0">' +
                        '<i data-lucide="heart" class="w-3.5 h-3.5 ' + (isFav ? 'text-[#12c46a] fill-current' : '') + '"></i>' +
                    '</button>' +
                '</div>';
                
                container.appendChild(item);
            });

            lucide.createIcons();
        }

        function setSearchFilter(mode) {
            searchFilter = mode;
            ['name', 'country', 'tag'].forEach(m => {
                const btn = document.getElementById('filter-' + m);
                if (m === mode) {
                    btn.className = 'px-2.5 py-1 rounded bg-[#12c46a]/10 text-[#12c46a] border border-[#12c46a]/20 font-bold';
                } else {
                    btn.className = 'px-2 py-1 rounded bg-stone-900 text-stone-500 border border-transparent font-medium hover:text-stone-300';
                }
            });
            renderStations();
        }

        document.getElementById('search-input').addEventListener('input', renderStations);

        function selectStation(id) {
            const station = CURATED_STATIONS.find(s => s.id === id);
            if (!station) return;

            currentStation = station;
            logDiagnostic('Acordare pe postul: ' + station.name);
            
            document.getElementById('display-station-name').innerText = station.name;
            document.getElementById('display-station-name').title = station.name;
            document.getElementById('display-location').innerText = 'LOCAȚIE: ' + station.country.toUpperCase() + ' (' + station.language + ')';
            document.getElementById('display-bitrate').innerText = 'FORMAT: ' + station.format + ' • ' + (station.bitrate > 0 ? station.bitrate + ' KBPS' : '128 KBPS');
            document.getElementById('display-station-metadata').innerText = 'Recepție Sincronă... Acordare directă...';
            
            tuneToStream(station.url);
            renderStations();
        }

        function tuneToStream(url) {
            initAudioContext();
            const audio = document.getElementById('audio-engine');
            setPlayerState('connecting');

            try {
                audio.crossOrigin = 'anonymous';
                audio.src = url;
                audio.load();

                if (audioCtx && audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }

                audio.play()
                    .then(() => {
                        setPlayerState('playing');
                        logDiagnostic('[STREAM] Semnal stabilizat direct. Redare în curs.');
                    })
                    .catch(err => {
                        if (err.name === 'AbortError') return;
                        logDiagnostic('[WARN] Eroare CORS la sintonizare. Activare mod bypass...');
                        audio.removeAttribute('crossOrigin');
                        audio.src = url;
                        audio.load();
                        audio.play()
                            .then(() => {
                                setPlayerState('playing');
                                logDiagnostic('[STREAM] Redare prin modul securizat bypass activată.');
                            })
                            .catch(fail => {
                                if (fail.name === 'AbortError') return;
                                setPlayerState('error');
                                logDiagnostic('[ERR] Conexiune refuzată de serverul postului.');
                            });
                    });
            } catch (e) {
                setPlayerState('error');
                logDiagnostic('[ERR] Structură URL invalidă.');
            }
        }

        function setPlayerState(state) {
            playbackState = state;
            const textPlay = document.getElementById('text-play-btn');
            const iconPlay = document.getElementById('icon-play-btn');
            const badge = document.getElementById('display-status-badge');
            const beam = document.getElementById('status-beam-dot');
            const sig = document.getElementById('display-signal');

            if (state === 'playing') {
                textPlay.innerText = 'SISTEAZĂ';
                iconPlay.setAttribute('data-lucide', 'pause');
                badge.innerText = 'CONECTAT • EMISIE LIVE';
                badge.className = 'text-[9px] text-[#12c46a] font-bold tracking-widest uppercase mb-1.5 text-center px-2 py-0.5 bg-[#12c46a]/10 border border-[#12c46a]/30 rounded w-fit self-center';
                beam.className = 'w-1.5 h-1.5 rounded-full bg-[#12c46a] animate-ping';
                sig.innerText = 'LOCK OK • 99% STEREO';
                document.getElementById('display-station-metadata').innerText = 'Muzică live sincronizată. Stereo HD.';
            } else if (state === 'connecting') {
                textPlay.innerText = 'ACORDARE';
                iconPlay.setAttribute('data-lucide', 'loader2');
                badge.innerText = 'CONECTARE SEMNAL GRILĂ...';
                badge.className = 'text-[9px] text-yellow-400 font-bold tracking-widest uppercase mb-1.5 text-center px-2 py-0.5 bg-yellow-400/5 border border-yellow-400/30 rounded w-fit self-center';
                beam.className = 'w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse';
                sig.innerText = 'SINCRONIZARE...';
                document.getElementById('display-station-metadata').innerText = 'Negociere parametrii de rețea...';
            } else if (state === 'error') {
                textPlay.innerText = 'REPRODUCE';
                iconPlay.setAttribute('data-lucide', 'play');
                badge.innerText = 'EROARE DE ACORD';
                badge.className = 'text-[9px] text-rose-500 font-bold tracking-widest uppercase mb-1.5 text-center px-2 py-0.5 bg-rose-500/5 border border-rose-500/30 rounded w-fit self-center';
                beam.className = 'w-1.5 h-1.5 rounded-full bg-rose-500';
                sig.innerText = 'DEFECT DE RECEPȚIE';
                document.getElementById('display-station-metadata').innerText = 'Sursa nu are stream activ sau lipsește semnalul.';
            } else {
                textPlay.innerText = 'REPRODUCE';
                iconPlay.setAttribute('data-lucide', 'play');
                badge.innerText = 'PAUZĂ / STANDBY';
                badge.className = 'text-[9px] text-stone-500 font-bold tracking-widest uppercase mb-1.5 text-center px-2 py-0.5 bg-stone-900 border border-stone-800 rounded w-fit self-center';
                beam.className = 'w-1.5 h-1.5 rounded-full bg-stone-600';
                sig.innerText = 'STANDBY LOCK';
                document.getElementById('display-station-metadata').innerText = 'Selectați un post și apăsați pe redare.';
            }
            lucide.createIcons();
        }

        function controlPlayToggle() {
            const audio = document.getElementById('audio-engine');
            if (playbackState === 'playing' || playbackState === 'connecting') {
                audio.pause();
                setPlayerState('stopped');
                logDiagnostic('[USER] Pauză manuală acționată.');
            } else {
                tuneToStream(currentStation.url);
            }
        }

        function controlStop() {
            const audio = document.getElementById('audio-engine');
            audio.pause();
            audio.src = '';
            setPlayerState('stopped');
            logDiagnostic('[USER] Sintonizare oprită. In standby.');
        }

        function controlPlayPrev() {
            const currentIdx = CURATED_STATIONS.findIndex(s => s.id === currentStation.id);
            let prevIdx = currentIdx - 1;
            if (prevIdx < 0) prevIdx = CURATED_STATIONS.length - 1;
            selectStation(CURATED_STATIONS[prevIdx].id);
        }

        function controlPlayNext() {
            const currentIdx = CURATED_STATIONS.findIndex(s => s.id === currentStation.id);
            let nextIdx = currentIdx + 1;
            if (nextIdx >= CURATED_STATIONS.length) nextIdx = 0;
            selectStation(CURATED_STATIONS[nextIdx].id);
        }

        function toggleFavorite(e, id) {
            e.stopPropagation();
            const idx = favorites.indexOf(id);
            if (idx === -1) {
                favorites.push(id);
                logDiagnostic('Adăugat la favorite: ' + CURATED_STATIONS.find(s => s.id === id).name);
            } else {
                favorites.splice(idx, 1);
                logDiagnostic('Eliminat din favorite: ' + CURATED_STATIONS.find(s => s.id === id).name);
            }
            localStorage.setItem('standalone_radio_favorites', JSON.stringify(favorites));
            renderStations();
        }

        function updateVolume(val) {
            document.getElementById('text-volume').innerText = val + ' %';
            const audio = document.getElementById('audio-engine');
            audio.volume = val / 100;
            if (volumeNode && audioCtx) {
                volumeNode.gain.value = val / 100;
            }
        }

        function updateBiquadFilter(index, val) {
            document.getElementById('preset-flat').className = 'px-2 py-0.5 rounded bg-stone-900 text-stone-500 border border-transparent hover:text-stone-300';
            document.getElementById('preset-bass').className = 'px-2 py-0.5 rounded bg-stone-900 text-stone-500 border border-transparent hover:text-stone-300';
            document.getElementById('preset-vocal').className = 'px-2 py-0.5 rounded bg-stone-900 text-stone-500 border border-transparent hover:text-stone-300';
            document.getElementById('preset-electronic').className = 'px-2 py-0.5 rounded bg-stone-900 text-stone-500 border border-transparent hover:text-stone-300';

            const dbSpanIds = ['val-60hz', 'val-230hz', 'val-910hz', 'val-4khz', 'val-14khz'];
            document.getElementById(dbSpanIds[index]).innerText = (val > 0 ? '+' : '') + val + 'dB';
            
            if (filters[index] && audioCtx) {
                filters[index].gain.value = val;
            }
        }

        function setEqPreset(preset) {
            const slidersValue = {
                flat: [0, 0, 0, 0, 0],
                bass: [11, 6, 0, -2, -3],
                vocal: [-4, -1, 7, 5, 1],
                electronic: [9, 4, -1, 3, 5]
            };
            const inputs = document.querySelectorAll('input[type="range"][oninput*="biquad"]');
            const targetValues = slidersValue[preset];

            targetValues.forEach((val, idx) => {
                if (inputs[idx]) {
                    inputs[idx].value = val;
                    updateBiquadFilter(idx, val);
                }
            });

            ['flat', 'bass', 'vocal', 'electronic'].forEach(p => {
                const btn = document.getElementById('preset-' + p);
                if (p === preset) {
                    btn.className = 'px-2 py-0.5 rounded bg-[#12c46a]/10 text-[#12c46a] border border-[#12c46a]/20 font-bold';
                } else {
                    btn.className = 'px-2 py-0.5 rounded bg-stone-900 text-stone-500 border border-transparent hover:text-stone-300';
                }
            });
            logDiagnostic('Preset egalizor selectat: ' + preset.toUpperCase());
        }

        function drawSpectrum() {
            animationFrameId = requestAnimationFrame(drawSpectrum);
            
            const w = canvas.width;
            const h = canvas.height;
            ctx.clearRect(0, 0, w, h);

            if (playbackState === 'playing' && analyzer) {
                const bufferLength = analyzer.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                analyzer.getByteFrequencyData(dataArray);

                const barWidth = (w / bufferLength) * 1.6;
                let barHeight;
                let x = 0;

                for (let i = 0; i < bufferLength; i++) {
                    barHeight = (dataArray[i] / 255) * h * 0.95;

                    const g = ctx.createLinearGradient(0, h, 0, 0);
                    g.addColorStop(0, '#042211');
                    g.addColorStop(0.3, '#085e30');
                    g.addColorStop(0.8, '#12c46a');
                    g.addColorStop(1, '#66ffb3');

                    ctx.fillStyle = g;
                    ctx.fillRect(x, h - barHeight, barWidth - 3, barHeight);
                    x += barWidth;
                }
            } else if (playbackState === 'playing' || playbackState === 'connecting') {
                const time = Date.now() * 0.007;
                ctx.lineWidth = 4;
                ctx.strokeStyle = playbackState === 'connecting' ? '#d97706' : '#12c46a';
                ctx.beginPath();
                
                for (let x = 0; x < w; x += 3) {
                    const phase = x * 0.015 - time;
                    const amplitude = playbackState === 'connecting' ? 12 : 35;
                    const y = (h / 2) + Math.sin(phase) * amplitude * Math.sin(time * 0.2) + Math.sin(x * 0.005 + time) * 10;
                    if (x === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.stroke();
            } else {
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#222';
                ctx.beginPath();
                ctx.moveTo(0, h / 2);
                ctx.lineTo(w, h / 2);
                ctx.stroke();
            }
        }

        window.addEventListener('DOMContentLoaded', () => {
            renderStations();
            drawSpectrum();
            logDiagnostic('Dispozitiv pornit cu succes. Standby.');
        });
    </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Global_Stream_Radio.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setStandaloneDownloaded(true);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in select-none">
      <div
        className="w-full max-w-2xl bg-stone-950 border rounded-2xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
        style={{ borderColor: theme.accentHex + '44' }}
      >
        
        {/* Glow Header Block */}
        <div
          className="p-5 border-b flex justify-between items-center bg-stone-900/40 relative overflow-hidden"
          style={{ borderColor: theme.accentHex + '22' }}
        >
          {/* Subtle decoration accent glow */}
          <div
            className="absolute top-0 left-1/4 right-1/4 h-[2px]"
            style={{
              background: `linear-gradient(90deg, transparent, ${theme.accentHex}, transparent)`,
              boxShadow: `0 0 10px ${theme.glowColor}`
            }}
          />

          <div className="flex items-center gap-2.5">
            <Monitor size={20} style={{ color: theme.accentHex }} />
            <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-slate-100">
              DISPOZITIV PORTABIL & SETĂRI NATIVE
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-stone-800 text-stone-400 hover:text-white hover:bg-stone-900 cursor-pointer transition-colors duration-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Selectors */}
        <div className="flex border-b border-stone-900 bg-stone-950/40" id="windows-tab-selectors">
          <button
            onClick={() => setActiveTab('standalone')}
            className={`flex-1 py-3 text-xs font-mono font-bold border-b-2 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
              activeTab === 'standalone'
                ? 'border-b-2 text-white bg-stone-900/30'
                : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
            style={{ borderBottomColor: activeTab === 'standalone' ? theme.accentHex : 'transparent' }}
          >
            <Laptop size={14} style={{ color: activeTab === 'standalone' ? theme.accentHex : '' }} />
            <span>PORTABIL DETACHED (.HTML)</span>
          </button>
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 py-3 text-xs font-mono font-bold border-b-2 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
              activeTab === 'pwa'
                ? 'border-b-2 text-white bg-stone-900/30'
                : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
            style={{ borderBottomColor: activeTab === 'pwa' ? theme.accentHex : 'transparent' }}
          >
            <Monitor size={14} style={{ color: activeTab === 'pwa' ? theme.accentHex : '' }} />
            <span>APLICAȚIE PWA</span>
          </button>
          <button
            onClick={() => setActiveTab('bat')}
            className={`flex-1 py-3 text-xs font-mono font-bold border-b-2 flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
              activeTab === 'bat'
                ? 'border-b-2 text-white bg-stone-900/30'
                : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
            style={{ borderBottomColor: activeTab === 'bat' ? theme.accentHex : 'transparent' }}
          >
            <FileCode size={14} style={{ color: activeTab === 'bat' ? theme.accentHex : '' }} />
            <span>LANSARE INTRO (.BAT)</span>
          </button>
        </div>

        {/* Content Panel */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-stone-300 space-y-6">
          
          {activeTab === 'standalone' && (
            <div className="space-y-4 animate-fade-in text-stone-300">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: theme.accentHex }}>
                <Laptop size={16} />
                APLICAȚIE NATIVĂ INDEPENDENTĂ PORTABILĂ (.HTML)
              </h3>
              
              <p className="text-stone-400 leading-relaxed text-[11px]">
                Dacă doriți ca radioul să funcționeze ca un program normal, independent de un site de internet, puteți descărca întregul sintonizator ca un program independent portabil. Aceasta generează un singur fișier compact (.html) pe care îl puteți pune direct pe desktop-ul dvs. și îl lansați la dublu-clic!
              </p>

              <div className="bg-[#0b0c0b] border border-stone-900 p-4 rounded-xl space-y-4">
                <div className="space-y-1.5">
                  <div className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 uppercase tracking-wider">
                    <CheckCircle2 size={12} />
                    CONȚINUT ȘI CAPABILITĂȚI MULTIMEDIA:
                  </div>
                  <ul className="list-none space-y-1.5 text-[10px] text-stone-400 pl-1">
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-[#12c46a]"></span>
                      <span>Toate cele peste {CURATED_STATIONS.length} posturi de radio de pe glob sunt deja integrate în fișier.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-[#12c46a]"></span>
                      <span>Egalizator grafic biquad complet activ pentru bass și frecvențe înalte.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-[#12c46a]"></span>
                      <span>Graficul cu analizor spectral responsive se updatează fluid în timp real.</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-[#12c46a]"></span>
                      <span>Profilul dvs. și postul favorit sunt memorate direct pe sistemul local.</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handleDownloadStandalone}
                  className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-[#12c46a] hover:bg-[#10b15e] text-black border-none cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                  style={{ boxShadow: `0 0 15px ${theme.accentHex}33` }}
                >
                  <Download size={14} className="stroke-[3]" />
                  <span>DESCARCĂ PROGRAMUL DIN SERVER (.HTML)</span>
                </button>

                {standaloneDownloaded && (
                  <div className="text-[10px] text-emerald-400 text-center font-bold flex items-center justify-center gap-1.5 animate-pulse mt-2">
                    <CheckCircle2 size={12} />
                    <span>Aplicația s-a descărcat cu succes! Deschideți fișierul portabil de pe PC pentru a rula instantaneu programul radio.</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-black/60 border border-stone-900 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">SFAT DE LANSARE FĂRĂ BROWSER (Aplicație tip Widget):</span>
                <p className="text-stone-400 text-[10px] leading-relaxed">
                  Pentru a rula programul portabil într-o fereastră perfectă fără margini și butoane de browser (ca un widget separat pe ecran), puteți face o scurtătură pe desktop-ul dvs. și la „Target / Locație destinație” introduceți codul de mai jos:
                </p>
                <div className="text-[9.5px] bg-stone-950 p-2.5 rounded text-[#12c46a] font-mono leading-relaxed select-all">
                  <code>msedge --app=file:///C:/calea_catre_fisierul_descarcat/Global_Stream_Radio.html</code>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pwa' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-bold text-slate-150 flex items-center gap-2" style={{ color: theme.accentHex }}>
                <CheckCircle2 size={16} />
                Instalare ca PWA (Aplicație Web Progresivă)
              </h3>
              <p className="text-stone-400 leading-relaxed text-[11px]">
                Tehnologia PWA vă permite să "instalați" interfața radioului direct din browser, creând un executabil virtual securizat în ecranul de start și în meniul de programe din Windows.
              </p>
              
              <div className="grid grid-cols-1 gap-2.5 pl-2">
                <div className="bg-stone-900/55 p-3 rounded-xl border border-stone-800/40 flex gap-3 items-start">
                  <div className="bg-black/50 px-2 py-0.5 rounded text-xxs font-bold h-fit mt-0.5" style={{ color: theme.accentHex }}>01</div>
                  <div className="text-stone-300 leading-relaxed text-[11px]">{locale.pwaOptionStep1}</div>
                </div>
                <div className="bg-stone-900/55 p-3 rounded-xl border border-stone-800/40 flex gap-3 items-start">
                  <div className="bg-black/50 px-2 py-0.5 rounded text-xxs font-bold h-fit mt-0.5" style={{ color: theme.accentHex }}>02</div>
                  <div className="text-stone-300 leading-relaxed text-[11px]">{locale.pwaOptionStep2}</div>
                </div>
                <div className="bg-stone-900/55 p-3 rounded-xl border border-stone-800/40 flex gap-3 items-start">
                  <div className="bg-black/50 px-2 py-0.5 rounded text-xxs font-bold h-fit mt-0.5" style={{ color: theme.accentHex }}>03</div>
                  <div className="text-stone-300 leading-relaxed text-[11px]">{locale.pwaOptionStep3}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'bat' && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-sm font-bold text-slate-150 flex items-center gap-2" style={{ color: theme.accentHex }}>
                <FileCode size={16} />
                Creare scurtătură rapidă Desktop prin script batch (.BAT)
              </h3>
              
              <p className="text-stone-400 leading-relaxed text-[11px]">
                Dacă utilizarea PWA nu merge, puteți descărca scriptul automat .BAT pentru Windows care configurează instant un shortcut special cu pictograma radioului direct pe desktop-ul dvs.
              </p>

              <div className="p-4 bg-[#0a070f] border border-stone-800/80 rounded-xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">WSH Shortcut Builder</span>
                  <span className="text-[10px] text-emerald-500 font-bold font-mono">SECURE</span>
                </div>
                <div className="text-stone-400 bg-black/60 p-2.5 rounded font-mono overflow-x-auto text-[10px] max-h-24">
                  <code>{`echo [InternetShortcut] > "%USERPROFILE%\\Desktop\\Global Radio.url"\necho URL=${window.location.origin} >> "%USERPROFILE%\\Desktop\\Global Radio.url"`}</code>
                </div>
                <button
                  onClick={handleDownloadBat}
                  className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white border cursor-pointer hover:scale-101 active:scale-98 transition-all duration-200"
                  style={{ borderColor: theme.accentHex + '55', color: theme.accentHex }}
                >
                  <Download size={14} />
                  <span>{locale.downloadInstaller}</span>
                </button>
                {downloaded && (
                  <div className="text-[10px] text-emerald-400 text-center font-bold flex items-center justify-center gap-1.5 mt-1.5 animate-pulse">
                    <CheckCircle2 size={12} />
                    <span>Fișier .BAT descărcat cu succes! Rulați fișierul pentru instalarea scurtăturii.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Separation Divider */}
          <div className="border-t border-stone-900 my-4" />

          {/* Uninstall Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <Trash2 size={14} />
              Ghid de Dezinstalare / Ștergere
            </h4>
            <ul className="list-disc list-inside space-y-1.5 text-stone-400 text-[11px] leading-relaxed">
              <li>PWA: Faceți clic pe meniul de sus cu 3 puncte când rulați aplicația, apoi selectați „Dezinstalați aplicația”.</li>
              <li>Scurtături (.bat) sau Portabil (.html): Ștergeți pur și simplu fișierele corespunzătoare de pe PC. Nu rămâne niciun reziduu în reguștrii sistemului Windows.</li>
            </ul>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-stone-950 border-t border-stone-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 border border-stone-800 cursor-pointer transition-colors duration-250"
          >
            {locale.close}
          </button>
        </div>

      </div>
    </div>
  );
}

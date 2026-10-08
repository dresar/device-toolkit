let clientData = {};
let serverData = {};

document.addEventListener('DOMContentLoaded', async () => {
  if (typeof lucide !== 'undefined') lucide.createIcons();
  collectClientTelemetry();
  await fetchServerTelemetry();
  initBatteryListener();
});

function safeText(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

function collectClientTelemetry() {
  const glCanvas = document.createElement('canvas');
  let glRenderer = 'Not Supported';
  let glVendor = 'Not Supported';

  try {
    const gl = glCanvas.getContext('webgl') || glCanvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        glRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Blocked';
        glVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Blocked';
      }
    }
  } catch (e) {
    glRenderer = 'Not Supported';
    glVendor = 'Not Supported';
  }

  safeText('webgl-renderer', glRenderer);
  safeText('webgl-vendor', glVendor);
  safeText('screen-resolution', `${window.screen.width} x ${window.screen.height}`);
  safeText('screen-dpr', `${window.devicePixelRatio || 1}x`);
  safeText('screen-color-depth', `${window.screen.colorDepth || 0}-bit`);
  safeText('touch-points', `${navigator.maxTouchPoints || 0} Points`);
  safeText('screen-viewport', `Viewport: ${window.innerWidth} x ${window.innerHeight}`);

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn) {
    safeText('stat-net-type', (conn.effectiveType || '4G').toUpperCase());
    safeText('stat-net-speed', `${conn.downlink || '-'} Mbps • RTT ${conn.rtt || '-'}ms`);
  }

  const features = [
    { name: 'Touch Support', active: 'ontouchstart' in window || navigator.maxTouchPoints > 0 },
    { name: 'Geolocation', active: 'geolocation' in navigator },
    { name: 'Bluetooth API', active: 'bluetooth' in navigator },
    { name: 'Vibration API', active: 'vibrate' in navigator },
    { name: 'Service Worker', active: 'serviceWorker' in navigator },
    { name: 'Web Workers', active: typeof(Worker) !== 'undefined' },
    { name: 'Web Audio API', active: 'AudioContext' in window || 'webkitAudioContext' in window },
    { name: 'Speech Synthesis', active: 'speechSynthesis' in window }
  ];

  const sensorContainer = document.getElementById('sensors-grid');
  if (sensorContainer) {
    let sensorHtml = '';
    features.forEach(f => {
      const badge = f.active ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-slate-900 text-slate-500 border-white/5';
      sensorHtml += `
        <div class="p-2 rounded-lg border ${badge} flex items-center justify-between">
          <span>${f.name}</span>
          <span class="text-[10px] font-bold">${f.active ? 'READY' : 'N/A'}</span>
        </div>
      `;
    });
    sensorContainer.innerHTML = sensorHtml;
  }

  clientData = {
    userAgent: navigator.userAgent,
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      dpr: window.devicePixelRatio,
      colorDepth: window.screen.colorDepth,
      touchPoints: navigator.maxTouchPoints
    },
    gpu: {
      renderer: glRenderer,
      vendor: glVendor
    },
    features
  };
}

async function initBatteryListener() {
  if (!('getBattery' in navigator)) {
    safeText('stat-battery', 'Unavailable');
    safeText('stat-battery-charging', 'Browser Restricted');
    return;
  }

  try {
    const battery = await navigator.getBattery();
    const updateBattery = () => {
      let levelPct = Math.round(battery.level * 100);
      if (!isFinite(levelPct) || isNaN(levelPct)) levelPct = 0;
      safeText('stat-battery', `${levelPct}%`);
      safeText('stat-battery-charging', battery.charging ? 'Charging (Mengisi Daya)' : 'Discharging (Baterai)');

      const iconEl = document.getElementById('battery-icon');
      if (iconEl) {
        if (battery.charging) {
          iconEl.setAttribute('data-lucide', 'battery-charging');
          iconEl.classList.remove('text-emerald-400');
          iconEl.classList.add('text-amber-400');
        } else {
          iconEl.setAttribute('data-lucide', 'battery');
          iconEl.classList.remove('text-amber-400');
          iconEl.classList.add('text-emerald-400');
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }

      clientData.battery = {
        level: levelPct,
        charging: battery.charging,
        chargingTime: battery.chargingTime,
        dischargingTime: battery.dischargingTime
      };
    };

    updateBattery();
    battery.addEventListener('levelchange', updateBattery);
    battery.addEventListener('chargingchange', updateBattery);
  } catch (e) {
    safeText('stat-battery', 'Restricted');
  }
}

async function fetchServerTelemetry() {
  try {
    const res = await fetch('/api/system');
    serverData = await res.json();

    const totalMem = serverData.memory && serverData.memory.totalBytes ? serverData.memory.totalBytes : 0;
    const usedMem = serverData.memory && serverData.memory.usedBytes ? serverData.memory.usedBytes : 0;
    const usedPercentage = totalMem > 0 ? ((usedMem / totalMem) * 100).toFixed(1) : '0';

    safeText('stat-ram-pct', `${usedPercentage}%`);
    const totalGb = (totalMem / (1024 ** 3)).toFixed(1);
    const usedGb = (usedMem / (1024 ** 3)).toFixed(1);
    safeText('stat-ram-detail', `${usedGb} GB / ${totalGb} GB`);

    safeText('stat-cpu-cores', `${serverData.cpuCores || 0} Threads`);
    safeText('stat-cpu-arch', `${serverData.arch || ''} (${serverData.platform || ''})`);

    safeText('server-hostname', serverData.hostname || 'Unknown');
    safeText('server-os', `${serverData.type || ''} ${serverData.release || ''}`);
    const uptimeSeconds = serverData.uptimeSeconds || 0;
    const hours = Math.floor(uptimeSeconds / 3600);
    const mins = Math.floor((uptimeSeconds % 3600) / 60);
    safeText('server-uptime', `${hours}j ${mins}m`);
    safeText('server-cpu', serverData.cpuModel || 'Unknown');
  } catch (err) {
    console.error(err);
  }
}

async function runAiDiagnostic() {
  const modal = document.getElementById('ai-modal');
  const content = document.getElementById('ai-modal-content');

  if (modal) modal.classList.remove('hidden');
  if (content) {
    content.innerHTML = `
      <div class="flex items-center gap-2 text-purple-400 py-8 justify-center">
        <i data-lucide="loader-2" class="w-5 h-5 animate-spin"></i>
        <span>Melakukan diagnosis hardware & resource via Qwen-3.8-Max...</span>
      </div>
    `;
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();

  try {
    const res = await fetch('/api/ai-diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientTelemetry: clientData,
        serverTelemetry: serverData
      })
    });
    const data = await res.json();
    const report = data.diagnosis || data.report || 'Tidak ada laporan diagnosa.';
    if (content) content.innerHTML = typeof marked !== 'undefined' ? marked.parse(report) : report;
  } catch (err) {
    if (content) content.innerHTML = `<div class="text-rose-400">Error: ${err.message}</div>`;
  }
}

function closeAiModal() {
  const modal = document.getElementById('ai-modal');
  if (modal) modal.classList.add('hidden');
}
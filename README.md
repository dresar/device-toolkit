# 🛠️ Device Toolkit

Toolkit diagnostik hardware, status baterai, layar, dan kapabilitas sensor perangkat secara komprehensif, dilengkapi auditor sistem bertenaga **Qwen AI (`qwen3.8-max`)**.

## Fitur Utama
- **Battery Health & Charge Monitor**: Level persentase baterai, status charging (mengisi daya vs discharging), estimasi durasi via Battery Status API.
- **CPU & RAM Memory Meter**: Pemantauan beban memori RAM (total, free, used GB) dan arsitektur core CPU.
- **Layar & Tampilan**: Deteksi resolusi fisik, Device Pixel Ratio (DPR), kedalaman warna (bit depth), dan multi-touch point support.
- **GPU & WebGL Renderer**: Identifikasi vendor grafis kartu video dan driver unmasked WebGL.
- **Sensor & Browser Capabilities**: Audit ketersediaan Geolocation, Bluetooth, Vibration, Audio/Video, dan Service Worker.
- **Qwen-3.8-Max AI Performance Auditor**: Analisis risiko memory pressure bottleneck, evaluasi efisiensi termal/baterai, dan saran optimasi performa.

## Konfigurasi & Menjalankan
```bash
cd 03-device-toolkit
npm install
node server.js
```
Akses di browser: `http://localhost:3003`

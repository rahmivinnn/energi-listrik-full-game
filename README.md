# Energy Quest: Misteri Hemat Listrik

## Deskripsi Game
Energy Quest: Misteri Hemat Listrik adalah game edukasi puzzle adventure yang dirancang untuk meningkatkan kesadaran penggunaan energi listrik yang efisien. Game ini dikembangkan menggunakan Three.js dan ditujukan untuk siswa SMP (usia 12-15 tahun).

## Fitur Utama
- **Genre**: Puzzle Adventure Edukasi
- **Platform**: Web Browser (HTML5/Three.js)
- **Target Audiens**: Siswa SMP (usia 12-15 tahun)
- **Resolusi**: 1600 x 720 px
- **Engine**: Three.js 3D dengan sistem interaksi yang powerful

## Fitur Unity-Style AAA Game
- **3D Raycasting**: Klik langsung pada objek 3D untuk berinteraksi
- **Hover Effects**: Objek menyala dan berpartikel saat di-hover
- **Drag & Drop**: Seret komponen listrik untuk menghubungkannya
- **Real-time Sliders**: Geser slider untuk mengatur konsumsi energi secara langsung
- **Particle Effects**: Efek partikel untuk listrik, energi, dan percikan
- **Dynamic Lighting**: Pencahayaan yang berubah sesuai koneksi listrik
- **Camera Controls**: Orbit, zoom, dan pan untuk eksplorasi 3D
- **Smooth Animations**: Animasi halus untuk semua interaksi
- **Spatial Audio**: Suara 3D yang responsif terhadap interaksi

## Sistem Unity-Style Advanced
- **Post-Processing Pipeline**: Bloom, SSAO, Color Grading, Vignette, Chromatic Aberration
- **Advanced Shaders**: PBR, Emissive, Electric, Energy Flow, Hologram, Water
- **Physics Engine**: Cannon.js dengan collision detection, rigidbodies, constraints
- **UI System**: Unity-style UI dengan panels, buttons, sliders, animations
- **Performance Optimization**: LOD system, frustum culling, instancing, batching
- **Advanced Effects**: Volumetric lighting, screen space reflections, motion blur, depth of field
- **Input System**: Keyboard, mouse, gamepad, touch dengan input mapping
- **Animation System**: Keyframe-based animations dengan easing curves
- **Audio System**: 3D spatial audio dengan reverb dan occlusion

## Alur Permainan

### 1. Opening Cutscene
Animasi pembuka yang memperkenalkan cerita tentang ilmuwan listrik yang hilang secara misterius.

### 2. Level 1 - Ruang Tamu (Dasar Listrik)
- **Puzzle Kabel Interaktif**: Klik dan seret komponen listrik 3D untuk menghubungkannya
- **Visual Feedback**: Lampu menyala dengan efek partikel saat rangkaian benar
- **Dynamic Lighting**: Pencahayaan berubah sesuai koneksi listrik
- **Tujuan**: Menyalakan listrik di ruang tamu
- **Reward**: Kunci Energi Pertama

### 3. Level 2 - Dapur (Efisiensi Energi)
- **Puzzle Efisiensi 3D**: Klik langsung pada peralatan dapur untuk mengontrolnya
- **Real-time Feedback**: Power Meter berubah secara langsung saat peralatan dinyalakan/matikan
- **Visual Effects**: Peralatan menyala dengan efek partikel energi
- **Mekanik**: ON/OFF peralatan listrik dengan konsumsi berbeda
- **Reward**: Kunci Energi Kedua

### 4. Level 3 - Laboratorium (Tagihan Listrik)
- **Simulator Energi Interaktif**: Geser slider 3D untuk mengatur konsumsi energi
- **Real-time Calculation**: Tagihan berubah secara langsung saat slider digeser
- **Visual Display**: Layar 3D menampilkan tagihan dengan warna yang berubah
- **Perhitungan**: Menggunakan rumus energi listrik E = P × t / 1000
- **Reward**: Kunci Energi Ketiga

### 5. Level 4 - Ruang Bawah Tanah (Evaluasi Final)
- **Pintu Interaktif**: Klik pada pintu rahasia untuk membuka dengan Kunci Energi
- **Slot Kunci 3D**: Slot kunci menyala saat Kunci Energi dikumpulkan
- **Quiz Acak**: Menggunakan algoritma Fisher-Yates Shuffle
- **Soal**: 10 pertanyaan tentang konsep listrik dan efisiensi energi
- **Syarat**: Minimal 70% benar untuk lulus

### 6. Ending Cutscene
Ilmuwan ditemukan kembali dan memberikan pesan tentang pentingnya hemat energi.

## Algoritma yang Digunakan

### 1. Finite State Machine (FSM)
Mengatur transisi antar state dalam game:
- Loading → Opening Cutscene → Main Menu → Level 1-4 → Ending Cutscene
- Setiap state memiliki enter, update, dan exit methods
- Transisi berdasarkan kondisi tertentu

### 2. Fisher-Yates Shuffle
Digunakan untuk mengacak soal quiz:
- Menghasilkan urutan acak yang fair
- Mencegah pemain menghafal urutan soal
- Implementasi ringan dengan array dan perulangan

### 3. Perhitungan Energi Listrik
Rumus yang digunakan:
```
Energi(kWh) = P × t / 1000
```
Dimana:
- P = daya perangkat (Watt)
- t = lama pemakaian (jam)

## Teknologi yang Digunakan
- **Three.js**: Rendering 3D dan loading model GLTF
- **Web Audio API**: Sound effects dan background music
- **HTML5 Canvas**: Game rendering
- **CSS3**: UI styling dan animasi
- **JavaScript ES6+**: Game logic dan state management

## Cara Menjalankan Game

### 1. Persiapan
Pastikan Anda memiliki:
- Web server lokal (Live Server, XAMPP, atau sejenisnya)
- Browser modern yang mendukung WebGL

### 2. Instalasi
1. Clone atau download repository ini
2. Pastikan semua file 3D assets ada di folder `3D/`
3. Jalankan web server di root folder

### 4. Akses Game
Buka browser dan akses `http://localhost:port/index.html`

## Struktur File
```
/
├── index.html          # File utama HTML
├── styles.css          # Styling CSS
├── game.js            # Game logic utama
├── audio.js           # Audio system
├── README.md          # Dokumentasi
└── 3D/                # Folder assets 3D
    ├── ruangan/       # Model ruang tamu
    ├── dapur/         # Model dapur
    ├── laboratory/    # Model laboratorium
    ├── ruang bawah tanah/ # Model basement
    ├── baterai/       # Model baterai
    ├── lampu/         # Model lampu
    ├── saklar/        # Model saklar
    ├── tv/            # Model TV
    ├── ilmuwan/       # Model ilmuwan
    └── siswa smp/     # Model siswa
```

## Kontrol Game Unity-Style
- **Mouse**: 
  - Klik untuk berinteraksi dengan objek 3D
  - Hover untuk melihat efek visual
  - Drag & drop untuk menghubungkan komponen
  - Scroll untuk zoom in/out
- **Keyboard**:
  - WASD/Arrow Keys: Gerakan kamera
  - E/Enter: Interaksi dengan objek
  - Escape: Pause game
  - Q/Z: Kontrol kamera vertikal
- **Gamepad**:
  - Left Stick: Gerakan kamera
  - Right Stick: Rotasi kamera
  - A Button: Interaksi
  - B Button: Pause
  - Triggers: Zoom in/out
- **Touch**:
  - Tap untuk interaksi
  - Pinch untuk zoom
  - Drag untuk rotasi kamera
- **Camera Controls**:
  - Orbit, zoom, dan pan untuk eksplorasi 3D
  - Smooth camera transitions
- **UI**: Unity-style UI dengan animasi dan feedback
- **Audio**: Kontrol volume musik dan efek suara dengan spatial audio

## Fitur Edukasi
1. **Konsep Dasar Listrik**: Rangkaian tertutup, saklar, arus
2. **Efisiensi Energi**: Penggunaan peralatan yang bijak
3. **Perhitungan Tagihan**: Simulasi konsumsi energi bulanan
4. **Kesadaran Lingkungan**: Pentingnya hemat energi

## Target Pembelajaran
- Memahami konsep dasar listrik
- Mengetahui cara menghemat energi
- Menghitung konsumsi energi
- Mengembangkan kesadaran lingkungan

## Pengembangan
Game ini dikembangkan dengan fokus pada:
- Visual yang menarik seperti game Unity
- Gameplay yang edukatif namun menyenangkan
- UI/UX yang intuitif untuk siswa SMP
- Audio yang mendukung atmosfer game

## Lisensi
Game ini dibuat untuk tujuan edukasi. Asset 3D menggunakan lisensi yang sesuai dengan masing-masing model.

## Kontribusi
Untuk kontribusi atau feedback, silakan buat issue atau pull request.

---
**Energy Quest: Misteri Hemat Listrik** - Game Edukasi untuk Generasi Hemat Energi
const CACHE_NAME = 'app-sekolah-v1';
const ASSETS_TO_CACHE = [
  // 1. Halaman HTML Utama
  '/',
  '/login.html',
  '/db.js',
  '/manifest.json',

  // 2. Halaman TKJ
  '/dashboard_tkj.html',
  '/inventaris_tkj.html',
  '/manajemen_labor.html',

  // 3. Halaman UKS
  '/dashboard_uks.html',
  '/manajemen_obat.html',

  // 4. Halaman Sarpras
  '/dashboard_sarpras.html',
  '/inventaris_sarpras.html',

  // 5. Library CDN (PENTING: Agar tampilan tidak rusak saat offline)
  'https://fonts.googleapis.com/css?family=Source+Sans+Pro:300,400,400i,700&display=fallback',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/css/adminlte.min.css',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css',
  'https://code.jquery.com/jquery-3.6.0.min.js',
  'https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/admin-lte@3.2/dist/js/adminlte.min.js',
  'https://cdn.jsdelivr.net/npm/sweetalert2@11',
  'https://cdn-icons-png.flaticon.com/512/3048/3048122.png'
];

// --- INSTALL EVENT (Cache file saat pertama kali dibuka) ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Membuka cache...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// --- ACTIVATE EVENT (Hapus cache lama jika ada update) ---
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Menghapus cache lama:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// --- FETCH EVENT (Cek Cache dulu, baru Internet) ---
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Jika ada di cache, pakai itu. Jika tidak, ambil dari internet.
      return response || fetch(event.request);
    }).catch(() => {
        // Fallback jika offline total dan file tidak ada di cache (Opsional)
        // Bisa return halaman offline kustom jika mau
    })
  );
});
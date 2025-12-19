const DB_NAME = 'AppSekolahDB';
const DB_VERSION = 9; // Naik ke Versi 9 (User + TKJ + UKS + Sarpras + Labor)

// --- DAFTAR STORE ---
const STORE_USERS = 'users';
const STORE_IN = 'barang_masuk';
const STORE_OUT = 'barang_keluar';
const STORE_OBAT_IN = 'obat_masuk';
const STORE_OBAT_OUT = 'obat_keluar';
const STORE_SARPRAS_IN = 'sarpras_masuk';
const STORE_SARPRAS_OUT = 'sarpras_keluar';
const STORE_LABOR = 'labor_pc'; // BARU: Untuk Spesifikasi PC

const dbService = {
    openDB: function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Store yg sudah ada (User, TKJ, UKS, Sarpras) ...
                if (!db.objectStoreNames.contains(STORE_USERS)) {
                    const s = db.createObjectStore(STORE_USERS, { keyPath: 'id_user', autoIncrement: true });
                    s.createIndex('nama', 'nama', { unique: true });
                }
                if (!db.objectStoreNames.contains(STORE_IN)) db.createObjectStore(STORE_IN, { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains(STORE_OUT)) db.createObjectStore(STORE_OUT, { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains(STORE_OBAT_IN)) db.createObjectStore(STORE_OBAT_IN, { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains(STORE_OBAT_OUT)) db.createObjectStore(STORE_OBAT_OUT, { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains(STORE_SARPRAS_IN)) db.createObjectStore(STORE_SARPRAS_IN, { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains(STORE_SARPRAS_OUT)) db.createObjectStore(STORE_SARPRAS_OUT, { keyPath: 'id', autoIncrement: true });

                // --- STORE BARU: LABOR PC ---
                if (!db.objectStoreNames.contains(STORE_LABOR)) {
                    const store = db.createObjectStore(STORE_LABOR, { keyPath: 'id', autoIncrement: true });
                    store.createIndex('no_pc', 'no_pc', { unique: true }); // No PC harus unik (PC-01, PC-02)
                }
            };

            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject("DB Error");
        });
    },

    // --- FITUR UMUM (Register, Login, CRUD User, Transaksi) ---
    // (Kode ini sama persis seperti sebelumnya, saya singkat agar fokus ke fitur baru)
    register: async function(u) { const db=await this.openDB(); return new Promise((r,j)=>{ db.transaction([STORE_USERS],'readwrite').objectStore(STORE_USERS).add(u).onsuccess=()=>r("Ok"); db.transaction([STORE_USERS],'readwrite').onerror=()=>j("Gagal"); }); },
    login: async function(n,p) { const db=await this.openDB(); return new Promise((r,j)=>{ db.transaction([STORE_USERS],'readonly').objectStore(STORE_USERS).index('nama').get(n).onsuccess=(e)=>{ const u=e.target.result; if(u&&u.password===p)r(u); else j("Gagal"); }; }); },
    getAllUsers: async function() { const db=await this.openDB(); return new Promise(r=>db.transaction([STORE_USERS],'readonly').objectStore(STORE_USERS).getAll().onsuccess=e=>r(e.target.result)); },
    deleteUser: async function(id) { const db=await this.openDB(); return new Promise(r=>db.transaction([STORE_USERS],'readwrite').objectStore(STORE_USERS).delete(id).onsuccess=()=>r("Ok")); },
    updateUser: async function(data) { const db=await this.openDB(); return new Promise(r=>db.transaction([STORE_USERS],'readwrite').objectStore(STORE_USERS).put(data).onsuccess=()=>r("Ok")); },
    getUserById: async function(id) { const db=await this.openDB(); return new Promise(r=>db.transaction([STORE_USERS],'readonly').objectStore(STORE_USERS).get(Number(id)).onsuccess=e=>r(e.target.result)); },
    
    addTransaction: async function(type, data) {
        const db = await this.openDB();
        let sn = (type=='masuk')?STORE_IN:(type=='keluar')?STORE_OUT:(type=='obat_masuk')?STORE_OBAT_IN:(type=='obat_keluar')?STORE_OBAT_OUT:(type=='sarpras_masuk')?STORE_SARPRAS_IN:STORE_SARPRAS_OUT;
        return new Promise((r,j)=>{ db.transaction([sn],'readwrite').objectStore(sn).add(data).onsuccess=()=>r("Ok"); db.transaction([sn],'readwrite').onerror=()=>j("Gagal"); });
    },
    getTransactions: async function(type) {
        const db = await this.openDB();
        let sn = (type=='masuk')?STORE_IN:(type=='keluar')?STORE_OUT:(type=='obat_masuk')?STORE_OBAT_IN:(type=='obat_keluar')?STORE_OBAT_OUT:(type=='sarpras_masuk')?STORE_SARPRAS_IN:STORE_SARPRAS_OUT;
        return new Promise(r=>db.transaction([sn],'readonly').objectStore(sn).getAll().onsuccess=e=>r(e.target.result));
    },
    deleteTransaction: async function(type, id) {
        const db = await this.openDB();
        let sn = (type=='masuk')?STORE_IN:(type=='keluar')?STORE_OUT:(type=='obat_masuk')?STORE_OBAT_IN:(type=='obat_keluar')?STORE_OBAT_OUT:(type=='sarpras_masuk')?STORE_SARPRAS_IN:STORE_SARPRAS_OUT;
        return new Promise(r=>db.transaction([sn],'readwrite').objectStore(sn).delete(id).onsuccess=()=>r(true));
    },
    _calculateStock: async function(sIn, sOut) {
        const db=await this.openDB(); const m=await new Promise(r=>db.transaction([sIn],'readonly').objectStore(sIn).getAll().onsuccess=e=>r(e.target.result)); const k=await new Promise(r=>db.transaction([sOut],'readonly').objectStore(sOut).getAll().onsuccess=e=>r(e.target.result));
        let map={}; m.forEach(i=>{ let key=i.id_barang.toUpperCase(); if(!map[key])map[key]={...i,total:0}; map[key].total+=Number(i.jumlah); }); k.forEach(i=>{ let key=i.id_barang.toUpperCase(); if(map[key])map[key].total-=Number(i.jumlah); }); return map;
    },
    getStock: async function() { return this._calculateStock(STORE_IN, STORE_OUT); },
    getStockSarpras: async function() { return this._calculateStock(STORE_SARPRAS_IN, STORE_SARPRAS_OUT); },
    getStockObat: async function() { /* ...sama seperti sebelumnya... */ 
        const db=await this.openDB(); const m=await new Promise(r=>db.transaction([STORE_OBAT_IN],'readonly').objectStore(STORE_OBAT_IN).getAll().onsuccess=e=>r(e.target.result)); const k=await new Promise(r=>db.transaction([STORE_OBAT_OUT],'readonly').objectStore(STORE_OBAT_OUT).getAll().onsuccess=e=>r(e.target.result));
        let map={}; m.forEach(i=>{ let key=i.id_obat.toUpperCase(); if(!map[key])map[key]={...i,total:0}; map[key].total+=Number(i.jumlah); }); k.forEach(i=>{ let key=i.id_obat.toUpperCase(); if(map[key])map[key].total-=Number(i.jumlah); }); return map;
    },

    // =========================================
    // FITUR KHUSUS: MANAJEMEN KOMPUTER LABOR
    // =========================================
    
    // 1. Tambah Data PC
    addPC: async function(data) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([STORE_LABOR], 'readwrite');
            const req = tx.objectStore(STORE_LABOR).add(data);
            req.onsuccess = () => resolve("Berhasil");
            req.onerror = () => reject("No PC sudah ada!");
        });
    },

    // 2. Ambil Semua Data PC
    getAllPC: async function() {
        const db = await this.openDB();
        return new Promise((resolve) => {
            const tx = db.transaction([STORE_LABOR], 'readonly');
            tx.objectStore(STORE_LABOR).getAll().onsuccess = (e) => resolve(e.target.result);
        });
    },

    // 3. Ambil 1 PC (Untuk Edit)
    getPCById: async function(id) {
        const db = await this.openDB();
        return new Promise((resolve) => {
            const tx = db.transaction([STORE_LABOR], 'readonly');
            tx.objectStore(STORE_LABOR).get(Number(id)).onsuccess = (e) => resolve(e.target.result);
        });
    },

    // 4. Update PC
    updatePC: async function(data) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([STORE_LABOR], 'readwrite');
            const req = tx.objectStore(STORE_LABOR).put(data);
            req.onsuccess = () => resolve("Berhasil Update");
            req.onerror = () => reject("Gagal Update");
        });
    },

    // 5. Hapus PC
    deletePC: async function(id) {
        const db = await this.openDB();
        return new Promise((resolve) => {
            const tx = db.transaction([STORE_LABOR], 'readwrite');
            tx.objectStore(STORE_LABOR).delete(Number(id)).onsuccess = () => resolve(true);
        });
    }
    
};

// =========================================
// PWA REGISTRATION (Service Worker & Manifest)
// =========================================

// 1. Inject Link Manifest ke <head> secara otomatis
const linkManifest = document.createElement('link');
linkManifest.rel = 'manifest';
linkManifest.href = 'manifest.json';
document.head.appendChild(linkManifest);

// 2. Daftarkan Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('PWA Service Worker terdaftar:', reg.scope))
            .catch(err => console.log('Gagal daftar Service Worker:', err));
    });
}
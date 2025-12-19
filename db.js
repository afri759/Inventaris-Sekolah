const DB_NAME = 'AppSekolahDB';
const DB_VERSION = 10; // Naik ke Versi 10 (User + TKJ + UKS + Sarpras + Labor + Pasien)

// --- DAFTAR STORE ---
const STORE_USERS = 'users';
const STORE_IN = 'barang_masuk';
const STORE_OUT = 'barang_keluar';
const STORE_OBAT_IN = 'obat_masuk';
const STORE_OBAT_OUT = 'obat_keluar';
const STORE_SARPRAS_IN = 'sarpras_masuk';
const STORE_SARPRAS_OUT = 'sarpras_keluar';
const STORE_LABOR = 'labor_pc';
const STORE_PASIEN = 'uks_pasien'; // BARU: Data Pasien

const dbService = {
    openDB: function() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Store yg sudah ada...
                if (!db.objectStoreNames.contains(STORE_USERS)) { const s = db.createObjectStore(STORE_USERS, { keyPath: 'id_user', autoIncrement: true }); s.createIndex('nama', 'nama', { unique: true }); }
                if (!db.objectStoreNames.contains(STORE_IN)) db.createObjectStore(STORE_IN, { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains(STORE_OUT)) db.createObjectStore(STORE_OUT, { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains(STORE_OBAT_IN)) db.createObjectStore(STORE_OBAT_IN, { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains(STORE_OBAT_OUT)) db.createObjectStore(STORE_OBAT_OUT, { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains(STORE_SARPRAS_IN)) db.createObjectStore(STORE_SARPRAS_IN, { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains(STORE_SARPRAS_OUT)) db.createObjectStore(STORE_SARPRAS_OUT, { keyPath: 'id', autoIncrement: true });
                if (!db.objectStoreNames.contains(STORE_LABOR)) { const s = db.createObjectStore(STORE_LABOR, { keyPath: 'id', autoIncrement: true }); s.createIndex('no_pc', 'no_pc', { unique: true }); }

                // --- STORE BARU: PASIEN UKS ---
                if (!db.objectStoreNames.contains(STORE_PASIEN)) {
                    db.createObjectStore(STORE_PASIEN, { keyPath: 'id', autoIncrement: true });
                }
            };

            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = (event) => reject("DB Error");
        });
    },

    // --- FITUR UMUM (User, Transaksi, Stok, Labor) ---
    // (Kode disingkat agar tidak terlalu panjang, fungsinya SAMA PERSIS seperti sebelumnya)
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
    // Fungsi Stok
    _calculateStock: async function(sIn, sOut) { const db=await this.openDB(); const m=await new Promise(r=>db.transaction([sIn],'readonly').objectStore(sIn).getAll().onsuccess=e=>r(e.target.result)); const k=await new Promise(r=>db.transaction([sOut],'readonly').objectStore(sOut).getAll().onsuccess=e=>r(e.target.result)); let map={}; m.forEach(i=>{ let key=i.id_barang.toUpperCase(); if(!map[key])map[key]={...i,total:0}; map[key].total+=Number(i.jumlah); }); k.forEach(i=>{ let key=i.id_barang.toUpperCase(); if(map[key])map[key].total-=Number(i.jumlah); }); return map; },
    getStock: async function() { return this._calculateStock(STORE_IN, STORE_OUT); },
    getStockSarpras: async function() { return this._calculateStock(STORE_SARPRAS_IN, STORE_SARPRAS_OUT); },
    getStockObat: async function() { const db=await this.openDB(); const m=await new Promise(r=>db.transaction([STORE_OBAT_IN],'readonly').objectStore(STORE_OBAT_IN).getAll().onsuccess=e=>r(e.target.result)); const k=await new Promise(r=>db.transaction([STORE_OBAT_OUT],'readonly').objectStore(STORE_OBAT_OUT).getAll().onsuccess=e=>r(e.target.result)); let map={}; m.forEach(i=>{ let key=i.id_obat.toUpperCase(); if(!map[key])map[key]={...i,total:0}; map[key].total+=Number(i.jumlah); }); k.forEach(i=>{ let key=i.id_obat.toUpperCase(); if(map[key])map[key].total-=Number(i.jumlah); }); return map; },
    
    // Fungsi Labor PC
    addPC: async function(d){ const db=await this.openDB(); return new Promise((r,j)=>{ const tx=db.transaction([STORE_LABOR],'readwrite'); tx.objectStore(STORE_LABOR).add(d).onsuccess=()=>r("Ok"); tx.objectStore(STORE_LABOR).onerror=()=>j("Gagal"); }); },
    getAllPC: async function(){ const db=await this.openDB(); return new Promise(r=>db.transaction([STORE_LABOR],'readonly').objectStore(STORE_LABOR).getAll().onsuccess=e=>r(e.target.result)); },
    getPCById: async function(id){ const db=await this.openDB(); return new Promise(r=>db.transaction([STORE_LABOR],'readonly').objectStore(STORE_LABOR).get(Number(id)).onsuccess=e=>r(e.target.result)); },
    updatePC: async function(d){ const db=await this.openDB(); return new Promise(r=>db.transaction([STORE_LABOR],'readwrite').objectStore(STORE_LABOR).put(d).onsuccess=()=>r("Ok")); },
    deletePC: async function(id){ const db=await this.openDB(); return new Promise(r=>db.transaction([STORE_LABOR],'readwrite').objectStore(STORE_LABOR).delete(Number(id)).onsuccess=()=>r(true)); },

    // =========================================
    // FITUR KHUSUS: DATA PASIEN UKS (BARU)
    // =========================================
    
    addPasien: async function(data) {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction([STORE_PASIEN], 'readwrite');
            tx.objectStore(STORE_PASIEN).add(data).onsuccess = () => resolve("Data Pasien Disimpan");
            tx.onerror = () => reject("Gagal");
        });
    },

    getAllPasien: async function() {
        const db = await this.openDB();
        return new Promise((resolve) => {
            const tx = db.transaction([STORE_PASIEN], 'readonly');
            tx.objectStore(STORE_PASIEN).getAll().onsuccess = (e) => resolve(e.target.result);
        });
    },

    deletePasien: async function(id) {
        const db = await this.openDB();
        return new Promise((resolve) => {
            const tx = db.transaction([STORE_PASIEN], 'readwrite');
            tx.objectStore(STORE_PASIEN).delete(id).onsuccess = () => resolve(true);
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

// === Utility Functions ===
function parseRupiah(str) {
    if (!str) return 0;
    return parseInt(str.toString().replace(/[^,\d]/g, '')) || 0;
}

function formatRupiahString(angka, prefix = '') {
    if (angka === null || angka === undefined || isNaN(angka)) angka = 0;
    let isNegative = angka < 0;
    let number_string = Math.abs(Math.round(angka)).toString().replace(/[^,\d]/g, ''),
        split = number_string.split(','),
        sisa = split[0].length % 3,
        rupiah = split[0].substr(0, sisa),
        ribuan = split[0].substr(sisa).match(/\d{3}/gi);
        
    if(ribuan){
        let separator = sisa ? '.' : '';
        rupiah += separator + ribuan.join('.');
    }
    
    let result = prefix + rupiah;
    return isNegative ? '-' + result : result;
}

function formatRupiathEvent(e) {
    let val = parseRupiah(e.target.value);
    if(val === 0 && e.target.value === '') {
        e.target.value = '';
    } else {
        e.target.value = formatRupiahString(val);
    }
    if(document.getElementById('formView').classList.contains('block') || !document.getElementById('formView').classList.contains('hidden')) {
        calculatePreview();
    }
    if(e.target.id === 'mmHpp' || e.target.id === 'mmMarkupVal') {
         calculateMasterSimulasi();
    }
}

// === Data Management ===
const STORAGE_KEY = 'productList';
const MASTER_KEY = 'masterDataList';
const PLATFORM_CONF_KEY = 'platformConfigDataList';

let activePlatformMenu = 'all'; 
let activePlatformTab = 'all';
let activeKategoriTab = 'all';

function getLocalData() {
    let data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}
function setLocalData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getMasterData() {
    let m = localStorage.getItem(MASTER_KEY);
    return m ? JSON.parse(m) : [];
}
function setMasterData(data) {
    localStorage.setItem(MASTER_KEY, JSON.stringify(data));
}

function getPlatformConfigs() {
    let m = localStorage.getItem(PLATFORM_CONF_KEY);
    if (m) return JSON.parse(m);
    
    // Default legacy data
    let defaults = [
        {
            id: 'shopee-default',
            namaPlatform: 'Shopee',
            biayaLayanan: [
                {nama: 'Admin Star (Furniture)', persen: 10, maksimalRp: 0},
                {nama: 'Promo XTRA', persen: 4.5, maksimalRp: 60000},
                {nama: 'Ongkir XTRA', persen: 5, maksimalRp: 40000},
                {nama: 'Biaya Proses', persen: 0, maksimalRp: 1250}
            ],
            tanggalDibuat: new Date().toISOString()
        },
        {
            id: 'tiktok-default',
            namaPlatform: 'Tiktok',
            biayaLayanan: [
                {nama: 'Komisi Kategori', persen: 10, maksimalRp: 0},
                {nama: 'Komisi Dinamis', persen: 6, maksimalRp: 40000},
                {nama: 'Program XBP', persen: 4.5, maksimalRp: 60000},
                {nama: 'Biaya Proses Pesanan', persen: 0, maksimalRp: 1250}
            ],
            tanggalDibuat: new Date().toISOString()
        }
    ];
    setPlatformConfigs(defaults);
    return defaults;
}
function setPlatformConfigs(data) {
    localStorage.setItem(PLATFORM_CONF_KEY, JSON.stringify(data));
    updatePlatformDatalist();
}
function updatePlatformDatalist() {
    const list = document.getElementById('platformOptions');
    if (!list) return;
    const configs = getPlatformConfigs();
    let html = '';
    configs.forEach(c => html += `<option value="${c.namaPlatform}"></option>`);
    list.innerHTML = html;
}

// === View Management (SPA) ===
const listView = document.getElementById('listView');
const formView = document.getElementById('formView');
const detailView = document.getElementById('detailView');
const masterView = document.getElementById('masterView');
const platConfView = document.getElementById('platConfView');
const pageTitle = document.getElementById('pageTitle');
const searchInput = document.getElementById('searchInput');

window.showListView = function() {
    formView.classList.add('hidden');
    detailView.classList.add('hidden');
    masterView.classList.add('hidden');
    platConfView.classList.add('hidden');
    listView.classList.remove('hidden');
    listView.classList.add('block');
    refreshPlatformMenu();
    buildTabs();
    renderListView();
    updatePageTitle();
    resetForm();
    window.scrollTo({ top: 0, behavior: 'instant' });
}

window.showFormView = function(isEdit = false) {
    listView.classList.add('hidden');
    listView.classList.remove('block');
    detailView.classList.add('hidden');
    masterView.classList.add('hidden');
    platConfView.classList.add('hidden');
    formView.classList.remove('hidden');
    formView.classList.add('block');
    
    refreshMasterDatalist();
    pageTitle.textContent = isEdit ? 'Edit Harga' : 'Buat Harga Baru';
    if(!isEdit) resetForm();
    window.scrollTo({ top: 0, behavior: 'instant' });
}

window.showDetailView = function(id) {
    const item = getLocalData().find(d => String(d.id) === String(id));
    if(!item) return;

    listView.classList.add('hidden');
    listView.classList.remove('block');
    formView.classList.add('hidden');
    masterView.classList.add('hidden');
    platConfView.classList.add('hidden');
    detailView.classList.remove('hidden');
    detailView.classList.add('block');
    
    pageTitle.textContent = 'Detail Produk';
    
    populateDetailView(item);
    window.scrollTo({ top: 0, behavior: 'instant' });
}

window.showMasterView = function() {
    listView.classList.add('hidden');
    listView.classList.remove('block');
    formView.classList.add('hidden');
    detailView.classList.add('hidden');
    platConfView.classList.add('hidden');
    masterView.classList.remove('hidden');
    masterView.classList.add('block');
    
    activePlatformMenu = 'master'; // Highlight state in sidebar
    refreshPlatformMenu();
    pageTitle.textContent = 'Master Data Produk';
    renderMasterView();
    window.scrollTo({ top: 0, behavior: 'instant' });
}

function updatePageTitle() {
    if(activePlatformMenu === 'master') pageTitle.textContent = 'Master Data Produk';
    else if(activePlatformMenu === 'platconf') pageTitle.textContent = 'Konfigurasi Platform';
    else if(activePlatformMenu === 'all') pageTitle.textContent = 'Semua Beranda';
    else if(activePlatformMenu === 'profit') pageTitle.textContent = 'Analisis Profit';
    else {
        let pName = activePlatformMenu.toUpperCase();
        pageTitle.textContent = 'Platform: ' + pName;
    }
}


// === DOM Elements (Form) ===
const form = document.getElementById('calculatorForm');
const platInput = document.getElementById('platform');
const katInput = document.getElementById('kategori');
const merkInput = document.getElementById('merk');
const namaInput = document.getElementById('namaProduk');

const hppInput = document.getElementById('hpp');
const adminHppPersen = document.getElementById('adminHppPersen');
const markupPersen = document.getElementById('markupPersen');
const diskonPersen = document.getElementById('diskonPersen');
const platformFeesContainer = document.getElementById('platformFeesContainer');
const btnAddPlatform = document.getElementById('btnAddPlatform');
const btnReset = document.getElementById('btnReset');
const btnBatalEdit = document.getElementById('btnBatalEdit');
const editIdInput = document.getElementById('editId');
const editBadge = document.getElementById('editBadge');


// === Initialize App ===
document.addEventListener('DOMContentLoaded', () => {
    updatePlatformDatalist();
    
    // Navigations
    document.getElementById('btnSidenavNew').addEventListener('click', () => showFormView());
    document.getElementById('btnMobileNew').addEventListener('click', () => showFormView());
    document.getElementById('btnMobileMenu').addEventListener('click', () => {
        const data = getLocalData();
        let plats = new Set();
        data.forEach(item => {
            let p = (item.platform || item.sku || 'Lainnya').trim().toUpperCase();
            plats.add(p);
        });
        const sortedPlats = Array.from(plats).sort();
        
        let html = `
            <div class="flex flex-col gap-2 mt-4 text-left">
                <button onclick="Swal.close(); showMasterView()" class="w-full text-left bg-indigo-50 border border-indigo-100 hover:bg-slate-100 px-4 py-3 rounded-xl flex items-center shadow-sm">
                    <i class="fa-solid fa-database text-indigo-500 mr-3 text-lg w-6 text-center"></i>
                    <div><span class="block font-bold text-indigo-800 text-sm tracking-wide">Master Data Produk</span></div>
                </button>
                <div class="h-px bg-gray-200 my-1"></div>
                <button onclick="Swal.close(); setPlatformMenu('all')" class="w-full text-left bg-blue-50 border border-blue-100 hover:bg-blue-100 px-4 py-3 rounded-xl flex items-center shadow-sm">
                    <i class="fa-solid fa-layer-group text-blue-500 mr-3 text-lg w-6 text-center"></i>
                    <div><span class="block font-bold text-blue-800 text-sm tracking-wide">Beranda (Semua)</span></div>
                </button>
        `;
        
        sortedPlats.forEach(p => {
            const pKey = p.toLowerCase();
            let iconCls = 'fa-solid fa-store';
            
            html += `
                <button onclick="Swal.close(); setPlatformMenu('${pKey.replace(/'/g, "\\\\'")}')" class="w-full text-left bg-white border border-gray-200 hover:bg-gray-50 px-4 py-3 rounded-xl flex items-center shadow-sm mt-1 group">
                    <i class="${iconCls} text-gray-400 group-hover:text-blue-500 mr-3 text-lg w-6 text-center transition-colors"></i>
                    <div><span class="block font-bold text-gray-700 text-sm tracking-wide">${p}</span></div>
                </button>
            `;
        });
        
        html += `
                <button onclick="Swal.close(); setPlatformMenu('profit')" class="w-full text-left bg-red-50 border border-red-100 hover:bg-red-100 px-4 py-3 rounded-xl flex items-center shadow-sm mt-2 group">
                    <i class="fa-solid fa-chart-line text-red-500 mr-3 text-lg w-6 text-center"></i>
                    <div><span class="block font-bold text-red-800 text-sm tracking-wide">Analisis Profit</span></div>
                </button>
        `;
        
        html += `</div>`;
        
        Swal.fire({
            title: 'Menu Navigasi',
            html: html,
            showConfirmButton: false,
            showCloseButton: true
        });
    });
    
    document.getElementById('btnMobileSettings').addEventListener('click', () => {
        Swal.fire({
            title: 'Pengaturan',
            html: `
                <div class="flex flex-col gap-3 mt-4">
                    <button onclick="Swal.close(); showReverseModal()" class="w-full text-left bg-blue-50 border border-blue-100 hover:bg-blue-100 px-4 py-3 rounded-xl flex items-center shadow-sm">
                        <i class="fa-solid fa-calculator text-blue-500 mr-3 text-lg w-6 text-center"></i>
                        <div>
                            <span class="block font-bold text-blue-800 text-sm">Reverse Kalkulator</span>
                            <span class="block text-[10px] text-blue-500">Cari HPP dari Harga Coret</span>
                        </div>
                    </button>
                    <button onclick="Swal.close(); handleExport()" class="w-full text-left bg-white border border-gray-200 hover:bg-gray-50 px-4 py-3 rounded-xl flex items-center shadow-sm">
                        <i class="fa-solid fa-download text-indigo-500 mr-3 text-lg w-6 text-center"></i>
                        <div>
                            <span class="block font-bold text-gray-800 text-sm">Ekspor (Backup JSON)</span>
                            <span class="block text-[10px] text-gray-500">Amankan data harga ke HP Anda</span>
                        </div>
                    </button>
                    <button onclick="Swal.close(); showMagicModal()" class="w-full text-left bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 hover:from-purple-100 hover:to-pink-100 px-4 py-3 rounded-xl flex items-center shadow-sm">
                        <i class="fa-solid fa-wand-magic-sparkles text-purple-500 mr-3 text-lg w-6 text-center"></i>
                        <div>
                            <span class="block font-bold text-purple-800 text-sm">Buat Data Otomatis</span>
                            <span class="block text-[10px] text-purple-500">Hitung semua produk ke platform instan</span>
                        </div>
                    </button>
                    <button onclick="Swal.close(); document.getElementById('inputFileImpor').click()" class="w-full text-left bg-white border border-gray-200 hover:bg-gray-50 px-4 py-3 rounded-xl flex items-center shadow-sm">
                        <i class="fa-solid fa-upload text-blue-500 mr-3 text-lg w-6 text-center"></i>
                        <div>
                            <span class="block font-bold text-gray-800 text-sm">Impor (Restore JSON)</span>
                            <span class="block text-[10px] text-gray-500">Masukan data dari PC atau HP lain</span>
                        </div>
                    </button>
                    <button onclick="Swal.close(); window.handleDeleteData()" class="w-full text-left bg-red-50 border border-red-100 hover:bg-red-100 px-4 py-3 rounded-xl flex items-center shadow-sm">
                        <i class="fa-solid fa-trash-can text-red-500 mr-3 text-lg w-6 text-center"></i>
                        <div>
                            <span class="block font-bold text-red-800 text-sm">Hapus Data</span>
                            <span class="block text-[10px] text-red-500">Pilihan hapus sebagian / keseluruhan</span>
                        </div>
                    </button>
                </div>
            `,
            showConfirmButton: false,
            showCloseButton: true
        });
    });
    
    // Sort Event
    document.getElementById('sortSelect').addEventListener('change', renderListView);

    // Form Realtime Event Listeners
    hppInput.addEventListener('input', formatRupiathEvent);
    [adminHppPersen, markupPersen, diskonPersen].forEach(input => {
        input.addEventListener('input', calculatePreview);
        input.addEventListener('blur', function() {
            if(this.value === '') this.value = '0';
        });
    });

    btnAddPlatform.addEventListener('click', () => addPlatformFeeForm());
    
    // Setup Datalists logic
    platInput.addEventListener('change', handlePlatformChange);
    platInput.addEventListener('input', function(e) {
        if(e.inputType === "insertReplacementText" || e.inputType === undefined) handlePlatformChange(); 
    });
    
    // Master data autocomplete trigger
    namaInput.addEventListener('input', handleMasterAutocomplete);

    form.addEventListener('submit', handleFormSubmit);
    btnReset.addEventListener('click', resetForm);
    btnBatalEdit.addEventListener('click', () => { resetForm(); showListView(); });
    
    // Search Listener
    searchInput.addEventListener('input', renderListView);

    // Reverse Calculator (listener now in HTML inline)

    // Export Import
    document.getElementById('btnEksporSidenav').addEventListener('click', handleExport);
    document.getElementById('btnImporSidenav').addEventListener('click', () => document.getElementById('inputFileImpor').click());
    document.getElementById('inputFileImpor').addEventListener('change', handleImport);
    if(document.getElementById('btnHapusSidenav')) {
        document.getElementById('btnHapusSidenav').addEventListener('click', window.handleDeleteData);
    }
    
    // Import Master Excel
    if(document.getElementById('inputImportMaster')) {
        document.getElementById('inputImportMaster').addEventListener('change', handleImportMasterExcel);
    }
    
    // Import Harga Excel
    if(document.getElementById('inputImportHarga')) {
        document.getElementById('inputImportHarga').addEventListener('change', handleImportHargaExcel);
    }
    
    // Master Modal Listeners
    if(document.getElementById('mmHpp')) {
        document.getElementById('mmHpp').addEventListener('input', formatRupiathEvent);
    }

    showListView();
});

// Platform Auto Fees Logic
function handlePlatformChange() {
    if (editIdInput.value !== '') return; 
    let plat = platInput.value.trim().toLowerCase();
    
    if (plat === 'tiktok' || plat === 'shopee') {
        platformFeesContainer.innerHTML = ''; 
        
        if (plat === 'tiktok') {
            addPlatformFeeForm('Komisi Kategori', 10, 0);
            addPlatformFeeForm('Komisi Dinamis', 6, 40000);
            addPlatformFeeForm('Program XBP', 4.5, 60000);
            addPlatformFeeForm('Biaya Proses Pesanan', 0, 1250);
        } else if (plat === 'shopee') {
            addPlatformFeeForm('Admin Star (Furniture)', 10, 0);
            addPlatformFeeForm('Promo XTRA', 4.5, 60000);
            addPlatformFeeForm('Ongkir XTRA', 5, 40000);
            addPlatformFeeForm('Biaya Proses', 0, 1250);
        }
    }
}

// === Master Data Modal & Sync Logic ===

function handleMasterAutocomplete(e) {
    if (editIdInput.value !== '') return; 
    const val = e.target.value.trim().toLowerCase();
    if(!val) return;
    
    const masters = getMasterData();
    const found = masters.find(m => m.namaProduk.toLowerCase() === val);
    if(found) {
        if(found.kategori) katInput.value = found.kategori;
        if(found.merk) merkInput.value = found.merk;
        if(found.hpp > 0) {
            hppInput.value = formatRupiahString(found.hpp);
            calculatePreview();
        }
    }
}

function refreshMasterDatalist() {
    const list = document.getElementById('masterDataOptions');
    if(!list) return;
    list.innerHTML = '';
    const masters = getMasterData();
    masters.forEach(m => {
        let opt = document.createElement('option');
        opt.value = m.namaProduk;
        list.appendChild(opt);
    });
}

window.showMasterModal = function(id = 'new') {
    const modal = document.getElementById('masterModal');
    const title = document.getElementById('masterModalTitle');
    
    document.getElementById('masterForm').reset();
    document.getElementById('mmId').value = '';
    
    if(id !== 'new') {
        let masters = getMasterData();
        let m = masters.find(x => String(x.id) === String(id));
        if(m) {
            title.textContent = 'Edit Master Data';
            document.getElementById('mmId').value = m.id;
            document.getElementById('mmNama').value = m.namaProduk;
            document.getElementById('mmKat').value = m.kategori || '';
            document.getElementById('mmMerk').value = m.merk || '';
            document.getElementById('mmHpp').value = formatRupiahString(m.hpp);
        }
    } else {
        title.textContent = 'Tambah Master Baru';
    }
    
    modal.classList.remove('hidden');
    // slight delay for animation
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        document.getElementById('masterModalContent').classList.remove('scale-95');
    }, 10);
}

window.closeMasterModal = function() {
    const modal = document.getElementById('masterModal');
    modal.classList.add('opacity-0');
    document.getElementById('masterModalContent').classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

window.saveMasterDataManual = function(e) {
    e.preventDefault();
    let id = document.getElementById('mmId').value;
    let nama = document.getElementById('mmNama').value.trim();
    let kat = document.getElementById('mmKat').value.trim() || '';
    let merk = document.getElementById('mmMerk').value.trim() || '';
    let hpp = parseRupiah(document.getElementById('mmHpp').value);
    
    let masters = getMasterData();
    let isDupe = masters.some(m => m.namaProduk.toLowerCase() === nama.toLowerCase() && String(m.id) !== String(id));
    if (isDupe) return Swal.fire({icon: 'error', text: `Nama produk "${nama}" sudah terdaftar di Master Data! Silakan gunakan nama lain.`});
    
    let payload = {
        id: id || Date.now().toString(),
        namaProduk: nama,
        kategori: kat,
        merk: merk,
        hpp: hpp,
        tanggalDibuat: new Date().toISOString()
    };
    
    let oldNama = '';
    if(id) {
        let p = masters.find(m => String(m.id) === String(id));
        if(p) {
            payload.tanggalDibuat = p.tanggalDibuat;
            oldNama = p.namaProduk;
        }
        masters = masters.map(m => String(m.id) === String(id) ? payload : m);
    } else {
        masters.push(payload);
    }
    setMasterData(masters);
    
    // Auto Update Platform Data
    let localData = getLocalData();
    let updatedLocal = localData.map(item => {
        let isMatch = false;
        if (oldNama && item.namaProduk.toLowerCase() === oldNama.toLowerCase()) isMatch = true;
        else if (!oldNama && item.namaProduk.toLowerCase() === nama.toLowerCase()) isMatch = true;
        
        if (isMatch) {
            let feesArr = item.platformFees || [];
            let hCalc = calculateProfitSilently(hpp, parseFloat(item.adminHppPersen)||0, parseFloat(item.markupPersen)||0, parseFloat(item.diskonPersen)||0, feesArr);
            return { ...item, namaProduk: nama, hpp: hpp, kategori: kat, merk: merk, hasil: hCalc };
        }
        return item;
    });
    setLocalData(updatedLocal);
    renderListView();
    refreshPlatformMenu();

    closeMasterModal();
    renderMasterView();
    Swal.fire({icon:'success', title: 'Berhasil & Tersinkron!', timer:1500, showConfirmButton:false});
}

window.downloadMasterTemplate = function() {
    const ws_data = [
        ["Nama Produk", "Kategori", "Merk", "HPP (Modal)"], // Header
        ["Contoh: Meja Lipat", "Perabotan", "IKEA", 85000],
        ["Contoh: Lemari Plastik", "Perabotan", "Napolly", 150000],
        ["Contoh: Kaos Polos", "Pakaian", "Erigo", 35000]
    ];
    
    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    
    // Adjust column widths
    const wscols = [{wch: 30}, {wch: 15}, {wch: 15}, {wch: 15}];
    ws['!cols'] = wscols;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Master");
    
    // Export and download
    XLSX.writeFile(wb, "Template_Master_Data.xlsx");
}

function handleImportMasterExcel(e) {
    const file = e.target.files[0];
    if(!file) return;
    
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const firstSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheet];
            const json = XLSX.utils.sheet_to_json(worksheet, {header: 1}); // Read as array of arrays
            
            if(json.length < 2) throw new Error('Format Kosong');
            
            // Expected headers: Nama Produk, Kategori, Merk, HPP, Tipe Markup(persen/nominal), Nilai Markup, Pembulatan(none, ratusan, ribuan)
            // Or fallback naive importing assuming column orders or just guessing.
            // Let's iterate from row 1 (0 is header)
            let masters = getMasterData();
            let addedCount = 0;
            
            const headers = json[0].map(h => String(h).toLowerCase());
            const iNama = headers.findIndex(h => h.includes('nama'));
            const iKat = headers.findIndex(h => h.includes('kategori'));
            const iMerk = headers.findIndex(h => h.includes('merk') || h.includes('brand'));
            const iHpp = headers.findIndex(h => h.includes('hpp') || h.includes('modal'));
            
            if(iNama === -1 || iHpp === -1) {
                return Swal.fire({icon:'error', text: 'Template File Excel salah! Minimal wajib ada kolom "Nama Produk" dan "HPP" / "Modal"'});
            }

            for(let i=1; i<json.length; i++) {
                let row = json[i];
                if(!row[iNama]) continue;
                
                let nama = String(row[iNama]).trim();
                let hppVal = parseRupiah(row[iHpp] || 0);
                
                // Skip duplicated items to enforce uniqueness
                let exists = masters.some(m => m.namaProduk.toLowerCase() === nama.toLowerCase());
                if(exists) continue;
                
                let kat = iKat !== -1 ? String(row[iKat] || '').trim() : '';
                let merk = iMerk !== -1 ? String(row[iMerk] || '').trim() : '';
                
                if(nama && hppVal > 0) {
                    masters.push({
                         id: Date.now().toString() + Math.floor(Math.random() * 9999) + i,
                         namaProduk: nama,
                         kategori: kat,
                         merk: merk,
                         hpp: hppVal,
                         tanggalDibuat: new Date().toISOString()
                    });
                    addedCount++;
                }
            }
            
            setMasterData(masters);
            renderMasterView();
            Swal.fire({icon:'success', text: `Berhasil mengimpor ${addedCount} data Master baru!`});
            
        } catch(err) {
             Swal.fire({icon:'error', text: 'Gagal memproses file Excel: ' + err.message});
        }
        e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
}

// === Sidebar Logic (Platform Menu) ===
function refreshPlatformMenu() {
    const data = getLocalData();
    const container = document.getElementById('platformMenu');
    
    // Collect unique Platforms
    let plats = new Set();
    data.forEach(item => {
        let p = (item.platform || item.sku || 'Lainnya').trim().toUpperCase();
        plats.add(p);
    });
    
    // Sort Alphabetically
    const sortedPlats = Array.from(plats).sort();
    
    // Render Beranda
    let html = `
        <a href="#" onclick="showMasterView(); return false;" class="nav-item ${activePlatformMenu === 'master' ? 'bg-indigo-50 text-indigo-700 font-bold border-indigo-100 shadow-sm' : 'text-gray-600 hover:bg-gray-50 border-transparent'} group flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors border mb-2">
            <i class="fa-solid fa-database ${activePlatformMenu === 'master' ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'} min-w-8 text-lg"></i> Master Data
        </a>
        <a href="#" onclick="setPlatformMenu('all'); return false;" class="nav-item ${activePlatformMenu === 'all' ? 'bg-blue-50 text-blue-700 font-bold border-blue-100 shadow-sm' : 'text-gray-600 hover:bg-gray-50 border-transparent'} group flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors border mb-2">
            <i class="fa-solid fa-layer-group ${activePlatformMenu === 'all' ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'} min-w-8 text-lg"></i> Beranda
        </a>
    `;
    
    sortedPlats.forEach(p => {
        const pKey = p.toLowerCase();
        const isActive = activePlatformMenu === pKey;
        let iconClass = 'fa-solid fa-store';

        html += `
            <a href="#" onclick="setPlatformMenu('${pKey.replace(/'/g, "\\Warehouse")}'); return false;" class="nav-item ${isActive ? 'bg-blue-50 text-blue-700 font-bold border-blue-100 shadow-sm' : 'text-gray-600 hover:bg-gray-50 border-transparent'} group flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors border mb-1">
                <i class="${iconClass} ${isActive ? 'opacity-100 text-blue-500' : 'opacity-60 text-gray-400 group-hover:text-gray-500 group-hover:opacity-100'} min-w-8 text-lg"></i> ${p}
            </a>
        `;
    });
    
    html += `
        <a href="#" onclick="setPlatformMenu('profit'); return false;" class="nav-item ${activePlatformMenu === 'profit' ? 'bg-red-50 text-red-700 font-bold border-red-100 shadow-sm' : 'text-gray-600 hover:bg-gray-50 border-transparent'} group flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors border mt-2">
            <i class="fa-solid fa-chart-line ${activePlatformMenu === 'profit' ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-500'} min-w-8 text-lg"></i> Analisis Profit
        </a>
    `;
    
    container.innerHTML = html;
}

window.setPlatformMenu = function(plat) {
    activePlatformMenu = plat;
    activePlatformTab = 'all'; // reset tab filters when changing views
    activeKategoriTab = 'all';
    updatePageTitle();
    refreshPlatformMenu(); // visual update
    buildTabs();
    showListView();
}

function buildTabs() {
    const data = getLocalData();
    const katSel = document.getElementById('filterKat');
    const platSel = document.getElementById('filterPlat');
    
    // Kategori Tabs
    let kats = new Set();
    data.forEach(item => { if(item.kategori) kats.add(item.kategori.trim().toUpperCase()); });
    let sortedKats = Array.from(kats).sort();
    
    if(katSel && katSel.options.length <= 1 && kats.size > 0) {
        let kHtml = `<option value="all">Semua Kategori</option>`;
        sortedKats.forEach(k => kHtml += `<option value="${k}">${k}</option>`);
        katSel.innerHTML = kHtml;
    }

    // Tab Platform Configurations
    if (activePlatformMenu === 'all' || activePlatformMenu === 'profit') {
        if(platSel) platSel.classList.remove('hidden');
        let plats = new Set();
        data.forEach(item => { plats.add((item.platform || item.sku || 'Lainnya').trim().toUpperCase()); });
        let sortedPlats = Array.from(plats).sort();
        
        if(platSel && platSel.options.length <= 1 && plats.size > 0) {
            let pHtml = `<option value="all">Semua Platform</option>`;
            sortedPlats.forEach(p => pHtml += `<option value="${p}">${p}</option>`);
            platSel.innerHTML = pHtml;
        }
    } else {
        if(platSel) platSel.classList.add('hidden');
    }
    
    // Profit Specific Filters
    const profitSel = document.getElementById('profitFilter');
    if (activePlatformMenu === 'profit') {
        if(profitSel) profitSel.classList.remove('hidden');
    } else {
        if(profitSel) profitSel.classList.add('hidden');
    }
}

// === List View Render ===
function renderListView() {
    const data = getLocalData();
    const container = document.getElementById('listContainer');
    const emptyState = document.getElementById('emptyState');
    const term = searchInput.value.toLowerCase();
    
    const fKat = document.getElementById('filterKat')?.value || 'all';
    const fPlat = document.getElementById('filterPlat')?.value || 'all';
    
    let filtered = data;
    
    // Filter Sidenav Platform
    if (activePlatformMenu !== 'all' && activePlatformMenu !== 'master') {
        if (activePlatformMenu === 'profit') {
            const pLevel = document.getElementById('profitFilter')?.value || 'all';
            filtered = filtered.filter(item => {
                if (!item.hasil || typeof item.hasil.profit === 'undefined') return false;
                let prof = item.hasil.profit;
                let hppVal = item.hpp || 1; 
                let profitPercent = (prof / hppVal) * 100;
                
                if (pLevel === 'minus') return prof <= 0;
                if (pLevel === 'rendah') return prof > 0 && profitPercent <= 15;
                if (pLevel === 'tinggi') return prof > 0 && profitPercent > 15;
                return true; 
            });
        } else {
            filtered = filtered.filter(item => {
                let p = (item.platform || item.sku || 'Lainnya').toLowerCase();
                return p === activePlatformMenu;
            });
        }
    }
    
    // Filter Tab Platform
    if ((activePlatformMenu === 'all' || activePlatformMenu === 'profit') && fPlat !== 'all') {
        filtered = filtered.filter(item => {
            let p = (item.platform || item.sku || 'Lainnya').toUpperCase();
            return p === fPlat;
        });
    }
    
    // Filter Tab Kategori
    if (fKat !== 'all') {
        filtered = filtered.filter(item => {
            return (item.kategori || '').toUpperCase() === fKat;
        });
    }
    
    // Filter Search Term
    if (term.trim() !== '') {
        filtered = filtered.filter(item => 
            item.namaProduk.toLowerCase().includes(term) || 
            (item.platform || '').toLowerCase().includes(term) ||
            (item.kategori || '').toLowerCase().includes(term) ||
            (item.merk || '').toLowerCase().includes(term)
        );
    }
    
    // Apply Sorting
    const sortVal = document.getElementById('sortSelect').value;
    filtered.sort((a,b) => {
        if(sortVal === 'az') return a.namaProduk.localeCompare(b.namaProduk);
        if(sortVal === 'za') return b.namaProduk.localeCompare(a.namaProduk);
        if(sortVal === 'termurah') return (a.hasil.hargaAwal || 0) - (b.hasil.hargaAwal || 0); // fallback based on Harga Awal (Markup) primarily
        if(sortVal === 'termahal') return (b.hasil.hargaAwal || 0) - (a.hasil.hargaAwal || 0);
        return 0; // fallback
    });
    
    if (filtered.length === 0) {
        container.innerHTML = '';
        emptyState.classList.remove('hidden');
        emptyState.classList.add('flex');
    } else {
        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');
        
        let html = '';
        filtered.forEach(item => {
            const plt = item.platform || item.sku || 'Lainnya';
            const mrk = item.merk || 'No Brand';
            const cat = item.kategori || 'Uncat';
            const isProfit = item.hasil.profit >= 0;
            
            // HIGHLIGHT ON CORET (MARKUP) PRICE
            const hAwal = item.hasil.hargaAwal; 
            
            let profHtml = '';
            if (activePlatformMenu === 'profit') {
                let profVal = item.hasil.profit;
                let hppVal = item.hpp || 1;
                let profPct = (profVal / hppVal) * 100;
                
                let bClasses = 'bg-green-50 text-green-700 border-green-200';
                let iconClass = 'fa-arrow-trend-up';
                let bTitle = 'Profit Tinggi';
                
                if (profVal <= 0) {
                    bClasses = 'bg-red-50 text-red-700 border-red-200';
                    iconClass = 'fa-triangle-exclamation';
                    bTitle = 'Rugi / Profit Minus';
                } else if (profPct <= 15) {
                    bClasses = 'bg-yellow-50 text-yellow-700 border-yellow-200';
                    iconClass = 'fa-exclamation-circle';
                    bTitle = 'Profit Rendah (< 15%)';
                }
                
                profHtml = `
                    <div class="${bClasses} px-3 py-2 rounded-lg border flex justify-between items-center w-full mt-3 md:mt-2 shadow-sm">
                        <span class="text-[10px] font-bold uppercase tracking-wide"><i class="fa-solid ${iconClass} mr-1.5"></i>${bTitle}</span>
                        <span class="font-black text-sm font-mono tracking-tight"><span class="text-xs mr-1 opacity-70">${profVal < 0 ? '-' : '+'}</span>Rp ${formatRupiahString(Math.abs(profVal))}</span>
                    </div>
                `;
            }
            
            html += `
            <div class="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(6,81,237,0.1)] transition-all cursor-pointer flex flex-col items-start hover:border-blue-300 group animate-fade-in list-card overflow-hidden" onclick="showDetailView('${item.id}')">
                
                <div class="flex flex-col md:flex-row w-full gap-4 items-start md:items-center justify-between">
                    <div class="flex-1 w-full min-w-0 md:w-auto shrink-0 md:shrink">
                        <div class="flex flex-wrap items-center gap-2 mb-2">
                            <span class="bg-gray-100 text-gray-700 text-[10px] font-black uppercase px-2 py-1 rounded border border-gray-200"><i class="fa-solid fa-store pr-1 text-blue-500"></i>${plt}</span>
                            <span class="bg-blue-50 text-blue-700 text-[10px] font-black uppercase px-2 py-1 rounded border border-blue-200"><i class="fa-solid fa-tag pr-1"></i>${mrk}</span>
                            <span class="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase px-2 py-1 rounded border border-gray-100">${cat}</span>
                        </div>
                        <h4 class="text-base md:text-lg font-black text-gray-800 leading-tight group-hover:text-blue-700 transition-colors truncate w-full">${item.namaProduk.toUpperCase()}</h4>
                    </div>
                    
                    <div class="flex flex-row w-full md:w-auto gap-3 items-center md:items-stretch md:justify-end shrink-0 border-t md:border-t-0 border-gray-100 pt-3 md:pt-0">
                        <div class="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 shadow-sm text-right flex-1 md:min-w-[120px]">
                            <span class="block text-[10px] text-gray-400 font-bold uppercase tracking-wide">Jual (Refrence)</span>
                            <span class="block font-bold text-gray-500 text-sm">Rp ${formatRupiahString(item.hasil.hargaJual)}</span>
                        </div>
                        <div class="bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 shadow-sm text-right flex-[1.5] md:min-w-[140px] transition-colors relative group-hover:border-blue-300">
                            <span class="block text-[10px] text-blue-600 font-bold uppercase tracking-wide">Coret (Marketplace)</span>
                            <span class="block font-black text-blue-700 text-base md:text-[17px] font-mono leading-tight truncate">Rp ${formatRupiahString(hAwal)}</span>
                            <div class="absolute -right-1 -top-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white animate-pulse"></div>
                        </div>
                    </div>
                </div>
                ${profHtml}
            </div>
            `;
        });
        container.innerHTML = html;
    }
}


// === Master View Logic ===
function renderMasterView() {
    let masters = getMasterData();
    const container = document.getElementById('masterListContainer');
    
    const term = (document.getElementById('masterSearchInput')?.value || '').toLowerCase();
    const fKat = document.getElementById('masterFilterKat')?.value || 'all';
    const fMerk = document.getElementById('masterFilterMerk')?.value || 'all';

    const kats = new Set(), merks = new Set();
    masters.forEach(m => {
        if(m.kategori) kats.add(m.kategori.trim().toUpperCase());
        if(m.merk) merks.add(m.merk.trim().toUpperCase());
    });
    
    const katSel = document.getElementById('masterFilterKat');
    if(katSel && katSel.options.length <= 1 && kats.size > 0) {
        let hK = '<option value="all">Semua Kategori</option>';
        Array.from(kats).sort().forEach(k => hK += `<option value="${k}">${k}</option>`);
        katSel.innerHTML = hK;
    }
    const merkSel = document.getElementById('masterFilterMerk');
    if(merkSel && merkSel.options.length <= 1 && merks.size > 0) {
        let hM = '<option value="all">Semua Merk</option>';
        Array.from(merks).sort().forEach(m => hM += `<option value="${m}">${m}</option>`);
        merkSel.innerHTML = hM;
    }
    
    if (term) masters = masters.filter(m => m.namaProduk.toLowerCase().includes(term) || (m.kategori||'').toLowerCase().includes(term) || (m.merk||'').toLowerCase().includes(term));
    if (fKat !== 'all') masters = masters.filter(m => (m.kategori||'').toUpperCase() === fKat);
    if (fMerk !== 'all') masters = masters.filter(m => (m.merk||'').toUpperCase() === fMerk);
    
    window.currentFilteredMasters = masters;
    
    if (masters.length === 0) {
        container.innerHTML = `
            <div class="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
                <i class="fa-solid fa-search text-4xl text-gray-300 mb-4"></i>
                <h3 class="text-lg font-bold text-gray-700">Data Tidak Ditemukan</h3>
                <p class="text-sm text-gray-500 mt-1">Coba sesuaikan filter atau kata kunci pencarian Anda.</p>
            </div>
        `;
        return;
    }
    
    // Sort A-Z
    masters.sort((a,b) => a.namaProduk.localeCompare(b.namaProduk));
    
    let html = '';
    masters.forEach(m => {
        html += `
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between group hover:border-indigo-200 transition-all">
                <div class="flex-1 w-full pr-4 mb-3 md:mb-0">
                    <h4 class="text-base font-black text-gray-800 leading-tight mb-1 truncate">${m.namaProduk.toUpperCase()}</h4>
                    <div class="flex flex-wrap items-center gap-2 mt-1.5 line-clamp-1">
                        <span class="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded uppercase">${m.kategori || 'UNCAT'}</span>
                        <span class="text-[10px] font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded uppercase">${m.merk || 'No Brand'}</span>
                    </div>
                </div>
                
                <div class="flex items-center gap-3 w-full md:w-auto shrink-0 justify-between md:justify-end">
                    <div class="text-right pr-4 border-r border-gray-100">
                        <span class="block text-[10px] text-gray-400 font-bold uppercase tracking-wide">Modal Dasar (HPP)</span>
                        <span class="block font-black text-gray-700 text-sm font-mono whitespace-nowrap">Rp ${formatRupiahString(m.hpp)}</span>
                    </div>
                    
                    <div class="flex flex-row md:flex-col gap-1.5 shrink-0">
                        <button onclick="showBulkMarkupModal('${m.id}')" class="text-gray-400 hover:text-yellow-600 bg-gray-50 hover:bg-yellow-50 transition-colors w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:border-yellow-200" title="Markup Khusus Produk Ini">
                            <i class="fa-solid fa-tag text-xs"></i>
                        </button>
                        <button onclick="showMasterModal('${m.id}')" class="text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 transition-colors w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:border-blue-200" title="Edit Master Data">
                            <i class="fa-solid fa-pen text-xs"></i>
                        </button>
                        <button onclick="deleteMasterItem('${m.id}')" class="text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 transition-colors w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:border-red-200" title="Hapus Master Data">
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

window.showBulkMarkupModal = function(id = null) {
    window.targetMarkupId = id;
    const modal = document.getElementById('bulkMarkupModal');
    
    const titleEl = modal.querySelector('h3');
    const descEl = modal.querySelector('p');
    if (id !== null && typeof id !== 'object') {
        let m = getMasterData().find(x => String(x.id) === String(id));
        if (m) {
            titleEl.innerHTML = `<i class="fa-solid fa-tag text-yellow-500 mr-2"></i>Markup Personal`;
            descEl.innerHTML = `Markup yang diubah di sini akan meningkatkan nilai HPP secara permanen <strong class="text-yellow-700">khusus untuk produk ${m.namaProduk}</strong> saja.`;
        }
    } else {
        window.targetMarkupId = null;
        titleEl.innerHTML = `<i class="fa-solid fa-tags text-yellow-500 mr-2"></i>Markup Masal`;
        descEl.innerHTML = `Markup yang diubah di sini akan meningkatkan nilai HPP secara permanen bagi semua <strong class="text-gray-700">Master Data yang saat ini sedang tampil</strong> berdasarkan filter di belakang layar.`;
    }
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        document.getElementById('bulkMarkupModalContent').classList.remove('scale-95');
    }, 10);
}

window.closeBulkMarkupModal = function() {
    const modal = document.getElementById('bulkMarkupModal');
    modal.classList.add('opacity-0');
    document.getElementById('bulkMarkupModalContent').classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

window.showReverseModal = function() {
    const modal = document.getElementById('reverseModal');
    document.getElementById('revHargaJual').value = '';
    document.getElementById('revAdminHpp').value = '30';
    document.getElementById('revMarkup').value = '95';
    document.getElementById('revDiskon').value = '50';
    document.getElementById('revHasilHpp').textContent = 'Rp 0';
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        document.getElementById('reverseModalContent').classList.remove('scale-95');
    }, 10);
}

window.closeReverseModal = function() {
    const modal = document.getElementById('reverseModal');
    modal.classList.add('opacity-0');
    document.getElementById('reverseModalContent').classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

window.calculateReverse = function() {
    const jual = parseRupiah(document.getElementById('revHargaJual').value);
    const adminHpp = parseFloat(document.getElementById('revAdminHpp').value) || 0;
    const markup = parseFloat(document.getElementById('revMarkup').value) || 0;
    const diskon = parseFloat(document.getElementById('revDiskon').value) || 0;
    
    if (jual <= 0) {
        document.getElementById('revHasilHpp').textContent = 'Rp 0';
        window.currentReverseHpp = 0;
        return;
    }
    
    // Formula Reverse:
    // 1. hargaAwal = jual / ((100 - diskon) / 100)
    // 2. hargaRetail = hargaAwal / (1 + (markup / 100))
    // 3. HPP = hargaRetail / (1 + (adminHpp / 100))
    
    const hargaAwal = jual / ((100 - diskon) / 100);
    const hargaRetail = hargaAwal / (1 + (markup / 100));
    const hpp = hargaRetail / (1 + (adminHpp / 100));
    
    window.currentReverseHpp = Math.round(hpp);
    document.getElementById('revHasilHpp').textContent = 'Rp ' + formatRupiahString(window.currentReverseHpp);
}

window.copyReverseHpp = function() {
    const val = window.currentReverseHpp || 0;
    if (val <= 0) return;
    
    navigator.clipboard.writeText(val).then(() => {
        Swal.fire({
            icon: 'success',
            title: 'Berhasil Disalin!',
            text: `HPP Rp ${formatRupiahString(val)} telah disalin ke papan klip.`,
            toast: true,
            position: 'top-end',
            timer: 2000,
            showConfirmButton: false,
            timerProgressBar: true
        });
    });
}

window.applyBulkMarkup = function() {
    let type = document.getElementById('bmmType').value;
    let val = parseFloat(document.getElementById('bmmValue').value) || 0;
    let pem = document.getElementById('bmmPem').value;
    
    let allData = getMasterData();
    let affectedIds = [];
    
    if (window.targetMarkupId) {
        affectedIds = [String(window.targetMarkupId)];
    } else {
        affectedIds = (window.currentFilteredMasters || []).map(m => String(m.id));
    }
    
    if(affectedIds.length === 0) {
        return Swal.fire({icon: 'error', text: 'Tidak ada data master yang tampil untuk dimarkup!'});
    }
    
    let updatedData = allData.map(m => {
        if(affectedIds.includes(String(m.id))) {
            let res = m.hpp;
            if(type === 'persen') res = val < 100 ? (m.hpp / ((100 - val) / 100)) : (m.hpp + (m.hpp * val / 100));
            else res = m.hpp + val;
            
            if(pem === 'ratusan_atas') res = Math.ceil(res / 100) * 100;
            else if(pem === 'ribuan_atas') res = Math.ceil(res / 1000) * 1000;
            
            return { ...m, hpp: res };
        }
        return m;
    });
    
    setMasterData(updatedData);
    
    // Auto sync platform items
    let localData = getLocalData();
    let updatedLocal = localData.map(item => {
        let master = updatedData.find(m => m.namaProduk.toLowerCase() === item.namaProduk.toLowerCase());
        if (master) {
            let feesArr = item.platformFees || [];
            let hCalc = calculateProfitSilently(master.hpp, parseFloat(item.adminHppPersen)||0, parseFloat(item.markupPersen)||0, parseFloat(item.diskonPersen)||0, feesArr);
            return { ...item, hpp: master.hpp, kategori: master.kategori, merk: master.merk, hasil: hCalc };
        }
        return item;
    });
    setLocalData(updatedLocal);
    renderListView();
    refreshPlatformMenu();
    
    closeBulkMarkupModal();
    renderMasterView();
    Swal.fire({icon: 'success', title: 'Markup Diterapkan!', text: `${affectedIds.length} Master Data dan harga di Beranda berhasil diperbarui secara otomatis.`, timer: 2500, showConfirmButton: false});
}

window.deleteMasterItem = function(id) {
    Swal.fire({
        title: 'Hapus Master Data?', text: "Data ini tidak akan muncul lagi di saran pencarian.", icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya, Hapus!'
    }).then((result) => {
        if (result.isConfirmed) {
            let data = getMasterData();
            data = data.filter(item => String(item.id) !== String(id));
            setMasterData(data);
            renderMasterView(); // Refresh
            refreshMasterDatalist();
            Swal.fire({ icon: 'success', title: 'Terhapus', timer: 1500, showConfirmButton: false });
        }
    });
}

function autoUpsertMasterData(nama, kat, merk, hpp) {
    if(!nama) return;
    let masters = getMasterData();
    let idx = masters.findIndex(m => m.namaProduk.toLowerCase() === nama.toLowerCase());
    
    if(idx !== -1) {
        // update existing
        masters[idx].kategori = kat;
        masters[idx].merk = merk;
        if(!masters[idx].hargaMarkup) {
            masters[idx].hpp = hpp;
        }
    } else {
        // create new
        masters.push({
            id: Date.now().toString() + Math.floor(Math.random() * 1000),
            namaProduk: nama,
            kategori: kat,
            merk: merk,
            hpp: hpp,
            tanggalDibuat: new Date().toISOString()
        });
    }
    setMasterData(masters);
}


// === Form & Calculator Logic ===
function calculatePreview() {
    let hppVal = parseRupiah(hppInput.value);
    let adminVal = parseFloat(adminHppPersen.value) || 0;
    let markupVal = parseFloat(markupPersen.value) || 0;
    let diskonVal = parseFloat(diskonPersen.value) || 0;

    let hargaRetail = hppVal + (hppVal * adminVal / 100);
    let hargaAwal = hargaRetail + (hargaRetail * markupVal / 100);
    let hargaJual = hargaAwal - (hargaAwal * diskonVal / 100);

    let totalPotongan = 0;
    const feeRows = document.querySelectorAll('.platform-fee-row');
    
    feeRows.forEach(row => {
        let persen = parseFloat(row.querySelector('.fee-percent').value) || 0;
        let maksText = row.querySelector('.fee-max').value;
        let maks = parseRupiah(maksText);
        let hitungPotongan = hargaJual * persen / 100;
        
        if (maks > 0) {
            if (persen === 0) hitungPotongan = maks;
            else if (hitungPotongan > maks) hitungPotongan = maks;
        }
        totalPotongan += hitungPotongan;
    });

    let pendapatanBersih = hargaJual - totalPotongan;
    let profit = pendapatanBersih - hppVal;

    // View Elements Update
    document.getElementById('previewHargaRetail').textContent = 'Rp ' + formatRupiahString(hargaRetail);
    
    // Safety check as preview UI shifted references previously
    if(document.getElementById('previewHargaAwal')) document.getElementById('previewHargaAwal').textContent = 'Rp ' + formatRupiahString(hargaAwal);
    if(document.getElementById('previewHargaJual')) document.getElementById('previewHargaJual').textContent = 'Rp ' + formatRupiahString(hargaJual);
    
    document.getElementById('previewPotongan').textContent = '- Rp ' + formatRupiahString(totalPotongan);
    document.getElementById('previewPendapatan').textContent = 'Rp ' + formatRupiahString(pendapatanBersih);
    
    // Update Dynamic Span Rp Nominals for Admin/Markup/Diskon
    let adminNominal = hppVal * adminVal / 100;
    let markupNominal = hargaRetail * markupVal / 100;
    let diskonNominal = hargaAwal * diskonVal / 100;
    
    if(document.getElementById('nomAdminHpp')) document.getElementById('nomAdminHpp').textContent = '+ Rp ' + formatRupiahString(adminNominal);
    if(document.getElementById('nomMarkup')) document.getElementById('nomMarkup').textContent = '+ Rp ' + formatRupiahString(markupNominal);
    if(document.getElementById('nomDiskon')) document.getElementById('nomDiskon').textContent = '- Rp ' + formatRupiahString(diskonNominal);

    // Profit UI Dynamic
    const pProfit = document.getElementById('previewProfit');
    const pCard = document.getElementById('previewProfitCard');
    pProfit.textContent = 'Rp ' + formatRupiahString(profit);

    if(profit < 0) {
        pProfit.classList.remove('text-green-400');
        pProfit.classList.add('text-red-400');
        pCard.classList.replace('from-green-600/20', 'from-red-600/20');
        pCard.classList.replace('to-green-500/20', 'to-red-500/20');
        pCard.querySelector('span').classList.replace('text-green-400', 'text-red-400');
        pCard.querySelector('div').classList.replace('bg-green-500/10', 'bg-red-500/10');
        pCard.classList.replace('shadow-green-900/20', 'shadow-red-900/20');
    } else {
        pProfit.classList.add('text-green-400');
        pProfit.classList.remove('text-red-400');
        pCard.classList.replace('from-red-600/20', 'from-green-600/20');
        pCard.classList.replace('to-red-500/20', 'to-green-500/20');
        pCard.querySelector('span').classList.replace('text-red-400', 'text-green-400');
        pCard.querySelector('div').classList.replace('bg-red-500/10', 'bg-green-500/10');
        pCard.classList.replace('shadow-red-900/20', 'shadow-green-900/20');
    }

    return { hargaAwal, hargaJual, totalPotongan, pendapatanBersih, profit };
}

window.handlePlatformChange = function() {
    let plt = (document.getElementById('platform').value || '').trim();
    
    // Always clear existing fees when platform changes
    document.getElementById('platformFeesContainer').innerHTML = '';
    
    if (!plt) return;
    
    let fees = getAutoPlatformFees(plt);
    if (fees.length > 0) {
        fees.forEach(f => {
            addPlatformFeeForm(f.nama, f.persen, formatRupiahString(f.maksimalRp));
        });
    }
    calculatePreview();
}

function addPlatformFeeForm(nama = '', persen = '', maks = '') {
    const row = document.createElement('div');
    row.className = 'grid grid-cols-1 sm:grid-cols-12 gap-3 bg-gray-50/50 p-4 rounded-xl border border-gray-200 platform-row platform-fee-row group relative';
    const formattedMaks = maks ? formatRupiahString(maks) : '';

    row.innerHTML = `
        <div class="sm:col-span-4">
            <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1 opacity-50">Nama / Jenis</span>
            <input type="text" class="fee-name w-full px-3 py-2 text-sm border border-gray-200 rounded-lg font-semibold bg-gray-50 text-gray-400 cursor-not-allowed" value="${nama}" readonly>
        </div>
        <div class="sm:col-span-4">
            <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1 opacity-50">Fee %</span>
            <div class="relative">
                <input type="number" class="fee-percent w-full text-center px-3 py-2 text-sm border border-gray-200 rounded-lg pr-6 font-semibold bg-gray-50 text-gray-400 cursor-not-allowed" value="${persen}" readonly>
                <span class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-300 text-xs font-bold">%</span>
            </div>
        </div>
        <div class="sm:col-span-4">
            <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1 opacity-50">Max/Flat (Rp)</span>
            <input type="text" class="fee-max w-full px-3 py-2 text-sm border border-gray-200 rounded-lg text-right font-bold bg-gray-50 text-gray-400 cursor-not-allowed font-mono" value="${formattedMaks}" readonly>
        </div>
        <button type="button" class="btn-remove-fee hidden absolute -top-2 -right-2 bg-white border border-red-200 text-red-500 hover:bg-red-500 hover:text-white rounded-full w-7 h-7 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100">
            <i class="fa-solid fa-times text-xs"></i>
        </button>
    `;
    
    platformFeesContainer.appendChild(row);
    calculatePreview();
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const nameStr = namaInput.value.trim();
    const platformStr = platInput.value.trim() || 'Lainnya';
    const katStr = katInput.value.trim() || 'Lainnya';
    const merkStr = merkInput.value.trim() || 'Tanpa Merk';
    const hppVal = parseRupiah(hppInput.value);
    
    if (!nameStr) return Swal.fire({ icon: 'error', title: 'Oops', text: 'Nama Produk harus diisi!' });
    if (hppVal <= 0) return Swal.fire({ icon: 'error', title: 'Oops', text: 'HPP (Modal) wajib lebih dari 0!' });
    
    // Check duplicate platform computation (Name + Platform combo)
    let localDataAll = getLocalData();
    let isDupePlat = localDataAll.some(i => i.namaProduk.toLowerCase() === nameStr.toLowerCase() && String(i.id) !== String(editIdInput.value) && (i.platform || '').toLowerCase() === platformStr.toLowerCase());
    if (isDupePlat) return Swal.fire({ icon: 'error', title: 'Oops', text: `Produk "${nameStr}" sudah pernah dikalkulasi untuk platform ${platformStr || 'Lainnya'}! Silakan edit data sebelumnya.` });
    
    if (parseFloat(adminHppPersen.value || 0) > 100 || parseFloat(diskonPersen.value || 0) > 100) {
        return Swal.fire({ icon: 'error', title: 'Invalid', text: 'Persentase maksimal 100%!' });
    }
    
    let isFeeValid = true;
    document.querySelectorAll('.fee-percent').forEach(el => { if(parseFloat(el.value || 0) > 100) isFeeValid = false; });
    if(!isFeeValid) return Swal.fire({ icon: 'error', title: 'Invalid', text: 'Persen platform maksimal 100%!' });

    let hasilCalc = calculatePreview();
    let feeDetails = [];
    document.querySelectorAll('.platform-fee-row').forEach(row => {
        feeDetails.push({
            nama: row.querySelector('.fee-name').value || 'Tanpa Nama',
            persen: parseFloat(row.querySelector('.fee-percent').value) || 0,
            maksimalRp: parseRupiah(row.querySelector('.fee-max').value)
        });
    });

    let payload = {
        id: editIdInput.value || Date.now().toString(),
        namaProduk: nameStr,
        platform: platformStr,
        kategori: katStr,
        merk: merkStr,
        sku: platformStr, // legacy map backup
        hpp: hppVal,
        adminHppPersen: parseFloat(adminHppPersen.value) || 0,
        markupPersen: parseFloat(markupPersen.value) || 0,
        diskonPersen: parseFloat(diskonPersen.value) || 0,
        platformFees: feeDetails,
        hasil: {
            hargaAwal: Math.round(hasilCalc.hargaAwal),
            hargaJual: Math.round(hasilCalc.hargaJual),
            totalPotongan: Math.round(hasilCalc.totalPotongan),
            pendapatan: Math.round(hasilCalc.pendapatanBersih),
            profit: Math.round(hasilCalc.profit)
        },
        tanggalDibuat: editIdInput.value ? undefined : new Date().toISOString()
    };

    let ptext = editIdInput.value ? 'Perbarui data ini?' : 'Simpan harga baru ini?';
    
    Swal.fire({
        title: 'Konfirmasi', text: ptext, icon: 'question',
        showCancelButton: true, confirmButtonColor: '#2563eb',
        confirmButtonText: 'Ya, Lanjutkan!'
    }).then((result) => {
        if (result.isConfirmed) {
            
            // MAGIC: Auto save to master data
            autoUpsertMasterData(nameStr, katStr, merkStr, hppVal);

            let data = getLocalData();
            if(editIdInput.value) {
                let p = data.find(i => String(i.id) === String(payload.id));
                if(p) payload.tanggalDibuat = p.tanggalDibuat;
                data = data.map(item => String(item.id) === String(payload.id) ? payload : item);
            } else {
                data.push(payload);
            }
            setLocalData(data);
            
            Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data tersimpan!', timer: 1500, showConfirmButton: false });
            refreshPlatformMenu(); // syncs new names immediately
            showDetailView(payload.id);
        }
    });
}

function resetForm() {
    form.reset();
    editIdInput.value = '';
    
    // Set custom defaults based on PRD
    adminHppPersen.value = '30';
    markupPersen.value = '95';
    diskonPersen.value = '50';
    
    platformFeesContainer.innerHTML = '';
    
    editBadge.classList.add('hidden');
    btnBatalEdit.classList.add('hidden');
    document.getElementById('btnSimpan').textContent = 'Simpan Data';
    
    namaInput.readOnly = false;
    hppInput.readOnly = false;
    katInput.readOnly = false;
    merkInput.readOnly = false;
    
    namaInput.classList.remove('bg-gray-100', 'text-gray-500');
    hppInput.classList.remove('bg-transparent', 'text-gray-500');
    hppInput.parentElement.classList.remove('bg-gray-100');
    katInput.classList.remove('bg-gray-100', 'text-gray-500');
    merkInput.classList.remove('bg-gray-100', 'text-gray-500');
    
    calculatePreview();
}

window.editItem = function(id) {
    const data = getLocalData();
    const item = data.find(d => String(d.id) === String(id));
    if (!item) return;

    resetForm();
    showFormView(true);

    editIdInput.value = item.id;
    namaInput.value = item.namaProduk;
    platInput.value = item.platform || item.sku || '';
    katInput.value = item.kategori || '';
    merkInput.value = item.merk || '';
    
    hppInput.value = formatRupiahString(item.hpp);
    adminHppPersen.value = item.adminHppPersen !== undefined ? item.adminHppPersen : '30';
    markupPersen.value = item.markupPersen !== undefined ? item.markupPersen : '95';
    diskonPersen.value = item.diskonPersen !== undefined ? item.diskonPersen : '50';

    platformFeesContainer.innerHTML = '';
    if (item.platformFees && item.platformFees.length > 0) {
        item.platformFees.forEach(fee => addPlatformFeeForm(fee.nama, fee.persen, fee.maksimalRp));
    }
    
    namaInput.readOnly = true;
    hppInput.readOnly = true;
    katInput.readOnly = true;
    merkInput.readOnly = true;
    
    namaInput.classList.add('bg-gray-100', 'text-gray-500');
    hppInput.parentElement.classList.add('bg-gray-100');
    hppInput.classList.add('bg-transparent', 'text-gray-500');
    katInput.classList.add('bg-gray-100', 'text-gray-500');
    merkInput.classList.add('bg-gray-100', 'text-gray-500');

    editBadge.classList.remove('hidden');
    btnBatalEdit.classList.remove('hidden');
    document.getElementById('btnSimpan').textContent = 'Perbarui Data';

    calculatePreview();
}

window.deleteItem = function(id, redirectToList = true) {
    Swal.fire({
        title: 'Hapus Data?', text: "Data terhapus permanen!", icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya, Hapus!'
    }).then((result) => {
        if (result.isConfirmed) {
            let data = getLocalData();
            data = data.filter(item => String(item.id) !== String(id));
            setLocalData(data);
            
            if(redirectToList) {
                showListView();
            } else {
                renderListView();
            }
            Swal.fire({ icon: 'success', title: 'Terhapus', timer: 1500, showConfirmButton: false });
        }
    });
}


// === Detail View Logic ===
function populateDetailView(item) {
    const plt = item.platform || item.sku || '-';
    
    // Headings
    document.getElementById('detNamaProduk').textContent = item.namaProduk.toUpperCase();
    document.getElementById('detPlatformText').textContent = plt;
    document.getElementById('detMerkText').textContent = item.merk || 'Belum diisi';
    document.getElementById('detKategoriText').textContent = item.kategori || 'Belum diisi';
    if(document.getElementById('detTanggal')) document.getElementById('detTanggal').textContent = new Date(item.tanggalDibuat).toLocaleString('id-ID');
    
    // Bind Action Buttons
    const btnE = document.getElementById('btnDetEdit');
    const btnD = document.getElementById('btnDetDelete');
    btnE.onclick = () => editItem(item.id);
    btnD.onclick = () => deleteItem(item.id, true);
    
    // Calculate Variable Nominals
    let adminVal = item.adminHppPersen !== undefined ? item.adminHppPersen : 30;
    let markupVal = item.markupPersen !== undefined ? item.markupPersen : 95;
    let diskonVal = item.diskonPersen !== undefined ? item.diskonPersen : 50;

    let calcdRetail = item.hpp + (item.hpp * adminVal / 100);
    let adminNom = item.hpp * adminVal / 100;
    let markNom = calcdRetail * markupVal / 100;
    let diskNom = item.hasil.hargaAwal * diskonVal / 100;

    // View Assignments
    document.getElementById('detHpp').textContent = 'Rp ' + formatRupiahString(item.hpp);
    document.getElementById('detAdminHpp').innerHTML = `${adminVal}%<br><span class="text-gray-400 text-[10px] sm:text-xs font-mono font-bold whitespace-nowrap">(+ Rp ${formatRupiahString(adminNom)})</span>`;
    document.getElementById('detMarkup').innerHTML = `${markupVal}%<br><span class="text-gray-400 text-[10px] sm:text-xs font-mono font-bold whitespace-nowrap">(+ Rp ${formatRupiahString(markNom)})</span>`;
    document.getElementById('detDiskon').innerHTML = `${diskonVal}%<br><span class="text-orange-400 text-[10px] sm:text-xs font-mono font-bold whitespace-nowrap">(- Rp ${formatRupiahString(diskNom)})</span>`;

    // Platform Fees lists
    const feesContainer = document.getElementById('detPlatformFeesContainer');
    feesContainer.innerHTML = '';

    if(!item.platformFees || item.platformFees.length === 0) {
        feesContainer.innerHTML = '<div class="text-sm text-gray-400 italic">Tidak ada potongan fee dicatat.</div>';
    } else {
        item.platformFees.forEach(fee => {
            let calcFee = (item.hasil.hargaJual * fee.persen / 100);
            let actFee = calcFee;
            let note = '';
            if (fee.maksimalRp > 0) {
                 if (fee.persen === 0) {
                     actFee = fee.maksimalRp;
                     note = '<span class="text-[10px] text-orange-500 ml-2 bg-orange-100 px-1 rounded">FLAT FEE</span>';
                 } else if (calcFee > fee.maksimalRp) {
                     actFee = fee.maksimalRp;
                     note = '<span class="text-[10px] text-red-500 ml-2 bg-red-100 px-1 rounded">MAX CAPPED</span>';
                 }
            }
            
            feesContainer.innerHTML += `
               <div class="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-0">
                    <div class="flex flex-col">
                         <span class="font-bold text-gray-700">${fee.nama} ${note}</span>
                         <span class="text-xs text-gray-400">${fee.persen}% dari Harga Jual ${fee.maksimalRp > 0 ? '(Max/Flat : Rp '+formatRupiahString(fee.maksimalRp)+')' : ''}</span>
                    </div>
                    <span class="font-mono text-gray-800 font-semibold text-right">Rp ${formatRupiahString(actFee)}</span>
               </div>
            `;
        });
    }

    // Results Summary with Highlight Override swapping weights
    document.getElementById('detHargaRetail').textContent = 'Rp ' + formatRupiahString(calcdRetail);
    
    // Switch visual weight: detHargaAwal = the biggest markup value, detHargaJual = smaller reference
    // Detail View update (Assuming detHargaAwal in markup string)
    if(document.getElementById('detHargaAwal')) document.getElementById('detHargaAwal').textContent = 'Rp ' + formatRupiahString(item.hasil.hargaAwal);
    if(document.getElementById('detHargaJual')) document.getElementById('detHargaJual').textContent = 'Rp ' + formatRupiahString(item.hasil.hargaJual);
    
    document.getElementById('detTotalPotongan').textContent = '- Rp ' + formatRupiahString(item.hasil.totalPotongan);
    document.getElementById('detPendapatan').textContent = 'Rp ' + formatRupiahString(item.hasil.pendapatan);
    
    // Profit card dynamic styling
    const pfit = document.getElementById('detProfit');
    const border = document.getElementById('detProfitCardBorder');
    const title = document.getElementById('detProfitTitle');
    pfit.textContent = 'Rp ' + formatRupiahString(item.hasil.profit);

    if (item.hasil.profit < 0) {
        pfit.classList.replace('text-green-600', 'text-red-600');
        border.classList.replace('bg-green-50', 'bg-red-50');
        border.classList.replace('border-green-100', 'border-red-100');
        title.classList.replace('text-green-800', 'text-red-800');
    } else {
        pfit.classList.replace('text-red-600', 'text-green-600');
        border.classList.replace('bg-red-50', 'bg-green-50');
        border.classList.replace('border-red-100', 'border-green-100');
        title.classList.replace('text-red-800', 'text-green-800');
    }
}


// === Export & Import (Includes Master Data!) ===
window.handleExport = function() {
    let data = getLocalData();
    let master = getMasterData();
    if(data.length === 0 && master.length === 0) return Swal.fire({ icon: 'info', text: 'Tidak ada data untuk dibackup.'});
    
    let combined = {
        products: data,
        master: master
    };
    
    let link = document.createElement('a');
    link.href = 'data:application/json;charset=utf-8,'+ encodeURIComponent(JSON.stringify(combined, null, 2));
    link.download = `kalkulator-harga-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    Swal.fire({ icon: 'success', title: 'Backup Berhasil', timer: 2000, showConfirmButton: false});
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const importedData = JSON.parse(event.target.result);
            let targetProducts = [];
            let targetMaster = [];

            if(Array.isArray(importedData)) {
                // Legacy Import fallback
                targetProducts = importedData;
            } else if (importedData.products) {
                targetProducts = importedData.products;
                targetMaster = importedData.master || [];
            } else {
                 throw new Error('Unrecognized format');
            }

            Swal.fire({
                title: 'Restore Data', text: `Ditemukan ${targetProducts.length} Data & ${targetMaster.length} Master. Lanjutkan?`, icon: 'warning',
                showCancelButton: true, confirmButtonText: 'Ya, Restore!'
            }).then((result) => {
                if (result.isConfirmed) {
                    setLocalData(targetProducts);
                    setMasterData(targetMaster);
                    showListView(); // auto refresh menu too
                    Swal.fire({ icon: 'success', title: 'Restore Berhasil', timer: 1500, showConfirmButton: false});
                }
                e.target.value = '';
            });
        } catch (error) {
            Swal.fire({ icon: 'error', text: 'File korup atau bukan format JSON aplikasi ini.'});
            e.target.value = '';
        }
    };
    reader.readAsText(file);
}

window.handleDeleteData = function() {
    let data = getLocalData();
    let plats = new Set();
    data.forEach(item => {
        let p = (item.platform || item.sku || 'Lainnya').trim().toUpperCase();
        plats.add(p);
    });
    const sortedPlats = Array.from(plats).sort();
    
    let platOptions = '';
    sortedPlats.forEach(p => {
        platOptions += `<option value="${p}">${p}</option>`;
    });

    Swal.fire({
        title: 'Hapus Data',
        html: `
            <div class="flex flex-col gap-3 mt-4 text-left">
                <button onclick="executeDelete('all')" class="w-full text-left bg-red-50 border border-red-200 hover:bg-red-100 px-4 py-3 rounded-xl flex items-center shadow-sm">
                    <i class="fa-solid fa-dumpster text-red-500 mr-3 text-lg w-6 text-center"></i>
                    <div>
                        <span class="block font-bold text-red-800 text-sm">Hapus Semua Data</span>
                        <span class="block text-[10px] text-red-500">Master Data & Semua Harga Platform</span>
                    </div>
                </button>
                <button onclick="executeDelete('all_platforms')" class="w-full text-left bg-orange-50 border border-orange-200 hover:bg-orange-100 px-4 py-3 rounded-xl flex items-center shadow-sm">
                    <i class="fa-solid fa-trash text-orange-500 mr-3 text-lg w-6 text-center"></i>
                    <div>
                        <span class="block font-bold text-orange-800 text-sm">Hapus Data Semua Platform</span>
                        <span class="block text-[10px] text-orange-500">Master Data tetap aman</span>
                    </div>
                </button>
                <div class="mt-2 border border-gray-200 rounded-xl p-3 bg-gray-50 flex flex-col gap-2">
                    <label class="block text-[11px] font-bold text-gray-700">Hapus Platform Tertentu</label>
                    <div class="flex gap-2 isolate">
                        <select id="deletePlatSelect" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-red-500/20 outline-none">
                            <option value="">-- Pilih Platform --</option>
                            ${platOptions}
                        </select>
                        <button onclick="executeDelete('specific_platform')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </div>
            </div>
        `,
        showConfirmButton: false,
        showCloseButton: true
    });
}

window.executeDelete = function(type) {
    let title = '';
    let text = '';
    let targetPlat = '';
    
    if (type === 'all') {
        title = 'Hapus Semua Data?';
        text = 'Master Data dan semua kalkulasi harga akan dihapus permanen!';
    } else if (type === 'all_platforms') {
        title = 'Hapus Data Semua Platform?';
        text = 'Semua kalkulasi harga akan dihapus. Master Data tetap aman.';
    } else if (type === 'specific_platform') {
        targetPlat = document.getElementById('deletePlatSelect').value;
        if (!targetPlat) return Swal.fire({icon: 'error', text: 'Pilih platform yang ingin dihapus terlebih dahulu.'});
        title = `Hapus Platform ${targetPlat}?`;
        text = `Semua kalkulasi harga untuk platform ${targetPlat} akan dihapus!`;
    }

    Swal.fire({
        title: title, text: text, icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya, Hapus!'
    }).then((result) => {
        if (result.isConfirmed) {
            if (type === 'all') {
                setLocalData([]);
                setMasterData([]);
            } else if (type === 'all_platforms') {
                setLocalData([]);
            } else if (type === 'specific_platform') {
                let data = getLocalData();
                data = data.filter(item => {
                    let p = (item.platform || item.sku || 'Lainnya').trim().toUpperCase();
                    return p !== targetPlat;
                });
                setLocalData(data);
            }
            
            setPlatformMenu('all'); // refresh UI & render beranda
            Swal.fire({ icon: 'success', title: 'Terhapus', timer: 1500, showConfirmButton: false });
        }
    });
}

// === Excel Harga Imports & Calculators ===
window.downloadHargaTemplate = function() {
    const ws_data = [
        ["Platform", "Nama Produk", "Kategori", "Merk", "HPP (Modal)", "Admin HPP (%)", "Markup (%)", "Diskon (%)"], 
        ["Shopee", "Contoh: Baju Renang", "Pakaian", "Erigo", 50000, 30, 95, 50],
        ["Tiktok", "Contoh: Meja Lipat", "Perabotan", "IKEA", 85000, 30, 95, 50]
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wscols = [{wch: 15}, {wch: 30}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Harga");
    XLSX.writeFile(wb, "Template_Bulk_Harga.xlsx");
}

function getAutoPlatformFees(plat) {
    let configs = getPlatformConfigs();
    let config = configs.find(c => c.namaPlatform.toLowerCase().trim() === plat.toLowerCase().trim());
    if (config) {
        return config.biayaLayanan;
    }
    return [];
}

function calculateProfitSilently(hppVal, adminVal, markupVal, diskonVal, feesArr) {
    let hargaRetail = hppVal + (hppVal * adminVal / 100);
    let hargaAwal = hargaRetail + (hargaRetail * markupVal / 100);
    let hargaJual = hargaAwal - (hargaAwal * diskonVal / 100);

    let totalPotongan = 0;
    
    feesArr.forEach(fee => {
        let persen = fee.persen || 0;
        let maks = fee.maksimalRp || 0;
        let hitungPotongan = hargaJual * persen / 100;
        
        if (maks > 0) {
            if (persen === 0) hitungPotongan = maks;
            else if (hitungPotongan > maks) hitungPotongan = maks;
        }
        totalPotongan += hitungPotongan;
    });

    let pendapatanBersih = hargaJual - totalPotongan;
    let profit = pendapatanBersih - hppVal;
    
    return {
        hargaAwal: Math.round(hargaAwal),
        hargaJual: Math.round(hargaJual),
        totalPotongan: Math.round(totalPotongan),
        pendapatan: Math.round(pendapatanBersih),
        profit: Math.round(profit)
    };
}

function handleImportHargaExcel(e) {
    const file = e.target.files[0];
    if(!file) return;
    
    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const data = new Uint8Array(evt.target.result);
            const workbook = XLSX.read(data, {type: 'array'});
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(worksheet, {header: 1}); 
            if(json.length < 2) throw new Error('Format Kosong');
            
            let produklokal = getLocalData();
            let addedCount = 0;
            
            const headers = json[0].map(h => String(h).toLowerCase());
            const iPlat = headers.findIndex(h => h.includes('platform'));
            const iNama = headers.findIndex(h => h.includes('nama'));
            const iKat = headers.findIndex(h => h.includes('kategori'));
            const iMerk = headers.findIndex(h => h.includes('merk') || h.includes('brand'));
            const iHpp = headers.findIndex(h => h.includes('hpp') || h.includes('modal'));
            const iAdmin = headers.findIndex(h => h.includes('admin') && h.includes('%'));
            const iMark = headers.findIndex(h => h.includes('markup') && h.includes('%'));
            const iDisk = headers.findIndex(h => h.includes('diskon') && h.includes('%'));
            
            if(iNama === -1 || iHpp === -1) {
                return Swal.fire({icon:'error', text: 'Template File Excel salah! Minimal wajib ada kolom "Nama Produk" dan "HPP"'});
            }

            for(let i=1; i<json.length; i++) {
                let row = json[i];
                if(!row[iNama]) continue;
                
                let nama = String(row[iNama]).trim();
                let plat = iPlat !== -1 ? String(row[iPlat] || 'Lainnya').trim() : 'Lainnya';
                let kat = iKat !== -1 ? String(row[iKat] || '').trim() : '';
                let merk = iMerk !== -1 ? String(row[iMerk] || '').trim() : '';
                let hppVal = parseRupiah(row[iHpp] || 0);
                
                // Skip if this platform logic is already created for this specific item
                let exists = produklokal.some(p => p.namaProduk.toLowerCase() === nama.toLowerCase() && (p.platform||'').toLowerCase() === plat.toLowerCase());
                if(exists) continue;
                
                let adminVal = iAdmin !== -1 ? parseFloat(row[iAdmin] || 30) : 30;
                let markVal = iMark !== -1 ? parseFloat(row[iMark] || 95) : 95;
                let diskVal = iDisk !== -1 ? parseFloat(row[iDisk] || 50) : 50;

                if(nama && hppVal > 0) {
                    let feeArr = getAutoPlatformFees(plat);
                    let hCalc = calculateProfitSilently(hppVal, adminVal, markVal, diskVal, feeArr);

                    let payload = {
                        id: Date.now().toString() + Math.floor(Math.random() * 9999) + i,
                        namaProduk: nama,
                        platform: plat,
                        kategori: kat,
                        merk: merk,
                        sku: plat,
                        hpp: hppVal,
                        adminHppPersen: adminVal,
                        markupPersen: markVal,
                        diskonPersen: diskVal,
                        platformFees: feeArr,
                        hasil: hCalc,
                        tanggalDibuat: new Date().toISOString()
                    };

                    produklokal.push(payload);
                    addedCount++;
                    autoUpsertMasterData(nama, kat, merk, hppVal);
                }
            }
            
            setLocalData(produklokal);
            refreshPlatformMenu();
            showListView();
            Swal.fire({icon:'success', text: `Berhasil mengimpor & mengkalkulasi ${addedCount} Harga Baru!`});
            
        } catch(err) {
             Swal.fire({icon:'error', text: 'Gagal memproses file Excel: ' + err.message});
        }
        e.target.value = '';
    };
    reader.readAsArrayBuffer(file);
}



// === PWA SYSTEM LOGIC ===
let deferredPrompt;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('PWA Service Worker terdaftar!', reg.scope))
            .catch(err => console.log('PWA Registrasi SW Gagal:', err));
    });
}

window.showMagicModal = function() {
    Swal.fire({
        title: 'Buat Harga Otomatis',
        html: `
            <div class="mt-4 text-left">
                <p class="text-[11px] text-gray-500 mb-4 bg-purple-50 p-3 rounded-xl border border-purple-100 font-medium italic">Fitur ini akan menyusun perhitungan harga awal secara otomatis untuk <strong class="text-purple-700">SEMUA PRODUK MASTER DATA</strong> menuju ke satu Platform pilihan Anda.</p>
                
                <div class="mb-4">
                    <label class="block text-[10px] font-black text-gray-700 uppercase mb-2">1. Pilih Platform Target <span class="text-red-500">*</span></label>
                    <select id="magicPlat" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-sm text-sm font-bold bg-white">
                        <option value="">-- Pilih Platform Target --</option>
                        ${getPlatformConfigs().map(c => `<option value="${c.namaPlatform}">${c.namaPlatform}</option>`).join('')}
                    </select>
                </div>

                <div class="grid grid-cols-3 gap-3 mb-2">
                    <div>
                        <label class="block text-[10px] font-black text-gray-700 uppercase mb-2">Admin HPP (%)</label>
                        <input type="number" id="magicAdmin" value="30" class="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-sm text-sm font-bold text-center">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-gray-700 uppercase mb-2">Markup (%)</label>
                        <input type="number" id="magicMarkup" value="95" class="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-sm text-sm font-bold text-center">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black text-gray-700 uppercase mb-2">Diskon (%)</label>
                        <input type="number" id="magicDiskon" value="50" class="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-sm text-sm font-bold text-center">
                    </div>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonColor: '#a855f7', // purple-500
        confirmButtonText: '<i class="fa-solid fa-wand-magic-sparkles mr-2"></i> Eksekusi',
        cancelButtonColor: '#f3f4f6', 
        cancelButtonText: '<span class="text-gray-700 font-bold">Batal</span>', 
        preConfirm: () => {
            const plat = document.getElementById('magicPlat').value;
            const admin = parseFloat(document.getElementById('magicAdmin').value) || 0;
            const markup = parseFloat(document.getElementById('magicMarkup').value) || 0;
            const diskon = parseFloat(document.getElementById('magicDiskon').value) || 0;

            if (!plat) {
                Swal.showValidationMessage('Silakan pilih salah satu platform!');
                return false;
            }
            return { plat, admin, markup, diskon };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const d = result.value;
            executeMagicGenerator(d.plat, d.admin, d.markup, d.diskon);
        }
    });
}

window.executeMagicGenerator = function(targetPlatform, adminHpp, markup, diskon) {
    let masters = getMasterData();
    let localData = getLocalData();
    let generatedCount = 0;
    
    if (masters.length === 0) {
        return Swal.fire({icon: 'error', title: 'Data Kosong', text: 'Tidak ada data di Menu Master Data. Silakan tambah Master Data terlebih dahulu.'});
    }
    
    masters.forEach(m => {
        // Cek apakah produk ini sudah mentas di platform target tersebut
        let isExist = localData.some(loc => loc.namaProduk.toLowerCase() === m.namaProduk.toLowerCase() && (loc.platform || '').toLowerCase() === targetPlatform.toLowerCase());
        
        if (!isExist) {
            const feesArr = getAutoPlatformFees(targetPlatform);
            
            let hCalc = calculateProfitSilently(m.hpp, adminHpp, markup, diskon, feesArr);
            
            localData.push({
                id: Date.now().toString() + Math.floor(Math.random() * 99999) + generatedCount,
                namaProduk: m.namaProduk,
                platform: targetPlatform,
                kategori: m.kategori || '',
                merk: m.merk || '',
                sku: targetPlatform,
                hpp: m.hpp,
                adminHppPersen: adminHpp,
                markupPersen: markup,
                diskonPersen: diskon,
                platformFees: feesArr,
                hasil: hCalc,
                tanggalDibuat: new Date().toISOString()
            });
            generatedCount++;
        }
    });
    
    if (generatedCount > 0) {
        setLocalData(localData);
        refreshPlatformMenu();
        showListView();
        Swal.fire({icon: 'success', title: 'Magic Selesai!', text: `Berhasil membuat ${generatedCount} perhitungan otomatis untuk platform ${targetPlatform}.`, timer: 3000, showConfirmButton: false});
    } else {
        Swal.fire({icon: 'info', title: 'Pemberitahuan', text: `Semua Master Data sudah dibuatkan perhitungannya untuk platform ${targetPlatform}. Tidak ada data baru yang diproses.`, timer: 3000, showConfirmButton: false});
    }
}

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    
    // Update UI notify the user they can install the PWA
    const pwaBanner = document.getElementById('pwaInstallBanner');
    if(pwaBanner) {
        pwaBanner.classList.remove('hidden');
        setTimeout(() => pwaBanner.classList.remove('translate-y-32'), 100);
    }
});

const btnInstallPWA = document.getElementById('pwaInstallBtn');
if(btnInstallPWA) {
    btnInstallPWA.addEventListener('click', async () => {
        const pwaBanner = document.getElementById('pwaInstallBanner');
        pwaBanner.classList.add('translate-y-32');
        setTimeout(() => pwaBanner.classList.add('hidden'), 500);
        
        if (deferredPrompt) {
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User respons terhadap instalasi: ${outcome}`);
            deferredPrompt = null;
        }
    });
}

const btnClosePWA = document.getElementById('pwaCloseBtn');
if(btnClosePWA) {
    btnClosePWA.addEventListener('click', () => {
        const pwaBanner = document.getElementById('pwaInstallBanner');
        pwaBanner.classList.add('translate-y-32');
        setTimeout(() => pwaBanner.classList.add('hidden'), 500);
    });
}


// === Konfigurasi Platform Logic UI ===
window.showPlatConfView = function() {
    if(typeof activePlatformMenu !== 'undefined') {
        activePlatformMenu = 'platconf';
        refreshPlatformMenu();
        updatePageTitle();
    }
    document.getElementById('formView').classList.add('hidden');
    document.getElementById('detailView').classList.add('hidden');
    document.getElementById('masterView').classList.add('hidden');
    document.getElementById('listView').classList.add('hidden');
    document.getElementById('listView').classList.remove('block');
    document.getElementById('formView').classList.remove('block');
    document.getElementById('masterView').classList.remove('block');
    
    document.getElementById('platConfView').classList.remove('hidden');
    document.getElementById('platConfView').classList.add('block');
    
    renderPlatConfView();
    window.scrollTo({ top: 0, behavior: 'instant' });
}

window.renderPlatConfView = function() {
    const container = document.getElementById('platConfContainer');
    const configs = getPlatformConfigs();
    
    if (configs.length === 0) {
        container.innerHTML = '<div class="col-span-full p-6 bg-white border border-gray-200 rounded-xl text-center text-gray-400 font-bold">Belum ada konfigurasi platform yang tersimpan.</div>';
        return;
    }
    
    let html = '';
    configs.forEach(c => {
        let feesHtml = '';
        let totalPersen = 0;
        let totalMaksRp = 0;
        if (c.biayaLayanan && c.biayaLayanan.length > 0) {
            c.biayaLayanan.forEach(f => {
                totalPersen += f.persen || 0;
                totalMaksRp += f.maksimalRp || 0;
                let maksTxt = f.maksimalRp > 0 ? `Max/Flat Rp ${formatRupiahString(f.maksimalRp)}` : 'Tanpa Batas Maksimal';
                feesHtml += `
                    <div class="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 rounded transition-colors">
                        <span class="text-[11px] font-bold text-gray-700">${f.nama}</span>
                        <div class="text-right">
                            <span class="block text-[13px] font-black text-indigo-600">${f.persen}%</span>
                            <span class="block text-[9px] text-gray-500 font-mono tracking-tighter">${maksTxt}</span>
                        </div>
                    </div>
                `;
            });
            let maxTotalTxt = totalMaksRp > 0 ? `+ Max/Flat Rp ${formatRupiahString(totalMaksRp)}` : '';
            feesHtml += `
                <div class="flex justify-between items-center py-3 bg-indigo-50/50 mt-2 px-3 rounded-lg border border-indigo-100/50">
                    <span class="text-[11px] font-black text-indigo-900 tracking-wider">TOTAL POTONGAN:</span>
                    <div class="text-right">
                        <span class="block text-sm font-black text-indigo-700">${Number(totalPersen.toFixed(2))}%</span>
                        <span class="block text-[10px] text-indigo-500 font-mono font-bold">${maxTotalTxt}</span>
                    </div>
                </div>
            `;
        } else {
            feesHtml = '<div class="text-[11px] text-gray-400 py-2 italic font-medium px-2">Tidak ada tanggungan potongan.</div>';
        }
    
        html += `
            <div class="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col group animate-fade-in list-card">
                <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 group-hover:bg-indigo-50/50 transition-colors">
                    <h3 class="font-black text-gray-800 tracking-tight text-lg"><i class="fa-solid fa-store text-indigo-500 mr-2"></i>${c.namaPlatform}</h3>
                    <div class="flex gap-2">
                        <button onclick="showPlatConfModal('${c.id}')" class="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors shadow-sm"><i class="fa-solid fa-pen text-xs"></i></button>
                        <button onclick="deletePlatConf('${c.id}')" class="w-8 h-8 rounded-full bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors shadow-sm"><i class="fa-solid fa-trash text-xs"></i></button>
                    </div>
                </div>
                <div class="p-4 flex-1">
                    <p class="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-3">Rincian Potongan Fee</p>
                    <div class="space-y-0.5">
                        ${feesHtml}
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

window.showPlatConfModal = function(id = 'new') {
    const modal = document.getElementById('platConfModal');
    const content = document.getElementById('platConfModalContent');
    const pcId = document.getElementById('pcId');
    const title = document.getElementById('platConfModalTitle');
    const nama = document.getElementById('pcNama');
    const container = document.getElementById('pcRowsContainer');
    
    container.innerHTML = '';
    
    if (id === 'new') {
        pcId.value = '';
        title.textContent = 'Tambah Konfigurasi Platform';
        nama.value = '';
        addPcRow(); // Add 1 empty row by default
    } else {
        title.textContent = 'Edit Konfigurasi Platform';
        const config = getPlatformConfigs().find(c => String(c.id) === String(id));
        if(config) {
            pcId.value = config.id;
            nama.value = config.namaPlatform;
            if(config.biayaLayanan && config.biayaLayanan.length > 0) {
                config.biayaLayanan.forEach(f => addPcRow(f.nama, f.persen, f.maksimalRp));
            } else {
                addPcRow();
            }
        }
    }
    
    modal.classList.remove('hidden');
    void modal.offsetWidth; // trigger reflow
    modal.classList.remove('opacity-0');
    content.classList.remove('scale-95');
    setTimeout(() => { nama.focus(); }, 300);
}

window.closePlatConfModal = function() {
    const modal = document.getElementById('platConfModal');
    const content = document.getElementById('platConfModalContent');
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

window.addPcRow = function(name = '', pct = '', maxRp = '') {
    const container = document.getElementById('pcRowsContainer');
    const div = document.createElement('div');
    div.className = 'grid grid-cols-12 gap-2 items-center pc-fee-row bg-white p-2 rounded-lg border border-gray-100 shadow-sm relative group mb-2';
    
    let maxVal = maxRp ? formatRupiahString(maxRp) : '';
    
    div.innerHTML = `
        <div class="col-span-5 relative">
            <input type="text" class="pc-name w-full pl-2 pr-2 py-2.5 border border-gray-200 rounded-md bg-white text-xs font-semibold focus:ring-1 focus:ring-indigo-500 text-gray-700" value="${name}" placeholder="Misal: Biaya Admin" required>
        </div>
        <div class="col-span-3">
            <input type="number" step="0.1" class="pc-pct w-full text-center py-2.5 border border-gray-200 rounded-md bg-white text-xs font-bold text-indigo-700 focus:ring-1 focus:ring-indigo-500" value="${pct}" placeholder="0" required>
        </div>
        <div class="col-span-4 relative">
            <input type="text" class="pc-max w-full pl-6 pr-6 py-2.5 border border-gray-200 rounded-md bg-white text-xs font-mono font-bold text-gray-700 focus:ring-1 focus:ring-indigo-500" value="${maxVal}" placeholder="0" oninput="formatRupiathEvent(event)">
            <span class="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold">Rp</span>
            <button type="button" onclick="this.parentElement.parentElement.remove()" class="absolute right-1 top-1/2 -translate-y-1/2 text-red-300 hover:text-red-500 transition-colors p-1"><i class="fa-solid fa-times text-xs"></i></button>
        </div>
    `;
    container.appendChild(div);
}

window.savePlatConf = function(e) {
    e.preventDefault();
    const id = document.getElementById('pcId').value;
    const nama = document.getElementById('pcNama').value.trim();
    
    let fees = [];
    document.querySelectorAll('.pc-fee-row').forEach(row => {
        let fnama = row.querySelector('.pc-name').value.trim();
        let fpct = parseFloat(row.querySelector('.pc-pct').value) || 0;
        let fmax = parseRupiah(row.querySelector('.pc-max').value) || 0;
        if(fnama) {
            fees.push({ nama: fnama, persen: fpct, maksimalRp: fmax });
        }
    });
    
    let configs = getPlatformConfigs();
    let isEditing = false;
    
    if (id) {
        let idx = configs.findIndex(c => String(c.id) === String(id));
        if(idx !== -1) {
            configs[idx].namaPlatform = nama;
            configs[idx].biayaLayanan = fees;
            isEditing = true;
        }
    }
    
    if (!isEditing) {
        if(configs.some(c => c.namaPlatform.toLowerCase() === nama.toLowerCase())) {
            return Swal.fire({ icon: 'error', text: 'Nama Platform tersebut sudah ada di Konfigurasi!' });
        }
        configs.push({
            id: Date.now().toString() + Math.floor(Math.random()*999),
            namaPlatform: nama,
            biayaLayanan: fees,
            tanggalDibuat: new Date().toISOString()
        });
    }
    
    setPlatformConfigs(configs);
    
    // SYNC: Update all existing products using this platform
    let products = getLocalData();
    let updatedCount = 0;
    products = products.map(p => {
        if ((p.platform || '').toLowerCase() === nama.toLowerCase()) {
            p.platformFees = fees;
            p.hasil = calculateProfitSilently(p.hpp, p.adminHppPersen, p.markupPersen, p.diskonPersen, fees);
            updatedCount++;
            return p;
        }
        return p;
    });
    
    if (updatedCount > 0) {
        setLocalData(products);
    }

    closePlatConfModal();
    renderPlatConfView();
    Swal.fire({ 
        icon: 'success', 
        title: 'Tersimpan', 
        text: `Konfigurasi platform berhasil disimpan. ${updatedCount > 0 ? updatedCount + ' produk terkait telah diperbarui secara otomatis.' : ''}`, 
        timer: 3000, 
        showConfirmButton: false 
    });
}

window.deletePlatConf = function(id) {
    Swal.fire({
        title: 'Hapus Platform?',
        text: 'Platform ini akan dihapus dari daftar konfigurasi. Kalkulasi sebelumnya tidak terhapus.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#e5e7eb',
        confirmButtonText: '<i class="fa-solid fa-trash mr-2"></i>Hapus',
        cancelButtonText: '<span class="text-gray-700 font-bold">Batal</span>'
    }).then(res => {
        if(res.isConfirmed) {
            let configs = getPlatformConfigs();
            configs = configs.filter(c => String(c.id) !== String(id));
            setPlatformConfigs(configs);
            renderPlatConfView();
            Swal.fire({ icon: 'success', title: 'Terhapus', timer: 1500, showConfirmButton: false });
        }
    });
}

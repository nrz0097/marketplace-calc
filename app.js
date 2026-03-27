// === Utility Functions ===
function parseRupiah(str) {
    if (!str) return 0;
    return parseInt(str.toString().replace(/[^,\d]/g, '')) || 0;
}

function formatRupiahString(angka, prefix = '') {
    if (angka === null || angka === undefined || isNaN(angka)) angka = 0;
    let number_string = Math.round(angka).toString().replace(/[^,\d]/g, ''),
        split = number_string.split(','),
        sisa = split[0].length % 3,
        rupiah = split[0].substr(0, sisa),
        ribuan = split[0].substr(sisa).match(/\d{3}/gi);
        
    if(ribuan){
        let separator = sisa ? '.' : '';
        rupiah += separator + ribuan.join('.');
    }
    return prefix + rupiah;
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

// === View Management (SPA) ===
const listView = document.getElementById('listView');
const formView = document.getElementById('formView');
const detailView = document.getElementById('detailView');
const masterView = document.getElementById('masterView');
const pageTitle = document.getElementById('pageTitle');
const searchInput = document.getElementById('searchInput');

window.showListView = function() {
    formView.classList.add('hidden');
    detailView.classList.add('hidden');
    masterView.classList.add('hidden');
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
    else if(activePlatformMenu === 'all') pageTitle.textContent = 'Semua Beranda';
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
                    <button onclick="Swal.close(); handleExport()" class="w-full text-left bg-white border border-gray-200 hover:bg-gray-50 px-4 py-3 rounded-xl flex items-center shadow-sm">
                        <i class="fa-solid fa-download text-indigo-500 mr-3 text-lg w-6 text-center"></i>
                        <div>
                            <span class="block font-bold text-gray-800 text-sm">Ekspor (Backup JSON)</span>
                            <span class="block text-[10px] text-gray-500">Amankan data harga ke HP Anda</span>
                        </div>
                    </button>
                    <button onclick="Swal.close(); document.getElementById('inputFileImpor').click()" class="w-full text-left bg-white border border-gray-200 hover:bg-gray-50 px-4 py-3 rounded-xl flex items-center shadow-sm">
                        <i class="fa-solid fa-upload text-blue-500 mr-3 text-lg w-6 text-center"></i>
                        <div>
                            <span class="block font-bold text-gray-800 text-sm">Impor (Restore JSON)</span>
                            <span class="block text-[10px] text-gray-500">Masukan data dari PC atau HP lain</span>
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

    // Export Import
    document.getElementById('btnEksporSidenav').addEventListener('click', handleExport);
    document.getElementById('btnImporSidenav').addEventListener('click', () => document.getElementById('inputFileImpor').click());
    document.getElementById('inputFileImpor').addEventListener('change', handleImport);
    
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
            addPlatformFeeForm('Komisi Kategori', 8, 0);
            addPlatformFeeForm('Komisi Dinamis', 6, 40000);
            addPlatformFeeForm('Program XBP', 4.5, 20000);
            addPlatformFeeForm('Biaya Proses Pesanan', 0, 1250);
        } else if (plat === 'shopee') {
            addPlatformFeeForm('Biaya Kategori', 10, 0);
            addPlatformFeeForm('Biaya Payment', 1.8, 50000);
            addPlatformFeeForm('Promo Xtra', 2, 20000);
            addPlatformFeeForm('Ongkir Xtra', 5.5, 20000);
            addPlatformFeeForm('Live Xtra', 0, 0);
            addPlatformFeeForm('Biaya Proses Pesanan', 0, 1250);
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
    
    let payload = {
        id: id || Date.now().toString(),
        namaProduk: nama,
        kategori: kat,
        merk: merk,
        hpp: hpp,
        tanggalDibuat: new Date().toISOString()
    };
    
    let masters = getMasterData();
    if(id) {
        let p = masters.find(m => String(m.id) === String(id));
        if(p) payload.tanggalDibuat = p.tanggalDibuat;
        masters = masters.map(m => String(m.id) === String(id) ? payload : m);
    } else {
        masters.push(payload);
    }
    setMasterData(masters);
    closeMasterModal();
    renderMasterView();
    Swal.fire({icon:'success', title: 'Berhasil', timer:1500, showConfirmButton:false});
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
        <a href="#" onclick="setPlatformMenu('all'); return false;" class="nav-item ${activePlatformMenu === 'all' ? 'bg-blue-50 text-blue-700 font-bold border-blue-100 shadow-sm' : 'text-gray-600 hover:bg-gray-50 border-transparent'} group flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors border">
            <i class="fa-solid fa-layer-group ${activePlatformMenu === 'all' ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'} min-w-8 text-lg"></i> Beranda
        </a>
    `;
    
    sortedPlats.forEach(p => {
        const pKey = p.toLowerCase();
        const isActive = activePlatformMenu === pKey;
        let iconClass = 'fa-solid fa-store';

        html += `
            <a href="#" onclick="setPlatformMenu('${pKey.replace(/'/g, "\\Warehouse")}'); return false;" class="nav-item ${isActive ? 'bg-blue-50 text-blue-700 font-bold border-blue-100 shadow-sm' : 'text-gray-600 hover:bg-gray-50 border-transparent'} group flex items-center px-3 py-2.5 text-sm rounded-lg transition-colors border">
                <i class="${iconClass} ${isActive ? 'opacity-100 text-blue-500' : 'opacity-60 text-gray-400 group-hover:text-gray-500 group-hover:opacity-100'} min-w-8 text-lg"></i> ${p}
            </a>
        `;
    });
    
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

    // Platform Tabs (Only appear if Beranda)
    if (activePlatformMenu === 'all') {
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
        filtered = filtered.filter(item => {
            let p = (item.platform || item.sku || 'Lainnya').toLowerCase();
            return p === activePlatformMenu;
        });
    }
    
    // Filter Tab Platform (Only if Beranda)
    if (activePlatformMenu === 'all' && fPlat !== 'all') {
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
            
            html += `
            <div class="bg-white border border-gray-200 rounded-xl p-4 md:p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] hover:shadow-[0_8px_30px_-4px_rgba(6,81,237,0.1)] transition-all cursor-pointer flex flex-col md:flex-row items-start md:items-center gap-4 hover:border-blue-300 group animate-fade-in list-card relative overflow-hidden" onclick="showDetailView('${item.id}')">
                <div class="flex-1 w-full min-w-0">
                    <div class="flex flex-wrap items-center gap-2 mb-2">
                        <span class="bg-gray-100 text-gray-700 text-[10px] font-black uppercase px-2 py-1 rounded border border-gray-200"><i class="fa-solid fa-store pr-1 text-blue-500"></i>${plt}</span>
                        <span class="bg-blue-50 text-blue-700 text-[10px] font-black uppercase px-2 py-1 rounded border border-blue-200"><i class="fa-solid fa-tag pr-1"></i>${mrk}</span>
                        <span class="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase px-2 py-1 rounded border border-gray-100">${cat}</span>
                    </div>
                    <h4 class="text-base md:text-lg font-black text-gray-800 leading-tight group-hover:text-blue-700 transition-colors truncate w-full">${item.namaProduk.toUpperCase()}</h4>
                </div>
                
                <div class="flex flex-row w-full md:w-auto gap-3 items-center md:justify-end shrink-0 border-t md:border-t-0 border-gray-100 pt-3 md:pt-0">
                    <div class="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100 shadow-sm text-right min-w-[120px]">
                        <span class="block text-[10px] text-gray-400 font-bold uppercase tracking-wide">Jual (Refrence)</span>
                        <span class="block font-bold text-gray-500 text-sm">Rp ${formatRupiahString(item.hasil.hargaJual)}</span>
                    </div>
                    <div class="bg-blue-50 px-3 py-2 rounded-lg border border-blue-200 shadow-sm text-right min-w-[140px] transition-colors relative group-hover:border-blue-300">
                        <span class="block text-[10px] text-blue-600 font-bold uppercase tracking-wide">Coret (Marketplace)</span>
                        <span class="block font-black text-blue-700 text-[17px] font-mono leading-tight">Rp ${formatRupiahString(hAwal)}</span>
                        <div class="absolute -right-1 -top-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white animate-pulse"></div>
                    </div>
                </div>
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
    
    let btnRollback = document.getElementById('btnRollbackMarkup');
    if(btnRollback) {
        let hasMarkup = masters.some(m => m.historyHpp && m.historyHpp.length > 0);
        if(hasMarkup) btnRollback.classList.remove('hidden');
        else btnRollback.classList.add('hidden');
    }
    
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
        let markHtml = (m.historyHpp && m.historyHpp.length > 0) ? `
                    <div class="text-right pr-4 border-r border-gray-100 flex flex-col justify-center">
                        <span class="inline-block text-[10px] pb-0.5 font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full border border-yellow-200"><i class="fa-solid fa-layer-group mr-1.5"></i>Dimarkup ${m.historyHpp.length}x</span>
                    </div>` : '';
                    
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
                    ${markHtml}
                    
                    <div class="flex flex-col gap-1.5 shrink-0">
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

window.showBulkMarkupModal = function() {
    const modal = document.getElementById('bulkMarkupModal');
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

window.rollbackBulkMarkup = function() {
    Swal.fire({
        title: 'Rollback HPP?', 
        text: "Anda yakin ingin membatalkan markup dan mengembalikan HPP ke riwayat nominal sebelumnya pada semua data yang tampil?", 
        icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya, Rollback!'
    }).then((result) => {
        if (result.isConfirmed) {
            let allData = getMasterData();
            let affectedIds = (window.currentFilteredMasters || []).map(m => String(m.id));
            let rollbackCount = 0;
            
            let updatedData = allData.map(m => {
                if(affectedIds.includes(String(m.id)) && m.historyHpp && m.historyHpp.length > 0) {
                    let newM = { ...m };
                    // Ambil hpp sebelumnya
                    let prevHpp = newM.historyHpp.pop();
                    newM.hpp = prevHpp;
                    rollbackCount++;
                    return newM;
                }
                return m;
            });
            
            setMasterData(updatedData);
            renderMasterView();
            Swal.fire({icon: 'success', title: 'Berhasil Rollback!', text: `HPP pada ${rollbackCount} data telah dikembalikan setingkat ke belakang.`, timer: 2000, showConfirmButton: false});
        }
    });
}

window.applyBulkMarkup = function() {
    let type = document.getElementById('bmmType').value;
    let val = parseFloat(document.getElementById('bmmValue').value) || 0;
    let pem = document.getElementById('bmmPem').value;
    
    let allData = getMasterData();
    let affectedIds = (window.currentFilteredMasters || []).map(m => String(m.id));
    
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
            
            let history = m.historyHpp ? [...m.historyHpp] : [];
            history.push(m.hpp); // Simpan hpp sebelum ditimpa
            
            return { ...m, hpp: res, historyHpp: history };
        }
        return m;
    });
    
    setMasterData(updatedData);
    closeBulkMarkupModal();
    renderMasterView();
    Swal.fire({icon: 'success', title: 'Markup Diterapkan!', text: `${affectedIds.length} data telah diperbarui HPP-nya.`, timer: 2000, showConfirmButton: false});
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

function addPlatformFeeForm(nama = '', persen = '', maks = '') {
    const row = document.createElement('div');
    row.className = 'grid grid-cols-1 sm:grid-cols-12 gap-3 bg-gray-50/50 p-4 rounded-xl border border-gray-200 platform-row platform-fee-row group relative';
    const formattedMaks = maks ? formatRupiahString(maks) : '';

    row.innerHTML = `
        <div class="sm:col-span-4">
            <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Nama / Jenis</span>
            <input type="text" class="fee-name w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-semibold" placeholder="Contoh: Gratis Ongkir" value="${nama}">
        </div>
        <div class="sm:col-span-4">
            <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Fee %</span>
            <div class="relative">
                <input type="number" step="any" min="0" max="100" class="fee-percent w-full text-center px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-6 font-semibold" placeholder="0" value="${persen}">
                <span class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 text-xs font-bold">%</span>
            </div>
        </div>
        <div class="sm:col-span-4">
            <span class="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Max/Flat (Rp)</span>
            <input type="text" class="fee-max input-rupiah font-mono w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-right font-bold text-gray-700" placeholder="Rp 0" value="${formattedMaks}">
        </div>
        <button type="button" class="btn-remove-fee absolute -top-2 -right-2 bg-white border border-red-200 text-red-500 hover:bg-red-500 hover:text-white rounded-full w-7 h-7 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100" title="Hapus Potongan">
            <i class="fa-solid fa-times text-xs"></i>
        </button>
    `;
    
    row.querySelector('.fee-percent').addEventListener('input', calculatePreview);
    row.querySelector('.fee-max').addEventListener('input', formatRupiathEvent);
    row.querySelector('.btn-remove-fee').addEventListener('click', function() {
        row.remove();
        calculatePreview();
    });
    
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
    plat = plat.toLowerCase();
    let fees = [];
    if (plat === 'tiktok') {
        fees.push({nama: 'Komisi Kategori', persen: 8, maksimalRp: 0});
        fees.push({nama: 'Komisi Dinamis', persen: 6, maksimalRp: 40000});
        fees.push({nama: 'Program XBP', persen: 4.5, maksimalRp: 20000});
        fees.push({nama: 'Biaya Proses Pesanan', persen: 0, maksimalRp: 1250});
    } else if (plat === 'shopee') {
        fees.push({nama: 'Biaya Kategori', persen: 10, maksimalRp: 0});
        fees.push({nama: 'Biaya Payment', persen: 1.8, maksimalRp: 50000});
        fees.push({nama: 'Promo Xtra', persen: 2, maksimalRp: 20000});
        fees.push({nama: 'Ongkir Xtra', persen: 5.5, maksimalRp: 20000});
        fees.push({nama: 'Live Xtra', persen: 0, maksimalRp: 0});
        fees.push({nama: 'Biaya Proses Pesanan', persen: 0, maksimalRp: 1250});
    }
    return fees; 
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

window.syncAllCalculations = function() {
    Swal.fire({
        title: 'Sinkronisasi Semua Harga?', 
        text: "Ini akan membaca HPP terbaru dari Master Data untuk semua Kalkulasi di Beranda, lalu menghitung ulang harganya secara otomatis menggunakan persenan admin/markup/diskon yang tersimpan. Lanjutkan?", 
        icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#2563eb', confirmButtonText: 'Ya, Sinkronisasi!'
    }).then((result) => {
        if (result.isConfirmed) {
            let localData = getLocalData();
            let masterData = getMasterData();
            let syncCount = 0;
            
            let updatedLocal = localData.map(item => {
                let master = masterData.find(m => m.namaProduk.toLowerCase() === item.namaProduk.toLowerCase());
                if (master && master.hpp !== item.hpp) {
                    // re-calculate based on new master.hpp
                    let feesArr = item.platformFees || [];
                    let hCalc = calculateProfitSilently(master.hpp, parseFloat(item.adminHppPersen)||0, parseFloat(item.markupPersen)||0, parseFloat(item.diskonPersen)||0, feesArr);
                    
                    let newItem = { ...item, hpp: master.hpp, hasil: hCalc };
                    syncCount++;
                    return newItem;
                }
                return item;
            });
            
            setLocalData(updatedLocal);
            renderListView(); // refresh beranda
            Swal.fire({icon: 'success', title: 'Sinkronisasi Selesai!', text: `Terdapat ${syncCount} perhitungan di Beranda berhasil disesuaikan dengan HPP Master Data terbaru.`, timer: 3000, showConfirmButton: false});
        }
    });
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

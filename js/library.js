// ================= ⭐ PRODUCT & FEE KNOWLEDGE LIBRARY MODULE =================

window.libraryItems = [];
window.showOutdatedLibraryItems = true;
window.currentLibraryImageBase64 = '';

// 1. ດຶງຂໍ້ມູນ Library ຈາກ Supabase (ພ້ອມ LocalStorage Fallback)
async function loadLibraryItems() {
    try {
        var localData = localStorage.getItem('ot_library_items');
        if (localData) window.libraryItems = JSON.parse(localData);
    } catch (e) {}

    if (window.supabaseClient) {
        try {
            var { data, error } = await window.supabaseClient
                .from('library_items')
                .select('*')
                .order('updated_at', { ascending: false });

            if (!error && data) {
                window.libraryItems = data.map(d => ({
                    id: d.id,
                    category: d.category || 'ຜະລິດຕະພັນອື່ນໆ',
                    title: d.title,
                    content: d.content,
                    fee: d.fee || '',
                    validPeriod: d.valid_period || '',
                    isOutdated: d.is_outdated || false,
                    imageUrl: d.image_url || '',
                    createdBy: d.created_by || 'Staff',
                    updatedBy: d.updated_by || 'Staff',
                    createdAt: d.created_at,
                    updatedAt: d.updated_at
                }));
                localStorage.setItem('ot_library_items', JSON.stringify(window.libraryItems));
            }
        } catch (err) {
            console.warn("Could not fetch library_items from cloud:", err);
        }
    }

    refreshCategoryDatalistAndFilter();
    renderLibraryGrid();
}

// ⭐ 2. BRAND LOGOS & BADGES (ກວດສອບ ແລະ ສະແດງພຽງໂລໂກ້ດຽວ ທີ່ກົງກັບຫົວຂໍ້)
function getSingleBrandLogo(titleInput, categoryInput) {
    var title = (titleInput || '').toLowerCase();
    var cat = (categoryInput || '').toLowerCase();

    // ກຳນົດລາຍການແບຣນ ແລະ Icon Template
    var brands = [
        {
            keys: ['unionpay', 'union pay', 'ຢູນຽນເພ', 'ຢູນ້ຽນເພ', 'ຢູນຽນ', 'cup'],
            html: `
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200 shadow-2xs">
                    <svg class="h-3.5 w-5 shrink-0" viewBox="0 0 32 20" fill="none">
                        <rect width="32" height="20" rx="3" fill="#004A80"/>
                        <path d="M5 4H11L8.5 16H2.5L5 4Z" fill="#DA291C"/>
                        <path d="M10 4H16L13.5 16H7.5L10 4Z" fill="#004A80"/>
                        <path d="M15 4H21L18.5 16H12.5L15 4Z" fill="#007934"/>
                        <text x="22" y="14" fill="#FFFFFF" font-size="7" font-weight="900" font-family="sans-serif">UP</text>
                    </svg>
                    <span>UnionPay</span>
                </span>
            `
        },
        {
            keys: ['visa', 'ວີຊາ', 'ວິຊາ'],
            html: `
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#1A1F71] text-white shadow-2xs">
                    <svg class="h-3.5 w-6 shrink-0" viewBox="0 0 36 14" fill="none">
                        <rect width="36" height="14" rx="2" fill="#1A1F71"/>
                        <text x="3" y="11" fill="#FFFFFF" font-family="'Inter', sans-serif" font-weight="900" font-style="italic" font-size="11" letter-spacing="0.5">VISA</text>
                        <path d="M4 3L7 3L5.5 6L4 3Z" fill="#F7B600"/>
                    </svg>
                    <span>VISA</span>
                </span>
            `
        },
        {
            keys: ['mastercard', 'master card', 'ມາສເຕີ', 'ມາສເຕີ້'],
            html: `
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#222222] text-white shadow-2xs">
                    <svg class="h-3.5 w-5 shrink-0" viewBox="0 0 32 20" fill="none">
                        <rect width="32" height="20" rx="3" fill="#1C1C1C"/>
                        <circle cx="12" cy="10" r="6" fill="#EB001B"/>
                        <circle cx="20" cy="10" r="6" fill="#F79E1B"/>
                        <path d="M16 5.8A6 6 0 0 0 13.8 10A6 6 0 0 0 16 14.2A6 6 0 0 0 18.2 10A6 6 0 0 0 16 5.8Z" fill="#FF5F00"/>
                    </svg>
                    <span>Mastercard</span>
                </span>
            `
        },
        {
            keys: ['wechat', 'wechat pay', 'ວີແຊັດ', 'ວິແຊັດ', 'ວີແຊດ'],
            html: `
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#07C160]/10 text-[#07C160] border border-[#07C160]/25 shadow-2xs">
                    <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8.69 3C4.44 3 1 6.01 1 9.72c0 2.12 1.1 3.99 2.82 5.22l-.72 2.17 2.53-.84c.94.3 1.98.46 3.06.46.28 0 .56-.01.84-.04a6.45 6.45 0 0 1-.22-1.68c0-3.71 3.44-6.72 7.69-6.72.39 0 .78.03 1.15.08C17.3 5.37 13.34 3 8.69 3zM6.5 7.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zm4.5 0a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zm4.88 4.78c-3.53 0-6.38 2.51-6.38 5.61 0 1.76.92 3.33 2.36 4.35l-.6 1.81 2.12-.7c.78.25 1.63.38 2.5.38 3.52 0 6.38-2.51 6.38-5.61s-2.86-5.61-6.38-5.61zm-1.88 3.44a1 1 0 1 1 0 2 1 1 0 0 1 0-2zm3.75 0a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                    </svg>
                    <span>WeChat Pay</span>
                </span>
            `
        },
        {
            keys: ['alipay', 'ອາລີເພ', 'ອາລິເພ'],
            html: `
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#1677FF]/10 text-[#1677FF] border border-[#1677FF]/25 shadow-2xs">
                    <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.4 15.2c-.75.76-1.88 1.14-3.2 1.14-1.79 0-3.3-.76-3.96-2l1.42-.95c.38.76 1.32 1.33 2.55 1.33.95 0 1.7-.28 2.08-.76.47-.57.38-1.23-.19-1.71l-1.8-1.33c-1.23-.85-1.7-1.9-1.7-2.95 0-1.71 1.32-3.04 3.31-3.04 1.61 0 2.74.66 3.4 1.71l-1.32 1.04c-.47-.66-1.13-1.04-2.08-1.04-1.04 0-1.61.57-1.61 1.33 0 .57.28 1.04 1.13 1.61l1.8 1.33c1.51 1.04 2.08 2.18 2.08 3.51.1 1.14-.38 2.18-1.4 3z"/>
                    </svg>
                    <span>Alipay</span>
                </span>
            `
        },
        {
            keys: ['promptpay', 'promtpay', 'ພຣອມເພ', 'ພ້ອມເພ', 'ພຣ້ອມເພ'],
            html: `
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#005689]/10 text-[#005689] border border-[#005689]/25 shadow-2xs">
                    <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none">
                        <rect width="24" height="24" rx="4" fill="#005689"/>
                        <path d="M6 14.5L10 8.5H14L10 14.5H6Z" fill="#00A3E0"/>
                        <path d="M11 15.5L14 11H18L15 15.5H11Z" fill="#FFFFFF"/>
                    </svg>
                    <span>PromptPay</span>
                </span>
            `
        }
    ];

    // ຂັ້ນຕອນທີ 1: ກວດສອບຈາກ "ຫົວຂໍ້ (Title)" ກ່ອນເປັນອັນດັບທຳອິດ (ຖ້າກົງ ໃຫ້ເອົາອັນນັ້ນອັນດຽວທັນທີ)
    for (var b of brands) {
        if (b.keys.some(k => title.includes(k))) {
            return b.html;
        }
    }

    // ຂັ້ນຕອນທີ 2: ຖ້າຫົວຂໍ້ບໍ່ມີ ຈຶ່ງກວດສອບຈາກໝວດໝູ່ (Category) ແຕ່ກໍຈະເອົາພຽງແຕ່ອັນດຽວເຊັ່ນກັນ
    for (var b of brands) {
        if (b.keys.some(k => cat.includes(k))) {
            return b.html;
        }
    }

    return null; // ຖ້າບໍ່ມີແບຣນເລີຍ
}

// ສ້າງ BRAND BADGES ຫຼື ICON ຕາມໝວດໝູ່
function renderBrandOrCategoryBadge(title, category) {
    var singleBrandLogo = getSingleBrandLogo(title, category);
    if (singleBrandLogo) {
        return singleBrandLogo;
    }

    // Fallback Icons ຕາມປະເພດວຽກ
    var text = `${title} ${category}`.toLowerCase();
    if (text.includes('ໂອນ') || text.includes('transfer') || text.includes('swift')) {
        return `
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-red-50 text-brand-red border border-red-100">
                <span class="material-symbols-outlined text-[13px]">currency_exchange</span> ໂອນເງິນ
            </span>
        `;
    } else if (text.includes('ບັດ') || text.includes('card')) {
        return `
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                <span class="material-symbols-outlined text-[13px]">credit_card</span> ສູນບັດ
            </span>
        `;
    } else if (text.includes('ໂປຣ') || text.includes('promo') || text.includes('ຕະຫຼາດ')) {
        return `
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                <span class="material-symbols-outlined text-[13px]">campaign</span> ໂປຣໂມຊັ່ນ
            </span>
        `;
    } else if (text.includes('ຖອນ') || text.includes('atm') || text.includes('ສົດ')) {
        return `
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                <span class="material-symbols-outlined text-[13px]">atm</span> ຖອນເງິນສົດ
            </span>
        `;
    }

    return `
        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-700">
            <span class="material-symbols-outlined text-[13px] text-slate-500">local_offer</span> ຜະລິດຕະພັນ
        </span>
    `;
}

// ⭐ 3. SEARCH DROPDOWN MATCH-UP LOGIC
function openSearchDropdown() {
    renderSearchDropdownList();
    var dropdown = document.getElementById('libSearchDropdown');
    if (dropdown) dropdown.classList.remove('hidden');
}

function closeSearchDropdown() {
    var dropdown = document.getElementById('libSearchDropdown');
    if (dropdown) dropdown.classList.add('hidden');
}

function handleSearchInput(event) {
    var val = event.target.value.trim();
    var clearBtn = document.getElementById('libSearchClearBtn');
    if (clearBtn) {
        if (val) clearBtn.classList.remove('hidden');
        else clearBtn.classList.add('hidden');
    }

    renderSearchDropdownList();
    renderLibraryGrid();
}

function clearSearchInput() {
    var input = document.getElementById('libSearchInput');
    if (input) input.value = '';
    var clearBtn = document.getElementById('libSearchClearBtn');
    if (clearBtn) clearBtn.classList.add('hidden');
    renderSearchDropdownList();
    renderLibraryGrid();
    input.focus();
}

function renderSearchDropdownList() {
    var listContainer = document.getElementById('libSearchDropdownList');
    var dropdown = document.getElementById('libSearchDropdown');
    if (!listContainer || !dropdown) return;

    var q = (document.getElementById('libSearchInput')?.value || '').trim().toLowerCase();
    var items = window.libraryItems || [];

    var matches = items.filter(item => {
        if (!q) return true;
        var textToSearch = `${item.title} ${item.content} ${item.fee} ${item.category}`.toLowerCase();
        return textToSearch.includes(q);
    });

    if (matches.length === 0) {
        listContainer.innerHTML = `
            <div class="p-6 text-center text-slate-400">
                <span class="material-symbols-outlined text-3xl text-slate-300 block mb-1">search_off</span>
                <p class="font-bold text-xs text-slate-600">ບໍ່ພົບຂໍ້ມູນທີ່ກົງກັບ "${q}"</p>
                <p class="text-[11px] text-slate-400 mt-0.5">ລອງຄົ້ນຫາດ້ວຍຊື່ແບຣນ ເຊັ່ນ: Visa, PromptPay, UnionPay...</p>
            </div>
        `;
        dropdown.classList.remove('hidden');
        return;
    }

    var html = '';
    html += `
        <div class="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center bg-slate-50 rounded-xl mb-1">
            <span>${q ? `ຜົນການຄົ້ນຫາທີ່ກົງກັນ (${matches.length} ລາຍການ)` : `ລາຍການຜະລິດຕະພັນທັງໝົດ (${matches.length})`}</span>
            <span class="text-brand-red font-semibold">ກົດເພື່ອເບິ່ງລາຍລະອຽດ</span>
        </div>
    `;

    matches.slice(0, 10).forEach(item => {
        var brandBadge = getSingleBrandLogo(item.title, item.category) || '';
        var feeTag = item.fee ? `
            <span class="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-brand-red font-bold rounded-md text-[10px] shrink-0 border border-red-100">
                <span class="material-symbols-outlined text-[11px]">payments</span> ${item.fee}
            </span>
        ` : '';

        html += `
            <div onclick="selectDropdownItem('${item.id}', '${item.title.replace(/'/g, "\\'")}')" 
                class="p-2.5 hover:bg-red-50/60 rounded-xl cursor-pointer transition flex items-center justify-between gap-3 group border border-transparent hover:border-red-100">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1.5 flex-wrap mb-1">
                        ${brandBadge}
                        <span class="text-[10px] text-slate-400 font-semibold">• ${item.category}</span>
                    </div>
                    <h4 class="font-bold text-xs text-slate-800 group-hover:text-brand-red transition truncate">${item.title}</h4>
                    <p class="text-[11px] text-slate-400 truncate mt-0.5">${item.content}</p>
                </div>
                <div class="flex flex-col items-end gap-1 shrink-0">
                    ${feeTag}
                    <span class="material-symbols-outlined text-slate-300 group-hover:text-brand-red text-base transition">chevron_right</span>
                </div>
            </div>
        `;
    });

    listContainer.innerHTML = html;
    dropdown.classList.remove('hidden');
}

function selectDropdownItem(id, title) {
    var input = document.getElementById('libSearchInput');
    if (input) input.value = title;
    var clearBtn = document.getElementById('libSearchClearBtn');
    if (clearBtn) clearBtn.classList.remove('hidden');

    closeSearchDropdown();
    renderLibraryGrid();
    openLibraryDetailModal(id);
}

document.addEventListener('click', function(e) {
    var searchWrapper = document.getElementById('searchWrapper');
    if (searchWrapper && !searchWrapper.contains(e.target)) {
        closeSearchDropdown();
    }
});

// ⭐ 4. ອັບເດດລາຍການໝວດໝູ່
function refreshCategoryDatalistAndFilter() {
    var defaultCats = [
        'ໂອນເງິນພາຍໃນ & ຕ່າງປະເທດ',
        'QR ສາກົນ (WeChat, Alipay, PromptPay)',
        'ສູນບັດ & ຄ່າທຳນຽມບັດ (UnionPay, Visa, Mastercard)',
        'ໂປຣໂມຊັ່ນການຕະຫຼາດ',
        'ຜະລິດຕະພັນອື່ນໆ'
    ];

    var allCatsSet = new Set(defaultCats);
    (window.libraryItems || []).forEach(item => {
        if (item.category && item.category.trim()) {
            allCatsSet.add(item.category.trim());
        }
    });

    var datalist = document.getElementById('libCategorySuggestions');
    if (datalist) {
        datalist.innerHTML = '';
        allCatsSet.forEach(cat => {
            var opt = document.createElement('option');
            opt.value = cat;
            datalist.appendChild(opt);
        });
    }

    var filterSelect = document.getElementById('libCategoryFilter');
    if (filterSelect) {
        var currentVal = filterSelect.value || 'ALL';
        filterSelect.innerHTML = `<option value="ALL">ທຸກໝວດໝູ່ (All Categories)</option>`;
        allCatsSet.forEach(cat => {
            var opt = document.createElement('option');
            opt.value = cat;
            opt.innerText = cat;
            if (cat === currentVal) opt.selected = true;
            filterSelect.appendChild(opt);
        });
    }
}

// ⭐ 5. RENDER CARDS ໃນ LIBRARY GRID
function renderLibraryGrid() {
    var container = document.getElementById('libraryGridContainer');
    if (!container) return;
    container.innerHTML = '';

    var q = (document.getElementById('libSearchInput')?.value || '').trim().toLowerCase();
    var cat = document.getElementById('libCategoryFilter')?.value || 'ALL';

    var filtered = (window.libraryItems || []).filter(item => {
        if (!window.showOutdatedLibraryItems && item.isOutdated) return false;
        if (cat !== 'ALL' && item.category !== cat) return false;
        if (q) {
            var matchTitle = (item.title || '').toLowerCase().includes(q);
            var matchContent = (item.content || '').toLowerCase().includes(q);
            var matchFee = (item.fee || '').toLowerCase().includes(q);
            var matchCategory = (item.category || '').toLowerCase().includes(q);
            var matchAuthor = (item.updatedBy || '').toLowerCase().includes(q);
            if (!matchTitle && !matchContent && !matchFee && !matchCategory && !matchAuthor) return false;
        }
        return true;
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-12 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                <span class="material-symbols-outlined text-4xl block mb-2 text-slate-300">menu_book</span>
                <p class="font-bold text-sm text-slate-700">ບໍ່ພົບຂໍ້ມູນຜະລິດຕະພັນໃນໝວດນີ້</p>
                <p class="text-xs text-slate-400 mt-0.5">ກົດປຸ່ມ "ເພີ່ມຫົວຂໍ້ໃໝ່" ເພື່ອສ້າງຂໍ້ມູນຄ່າທຳນຽມ ຫຼື ຜະລິດຕະພັນ</p>
            </div>
        `;
        return;
    }

    filtered.forEach(item => {
        var isOutdated = item.isOutdated;
        var statusBadge = isOutdated
            ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-rose-600"></span> Out of date</span>`
            : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> ໃຊ້ງານຢູ່</span>`;

        var updatedDateStr = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('lo-LA', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
        
        // ⭐ ຈະສະແດງພຽງໂລໂກ້ດຽວເທົ່ານັ້ນຕາມຫົວຂໍ້
        var brandSymbolsHtml = renderBrandOrCategoryBadge(item.title, item.category);

        container.innerHTML += `
            <div class="bg-white border ${isOutdated ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200'} rounded-3xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between gap-3 text-xs">
                <div class="space-y-2.5">
                    <div class="flex justify-between items-start gap-2">
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 truncate max-w-[170px]" title="${item.category}">
                            ${item.category}
                        </span>
                        ${statusBadge}
                    </div>

                    <!-- Single Brand Logo Badge -->
                    <div class="flex flex-wrap gap-1.5 pt-0.5">
                        ${brandSymbolsHtml}
                    </div>

                    <h3 class="font-bold text-sm text-slate-800 leading-snug cursor-pointer hover:text-brand-red transition" onclick="openLibraryDetailModal('${item.id}')">
                        ${item.title}
                    </h3>

                    ${item.fee ? `
                        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-brand-red border border-red-200 rounded-xl font-bold text-[11px]">
                            <span class="material-symbols-outlined text-sm">payments</span> ${item.fee}
                        </div>
                    ` : ''}

                    <p class="text-slate-500 line-clamp-3 leading-relaxed text-[11px]">${item.content}</p>

                    ${item.imageUrl ? `
                        <div class="pt-1">
                            <img src="${item.imageUrl}" onclick="openLibraryDetailModal('${item.id}')" class="h-28 w-full object-cover rounded-2xl border cursor-pointer hover:opacity-90 transition"/>
                        </div>
                    ` : ''}
                </div>

                <div class="pt-3 border-t border-slate-100 flex flex-col gap-2">
                    <div class="flex justify-between items-center text-[10px] text-slate-400">
                        <span>ໂດຍ: <strong class="text-slate-600">${item.updatedBy || item.createdBy}</strong></span>
                        <span>${updatedDateStr}</span>
                    </div>
                    <div class="flex items-center justify-between gap-2 pt-1">
                        <button type="button" onclick="openLibraryDetailModal('${item.id}')" class="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[11px] transition cursor-pointer text-center">
                            ເບິ່ງລາຍລະອຽດ
                        </button>
                        <button type="button" onclick="openEditLibraryModal('${item.id}')" class="p-2 text-slate-500 hover:text-brand-red hover:bg-red-50 rounded-xl transition cursor-pointer" title="ແກ້ໄຂ">
                            <span class="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button type="button" onclick="promptDeleteLibraryItem('${item.id}')" class="p-2 text-slate-400 hover:text-brand-red hover:bg-red-50 rounded-xl transition cursor-pointer" title="ລຶບ">
                            <span class="material-symbols-outlined text-base">delete</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
}

function filterLibraryItems() {
    renderLibraryGrid();
}

function toggleShowOutdated() {
    window.showOutdatedLibraryItems = !window.showOutdatedLibraryItems;
    var btnText = document.getElementById('libToggleOutdatedText');
    if (btnText) btnText.innerText = window.showOutdatedLibraryItems ? 'ລວມ Out of date' : 'ເຊື່ອງ Out of date';
    renderLibraryGrid();
}

// 6. MODAL ຈັດການຂໍ້ມູນ
function openAddLibraryModal() {
    document.getElementById('libItemId').value = '';
    document.getElementById('libModalTitle').innerText = 'ເພີ່ມຂໍ້ມູນຜະລິດຕະພັນໃໝ່';
    document.getElementById('libItemCategory').value = 'ໂອນເງິນພາຍໃນ & ຕ່າງປະເທດ';
    document.getElementById('libItemTitle').value = '';
    document.getElementById('libItemFee').value = '';
    document.getElementById('libItemPeriod').value = '';
    document.getElementById('libItemContent').value = '';
    document.getElementById('libItemIsOutdated').checked = false;
    window.currentLibraryImageBase64 = '';
    removeLibraryImagePreview();
    refreshCategoryDatalistAndFilter();
    document.getElementById('libraryItemModal')?.classList.remove('hidden');
}

function openEditLibraryModal(id) {
    var item = (window.libraryItems || []).find(i => i.id === id);
    if (!item) return;

    document.getElementById('libItemId').value = item.id;
    document.getElementById('libModalTitle').innerText = 'ແກ້ໄຂຂໍ້ມູນຜະລິດຕະພັນ';
    document.getElementById('libItemCategory').value = item.category;
    document.getElementById('libItemTitle').value = item.title;
    document.getElementById('libItemFee').value = item.fee || '';
    document.getElementById('libItemPeriod').value = item.validPeriod || '';
    document.getElementById('libItemContent').value = item.content;
    document.getElementById('libItemIsOutdated').checked = item.isOutdated;
    
    window.currentLibraryImageBase64 = item.imageUrl || '';
    if (item.imageUrl) {
        var preview = document.getElementById('libImagePreview');
        if (preview) preview.src = item.imageUrl;
        document.getElementById('libImagePreviewContainer')?.classList.remove('hidden');
        document.getElementById('libRemoveImageBtn')?.classList.remove('hidden');
    } else {
        removeLibraryImagePreview();
    }

    refreshCategoryDatalistAndFilter();
    document.getElementById('libraryItemModal')?.classList.remove('hidden');
}

function closeLibraryModal() {
    document.getElementById('libraryItemModal')?.classList.add('hidden');
}

function handleLibraryImageUpload(event) {
    var file = event.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
            var canvas = document.createElement('canvas');
            var maxW = 900;
            var w = img.width, h = img.height;
            if (w > maxW) {
                h = Math.round((h * maxW) / w);
                w = maxW;
            }
            canvas.width = w; canvas.height = h;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            var compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);

            window.currentLibraryImageBase64 = compressedBase64;
            var preview = document.getElementById('libImagePreview');
            if (preview) preview.src = compressedBase64;
            document.getElementById('libImagePreviewContainer')?.classList.remove('hidden');
            document.getElementById('libRemoveImageBtn')?.classList.remove('hidden');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function removeLibraryImagePreview() {
    window.currentLibraryImageBase64 = '';
    var preview = document.getElementById('libImagePreview');
    if (preview) preview.src = '';
    document.getElementById('libImagePreviewContainer')?.classList.add('hidden');
    document.getElementById('libRemoveImageBtn')?.classList.add('hidden');
    var fileInput = document.getElementById('libImageFileInput');
    if (fileInput) fileInput.value = '';
}

// ⭐ 7. ບັນທຶກ ແລະ ສົ່ງແຈ້ງເຕືອນຫາ User ທຸກຄົນໃນລະບົບຜ່ານ Supabase
async function handleSaveLibraryItem() {
    var id = document.getElementById('libItemId')?.value;
    var category = document.getElementById('libItemCategory')?.value.trim();
    var title = document.getElementById('libItemTitle')?.value.trim();
    var fee = document.getElementById('libItemFee')?.value.trim();
    var period = document.getElementById('libItemPeriod')?.value.trim();
    var content = document.getElementById('libItemContent')?.value.trim();
    var isOutdated = document.getElementById('libItemIsOutdated')?.checked || false;

    if (!category) category = 'ຜະລິດຕະພັນອື່ນໆ';

    if (!title || !content) {
        if (typeof showToast === 'function') showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາປ້ອນຫົວຂໍ້ ແລະ ເນື້ອໃນໃຫ້ຄົບຖ້ວນ', 'error');
        return;
    }

    var user = (typeof getCurrentUserSafe === 'function') ? getCurrentUserSafe() : window.currentUser;
    var authorName = user?.nameLao || user?.fullName || 'Staff';
    var isEdit = Boolean(id);
    var itemId = id || ('lib-' + Date.now());

    var itemObj = {
        id: itemId,
        category: category,
        title: title,
        content: content,
        fee: fee,
        validPeriod: period,
        isOutdated: isOutdated,
        imageUrl: window.currentLibraryImageBase64 || '',
        updatedBy: authorName,
        updatedAt: new Date().toISOString()
    };

    if (!isEdit) {
        itemObj.createdBy = authorName;
        itemObj.createdAt = new Date().toISOString();
        if (!window.libraryItems) window.libraryItems = [];
        window.libraryItems.unshift(itemObj);
    } else {
        var idx = window.libraryItems.findIndex(i => i.id === id);
        if (idx !== -1) {
            itemObj.createdBy = window.libraryItems[idx].createdBy;
            itemObj.createdAt = window.libraryItems[idx].createdAt;
            window.libraryItems[idx] = itemObj;
        }
    }

    localStorage.setItem('ot_library_items', JSON.stringify(window.libraryItems));

    // 1. Sync ຂໍ້ມູນຂຶ້ນ Supabase Database
    if (window.supabaseClient) {
        try {
            var payload = {
                id: itemObj.id,
                category: itemObj.category,
                title: itemObj.title,
                content: itemObj.content,
                fee: itemObj.fee,
                valid_period: itemObj.validPeriod,
                is_outdated: itemObj.isOutdated,
                image_url: itemObj.imageUrl,
                updated_by: itemObj.updatedBy,
                updated_at: itemObj.updatedAt
            };
            if (!isEdit) {
                payload.created_by = itemObj.createdBy;
                payload.created_at = itemObj.createdAt;
            }

            await window.supabaseClient.from('library_items').upsert(payload, { onConflict: 'id' });
        } catch (err) {
            console.error("Supabase Library Sync Error:", err);
        }
    }

    // 2. ⭐ ສົ່ງແຈ້ງເຕືອນໄປຫາ User ອື່ນໆທຸກຄົນ (ບັນທຶກລົງ Supabase Notifications Table)
    var notifTitle = isEdit ? `ອັບເດດຂໍ້ມູນ: ${title}` : `ເພີ່ມຂໍ້ມູນໃໝ່: ${title}`;
    var notifMessage = `${authorName} ໄດ້ອັບເດດຂໍ້ມູນ "${title}" ໃນໝວດ [${category}]`;

    // ແຈ້ງເຕືອນໃນ Local State ທັນທີ
    var notifEntry = {
        id: Date.now(),
        title: notifTitle,
        message: notifMessage,
        tag: 'Library ຄວາມຮູ້',
        date: new Date().toLocaleString('lo-LA'),
        readBy: [user?.user || 'me']
    };
    if (!window.systemNotifications) window.systemNotifications = [];
    window.systemNotifications.unshift(notifEntry);
    if (typeof window.updateNotificationBadge === 'function') window.updateNotificationBadge();

    // ແຈ້ງເຕືອນຂຶ້ນ Cloud Database (ເພື່ອໃຫ້ User ອື່ນໄດ້ຮັບການແຈ້ງເຕືອນ)
    if (window.supabaseClient) {
        try {
            await window.supabaseClient.from('notifications').insert([{
                title: notifTitle,
                message: notifMessage,
                tag: 'Library ຄວາມຮູ້',
                created_by: authorName,
                created_at: new Date().toISOString(),
                read_by: [user?.user || 'me']
            }]);
        } catch (nErr) {
            console.warn("Could not push notification to cloud:", nErr);
        }
    }

    closeLibraryModal();
    refreshCategoryDatalistAndFilter();
    renderLibraryGrid();
    if (typeof showToast === 'function') showToast('ສຳເລັດ', isEdit ? 'ອັບເດດຂໍ້ມູນຮຽບຮ້ອຍ!' : 'ເພີ່ມຂໍ້ມູນໃໝ່ຮຽບຮ້ອຍ!', 'success');
}

// 8. ເບິ່ງລາຍລະອຽດເຕັມ (Detail Modal)
function openLibraryDetailModal(id) {
    var item = (window.libraryItems || []).find(i => i.id === id);
    if (!item) return;

    document.getElementById('libDetailCategoryBadge').innerText = item.category;
    document.getElementById('libDetailTitle').innerText = item.title;
    document.getElementById('libDetailPeriod').innerText = item.validPeriod || 'ບໍ່ກຳນົດ';
    document.getElementById('libDetailContent').innerText = item.content;
    document.getElementById('libDetailAuthor').innerText = item.updatedBy || item.createdBy || 'Staff';
    document.getElementById('libDetailUpdatedAt').innerText = item.updatedAt ? new Date(item.updatedAt).toLocaleString('lo-LA') : '-';

    var statusEl = document.getElementById('libDetailStatusBadge');
    if (statusEl) {
        statusEl.innerHTML = item.isOutdated
            ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">Out of date</span>`
            : `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">ໃຊ້ງານຢູ່</span>`;
    }

    var feeBox = document.getElementById('libDetailFeeBox');
    if (feeBox) {
        if (item.fee) {
            document.getElementById('libDetailFeeText').innerText = item.fee;
            feeBox.classList.remove('hidden');
        } else {
            feeBox.classList.add('hidden');
        }
    }

    var imgBox = document.getElementById('libDetailImageBox');
    if (imgBox) {
        if (item.imageUrl) {
            document.getElementById('libDetailImage').src = item.imageUrl;
            document.getElementById('libDetailImageLink').href = item.imageUrl;
            imgBox.classList.remove('hidden');
        } else {
            imgBox.classList.add('hidden');
        }
    }

    var outdateBtn = document.getElementById('libDetailToggleOutdateBtn');
    if (outdateBtn) {
        outdateBtn.innerText = item.isOutdated ? 'ປ່ຽນເປັນ: ໃຊ້ງານຢູ່' : 'ໝາຍວ່າ: Out of date';
        outdateBtn.onclick = function() { toggleItemOutdated(item.id); };
    }

    var editBtn = document.getElementById('libDetailEditBtn');
    if (editBtn) {
        editBtn.onclick = function() {
            closeLibraryDetailModal();
            openEditLibraryModal(item.id);
        };
    }

    document.getElementById('libraryDetailModal')?.classList.remove('hidden');
}

function closeLibraryDetailModal() {
    document.getElementById('libraryDetailModal')?.classList.add('hidden');
}

async function toggleItemOutdated(id) {
    var item = (window.libraryItems || []).find(i => i.id === id);
    if (!item) return;

    item.isOutdated = !item.isOutdated;
    item.updatedAt = new Date().toISOString();
    var user = (typeof getCurrentUserSafe === 'function') ? getCurrentUserSafe() : window.currentUser;
    item.updatedBy = user?.nameLao || 'Staff';

    localStorage.setItem('ot_library_items', JSON.stringify(window.libraryItems));

    if (window.supabaseClient) {
        try {
            await window.supabaseClient.from('library_items').update({
                is_outdated: item.isOutdated,
                updated_by: item.updatedBy,
                updated_at: item.updatedAt
            }).eq('id', id);

            // ສົ່ງແຈ້ງເຕືອນເມື່ອມີການໝາຍ Out of date
            await window.supabaseClient.from('notifications').insert([{
                title: `ອັບເດດສະຖານະ: ${item.title}`,
                message: `${item.updatedBy} ໄດ້ປ່ຽນສະຖານະ "${item.title}" ເປັນ ${item.isOutdated ? 'Out of date' : 'ໃຊ້ງານຢູ່'}`,
                tag: 'Library ຄວາມຮູ້',
                created_by: item.updatedBy,
                created_at: new Date().toISOString(),
                read_by: [user?.user || 'me']
            }]);
        } catch (e) {}
    }

    closeLibraryDetailModal();
    renderLibraryGrid();
    if (typeof showToast === 'function') showToast('ສຳເລັດ', `ປ່ຽນສະຖານະເປັນ "${item.isOutdated ? 'Out of date' : 'ໃຊ້ງານຢູ່'}" ແລ້ວ`, 'info');
}

function promptDeleteLibraryItem(id) {
    var item = (window.libraryItems || []).find(i => i.id === id);
    if (!item) return;

    if (confirm(`ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບຫົວຂໍ້ "${item.title}"?`)) {
        window.libraryItems = window.libraryItems.filter(i => i.id !== id);
        localStorage.setItem('ot_library_items', JSON.stringify(window.libraryItems));

        if (window.supabaseClient) {
            window.supabaseClient.from('library_items').delete().eq('id', id);
        }

        refreshCategoryDatalistAndFilter();
        renderLibraryGrid();
        if (typeof showToast === 'function') showToast('ສຳເລັດ', 'ລຶບຫົວຂໍ້ອອກຈາກ Library ແລ້ວ', 'success');
    }
}

// ⭐ Auto-load ເມື່ອກົດ Tab 'library'
var _origTabForLib = window.switchTab;
window.switchTab = function(tab) {
    if (typeof _origTabForLib === 'function') _origTabForLib(tab);
    if (tab === 'library') {
        loadLibraryItems();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    loadLibraryItems();
});

// ຜູກ Function ເຂົ້າ Window
window.loadLibraryItems = loadLibraryItems;
window.getSingleBrandLogo = getSingleBrandLogo;
window.renderBrandOrCategoryBadge = renderBrandOrCategoryBadge;
window.openSearchDropdown = openSearchDropdown;
window.closeSearchDropdown = closeSearchDropdown;
window.handleSearchInput = handleSearchInput;
window.clearSearchInput = clearSearchInput;
window.renderSearchDropdownList = renderSearchDropdownList;
window.selectDropdownItem = selectDropdownItem;
window.refreshCategoryDatalistAndFilter = refreshCategoryDatalistAndFilter;
window.renderLibraryGrid = renderLibraryGrid;
window.filterLibraryItems = filterLibraryItems;
window.toggleShowOutdated = toggleShowOutdated;
window.openAddLibraryModal = openAddLibraryModal;
window.openEditLibraryModal = openEditLibraryModal;
window.closeLibraryModal = closeLibraryModal;
window.handleLibraryImageUpload = handleLibraryImageUpload;
window.removeLibraryImagePreview = removeLibraryImagePreview;
window.handleSaveLibraryItem = handleSaveLibraryItem;
window.openLibraryDetailModal = openLibraryDetailModal;
window.closeLibraryDetailModal = closeLibraryDetailModal;
window.toggleItemOutdated = toggleItemOutdated;
window.promptDeleteLibraryItem = promptDeleteLibraryItem;

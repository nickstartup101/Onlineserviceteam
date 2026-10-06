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

// ⭐ 2. BRAND LOGOS & BADGES (ກວດສອບ ແລະ ສະແດງພຽງໂລໂກ້ດຽວຕາມຫົວຂໍ້)
function getSingleBrandLogo(titleInput, categoryInput) {
    var title = (titleInput || '').toLowerCase();
    var cat = (categoryInput || '').toLowerCase();

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

    // ຂັ້ນຕອນທີ 1: ກວດສອບຈາກ "ຫົວຂໍ້ (Title)" ກ່ອນສະເໝີ (ຖ້າກົງ ໃຫ້ສົ່ງຄືນພຽງໂລໂກ້ດຽວທັນທີ)
    for (var b of brands) {
        if (b.keys.some(k => title.includes(k))) {
            return b.html;
        }
    }

    // ຂັ້ນຕອນທີ 2: ຖ້າຫົວຂໍ້ບໍ່ມີ ຈຶ່ງກວດສອບຈາກ Category (ແຕ່ກໍຈະເອົາພຽງແຕ່ໂລໂກ້ດຽວ)
    for (var b of brands) {
        if (b.keys.some(k => cat.includes(k))) {
            return b.html;
        }
    }

    return null;
}

// ສ້າງ BRAND BADGES ຫຼື ICON ຕາມໝວດໝູ່
function renderBrandOrCategoryBadge(title, category) {
    var singleBrandLogo = getSingleBrandLogo(title, category);
    if (singleBrandLogo) {
        return singleBrandLogo;
    }

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

// ⭐ 3. ລະບົບຈັດການໝວດໝູ່ (ແກ້ໄຂ / ລຶບ / ເພີ່ມ)
function getUniqueCategoriesList() {
    var defaultCats = [
        'ໂອນເງິນພາຍໃນ & ຕ່າງປະເທດ',
        'QR ສາກົນ (WeChat, Alipay, PromptPay)',
        'ສູນບັດ & ຄ່າທຳນຽມບັດ (UnionPay, Visa, Mastercard)',
        'ໂປຣໂມຊັ່ນການຕະຫຼາດ',
        'ຜະລິດຕະພັນອື່ນໆ'
    ];

    var deletedCats = JSON.parse(localStorage.getItem('ot_deleted_categories') || '[]');
    var catSet = new Set(defaultCats.filter(c => !deletedCats.includes(c)));

    (window.libraryItems || []).forEach(item => {
        if (item.category && item.category.trim() && !deletedCats.includes(item.category.trim())) {
            catSet.add(item.category.trim());
        }
    });

    return Array.from(catSet);
}

function openManageCategoryModal() {
    renderManageCategoryList();
    document.getElementById('manageCategoryModal')?.classList.remove('hidden');
}

function closeManageCategoryModal() {
    document.getElementById('manageCategoryModal')?.classList.add('hidden');
}

function renderManageCategoryList() {
    var container = document.getElementById('manageCategoryListContainer');
    if (!container) return;

    var cats = getUniqueCategoriesList();
    var items = window.libraryItems || [];

    if (cats.length === 0) {
        container.innerHTML = `<p class="text-slate-400 text-center py-4">ບໍ່ມີໝວດໝູ່</p>`;
        return;
    }

    var html = '';
    cats.forEach(cat => {
        var count = items.filter(i => (i.category || '').trim() === cat).length;

        html += `
            <div class="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl shadow-2xs hover:border-slate-300 transition">
                <div class="flex-1 min-w-0 pr-2">
                    <span class="font-bold text-slate-800 text-xs block truncate">${cat}</span>
                    <span class="text-[10px] text-slate-400">ມີ ${count} ບົດຄວາມ/ຜະລິດຕະພັນ</span>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    <button type="button" onclick="promptEditCategory('${cat.replace(/'/g, "\\'")}')" class="p-1.5 text-slate-500 hover:text-brand-red hover:bg-red-50 rounded-lg transition cursor-pointer" title="ປ່ຽນຊື່ໝວດໝູ່">
                        <span class="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button type="button" onclick="promptDeleteCategory('${cat.replace(/'/g, "\\'")}', ${count})" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer" title="ລຶບໝວດໝູ່">
                        <span class="material-symbols-outlined text-base">delete</span>
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function handleAddNewCategoryQuick() {
    var input = document.getElementById('newCategoryQuickInput');
    var val = (input?.value || '').trim();
    if (!val) return;

    var deletedCats = JSON.parse(localStorage.getItem('ot_deleted_categories') || '[]');
    deletedCats = deletedCats.filter(c => c !== val);
    localStorage.setItem('ot_deleted_categories', JSON.stringify(deletedCats));

    input.value = '';
    refreshCategoryDatalistAndFilter();
    renderManageCategoryList();
    if (typeof showToast === 'function') showToast('ສຳເລັດ', `ເພີ່ມໝວດໝູ່ "${val}" ແລ້ວ`, 'success');
}

async function promptEditCategory(oldName) {
    var newName = prompt(`ປ້ອນຊື່ໝວດໝູ່ໃໝ່ສຳລັບ "${oldName}":`, oldName);
    if (!newName || newName.trim() === '' || newName.trim() === oldName) return;

    newName = newName.trim();
    var affectedCount = 0;

    (window.libraryItems || []).forEach(item => {
        if ((item.category || '').trim() === oldName) {
            item.category = newName;
            item.updatedAt = new Date().toISOString();
            affectedCount++;
        }
    });

    localStorage.setItem('ot_library_items', JSON.stringify(window.libraryItems));

    var deletedCats = JSON.parse(localStorage.getItem('ot_deleted_categories') || '[]');
    deletedCats = deletedCats.filter(c => c !== newName);
    localStorage.setItem('ot_deleted_categories', JSON.stringify(deletedCats));

    if (window.supabaseClient) {
        try {
            await window.supabaseClient
                .from('library_items')
                .update({ category: newName, updated_at: new Date().toISOString() })
                .eq('category', oldName);
        } catch (err) {
            console.error("Supabase category update error:", err);
        }
    }

    refreshCategoryDatalistAndFilter();
    renderLibraryGrid();
    renderManageCategoryList();

    if (typeof showToast === 'function') {
        showToast('ສຳເລັດ', `ປ່ຽນຊື່ເປັນ "${newName}" ແລ້ວ (ອັບເດດ ${affectedCount} ລາຍການ)`, 'success');
    }
}

async function promptDeleteCategory(catName, count) {
    var confirmMsg = count > 0
        ? `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບໝວດໝູ່ "${catName}"?\n\nບົດຄວາມທີ່ມີຢູ່ທັງໝົດ (${count} ລາຍການ) ຈະຖືກຍ້າຍໄປຢູ່ໝວດ "ຜະລິດຕະພັນອື່ນໆ"`
        : `ທ່ານແນ່ໃຈບໍ່ວ່າຕ້ອງການລຶບໝວດໝູ່ "${catName}"?`;

    if (!confirm(confirmMsg)) return;

    (window.libraryItems || []).forEach(item => {
        if ((item.category || '').trim() === catName) {
            item.category = 'ຜະລິດຕະພັນອື່ນໆ';
            item.updatedAt = new Date().toISOString();
        }
    });
    localStorage.setItem('ot_library_items', JSON.stringify(window.libraryItems));

    var deletedCats = JSON.parse(localStorage.getItem('ot_deleted_categories') || '[]');
    if (!deletedCats.includes(catName)) {
        deletedCats.push(catName);
        localStorage.setItem('ot_deleted_categories', JSON.stringify(deletedCats));
    }

    if (window.supabaseClient) {
        try {
            await window.supabaseClient
                .from('library_items')
                .update({ category: 'ຜະລິດຕະພັນອື່ນໆ', updated_at: new Date().toISOString() })
                .eq('category', catName);
        } catch (err) {
            console.error("Supabase category delete error:", err);
        }
    }

    var filterSelect = document.getElementById('libCategoryFilter');
    if (filterSelect && filterSelect.value === catName) {
        filterSelect.value = 'ALL';
    }

    refreshCategoryDatalistAndFilter();
    renderLibraryGrid();
    renderManageCategoryList();

    if (typeof showToast === 'function') {
        showToast('ສຳເລັດ', `ລຶບໝວດໝູ່ "${catName}" ອອກຮຽບຮ້ອຍແລ້ວ`, 'info');
    }
}

function refreshCategoryDatalistAndFilter() {
    var allCats = getUniqueCategoriesList();

    var datalist = document.getElementById('libCategorySuggestions');
    if (datalist) {
        datalist.innerHTML = '';
        allCats.forEach(cat => {
            var opt = document.createElement('option');
            opt.value = cat;
            datalist.appendChild(opt);
        });
    }

    var filterSelect = document.getElementById('libCategoryFilter');
    if (filterSelect) {
        var currentVal = filterSelect.value || 'ALL';
        filterSelect.innerHTML = `<option value="ALL">ທຸກໝວດໝູ່ (All Categories)</option>`;
        allCats.forEach(cat => {
            var opt = document.createElement('option');
            opt.value = cat;
            opt.innerText = cat;
            if (cat === currentVal) opt.selected = true;
            filterSelect.appendChild(opt);
        });
    }
}

// ⭐ 4. SEARCH DROPDOWN MATCH-UP LOGIC
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
        var brandSymbolsHtml = renderBrandOrCategoryBadge(item.title, item.category);

        container.innerHTML += `
            <div class="bg-white border ${isOutdated

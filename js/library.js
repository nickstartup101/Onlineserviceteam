
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

// ⭐ 2. ສ້າງ BRAND BADGES & GOOGLE MATERIAL SYMBOLS ແບບອັດຕະໂນມັດ
function renderBrandOrCategoryBadge(title, category) {
    var text = `${title} ${category}`.toLowerCase();
    var badges = [];

    // 1. WeChat Pay
    if (text.includes('wechat') || text.includes('ວີແຊັດ') || text.includes('ວິແຊັດ')) {
        badges.push(`
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span class="material-symbols-outlined text-[13px]">qr_code_2</span> WeChat Pay
            </span>
        `);
    }

    // 2. Alipay
    if (text.includes('alipay') || text.includes('ອາລີເພ')) {
        badges.push(`
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                <span class="material-symbols-outlined text-[13px]">contactless</span> Alipay
            </span>
        `);
    }

    // 3. PromptPay
    if (text.includes('promptpay') || text.includes('promtpay') || text.includes('ພຣອມເພ')) {
        badges.push(`
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                <span class="material-symbols-outlined text-[13px]">qr_code_scanner</span> PromptPay
            </span>
        `);
    }

    // 4. UnionPay
    if (text.includes('unionpay') || text.includes('ຢູນຽນເພ') || text.includes('cup')) {
        badges.push(`
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <span class="material-symbols-outlined text-[13px]">credit_card</span> UnionPay
            </span>
        `);
    }

    // 5. Mastercard
    if (text.includes('mastercard') || text.includes('master card') || text.includes('ມາສເຕີ')) {
        badges.push(`
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <span class="material-symbols-outlined text-[13px]">credit_card</span> Mastercard
            </span>
        `);
    }

    // 6. Visa
    if (text.includes('visa') || text.includes('ວີຊາ')) {
        badges.push(`
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                <span class="material-symbols-outlined text-[13px]">credit_card</span> VISA
            </span>
        `);
    }

    // ⭐ ຖ້າບໍ່ກົງກັບ Brand ຂ້າງເທິງ: ດຶງ Google Material Symbols ທົ່ວໄປມາສະແດງຕາມເນື້ອໃນ
    if (badges.length === 0) {
        if (text.includes('ໂອນ') || text.includes('transfer') || text.includes('swift')) {
            badges.push(`
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-700">
                    <span class="material-symbols-outlined text-[13px] text-brand-red">currency_exchange</span> ໂອນເງິນ
                </span>
            `);
        } else if (text.includes('ບັດ') || text.includes('card')) {
            badges.push(`
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-700">
                    <span class="material-symbols-outlined text-[13px] text-purple-700">credit_card</span> ສູນບັດ
                </span>
            `);
        } else if (text.includes('ໂປຣ') || text.includes('promo') || text.includes('ຕະຫຼາດ')) {
            badges.push(`
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-700">
                    <span class="material-symbols-outlined text-[13px] text-amber-600">campaign</span> ການຕະຫຼາດ
                </span>
            `);
        } else if (text.includes('ຖອນ') || text.includes('atm') || text.includes('ສົດ')) {
            badges.push(`
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-700">
                    <span class="material-symbols-outlined text-[13px] text-emerald-600">atm</span> ຖອນເງິນສົດ
                </span>
            `);
        } else {
            badges.push(`
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 text-slate-700">
                    <span class="material-symbols-outlined text-[13px] text-slate-500">local_offer</span> ຜະລິດຕະພັນ
                </span>
            `);
        }
    }

    return badges.join(' ');
}

// ⭐ 3. ອັບເດດລາຍການໝວດໝູ່ (DATALIST & FILTER DROPDOWN) ແບບ DYNAMIC
function refreshCategoryDatalistAndFilter() {
    var defaultCats = [
        'ໂອນເງິນພາຍໃນ & ຕ່າງປະເທດ',
        'QR ສາກົນ (WeChat, Alipay, PromptPay)',
        'ສູນບັດ & ຄ່າທຳນຽມບັດ (UnionPay, Visa, Mastercard)',
        'ໂປຣໂມຊັ່ນການຕະຫຼາດ',
        'ຜະລິດຕະພັນອື່ນໆ'
    ];

    // ລວບລວມໝວດໝູ່ທັງໝົດທີ່ມີໃນລະບົບ (ທັງ Default ແລະ ທີ່ User ພິມສ້າງໃໝ່)
    var allCatsSet = new Set(defaultCats);
    (window.libraryItems || []).forEach(item => {
        if (item.category && item.category.trim()) {
            allCatsSet.add(item.category.trim());
        }
    });

    // 1. ອັບເດດ Datalist ຂອງ Modal ເພີ່ມ/ແກ້ໄຂ
    var datalist = document.getElementById('libCategorySuggestions');
    if (datalist) {
        datalist.innerHTML = '';
        allCatsSet.forEach(cat => {
            var opt = document.createElement('option');
            opt.value = cat;
            datalist.appendChild(opt);
        });
    }

    // 2. ອັບເດດ Filter Dropdown ຢູ່ໜ້າຫຼັກ Library
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

// 4. RENDER CARDS ໃນ LIBRARY GRID
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
                <p class="font-bold text-sm">ບໍ່ພົບຂໍ້ມູນຜະລິດຕະພັນໃນໝວດນີ້</p>
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

        var updatedDateStr = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString('lo-LA', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

        // ⭐ ດຶງ Symbol ຂອງ Brand ຫຼື Google Material Symbol ອັດຕະໂນມັດ
        var brandSymbolsHtml = renderBrandOrCategoryBadge(item.title, item.category);

        container.innerHTML += `
            <div class="bg-white border ${isOutdated ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200'} rounded-3xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between gap-3 text-xs">
                <div class="space-y-2">
                    <div class="flex justify-between items-start gap-2">
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 truncate max-w-[170px]" title="${item.category}">
                            ${item.category}
                        </span>
                        ${statusBadge}
                    </div>

                    <!-- Brand Symbols / Google Material Symbols -->
                    <div class="flex flex-wrap gap-1 pt-0.5">
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
                            <img src="${item.imageUrl}" onclick="openLibraryDetailModal('${item.id}')" class="h-24 w-full object-cover rounded-xl border cursor-pointer hover:opacity-90 transition"/>
                        </div>
                    ` : ''}
                </div>

                <div class="pt-3 border-t border-slate-100 flex flex-col gap-2">
                    <div class="flex justify-between items-center text-[10px] text-slate-400">
                        <span>ໂດຍ: <strong class="text-slate-600">${item.updatedBy || item.createdBy}</strong></span>
                        <span>${updatedDateStr}</span>
                    </div>
                    <div class="flex items-center justify-between gap-2 pt-1">
                        <button type="button" onclick="openLibraryDetailModal('${item.id}')" class="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-[11px] transition cursor-pointer text-center">
                            ເບິ່ງລາຍລະອຽດ
                        </button>
                        <button type="button" onclick="openEditLibraryModal('${item.id}')" class="p-1.5 text-slate-500 hover:text-brand-red hover:bg-red-50 rounded-lg transition cursor-pointer" title="ແກ້ໄຂ">
                            <span class="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button type="button" onclick="promptDeleteLibraryItem('${item.id}')" class="p-1.5 text-slate-400 hover:text-brand-red hover:bg-red-50 rounded-lg transition cursor-pointer" title="ລຶບ">
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

// 5. ເປີດ Modal ເພີ່ມ/ແກ້ໄຂ
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

// 6. ບັນທຶກລົງ SUPABASE + NOTIFICATION
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
        showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາປ້ອນຫົວຂໍ້ ແລະ ເນື້ອໃນໃຫ້ຄົບຖ້ວນ', 'error');
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

    // Sync ຂຶ້ນ Supabase
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

    // ແຈ້ງເຕືອນກະດິ່ງຫາທຸກຄົນ
    var notifEntry = {
        id: Date.now(),
        title: isEdit ? `ອັບເດດ Library: ${title}` : `ເພີ່ມຫົວຂໍ້ໃໝ່ໃນ Library: ${title}`,
        message: `${authorName} ໄດ້ອັບເດດຂໍ້ມູນ "${title}" ໃນໝວດ [${category}]`,
        tag: 'Library ຄວາມຮູ້',
        date: new Date().toLocaleString('lo-LA'),
        readBy: [user?.user]
    };
    if (!window.systemNotifications) window.systemNotifications = [];
    window.systemNotifications.unshift(notifEntry);
    if (typeof window.updateNotificationBadge === 'function') window.updateNotificationBadge();

    closeLibraryModal();
    refreshCategoryDatalistAndFilter();
    renderLibraryGrid();
    showToast('ສຳເລັດ', isEdit ? 'ອັບເດດຂໍ້ມູນ ແລະ ແຈ້ງເຕືອນແລ້ວ!' : 'ເພີ່ມຂໍ້ມູນໃໝ່ ແລະ ແຈ້ງເຕືອນແລ້ວ!', 'success');
}

// 7. ເບິ່ງລາຍລະອຽດເຕັມ (Detail Modal)
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
        } catch (e) {}
    }

    closeLibraryDetailModal();
    renderLibraryGrid();
    showToast('ສຳເລັດ', `ປ່ຽນສະຖານະເປັນ "${item.isOutdated ? 'Out of date' : 'ໃຊ້ງານຢູ່'}" ແລ້ວ`, 'info');
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
        showToast('ສຳເລັດ', 'ລຶບຫົວຂໍ້ອອກຈາກ Library ແລ້ວ', 'success');
    }
}

// ⭐ Auto-load ເມື່ອກົດປ່ຽນ Tab ມາ 'library'
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
window.renderBrandOrCategoryBadge = renderBrandOrCategoryBadge;
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

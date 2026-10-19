// ================= ⭐ ONLINE TEAM - CORE APP & CLOUD CONTROLLER (MASTER 100% + ANDROID PWA INSTALL) =================

// 0. GLOBAL HOLIDAY CHECKER
function isDateInHolidayRange(dStr) {
    if (!dStr) return false;
    var holList = window.specialHolidayRanges || [];
    return holList.some(function(h) {
        if (!h) return false;
        var s = h.start_date || h.start;
        var e = h.end_date || h.end;
        if (!s || !e) return false;
        return dStr >= s && dStr <= e;
    });
}
window.isDateInHolidayRange = isDateInHolidayRange;

var DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23c01e2e'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
window.DEFAULT_AVATAR = DEFAULT_AVATAR;

function safeJSONParse(str, fallback) {
    if (fallback === undefined) fallback = null;
    if (!str || typeof str !== 'string') return fallback;
    var trimmed = str.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return fallback;
    try {
        return JSON.parse(trimmed);
    } catch (e) {
        return fallback;
    }
}
window.safeJSONParse = safeJSONParse;

// ລຶບຄ່າ LocalStorage ທີ່ເຄີຍເສຍຫາຍ
try {
    var badKey = localStorage.getItem('ot_users_master');
    if (badKey && !badKey.trim().startsWith('[') && !badKey.trim().startsWith('{')) localStorage.removeItem('ot_users_master');
    var badUsers = localStorage.getItem('ot_users');
    if (badUsers && !badUsers.trim().startsWith('[') && !badUsers.trim().startsWith('{')) localStorage.removeItem('ot_users');
} catch (e) {}

// ⭐ 1. ລາຍຊື່ທາງການ 24 ທ່ານ + 1 Admin (ກົງກັບ Supabase Database 100%)
var defaultSystemUsers = [
    { user: 'admin', pass: 'admin123', nameLao: 'Admin', fullName: 'Super Admin', role: 'SUPER_ADMIN', isLeader: true, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5599 8877' },
    
    // --- ທີມວິຊາການສົມບູນ (17 ທ່ານ) ---
    { user: 'BCEL0765', pass: 'bcel2026', nameLao: 'ແສງດາວ', fullName: 'SENGDAO DOUANGSOMBATH', role: 'Staff', isLeader: true, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5501 2345' },
    { user: 'BCEL0272', pass: 'bcel2026', nameLao: 'ພອນສະຫວັນ', fullName: 'PHONESAVANH HEUANGVILAY', role: 'Staff', isLeader: true, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5502 3456' },
    { user: 'BCEL1055', pass: 'bcel2026', nameLao: 'ບຸນປະເສີດ', fullName: 'BOUNPRASEUTH SILIMANOTHAM', role: 'Staff', isLeader: true, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5503 4567' },
    { user: 'BCEL0872', pass: 'bcel2026', nameLao: 'ພັນນິກອນ', fullName: 'PHANNIKONE SAYAPHET', role: 'Staff', isLeader: true, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5504 5678' },
    { user: 'BCEL0277', pass: 'bcel2026', nameLao: 'ສົນທະຍາ', fullName: 'SONTHAYA MONLATHOM', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5505 6789' },
    { user: 'BCEL0707', pass: 'bcel2026', nameLao: 'ນິກກີ້', fullName: 'NICKEE KHAMKHOSY', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5506 7890' },
    { user: 'BCEL1431', pass: 'bcel2026', nameLao: 'ໜູຮັກ', fullName: 'NOUHACK SOULAIYAKHAM', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5507 8901' },
    { user: 'BCEL1532', pass: 'bcel2026', nameLao: 'ແພັກເກີ້', fullName: 'PAKKER VILAISANG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5508 9012' },
    { user: 'BCEL2007', pass: 'bcel2026', nameLao: 'ເອກສະຫວ່າງ', fullName: 'AEKSAVANG PHOUVONGKHAMCHAN', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5509 0123' },
    { user: 'BCEL2120', pass: 'bcel2026', nameLao: 'ໂທນິກ', fullName: 'TONICK BOUDDASIEN', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5599 1122' },
    { user: 'BCEL2101', pass: 'bcel2026', nameLao: 'ບຸນຮັກ', fullName: 'BOUNHAK BOUTTHAVONG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5510 1122' },
    { user: 'BCEL1102', pass: 'bcel2026', nameLao: 'ປະສົງສິນ', fullName: 'PASONGSIN SOULIVONG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5511 2233' },
    { user: 'BCEL2104', pass: 'bcel2026', nameLao: 'ສາຍທອງ', fullName: 'SAIYTHONG VONGDALA', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5512 3344' },
    { user: 'BCEL2105', pass: 'bcel2026', nameLao: 'ສົມຊາຍ', fullName: 'SOXAY SOULIYAVONG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5513 4455' },
    { user: 'BCEL2323', pass: 'bcel2026', nameLao: 'ສີຊົມພູ', fullName: 'SISOMPHOU INTHAVONG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5514 5566' },
    { user: 'BCEL2426', pass: 'bcel2026', nameLao: 'ສຸລິຍະສັກ', fullName: 'SOULIYASACK KHAMPHAIVONG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5515 6677' },
    { user: 'BCEL1107', pass: 'bcel2026', nameLao: 'ໄກສະຫວາດ', fullName: 'KAISAVATH PHOMMAVONG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5516 7788' },

    // --- ທີມວິຊາການສັນຍາ (7 ທ່ານ) ---
    { user: 'BCEL2319', pass: 'bcel2026', nameLao: 'ໄຊຍະສິດ', fullName: 'XAYYASITH VONGDONEXAI (Gz)', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ (ສັນຍາ)', phone: '020 5517 8899' },
    { user: 'BCEL2321', pass: 'bcel2026', nameLao: 'ລິດຕະສອນ', fullName: 'LITTASONE HUEANGKHAMSAEN', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ (ສັນຍາ)', phone: '020 5518 9900' },
    { user: 'BCEL2425', pass: 'bcel2026', nameLao: 'ທອງສະຫວັນ', fullName: 'THONGSAVANH VANNAXAY', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ (ສັນຍາ)', phone: '020 5519 0011' },
    { user: 'BCEL2516', pass: 'bcel2026', nameLao: 'ໄຊຍະພອນ', fullName: 'XAIYAPHONE SYLAVONG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ (ສັນຍາ)', phone: '020 5520 1122' },
    { user: 'BCEL2517', pass: 'bcel2026', nameLao: 'ແກ້ວວິໄລ', fullName: 'KEOVILAY XAYYALATH', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ (ສັນຍາ)', phone: '020 5521 2233' },
    { user: 'BCEL2579', pass: 'bcel2026', nameLao: 'ຈິດສະດາ', fullName: 'CHITSADA CHANTHAVONG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ (ສັນຍາ)', phone: '020 5522 3344' },
    { user: 'BCEL2580', pass: 'bcel2026', nameLao: 'ນະລົງສັກ', fullName: 'NALONGSAK YASENG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ (ສັນຍາ)', phone: '020 5523 4455' }
];

// ⭐ 2. ແຍກ 2 ກຸ່ມມາດຕະຖານໃຫ້ກົງກັບ Database 100%
window.defaultEmployeeGroups = [
    { 
        id: 'GRP_MAIN_17', 
        name: 'ກຸ່ມທີມວິຊາການສົມບູນ (17 ຄົນ - Weekly Zigzag)', 
        members: [
            'ແສງດາວ', 'ພອນສະຫວັນ', 'ບຸນປະເສີດ', 'ພັນນິກອນ',
            'ສົນທະຍາ', 'ນິກກີ້', 'ໜູຮັກ', 'ແພັກເກີ້',
            'ເອກສະຫວ່າງ', 'ໂທນິກ', 'ບຸນຮັກ', 'ປະສົງສິນ',
            'ສາຍທອງ', 'ສົມຊາຍ', 'ສີຊົມພູ', 'ສຸລິຍະສັກ', 'ໄກສະຫວາດ'
        ] 
    },
    { 
        id: 'GRP_CONTRACT_7', 
        name: 'ກຸ່ມທີມວິຊາການສັນຍາ (7 ຄົນ - Rolling 5/2)', 
        members: [
            'ໄຊຍະສິດ', 'ລິດຕະສອນ', 'ທອງສະຫວັນ', 'ໄຊຍະພອນ',
            'ແກ້ວວິໄລ', 'ຈິດສະດາ', 'ນະລົງສັກ'
        ] 
    }
];

window.defaultNotesTemplate = `1. ກະ 1 (08:00 - 16:00), ກະ 2 (12:00 - 20:00), ກະ 3 (20:00 - 08:00).
2. ວັນເສົາ-ອາທິດ: ກະ 1 (08:00 - 13:30), ກະ 2 (13:30 - 19:00), ກະ 3 (19:00 - 08:00).
3. ຫາກມີການຂໍປ່ຽນກະ ຕ້ອງແຈ້ງ ແລະ ໄດ້ຮັບການເຫັນດີຜ່ານລະບົບລ່ວງໜ້າຢ່າງໜ້ອຍ 24 ຊົ່ວໂມງ.`;

// ⭐ ຟັງຊັນອັບເດດຮູບໂປຣໄຟລ໌ (Avatar) ໃນ Header ມຸມຂວາເທິງ ແລະ ໜ້າ Profile ໃຫ້ກົງກັບ Supabase 100%
function refreshCurrentUserAvatarUI() {
    if (!window.currentUser) {
        var saved = safeJSONParse(localStorage.getItem('ot_auth_live'), null);
        if (saved) window.currentUser = saved;
    }
    if (!window.currentUser) return;

    var matched = (window.users || []).find(function(u) {
        return u && (
            (u.user && window.currentUser.user && u.user.toLowerCase() === window.currentUser.user.toLowerCase()) ||
            (u.nameLao && window.currentUser.nameLao && u.nameLao === window.currentUser.nameLao)
        );
    });

    if (matched) {
        if (matched.photo) window.currentUser.photo = matched.photo;
        window.currentUser.fullName = matched.fullName || window.currentUser.fullName;
        window.currentUser.nameLao = matched.nameLao || window.currentUser.nameLao;
        try { localStorage.setItem('ot_auth_live', JSON.stringify(window.currentUser)); } catch(e) {}
    }

    var avatarSrc = (window.currentUser && window.currentUser.photo) ? window.currentUser.photo : DEFAULT_AVATAR;

    var topAv = document.getElementById('topAvatar');
    if (topAv) {
        topAv.src = avatarSrc;
        topAv.onerror = function() { this.src = DEFAULT_AVATAR; };
    }

    var profPreview = document.getElementById('profPhotoPreview');
    if (profPreview) {
        profPreview.src = avatarSrc;
        profPreview.onerror = function() { this.src = DEFAULT_AVATAR; };
    }
}
window.refreshCurrentUserAvatarUI = refreshCurrentUserAvatarUI;

function showToast(title, message, type) {
    if (!type) type = 'success';
    var toast = document.getElementById('appToast');
    var tTitle = document.getElementById('toastTitle');
    var tMsg = document.getElementById('toastMessage');
    var tIcon = document.getElementById('toastIcon');
    var tBox = document.getElementById('toastIconBox');
    if (!toast) return;

    if (tTitle) tTitle.innerText = title;
    if (tMsg) tMsg.innerText = message;

    if (tIcon && tBox) {
        if (type === 'error') {
            tIcon.innerText = 'error';
            tBox.className = 'w-9 h-9 rounded-xl bg-red-50 text-brand-red flex items-center justify-center shrink-0';
        } else if (type === 'warning' || type === 'info') {
            tIcon.innerText = 'info';
            tBox.className = 'w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0';
        } else {
            tIcon.innerText = 'check_circle';
            tBox.className = 'w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0';
        }
    }

    toast.classList.remove('opacity-0', 'translate-y-[-150%]', 'pointer-events-none');
    toast.classList.add('opacity-100', 'translate-y-0');

    if (window._toastTimer) clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(hideToast, 4000);
}

function hideToast() {
    var toast = document.getElementById('appToast');
    if (toast) {
        toast.classList.add('opacity-0', 'translate-y-[-150%]', 'pointer-events-none');
        toast.classList.remove('opacity-100', 'translate-y-0');
    }
}
window.showToast = showToast;
window.hideToast = hideToast;

var _confirmCallback = null;
function askConfirm(title, message, callback, icon, btnText) {
    if (!icon) icon = 'help';
    if (!btnText) btnText = 'ຢືນຢັນ';
    _confirmCallback = callback;

    var modal = document.getElementById('appConfirmModal');
    var mTitle = document.getElementById('confirmModalTitle');
    var mMsg = document.getElementById('confirmModalMessage');
    var mIcon = document.getElementById('confirmModalIcon');
    var mBtn = document.getElementById('btnConfirmAction');

    if (mTitle) mTitle.innerText = title;
    if (mMsg) mMsg.innerText = message;
    if (mIcon) mIcon.innerText = icon;
    if (mBtn) mBtn.innerText = btnText;

    if (modal) modal.classList.remove('hidden');
}

function closeConfirmModal(confirmed) {
    var modal = document.getElementById('appConfirmModal');
    if (modal) modal.classList.add('hidden');
    if (confirmed && typeof _confirmCallback === 'function') {
        _confirmCallback();
    }
    _confirmCallback = null;
}
window.askConfirm = askConfirm;
window.closeConfirmModal = closeConfirmModal;

function switchTab(tabName) {
    var views = document.querySelectorAll('.tab-view');
    views.forEach(function(v) {
        v.classList.remove('active');
        v.style.display = 'none';
    });

    var targetView = document.getElementById('view-' + tabName);
    if (targetView) {
        targetView.classList.add('active');
        targetView.style.display = 'flex';
    }

    var topLinks = document.querySelectorAll('.top-nav-link');
    topLinks.forEach(function(btn) {
        btn.classList.remove('text-brand-red', 'font-bold', 'border-b-2', 'border-brand-red');
        btn.classList.add('text-slate-600');
    });
    var activeTopBtn = document.getElementById('top-btn-' + tabName);
    if (activeTopBtn) {
        activeTopBtn.classList.remove('text-slate-600');
        activeTopBtn.classList.add('text-brand-red', 'font-bold', 'border-b-2', 'border-brand-red');
    }

    var sideBtns = document.querySelectorAll('.side-nav-btn');
    sideBtns.forEach(function(btn) {
        btn.classList.remove('bg-red-50', 'text-brand-red', 'font-bold');
        btn.classList.add('text-slate-600');
    });
    var activeSideBtn = document.getElementById('side-' + tabName);
    if (activeSideBtn) {
        activeSideBtn.classList.remove('text-slate-600');
        activeSideBtn.classList.add('bg-red-50', 'text-brand-red', 'font-bold');
    }

    var mobBtns = document.querySelectorAll('.mob-side-btn');
    mobBtns.forEach(function(btn) {
        btn.classList.remove('bg-red-50', 'text-brand-red', 'font-bold');
        btn.classList.add('text-slate-600');
    });
    var activeMobBtn = document.getElementById('mob-side-' + tabName);
    if (activeMobBtn) {
        activeMobBtn.classList.remove('text-slate-600');
        activeMobBtn.classList.add('bg-red-50', 'text-brand-red', 'font-bold');
    }

    refreshCurrentUserAvatarUI();

    if (tabName === 'schedule') {
        if (typeof window.renderScheduleTable === 'function') window.renderScheduleTable();
        if (typeof window.renderScheduleStaffRoster === 'function') window.renderScheduleStaffRoster();
    } else if (tabName === 'dashboard') {
        if (typeof window.renderDashboard === 'function') window.renderDashboard();
    } else if (tabName === 'groups') {
        if (typeof window.renderGroupsListGrid === 'function') window.renderGroupsListGrid();
    } else if (tabName === 'employees') {
        if (typeof window.renderEmployeesTable === 'function') window.renderEmployeesTable();
    } else if (tabName === 'profile') {
        if (typeof window.initProfileWorkspace === 'function') window.initProfileWorkspace();
    } else if (tabName === 'library') {
        if (typeof window.renderLibraryItems === 'function') window.renderLibraryItems();
    }
}
window.switchTab = switchTab;

function toggleMobileDrawer() {
    var drawer = document.getElementById('mobileDrawer');
    if (!drawer) return;
    drawer.classList.toggle('-translate-x-full');
}
window.toggleMobileDrawer = toggleMobileDrawer;

// ⭐ ACTIVE SCHEDULE SHEET
function getActiveSheet() {
    if (typeof window.getActiveSheet === 'function' && window.getActiveSheet !== getActiveSheet) {
        return window.getActiveSheet();
    }
    var sheets = window.scheduleSheets || [];
    if (sheets.length === 0) return null;

    var found = sheets.find(function(s) {
        return s && String(s.id) === String(window.activeSheetId);
    });
    return found || sheets[0];
}
window.getActiveSheet = getActiveSheet;

function saveAll() {
    try {
        if (window.scheduleSheets) {
            localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
            localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
        }
        if (window.activeSheetId) localStorage.setItem('ot_active_sheet_id', window.activeSheetId);
        if (window.users) localStorage.setItem('ot_users', JSON.stringify(window.users));
        if (window.employeeGroups) localStorage.setItem('ot_employee_groups', JSON.stringify(window.employeeGroups));
        if (window.fixedShiftsConfig) localStorage.setItem('ot_fixed_shifts_cfg', JSON.stringify(window.fixedShiftsConfig));
        if (window.specialHolidayRanges) localStorage.setItem('ot_special_holidays', JSON.stringify(window.specialHolidayRanges));
        if (window.annualBookings) localStorage.setItem('ot_annual_bookings', JSON.stringify(window.annualBookings));
        if (window.swapHistory) localStorage.setItem('ot_swap_history', JSON.stringify(window.swapHistory));
        if (window.scheduleAuditLogs) localStorage.setItem('ot_schedule_audit_logs', JSON.stringify(window.scheduleAuditLogs));
    } catch (e) {
        console.warn("Storage save error:", e);
    }
}
window.saveAll = saveAll;

// ⭐ DRAG & DROP ROSTER SIDEBAR
function handleStaffDragStart(event, nameLao) {
    window.draggedStaffName = nameLao;
    if (event.dataTransfer) {
        event.dataTransfer.setData('text/plain', nameLao);
        event.dataTransfer.setData('text', nameLao);
        event.dataTransfer.effectAllowed = 'copyMove';
    }
}
window.handleStaffDragStart = handleStaffDragStart;

function renderScheduleStaffRoster() {
    var container = document.getElementById('scheduleStaffRoster');
    var countEl = document.getElementById('rosterCountText');
    if (!container) return;

    var staffList = (window.users || []).filter(function(u) {
        return u && u.role !== 'SUPER_ADMIN';
    });

    if (countEl) countEl.innerText = staffList.length;
    container.innerHTML = '';

    staffList.forEach(function(u) {
        var isL = u.isLeader;
        var avatarUrl = u.photo || DEFAULT_AVATAR;
        container.innerHTML += `
            <div draggable="true" ondragstart="handleStaffDragStart(event, '${u.nameLao}')" class="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100 hover:border-brand-red/50 transition cursor-grab active:cursor-grabbing select-none shadow-xs mb-1.5" title="ກົດໃສ່ຊ່ອງຕາຕະລາງ ຫຼື ລາກຊື່ນີ້ໄປວາງໃສ່ຊ່ອງໄດ້ເລີຍ">
                <div class="flex items-center gap-2 pointer-events-none">
                    <img draggable="false" src="${avatarUrl}" onerror="this.src='${DEFAULT_AVATAR}'" class="w-7 h-7 rounded-full object-cover border-2 border-slate-200 bg-red-50 shrink-0 select-none"/>
                    <span class="font-bold select-none ${isL ? 'text-brand-red' : 'text-slate-800'}">${u.nameLao}</span>
                </div>
                ${isL ? '<span class="text-[9px] bg-red-50 text-brand-red px-1.5 py-0.5 rounded font-bold border border-red-200 pointer-events-none select-none">ຫົວໜ້າ</span>' : '<span class="text-[10px] text-slate-400 font-mono pointer-events-none select-none">' + u.user + '</span>'}
            </div>
        `;
    });
}
window.renderScheduleStaffRoster = renderScheduleStaffRoster;

function filterRosterSidebar() {
    var q = document.getElementById('rosterSearchInput')?.value.trim().toLowerCase() || '';
    var container = document.getElementById('scheduleStaffRoster');
    if (!container) return;

    var staffList = (window.users || []).filter(function(u) {
        return u && u.role !== 'SUPER_ADMIN' && (
            (u.nameLao && u.nameLao.toLowerCase().includes(q)) ||
            (u.fullName && u.fullName.toLowerCase().includes(q)) ||
            (u.user && u.user.toLowerCase().includes(q))
        );
    });

    container.innerHTML = '';
    staffList.forEach(function(u) {
        var isL = u.isLeader;
        var avatarUrl = u.photo || DEFAULT_AVATAR;
        container.innerHTML += `
            <div draggable="true" ondragstart="handleStaffDragStart(event, '${u.nameLao}')" class="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100 hover:border-brand-red/50 transition cursor-grab active:cursor-grabbing select-none shadow-xs mb-1.5" title="ກົດໃສ່ຊ່ອງຕາຕະລາງ ຫຼື ລາກຊື່ນີ້ໄປວາງໃສ່ຊ່ອງໄດ້ເລີຍ">
                <div class="flex items-center gap-2 pointer-events-none">
                    <img draggable="false" src="${avatarUrl}" onerror="this.src='${DEFAULT_AVATAR}'" class="w-7 h-7 rounded-full object-cover border-2 border-slate-200 bg-red-50 shrink-0 select-none"/>
                    <span class="font-bold select-none ${isL ? 'text-brand-red' : 'text-slate-800'}">${u.nameLao}</span>
                </div>
                ${isL ? '<span class="text-[9px] bg-red-50 text-brand-red px-1.5 py-0.5 rounded font-bold border border-red-200 pointer-events-none select-none">ຫົວໜ້າ</span>' : '<span class="text-[10px] text-slate-400 font-mono pointer-events-none select-none">' + u.user + '</span>'}
            </div>
        `;
    });
}
window.filterRosterSidebar = filterRosterSidebar;

function renderEmployeesTable() {
    var tbody = document.getElementById('employeesTableBody');
    var countHeader = document.getElementById('empCountHeader');
    if (!tbody) return;

    var allStaff = window.users || [];
    if (countHeader) countHeader.innerText = allStaff.length;

    tbody.innerHTML = '';
    allStaff.forEach(function(u, idx) {
        var avatarUrl = u.photo || DEFAULT_AVATAR;
        var isLeader = u.isLeader;
        var roleBadge = u.role === 'SUPER_ADMIN' 
            ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Super Admin</span>'
            : (isLeader 
                ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-brand-red border border-red-200">ຫົວໜ້າກະ</span>'
                : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">ພະນັກງານ</span>');

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition border-b border-slate-100 font-lao text-xs">
                <td class="p-3.5 font-mono font-bold text-slate-700">${u.user}</td>
                <td class="p-3.5 font-semibold text-slate-800 flex items-center gap-2.5">
                    <img src="${avatarUrl}" onerror="this.src='${DEFAULT_AVATAR}'" class="w-8 h-8 rounded-full object-cover border-2 border-slate-200 bg-red-50 shrink-0"/>
                    <div>
                        <p class="font-bold text-slate-800">${u.fullName || '-'}</p>
                        <p class="text-[10px] text-slate-400">${u.dept || 'ຂະແໜງບໍລິການອອນລາຍ'} ${u.phone ? '• ' + u.phone : ''}</p>
                    </div>
                </td>
                <td class="p-3.5 font-bold ${isLeader ? 'text-brand-red' : 'text-slate-700'}">${u.nameLao}</td>
                <td class="p-3.5">${roleBadge}</td>
                <td class="p-3.5 text-right space-x-1">
                    <button type="button" onclick="if(typeof openEditEmpModal === 'function') openEditEmpModal(${idx})" class="px-2.5 py-1 text-slate-600 hover:text-brand-red hover:bg-red-50 rounded-lg font-bold transition">ແກ້ໄຂ</button>
                </td>
            </tr>
        `;
    });
}
window.renderEmployeesTable = renderEmployeesTable;

// ⭐ MASTER CLOUD SYNC
async function loadEverythingFromSupabase(retryCount) {
    if (retryCount === undefined) retryCount = 0;

    if (!window.supabaseClient) {
        if (retryCount < 10) {
            setTimeout(function() {
                loadEverythingFromSupabase(retryCount + 1);
            }, 300);
        }
        return;
    }

    try {
        // A. Employee Groups
        var grpRes = await window.supabaseClient.from('employee_groups').select('*');
        if (!grpRes.error && grpRes.data && grpRes.data.length > 0) {
            window.employeeGroups = grpRes.data.map(function(g) {
                return { id: g.id, name: g.name, members: g.members || [] };
            });
        }
        if (typeof window.renderGroupsListGrid === 'function') window.renderGroupsListGrid();

        // B. Profiles (ດຶງພະນັກງານຕົວຈິງ + ຮູບໂປຣໄຟລ໌ຈາກ Database Supabase)
        var profRes = await window.supabaseClient.from('profiles').select('*');
        var cloudProfiles = profRes.data;

        if (!profRes.error && cloudProfiles && cloudProfiles.length > 0) {
            cloudProfiles.forEach(function(cp) {
                var userCode = cp.user_code || cp.username || cp.user || '';
                var rawNameLao = cp.name_lao || cp.nameLao || '';
                var nameLao = rawNameLao.replace(/^(ທ້າວ|ນາງ|ທ\.|ນ\.)\s*/, '').replace(/\s*ຫົວໜ້າກະ|\s*ຫົວໜ້າ/g, '').trim();
                if (!userCode && !nameLao) return;

                var existingIdx = (window.users || []).findIndex(function(u) {
                    return (userCode && u.user && u.user.toLowerCase() === userCode.toLowerCase()) ||
                           (nameLao && u.nameLao && u.nameLao === nameLao);
                });

                var normalizedUser = {
                    user: userCode || ('BCEL' + Math.floor(1000 + Math.random() * 9000)),
                    nameLao: nameLao || cp.full_name || userCode,
                    fullName: cp.full_name || nameLao,
                    role: cp.role || (cp.is_leader ? 'SUPER_ADMIN' : 'Staff'),
                    isLeader: Boolean(cp.is_leader || cp.isLeader),
                    dept: cp.dept || 'ຂະແໜງບໍລິການອອນລາຍ',
                    phone: cp.phone || '',
                    photo: cp.photo || cp.avatar_url || cp.avatar || '',
                    pass: cp.pass || cp.password || 'bcel2026'
                };

                if (existingIdx !== -1) {
                    window.users[existingIdx] = Object.assign({}, window.users[existingIdx], normalizedUser, {
                        photo: normalizedUser.photo || window.users[existingIdx].photo || ''
                    });
                } else {
                    window.users.push(normalizedUser);
                }
            });

            saveAll();
            refreshCurrentUserAvatarUI();

            if (typeof window.renderEmployeesTable === 'function') window.renderEmployeesTable();
            if (typeof window.renderScheduleStaffRoster === 'function') window.renderScheduleStaffRoster();
            if (typeof window.renderDashboard === 'function') window.renderDashboard();
        }

        // C. Schedule Sheets (ດຶງສະເພາະຕາຕະລາງຕົວຈິງຈາກ Cloud ເທົ່ານັ້ນ)
        var schedRes = await window.supabaseClient.from('schedule_sheets').select('*');
        var cloudSchedules = schedRes.data;
        if (!schedRes.error && Array.isArray(cloudSchedules)) {
            if (cloudSchedules.length > 0) {
                window.scheduleSheets = cloudSchedules.map(function(cs) {
                    var rawData = cs.data || cs.schedule_data || {};
                    if (typeof rawData === 'string') {
                        try { rawData = JSON.parse(rawData); } catch (e) { rawData = {}; }
                    }

                    var mKey = cs.monthKey || cs.month_key || '2026-10';
                    return {
                        id: String(cs.id),
                        monthKey: String(mKey),
                        title: cs.title || rawData?._meta?.title || ('ຕາຕະລາງປະຈຳການ ' + mKey),
                        notes: cs.notes || rawData?._meta?.notes || window.defaultNotesTemplate || '',
                        status: cs.status || 'PUBLISHED',
                        isG7GroupSheet: Boolean(cs.is_g7 || cs.isG7GroupSheet || (cs.title && cs.title.includes('ສັນຍາ'))),
                        data: rawData
                    };
                });

                window.scheduleSheets.sort(function(a, b) {
                    return String(b.monthKey).localeCompare(String(a.monthKey));
                });

                if (!window.activeSheetId || !window.scheduleSheets.some(function(s) { return String(s.id) === String(window.activeSheetId); })) {
                    window.activeSheetId = window.scheduleSheets[0].id;
                }
            } else {
                window.scheduleSheets = [];
                window.activeSheetId = null;
            }

            saveAll();
            if (typeof window.renderSheetDropdown === 'function') window.renderSheetDropdown();
            if (typeof window.renderScheduleTable === 'function') window.renderScheduleTable();
            if (typeof window.renderDashboard === 'function') window.renderDashboard();
        }

    } catch (e) {
        console.error("Cloud Sync Exception:", e);
    }
}
window.loadEverythingFromSupabase = loadEverythingFromSupabase;

// ================= ⭐ ANDROID & DESKTOP PWA INSTALL ENGINE =================
window.deferredPwaPrompt = null;

window.addEventListener('beforeinstallprompt', function(e) {
    // ປ້ອງກັນ Chrome ບໍ່ໃຫ້ເຊື່ອງ prompt ແລະ ເກັບໄວ້ໃຊ້ກັບປຸ່ມ Install ຂອງເຮົາ
    e.preventDefault();
    window.deferredPwaPrompt = e;
    showPwaInstallButtons(true);
});

window.addEventListener('appinstalled', function() {
    window.deferredPwaPrompt = null;
    showPwaInstallButtons(false);
    showToast('ຕິດຕັ້ງສຳເລັດ', 'ຕິດຕັ້ງແອັບ Online Team ລົງໃນອຸປະກອນຮຽບຮ້ອຍແລ້ວ!', 'success');
});

function showPwaInstallButtons(visible) {
    var btnTop = document.getElementById('pwaInstallTopBtn');
    var btnMob = document.getElementById('pwaInstallMobBtn');
    if (btnTop) {
        if (visible) btnTop.classList.remove('hidden');
        else btnTop.classList.add('hidden');
    }
    if (btnMob) {
        if (visible) btnMob.classList.remove('hidden');
        else btnMob.classList.add('hidden');
    }
}

async function triggerPwaInstall() {
    if (window.deferredPwaPrompt) {
        window.deferredPwaPrompt.prompt();
        var choiceResult = await window.deferredPwaPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
            window.deferredPwaPrompt = null;
            showPwaInstallButtons(false);
        }
    } else {
        // ຖ້າເປີດໃນ Android/iOS ທີ່ບໍ່ທັນຍິງ beforeinstallprompt ໃຫ້ແນະນຳວິທີກົດຕິດຕັ້ງທັນທີ
        showToast(
            'ວິທີຕິດຕັ້ງແອັບ (Install App)',
            'ສຳລັບ Android: ກົດປຸ່ມ ⋮ (ມຸມຂວາເທິງຂອງ Chrome) ແລ້ວເລືອກ "Install app" ຫຼື "Add to Home screen"',
            'info'
        );
    }
}
window.triggerPwaInstall = triggerPwaInstall;

// ລົງທະບຽນ PWA Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js').then(function(reg) {
            console.log('✅ PWA Service Worker Registered:', reg.scope);
        }).catch(function(err) {
            console.warn('PWA Registration failed:', err);
        });
    });
}

// INITIALIZE APPLICATION
document.addEventListener('DOMContentLoaded', function() {
    var storedUsers = safeJSONParse(localStorage.getItem('ot_users'), null);
    window.users = (storedUsers && storedUsers.length > 0) ? storedUsers : defaultSystemUsers;

    window.scheduleSheets = safeJSONParse(localStorage.getItem('ot_schedule_sheets'), null) || 
                            safeJSONParse(localStorage.getItem('ot_schedules_sheets'), null) || [];
    window.activeSheetId = localStorage.getItem('ot_active_sheet_id') || null;

    getActiveSheet();
    
    var storedGroups = safeJSONParse(localStorage.getItem('ot_employee_groups'), null);
    window.employeeGroups = (storedGroups && storedGroups.length > 0) ? storedGroups : window.defaultEmployeeGroups;

    window.fixedShiftsConfig = safeJSONParse(localStorage.getItem('ot_fixed_shifts_cfg'), window.fixedShiftsConfig || []);
    window.specialHolidayRanges = safeJSONParse(localStorage.getItem('ot_special_holidays'), window.specialHolidayRanges || []);
    window.annualBookings = safeJSONParse(localStorage.getItem('ot_annual_bookings'), window.annualBookings || []);
    window.swapHistory = safeJSONParse(localStorage.getItem('ot_swap_history'), window.swapHistory || []);
    window.scheduleAuditLogs = safeJSONParse(localStorage.getItem('ot_schedule_audit_logs'), window.scheduleAuditLogs || []);

    refreshCurrentUserAvatarUI();

    if (typeof window.renderSheetDropdown === 'function') window.renderSheetDropdown();
    if (typeof window.renderScheduleTable === 'function') window.renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    if (typeof window.renderScheduleStaffRoster === 'function') window.renderScheduleStaffRoster();

    // ດຶງ Cloud Data & ແຈ້ງເຕືອນ
    setTimeout(function() { loadEverythingFromSupabase(0); }, 300);
    setTimeout(function() { if (typeof window.fetchLiveNotifications === 'function') window.fetchLiveNotifications(); }, 1200);

    setInterval(function() { if (typeof window.fetchLiveNotifications === 'function') window.fetchLiveNotifications(); }, 20000);
    setInterval(function() { loadEverythingFromSupabase(0); }, 30000);
});

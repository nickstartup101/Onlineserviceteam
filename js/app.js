// ================= ONLINE TEAM - CORE APP & CLOUD CONTROLLER (MASTER 100% CLEAN - NO SYNTAX ERROR) =================

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

try {
    var badKey = localStorage.getItem('ot_users_master');
    if (badKey && !badKey.trim().startsWith('[') && !badKey.trim().startsWith('{')) localStorage.removeItem('ot_users_master');
    var badUsers = localStorage.getItem('ot_users');
    if (badUsers && !badUsers.trim().startsWith('[') && !badUsers.trim().startsWith('{')) localStorage.removeItem('ot_users');
} catch (e) {}

// 1. ລາຍຊື່ທາງການ 24 ທ່ານ + 1 Admin
var defaultSystemUsers = [
    { user: 'admin', pass: 'admin123', nameLao: 'Admin', fullName: 'Super Admin', role: 'SUPER_ADMIN', isLeader: true, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5599 8877' },
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
    { user: 'BCEL2319', pass: 'bcel2026', nameLao: 'ໄຊຍະສິດ', fullName: 'XAYYASITH VONGDONEXAI (Gz)', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ (ສັນຍາ)', phone: '020 5517 8899' },
    { user: 'BCEL2321', pass: 'bcel2026', nameLao: 'ລິດຕະສອນ', fullName: 'LITTASONE HUEANGKHAMSAEN', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ (ສັນຍາ)', phone: '020 5518 9900' },
    { user: 'BCEL2425', pass: 'bcel2026', nameLao: 'ທອງສະຫວັນ', fullName: 'THONGSAVANH VANNAXAY', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ (ສັນຍາ)', phone: '020 5519 0011' },
    { user: 'BCEL2516', pass: 'bcel2026', nameLao: 'ໄຊຍະພອນ', fullName: 'XAIYAPHONE SYLAVONG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ (ສັນຍາ)', phone: '020 5520 1122' },
    { user: 'BCEL2517', pass: 'bcel2026', nameLao: 'ແກ້ວວິໄລ', fullName: 'KEOVILAY XAYYALATH', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ (ສັນຍາ)', phone: '020 5521 2233' },
    { user: 'BCEL2579', pass: 'bcel2026', nameLao: 'ຈິດສະດາ', fullName: 'CHITSADA CHANTHAVONG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ (ສັນຍາ)', phone: '020 5522 3344' },
    { user: 'BCEL2580', pass: 'bcel2026', nameLao: 'ນະລົງສັກ', fullName: 'NALONGSAK YASENG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ (ສັນຍາ)', phone: '020 5523 4455' }
];

// 2. ກຸ່ມມາດຕະຖານ
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

// MASTER CLOUD SYNC
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
        var grpRes = await window.supabaseClient.from('employee_groups').select('*');
        if (!grpRes.error && grpRes.data && grpRes.data.length > 0) {
            window.employeeGroups = grpRes.data.map(function(g) {
                return { id: g.id, name: g.name, members: g.members || [] };
            });
        }
        if (typeof window.renderGroupsListGrid === 'function') window.renderGroupsListGrid();

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

// ANDROID & DESKTOP PWA INSTALL ENGINE
window.deferredPwaPrompt = null;

window.addEventListener('beforeinstallprompt', function(e) {
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
        showToast(
            'ວິທີຕິດຕັ້ງແອັບ (Install App)',
            'ສຳລັບ Android: ກົດປຸ່ມ 3 ຈດ (ມຸມຂວາເທິງຂອງ Chrome) ແລ້ວເລືອກ "Install app" ຫຼື "Add to Home screen"',
            'info'
        );
    }
}
window.triggerPwaInstall = triggerPwaInstall;

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js').then(function(reg) {
            console.log('PWA Service Worker Registered:', reg.scope);
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

    setTimeout(function() { loadEverythingFromSupabase(0); }, 300);
    setTimeout(function() { if (typeof window.fetchLiveNotifications === 'function') window.fetchLiveNotifications(); }, 1200);

    setInterval(function() { if (typeof window.fetchLiveNotifications === 'function') window.fetchLiveNotifications(); }, 20000);
    setInterval(function() { loadEverythingFromSupabase(0); }, 30000);
});
// ================= SMART REMINDER & REALTIME INSTANT PUSH ENGINE (ADMIN-ONLY CONFIG + BACKGROUND KEEP-ALIVE) =================

function stripEmojisFromText(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/gu, '').replace(/\s+/g, ' ').trim();
}

// ຟັງຊັນກວດສອບວ່າຜູ້ໃຊ້ປັດຈຸບັນແມ່ນ Admin ແທ້ບໍ່
function isCurrentUserSuperAdmin() {
    if (!window.currentUser) {
        var saved = safeJSONParse(localStorage.getItem('ot_auth_live'), null);
        if (saved) window.currentUser = saved;
    }
    return Boolean(window.currentUser && window.currentUser.role === 'SUPER_ADMIN');
}

var defaultCustomReminders = [
    {
        id: 'rem-monthly-1',
        ruleType: 'MONTHLY_DAY',
        dayOfMonth: 1,
        icon: 'checkroom',
        title: 'ແຈ້ງເຕືອນປະຈຳວັນທີ 1: ນຸ່ງເສື້ອກຳມະບານ',
        message: 'ມື້ນີ້ແມ່ນວັນທີ 1 ຂອງເດືອນ ກະລຸນານຸ່ງເສື້ອກຳມະບານ ມາປະຈຳການຕາມລະບຽບຂອງຂະແໜງ.',
        theme: 'BLUE',
        enabled: true
    },
    {
        id: 'rem-monthly-14',
        ruleType: 'MONTHLY_DAY',
        dayOfMonth: 14,
        icon: 'checkroom',
        title: 'ແຈ້ງເຕືອນປະຈຳວັນທີ 14: ນຸ່ງເສື້ອຊາວໜຸ່ມ',
        message: 'ມື້ນີ້ແມ່ນວັນທີ 14 ຂອງເດືອນ ກະລຸນານຸ່ງເສື້ອຊາວໜຸ່ມ ມາປະຈຳການຕາມລະບຽບຂອງຂະແໜງ.',
        theme: 'SKY',
        enabled: true
    },
    {
        id: 'rem-bank-dec2',
        ruleType: 'SPECIFIC_DATE',
        targetDate: '2026-12-02',
        icon: 'account_balance',
        title: 'ວັນພັກລັດຖະການ (ປະຕິທິນແດງ): ວັນຊາດທີ 2 ທັນວາ',
        message: 'ມື້ນີ້ແມ່ນວັນພັກຕາມປະຕິທິນທະນາຄານ ຕາຕະລາງປະຈຳການໃຊ້ໂໝດວັນພັກ (08:00-13:30, 13:30-19:00, 19:00-08:00).',
        theme: 'RED',
        enabled: true
    }
];

function getCustomRemindersList() {
    var saved = safeJSONParse(localStorage.getItem('ot_custom_reminders_cfg'), null);
    if (!saved || !Array.isArray(saved) || saved.length === 0) {
        window.customRemindersConfig = defaultCustomReminders;
        try { localStorage.setItem('ot_custom_reminders_cfg', JSON.stringify(window.customRemindersConfig)); } catch(e) {}
    } else {
        window.customRemindersConfig = saved.map(function(item) {
            return Object.assign({}, item, {
                title: stripEmojisFromText(item.title),
                message: stripEmojisFromText(item.message),
                icon: item.icon || (item.ruleType === 'MONTHLY_DAY' ? 'checkroom' : (item.ruleType === 'SPECIFIC_DATE' ? 'account_balance' : 'campaign'))
            });
        });
    }
    return window.customRemindersConfig;
}
window.getCustomRemindersList = getCustomRemindersList;

function saveCustomRemindersList() {
    try {
        localStorage.setItem('ot_custom_reminders_cfg', JSON.stringify(window.customRemindersConfig || []));
    } catch(e) {}
}

// 2. ຟັງຊັນຍິງແຈ້ງເຕືອນມືຖື & ຄອມ ແບບບໍ່ຈຳກັດຄັ້ງ (ຮອງຮັບຕອນປິດໜ້າຈໍ Lock Screen)
async function sendPhoneScreenNotification(title, bodyText, tagId, showFeedbackToast) {
    var cleanTitle = stripEmojisFromText(title) || 'Online Team - ແຈ້ງເຕືອນ';
    var cleanBody = stripEmojisFromText(bodyText) || 'ມີການແຈ້ງເຕືອນໃໝ່';

    if (typeof window.playNotificationChime === 'function') {
        try { window.playNotificationChime(); } catch(e) {}
    }

    if (showFeedbackToast) {
        showToast(cleanTitle, cleanBody, 'info');
    }

    if (!('Notification' in window)) return false;

    if (Notification.permission === 'default') {
        try { await Notification.requestPermission(); } catch (e) {}
    }
    if (Notification.permission !== 'granted') {
        if (showFeedbackToast) {
            showToast('ຍັງບໍ່ໄດ້ເປີດສິດແຈ້ງເຕືອນ', 'ກະລຸນາກົດປຸ່ມ "ເປີດຮັບແຈ້ງເຕືອນ" ກ່ອນ 1 ຄັ້ງ', 'warning');
        }
        return false;
    }

    var uniqueTag = 'ot-push-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
    var notifIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='110' fill='%23c01e2e'/%3E%3Cpath d='M256 96c-88.37 0-160 71.63-160 160v64c0 35.35 28.65 64 64 64h16V256h-48v-16c0-70.69 57.31-128 128-128s128 57.31 128 128v16h-48v128h32c8.84 0 16 7.16 16 16v16c0 8.84-7.16 16-16 16h-80v32h80c26.51 0 48-21.49 48-48v-18.72C434.59 385.19 448 366.09 448 344v-88c0-88.37-71.63-160-160-160z' fill='%23ffffff'/%3E%3C/svg%3E";

    var options = {
        body: cleanBody,
        tag: uniqueTag,
        icon: notifIcon,
        badge: notifIcon,
        renotify: true,
        requireInteraction: true, // ບັງຄັບໃຫ້ປຸກໜ້າຈໍມືຖືຄ້າງໄວ້ຈົນກວ່າ User ຈະເຫັນ
        timestamp: Date.now(),
        vibrate: [300, 100, 300, 100, 400]
    };

    if ('serviceWorker' in navigator) {
        try {
            var reg = await navigator.serviceWorker.getRegistration();
            if (!reg) {
                reg = await navigator.serviceWorker.ready;
            }
            if (reg && typeof reg.showNotification === 'function') {
                await reg.showNotification(cleanTitle, options);
                return true;
            }
        } catch (swErr) {
            console.warn('SW showNotification fallback:', swErr);
        }
    }

    try {
        var n = new Notification(cleanTitle, options);
        n.onclick = function() { window.focus(); n.close(); };
        return true;
    } catch (directErr) {}

    return false;
}
window.sendPhoneScreenNotification = sendPhoneScreenNotification;

// 2.1 ຟັງຊັນກົດຍິງທົດສອບ (ສະເພາະ Admin ເທົ່ານັ້ນ)
async function triggerTestReminderByIdx(idx) {
    if (!isCurrentUserSuperAdmin()) return;
    var list = getCustomRemindersList();
    var item = list[idx];
    if (!item) return;

    try {
        Object.keys(localStorage).forEach(function(k) {
            if (k.startsWith('ot_sent_')) localStorage.removeItem(k);
        });
    } catch(e) {}

    await sendPhoneScreenNotification(item.title, item.message, 'test-' + Date.now(), true);
    await broadcastInstantAlertToAllUsers(item.title, item.message, 'broadcast-' + Date.now());
}
window.triggerTestReminderByIdx = triggerTestReminderByIdx;

window.currentActiveDashboardAlerts = [];
async function triggerActiveBannerAlertByIdx(idx) {
    if (!isCurrentUserSuperAdmin()) return;
    var al = (window.currentActiveDashboardAlerts || [])[idx];
    if (!al) return;

    try { localStorage.removeItem('ot_sent_' + al.key); } catch(e) {}

    await sendPhoneScreenNotification(al.title, al.message, al.key + '-' + Date.now(), true);
    await broadcastInstantAlertToAllUsers(al.title, al.message, al.key + '-' + Date.now());
}
window.triggerActiveBannerAlertByIdx = triggerActiveBannerAlertByIdx;

// 2.2 ລະບົບ SUPABASE REALTIME WEBSOCKET + BACKGROUND KEEP-ALIVE (ຫຼຸດ Delay ຕອນປິດຈໍມືຖື)
window.otRealtimeChannel = null;
window.otRealtimeReady = false;

function initSupabaseRealtimePushChannel() {
    if (!window.supabaseClient) return;
    if (window.otRealtimeChannel && window.otRealtimeReady) return;

    // ຂໍ Web Lock ເພື່ອບໍ່ໃຫ້ Android ຕັດສາຍ WebSocket หลับໄວເກີນໄປເວລາປິດຈໍ
    if (navigator.locks && typeof navigator.locks.request === 'function' && !window._otWebLockHeld) {
        window._otWebLockHeld = true;
        navigator.locks.request('online_team_realtime_keepalive', { mode: 'shared' }, function() {
            return new Promise(function() {}); // ຖື Lock ໄວ້ຕະຫຼອດອາຍຸການເປີດແອັບ
        }).catch(function() {});
    }

    try {
        window.otRealtimeChannel = window.supabaseClient
            .channel('online-team-live-channel', {
                config: {
                    broadcast: { self: false, ack: false } // ack: false ຊ່ວຍໃຫ້ຍິງອອກທັນທີໂດຍບໍ່ລໍຖ້າ Round-trip
                }
            })
            .on('broadcast', { event: 'instant-alert' }, function(payload) {
                var data = payload && payload.payload ? payload.payload : null;
                if (!data) return;
                sendPhoneScreenNotification(data.title, data.message, 'remote-' + Date.now(), true);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'shift_swaps' }, function() {
                if (typeof window.fetchLiveNotifications === 'function') window.fetchLiveNotifications();
                if (typeof window.loadEverythingFromSupabase === 'function') window.loadEverythingFromSupabase(0);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'annual_bookings' }, function() {
                if (typeof window.fetchLiveNotifications === 'function') window.fetchLiveNotifications();
                setTimeout(function() { evaluateAndRenderSmartAlerts(false); }, 500);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_sheets' }, function() {
                if (typeof window.loadEverythingFromSupabase === 'function') window.loadEverythingFromSupabase(0);
            })
            .subscribe(function(status) {
                if (status === 'SUBSCRIBED') {
                    window.otRealtimeReady = true;
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    window.otRealtimeReady = false;
                }
            });
    } catch (e) {
        console.warn('Realtime channel init warning:', e);
    }
}

// Keep-Alive Ping ທຸກໆ 15 ວິນາທີ ເພື່ອກະຕຸ້ນສາຍ WebSocket ບໍ່ໃຫ້ Idle ຕອນພັບຈໍມືຖື
setInterval(function() {
    if (window.otRealtimeChannel && window.otRealtimeReady) {
        try {
            window.otRealtimeChannel.send({
                type: 'broadcast',
                event: 'keepalive-ping',
                payload: { t: Date.now() }
            });
        } catch (e) {}
    } else {
        initSupabaseRealtimePushChannel();
    }
}, 15000);

document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        initSupabaseRealtimePushChannel();
    }
});

async function broadcastInstantAlertToAllUsers(title, message, tag) {
    if (!window.supabaseClient) return;
    if (!window.otRealtimeChannel || !window.otRealtimeReady) {
        initSupabaseRealtimePushChannel();
    }
    if (window.otRealtimeChannel) {
        try {
            await window.otRealtimeChannel.send({
                type: 'broadcast',
                event: 'instant-alert',
                payload: {
                    title: stripEmojisFromText(title),
                    message: stripEmojisFromText(message),
                    tag: tag || ('bc-' + Date.now()),
                    ts: Date.now()
                }
            });
        } catch (e) {}
    }
}
window.broadcastInstantAlertToAllUsers = broadcastInstantAlertToAllUsers;

// ຟັງຊັນສຳລັບ User & Admin ກົດເປີດຮັບແຈ້ງເຕືອນ
async function requestPhoneNotificationPermission() {
    if (!('Notification' in window)) {
        showToast('ບໍ່ຮອງຮັບ', 'ອຸປະກອນນີ້ບໍ່ຮອງຮັບລະບົບແຈ້ງເຕືອນເທິງໜ້າຈໍ', 'warning');
        return;
    }

    var perm = await Notification.requestPermission();
    if (perm === 'granted') {
        initSupabaseRealtimePushChannel();
        injectSmartAlertControlsUI(); // ອັບເດດປຸ່ມວ່າເປີດຮັບແຈ້ງເຕືອນແລ້ວ
        await sendPhoneScreenNotification(
            'Online Team - ເປີດຮັບແຈ້ງເຕືອນສຳເລັດ',
            'ອຸປະກອນຂອງທ່ານພ້ອມຮັບການແຈ້ງເຕືອນປະຈຳການ ແລະ ວັນສຳຄັນແລ້ວ!',
            'ot-welcome-' + Date.now(),
            true
        );
    } else {
        showToast('ຖືກປິດກັ້ນ', 'ກະລຸນາອະນຸຍາດ Notification ໃນຕັ້ງຄ່າ Browser ຂອງມືຖື', 'error');
    }
}
window.requestPhoneNotificationPermission = requestPhoneNotificationPermission;

// 3. ENGINE ກວດຈັບ "ກະບໍ່ສົມດຸນ (Shift Imbalance / ລາພັກເກີນ 1 ຄົນຕໍ່ກະ)"
function detectShiftImbalanceAlertsForDate(dStr) {
    var alerts = [];
    if (!dStr) return alerts;

    var bookings = window.annualBookings || [];
    var activeLeavesToday = bookings.filter(function(b) {
        if (!b) return false;
        var st = String(b.status || 'APPROVED').toUpperCase();
        if (st === 'REJECTED' || st === 'CANCELLED') return false;
        var s = b.start_date || b.startDate;
        var e = b.end_date || b.endDate || s;
        return dStr >= s && dStr <= e;
    });

    var shiftLeavesMap = { shift1: [], shift2: [], shift3: [] };
    var matchingSheets = (window.scheduleSheets || []).filter(function(sh) {
        return sh && sh.data && sh.data[dStr];
    });

    activeLeavesToday.forEach(function(lv) {
        var staffName = (lv.name_lao || lv.nameLao || '').trim();
        if (!staffName) return;

        var rawShiftText = String(lv.shift || '').toLowerCase();
        var matchedShiftKey = null;

        if (rawShiftText.includes('ກະ 1') || rawShiftText.includes('ກະ1') || rawShiftText.includes('shift1')) matchedShiftKey = 'shift1';
        else if (rawShiftText.includes('ກະ 2') || rawShiftText.includes('ກະ2') || rawShiftText.includes('shift2')) matchedShiftKey = 'shift2';
        else if (rawShiftText.includes('ກະ 3') || rawShiftText.includes('ກະ3') || rawShiftText.includes('shift3')) matchedShiftKey = 'shift3';

        if (!matchedShiftKey) {
            matchingSheets.forEach(function(sh) {
                var dayObj = sh.data[dStr] || {};
                ['shift1', 'shift2', 'shift3'].forEach(function(sKey) {
                    var list = dayObj[sKey] || [];
                    if (list.some(function(n) { return n && n.includes(staffName); })) {
                        matchedShiftKey = sKey;
                    }
                });
            });
        }

        if (matchedShiftKey && !shiftLeavesMap[matchedShiftKey].includes(staffName)) {
            shiftLeavesMap[matchedShiftKey].push(staffName);
        }
    });

    var shiftNamesLao = {
        shift1: 'ກະ 1 (08:00 - 16:00)',
        shift2: 'ກະ 2 (12:00 - 20:00)',
        shift3: 'ກະ 3 (20:00 - 08:00)'
    };

    ['shift1', 'shift2', 'shift3'].forEach(function(sKey) {
        var leaveStaff = shiftLeavesMap[sKey];
        if (leaveStaff.length > 1) {
            alerts.push({
                key: 'IMBALANCE_' + dStr + '_' + sKey + '_' + leaveStaff.length,
                badgeIcon: 'warning',
                badge: 'ແຈ້ງເຕືອນກະບໍ່ສົມດຸນ (ລາພັກເກີນ 1 ຄົນ/ກະ)',
                title: 'ກະບໍ່ສົມດຸນ! ' + shiftNamesLao[sKey] + ' ມີຜູ້ລາພັກພ້ອມກັນ ' + leaveStaff.length + ' ທ່ານ',
                message: 'ວັນທີ ' + dStr + ' ໃນ ' + shiftNamesLao[sKey] + ' ມີພະນັກງານລາພັກຊ້ຳກັນ (' + leaveStaff.join(', ') + '). ກະລຸນາກວດສອບກຳລັງຄົນ!',
                theme: 'ALERT_RED',
                icon: 'report_problem'
            });
        }
    });

    return alerts;
}

// 4. ລວບລວມການແຈ້ງເຕືອນທັງໝົດຂອງມື້ນີ້
function collectAllActiveSmartAlerts() {
    var results = [];
    var now = new Date();
    var yyyy = now.getFullYear();
    var mm = String(now.getMonth() + 1).padStart(2, '0');
    var dd = String(now.getDate()).padStart(2, '0');
    var todayStr = yyyy + '-' + mm + '-' + dd;
    var dayOfMonth = now.getDate();

    var dashDateEl = document.getElementById('dashDateInput');
    var targetDashDate = (dashDateEl && dashDateEl.value) ? dashDateEl.value : todayStr;
    var targetDayNum = parseInt(targetDashDate.split('-')[2], 10) || dayOfMonth;

    var rules = getCustomRemindersList();
    rules.forEach(function(r) {
        if (!r || !r.enabled) return;

        if (r.ruleType === 'MONTHLY_DAY' && (Number(r.dayOfMonth) === dayOfMonth || Number(r.dayOfMonth) === targetDayNum)) {
            results.push({
                key: 'RULE_' + r.id + '_' + targetDashDate,
                badgeIcon: 'event_repeat',
                badge: 'ແຈ້ງເຕືອນປະຈຳວັນທີ ' + r.dayOfMonth + ' ຂອງເດືອນ',
                title: r.title,
                message: r.message,
                theme: r.theme || 'BLUE',
                icon: r.icon || 'checkroom'
            });
        } else if (r.ruleType === 'SPECIFIC_DATE' && (r.targetDate === todayStr || r.targetDate === targetDashDate)) {
            results.push({
                key: 'RULE_' + r.id + '_' + r.targetDate,
                badgeIcon: 'account_balance',
                badge: 'ປະຕິທິນທະນາຄານ / ປະຕິທິນແດງ (' + r.targetDate + ')',
                title: r.title,
                message: r.message,
                theme: r.theme || 'RED',
                icon: r.icon || 'event_busy'
            });
        } else if (r.ruleType === 'ALWAYS_ACTIVE') {
            results.push({
                key: 'RULE_' + r.id + '_' + todayStr,
                badgeIcon: 'campaign',
                badge: 'ປະກາດສຳຄັນຈາກຂະແໜງ',
                title: r.title,
                message: r.message,
                theme: r.theme || 'AMBER',
                icon: r.icon || 'campaign'
            });
        }
    });

    var holList = window.specialHolidayRanges || [];
    holList.forEach(function(h) {
        if (!h) return;
        var s = h.start_date || h.start;
        var e = h.end_date || h.end || s;
        if (targetDashDate >= s && targetDashDate <= e) {
            results.push({
                key: 'SPECIAL_HOL_' + s + '_' + targetDashDate,
                badgeIcon: 'calendar_month',
                badge: 'ວັນພັກພິເສດຕາມປະຕິທິນທະນາຄານ (' + s + ' ຫາ ' + e + ')',
                title: 'ວັນພັກພິເສດ: ' + stripEmojisFromText(h.title || 'ວັນພັກລັດຖະການ/ທະນາຄານ'),
                message: 'ມື້ນີ້ຢູ່ໃນຊ່ວງວັນພັກພິເສດ ຕາຕະລາງປະຈຳການໃຊ້ເວລາວັນພັກ (08:00-13:30 | 13:30-19:00 | 19:00-08:00).',
                theme: 'RED',
                icon: 'celebration'
            });
        }
    });

    var imbalanceAlerts = detectShiftImbalanceAlertsForDate(targetDashDate);
    imbalanceAlerts.forEach(function(al) {
        results.push(al);
    });

    return results;
}

// ⭐ 5. ສ້າງປຸ່ມຄວບຄຸມແຈ້ງເຕືອນ (ແຍກສິດ Admin vs User ທົ່ວໄປ 100%)
function injectSmartAlertControlsUI() {
    var isAdmin = isCurrentUserSuperAdmin();
    var isGranted = ('Notification' in window && Notification.permission === 'granted');

    // A. ໃນກ່ອງກະດິ່ງແຈ້ງເຕືອນ (notifDropdown):
    // - Admin: ເຫັນປຸ່ມ "ຕັ້ງຄ່າ" + "ເປີດຮັບແຈ້ງເຕືອນ"
    // - User ທົ່ວໄປ: ເຫັນສະເພາະປຸ່ມ "ເປີດຮັບແຈ້ງເຕືອນ" ຢ່າງດຽວເທົ່ານັ້ນ!
    var notifList = document.getElementById('notifDropdownList');
    if (notifList && notifList.parentElement) {
        var existingBar = document.getElementById('smartNotifControlBar');
        if (!existingBar) {
            existingBar = document.createElement('div');
            existingBar.id = 'smartNotifControlBar';
            existingBar.className = 'mb-3 p-2.5 bg-red-50/90 border border-red-200 rounded-xl flex items-center justify-between gap-2';
            notifList.parentElement.insertBefore(existingBar, notifList);
        }

        existingBar.innerHTML =
            '<div class="text-[11px] text-slate-700 leading-tight">' +
                '<p class="font-bold text-brand-red flex items-center gap-1">' +
                    '<span class="material-symbols-outlined text-sm">notifications_active</span> ແຈ້ງເຕືອນເທິງໜ້າຈໍມືຖື' +
                '</p>' +
                '<p class="text-[10px] text-slate-500 mt-0.5">' + (isGranted ? 'ເປີດຮັບແຈ້ງເຕືອນອັດຕະໂນມັດແລ້ວ' : 'ກົດເປີດເພື່ອຮັບແຈ້ງເຕືອນວັນສຳຄັນ') + '</p>' +
            '</div>' +
            '<div class="flex items-center gap-1.5 shrink-0">' +
                (isAdmin ? (
                    '<button type="button" onclick="openCustomRemindersModal()" class="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs">' +
                        '<span class="material-symbols-outlined text-xs text-brand-red">settings</span> ຕັ້ງຄ່າ' +
                    '</button>'
                ) : '') +
                '<button type="button" onclick="requestPhoneNotificationPermission()" class="px-2.5 py-1.5 ' + (isGranted ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-brand-red hover:bg-brand-red-dark') + ' text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs">' +
                    '<span class="material-symbols-outlined text-xs">' + (isGranted ? 'check_circle' : 'send_to_mobile') + '</span> ' +
                    (isGranted ? 'ເປີດຮັບແລ້ວ' : 'ເປີດຮັບແຈ້ງເຕືອນ') +
                '</button>' +
            '</div>';
    }

    // B. ປຸ່ມ "ຕັ້ງຄ່າແຈ້ງເຕືອນວັນສຳຄັນ" ຢູ່ຫົວຂໍ້ໜ້າ Dashboard (ສະເພາະ Admin ເທົ່ານັ້ນ!)
    var dayBadge = document.getElementById('dayTypeBadge');
    if (dayBadge && dayBadge.parentElement && !document.getElementById('dashTopSmartAlertBtn')) {
        var btnWrap = document.createElement('div');
        btnWrap.id = 'dashTopSmartAlertBtn';
        btnWrap.className = 'flex flex-wrap items-center gap-2';

        var settingBtn = document.createElement('button');
        settingBtn.id = 'adminOnlySmartSettingBtn';
        settingBtn.type = 'button';
        settingBtn.onclick = function() { openCustomRemindersModal(); };
        settingBtn.className = (isAdmin ? '' : 'hidden ') + 'admin-only px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white flex items-center gap-1.5 shadow-2xs cursor-pointer transition';
        settingBtn.innerHTML = '<span class="material-symbols-outlined text-sm text-amber-400">edit_notifications</span> ຕັ້ງຄ່າແຈ້ງເຕືອນວັນສຳຄັນ';

        dayBadge.parentElement.insertBefore(btnWrap, dayBadge);
        btnWrap.appendChild(settingBtn);
        btnWrap.appendChild(dayBadge);
    } else {
        var existingBtn = document.getElementById('adminOnlySmartSettingBtn');
        if (existingBtn) {
            if (isAdmin) existingBtn.classList.remove('hidden');
            else existingBtn.classList.add('hidden');
        }
    }
}
window.injectSmartAlertControlsUI = injectSmartAlertControlsUI;

// ສະແດງປ້າຍ Smart Alerts ຢູ່ເທິງໜ້າ Dashboard (User ທົ່ວໄປເຫັນແຕ່ຂໍ້ຄວາມແຈ້ງເຕືອນ ບໍ່ເຫັນປຸ່ມຕັ້ງຄ່າ/ຍິງແຈ້ງເຕືອນ)
async function evaluateAndRenderSmartAlerts(forcePush) {
    injectSmartAlertControlsUI();

    var alerts = collectAllActiveSmartAlerts();
    window.currentActiveDashboardAlerts = alerts;

    var dashContainer = document.querySelector('#view-dashboard > div');
    var wrapper = document.getElementById('smartAlertsBannerContainer');

    if (dashContainer && !wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'smartAlertsBannerContainer';
        wrapper.className = 'space-y-3';
        dashContainer.insertBefore(wrapper, dashContainer.firstChild);
    }

    if (!wrapper) return;
    var isAdmin = isCurrentUserSuperAdmin();

    if (alerts.length === 0) {
        wrapper.innerHTML = '';
        return;
    }

    var themeClasses = {
        BLUE: 'bg-gradient-to-r from-blue-900 to-indigo-800 text-white border-blue-700',
        SKY: 'bg-gradient-to-r from-sky-600 to-blue-700 text-white border-sky-500',
        RED: 'bg-gradient-to-r from-brand-red to-rose-800 text-white border-red-700',
        ALERT_RED: 'bg-red-50 text-red-900 border-2 border-brand-red',
        AMBER: 'bg-amber-50 text-amber-900 border-2 border-amber-300'
    };

    var html = '';
    for (var i = 0; i < alerts.length; i++) {
        var al = alerts[i];
        var cls = themeClasses[al.theme] || themeClasses.BLUE;
        var isDark = cls.includes('text-white');

        // ສະເພາະ Admin ເທົ່ານັ້ນທີ່ເຫັນປຸ່ມ "ຕັ້ງຄ່າ" ແລະ "ຍິງແຈ້ງເຕືອນທັນທີ" ຢູ່ໃນປ້າຍ Banner
        var adminActionButtons = isAdmin ? (
            '<div class="flex items-center gap-2 shrink-0 self-end sm:self-center">' +
                '<button type="button" onclick="openCustomRemindersModal()" class="px-3 py-2 rounded-xl text-xs font-bold cursor-pointer ' + (isDark ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200') + ' flex items-center gap-1">' +
                    '<span class="material-symbols-outlined text-sm">settings</span> ຕັ້ງຄ່າ' +
                '</button>' +
                '<button type="button" onclick="triggerActiveBannerAlertByIdx(' + i + ')" class="px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ' + (isDark ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-brand-red text-white hover:bg-brand-red-dark') + ' flex items-center gap-1.5 shadow-2xs">' +
                    '<span class="material-symbols-outlined text-sm">send_to_mobile</span> ຍິງແຈ້ງເຕືອນທັນທີ' +
                '</button>' +
            '</div>'
        ) : '';

        html +=
            '<div class="p-4 rounded-3xl border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition ' + cls + '">' +
                '<div class="flex items-start sm:items-center gap-3">' +
                    '<div class="w-11 h-11 rounded-2xl ' + (isDark ? 'bg-white/20 text-white' : 'bg-brand-red text-white') + ' flex items-center justify-center shrink-0 shadow-2xs">' +
                        '<span class="material-symbols-outlined text-2xl">' + (al.icon || 'notifications_active') + '</span>' +
                    '</div>' +
                    '<div>' +
                        '<span class="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ' + (isDark ? 'bg-white/20 text-white' : 'bg-red-200/80 text-brand-red') + '">' +
                            '<span class="material-symbols-outlined text-[13px]">' + (al.badgeIcon || 'info') + '</span>' +
                            '<span>' + al.badge + '</span>' +
                        '</span>' +
                        '<h3 class="text-sm font-bold mt-1 flex items-center gap-1.5">' + al.title + '</h3>' +
                        '<p class="text-xs ' + (isDark ? 'opacity-90' : 'text-slate-700 font-medium') + ' mt-0.5 leading-relaxed">' + al.message + '</p>' +
                    '</div>' +
                '</div>' +
                adminActionButtons +
            '</div>';

        var sentFlag = localStorage.getItem('ot_sent_' + al.key);
        if (!sentFlag || forcePush) {
            var ok = await sendPhoneScreenNotification(al.title, al.message, al.key, false);
            if (ok) {
                try { localStorage.setItem('ot_sent_' + al.key, '1'); } catch(e) {}
            }
        }
    }

    wrapper.innerHTML = html;
}
window.evaluateAndRenderSmartAlerts = evaluateAndRenderSmartAlerts;

// 6. MODAL ຕັ້ງຄ່າແຈ້ງເຕືອນ (ລັອກສິດສະເພາະ Admin 100%)
function ensureCustomRemindersModalExists() {
    var existing = document.getElementById('customRemindersModal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'customRemindersModal';
    modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[115] hidden flex items-center justify-center p-4 font-lao';
    modal.innerHTML =
        '<div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-slate-100">' +
            '<div class="p-5 bg-slate-900 text-white flex justify-between items-center shrink-0">' +
                '<div class="flex items-center gap-2.5">' +
                    '<span class="material-symbols-outlined text-amber-400 text-2xl">edit_notifications</span>' +
                    '<div>' +
                        '<h3 class="font-bold text-sm">ຕັ້ງຄ່າການແຈ້ງເຕືອນອັດສະລິຍະ (Smart Reminders - Admin Only)</h3>' +
                        '<p class="text-[11px] text-slate-300">ເພີ່ມວັນນຸ່ງເສື້ອປະຈຳເດືອນ, ວັນພັກປະຕິທິນທະນາຄານ, ປະຕິທິນແດງ ຫຼື ປະກາດດ່ວນ</p>' +
                    '</div>' +
                '</div>' +
                '<button type="button" onclick="closeCustomRemindersModal()" class="text-white/80 hover:text-white cursor-pointer flex items-center justify-center"><span class="material-symbols-outlined text-xl">close</span></button>' +
            '</div>' +
            '<div class="p-6 overflow-y-auto flex-1 space-y-5 text-xs">' +
                '<div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">' +
                    '<p class="font-bold text-slate-800 flex items-center gap-1.5"><span class="material-symbols-outlined text-base text-brand-red">add_alert</span> ເພີ່ມລາຍການແຈ້ງເຕືອນໃໝ່:</p>' +
                    '<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">' +
                        '<div>' +
                            '<label class="block font-semibold text-slate-600 mb-1">ປະເພດການແຈ້ງເຕືອນ:</label>' +
                            '<select id="remRuleTypeSelect" onchange="toggleReminderRuleInputs()" class="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-bold outline-none">' +
                                '<option value="MONTHLY_DAY">ທຸກໆວັນທີຂອງເດືອນ (ເຊັ່ນ: ວັນທີ 1, ວັນທີ 14)</option>' +
                                '<option value="SPECIFIC_DATE">ວັນພັກປະຕິທິນທະນາຄານ / ປະຕິທິນແດງ (ລະບຸວັນທີ)</option>' +
                                '<option value="ALWAYS_ACTIVE">ປະກາດດ່ວນປະຈຳວັນ (ສະແດງທຸກມື້ຈົນກວ່າຈະປິດ)</option>' +
                            '</select>' +
                        '</div>' +
                        '<div id="remDayOfMonthWrap">' +
                            '<label class="block font-semibold text-slate-600 mb-1">ເລືອກວັນທີຂອງທຸກໆເດືອນ (1 - 31):</label>' +
                            '<input type="number" id="remDayOfMonthInput" min="1" max="31" value="1" class="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-bold outline-none"/>' +
                        '</div>' +
                        '<div id="remSpecificDateWrap" class="hidden">' +
                            '<label class="block font-semibold text-slate-600 mb-1">ເລືອກວັນທີຕາມປະຕິທິນ:</label>' +
                            '<input type="date" id="remSpecificDateInput" class="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-bold outline-none"/>' +
                        '</div>' +
                        '<div>' +
                            '<label class="block font-semibold text-slate-600 mb-1">ສີປ້າຍແຈ້ງເຕືອນ (Theme):</label>' +
                            '<select id="remThemeSelect" class="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-bold outline-none">' +
                                '<option value="BLUE">ສີຟ້າເຂັ້ມ (ກຳມະບານ / ທາງການ)</option>' +
                                '<option value="SKY">ສີຟ້າອ່ອນ (ຊາວໜຸ່ມ / ກິດຈະກຳ)</option>' +
                                '<option value="RED">ສີແດງ BCEL (ວັນພັກທະນາຄານ / ປະຕິທິນແດງ)</option>' +
                                '<option value="AMBER">ສີເຫຼືອງທອງ (ແຈ້ງເຕືອນທົ່ວໄປ)</option>' +
                            '</select>' +
                        '</div>' +
                        '<div>' +
                            '<label class="block font-semibold text-slate-600 mb-1">ໄອຄອນ (Material Symbol Icon):</label>' +
                            '<select id="remIconSelect" class="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-bold outline-none">' +
                                '<option value="checkroom">ເສື້ອຜ້າ / ຊຸດຍູນິຟອມ (checkroom)</option>' +
                                '<option value="account_balance">ທະນາຄານ / ວັນພັກທະນາຄານ (account_balance)</option>' +
                                '<option value="event_busy">ວັນພັກລັດຖະການ / ປະຕິທິນແດງ (event_busy)</option>' +
                                '<option value="campaign">ປະກາດດ່ວນ / ແຈ້ງການ (campaign)</option>' +
                                '<option value="celebration">ກິດຈະກຳ / ວັນສຳຄັນ (celebration)</option>' +
                            '</select>' +
                        '</div>' +
                        '<div class="sm:col-span-2">' +
                            '<label class="block font-semibold text-slate-600 mb-1">ຫົວຂໍ້ແຈ້ງເຕືອນ (Title) *:</label>' +
                            '<input type="text" id="remTitleInput" placeholder="ເຊັ່ນ: ວັນພັກທະນາຄານ: ບຸນປີໃໝ່ລາວ" class="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-bold outline-none"/>' +
                        '</div>' +
                        '<div class="sm:col-span-2">' +
                            '<label class="block font-semibold text-slate-600 mb-1">ລາຍລະອຽດຂໍ້ຄວາມແຈ້ງເຕືອນ (Message) *:</label>' +
                            '<input type="text" id="remMessageInput" placeholder="ເຊັ່ນ: ກະລຸນານຸ່ງເສື້ອ... ຫຼື ຕາຕະລາງປະຈຳການໃຊ້ໂໝດວັນພັກ..." class="w-full border border-slate-300 rounded-xl p-2.5 bg-white outline-none"/>' +
                        '</div>' +
                    '</div>' +
                    '<div class="flex justify-end pt-1">' +
                        '<button type="button" onclick="handleAddCustomReminderRule()" class="px-5 py-2.5 bg-brand-red hover:bg-brand-red-dark text-white rounded-xl font-bold shadow cursor-pointer flex items-center gap-1.5">' +
                            '<span class="material-symbols-outlined text-sm">add_circle</span> ບັນທຶກ & ຍິງແຈ້ງເຕືອນທັນທີ' +
                        '</button>' +
                    '</div>' +
                '</div>' +
                '<div>' +
                    '<div class="flex justify-between items-center mb-2">' +
                        '<p class="font-bold text-slate-800 flex items-center gap-1.5"><span class="material-symbols-outlined text-base text-slate-600">list_alt</span> ລາຍການແຈ້ງເຕືອນທີ່ຕັ້ງໄວ້ທັງໝົດ:</p>' +
                        '<span class="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">' +
                            '<span class="material-symbols-outlined text-xs">bolt</span> Real-time WebSocket Active' +
                        '</span>' +
                    '</div>' +
                    '<div id="customRemindersListContainer" class="space-y-2"></div>' +
                '</div>' +
            '</div>' +
            '<div class="p-4 bg-slate-50 border-t flex justify-end">' +
                '<button type="button" onclick="closeCustomRemindersModal()" class="px-5 py-2 bg-slate-800 text-white rounded-xl font-bold text-xs cursor-pointer">ປິດໜ້າຕ່າງ</button>' +
            '</div>' +
        '</div>';

    document.body.appendChild(modal);
}

function toggleReminderRuleInputs() {
    var type = document.getElementById('remRuleTypeSelect')?.value;
    var dayWrap = document.getElementById('remDayOfMonthWrap');
    var dateWrap = document.getElementById('remSpecificDateWrap');
    if (!dayWrap || !dateWrap) return;

    if (type === 'MONTHLY_DAY') {
        dayWrap.classList.remove('hidden');
        dateWrap.classList.add('hidden');
    } else if (type === 'SPECIFIC_DATE') {
        dayWrap.classList.add('hidden');
        dateWrap.classList.remove('hidden');
    } else {
        dayWrap.classList.add('hidden');
        dateWrap.classList.add('hidden');
    }
}
window.toggleReminderRuleInputs = toggleReminderRuleInputs;

function openCustomRemindersModal() {
    if (!isCurrentUserSuperAdmin()) {
        showToast('ສະເພາະ Admin', 'ຟັງຊັນຕັ້ງຄ່າການແຈ້ງເຕືອນສະຫງວນໄວ້ສຳລັບຜູ້ດູແລລະບົບ (Admin) ເທົ່ານັ້ນ', 'warning');
        return;
    }
    ensureCustomRemindersModalExists();
    renderCustomRemindersManagerList();
    document.getElementById('customRemindersModal')?.classList.remove('hidden');
}
window.openCustomRemindersModal = openCustomRemindersModal;

function closeCustomRemindersModal() {
    document.getElementById('customRemindersModal')?.classList.add('hidden');
}
window.closeCustomRemindersModal = closeCustomRemindersModal;

function renderCustomRemindersManagerList() {
    var container = document.getElementById('customRemindersListContainer');
    if (!container) return;
    var list = getCustomRemindersList();
    container.innerHTML = '';

    container.innerHTML +=
        '<div class="p-3.5 bg-red-50/70 border border-red-200 rounded-2xl flex items-center justify-between gap-3">' +
            '<div class="flex items-start gap-3">' +
                '<div class="w-9 h-9 rounded-xl bg-brand-red text-white flex items-center justify-center shrink-0 mt-0.5">' +
                    '<span class="material-symbols-outlined text-lg">report_problem</span>' +
                '</div>' +
                '<div>' +
                    '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-brand-red text-white">' +
                        '<span class="material-symbols-outlined text-[12px]">autorenew</span> ລະບົບອັດຕະໂນມັດ (Built-in)' +
                    '</span>' +
                    '<p class="font-bold text-slate-800 mt-1">ກວດຈັບກະບໍ່ສົມດຸນ (ກໍລະນີມີຄົນລາພັກເກີນ 1 ຄົນຕໍ່ກະ)</p>' +
                    '<p class="text-[11px] text-slate-600">ກວດສອບອັດຕະໂນມັດທຸກມື້ຈາກຕາຕະລາງລາພັກ ຖ້າກະໃດມີຄົນພັກຊ້ຳກັນຕັ້ງແຕ່ 2 ຄົນຂຶ້ນໄປ ຈະແຈ້ງເຕືອນທັນທີ</p>' +
                '</div>' +
            '</div>' +
            '<span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 shrink-0">' +
                '<span class="material-symbols-outlined text-sm">check_circle</span> ເປີດໃຊ້ງານຢູ່' +
            '</span>' +
        '</div>';

    list.forEach(function(r, idx) {
        var whenIcon = 'event_repeat';
        var whenLabel = '';
        if (r.ruleType === 'MONTHLY_DAY') {
            whenIcon = 'event_repeat';
            whenLabel = 'ທຸກໆວັນທີ ' + r.dayOfMonth + ' ຂອງເດືອນ';
        } else if (r.ruleType === 'SPECIFIC_DATE') {
            whenIcon = 'account_balance';
            whenLabel = 'ວັນທີ ' + r.targetDate;
        } else {
            whenIcon = 'campaign';
            whenLabel = 'ສະແດງທຸກມື້';
        }

        var itemIcon = r.icon || (r.ruleType === 'MONTHLY_DAY' ? 'checkroom' : (r.ruleType === 'SPECIFIC_DATE' ? 'account_balance' : 'campaign'));

        container.innerHTML +=
            '<div class="p-3.5 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">' +
                '<div class="flex items-start gap-3">' +
                    '<div class="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">' +
                        '<span class="material-symbols-outlined text-lg">' + itemIcon + '</span>' +
                    '</div>' +
                    '<div class="space-y-0.5">' +
                        '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">' +
                            '<span class="material-symbols-outlined text-[12px]">' + whenIcon + '</span> ' + whenLabel +
                        '</span>' +
                        '<p class="font-bold text-slate-800 pt-0.5">' + r.title + '</p>' +
                        '<p class="text-[11px] text-slate-500">' + r.message + '</p>' +
                    '</div>' +
                '</div>' +
                '<div class="flex items-center gap-1.5 shrink-0 self-end sm:self-center">' +
                    '<button type="button" onclick="triggerTestReminderByIdx(' + idx + ')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] cursor-pointer flex items-center gap-1 shadow-2xs">' +
                        '<span class="material-symbols-outlined text-xs">bolt</span> ຍິງທົດສອບທັນທີ' +
                    '</button>' +
                    '<button type="button" onclick="deleteCustomReminderRule(' + idx + ')" class="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-brand-red rounded-xl font-bold text-[11px] cursor-pointer flex items-center gap-1">' +
                        '<span class="material-symbols-outlined text-xs">delete</span> ລຶບ' +
                    '</button>' +
                '</div>' +
            '</div>';
    });
}

async function handleAddCustomReminderRule() {
    if (!isCurrentUserSuperAdmin()) return;
    var ruleType = document.getElementById('remRuleTypeSelect')?.value || 'MONTHLY_DAY';
    var dayOfMonth = parseInt(document.getElementById('remDayOfMonthInput')?.value, 10) || 1;
    var targetDate = document.getElementById('remSpecificDateInput')?.value || '';
    var theme = document.getElementById('remThemeSelect')?.value || 'BLUE';
    var icon = document.getElementById('remIconSelect')?.value || 'notifications_active';
    var title = stripEmojisFromText(document.getElementById('remTitleInput')?.value.trim() || '');
    var message = stripEmojisFromText(document.getElementById('remMessageInput')?.value.trim() || '');

    if (!title || !message) {
        showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາປ້ອນຫົວຂໍ້ ແລະ ຂໍ້ຄວາມແຈ້ງເຕືອນໃຫ້ຄົບຖ້ວນ', 'error');
        return;
    }
    if (ruleType === 'SPECIFIC_DATE' && !targetDate) {
        showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາເລືອກວັນທີຕາມປະຕິທິນ', 'error');
        return;
    }

    var newRule = {
        id: 'rem-' + Date.now(),
        ruleType: ruleType,
        dayOfMonth: dayOfMonth,
        targetDate: targetDate,
        icon: icon,
        title: title,
        message: message,
        theme: theme,
        enabled: true
    };

    var list = getCustomRemindersList();
    list.push(newRule);

    window.customRemindersConfig = list;
    saveCustomRemindersList();

    document.getElementById('remTitleInput').value = '';
    document.getElementById('remMessageInput').value = '';

    renderCustomRemindersManagerList();
    evaluateAndRenderSmartAlerts(false);

    await sendPhoneScreenNotification(newRule.title, newRule.message, newRule.id, true);
    await broadcastInstantAlertToAllUsers(newRule.title, newRule.message, newRule.id);
}
window.handleAddCustomReminderRule = handleAddCustomReminderRule;

function deleteCustomReminderRule(idx) {
    if (!isCurrentUserSuperAdmin()) return;
    var list = getCustomRemindersList();
    list.splice(idx, 1);
    window.customRemindersConfig = list;
    saveCustomRemindersList();
    renderCustomRemindersManagerList();
    evaluateAndRenderSmartAlerts(false);
    showToast('ລຶບສຳເລັດ', 'ລຶບລາຍການແຈ້ງເຕືອນອອກແລ້ວ', 'info');
}
window.deleteCustomReminderRule = deleteCustomReminderRule;

document.addEventListener('click', function(e) {
    if (e.target && e.target.closest && e.target.closest('[onclick*="toggleNotificationDropdown"]')) {
        setTimeout(injectSmartAlertControlsUI, 20);
    }
});

var _origRenderDashForAlerts = window.renderDashboard;
window.renderDashboard = function() {
    if (typeof _origRenderDashForAlerts === 'function') {
        _origRenderDashForAlerts();
    }
    injectSmartAlertControlsUI();
    evaluateAndRenderSmartAlerts(false);
};

document.addEventListener('DOMContentLoaded', function() {
    injectSmartAlertControlsUI();
    setTimeout(function() {
        injectSmartAlertControlsUI();
        initSupabaseRealtimePushChannel();
        evaluateAndRenderSmartAlerts(false);
    }, 500);
});

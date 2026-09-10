// ================= ⭐ ONLINE TEAM - CORE APP & CLOUD CONTROLLER (FULL MASTER) =================

// 1. DEFAULT AVATAR SVG (ປ້ອງກັນຮູບແຕກ 100%)
var DEFAULT_AVATAR = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23c01e2e'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
window.DEFAULT_AVATAR = DEFAULT_AVATAR;

// 2. SAFE JSON PARSE & AUTO-CLEAN
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

// 3. ລາຍຊື່ພະນັກງານເລີ່ມຕົ້ນ (ຄົບ 24 ທ່ານສຳຮອງ)
var defaultSystemUsers = [
    { user: 'admin', pass: 'admin123', nameLao: 'Admin', fullName: 'Super Admin', role: 'SUPER_ADMIN', isLeader: true, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5599 8877' },
    { user: 'BCEL0765', pass: 'bcel2026', nameLao: 'ແສງດາວ', fullName: 'SENGDAO DOUANGPRASEUTH', role: 'Staff', isLeader: true, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5501 2345' },
    { user: 'BCEL0272', pass: 'bcel2026', nameLao: 'ພອນສະຫວັນ', fullName: 'PHONSAVANH PHOMMAVONG', role: 'Staff', isLeader: true, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5502 3456' },
    { user: 'BCEL1055', pass: 'bcel2026', nameLao: 'ບຸນປະເສີດ', fullName: 'BOUNPRASEUTH VILAYPHONE', role: 'Staff', isLeader: true, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5503 4567' },
    { user: 'BCEL0872', pass: 'bcel2026', nameLao: 'ພັນນິກອນ', fullName: 'PHANNIKHONE PHOMMASENG', role: 'Staff', isLeader: true, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5504 5678' },
    { user: 'BCEL0277', pass: 'bcel2026', nameLao: 'ສົມທະຍາ', fullName: 'SOMTHAYA BOUTDAXAY', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5505 6789' },
    { user: 'BCEL0707', pass: 'bcel2026', nameLao: 'ມິກກີ້', fullName: 'MIKKY SAYALATH', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5506 7890' },
    { user: 'BCEL1431', pass: 'bcel2026', nameLao: 'ທູຮັກ', fullName: 'THOUHAK SENGCHALEUN', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5507 8901' },
    { user: 'BCEL1532', pass: 'bcel2026', nameLao: 'ແພັກກີ້', fullName: 'PACKY PHOMMALATH', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5508 9012' },
    { user: 'BCEL2007', pass: 'bcel2026', nameLao: 'ເອກສະຫວ່າງ', fullName: 'EKXAVANG PHANTHAVONG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5509 0123' },
    { user: 'BCEL2120', pass: 'bcel2026', nameLao: 'ໂທມິກ', fullName: 'TONICK BOUDDASIEN', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5599 1122' },
    { user: 'BCEL1101', pass: 'bcel2026', nameLao: 'ບຸນຮັກ', fullName: 'BOUNHAK XAYAVONG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5510 1122' },
    { user: 'BCEL1102', pass: 'bcel2026', nameLao: 'ປະສັງສິນ', fullName: 'PASANGSIN SOULIVONG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5511 2233' },
    { user: 'BCEL1103', pass: 'bcel2026', nameLao: 'ສາຍທອງ', fullName: 'SAYTHONG MANIVONG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5512 3344' },
    { user: 'BCEL1104', pass: 'bcel2026', nameLao: 'ສົມຊາຍ', fullName: 'SOMCHAY VONGXAY', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5513 4455' },
    { user: 'BCEL1105', pass: 'bcel2026', nameLao: 'ສີຊຸມພູ', fullName: 'SICHUMPHOU LATTHAVONG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5514 5566' },
    { user: 'BCEL1106', pass: 'bcel2026', nameLao: 'ສຸລິຍະສັກ', fullName: 'SOULIYASACK PHANTHAMALY', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5515 6677' },
    { user: 'BCEL1107', pass: 'bcel2026', nameLao: 'ໄທສະຫວາດ', fullName: 'THAISAVATH PHOMMAVONG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5516 7788' }
];

window.defaultEmployeeGroups = [
    { id: 'grp-g7-flex', name: 'ກຸ່ມທີມບໍລິການ 7 ຄົນ (G7 Flex)', members: ['ສົມທະຍາ', 'ມິກກີ້', 'ທູຮັກ', 'ແພັກກີ້', 'ເອກສະຫວ່າງ', 'ໂທມິກ', 'ບຸນຮັກ'] },
    { id: 'grp-main-17', name: 'ກຸ່ມທີມບໍລິການຫຼັກ (17 ຄົນ)', members: ['ແສງດາວ', 'ພອນສະຫວັນ', 'ບຸນປະເສີດ', 'ພັນນິກອນ', 'ສົມທະຍາ', 'ມິກກີ້', 'ທູຮັກ', 'ແພັກກີ້', 'ເອກສະຫວ່າງ', 'ໂທມິກ', 'ບຸນຮັກ', 'ປະສັງສິນ', 'ສາຍທອງ', 'ສົມຊາຍ', 'ສີຊຸມພູ', 'ສຸລິຍະສັກ', 'ໄທສະຫວາດ'] }
];

window.defaultNotesTemplate = `1. ກະ 1 (08:00 - 16:00), ກະ 2 (12:00 - 20:00), ກະ 3 (20:00 - 08:00).
2. ວັນເສົາ-ອາທິດ: ກະ 1 (08:00 - 13:30), ກະ 2 (13:30 - 19:00), ກະ 3 (19:00 - 08:00).
3. ຫາກມີການຂໍປ່ຽນກະ ຕ້ອງແຈ້ງ ແລະ ໄດ້ຮັບການເຫັນດີຜ່ານລະບົບລ່ວງໜ້າຢ່າງໜ້ອຍ 24 ຊົ່ວໂມງ.`;

// 4. TOAST NOTIFICATION
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

// 5. CONFIRM MODAL
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

// 6. TAB SWITCHER
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
        var isAdmin = window.currentUser && window.currentUser.role === 'SUPER_ADMIN';
        var adminSec = document.getElementById('adminReportsSection');
        if (adminSec) {
            if (isAdmin) {
                adminSec.classList.remove('hidden');
                if (typeof window.renderAdminAllStaffReport === 'function') window.renderAdminAllStaffReport();
            } else {
                adminSec.classList.add('hidden');
            }
        }
        if (typeof window.renderUserCurrentWeekWorkspace === 'function') window.renderUserCurrentWeekWorkspace();
    }
}
window.switchTab = switchTab;

function toggleMobileDrawer() {
    var drawer = document.getElementById('mobileDrawer');
    var backdrop = document.getElementById('mobileDrawerBackdrop');
    if (!drawer || !backdrop) return;

    if (drawer.classList.contains('-translate-x-full')) {
        drawer.classList.remove('-translate-x-full');
        backdrop.classList.remove('hidden');
    } else {
        drawer.classList.add('-translate-x-full');
        backdrop.classList.add('hidden');
    }
}
window.toggleMobileDrawer = toggleMobileDrawer;

// 7. ACTIVE SCHEDULE SHEET
function getActiveSheet() {
    if (!window.scheduleSheets || window.scheduleSheets.length === 0) {
        window.scheduleSheets = [{
            id: 'sheet-2026-09',
            monthKey: '2026-09',
            title: 'ຕາຕະລາງປະຈຳການບໍລິການອອນໄລປະຈຳເດືອນ 09/2026',
            notes: window.defaultNotesTemplate,
            status: 'PUBLISHED',
            data: {}
        }];
        window.activeSheetId = 'sheet-2026-09';
    }

    var sheet = window.scheduleSheets.find(function(s) {
        return s && s.id === window.activeSheetId;
    });

    if (!sheet) {
        sheet = window.scheduleSheets[0];
        window.activeSheetId = sheet ? sheet.id : null;
    }
    return sheet;
}
window.getActiveSheet = getActiveSheet;

// 8. SAVE STATE TO LOCAL STORAGE
function saveAll() {
    try {
        if (window.scheduleSheets) localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
        if (window.activeSheetId) localStorage.setItem('ot_active_sheet_id', window.activeSheetId);
        if (window.users) localStorage.setItem('ot_users', JSON.stringify(window.users));
        if (window.employeeGroups) localStorage.setItem('ot_employee_groups', JSON.stringify(window.employeeGroups));
        if (window.fixedShiftsConfig) localStorage.setItem('ot_fixed_shifts_cfg', JSON.stringify(window.fixedShiftsConfig));
        if (window.specialHolidayRanges) localStorage.setItem('ot_special_holidays', JSON.stringify(window.specialHolidayRanges));
        if (window.annualBookings) localStorage.setItem('ot_annual_bookings', JSON.stringify(window.annualBookings));
        if (window.swapHistory) localStorage.setItem('ot_swap_history', JSON.stringify(window.swapHistory));
        if (window.scheduleAuditLogs) localStorage.setItem('ot_schedule_audit_logs', JSON.stringify(window.scheduleAuditLogs));
        if (window.systemNotifications) localStorage.setItem('ot_system_notifications', JSON.stringify(window.systemNotifications));
    } catch (e) {
        console.warn("Storage save error:", e);
    }
}
window.saveAll = saveAll;

// ⭐ 9. RENDER ROSTER SIDEBAR (ມີຮູບພາບ ແລະ Fallback ປ້ອງກັນຮູບແຕກ 100%)
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
            <div class="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100 transition">
                <div class="flex items-center gap-2">
                    <img src="${avatarUrl}" onerror="this.src='${DEFAULT_AVATAR}'" class="w-7 h-7 rounded-full object-cover border-2 border-slate-200 bg-red-50 shrink-0"/>
                    <span class="font-bold ${isL ? 'text-brand-red' : 'text-slate-800'}">${u.nameLao}</span>
                </div>
                ${isL ? '<span class="text-[9px] bg-red-50 text-brand-red px-1.5 py-0.5 rounded font-bold border border-red-200">ຫົວໜ້າ</span>' : '<span class="text-[10px] text-slate-400 font-mono">' + u.user + '</span>'}
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
            <div class="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:bg-slate-100 transition">
                <div class="flex items-center gap-2">
                    <img src="${avatarUrl}" onerror="this.src='${DEFAULT_AVATAR}'" class="w-7 h-7 rounded-full object-cover border-2 border-slate-200 bg-red-50 shrink-0"/>
                    <span class="font-bold ${isL ? 'text-brand-red' : 'text-slate-800'}">${u.nameLao}</span>
                </div>
                ${isL ? '<span class="text-[9px] bg-red-50 text-brand-red px-1.5 py-0.5 rounded font-bold border border-red-200">ຫົວໜ້າ</span>' : '<span class="text-[10px] text-slate-400 font-mono">' + u.user + '</span>'}
            </div>
        `;
    });
}
window.filterRosterSidebar = filterRosterSidebar;

// ⭐ 10. RENDER EMPLOYEES TABLE (ສະແດງພະນັກງານທັງໝົດ 24 ທ່ານ ພ້ອມຮູບພາບຄົບຖ້ວນ)
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

// 11. IOS NOTIFICATION SOUND & LIVE CHIME
function playIOSNotificationSound() {
    try {
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        var ctx = new AudioCtx();
        if (ctx.state === 'suspended') ctx.resume();

        var now = ctx.currentTime;
        var notes = [
            { f: 830.61, start: 0, dur: 0.28 },
            { f: 987.77, start: 0.11, dur: 0.28 },
            { f: 1318.51, start: 0.22, dur: 0.45 }
        ];

        notes.forEach(function(note) {
            var osc = ctx.createOscillator();
            var gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(note.f, now + note.start);
            gain.gain.setValueAtTime(0.001, now + note.start);
            gain.gain.exponentialRampToValueAtTime(0.35, now + note.start + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + note.start + note.dur);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + note.start);
            osc.stop(now + note.start + note.dur);
        });
    } catch (e) {}
}
window.playIOSNotificationSound = playIOSNotificationSound;

document.addEventListener('click', function() {
    try {
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx && AudioCtx.state === 'suspended') AudioCtx.resume();
    } catch (e) {}
}, { once: true });

function toggleNotificationDropdown() {
    var dropdown = document.getElementById('notifDropdown');
    if (dropdown) dropdown.classList.toggle('hidden');
}
window.toggleNotificationDropdown = toggleNotificationDropdown;

function markAllNotificationsAsRead() {
    var badge = document.getElementById('notifBadge');
    if (badge) {
        badge.classList.add('hidden');
        badge.classList.remove('flex');
    }
    window.lastNotifCount = 0;
    showToast('ສຳເລັດ', 'ໝາຍວ່າອ່ານການແຈ້ງເຕືອນທັງໝົດແລ້ວ', 'info');
}
window.markAllNotificationsAsRead = markAllNotificationsAsRead;

// 12. FETCH LIVE NOTIFICATIONS
async function fetchLiveNotifications() {
    if (!window.supabaseClient || !window.currentUser) return;

    try {
        var myName = window.currentUser.nameLao;
        var isAdmin = window.currentUser.role === 'SUPER_ADMIN';
        var notifList = [];

        var swapRes = await window.supabaseClient
            .from('shift_swaps')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        var swaps = swapRes.data;
        if (swaps) {
            swaps.forEach(function(sw) {
                if (sw.to_name === myName && sw.status === 'PENDING') {
                    notifList.push({
                        id: 'swap-' + sw.id,
                        icon: 'sync_alt',
                        iconBg: 'bg-amber-100 text-amber-800',
                        title: 'ມີຄຳຂໍປ່ຽນກະໃໝ່!',
                        message: sw.from_name + ' ຂໍແລກປ່ຽນກະ [' + sw.from_shift + '] ກັບ [' + sw.to_shift + '] ວັນທີ ' + sw.start_date,
                        date: sw.start_date,
                        unread: true
                    });
                } else if (isAdmin && sw.status === 'PENDING') {
                    notifList.push({
                        id: 'swap-admin-' + sw.id,
                        icon: 'swap_horiz',
                        iconBg: 'bg-blue-100 text-blue-800',
                        title: 'ການຂໍປ່ຽນກະໃນທີມ',
                        message: sw.from_name + ' ➔ ' + sw.to_name + ' (ວັນທີ ' + sw.start_date + ')',
                        date: sw.start_date,
                        unread: false
                    });
                }
            });
        }

        var leaveRes = await window.supabaseClient
            .from('annual_bookings')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        var leaves = leaveRes.data;
        if (leaves) {
            leaves.forEach(function(lv) {
                if (isAdmin && lv.status === 'PENDING_ADMIN') {
                    notifList.push({
                        id: 'leave-pending-' + lv.id,
                        icon: 'warning',
                        iconBg: 'bg-red-100 text-brand-red',
                        title: '⚠️ ລາພັກຊ້ອນ 2 ຄົນໃນກະດຽວ!',
                        message: lv.name_lao + ' ຂໍລາພັກ [' + lv.shift + '] ວັນທີ ' + lv.start_date,
                        date: lv.start_date,
                        unread: true
                    });
                } else if (lv.status === 'CONFIRMED' && lv.name_lao !== myName) {
                    notifList.push({
                        id: 'leave-info-' + lv.id,
                        icon: 'flight_takeoff',
                        iconBg: 'bg-emerald-100 text-emerald-800',
                        title: 'ເພື່ອນຮ່ວມງານລາພັກ',
                        message: lv.name_lao + ' ລາພັກ [' + lv.shift + '] ວັນທີ ' + lv.start_date,
                        date: lv.start_date,
                        unread: false
                    });
                }
            });
        }

        renderNotificationDropdownUI(notifList);

    } catch (err) {
        console.error("Error polling notifications:", err);
    }
}

function renderNotificationDropdownUI(notifList) {
    var container = document.getElementById('notifDropdownList');
    var badge = document.getElementById('notifBadge');
    if (!container) return;

    container.innerHTML = '';
    var unreadCount = notifList.filter(function(n) { return n.unread; }).length;

    if (badge) {
        if (unreadCount > 0) {
            badge.innerText = unreadCount;
            badge.classList.remove('hidden');
            badge.classList.add('flex');
        } else {
            badge.classList.add('hidden');
            badge.classList.remove('flex');
        }
    }

    if (window.lastNotifCount === undefined) {
        window.lastNotifCount = unreadCount;
    } else if (unreadCount > window.lastNotifCount) {
        playIOSNotificationSound();
        window.lastNotifCount = unreadCount;
    } else {
        window.lastNotifCount = unreadCount;
    }

    if (notifList.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-xs text-center py-6 font-lao">ບໍ່ມີການແຈ້ງເຕືອນໃໝ່</p>';
        return;
    }

    notifList.forEach(function(item) {
        container.innerHTML += `
            <div onclick="switchTab('profile'); toggleNotificationDropdown();" class="p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer flex gap-3 items-start border-b border-slate-50 transition">
                <div class="w-7 h-7 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0 mt-0.5">
                    <span class="material-symbols-outlined text-sm">${item.icon}</span>
                </div>
                <div class="flex-1 text-xs">
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-slate-800 text-[11px]">${item.title}</span>
                        <span class="text-[9px] text-slate-400 font-mono">${item.date}</span>
                    </div>
                    <p class="text-slate-600 text-[10px] mt-0.5 leading-tight">${item.message}</p>
                </div>
            </div>
        `;
    });
}

// ⭐ 13. MASTER CLOUD SYNC (ດຶງພະນັກງານທຸກຄົນ 24 ທ່ານ + ຮູບພາບ + ກຸ່ມ + ຕາຕະລາງ)
async function loadEverythingFromSupabase() {
    if (!window.supabaseClient) return;

    try {
        // --- A. ດຶງ Employee Groups ---
        var grpRes = await window.supabaseClient.from('employee_groups').select('*');
        if (!grpRes.error && grpRes.data && grpRes.data.length > 0) {
            window.employeeGroups = grpRes.data.map(function(g) {
                return { id: g.id, name: g.name, members: g.members || [] };
            });
        } else {
            if (!window.employeeGroups || window.employeeGroups.length === 0) {
                window.employeeGroups = window.defaultEmployeeGroups;
                try { await window.supabaseClient.from('employee_groups').upsert(window.defaultEmployeeGroups); } catch(e) {}
            }
        }
        if (typeof window.renderGroupsListGrid === 'function') window.renderGroupsListGrid();

        // --- B. ດຶງໂປຣໄຟລ໌ ແລະ ຮູບພາບເພື່ອນຮ່ວມງານ (ດຶງຄົບ 24 ທ່ານ 100%) ---
        var profRes = await window.supabaseClient.from('profiles').select('*');
        var cloudProfiles = profRes.data;

        if (!profRes.error && cloudProfiles && cloudProfiles.length > 0) {
            cloudProfiles.forEach(function(cp) {
                var userCode = cp.user_code || cp.username || cp.user || '';
                var nameLao = cp.name_lao || cp.nameLao || '';
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
                    photo: cp.photo || '',
                    pass: cp.pass || cp.password || 'bcel2026'
                };

                if (existingIdx !== -1) {
                    window.users[existingIdx] = Object.assign({}, window.users[existingIdx], normalizedUser, {
                        photo: cp.photo || window.users[existingIdx].photo || ''
                    });
                } else {
                    // ⭐ ເພີ່ມພະນັກງານຄົນໃໝ່ຈາກ Database ເຂົ້າສູ່ລະບົບທັນທີ (ບໍ່ຕັດຖິ້ມ)!
                    window.users.push(normalizedUser);
                }
            });

            // ອັບເດດໂປຣໄຟລ໌ຕົນເອງ
            if (window.currentUser) {
                var myProf = cloudProfiles.find(function(cp) {
                    return cp.user_code && window.currentUser.user && cp.user_code.toLowerCase() === window.currentUser.user.toLowerCase();
                });
                if (myProf && myProf.photo) {
                    window.currentUser.photo = myProf.photo;
                }
            }

            var topAv = document.getElementById('topAvatar');
            if (topAv) {
                topAv.src = (window.currentUser && window.currentUser.photo) ? window.currentUser.photo : DEFAULT_AVATAR;
                topAv.onerror = function() { this.src = DEFAULT_AVATAR; };
            }

            // ⭐ RE-RENDER ຮູບພາບທົ່ວທັງລະບົບທັນທີ!
            if (typeof window.renderEmployeesTable === 'function') window.renderEmployeesTable();
            if (typeof window.renderScheduleStaffRoster === 'function') window.renderScheduleStaffRoster();
            if (typeof window.renderDashboard === 'function') window.renderDashboard();
        }

        // --- C. ດຶງຕາຕະລາງປະຈຳການ ---
        var schedRes = await window.supabaseClient
            .from('schedules')
            .select('*')
            .order('month_key', { ascending: false });

        var cloudSchedules = schedRes.data;
        if (!schedRes.error && cloudSchedules && cloudSchedules.length > 0) {
            window.scheduleSheets = cloudSchedules.map(function(cs) {
                var rawData = cs.data || cs.schedule_data || {};
                if (typeof rawData === 'string') {
                    try { rawData = JSON.parse(rawData); } catch (e) { rawData = {}; }
                }

                return {
                    id: String(cs.id),
                    monthKey: cs.month_key || '2026-09',
                    title: cs.title || rawData?._meta?.title || ('ຕາຕະລາງປະຈຳການ ' + (cs.month_key || '')),
                    notes: cs.notes || rawData?._meta?.notes || window.defaultNotesTemplate || '',
                    status: cs.status || 'PUBLISHED',
                    data: rawData
                };
            });

            if (!window.activeSheetId || !window.scheduleSheets.some(function(s) { return s.id === window.activeSheetId; })) {
                window.activeSheetId = window.scheduleSheets[0].id;
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

// 14. INITIALIZE APPLICATION
document.addEventListener('DOMContentLoaded', function() {
    var storedUsers = safeJSONParse(localStorage.getItem('ot_users'), null);
    window.users = (storedUsers && storedUsers.length > 0) ? storedUsers : defaultSystemUsers;

    window.scheduleSheets = safeJSONParse(localStorage.getItem('ot_schedules_sheets'), window.scheduleSheets || []);
    window.activeSheetId = localStorage.getItem('ot_active_sheet_id') || (window.scheduleSheets[0] ? window.scheduleSheets[0].id : null);
    
    var storedGroups = safeJSONParse(localStorage.getItem('ot_employee_groups'), null);
    window.employeeGroups = (storedGroups && storedGroups.length > 0) ? storedGroups : window.defaultEmployeeGroups;

    window.fixedShiftsConfig = safeJSONParse(localStorage.getItem('ot_fixed_shifts_cfg'), window.fixedShiftsConfig || []);
    window.specialHolidayRanges = safeJSONParse(localStorage.getItem('ot_special_holidays'), window.specialHolidayRanges || []);
    window.annualBookings = safeJSONParse(localStorage.getItem('ot_annual_bookings'), window.annualBookings || []);
    window.swapHistory = safeJSONParse(localStorage.getItem('ot_swap_history'), window.swapHistory || []);
    window.scheduleAuditLogs = safeJSONParse(localStorage.getItem('ot_schedule_audit_logs'), window.scheduleAuditLogs || []);
    window.systemNotifications = safeJSONParse(localStorage.getItem('ot_system_notifications'), window.systemNotifications || []);

    var topAv = document.getElementById('topAvatar');
    if (topAv) {
        var curUser = safeJSONParse(localStorage.getItem('ot_auth_live'), null);
        topAv.src = (curUser && curUser.photo) ? curUser.photo : DEFAULT_AVATAR;
        topAv.onerror = function() { this.src = DEFAULT_AVATAR; };
    }

    setTimeout(loadEverythingFromSupabase, 600);
    setTimeout(fetchLiveNotifications, 1500);

    setInterval(fetchLiveNotifications, 20000);
    setInterval(loadEverythingFromSupabase, 25000);
});

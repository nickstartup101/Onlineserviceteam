// MASTER PRESET USERS (25 Staff)
var MASTER_USERS_DEFAULT = [
    { user: 'admin', pass: 'admin123', fullName: 'System Administrator', nameLao: 'Admin', role: 'SUPER_ADMIN', isLeader: false },
    { user: 'BCEL0765', pass: 'bcel2026', fullName: 'SENGDAO DOUANGSOMBATH', nameLao: 'ແສງດາວ', role: 'STAFF', isLeader: true },
    { user: 'BCEL0272', pass: 'bcel2026', fullName: 'PHONESAVANH HEUANGVILAY', nameLao: 'ພອນສະຫວັນ', role: 'STAFF', isLeader: true },
    { user: 'BCEL1055', pass: 'bcel2026', fullName: 'BOUNPRASEUTH SILIMANOTHAM', nameLao: 'ບຸນປະເສີດ', role: 'STAFF', isLeader: true },
    { user: 'BCEL0872', pass: 'bcel2026', fullName: 'PHANNIKONE SAYAPHET', nameLao: 'ພັນນິກອນ', role: 'STAFF', isLeader: true },
    { user: 'BCEL0277', pass: 'bcel2026', fullName: 'SONTHAYA MONLATHOM', nameLao: 'ສົນທະຍາ', role: 'STAFF', isLeader: false },
    { user: 'BCEL0707', pass: 'bcel2026', fullName: 'NICKEE KHAMKHOSY', nameLao: 'ນິກກີ້', role: 'STAFF', isLeader: false },
    { user: 'BCEL1431', pass: 'bcel2026', fullName: 'NOUHACK SOULAIYAKHAM', nameLao: 'ໜູຮັກ', role: 'STAFF', isLeader: false },
    { user: 'BCEL1532', pass: 'bcel2026', fullName: 'PAKKER VILAISANG', nameLao: 'ເເພັກເກີ້', role: 'STAFF', isLeader: false },
    { user: 'BCEL2007', pass: 'bcel2026', fullName: 'AEKSAVANG PHOUVONGKHAMCHAN', nameLao: 'ເອກສະຫວ່າງ', role: 'STAFF', isLeader: false },
    { user: 'BCEL2101', pass: 'bcel2026', fullName: 'BOUNHAK BOUTTHAVONG', nameLao: 'ບຸນຮັກ', role: 'STAFF', isLeader: false },
    { user: 'BCEL2103', pass: 'bcel2026', fullName: 'PASONGSIN MANOTHAM', nameLao: 'ປະສົງສິນ', role: 'STAFF', isLeader: false },
    { user: 'BCEL2104', pass: 'bcel2026', fullName: 'SAIYTHONG VONGDALA', nameLao: 'ສາຍທອງ', role: 'STAFF', isLeader: false },
    { user: 'BCEL2105', pass: 'bcel2026', fullName: 'SOXAY SOULIYAVONG', nameLao: 'ສົມຊາຍ', role: 'STAFF', isLeader: false },
    { user: 'BCEL2120', pass: 'bcel2026', fullName: 'TONICK BOUDDASIEN', nameLao: 'ໂທນິກ', role: 'STAFF', isLeader: false },
    { user: 'BCEL2319', pass: 'bcel2026', fullName: 'XAYYASITH VONGDONEXAI', nameLao: 'ໄຊຍະສິດ', role: 'STAFF', isLeader: false },
    { user: 'BCEL2321', pass: 'bcel2026', fullName: 'LITTASONE HUEANGKHAMSAEN', nameLao: 'ລິດຕະສອນ', role: 'STAFF', isLeader: false },
    { user: 'BCEL2323', pass: 'bcel2026', fullName: 'SISOMPHOU INTHAVONG', nameLao: 'ສີຊົມພູ', role: 'STAFF', isLeader: false },
    { user: 'BCEL2425', pass: 'bcel2026', fullName: 'THONGSAVANH VANNAXAY', nameLao: 'ທອງສະຫວັນ', role: 'STAFF', isLeader: false },
    { user: 'BCEL2426', pass: 'bcel2026', fullName: 'SOULIYASACK KHAMPHAIVONG', nameLao: 'ສຸລິຍະສັກ', role: 'STAFF', isLeader: false },
    { user: 'BCEL2515', pass: 'bcel2026', fullName: 'KAYSAVATH PHANLUANGKHAM', nameLao: 'ໄກສະຫວາດ', role: 'STAFF', isLeader: false },
    { user: 'BCEL2516', pass: 'bcel2026', fullName: 'XAIYAPHONE SYLAVONG', nameLao: 'ໄຊຍະພອນ', role: 'STAFF', isLeader: false },
    { user: 'BCEL2517', pass: 'bcel2026', fullName: 'KEOVILAY XAYYALATH', nameLao: 'ແກ້ວວິໄລ', role: 'STAFF', isLeader: false },
    { user: 'BCEL2579', pass: 'bcel2026', fullName: 'CHITSADA CHANTHAVONG', nameLao: 'ຈິດສະດາ', role: 'STAFF', isLeader: false },
    { user: 'BCEL2580', pass: 'bcel2026', fullName: 'NALONGSAK YASENG', nameLao: 'ນະລົງສັກ', role: 'STAFF', isLeader: false }
];

var defaultNotesTemplate = `1, ການປະຈຳການມີ 3 ກະ\n2, ກະ1 ແຕ່ເວລາ 08:00-16:00 (ວັນເສົາ-ອາທິດ/ວັນພັກ 08:00-13:30)\n3, ກະ2 ແຕ່ເວລາ 12:00-20:00 (ວັນເສົາ-ອາທິດ/ວັນພັກ 13:30-19:00)\n4, ກະ3 ແຕ່ເວລາ 20:00-08:00 (ວັນເສົາ-ອາທິດ/ວັນພັກ 19:00-08:00)\n5, ຕົວໜັງສື ແລະ ພະນັກງານທີ່ຖືກແຕ່ງຕັ້ງປະຈຳການແມ່ນຕ້ອງປະຕິບັດໂມງເວລາຢ່າງເຂັ້ມງວດ\n6, ໃນກໍລະນີເຈັບເປັນ ແລະ ພະນັກງານມີວຽກກະທັນຫັນແມ່ນສາມາດປະຈຳການແທນກັນໄດ້ ແຕ່ຕ້ອງແຈ້ງຕໍ່ພະນັກງານຄຸ້ມຄອງ\n7, ຫ້າມບໍ່ໃຫ້ມີການປ່ຽນແປງຕາຕະລາງປະຈຳການໂດຍບໍ່ໄດ້ຮັບອະນຸຍາດ`;

// Load Storage
var savedUsers = JSON.parse(localStorage.getItem('ot_users_master'));
window.users = (savedUsers && savedUsers.length > 0) ? savedUsers : MASTER_USERS_DEFAULT.map(u => ({ ...u, photo: '', annualQuota: 15, usedAnnual: 2, otherLeaves: 0 }));

window.currentUser = JSON.parse(localStorage.getItem('ot_auth_live')) || null;
window.activeSheetId = localStorage.getItem('ot_active_sheet_id_trial2') || 'sheet-1';
window.specialHolidayRanges = JSON.parse(localStorage.getItem('ot_holidays_trial2')) || [];

window.employeeGroups = JSON.parse(localStorage.getItem('ot_emp_groups_trial2')) || [
    {
        id: 'grp-main',
        name: 'ກຸ່ມພະນັກງານຫຼັກ (Zigzag 24/7)',
        members: window.users.filter(u => u.role !== 'SUPER_ADMIN').map(u => u.nameLao)
    }
];

window.scheduleSheets = JSON.parse(localStorage.getItem('ot_schedule_sheets_trial2')) || [
    {
        id: 'sheet-1',
        monthKey: '2026-09',
        title: 'ຕາຕະລາງປະຈຳການບໍລິການອອນໄລປະຈຳເດືອນ 09/2026',
        notes: defaultNotesTemplate,
        status: 'PUBLISHED',
        data: {}
    }
];

window.fixedShiftsConfig = JSON.parse(localStorage.getItem('ot_fixed_shifts_cfg')) || [];
window.scheduleAuditLogs = JSON.parse(localStorage.getItem('ot_schedule_audit_logs')) || [];
window.swapHistory = JSON.parse(localStorage.getItem('ot_swaps_trial2')) || [];
window.leavesList = [
    { id: 1, date: '2026-09-01', shift: 'shift1', empName: 'ບຸນຮັກ', reason: 'ລາປ່ວຍ' }
];

window.activeEditCell = null;
window.EPOCH_MONDAY = new Date('2026-01-05T00:00:00Z');

function getGlobalWeekIndex(dateObj) {
    var diffMs = dateObj.getTime() - window.EPOCH_MONDAY.getTime();
    var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7);
}

function getActiveSheet() {
    var s = window.scheduleSheets.find(sheet => sheet.id === window.activeSheetId);
    if (!s) { window.activeSheetId = window.scheduleSheets[0]?.id || 'sheet-1'; s = window.scheduleSheets[0]; }
    return s;
}

function saveAll() {
    localStorage.setItem('ot_users_master', JSON.stringify(window.users));
    localStorage.setItem('ot_schedule_sheets_trial2', JSON.stringify(window.scheduleSheets));
    localStorage.setItem('ot_active_sheet_id_trial2', window.activeSheetId);
    localStorage.setItem('ot_holidays_trial2', JSON.stringify(window.specialHolidayRanges));
    localStorage.setItem('ot_emp_groups_trial2', JSON.stringify(window.employeeGroups));
    localStorage.setItem('ot_swaps_trial2', JSON.stringify(window.swapHistory));
    localStorage.setItem('ot_fixed_shifts_cfg', JSON.stringify(window.fixedShiftsConfig));
    localStorage.setItem('ot_schedule_audit_logs', JSON.stringify(window.scheduleAuditLogs));
}

function isDateInHolidayRange(dStr) {
    return window.specialHolidayRanges.some(h => dStr >= h.start && dStr <= h.end);
}

function showToast(title, message, type = 'success') {
    var toast = document.getElementById('appToast');
    if (!toast) return;
    document.getElementById('toastTitle').innerText = title;
    document.getElementById('toastMessage').innerText = message;
    toast.classList.remove('translate-y-[-150%]', 'opacity-0', 'pointer-events-none');
    setTimeout(() => toast.classList.add('translate-y-[-150%]', 'opacity-0', 'pointer-events-none'), 3500);
}

function hideToast() {
    document.getElementById('appToast')?.classList.add('translate-y-[-150%]', 'opacity-0', 'pointer-events-none');
}

var confirmModalCallback = null;
function askConfirm(title, message, callback, icon = 'help', btnText = 'ຢືນຢັນ') {
    document.getElementById('confirmModalTitle').innerText = title;
    document.getElementById('confirmModalMessage').innerText = message;
    document.getElementById('confirmModalIcon').innerText = icon;
    document.getElementById('btnConfirmAction').innerText = btnText;
    confirmModalCallback = callback;
    document.getElementById('appConfirmModal').classList.remove('hidden');
}

function closeConfirmModal(isConfirmed) {
    document.getElementById('appConfirmModal').classList.add('hidden');
    if (isConfirmed && typeof confirmModalCallback === 'function') confirmModalCallback();
    confirmModalCallback = null;
}

function toggleMobileDrawer() {
    var d = document.getElementById('mobileDrawer');
    var b = document.getElementById('mobileDrawerBackdrop');
    if (!d || !b) return;
    if (d.classList.contains('-translate-x-full')) { d.classList.remove('-translate-x-full'); b.classList.remove('hidden'); }
    else { d.classList.add('-translate-x-full'); b.classList.add('hidden'); }
}

function toggleNotificationDropdown() { document.getElementById('notifDropdown')?.classList.toggle('hidden'); }
function markAllNotificationsAsRead() { showToast('ສຳເລັດ', 'ໝາຍວ່າອ່ານແລ້ວທັງໝົດ', 'success'); }

function switchTab(tabId) {
    document.querySelectorAll('.tab-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.top-nav-link').forEach(b => { b.classList.remove('border-b-2', 'border-brand-red', 'font-bold', 'text-brand-red'); b.classList.add('text-slate-600'); });
    document.querySelectorAll('.side-nav-btn').forEach(b => { b.classList.remove('bg-red-50', 'text-brand-red', 'font-bold'); b.classList.add('text-slate-600'); });

    var target = document.getElementById(`view-${tabId}`);
    if (target) target.classList.add('active');
    
    var top = document.getElementById(`top-btn-${tabId}`);
    if (top) { top.classList.add('border-b-2', 'border-brand-red', 'font-bold', 'text-brand-red'); top.classList.remove('text-slate-600'); }
    var side = document.getElementById(`side-${tabId}`);
    if (side) { side.classList.add('bg-red-50', 'text-brand-red', 'font-bold'); side.classList.remove('text-slate-600'); }

    if (tabId === 'dashboard') renderDashboard();
    if (tabId === 'schedule') renderScheduleTable();
    if (tabId === 'groups') renderGroupsTab();
    if (tabId === 'employees') renderEmployeesTable();
    if (tabId === 'profile') {
        if (window.currentUser && window.currentUser.role === 'SUPER_ADMIN') renderAdminAllStaffReport();
        else renderUserCurrentWeekWorkspace();
    }
}

window.addEventListener('DOMContentLoaded', () => {
    saveAll();
    checkAuth();
    if (Object.keys(getActiveSheet().data || {}).length === 0) {
        executeGroupRandomSchedule();
    }
});

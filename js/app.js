// ================= ⭐ MASTER APP ENGINE & RESILIENT SUPABASE SYNC =================

window.MASTER_USERS_DEFAULT = [
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

window.defaultNotesTemplate = `1, ການປະຈຳການມີ 3 ກະ\n2, ກະ1 ແຕ່ເວລາ 08:00-16:00 (ວັນເສົາ-ອາທິດ/ວັນພັກ 08:00-13:30)\n3, ກະ2 ແຕ່ເວລາ 12:00-20:00 (ວັນເສົາ-ອາທິດ/ວັນພັກ 13:30-19:00)\n4, ກະ3 ແຕ່ເວລາ 20:00-08:00 (ວັນເສົາ-ອາທິດ/ວັນພັກ 19:00-08:00)\n5, ຕົວໜັງສື ແລະ ພະນັກງານທີ່ຖືກແຕ່ງຕັ້ງປະຈຳການແມ່ນຕ້ອງປະຕິບັດໂມງເວລາຢ່າງເຂັ້ມງວດ\n6, ໃນກໍລະນີເຈັບເປັນ ແລະ ພະນັກງານມີວຽກກະທັນຫັນແມ່ນສາມາດປະຈຳການແທນກັນໄດ້ ແຕ່ຕ້ອງແຈ້ງຕໍ່ພະນັກງານຄຸ້ມຄອງ\n7, ຫ້າມບໍ່ໃຫ້ມີການປ່ຽນແປງຕາຕະລາງປະຈຳການໂດຍບໍ່ໄດ້ຮັບອະນຸຍາດ`;

function safeJSONParse(key, fallback) {
    try {
        var item = localStorage.getItem(key);
        if (!item || item === "undefined" || item === "null" || item === "[object Object]") return fallback;
        return JSON.parse(item);
    } catch (e) {
        return fallback;
    }
}

// Load Local State as Fast Cache
var savedUsers = safeJSONParse('ot_users_master', null);
window.users = (savedUsers && savedUsers.length > 0) ? savedUsers : window.MASTER_USERS_DEFAULT.map(u => ({ ...u, photo: '', annualQuota: 15, usedAnnual: 2, otherLeaves: 0 }));
var users = window.users;

window.currentUser = safeJSONParse('ot_auth_live', null);
window.activeSheetId = localStorage.getItem('ot_active_sheet_id_trial2') || 'sheet-1';
window.specialHolidayRanges = safeJSONParse('ot_holidays_trial2', []);
window.employeeGroups = safeJSONParse('ot_emp_groups_trial2', [
    {
        id: 'grp-main',
        name: 'ກຸ່ມພະນັກງານຫຼັກ (Zigzag 24/7)',
        members: window.users.filter(u => u.role !== 'SUPER_ADMIN').map(u => u.nameLao)
    }
]);
window.scheduleSheets = safeJSONParse('ot_schedule_sheets_trial2', [
    {
        id: 'sheet-1',
        monthKey: '2026-09',
        title: 'ຕາຕະລາງປະຈຳການບໍລິການອອນໄລປະຈຳເດືອນ 09/2026',
        notes: window.defaultNotesTemplate,
        status: 'PUBLISHED',
        data: {}
    }
]);

window.fixedShiftsConfig = safeJSONParse('ot_fixed_shifts_cfg', []);
window.scheduleAuditLogs = safeJSONParse('ot_schedule_audit_logs', []);
window.systemNotifications = safeJSONParse('ot_sys_notifs_trial2', []);
window.swapHistory = safeJSONParse('ot_swaps_trial2', []);
window.annualBookings = safeJSONParse('ot_annual_bookings', []);
window.leavesList = safeJSONParse('ot_leaves_trial2', []);
window.securityAuditLogs = safeJSONParse('ot_security_audit_logs', []);

window.activeEditCell = null;
window.EPOCH_MONDAY = new Date('2026-01-05T00:00:00Z');

function getGlobalWeekIndex(dateObj) {
    var diffMs = dateObj.getTime() - window.EPOCH_MONDAY.getTime();
    var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7);
}

function getActiveSheet() {
    var s = (window.scheduleSheets || []).find(sheet => sheet.id === window.activeSheetId);
    if (!s) { 
        window.activeSheetId = window.scheduleSheets?.[0]?.id || 'sheet-1'; 
        s = window.scheduleSheets?.[0]; 
    }
    return s;
}

function isDateInHolidayRange(dStr) {
    return (window.specialHolidayRanges || []).some(h => dStr >= h.start && dStr <= h.end);
}

// ⭐ 1. ດຶງຂໍ້ມູນຈາກ SUPABASE CLOUD (PRIMARY SOURCE OF TRUTH)
async function loadAllFromSupabase() {
    if (!window.supabaseClient) return;

    try {
        // A. ດຶງ profiles
        const { data: profilesData } = await window.supabaseClient.from('profiles').select('*');
        if (profilesData && profilesData.length > 0) {
            window.users = profilesData.map(u => ({
                user: u.user_code || u.user || '',
                pass: u.password || u.pass || 'bcel2026',
                fullName: u.full_name || u.fullName || '',
                nameLao: u.name_lao || u.nameLao || '',
                role: (u.role || 'STAFF').toUpperCase(),
                isLeader: !!(u.is_leader || u.isLeader),
                dept: u.dept || 'ຂະແໜງບໍລິການອອນລາຍ',
                position: u.position || '',
                phone: u.phone || '020 5599 8877',
                photo: u.photo || '',
                annualQuota: u.annual_quota || u.annualQuota || 15,
                usedAnnual: u.used_annual || u.usedAnnual || 0,
                otherLeaves: u.other_leaves || u.otherLeaves || 0
            }));
            localStorage.setItem('ot_users_master', JSON.stringify(window.users));

            // Sync user active session
            if (window.currentUser) {
                var freshUser = window.users.find(u => u.user.toLowerCase() === window.currentUser.user.toLowerCase());
                if (freshUser) {
                    window.currentUser = { ...window.currentUser, ...freshUser };
                    localStorage.setItem('ot_auth_live', JSON.stringify(window.currentUser));

                    var topAvatar = document.getElementById('topAvatar');
                    var profPreview = document.getElementById('profPhotoPreview');
                    if (topAvatar && window.currentUser.photo) topAvatar.src = window.currentUser.photo;
                    if (profPreview && window.currentUser.photo) profPreview.src = window.currentUser.photo;
                }
            }
        }

        // B. ດຶງ schedules
        const { data: sheetsData } = await window.supabaseClient.from('schedules').select('*');
        if (sheetsData && sheetsData.length > 0) {
            window.scheduleSheets = sheetsData.map(s => ({
                id: s.id,
                monthKey: s.month_key || s.monthKey,
                title: s.title,
                notes: s.notes,
                status: s.status,
                data: s.data
            }));
            localStorage.setItem('ot_schedule_sheets_trial2', JSON.stringify(window.scheduleSheets));
        }

        // C. ດຶງ employee_groups
        const { data: groupsData } = await window.supabaseClient.from('employee_groups').select('*');
        if (groupsData && groupsData.length > 0) {
            window.employeeGroups = groupsData;
            localStorage.setItem('ot_emp_groups_trial2', JSON.stringify(window.employeeGroups));
        }

        // D. ດຶງ shift_swaps
        const { data: swapsData } = await window.supabaseClient.from('shift_swaps').select('*').order('id', { ascending: false });
        if (swapsData) {
            window.swapHistory = swapsData.map(sw => ({
                id: sw.id,
                fromName: sw.from_name || sw.fromName,
                toName: sw.to_name || sw.toName,
                startDate: sw.start_date || sw.startDate,
                endDate: sw.end_date || sw.endDate,
                fromShift: sw.from_shift || sw.fromShift,
                toShift: sw.to_shift || sw.toShift,
                reason: sw.reason,
                status: sw.status
            }));
            localStorage.setItem('ot_swaps_trial2', JSON.stringify(window.swapHistory));
        }

        // E. ດຶງ annual_bookings
        const { data: leavesData } = await window.supabaseClient.from('annual_bookings').select('*').order('id', { ascending: false });
        if (leavesData) {
            window.annualBookings = leavesData.map(b => ({
                id: b.id,
                user: b.user_code || b.user,
                nameLao: b.name_lao || b.nameLao,
                startDate: b.start_date || b.startDate,
                endDate: b.end_date || b.endDate,
                shift: b.shift || 'ກະ 1',
                days: b.days || 1,
                reason: b.reason || '',
                status: b.status || 'CONFIRMED'
            }));
            localStorage.setItem('ot_annual_bookings', JSON.stringify(window.annualBookings));
        }

        // F. ດຶງ special_holidays
        const { data: holData } = await window.supabaseClient.from('special_holidays').select('*');
        if (holData) {
            window.specialHolidayRanges = holData.map(h => ({
                title: h.title,
                start: h.start_date || h.start,
                end: h.end_date || h.end
            }));
            localStorage.setItem('ot_holidays_trial2', JSON.stringify(window.specialHolidayRanges));
        }

        // Re-render UI
        if (typeof window.renderScheduleTable === 'function') window.renderScheduleTable();
        if (typeof window.renderDashboard === 'function') window.renderDashboard();
        if (typeof window.renderEmployeesTable === 'function') window.renderEmployeesTable();
        if (typeof window.renderGroupsTab === 'function') window.renderGroupsTab();
        if (typeof window.updateNotificationBadge === 'function') window.updateNotificationBadge();
        console.log("☁️ [Supabase Cloud]: All data synchronized smoothly from Cloud!");
    } catch (err) {
        console.warn("Supabase Sync Notice:", err);
    }
}

// ⭐ 2. ບັນທຶກລົງ LOCALSTORAGE ແລະ SYNC ລົງ SUPABASE (FULL UPSERT)
async function saveAll() {
    localStorage.setItem('ot_users_master', JSON.stringify(window.users));
    localStorage.setItem('ot_schedule_sheets_trial2', JSON.stringify(window.scheduleSheets));
    localStorage.setItem('ot_active_sheet_id_trial2', window.activeSheetId);
    localStorage.setItem('ot_holidays_trial2', JSON.stringify(window.specialHolidayRanges));
    localStorage.setItem('ot_emp_groups_trial2', JSON.stringify(window.employeeGroups));
    localStorage.setItem('ot_swaps_trial2', JSON.stringify(window.swapHistory));
    localStorage.setItem('ot_fixed_shifts_cfg', JSON.stringify(window.fixedShiftsConfig));
    localStorage.setItem('ot_schedule_audit_logs', JSON.stringify(window.scheduleAuditLogs));
    localStorage.setItem('ot_sys_notifs_trial2', JSON.stringify(window.systemNotifications));
    localStorage.setItem('ot_annual_bookings', JSON.stringify(window.annualBookings));
    localStorage.setItem('ot_security_audit_logs', JSON.stringify(window.securityAuditLogs));

    // ⭐ AUTO-SYNC CLOUD
    if (window.supabaseClient) {
        try {
            // Schedules
            if (window.scheduleSheets && window.scheduleSheets.length > 0) {
                for (let s of window.scheduleSheets) {
                    await window.supabaseClient.from('schedules').upsert({
                        id: s.id,
                        month_key: s.monthKey,
                        title: s.title,
                        notes: s.notes || '',
                        status: s.status || 'DRAFT',
                        data: s.data || {}
                    }, { onConflict: 'id' });
                }
            }
        } catch (e) {
            console.warn("Cloud Save Warning:", e);
        }
    }
}

// UI Helpers
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
    document.getElementById('appConfirmModal')?.classList.remove('hidden');
}

function closeConfirmModal(isConfirmed) {
    document.getElementById('appConfirmModal')?.classList.add('hidden');
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

function updateNotificationBadge() {
    var badge = document.getElementById('notifBadge');
    var countText = document.getElementById('notifCountText');
    var listContainer = document.getElementById('notifDropdownList');
    if (!badge || !listContainer) return;

    var unreadList = (window.systemNotifications || []).filter(n => !n.readBy || !n.readBy.includes(window.currentUser?.user));
    var totalCount = unreadList.length;

    if (totalCount > 0) {
        badge.innerText = totalCount;
        badge.classList.remove('hidden');
        badge.classList.add('flex');
        if (countText) countText.innerText = `${totalCount} ລາຍການໃໝ່`;
    } else {
        badge.classList.add('hidden');
        badge.classList.remove('flex');
        if (countText) countText.innerText = `0`;
    }

    listContainer.innerHTML = '';
    if ((window.systemNotifications || []).length === 0) {
        listContainer.innerHTML = `<div class="text-center py-6 text-slate-400 text-xs"><span class="material-symbols-outlined text-2xl text-slate-300 block mb-1">notifications_off</span>ບໍ່ມີການແຈ້ງເຕືອນ</div>`;
        return;
    }

    window.systemNotifications.slice(0, 10).forEach(notif => {
        var isUnread = !notif.readBy || !notif.readBy.includes(window.currentUser?.user);
        listContainer.innerHTML += `
            <div class="p-3 border rounded-2xl space-y-1 ${isUnread ? 'bg-amber-50/80 border-amber-200' : 'bg-slate-50 border-slate-200'}">
                <div class="flex justify-between items-start">
                    <p class="font-bold text-xs ${isUnread ? 'text-amber-900' : 'text-slate-800'}">📢 ${notif.title}</p>
                    <span class="text-[9px] px-1.5 py-0.5 rounded font-bold ${isUnread ? 'bg-amber-200 text-amber-900' : 'bg-slate-200 text-slate-600'}">${notif.tag || 'ອັບເດດ'}</span>
                </div>
                <p class="text-[11px] text-slate-600">${notif.message}</p>
                <p class="text-[9px] text-slate-400">${notif.date}</p>
            </div>
        `;
    });
}

function markAllNotificationsAsRead() {
    if (!window.currentUser) return;
    (window.systemNotifications || []).forEach(n => {
        if (!n.readBy) n.readBy = [];
        if (!n.readBy.includes(window.currentUser.user)) n.readBy.push(window.currentUser.user);
    });
    saveAll();
    updateNotificationBadge();
    showToast('ສຳເລັດ', 'ໝາຍວ່າອ່ານແລ້ວທັງໝົດ', 'success');
}

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

    if (tabId === 'dashboard' && typeof window.renderDashboard === 'function') window.renderDashboard();
    if (tabId === 'schedule' && typeof window.renderScheduleTable === 'function') window.renderScheduleTable();
    if (tabId === 'groups' && typeof window.renderGroupsTab === 'function') window.renderGroupsTab();
    if (tabId === 'employees' && typeof window.renderEmployeesTable === 'function') window.renderEmployeesTable();
    if (tabId === 'profile') {
        if (window.currentUser && window.currentUser.role === 'SUPER_ADMIN') {
            if (typeof window.renderAdminAllStaffReport === 'function') window.renderAdminAllStaffReport();
        } else {
            if (typeof window.renderUserCurrentWeekWorkspace === 'function') window.renderUserCurrentWeekWorkspace();
        }
    }
}

// Global Exports
window.safeJSONParse = safeJSONParse;
window.switchTab = switchTab;
window.getGlobalWeekIndex = getGlobalWeekIndex;
window.getActiveSheet = getActiveSheet;
window.saveAll = saveAll;
window.loadAllFromSupabase = loadAllFromSupabase;
window.showToast = showToast;
window.hideToast = hideToast;
window.askConfirm = askConfirm;
window.closeConfirmModal = closeConfirmModal;
window.toggleMobileDrawer = toggleMobileDrawer;
window.toggleNotificationDropdown = toggleNotificationDropdown;
window.updateNotificationBadge = updateNotificationBadge;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;

// Start & Load with Cloud Sync
window.addEventListener('DOMContentLoaded', async () => {
    if (typeof window.loadAllFromSupabase === 'function') {
        await window.loadAllFromSupabase();
    }
    if (typeof window.checkAuth === 'function') {
        window.checkAuth();
    }
});

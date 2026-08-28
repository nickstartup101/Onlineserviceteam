// State System Notifications & Audit Logs
window.systemNotifications = JSON.parse(localStorage.getItem('ot_sys_notifs_trial2')) || [];
window.scheduleAuditLogs = JSON.parse(localStorage.getItem('ot_schedule_audit_logs')) || [];

function saveAll() {
    localStorage.setItem('ot_users_master', JSON.stringify(window.users));
    localStorage.setItem('ot_schedule_sheets_trial2', JSON.stringify(window.scheduleSheets));
    localStorage.setItem('ot_active_sheet_id_trial2', window.activeSheetId);
    localStorage.setItem('ot_holidays_trial2', JSON.stringify(window.specialHolidayRanges));
    localStorage.setItem('ot_emp_groups_trial2', JSON.stringify(window.employeeGroups));
    localStorage.setItem('ot_swaps_trial2', JSON.stringify(window.swapHistory));
    localStorage.setItem('ot_fixed_shifts_cfg', JSON.stringify(window.fixedShiftsConfig));
    localStorage.setItem('ot_schedule_audit_logs', JSON.stringify(window.scheduleAuditLogs));
    localStorage.setItem('ot_sys_notifs_trial2', JSON.stringify(window.systemNotifications));
}

// ອັບເດດປຸ່ມກະດິ່ງແຈ້ງເຕືອນ (Notification Badge)
function updateNotificationBadge() {
    var badge = document.getElementById('notifBadge');
    var countText = document.getElementById('notifCountText');
    var listContainer = document.getElementById('notifDropdownList');
    if (!badge || !listContainer) return;

    var unreadList = window.systemNotifications.filter(n => !n.readBy || !n.readBy.includes(window.currentUser?.user));
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
    if (window.systemNotifications.length === 0) {
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
    window.systemNotifications.forEach(n => {
        if (!n.readBy) n.readBy = [];
        if (!n.readBy.includes(window.currentUser.user)) n.readBy.push(window.currentUser.user);
    });
    saveAll();
    updateNotificationBadge();
    showToast('ສຳເລັດ', 'ໝາຍວ່າອ່ານແລ້ວທັງໝົດ', 'success');
}

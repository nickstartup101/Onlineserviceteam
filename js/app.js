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

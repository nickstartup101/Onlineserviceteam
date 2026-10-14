// ================= ⭐ UNIFIED REALTIME NOTIFICATION CENTER (MASTER MODULE) =================

window.systemNotifications = [];
window.lastNotifCount = 0;

// 1. ສຽງແຈ້ງເຕືອນສຽງກະດິ່ງ iOS Chime ມາດຕະຖານ
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

// 2. ເປີດ/ປິດ Dropdown
function toggleNotificationDropdown() {
    var dropdown = document.getElementById('notifDropdown');
    if (dropdown) {
        var isHidden = dropdown.classList.contains('hidden');
        if (isHidden) {
            fetchLiveNotifications();
            dropdown.classList.remove('hidden');
        } else {
            dropdown.classList.add('hidden');
        }
    }
}

// 3. ໝາຍວ່າອ່ານໝົດແລ້ວ
function markAllNotificationsAsRead() {
    var badge = document.getElementById('notifBadge');
    if (badge) {
        badge.classList.add('hidden');
        badge.classList.remove('flex');
    }
    window.lastNotifCount = 0;

    // ບັນທຶກ ID ຂອງ Library ທີ່ອ່ານແລ້ວ
    var libIds = (window.libraryItems || []).map(function(i) { return i.id; });
    localStorage.setItem('ot_read_library_notifs', JSON.stringify(libIds));

    // ບັນທຶກ ID ຂອງ Swap ທີ່ອ່ານແລ້ວ
    var swapIds = (window.swapHistory || []).map(function(s) { return String(s.id); });
    localStorage.setItem('ot_read_swap_notifs', JSON.stringify(swapIds));

    // ລຶບຈຸດແດງໃນ Dropdown
    var dots = document.querySelectorAll('#notifDropdownList .unread-dot');
    dots.forEach(function(d) { d.remove(); });

    if (typeof showToast === 'function') {
        showToast('ສຳເລັດ', 'ໝາຍວ່າອ່ານການແຈ້ງເຕືອນທັງໝົດແລ້ວ', 'info');
    }
}

// ⭐ 4. ດຶງຂໍ້ມູນ ແລະ ຮວບຮວມທຸກການແຈ້ງເຕືອນ (SORT ໃໝ່ສຸດຢູ່ເທິງ 100%)
async function fetchLiveNotifications() {
    if (!window.supabaseClient) return;

    var currentUser = (typeof getCurrentUserSafe === 'function') ? getCurrentUserSafe() : window.currentUser;
    if (!currentUser) return;

    var myName = currentUser.nameLao || '';
    var myFullName = currentUser.fullName || '';
    var isAdmin = currentUser.role === 'SUPER_ADMIN';

    var readLibIds = JSON.parse(localStorage.getItem('ot_read_library_notifs') || '[]');
    var readSwapIds = JSON.parse(localStorage.getItem('ot_read_swap_notifs') || '[]');
    var allNotifs = [];

    try {
        // A. ດຶງຄຳຮ້ອງຂໍປ່ຽນກະ (P2P Shift Swaps)
        var swapRes = await window.supabaseClient
            .from('shift_swaps')
            .select('*')
            .order('id', { ascending: false })
            .limit(15);

        if (!swapRes.error && swapRes.data) {
            swapRes.data.forEach(function(sw) {
                var isForMe = (sw.to_name === myName || sw.to_name === myFullName);
                var isByMe = (sw.from_name === myName || sw.from_name === myFullName);
                var isPending = (String(sw.status || '').toUpperCase() === 'PENDING');
                var rawTime = sw.created_at || sw.start_date || new Date().toISOString();
                var sId = String(sw.id);
                var isUnread = (isForMe && isPending && readSwapIds.indexOf(sId) === -1);

                if (isForMe && isPending) {
                    allNotifs.push({
                        id: 'swap-' + sId,
                        icon: 'sync_alt',
                        iconBg: 'bg-amber-100 text-amber-800',
                        title: 'ມີຄຳຂໍປ່ຽນກະໃໝ່ຈາກເພື່ອນຮ່ວມງານ!',
                        message: sw.from_name + ' ຂໍແລກປ່ຽນກະ [' + (sw.from_shift || '') + '] ກັບ [' + (sw.to_shift || '') + ']',
                        date: sw.start_date || rawTime.slice(0, 10),
                        rawTime: rawTime,
                        unread: isUnread,
                        action: "switchTab('profile'); toggleNotificationDropdown();"
                    });
                } else if (isAdmin && isPending) {
                    allNotifs.push({
                        id: 'swap-adm-' + sId,
                        icon: 'swap_horiz',
                        iconBg: 'bg-blue-100 text-blue-800',
                        title: 'ການຂໍປ່ຽນກະໃນທີມ (ລໍຖ້າດຳເນີນການ)',
                        message: sw.from_name + ' ➔ ' + sw.to_name + ' (' + sw.start_date + ')',
                        date: sw.start_date || rawTime.slice(0, 10),
                        rawTime: rawTime,
                        unread: false,
                        action: "switchTab('profile'); toggleNotificationDropdown();"
                    });
                }
            });
        }

        // B. ດຶງການລາພັກ (Annual Leaves)
        var leaveRes = await window.supabaseClient
            .from('annual_bookings')
            .select('*')
            .order('id', { ascending: false })
            .limit(10);

        if (!leaveRes.error && leaveRes.data) {
            leaveRes.data.forEach(function(lv) {
                var rawTime = lv.created_at || lv.start_date || new Date().toISOString();
                if (isAdmin && lv.status === 'PENDING_ADMIN') {
                    allNotifs.push({
                        id: 'leave-pend-' + lv.id,
                        icon: 'warning',
                        iconBg: 'bg-rose-100 text-brand-red',
                        title: '⚠️ ແຈ້ງເຕືອນລາພັກຊ້ອນກັນ!',
                        message: (lv.name_lao || 'ພະນັກງານ') + ' ຂໍລາພັກຊ້ອນໃນກະ [' + lv.shift + ']',
                        date: lv.start_date || rawTime.slice(0, 10),
                        rawTime: rawTime,
                        unread: true,
                        action: "switchTab('profile'); toggleNotificationDropdown();"
                    });
                }
            });
        }

        // C. ດຶງຂໍ້ມູນ Library Updates
        var libItems = window.libraryItems || [];
        libItems.slice(0, 10).forEach(function(item) {
            var rawTime = item.updatedAt || item.createdAt || new Date().toISOString();
            var isUnread = (item.updatedBy !== myName && readLibIds.indexOf(item.id) === -1);

            allNotifs.push({
                id: 'lib-' + item.id,
                icon: 'menu_book',
                iconBg: isUnread ? 'bg-red-100 text-brand-red' : 'bg-slate-100 text-slate-600',
                title: 'ອັບເດດຂໍ້ມູນ Library',
                message: (item.updatedBy || item.createdBy || 'Staff') + ' ໄດ້ອັບເດດ "' + item.title + '" [' + item.category + ']',
                date: rawTime.slice(0, 10),
                rawTime: rawTime,
                unread: isUnread,
                action: "openLibraryFromNotif('" + item.id + "')"
            });
        });

        // ⭐ D. ຈັດລຽງລຳດັບ: ເອົາອັນໃໝ່ລ່າສຸດຢູ່ເທິງສຸດສະເໝີ 100%
        allNotifs.sort(function(a, b) {
            var timeA = new Date(a.rawTime).getTime() || 0;
            var timeB = new Date(b.rawTime).getTime() || 0;
            return timeB - timeA; // ໃໝ່ ➔ ເກົ່າ
        });

        renderNotificationDropdownUI(allNotifs);

    } catch (err) {
        console.warn("Notification sync error:", err);
    }
}

// 5. Render ລາຍການລົງໃນ UI Dropdown
function renderNotificationDropdownUI(notifList) {
    var container = document.getElementById('notifDropdownList');
    var badge = document.getElementById('notifBadge');
    if (!container) return;

    container.innerHTML = '';
    var unreadCount = notifList.filter(function(n) { return n.unread; }).length;

    if (badge) {
        if (unreadCount > 0) {
            badge.innerText = unreadCount > 99 ? '99+' : unreadCount;
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
            <div onclick="${item.action}" class="p-2.5 hover:bg-slate-50 rounded-2xl cursor-pointer flex gap-3 items-start border-b border-slate-50 transition font-lao ${item.unread ? 'bg-red-50/40' : ''}">
                <div class="w-8 h-8 rounded-xl ${item.iconBg} flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <span class="material-symbols-outlined text-[16px]">${item.icon}</span>
                </div>
                <div class="flex-1 min-w-0 text-xs">
                    <div class="flex justify-between items-center gap-1">
                        <span class="font-bold text-slate-800 text-[11px] truncate flex items-center gap-1">
                            ${item.title}
                            ${item.unread ? '<span class="unread-dot w-2 h-2 rounded-full bg-brand-red inline-block shrink-0"></span>' : ''}
                        </span>
                        <span class="text-[9px] text-slate-400 font-mono shrink-0">${item.date}</span>
                    </div>
                    <p class="text-slate-600 text-[11px] mt-0.5 leading-snug line-clamp-2">${item.message}</p>
                </div>
            </div>
        `;
    });
}

// ຜູກ Functions ເຂົ້າ Window
window.toggleNotificationDropdown = toggleNotificationDropdown;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;
window.fetchLiveNotifications = fetchLiveNotifications;
window.renderNotificationDropdownUI = renderNotificationDropdownUI;
window.playIOSNotificationSound = playIOSNotificationSound;

// ================= ⭐ PROFILE, LEAVE & P2P SHIFT SWAP HUB (100% REALTIME SYNC) =================

// 0. Helper ດຶງ User ປັດຈຸບັນແບບປອດໄພ
function getCurrentUserSafe() {
    if (window.currentUser && window.currentUser.nameLao) return window.currentUser;
    try {
        var saved = localStorage.getItem('ot_auth_live') || localStorage.getItem('currentUser') || localStorage.getItem('user');
        if (saved) {
            window.currentUser = JSON.parse(saved);
            return window.currentUser;
        }
    } catch(e) {}
    return window.currentUser || null;
}

// 0.1 Helper ດຶງ Sheet ປັດຈຸບັນ
function getActiveSheetSafe(targetMonthKey) {
    var sheets = window.scheduleSheets || [];
    if (sheets.length === 0) {
        try {
            var cached = localStorage.getItem('ot_schedule_sheets') || localStorage.getItem('ot_schedules_sheets');
            if (cached) sheets = JSON.parse(cached);
        } catch(e) {}
    }

    if (sheets.length > 0) {
        if (targetMonthKey) {
            var pub = sheets.find(function(s) { 
                var sm = (s.monthKey || s.month_key || '').slice(0, 7);
                return sm === targetMonthKey && s.status === 'PUBLISHED';
            });
            if (pub) return pub;
            
            var anyMatch = sheets.find(function(s) { 
                var sm = (s.monthKey || s.month_key || '').slice(0, 7);
                return sm === targetMonthKey;
            });
            if (anyMatch) return anyMatch;
        }

        var activePub = sheets.find(function(s) { return s.id === window.activeSheetId && s.status === 'PUBLISHED'; });
        if (activePub) return activePub;

        var firstPub = sheets.find(function(s) { return s.status === 'PUBLISHED'; });
        if (firstPub) return firstPub;

        return sheets[0];
    }

    if (typeof getActiveSheet === 'function') {
        var s = getActiveSheet();
        if (s) return s;
    }
    return null;
}

// ⭐ 0.15 ດຶງຂໍ້ມູນ Cloud ຫຼ້າສຸດສຳລັບ Profile Workspace (ດຶງຮູບພາບ Profile ຈາກ Supabase 100%)
async function fetchProfileCloudData() {
    if (!window.supabaseClient) return;
    try {
        var user = getCurrentUserSafe();

        // A. ດຶງຮູບ Profile ຂອງ User ປັດຈຸບັນຈາກ Supabase profiles table
        if (user && user.user) {
            var profRes = await window.supabaseClient
                .from('profiles')
                .select('*')
                .or('user_code.eq.' + user.user + ',username.eq.' + user.user);

            if (!profRes.error && profRes.data && profRes.data.length > 0) {
                var myProf = profRes.data[0];
                var photoUrl = myProf.photo || myProf.avatar_url || myProf.avatar || '';
                if (photoUrl) {
                    user.photo = photoUrl;
                    if (window.currentUser) window.currentUser.photo = photoUrl;
                    localStorage.setItem('ot_auth_live', JSON.stringify(user));
                }
            }
        }

        // B. ດຶງ Schedule Sheets (ບັງຄັບ JSON.parse ຂໍ້ມູນ data)
        var resSheets = await window.supabaseClient.from('schedule_sheets').select('*');
        if (!resSheets.error && resSheets.data) {
            window.scheduleSheets = resSheets.data.map(function(d) {
                var rawData = d.data || {};
                if (typeof rawData === 'string') {
                    try { rawData = JSON.parse(rawData); } catch(e) { rawData = {}; }
                }
                return {
                    id: String(d.id),
                    title: d.title,
                    monthKey: d.monthKey || d.month_key,
                    notes: d.notes,
                    status: d.status || 'DRAFT',
                    data: rawData
                };
            });
            localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
        }

        // C. ດຶງ Swaps
        var resSwaps = await window.supabaseClient
            .from('shift_swaps')
            .select('*')
            .order('id', { ascending: false });

        if (!resSwaps.error && resSwaps.data) {
            window.swapHistory = resSwaps.data.map(function(d) {
                var isCover = Boolean(d.reason && d.reason.indexOf('[COVER]') !== -1);
                return {
                    id: d.id,
                    swapType: isCover ? 'COVER' : 'SWAP',
                    fromName: d.from_name || d.fromName,
                    toName: d.to_name || d.toName,
                    startDate: d.start_date || d.startDate,
                    endDate: d.end_date || d.endDate,
                    fromShift: d.from_shift || d.fromShift,
                    toShift: d.to_shift || d.toShift,
                    reason: d.reason || '',
                    status: String(d.status || '').toUpperCase(),
                    created_at: d.created_at || d.createdAt || null
                };
            });
            localStorage.setItem('ot_swap_history', JSON.stringify(window.swapHistory));
        }

        // D. ດຶງ Annual Bookings
        var resLeaves = await window.supabaseClient
            .from('annual_bookings')
            .select('*')
            .order('id', { ascending: false });

        if (!resLeaves.error && resLeaves.data) {
            window.annualBookings = resLeaves.data.map(function(d) {
                return {
                    id: d.id,
                    user: d.user_code || d.user,
                    nameLao: d.name_lao || d.nameLao,
                    startDate: d.start_date || d.startDate,
                    endDate: d.end_date || d.endDate,
                    days: d.days,
                    shift: d.shift || 'ທຸກກະ',
                    reason: d.reason || '',
                    status: String(d.status || '').toUpperCase(),
                    created_at: d.created_at || null
                };
            });
            localStorage.setItem('ot_annual_bookings', JSON.stringify(window.annualBookings));
        }
    } catch(err) {
        console.warn("Profile cloud sync error:", err);
    }
}

// ⭐ 0.2 HELPER ທຽບຊື່ແບບ SMART FUZZY (ຮອງຮັບທັງ ໂທນິກ ແລະ ໂທມິກ ໃຫ້ກົງກັນ 100%)
function isSamePerson(a, b) {
    if (!a || !b) return false;
    var clean = function(s) {
        return s.toString().trim().toLowerCase()
            .replace(/^(ທ້າວ|ນາງ|ທ\.|ນ\.)\s*/, '')
            .replace(/\s*ຫົວໜ້າກະ|\s*ຫົວໜ້າ/g, '')
            .replace(/\s+/g, '')
            .replace(/ໂທນິກ/g, 'ໂທມິກ') // ⭐ ຜູກ ໂທນິກ = ໂທມິກ
            .replace(/ໜູຮັກ/g, 'ທູຮັກ') // ຜູກ ໜູຮັກ = ທູຮັກ
            .replace(/ປະສົງສິນ/g, 'ປະສັງສິນ')
            .replace(/ສີຊົມພູ/g, 'ສີຊຸມພູ')
            .replace(/ໄກສະຫວາດ/g, 'ໄທສະຫວາດ')
            .replace(/ສົນທະຍາ/g, 'ສົມທະຍາ')
            .replace(/ນິກກີ້/g, 'ມິກກີ້')
            .replace(/ແພັກເກີ້/g, 'ແພັກກີ້');
    };
    var ca = clean(a);
    var cb = clean(b);
    return ca === cb || ca.indexOf(cb) !== -1 || cb.indexOf(ca) !== -1;
}

function isNameMatch(a, b) {
    return isSamePerson(a, b);
}

// ⭐ 1. RENDER WORKSPACE ຂອງພະນັກງານ (Sync ກັບຕາຕະລາງ ແລະ ສະແດງຮູບ Profile 100%)
function renderUserCurrentWeekWorkspace() {
    var user = getCurrentUserSafe();
    if (!user) return;

    var titleEl = document.getElementById('userCurrentShiftTitle');
    var pillsContainer = document.getElementById('userWeekDaysPills');

    var nameInput = document.getElementById('profNameInput');
    var deptInput = document.getElementById('profDeptInput');
    var phoneInput = document.getElementById('profPhoneInput');
    var nameDisplay = document.getElementById('profNameDisplay');
    var codeDisplay = document.getElementById('profCodeDisplay');
    var photoPreview = document.getElementById('profPhotoPreview');
    var topAvatar = document.getElementById('topAvatar');

    if (nameInput) nameInput.value = user.fullName || user.nameLao || '';
    if (deptInput) deptInput.value = user.dept || user.department || 'ຂະແໜງບໍລິການອອນລາຍ';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (nameDisplay) nameDisplay.innerText = user.nameLao + ' (' + (user.fullName || user.nameLao) + ')';
    if (codeDisplay) codeDisplay.innerText = user.user || 'BCEL2120';
    
    // ⭐ ອັບເດດຮູບ Profile ທັງໃນບັດ ແລະ ມຸມຂວາເທິງ
    if (user.photo) {
        if (photoPreview) photoPreview.src = user.photo;
        if (topAvatar) topAvatar.src = user.photo;
    }

    if (titleEl && pillsContainer) {
        var myName = user.nameLao;
        pillsContainer.innerHTML = '';

        var now = new Date();
        var todayY = now.getFullYear();
        var todayM = String(now.getMonth() + 1).padStart(2, '0');
        var todayD = String(now.getDate()).padStart(2, '0');
        var todayDateStr = todayY + '-' + todayM + '-' + todayD;

        var dayOfWeek = now.getDay();
        var diffToMon = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
        var monday = new Date(now);
        monday.setDate(now.getDate() + diffToMon);
        monday.setHours(0, 0, 0, 0);

        var dayNamesLao = ['ອາທິດ', 'ຈັນ', 'ອັງຄານ', 'ພຸດ', 'ພະຫັດ', 'ສຸກ', 'ເສົາ'];
        var todayShiftLabel = null;
        var weekdayShiftsList = [];

        for (var d = 0; d < 7; d++) {
            var curr = new Date(monday);
            curr.setDate(monday.getDate() + d);

            var cY = curr.getFullYear();
            var cM = String(curr.getMonth() + 1).padStart(2, '0');
            var cD = String(curr.getDate()).padStart(2, '0');
            var dStr = cY + '-' + cM + '-' + cD;
            var monthKey = cY + '-' + cM;

            // ⭐ Scan ທຸກໆ Sheet ທີ່ Publish ໃນເດືອນນີ້ ເພື່ອຮັບປະກັນວ່າຫາຊື່ເຫັນແນ່ນອນ
            var monthSheets = (window.scheduleSheets || []).filter(function(s) {
                var sm = (s.monthKey || s.month_key || '').slice(0, 7);
                return sm === monthKey && s.status === 'PUBLISHED';
            });
            if (monthSheets.length === 0) {
                monthSheets = (window.scheduleSheets || []).filter(function(s) {
                    var sm = (s.monthKey || s.month_key || '').slice(0, 7);
                    return sm === monthKey;
                });
            }
            if (monthSheets.length === 0 && window.activeSheetId) {
                var act = (window.scheduleSheets || []).find(function(s) { return s.id === window.activeSheetId; });
                if (act) monthSheets = [act];
            }

            var isWeekend = (curr.getDay() === 0 || curr.getDay() === 6);
            var isHol = (typeof isDateInHolidayRange === 'function') ? isDateInHolidayRange(dStr) : false;
            var isOffDay = (isWeekend || isHol);

            // ກວດສອບ Swap
            if (typeof autoApplyCompletedSwapsForDate === 'function') {
                autoApplyCompletedSwapsForDate(dStr);
            }

            // ກວດສອບວ່າຜູ້ກ່ຽວຢູ່ກະໃດໃນວັນທີ dStr
            var foundShiftKey = null;
            monthSheets.forEach(function(sh) {
                if (typeof sh.data === 'string') {
                    try { sh.data = JSON.parse(sh.data); } catch(e) {}
                }
                var dInfo = (sh.data && sh.data[dStr]) ? sh.data[dStr] : {};
                if (dInfo.shift1 && dInfo.shift1.some(function(n) { return isSamePerson(n, myName); })) foundShiftKey = 'shift1';
                else if (dInfo.shift2 && dInfo.shift2.some(function(n) { return isSamePerson(n, myName); })) foundShiftKey = 'shift2';
                else if (dInfo.shift3 && dInfo.shift3.some(function(n) { return isSamePerson(n, myName); })) foundShiftKey = 'shift3';
            });

            // ກວດສອບການລາພັກ
            var leaveInfo = (typeof getStaffLeaveInfo === 'function') ? getStaffLeaveInfo(myName, 'all', dStr) : null;

            var shift = 'ພັກ (OFF)';
            var pillClass = 'bg-slate-50 text-slate-400 border-slate-200';
            var shiftDetail = 'ພັກຜ່ອນ (OFF)';

            if (leaveInfo) {
                shift = 'ລາພັກ';
                pillClass = 'bg-rose-50 text-rose-600 font-bold border-rose-200 line-through';
                shiftDetail = 'ລາພັກ (' + (leaveInfo.reason || 'ລາພັກ') + ')';
            } else if (foundShiftKey === 'shift1') {
                shift = 'ກະ 1';
                pillClass = 'bg-red-50 text-brand-red font-bold border-red-200';
                shiftDetail = isOffDay ? 'ກະ 1 (08:00 - 13:30)' : 'ກະ 1 (08:00 - 16:00)';
                if (!isOffDay) weekdayShiftsList.push(shiftDetail);
            } else if (foundShiftKey === 'shift2') {
                shift = 'ກະ 2';
                pillClass = 'bg-purple-50 text-purple-800 font-bold border-purple-200';
                shiftDetail = isOffDay ? 'ກະ 2 (13:30 - 19:00)' : 'ກະ 2 (12:00 - 20:00)';
                if (!isOffDay) weekdayShiftsList.push(shiftDetail);
            } else if (foundShiftKey === 'shift3') {
                shift = 'ກະ 3';
                pillClass = 'bg-slate-800 text-white font-bold border-slate-900';
                shiftDetail = isOffDay ? 'ກະ 3 (19:00 - 08:00)' : 'ກະ 3 (20:00 - 08:00)';
                if (!isOffDay) weekdayShiftsList.push(shiftDetail);
            }

            var isToday = (dStr === todayDateStr);
            if (isToday) {
                todayShiftLabel = shiftDetail;
                pillClass += ' ring-2 ring-brand-red shadow-sm';
            }

            var todayTag = isToday ? '<span class="block text-[8px] bg-brand-red text-white rounded px-1 mt-0.5 font-bold">ມື້ນີ້</span>' : '';
            var dayLabel = dayNamesLao[curr.getDay()];

            pillsContainer.innerHTML += '<div class="px-2 py-1.5 border rounded-xl text-center text-[10px] ' + pillClass + ' transition font-lao min-w-[50px]">' +
                '<div class="text-[9px] opacity-75">' + dayLabel + '</div>' +
                '<div class="font-bold text-xs">' + curr.getDate() + '/' + (curr.getMonth() + 1) + '</div>' +
                '<div class="mt-0.5">' + shift + '</div>' +
                todayTag +
            '</div>';
        }

        // ⭐ 1.2 ສະແດງຫົວຂໍ້: ບອກກະມື້ນີ້ + ກະຫຼັກປະຈຳອາທິດ
        var primaryWeekShift = weekdayShiftsList[0] || (todayShiftLabel || 'ພັກຜ່ອນ (OFF)');
        var todayText = todayShiftLabel ? todayShiftLabel : 'ພັກຜ່ອນ (OFF)';

        titleEl.innerHTML = '<span>ມື້ນີ້: </span><span class="text-brand-red font-black underline">' + todayText + '</span>' +
            (primaryWeekShift && primaryWeekShift !== todayText ? ' <span class="text-xs text-slate-500 font-normal">(ອາທິດນີ້: ' + primaryWeekShift + ')</span>' : '');
    }

    var peerSelect = document.getElementById('swapTargetPeer');
    if (peerSelect) {
        peerSelect.innerHTML = '';
        (window.users || []).filter(function(u) { 
            return !isSamePerson(u.nameLao, user.nameLao) && u.role !== 'SUPER_ADMIN'; 
        }).forEach(function(u) {
            peerSelect.innerHTML += '<option value="' + u.nameLao + '">' + u.nameLao + ' (' + u.fullName + ')</option>';
        });
    }

    renderAnnualLeaveBookings();
    renderSwapHistory();
}

// 2. ລາຍງານ ADMIN REPORT
function renderAdminAllStaffReport() {
    var user = getCurrentUserSafe();
    if (!user || user.role !== 'SUPER_ADMIN') return;

    var sheet = getActiveSheetSafe();
    var matrixTbody = document.getElementById('adminAllStaffMatrixReportBody');
    var auditTbody = document.getElementById('adminScheduleAuditTableBody');
    var anomalyTbody = document.getElementById('adminAnomalyTableBody');

    var staffList = (window.users || []).filter(function(u) { return u && u.role !== 'SUPER_ADMIN'; });
    var staffCountEl = document.getElementById('adminMetricStaffCount');
    var swapCountEl = document.getElementById('adminMetricSwapCount');
    var leaveCountEl = document.getElementById('adminMetricLeaveCount');
    var dutyCountEl = document.getElementById('adminMetricDutyCount');

    if (staffCountEl) staffCountEl.innerText = staffList.length + ' ທ່ານ';
    if (swapCountEl) swapCountEl.innerText = ((window.swapHistory || []).length) + ' ລາຍການ';

    var totalLeavesCount = 0;
    var totalDutyCount = 0;

    var stats = {};
    staffList.forEach(function(u) {
        var usedL = u.usedAnnual || 0;
        totalLeavesCount += usedL;
        stats[u.nameLao] = Object.assign({}, u, { 
            s1: 0, s2: 0, s3: 0, 
            weekendShifts: 0, 
            totalDuty: 0,
            swapsRequested: 0,
            swappedIntoS3: 0
        });
    });

    if (leaveCountEl) leaveCountEl.innerText = totalLeavesCount + ' ມື້';

    var schedData = (sheet && sheet.data) ? sheet.data : {};
    var dates = Object.keys(schedData).filter(function(k) { return !k.startsWith('_'); });

    dates.forEach(function(d) {
        var day = schedData[d];
        var isWk = day.isWeekend;

        (day.shift1 || []).forEach(function(n) { 
            if (stats[n]) { stats[n].s1++; stats[n].totalDuty++; totalDutyCount++; if (isWk) stats[n].weekendShifts++; } 
        });
        (day.shift2 || []).forEach(function(n) { 
            if (stats[n]) { stats[n].s2++; stats[n].totalDuty++; totalDutyCount++; if (isWk) stats[n].weekendShifts++; } 
        });
        (day.shift3 || []).forEach(function(n) { 
            if (stats[n]) { stats[n].s3++; stats[n].totalDuty++; totalDutyCount++; if (isWk) stats[n].weekendShifts++; } 
        });
    });

    (window.swapHistory || []).forEach(function(sw) {
        if (sw.status === 'COMPLETED') {
            if (stats[sw.fromName]) stats[sw.fromName].swapsRequested++;
            if (stats[sw.toName]) stats[sw.toName].swapsRequested++;
            if (sw.toShift === 'shift3' && stats[sw.fromName]) stats[sw.fromName].swappedIntoS3++;
            if (sw.fromShift === 'shift3' && stats[sw.toName]) stats[sw.toName].swappedIntoS3++;
        }
    });

    if (dutyCountEl) dutyCountEl.innerText = totalDutyCount + ' ກະ';

    if (matrixTbody) {
        matrixTbody.innerHTML = '';
        Object.values(stats).forEach(function(st) {
            var quota = st.annualQuota || 15;
            var used = st.usedAnnual || 0;
            var remaining = quota - used;

            matrixTbody.innerHTML += '<tr class="hover:bg-slate-50 font-lao text-xs">' +
                '<td class="p-3 font-bold text-slate-700">' + st.user + '</td>' +
                '<td class="p-3 font-semibold text-slate-800">' + st.fullName + '</td>' +
                '<td class="p-3 font-bold ' + (st.isLeader ? 'text-brand-red' : 'text-slate-800') + '">' +
                    st.nameLao + (st.isLeader ? '<span class="text-[9px] bg-red-50 text-brand-red px-1.5 py-0.5 rounded ml-1 border border-red-200">ຫົວໜ້າ</span>' : '') +
                '</td>' +
                '<td class="p-3 text-center">' + st.s1 + '</td>' +
                '<td class="p-3 text-center">' + st.s2 + '</td>' +
                '<td class="p-3 text-center font-bold text-brand-red bg-red-50/40">' + st.s3 + '</td>' +
                '<td class="p-3 text-center font-bold text-slate-900 bg-slate-100/50">' + st.totalDuty + ' ກະ</td>' +
                '<td class="p-3 text-amber-700 font-bold text-center">' + used + ' / ' + quota + '</td>' +
                '<td class="p-3 text-brand-red font-bold text-center">' + remaining + ' ມື້</td>' +
                '<td class="p-3 text-center text-slate-600 font-semibold">' + (used + (st.otherLeaves || 0)) + ' ມື້</td>' +
            '</tr>';
        });
    }

    if (auditTbody) {
        auditTbody.innerHTML = '';
        var auditLogs = window.scheduleAuditLogs || [];
        if (auditLogs.length === 0) {
            auditTbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-400 font-lao">ຍັງບໍ່ມີປະຫວັດການແກ້ໄຂຕາຕະລາງຫຼັງ Publish</td></tr>';
        } else {
            auditLogs.forEach(function(log) {
                auditTbody.innerHTML += '<tr class="hover:bg-slate-50 font-lao text-xs">' +
                    '<td class="p-3 font-bold text-slate-700 truncate max-w-[150px]">' + log.sheetTitle + '</td>' +
                    '<td class="p-3 font-semibold">' + log.date + ' (' + log.shift + ')</td>' +
                    '<td class="p-3 text-amber-950 font-bold bg-amber-50 rounded">' + log.oldName + ' ➔ ' + log.newName + '</td>' +
                    '<td class="p-3 text-slate-600 italic">"' + log.reason + '"</td>' +
                    '<td class="p-3 font-medium text-brand-red">' + log.adminName + '</td>' +
                    '<td class="p-3 text-right text-slate-400 text-[11px]">' + log.timestamp + '</td>' +
                '</tr>';
            });
        }
    }

    if (anomalyTbody) {
        anomalyTbody.innerHTML = '';
        var sortedStats = Object.values(stats).sort(function(a, b) { 
            return (b.totalDuty - a.totalDuty) || (b.swapsRequested - a.swapsRequested); 
        });

        sortedStats.forEach(function(st) {
            var badges = [];
            if (st.totalDuty > 25) badges.push('<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-brand-red border border-red-200">⚠️ ເກີນມາດຕະຖານ (' + st.totalDuty + ' ກະ)</span>');
            if (st.swappedIntoS3 >= 3) badges.push('<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">🌙 ຮັບກະ 3 ຫຼາຍ (+' + st.swappedIntoS3 + ')</span>');
            if (st.swapsRequested >= 4) badges.push('<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">🔄 ປ່ຽນກະເລື້ອຍໆ (' + st.swapsRequested + ' ຄັ້ງ)</span>');
            if (st.weekendShifts >= 5) badges.push('<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">📅 ເສົາ-ອາທິດສູງ (' + st.weekendShifts + ' ມື້)</span>');
            if (badges.length === 0) badges.push('<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">ປົກກະຕິ (Balanced)</span>');

            anomalyTbody.innerHTML += '<tr class="hover:bg-slate-50 font-lao text-xs">' +
                '<td class="p-3 font-bold text-slate-800 flex items-center gap-1.5">' +
                    st.nameLao + ' <span class="text-[10px] font-normal text-slate-400">(' + st.fullName + ')</span>' +
                    (st.isLeader ? '<span class="text-[9px] bg-brand-red text-white px-1.5 py-0.2 rounded font-bold">ຫົວໜ້າ</span>' : '') +
                '</td>' +
                '<td class="p-3 text-center font-bold ' + (st.swapsRequested > 0 ? 'text-amber-700' : 'text-slate-400') + '">' + st.swapsRequested + ' ຄັ້ງ</td>' +
                '<td class="p-3 text-center font-bold ' + (st.swappedIntoS3 > 0 ? 'text-purple-700' : 'text-slate-400') + '">' + st.swappedIntoS3 + ' ກະ</td>' +
                '<td class="p-3 text-center font-bold text-blue-700">' + st.weekendShifts + ' ວັນ</td>' +
                '<td class="p-3 text-center font-black ' + (st.totalDuty > 25 ? 'text-brand-red text-sm' : 'text-slate-900') + '">' + st.totalDuty + ' ກະ</td>' +
                '<td class="p-3 text-center space-x-1">' + badges.join(' ') + '</td>' +
            '</tr>';
        });
    }
}

// ⭐ 3. ອັບໂຫຼດຮູບໂປຣໄຟລ໌ (Sync ລົງ Supabase Profiles ທັນທີ)
function handlePhotoUploadAndCompress(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        var img = new Image();
        img.onload = async function() {
            var canvas = document.createElement('canvas');
            var max = 150;
            var w = img.width, h = img.height;
            if (w > max) { h = Math.round((h * max) / w); w = max; }
            else { if (h > max) { w = Math.round((w * max) / h); h = max; } }
            canvas.width = w; canvas.height = h;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            var photoBase64 = canvas.toDataURL('image/jpeg', 0.75);

            var user = getCurrentUserSafe();
            if (user) {
                user.photo = photoBase64;
                if (window.currentUser) window.currentUser.photo = photoBase64;
                var userIdx = (window.users || []).findIndex(function(u) { 
                    return u.user.toLowerCase() === user.user.toLowerCase(); 
                });
                if (userIdx !== -1) window.users[userIdx].photo = photoBase64;
                localStorage.setItem('ot_auth_live', JSON.stringify(user));
            }

            if (typeof saveAll === 'function') saveAll();

            var topAvatar = document.getElementById('topAvatar');
            var profPreview = document.getElementById('profPhotoPreview');
            if (topAvatar) topAvatar.src = photoBase64;
            if (profPreview) profPreview.src = photoBase64;

            if (typeof window.renderDashboard === 'function') window.renderDashboard();
            if (typeof window.renderEmployeesTable === 'function') window.renderEmployeesTable();

            // ອັບເດດລົງ Supabase Database
            if (window.supabaseClient && user && user.user) {
                try {
                    await window.supabaseClient
                        .from('profiles')
                        .update({ photo: photoBase64 })
                        .or('user_code.eq.' + user.user + ',username.eq.' + user.user);
                } catch (err) {}
            }

            showToast('ສຳເລັດ', 'ອັບເດດຮູບໂປຣໄຟລ໌ຮຽບຮ້ອຍ!', 'success');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 4. ບັນທຶກໂປຣໄຟລ໌
async function handleUpdateProfile() {
    var user = getCurrentUserSafe();
    if (!user) return;

    var nameInput = document.getElementById('profNameInput');
    var passInput = document.getElementById('profPassInput');
    var deptInput = document.getElementById('profDeptInput');
    var phoneInput = document.getElementById('profPhoneInput');

    var name = nameInput ? nameInput.value.trim() : '';
    var pass = passInput ? passInput.value.trim() : '';
    var dept = deptInput ? deptInput.value.trim() : 'ຂະແໜງບໍລິການອອນລາຍ';
    var phone = phoneInput ? phoneInput.value.trim() : '';

    if (!name) { 
        showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາໃສ່ຊື່ເຕັມ', 'error'); 
        return; 
    }

    if (pass) user.pass = pass;
    user.fullName = name;
    user.dept = dept;
    user.department = dept;
    user.phone = phone;

    var idx = (window.users || []).findIndex(function(u) { 
        return u.user.toLowerCase() === user.user.toLowerCase(); 
    });
    if (idx !== -1) {
        window.users[idx] = Object.assign({}, window.users[idx], { 
            fullName: name, 
            dept: dept,
            department: dept,
            phone: phone,
            pass: pass || window.users[idx].pass 
        });
    }

    if (typeof saveAll === 'function') saveAll();
    localStorage.setItem('ot_auth_live', JSON.stringify(user));

    if (window.supabaseClient) {
        try {
            var updatePayload = { full_name: name, dept: dept, phone: phone };
            if (pass) { updatePayload.pass = pass; updatePayload.password = pass; }

            await window.supabaseClient
                .from('profiles')
                .update(updatePayload)
                .or('user_code.eq.' + user.user + ',username.eq.' + user.user);
        } catch (e) {}
    }

    if (typeof window.checkAuth === 'function') window.checkAuth();
    if (typeof window.renderEmployeesTable === 'function') window.renderEmployeesTable();
    renderUserCurrentWeekWorkspace();
    showToast('ສຳເລັດ', 'ອັບເດດຂໍ້ມູນສ່ວນຕົວ ແລະ Sync ລົງ Supabase ແລ້ວ!', 'success');
}

// 5. ຈອງມື້ພັກປະຈຳປີ
async function handleBookAnnualLeave() {
    var user = getCurrentUserSafe();
    if (!user) return;

    var start = (document.getElementById('bookLeaveStart') || {}).value;
    var end = (document.getElementById('bookLeaveEnd') || {}).value;
    var shift = (document.getElementById('bookLeaveShiftSelect') || {}).value || 'ກະ 1 (08:00 - 16:00)';
    var reason = ((document.getElementById('bookLeaveReason') || {}).value || '').trim();
    if (!start || !end || !reason) { showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບ', 'error'); return; }

    var conflictingBooking = (window.annualBookings || []).find(function(b) {
        if (b.status === 'REJECTED') return false;
        if (b.user === user.user) return false;
        if (b.shift !== shift && b.shift !== 'ທຸກກະ (All Shifts)') return false;
        return (start <= b.endDate && end >= b.startDate);
    });

    var bookingStatus = 'CONFIRMED';

    if (conflictingBooking) {
        var confirmSubmitPending = confirm(
            '⚠️ ແຈ້ງເຕືອນໂຄຕ້າກະ:\n\nໃນກະ [' + shift + '] ວັນທີ ' + conflictingBooking.startDate + ' ຫາ ' + conflictingBooking.endDate + ' ມີທ່ານ "' + conflictingBooking.nameLao + '" ລາພັກແລ້ວ!\n\nທ່ານຕ້ອງການສົ່ງຄຳຂໍແບບ "ລໍຖ້າ Admin ອະນຸມັດພິເສດ" ແທ້ບໍ່?'
        );

        if (!confirmSubmitPending) {
            showToast('ແນະນຳ', 'ກະລຸນາໄປທີ່ຟອມ "ຂໍປ່ຽນກະ (Shift Swap)" ເພື່ອແລກກະກັບໝູ່ກ່ອນ', 'info');
            return;
        }

        bookingStatus = 'PENDING_ADMIN';
    }

    var diffDays = Math.ceil(Math.abs(new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
    
    if (bookingStatus === 'CONFIRMED') {
        user.usedAnnual = (user.usedAnnual || 0) + diffDays;
        var idx = (window.users || []).findIndex(function(u) { 
            return u.user.toLowerCase() === user.user.toLowerCase(); 
        });
        if (idx !== -1) window.users[idx].usedAnnual = user.usedAnnual;
    }

    var newBooking = {
        id: Date.now(),
        user: user.user,
        nameLao: user.nameLao,
        startDate: start,
        endDate: end,
        shift: shift,
        days: diffDays,
        reason: reason,
        status: bookingStatus,
        created_at: new Date().toISOString()
    };

    if (!window.annualBookings) window.annualBookings = [];
    window.annualBookings.unshift(newBooking);
    localStorage.setItem('ot_annual_bookings', JSON.stringify(window.annualBookings));

    if (bookingStatus === 'CONFIRMED') {
        if (!window.leavesList) window.leavesList = [];
        window.leavesList.unshift({
            id: Date.now(),
            date: start,
            shift: shift,
            empName: user.nameLao,
            reason: reason
        });
    }

    if (typeof saveAll === 'function') saveAll();

    if (window.supabaseClient) {
        try {
            await window.supabaseClient.from('annual_bookings').insert([{
                user_code: user.user,
                name_lao: user.nameLao,
                start_date: start,
                end_date: end,
                shift: shift,
                days: diffDays,
                reason: reason,
                status: bookingStatus,
                created_at: newBooking.created_at
            }]);
        } catch (e) {}
    }

    renderAnnualLeaveBookings();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    if (typeof window.fetchLiveNotifications === 'function') window.fetchLiveNotifications();

    if (bookingStatus === 'PENDING_ADMIN') {
        showToast('ສົ່ງຄຳຂໍແລ້ວ', 'ຄຳຮ້ອງກຳລັງລໍຖ້າ Admin ພິຈາລະນາ', 'warning');
    } else {
        showToast('ສຳເລັດ', 'ຈອງມື້ພັກ [' + shift + '] ຈຳນວນ ' + diffDays + ' ມື້ສຳເລັດ!', 'success');
    }
}

function promptCancelAnnualLeave(bookingId) {
    var booking = (window.annualBookings || []).find(function(b) { return b.id === bookingId; });
    if (!booking) return;

    if (!confirm('ທ່ານຕ້ອງການຍົກເລີກການຈອງມື້ພັກວັນທີ ' + booking.startDate + ' ຫາ ' + booking.endDate + ' ແທ້ບໍ່?')) return;

    var user = getCurrentUserSafe();
    if (booking.status === 'CONFIRMED' && user) {
        user.usedAnnual = Math.max(0, (user.usedAnnual || 0) - booking.days);
        var idx = (window.users || []).findIndex(function(u) { return u.user.toLowerCase() === user.user.toLowerCase(); });
        if (idx !== -1) window.users[idx].usedAnnual = user.usedAnnual;
    }

    window.annualBookings = window.annualBookings.filter(function(b) { return b.id !== bookingId; });
    localStorage.setItem('ot_annual_bookings', JSON.stringify(window.annualBookings));
    window.leavesList = (window.leavesList || []).filter(function(l) { return l.date !== booking.startDate || !isSamePerson(l.empName, booking.nameLao); });

    if (typeof saveAll === 'function') saveAll();
    renderAnnualLeaveBookings();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    if (typeof window.fetchLiveNotifications === 'function') window.fetchLiveNotifications();

    if (window.supabaseClient) {
        try {
            window.supabaseClient.from('annual_bookings')
                .delete()
                .eq('user_code', booking.user || (user && user.user))
                .eq('start_date', booking.startDate).then();
        } catch (e) {}
    }

    showToast('ສຳເລັດ', 'ຍົກເລີກການຈອງມື້ພັກຮຽບຮ້ອຍແລ້ວ!', 'success');
}

// 5.1 RENDER ປະຕິທິນຈອງມື້ພັກ
async function renderAnnualLeaveBookings() {
    var tbody = document.getElementById('annualLeaveBookingsTableBody');
    if (!tbody) return;

    try {
        var localB = localStorage.getItem('ot_annual_bookings');
        if (localB) window.annualBookings = JSON.parse(localB);
    } catch(e) {}

    tbody.innerHTML = '';

    var bookings = (window.annualBookings || []).slice().sort(function(a, b) {
        var timeA = a.created_at ? new Date(a.created_at).getTime() : (Number(a.id) || 0);
        var timeB = b.created_at ? new Date(b.created_at).getTime() : (Number(b.id) || 0);
        return timeB - timeA;
    });

    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-400 font-lao">ຍັງບໍ່ມີລາຍການຈອງມື້ພັກປະຈຳປີ</td></tr>';
        return;
    }

    var user = getCurrentUserSafe();
    var now = new Date();
    var todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');

    bookings.forEach(function(b) {
        var isMyBooking = (b.user === (user && user.user) || isSamePerson(b.nameLao, user && user.nameLao)) || (user && user.role === 'SUPER_ADMIN');
        var isAdmin = (user && user.role === 'SUPER_ADMIN');

        var isPast = Boolean(b.endDate && b.endDate < todayStr);

        var timeFormatted = '-';
        if (b.created_at) {
            var dObj = new Date(b.created_at);
            timeFormatted = dObj.toLocaleDateString('lo-LA', { day: '2-digit', month: '2-digit', year: 'numeric' }) + 
                            ' ' + dObj.toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' });
        } else if (b.id && String(b.id).length >= 12) {
            var dObj = new Date(Number(b.id));
            timeFormatted = dObj.toLocaleDateString('lo-LA', { day: '2-digit', month: '2-digit', year: 'numeric' }) + 
                            ' ' + dObj.toLocaleTimeString('lo-LA', { hour: '2-digit', minute: '2-digit' });
        }

        var statusBadge = '';
        if (b.status === 'CONFIRMED') {
            if (isPast) {
                statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">ໃຊ້ມື້ພັກແລ້ວ</span>';
            } else {
                statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">ອະນຸມັດແລ້ວ</span>';
            }
        } else if (b.status === 'PENDING_ADMIN') {
            statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">⚠️ ລໍຖ້າ Admin (ພັກຊ້ອນ)</span>';
        } else {
            statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-brand-red border border-red-200">ປະຕິເສດ</span>';
        }

        var rowStyleClass = isPast 
            ? 'opacity-50 bg-slate-50/60 hover:opacity-80 transition' 
            : 'hover:bg-slate-50 transition';

        var reasonHtml = b.reason || '-';
        if (isPast && b.status === 'CONFIRMED') {
            reasonHtml += ' <span class="text-[10px] text-slate-400 font-normal block mt-0.5 italic">✓ ໃຊ້ມື້ພັກແລ້ວ</span>';
        }

        tbody.innerHTML += '<tr class="' + rowStyleClass + ' font-lao border-b border-slate-100 text-xs">' +
            '<td class="p-3 font-bold text-brand-red">' + b.nameLao + '</td>' +
            '<td class="p-3 text-slate-700">' +
                '<div class="font-semibold">' + b.startDate + ' ຫາ ' + b.endDate + '</div>' +
                '<span class="text-[10px] text-emerald-600 font-mono block mt-0.5 font-medium">🕒 ຈອງເມື່ອ: ' + timeFormatted + '</span>' +
            '</td>' +
            '<td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">' + (b.shift || 'ທຸກກະ') + '</span></td>' +
            '<td class="p-3 font-bold text-slate-800">' + b.days + ' ມື້</td>' +
            '<td class="p-3 text-slate-500">' + reasonHtml + '</td>' +
            '<td class="p-3 text-right">' +
                '<div class="flex items-center justify-end gap-2">' +
                    statusBadge +
                    (isAdmin && b.status === 'PENDING_ADMIN' ? '<button type="button" onclick="adminApproveLeave(' + b.id + ')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition cursor-pointer">ອະນຸມັດ</button>' : '') +
                    (isMyBooking && !isPast ? '<button type="button" onclick="promptCancelAnnualLeave(' + b.id + ')" class="px-2.5 py-1 bg-white hover:bg-red-50 text-brand-red border border-red-200 rounded-lg text-xs font-bold transition flex items-center gap-0.5 cursor-pointer"><span class="material-symbols-outlined text-xs">delete</span> ຍົກເລີກ</button>' : '') +
                '</div>' +
            '</td>' +
        '</tr>';
    });
}

async function adminApproveLeave(id) {
    var b = (window.annualBookings || []).find(function(item) { return item.id === id; });
    if (!b) return;

    b.status = 'CONFIRMED';
    var userObj = (window.users || []).find(function(u) { return u.user === b.user || isSamePerson(u.nameLao, b.nameLao); });
    if (userObj) {
        userObj.usedAnnual = (userObj.usedAnnual || 0) + b.days;
    }

    if (!window.leavesList) window.leavesList = [];
    window.leavesList.unshift({
        id: Date.now(),
        date: b.startDate,
        shift: b.shift,
        empName: b.nameLao,
        reason: b.reason
    });

    if (typeof saveAll === 'function') saveAll();
    localStorage.setItem('ot_annual_bookings', JSON.stringify(window.annualBookings));

    if (window.supabaseClient) {
        try {
            await window.supabaseClient.from('annual_bookings')
                .update({ status: 'CONFIRMED' })
                .eq('user_code', b.user)
                .eq('start_date', b.startDate);
        } catch (e) {}
    }

    renderAnnualLeaveBookings();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    if (typeof window.fetchLiveNotifications === 'function') window.fetchLiveNotifications();
    showToast('ອະນຸມັດສຳເລັດ', 'Admin ໄດ້ອະນຸມັດໃຫ້ "' + b.nameLao + '" ລາພັກແລ້ວ', 'success');
}

// 6. ສົ່ງຄຳຮ້ອງປ່ຽນກະ
async function handleCreateSwap() {
    var user = getCurrentUserSafe();
    if (!user) {
        showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນສົ່ງຄຳຮ້ອງ', 'error');
        return;
    }

    var start = (document.getElementById('swapDateStart') || {}).value;
    var end = (document.getElementById('swapDateEnd') || {}).value;
    var toName = (document.getElementById('swapTargetPeer') || {}).value;
    var fromShift = (document.getElementById('swapMyShift') || {}).value;
    var toShift = (document.getElementById('swapTargetShift') || {}).value;
    var swapType = (document.getElementById('swapT

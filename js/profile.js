// ================= ⭐ PROFILE, LEAVE & P2P SHIFT SWAP HUB (CHAINED SWAP FIX) =================

// 0. Helper ດຶງ User ປັດຈຸບັນແບບປອດໄພ 100%
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
function getActiveSheetSafe() {
    if (typeof getActiveSheet === 'function') {
        var s = getActiveSheet();
        if (s) return s;
    }
    if (window.scheduleSheets && window.scheduleSheets.length > 0) {
        var found = window.scheduleSheets.find(function(item) { return item.id === window.activeSheetId; });
        return found || window.scheduleSheets[0];
    }
    try {
        var cached = localStorage.getItem('ot_schedule_sheets') || localStorage.getItem('ot_schedules_sheets');
        if (cached) {
            var list = JSON.parse(cached);
            if (list && list.length > 0) return list[0];
        }
    } catch(e) {}
    return null;
}

// ⭐ 0.2 Helper ປຽບທຽບຊື່ແບບ STRICT EXACT MATCH (ແກ້ໄຂບັນຫາຊື່ຄ້າຍກັນແລ້ວ Swap ຜິດຄົນ)
function isNameMatch(a, b) {
    if (!a || !b) return false;
    var cleanA = a.toString().trim().toLowerCase().replace(/\s+/g, '');
    var cleanB = b.toString().trim().toLowerCase().replace(/\s+/g, '');
    return cleanA === cleanB; // ຕ້ອງກົງກັນ 100% ເທົ່ານັ້ນ ຫ້າມໃຊ້ .includes()
}

// ⭐ 1. FUNCTION RENDER WORKSPACE ຂອງພະນັກງານ
function renderUserCurrentWeekWorkspace() {
    var user = getCurrentUserSafe();
    if (!user) return;

    var sheet = getActiveSheetSafe();
    var titleEl = document.getElementById('userCurrentShiftTitle');
    var pillsContainer = document.getElementById('userWeekDaysPills');

    var nameInput = document.getElementById('profNameInput');
    var deptInput = document.getElementById('profDeptInput');
    var phoneInput = document.getElementById('profPhoneInput');
    var nameDisplay = document.getElementById('profNameDisplay');
    var codeDisplay = document.getElementById('profCodeDisplay');
    var photoPreview = document.getElementById('profPhotoPreview');

    if (nameInput) nameInput.value = user.fullName || user.nameLao || '';
    if (deptInput) deptInput.value = user.dept || user.department || 'ຂະແໜງບໍລິການອອນລາຍ';
    if (phoneInput) phoneInput.value = user.phone || '';
    if (nameDisplay) nameDisplay.innerText = user.nameLao + ' (' + (user.fullName || user.nameLao) + ')';
    if (codeDisplay) codeDisplay.innerText = user.user || 'BCEL2120';
    if (photoPreview && user.photo) photoPreview.src = user.photo;

    if (titleEl && pillsContainer) {
        var myName = user.nameLao;
        pillsContainer.innerHTML = '';

        var today = new Date();
        var mKey = (sheet && sheet.monthKey) ? sheet.monthKey : (today.getFullYear() + '-' + (today.getMonth() + 1));
        var parts = mKey.split('-').map(Number);
        var y = parts[0];
        var m = parts[1];
        var myShifts = [];

        for (var i = 1; i <= 7; i++) {
            var dNum = i < 10 ? '0' + i : '' + i;
            var mNum = m < 10 ? '0' + m : '' + m;
            var dStr = y + '-' + mNum + '-' + dNum;
            var dInfo = (sheet && sheet.data && sheet.data[dStr]) ? sheet.data[dStr] : {};
            var shift = 'ພັກ (OFF)';
            var pillClass = 'bg-slate-100 text-slate-500';

            if (dInfo.shift1 && dInfo.shift1.some(function(n) { return isNameMatch(n, myName); })) { 
                shift = 'ກະ 1'; 
                pillClass = 'bg-red-50 text-brand-red font-bold border-red-200'; 
                myShifts.push('ກະ 1 (08:00 - 16:00)'); 
            } else if (dInfo.shift2 && dInfo.shift2.some(function(n) { return isNameMatch(n, myName); })) { 
                shift = 'ກະ 2'; 
                pillClass = 'bg-purple-50 text-purple-800 font-bold border-purple-200'; 
                myShifts.push('ກະ 2 (12:00 - 20:00)'); 
            } else if (dInfo.shift3 && dInfo.shift3.some(function(n) { return isNameMatch(n, myName); })) { 
                shift = 'ກະ 3'; 
                pillClass = 'bg-slate-800 text-white font-bold'; 
                myShifts.push('ກະ 3 (20:00 - 08:00)'); 
            }

            pillsContainer.innerHTML += '<div class="px-2.5 py-1 border rounded-lg text-center text-[10px] ' + pillClass + '">' +
                '<div class="font-bold">' + i + '/' + mNum + '</div>' +
                '<div>' + shift + '</div>' +
            '</div>';
        }

        titleEl.innerText = myShifts.length > 0 ? ('ອາທິດນີ້: ' + myShifts[0]) : 'ອາທິດນີ້: ພັກຜ່ອນ (OFF)';
    }

    var peerSelect = document.getElementById('swapTargetPeer');
    if (peerSelect) {
        peerSelect.innerHTML = '';
        (window.users || []).filter(function(u) { 
            return !isNameMatch(u.nameLao, user.nameLao) && u.role !== 'SUPER_ADMIN'; 
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

    var staffList = (window.users || []).filter(function(u) { return u.role !== 'SUPER_ADMIN'; });
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

            matrixTbody.innerHTML += '<tr class="hover:bg-slate-50 font-lao">' +
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
                auditTbody.innerHTML += '<tr class="hover:bg-slate-50 font-lao">' +
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

            anomalyTbody.innerHTML += '<tr class="hover:bg-slate-50 font-lao">' +
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

// 3. ອັບໂຫຼດຮູບໂປຣໄຟລ໌
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
            if (w > h) { if (w > max) { h = Math.round((h * max) / w); w = max; } }
            else { if (h > max) { w = Math.round((w * max) / h); h = max; } }
            canvas.width = w; canvas.height = h;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            var photoBase64 = canvas.toDataURL('image/jpeg', 0.7);

            var user = getCurrentUserSafe();
            if (user) {
                user.photo = photoBase64;
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

            if (window.supabaseClient && user) {
                try {
                    await window.supabaseClient.from('profiles').update({ photo: photoBase64 }).eq('user_code', user.user);
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
                .eq('user_code', user.user);
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
        status: bookingStatus
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
                status: bookingStatus
            }]);
        } catch (e) {}
    }

    renderAnnualLeaveBookings();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();

    if (bookingStatus === 'PENDING_ADMIN') {
        showToast('ສົ່ງຄຳຂໍແລ້ວ', 'ຄຳຮ້ອງກຳລັງລໍຖ້າ Admin ພິຈາລະນາ', 'warning');
    } else {
        showToast('ສຳເລັດ', 'ຈອງມື້ພັກ [' + shift + '] ຈຳນວນ ' + diffDays + ' ມື້ສຳເລັດ!', 'success');
    }
}

function promptCancelAnnualLeave(bookingId) {
    var booking = (window.annualBookings || []).find(function(b) { return b.id === bookingId; });
    if (!booking) return;

    askConfirm(
        'ຍົກເລີກການຈອງມື້ພັກ',
        'ທ່ານຕ້ອງການຍົກເລີກການຈອງມື້ພັກວັນທີ ' + booking.startDate + ' ຫາ ' + booking.endDate + ' ແທ້ບໍ່?',
        async function() {
            var user = getCurrentUserSafe();
            if (booking.status === 'CONFIRMED' && user) {
                user.usedAnnual = Math.max(0, (user.usedAnnual || 0) - booking.days);
                var idx = (window.users || []).findIndex(function(u) { return u.user.toLowerCase() === user.user.toLowerCase(); });
                if (idx !== -1) window.users[idx].usedAnnual = user.usedAnnual;
            }

            window.annualBookings = window.annualBookings.filter(function(b) { return b.id !== bookingId; });
            localStorage.setItem('ot_annual_bookings', JSON.stringify(window.annualBookings));
            window.leavesList = (window.leavesList || []).filter(function(l) { return l.date !== booking.startDate || l.empName !== booking.nameLao; });

            if (typeof saveAll === 'function') saveAll();
            renderAnnualLeaveBookings();
            if (typeof window.renderDashboard === 'function') window.renderDashboard();

            if (window.supabaseClient) {
                try {
                    await window.supabaseClient.from('annual_bookings')
                        .delete()
                        .eq('user_code', booking.user || (user && user.user))
                        .eq('start_date', booking.startDate);
                } catch (e) {}
            }

            showToast('ສຳເລັດ', 'ຍົກເລີກການຈອງມື້ພັກຮຽບຮ້ອຍແລ້ວ!', 'success');
        },
        'delete',
        'ຍົກເລີກມື້ພັກ'
    );
}

async function renderAnnualLeaveBookings() {
    var tbody = document.getElementById('annualLeaveBookingsTableBody');
    if (!tbody) return;

    try {
        var localB = localStorage.getItem('ot_annual_bookings');
        if (localB) window.annualBookings = JSON.parse(localB);
    } catch(e) {}

    tbody.innerHTML = '';
    var bookings = window.annualBookings || [];

    if (bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-400 font-lao">ຍັງບໍ່ມີລາຍການຈອງມື້ພັກປະຈຳປີ</td></tr>';
        return;
    }

    var user = getCurrentUserSafe();
    bookings.forEach(function(b) {
        var isMyBooking = (b.user === (user && user.user) || isNameMatch(b.nameLao, user && user.nameLao)) || (user && user.role === 'SUPER_ADMIN');
        var isAdmin = (user && user.role === 'SUPER_ADMIN');

        var statusBadge = '';
        if (b.status === 'CONFIRMED') {
            statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">ອະນຸມັດແລ້ວ</span>';
        } else if (b.status === 'PENDING_ADMIN') {
            statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">⚠️ ລໍຖ້າ Admin (ພັກຊ້ອນ)</span>';
        } else {
            statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-brand-red border border-red-200">ປະຕິເສດ</span>';
        }

        tbody.innerHTML += '<tr class="hover:bg-slate-50 font-lao">' +
            '<td class="p-3 font-bold text-brand-red">' + b.nameLao + '</td>' +
            '<td class="p-3 text-slate-700">' + b.startDate + ' ຫາ ' + b.endDate + '</td>' +
            '<td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">' + (b.shift || 'ກະ 1') + '</span></td>' +
            '<td class="p-3 font-bold">' + b.days + ' ມື້</td>' +
            '<td class="p-3 text-slate-500">' + b.reason + '</td>' +
            '<td class="p-3 text-right">' +
                '<div class="flex items-center justify-end gap-2">' +
                    statusBadge +
                    (isAdmin && b.status === 'PENDING_ADMIN' ? '<button type="button" onclick="adminApproveLeave(' + b.id + ')" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow transition cursor-pointer">ອະນຸມັດ</button>' : '') +
                    (isMyBooking ? '<button type="button" onclick="promptCancelAnnualLeave(' + b.id + ')" class="px-2.5 py-1 bg-white hover:bg-red-50 text-brand-red border border-red-200 rounded-lg text-xs font-bold transition flex items-center gap-0.5 cursor-pointer"><span class="material-symbols-outlined text-xs">delete</span> ຍົກເລີກ</button>' : '') +
                '</div>' +
            '</td>' +
        '</tr>';
    });
}

async function adminApproveLeave(id) {
    var b = (window.annualBookings || []).find(function(item) { return item.id === id; });
    if (!b) return;

    b.status = 'CONFIRMED';
    var userObj = (window.users || []).find(function(u) { return u.user === b.user || isNameMatch(u.nameLao, b.nameLao); });
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
    var swapType = (document.getElementById('swapTypeSelect') || {}).value || 'SWAP';
    var reason = ((document.getElementById('swapReason') || {}).value || '').trim();

    if (!start || !end || !toName) { 
        showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາເລືອກຂໍ້ມູນໃຫ້ຄົບຖ້ວນ', 'error'); 
        return; 
    }

    var defaultReason = (swapType === 'COVER') ? 'ອາສາຂຶ້ນຍາມແທນໝູ່ (ຄວບກະເສົາ-ອາທິດ)' : 'ຂໍແລກປ່ຽນກະປະຈຳການ';

    var newSwap = {
        id: Date.now(),
        swapType: swapType,
        fromName: user.nameLao,
        toName: toName,
        startDate: start,
        endDate: end,
        fromShift: fromShift,
        toShift: toShift,
        reason: reason || defaultReason,
        status: 'PENDING',
        createdAt: new Date().toLocaleString('lo-LA')
    };

    if (!window.swapHistory) window.swapHistory = [];
    window.swapHistory.unshift(newSwap);

    localStorage.setItem('ot_swap_history', JSON.stringify(window.swapHistory));
    if (typeof saveAll === 'function') await saveAll();

    if (window.supabaseClient) {
        try {
            var payload = {
                from_name: newSwap.fromName,
                to_name: newSwap.toName,
                start_date: newSwap.startDate,
                end_date: newSwap.endDate,
                from_shift: newSwap.fromShift,
                to_shift: newSwap.toShift,
                reason: '[' + newSwap.swapType + '] ' + newSwap.reason,
                status: 'PENDING'
            };

            var res = await window.supabaseClient.from('shift_swaps').insert([payload]).select();
            if (res && res.data && res.data[0] && res.data[0].id) {
                newSwap.id = res.data[0].id;
                localStorage.setItem('ot_swap_history', JSON.stringify(window.swapHistory));
            }
        } catch (e) {}
    }

    var reasonInput = document.getElementById('swapReason');
    if (reasonInput) reasonInput.value = '';

    renderSwapHistory();
    if (typeof window.updateNotificationBadge === 'function') window.updateNotificationBadge();
    
    var msg = (swapType === 'COVER') 
        ? ('ສົ່ງຄຳຮ້ອງອາສາ "ຍາມແທນຄວບກະ" ໃຫ້ "' + toName + '" ແລ້ວ!') 
        : ('ສົ່ງຄຳຮ້ອງຂໍແລກປ່ຽນກະຫາ "' + toName + '" ແລ້ວ!');
    showToast('ສຳເລັດ', msg, 'success');
}

// 7. RENDER ລາຍການປ່ຽນກະ
async function renderSwapHistory() {
    var container = document.getElementById('incomingSwapsList');
    if (!container) return;

    try {
        var localSwaps = localStorage.getItem('ot_swap_history');
        if (localSwaps) window.swapHistory = JSON.parse(localSwaps);
    } catch(e) {}

    container.innerHTML = '';
    var history = window.swapHistory || [];

    if (history.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-xs italic py-3 text-center font-lao">ຍັງບໍ່ມີປະຫວັດການຂໍປ່ຽນກະ</p>';
        return;
    }

    var user = getCurrentUserSafe();
    var myNameLao = user ? user.nameLao : '';
    var myFullName = user ? user.fullName : '';
    var myUserCode = user ? user.user : '';
    var isAdmin = user && user.role === 'SUPER_ADMIN';

    history.forEach(function(req) {
        var isForMe = (isNameMatch(req.toName, myNameLao) || isNameMatch(req.toName, myFullName) || isNameMatch(req.toName, myUserCode)) && (req.status === 'PENDING');
        var isCreatedByMe = (isNameMatch(req.fromName, myNameLao) || isNameMatch(req.fromName, myFullName) || isNameMatch(req.fromName, myUserCode)) && (req.status === 'PENDING');
        var canAccept = isForMe || (isAdmin && req.status === 'PENDING');

        var isCover = (req.swapType === 'COVER');
        var typeBadge = isCover 
            ? '<span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300">⭐ ຍາມແທນ / ຄວບກະເສົາ-ອາທິດ</span>' 
            : '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">🔄 ແລກປ່ຽນກະ 1:1</span>';

        var statusBadge = '';
        if (req.status === 'COMPLETED') {
            statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">ສຳເລັດແລ້ວ</span>';
        } else if (req.status === 'PENDING') {
            statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">ລໍຖ້າຕອບຮັບ</span>';
        } else {
            statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">ປະຕິເສດແລ້ວ</span>';
        }

        var detailText = isCover
            ? ('<span class="text-brand-red font-bold">' + req.fromName + '</span> ອາສາຂຶ້ນຍາມແທນ <span class="text-blue-700 font-bold">' + req.toName + '</span> ໃນກະ <span class="font-bold text-purple-700">[' + req.toShift + ']</span>')
            : ('<span class="text-brand-red font-bold">' + req.fromName + '</span> ຂໍແລກກະກັບ <span class="text-blue-700 font-bold">' + req.toName + '</span>');

        container.innerHTML += '<div class="p-3.5 bg-slate-50 border rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 font-lao">' +
            '<div class="space-y-1">' +
                '<div class="flex items-center gap-2">' + typeBadge + '<span class="text-slate-400 text-[10px]">' + (req.createdAt || '') + '</span></div>' +
                '<p class="font-medium text-slate-800 text-xs">' + detailText + '</p>' +
                '<p class="text-slate-500 text-[11px]">ຊ່ວງວັນທີ: <strong>' + req.startDate + ' ຫາ ' + req.endDate + '</strong> ' + (req.reason ? ('| ໝາຍເຫດ: <em>"' + req.reason + '"</em>') : '') + '</p>' +
            '</div>' +
            '<div class="flex items-center gap-2">' +
                (canAccept ? (
                    '<button type="button" onclick="acceptSwap(' + req.id + ')" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1 cursor-pointer"><span class="material-symbols-outlined text-xs">check_circle</span> ຍອມຮັບ (Accept)</button>' +
                    '<button type="button" onclick="declineSwap(' + req.id + ')" class="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer">ປະຕິເສດ</button>'
                ) : (isCreatedByMe ? (
                    statusBadge + '<button type="button" onclick="promptCancelSwap(' + req.id + ')" class="px-2.5 py-1 bg-white hover:bg-red-50 text-brand-red border border-red-200 rounded-xl text-xs font-bold transition cursor-pointer">ຍົກເລີກ</button>'
                ) : statusBadge)) +
            '</div>' +
        '</div>';
    });
}

// ⭐ 8. ກົດ ACCEPT ປ່ຽນກະ (ແກ້ໄຂບັນຫາບໍ່ສະລັບບ່ອນນັ່ງໃນຕາຕະລາງ 100%)
async function acceptSwap(id) {
    var req = (window.swapHistory || []).find(function(r) { return r.id == id; });
    if (!req) return;

    req.status = 'COMPLETED';

    function getDatesList(sDate, eDate) {
        var list = [];
        var start = new Date(sDate + 'T00:00:00Z');
        var end = new Date((eDate || sDate) + 'T00:00:00Z');
        while (start <= end) {
            list.push(start.toISOString().split('T')[0]);
            start.setUTCDate(start.getUTCDate() + 1);
        }
        return list;
    }

    var targetDates = getDatesList(req.startDate, req.endDate);
    var isCover = (req.swapType === 'COVER');
    var personA = req.fromName;
    var personB = req.toName;

    // ວົນລູບທຸກ Sheet ທີ່ມີວັນທີນີ້ຢູ່ແທ້ໆ (ຕັດ bug monthKey ອອກ)
    (window.scheduleSheets || []).forEach(function(sheet) {
        if (!sheet || !sheet.data) return;

        targetDates.forEach(function(dStr) {
            var day = sheet.data[dStr];
            if (!day) return; // ຖ້າ Sheet ບໍ່ມີວັນທີນີ້ແມ່ນຂ້າມໄປ

            if (isCover) {
                ['shift1', 'shift2', 'shift3'].forEach(function(sName) {
                    var arr = day[sName] || [];
                    for (var i = 0; i < arr.length; i++) {
                        if (isNameMatch(arr[i], personB)) arr[i] = personA;
                    }
                });
            } else {
                // ຄົ້ນຫາກະຕົວຈິງຂອງ Person A ແລະ Person B
                var findActualSlot = function(name) {
                    for (var sName of ['shift1', 'shift2', 'shift3']) {
                        var arr = day[sName] || [];
                        for (var i = 0; i < arr.length; i++) {
                            if (isNameMatch(arr[i], name)) return { shift: sName, index: i };
                        }
                    }
                    return null;
                };

                var posA = findActualSlot(personA);
                var posB = findActualSlot(personB);

                // ສະລັບບ່ອນກັນຕົວຈິງໃນຕາຕະລາງ
                if (posA && posB && posA.shift !== posB.shift) {
                    day[posA.shift][posA.index] = personB;
                    day[posB.shift][posB.index] = personA;
                }
            }
        });
    });

    localStorage.setItem('ot_swap_history', JSON.stringify(window.swapHistory));
    localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
    localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));

    renderSwapHistory();
    renderUserCurrentWeekWorkspace();
    if (typeof window.renderScheduleTable === 'function') window.renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();

    showToast('ປ່ຽນກະສຳເລັດ', 'ສັບປ່ຽນກະລະຫວ່າງ ' + personA + ' ແລະ ' + personB + ' ຮຽບຮ້ອຍແລ້ວ!', 'success');

    try {
        if (typeof saveAll === 'function') await saveAll();
        if (window.supabaseClient) {
            await window.supabaseClient.from('shift_swaps').update({ status: 'COMPLETED' }).eq('id', req.id);
            for (var s of (window.scheduleSheets || [])) {
                if (typeof syncScheduleToSupabase === 'function') {
                    await syncScheduleToSupabase(s);
                }
            }
        }
    } catch (e) {}
}

// ⭐ ຟັງຊັນສັ່ງໃຫ້ທຸກຄູ່ທີ່ "ປ່ຽນສຳເລັດ" ແລ້ວ ແຕ່ຕາຕະລາງຍັງບໍ່ທັນສະລັບ ໃຫ້ສະລັບທັນທີ
async function syncAllCompletedSwapsToSchedule() {
    var completedSwaps = (window.swapHistory || []).filter(function(s) {
        return s.status === 'COMPLETED';
    });

    if (completedSwaps.length === 0) {
        if (typeof showToast === 'function') showToast('ແຈ້ງເຕືອນ', 'ບໍ່ມີລາຍການປ່ຽນກະທີ່ສຳເລັດ', 'info');
        return;
    }

    completedSwaps.forEach(function(req) {
        var start = new Date(req.startDate + 'T00:00:00Z');
        var end = new Date((req.endDate || req.startDate) + 'T00:00:00Z');
        var dates = [];
        while (start <= end) {
            dates.push(start.toISOString().split('T')[0]);
            start.setUTCDate(start.getUTCDate() + 1);
        }

        (window.scheduleSheets || []).forEach(function(sheet) {
            if (!sheet || !sheet.data) return;
            dates.forEach(function(dStr) {
                var day = sheet.data[dStr];
                if (!day) return;

                var findSlot = function(name) {
                    for (var sName of ['shift1', 'shift2', 'shift3']) {
                        var arr = day[sName] || [];
                        for (var i = 0; i < arr.length; i++) {
                            if (isNameMatch(arr[i], name)) return { shift: sName, index: i };
                        }
                    }
                    return null;
                };

                var pA = findSlot(req.fromName);
                var pB = findSlot(req.toName);

                if (pA && pB && pA.shift !== pB.shift) {
                    day[pA.shift][pA.index] = req.toName;
                    day[pB.shift][pB.index] = req.fromName;
                }
            });
        });
    });

    localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
    localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));

    if (typeof window.renderScheduleTable === 'function') window.renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    if (typeof window.renderUserCurrentWeekWorkspace === 'function') window.renderUserCurrentWeekWorkspace();

    if (typeof saveAll === 'function') await saveAll();
    if (window.supabaseClient) {
        for (var s of (window.scheduleSheets || [])) {
            if (typeof syncScheduleToSupabase === 'function') {
                await syncScheduleToSupabase(s);
            }
        }
    }

    if (typeof showToast === 'function') {
        showToast('ສຳເລັດ', 'ສະລັບຕຳແໜ່ງໃນຕາຕະລາງຄົບທຸກຄູ່ຮຽບຮ້ອຍແລ້ວ!', 'success');
    }
}
window.syncAllCompletedSwapsToSchedule = syncAllCompletedSwapsToSchedule;
// ⭐ 9. AUTO-INITIALIZE WORKSPACE ON TAB SWITCH
function initProfileWorkspace() {
    var user = getCurrentUserSafe();
    if (!user) return;

    var adminSec = document.getElementById('adminReportsSection');
    var userSec = document.getElementById('userStaffWorkspaceSection');

    if (user.role === 'SUPER_ADMIN') {
        if (adminSec) adminSec.classList.remove('hidden');
        if (userSec) userSec.classList.remove('hidden');
        renderAdminAllStaffReport();
        renderUserCurrentWeekWorkspace();
    } else {
        if (adminSec) adminSec.classList.add('hidden');
        if (userSec) userSec.classList.remove('hidden');
        renderUserCurrentWeekWorkspace();
    }
}

var _origSwitchTab = window.switchTab;
window.switchTab = function(tab) {
    if (typeof _origSwitchTab === 'function') _origSwitchTab(tab);
    if (tab === 'profile') {
        setTimeout(initProfileWorkspace, 50);
        setTimeout(initProfileWorkspace, 300);
    }
};

document.addEventListener('click', function(e) {
    var btn = e.target.closest('#top-btn-profile, #side-profile, #mob-side-profile, a[href*="profile"]');
    if (btn) {
        setTimeout(initProfileWorkspace, 50);
        setTimeout(initProfileWorkspace, 300);
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(initProfileWorkspace, 100);
        setTimeout(initProfileWorkspace, 500);
    });
} else {
    setTimeout(initProfileWorkspace, 100);
    setTimeout(initProfileWorkspace, 500);
}

// ຜູກທຸກ Function ເຂົ້າ Window
window.renderAdminAllStaffReport = renderAdminAllStaffReport;
window.renderUserCurrentWeekWorkspace = renderUserCurrentWeekWorkspace;
window.handlePhotoUploadAndCompress = handlePhotoUploadAndCompress;
window.handleUpdateProfile = handleUpdateProfile;
window.handleBookAnnualLeave = handleBookAnnualLeave;
window.adminApproveLeave = adminApproveLeave;
window.promptCancelAnnualLeave = promptCancelAnnualLeave;
window.renderAnnualLeaveBookings = renderAnnualLeaveBookings;
window.handleCreateSwap = handleCreateSwap;
window.promptCancelSwap = promptCancelSwap;
window.renderSwapHistory = renderSwapHistory;
window.acceptSwap = acceptSwap;
window.declineSwap = declineSwap;
window.initProfileWorkspace = initProfileWorkspace;

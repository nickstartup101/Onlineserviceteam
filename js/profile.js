// ================= ⭐ PROFILE, LEAVE & P2P SHIFT SWAP HUB =================

// ⭐ 1. ລາຍງານ ADMIN MATRIX & ຕິດຕາມການປ່ຽນກະຜິດປົກກະຕິ
function renderAdminAllStaffReport() {
    if (!window.currentUser || window.currentUser.role !== 'SUPER_ADMIN') return;

    var sheet = (typeof getActiveSheet === 'function') ? getActiveSheet() : null;
    var matrixTbody = document.getElementById('adminAllStaffMatrixReportBody');
    var auditTbody = document.getElementById('adminScheduleAuditTableBody');
    var anomalyTbody = document.getElementById('adminAnomalyTableBody');

    var staffList = (window.users || []).filter(function(u) { return u && u.role !== 'SUPER_ADMIN'; });
    var staffCountEl = document.getElementById('adminMetricStaffCount');
    var swapCountEl = document.getElementById('adminMetricSwapCount');
    var leaveCountEl = document.getElementById('adminMetricLeaveCount');
    var dutyCountEl = document.getElementById('adminMetricDutyCount');

    if (staffCountEl) staffCountEl.innerText = `${staffList.length} ທ່ານ`;
    if (swapCountEl) swapCountEl.innerText = `${(window.swapHistory || []).length} ລາຍການ`;

    var totalLeavesCount = 0;
    var totalDutyCount = 0;

    var stats = {};
    staffList.forEach(function(u) {
        var usedL = u.usedAnnual || 0;
        totalLeavesCount += usedL;
        stats[u.nameLao] = { 
            user: u.user, fullName: u.fullName, nameLao: u.nameLao, isLeader: u.isLeader,
            annualQuota: u.annualQuota || 15, usedAnnual: usedL, otherLeaves: u.otherLeaves || 0,
            s1: 0, s2: 0, s3: 0, weekendShifts: 0, totalDuty: 0,
            swapsRequested: 0, swappedIntoS3: 0
        };
    });

    if (leaveCountEl) leaveCountEl.innerText = `${totalLeavesCount} ມື້`;

    var schedData = sheet?.data || sheet?.schedule_data || {};
    if (typeof schedData === 'string') {
        try { schedData = JSON.parse(schedData); } catch(e) { schedData = {}; }
    }
    var dates = Object.keys(schedData).filter(function(k) { return !k.startsWith('_'); });

    dates.forEach(function(d) {
        var day = schedData[d];
        if (!day) return;
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

    if (dutyCountEl) dutyCountEl.innerText = `${totalDutyCount} ກະ`;

    // A. Matrix Report
    if (matrixTbody) {
        matrixTbody.innerHTML = '';
        Object.values(stats).forEach(function(st) {
            var quota = st.annualQuota || 15;
            var used = st.usedAnnual || 0;
            var remaining = quota - used;

            matrixTbody.innerHTML += `
                <tr class="hover:bg-slate-50 font-lao">
                    <td class="p-3 font-bold text-slate-700">${st.user}</td>
                    <td class="p-3 font-semibold text-slate-800">${st.fullName}</td>
                    <td class="p-3 font-bold ${st.isLeader ? 'text-brand-red' : 'text-slate-800'}">
                        ${st.nameLao} ${st.isLeader ? '<span class="text-[9px] bg-red-50 text-brand-red px-1.5 py-0.5 rounded ml-1 border border-red-200">ຫົວໜ້າ</span>' : ''}
                    </td>
                    <td class="p-3 text-center">${st.s1}</td>
                    <td class="p-3 text-center">${st.s2}</td>
                    <td class="p-3 text-center font-bold text-brand-red bg-red-50/40">${st.s3}</td>
                    <td class="p-3 text-center font-bold text-slate-900 bg-slate-100/50">${st.totalDuty} ກະ</td>
                    <td class="p-3 text-amber-700 font-bold text-center">${used} / ${quota}</td>
                    <td class="p-3 text-brand-red font-bold text-center">${remaining} ມື້</td>
                    <td class="p-3 text-center text-slate-600 font-semibold">${used + (st.otherLeaves || 0)} ມື້</td>
                </tr>
            `;
        });
    }

    // B. Audit Logs
    if (auditTbody) {
        auditTbody.innerHTML = '';
        var auditLogs = window.scheduleAuditLogs || [];
        if (auditLogs.length === 0) {
            auditTbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400 font-lao">ຍັງບໍ່ມີປະຫວັດການແກ້ໄຂຕາຕະລາງຫຼັງ Publish</td></tr>`;
        } else {
            auditLogs.forEach(function(log) {
                auditTbody.innerHTML += `
                    <tr class="hover:bg-slate-50 font-lao">
                        <td class="p-3 font-bold text-slate-700 truncate max-w-[150px]">${log.sheetTitle}</td>
                        <td class="p-3 font-semibold">${log.date} (${log.shift})</td>
                        <td class="p-3 text-amber-950 font-bold bg-amber-50 rounded">${log.oldName} ➔ ${log.newName}</td>
                        <td class="p-3 text-slate-600 italic">"${log.reason}"</td>
                        <td class="p-3 font-medium text-brand-red">${log.adminName}</td>
                        <td class="p-3 text-right text-slate-400 text-[11px]">${log.timestamp}</td>
                    </tr>
                `;
            });
        }
    }

    // C. Anomaly Table
    if (anomalyTbody) {
        anomalyTbody.innerHTML = '';
        var sortedStats = Object.values(stats).sort(function(a, b) { return b.totalDuty - a.totalDuty || b.swapsRequested - a.swapsRequested; });

        sortedStats.forEach(function(st) {
            var badges = [];
            if (st.totalDuty > 25) badges.push(`<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-brand-red border border-red-200">⚠️ ເກີນມາດຕະຖານ (${st.totalDuty} ກະ)</span>`);
            if (st.swappedIntoS3 >= 3) badges.push(`<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">🌙 ຮັບກະ 3 ຫຼາຍ (+${st.swappedIntoS3})</span>`);
            if (st.swapsRequested >= 4) badges.push(`<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">🔄 ປ່ຽນກະເລື້ອຍໆ (${st.swapsRequested} ຄັ້ງ)</span>`);
            if (st.weekendShifts >= 5) badges.push(`<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">📅 ເສົາ-ອາທິດສູງ (${st.weekendShifts} ມື້)</span>`);
            if (badges.length === 0) badges.push(`<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700">ປົກກະຕິ</span>`);

            anomalyTbody.innerHTML += `
                <tr class="hover:bg-slate-50 font-lao">
                    <td class="p-3 font-bold text-slate-800 flex items-center gap-1.5">
                        ${st.nameLao} 
                        <span class="text-[10px] font-normal text-slate-400">(${st.fullName})</span>
                        ${st.isLeader ? '<span class="text-[9px] bg-brand-red text-white px-1.5 py-0.2 rounded font-bold">ຫົວໜ້າ</span>' : ''}
                    </td>
                    <td class="p-3 text-center font-bold ${st.swapsRequested > 0 ? 'text-amber-700' : 'text-slate-400'}">${st.swapsRequested} ຄັ້ງ</td>
                    <td class="p-3 text-center font-bold ${st.swappedIntoS3 > 0 ? 'text-purple-700' : 'text-slate-400'}">${st.swappedIntoS3} ກະ</td>
                    <td class="p-3 text-center font-bold text-blue-700">${st.weekendShifts} ວັນ</td>
                    <td class="p-3 text-center font-black ${st.totalDuty > 25 ? 'text-brand-red text-sm' : 'text-slate-900'}">${st.totalDuty} ກະ</td>
                    <td class="p-3 text-center space-x-1">${badges.join(' ')}</td>
                </tr>
            `;
        });
    }
}
window.renderAdminAllStaffReport = renderAdminAllStaffReport;

// 2. ຟັງຊັນກວດຈັບກະອັດຕະໂນມັດ (Auto-Detect Shifts)
function autoDetectSwapShifts() {
    var dateInput = document.getElementById('swapDateStart');
    var peerSelect = document.getElementById('swapTargetPeer');
    var myShiftSelect = document.getElementById('swapMyShift');
    var targetShiftSelect = document.getElementById('swapTargetShift');
    var hintEl = document.getElementById('swapShiftDetectHint');

    if (!dateInput || !peerSelect || !myShiftSelect || !targetShiftSelect) return;

    var dStr = dateInput.value;
    var peerName = peerSelect.value;
    var myName = window.currentUser?.nameLao;

    var sheet = (typeof getActiveSheet === 'function') ? getActiveSheet() : null;
    var dayData = sheet?.data?.[dStr] || null;

    if (!dayData) {
        if (hintEl) hintEl.innerHTML = `<span class="text-slate-400 text-[11px] italic">💡 ຍັງບໍ່ພົບຕາຕະລາງໃນວັນທີ ${dStr}</span>`;
        return;
    }

    function findShiftOfPerson(name) {
        if (!name) return 'off';
        if ((dayData.shift1 || []).includes(name)) return 'shift1';
        if ((dayData.shift2 || []).includes(name)) return 'shift2';
        if ((dayData.shift3 || []).includes(name)) return 'shift3';
        return 'off';
    }

    var myShift = findShiftOfPerson(myName);
    var peerShift = findShiftOfPerson(peerName);

    var shiftLabels = {
        'shift1': 'ກະ 1 (08:00 - 16:00)',
        'shift2': 'ກະ 2 (12:00 - 20:00)',
        'shift3': 'ກະ 3 (20:00 - 08:00)',
        'off': 'ພັກຜ່ອນ (OFF)'
    };

    if (myShift !== 'off') myShiftSelect.value = myShift;
    if (peerShift !== 'off') targetShiftSelect.value = peerShift;

    if (hintEl) {
        var myText = shiftLabels[myShift] || myShift;
        var peerText = shiftLabels[peerShift] || peerShift;

        hintEl.innerHTML = `
            <div class="p-2.5 bg-blue-50 border border-blue-200 rounded-2xl text-[11px] text-blue-900 flex items-center justify-between shadow-xs mt-1">
                <span>👤 ທ່ານ: <strong class="${myShift === 'off' ? 'text-slate-400' : 'text-brand-red'}">${myText}</strong></span>
                <span class="font-black">↔️</span>
                <span>👥 ${peerName}: <strong class="${peerShift === 'off' ? 'text-slate-400' : 'text-purple-700'}">${peerText}</strong></span>
            </div>
        `;
    }
}
window.autoDetectSwapShifts = autoDetectSwapShifts;

// 3. WORKSPACE VIEW
function renderUserCurrentWeekWorkspace() {
    if (!window.currentUser) return;
    var sheet = (typeof getActiveSheet === 'function') ? getActiveSheet() : null;
    var titleEl = document.getElementById('userCurrentShiftTitle');
    var pillsContainer = document.getElementById('userWeekDaysPills');

    var nameInput = document.getElementById('profNameInput');
    var deptInput = document.getElementById('profDeptInput');
    var phoneInput = document.getElementById('profPhoneInput');
    var nameDisplay = document.getElementById('profNameDisplay');
    var codeDisplay = document.getElementById('profCodeDisplay');
    var photoPreview = document.getElementById('profPhotoPreview');

    if (nameInput) nameInput.value = window.currentUser.fullName || '';
    if (deptInput) deptInput.value = window.currentUser.dept || 'ຂະແໜງບໍລິການອອນລາຍ';
    if (phoneInput) phoneInput.value = window.currentUser.phone || '';
    if (nameDisplay) nameDisplay.innerText = `${window.currentUser.nameLao} (${window.currentUser.fullName})`;
    if (codeDisplay) codeDisplay.innerText = window.currentUser.user || '';
    if (photoPreview) {
        photoPreview.src = window.currentUser.photo || window.DEFAULT_AVATAR;
        photoPreview.onerror = function() { this.src = window.DEFAULT_AVATAR; };
    }

    var peerSelect = document.getElementById('swapTargetPeer');
    if (peerSelect) {
        peerSelect.innerHTML = '';
        (window.users || []).filter(function(u) {
            return u && u.nameLao !== window.currentUser.nameLao && u.role !== 'SUPER_ADMIN';
        }).forEach(function(u) {
            peerSelect.innerHTML += `<option value="${u.nameLao}">${u.nameLao} (${u.fullName})</option>`;
        });
    }

    var swapDateInput = document.getElementById('swapDateStart');
    if (swapDateInput) swapDateInput.onchange = autoDetectSwapShifts;
    if (peerSelect) peerSelect.onchange = autoDetectSwapShifts;
    setTimeout(autoDetectSwapShifts, 300);

    if (!titleEl || !pillsContainer) return;
    var myName = window.currentUser.nameLao;
    pillsContainer.innerHTML = '';
    var [y, m] = (sheet?.monthKey || '2026-09').split('-').map(Number);
    var myShifts = [];

    for (var i = 1; i <= 7; i++) {
        var dNum = i < 10 ? '0' + i : '' + i;
        var mNum = m < 10 ? '0' + m : '' + m;
        var dStr = `${y}-${mNum}-${dNum}`;
        var dInfo = sheet?.data?.[dStr] || {};
        var shift = 'ພັກ (OFF)';
        var pillClass = 'bg-slate-100 text-slate-500';

        if (dInfo.shift1?.includes(myName)) { shift = 'ກະ 1'; pillClass = 'bg-red-50 text-brand-red font-bold border-red-200'; myShifts.push('ກະ 1'); }
        else if (dInfo.shift2?.includes(myName)) { shift = 'ກະ 2'; pillClass = 'bg-purple-50 text-purple-800 font-bold border-purple-200'; myShifts.push('ກະ 2'); }
        else if (dInfo.shift3?.includes(myName)) { shift = 'ກະ 3'; pillClass = 'bg-slate-800 text-white font-bold'; myShifts.push('ກະ 3'); }

        pillsContainer.innerHTML += `
            <div class="px-2.5 py-1 border rounded-lg text-center text-[10px] ${pillClass}">
                <div class="font-bold">${i}/${mNum}</div>
                <div>${shift}</div>
            </div>
        `;
    }

    titleEl.innerText = myShifts.length > 0 ? `ອາທິດນີ້: ${myShifts[0]}` : 'ອາທິດນີ້: ພັກຜ່ອນ (OFF)';

    renderAnnualLeaveBookings();
    renderSwapHistory();
}
window.renderUserCurrentWeekWorkspace = renderUserCurrentWeekWorkspace;

// 4. PHOTO UPLOAD
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

            window.currentUser.photo = photoBase64;
            var userIdx = (window.users || []).findIndex(function(u) {
                return u && u.user && u.user.toLowerCase() === window.currentUser.user.toLowerCase();
            });
            if (userIdx !== -1) {
                window.users[userIdx].photo = photoBase64;
            }

            saveAll();
            localStorage.setItem('ot_auth_live', JSON.stringify(window.currentUser));

            var topAvatar = document.getElementById('topAvatar');
            var profPreview = document.getElementById('profPhotoPreview');
            if (topAvatar) topAvatar.src = photoBase64;
            if (profPreview) profPreview.src = photoBase64;

            if (window.supabaseClient) {
                try {
                    await window.supabaseClient.from('profiles').update({ photo: photoBase64 }).eq('user_code', window.currentUser.user);
                } catch (err) {}
            }

            showToast('ສຳເລັດ', 'ອັບເດດຮູບໂປຣໄຟລ໌ ແລະ Sync ລົງ Supabase ແລ້ວ!', 'success');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}
window.handlePhotoUploadAndCompress = handlePhotoUploadAndCompress;

// 5. UPDATE PROFILE
async function handleUpdateProfile() {
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

    if (pass) window.currentUser.pass = pass;
    window.currentUser.fullName = name;
    window.currentUser.dept = dept;
    window.currentUser.phone = phone;

    var idx = (window.users || []).findIndex(function(u) {
        return u && u.user && u.user.toLowerCase() === window.currentUser.user.toLowerCase();
    });
    if (idx !== -1) {
        window.users[idx] = Object.assign({}, window.users[idx], { fullName: name, dept: dept, phone: phone, pass: pass || window.users[idx].pass });
    }

    saveAll();
    localStorage.setItem('ot_auth_live', JSON.stringify(window.currentUser));

    if (window.supabaseClient) {
        try {
            var updatePayload = { full_name: name, dept: dept, phone: phone };
            if (pass) { updatePayload.pass = pass; updatePayload.password = pass; }
            await window.supabaseClient.from('profiles').update(updatePayload).eq('user_code', window.currentUser.user);
        } catch (e) {}
    }

    if (typeof window.checkAuth === 'function') window.checkAuth();
    if (typeof window.renderEmployeesTable === 'function') window.renderEmployeesTable();
    showToast('ສຳເລັດ', 'ອັບເດດໂປຣໄຟລ໌ ແລະ Sync ລົງ Supabase ແລ້ວ!', 'success');
}
window.handleUpdateProfile = handleUpdateProfile;

// 6. ANNUAL LEAVE BOOKING
async function handleBookAnnualLeave() {
    var start = document.getElementById('bookLeaveStart')?.value;
    var end = document.getElementById('bookLeaveEnd')?.value;
    var shift = document.getElementById('bookLeaveShiftSelect')?.value || 'ກະ 1 (08:00 - 16:00)';
    var reason = document.getElementById('bookLeaveReason')?.value.trim();
    if (!start || !end || !reason) { showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບ', 'error'); return; }

    var conflictingBooking = (window.annualBookings || []).find(function(b) {
        if (b.status === 'REJECTED') return false;
        if (b.user === window.currentUser.user) return false;
        if (b.shift !== shift && b.shift !== 'ທຸກກະ (All Shifts)') return false;
        return (start <= b.endDate && end >= b.startDate);
    });

    var bookingStatus = 'CONFIRMED';
    if (conflictingBooking) {
        var ok = confirm(`⚠️ ແຈ້ງເຕືອນ: ໃນກະ [${shift}] ວັນທີ ${conflictingBooking.startDate} ມີທ່ານ "${conflictingBooking.nameLao}" ລາພັກແລ້ວ!\n\n1 ກະສາມາດລາພັກໄດ້ສູງສຸດ 1 ທ່ານ. ທ່ານຕ້ອງການສົ່ງຄຳຂໍແບບ "ລໍຖ້າ Admin ອະນຸມັດພິເສດ" ແທ້ບໍ່?`);
        if (!ok) return;
        bookingStatus = 'PENDING_ADMIN';
    }

    var diffDays = Math.ceil(Math.abs(new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
    if (bookingStatus === 'CONFIRMED') {
        window.currentUser.usedAnnual = (window.currentUser.usedAnnual || 0) + diffDays;
        var idx = (window.users || []).findIndex(function(u) { return u.user.toLowerCase() === window.currentUser.user.toLowerCase(); });
        if (idx !== -1) window.users[idx].usedAnnual = window.currentUser.usedAnnual;
    }

    var newBooking = {
        id: Date.now(),
        user: window.currentUser.user,
        nameLao: window.currentUser.nameLao,
        startDate: start,
        endDate: end,
        shift: shift,
        days: diffDays,
        reason: reason,
        status: bookingStatus
    };

    if (!window.annualBookings) window.annualBookings = [];
    window.annualBookings.unshift(newBooking);

    saveAll();
    renderAnnualLeaveBookings();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();

    if (window.supabaseClient) {
        try {
            await window.supabaseClient.from('annual_bookings').insert([{
                user_code: window.currentUser.user,
                name_lao: window.currentUser.nameLao,
                start_date: start,
                end_date: end,
                shift: shift,
                days: diffDays,
                reason: reason,
                status: bookingStatus
            }]);
        } catch (e) {}
    }

    showToast(bookingStatus === 'PENDING_ADMIN' ? 'ແຈ້ງເຕືອນ' : 'ສຳເລັດ', 
              bookingStatus === 'PENDING_ADMIN' ? 'ຄຳຮ້ອງຂອງທ່ານລໍຖ້າ Admin ອະນຸມັດ (ມີຄົນລາພັກຊ້ອນ)' : 'ຈອງມື້ພັກສຳເລັດ!', 'success');
}
window.handleBookAnnualLeave = handleBookAnnualLeave;

function promptCancelAnnualLeave(bookingId) {
    var booking = (window.annualBookings || []).find(function(b) { return b.id === bookingId; });
    if (!booking) return;

    askConfirm('ຍົກເລີກການຈອງມື້ພັກ', `ທ່ານຕ້ອງການຍົກເລີກການຈອງມື້ພັກ ${booking.startDate} ຫາ ${booking.endDate} ແທ້ບໍ່?`, async function() {
        if (booking.status === 'CONFIRMED') {
            window.currentUser.usedAnnual = Math.max(0, (window.currentUser.usedAnnual || 0) - booking.days);
            var idx = (window.users || []).findIndex(function(u) { return u.user.toLowerCase() === window.currentUser.user.toLowerCase(); });
            if (idx !== -1) window.users[idx].usedAnnual = window.currentUser.usedAnnual;
        }

        window.annualBookings = (window.annualBookings || []).filter(function(b) { return b.id !== bookingId; });
        saveAll();
        renderAnnualLeaveBookings();

        if (window.supabaseClient) {
            try {
                await window.supabaseClient.from('annual_bookings').delete().eq('user_code', booking.user).eq('start_date', booking.startDate);
            } catch (e) {}
        }
        showToast('ສຳເລັດ', 'ຍົກເລີກການຈອງມື້ພັກຮຽບຮ້ອຍແລ້ວ!', 'success');
    }, 'delete', 'ຍົກເລີກມື້ພັກ');
}
window.promptCancelAnnualLeave = promptCancelAnnualLeave;

function renderAnnualLeaveBookings() {
    var tbody = document.getElementById('annualLeaveBookingsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    var bookings = window.annualBookings || [];
    if (bookings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400 font-lao">ຍັງບໍ່ມີລາຍການຈອງມື້ພັກປະຈຳປີ</td></tr>`;
        return;
    }

    bookings.forEach(function(b) {
        var isMyBooking = (b.user === window.currentUser?.user || b.nameLao === window.currentUser?.nameLao) || (window.currentUser?.role === 'SUPER_ADMIN');
        var isAdmin = (window.currentUser?.role === 'SUPER_ADMIN');

        var statusBadge = b.status === 'CONFIRMED' ? `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">ອະນຸມັດແລ້ວ</span>` 
            : `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 animate-pulse">⚠️ ລໍຖ້າ Admin (ພັກຊ້ອນ)</span>`;

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 font-lao">
                <td class="p-3 font-bold text-brand-red">${b.nameLao}</td>
                <td class="p-3 text-slate-700">${b.startDate} ຫາ ${b.endDate}</td>
                <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border">${b.shift || 'ກະ 1'}</span></td>
                <td class="p-3 font-bold">${b.days} ມື້</td>
                <td class="p-3 text-slate-500">${b.reason}</td>
                <td class="p-3 text-right">
                    <div class="flex items-center justify-end gap-2">
                        ${statusBadge}
                        ${(isAdmin && b.status === 'PENDING_ADMIN') ? `<button type="button" onclick="adminApproveLeave(${b.id})" class="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold shadow">ອະນຸມັດ</button>` : ''}
                        ${isMyBooking ? `<button type="button" onclick="promptCancelAnnualLeave(${b.id})" class="text-brand-red hover:underline font-bold text-xs">ຍົກເລີກ</button>` : ''}
                    </div>
                </td>
            </tr>
        `;
    });
}
window.renderAnnualLeaveBookings = renderAnnualLeaveBookings;

async function adminApproveLeave(id) {
    var b = (window.annualBookings || []).find(function(item) { return item.id === id; });
    if (!b) return;

    b.status = 'CONFIRMED';
    var userObj = (window.users || []).find(function(u) { return u.user === b.user || u.nameLao === b.nameLao; });
    if (userObj) userObj.usedAnnual = (userObj.usedAnnual || 0) + b.days;

    saveAll();
    renderAnnualLeaveBookings();

    if (window.supabaseClient) {
        try {
            await window.supabaseClient.from('annual_bookings').update({ status: 'CONFIRMED' }).eq('user_code', b.user).eq('start_date', b.startDate);
        } catch (e) {}
    }
    showToast('ອະນຸມັດແລ້ວ', `Admin ໄດ້ອະນຸມັດໃຫ້ "${b.nameLao}" ລາພັກແລ້ວ`, 'success');
}
window.adminApproveLeave = adminApproveLeave;

// 7. P2P SHIFT SWAP
async function handleCreateSwap() {
    var start = document.getElementById('swapDateStart')?.value;
    var end = document.getElementById('swapDateEnd')?.value;
    var toName = document.getElementById('swapTargetPeer')?.value;
    var fromShift = document.getElementById('swapMyShift')?.value;
    var toShift = document.getElementById('swapTargetShift')?.value;
    var reason = document.getElementById('swapReason')?.value.trim();
    if (!start || !end || !toName) { showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາເລືອກຂໍ້ມູນໃຫ້ຄົບ', 'error'); return; }

    var newSwap = {
        id: Date.now(),
        fromName: window.currentUser.nameLao,
        toName: toName,
        startDate: start,
        endDate: end,
        fromShift: fromShift,
        toShift: toShift,
        reason: reason,
        status: 'PENDING',
        createdAt: new Date().toLocaleString('lo-LA')
    };

    if (!window.swapHistory) window.swapHistory = [];
    window.swapHistory.unshift(newSwap);

    saveAll();
    renderSwapHistory();

    if (window.supabaseClient) {
        try {
            await window.supabaseClient.from('shift_swaps').insert([{
                from_name: window.currentUser.nameLao,
                to_name: toName,
                start_date: start,
                end_date: end,
                from_shift: fromShift,
                to_shift: toShift,
                reason: reason,
                status: 'PENDING'
            }]);
        } catch (e) {}
    }

    showToast('ສຳເລັດ', `ສົ່ງຄຳຮ້ອງຂໍປ່ຽນກະຫາ "${toName}" ແລ້ວ!`, 'success');
}
window.handleCreateSwap = handleCreateSwap;

function promptCancelSwap(swapId) {
    askConfirm('ຍົກເລີກຄຳຮ້ອງຂໍປ່ຽນກະ', 'ທ່ານຕ້ອງການຍົກເລີກຄຳຮ້ອງຂໍປ່ຽນກະນີ້ແທ້ບໍ່?', async function() {
        var swapObj = (window.swapHistory || []).find(function(s) { return s.id === swapId; });
        window.swapHistory = (window.swapHistory || []).filter(function(s) { return s.id !== swapId; });
        saveAll();
        renderSwapHistory();

        if (window.supabaseClient && swapObj) {
            try {
                await window.supabaseClient.from('shift_swaps').delete().eq('from_name', swapObj.fromName).eq('start_date', swapObj.startDate);
            } catch (e) {}
        }
        showToast('ສຳເລັດ', 'ຍົກເລີກຄຳຮ້ອງຂໍປ່ຽນກະແລ້ວ', 'success');
    }, 'delete', 'ຍົກເລີກ');
}
window.promptCancelSwap = promptCancelSwap;

function renderSwapHistory() {
    var container = document.getElementById('incomingSwapsList');
    if (!container) return;
    container.innerHTML = '';

    var history = window.swapHistory || [];
    if (history.length === 0) {
        container.innerHTML = `<p class="text-slate-400 text-xs italic py-3 text-center font-lao">ຍັງບໍ່ມີປະຫວັດການຂໍປ່ຽນກະ</p>`;
        return;
    }

    history.forEach(function(req) {
        var isForMe = req.toName === window.currentUser?.nameLao && req.status === 'PENDING';
        var isCreatedByMe = req.fromName === window.currentUser?.nameLao && req.status === 'PENDING';
        var statusBadge = req.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : (req.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200');

        container.innerHTML += `
            <div class="p-3.5 bg-slate-50 border rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 font-lao">
                <div class="space-y-0.5">
                    <p class="font-bold text-slate-800 text-xs">${req.fromName} ຂໍແລກປ່ຽນກະກັບ ${req.toName}</p>
                    <p class="text-slate-500 text-[11px]">ຊ່ວງວັນທີ: <strong>${req.startDate} ຫາ ${req.endDate}</strong> | ${req.fromShift} ↔ ${req.toShift}</p>
                    ${req.reason ? `<p class="text-slate-400 text-[10px] italic">"${req.reason}"</p>` : ''}
                </div>
                <div class="flex items-center gap-2">
                    ${isForMe ? `
                        <button type="button" onclick="acceptSwap(${req.id})" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition">ຍອມຮັບ (Accept)</button>
                        <button type="button" onclick="declineSwap(${req.id})" class="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold">ປະຕິເສດ</button>
                    ` : (isCreatedByMe ? `
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}">ລໍຖ້າຕອບຮັບ</span>
                        <button type="button" onclick="promptCancelSwap(${req.id})" class="text-brand-red font-bold text-xs hover:underline">ຍົກເລີກ</button>
                    ` : `<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}">${req.status}</span>`)}
                </div>
            </div>
        `;
    });
}
window.renderSwapHistory = renderSwapHistory;

async function acceptSwap(id) {
    var req = (window.swapHistory || []).find(function(r) { return r.id === id; });
    if (!req) return;

    req.status = 'COMPLETED';
    var startD = new Date(req.startDate);
    var endD = new Date(req.endDate);
    var sheet = (typeof getActiveSheet === 'function') ? getActiveSheet() : null;

    for (var d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
        var dStr = d.toISOString().split('T')[0];
        if (sheet?.data?.[dStr]) {
            var sFrom = sheet.data[dStr][req.fromShift] || [];
            var sTo = sheet.data[dStr][req.toShift] || [];

            var idxFrom = sFrom.indexOf(req.fromName);
            var idxTo = sTo.indexOf(req.toName);

            if (idxFrom !== -1) sFrom[idxFrom] = req.toName;
            if (idxTo !== -1) sTo[idxTo] = req.fromName;
        }
    }

    saveAll();
    renderSwapHistory();
    renderUserCurrentWeekWorkspace();
    if (typeof window.renderScheduleTable === 'function') window.renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();

    if (window.supabaseClient) {
        try {
            await window.supabaseClient.from('shift_swaps').update({ status: 'COMPLETED' }).eq('from_name', req.fromName).eq('start_date', req.startDate);
        } catch (e) {}
    }
    showToast('ສຳເລັດ', `ສັບປ່ຽນກະລະຫວ່າງ ${req.fromName} ແລະ ${req.toName} ສຳເລັດແລ້ວ!`, 'success');
}
window.acceptSwap = acceptSwap;

async function declineSwap(id) {
    var req = (window.swapHistory || []).find(function(r) { return r.id === id; });
    if (req) req.status = 'DECLINED';
    saveAll();
    renderSwapHistory();
    if (window.supabaseClient && req) {
        try {
            await window.supabaseClient.from('shift_swaps').update({ status: 'DECLINED' }).eq('from_name', req.fromName).eq('start_date', req.startDate);
        } catch (e) {}
    }
    showToast('ປະຕິເສດແລ້ວ', 'ປະຕິເສດຄຳຮ້ອງຂໍປ່ຽນກະ', 'info');
}
window.declineSwap = declineSwap;

// ================= ⭐ PROFILE, LEAVE & P2P SHIFT SWAP HUB =================

function renderAdminAllStaffReport() {
    if (!window.currentUser || window.currentUser.role !== 'SUPER_ADMIN') return;

    var sheet = getActiveSheet();
    var matrixTbody = document.getElementById('adminAllStaffMatrixReportBody');
    var auditTbody = document.getElementById('adminScheduleAuditTableBody');

    var staffList = window.users.filter(u => u.role !== 'SUPER_ADMIN');
    document.getElementById('adminMetricStaffCount').innerText = `${staffList.length} ທ່ານ`;
    document.getElementById('adminMetricSwapCount').innerText = `${(window.swapHistory || []).length} ລາຍການ`;

    var totalLeavesCount = 0;
    var totalDutyCount = 0;

    var stats = {};
    staffList.forEach(u => {
        var usedL = u.usedAnnual || 0;
        totalLeavesCount += usedL;
        stats[u.nameLao] = { ...u, s1: 0, s2: 0, s3: 0, totalDuty: 0 };
    });

    document.getElementById('adminMetricLeaveCount').innerText = `${totalLeavesCount} ມື້`;

    var schedData = sheet.data || {};
    Object.values(schedData).forEach(day => {
        (day.shift1 || []).forEach(n => { if (stats[n]) { stats[n].s1++; stats[n].totalDuty++; totalDutyCount++; } });
        (day.shift2 || []).forEach(n => { if (stats[n]) { stats[n].s2++; stats[n].totalDuty++; totalDutyCount++; } });
        (day.shift3 || []).forEach(n => { if (stats[n]) { stats[n].s3++; stats[n].totalDuty++; totalDutyCount++; } });
    });

    document.getElementById('adminMetricDutyCount').innerText = `${totalDutyCount} ກະ`;

    if (matrixTbody) {
        matrixTbody.innerHTML = '';
        Object.values(stats).forEach(st => {
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

    if (auditTbody) {
        auditTbody.innerHTML = '';
        if ((window.scheduleAuditLogs || []).length === 0) {
            auditTbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400">ຍັງບໍ່ມີປະຫວັດການແກ້ໄຂຕາຕະລາງຫຼັງ Publish</td></tr>`;
        } else {
            window.scheduleAuditLogs.forEach(log => {
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
}

// ⭐ STAFF PERSONAL WORKSPACE
function renderUserCurrentWeekWorkspace() {
    if (!window.currentUser) return;
    var sheet = getActiveSheet();
    var titleEl = document.getElementById('userCurrentShiftTitle');
    var pillsContainer = document.getElementById('userWeekDaysPills');
    if (!titleEl || !pillsContainer) return;

    var myName = window.currentUser.nameLao;
    pillsContainer.innerHTML = '';
    var [y, m] = sheet.monthKey.split('-').map(Number);
    var myShifts = [];

    for (var i = 1; i <= 7; i++) {
        var dNum = i < 10 ? '0' + i : '' + i;
        var mNum = m < 10 ? '0' + m : '' + m;
        var dStr = `${y}-${mNum}-${dNum}`;
        var dInfo = sheet.data?.[dStr] || {};
        var shift = 'ພັກ (OFF)';
        var pillClass = 'bg-slate-100 text-slate-500';

        if (dInfo.shift1?.includes(myName)) { shift = 'ກະ 1'; pillClass = 'bg-red-50 text-brand-red font-bold border-red-200'; myShifts.push('ກະ 1 (08:00 - 16:00)'); }
        else if (dInfo.shift2?.includes(myName)) { shift = 'ກະ 2'; pillClass = 'bg-purple-50 text-purple-800 font-bold border-purple-200'; myShifts.push('ກະ 2 (12:00 - 20:00)'); }
        else if (dInfo.shift3?.includes(myName)) { shift = 'ກະ 3'; pillClass = 'bg-slate-800 text-white font-bold'; myShifts.push('ກະ 3 (20:00 - 08:00)'); }

        pillsContainer.innerHTML += `
            <div class="px-2.5 py-1 border rounded-lg text-center text-[10px] ${pillClass}">
                <div class="font-bold">${i}/${mNum}</div>
                <div>${shift}</div>
            </div>
        `;
    }

    titleEl.innerText = myShifts.length > 0 ? `ອາທິດນີ້: ${myShifts[0]}` : 'ອາທິດນີ້: ພັກຜ່ອນ (OFF)';

    // Populates Swap Peer Dropdown
    var peerSelect = document.getElementById('swapTargetPeer');
    if (peerSelect) {
        peerSelect.innerHTML = '';
        window.users.filter(u => u.nameLao !== window.currentUser.nameLao && u.role !== 'SUPER_ADMIN').forEach(u => {
            peerSelect.innerHTML += `<option value="${u.nameLao}">${u.nameLao} (${u.fullName})</option>`;
        });
    }

    renderAnnualLeaveBookings();
    renderSwapHistory();
}

function handlePhotoUploadAndCompress(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
            var canvas = document.createElement('canvas');
            var max = 200;
            var w = img.width, h = img.height;
            if (w > h) { if (w > max) { h = Math.round((h * max) / w); w = max; } }
            else { if (h > max) { w = Math.round((w * max) / h); h = max; } }
            canvas.width = w; canvas.height = h;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            window.currentUser.photo = canvas.toDataURL('image/jpeg', 0.75);
            saveAll();
            checkAuth();
            showToast('ສຳເລັດ', 'ອັບເດດຮູບໂປຣໄຟລ໌ຮຽບຮ້ອຍ', 'success');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function handleUpdateProfile() {
    var name = document.getElementById('profNameInput').value.trim();
    var pass = document.getElementById('profPassInput').value.trim();
    if (!name) { showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາໃສ່ຊື່ເຕັມ', 'error'); return; }
    window.currentUser.fullName = name;
    if (pass) window.currentUser.pass = pass;
    var idx = window.users.findIndex(u => u.user === window.currentUser.user);
    if (idx !== -1) window.users[idx] = { ...window.users[idx], fullName: name, pass: pass || window.users[idx].pass };
    saveAll();
    checkAuth();
    showToast('ສຳເລັດ', 'ອັບເດດໂປຣໄຟລ໌ຮຽບຮ້ອຍ', 'success');
}

// 1. ຈອງມື້ພັກປະຈຳປີ (Book Annual Leave)
function handleBookAnnualLeave() {
    var start = document.getElementById('bookLeaveStart').value;
    var end = document.getElementById('bookLeaveEnd').value;
    var reason = document.getElementById('bookLeaveReason').value.trim();
    if (!start || !end || !reason) { showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບ', 'error'); return; }

    var diffDays = Math.ceil(Math.abs(new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
    window.currentUser.usedAnnual = (window.currentUser.usedAnnual || 0) + diffDays;
    var idx = window.users.findIndex(u => u.user === window.currentUser.user);
    if (idx !== -1) window.users[idx].usedAnnual = window.currentUser.usedAnnual;

    if (!window.annualBookings) window.annualBookings = [];
    window.annualBookings.unshift({
        id: Date.now(),
        user: window.currentUser.user,
        nameLao: window.currentUser.nameLao,
        startDate: start,
        endDate: end,
        days: diffDays,
        reason: reason,
        status: 'CONFIRMED'
    });

    saveAll();
    renderAnnualLeaveBookings();
    showToast('ສຳເລັດ', `ຈອງມື້ພັກ ${diffDays} ມື້ສຳເລັດ!`, 'success');
}

function renderAnnualLeaveBookings() {
    var tbody = document.getElementById('annualLeaveBookingsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    var bookings = window.annualBookings || [
        { id: 1, nameLao: 'ແສງດາວ', startDate: '2026-10-12', endDate: '2026-10-15', days: 3, reason: 'ພັກຜ່ອນປະຈຳປີ', status: 'CONFIRMED' }
    ];

    bookings.forEach(b => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 font-lao">
                <td class="p-3 font-bold text-brand-red">${b.nameLao}</td>
                <td class="p-3 text-slate-700">${b.startDate} ຫາ ${b.endDate}</td>
                <td class="p-3 font-bold">${b.days} ມື້</td>
                <td class="p-3 text-slate-500">${b.reason}</td>
                <td class="p-3 text-right"><span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">${b.status}</span></td>
            </tr>
        `;
    });
}

// 2. ⭐ ຟອມຂໍປ່ຽນກະ (P2P Shift Swap)
function handleCreateSwap() {
    var start = document.getElementById('swapDateStart').value;
    var end = document.getElementById('swapDateEnd').value;
    var toName = document.getElementById('swapTargetPeer').value;
    var fromShift = document.getElementById('swapMyShift').value;
    var toShift = document.getElementById('swapTargetShift').value;
    var reason = document.getElementById('swapReason').value.trim();
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

    // ສົ່ງແຈ້ງເຕືອນຫາເພື່ອນຮ່ວມງານ
    if (!window.systemNotifications) window.systemNotifications = [];
    window.systemNotifications.unshift({
        id: Date.now(),
        title: `ມີຄຳຮ້ອງຂໍປ່ຽນກະໃໝ່!`,
        message: `${window.currentUser.nameLao} ຂໍປ່ຽນກະນຳທ່ານ (${start} ຫາ ${end})`,
        tag: 'Swap Request',
        date: new Date().toLocaleString('lo-LA'),
        readBy: [window.currentUser.user]
    });

    saveAll();
    renderSwapHistory();
    if (typeof window.updateNotificationBadge === 'function') window.updateNotificationBadge();
    showToast('ສຳເລັດ', `ສົ່ງຄຳຮ້ອງຂໍປ່ຽນກະຫາ "${toName}" ແລ້ວ!`, 'success');
}

function renderSwapHistory() {
    var container = document.getElementById('incomingSwapsList');
    if (!container) return;
    container.innerHTML = '';

    var history = window.swapHistory || [];
    if (history.length === 0) {
        container.innerHTML = `<p class="text-slate-400 text-xs italic py-2">ຍັງບໍ່ມີປະຫວັດການຂໍປ່ຽນກະ</p>`;
        return;
    }

    history.forEach(req => {
        var isForMe = req.toName === window.currentUser?.nameLao && req.status === 'PENDING';
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
                        <button type="button" onclick="declineSwap(${req.id})" class="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition">ປະຕິເສດ</button>
                    ` : `
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}">${req.status}</span>
                    `}
                </div>
            </div>
        `;
    });
}

// 3. ⭐ ຍອມຮັບການປ່ຽນກະ (Accept Swap -> ສັບປ່ຽນຕາຕະລາງອັດຕະໂນມັດທັນທີ)
function acceptSwap(id) {
    var req = (window.swapHistory || []).find(r => r.id === id);
    if (!req) return;

    req.status = 'COMPLETED';

    var startD = new Date(req.startDate);
    var endD = new Date(req.endDate);
    var sheet = getActiveSheet();

    // ສັບປ່ຽນຊື່ພະນັກງານທັງ 2 ຄົນໃນຕາຕະລາງອັດຕະໂນມັດ
    for (var d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
        var dStr = d.toISOString().split('T')[0];

        if (sheet.data[dStr]) {
            var sFrom = sheet.data[dStr][req.fromShift] || [];
            var sTo = sheet.data[dStr][req.toShift] || [];

            var idxFrom = sFrom.indexOf(req.fromName);
            var idxTo = sTo.indexOf(req.toName);

            if (idxFrom !== -1) sFrom[idxFrom] = req.toName;
            if (idxTo !== -1) sTo[idxTo] = req.fromName;
        }
    }

    // ບັນທຶກ Audit Log
    if (!window.scheduleAuditLogs) window.scheduleAuditLogs = [];
    window.scheduleAuditLogs.unshift({
        id: Date.now(),
        sheetId: sheet.id,
        sheetTitle: sheet.title,
        date: `${req.startDate} ຫາ ${req.endDate}`,
        shift: `${req.fromShift} ↔ ${req.toShift}`,
        oldName: req.fromName,
        newName: req.toName,
        reason: `P2P Swap ຍອມຮັບໂດຍ ${req.toName}`,
        adminName: 'P2P System',
        timestamp: new Date().toLocaleString('lo-LA')
    });

    saveAll();
    renderSwapHistory();
    renderUserCurrentWeekWorkspace();
    if (typeof window.renderScheduleTable === 'function') window.renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    showToast('ປ່ຽນກະສຳເລັດ', `ສັບປ່ຽນກະປະຈຳການລະຫວ່າງ ${req.fromName} ແລະ ${req.toName} ຮຽບຮ້ອຍແລ້ວ!`, 'success');
}

function declineSwap(id) {
    var req = (window.swapHistory || []).find(r => r.id === id);
    if (req) req.status = 'DECLINED';
    saveAll();
    renderSwapHistory();
    showToast('ປະຕິເສດແລ້ວ', 'ປະຕິເສດຄຳຮ້ອງຂໍປ່ຽນກະ', 'info');
}

// 4. ⭐ FAIRNESS MODAL & HANDLERS
window.openFairnessSummaryModal = function() {
    var groupSelect = document.getElementById('fairnessGroupFilterSelect');
    if (groupSelect) {
        groupSelect.innerHTML = `<option value="ALL">ພະນັກງານທັງໝົດ (All Staff)</option>`;
        (window.employeeGroups || []).forEach(grp => {
            groupSelect.innerHTML += `<option value="${grp.id}">${grp.name} (${grp.members.length} ຄົນ)</option>`;
        });
    }
    renderFairnessSummaryData();
    var modal = document.getElementById('fairnessModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
};

window.closeFairnessSummaryModal = function() {
    var modal = document.getElementById('fairnessModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
};

function renderFairnessSummaryData() {
    var sheet = getActiveSheet();
    var tbody = document.getElementById('fairnessSummaryTableBody');
    var filterId = document.getElementById('fairnessGroupFilterSelect')?.value || 'ALL';
    if (!tbody) return;
    tbody.innerHTML = '';

    document.getElementById('fairnessModalSub').innerText = `ຕາຕະລາງ: ${sheet.title}`;

    var targetMembers = null;
    if (filterId !== 'ALL') {
        var foundGrp = (window.employeeGroups || []).find(g => g.id === filterId);
        if (foundGrp) targetMembers = foundGrp.members;
    } else {
        var activeWorkers = new Set();
        Object.values(sheet.data || {}).forEach(day => {
            [...(day.shift1 || []), ...(day.shift2 || []), ...(day.shift3 || [])].forEach(n => {
                if (n) activeWorkers.add(n);
            });
        });
        if (activeWorkers.size > 0 && activeWorkers.size < 20) {
            targetMembers = Array.from(activeWorkers);
        }
    }

    var staffStats = {};
    window.users.filter(u => u.role !== 'SUPER_ADMIN' && (!targetMembers || targetMembers.includes(u.nameLao))).forEach(u => {
        staffStats[u.nameLao] = { nameLao: u.nameLao, isLeader: u.isLeader, s1: 0, s2: 0, s3: 0, offDays: 0, total: 0 };
    });

    var [year, month] = sheet.monthKey.split('-').map(Number);
    var daysCount = new Date(year, month, 0).getDate();

    for (var d = 1; d <= daysCount; d++) {
        var dNum = d < 10 ? '0' + d : '' + d;
        var mNum = month < 10 ? '0' + month : '' + month;
        var dStr = `${year}-${mNum}-${dNum}`;
        var dayInfo = sheet.data?.[dStr] || { shift1: [], shift2: [], shift3: [] };

        Object.keys(staffStats).forEach(name => {
            if (dayInfo.shift1?.includes(name)) { staffStats[name].s1++; staffStats[name].total++; }
            else if (dayInfo.shift2?.includes(name)) { staffStats[name].s2++; staffStats[name].total++; }
            else if (dayInfo.shift3?.includes(name)) { staffStats[name].s3++; staffStats[name].total++; }
            else { staffStats[name].offDays++; }
        });
    }

    var index = 1;
    Object.values(staffStats).forEach(stat => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 font-lao">
                <td class="p-3 font-semibold text-slate-400">${index++}</td>
                <td class="p-3 font-bold ${stat.isLeader ? 'text-brand-red' : 'text-slate-800'}">
                    ${stat.nameLao} ${stat.isLeader ? '<span class="text-[9px] bg-red-50 text-brand-red px-1.5 py-0.5 rounded ml-1 border border-red-200">ຫົວໜ້າ</span>' : ''}
                </td>
                <td class="p-3 text-center font-semibold text-slate-700">${stat.s1}</td>
                <td class="p-3 text-center font-semibold text-purple-700">${stat.s2}</td>
                <td class="p-3 text-center font-bold text-brand-red bg-red-50/40">${stat.s3}</td>
                <td class="p-3 text-center font-bold text-emerald-700 bg-emerald-50/40">${stat.offDays} ວັນ</td>
                <td class="p-3 text-right font-bold text-slate-800">${stat.total} ກະ</td>
            </tr>
        `;
    });
}

// ຜູກທຸກ Function ເຂົ້າ window
window.renderAdminAllStaffReport = renderAdminAllStaffReport;
window.renderUserCurrentWeekWorkspace = renderUserCurrentWeekWorkspace;
window.handlePhotoUploadAndCompress = handlePhotoUploadAndCompress;
window.handleUpdateProfile = handleUpdateProfile;
window.handleBookAnnualLeave = handleBookAnnualLeave;
window.renderAnnualLeaveBookings = renderAnnualLeaveBookings;
window.handleCreateSwap = handleCreateSwap;
window.renderSwapHistory = renderSwapHistory;
window.acceptSwap = acceptSwap;
window.declineSwap = declineSwap;

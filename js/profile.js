javascript
function renderAdminAllStaffReport() {
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') return;

    var sheet = getActiveSheet();
    var matrixTbody = document.getElementById('adminAllStaffMatrixReportBody');
    var swapTbody = document.getElementById('adminSwapAuditTableBody');

    var staffList = users.filter(u => u.role !== 'SUPER_ADMIN');
    document.getElementById('adminMetricStaffCount').innerText = `${staffList.length} ທ່ານ`;
    document.getElementById('adminMetricSwapCount').innerText = `${swapHistory.length} ລາຍການ`;

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

    // 1. Render Matrix Table
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

    // 2. Render Swap Audit Table
    if (swapTbody) {
        swapTbody.innerHTML = '';
        if (swapHistory.length === 0) {
            swapTbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">ບໍ່ມີລາຍການຂໍປ່ຽນກະ</td></tr>`;
        } else {
            swapHistory.forEach(sw => {
                var statusClass = sw.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : (sw.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200');
                swapTbody.innerHTML += `
                    <tr class="hover:bg-slate-50 font-lao">
                        <td class="p-3 font-bold text-slate-800">${sw.fromName} ↔ ${sw.toName}</td>
                        <td class="p-3 text-slate-600">${sw.startDate} ຫາ ${sw.endDate}</td>
                        <td class="p-3 text-slate-700 font-medium">${sw.fromShift} ↔ ${sw.toShift}</td>
                        <td class="p-3 text-slate-500">${sw.reason || '-'}</td>
                        <td class="p-3 text-right"><span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusClass}">${sw.status}</span></td>
                    </tr>
                `;
            });
        }
    }
}

function renderUserCurrentWeekWorkspace() {
    if (!currentUser) return;
    var sheet = getActiveSheet();
    var titleEl = document.getElementById('userCurrentShiftTitle');
    var pillsContainer = document.getElementById('userWeekDaysPills');
    if (!titleEl || !pillsContainer) return;

    var myName = currentUser.nameLao;
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

    var peerSelect = document.getElementById('swapTargetPeer');
    if (peerSelect) {
        peerSelect.innerHTML = '';
        users.filter(u => u.nameLao !== currentUser.nameLao && u.role !== 'SUPER_ADMIN').forEach(u => {
            peerSelect.innerHTML += `<option value="${u.nameLao}">${u.nameLao} (${u.fullName})</option>`;
        });
    }
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
            currentUser.photo = canvas.toDataURL('image/jpeg', 0.75);
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
    currentUser.fullName = name;
    if (pass) currentUser.pass = pass;
    var idx = users.findIndex(u => u.user === currentUser.user);
    if (idx !== -1) users[idx] = { ...users[idx], fullName: name, pass: pass || users[idx].pass };
    saveAll();
    checkAuth();
    showToast('ສຳເລັດ', 'ອັບເດດໂປຣໄຟລ໌ຮຽບຮ້ອຍ', 'success');
}

function handleBookAnnualLeave() {
    var start = document.getElementById('bookLeaveStart').value;
    var end = document.getElementById('bookLeaveEnd').value;
    var reason = document.getElementById('bookLeaveReason').value.trim();
    if (!start || !end || !reason) { showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບ', 'error'); return; }

    var diffDays = Math.ceil(Math.abs(new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
    currentUser.usedAnnual = (currentUser.usedAnnual || 0) + diffDays;
    var idx = users.findIndex(u => u.user === currentUser.user);
    if (idx !== -1) users[idx].usedAnnual = currentUser.usedAnnual;
    saveAll();
    showToast('ສຳເລັດ', `ຈອງມື້ພັກ ${diffDays} ມື້ສຳເລັດ!`, 'success');
    renderUserCurrentWeekWorkspace();
}

function handleCreateSwap() {
    var start = document.getElementById('swapDateStart').value;
    var end = document.getElementById('swapDateEnd').value;
    var toName = document.getElementById('swapTargetPeer').value;
    var fromShift = document.getElementById('swapMyShift').value;
    var toShift = document.getElementById('swapTargetShift').value;
    var reason = document.getElementById('swapReason').value.trim();
    if (!start || !end || !toName) { showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາເລືອກຂໍ້ມູນໃຫ້ຄົບ', 'error'); return; }

    swapHistory.unshift({
        id: Date.now(),
        fromName: currentUser.nameLao,
        toName: toName,
        startDate: start,
        endDate: end,
        fromShift: fromShift,
        toShift: toShift,
        reason: reason,
        status: 'PENDING'
    });
    saveAll();
    showToast('ສຳເລັດ', `ສົ່ງຄຳຮ້ອງຂໍປ່ຽນກະຫາ "${toName}" ແລ້ວ!`, 'success');
}

function openFairnessSummaryModal() {
    var groupSelect = document.getElementById('fairnessGroupFilterSelect');
    if (groupSelect) {
        groupSelect.innerHTML = `<option value="ALL">⭐ ພະນັກງານທັງໝົດ (All Staff)</option>`;
        employeeGroups.forEach(grp => {
            groupSelect.innerHTML += `<option value="${grp.id}">👥 ${grp.name}</option>`;
        });
    }
    renderFairnessSummaryData();
    document.getElementById('fairnessModal').classList.remove('hidden');
}

function renderFairnessSummaryData() {
    var sheet = getActiveSheet();
    var tbody = document.getElementById('fairnessSummaryTableBody');
    var filterId = document.getElementById('fairnessGroupFilterSelect')?.value || 'ALL';
    if (!tbody) return;
    tbody.innerHTML = '';

    document.getElementById('fairnessModalSub').innerText = `ຕາຕະລາງ: ${sheet.title}`;

    var targetMembers = null;
    if (filterId !== 'ALL') {
        var foundGrp = employeeGroups.find(g => g.id === filterId);
        if (foundGrp) targetMembers = foundGrp.members;
    }

    var staffStats = {};
    users.filter(u => u.role !== 'SUPER_ADMIN' && (!targetMembers || targetMembers.includes(u.nameLao))).forEach(u => {
        staffStats[u.nameLao] = { nameLao: u.nameLao, isLeader: u.isLeader, s1: 0, s2: 0, s3: 0, weekendOff: 0, total: 0 };
    });

    var [year, month] = sheet.monthKey.split('-').map(Number);
    var daysCount = new Date(year, month, 0).getDate();

    var weekendDays = [];
    for (var d = 1; d <= daysCount; d++) {
        var dateObj = new Date(year, month - 1, d);
        if (dateObj.getDay() === 0 || dateObj.getDay() === 6) {
            var dNum = d < 10 ? '0' + d : '' + d;
            var mNum = month < 10 ? '0' + month : '' + month;
            weekendDays.push(`${year}-${mNum}-${dNum}`);
        }
    }

    for (var d = 1; d <= daysCount; d++) {
        var dNum = d < 10 ? '0' + d : '' + d;
        var mNum = month < 10 ? '0' + month : '' + month;
        var dStr = `${year}-${mNum}-${dNum}`;
        var dayInfo = sheet.data[dStr];
        if (dayInfo) {
            (dayInfo.shift1 || []).forEach(name => { if (staffStats[name]) { staffStats[name].s1++; staffStats[name].total++; } });
            (dayInfo.shift2 || []).forEach(name => { if (staffStats[name]) { staffStats[name].s2++; staffStats[name].total++; } });
            (dayInfo.shift3 || []).forEach(name => { if (staffStats[name]) { staffStats[name].s3++; staffStats[name].total++; } });
        }
    }

    weekendDays.forEach(wDate => {
        var dayInfo = sheet.data[wDate] || { shift1: [], shift2: [], shift3: [] };
        var workingToday = [...(dayInfo.shift1 || []), ...(dayInfo.shift2 || []), ...(dayInfo.shift3 || [])];
        Object.keys(staffStats).forEach(name => {
            if (!workingToday.includes(name)) {
                staffStats[name].weekendOff++;
            }
        });
    });

    var index = 1;
    Object.values(staffStats).forEach(stat => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-50">
                <td class="p-3 font-semibold text-slate-400">${index++}</td>
                <td class="p-3 font-bold ${stat.isLeader ? 'text-brand-red' : 'text-slate-800'}">
                    ${stat.nameLao} ${stat.isLeader ? '<span class="text-[9px] bg-red-50 text-brand-red px-1.5 py-0.5 rounded ml-1 border border-red-200">ຫົວໜ້າ</span>' : ''}
                </td>
                <td class="p-3 text-center">${stat.s1}</td>
                <td class="p-3 text-center">${stat.s2}</td>
                <td class="p-3 text-center font-bold text-brand-red bg-red-50/40">${stat.s3}</td>
                <td class="p-3 text-center font-bold text-emerald-700 bg-emerald-50/40">${stat.weekendOff} ວັນ</td>
                <td class="p-3 text-right font-bold text-slate-800">${stat.total} ກະ</td>
            </tr>
        `;
    });
}

function closeFairnessSummaryModal() { document.getElementById('fairnessModal').classList.add('hidden'); }

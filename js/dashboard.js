// ================= ⭐ DASHBOARD REAL-TIME MULTI-TEAM MONITOR & STAFF POPOVER =================

function getStaffAvatarUrl(name) {
    var u = (window.users || []).find(usr => usr.nameLao === name);
    if (u && u.photo) return u.photo;
    var bg = (u && u.isLeader) ? 'c01e2e' : '475569';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=64&bold=true`;
}

// ⭐ ສ້າງ Pill Card ພ້ອມ Event Onclick ເປີດ Popup Profile
function renderStaffPill(name, currentShift) {
    var u = (window.users || []).find(usr => usr.nameLao === name);
    var isLeader = u && u.isLeader;
    var avatarUrl = getStaffAvatarUrl(name);

    return `
        <div onclick="openStaffInfoModal('${name}', '${currentShift || ''}')" class="inline-flex items-center gap-1.5 p-0.5 pr-2.5 rounded-full border shadow-sm transition hover:scale-105 cursor-pointer active:scale-95 ${isLeader ? 'bg-red-50 border-red-200 text-brand-red font-bold' : 'bg-white border-slate-200 text-slate-700 font-medium'}" title="ກົດເພື່ອເບິ່ງຂໍ້ມູນພະນັກງານ">
            <img src="${avatarUrl}" class="w-5 h-5 rounded-full object-cover border ${isLeader ? 'border-brand-red' : 'border-slate-200'}" alt="${name}"/>
            <span class="text-xs leading-none">${name}</span>
            ${isLeader ? '<span class="w-1.5 h-1.5 rounded-full bg-brand-red ml-0.5" title="ຫົວໜ້າກະ"></span>' : ''}
        </div>
    `;
}

// ⭐ ຟັງຊັນເປີດ Modal Staff Profile
function openStaffInfoModal(name, currentShift) {
    var u = (window.users || []).find(usr => usr.nameLao === name);
    if (!u) return;

    var avatarUrl = getStaffAvatarUrl(name);
    var photoEl = document.getElementById('staffInfoModalPhoto');
    var leaderBadge = document.getElementById('staffInfoModalLeaderBadge');
    var callBtn = document.getElementById('staffInfoModalCallBtn');

    if (photoEl) photoEl.src = avatarUrl;
    if (leaderBadge) {
        if (u.isLeader) leaderBadge.classList.remove('hidden');
        else leaderBadge.classList.add('hidden');
    }

    document.getElementById('staffInfoModalName').innerText = `${u.nameLao} (${u.role === 'SUPER_ADMIN' ? 'Admin' : (u.isLeader ? 'ຫົວໜ້າກະ' : 'ພະນັກງານ')})`;
    document.getElementById('staffInfoModalFullName').innerText = u.fullName || '-';
    document.getElementById('staffInfoModalCode').innerText = u.user || 'BCEL0000';
    document.getElementById('staffInfoModalDept').innerText = u.dept || 'ຂະແໜງບໍລິການອອນລາຍ (Online Service Team)';
    document.getElementById('staffInfoModalPos').innerText = u.position || (u.isLeader ? 'ຫົວໜ້າກະປະຈຳການ (Shift Leader)' : 'ພະນັກງານບໍລິການລູກຄ້າ');
    
    var phone = u.phone || '020 5599 8877';
    document.getElementById('staffInfoModalPhone').innerText = phone;
    if (callBtn) callBtn.href = `tel:${phone.replace(/\s+/g, '')}`;

    var modal = document.getElementById('staffInfoModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    }
}

function closeStaffInfoModal() {
    var modal = document.getElementById('staffInfoModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
}

// Render ລາຍຊື່ທີມ
function renderDashMultiTeamStaff(containerId, teamGroups, shiftLabel) {
    var el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = '';

    if (teamGroups.length === 0) {
        el.innerHTML = `<span class="text-slate-400 text-xs italic py-2 block text-center">ບໍ່ມີຄົນປະຈຳການໃນວັນນີ້</span>`;
        return;
    }

    teamGroups.sort((a, b) => (b.hasLeader ? 1 : 0) - (a.hasLeader ? 1 : 0));

    teamGroups.forEach((tg, idx) => {
        tg.staff.sort((a, b) => {
            var la = window.users.find(u => u.nameLao === a)?.isLeader ? 1 : 0;
            var lb = window.users.find(u => u.nameLao === b)?.isLeader ? 1 : 0;
            return lb - la;
        });

        var pillsHtml = tg.staff.map(name => renderStaffPill(name, shiftLabel)).join(' ');
        
        el.innerHTML += `
            <div class="space-y-1.5 ${idx > 0 ? 'pt-2.5 border-t border-slate-100' : ''}">
                <div class="flex items-center justify-between">
                    <span class="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full ${tg.hasLeader ? 'bg-brand-red' : 'bg-slate-400'}"></span> ${tg.teamTitle}
                    </span>
                    <span class="text-[10px] font-semibold text-slate-400">${tg.staff.length} ຄົນ</span>
                </div>
                <div class="flex flex-wrap gap-1.5">${pillsHtml}</div>
            </div>
        `;
    });
}

function updateLiveShiftBadge(isWeekendOrHol) {
    var now = new Date();
    var currentHour = now.getHours() + (now.getMinutes() / 60);

    var c1 = document.getElementById('dashCard1');
    var c2 = document.getElementById('dashCard2');
    var c3 = document.getElementById('dashCard3');

    var b1 = document.getElementById('liveBadge1');
    var b2 = document.getElementById('liveBadge2');
    var b3 = document.getElementById('liveBadge3');

    var isS1 = false, isS2 = false, isS3 = false;

    if (isWeekendOrHol) {
        if (currentHour >= 8 && currentHour < 13.5) isS1 = true;
        else if (currentHour >= 13.5 && currentHour < 19) isS2 = true;
        else isS3 = true;
    } else {
        if (currentHour >= 8 && currentHour < 16) isS1 = true;
        if (currentHour >= 12 && currentHour < 20) isS2 = true;
        if (currentHour >= 20 || currentHour < 8) isS3 = true;
    }

    function toggleLive(card, badge, isActive) {
        if (!card || !badge) return;
        if (isActive) {
            badge.classList.remove('hidden');
            badge.classList.add('inline-flex');
            card.classList.add('border-brand-red', 'ring-2', 'ring-red-100');
        } else {
            badge.classList.add('hidden');
            badge.classList.remove('inline-flex');
            card.classList.remove('border-brand-red', 'ring-2', 'ring-red-100');
        }
    }

    toggleLive(c1, b1, isS1);
    toggleLive(c2, b2, isS2);
    toggleLive(c3, b3, isS3);
}

function renderDashboard() {
    var dateInput = document.getElementById('dashDateInput');
    if (!dateInput) return;
    var date = dateInput.value;

    var isHoliday = isDateInHolidayRange(date);
    var isWeekend = new Date(date).getDay() === 6 || new Date(date).getDay() === 0;
    var isWeekendOrHol = isWeekend || isHoliday;

    var dayTypeBadge = document.getElementById('dayTypeBadge');
    if (dayTypeBadge) {
        if (isWeekendOrHol) {
            dayTypeBadge.className = "px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-brand-red border border-red-200 flex items-center gap-1.5";
            dayTypeBadge.innerHTML = `<span class="material-symbols-outlined text-xs">weekend</span> ວັນພັກທ້າຍອາທິດ / ພິເສດ`;
        } else {
            dayTypeBadge.className = "px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5";
            dayTypeBadge.innerHTML = `<span class="material-symbols-outlined text-xs">work</span> ວັນທຳມະດາ (Weekday)`;
        }
    }

    document.getElementById('shift1TimeText').innerText = isWeekendOrHol ? '08:00 - 13:30' : '08:00 - 16:00';
    document.getElementById('shift2TimeText').innerText = isWeekendOrHol ? '13:30 - 19:00' : '12:00 - 20:00';
    document.getElementById('shift3TimeText').innerText = isWeekendOrHol ? '19:00 - 08:00' : '20:00 - 08:00';

    var allS1ByTeam = [];
    var allS2ByTeam = [];
    var allS3ByTeam = [];
    var totalS1 = 0, totalS2 = 0, totalS3 = 0;

    (window.scheduleSheets || []).forEach(sheet => {
        var dayInfo = sheet.data?.[date];
        if (dayInfo) {
            var s1 = (dayInfo.shift1 || []).filter(n => n && n.trim() !== '');
            var s2 = (dayInfo.shift2 || []).filter(n => n && n.trim() !== '');
            var s3 = (dayInfo.shift3 || []).filter(n => n && n.trim() !== '');

            var cleanTeamName = sheet.title.replace('ຕາຕະລາງປະຈຳການບໍລິການອອນໄລປະຈຳເດືອນ', 'ຕາຕະລາງ');

            var hasLeaderS1 = s1.some(name => window.users.find(u => u.nameLao === name)?.isLeader);
            var hasLeaderS2 = s2.some(name => window.users.find(u => u.nameLao === name)?.isLeader);
            var hasLeaderS3 = s3.some(name => window.users.find(u => u.nameLao === name)?.isLeader);

            if (s1.length > 0) { allS1ByTeam.push({ teamTitle: cleanTeamName, staff: s1, hasLeader: hasLeaderS1 }); totalS1 += s1.length; }
            if (s2.length > 0) { allS2ByTeam.push({ teamTitle: cleanTeamName, staff: s2, hasLeader: hasLeaderS2 }); totalS2 += s2.length; }
            if (s3.length > 0) { allS3ByTeam.push({ teamTitle: cleanTeamName, staff: s3, hasLeader: hasLeaderS3 }); totalS3 += s3.length; }
        }
    });

    document.getElementById('shift1CountBadge').innerText = `${totalS1} ຄົນ`;
    document.getElementById('shift2CountBadge').innerText = `${totalS2} ຄົນ`;
    document.getElementById('shift3CountBadge').innerText = `${totalS3} ຄົນ`;

    renderDashMultiTeamStaff('shift1Names', allS1ByTeam, 'ກະ 1 (08:00 - 16:00)');
    renderDashMultiTeamStaff('shift2Names', allS2ByTeam, 'ກະ 2 (12:00 - 20:00)');
    renderDashMultiTeamStaff('shift3Names', allS3ByTeam, 'ກະ 3 (20:00 - 08:00)');

    updateLiveShiftBadge(isWeekendOrHol);

    // ລາຍການລາພັກ (ພ້ອມບອກກະ)
    document.getElementById('dashActivityDateLabel').innerText = `ວັນທີ ${date}`;
    var dayLeaves = (window.leavesList || []).filter(l => l.date === date);
    var leavesDiv = document.getElementById('dashLeavesContainer');
    if (leavesDiv) {
        leavesDiv.innerHTML = '';
        if (dayLeaves.length === 0) {
            leavesDiv.innerHTML = `<p class="text-slate-400 italic text-xs py-1">ບໍ່ມີພະນັກງານລາພັກໃນວັນນີ້</p>`;
        } else {
            dayLeaves.forEach(l => {
                leavesDiv.innerHTML += `
                    <div class="p-2 bg-red-50 border border-red-100 rounded-xl flex justify-between items-center">
                        <div class="flex items-center gap-1.5">
                            ${renderStaffPill(l.empName)}
                            <span class="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">${l.shift || 'ກະ 1'}</span>
                        </div>
                        <span class="text-brand-red bg-red-100 px-2 py-0.5 rounded text-[10px] font-bold">${l.reason}</span>
                    </div>
                `;
            });
        }
    }

    var daySwaps = (window.swapHistory || []).filter(s => s.status === 'COMPLETED' && date >= s.startDate && date <= s.endDate);
    var swapsDiv = document.getElementById('dashSwapsContainer');
    if (swapsDiv) {
        swapsDiv.innerHTML = '';
        if (daySwaps.length === 0) {
            swapsDiv.innerHTML = `<p class="text-slate-400 italic text-xs py-1">ບໍ່ມີລາຍການປ່ຽນກະໃນວັນນີ້</p>`;
        } else {
            daySwaps.forEach(s => {
                swapsDiv.innerHTML += `
                    <div class="p-2 bg-emerald-50 border border-emerald-100 rounded-xl flex justify-between items-center">
                        <div class="flex items-center gap-1">${renderStaffPill(s.fromName)} <span class="text-xs text-slate-400">➔</span> ${renderStaffPill(s.toName)}</div>
                        <span class="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold">ປ່ຽນສຳເລັດ</span>
                    </div>
                `;
            });
        }
    }
}

window.renderDashboard = renderDashboard;
window.openStaffInfoModal = openStaffInfoModal;
window.closeStaffInfoModal = closeStaffInfoModal;

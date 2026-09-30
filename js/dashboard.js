// ================= ⭐ DASHBOARD OPERATIONAL MONITOR (CORRECT REAL-TIME SWAP) =================

// Helper ປຽບທຽບຊື່ແບບຍືດຍຸ່ນ
function isNameMatch(a, b) {
    if (!a || !b) return false;
    var cleanA = a.toString().trim().toLowerCase().replace(/\s+/g, '');
    var cleanB = b.toString().trim().toLowerCase().replace(/\s+/g, '');
    return cleanA === cleanB || cleanA.includes(cleanB) || cleanB.includes(cleanA);
}

// Helper ແປງວັນທີ
function normalizeDateStr(d) {
    if (!d) return '';
    var s = d.toString().trim();
    if (s.includes('T')) s = s.split('T')[0];
    if (s.includes('/')) {
        var p = s.split('/');
        if (p.length === 3 && p[2].length === 4) {
            return `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
        }
    }
    var parts = s.split('-');
    if (parts.length === 3) {
        return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    return s;
}

function getShiftLabelShort(s) {
    if (s === 'shift1') return 'ກະ 1';
    if (s === 'shift2') return 'ກະ 2';
    if (s === 'shift3') return 'ກະ 3';
    return s || '';
}

function renderDashboard() {
    var dateInput = document.getElementById('dashDateInput');
    var rawDate = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
    var targetDate = normalizeDateStr(rawDate);

    var actLabel = document.getElementById('dashActivityDateLabel');
    if (actLabel) actLabel.innerText = `ວັນທີ ${targetDate}`;

    var monthKey = targetDate.substring(0, 7);
    
    // ດຶງທຸກ Sheet ຂອງເດືອນນັ້ນ (ສົມບູນ + ສັນຍາ)
    var sheetsOfMonth = (window.scheduleSheets || []).filter(s => s.monthKey === monthKey);
    if (sheetsOfMonth.length === 0 && typeof getActiveSheet === 'function') {
        var act = getActiveSheet();
        if (act) sheetsOfMonth = [act];
    }

    var isHol = typeof isDateInHolidayRange === 'function' ? isDateInHolidayRange(targetDate) : false;
    var dayOfWeek = new Date(targetDate).getDay();
    var isWeekend = (dayOfWeek === 0 || dayOfWeek === 6 || isHol);

    // 1. Badge ປະເພດວັນ
    var dayTypeBadge = document.getElementById('dayTypeBadge');
    if (dayTypeBadge) {
        if (isHol) {
            dayTypeBadge.className = "px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5";
            dayTypeBadge.innerHTML = `<span class="material-symbols-outlined text-sm">celebration</span> ວັນພັກພິເສດ`;
        } else if (isWeekend) {
            dayTypeBadge.className = "px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-50 text-brand-red border border-red-200 flex items-center gap-1.5";
            dayTypeBadge.innerHTML = `<span class="material-symbols-outlined text-sm">weekend</span> ວັນພັກທ້າຍອາທິດ`;
        } else {
            dayTypeBadge.className = "px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5";
            dayTypeBadge.innerHTML = `<span class="material-symbols-outlined text-sm">wb_sunny</span> ວັນທຳມະດາ (Weekday)`;
        }
    }

    // 2. ⭐ ສະແດງລາຍຊື່ແຕ່ລະກະ ພ້ອມສະຫຼັບຊື່ແບບ REAL-TIME 100%
    renderShiftCardsGrouped(sheetsOfMonth, targetDate, isWeekend);

    // 3. ສະແດງລາຍການລາພັກ
    renderDailyLeaves(targetDate);

    // 4. ສະແດງລາຍການປ່ຽນກະຂອງມື້ນີ້
    renderDailySwaps(targetDate);
}

// ⭐ RENDER ກະ 1, 2, 3: ລັອກຕຳແໜ່ງປ່ຽນກະແບບ REAL-TIME ບໍ່ມີການສະຫຼັບກັບຄືນ
function renderShiftCardsGrouped(sheets, targetDate, isWeekend) {
    // ດຶງປະຫວັດ Swap ຫຼ້າສຸດ
    try {
        var localSw = localStorage.getItem('ot_swap_history');
        if (localSw) window.swapHistory = JSON.parse(localSw);
    } catch(e) {}

    // ກອງສະເພາະ Swap ທີ່ Active ໃນມື້ນີ້
    var activeSwapsToday = (window.swapHistory || []).filter(sw => {
        if (sw.status !== 'COMPLETED') return false;
        var sStart = normalizeDateStr(sw.startDate);
        var sEnd = normalizeDateStr(sw.endDate || sw.startDate);
        return (targetDate >= sStart && targetDate <= sEnd);
    });

    ['shift1', 'shift2', 'shift3'].forEach(shiftKey => {
        var container = document.getElementById(shiftKey + 'Names');
        var badge = document.getElementById(shiftKey + 'CountBadge');
        var timeText = document.getElementById(shiftKey + 'TimeText');

        if (timeText) {
            if (isWeekend) {
                if (shiftKey === 'shift1') timeText.innerText = '08:00 - 13:30';
                if (shiftKey === 'shift2') timeText.innerText = '13:30 - 19:00';
                if (shiftKey === 'shift3') timeText.innerText = '19:00 - 08:00';
            } else {
                if (shiftKey === 'shift1') timeText.innerText = '08:00 - 16:00';
                if (shiftKey === 'shift2') timeText.innerText = '12:00 - 20:00';
                if (shiftKey === 'shift3') timeText.innerText = '20:00 - 08:00';
            }
        }

        if (!container) return;
        container.innerHTML = '';
        var totalPeopleInShift = 0;

        sheets.forEach(sheet => {
            var dayData = sheet?.data?.[targetDate] || {};
            var names = [...(dayData[shiftKey] || [])];

            // ⭐ REAL-TIME SWAP LOGIC: ລັອກຕາມ fromShift ແລະ toShift ຢ່າງຖືກຕ້ອງ
            activeSwapsToday.forEach(sw => {
                var isCover = (sw.swapType === 'COVER' || (sw.reason && sw.reason.includes('ຄວບກະ')));

                if (isCover) {
                    // ກໍລະນີ: ຍາມແທນ (Cover) -> ໃນ toShift ໃຫ້ເອົາ fromName ມາແທນ toName
                    if (shiftKey === sw.toShift) {
                        var tIdx = names.findIndex(n => isNameMatch(n, sw.toName));
                        if (tIdx !== -1) names[tIdx] = sw.fromName;
                    }
                } else {
                    // ກໍລະນີ: 1:1 Swap -> ຜູ້ຂໍ (fromName) ຕ້ອງໄປຢູ່ toShift, ຜູ້ຮັບ (toName) ຕ້ອງມາຢູ່ fromShift
                    if (shiftKey === sw.toShift) {
                        // ໃນກະ toShift: ຖ້າພົບຊື່ toName ໃຫ້ປ່ຽນເປັນ fromName ທັນທີ
                        var tIdx = names.findIndex(n => isNameMatch(n, sw.toName));
                        if (tIdx !== -1) names[tIdx] = sw.fromName;
                    }
                    if (shiftKey === sw.fromShift) {
                        // ໃນກະ fromShift: ຖ້າພົບຊື່ fromName ໃຫ້ປ່ຽນເປັນ toName ທັນທີ
                        var fIdx = names.findIndex(n => isNameMatch(n, sw.fromName));
                        if (fIdx !== -1) names[fIdx] = sw.toName;
                    }
                }
            });

            totalPeopleInShift += names.length;

            if (names.length > 0) {
                var sheetTitle = sheet.title || 'ຕາຕະລາງ';
                var isMain = !sheetTitle.includes('ສັນຍາ');

                var groupHtml = `
                    <div class="pt-2 first:pt-0">
                        <div class="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1.5">
                            <span class="flex items-center gap-1">
                                <span class="w-1.5 h-1.5 rounded-full ${isMain ? 'bg-red-500' : 'bg-slate-400'}"></span>
                                ${sheetTitle}
                            </span>
                            <span>${names.length} ຄົນ</span>
                        </div>
                        <div class="flex flex-wrap gap-1.5">
                `;

                names.forEach(name => {
                    var u = (window.users || []).find(usr => isNameMatch(usr.nameLao, name));
                    var isLeader = u ? u.isLeader : false;
                    var photo = u ? u.photo : '';

                    // ກວດສອບວ່າຄົນນີ້ມາຂຶ້ນຍ້ອນ Swap ຫຼືບໍ່ (ຖ້າແມ່ນ ຕິດ icon ບອກ)
                    var isSwappedPerson = activeSwapsToday.some(sw => isNameMatch(sw.fromName, name) || isNameMatch(sw.toName, name));

                    groupHtml += `
                        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${isLeader ? 'bg-red-50 text-brand-red border-red-200' : 'bg-slate-50 text-slate-800 border-slate-200'}">
                            ${photo ? `<img src="${photo}" class="w-4 h-4 rounded-full object-cover"/>` : ''}
                            <span>${name}</span>
                            ${isLeader ? '<span class="w-1.5 h-1.5 rounded-full bg-brand-red"></span>' : ''}
                            ${isSwappedPerson ? '<span class="material-symbols-outlined text-[13px] text-amber-600 font-bold" title="ປ່ຽນກະມາ">sync_alt</span>' : ''}
                        </div>
                    `;
                });

                groupHtml += `</div></div>`;
                container.innerHTML += groupHtml;
            }
        });

        if (badge) badge.innerText = `${totalPeopleInShift} ຄົນ`;
        if (totalPeopleInShift === 0) {
            container.innerHTML = `<span class="text-xs text-slate-400 italic">ບໍ່ມີຄົນປະຈຳການ</span>`;
        }
    });
}

function renderDailyLeaves(targetDate) {
    var container = document.getElementById('dashLeavesContainer');
    if (!container) return;
    container.innerHTML = '';

    try {
        var localB = localStorage.getItem('ot_annual_bookings');
        if (localB) window.annualBookings = JSON.parse(localB);
    } catch(e) {}

    var activeLeaves = (window.annualBookings || []).filter(b => {
        if (b.status === 'REJECTED') return false;
        var start = normalizeDateStr(b.startDate);
        var end = normalizeDateStr(b.endDate || b.startDate);
        return (targetDate >= start && targetDate <= end);
    });

    if (activeLeaves.length === 0) {
        container.innerHTML = `<p class="text-slate-400 text-xs italic py-1 font-lao">ບໍ່ມີພະນັກງານລາພັກໃນວັນທີນີ້</p>`;
        return;
    }

    activeLeaves.forEach(b => {
        container.innerHTML += `
            <div class="p-2 bg-red-50/70 border border-red-200 rounded-xl flex items-center justify-between text-xs font-lao">
                <div>
                    <span class="font-bold text-brand-red">${b.nameLao}</span>
                    <span class="text-slate-500 text-[11px] ml-1">(${b.shift || 'ທຸກກະ'})</span>
                </div>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-red text-white">ລາພັກ</span>
            </div>
        `;
    });
}

function renderDailySwaps(targetDate) {
    var container = document.getElementById('dashSwapsContainer');
    if (!container) return;
    container.innerHTML = '';

    try {
        var localSw = localStorage.getItem('ot_swap_history');
        if (localSw) window.swapHistory = JSON.parse(localSw);
    } catch(e) {}

    var activeSwaps = (window.swapHistory || []).filter(sw => {
        if (sw.status !== 'COMPLETED') return false;
        var start = normalizeDateStr(sw.startDate);
        var end = normalizeDateStr(sw.endDate || sw.startDate);
        return (targetDate >= start && targetDate <= end);
    });

    if (activeSwaps.length === 0) {
        container.innerHTML = `<p class="text-slate-400 text-xs italic py-1 font-lao">ບໍ່ມີການປ່ຽນກະໃນວັນທີນີ້</p>`;
        return;
    }

    activeSwaps.forEach(sw => {
        var isCover = (sw.swapType === 'COVER' || (sw.reason && sw.reason.includes('ຄວບກະ')));

        if (isCover) {
            container.innerHTML += `
                <div class="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between text-xs font-lao">
                    <div>
                        <span class="font-bold text-brand-red">${sw.fromName}</span> 
                        <span class="text-slate-600">ຍາມແທນ</span> 
                        <span class="font-bold text-slate-800">${sw.toName}</span> 
                        <span class="text-purple-700 font-bold ml-1">(${getShiftLabelShort(sw.toShift)})</span>
                    </div>
                    <span class="px-2 py-0.5 rounded text-[10px] font-black bg-amber-200 text-amber-900 border border-amber-300">ຄວບກະ</span>
                </div>
            `;
        } else {
            container.innerHTML += `
                <div class="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs font-lao">
                    <div class="flex items-center gap-1.5">
                        <span class="font-bold text-brand-red">${sw.fromName}</span> 
                        <span class="material-symbols-outlined text-xs text-slate-400">arrow_forward</span>
                        <span class="font-bold text-blue-700">${sw.toName}</span> 
                    </div>
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">ປ່ຽນສຳເລັດ</span>
                </div>
            `;
        }
    });
}

window.renderDashboard = renderDashboard;

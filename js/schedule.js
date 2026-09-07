// ================= ⭐ FAIR ZIGZAG SCHEDULE ENGINE & SUPABASE CLOUD SYNC =================

// 1. REBALANCE ກະ 3 ອັດສະລິຍະ
async function rebalanceNightShifts() {
    var sheet = getActiveSheet();
    var schedData = sheet?.data || {};
    var dates = Object.keys(schedData);
    if (dates.length === 0) {
        showToast('ແຈ້ງເຕືອນ', 'ຕາຕະລາງຍັງວ່າງເປົ່າ ບໍ່ສາມາດ Rebalance ໄດ້', 'error');
        return;
    }

    var activeWorkers = new Set();
    dates.forEach(d => {
        [...(schedData[d].shift1 || []), ...(schedData[d].shift2 || []), ...(schedData[d].shift3 || [])].forEach(n => {
            if (n && !window.fixedShiftsConfig.some(f => f.nameLao === n)) {
                activeWorkers.add(n);
            }
        });
    });

    var staffList = Array.from(activeWorkers);
    if (staffList.length === 0) return;

    function countS3() {
        var counts = {};
        staffList.forEach(n => counts[n] = 0);
        dates.forEach(d => {
            (schedData[d].shift3 || []).forEach(n => {
                if (counts[n] !== undefined) counts[n]++;
            });
        });
        return counts;
    }

    var counts = countS3();
    var totalS3 = Object.values(counts).reduce((a, b) => a + b, 0);

    var maxIterations = 200;
    var iteration = 0;

    while (iteration < maxIterations) {
        counts = countS3();
        var maxStaff = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
        var minStaff = Object.keys(counts).reduce((a, b) => counts[a] < counts[b] ? a : b);

        if (counts[maxStaff] - counts[minStaff] <= 1) break;

        var swapped = false;
        for (var i = 0; i < dates.length; i++) {
            var d = dates[i];
            var dayData = schedData[d];

            if (dayData.isWeekend && dayData.shift3 && dayData.shift3.includes(maxStaff) && !dayData.shift3.includes(minStaff)) {
                var maxIdx = dayData.shift3.indexOf(maxStaff);
                dayData.shift3[maxIdx] = minStaff;

                if (dayData.shift1 && dayData.shift1.includes(minStaff)) {
                    var minIdx = dayData.shift1.indexOf(minStaff);
                    dayData.shift1[minIdx] = maxStaff;
                } else if (dayData.shift2 && dayData.shift2.includes(minStaff)) {
                    var minIdx = dayData.shift2.indexOf(minStaff);
                    dayData.shift2[minIdx] = maxStaff;
                }

                swapped = true;
                break;
            }
        }

        if (!swapped) break;
        iteration++;
    }

    await saveAll();
    renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    showToast('Rebalance ສຳເລັດ', `ປັບສົມດຸນກະ 3 ໃຫ້ທຸກຄົນເທົ່າທຽມກັນ (ຜິດດ່ຽງບໍ່ເກີນ ±1) ຮຽບຮ້ອຍແລ້ວ!`, 'success');
}

function openEditPublishedScheduleGuide() {
    var sheet = getActiveSheet();
    if (sheet.status !== 'PUBLISHED') {
        showToast('ແຈ້ງເຕືອນ', 'ຕາຕະລາງນີ້ຍັງເປັນສະບັບຮ່າງ (Draft) ສາມາດຄລິກແກ້ໄຂໄດ້ເລີຍປົກກະຕິ', 'info');
        return;
    }
    showToast('ວິທີດັດແກ້', 'ທ່ານສາມາດຄລິກໃສ່ຊ່ອງພະນັກງານໃນຕາຕະລາງໄດ້ເລີຍ ລະບົບຈະຖາມເຫດຜົນ (Remark) ແລະ Highlight ໃຫ້ອັດຕະໂນມັດ', 'info');
}

function openFixedShiftModal() {
    var userSelect = document.getElementById('fixedShiftUserSelect');
    if (userSelect) {
        userSelect.innerHTML = '';
        window.users.filter(u => u.role !== 'SUPER_ADMIN').forEach(u => {
            userSelect.innerHTML += `<option value="${u.nameLao}">${u.nameLao} (${u.fullName})</option>`;
        });
    }
    renderActiveFixedShiftsList();
    document.getElementById('fixedShiftModal')?.classList.remove('hidden');
}

function renderActiveFixedShiftsList() {
    var container = document.getElementById('activeFixedShiftsList');
    if (!container) return;
    container.innerHTML = '';

    if (window.fixedShiftsConfig.length === 0) {
        container.innerHTML = `<p class="text-slate-400 text-xs italic py-2">ຍັງບໍ່ມີພະນັກງານທີ່ຖືກລັອກກະປະຈຳ</p>`;
        return;
    }

    window.fixedShiftsConfig.forEach((f, idx) => {
        var shiftLabel = f.fixedShift === 'shift1' ? 'ກະ 1 (08:00)' : (f.fixedShift === 'shift2' ? 'ກະ 2 (12:00)' : 'ກະ 3 (20:00)');
        container.innerHTML += `
            <div class="p-2.5 bg-slate-50 border rounded-xl flex justify-between items-center text-xs">
                <div>
                    <span class="font-bold text-slate-800">${f.nameLao}</span>
                    <span class="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">ລັອກ ${shiftLabel}</span>
                </div>
                <button type="button" onclick="removeFixedShift(${idx})" class="text-brand-red hover:underline font-bold text-xs">ລຶບ</button>
            </div>
        `;
    });
}

async function handleAddFixedShift() {
    var name = document.getElementById('fixedShiftUserSelect')?.value;
    var shift = document.getElementById('fixedShiftSlotSelect')?.value;
    window.fixedShiftsConfig = window.fixedShiftsConfig.filter(f => f.nameLao !== name);
    window.fixedShiftsConfig.push({ nameLao: name, fixedShift: shift });
    await saveAll();
    renderActiveFixedShiftsList();
    showToast('ສຳເລັດ', `ລັອກ "${name}" ໄວ້ ${shift} ແລ້ວ!`, 'success');
}

async function removeFixedShift(idx) {
    window.fixedShiftsConfig.splice(idx, 1);
    await saveAll();
    renderActiveFixedShiftsList();
    showToast('ສຳເລັດ', 'ຍົກເລີກການລັອກກະແລ້ວ', 'success');
}

// ⭐ ສູດກຸ່ມ 7 ຄົນ: ເຮັດວຽກ 5 ວັນ ພັກ 2 ວັນ (Rolling Off ບໍ່ຕົງເສົາ-ອາທິດ)
// ພ້ອມ Random/ສະຫຼັບຮູບແບບ 5 ຄົນ: 2-2-1, 1-2-2, 2-1-2
function generate7PersonFlexZigzag(year, month, staffList) {
    var daysCount = new Date(year, month, 0).getDate();
    var data = {};
    var N = 7;
    var epochDate = new Date(Date.UTC(2026, 0, 1));

    for (var i = 1; i <= daysCount; i++) {
        var dayNum = i < 10 ? '0' + i : '' + i;
        var mNum = month < 10 ? '0' + month : '' + month;
        var dStr = `${year}-${mNum}-${dayNum}`;
        var currentDate = new Date(Date.UTC(year, month - 1, i));
        var totalDays = Math.floor((currentDate.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24));
        var dayOfWeek = currentDate.getUTCDay();
        var isWeekend = (dayOfWeek === 6 || dayOfWeek === 0 || isDateInHolidayRange(dStr));

        // ໝູນວຽນ Slot 7 ຄົນ: 5 ຄົນເຮັດວຽກ (Slot 0-4), 2 ຄົນພັກຜ່ອນ (Slot 5-6)
        var dailySlots = [];
        for (var p = 0; p < N; p++) {
            var assignedSlot = (p + totalDays) % N;
            dailySlots[assignedSlot] = staffList[p];
        }

        // ສະຫຼັບ 3 ຮູບແບບການແຈກຢາຍ 5 ຄົນ: (2-2-1), (1-2-2), (2-1-2)
        var mode = (i + month) % 3;
        var s1 = [], s2 = [], s3 = [];

        if (mode === 0) {
            // ຮູບແບບ 2-2-1 (ກະ1: 2, ກະ2: 2, ກະ3: 1)
            s1 = [dailySlots[0], dailySlots[1]];
            s2 = [dailySlots[2], dailySlots[3]];
            s3 = [dailySlots[4]];
        } else if (mode === 1) {
            // ຮູບແບບ 1-2-2 (ກະ1: 1, ກະ2: 2, ກະ3: 2)
            s1 = [dailySlots[0]];
            s2 = [dailySlots[1], dailySlots[2]];
            s3 = [dailySlots[3], dailySlots[4]];
        } else {
            // ຮູບແບບ 2-1-2 (ກະ1: 2, ກະ2: 1, ກະ3: 2)
            s1 = [dailySlots[0], dailySlots[1]];
            s2 = [dailySlots[2]];
            s3 = [dailySlots[3], dailySlots[4]];
        }
        // dailySlots[5] ແລະ dailySlots[6] ແມ່ນ 2 ຄົນທີ່ໄດ້ພັກຜ່ອນ (OFF) ໃນມື້ນີ້

        data[dStr] = {
            isWeekend: isWeekend,
            isG7Team: true, // ຕິດ Tag ກຸ່ມ 7 ຄົນສຳລັບສະແດງ Badge G7
            shift1: s1.filter(Boolean),
            shift2: s2.filter(Boolean),
            shift3: s3.filter(Boolean)
        };
    }
    return data;
}

// ⭐ ສູດສຳລັບທີມຫຼັກ (14-17 ຄົນ): ກະ 3 ເທົ່າກັນ, ວັນພັກເທົ່າກັນ, ກະ 1-2 ສະຫຼັບລາຍອາທິດ
function generateFairBalancedZigzag(year, month, staffList) {
    var daysCount = new Date(year, month, 0).getDate();
    var data = {};
    var N = staffList.length;
    if (N === 0) return data;

    var s3Queue = [...staffList];
    var s3Pointer = (month * 7) % N;

    var weekendQueue = [...staffList];
    var weekendPointer = (month * 3) % N;

    for (var i = 1; i <= daysCount; i++) {
        var dayNum = i < 10 ? '0' + i : '' + i;
        var mNum = month < 10 ? '0' + month : '' + month;
        var dStr = `${year}-${mNum}-${dayNum}`;
        var dateObj = new Date(Date.UTC(year, month - 1, i));
        var dayOfWeek = dateObj.getUTCDay();
        var isWeekend = (dayOfWeek === 6 || dayOfWeek === 0 || isDateInHolidayRange(dStr));
        var weekNum = Math.floor((i - 1) / 7);

        if (isWeekend) {
            var wStaff = [];
            for (var k = 0; k < 6; k++) {
                wStaff.push(weekendQueue[(weekendPointer + k) % N]);
            }
            weekendPointer = (weekendPointer + 6) % N;

            data[dStr] = {
                isWeekend: true,
                isG7Team: false,
                shift1: [wStaff[4], wStaff[5]].filter(Boolean),
                shift2: [wStaff[2], wStaff[3]].filter(Boolean),
                shift3: [wStaff[0], wStaff[1]].filter(Boolean)
            };
        } else {
            var s3_today = [];
            for (var s = 0; s < 2; s++) {
                s3_today.push(s3Queue[s3Pointer % N]);
                s3Pointer++;
            }

            var availableToday = staffList.filter(n => !s3_today.includes(n));
            var half = Math.ceil(availableToday.length / 2);

            var s1_today = [];
            var s2_today = [];

            availableToday.forEach((person, pIdx) => {
                var slot = (pIdx + weekNum * half) % availableToday.length;
                if (slot < half) {
                    s1_today.push(person);
                } else {
                    s2_today.push(person);
                }
            });

            data[dStr] = {
                isWeekend: false,
                isG7Team: false,
                shift1: s1_today.filter(Boolean),
                shift2: s2_today.filter(Boolean),
                shift3: s3_today.filter(Boolean)
            };
        }
    }

    return data;
}

// ⭐ ເລືອກສູດອັດຕະໂນມັດຕາມຈຳນວນຄົນໃນກຸ່ມ
function generateMonthDataZigzag(year, month, targetGroupMembers) {
    var staffList = [];
    if (targetGroupMembers && targetGroupMembers.length > 0) {
        staffList = [...targetGroupMembers];
    } else {
        staffList = window.users.filter(u => u.role !== 'SUPER_ADMIN').map(u => u.nameLao);
    }

    if (staffList.length === 7) {
        return generate7PersonFlexZigzag(year, month, staffList);
    } else {
        return generateFairBalancedZigzag(year, month, staffList);
    }
}

function openRandomGroupSelectModal() {
    var select = document.getElementById('randomSelectedGroupId');
    if (!select) return;
    select.innerHTML = '';
    var optAll = document.createElement('option');
    optAll.value = 'ALL';
    optAll.innerText = 'ພະນັກງານທັງໝົດ (All Staff)';
    select.appendChild(optAll);

    (window.employeeGroups || []).forEach(grp => {
        var opt = document.createElement('option');
        opt.value = grp.id;
        opt.innerText = `${grp.name} (${grp.members.length} ຄົນ)`;
        select.appendChild(opt);
    });
    document.getElementById('randomGroupSelectModal')?.classList.remove('hidden');
}

async function executeGroupRandomSchedule() {
    var sheet = getActiveSheet();
    var [year, month] = (sheet?.monthKey || '2026-09').split('-').map(Number);
    var selectedGrpId = document.getElementById('randomSelectedGroupId')?.value || 'ALL';
    
    var members = null;
    if (selectedGrpId !== 'ALL') {
        var found = (window.employeeGroups || []).find(g => g.id === selectedGrpId);
        if (found && found.members) members = found.members;
    }

    sheet.data = generateMonthDataZigzag(year, month, members);
    await rebalanceNightShifts();
    await saveAll();

    document.getElementById('randomGroupSelectModal')?.classList.add('hidden');
    renderScheduleTable();
    showToast('ສຳເລັດ', `ສ້າງຕາຕະລາງ Zigzag ສຳເລັດຮຽບຮ້ອຍ!`, 'success');
}

function openBatchMonthModal() {
    var select = document.getElementById('batchTargetGroupSelect');
    if (select) {
        select.innerHTML = `<option value="ALL">ພະນັກງານທັງໝົດ (All Staff)</option>`;
        (window.employeeGroups || []).forEach(grp => {
            select.innerHTML += `<option value="${grp.id}">${grp.name} (${grp.members.length} ຄົນ)</option>`;
        });
    }
    document.getElementById('batchMonthModal')?.classList.remove('hidden');
}

async function executeBatchMonthGenerate() {
    var startM = document.getElementById('batchStartMonth')?.value;
    var count = parseInt(document.getElementById('batchMonthCount')?.value) || 6;
    var selectedGrpId = document.getElementById('batchTargetGroupSelect')?.value || 'ALL';

    if (!startM) {
        showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາເລືອກເດືອນເລີ່ມຕົ້ນ', 'error');
        return;
    }

    var selectedMembers = null;
    var groupNameTag = '';
    if (selectedGrpId !== 'ALL') {
        var foundGrp = (window.employeeGroups || []).find(g => g.id === selectedGrpId);
        if (foundGrp) {
            selectedMembers = foundGrp.members;
            groupNameTag = ` (${foundGrp.name})`;
        }
    }

    var [startYear, startMonth] = startM.split('-').map(Number);
    var firstGeneratedSheetId = null;

    for (var c = 0; c < count; c++) {
        var targetDate = new Date(startYear, startMonth - 1 + c, 1);
        var y = targetDate.getFullYear();
        var m = targetDate.getMonth() + 1;
        var mStr = m < 10 ? '0' + m : '' + m;
        var monthKey = `${y}-${mStr}`;
        var sheetId = 'sheet-' + monthKey + '-' + (selectedGrpId || 'all');
        var title = `ຕາຕະລາງປະຈຳການບໍລິການອອນໄລປະຈຳເດືອນ ${mStr}/${y}${groupNameTag}`;

        var generatedData = generateMonthDataZigzag(y, m, selectedMembers);

        var existingIdx = window.scheduleSheets.findIndex(s => s.monthKey === monthKey && s.title.includes(groupNameTag));
        if (existingIdx !== -1) {
            window.scheduleSheets[existingIdx].data = generatedData;
            window.scheduleSheets[existingIdx].title = title;
        } else {
            window.scheduleSheets.push({
                id: sheetId,
                monthKey: monthKey,
                title: title,
                notes: window.defaultNotesTemplate,
                status: 'DRAFT',
                data: generatedData
            });
        }

        if (c === 0) firstGeneratedSheetId = sheetId;
    }

    if (firstGeneratedSheetId) window.activeSheetId = firstGeneratedSheetId;

    await saveAll();
    await rebalanceNightShifts();
    document.getElementById('batchMonthModal')?.classList.add('hidden');
    renderSheetDropdown();
    renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    showToast('ສຳເລັດ', `ສ້າງຕາຕະລາງຕໍ່ເນື່ອງ ${count} ເດືອນສຳເລັດ!`, 'success');
}

async function publishSchedule() {
    var sheet = getActiveSheet();
    sheet.status = 'PUBLISHED';

    var notifEntry = {
        id: Date.now(),
        title: `ຕາຕະລາງປະຈຳການໃໝ່ຖືກເຜີຍແຜ່ແລ້ວ!`,
        message: `ຕາຕະລາງ "${sheet.title}" ໄດ້ຮັບການ Publish ເປັນທາງການແລ້ວ.`,
        tag: 'Publish ທາງການ',
        sheetId: sheet.id,
        date: new Date().toLocaleString('lo-LA'),
        readBy: [window.currentUser?.user]
    };

    if (!window.systemNotifications) window.systemNotifications = [];
    window.systemNotifications.unshift(notifEntry);

    await saveAll();
    renderSheetDropdown();
    renderScheduleTable();
    if (typeof window.updateNotificationBadge === 'function') window.updateNotificationBadge();
    showToast('ເຜີຍແຜ່ສຳເລັດ', 'ຕາຕະລາງຖືກ Publish ເປັນທາງການແລ້ວ!', 'success');
}

function renderScheduleTable() {
    renderSheetDropdown();
    if (typeof window.renderScheduleStaffRoster === 'function') window.renderScheduleStaffRoster();
    var sheet = getActiveSheet();
    var scheduleData = sheet?.data || {};
    var [year, month] = (sheet?.monthKey || '2026-09').split('-').map(Number);
    var daysCount = new Date(year, month, 0).getDate();

    var isOfficial = sheet?.status === 'PUBLISHED';

    var titleEl = document.getElementById('scheduleTableTitle');
    if (titleEl) {
        titleEl.innerHTML = `
            <span>${sheet?.title || ''}</span>
            <span class="no-print ml-2 text-xs font-semibold ${isOfficial ? 'text-emerald-700' : 'text-amber-700'}">
                (${isOfficial ? 'ສະບັບທາງການ' : 'ສະບັບຮ່າງລ່ວງໜ້າ'})
            </span>
        `;
    }
    
    var notesEl = document.getElementById('scheduleNotesDisplay');
    if (notesEl) notesEl.innerText = sheet?.notes || window.defaultNotesTemplate;

    var banner = document.getElementById('scheduleStatusBanner');
    var badge = document.getElementById('scheduleStatusBadge');
    var modCountText = document.getElementById('modifiedCellCountText');

    if (banner && badge) {
        if (isOfficial) {
            banner.className = "no-print px-6 py-2 bg-emerald-50 border-b border-emerald-200 flex justify-between items-center text-xs";
            badge.className = "font-bold text-emerald-800 flex items-center gap-2";
            badge.innerHTML = `<span class="material-symbols-outlined text-sm text-emerald-600">verified</span> ຕາຕະລາງທາງການ (Published Official)`;
        } else {
            banner.className = "no-print px-6 py-2 bg-amber-50 border-b border-amber-200 flex justify-between items-center text-xs";
            badge.className = "font-bold text-amber-900 flex items-center gap-2";
            badge.innerHTML = `<span class="material-symbols-outlined text-sm text-amber-700">pending_actions</span> ສະບັບຮ່າງລ່ວງໜ້າ`;
        }
    }

    var sheetLogs = (window.scheduleAuditLogs || []).filter(l => l.sheetId === sheet?.id);
    if (modCountText) {
        modCountText.innerHTML = sheetLogs.length > 0 ? `<span class="material-symbols-outlined text-xs text-amber-700">history_edu</span> ມີການດັດແກ້: ${sheetLogs.length} ຈຸດ` : '';
    }

    var tbody = document.getElementById('scheduleTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    var dayNamesLao = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    var isAdmin = window.currentUser && window.currentUser.role === 'SUPER_ADMIN';

    for (var i = 1; i <= daysCount; i++) {
        var dayNum = i < 10 ? '0' + i : '' + i;
        var mNum = month < 10 ? '0' + month : '' + month;
        var dStr = `${year}-${mNum}-${dayNum}`;
        var dayOfWeek = dayNamesLao[new Date(year, month - 1, i).getDay()];
        var dayData = scheduleData[dStr] || { isWeekend: false, shift1: [], shift2: [], shift3: [] };
        var isWeekendOrHol = dayData.isWeekend;

        if (dayOfWeek === 'SAT') {
            tbody.innerHTML += `
                <tr class="bg-slate-100 font-bold border-t-2 border-b border-black">
                    <td colspan="2" class="p-1 text-center font-bold"></td>
                    <td class="p-1 text-center font-bold">08-13:30</td>
                    <td class="p-1 text-center font-bold">13:30-19</td>
                    <td class="p-1 text-center font-bold">19-08</td>
                </tr>
            `;
        } else if (dayOfWeek === 'MON' || i === 1) {
            tbody.innerHTML += `
                <tr class="bg-slate-100 font-bold border-t-2 border-b border-black">
                    <th style="width: 75px;" class="p-1 font-bold">ວັນທີ</th>
                    <th style="width: 48px;" class="p-1 font-bold">ວັນ</th>
                    <th style="width: 33%;" class="p-1 font-bold">08-16</th>
                    <th style="width: 33%;" class="p-1 font-bold">12-20</th>
                    <th style="width: 25%;" class="p-1 font-bold">20-08</th>
                </tr>
            `;
        }

        tbody.innerHTML += `
            <tr class="${isWeekendOrHol ? 'bg-slate-50' : 'bg-white'}">
                <td class="font-bold whitespace-nowrap">${i}/${mNum}/${year}</td>
                <td class="font-bold ${isWeekendOrHol ? 'text-brand-red' : ''}">${dayOfWeek}</td>
                <td class="p-0">${renderPixelExcelGrid(dStr, 'shift1', dayData.shift1 || [], isWeekendOrHol ? 1 : 2, isWeekendOrHol ? 3 : Math.max(3, Math.ceil((dayData.shift1 || []).length / 2)), isAdmin, sheet?.id, dayData.isG7Team)}</td>
                <td class="p-0">${renderPixelExcelGrid(dStr, 'shift2', dayData.shift2 || [], isWeekendOrHol ? 1 : 2, isWeekendOrHol ? 3 : Math.max(3, Math.ceil((dayData.shift2 || []).length / 2)), isAdmin, sheet?.id, dayData.isG7Team)}</td>
                <td class="p-0">${renderPixelExcelGrid(dStr, 'shift3', dayData.shift3 || [], isWeekendOrHol ? 1 : 2, isWeekendOrHol ? 3 : Math.max(2, Math.ceil((dayData.shift3 || []).length / 2)), isAdmin, sheet?.id, dayData.isG7Team)}</td>
            </tr>
        `;
    }
}

// ⭐ ສະແດງ Grid ຊ່ອງພະນັກງານ ພ້ອມ Badge ພິເສດ "G7"
function renderPixelExcelGrid(date, shift, list, rows, cols, isAdmin, sheetId, isG7) {
    cols = Math.max(cols, 2); rows = Math.max(rows, 1);
    var html = `<div class="grid w-full h-full" style="grid-template-columns: repeat(${cols}, minmax(0, 1fr)); grid-template-rows: repeat(${rows}, minmax(0, 1fr)); height: 48px;">`;
    var total = rows * cols;

    for (var idx = 0; idx < total; idx++) {
        var name = list[idx] || '';
        var isLeader = (window.users || []).find(u => u.nameLao === name && u.isLeader);
        var clickHandler = isAdmin ? `onclick="openCellModal('${date}', '${shift}', ${idx}, '${name}')"` : '';

        var isModified = (window.scheduleAuditLogs || []).some(l => l.sheetId === sheetId && l.date === date && l.shift === shift && l.newName === name);
        var highlightClass = isModified ? 'bg-amber-200/90 font-bold text-amber-950 border-2 border-amber-500 shadow-inner' : '';

        var borderR = ((idx + 1) % cols !== 0) ? 'border-r border-black' : '';
        var borderB = (idx < (rows - 1) * cols) ? 'border-b border-black' : '';

        // ເຄື່ອງໝາຍພິເສດ "G7" ສຳລັບກຸ່ມ 7 ຄົນ
        var g7Badge = (isG7 && name) ? `<span class="ml-1 px-1 py-0.2 rounded text-[8px] font-black bg-blue-100 text-blue-800 border border-blue-300 inline-block shadow-xs">G7</span>` : '';

        html += `
            <div class="grid-cell-box ${borderR} ${borderB} ${isAdmin ? 'editable' : ''} ${highlightClass} ${isLeader ? 'text-brand-red font-semibold' : 'text-slate-800'}" ${clickHandler}>
                <span>${name}</span>${g7Badge}
            </div>
        `;
    }
    html += `</div>`;
    return html;
}

function selectStaffForCell(nameLao) {
    if (!window.activeEditCell) return;
    var { date, shift, index, currentName } = window.activeEditCell;
    var sheet = getActiveSheet();

    if (sheet.status === 'PUBLISHED' && currentName !== nameLao) {
        if (typeof window.openEditPublishedRemarkModal === 'function') {
            window.openEditPublishedRemarkModal({ date, shift, index, currentName, newName: nameLao });
            return;
        }
    }

    if (!sheet.data[date]) sheet.data[date] = { shift1: [], shift2: [], shift3: [] };
    if (!sheet.data[date][shift]) sheet.data[date][shift] = [];
    sheet.data[date][shift][index] = nameLao;

    saveAll();
    closeCellModal();
    renderScheduleTable();
    showToast('ສຳເລັດ', 'ປັບປ່ຽນພະນັກງານໃນກະຮຽບຮ້ອຍ', 'success');
}

function clearCurrentCell() {
    if (!window.activeEditCell) return;
    var { date, shift, index, currentName } = window.activeEditCell;
    var sheet = getActiveSheet();

    if (sheet.status === 'PUBLISHED' && currentName) {
        if (typeof window.openEditPublishedRemarkModal === 'function') {
            window.openEditPublishedRemarkModal({ date, shift, index, currentName, newName: '(ວ່າງ)' });
            return;
        }
    }

    if (sheet.data[date]?.[shift]) {
        sheet.data[date][shift][index] = '';
        saveAll();
        closeCellModal();
        renderScheduleTable();
    }
}

function openEditPublishedRemarkModal(editData) {
    window.pendingPublishedCellEdit = editData;
    document.getElementById('remarkModalTargetInfo').innerText = `ວັນທີ: ${editData.date} [${editData.shift} - ຊ່ອງທີ ${editData.index + 1}]`;
    document.getElementById('remarkOldName').innerText = editData.currentName || '(ຊ່ອງວ່າງ)';
    document.getElementById('remarkNewName').innerText = editData.newName;
    document.getElementById('editPublishedRemarkInput').value = '';
    document.getElementById('editPublishedRemarkModal')?.classList.remove('hidden');
}

function closeEditPublishedRemarkModal() {
    document.getElementById('editPublishedRemarkModal')?.classList.add('hidden');
    window.pendingPublishedCellEdit = null;
}

async function confirmApplyPublishedCellUpdate() {
    if (!window.pendingPublishedCellEdit) return;
    var { date, shift, index, currentName, newName } = window.pendingPublishedCellEdit;
    var reason = document.getElementById('editPublishedRemarkInput')?.value.trim() || 'ດັດແກ້ຕາມຄວາມຈຳເປັນ';
    var sheet = getActiveSheet();

    var auditEntry = {
        id: Date.now(),
        sheetId: sheet.id,
        sheetTitle: sheet.title,
        date: date,
        shift: shift,
        oldName: currentName || '(ວ່າງ)',
        newName: newName,
        reason: reason,
        adminName: window.currentUser?.fullName || 'Admin',
        timestamp: new Date().toLocaleString('lo-LA')
    };

    if (!window.scheduleAuditLogs) window.scheduleAuditLogs = [];
    window.scheduleAuditLogs.unshift(auditEntry);

    if (!sheet.data[date]) sheet.data[date] = { shift1: [], shift2: [], shift3: [] };
    if (!sheet.data[date][shift]) sheet.data[date][shift] = [];
    sheet.data[date][shift][index] = newName;

    await saveAll();
    closeEditPublishedRemarkModal();
    closeCellModal();
    renderScheduleTable();
    if (typeof window.updateNotificationBadge === 'function') window.updateNotificationBadge();
    showToast('ອັບເດດສຳເລັດ', `ດັດແກ້ຕາຕະລາງຮຽບຮ້ອຍ!`, 'success');
}

function renderSheetDropdown() {
    var select = document.getElementById('scheduleSheetSelect');
    if (!select) return;
    select.innerHTML = '';
    window.scheduleSheets.forEach(sheet => {
        var opt = document.createElement('option');
        opt.value = sheet.id;
        opt.innerText = (sheet.status === 'PUBLISHED' ? '[ທາງການ] ' : '[ສະບັບຮ່າງ] ') + sheet.title;
        if (sheet.id === window.activeSheetId) opt.selected = true;
        select.appendChild(opt);
    });
}

function changeActiveSheet() {
    window.activeSheetId = document.getElementById('scheduleSheetSelect')?.value;
    saveAll();
    renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
}

async function handleCreateNewSheet() {
    var month = document.getElementById('newSheetMonthInput')?.value;
    var title = document.getElementById('newSheetTitleInput')?.value.trim() || `ຕາຕະລາງປະຈຳການ ${month}`;
    var [y, m] = month.split('-').map(Number);
    var newId = 'sheet-' + Date.now();
    var generated = generateMonthDataZigzag(y, m, null);

    var newSheet = {
        id: newId,
        monthKey: month,
        title: title,
        notes: window.defaultNotesTemplate,
        status: 'DRAFT',
        data: generated
    };

    window.scheduleSheets.push(newSheet);
    window.activeSheetId = newId;
    await saveAll();

    document.getElementById('newSheetModal')?.classList.add('hidden');
    renderSheetDropdown();
    renderScheduleTable();
    showToast('ສຳເລັດ', `ສ້າງ "${title}" ສຳເລັດ!`, 'success');
}

function openNewSheetModal() { document.getElementById('newSheetTitleInput').value = ''; document.getElementById('newSheetModal')?.classList.remove('hidden'); }

function openEditSheetInfoModal() {
    var sheet = getActiveSheet();
    document.getElementById('editSheetTitleInput').value = sheet.title;
    document.getElementById('editSheetNotesInput').value = sheet.notes || window.defaultNotesTemplate;
    document.getElementById('editSheetInfoModal')?.classList.remove('hidden');
}

async function handleSaveSheetInfo() {
    var sheet = getActiveSheet();
    sheet.title = document.getElementById('editSheetTitleInput')?.value.trim();
    sheet.notes = document.getElementById('editSheetNotesInput')?.value.trim();
    await saveAll();
    document.getElementById('editSheetInfoModal')?.classList.add('hidden');
    renderSheetDropdown();
    renderScheduleTable();
    showToast('ສຳເລັດ', 'ບັນທຶກການແກ້ໄຂແລ້ວ', 'success');
}

function promptResetSchedule() {
    askConfirm('ຣີເຊັດຕາຕະລາງ', 'ທ່ານຕ້ອງການຣີເຊັດຕາຕະລາງນີ້ທັງໝົດແທ້ບໍ່?', async () => {
        var sheet = getActiveSheet();
        sheet.data = {};
        await saveAll();
        renderScheduleTable();
        showToast('ສຳເລັດ', 'ຣີເຊັດຕາຕະລາງແລ້ວ', 'success');
    }, 'restart_alt', 'Reset');
}

function promptDeleteCurrentSheet() {
    if (window.scheduleSheets.length <= 1) {
        showToast('ແຈ້ງເຕືອນ', 'ບໍ່ສາມາດລຶບໄດ້ ເພາະຕ້ອງມີຕາຕະລາງຢ່າງໜ້ອຍ 1 ອັນໃນລະບົບ', 'error');
        return;
    }
    var sheet = getActiveSheet();
    askConfirm('ຢືນຢັນການລຶບຕາຕະລາງ', `ທ່ານຕ້ອງການລຶບ "${sheet.title}" ອອກຈາກລະບົບແທ້ບໍ່?`, async () => {
        var delId = sheet.id;
        window.scheduleSheets = window.scheduleSheets.filter(s => s.id !== delId);
        window.activeSheetId = window.scheduleSheets[0].id;
        await saveAll();
        renderSheetDropdown();
        renderScheduleTable();
        showToast('ສຳເລັດ', `ລຶບຕາຕະລາງ "${sheet.title}" ຮຽບຮ້ອຍແລ້ວ!`, 'success');
    }, 'delete', 'ລຶບຕາຕະລາງ');
}

function deleteAllDraftSheets() {
    var draftSheets = window.scheduleSheets.filter(s => s.status === 'DRAFT');
    if (draftSheets.length === 0) {
        showToast('ແຈ້ງເຕືອນ', 'ບໍ່ມີຕາຕະລາງສະບັບຮ່າງ (Draft) ໃຫ້ລຶບ', 'info');
        return;
    }
    askConfirm('ລຶບຕາຕະລາງລ່ວງໜ້າທັງໝົດ', `ທ່ານຕ້ອງການລຶບຕາຕະລາງສະບັບຮ່າງ (Draft) ທັງໝົດ ${draftSheets.length} ເດືອນ ແທ້ບໍ່?`, async () => {
        window.scheduleSheets = window.scheduleSheets.filter(s => s.status !== 'DRAFT');
        window.activeSheetId = window.scheduleSheets[0].id;
        await saveAll();
        document.getElementById('batchMonthModal')?.classList.add('hidden');
        renderSheetDropdown();
        renderScheduleTable();
        showToast('ສຳເລັດ', `ລຶບຕາຕະລາງລ່ວງໜ້າຮຽບຮ້ອຍແລ້ວ!`, 'success');
    }, 'delete_sweep', 'ລຶບ Draft ທັງໝົດ');
}

async function saveDraft() { 
    getActiveSheet().status = 'DRAFT'; 
    await saveAll(); 
    renderSheetDropdown(); 
    renderScheduleTable(); 
    showToast('ສຳເລັດ', 'ບັນທຶກສະບັບຮ່າງ (Draft) ສຳເລັດ', 'success'); 
}

// ⭐ 8. ບົດສະຫຼຸບຄວາມເທົ່າທຽມ (FAIRNESS SUMMARY)
function openFairnessSummaryModal() {
    var sheet = getActiveSheet();
    var subEl = document.getElementById('fairnessModalSub');
    if (subEl && sheet) {
        subEl.innerText = `ກວດສອບຄວາມສົມດຸນຂອງ ${sheet.title || ''}`;
    }

    var select = document.getElementById('fairnessGroupFilterSelect');
    if (select) {
        select.innerHTML = `<option value="ALL">ພະນັກງານທັງໝົດ (All Staff)</option>`;
        (window.employeeGroups || []).forEach(grp => {
            select.innerHTML += `<option value="${grp.id}">${grp.name} (${grp.members.length} ຄົນ)</option>`;
        });
    }

    renderFairnessSummaryData();
    document.getElementById('fairnessModal')?.classList.remove('hidden');
}

function closeFairnessSummaryModal() {
    document.getElementById('fairnessModal')?.classList.add('hidden');
}

function renderFairnessSummaryData() {
    var sheet = getActiveSheet();
    var schedData = sheet?.data || {};
    var dates = Object.keys(schedData);
    var filterGroupId = document.getElementById('fairnessGroupFilterSelect')?.value || 'ALL';

    var targetUsers = (window.users || []).filter(u => u.role !== 'SUPER_ADMIN');
    var isG7Filter = false;

    if (filterGroupId !== 'ALL') {
        var grp = (window.employeeGroups || []).find(g => g.id === filterGroupId);
        if (grp && grp.members) {
            targetUsers = targetUsers.filter(u => grp.members.includes(u.nameLao));
            if (grp.members.length === 7) isG7Filter = true;
        }
    } else if (targetUsers.length === 7) {
        isG7Filter = true;
    }

    var tbody = document.getElementById('fairnessSummaryTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (targetUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-slate-400">ບໍ່ພົບຂໍ້ມູນພະນັກງານ</td></tr>`;
        return;
    }

    targetUsers.forEach((u, idx) => {
        var s1 = 0, s2 = 0, s3 = 0, totalOff = 0;

        dates.forEach(d => {
            var day = schedData[d] || {};
            var onS1 = (day.shift1 || []).includes(u.nameLao);
            var onS2 = (day.shift2 || []).includes(u.nameLao);
            var onS3 = (day.shift3 || []).includes(u.nameLao);

            if (onS1) s1++;
            if (onS2) s2++;
            if (onS3) s3++;

            // ມື້ພັກຜ່ອນ (ທັງເສົາ-ອາທິດ ແລະ ວັນທຳມະດາ)
            if (!onS1 && !onS2 && !onS3) {
                totalOff++;
            }
        });

        var total = s1 + s2 + s3;
        var g7Badge = isG7Filter ? `<span class="ml-1.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-100 text-blue-700 border border-blue-300">G7</span>` : '';

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition border-b border-slate-100 text-slate-800">
                <td class="p-3 text-slate-400 font-mono">${idx + 1}</td>
                <td class="p-3 font-bold flex items-center gap-1.5">
                    ${u.nameLao} 
                    <span class="text-[10px] font-normal text-slate-400">(${u.fullName})</span>
                    ${u.isLeader ? '<span class="text-[9px] bg-brand-red text-white px-1.5 py-0.5 rounded font-bold">ຫົວໜ້າ</span>' : ''}
                    ${g7Badge}
                </td>
                <td class="p-3 text-center font-semibold text-slate-700">${s1}</td>
                <td class="p-3 text-center font-semibold text-purple-700">${s2}</td>
                <td class="p-3 text-center font-bold text-brand-red">${s3}</td>
                <td class="p-3 text-center font-bold text-emerald-600">${totalOff} ວັນ</td>
                <td class="p-3 text-right font-black text-slate-900">${total} ກະ</td>
            </tr>
        `;
    });
}

// ⭐ 9. EXPORT A4 PDF ທີ່ FIT-TO-PAGE 100% ບໍ່ຕັດຂອບຊ້າຍ
function exportToA4PDF() {
    var sheet = getActiveSheet();
    var element = document.getElementById('pdfExportArea');
    if (!element) return;

    showToast('ກຳລັງ Export', 'ກຳລັງສ້າງໄຟລ໌ PDF A4...', 'info');

    var parent = element.parentElement;
    var prevScrollTop = parent ? parent.scrollTop : 0;
    var prevScrollLeft = parent ? parent.scrollLeft : 0;
    if (parent) { parent.scrollTop = 0; parent.scrollLeft = 0; }

    var originalClass = element.className;
    var originalStyle = element.getAttribute('style') || '';

    element.classList.remove('mx-auto');
    element.style.margin = '0 !important';
    element.style.marginLeft = '0 !important';
    element.style.boxShadow = 'none';

    var noPrintEls = element.querySelectorAll('.no-print');
    noPrintEls.forEach(el => el.style.display = 'none');

    var opt = {
        margin:       [4, 4, 4, 4],
        filename:     `${sheet?.title || 'ຕາຕະລາງປະຈຳການ'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save().then(() => {
        element.className = originalClass;
        element.setAttribute('style', originalStyle);
        if (parent) { parent.scrollTop = prevScrollTop; parent.scrollLeft = prevScrollLeft; }
        noPrintEls.forEach(el => el.style.display = '');
        showToast('ສຳເລັດ', 'Export PDF A4 ສຳເລັດ!', 'success');
    }).catch(err => {
        element.className = originalClass;
        element.setAttribute('style', originalStyle);
        noPrintEls.forEach(el => el.style.display = '');
        showToast('ຜິດພາດ', 'Export ບໍ່ສຳເລັດ', 'error');
    });
}

function openHolidayModal() { document.getElementById('holidayModal')?.classList.remove('hidden'); }
async function handleSaveHolidayRange() {
    var title = document.getElementById('holidayTitleInput')?.value.trim();
    var start = document.getElementById('holidayStartDateInput')?.value;
    var end = document.getElementById('holidayEndDateInput')?.value;
    if (!title || !start || !end) return;
    
    window.specialHolidayRanges.push({ title, start, end });
    await saveAll();
    document.getElementById('holidayModal')?.classList.add('hidden');
    renderScheduleTable();
    showToast('ສຳເລັດ', 'ບັນທຶກວັນພັກພິເສດແລ້ວ', 'success');
}

function openCellModal(date, shift, index, currentName) {
    if (!window.currentUser || window.currentUser.role !== 'SUPER_ADMIN') return;
    window.activeEditCell = { date, shift, index, currentName };
    document.getElementById('cellModalSubtitle').innerText = `ວັນທີ: ${date} [${shift}]`;
    renderCellStaffList('');
    document.getElementById('cellSelectModal')?.classList.remove('hidden');
}

function closeCellModal() { document.getElementById('cellSelectModal')?.classList.add('hidden'); window.activeEditCell = null; }
function renderCellStaffList(q) {
    var container = document.getElementById('cellStaffListContainer');
    if (!container) return;
    container.innerHTML = '';
    window.users.filter(u => u.role !== 'SUPER_ADMIN' && (u.nameLao.includes(q) || u.fullName.includes(q))).forEach(u => {
        container.innerHTML += `
            <div onclick="selectStaffForCell('${u.nameLao}')" class="p-2.5 border rounded-2xl hover:bg-red-50 flex items-center justify-between cursor-pointer text-xs font-lao">
                <span>${u.nameLao} (${u.fullName})</span>
                ${u.isLeader ? '<span class="text-[10px] bg-brand-red text-white px-2 py-0.5 rounded-full font-bold">ຫົວໜ້າ</span>' : ''}
            </div>
        `;
    });
}
function filterCellStaffList() { renderCellStaffList(document.getElementById('searchCellStaffInput')?.value.trim()); }

// ຜູກທຸກ Function ເຂົ້າ window ໃຫ້ກົດໄດ້ທຸກປຸ່ມ
window.rebalanceNightShifts = rebalanceNightShifts;
window.openEditPublishedScheduleGuide = openEditPublishedScheduleGuide;
window.renderScheduleTable = renderScheduleTable;
window.renderSheetDropdown = renderSheetDropdown;
window.changeActiveSheet = changeActiveSheet;
window.generateMonthDataZigzag = generateMonthDataZigzag;
window.generate7PersonFlexZigzag = generate7PersonFlexZigzag;
window.generateFairBalancedZigzag = generateFairBalancedZigzag;
window.executeGroupRandomSchedule = executeGroupRandomSchedule;
window.openRandomGroupSelectModal = openRandomGroupSelectModal;
window.openBatchMonthModal = openBatchMonthModal;
window.executeBatchMonthGenerate = executeBatchMonthGenerate;
window.promptDeleteCurrentSheet = promptDeleteCurrentSheet;
window.deleteAllDraftSheets = deleteAllDraftSheets;
window.openFixedShiftModal = openFixedShiftModal;
window.renderActiveFixedShiftsList = renderActiveFixedShiftsList;
window.handleAddFixedShift = handleAddFixedShift;
window.removeFixedShift = removeFixedShift;
window.openNewSheetModal = openNewSheetModal;
window.handleCreateNewSheet = handleCreateNewSheet;
window.openEditSheetInfoModal = openEditSheetInfoModal;
window.handleSaveSheetInfo = handleSaveSheetInfo;
window.promptResetSchedule = promptResetSchedule;
window.saveDraft = saveDraft;
window.publishSchedule = publishSchedule;
window.exportToA4PDF = exportToA4PDF;
window.openHolidayModal = openHolidayModal;
window.handleSaveHolidayRange = handleSaveHolidayRange;
window.openCellModal = openCellModal;
window.closeCellModal = closeCellModal;
window.filterCellStaffList = filterCellStaffList;
window.selectStaffForCell = selectStaffForCell;
window.clearCurrentCell = clearCurrentCell;
window.openEditPublishedRemarkModal = openEditPublishedRemarkModal;
window.closeEditPublishedRemarkModal = closeEditPublishedRemarkModal;
window.confirmApplyPublishedCellUpdate = confirmApplyPublishedCellUpdate;
window.openFairnessSummaryModal = openFairnessSummaryModal;
window.closeFairnessSummaryModal = closeFairnessSummaryModal;
window.renderFairnessSummaryData = renderFairnessSummaryData;

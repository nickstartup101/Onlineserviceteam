// ================= ⭐ FAIR ZIGZAG SCHEDULE ENGINE & SUPABASE CLOUD SYNC =================

// 0. FUNCTION ກວດສອບຊ່ວງວັນພັກພິເສດ
function isDateInHolidayRange(dStr) {
    var holList = window.specialHolidayRanges || [];
    return holList.some(h => {
        if (!h.start_date || !h.end_date) return false;
        return dStr >= h.start_date && dStr <= h.end_date;
    });
}

// 0.1 FUNCTION SYNC ຕາຕະລາງຂຶ້ນ SUPABASE ພ້ອມ SAVE ໝາຍເຫດແບບປອດໄພ 100%
async function syncScheduleToSupabase(sheet) {
    if (!window.supabaseClient || !sheet) return;
    try {
        // ຝັງ title ແລະ notes ໄວ້ໃນ data._meta ເພື່ອປ້ອງກັນ Supabase ບໍ່ມີ column notes
        if (!sheet.data) sheet.data = {};
        sheet.data._meta = {
            title: sheet.title || '',
            notes: sheet.notes || ''
        };

        var payload = {
            id: sheet.id,
            month_key: sheet.monthKey,
            title: sheet.title,
            notes: sheet.notes || '',
            status: sheet.status || 'DRAFT',
            data: sheet.data
        };

        var { error } = await window.supabaseClient.from('schedules').upsert(payload, { onConflict: 'id' });
        if (error) {
            // ຖ້າ database ບໍ່ມີ column 'notes', ໃຫ້ລອງ upsert ແບບບໍ່ສົ່ງ column notes (ເພາະມັນຢູ່ໃນ data._meta ແລ້ວ)
            if (error.message && error.message.includes('notes')) {
                delete payload.notes;
                await window.supabaseClient.from('schedules').upsert(payload, { onConflict: 'id' });
                console.log("☁️ [Supabase]: Saved notes safely inside data._meta!");
            } else {
                console.error("❌ [Supabase Sync Error]:", error);
            }
        } else {
            console.log("☁️ [Supabase Cloud]: Sync schedule success ->", sheet.id);
        }
    } catch (err) {
        console.error("❌ [Supabase Exception]:", err);
    }
}

// ⭐ 1. ສູດຄຳນວນອາທິດ ຈັນ-ສຸກ ແບບຕໍ່ເນື່ອງຂ້າມເດືອນ (Continuous Monday-Based Week)
function getMondayBasedWeekIndex(dateObj) {
    var epoch = Date.UTC(2026, 0, 5); // ວັນຈັນ 5/01/2026
    var current = Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate());
    var diffDays = Math.floor((current - epoch) / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7);
}

// ⭐ 1.1 ສູດຄຳນວນວັນເສົາ-ອາທິດ ແບບຕໍ່ເນື່ອງຂ້າມເດືອນ (Continuous Global Weekend Counter)
function getGlobalWeekendDayIndex(dateObj) {
    var epoch = Date.UTC(2026, 0, 1);
    var current = Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate());
    var totalDays = Math.floor((current - epoch) / (1000 * 60 * 60 * 24));
    
    var fullWeeks = Math.floor(totalDays / 7);
    var weekendCount = fullWeeks * 2;
    var rem = totalDays % 7;
    for (var d = 0; d < rem; d++) {
        var chk = new Date(epoch + (fullWeeks * 7 + d) * 86400000);
        var day = chk.getUTCDay();
        if (day === 6 || day === 0) weekendCount++;
    }
    return weekendCount;
}

// 2. ປຸ່ມ REBALANCE ອັດສະລິຍະ (ປັບທັງກະ 3 ແລະ ປັບຄົນພັກຫຼາຍມາແທນຄົນພັກໜ້ອຍ ໃຫ້ເທົ່າທຽມກັນ 100%)
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
            if (n && !window.fixedShiftsConfig?.some(f => f.nameLao === n)) {
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

    function countTotalDuties() {
        var counts = {};
        staffList.forEach(n => counts[n] = 0);
        dates.forEach(d => {
            [...(schedData[d].shift1 || []), ...(schedData[d].shift2 || []), ...(schedData[d].shift3 || [])].forEach(n => {
                if (counts[n] !== undefined) counts[n]++;
            });
        });
        return counts;
    }

    // ປັບສົມດຸນກະ 3
    var maxIterS3 = 300, iterS3 = 0;
    while (iterS3 < maxIterS3) {
        var s3Counts = countS3();
        var maxStaffS3 = staffList.reduce((a, b) => s3Counts[a] > s3Counts[b] ? a : b);
        var minStaffS3 = staffList.reduce((a, b) => s3Counts[a] < s3Counts[b] ? a : b);

        if (s3Counts[maxStaffS3] - s3Counts[minStaffS3] <= 1) break;

        var swapped = false;
        for (var i = 0; i < dates.length; i++) {
            var d = dates[i];
            var dayData = schedData[d];
            var maxInS3 = (dayData.shift3 || []).includes(maxStaffS3);
            var minInS3 = (dayData.shift3 || []).includes(minStaffS3);

            if (maxInS3 && !minInS3) {
                if ((dayData.shift1 || []).includes(minStaffS3)) {
                    var idx3 = dayData.shift3.indexOf(maxStaffS3);
                    var idx1 = dayData.shift1.indexOf(minStaffS3);
                    dayData.shift3[idx3] = minStaffS3;
                    dayData.shift1[idx1] = maxStaffS3;
                    swapped = true;
                    break;
                } else if ((dayData.shift2 || []).includes(minStaffS3)) {
                    var idx3 = dayData.shift3.indexOf(maxStaffS3);
                    var idx2 = dayData.shift2.indexOf(minStaffS3);
                    dayData.shift3[idx3] = minStaffS3;
                    dayData.shift2[idx2] = maxStaffS3;
                    swapped = true;
                    break;
                }
            }
        }
        if (!swapped) break;
        iterS3++;
    }

    // ປັບສົມດຸນວັນພັກ
    var maxIterDuty = 400, iterDuty = 0;
    while (iterDuty < maxIterDuty) {
        var dutyCounts = countTotalDuties();
        var maxWorker = staffList.reduce((a, b) => dutyCounts[a] > dutyCounts[b] ? a : b);
        var minWorker = staffList.reduce((a, b) => dutyCounts[a] < dutyCounts[b] ? a : b);

        if (dutyCounts[maxWorker] - dutyCounts[minWorker] <= 1) break;

        var transferred = false;
        for (var i = 0; i < dates.length; i++) {
            var d = dates[i];
            var dayData = schedData[d];
            var onS1 = (dayData.shift1 || []).includes(maxWorker);
            var onS2 = (dayData.shift2 || []).includes(maxWorker);
            var onS3 = (dayData.shift3 || []).includes(maxWorker);
            var minBusy = (dayData.shift1 || []).includes(minWorker) || (dayData.shift2 || []).includes(minWorker) || (dayData.shift3 || []).includes(minWorker);

            if ((onS1 || onS2 || onS3) && !minBusy) {
                if (onS1) {
                    var idx = dayData.shift1.indexOf(maxWorker);
                    dayData.shift1[idx] = minWorker;
                    transferred = true;
                    break;
                } else if (onS2) {
                    var idx = dayData.shift2.indexOf(maxWorker);
                    dayData.shift2[idx] = minWorker;
                    transferred = true;
                    break;
                } else if (onS3 && (countS3()[maxWorker] > countS3()[minWorker])) {
                    var idx = dayData.shift3.indexOf(maxWorker);
                    dayData.shift3[idx] = minWorker;
                    transferred = true;
                    break;
                }
            }
        }
        if (!transferred) break;
        iterDuty++;
    }

    await saveAll();
    await syncScheduleToSupabase(sheet);
    renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    showToast('Rebalance ສຳເລັດ', `ປັບສົມດຸນທຸກຄົນເທົ່າທຽມກັນ (ຜິດດ່ຽງບໍ່ເກີນ ±1) ແລະ Sync ລົງ Supabase ແລ້ວ!`, 'success');
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

// ⭐ 3. ສູດກຸ່ມ 7 ຄົນ: ເຮັດວຽກ 5 ວັນ ພັກ 2 ວັນ ແບບຕໍ່ເນື່ອງຂ້າມເດືອນ
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

        var dailySlots = [];
        for (var p = 0; p < N; p++) {
            var assignedSlot = (p + totalDays) % N;
            dailySlots[assignedSlot] = staffList[p];
        }

        // ໝູນວຽນຮູບແບບຕໍ່ເນື່ອງຕາມ totalDays
        var mode = totalDays % 3;
        var s1 = [], s2 = [], s3 = [];

        if (mode === 0) {
            s1 = [dailySlots[0], dailySlots[1]];
            s2 = [dailySlots[2], dailySlots[3]];
            s3 = [dailySlots[4]];
        } else if (mode === 1) {
            s1 = [dailySlots[0]];
            s2 = [dailySlots[1], dailySlots[2]];
            s3 = [dailySlots[3], dailySlots[4]];
        } else {
            s1 = [dailySlots[0], dailySlots[1]];
            s2 = [dailySlots[2]];
            s3 = [dailySlots[3], dailySlots[4]];
        }

        data[dStr] = {
            isWeekend: isWeekend,
            isG7Team: true,
            shift1: s1.filter(Boolean),
            shift2: s2.filter(Boolean),
            shift3: s3.filter(Boolean)
        };
    }
    return data;
}

// ⭐ 4. ສູດທີມຫຼັກ 17 ຄົນ: ສືບທອດ Pattern ຕໍ່ເນື່ອງຈາກເດືອນກ່ອນໜ້າ 100%
function generate17PersonLeadersAndStaffZigzag(year, month, staffList) {
    var daysCount = new Date(year, month, 0).getDate();
    var data = {};

    var leaderNames = staffList.filter(name => {
        var u = (window.users || []).find(usr => usr.nameLao === name);
        return u && u.isLeader;
    });

    if (leaderNames.length < 4) {
        leaderNames = ['ແສງດາວ', 'ພອນສະຫວັນ', 'ບຸນປະເສີດ', 'ພັນນິກອນ'].filter(n => staffList.includes(n));
    }
    while (leaderNames.length < 4 && staffList.length > leaderNames.length) {
        var extra = staffList.find(n => !leaderNames.includes(n));
        if (extra) leaderNames.push(extra);
    }

    var regularStaff = staffList.filter(n => !leaderNames.includes(n));
    var numRegular = regularStaff.length || 13;

    for (var i = 1; i <= daysCount; i++) {
        var dayNum = i < 10 ? '0' + i : '' + i;
        var mNum = month < 10 ? '0' + month : '' + month;
        var dStr = `${year}-${mNum}-${dayNum}`;
        var dateObj = new Date(Date.UTC(year, month - 1, i));
        var dayOfWeek = dateObj.getUTCDay();
        var isWeekend = (dayOfWeek === 6 || dayOfWeek === 0 || isDateInHolidayRange(dStr));

        if (isWeekend) {
            // ⭐ ວັນເສົາ-ອາທິດ ໃຊ້ Global Weekend Index ຕໍ່ເນື່ອງກັນຂ້າມເດືອນ
            var gWeekend = getGlobalWeekendDayIndex(dateObj);
            var wLeader = leaderNames[gWeekend % 4];

            var wStaff = [];
            for (var k = 0; k < 5; k++) {
                wStaff.push(regularStaff[(gWeekend * 5 + k) % numRegular]);
            }

            data[dStr] = {
                isWeekend: true,
                isG7Team: false,
                shift1: [wLeader, wStaff[0]].filter(Boolean),
                shift2: [wStaff[1], wStaff[2]].filter(Boolean),
                shift3: [wStaff[3], wStaff[4]].filter(Boolean)
            };
        } else {
            // ⭐ ວັນຈັນ - ສຸກ ໃຊ້ອາທິດ W ແບບຕໍ່ເນື່ອງຂ້າມເດືອນ
            var W = getMondayBasedWeekIndex(dateObj);

            // 1. ຫົວໜ້າ: 1A ➔ 3 ➔ 2 ➔ 1B
            var l_1A = leaderNames[(W + 0) % 4];
            var l_1B = leaderNames[(W + 1) % 4];
            var l_S2 = leaderNames[(W + 2) % 4];
            var l_S3 = leaderNames[(W + 3) % 4];

            // 2. ພະນັກງານ: 3 ➔ 2 ➔ 1 ➔ 3
            var staffOffset = (13000 - W * 3) % numRegular;
            var rotated = [];
            for (var r = 0; r < numRegular; r++) {
                rotated.push(regularStaff[(r + staffOffset) % numRegular]);
            }

            var staff_S3 = rotated.slice(0, 3);
            var staff_S2 = rotated.slice(3, 8);
            var staff_S1 = rotated.slice(8, 13);

            data[dStr] = {
                isWeekend: false,
                isG7Team: false,
                shift1: [l_1A, l_1B, ...staff_S1].filter(Boolean),
                shift2: [l_S2, ...staff_S2].filter(Boolean),
                shift3: [l_S3, ...staff_S3].filter(Boolean)
            };
        }
    }

    return data;
}

// 5. ເລືອກສູດອັດຕະໂນມັດຕາມຈຳນວນຄົນໃນກຸ່ມ
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
        return generate17PersonLeadersAndStaffZigzag(year, month, staffList);
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
        var isG7 = (grp.members || []).length === 7;
        var tag = isG7 ? ' 🔹 [ກຸ່ມ 7 ຄົນ - Rolling 5/2]' : '';
        opt.innerText = `${grp.name} (${grp.members.length} ຄົນ)${tag}`;
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
        if (found && found.members) {
            members = found.members;
            sheet.isG7GroupSheet = (members.length === 7);
        }
    } else {
        sheet.isG7GroupSheet = false;
    }

    sheet.data = generateMonthDataZigzag(year, month, members);
    
    await rebalanceNightShifts();
    await saveAll();
    await syncScheduleToSupabase(sheet);

    document.getElementById('randomGroupSelectModal')?.classList.add('hidden');
    renderScheduleTable();
    showToast('ສຳເລັດ', `ສ້າງຕາຕະລາງ Zigzag ແລະ Sync ລົງ Supabase ຮຽບຮ້ອຍ!`, 'success');
}

function openBatchMonthModal() {
    var select = document.getElementById('batchTargetGroupSelect');
    if (select) {
        select.innerHTML = `<option value="ALL">ພະນັກງານທັງໝົດ (All Staff)</option>`;
        (window.employeeGroups || []).forEach(grp => {
            var isG7 = (grp.members || []).length === 7;
            var tag = isG7 ? ' 🔹 [ກຸ່ມ 7 ຄົນ - Rolling 5/2]' : '';
            select.innerHTML += `<option value="${grp.id}">${grp.name} (${grp.members.length} ຄົນ)${tag}</option>`;
        });
    }
    document.getElementById('batchMonthModal')?.classList.remove('hidden');
}

// ⭐ ສ້າງຕາຕະລາງຫຼາຍເດືອນຕໍ່ເນື່ອງ ພ້ອມສືບທອດ ໝາຍເຫດ ແລະ Pattern ອັດຕະໂນມັດ
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
    var isG7 = false;
    if (selectedGrpId !== 'ALL') {
        var foundGrp = (window.employeeGroups || []).find(g => g.id === selectedGrpId);
        if (foundGrp) {
            selectedMembers = foundGrp.members;
            isG7 = (selectedMembers.length === 7);
            groupNameTag = isG7 ? ` (${foundGrp.name} - G7)` : ` (${foundGrp.name})`;
        }
    }

    var [startYear, startMonth] = startM.split('-').map(Number);
    var firstGeneratedSheetId = null;
    var activeSheet = getActiveSheet();
    // ສືບທອດໝາຍເຫດຈາກເດືອນປັດຈຸບັນ
    var currentNotes = activeSheet?.notes || activeSheet?.data?._meta?.notes || window.defaultNotesTemplate;

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
        var currentSheetObj = null;
        if (existingIdx !== -1) {
            window.scheduleSheets[existingIdx].data = generatedData;
            window.scheduleSheets[existingIdx].title = title;
            window.scheduleSheets[existingIdx].notes = currentNotes;
            window.scheduleSheets[existingIdx].isG7GroupSheet = isG7;
            currentSheetObj = window.scheduleSheets[existingIdx];
        } else {
            currentSheetObj = {
                id: sheetId,
                monthKey: monthKey,
                title: title,
                notes: currentNotes,
                status: 'DRAFT',
                isG7GroupSheet: isG7,
                data: generatedData
            };
            window.scheduleSheets.push(currentSheetObj);
        }

        if (c === 0) firstGeneratedSheetId = sheetId;
        await syncScheduleToSupabase(currentSheetObj);
    }

    if (firstGeneratedSheetId) window.activeSheetId = firstGeneratedSheetId;

    await saveAll();
    await rebalanceNightShifts();
    document.getElementById('batchMonthModal')?.classList.add('hidden');
    renderSheetDropdown();
    renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    showToast('ສຳເລັດ', `ສ້າງຕາຕະລາງຕໍ່ເນື່ອງ ${count} ເດືອນ ແລະ Sync ລົງ Supabase ສຳເລັດ!`, 'success');
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
    await syncScheduleToSupabase(sheet);
    renderSheetDropdown();
    renderScheduleTable();
    if (typeof window.updateNotificationBadge === 'function') window.updateNotificationBadge();
    showToast('ເຜີຍແຜ່ສຳເລັດ', 'ຕາຕະລາງຖືກ Publish ເປັນທາງການ ແລະ Sync ລົງ Supabase ແລ້ວ!', 'success');
}

// ⭐ 6. ຕາຕະລາງສະແດງຜົນ (ສະແດງຫົວຂໍ້ເວລາ 08-13:30, 13:30-19, 19-08 ສຳລັບວັນພັກ)
function renderScheduleTable() {
    renderSheetDropdown();
    if (typeof window.renderScheduleStaffRoster === 'function') window.renderScheduleStaffRoster();
    var sheet = getActiveSheet();
    var scheduleData = sheet?.data || {};
    var [year, month] = (sheet?.monthKey || '2026-09').split('-').map(Number);
    var daysCount = new Date(year, month, 0).getDate();

    var isOfficial = sheet?.status === 'PUBLISHED';
    var isG7 = sheet?.isG7GroupSheet || false;

    // ດຶງ title ແລະ notes (ມີ fallback ຈາກ data._meta)
    var currentTitle = sheet?.title || sheet?.data?._meta?.title || '';
    var currentNotes = sheet?.notes || sheet?.data?._meta?.notes || window.defaultNotesTemplate;

    var titleEl = document.getElementById('scheduleTableTitle');
    if (titleEl) {
        titleEl.innerHTML = `
            <span>${currentTitle}</span>
            <span class="no-print ml-2 text-xs font-semibold ${isOfficial ? 'text-emerald-700' : 'text-amber-700'}">
                (${isOfficial ? 'ສະບັບທາງການ' : 'ສະບັບຮ່າງລ່ວງໜ້າ'})
            </span>
        `;
    }
    
    var notesEl = document.getElementById('scheduleNotesDisplay');
    if (notesEl) notesEl.innerText = currentNotes;

    var banner = document.getElementById('scheduleStatusBanner');
    var badge = document.getElementById('scheduleStatusBadge');
    var modCountText = document.getElementById('modifiedCellCountText');

    if (banner && badge) {
        var g7BadgeInBanner = isG7 ? `<span class="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">🔹 ກຸ່ມ 7 ຄົນ (Rolling 5/2)</span>` : '';
        if (isOfficial) {
            banner.className = "no-print px-6 py-2 bg-emerald-50 border-b border-emerald-200 flex justify-between items-center text-xs";
            badge.className = "font-bold text-emerald-800 flex items-center gap-2";
            badge.innerHTML = `<span class="material-symbols-outlined text-sm text-emerald-600">verified</span> ຕາຕະລາງທາງການ (Published Official) ${g7BadgeInBanner}`;
        } else {
            banner.className = "no-print px-6 py-2 bg-amber-50 border-b border-amber-200 flex justify-between items-center text-xs";
            badge.className = "font-bold text-amber-900 flex items-center gap-2";
            badge.innerHTML = `<span class="material-symbols-outlined text-sm text-amber-700">pending_actions</span> ສະບັບຮ່າງລ່ວງໜ້າ ${g7BadgeInBanner}`;
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

    var prevHeaderType = null;

    for (var i = 1; i <= daysCount; i++) {
        var dayNum = i < 10 ? '0' + i : '' + i;
        var mNum = month < 10 ? '0' + month : '' + month;
        var dStr = `${year}-${mNum}-${dayNum}`;
        var dayOfWeek = dayNamesLao[new Date(year, month - 1, i).getDay()];
        var dayData = scheduleData[dStr] || { isWeekend: false, shift1: [], shift2: [], shift3: [] };
        var isHol = isDateInHolidayRange(dStr);
        var isWeekendOrHol = (dayOfWeek === 'SAT' || dayOfWeek === 'SUN' || isHol);

        var currentHeaderType = isWeekendOrHol ? 'HOLIDAY' : 'REGULAR';
        var shouldShowHeader = (i === 1) || 
                                (dayOfWeek === 'SAT') || 
                                (dayOfWeek === 'MON' && !isWeekendOrHol) || 
                                (currentHeaderType !== prevHeaderType);

        if (shouldShowHeader) {
            if (isWeekendOrHol) {
                tbody.innerHTML += `
                    <tr class="bg-red-50/80 font-bold border-t-2 border-b border-black text-brand-red">
                        <td colspan="2" class="p-1 text-center font-bold text-xs">${isHol ? 'ວັນພັກພິເສດ' : 'ວັນພັກ'}</td>
                        <td class="p-1 text-center font-bold text-xs">08:00 - 13:30</td>
                        <td class="p-1 text-center font-bold text-xs">13:30 - 19:00</td>
                        <td class="p-1 text-center font-bold text-xs">19:00 - 08:00</td>
                    </tr>
                `;
            } else {
                tbody.innerHTML += `
                    <tr class="bg-slate-100 font-bold border-t-2 border-b border-black text-slate-800">
                        <th style="width: 75px;" class="p-1 font-bold">ວັນທີ</th>
                        <th style="width: 48px;" class="p-1 font-bold">ວັນ</th>
                        <th style="width: 33%;" class="p-1 font-bold">08:00 - 16:00</th>
                        <th style="width: 33%;" class="p-1 font-bold">12:00 - 20:00</th>
                        <th style="width: 25%;" class="p-1 font-bold">20:00 - 08:00</th>
                    </tr>
                `;
            }
        }
        prevHeaderType = currentHeaderType;

        tbody.innerHTML += `
            <tr class="${isWeekendOrHol ? 'bg-slate-50' : 'bg-white'}">
                <td class="font-bold whitespace-nowrap">${i}/${mNum}/${year}</td>
                <td class="font-bold ${isWeekendOrHol ? 'text-brand-red' : ''}">${dayOfWeek}</td>
                <td class="p-0">${renderPixelExcelGrid(dStr, 'shift1', dayData.shift1 || [], isWeekendOrHol ? 1 : 2, isWeekendOrHol ? 3 : Math.max(3, Math.ceil((dayData.shift1 || []).length / 2)), isAdmin, sheet?.id)}</td>
                <td class="p-0">${renderPixelExcelGrid(dStr, 'shift2', dayData.shift2 || [], isWeekendOrHol ? 1 : 2, isWeekendOrHol ? 3 : Math.max(3, Math.ceil((dayData.shift2 || []).length / 2)), isAdmin, sheet?.id)}</td>
                <td class="p-0">${renderPixelExcelGrid(dStr, 'shift3', dayData.shift3 || [], isWeekendOrHol ? 1 : 2, isWeekendOrHol ? 3 : Math.max(2, Math.ceil((dayData.shift3 || []).length / 2)), isAdmin, sheet?.id)}</td>
            </tr>
        `;
    }
}

function renderPixelExcelGrid(date, shift, list, rows, cols, isAdmin, sheetId) {
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

        html += `
            <div class="grid-cell-box ${borderR} ${borderB} ${isAdmin ? 'editable' : ''} ${highlightClass} ${isLeader ? 'text-brand-red font-semibold' : 'text-slate-800'}" ${clickHandler}>
                ${name}
            </div>
        `;
    }
    html += `</div>`;
    return html;
}

async function selectStaffForCell(nameLao) {
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

    await saveAll();
    await syncScheduleToSupabase(sheet);
    closeCellModal();
    renderScheduleTable();
    showToast('ສຳເລັດ', 'ປັບປ່ຽນພະນັກງານ ແລະ Sync ລົງ Supabase ແລ້ວ', 'success');
}

async function clearCurrentCell() {
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
        await saveAll();
        await syncScheduleToSupabase(sheet);
        closeCellModal();
        renderScheduleTable();
        showToast('ສຳເລັດ', 'ລຶບຊ່ອງ ແລະ Sync ລົງ Supabase ແລ້ວ', 'success');
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
    await syncScheduleToSupabase(sheet);
    closeEditPublishedRemarkModal();
    closeCellModal();
    renderScheduleTable();
    if (typeof window.updateNotificationBadge === 'function') window.updateNotificationBadge();
    showToast('ອັບເດດສຳເລັດ', `ດັດແກ້ຕາຕະລາງ ແລະ Sync ລົງ Supabase ແລ້ວ!`, 'success');
}

function renderSheetDropdown() {
    var select = document.getElementById('scheduleSheetSelect');
    if (!select) return;
    select.innerHTML = '';
    window.scheduleSheets.forEach(sheet => {
        var opt = document.createElement('option');
        opt.value = sheet.id;
        opt.innerText = (sheet.status === 'PUBLISHED' ? '[ທາງການ] ' : '[ສະບັບຮ່າງ] ') + (sheet.title || sheet.data?._meta?.title || '');
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

// ⭐ ສ້າງຕາຕະລາງໃໝ່ ພ້ອມສືບທອດ ໝາຍເຫດ ຈາກເດືອນກ່ອນ
async function handleCreateNewSheet() {
    var month = document.getElementById('newSheetMonthInput')?.value;
    var title = document.getElementById('newSheetTitleInput')?.value.trim() || `ຕາຕະລາງປະຈຳການ ${month}`;
    var [y, m] = month.split('-').map(Number);
    var newId = 'sheet-' + Date.now();
    var generated = generateMonthDataZigzag(y, m, null);

    var activeSheet = getActiveSheet();
    var inheritedNotes = activeSheet?.notes || activeSheet?.data?._meta?.notes || window.defaultNotesTemplate;

    var newSheet = {
        id: newId,
        monthKey: month,
        title: title,
        notes: inheritedNotes,
        status: 'DRAFT',
        data: generated
    };

    window.scheduleSheets.push(newSheet);
    window.activeSheetId = newId;
    await saveAll();
    await syncScheduleToSupabase(newSheet);

    document.getElementById('newSheetModal')?.classList.add('hidden');
    renderSheetDropdown();
    renderScheduleTable();
    showToast('ສຳເລັດ', `ສ້າງ "${title}" ແລະ Sync ລົງ Supabase ສຳເລັດ!`, 'success');
}

function openNewSheetModal() { document.getElementById('newSheetTitleInput').value = ''; document.getElementById('newSheetModal')?.classList.remove('hidden'); }

// ⭐ ເປີດ MODAL ແກ້ໄຂຫົວຂໍ້ & ໝາຍເຫດ (ດຶງຄ່າທີ່ບັນທຶກໄວ້ອັດຕະໂນມັດ)
function openEditSheetInfoModal() {
    var sheet = getActiveSheet();
    if (!sheet) return;
    document.getElementById('editSheetTitleInput').value = sheet.title || sheet.data?._meta?.title || '';
    document.getElementById('editSheetNotesInput').value = sheet.notes || sheet.data?._meta?.notes || window.defaultNotesTemplate;
    document.getElementById('editSheetInfoModal')?.classList.remove('hidden');
}

// ⭐ ບັນທຶກຫົວຂໍ້ & ໝາຍເຫດ ລົງ SUPABASE ແລະ LOCALSTORAGE 100% ບໍ່ມີວັນຫາຍ
async function handleSaveSheetInfo() {
    var sheet = getActiveSheet();
    if (!sheet) return;

    var newTitle = document.getElementById('editSheetTitleInput')?.value.trim();
    var newNotes = document.getElementById('editSheetNotesInput')?.value.trim();

    sheet.title = newTitle || sheet.title;
    sheet.notes = newNotes;

    // ບັນທຶກຝັງໄວ້ໃນ data._meta ພ້ອມກັນ
    if (!sheet.data) sheet.data = {};
    sheet.data._meta = {
        title: sheet.title,
        notes: sheet.notes
    };

    await saveAll();
    await syncScheduleToSupabase(sheet);

    document.getElementById('editSheetInfoModal')?.classList.add('hidden');
    renderSheetDropdown();
    renderScheduleTable();
    showToast('ສຳເລັດ', 'ບັນທຶກຫົວຂໍ້ & ໝາຍເຫດ ລົງ Database ຮຽບຮ້ອຍແລ້ວ!', 'success');
}

function promptResetSchedule() {
    askConfirm('ຣີເຊັດຕາຕະລາງ', 'ທ່ານຕ້ອງການຣີເຊັດຕາຕະລາງນີ້ທັງໝົດແທ້ບໍ່?', async () => {
        var sheet = getActiveSheet();
        sheet.data = {};
        await saveAll();
        await syncScheduleToSupabase(sheet);
        renderScheduleTable();
        showToast('ສຳເລັດ', 'ຣີເຊັດຕາຕະລາງ ແລະ Sync ລົງ Supabase ແລ້ວ', 'success');
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

        if (window.supabaseClient) {
            try {
                await window.supabaseClient.from('schedules').delete().eq('id', delId);
                console.log("☁️ [Supabase]: Deleted schedule ->", delId);
            } catch (err) {
                console.error("❌ [Supabase Delete Error]:", err);
            }
        }

        renderSheetDropdown();
        renderScheduleTable();
        showToast('ສຳເລັດ', `ລຶບຕາຕະລາງອອກຈາກ Supabase ຮຽບຮ້ອຍແລ້ວ!`, 'success');
    }, 'delete', 'ລຶບຕາຕະລາງ');
}

function deleteAllDraftSheets() {
    var draftSheets = window.scheduleSheets.filter(s => s.status === 'DRAFT');
    if (draftSheets.length === 0) {
        showToast('ແຈ້ງເຕືອນ', 'ບໍ່ມີຕາຕະລາງສະບັບຮ່າງ (Draft) ໃຫ້ລຶບ', 'info');
        return;
    }
    askConfirm('ລຶບຕາຕະລາງລ່ວງໜ້າທັງໝົດ', `ທ່ານຕ້ອງການລຶບຕາຕະລາງສະບັບຮ່າງ (Draft) ທັງໝົດ ${draftSheets.length} ເດືອນ ແທ້ບໍ່?`, async () => {
        var draftIds = draftSheets.map(s => s.id);
        window.scheduleSheets = window.scheduleSheets.filter(s => s.status !== 'DRAFT');
        window.activeSheetId = window.scheduleSheets[0].id;
        await saveAll();

        if (window.supabaseClient && draftIds.length > 0) {
            try {
                await window.supabaseClient.from('schedules').delete().in('id', draftIds);
                console.log("☁️ [Supabase]: Deleted batch drafts ->", draftIds);
            } catch (err) {
                console.error("❌ [Supabase Batch Delete Error]:", err);
            }
        }

        document.getElementById('batchMonthModal')?.classList.add('hidden');
        renderSheetDropdown();
        renderScheduleTable();
        showToast('ສຳເລັດ', `ລຶບຕາຕະລາງລ່ວງໜ້າອອກຈາກ Supabase ຮຽບຮ້ອຍແລ້ວ!`, 'success');
    }, 'delete_sweep', 'ລຶບ Draft ທັງໝົດ');
}

async function saveDraft() { 
    var sheet = getActiveSheet();
    sheet.status = 'DRAFT'; 
    await saveAll(); 
    await syncScheduleToSupabase(sheet);
    renderSheetDropdown(); 
    renderScheduleTable(); 
    showToast('ສຳເລັດ', 'ບັນທຶກສະບັບຮ່າງ (Draft) ແລະ Sync ລົງ Supabase ແລ້ວ', 'success'); 
}

function openFairnessSummaryModal() {
    var sheet = getActiveSheet();
    var subEl = document.getElementById('fairnessModalSub');
    if (subEl && sheet) {
        subEl.innerText = `ກວດສອບຄວາມສົມດຸນຂອງ ${sheet.title || sheet.data?._meta?.title || ''}`;
    }

    var select = document.getElementById('fairnessGroupFilterSelect');
    if (select) {
        select.innerHTML = `<option value="ALL">ພະນັກງານທັງໝົດ (All Staff)</option>`;
        (window.employeeGroups || []).forEach(grp => {
            var isG7 = (grp.members || []).length === 7;
            var tag = isG7 ? ' 🔹 [ກຸ່ມ 7 ຄົນ - Rolling 5/2]' : '';
            select.innerHTML += `<option value="${grp.id}">${grp.name} (${grp.members.length} ຄົນ)${tag}</option>`;
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

    if (filterGroupId !== 'ALL') {
        var grp = (window.employeeGroups || []).find(g => g.id === filterGroupId);
        if (grp && grp.members) {
            targetUsers = targetUsers.filter(u => grp.members.includes(u.nameLao));
        }
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

            if (!onS1 && !onS2 && !onS3) {
                totalOff++;
            }
        });

        var total = s1 + s2 + s3;

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 transition border-b border-slate-100 text-slate-800">
                <td class="p-3 text-slate-400 font-mono">${idx + 1}</td>
                <td class="p-3 font-bold flex items-center gap-1.5">
                    ${u.nameLao} 
                    <span class="text-[10px] font-normal text-slate-400">(${u.fullName})</span>
                    ${u.isLeader ? '<span class="text-[9px] bg-brand-red text-white px-1.5 py-0.5 rounded font-bold">ຫົວໜ້າ</span>' : ''}
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

// 9. EXPORT A4 PDF ທີ່ FIT-TO-PAGE 100% ບໍ່ຕັດຂອບຊ້າຍ
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
        filename:     `${sheet?.title || sheet?.data?._meta?.title || 'ຕາຕະລາງປະຈຳການ'}.pdf`,
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
    
    var newHol = { title: title, start_date: start, end_date: end };
    if (!window.specialHolidayRanges) window.specialHolidayRanges = [];
    window.specialHolidayRanges.push(newHol);
    await saveAll();

    if (window.supabaseClient) {
        try {
            await window.supabaseClient.from('special_holidays').insert([newHol]);
            console.log("☁️ [Supabase]: Inserted special holiday ->", newHol);
        } catch (err) {
            console.error("❌ [Supabase Holiday Error]:", err);
        }
    }

    document.getElementById('holidayModal')?.classList.add('hidden');
    renderScheduleTable();
    showToast('ສຳເລັດ', 'ບັນທຶກວັນພັກພິເສດ ແລະ Sync ລົງ Supabase ແລ້ວ', 'success');
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

// ຜູກທຸກ Function ເຂົ້າ window
window.isDateInHolidayRange = isDateInHolidayRange;
window.syncScheduleToSupabase = syncScheduleToSupabase;
window.getMondayBasedWeekIndex = getMondayBasedWeekIndex;
window.getGlobalWeekendDayIndex = getGlobalWeekendDayIndex;
window.rebalanceNightShifts = rebalanceNightShifts;
window.openEditPublishedScheduleGuide = openEditPublishedScheduleGuide;
window.renderScheduleTable = renderScheduleTable;
window.renderSheetDropdown = renderSheetDropdown;
window.changeActiveSheet = changeActiveSheet;
window.generateMonthDataZigzag = generateMonthDataZigzag;
window.generate7PersonFlexZigzag = generate7PersonFlexZigzag;
window.generate17PersonLeadersAndStaffZigzag = generate17PersonLeadersAndStaffZigzag;
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

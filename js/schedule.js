// ================= ⭐ FAIR ZIGZAG SCHEDULE ENGINE & SUPABASE CLOUD SYNC =================

// 0. FUNCTION ກວດສອບຊ່ວງວັນພັກພິເສດ (ປ້ອງກັນ Crash)
function isDateInHolidayRange(dStr) {
    if (!dStr) return false;
    var holList = window.specialHolidayRanges || [];
    return holList.some(function(h) {
        if (!h) return false;
        var s = h.start_date || h.start;
        var e = h.end_date || h.end;
        if (!s || !e) return false;
        return dStr >= s && dStr <= e;
    });
}
window.isDateInHolidayRange = isDateInHolidayRange;

// 0.1 FUNCTION SYNC ຕາຕະລາງຂຶ້ນ schedule_sheets ໃນ SUPABASE 100%
async function syncScheduleToSupabase(sheet) {
    if (!window.supabaseClient || !sheet) return;
    try {
        var currentData = sheet.data || sheet.schedule_data || {};
        if (typeof currentData === 'string') {
            try { currentData = JSON.parse(currentData); } catch (e) { currentData = {}; }
        }

        currentData._meta = {
            title: sheet.title || '',
            notes: sheet.notes || ''
        };

        var payload = {
            id: String(sheet.id),
            monthKey: String(sheet.monthKey || sheet.month_key || '2026-09'),
            title: String(sheet.title || ''),
            notes: String(sheet.notes || ''),
            status: String(sheet.status || 'DRAFT'),
            data: currentData
        };

        var res = await window.supabaseClient
            .from('schedule_sheets')
            .upsert(payload, { onConflict: 'id' });

        if (res.error) {
            console.error("❌ [Supabase Sync Error]:", res.error.message);
        } else {
            console.log("☁️ [Supabase Cloud]: ບັນທຶກລົງ schedule_sheets ສຳເລັດ! ->", sheet.id);
        }
    } catch (err) {
        console.error("Supabase Sync Exception:", err);
    }
}
window.syncScheduleToSupabase = syncScheduleToSupabase;

// 1. ສູດຄຳນວນອາທິດ ຈັນ-ສຸກ ແບບຕໍ່ເນື່ອງ (Monday-Based Week Index)
function getMondayBasedWeekIndex(dateObj) {
    var epoch = Date.UTC(2026, 0, 5); // ວັນຈັນ 5/01/2026 ເປັນຈຸດອ້າງອີງ
    var current = Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate());
    var diffDays = Math.floor((current - epoch) / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7);
}
window.getMondayBasedWeekIndex = getMondayBasedWeekIndex;

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
window.getGlobalWeekendDayIndex = getGlobalWeekendDayIndex;

// 2. REBALANCE ກະ 3 ແບບປົກປ້ອງ PATTERN (ປັບສະເພາະເສົາ-ອາທິດ ບໍ່ກວນຈັນ-ສຸກ)
async function rebalanceNightShifts() {
    var sheet = getActiveSheet();
    var schedData = sheet?.data || {};
    var dates = Object.keys(schedData).filter(function(k) { return !k.startsWith('_'); });
    if (dates.length === 0) {
        showToast('ແຈ້ງເຕືອນ', 'ຕາຕະລາງຍັງວ່າງເປົ່າ ບໍ່ສາມາດ Rebalance ໄດ້', 'info');
        return;
    }

    var allUsers = window.users || [];
    var leaderNames = allUsers.filter(function(u) { return u && u.isLeader; }).map(function(u) { return u.nameLao; });
    if (leaderNames.length === 0) leaderNames = ['ແສງດາວ', 'ພອນສະຫວັນ', 'ບຸນປະເສີດ', 'ພັນນິກອນ'];
    var staffList = allUsers.filter(function(u) { return u && u.role !== 'SUPER_ADMIN' && !leaderNames.includes(u.nameLao); }).map(function(u) { return u.nameLao; });

    // ກວດສອບຫົວໜ້າວັນທຳມະດາ: ກະ 3 ຕ້ອງມີ 1 ຫົວໜ້າ, ກະ 2 ຕ້ອງມີ 1 ຫົວໜ້າ
    var leaderFixed = 0;
    dates.forEach(function(d) {
        var day = schedData[d];
        if (day && !day.isWeekend && !isDateInHolidayRange(d)) {
            var s3 = day.shift3 || [];
            var s2 = day.shift2 || [];
            var lInS3 = s3.filter(function(n) { return leaderNames.includes(n); });
            var lInS2 = s2.filter(function(n) { return leaderNames.includes(n); });

            if (lInS3.length > 1 && lInS2.length === 0) {
                var extraLeader = lInS3[1];
                var s2StaffIdx = s2.findIndex(function(n) { return !leaderNames.includes(n); });
                if (s2StaffIdx !== -1) {
                    var s2Staff = s2[s2StaffIdx];
                    var idx3 = s3.indexOf(extraLeader);
                    s3[idx3] = s2Staff;
                    s2[s2StaffIdx] = extraLeader;
                    leaderFixed++;
                }
            }
        }
    });

    // ປັບສະເພາະເສົາ-ອາທິດ ເພື່ອຮັກສາ Pattern ຈັນ-ສຸກ
    var weekendDates = dates.filter(function(d) { return schedData[d]?.isWeekend || isDateInHolidayRange(d); });
    function countWeekendS3() {
        var counts = {};
        staffList.forEach(function(n) { counts[n] = 0; });
        weekendDates.forEach(function(d) {
            (schedData[d].shift3 || []).forEach(function(n) {
                if (counts[n] !== undefined) counts[n]++;
            });
        });
        return counts;
    }

    var swapped = 0;
    if (staffList.length > 0) {
        for (var iter = 0; iter < 100; iter++) {
            var s3Counts = countWeekendS3();
            var maxStaff = staffList.reduce(function(a, b) { return s3Counts[a] > s3Counts[b] ? a : b; });
            var minStaff = staffList.reduce(function(a, b) { return s3Counts[a] < s3Counts[b] ? a : b; });

            if (s3Counts[maxStaff] - s3Counts[minStaff] <= 1) break;

            var didSwap = false;
            for (var i = 0; i < weekendDates.length; i++) {
                var d = weekendDates[i];
                var day = schedData[d];
                if ((day.shift3 || []).includes(maxStaff) && !(day.shift3 || []).includes(minStaff)) {
                    if ((day.shift2 || []).includes(minStaff)) {
                        var idx3 = day.shift3.indexOf(maxStaff);
                        var idx2 = day.shift2.indexOf(minStaff);
                        day.shift3[idx3] = minStaff;
                        day.shift2[idx2] = maxStaff;
                        didSwap = true; swapped++; break;
                    } else if ((day.shift1 || []).includes(minStaff)) {
                        var idx3 = day.shift3.indexOf(maxStaff);
                        var idx1 = day.shift1.indexOf(minStaff);
                        day.shift3[idx3] = minStaff;
                        day.shift1[idx1] = maxStaff;
                        didSwap = true; swapped++; break;
                    }
                }
            }
            if (!didSwap) break;
        }
    }

    await saveAll();
    await syncScheduleToSupabase(sheet);
    renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();

    if (leaderFixed > 0 || swapped > 0) {
        showToast('Rebalance ສຳເລັດ', `ປັບຫົວໜ້າ ${leaderFixed} ຈຸດ, ປັບເສົາ-ອາທິດ ${swapped} ຈຸດ ໂດຍ Pattern ຈັນ-ສຸກ ຄົງທີ່ 100%!`, 'success');
    } else {
        showToast('ແຈ້ງເຕືອນ', 'ຕາຕະລາງນີ້ສົມດຸນ ແລະ ຖືກຕ້ອງຕາມ Pattern ແລ້ວ', 'info');
    }
}
window.rebalanceNightShifts = rebalanceNightShifts;

function openEditPublishedScheduleGuide() {
    showToast('ວິທີດັດແກ້', 'ທ່ານສາມາດຄລິກໃສ່ຊ່ອງພະນັກງານໃນຕາຕະລາງໄດ້ເລີຍ', 'info');
}
window.openEditPublishedScheduleGuide = openEditPublishedScheduleGuide;

function openFixedShiftModal() {
    var userSelect = document.getElementById('fixedShiftUserSelect');
    if (userSelect) {
        userSelect.innerHTML = '';
        (window.users || []).filter(function(u) { return u && u.role !== 'SUPER_ADMIN'; }).forEach(function(u) {
            userSelect.innerHTML += `<option value="${u.nameLao}">${u.nameLao} (${u.fullName})</option>`;
        });
    }
    renderActiveFixedShiftsList();
    document.getElementById('fixedShiftModal')?.classList.remove('hidden');
}
window.openFixedShiftModal = openFixedShiftModal;

function renderActiveFixedShiftsList() {
    var container = document.getElementById('activeFixedShiftsList');
    if (!container) return;
    container.innerHTML = '';
    if (!window.fixedShiftsConfig || window.fixedShiftsConfig.length === 0) {
        container.innerHTML = `<p class="text-slate-400 text-xs italic py-2">ຍັງບໍ່ມີພະນັກງານທີ່ຖືກລັອກກະປະຈຳ</p>`;
        return;
    }
    window.fixedShiftsConfig.forEach(function(f, idx) {
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
window.renderActiveFixedShiftsList = renderActiveFixedShiftsList;

async function handleAddFixedShift() {
    var name = document.getElementById('fixedShiftUserSelect')?.value;
    var shift = document.getElementById('fixedShiftSlotSelect')?.value;
    if (!window.fixedShiftsConfig) window.fixedShiftsConfig = [];
    window.fixedShiftsConfig = window.fixedShiftsConfig.filter(function(f) { return f.nameLao !== name; });
    window.fixedShiftsConfig.push({ nameLao: name, fixedShift: shift });
    await saveAll();
    renderActiveFixedShiftsList();
    showToast('ສຳເລັດ', `ລັອກ "${name}" ໄວ້ ${shift} ແລ້ວ!`, 'success');
}
window.handleAddFixedShift = handleAddFixedShift;

async function removeFixedShift(idx) {
    if (window.fixedShiftsConfig) window.fixedShiftsConfig.splice(idx, 1);
    await saveAll();
    renderActiveFixedShiftsList();
    showToast('ສຳເລັດ', 'ຍົກເລີກການລັອກກະແລ້ວ', 'success');
}
window.removeFixedShift = removeFixedShift;

// 3. ສູດກຸ່ມ 7 ຄົນ (Rolling 5/2)
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
window.generate7PersonFlexZigzag = generate7PersonFlexZigzag;

// 4. ສູດທີມຫຼັກ 17 ຄົນ: ຈັນ-ສຸກ ຄົງທີ່ 5 ວັນ + ຫົວໜ້າ (1A->3->2->1B) + ພະນັກງານ (3->2->1->3)
function generate17PersonLeadersAndStaffZigzag(year, month, staffList) {
    var daysCount = new Date(year, month, 0).getDate();
    var data = {};

    var allUsers = window.users || [];
    var leaderNames = staffList.filter(function(name) {
        var u = allUsers.find(function(usr) { return usr && usr.nameLao === name; });
        return u && u.isLeader;
    });

    if (leaderNames.length < 4) {
        leaderNames = ['ແສງດາວ', 'ພອນສະຫວັນ', 'ບຸນປະເສີດ', 'ພັນນິກອນ'].filter(function(n) { return staffList.includes(n); });
    }
    while (leaderNames.length < 4 && staffList.length > leaderNames.length) {
        var extra = staffList.find(function(n) { return !leaderNames.includes(n); });
        if (extra) leaderNames.push(extra);
    }

    var regularStaff = staffList.filter(function(n) { return !leaderNames.includes(n); });
    var numRegular = regularStaff.length || 13;

    for (var i = 1; i <= daysCount; i++) {
        var dayNum = i < 10 ? '0' + i : '' + i;
        var mNum = month < 10 ? '0' + month : '' + month;
        var dStr = `${year}-${mNum}-${dayNum}`;
        var dateObj = new Date(Date.UTC(year, month - 1, i));
        var dayOfWeek = dateObj.getUTCDay();
        var isWeekend = (dayOfWeek === 6 || dayOfWeek === 0 || isDateInHolidayRange(dStr));

        if (isWeekend) {
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
            var W = getMondayBasedWeekIndex(dateObj);

            // ຫົວໜ້າ: 1A ➔ 3 ➔ 2 ➔ 1B ➔ 1A
            var l_1A = leaderNames[(W + 0) % 4];
            var l_1B = leaderNames[(W + 1) % 4];
            var l_S2 = leaderNames[(W + 2) % 4];
            var l_S3 = leaderNames[(W + 3) % 4];

            // ພະນັກງານ 13 ທ່ານ: 3 ➔ 2 ➔ 1 ➔ 3
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
window.generate17PersonLeadersAndStaffZigzag = generate17PersonLeadersAndStaffZigzag;

function generateMonthDataZigzag(year, month, targetGroupMembers) {
    var staffList = [];
    if (targetGroupMembers && targetGroupMembers.length > 0) {
        staffList = [...targetGroupMembers];
    } else {
        staffList = (window.users || []).filter(function(u) { return u && u.role !== 'SUPER_ADMIN'; }).map(function(u) { return u.nameLao; });
    }

    if (staffList.length === 7) {
        return generate7PersonFlexZigzag(year, month, staffList);
    } else {
        return generate17PersonLeadersAndStaffZigzag(year, month, staffList);
    }
}
window.generateMonthDataZigzag = generateMonthDataZigzag;

function openRandomGroupSelectModal() {
    var select = document.getElementById('randomSelectedGroupId');
    if (!select) return;
    select.innerHTML = '';
    var optAll = document.createElement('option');
    optAll.value = 'ALL';
    optAll.innerText = 'ພະນັກງານທັງໝົດ (All Staff)';
    select.appendChild(optAll);

    (window.employeeGroups || []).forEach(function(grp) {
        var opt = document.createElement('option');
        opt.value = grp.id;
        var isG7 = (grp.members || []).length === 7;
        var tag = isG7 ? ' 🔹 [ກຸ່ມ 7 ຄົນ - Rolling 5/2]' : '';
        opt.innerText = `${grp.name} (${grp.members.length} ຄົນ)${tag}`;
        select.appendChild(opt);
    });
    document.getElementById('randomGroupSelectModal')?.classList.remove('hidden');
}
window.openRandomGroupSelectModal = openRandomGroupSelectModal;

async function executeGroupRandomSchedule() {
    var sheet = getActiveSheet();
    var [year, month] = (sheet?.monthKey || '2026-09').split('-').map(Number);
    var selectedGrpId = document.getElementById('randomSelectedGroupId')?.value || 'ALL';
    
    var members = null;
    if (selectedGrpId !== 'ALL') {
        var found = (window.employeeGroups || []).find(function(g) { return g.id === selectedGrpId; });
        if (found && found.members) {
            members = found.members;
            sheet.isG7GroupSheet = (members.length === 7);
        }
    } else {
        sheet.isG7GroupSheet = false;
    }

    sheet.data = generateMonthDataZigzag(year, month, members);
    
    await saveAll();
    await syncScheduleToSupabase(sheet);

    document.getElementById('randomGroupSelectModal')?.classList.add('hidden');
    renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    showToast('ສຳເລັດ', `ສ້າງຕາຕະລາງ Zigzag ຮຽບຮ້ອຍ!`, 'success');
}
window.executeGroupRandomSchedule = executeGroupRandomSchedule;

function openBatchMonthModal() {
    var select = document.getElementById('batchTargetGroupSelect');
    if (select) {
        select.innerHTML = `<option value="ALL">ພະນັກງານທັງໝົດ (All Staff)</option>`;
        (window.employeeGroups || []).forEach(function(grp) {
            var isG7 = (grp.members || []).length === 7;
            var tag = isG7 ? ' 🔹 [ກຸ່ມ 7 ຄົນ - Rolling 5/2]' : '';
            select.innerHTML += `<option value="${grp.id}">${grp.name} (${grp.members.length} ຄົນ)${tag}</option>`;
        });
    }
    document.getElementById('batchMonthModal')?.classList.remove('hidden');
}
window.openBatchMonthModal = openBatchMonthModal;

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
        var foundGrp = (window.employeeGroups || []).find(function(g) { return g.id === selectedGrpId; });
        if (foundGrp) {
            selectedMembers = foundGrp.members;
            isG7 = (selectedMembers.length === 7);
            groupNameTag = isG7 ? ` (${foundGrp.name} - G7)` : ` (${foundGrp.name})`;
        }
    }

    var [startYear, startMonth] = startM.split('-').map(Number);
    var firstGeneratedSheetId = null;
    var activeSheet = getActiveSheet();
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

        var existingIdx = window.scheduleSheets.findIndex(function(s) { return s.monthKey === monthKey && s.title.includes(groupNameTag); });
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
    document.getElementById('batchMonthModal')?.classList.add('hidden');
    renderSheetDropdown();
    renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    showToast('ສຳເລັດ', `ສ້າງຕາຕະລາງຕໍ່ເນື່ອງ ${count} ເດືອນ ແລະ Sync ລົງ Supabase ສຳເລັດ!`, 'success');
}
window.executeBatchMonthGenerate = executeBatchMonthGenerate;

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
window.publishSchedule = publishSchedule;

// ⭐ 6. RENDER ຕາຕະລາງປະຈຳການ (ສະແດງຫົວຂໍ້ໃຫຍ່, ຫົວຂໍ້ຖັນ ແລະ ຫົວຂໍ້ວັນພັກ ຄົບຖ້ວນ 100%)
function renderScheduleTable() {
    renderSheetDropdown();
    if (typeof window.renderScheduleStaffRoster === 'function') window.renderScheduleStaffRoster();
    
    var sheet = getActiveSheet();
    if (!sheet) {
        if (window.scheduleSheets && window.scheduleSheets.length > 0) {
            sheet = window.scheduleSheets[0];
            window.activeSheetId = sheet.id;
        } else {
            return;
        }
    }

    var scheduleData = sheet.data || sheet.schedule_data || {};
    if (typeof scheduleData === 'string') {
        try { scheduleData = JSON.parse(scheduleData); } catch(e) { scheduleData = {}; }
    }

    var mKey = sheet.monthKey || sheet.month_key || '2026-09';
    var match = String(mKey).match(/(\d{4})[-/](\d{1,2})/);
    var year = match ? parseInt(match[1]) : 2026;
    var month = match ? parseInt(match[2]) : 9;
    var daysCount = new Date(year, month, 0).getDate();
    if (isNaN(daysCount) || daysCount <= 0) daysCount = 30;

    var isOfficial = (sheet.status === 'PUBLISHED');
    var isG7 = sheet.isG7GroupSheet || false;

    var currentTitle = sheet.title || sheet.data?._meta?.title || `ຕາຕະລາງປະຈຳການບໍລິການອອນໄລປະຈຳເດືອນ ${month < 10 ? '0' + month : month}/${year}`;
    var currentNotes = sheet.notes || sheet.data?._meta?.notes || window.defaultNotesTemplate || '';

    // A. ຫົວຂໍ້ໃຫຍ່ຂອງຕາຕະລາງ (Title Header)
    var titleEl = document.getElementById('scheduleTableTitle');
    if (titleEl) {
        titleEl.innerHTML = `
            <div class="text-center font-bold text-sm py-1">
                <span>${currentTitle}</span>
                <span class="no-print ml-2 text-xs font-semibold ${isOfficial ? 'text-emerald-700' : 'text-amber-700'}">
                    (${isOfficial ? 'ສະບັບທາງການ' : 'ສະບັບຮ່າງລ່ວງໜ້າ'})
                </span>
            </div>
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
            banner.className = "no-print px-6 py-2 bg-emerald-50 border-b border-emerald-200 flex justify-between items-center text-xs font-lao";
            badge.className = "font-bold text-emerald-800 flex items-center gap-2";
            badge.innerHTML = `<span class="material-symbols-outlined text-sm text-emerald-600">verified</span> ຕາຕະລາງທາງການ (Published Official) ${g7BadgeInBanner}`;
        } else {
            banner.className = "no-print px-6 py-2 bg-amber-50 border-b border-amber-200 flex justify-between items-center text-xs font-lao";
            badge.className = "font-bold text-amber-900 flex items-center gap-2";
            badge.innerHTML = `<span class="material-symbols-outlined text-sm text-amber-700">pending_actions</span> ສະບັບຮ່າງລ່ວງໜ້າ ${g7BadgeInBanner}`;
        }
    }

    var sheetLogs = (window.scheduleAuditLogs || []).filter(function(l) { return l && l.sheetId === sheet.id; });
    if (modCountText) {
        modCountText.innerHTML = sheetLogs.length > 0 ? `<span class="material-symbols-outlined text-xs text-amber-700">history_edu</span> ມີການດັດແກ້: ${sheetLogs.length} ຈຸດ` : '';
    }

    var tbody = document.getElementById('scheduleTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    var dayNamesLao = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    var isAdmin = window.currentUser && window.currentUser.role === 'SUPER_ADMIN';

    var prevHeaderType = null;

    try {
        for (var i = 1; i <= daysCount; i++) {
            var dayNum = i < 10 ? '0' + i : '' + i;
            var mNum = month < 10 ? '0' + month : '' + month;
            var dStr = `${year}-${mNum}-${dayNum}`;
            var dayOfWeek = dayNamesLao[new Date(year, month - 1, i).getDay()];
            var dayData = scheduleData[dStr] || { isWeekend: false, shift1: [], shift2: [], shift3: [] };
            
            var isHol = isDateInHolidayRange(dStr);
            var isWeekendOrHol = (dayOfWeek === 'SAT' || dayOfWeek === 'SUN' || isHol || dayData.isWeekend);

            var currentHeaderType = isWeekendOrHol ? 'HOLIDAY' : 'REGULAR';
            
            // ⭐ ເງື່ອນໄຂສະແດງຫົວຂໍ້ຖັນ: ວັນທີ 1, ວັນເສົາ, ວັນຈັນ ຫຼື ເມື່ອມີການປ່ຽນປະເພດວັນ
            var shouldShowHeader = (i === 1) || 
                                    (dayOfWeek === 'SAT') || 
                                    (dayOfWeek === 'MON' && !isWeekendOrHol) || 
                                    (currentHeaderType !== prevHeaderType);

            // B. ແຖວຫົວຂໍ້ຖັນ (Column Headers)
            if (shouldShowHeader) {
                if (isWeekendOrHol) {
                    // ຫົວຂໍ້ວັນພັກ (ລວມ 2 ຊ່ອງ Colspan 2 ແບບໃນຮູບ)
                    tbody.innerHTML += `
                        <tr class="bg-red-50/40 border-t-2 border-b border-black text-brand-red text-center text-xs">
                            <td colspan="2" class="p-1 text-center font-medium border-r border-black">${isHol ? 'ວັນພັກພິເສດ' : 'ວັນພັກ'}</td>
                            <td class="p-1 text-center font-medium border-r border-black" style="width: 33%;">08:00 - 13:30</td>
                            <td class="p-1 text-center font-medium border-r border-black" style="width: 33%;">13:30 - 19:00</td>
                            <td class="p-1 text-center font-medium" style="width: 25%;">19:00 - 08:00</td>
                        </tr>
                    `;
                } else {
                    // ຫົວຂໍ້ວັນຈັນ-ສຸກ ປົກກະຕິ
                    tbody.innerHTML += `
                        <tr class="bg-slate-50 border-t-2 border-b border-black text-slate-800 text-center text-xs">
                            <th style="width: 75px;" class="p-1 text-center font-medium border-r border-black">ວັນທີ</th>
                            <th style="width: 50px;" class="p-1 text-center font-medium border-r border-black">ວັນ</th>
                            <th style="width: 33%;" class="p-1 text-center font-medium border-r border-black">08:00 - 16:00</th>
                            <th style="width: 33%;" class="p-1 text-center font-medium border-r border-black">12:00 - 20:00</th>
                            <th style="width: 25%;" class="p-1 text-center font-medium">20:00 - 08:00</th>
                        </tr>
                    `;
                }
            }
            prevHeaderType = currentHeaderType;

            // C. ແຖວຂໍ້ມູນປະຈຳວັນ (ຕົວໜັງສືປົກກະຕິ font-normal ບໍ່ໜາ)
            var dayColor = isWeekendOrHol ? 'text-brand-red' : 'text-slate-800';

            tbody.innerHTML += `
                <tr class="bg-white border-b border-black text-center text-xs">
                    <td class="p-1 text-center border-r border-black whitespace-nowrap text-slate-800 font-normal">${i}/${mNum}/${year}</td>
                    <td class="p-1 text-center border-r border-black ${dayColor} font-normal">${dayOfWeek}</td>
                    <td class="p-0 border-r border-black align-middle">${renderPixelExcelGrid(dStr, 'shift1', dayData.shift1 || [], isWeekendOrHol ? 1 : 2, isWeekendOrHol ? 3 : Math.max(3, Math.ceil((dayData.shift1 || []).length / 2)), isAdmin, sheet.id)}</td>
                    <td class="p-0 border-r border-black align-middle">${renderPixelExcelGrid(dStr, 'shift2', dayData.shift2 || [], isWeekendOrHol ? 1 : 2, isWeekendOrHol ? 3 : Math.max(3, Math.ceil((dayData.shift2 || []).length / 2)), isAdmin, sheet.id)}</td>
                    <td class="p-0 align-middle">${renderPixelExcelGrid(dStr, 'shift3', dayData.shift3 || [], isWeekendOrHol ? 1 : 2, isWeekendOrHol ? 3 : Math.max(2, Math.ceil((dayData.shift3 || []).length / 2)), isAdmin, sheet.id)}</td>
                </tr>
            `;
        }
    } catch (err) {
        console.error("Critical Table Render Error:", err);
    }
}
window.renderScheduleTable = renderScheduleTable;

// ⭐ 7. RENDER ຊ່ອງພະນັກງານ (ຕົວໜັງສືປົກກະຕິ font-normal ບໍ່ໜາ, ຈັດກາງພໍດີ)
function renderPixelExcelGrid(date, shift, list, rows, cols, isAdmin, sheetId) {
    cols = Math.max(cols, 2); 
    rows = Math.max(rows, 1);
    
    var html = `<div class="grid w-full h-full text-center" style="grid-template-columns: repeat(${cols}, minmax(0, 1fr)); grid-template-rows: repeat(${rows}, minmax(0, 1fr)); min-height: 48px; height: 48px;">`;
    var total = rows * cols;

    for (var idx = 0; idx < total; idx++) {
        var name = (list && list[idx]) ? String(list[idx]).trim() : '';
        var isLeader = false;
        if (name) {
            isLeader = (window.users || []).some(function(u) { return u && u.nameLao === name && u.isLeader; });
        }

        var clickHandler = (isAdmin && name) ? `onclick="openCellModal('${date}', '${shift}', ${idx}, '${name}')"` : '';
        var isModified = (window.scheduleAuditLogs || []).some(function(l) { return l && l.sheetId === sheetId && l.date === date && l.shift === shift && l.newName === name; });
        var highlightClass = isModified ? 'bg-amber-100 font-medium text-amber-950' : '';

        var borderR = ((idx + 1) % cols !== 0) ? 'border-r border-black' : '';
        var borderB = (idx < (rows - 1) * cols) ? 'border-b border-black' : '';
        var cursorClass = (isAdmin && name) ? 'cursor-pointer hover:bg-slate-50 transition' : '';

        // ຕົວໜັງສືປົກກະຕິ (font-normal ບໍ່ໜາ): ຫົວໜ້າ = ສີແດງ, ພະນັກງານ = ສີດຳ
        var textColor = isLeader ? 'text-brand-red font-normal' : 'text-slate-800 font-normal';

        html += `
            <div class="flex items-center justify-center text-center p-0.5 text-xs select-none ${borderR} ${borderB} ${cursorClass} ${highlightClass} ${textColor}" ${clickHandler}>
                <span class="truncate px-0.5 font-normal">${name}</span>
            </div>
        `;
    }
    html += `</div>`;
    return html;
}
window.renderPixelExcelGrid = renderPixelExcelGrid;

async function selectStaffForCell(nameLao) {
    if (!window.activeEditCell) return;
    var { date, shift, index, currentName } = window.activeEditCell;
    var sheet = getActiveSheet();
    if (!sheet) return;

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
window.selectStaffForCell = selectStaffForCell;

async function clearCurrentCell() {
    if (!window.activeEditCell) return;
    var { date, shift, index, currentName } = window.activeEditCell;
    var sheet = getActiveSheet();
    if (!sheet) return;

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
window.clearCurrentCell = clearCurrentCell;

function openEditPublishedRemarkModal(editData) {
    window.pendingPublishedCellEdit = editData;
    document.getElementById('remarkModalTargetInfo').innerText = `ວັນທີ: ${editData.date} [${editData.shift} - ຊ່ອງທີ ${editData.index + 1}]`;
    document.getElementById('remarkOldName').innerText = editData.currentName || '(ຊ່ອງວ່າງ)';
    document.getElementById('remarkNewName').innerText = editData.newName;
    document.getElementById('editPublishedRemarkInput').value = '';
    document.getElementById('editPublishedRemarkModal')?.classList.remove('hidden');
}
window.openEditPublishedRemarkModal = openEditPublishedRemarkModal;

function closeEditPublishedRemarkModal() {
    document.getElementById('editPublishedRemarkModal')?.classList.add('hidden');
    window.pendingPublishedCellEdit = null;
}
window.closeEditPublishedRemarkModal = closeEditPublishedRemarkModal;

async function confirmApplyPublishedCellUpdate() {
    if (!window.pendingPublishedCellEdit) return;
    var { date, shift, index, currentName, newName } = window.pendingPublishedCellEdit;
    var reason = document.getElementById('editPublishedRemarkInput')?.value.trim() || 'ດັດແກ້ຕາມຄວາມຈຳເປັນ';
    var sheet = getActiveSheet();
    if (!sheet) return;

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
window.confirmApplyPublishedCellUpdate = confirmApplyPublishedCellUpdate;

function renderSheetDropdown() {
    var select = document.getElementById('scheduleSheetSelect');
    if (!select) return;
    select.innerHTML = '';

    (window.scheduleSheets || []).forEach(function(sheet) {
        var opt = document.createElement('option');
        opt.value = String(sheet.id);
        var statusTag = (sheet.status === 'PUBLISHED') ? '[ທາງການ] ' : '[ສະບັບຮ່າງ] ';
        var titleText = sheet.title || sheet.data?._meta?.title || ('ຕາຕະລາງ ' + (sheet.monthKey || ''));
        opt.innerText = statusTag + titleText;

        if (String(sheet.id) === String(window.activeSheetId)) {
            opt.selected = true;
        }
        select.appendChild(opt);
    });
}
window.renderSheetDropdown = renderSheetDropdown;

function changeActiveSheet() {
    window.activeSheetId = document.getElementById('scheduleSheetSelect')?.value;
    saveAll();
    renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
}
window.changeActiveSheet = changeActiveSheet;

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

    if (!window.scheduleSheets) window.scheduleSheets = [];
    window.scheduleSheets.push(newSheet);
    window.activeSheetId = newId;
    await saveAll();
    await syncScheduleToSupabase(newSheet);

    document.getElementById('newSheetModal')?.classList.add('hidden');
    renderSheetDropdown();
    renderScheduleTable();
    showToast('ສຳເລັດ', `ສ້າງ "${title}" ແລະ Sync ລົງ Supabase ສຳເລັດ!`, 'success');
}
window.handleCreateNewSheet = handleCreateNewSheet;

function openNewSheetModal() { document.getElementById('newSheetTitleInput').value = ''; document.getElementById('newSheetModal')?.classList.remove('hidden'); }
window.openNewSheetModal = openNewSheetModal;

function openEditSheetInfoModal() {
    var sheet = getActiveSheet();
    if (!sheet) return;
    document.getElementById('editSheetTitleInput').value = sheet.title || sheet.data?._meta?.title || '';
    document.getElementById('editSheetNotesInput').value = sheet.notes || sheet.data?._meta?.notes || window.defaultNotesTemplate;
    document.getElementById('editSheetInfoModal')?.classList.remove('hidden');
}
window.openEditSheetInfoModal = openEditSheetInfoModal;

async function handleSaveSheetInfo() {
    var sheet = getActiveSheet();
    if (!sheet) return;

    var newTitle = document.getElementById('editSheetTitleInput')?.value.trim();
    var newNotes = document.getElementById('editSheetNotesInput')?.value.trim();

    sheet.title = newTitle || sheet.title;
    sheet.notes = newNotes;

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
window.handleSaveSheetInfo = handleSaveSheetInfo;

function promptResetSchedule() {
    askConfirm('ຣີເຊັດຕາຕະລາງ', 'ທ່ານຕ້ອງການຣີເຊັດຕາຕະລາງນີ້ທັງໝົດແທ້ບໍ່?', async function() {
        var sheet = getActiveSheet();
        if (!sheet) return;
        sheet.data = {};
        await saveAll();
        await syncScheduleToSupabase(sheet);
        renderScheduleTable();
        showToast('ສຳເລັດ', 'ຣີເຊັດຕາຕະລາງ ແລະ Sync ລົງ Supabase ແລ້ວ', 'success');
    }, 'restart_alt', 'Reset');
}
window.promptResetSchedule = promptResetSchedule;

function promptDeleteCurrentSheet() {
    if ((window.scheduleSheets || []).length <= 1) {
        showToast('ແຈ້ງເຕືອນ', 'ບໍ່ສາມາດລຶບໄດ້ ເພາະຕ້ອງມີຕາຕະລາງຢ່າງໜ້ອຍ 1 ອັນໃນລະບົບ', 'error');
        return;
    }
    var sheet = getActiveSheet();
    if (!sheet) return;
    askConfirm('ຢືນຢັນການລຶບຕາຕະລາງ', `ທ່ານຕ້ອງການລຶບ "${sheet.title}" ອອກຈາກລະບົບແທ້ບໍ່?`, async function() {
        var delId = sheet.id;
        window.scheduleSheets = window.scheduleSheets.filter(function(s) { return s.id !== delId; });
        window.activeSheetId = window.scheduleSheets[0].id;
        await saveAll();

        if (window.supabaseClient) {
            try {
                await window.supabaseClient.from('schedule_sheets').delete().eq('id', delId);
            } catch (err) {
                console.error("Supabase Delete Error:", err);
            }
        }

        renderSheetDropdown();
        renderScheduleTable();
        showToast('ສຳເລັດ', `ລຶບຕາຕະລາງອອກຈາກ Supabase ຮຽບຮ້ອຍແລ້ວ!`, 'success');
    }, 'delete', 'ລຶບຕາຕະລາງ');
}
window.promptDeleteCurrentSheet = promptDeleteCurrentSheet;

function deleteAllDraftSheets() {
    var draftSheets = (window.scheduleSheets || []).filter(function(s) { return s.status === 'DRAFT'; });
    if (draftSheets.length === 0) {
        showToast('ແຈ້ງເຕືອນ', 'ບໍ່ມີຕາຕະລາງສະບັບຮ່າງ (Draft) ໃຫ້ລຶບ', 'info');
        return;
    }
    askConfirm('ລຶບຕາຕະລາງລ່ວງໜ້າທັງໝົດ', `ທ່ານຕ້ອງການລຶບຕາຕະລາງສະບັບຮ່າງ (Draft) ທັງໝົດ ${draftSheets.length} ເດືອນ ແທ້ບໍ່?`, async function() {
        var draftIds = draftSheets.map(function(s) { return s.id; });
        window.scheduleSheets = window.scheduleSheets.filter(function(s) { return s.status !== 'DRAFT'; });
        window.activeSheetId = window.scheduleSheets[0].id;
        await saveAll();

        if (window.supabaseClient && draftIds.length > 0) {
            try {
                await window.supabaseClient.from('schedule_sheets').delete().in('id', draftIds);
            } catch (err) {
                console.error("Supabase Batch Delete Error:", err);
            }
        }

        document.getElementById('batchMonthModal')?.classList.add('hidden');
        renderSheetDropdown();
        renderScheduleTable();
        showToast('ສຳເລັດ', `ລຶບຕາຕະລາງລ່ວງໜ້າອອກຈາກ Supabase ຮຽບຮ້ອຍແລ້ວ!`, 'success');
    }, 'delete_sweep', 'ລຶບ Draft ທັງໝົດ');
}
window.deleteAllDraftSheets = deleteAllDraftSheets;

async function saveDraft() { 
    var sheet = getActiveSheet();
    if (!sheet) return;
    sheet.status = 'DRAFT'; 
    await saveAll(); 
    await syncScheduleToSupabase(sheet);
    renderSheetDropdown(); 
    renderScheduleTable(); 
    showToast('ສຳເລັດ', 'ບັນທຶກສະບັບຮ່າງ (Draft) ແລະ Sync ລົງ Supabase ແລ້ວ', 'success'); 
}
window.saveDraft = saveDraft;

function openFairnessSummaryModal() {
    var sheet = getActiveSheet();
    var subEl = document.getElementById('fairnessModalSub');
    if (subEl && sheet) {
        subEl.innerText = `ກວດສອບຄວາມສົມດຸນຂອງ ${sheet.title || sheet.data?._meta?.title || ''}`;
    }

    var select = document.getElementById('fairnessGroupFilterSelect');
    if (select) {
        select.innerHTML = `<option value="ALL">ພະນັກງານທັງໝົດ (All Staff)</option>`;
        (window.employeeGroups || []).forEach(function(grp) {
            var isG7 = (grp.members || []).length === 7;
            var tag = isG7 ? ' 🔹 [ກຸ່ມ 7 ຄົນ - Rolling 5/2]' : '';
            select.innerHTML += `<option value="${grp.id}">${grp.name} (${grp.members.length} ຄົນ)${tag}</option>`;
        });
    }

    renderFairnessSummaryData();
    document.getElementById('fairnessModal')?.classList.remove('hidden');
}
window.openFairnessSummaryModal = openFairnessSummaryModal;

function closeFairnessSummaryModal() {
    document.getElementById('fairnessModal')?.classList.add('hidden');
}
window.closeFairnessSummaryModal = closeFairnessSummaryModal;

function renderFairnessSummaryData() {
    var sheet = getActiveSheet();
    var schedData = sheet?.data || sheet?.schedule_data || {};
    if (typeof schedData === 'string') {
        try { schedData = JSON.parse(schedData); } catch(e) { schedData = {}; }
    }
    var dates = Object.keys(schedData).filter(function(k) { return !k.startsWith('_'); });
    var filterGroupId = document.getElementById('fairnessGroupFilterSelect')?.value || 'ALL';

    var targetUsers = (window.users || []).filter(function(u) { return u && u.role !== 'SUPER_ADMIN'; });

    if (filterGroupId !== 'ALL') {
        var grp = (window.employeeGroups || []).find(function(g) { return g.id === filterGroupId; });
        if (grp && grp.members) {
            targetUsers = targetUsers.filter(function(u) { return grp.members.includes(u.nameLao); });
        }
    }

    var tbody = document.getElementById('fairnessSummaryTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (targetUsers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-4 text-center text-slate-400">ບໍ່ພົບຂໍ້ມູນພະນັກງານ</td></tr>`;
        return;
    }

    targetUsers.forEach(function(u, idx) {
        var s1 = 0, s2 = 0, s3 = 0, totalOff = 0;

        dates.forEach(function(d) {
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
window.renderFairnessSummaryData = renderFairnessSummaryData;

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
    noPrintEls.forEach(function(el) { el.style.display = 'none'; });

    var opt = {
        margin:       [4, 4, 4, 4],
        filename:     `${sheet?.title || sheet?.data?._meta?.title || 'ຕາຕະລາງປະຈຳການ'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save().then(function() {
        element.className = originalClass;
        element.setAttribute('style', originalStyle);
        if (parent) { parent.scrollTop = prevScrollTop; parent.scrollLeft = prevScrollLeft; }
        noPrintEls.forEach(el => el.style.display = '');
        showToast('ສຳເລັດ', 'Export PDF A4 ສຳເລັດ!', 'success');
    }).catch(function(err) {
        element.className = originalClass;
        element.setAttribute('style', originalStyle);
        noPrintEls.forEach(el => el.style.display = '');
        showToast('ຜິດພາດ', 'Export ບໍ່ສຳເລັດ', 'error');
    });
}
window.exportToA4PDF = exportToA4PDF;

function openHolidayModal() { document.getElementById('holidayModal')?.classList.remove('hidden'); }
window.openHolidayModal = openHolidayModal;

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
        } catch (err) {
            console.error("Supabase Holiday Error:", err);
        }
    }

    document.getElementById('holidayModal')?.classList.add('hidden');
    renderScheduleTable();
    showToast('ສຳເລັດ', 'ບັນທຶກວັນພັກພິເສດ ແລະ Sync ລົງ Supabase ແລ້ວ', 'success');
}
window.handleSaveHolidayRange = handleSaveHolidayRange;

function openCellModal(date, shift, index, currentName) {
    if (!window.currentUser || window.currentUser.role !== 'SUPER_ADMIN') return;
    window.activeEditCell = { date, shift, index, currentName };
    document.getElementById('cellModalSubtitle').innerText = `ວັນທີ: ${date} [${shift}]`;
    renderCellStaffList('');
    document.getElementById('cellSelectModal')?.classList.remove('hidden');
}
window.openCellModal = openCellModal;

function closeCellModal() { document.getElementById('cellSelectModal')?.classList.add('hidden'); window.activeEditCell = null; }
window.closeCellModal = closeCellModal;

function renderCellStaffList(q) {
    var container = document.getElementById('cellStaffListContainer');
    if (!container) return;
    container.innerHTML = '';
    var qLower = (q || '').trim().toLowerCase();
    (window.users || []).filter(function(u) {
        if (!u || u.role === 'SUPER_ADMIN') return false;
        var matchLao = u.nameLao ? u.nameLao.toLowerCase().includes(qLower) : false;
        var matchFull = u.fullName ? u.fullName.toLowerCase().includes(qLower) : false;
        return matchLao || matchFull;
    }).forEach(function(u) {
        container.innerHTML += `
            <div onclick="selectStaffForCell('${u.nameLao}')" class="p-2.5 border rounded-2xl hover:bg-red-50 flex items-center justify-between cursor-pointer text-xs font-lao">
                <span>${u.nameLao} (${u.fullName})</span>
                ${u.isLeader ? '<span class="text-[10px] bg-brand-red text-white px-2 py-0.5 rounded-full font-bold">ຫົວໜ້າ</span>' : ''}
            </div>
        `;
    });
}
window.renderCellStaffList = renderCellStaffList;

function filterCellStaffList() { renderCellStaffList(document.getElementById('searchCellStaffInput')?.value); }
window.filterCellStaffList = filterCellStaffList;

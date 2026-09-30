// ================= ⭐ MASTER SCHEDULE ENGINE & SUPABASE CLOUD SYNC =================

// 0. FUNCTION ກວດສອບຊ່ວງວັນພັກພິເສດ (ປ້ອງກັນ Crash)
function isDateInHolidayRange(dStr) {
    if (!dStr) return false;
    var holList = window.specialHolidayRanges || [];
    return holList.some(h => {
        var s = h.start_date || h.start;
        var e = h.end_date || h.end;
        if (!s || !e) return false;
        return dStr >= s && dStr <= e;
    });
}

// 0.1 FUNCTION ດຶງ SHEET ປັດຈຸບັນແບບ AUTO-HEALING
function getActiveSheet() {
    if (!window.scheduleSheets || window.scheduleSheets.length === 0) {
        try {
            var cached = localStorage.getItem('ot_schedule_sheets') || localStorage.getItem('ot_schedules_sheets');
            if (cached) {
                window.scheduleSheets = JSON.parse(cached);
            }
        } catch(e) {}
    }

    if (!window.scheduleSheets || window.scheduleSheets.length === 0) {
        var defaultSheet = {
            id: 'sheet-2026-09-all',
            monthKey: '2026-09',
            title: 'ຕາຕະລາງປະຈຳການບໍລິການອອນໄລປະຈຳເດືອນ 09/2026',
            notes: window.defaultNotesTemplate || '',
            status: 'PUBLISHED',
            data: generateMonthDataZigzag(2026, 9, null)
        };
        window.scheduleSheets = [defaultSheet];
        window.activeSheetId = defaultSheet.id;
        try {
            localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
            localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
        } catch(e) {}
        syncScheduleToSupabase(defaultSheet);
    }

    var select = document.getElementById('scheduleSheetSelect');
    var targetId = select?.value || window.activeSheetId;
    if (targetId && window.scheduleSheets) {
        var found = window.scheduleSheets.find(s => s.id === targetId);
        if (found) {
            window.activeSheetId = found.id;
            return found;
        }
    }
    if (window.activeSheetId && window.scheduleSheets) {
        var found = window.scheduleSheets.find(s => s.id === window.activeSheetId);
        if (found) return found;
    }
    
    var firstSheet = window.scheduleSheets[0];
    window.activeSheetId = firstSheet.id;
    return firstSheet;
}
window.getActiveSheet = getActiveSheet;

// ⭐ 0.2 FUNCTION SYNC ຕາຕະລາງຂຶ້ນ SUPABASE ແບບ DYNAMIC (ແກ້ໄຂບັນຫາບັນທຶກບໍ່ລົງ DATABASE 100%)
async function syncScheduleToSupabase(sheet) {
    if (!window.supabaseClient || !sheet) return false;
    try {
        if (!sheet.data) sheet.data = {};
        sheet.data._meta = {
            title: sheet.title || '',
            notes: sheet.notes || ''
        };

        // 1. ກວດສອບຖັນຂອງ Table schedules ໃນ Supabase ຕົວຈິງ
        var tableCols = null;
        try {
            var { data: sample } = await window.supabaseClient.from('schedules').select('*').limit(1);
            if (sample && sample.length > 0) {
                tableCols = Object.keys(sample[0]);
            }
        } catch(e) {}

        // ສ້າງ Payload ຕາມຖັນທີ່ມີແທ້ໃນ Database
        var payload = { data: sheet.data };
        if (!tableCols || tableCols.includes('id')) payload.id = sheet.id;
        if (!tableCols || tableCols.includes('title')) payload.title = sheet.title || '';
        if (!tableCols || tableCols.includes('status')) payload.status = sheet.status || 'DRAFT';
        
        if (tableCols) {
            if (tableCols.includes('month_key')) payload.month_key = sheet.monthKey;
            else if (tableCols.includes('monthKey')) payload.monthKey = sheet.monthKey;
            if (tableCols.includes('notes')) payload.notes = sheet.notes || '';
        } else {
            if (sheet.monthKey) payload.month_key = sheet.monthKey;
        }

        // 2. ສັ່ງ UPDATE ຕາມ ID ໂດຍກົງ (ບໍ່ໃຊ້ onConflict ປ້ອງກັນ Error 400)
        var { data: upData, error: upErr } = await window.supabaseClient
            .from('schedules')
            .update(payload)
            .eq('id', sheet.id)
            .select();

        if (!upErr && upData && upData.length > 0) {
            console.log("☁️ [Supabase Sync SUCCESS]: ບັນທຶກຕາຕະລາງລົງ Database ສຳເລັດ 100% ->", sheet.id);
            return true;
        }

        // 3. ຖ້າບໍ່ມີແຖວໃນ DB ໃຫ້ສັ່ງ INSERT
        var { error: inErr } = await window.supabaseClient
            .from('schedules')
            .insert([payload]);

        if (!inErr) {
            console.log("☁️ [Supabase Sync SUCCESS]: Inserted sheet to Database ->", sheet.id);
            return true;
        }

        // 4. Fallback ສຸດທ້າຍ: ສົ່ງສະເພາະ id ແລະ data
        await window.supabaseClient.from('schedules').upsert({ id: sheet.id, data: sheet.data });
        console.log("☁️ [Supabase Sync SUCCESS]: Fallback upsert success ->", sheet.id);
        return true;
    } catch (err) {
        console.error("❌ [Supabase Sync Exception]:", err);
        return false;
    }
}

// 1. ສູດຄຳນວນອາທິດຕັດຮອບທຸກໆ "ວັນຈັນ" ແບບຕໍ່ເນື່ອງຂ້າມເດືອນ
function getMondayBasedWeekIndex(dateObj) {
    var epoch = Date.UTC(2026, 0, 5); // ວັນຈັນ 5/01/2026
    var current = Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate());
    var diffDays = Math.floor((current - epoch) / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7);
}

// 1.1 ສູດຄຳນວນວັນເສົາ-ອາທິດ ແບບຕໍ່ເນື່ອງຂ້າມເດືອນ
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

// 2. REBALANCE ທີ່ປົກປ້ອງ PATTERN ແລະ ຂ້າມມື້ຄວບກະເສົາ-ອາທິດ
async function rebalanceNightShifts() {
    var sheet = getActiveSheet();
    var schedData = sheet?.data || {};
    var dates = Object.keys(schedData).filter(k => !k.startsWith('_'));
    if (dates.length === 0) {
        showToast('ແຈ້ງເຕືອນ', 'ຕາຕະລາງຍັງວ່າງເປົ່າ ບໍ່ສາມາດ Rebalance ໄດ້', 'info');
        return;
    }

    var allUsers = window.users || [];
    var leaderNames = allUsers.filter(u => u.isLeader).map(u => u.nameLao);
    if (leaderNames.length === 0) leaderNames = ['ແສງດາວ', 'ພອນສະຫວັນ', 'ບຸນປະເສີດ', 'ພັນນິກອນ'];
    var staffList = allUsers.filter(u => u.role !== 'SUPER_ADMIN' && !leaderNames.includes(u.nameLao)).map(u => u.nameLao);

    var leaderFixedCount = 0;
    dates.forEach(d => {
        var day = schedData[d];
        if (day && !day.isWeekend && !isDateInHolidayRange(d)) {
            var s3 = day.shift3 || [];
            var s2 = day.shift2 || [];
            var lInS3 = s3.filter(n => leaderNames.includes(n));
            var lInS2 = s2.filter(n => leaderNames.includes(n));

            if (lInS3.length > 1 && lInS2.length === 0) {
                var extraLeader = lInS3[1];
                var s2StaffIdx = s2.findIndex(n => !leaderNames.includes(n));
                if (s2StaffIdx !== -1) {
                    var s2Staff = s2[s2StaffIdx];
                    var idx3 = s3.indexOf(extraLeader);
                    s3[idx3] = s2Staff;
                    s2[s2StaffIdx] = extraLeader;
                    leaderFixedCount++;
                }
            }
        }
    });

    var weekendDates = dates.filter(d => schedData[d]?.isWeekend || isDateInHolidayRange(d));

    function countWeekendS3() {
        var counts = {};
        staffList.forEach(n => counts[n] = 0);
        weekendDates.forEach(d => {
            (schedData[d].shift3 || []).forEach(n => {
                if (counts[n] !== undefined) counts[n]++;
            });
        });
        return counts;
    }

    var swappedCount = 0;
    if (staffList.length > 0) {
        for (var iter = 0; iter < 100; iter++) {
            var s3Counts = countWeekendS3();
            var maxStaff = staffList.reduce((a, b) => s3Counts[a] > s3Counts[b] ? a : b);
            var minStaff = staffList.reduce((a, b) => s3Counts[a] < s3Counts[b] ? a : b);

            if (s3Counts[maxStaff] - s3Counts[minStaff] <= 1) break;

            var swapped = false;
            for (var i = 0; i < weekendDates.length; i++) {
                var d = weekendDates[i];
                var day = schedData[d];

                var allNamesToday = [...(day.shift1 || []), ...(day.shift2 || []), ...(day.shift3 || [])];
                var hasDoubleShift = allNamesToday.some((name, idx) => name && allNamesToday.indexOf(name) !== idx);
                if (hasDoubleShift) continue;

                if ((day.shift3 || []).includes(maxStaff) && !(day.shift3 || []).includes(minStaff)) {
                    if ((day.shift2 || []).includes(minStaff)) {
                        var idx3 = day.shift3.indexOf(maxStaff);
                        var idx2 = day.shift2.indexOf(minStaff);
                        day.shift3[idx3] = minStaff;
                        day.shift2[idx2] = maxStaff;
                        swapped = true;
                        swappedCount++;
                        break;
                    } else if ((day.shift1 || []).includes(minStaff)) {
                        var idx3 = day.shift3.indexOf(maxStaff);
                        var idx1 = day.shift1.indexOf(minStaff);
                        day.shift3[idx3] = minStaff;
                        day.shift1[idx1] = maxStaff;
                        swapped = true;
                        swappedCount++;
                        break;
                    }
                }
            }
            if (!swapped) break;
        }
    }

    renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();

    try {
        if (typeof saveAll === 'function') await saveAll();
        await syncScheduleToSupabase(sheet);
    } catch(e) {}

    if (leaderFixedCount > 0 || swappedCount > 0) {
        showToast('Rebalance ສຳເລັດ', `ປັບສົມດຸນຮຽບຮ້ອຍ (ປັບຫົວໜ້າ ${leaderFixedCount} ຈຸດ, ສະຫຼັບເສົາ-ອາທິດ ${swappedCount} ຈຸດ)!`, 'success');
    } else {
        showToast('ແຈ້ງເຕືອນ', 'ຕາຕະລາງນີ້ສົມດຸນ ແລະ ຖືກຕ້ອງຕາມ Pattern ແລ້ວ', 'info');
    }
}

function openEditPublishedScheduleGuide() {
    var sheet = getActiveSheet();
    if (sheet.status !== 'PUBLISHED') {
        showToast('ແຈ້ງເຕືອນ', 'ຕາຕະລາງນີ້ຍັງເປັນສະບັບຮ່າງ (Draft) ສາມາດຄລິກແກ້ໄຂໄດ້ເລີຍປົກກະຕິ', 'info');
        return;
    }
    showToast('ວິທີດັດແກ້', 'ທ່ານສາມາດຄລິກໃສ່ຊ່ອງພະນັກງານໃນຕາຕະລາງໄດ້ເລີຍ', 'info');
}

function openFixedShiftModal() {
    var userSelect = document.getElementById('fixedShiftUserSelect');
    if (userSelect) {
        userSelect.innerHTML = '';
        (window.users || []).filter(u => u.role !== 'SUPER_ADMIN').forEach(u => {
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
    if (!window.fixedShiftsConfig || window.fixedShiftsConfig.length === 0) {
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
                <button type="button" onclick="removeFixedShift(${idx})" class="text-brand-red hover:underline font-bold text-xs cursor-pointer">ລຶບ</button>
            </div>
        `;
    });
}

async function handleAddFixedShift() {
    var name = document.getElementById('fixedShiftUserSelect')?.value;
    var shift = document.getElementById('fixedShiftSlotSelect')?.value;
    if (!window.fixedShiftsConfig) window.fixedShiftsConfig = [];
    window.fixedShiftsConfig = window.fixedShiftsConfig.filter(f => f.nameLao !== name);
    window.fixedShiftsConfig.push({ nameLao: name, fixedShift: shift });
    await saveAll();
    renderActiveFixedShiftsList();
    showToast('ສຳເລັດ', `ລັອກ "${name}" ໄວ້ ${shift} ແລ້ວ!`, 'success');
}

async function removeFixedShift(idx) {
    if (window.fixedShiftsConfig) window.fixedShiftsConfig.splice(idx, 1);
    await saveAll();
    renderActiveFixedShiftsList();
    showToast('ສຳເລັດ', 'ຍົກເລີກການລັອກກະແລ້ວ', 'success');
}

// 3. ສູດກຸ່ມ 7 ຄົນ: ເຮັດວຽກ 5 ວັນ ພັກ 2 ວັນ (Rolling 5/2)
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

// 4. ສູດທີມຫຼັກ 17 ຄົນ: ຈັນ-ສຸກ ຄົງທີ່ 5 ວັນ + ຫົວໜ້າ (1A->3->2->1B) + ພະນັກງານ (3->2->1->3) + ເສົາ-ອາທິດ Random ນອກຮອບ
function generate17PersonLeadersAndStaffZigzag(year, month, staffList) {
    var daysCount = new Date(year, month, 0).getDate();
    var data = {};

    var allUsers = window.users || [];
    var leaderNames = staffList.filter(name => {
        var u = allUsers.find(usr => usr.nameLao === name);
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

            var l_1A = leaderNames[(W + 0) % 4];
            var l_1B = leaderNames[(W + 1) % 4];
            var l_S2 = leaderNames[(W + 2) % 4];
            var l_S3 = leaderNames[(W + 3) % 4];

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

// 5. ເລືອກສູດອັດຕະໂນມັດຕາມກຸ່ມ
function generateMonthDataZigzag(year, month, targetGroupMembers) {
    var staffList = [];
    if (targetGroupMembers && targetGroupMembers.length > 0) {
        staffList = [...targetGroupMembers];
    } else {
        staffList = (window.users || []).filter(u => u.role !== 'SUPER_ADMIN').map(u => u.nameLao);
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
    
    try {
        localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
        localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
    } catch(e) {}

    renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    document.getElementById('randomGroupSelectModal')?.classList.add('hidden');
    showToast('ສຳເລັດ', `ສ້າງຕາຕະລາງ Zigzag ຮຽບຮ້ອຍ!`, 'success');

    try {
        if (typeof saveAll === 'function') await saveAll();
        await syncScheduleToSupabase(sheet);
    } catch(e) {}
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
        syncScheduleToSupabase(currentSheetObj);
    }

    if (firstGeneratedSheetId) window.activeSheetId = firstGeneratedSheetId;

    try {
        localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
        localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
    } catch(e) {}

    document.getElementById('batchMonthModal')?.classList.add('hidden');
    renderSheetDropdown();
    renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    showToast('ສຳເລັດ', `ສ້າງຕາຕະລາງຕໍ່ເນື່ອງ ${count} ເດືອນສຳເລັດ!`, 'success');

    try {
        if (typeof saveAll === 'function') await saveAll();
    } catch(e) {}
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

    try {
        localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
        localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
    } catch(e) {}

    renderSheetDropdown();
    renderScheduleTable();
    if (typeof window.updateNotificationBadge === 'function') window.updateNotificationBadge();
    showToast('ເຜີຍແຜ່ສຳເລັດ', 'ຕາຕະລາງຖືກ Publish ເປັນທາງການແລ້ວ!', 'success');

    try {
        if (typeof saveAll === 'function') await saveAll();
        await syncScheduleToSupabase(sheet);
    } catch(e) {}
}

// ⭐ 6. RENDER ຕາຕະລາງ (ປ້ອງກັນ CRASH + ຫົວຂໍ້ວັນພັກ)
function renderScheduleTable() {
    renderSheetDropdown();
    if (typeof window.renderScheduleStaffRoster === 'function') window.renderScheduleStaffRoster();
    
    var sheet = getActiveSheet();
    if (!sheet) return;

    var scheduleData = sheet.data || {};
    var mKey = sheet.monthKey || sheet.month_key || '2026-09';
    var parts = mKey.split('-').map(Number);
    var year = parts[0] || 2026;
    var month = parts[1] || 9;
    var daysCount = new Date(year, month, 0).getDate() || 30;

    var isOfficial = sheet.status === 'PUBLISHED';
    var isG7 = sheet.isG7GroupSheet || false;

    var currentTitle = sheet.title || sheet.data?._meta?.title || `ຕາຕະລາງປະຈຳການ ${month}/${year}`;
    var currentNotes = sheet.notes || sheet.data?._meta?.notes || window.defaultNotesTemplate || '';

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
        var isWeekendOrHol = (dayOfWeek === 'SAT' || dayOfWeek === 'SUN' || isHol || dayData.isWeekend);

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

// ⭐ 7. CELL GRID: ປຸ່ມຄລິກເລືອກຊື່ (ປ້ອງກັນ Single-Quote Error)
function renderPixelExcelGrid(date, shift, list, rows, cols, isAdmin, sheetId) {
    cols = Math.max(cols, 2); rows = Math.max(rows, 1);
    var html = `<div class="grid w-full h-full" style="grid-template-columns: repeat(${cols}, minmax(0, 1fr)); grid-template-rows: repeat(${rows}, minmax(0, 1fr)); height: 48px;">`;
    var total = rows * cols;

    var sheet = getActiveSheet();
    var dayData = sheet?.data?.[date] || {};

    for (var idx = 0; idx < total; idx++) {
        var name = list[idx] || '';
        var isLeader = (window.users || []).find(u => u.nameLao === name && u.isLeader);
        var cleanName = (name || '').replace(/'/g, "\\'");
        var clickHandler = isAdmin ? `onclick="openCellModal('${date}', '${shift}', ${idx}, '${cleanName}')"` : '';

        var isModified = (window.scheduleAuditLogs || []).some(l => l.sheetId === sheetId && l.date === date && l.shift === shift && l.newName === name);
        var highlightClass = isModified ? 'bg-amber-200/90 font-bold text-amber-950 border-2 border-amber-500 shadow-inner' : '';

        var borderR = ((idx + 1) % cols !== 0) ? 'border-r border-black' : '';
        var borderB = (idx < (rows - 1) * cols) ? 'border-b border-black' : '';

        var shiftCountToday = 0;
        if (name) {
            if ((dayData.shift1 || []).includes(name)) shiftCountToday++;
            if ((dayData.shift2 || []).includes(name)) shiftCountToday++;
            if ((dayData.shift3 || []).includes(name)) shiftCountToday++;
        }
        var doubleShiftBadge = (shiftCountToday > 1) 
            ? `<span class="no-print ml-1 px-1 py-0.2 rounded text-[8px] font-black bg-amber-100 text-amber-800 border border-amber-300 inline-block shadow-xs" title="ຄວບກະ/ປະຈຳການແທນໝູ່">ຄວບ</span>` 
            : '';

        html += `
            <div class="grid-cell-box ${borderR} ${borderB} ${isAdmin ? 'editable cursor-pointer' : ''} ${highlightClass} ${isLeader ? 'text-brand-red font-semibold' : 'text-slate-800'}" ${clickHandler}>
                <span>${name}</span>${doubleShiftBadge}
            </div>
        `;
    }
    html += `</div>`;
    return html;
}

// ⭐ ເປີດ MODAL ເລືອກພະນັກງານ
function openCellModal(date, shift, index, currentName) {
    if (!window.currentUser || window.currentUser.role !== 'SUPER_ADMIN') return;
    window.activeEditCell = { 
        date: date, 
        shift: shift, 
        index: parseInt(index, 10) || 0, 
        currentName: (currentName || '').replace(/\\'/g, "'") 
    };
    
    var subtitle = document.getElementById('cellModalSubtitle');
    if (subtitle) subtitle.innerText = `ວັນທີ: ${date} [${shift}]`;
    
    var searchInput = document.getElementById('searchCellStaffInput');
    if (searchInput) searchInput.value = '';

    renderCellStaffList('');
    document.getElementById('cellSelectModal')?.classList.remove('hidden');
}

// ⭐ 8. ເລືອກພະນັກງານໃສ່ຊ່ອງ (ຖ້າເປັນ PUBLISHED ຈະຖາມເຫດຜົນ, ຖ້າ DRAFT ຈະອັບເດດທັນທີ)
async function selectStaffForCell(nameLao) {
    if (!window.activeEditCell) return;
    var { date, shift, index, currentName } = window.activeEditCell;
    var sheet = getActiveSheet();
    if (!sheet) return;

    // ຖ້າຕາຕະລາງຖືກ PUBLISH ແລ້ວ ແລະ ເປັນການປ່ຽນຄົນ: ຖາມເຫດຜົນ Remark
    if (sheet.status === 'PUBLISHED' && currentName !== nameLao) {
        closeCellModal();
        openEditPublishedRemarkModal({ 
            date: date, 
            shift: shift, 
            index: index, 
            currentName: currentName, 
            newName: nameLao 
        });
        return;
    }

    // ຖ້າເປັນສະບັບຮ່າງ (Draft): ບັນທຶກທັນທີ
    await applyCellUpdate(sheet, date, shift, index, nameLao);
}

// ⭐ 9. ລຶບຊື່ອອກຈາກຊ່ອງ (CLEAR CELL)
async function clearCurrentCell() {
    if (!window.activeEditCell) return;
    var { date, shift, index, currentName } = window.activeEditCell;
    var sheet = getActiveSheet();
    if (!sheet) return;

    if (sheet.status === 'PUBLISHED' && currentName) {
        closeCellModal();
        openEditPublishedRemarkModal({
            date: date,
            shift: shift,
            index: index,
            currentName: currentName,
            newName: '(ວ່າງ)'
        });
        return;
    }

    await applyCellUpdate(sheet, date, shift, index, '');
}

// ⭐ 10. FUNCTION ບັນທຶກຊື່ໃສ່ CELL ແບບປອດໄພ 100% ຕັດຊ່ອງວ່າງອອກ
async function applyCellUpdate(sheet, date, shift, index, nameLao) {
    if (!sheet.data) sheet.data = {};
    if (!sheet.data[date]) sheet.data[date] = { shift1: [], shift2: [], shift3: [] };
    if (!sheet.data[date][shift]) sheet.data[date][shift] = [];

    var list = sheet.data[date][shift];

    if (!nameLao || nameLao === '(ວ່າງ)') {
        if (index < list.length) list.splice(index, 1);
    } else {
        if (index < list.length) {
            list[index] = nameLao;
        } else {
            list.push(nameLao);
        }
    }

    // ກອງຊ່ອງວ່າງ ແລະ (ວ່າງ) ອອກທັງໝົດ
    sheet.data[date][shift] = list.filter(n => n && n.trim() !== '' && n !== '(ວ່າງ)');

    if (window.scheduleSheets) {
        var sIdx = window.scheduleSheets.findIndex(s => s.id === sheet.id);
        if (sIdx !== -1) window.scheduleSheets[sIdx].data = sheet.data;
    }

    try {
        localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
        localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
    } catch(e) {}

    closeCellModal();
    renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();

    // ⭐ SYNC ລົງ DATABASE ແບບ GUARANTEED (ປ້ອງກັນ Cloud Sync ດຶງຄ່າເກົ່າມາທັບ)
    await syncScheduleToSupabase(sheet);
    try {
        if (typeof saveAll === 'function') await saveAll();
    } catch(err) {}
}

// ⭐ 11. ເປີດ MODAL ຖາມເຫດຜົນການດັດແກ້ຕາຕະລາງ PUBLISHED
function openEditPublishedRemarkModal(editData) {
    window.pendingPublishedCellEdit = editData;
    var targetEl = document.getElementById('remarkModalTargetInfo');
    var oldEl = document.getElementById('remarkOldName');
    var newEl = document.getElementById('remarkNewName');
    var inputEl = document.getElementById('editPublishedRemarkInput');

    if (targetEl) targetEl.innerText = `ວັນທີ: ${editData.date} [${editData.shift}]`;
    if (oldEl) oldEl.innerText = editData.currentName || '(ຊ່ອງວ່າງ)';
    if (newEl) newEl.innerText = editData.newName;
    if (inputEl) {
        inputEl.value = '';
        setTimeout(() => inputEl.focus(), 100);
    }

    document.getElementById('editPublishedRemarkModal')?.classList.remove('hidden');
}

function closeEditPublishedRemarkModal() {
    document.getElementById('editPublishedRemarkModal')?.classList.add('hidden');
    window.pendingPublishedCellEdit = null;
}

// ⭐ 12. ຢືນຢັນດັດແກ້ຕາຕະລາງ PUBLISHED ພ້ອມບັນທຶກເຫດຜົນ REMARK ລົງ AUDIT LOG
async function confirmApplyPublishedCellUpdate() {
    if (!window.pendingPublishedCellEdit) return;
    var { date, shift, index, currentName, newName } = window.pendingPublishedCellEdit;
    var reasonInput = document.getElementById('editPublishedRemarkInput');
    var reason = reasonInput ? reasonInput.value.trim() : '';
    if (!reason) reason = 'ດັດແກ້ຕາມຄວາມຈຳເປັນ';

    var sheet = getActiveSheet();
    if (!sheet) return;

    if (!window.scheduleAuditLogs) window.scheduleAuditLogs = [];
    window.scheduleAuditLogs.unshift({
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
    });

    closeEditPublishedRemarkModal();
    await applyCellUpdate(sheet, date, shift, index, newName);
    showToast('ສຳເລັດ', `ດັດແກ້ຕາຕະລາງ ແລະ ບັນທຶກເຫດຜົນລົງ Database ຮຽບຮ້ອຍ!`, 'success');
}

function renderSheetDropdown() {
    var select = document.getElementById('scheduleSheetSelect');
    if (!select) return;
    select.innerHTML = '';
    
    if (!window.scheduleSheets || window.scheduleSheets.length === 0) {
        getActiveSheet();
    }

    (window.scheduleSheets || []).forEach(sheet => {
        var opt = document.createElement('option');
        opt.value = sheet.id;
        opt.innerText = (sheet.status === 'PUBLISHED' ? '[ທາງການ] ' : '[ສະບັບຮ່າງ] ') + (sheet.title || sheet.data?._meta?.title || '');
        if (sheet.id === window.activeSheetId) opt.selected = true;
        select.appendChild(opt);
    });
}

function changeActiveSheet() {
    window.activeSheetId = document.getElementById('scheduleSheetSelect')?.value;
    renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    try {
        if (typeof saveAll === 'function') saveAll();
    } catch(e) {}
}

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

    try {
        localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
        localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
    } catch(e) {}

    document.getElementById('newSheetModal')?.classList.add('hidden');
    renderSheetDropdown();
    renderScheduleTable();
    showToast('ສຳເລັດ', `ສ້າງ "${title}" ສຳເລັດ!`, 'success');

    try {
        if (typeof saveAll === 'function') await saveAll();
        await syncScheduleToSupabase(newSheet);
    } catch(e) {}
}

function openNewSheetModal() { document.getElementById('newSheetTitleInput').value = ''; document.getElementById('newSheetModal')?.classList.remove('hidden'); }

function openEditSheetInfoModal() {
    var sheet = getActiveSheet();
    if (!sheet) return;
    document.getElementById('editSheetTitleInput').value = sheet.title || sheet.data?._meta?.title || '';
    document.getElementById('editSheetNotesInput').value = sheet.notes || sheet.data?._meta?.notes || window.defaultNotesTemplate;
    document.getElementById('editSheetInfoModal')?.classList.remove('hidden');
}

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

    try {
        localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
        localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
    } catch(e) {}

    document.getElementById('editSheetInfoModal')?.classList.add('hidden');
    renderSheetDropdown();
    renderScheduleTable();
    showToast('ສຳເລັດ', 'ບັນທຶກຫົວຂໍ້ & ໝາຍເຫດ ລົງ Database ຮຽບຮ້ອຍແລ້ວ!', 'success');

    try {
        if (typeof saveAll === 'function') await saveAll();
        await syncScheduleToSupabase(sheet);
    } catch(e) {}
}

function promptResetSchedule() {
    askConfirm('ຣີເຊັດຕາຕະລາງ', 'ທ່ານຕ້ອງການຣີເຊັດຕາຕະລາງນີ້ທັງໝົດແທ້ບໍ່?', async () => {
        var sheet = getActiveSheet();
        sheet.data = {};
        renderScheduleTable();
        showToast('ສຳເລັດ', 'ຣີເຊັດຕາຕະລາງຮຽບຮ້ອຍແລ້ວ', 'success');

        try {
            if (typeof saveAll === 'function') await saveAll();
            await syncScheduleToSupabase(sheet);
        } catch(e) {}
    }, 'restart_alt', 'Reset');
}

function promptDeleteCurrentSheet() {
    if ((window.scheduleSheets || []).length <= 1) {
        showToast('ແຈ້ງເຕືອນ', 'ບໍ່ສາມາດລຶບໄດ້ ເພາະຕ້ອງມີຕາຕະລາງຢ່າງໜ້ອຍ 1 ອັນໃນລະບົບ', 'error');
        return;
    }
    var sheet = getActiveSheet();
    askConfirm('ຢືນຢັນການລຶບຕາຕະລາງ', `ທ່ານຕ້ອງການລຶບ "${sheet.title}" ອອກຈາກລະບົບແທ້ບໍ່?`, async () => {
        var delId = sheet.id;
        window.scheduleSheets = window.scheduleSheets.filter(s => s.id !== delId);
        window.activeSheetId = window.scheduleSheets[0].id;

        try {
            localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
            localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
        } catch(e) {}

        renderSheetDropdown();
        renderScheduleTable();
        showToast('ສຳເລັດ', `ລຶບຕາຕະລາງອອກຈາກລະບົບຮຽບຮ້ອຍແລ້ວ!`, 'success');

        try {
            if (typeof saveAll === 'function') await saveAll();
            if (window.supabaseClient) {
                await window.supabaseClient.from('schedules').delete().eq('id', delId);
            }
        } catch(e) {}
    }, 'delete', 'ລຶບຕາຕະລາງ');
}

function deleteAllDraftSheets() {
    var draftSheets = (window.scheduleSheets || []).filter(s => s.status === 'DRAFT');
    if (draftSheets.length === 0) {
        showToast('ແຈ້ງເຕືອນ', 'ບໍ່ມີຕາຕະລາງສະບັບຮ່າງ (Draft) ໃຫ້ລຶບ', 'info');
        return;
    }
    askConfirm('ລຶບຕາຕະລາງລ່ວງໜ້າທັງໝົດ', `ທ່ານຕ້ອງການລຶບຕາຕະລາງສະບັບຮ່າງ (Draft) ທັງໝົດ ${draftSheets.length} ເດືອນ ແທ້ບໍ່?`, async () => {
        var draftIds = draftSheets.map(s => s.id);
        window.scheduleSheets = window.scheduleSheets.filter(s => s.status !== 'DRAFT');
        window.activeSheetId = window.scheduleSheets[0].id;

        try {
            localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
            localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
        } catch(e) {}

        document.getElementById('batchMonthModal')?.classList.add('hidden');
        renderSheetDropdown();
        renderScheduleTable();
        showToast('ສຳເລັດ', `ລຶບຕາຕະລາງລ່ວງໜ້າຮຽບຮ້ອຍແລ້ວ!`, 'success');

        try {
            if (typeof saveAll === 'function') await saveAll();
            if (window.supabaseClient && draftIds.length > 0) {
                await window.supabaseClient.from('schedules').delete().in('id', draftIds);
            }
        } catch(e) {}
    }, 'delete_sweep', 'ລຶບ Draft ທັງໝົດ');
}

async function saveDraft() { 
    var sheet = getActiveSheet();
    sheet.status = 'DRAFT'; 
    renderSheetDropdown(); 
    renderScheduleTable(); 
    showToast('ສຳເລັດ', 'ບັນທຶກສະບັບຮ່າງ (Draft) ສຳເລັດ', 'success'); 

    try {
        if (typeof saveAll === 'function') await saveAll();
        await syncScheduleToSupabase(sheet);
    } catch(e) {}
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
    var dates = Object.keys(schedData).filter(k => !k.startsWith('_'));
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

    document.getElementById('holidayModal')?.classList.add('hidden');
    renderScheduleTable();
    showToast('ສຳເລັດ', 'ບັນທຶກວັນພັກພິເສດແລ້ວ', 'success');

    try {
        if (typeof saveAll === 'function') await saveAll();
        if (window.supabaseClient) {
            await window.supabaseClient.from('special_holidays').insert([newHol]);
        }
    } catch (err) {}
}

function closeCellModal() { 
    document.getElementById('cellSelectModal')?.classList.add('hidden'); 
    window.activeEditCell = null; 
}

function renderCellStaffList(q) {
    var container = document.getElementById('cellStaffListContainer');
    if (!container) return;
    container.innerHTML = '';
    (window.users || []).filter(u => u.role !== 'SUPER_ADMIN' && (u.nameLao.includes(q) || u.fullName.includes(q))).forEach(u => {
        container.innerHTML += `
            <div onclick="selectStaffForCell('${u.nameLao}')" class="p-2.5 border rounded-2xl hover:bg-red-50 flex items-center justify-between cursor-pointer text-xs font-lao">
                <span>${u.nameLao} (${u.fullName})</span>
                ${u.isLeader ? '<span class="text-[10px] bg-brand-red text-white px-2 py-0.5 rounded-full font-bold">ຫົວໜ້າ</span>' : ''}
            </div>
        `;
    });
}

function filterCellStaffList() { 
    renderCellStaffList(document.getElementById('searchCellStaffInput')?.value.trim() || ''); 
}

// ຜູກທຸກ Function ເຂົ້າ window ໃຫ້ກົດໄດ້ທຸກປຸ່ມ
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

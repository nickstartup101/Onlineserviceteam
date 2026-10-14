// ================= ⭐ MASTER SCHEDULE ENGINE & CONTINUOUS WEEKLY ZIGZAG (100% FIXED) =================

// 0. FUNCTION ກວດສອບຊ່ວງວັນພັກພິເສດ (ປ້ອງກັນ Error 100%)
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

// 0.1 HELPER ປຽບທຽບຊື່ແບບ STRICT EXACT MATCH (ຕັດ ທ້າວ/ນາງ ອອກ)
function isSchedNameMatch(a, b) {
    if (!a || !b) return false;
    var clean = function(s) {
        return s.toString().trim().toLowerCase()
            .replace(/^(ທ້າວ|ນາງ|ທ\.|ນ\.)\s*/, '')
            .replace(/\s+/g, '');
    };
    return clean(a) === clean(b);
}

// 0.2 ແປງຊື່ກະໃຫ້ເປັນ Standard Key
function normalizeSchedShiftKey(s) {
    if (!s) return null;
    var str = s.toString().toLowerCase().trim();
    if (str.includes('ທຸກກະ') || str.includes('all')) return null;
    if (str.includes('ກະ 1') || str.includes('ກະ1') || str.includes('shift1') || str.includes('shift 1') || str === '1') return 'shift1';
    if (str.includes('ກະ 2') || str.includes('ກະ2') || str.includes('shift2') || str.includes('shift 2') || str === '2') return 'shift2';
    if (str.includes('ກະ 3') || str.includes('ກະ3') || str.includes('shift3') || str.includes('shift 3') || str === '3') return 'shift3';
    return null;
}

// ⭐ 0.25 ດຶງລາຍຊື່ 2 ກຸ່ມຕົວຈິງຈາກ DATABASE (Supabase Profiles)
function getPermanentStaffList() {
    var all = (window.users || []).filter(function(u) { return u && u.role !== 'SUPER_ADMIN'; });
    // ລາຍຊື່ 17 ທ່ານຂອງວິຊາການສົມບູນ (ສະກົດຖືກຕ້ອງຕາມ Database 100%)
    var canonicalNames = [
        'ແສງດາວ', 'ພອນສະຫວັນ', 'ບຸນປະເສີດ', 'ພັນນິກອນ',
        'ສົມທະຍາ', 'ມິກກີ້', 'ໜູຮັກ', 'ແພັກກີ້',
        'ເອກສະຫວ່າງ', 'ໂທມິກ', 'ບຸນຮັກ', 'ປະສົງສິນ',
        'ສາຍທອງ', 'ສົມຊາຍ', 'ສີຊົມພູ', 'ສຸລິຍະສັກ', 'ໄກສະຫວາດ'
    ];

    var matched = [];
    canonicalNames.forEach(function(cn) {
        var found = all.find(function(u) { return u && u.nameLao && isSchedNameMatch(u.nameLao, cn); });
        matched.push(found ? found.nameLao : cn);
    });
    return matched;
}

function getContractStaffList() {
    var all = (window.users || []).filter(function(u) { return u && u.role !== 'SUPER_ADMIN'; });
    var permNames = getPermanentStaffList();
    return all
        .filter(function(u) { return u && u.nameLao && !permNames.some(function(pn) { return isSchedNameMatch(u.nameLao, pn); }); })
        .map(function(u) { return u.nameLao; });
}

// 0.3 ດຶງຂໍ້ມູນ SHIFT_SWAPS ຈາກ SUPABASE
async function fetchScheduleSwapsFromCloud() {
    if (!window.supabaseClient) return;
    try {
        var res = await window.supabaseClient.from('shift_swaps').select('*').order('id', { ascending: false });
        if (!res.error && res.data) {
            window.swapHistory = res.data.map(function(d) {
                var isCover = Boolean(d.reason && d.reason.indexOf('[COVER]') !== -1);
                return {
                    id: String(d.id),
                    swapType: isCover ? 'COVER' : 'SWAP',
                    fromName: d.from_name || d.fromName,
                    toName: d.to_name || d.toName,
                    startDate: d.start_date || d.startDate,
                    endDate: d.end_date || d.endDate,
                    fromShift: d.from_shift || d.fromShift,
                    toShift: d.to_shift || d.toShift,
                    reason: d.reason || '',
                    status: String(d.status || '').toUpperCase()
                };
            });
            try {
                localStorage.setItem('ot_swap_history', JSON.stringify(window.swapHistory));
            } catch(e) {}
        }
    } catch(err) {
        console.warn("Could not fetch swaps in schedule.js:", err);
    }
}

// 0.35 ດຶງຂໍ້ມູນ SCHEDULE_SHEETS ຈາກ SUPABASE CLOUD
async function fetchScheduleSheetsFromCloud() {
    if (!window.supabaseClient) return false;
    try {
        var res = await window.supabaseClient.from('schedule_sheets').select('*');
        if (!res.error && res.data && res.data.length > 0) {
            window.scheduleSheets = res.data.map(function(s) {
                var rawData = s.data || {};
                if (typeof rawData === 'string') {
                    try { rawData = JSON.parse(rawData); } catch(e) { rawData = {}; }
                }
                var mKey = s.monthKey || s.month_key || '2026-10';
                return {
                    id: String(s.id),
                    monthKey: String(mKey),
                    title: s.title || ('ຕາຕະລາງປະຈຳການ ' + mKey),
                    notes: s.notes || window.defaultNotesTemplate || '',
                    status: s.status || 'PUBLISHED',
                    isG7GroupSheet: Boolean(s.is_g7 || s.isG7GroupSheet),
                    data: rawData
                };
            });

            if (!window.activeSheetId || !window.scheduleSheets.some(function(s) { return String(s.id) === String(window.activeSheetId); })) {
                window.activeSheetId = window.scheduleSheets[0].id;
            }

            try {
                localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
                localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
            } catch(e) {}
            return true;
        }
    } catch(err) {
        console.warn("Could not fetch schedule sheets from cloud:", err);
    }
    return false;
}

// ⭐ 0.4 FUNCTION ດຶງ SHEET ປັດຈຸບັນ (ມີ Auto-Generate ຖ້າຕາຕະລາງວ່າງ)
function getActiveSheet() {
    if (!window.scheduleSheets || !Array.isArray(window.scheduleSheets) || window.scheduleSheets.length === 0) {
        try {
            var cached = localStorage.getItem('ot_schedule_sheets') || localStorage.getItem('ot_schedules_sheets');
            if (cached) window.scheduleSheets = JSON.parse(cached);
        } catch(e) {}
    }

    if (!window.scheduleSheets || !Array.isArray(window.scheduleSheets) || window.scheduleSheets.length === 0) {
        var defaultSheet = {
            id: 'sheet-2026-10-main',
            monthKey: '2026-10',
            title: 'ຕາຕະລາງປະຈຳການສຳລັບວິຊາການສົມບູນປະຈຳເດືອນ 10/2026',
            notes: window.defaultNotesTemplate || '',
            status: 'PUBLISHED',
            data: generateMonthDataZigzag(2026, 10, null)
        };
        window.scheduleSheets = [defaultSheet];
        window.activeSheetId = defaultSheet.id;
        try {
            localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
            localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
        } catch(e) {}
        syncScheduleToSupabase(defaultSheet);
        return defaultSheet;
    }

    var select = document.getElementById('scheduleSheetSelect');
    var targetId = (select && select.value) ? select.value : window.activeSheetId;
    var found = null;

    if (targetId) {
        found = window.scheduleSheets.find(function(s) { return String(s.id) === String(targetId); });
    }
    if (!found && window.activeSheetId) {
        found = window.scheduleSheets.find(function(s) { return String(s.id) === String(window.activeSheetId); });
    }
    if (!found) {
        found = window.scheduleSheets[0];
    }

    window.activeSheetId = found ? found.id : 'sheet-2026-10-main';

    // ⭐ ຖ້າ Sheet ວ່າງເປົ່າ (ຍັງບໍ່ມີຂໍ້ມູນວັນທີ): Auto-Generate ໃຫ້ທັນທີ!
    if (found && (!found.data || Object.keys(found.data).filter(function(k) { return !k.startsWith('_'); }).length === 0)) {
        var parts = (found.monthKey || '2026-10').split('-').map(Number);
        var y = parts[0] || 2026;
        var m = parts[1] || 10;
        found.data = generateMonthDataZigzag(y, m, null);
        syncScheduleToSupabase(found);
    }

    return found;
}
window.getActiveSheet = getActiveSheet;

// 0.5 SYNC ຕາຕະລາງຂຶ້ນ SUPABASE
async function syncScheduleToSupabase(sheet) {
    if (!window.supabaseClient || !sheet) return false;

    if (!sheet.data) sheet.data = {};
    sheet.data._meta = {
        title: sheet.title || '',
        notes: sheet.notes || ''
    };

    var mKey = sheet.monthKey || sheet.month_key || '2026-10';

    var payload = {
        id: String(sheet.id),
        title: sheet.title || '',
        status: sheet.status || 'DRAFT',
        monthKey: mKey,
        notes: sheet.notes || '',
        data: sheet.data
    };

    try {
        var resUpsert = await window.supabaseClient
            .from('schedule_sheets')
            .upsert(payload, { onConflict: 'id' });

        if (resUpsert.error) {
            var resUpd = await window.supabaseClient
                .from('schedule_sheets')
                .update(payload)
                .eq('id', sheet.id);

            if (resUpd.error) return false;
        }
        return true;
    } catch (err) {
        return false;
    }
}

// 0.6 UNIVERSAL SWAP SYNC ENGINE
function syncAllApprovedSwapsIntoSheet(sheet) {
    if (!sheet || !sheet.data) return false;

    if (!window.swapHistory || window.swapHistory.length === 0) {
        try {
            var cached = localStorage.getItem('ot_swap_history');
            if (cached) window.swapHistory = JSON.parse(cached);
        } catch(e) {}
    }

    var allDates = Object.keys(sheet.data).filter(function(k) { return !k.startsWith('_'); });
    var hasChange = false;

    allDates.forEach(function(dStr) {
        if (typeof window.autoApplyCompletedSwapsForDate === 'function') {
            var changed = window.autoApplyCompletedSwapsForDate(dStr);
            if (changed) hasChange = true;
        }
    });

    if (hasChange) {
        try {
            localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
            localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
            if (typeof saveAll === 'function') saveAll();
        } catch(e) {}
    }

    return hasChange;
}
window.syncAllApprovedSwapsIntoSheet = syncAllApprovedSwapsIntoSheet;

// ⭐ 1. ສູດຄຳນວນອາທິດ (Monday-Based Week Index) - ຮັກສາຄວາມຕໍ່ເນື່ອງຂ້າມເດືອນ 100%
function getMondayBasedWeekIndex(dateObj) {
    var epoch = Date.UTC(2026, 0, 5); // ວັນຈັນ 05/01/2026 ເປັນຈຸດເລີ່ມຕົ້ນມາດຕະຖານ
    var current = Date.UTC(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate());
    var diffDays = Math.floor((current - epoch) / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7);
}

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

// ⭐ 2. ສູດທີມຫຼັກ 17 ຄົນ: CONTINUOUS WEEKLY ZIGZAG (ກົງກັບຮູບເດືອນ 10/2026 ເປະໆ)
function generate17PersonLeadersAndStaffZigzag(year, month, staffList) {
    var daysCount = new Date(year, month, 0).getDate();
    var data = {};

    var listToUse = (staffList && staffList.length >= 17) ? staffList.slice(0, 17) : getPermanentStaffList();

    // 4 ຫົວໜ້າກະ (ດຶງຊື່ຈາກ Database)
    var allUsers = window.users || [];
    var leaderNames = listToUse.filter(function(name) {
        var u = allUsers.find(function(usr) { return usr && usr.nameLao && isSchedNameMatch(usr.nameLao, name); });
        return u && u.isLeader;
    });

    if (leaderNames.length < 4) {
        leaderNames = ['ແສງດາວ', 'ພອນສະຫວັນ', 'ບຸນປະເສີດ', 'ພັນນິກອນ'].filter(function(n) { return listToUse.includes(n); });
    }
    while (leaderNames.length < 4 && listToUse.length > leaderNames.length) {
        var extra = listToUse.find(function(n) { return !leaderNames.includes(n); });
        if (extra) leaderNames.push(extra);
    }

    // 13 ພະນັກງານປະຈຳການ
    var regularStaff = listToUse.filter(function(n) { return !leaderNames.includes(n); });
    var numRegular = 13;

    for (var i = 1; i <= daysCount; i++) {
        var dayNum = i < 10 ? '0' + i : '' + i;
        var mNum = month < 10 ? '0' + month : '' + month;
        var dStr = year + '-' + mNum + '-' + dayNum;
        var dateObj = new Date(Date.UTC(year, month - 1, i));
        var dayOfWeek = dateObj.getUTCDay();
        var isWeekend = (dayOfWeek === 6 || dayOfWeek === 0 || isDateInHolidayRange(dStr));

        if (isWeekend) {
            // ⭐ ວັນພັກ (Sat-Sun): ຮູບແບບຕາມເດືອນ 10/2026 (ກະ 1: ຄົນຢູ່ຊ່ອງກາງ 1x3, ກະ 2: 3 ຄົນ 1x3, ກະ 3: 3 ຄົນ 1x3)
            var gWeekend = getGlobalWeekendDayIndex(dateObj);
            var isSunday = (dayOfWeek === 0);

            var wLeaderSat = leaderNames[(gWeekend) % 4];
            var wLeaderSun = leaderNames[(gWeekend + 1) % 4];

            var wStaff = [];
            for (var k = 0; k < 5; k++) {
                wStaff.push(regularStaff[(gWeekend * 5 + k) % numRegular]);
            }

            var s1 = [];
            var s2 = [];
            var s3 = [];

            if (isSunday) {
                s1 = ['', wStaff[0], ''];
                s2 = [wLeaderSun, wStaff[1], wStaff[2]];
                s3 = [leaderNames[(gWeekend) % 4], wStaff[3], wStaff[4]];
            } else {
                s1 = ['', wStaff[0], ''];
                s2 = [wLeaderSat, wStaff[1], wStaff[2]];
                s3 = [leaderNames[(gWeekend + 2) % 4], wStaff[3], wStaff[4]];
            }

            data[dStr] = {
                isWeekend: true,
                isG7Team: false,
                shift1: s1,
                shift2: s2,
                shift3: s3
            };
        } else {
            // ⭐ ວັນທຳມະດາ (Mon-Fri): ວັນຈັນ ຫາ ວັນສຸກ ປະຈຳການກະດຽວກັນທັງອາທິດ (Continuous Weekly Zigzag)
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

            // ກະ 3: 1 ຫົວໜ້າ + 3 ພະນັກງານ = 4 ຄົນ (2x2)
            var staff_S3 = rotated.slice(0, 3);
            // ກະ 2: 1 ຫົວໜ້າ + 5 ພະນັກງານ = 6 ຄົນ (2x3)
            var staff_S2 = rotated.slice(3, 8);
            // ກະ 1: 2 ຫົວໜ້າ + 5 ພະນັກງານ = 7 ຄົນ (2x4, ມີຊ່ອງວ່າງ 1 ຊ່ອງ)
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

// 3. ສູດກຸ່ມ 7 ຄົນ: Rolling 5/2 (ສຳລັບກຸ່ມ 7 ຄົນ)
function generate7PersonFlexZigzag(year, month, staffList) {
    var daysCount = new Date(year, month, 0).getDate();
    var data = {};
    var N = 7;
    var epochDate = new Date(Date.UTC(2026, 0, 1));

    for (var i = 1; i <= daysCount; i++) {
        var dayNum = i < 10 ? '0' + i : '' + i;
        var mNum = month < 10 ? '0' + month : '' + month;
        var dStr = year + '-' + mNum + '-' + dayNum;
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

function generateMonthDataZigzag(year, month, targetGroupMembers) {
    var staffList = [];
    if (targetGroupMembers && targetGroupMembers.length > 0) {
        staffList = [...targetGroupMembers];
    } else {
        staffList = getPermanentStaffList();
    }

    if (staffList.length === 7) {
        return generate7PersonFlexZigzag(year, month, staffList);
    } else {
        return generate17PersonLeadersAndStaffZigzag(year, month, staffList);
    }
}

// 4. MODAL ສຸ່ມກຸ່ມ (ແຍກ 2 ກຸ່ມຊັດເຈນ)
function openRandomGroupSelectModal() {
    var select = document.getElementById('randomSelectedGroupId');
    if (!select) return;
    select.innerHTML = '';
    
    var optMain = document.createElement('option');
    optMain.value = 'GRP_MAIN_17';
    optMain.innerText = 'ກຸ່ມທີມວິຊາການສົມບູນ (17 ຄົນ - Weekly Zigzag)';
    select.appendChild(optMain);

    var optContract = document.createElement('option');
    optContract.value = 'GRP_CONTRACT';
    optContract.innerText = 'ກຸ່ມທີມວິຊາການສັນຍາ (Contract Staff)';
    select.appendChild(optContract);

    (window.employeeGroups || []).forEach(function(grp) {
        if (grp && grp.id !== 'GRP_MAIN_17' && grp.id !== 'GRP_CONTRACT') {
            var opt = document.createElement('option');
            opt.value = grp.id;
            opt.innerText = grp.name + ' (' + (grp.members || []).length + ' ຄົນ)';
            select.appendChild(opt);
        }
    });

    document.getElementById('randomGroupSelectModal')?.classList.remove('hidden');
}

async function executeGroupRandomSchedule() {
    var sheet = getActiveSheet();
    var [year, month] = (sheet?.monthKey || '2026-10').split('-').map(Number);
    var selectedGrpId = document.getElementById('randomSelectedGroupId')?.value || 'GRP_MAIN_17';
    
    var members = null;
    if (selectedGrpId === 'GRP_MAIN_17') {
        members = getPermanentStaffList();
        sheet.isG7GroupSheet = false;
    } else if (selectedGrpId === 'GRP_CONTRACT') {
        members = getContractStaffList();
        sheet.isG7GroupSheet = false;
    } else {
        var found = (window.employeeGroups || []).find(function(g) { return g && g.id === selectedGrpId; });
        if (found && found.members) {
            members = found.members;
            sheet.isG7GroupSheet = (members.length === 7);
        }
    }

    sheet.data = generateMonthDataZigzag(year, month, members);
    
    try {
        localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
        localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
    } catch(e) {}

    await renderScheduleTable({ skipSwapSync: true });
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    document.getElementById('randomGroupSelectModal')?.classList.add('hidden');
    showToast('ສຳເລັດ', 'ສ້າງຕາຕະລາງ Zigzag ຮຽບຮ້ອຍ!', 'success');

    await syncScheduleToSupabase(sheet);
}

// 5. BATCH MONTH
function openBatchMonthModal() {
    var select = document.getElementById('batchTargetGroupSelect');
    if (select) {
        select.innerHTML = '<option value="GRP_MAIN_17">ກຸ່ມທີມວິຊາການສົມບູນ (17 ຄົນ)</option>' +
                           '<option value="GRP_CONTRACT">ກຸ່ມທີມວິຊາການສັນຍາ (Contract Staff)</option>';
        (window.employeeGroups || []).forEach(function(grp) {
            if (grp && grp.id !== 'GRP_MAIN_17' && grp.id !== 'GRP_CONTRACT') {
                select.innerHTML += '<option value="' + grp.id + '">' + grp.name + '</option>';
            }
        });
    }
    document.getElementById('batchMonthModal')?.classList.remove('hidden');
}

async function executeBatchMonthGenerate() {
    var startM = document.getElementById('batchStartMonth')?.value;
    var count = parseInt(document.getElementById('batchMonthCount')?.value) || 6;
    var selectedGrpId = document.getElementById('batchTargetGroupSelect')?.value || 'GRP_MAIN_17';

    if (!startM) {
        showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາເລືອກເດືອນເລີ່ມຕົ້ນ', 'error');
        return;
    }

    var selectedMembers = (selectedGrpId === 'GRP_CONTRACT') ? getContractStaffList() : getPermanentStaffList();
    var groupNameTag = (selectedGrpId === 'GRP_CONTRACT') ? ' (ສັນຍາ)' : ' (ສົມບູນ)';

    var [startYear, startMonth] = startM.split('-').map(Number);
    var firstGeneratedSheetId = null;
    var activeSheet = getActiveSheet();
    var currentNotes = activeSheet?.notes || activeSheet?.data?._meta?.notes || window.defaultNotesTemplate;

    for (var c = 0; c < count; c++) {
        var targetDate = new Date(startYear, startMonth - 1 + c, 1);
        var y = targetDate.getFullYear();
        var m = targetDate.getMonth() + 1;
        var mStr = m < 10 ? '0' + m : '' + m;
        var monthKey = y + '-' + mStr;
        var sheetId = 'sheet-' + monthKey + '-' + (selectedGrpId === 'GRP_CONTRACT' ? 'contract' : 'main');
        var title = 'ຕາຕະລາງປະຈຳການສຳລັບວິຊາການ' + (selectedGrpId === 'GRP_CONTRACT' ? 'ສັນຍາ' : 'ສົມບູນ') + 'ປະຈຳເດືອນ ' + mStr + '/' + y;

        var generatedData = generateMonthDataZigzag(y, m, selectedMembers);

        var existingIdx = window.scheduleSheets.findIndex(function(s) { return s && s.monthKey === monthKey && s.title && s.title.includes(groupNameTag); });
        var currentSheetObj = null;
        if (existingIdx !== -1) {
            window.scheduleSheets[existingIdx].data = generatedData;
            window.scheduleSheets[existingIdx].title = title;
            window.scheduleSheets[existingIdx].notes = currentNotes;
            window.scheduleSheets[existingIdx].isG7GroupSheet = false;
            currentSheetObj = window.scheduleSheets[existingIdx];
        } else {
            currentSheetObj = {
                id: sheetId,
                monthKey: monthKey,
                title: title,
                notes: currentNotes,
                status: 'DRAFT',
                isG7GroupSheet: false,
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
    await renderScheduleTable({ skipSwapSync: true });
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    showToast('ສຳເລັດ', 'ສ້າງຕາຕະລາງຕໍ່ເນື່ອງ ' + count + ' ເດືອນສຳເລັດ!', 'success');
}

// ⭐ 6. RENDER ຕາຕະລາງໃຫຍ່ (100% Guaranteed Render)
async function renderScheduleTable(options) {
    var opts = options || {};
    
    // 1. ຮັບປະກັນວ່າ Sheet ຖືກເລືອກສະເໝີ
    var sheet = getActiveSheet();
    if (!sheet) return;

    renderSheetDropdown();
    if (typeof window.renderScheduleStaffRoster === 'function') window.renderScheduleStaffRoster();

    await fetchScheduleSwapsFromCloud();

    if (!opts.skipSwapSync) {
        syncAllApprovedSwapsIntoSheet(sheet);
    }

    var scheduleData = sheet.data || {};
    var mKey = sheet.monthKey || sheet.month_key || '2026-10';
    var parts = mKey.split('-').map(Number);
    var year = parts[0] || 2026;
    var month = parts[1] || 10;
    var daysCount = new Date(year, month, 0).getDate() || 30;

    var isOfficial = (sheet.status === 'PUBLISHED');
    var isG7 = Boolean(sheet.isG7GroupSheet);

    var currentTitle = sheet.title || sheet.data?._meta?.title || ('ຕາຕະລາງປະຈຳການ ' + month + '/' + year);
    var currentNotes = sheet.notes || sheet.data?._meta?.notes || window.defaultNotesTemplate || '';

    var titleEl = document.getElementById('scheduleTableTitle');
    if (titleEl) {
        titleEl.innerHTML = '<span>' + currentTitle + '</span>' +
            '<span class="no-print ml-2 text-xs font-semibold ' + (isOfficial ? 'text-emerald-700' : 'text-amber-700') + '">' +
                '(' + (isOfficial ? 'ສະບັບທາງການ' : 'ສະບັບຮ່າງລ່ວງໜ້າ') + ')' +
            '</span>';
    }
    
    var notesEl = document.getElementById('scheduleNotesDisplay');
    if (notesEl) notesEl.innerText = currentNotes;

    var banner = document.getElementById('scheduleStatusBanner');
    var badge = document.getElementById('scheduleStatusBadge');
    var modCountText = document.getElementById('modifiedCellCountText');

    if (banner && badge) {
        var g7Badge = isG7 ? '<span class="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">🔹 ກຸ່ມ 7 ຄົນ</span>' : '';
        if (isOfficial) {
            banner.className = "no-print px-6 py-2 bg-emerald-50 border-b border-emerald-200 flex justify-between items-center text-xs";
            badge.className = "font-bold text-emerald-800 flex items-center gap-2";
            badge.innerHTML = '<span class="material-symbols-outlined text-sm text-emerald-600">verified</span> ຕາຕະລາງທາງການ (Published Official) ' + g7Badge;
        } else {
            banner.className = "no-print px-6 py-2 bg-amber-50 border-b border-amber-200 flex justify-between items-center text-xs";
            badge.className = "font-bold text-amber-900 flex items-center gap-2";
            badge.innerHTML = '<span class="material-symbols-outlined text-sm text-amber-700">pending_actions</span> ສະບັບຮ່າງລ່ວງໜ້າ ' + g7Badge;
        }
    }

    var sheetLogs = (window.scheduleAuditLogs || []).filter(function(l) { return l && l.sheetId === sheet.id; });
    if (modCountText) {
        modCountText.innerHTML = sheetLogs.length > 0 ? '<span class="material-symbols-outlined text-xs text-amber-700">history_edu</span> ມີການດັດແກ້: ' + sheetLogs.length + ' ຈຸດ' : '';
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
        var dStr = year + '-' + mNum + '-' + dayNum;
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
                tbody.innerHTML += '<tr class="bg-red-50/80 font-bold border-t-2 border-b border-black text-brand-red">' +
                    '<td colspan="2" class="p-1 text-center font-bold text-xs">ວັນພັກ</td>' +
                    '<td style="width: 36%;" class="p-1 text-center font-bold text-xs">08:00 - 13:30</td>' +
                    '<td style="width: 34%;" class="p-1 text-center font-bold text-xs">13:30 - 19:00</td>' +
                    '<td style="width: 24%;" class="p-1 text-center font-bold text-xs">19:00 - 08:00</td>' +
                '</tr>';
            } else {
                tbody.innerHTML += '<tr class="bg-slate-100 font-bold border-t-2 border-b border-black text-slate-800">' +
                    '<th style="width: 75px;" class="p-1 font-bold">ວັນທີ</th>' +
                    '<th style="width: 48px;" class="p-1 font-bold">ວັນ</th>' +
                    '<th style="width: 36%;" class="p-1 font-bold">08:00 - 16:00</th>' +
                    '<th style="width: 34%;" class="p-1 font-bold">12:00 - 20:00</th>' +
                    '<th style="width: 24%;" class="p-1 font-bold">20:00 - 08:00</th>' +
                '</tr>';
            }
        }
        prevHeaderType = currentHeaderType;

        // ⭐ ຂະໜາດ Grid: ວັນທຳມະດາ (S1: 2x4, S2: 2x3, S3: 2x2) | ວັນພັກ (1x3 ທຸກກະ ຄືກັບເດືອນ 10/2026)
        var s1Rows = isWeekendOrHol ? 1 : 2;
        var s1Cols = isWeekendOrHol ? 3 : 4;

        var s2Rows = isWeekendOrHol ? 1 : 2;
        var s2Cols = isWeekendOrHol ? 3 : 3;

        var s3Rows = isWeekendOrHol ? 1 : 2;
        var s3Cols = isWeekendOrHol ? 3 : 2;

        tbody.innerHTML += '<tr class="' + (isWeekendOrHol ? 'bg-slate-50' : 'bg-white') + '">' +
            '<td class="font-bold whitespace-nowrap">' + i + '/' + mNum + '/' + year + '</td>' +
            '<td class="font-bold ' + (isWeekendOrHol ? 'text-brand-red' : '') + '">' + dayOfWeek + '</td>' +
            '<td class="p-0">' + renderPixelExcelGrid(dStr, 'shift1', dayData.shift1 || [], s1Rows, s1Cols, isAdmin, sheet.id) + '</td>' +
            '<td class="p-0">' + renderPixelExcelGrid(dStr, 'shift2', dayData.shift2 || [], s2Rows, s2Cols, isAdmin, sheet.id) + '</td>' +
            '<td class="p-0">' + renderPixelExcelGrid(dStr, 'shift3', dayData.shift3 || [], s3Rows, s3Cols, isAdmin, sheet.id) + '</td>' +
        '</tr>';
    }
}

// ⭐ 7. RENDER PIXEL EXCEL GRID (ລວງສູງ 48px ມາດຕະຖານ)
function renderPixelExcelGrid(date, shift, list, rows, cols, isAdmin, sheetId) {
    cols = Math.max(cols, 1); rows = Math.max(rows, 1);
    var html = '<div class="grid w-full h-full" style="grid-template-columns: repeat(' + cols + ', minmax(0, 1fr)); grid-template-rows: repeat(' + rows + ', minmax(0, 1fr)); height: 48px;">';
    var total = rows * cols;

    for (var idx = 0; idx < total; idx++) {
        var name = list[idx] || '';
        var isLeader = (window.users || []).find(function(u) { return u && u.nameLao && isSchedNameMatch(u.nameLao, name) && u.isLeader; });
        var cleanName = (name || '').replace(/'/g, "\\'");
        var clickHandler = isAdmin ? 'onclick="openCellModal(\'' + date + '\', \'' + shift + '\', ' + idx + ', \'' + cleanName + '\')"' : '';

        var isSwapped = (window.swapHistory || []).some(function(sw) {
            if (!sw) return false;
            var st = String(sw.status || '').toUpperCase();
            var sStart = sw.startDate || sw.start_date;
            var sEnd = sw.endDate || sw.end_date || sStart;
            return st === 'COMPLETED' && (date >= sStart && date <= sEnd) &&
                   (isSchedNameMatch(sw.fromName || sw.from_name, name) || isSchedNameMatch(sw.toName || sw.to_name, name));
        });

        var borderR = ((idx + 1) % cols !== 0) ? 'border-r border-black' : '';
        var borderB = (idx < (rows - 1) * cols) ? 'border-b border-black' : '';

        var leaveInfo = (typeof getStaffLeaveInfo === 'function' && name) ? getStaffLeaveInfo(name, shift, date) : null;

        var cellBg = 'bg-white';
        if (isSwapped && name) {
            cellBg = 'bg-amber-50/50 hover:bg-amber-100/60';
        } else if (leaveInfo && name) {
            cellBg = 'bg-slate-50/60';
        } else if (isAdmin) {
            cellBg = 'bg-white hover:bg-slate-50';
        }

        var textClass = isLeader ? 'text-brand-red font-bold' : 'text-slate-800 font-medium';
        if (leaveInfo) {
            textClass = 'line-through text-slate-400 opacity-60';
        }

        var badgesHtml = '';
        if (isLeader && name) {
            badgesHtml += '<span class="w-1.5 h-1.5 rounded-full bg-brand-red ml-1 shrink-0 inline-block" title="ຫົວໜ້າກະ"></span>';
        }
        if (isSwapped && name) {
            badgesHtml += '<span class="no-print inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-amber-100 text-amber-700 ml-1 shrink-0 shadow-2xs" title="ປ່ຽນກະມາ">' +
                            '<span class="material-symbols-outlined text-[10px] leading-none">sync_alt</span>' +
                          '</span>';
        }
        if (leaveInfo && name) {
            badgesHtml += '<span class="no-print ml-1 px-1 py-0.2 rounded text-[8px] font-bold bg-rose-100 text-rose-600 shrink-0 no-underline">ພັກ</span>';
        }

        html += '<div class="grid-cell-box ' + borderR + ' ' + borderB + ' ' + cellBg + ' flex items-center justify-center px-1 text-center transition-colors ' + (isAdmin ? 'editable cursor-pointer' : '') + '" ' + clickHandler + '>' +
            '<span class="inline-flex items-center justify-center ' + textClass + '">' +
                '<span>' + name + '</span>' +
                badgesHtml +
            '</span>' +
        '</div>';
    }
    html += '</div>';
    return html;
}

// 8. CELL MODAL & UPDATES
function openCellModal(date, shift, index, currentName) {
    if (!window.currentUser || window.currentUser.role !== 'SUPER_ADMIN') return;
    window.activeEditCell = { 
        date: date, 
        shift: shift, 
        index: parseInt(index, 10) || 0, 
        currentName: (currentName || '').replace(/\\'/g, "'") 
    };
    
    var subtitle = document.getElementById('cellModalSubtitle');
    if (subtitle) subtitle.innerText = 'ວັນທີ: ' + date + ' [' + shift + ']';
    
    var searchInput = document.getElementById('searchCellStaffInput');
    if (searchInput) searchInput.value = '';

    renderCellStaffList('');
    document.getElementById('cellSelectModal')?.classList.remove('hidden');
}

async function selectStaffForCell(nameLao) {
    if (!window.activeEditCell) return;
    var act = window.activeEditCell;
    var sheet = getActiveSheet();
    if (!sheet) return;

    if (sheet.status === 'PUBLISHED' && act.currentName !== nameLao) {
        closeCellModal();
        openEditPublishedRemarkModal({ 
            date: act.date, 
            shift: act.shift, 
            index: act.index, 
            currentName: act.currentName, 
            newName: nameLao 
        });
        return;
    }

    await applyCellUpdate(sheet, act.date, act.shift, act.index, nameLao);
}

async function clearCurrentCell() {
    if (!window.activeEditCell) return;
    var act = window.activeEditCell;
    var sheet = getActiveSheet();
    if (!sheet) return;

    if (sheet.status === 'PUBLISHED' && act.currentName) {
        closeCellModal();
        openEditPublishedRemarkModal({
            date: act.date,
            shift: act.shift,
            index: act.index,
            currentName: act.currentName,
            newName: '(ວ່າງ)'
        });
        return;
    }

    await applyCellUpdate(sheet, act.date, act.shift, act.index, '');
}

async function applyCellUpdate(sheet, date, shift, index, nameLao) {
    if (!sheet) return;
    if (!sheet.data) sheet.data = {};
    if (!sheet.data[date]) sheet.data[date] = { shift1: [], shift2: [], shift3: [] };
    if (!sheet.data[date][shift]) sheet.data[date][shift] = [];

    var list = sheet.data[date][shift];

    if (!nameLao || nameLao === '(ວ່າງ)') {
        if (index < list.length) list[index] = '';
    } else {
        while (list.length <= index) {
            list.push('');
        }
        list[index] = nameLao;
    }

    sheet.data[date][shift] = list;

    try {
        localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
        localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
    } catch(e) {}

    closeCellModal();

    var isSynced = await syncScheduleToSupabase(sheet);
    if (isSynced) {
        showToast('ສຳເລັດ', 'ດັດແກ້ຕາຕະລາງ ແລະ ບັນທຶກລົງ Database ແລ້ວ!', 'success');
    }

    await renderScheduleTable({ skipSwapSync: true });
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
}

function openEditPublishedRemarkModal(editData) {
    window.pendingPublishedCellEdit = editData;
    var targetEl = document.getElementById('remarkModalTargetInfo');
    var oldEl = document.getElementById('remarkOldName');
    var newEl = document.getElementById('remarkNewName');
    var inputEl = document.getElementById('editPublishedRemarkInput');

    if (targetEl) targetEl.innerText = 'ວັນທີ: ' + editData.date + ' [' + editData.shift + ']';
    if (oldEl) oldEl.innerText = editData.currentName || '(ຊ່ອງວ່າງ)';
    if (newEl) newEl.innerText = editData.newName;
    if (inputEl) {
        inputEl.value = '';
        setTimeout(function() { inputEl.focus(); }, 100);
    }

    document.getElementById('editPublishedRemarkModal')?.classList.remove('hidden');
}

function closeEditPublishedRemarkModal() {
    document.getElementById('editPublishedRemarkModal')?.classList.add('hidden');
    window.pendingPublishedCellEdit = null;
}

async function confirmApplyPublishedCellUpdate() {
    if (!window.pendingPublishedCellEdit) return;
    var act = window.pendingPublishedCellEdit;
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
        date: act.date,
        shift: act.shift,
        oldName: act.currentName || '(ວ່າງ)',
        newName: act.newName,
        reason: reason,
        adminName: window.currentUser?.fullName || 'Admin',
        timestamp: new Date().toLocaleString('lo-LA')
    });

    closeEditPublishedRemarkModal();
    await applyCellUpdate(sheet, act.date, act.shift, act.index, act.newName);
}

// 9. DROPDOWN & SHEET ACTIONS
function renderSheetDropdown() {
    var select = document.getElementById('scheduleSheetSelect');
    if (!select) return;
    select.innerHTML = '';
    
    if (!window.scheduleSheets || window.scheduleSheets.length === 0) {
        getActiveSheet();
    }

    (window.scheduleSheets || []).forEach(function(sheet) {
        if (!sheet) return;
        var opt = document.createElement('option');
        opt.value = sheet.id;
        var sTitle = sheet.title || sheet.data?._meta?.title || ('ຕາຕະລາງປະຈຳການ ' + (sheet.monthKey || ''));
        opt.innerText = (sheet.status === 'PUBLISHED' ? '[ທາງການ] ' : '[ສະບັບຮ່າງ] ') + sTitle;
        if (String(sheet.id) === String(window.activeSheetId)) opt.selected = true;
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
    var title = document.getElementById('newSheetTitleInput')?.value.trim() || ('ຕາຕະລາງປະຈຳການ ' + month);
    var [y, m] = month.split('-').map(Number);
    var newId = 'sheet-' + Date.now();
    
    var targetMembers = title.includes('ສັນຍາ') ? getContractStaffList() : getPermanentStaffList();
    var generated = generateMonthDataZigzag(y, m, targetMembers);

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
    await renderScheduleTable({ skipSwapSync: true });
    showToast('ສຳເລັດ', 'ສ້າງ "' + title + '" ສຳເລັດ!', 'success');

    await syncScheduleToSupabase(newSheet);
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
    sheet.data._meta = { title: sheet.title, notes: sheet.notes };

    try {
        localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
        localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
    } catch(e) {}

    document.getElementById('editSheetInfoModal')?.classList.add('hidden');
    renderSheetDropdown();
    await renderScheduleTable({ skipSwapSync: true });
    showToast('ສຳເລັດ', 'ບັນທຶກຫົວຂໍ້ & ໝາຍເຫດ ສຳເລັດ!', 'success');
    await syncScheduleToSupabase(sheet);
}

function promptResetSchedule() {
    if (!confirm('ທ່ານຕ້ອງການຣີເຊັດຕາຕະລາງນີ້ທັງໝົດແທ້ບໍ່?')) return;
    var sheet = getActiveSheet();
    var [year, month] = (sheet?.monthKey || '2026-10').split('-').map(Number);
    sheet.data = generateMonthDataZigzag(year, month, null);
    renderScheduleTable();
    showToast('ສຳເລັດ', 'ຣີເຊັດຕາຕະລາງຮຽບຮ້ອຍແລ້ວ', 'success');
    syncScheduleToSupabase(sheet);
}

function promptDeleteCurrentSheet() {
    if ((window.scheduleSheets || []).length <= 1) {
        showToast('ແຈ້ງເຕືອນ', 'ບໍ່ສາມາດລຶບໄດ້ ເພາະຕ້ອງມີຕາຕະລາງຢ່າງໜ້ອຍ 1 ອັນ', 'error');
        return;
    }
    var sheet = getActiveSheet();
    if (!confirm('ທ່ານຕ້ອງການລຶບ "' + sheet.title + '" ອອກຈາກລະບົບແທ້ບໍ່?')) return;

    var delId = sheet.id;
    window.scheduleSheets = window.scheduleSheets.filter(function(s) { return String(s.id) !== String(delId); });
    window.activeSheetId = window.scheduleSheets[0].id;

    try {
        localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
        localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
    } catch(e) {}

    renderSheetDropdown();
    renderScheduleTable();
    showToast('ສຳເລັດ', 'ລຶບຕາຕະລາງອອກແລ້ວ!', 'success');

    if (window.supabaseClient) {
        window.supabaseClient.from('schedule_sheets').delete().eq('id', delId).then();
    }
}

async function saveDraft() { 
    var sheet = getActiveSheet();
    sheet.status = 'DRAFT'; 
    renderSheetDropdown(); 
    await renderScheduleTable({ skipSwapSync: true }); 
    showToast('ສຳເລັດ', 'ບັນທຶກສະບັບຮ່າງ (Draft) ສຳເລັດ', 'success'); 
    await syncScheduleToSupabase(sheet);
}

async function publishSchedule() {
    var sheet = getActiveSheet();
    sheet.status = 'PUBLISHED';
    renderSheetDropdown();
    await renderScheduleTable({ skipSwapSync: true });
    showToast('ເຜີຍແຜ່ສຳເລັດ', 'ຕາຕະລາງຖືກ Publish ເປັນທາງການແລ້ວ!', 'success');
    await syncScheduleToSupabase(sheet);
}

// 10. REBALANCE SHIFT 3
async function rebalanceNightShifts() {
    var sheet = getActiveSheet();
    var schedData = sheet?.data || {};
    var dates = Object.keys(schedData).filter(function(k) { return !k.startsWith('_'); });
    if (dates.length === 0) {
        showToast('ແຈ້ງເຕືອນ', 'ຕາຕະລາງຍັງວ່າງເປົ່າ', 'info');
        return;
    }

    var leaderNames = ['ແສງດາວ', 'ພອນສະຫວັນ', 'ບຸນປະເສີດ', 'ພັນນິກອນ'];
    var leaderFixedCount = 0;
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
                    leaderFixedCount++;
                }
            }
        }
    });

    await renderScheduleTable({ skipSwapSync: true });
    await syncScheduleToSupabase(sheet);
    showToast('Rebalance ສຳເລັດ', 'ປັບສົມດຸນຮຽບຮ້ອຍ!', 'success');
}

// 11. EXPORT A4 PDF
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
        filename:     (sheet?.title || sheet?.data?._meta?.title || 'ຕາຕະລາງປະຈຳການ') + '.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save().then(function() {
        element.className = originalClass;
        element.setAttribute('style', originalStyle);
        if (parent) { parent.scrollTop = prevScrollTop; parent.scrollLeft = prevScrollLeft; }
        noPrintEls.forEach(function(el) { el.style.display = ''; });
        showToast('ສຳເລັດ', 'Export PDF A4 ສຳເລັດ!', 'success');
    }).catch(function() {
        element.className = originalClass;
        element.setAttribute('style', originalStyle);
        noPrintEls.forEach(function(el) { el.style.display = ''; });
        showToast('ຜິດພາດ', 'Export ບໍ່ສຳເລັດ', 'error');
    });
}

function closeCellModal() { 
    document.getElementById('cellSelectModal')?.classList.add('hidden'); 
    window.activeEditCell = null; 
}

function renderCellStaffList(q) {
    var container = document.getElementById('cellStaffListContainer');
    if (!container) return;
    container.innerHTML = '';
    (window.users || []).filter(function(u) { return u && u.role !== 'SUPER_ADMIN' && ((u.nameLao && u.nameLao.includes(q)) || (u.fullName && u.fullName.includes(q))); }).forEach(function(u) {
        container.innerHTML += '<div onclick="selectStaffForCell(\'' + u.nameLao + '\')" class="p-2.5 border rounded-2xl hover:bg-red-50 flex items-center justify-between cursor-pointer text-xs font-lao">' +
            '<span>' + u.nameLao + ' (' + u.fullName + ')</span>' +
            (u.isLeader ? '<span class="text-[10px] bg-brand-red text-white px-2 py-0.5 rounded-full font-bold">ຫົວໜ້າ</span>' : '') +
        '</div>';
    });
}

function filterCellStaffList() { 
    renderCellStaffList(document.getElementById('searchCellStaffInput')?.value.trim() || ''); 
}

// Auto-load
var _origTabForSchedule = window.switchTab;
window.switchTab = async function(tab) {
    if (typeof _origTabForSchedule === 'function') _origTabForSchedule(tab);
    if (tab === 'schedule') {
        await fetchScheduleSheetsFromCloud();
        await renderScheduleTable();
    }
};

document.addEventListener('DOMContentLoaded', async function() {
    await fetchScheduleSheetsFromCloud();
    setTimeout(renderScheduleTable, 100);
});

// ຜູກ Functions ເຂົ້າ Window
window.isDateInHolidayRange = isDateInHolidayRange;
window.syncScheduleToSupabase = syncScheduleToSupabase;
window.fetchScheduleSwapsFromCloud = fetchScheduleSwapsFromCloud;
window.fetchScheduleSheetsFromCloud = fetchScheduleSheetsFromCloud;
window.syncAllApprovedSwapsIntoSheet = syncAllApprovedSwapsIntoSheet;
window.getMondayBasedWeekIndex = getMondayBasedWeekIndex;
window.getGlobalWeekendDayIndex = getGlobalWeekendDayIndex;
window.rebalanceNightShifts = rebalanceNightShifts;
window.renderScheduleTable = renderScheduleTable;
window.renderSheetDropdown = renderSheetDropdown;
window.changeActiveSheet = changeActiveSheet;
window.generateMonthDataZigzag = generateMonthDataZigzag;
window.generate7PersonFlexZigzag = generate7PersonFlexZigzag;
window.generate17PersonLeadersAndStaffZigzag = generate17PersonLeadersAndStaffZigzag;
window.executeGroupRandomSchedule = executeGroupRandomSchedule;
window.openRandomGroupSelectModal = openRandomGroupSelectModal;
window.promptDeleteCurrentSheet = promptDeleteCurrentSheet;
window.openNewSheetModal = openNewSheetModal;
window.handleCreateNewSheet = handleCreateNewSheet;
window.openEditSheetInfoModal = openEditSheetInfoModal;
window.handleSaveSheetInfo = handleSaveSheetInfo;
window.promptResetSchedule = promptResetSchedule;
window.saveDraft = saveDraft;
window.publishSchedule = publishSchedule;
window.exportToA4PDF = exportToA4PDF;
window.openCellModal = openCellModal;
window.closeCellModal = closeCellModal;
window.filterCellStaffList = filterCellStaffList;
window.selectStaffForCell = selectStaffForCell;
window.clearCurrentCell = clearCurrentCell;
window.openEditPublishedRemarkModal = openEditPublishedRemarkModal;
window.closeEditPublishedRemarkModal = closeEditPublishedRemarkModal;
window.confirmApplyPublishedCellUpdate = confirmApplyPublishedCellUpdate;
window.getPermanentStaffList = getPermanentStaffList;
window.getContractStaffList = getContractStaffList;
window.openBatchMonthModal = openBatchMonthModal;
window.executeBatchMonthGenerate = executeBatchMonthGenerate;

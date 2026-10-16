// ================= ⭐ MASTER SCHEDULE ENGINE & FULL INTERACTIVE CONTROLLER (100% REAL SUPABASE ONLY) =================

// 0. FUNCTION ກວດສອບຊ່ວງວັນພັກພິເສດ
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

// 0.1 HELPER ປຽບທຽບຊື່ແບບ STRICT EXACT MATCH
function isSchedNameMatch(a, b) {
    if (!a || !b) return false;
    var clean = function(s) {
        return s.toString().trim().toLowerCase()
            .replace(/^(ທ້າວ|ນາງ|ທ\.|ນ\.)\s*/, '')
            .replace(/\s*ຫົວໜ້າກະ|\s*ຫົວໜ້າ/g, '')
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

// 0.22 HELPER ສຸ່ມສັບປ່ຽນລຳດັບ (FISHER-YATES SHUFFLE)
function shuffleArray(array) {
    var arr = array.slice();
    for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
    return arr;
}

// 0.25 ດຶງລາຍຊື່ 2 ກຸ່ມຕົວຈິງຈາກ DATABASE
function getPermanentStaffList() {
    var all = (window.users || []).filter(function(u) { return u && u.role !== 'SUPER_ADMIN'; });
    var canonicalNames = [
        'ແສງດາວ', 'ພອນສະຫວັນ', 'ບຸນປະເສີດ', 'ພັນນິກອນ',
        'ສົນທະຍາ', 'ນິກກີ້', 'ໜູຮັກ', 'ແພັກເກີ້',
        'ເອກສະຫວ່າງ', 'ໂທນິກ', 'ບຸນຮັກ', 'ປະສົງສິນ',
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
    var canonicalContract = [
        'ໄຊຍະສິດ', 'ລິດຕະສອນ', 'ທອງສະຫວັນ', 'ໄຊຍະພອນ',
        'ແກ້ວວິໄລ', 'ຈິດສະດາ', 'ນະລົງສັກ'
    ];

    var matched = [];
    canonicalContract.forEach(function(cn) {
        var found = all.find(function(u) { return u && u.nameLao && isSchedNameMatch(u.nameLao, cn); });
        matched.push(found ? found.nameLao : cn);
    });
    return matched;
}

// 0.28 ສ້າງໂຄງສ້າງຕາຕະລາງວ່າງເປົ່າ (ສຳລັບ RESET)
function createBlankMonthData(year, month) {
    var daysCount = new Date(year, month, 0).getDate();
    var data = {};
    for (var i = 1; i <= daysCount; i++) {
        var dayNum = i < 10 ? '0' + i : '' + i;
        var mNum = month < 10 ? '0' + month : '' + month;
        var dStr = year + '-' + mNum + '-' + dayNum;
        var dateObj = new Date(Date.UTC(year, month - 1, i));
        var dayOfWeek = dateObj.getUTCDay();
        var isWeekend = (dayOfWeek === 6 || dayOfWeek === 0 || isDateInHolidayRange(dStr));

        data[dStr] = {
            isWeekend: isWeekend,
            isG7Team: false,
            shift1: [],
            shift2: [],
            shift3: []
        };
    }
    return data;
}

// 0.29 ENGINE ບັງຄັບລັອກກະປະຈຳ
function applyFixedShiftsToDayData(dayData) {
    if (!dayData || !window.fixedShiftsConfig || window.fixedShiftsConfig.length === 0) return;
    
    window.fixedShiftsConfig.forEach(function(cfg) {
        var name = cfg.nameLao;
        var targetShift = cfg.fixedShift;
        if (!name || !targetShift) return;

        var currentShift = null;
        var currentIdx = -1;
        ['shift1', 'shift2', 'shift3'].forEach(function(sKey) {
            var arr = dayData[sKey] || [];
            for (var i = 0; i < arr.length; i++) {
                if (isSchedNameMatch(arr[i], name)) {
                    currentShift = sKey;
                    currentIdx = i;
                }
            }
        });

        if (currentShift && currentShift !== targetShift) {
            dayData[currentShift].splice(currentIdx, 1);
            if (!dayData[targetShift]) dayData[targetShift] = [];
            dayData[targetShift].push(name);
        }
    });
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

// ⭐ 0.35 ດຶງຂໍ້ມູນ SCHEDULE_SHEETS ຈາກ SUPABASE CLOUD (ດຶງສະເພາະທີ່ມີຕົວຈິງໃນ Cloud)
async function fetchScheduleSheetsFromCloud() {
    if (!window.supabaseClient) return false;
    try {
        var res = await window.supabaseClient.from('schedule_sheets').select('*');
        if (!res.error && res.data) {
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

            // ຈັດລຽງເດືອນຫຼ້າສຸດຂຶ້ນກ່ອນ
            window.scheduleSheets.sort(function(a, b) {
                return String(b.monthKey).localeCompare(String(a.monthKey));
            });

            if (window.scheduleSheets.length > 0) {
                if (!window.activeSheetId || !window.scheduleSheets.some(function(s) { return String(s.id) === String(window.activeSheetId); })) {
                    window.activeSheetId = window.scheduleSheets[0].id;
                }
            } else {
                window.activeSheetId = null;
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

// ⭐ 0.4 FUNCTION ດຶງ SHEET ປັດຈຸບັນ (❌ ຕັດການສ້າງ Sheet ຈຳລອງ ແລະ ຕັດການແອບ Sync ອອກ 100%)
function getActiveSheet() {
    var sheets = window.scheduleSheets || [];
    if (sheets.length === 0) {
        try {
            var cached = localStorage.getItem('ot_schedule_sheets') || localStorage.getItem('ot_schedules_sheets');
            if (cached) sheets = JSON.parse(cached) || [];
            window.scheduleSheets = sheets;
        } catch(e) {}
    }

    // ❌ ຖ້າບໍ່ມີ Sheet ໃນ Supabase: ຈະບໍ່ແອບສ້າງ defaultSheet ຂຶ້ນ Cloud ເອງເດັດຂາດ!
    if (sheets.length === 0) {
        window.activeSheetId = null;
        return null;
    }

    var select = document.getElementById('scheduleSheetSelect');
    var targetId = (select && select.value) ? select.value : window.activeSheetId;
    var found = null;

    if (targetId) {
        found = sheets.find(function(s) { return s && String(s.id) === String(targetId); });
    }
    if (!found && window.activeSheetId) {
        found = sheets.find(function(s) { return s && String(s.id) === String(window.activeSheetId); });
    }
    if (!found) {
        found = sheets[0];
    }

    window.activeSheetId = found ? found.id : null;
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

// 1. ສູດຄຳນວນອາທິດ
function getMondayBasedWeekIndex(dateObj) {
    var epoch = Date.UTC(2026, 0, 5);
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

// 2. ສູດທີມຫຼັກ 17 ຄົນ: CONTINUOUS WEEKLY ZIGZAG
function generate17PersonLeadersAndStaffZigzag(year, month, staffList, isReshuffle) {
    var daysCount = new Date(year, month, 0).getDate();
    var data = {};

    var listToUse = (staffList && staffList.length >= 17) ? staffList.slice(0, 17) : getPermanentStaffList();

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

    var regularStaff = listToUse.filter(function(n) { return !leaderNames.includes(n); });
    var numRegular = 13;

    var randomStaffShiftOffset = 0;
    var randomLeaderShiftOffset = 0;
    if (isReshuffle) {
        leaderNames = shuffleArray(leaderNames);
        regularStaff = shuffleArray(regularStaff);
        randomStaffShiftOffset = Math.floor(Math.random() * numRegular);
        randomLeaderShiftOffset = Math.floor(Math.random() * 4);
    }

    for (var i = 1; i <= daysCount; i++) {
        var dayNum = i < 10 ? '0' + i : '' + i;
        var mNum = month < 10 ? '0' + month : '' + month;
        var dStr = year + '-' + mNum + '-' + dayNum;
        var dateObj = new Date(Date.UTC(year, month - 1, i));
        var dayOfWeek = dateObj.getUTCDay();
        var isWeekend = (dayOfWeek === 6 || dayOfWeek === 0 || isDateInHolidayRange(dStr));

        if (isWeekend) {
            var gWeekend = getGlobalWeekendDayIndex(dateObj);
            var isSunday = (dayOfWeek === 0);

            var wLeaderSat = leaderNames[(gWeekend + randomLeaderShiftOffset) % 4];
            var wLeaderSun = leaderNames[(gWeekend + randomLeaderShiftOffset + 1) % 4];

            var wStaff = [];
            for (var k = 0; k < 5; k++) {
                wStaff.push(regularStaff[(gWeekend * 5 + k + randomStaffShiftOffset) % numRegular]);
            }

            var s1 = [];
            var s2 = [];
            var s3 = [];

            if (isSunday) {
                s1 = ['', wStaff[0], ''];
                s2 = [wLeaderSun, wStaff[1], wStaff[2]];
                s3 = [leaderNames[(gWeekend + randomLeaderShiftOffset) % 4], wStaff[3], wStaff[4]];
            } else {
                s1 = ['', wStaff[0], ''];
                s2 = [wLeaderSat, wStaff[1], wStaff[2]];
                s3 = [leaderNames[(gWeekend + randomLeaderShiftOffset + 2) % 4], wStaff[3], wStaff[4]];
            }

            var dayObj = {
                isWeekend: true,
                isG7Team: false,
                shift1: s1,
                shift2: s2,
                shift3: s3
            };
            applyFixedShiftsToDayData(dayObj);
            data[dStr] = dayObj;
        } else {
            var W = getMondayBasedWeekIndex(dateObj);

            var l_1A = leaderNames[(W + randomLeaderShiftOffset + 0) % 4];
            var l_1B = leaderNames[(W + randomLeaderShiftOffset + 1) % 4];
            var l_S2 = leaderNames[(W + randomLeaderShiftOffset + 2) % 4];
            var l_S3 = leaderNames[(W + randomLeaderShiftOffset + 3) % 4];

            var staffOffset = (13000 - W * 3 + randomStaffShiftOffset) % numRegular;
            var rotated = [];
            for (var r = 0; r < numRegular; r++) {
                rotated.push(regularStaff[(r + staffOffset) % numRegular]);
            }

            var staff_S3 = rotated.slice(0, 3);
            var staff_S2 = rotated.slice(3, 8);
            var staff_S1 = rotated.slice(8, 13);

            var dayObj = {
                isWeekend: false,
                isG7Team: false,
                shift1: [l_1A, l_1B, ...staff_S1].filter(Boolean),
                shift2: [l_S2, ...staff_S2].filter(Boolean),
                shift3: [l_S3, ...staff_S3].filter(Boolean)
            };
            applyFixedShiftsToDayData(dayObj);
            data[dStr] = dayObj;
        }
    }

    return data;
}

// 3. ສູດກຸ່ມ 7 ຄົນ: Rolling 5/2 (ທີມສັນຍາ 7 ຄົນ)
function generate7PersonFlexZigzag(year, month, staffList, isReshuffle) {
    var daysCount = new Date(year, month, 0).getDate();
    var data = {};
    var N = 7;
    var epochDate = new Date(Date.UTC(2026, 0, 1));
    var list = (staffList && staffList.length === 7) ? staffList : getContractStaffList();

    var randomOffset = 0;
    if (isReshuffle) {
        list = shuffleArray(list);
        randomOffset = Math.floor(Math.random() * N);
    }

    for (var i = 1; i <= daysCount; i++) {
        var dayNum = i < 10 ? '0' + i : '' + i;
        var mNum = month < 10 ? '0' + month : '' + month;
        var dStr = year + '-' + mNum + '-' + dayNum;
        var currentDate = new Date(Date.UTC(year, month - 1, i));
        var totalDays = Math.floor((currentDate.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24)) + randomOffset;
        var dayOfWeek = currentDate.getUTCDay();
        var isWeekend = (dayOfWeek === 6 || dayOfWeek === 0 || isDateInHolidayRange(dStr));

        var dailySlots = [];
        for (var p = 0; p < N; p++) {
            var assignedSlot = (p + totalDays) % N;
            dailySlots[assignedSlot] = list[p];
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

        var dayObj = {
            isWeekend: isWeekend,
            isG7Team: true,
            shift1: s1.filter(Boolean),
            shift2: s2.filter(Boolean),
            shift3: s3.filter(Boolean)
        };
        applyFixedShiftsToDayData(dayObj);
        data[dStr] = dayObj;
    }
    return data;
}

function generateMonthDataZigzag(year, month, targetGroupMembers, isReshuffle) {
    var staffList = [];
    if (targetGroupMembers && targetGroupMembers.length > 0) {
        staffList = [...targetGroupMembers];
    } else {
        staffList = getPermanentStaffList();
    }

    if (staffList.length === 7) {
        return generate7PersonFlexZigzag(year, month, staffList, Boolean(isReshuffle));
    } else {
        return generate17PersonLeadersAndStaffZigzag(year, month, staffList, Boolean(isReshuffle));
    }
}

// 4. MODAL ສຸ່ມກຸ່ມ
function openRandomGroupSelectModal() {
    var select = document.getElementById('randomSelectedGroupId');
    if (!select) return;
    select.innerHTML = '';
    
    var optMain = document.createElement('option');
    optMain.value = 'GRP_MAIN_17';
    optMain.innerText = 'ກຸ່ມທີມວິຊາການສົມບູນ (17 ຄົນ - Weekly Zigzag)';
    select.appendChild(optMain);

    var optContract = document.createElement('option');
    optContract.value = 'GRP_CONTRACT_7';
    optContract.innerText = 'ກຸ່ມທີມວິຊາການສັນຍາ (7 ຄົນ - Rolling 5/2)';
    select.appendChild(optContract);

    (window.employeeGroups || []).forEach(function(grp) {
        if (grp && grp.id !== 'GRP_MAIN_17' && grp.id !== 'GRP_CONTRACT_7') {
            var opt = document.createElement('option');
            opt.value = grp.id;
            opt.innerText = grp.name + ' (' + (grp.members || []).length + ' ຄົນ)';
            select.appendChild(opt);
        }
    });

    document.getElementById('randomGroupSelectModal')?.classList.remove('hidden');
}

// 4.1 EXECUTE RANDOM
async function executeGroupRandomSchedule() {
    var sheet = getActiveSheet();
    if (!sheet) {
        showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາສ້າງຕາຕະລາງໃໝ່ກ່ອນ', 'warning');
        return;
    }

    var [year, month] = (sheet.monthKey || '2026-10').split('-').map(Number);
    var selectedGrpId = document.getElementById('randomSelectedGroupId')?.value || 'GRP_MAIN_17';
    
    var members = null;
    if (selectedGrpId === 'GRP_MAIN_17') {
        members = getPermanentStaffList();
        sheet.isG7GroupSheet = false;
    } else if (selectedGrpId === 'GRP_CONTRACT_7') {
        members = getContractStaffList();
        sheet.isG7GroupSheet = true;
    } else {
        var found = (window.employeeGroups || []).find(function(g) { return g && g.id === selectedGrpId; });
        if (found && found.members) {
            members = found.members;
            sheet.isG7GroupSheet = (members.length === 7);
        }
    }

    window._shuffleRoundCounter = (window._shuffleRoundCounter || 0) + 1;
    sheet.data = generateMonthDataZigzag(year, month, members, true);
    
    try {
        localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
        localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
    } catch(e) {}

    await renderScheduleTable({ skipSwapSync: true });
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    document.getElementById('randomGroupSelectModal')?.classList.add('hidden');
    
    showToast('ສຸ່ມໃໝ່ສຳເລັດ!', 'ສຸ່ມປ່ຽນຮອບ Zigzag ໃໝ່ຮຽບຮ້ອຍ (ຮອບທີ ' + window._shuffleRoundCounter + ')!', 'success');
    await syncScheduleToSupabase(sheet);
}

// 5. BATCH MONTH MODAL
function openBatchMonthModal() {
    var select = document.getElementById('batchTargetGroupSelect');
    if (select) {
        select.innerHTML = '<option value="GRP_MAIN_17">ກຸ່ມທີມວິຊາການສົມບູນ (17 ຄົນ - Weekly Zigzag)</option>' +
                           '<option value="GRP_CONTRACT_7">ກຸ່ມທີມວິຊາການສັນຍາ (7 ຄົນ - Rolling 5/2)</option>';
        (window.employeeGroups || []).forEach(function(grp) {
            if (grp && grp.id !== 'GRP_MAIN_17' && grp.id !== 'GRP_CONTRACT_7') {
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

    var isContract = (selectedGrpId === 'GRP_CONTRACT_7');
    var selectedMembers = isContract ? getContractStaffList() : getPermanentStaffList();
    var groupNameTag = isContract ? ' (ສັນຍາ)' : ' (ສົມບູນ)';

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
        var sheetId = 'sheet-' + monthKey + '-' + (isContract ? 'contract' : 'main');
        var title = 'ຕາຕະລາງປະຈຳການສຳລັບວິຊາການ' + (isContract ? 'ສັນຍາ' : 'ສົມບູນ') + 'ປະຈຳເດືອນ ' + mStr + '/' + y;

        var generatedData = generateMonthDataZigzag(y, m, selectedMembers, false);

        var existingIdx = window.scheduleSheets.findIndex(function(s) { return s && s.monthKey === monthKey && s.title && s.title.includes(groupNameTag); });
        var currentSheetObj = null;
        if (existingIdx !== -1) {
            window.scheduleSheets[existingIdx].data = generatedData;
            window.scheduleSheets[existingIdx].title = title;
            window.scheduleSheets[existingIdx].notes = currentNotes;
            window.scheduleSheets[existingIdx].isG7GroupSheet = isContract;
            currentSheetObj = window.scheduleSheets[existingIdx];
        } else {
            currentSheetObj = {
                id: sheetId,
                monthKey: monthKey,
                title: title,
                notes: currentNotes,
                status: 'DRAFT',
                isG7GroupSheet: isContract,
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

// 6. FIXED SHIFT MODAL FUNCTIONS
function openFixedShiftModal() {
    var userSelect = document.getElementById('fixedShiftUserSelect');
    if (userSelect) {
        userSelect.innerHTML = '';
        (window.users || []).filter(function(u) { return u && u.role !== 'SUPER_ADMIN'; }).forEach(function(u) {
            userSelect.innerHTML += '<option value="' + u.nameLao + '">' + u.nameLao + ' (' + u.fullName + ')</option>';
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
        container.innerHTML = '<p class="text-slate-400 text-xs italic py-2">ຍັງບໍ່ມີພະນັກງານທີ່ຖືກລັອກກະປະຈຳ</p>';
        return;
    }
    window.fixedShiftsConfig.forEach(function(f, idx) {
        var shiftLabel = f.fixedShift === 'shift1' ? 'ກະ 1 (08:00)' : (f.fixedShift === 'shift2' ? 'ກະ 2 (12:00)' : 'ກະ 3 (20:00)');
        container.innerHTML += '<div class="p-2.5 bg-slate-50 border rounded-xl flex justify-between items-center text-xs font-lao">' +
            '<div>' +
                '<span class="font-bold text-slate-800">' + f.nameLao + '</span>' +
                '<span class="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">ລັອກ ' + shiftLabel + '</span>' +
            '</div>' +
            '<button type="button" onclick="removeFixedShift(' + idx + ')" class="text-brand-red hover:underline font-bold text-xs cursor-pointer">ລຶບ</button>' +
        '</div>';
    });
}

async function handleAddFixedShift() {
    var name = document.getElementById('fixedShiftUserSelect')?.value;
    var shift = document.getElementById('fixedShiftSlotSelect')?.value;
    if (!window.fixedShiftsConfig) window.fixedShiftsConfig = [];
    window.fixedShiftsConfig = window.fixedShiftsConfig.filter(function(f) { return f.nameLao !== name; });
    window.fixedShiftsConfig.push({ nameLao: name, fixedShift: shift });
    
    var sheet = getActiveSheet();
    if (sheet && sheet.data) {
        Object.keys(sheet.data).filter(function(k) { return !k.startsWith('_'); }).forEach(function(dStr) {
            applyFixedShiftsToDayData(sheet.data[dStr]);
        });
        await renderScheduleTable({ skipSwapSync: true });
        await syncScheduleToSupabase(sheet);
    }

    if (typeof saveAll === 'function') await saveAll();
    renderActiveFixedShiftsList();
    showToast('ສຳເລັດ', 'ລັອກ "' + name + '" ໄວ້ ' + shift + ' ຮຽບຮ້ອຍ!', 'success');
}

async function removeFixedShift(idx) {
    if (window.fixedShiftsConfig) window.fixedShiftsConfig.splice(idx, 1);
    if (typeof saveAll === 'function') await saveAll();
    renderActiveFixedShiftsList();
    showToast('ສຳເລັດ', 'ຍົກເລີກການລັອກກະແລ້ວ', 'success');
}

// 7. FAIRNESS SUMMARY MODAL FUNCTIONS
function openFairnessSummaryModal() {
    var sheet = getActiveSheet();
    var subEl = document.getElementById('fairnessModalSub');
    if (subEl && sheet) {
        subEl.innerText = 'ກວດສອບຄວາມສົມດຸນຂອງ ' + (sheet.title || sheet.data?._meta?.title || '');
    }

    var select = document.getElementById('fairnessGroupFilterSelect');
    if (select) {
        select.innerHTML = '<option value="ALL">ພະນັກງານທັງໝົດ (All Staff)</option>';
        (window.employeeGroups || []).forEach(function(grp) {
            if (grp) {
                var isG7 = (grp.members || []).length === 7;
                var tag = isG7 ? ' 🔹 [ກຸ່ມ 7 ຄົນ - Rolling 5/2]' : '';
                select.innerHTML += '<option value="' + grp.id + '">' + grp.name + ' (' + (grp.members || []).length + ' ຄົນ)' + tag + '</option>';
            }
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
    var schedData = (sheet && sheet.data) ? sheet.data : {};
    var dates = Object.keys(schedData).filter(function(k) { return !k.startsWith('_'); });
    var filterGroupId = document.getElementById('fairnessGroupFilterSelect')?.value || 'ALL';

    var targetUsers = (window.users || []).filter(function(u) { return u && u.role !== 'SUPER_ADMIN'; });

    if (filterGroupId !== 'ALL') {
        var grp = (window.employeeGroups || []).find(function(g) { return g && g.id === filterGroupId; });
        if (grp && grp.members) {
            targetUsers = targetUsers.filter(function(u) { return grp.members.includes(u.nameLao); });
        }
    }

    var tbody = document.getElementById('fairnessSummaryTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (targetUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="p-4 text-center text-slate-400 font-lao">ບໍ່ພົບຂໍ້ມູນພະນັກງານ</td></tr>';
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

        tbody.innerHTML += '<tr class="hover:bg-slate-50 transition border-b border-slate-100 text-slate-800 font-lao">' +
            '<td class="p-3 text-slate-400 font-mono">' + (idx + 1) + '</td>' +
            '<td class="p-3 font-bold flex items-center gap-1.5">' +
                u.nameLao + ' <span class="text-[10px] font-normal text-slate-400">(' + u.fullName + ')</span>' +
                (u.isLeader ? '<span class="text-[9px] bg-brand-red text-white px-1.5 py-0.5 rounded font-bold">ຫົວໜ້າ</span>' : '') +
            '</td>' +
            '<td class="p-3 text-center font-semibold text-slate-700">' + s1 + '</td>' +
            '<td class="p-3 text-center font-semibold text-purple-700">' + s2 + '</td>' +
            '<td class="p-3 text-center font-bold text-brand-red">' + s3 + '</td>' +
            '<td class="p-3 text-center font-bold text-emerald-600">' + totalOff + ' ວັນ</td>' +
            '<td class="p-3 text-right font-black text-slate-900">' + total + ' ກະ</td>' +
        '</tr>';
    });
}

// 8. HOLIDAY MODAL FUNCTIONS
function openHolidayModal() { 
    document.getElementById('holidayModal')?.classList.remove('hidden'); 
}

async function handleSaveHolidayRange() {
    var title = document.getElementById('holidayTitleInput')?.value.trim();
    var start = document.getElementById('holidayStartDateInput')?.value;
    var end = document.getElementById('holidayEndDateInput')?.value;
    if (!title || !start || !end) return;
    
    var newHol = { title: title, start_date: start, end_date: end };
    if (!window.specialHolidayRanges) window.specialHolidayRanges = [];
    window.specialHolidayRanges.push(newHol);

    document.getElementById('holidayModal')?.classList.add('hidden');
    await renderScheduleTable({ skipSwapSync: true });
    showToast('ສຳເລັດ', 'ບັນທຶກວັນພັກພິເສດແລ້ວ', 'success');

    try {
        if (typeof saveAll === 'function') await saveAll();
        if (window.supabaseClient) {
            await window.supabaseClient.from('special_holidays').insert([newHol]);
        }
    } catch (err) {}
}

// ⭐ 9. RENDER ຕາຕະລາງໃຫຍ່ (ດຶງສະເພາະ Supabase ຕົວຈິງ 100%)
async function renderScheduleTable(options) {
    var opts = options || {};
    
    var sheet = getActiveSheet();

    // ❌ ຖ້າບໍ່ມີຕາຕະລາງໃນ Supabase: ບໍ່ສ້າງຈຳລອງ, ແຕ່ໃຫ້ຂຶ້ນຂໍ້ຄວາມແຈ້ງເຕືອນສະອາດຕາ
    if (!sheet) {
        renderSheetDropdown();
        var tbody = document.getElementById('scheduleTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-10 text-center text-slate-400 font-lao text-sm">' +
                '<span class="material-symbols-outlined text-4xl block mb-2 text-slate-300">calendar_today</span>' +
                'ບໍ່ພົບຕາຕະລາງໃນຖານຂໍ້ມູນ Supabase<br>' +
                '<span class="text-xs text-slate-400 mt-1 block">ກະລຸນາກົດປຸ່ມ "+ ສ້າງຕາຕະລາງໃໝ່" ເພື່ອເລີ່ມຕົ້ນ</span>' +
                '</td></tr>';
        }
        var titleEl = document.getElementById('scheduleTableTitle');
        if (titleEl) titleEl.innerText = 'ບໍ່ມີຕາຕະລາງ';
        return;
    }

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
                    '<td colspan="2" style="width: 140px; min-width: 140px;" class="p-1 text-center font-bold text-xs">ວັນພັກ</td>' +
                    '<td style="width: 33%;" class="p-1 text-center font-bold text-xs">08:00 - 13:30</td>' +
                    '<td style="width: 31%;" class="p-1 text-center font-bold text-xs">13:30 - 19:00</td>' +
                    '<td style="width: 22%;" class="p-1 text-center font-bold text-xs">19:00 - 08:00</td>' +
                '</tr>';
            } else {
                tbody.innerHTML += '<tr class="bg-slate-100 font-bold border-t-2 border-b border-black text-slate-800">' +
                    '<th style="width: 90px; min-width: 90px;" class="p-1 text-center font-bold text-xs">ວັນທີ</th>' +
                    '<th style="width: 50px; min-width: 50px;" class="p-1 text-center font-bold text-xs">ວັນ</th>' +
                    '<th style="width: 33%;" class="p-1 font-bold text-xs">08:00 - 16:00</th>' +
                    '<th style="width: 31%;" class="p-1 font-bold text-xs">12:00 - 20:00</th>' +
                    '<th style="width: 22%;" class="p-1 font-bold text-xs">20:00 - 08:00</th>' +
                '</tr>';
            }
        }
        prevHeaderType = currentHeaderType;

        var s1Rows = isWeekendOrHol ? 1 : 2;
        var s1Cols = isWeekendOrHol ? 3 : 4;

        var s2Rows = isWeekendOrHol ? 1 : 2;
        var s2Cols = isWeekendOrHol ? 3 : 3;

        var s3Rows = isWeekendOrHol ? 1 : 2;
        var s3Cols = isWeekendOrHol ? 3 : 2;

        tbody.innerHTML += '<tr class="' + (isWeekendOrHol ? 'bg-slate-50' : 'bg-white') + '">' +
            '<td class="font-bold text-center text-xs whitespace-nowrap px-1" style="width: 90px; min-width: 90px;">' + i + '/' + mNum + '/' + year + '</td>' +
            '<td class="font-bold text-center text-xs ' + (isWeekendOrHol ? 'text-brand-red' : '') + '" style="width: 50px; min-width: 50px;">' + dayOfWeek + '</td>' +
            '<td class="p-0">' + renderPixelExcelGrid(dStr, 'shift1', dayData.shift1 || [], s1Rows, s1Cols, isAdmin, sheet.id) + '</td>' +
            '<td class="p-0">' + renderPixelExcelGrid(dStr, 'shift2', dayData.shift2 || [], s2Rows, s2Cols, isAdmin, sheet.id) + '</td>' +
            '<td class="p-0">' + renderPixelExcelGrid(dStr, 'shift3', dayData.shift3 || [], s3Rows, s3Cols, isAdmin, sheet.id) + '</td>' +
        '</tr>';
    }
}

// 10. RENDER PIXEL EXCEL GRID
function handleCellDragStart(event, date, shift, index, name) {
    if (!name || name === '(ວ່າງ)') {
        event.preventDefault();
        return;
    }
    var dragData = {
        type: 'cell',
        date: date,
        shift: shift,
        index: parseInt(index, 10),
        name: name
    };
    window.draggedCellData = dragData;
    window.draggedStaffName = name;

    if (event.dataTransfer) {
        event.dataTransfer.setData('text/plain', name);
        event.dataTransfer.setData('application/json', JSON.stringify(dragData));
        event.dataTransfer.effectAllowed = 'move';
    }
    event.currentTarget.classList.add('opacity-40', 'scale-95');
}

function handleCellDragEnd(event) {
    event.currentTarget.classList.remove('opacity-40', 'scale-95');
    setTimeout(function() {
        window.draggedCellData = null;
        window.draggedStaffName = null;
    }, 100);
}

function handleCellDragOver(event) {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    event.currentTarget.classList.add('bg-amber-100/90', 'border-amber-500', 'ring-2', 'ring-amber-400');
}

function handleCellDragLeave(event) {
    event.currentTarget.classList.remove('bg-amber-100/90', 'border-amber-500', 'ring-2', 'ring-amber-400');
}

async function handleCellDrop(event, targetDate, targetShift, targetIndex) {
    event.preventDefault();
    event.currentTarget.classList.remove('bg-amber-100/90', 'border-amber-500', 'ring-2', 'ring-amber-400');

    if (!window.currentUser || window.currentUser.role !== 'SUPER_ADMIN') return;

    var sheet = getActiveSheet();
    if (!sheet) return;

    var sourceCell = window.draggedCellData;
    var droppedName = window.draggedStaffName || (event.dataTransfer ? event.dataTransfer.getData('text/plain') : null);

    if (!droppedName) return;

    targetIndex = parseInt(targetIndex, 10);

    if (!sheet.data) sheet.data = {};
    if (!sheet.data[targetDate]) sheet.data[targetDate] = { shift1: [], shift2: [], shift3: [] };
    if (!sheet.data[targetDate][targetShift]) sheet.data[targetDate][targetShift] = [];

    var targetList = sheet.data[targetDate][targetShift];
    while (targetList.length <= targetIndex) targetList.push('');
    var targetName = targetList[targetIndex] || '';

    // SWAP ລະຫວ່າງ 2 ຊ່ອງໃນຕາຕະລາງ
    if (sourceCell && sourceCell.type === 'cell') {
        if (sourceCell.date === targetDate && sourceCell.shift === targetShift && sourceCell.index === targetIndex) {
            return;
        }

        var srcDate = sourceCell.date;
        var srcShift = sourceCell.shift;
        var srcIdx = sourceCell.index;

        if (!sheet.data[srcDate]) sheet.data[srcDate] = { shift1: [], shift2: [], shift3: [] };
        if (!sheet.data[srcDate][srcShift]) sheet.data[srcDate][srcShift] = [];
        var srcList = sheet.data[srcDate][srcShift];
        while (srcList.length <= srcIdx) srcList.push('');

        srcList[srcIdx] = targetName;
        targetList[targetIndex] = sourceCell.name;

        if (sheet.status === 'PUBLISHED') {
            if (!window.scheduleAuditLogs) window.scheduleAuditLogs = [];
            window.scheduleAuditLogs.unshift({
                id: Date.now(),
                sheetId: sheet.id,
                sheetTitle: sheet.title,
                date: targetDate,
                shift: targetShift,
                oldName: targetName || '(ວ່າງ)',
                newName: sourceCell.name,
                reason: targetName ? ('ສັບປ່ຽນຕຳແໜ່ງກັບ ' + targetName) : 'ຍ້າຍກະປະຈຳການ',
                adminName: window.currentUser?.fullName || 'Admin',
                timestamp: new Date().toLocaleString('lo-LA')
            });
        }

        try {
            localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
            localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
        } catch(e) {}

        await renderScheduleTable({ skipSwapSync: true });
        if (typeof window.renderDashboard === 'function') window.renderDashboard();

        var msg = targetName 
            ? ('ສັບປ່ຽນຕຳແໜ່ງ: "' + sourceCell.name + '" ⇄ "' + targetName + '" ສຳເລັດ!')
            : ('ຍ້າຍ "' + sourceCell.name + '" ມາກະໃໝ່ສຳເລັດ!');
        showToast('ສັບປ່ຽນສຳເລັດ', msg, 'success');

        await syncScheduleToSupabase(sheet);
        return;
    }

    // ລາກຈາກ SIDEBAR
    if (droppedName) {
        if (sheet.status === 'PUBLISHED' && targetName !== droppedName) {
            openEditPublishedRemarkModal({
                date: targetDate,
                shift: targetShift,
                index: targetIndex,
                currentName: targetName,
                newName: droppedName
            });
            return;
        }
        await applyCellUpdate(sheet, targetDate, targetShift, targetIndex, droppedName);
    }
}

function renderPixelExcelGrid(date, shift, list, rows, cols, isAdmin, sheetId) {
    cols = Math.max(cols, 1); rows = Math.max(rows, 1);
    var html = '<div class="grid w-full h-full" style="grid-template-columns: repeat(' + cols + ', minmax(0, 1fr)); grid-template-rows: repeat(' + rows + ', minmax(0, 1fr)); height: 48px;">';
    var total = rows * cols;

    for (var idx = 0; idx < total; idx++) {
        var name = list[idx] || '';
        var isLeader = (window.users || []).find(function(u) { return u && u.nameLao && isSchedNameMatch(u.nameLao, name) && u.isLeader; });
        var cleanName = (name || '').replace(/'/g, "\\'");
        var clickHandler = isAdmin ? 'onclick="openCellModal(\'' + date + '\', \'' + shift + '\', ' + idx + ', \'' + cleanName + '\')"' : '';

        var dragAttrs = (isAdmin && name) ? 
            ' draggable="true" ondragstart="handleCellDragStart(event, \'' + date + '\', \'' + shift + '\', ' + idx + ', \'' + cleanName + '\')" ondragend="handleCellDragEnd(event)"' : '';
        
        var dropAttrs = isAdmin ? 
            ' ondragover="handleCellDragOver(event)" ondragleave="handleCellDragLeave(event)" ondrop="handleCellDrop(event, \'' + date + '\', \'' + shift + '\', ' + idx + ')"' : '';

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
            badgesHtml += '<span class="w-1.5 h-1.5 rounded-full bg-brand-red ml-1 shrink-0 inline-block pointer-events-

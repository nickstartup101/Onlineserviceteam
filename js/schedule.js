// ================= ⭐ MASTER SCHEDULE ENGINE & CONTINUOUS WEEKLY ZIGZAG (100% SUPABASE ONLY - NO AUTO MOCK) =================

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

// 0.1 HELPER ປຽບທຽບຊື່ແບບ STRICT EXACT MATCH (ຕັດ ທ້າວ/ນາງ ແລະ ຕັດ ຫົວໜ້າກະ ອອກ)
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

// ⭐ 0.25 ດຶງລາຍຊື່ 2 ກຸ່ມຕົວຈິງຈາກ DATABASE (Supabase Profiles)
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

// ⭐ 0.28 ສ້າງໂຄງສ້າງຕາຕະລາງວ່າງເປົ່າ (ສຳລັບປຸ່ມ RESET ລ້າງຊື່ທຸກຄົນອອກ 100%)
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

// ⭐ 0.29 ENGINE ບັງຄັບລັອກກະປະຈຳ (FIX SHIFT ENGINE)
function applyFixedShiftsToDayData(dayData) {
    if (!dayData || !window.fixedShiftsConfig || window.fixedShiftsConfig.length === 0) return;
    
    window.fixedShiftsConfig.forEach(function(cfg) {
        var name = cfg.nameLao;
        var targetShift = cfg.fixedShift; // 'shift1', 'shift2', 'shift3'
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

// ⭐ 0.35 ດຶງຂໍ້ມູນ SCHEDULE_SHEETS ຈາກ SUPABASE CLOUD 100% (ບໍ່ມີການສ້າງຕາຕະລາງຈຳລອງເອງ)
async function fetchScheduleSheetsFromCloud() {
    if (!window.supabaseClient) return false;
    try {
        var res = await window.supabaseClient.from('schedule_sheets').select('*');
        if (!res.error && Array.isArray(res.data)) {
            if (res.data.length > 0) {
                window.scheduleSheets = res.data.map(function(s) {
                    var rawData = s.data || {};
                    if (typeof rawData === 'string') {
                        try { rawData = JSON.parse(rawData); } catch(e) { rawData = {}; }
                    }
                    var mKey = s.monthKey || s.month_key || '2026-10';
                    return {
                        id: String(s.id),
                        monthKey: String(mKey),
                        title: s.title || rawData?._meta?.title || ('ຕາຕະລາງປະຈຳການ ' + mKey),
                        notes: s.notes || rawData?._meta?.notes || window.defaultNotesTemplate || '',
                        status: s.status || 'PUBLISHED',
                        isG7GroupSheet: Boolean(s.is_g7 || s.isG7GroupSheet || (s.title && s.title.includes('ສັນຍາ'))),
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
            } else {
                // ✅ ຖ້າໃນ Supabase ບໍ່ມີຕາຕະລາງເລີຍ ໃຫ້ລ້າງຄ່າເກົ່າອອກ ບໍ່ສ້າງຕາຕະລາງຈຳລອງເດັດຂາດ!
                window.scheduleSheets = [];
                window.activeSheetId = null;
                try {
                    localStorage.removeItem('ot_schedule_sheets');
                    localStorage.removeItem('ot_schedules_sheets');
                } catch(e) {}
                return false;
            }
        }
    } catch(err) {
        console.warn("Could not fetch schedule sheets from cloud:", err);
    }
    return false;
}

// ⭐ 0.4 FUNCTION ດຶງ SHEET ປັດຈຸບັນ (ຕັດການຈຳລອງຕາຕະລາງອອກ 100% - ດຶງສະເພາະຈາກ Supabase)
function getActiveSheet() {
    if (!window.scheduleSheets || !Array.isArray(window.scheduleSheets) || window.scheduleSheets.length === 0) {
        return null;
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

    if (found) {
        window.activeSheetId = found.id;
        if (!found.data) found.data = {};
    }

    return found || null;
}
window.getActiveSheet = getActiveSheet;

// 0.5 SYNC ຕາຕະລາງຂຶ້ນ SUPABASE
async function syncScheduleToSupabase(sheet) {
    if (!window.supabaseClient || !sheet || !sheet.id) return false;

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

// 2. ສູດທີມຫຼັກ 17 ຄົນ: CONTINUOUS WEEKLY ZIGZAG (ໃຊ້ສະເພາະຕອນກົດປຸ່ມສ້າງ/ສຸ່ມຕາຕະລາງເທົ່ານັ້ນ)
function generate17PersonLeadersAndStaffZigzag(year, month, staffList) {
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

// 3. ສູດກຸ່ມ 7 ຄົນ: Rolling 5/2 (ໃຊ້ສະເພາະຕອນກົດປຸ່ມສ້າງ/ສຸ່ມຕາຕະລາງເທົ່ານັ້ນ)
function generate7PersonFlexZigzag(year, month, staffList) {
    var daysCount = new Date(year, month, 0).getDate();
    var data = {};
    var N = 7;
    var epochDate = new Date(Date.UTC(2026, 0, 1));
    var list = (staffList && staffList.length === 7) ? staffList : getContractStaffList();

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

async function executeGroupRandomSchedule() {
    var sheet = getActiveSheet();
    if (!sheet) {
        showToast('ແຈ້ງເຕືອນ', 'ບໍ່ພົບຕາຕະລາງທີ່ເລືອກ ກະລຸນາສ້າງ Sheet ກ່ອນ', 'error');
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
    var currentNotes = activeSheet?.notes || activeSheet?.data?._meta?.notes || window.defaultNotesTemplate || '';

    if (!window.scheduleSheets) window.scheduleSheets = [];

    for (var c = 0; c < count; c++) {
        var targetDate = new Date(startYear, startMonth - 1 + c, 1);
        var y = targetDate.getFullYear();
        var m = targetDate.getMonth() + 1;
        var mStr = m < 10 ? '0' + m : '' + m;
        var monthKey = y + '-' + mStr;
        var sheetId = 'sheet-' + monthKey + '-' + (isContract ? 'contract' : 'main');
        var title = 'ຕາຕະລາງປະຈຳການສຳລັບວິຊາການ' + (isContract ? 'ສັນຍາ' : 'ສົມບູນ') + 'ປະຈຳເດືອນ ' + mStr + '/' + y;

        var generatedData = generateMonthDataZigzag(y, m, selectedMembers);

        var existingIdx = window.scheduleSheets.findIndex(function(s) { return s && (s.id === sheetId || (s.monthKey === monthKey && s.title && s.title.includes(groupNameTag))); });
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

        if (c === 0) firstGeneratedSheetId = currentSheetObj.id;
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

// ⭐ 6. FIXED SHIFT MODAL FUNCTIONS
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
        container.innerHTML += '<div class="p-2.5 bg-slate-50 border rounded-xl flex justify-between items-center text-xs">' +
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
// ================= ⭐ ຟັງຊັນສ້າງຕາຕະລາງຕໍ່ເນື່ອງຈາກແມ່ແບບອາທິດທີ 1 (ZIGZAG FROM WEEK 1 TEMPLATE) =================
async function executeZigzagFromWeek1() {
    var sheet = getActiveSheet();
    if (!sheet || !sheet.data) {
        showToast('ແຈ້ງເຕືອນ', 'ບໍ່ພົບຕາຕະລາງທີ່ເລືອກ ກະລຸນາເລືອກ ຫຼື ສ້າງ Sheet ກ່ອນ', 'error');
        return;
    }

    var mKey = sheet.monthKey || sheet.month_key || '2026-10';
    var parts = mKey.split('-').map(Number);
    var year = parts[0] || 2026;
    var month = parts[1] || 10;
    var daysCount = new Date(year, month, 0).getDate();
    var mNum = month < 10 ? '0' + month : '' + month;

    // 1. ຊອກຫາມື້ວັນທຳມະດາ (ຈັນ-ສຸກ) ມື້ທຳອິດໃນອາທິດທີ 1 ທີ່ Admin ໄດ້ຈັດຊື່ໄວ້ແລ້ວ
    var templateDayData = null;
    var templateDateObj = null;

    for (var d = 1; d <= Math.min(10, daysCount); d++) {
        var dayNum = d < 10 ? '0' + d : '' + d;
        var dStr = year + '-' + mNum + '-' + dayNum;
        var dt = new Date(Date.UTC(year, month - 1, d));
        var dow = dt.getUTCDay();
        var isWknd = (dow === 6 || dow === 0 || isDateInHolidayRange(dStr));
        var curDay = sheet.data[dStr];

        if (!isWknd && curDay) {
            var countNames = (curDay.shift1 || []).filter(Boolean).length +
                             (curDay.shift2 || []).filter(Boolean).length +
                             (curDay.shift3 || []).filter(Boolean).length;
            if (countNames > 0) {
                templateDayData = curDay;
                templateDateObj = dt;
                break;
            }
        }
    }

    if (!templateDayData) {
        showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາໃສ່ລາຍຊື່ພະນັກງານໃນອາທິດທີ 1 (ວັນຈັນ-ສຸກ) ເປັນແມ່ແບບກ່ອນ!', 'warning');
        return;
    }

    var allUsers = window.users || [];
    var isUserLeader = function(name) {
        var u = allUsers.find(function(usr) { return usr && usr.nameLao && isSchedNameMatch(usr.nameLao, name); });
        return Boolean(u && u.isLeader);
    };

    var s1Clean = (templateDayData.shift1 || []).filter(Boolean);
    var s2Clean = (templateDayData.shift2 || []).filter(Boolean);
    var s3Clean = (templateDayData.shift3 || []).filter(Boolean);

    // ກວດສອບວ່າເປັນຕາຕະລາງກຸ່ມ 7 ຄົນ (ສັນຍາ) ຫຼື ກຸ່ມ 17 ຄົນ (ສົມບູນ)
    var totalTemplateStaff = s1Clean.length + s2Clean.length + s3Clean.length;
    var isContractSheet = Boolean(sheet.isG7GroupSheet || (sheet.title && sheet.title.includes('ສັນຍາ')) || totalTemplateStaff <= 7);

    if (isContractSheet) {
        // ກໍລະນີກຸ່ມ 7 ຄົນ: ດຶງລຳດັບຈາກອາທິດ 1 ມາລຽງຕໍ່ກັບລາຍຊື່ທີມສັນຍາ
        var base7 = getContractStaffList();
        var ordered7 = [];
        [...s1Clean, ...s2Clean, ...s3Clean].forEach(function(n) {
            if (!ordered7.some(function(x) { return isSchedNameMatch(x, n); })) ordered7.push(n);
        });
        base7.forEach(function(n) {
            if (!ordered7.some(function(x) { return isSchedNameMatch(x, n); })) ordered7.push(n);
        });
        sheet.data = generate7PersonFlexZigzag(year, month, ordered7.slice(0, 7));
    } else {
        // ກໍລະນີກຸ່ມ 17 ຄົນ (ສົມບູນ): ດຶງລຳດັບຫົວໜ້າກະ 4 ຄົນ ແລະ ພະນັກງານ 13 ຄົນຈາກອາທິດທີ 1 ທີ່ Admin ຈັດໄວ້ເອງ!
        var tLeaders = [];
        var addLeaderUnique = function(n) {
            if (n && !tLeaders.some(function(x) { return isSchedNameMatch(x, n); })) tLeaders.push(n);
        };

        // ດຶງຫົວໜ້າຈາກ ກະ 1 (2 ຄົນ), ກະ 2 (1 ຄົນ), ກະ 3 (1 ຄົນ) ຕາມແມ່ແບບອາທິດທີ 1
        s1Clean.filter(isUserLeader).forEach(addLeaderUnique);
        s2Clean.filter(isUserLeader).forEach(addLeaderUnique);
        s3Clean.filter(isUserLeader).forEach(addLeaderUnique);

        // ຖ້າຍັງບໍ່ຄົບ 4 ຄົນ ໃຫ້ດຶງຫົວໜ້າທີ່ເຫຼືອມາຕື່ມໃຫ້ຄົບ
        ['ແສງດາວ', 'ພອນສະຫວັນ', 'ບຸນປະເສີດ', 'ພັນນິກອນ'].forEach(addLeaderUnique);
        tLeaders = tLeaders.slice(0, 4);

        var isInLeaders = function(n) {
            return tLeaders.some(function(l) { return isSchedNameMatch(l, n); });
        };

        var s3Staff = s3Clean.filter(function(n) { return !isInLeaders(n); });
        var s2Staff = s2Clean.filter(function(n) { return !isInLeaders(n); });
        var s1Staff = s1Clean.filter(function(n) { return !isInLeaders(n); });

        // ລຽງລຳດັບພະນັກງານ 13 ຄົນຕາມແມ່ແບບອາທິດທີ 1: [S3 (3 ຄົນ), S2 (5 ຄົນ), S1 (5 ຄົນ)]
        var rotatedWeek1 = [];
        var addStaffUnique = function(n) {
            if (n && !isInLeaders(n) && !rotatedWeek1.some(function(x) { return isSchedNameMatch(x, n); })) {
                rotatedWeek1.push(n);
            }
        };

        s3Staff.forEach(addStaffUnique);
        s2Staff.forEach(addStaffUnique);
        s1Staff.forEach(addStaffUnique);

        getPermanentStaffList().forEach(addStaffUnique);
        var regular13 = rotatedWeek1.slice(0, 13);

        var baseWeekIndex = getMondayBasedWeekIndex(templateDateObj);
        var baseWeekendIndex = getGlobalWeekendDayIndex(templateDateObj);

        // ແລ່ນສູດ Zigzag ຕໍ່ເນື່ອງຈາກອາທິດທີ 1 ໄປຫາທຸກອາທິດໃນເດືອນນັ້ນ
        for (var i = 1; i <= daysCount; i++) {
            var dNum = i < 10 ? '0' + i : '' + i;
            var dStr = year + '-' + mNum + '-' + dNum;
            var dateObj = new Date(Date.UTC(year, month - 1, i));
            var dayOfWeek = dateObj.getUTCDay();
            var isWeekend = (dayOfWeek === 6 || dayOfWeek === 0 || isDateInHolidayRange(dStr));

            var curW = getMondayBasedWeekIndex(dateObj);
            var weekDiff = curW - baseWeekIndex;

            // ຖ້າເປັນມື້ໃນອາທິດທີ 1 ທີ່ Admin ຈັດໄວ້ແລ້ວ (ແລະ ມີຊື່ຢູ່ແລ້ວ) ໃຫ້ຮັກສາໄວ້ຄືເກົ່າ 100%
            var existingDay = sheet.data[dStr];
            var existingCount = existingDay ? ((existingDay.shift1 || []).filter(Boolean).length + (existingDay.shift2 || []).filter(Boolean).length + (existingDay.shift3 || []).filter(Boolean).length) : 0;
            if (weekDiff === 0 && existingCount > 0 && !isWeekend) {
                continue;
            }

            if (isWeekend) {
                // ຖ້າວັນເສົາ-ອາທິດຂອງອາທິດທີ 1 ມີຊື່ທີ່ Admin ຈັດໄວ້ແລ້ວ ກໍຮັກສາໄວ້ຄືເກົ່າ
                if (weekDiff === 0 && existingCount > 0) continue;

                var gWeekend = Math.max(0, getGlobalWeekendDayIndex(dateObj) - baseWeekendIndex);
                var isSunday = (dayOfWeek === 0);

                var wLeaderSat = tLeaders[(gWeekend) % 4];
                var wLeaderSun = tLeaders[(gWeekend + 1) % 4];

                var wStaff = [];
                for (var k = 0; k < 5; k++) {
                    wStaff.push(regular13[(gWeekend * 5 + k) % 13]);
                }

                var s1 = ['' , wStaff[0], ''];
                var s2 = isSunday ? [wLeaderSun, wStaff[1], wStaff[2]] : [wLeaderSat, wStaff[1], wStaff[2]];
                var s3 = isSunday ? [tLeaders[(gWeekend) % 4], wStaff[3], wStaff[4]] : [tLeaders[(gWeekend + 2) % 4], wStaff[3], wStaff[4]];

                var wkndObj = {
                    isWeekend: true,
                    isG7Team: false,
                    shift1: s1,
                    shift2: s2,
                    shift3: s3
                };
                applyFixedShiftsToDayData(wkndObj);
                sheet.data[dStr] = wkndObj;
            } else {
                var wOffset = ((weekDiff % 4) + 4) % 4;
                var l_1A = tLeaders[(wOffset + 0) % 4];
                var l_1B = tLeaders[(wOffset + 1) % 4];
                var l_S2 = tLeaders[(wOffset + 2) % 4];
                var l_S3 = tLeaders[(wOffset + 3) % 4];

                // ໝູນວຽນ Zigzag ອາທິດຕໍ່ໄປ (ເລື່ອນລຳດັບອາທິດລະ 3 ຄົນ)
                var staffShift = (13000 - weekDiff * 3) % 13;
                var rotated = [];
                for (var r = 0; r < 13; r++) {
                    rotated.push(regular13[(r + staffShift) % 13]);
                }

                var staff_S3 = rotated.slice(0, 3);
                var staff_S2 = rotated.slice(3, 8);
                var staff_S1 = rotated.slice(8, 13);

                var regObj = {
                    isWeekend: false,
                    isG7Team: false,
                    shift1: [l_1A, l_1B, ...staff_S1].filter(Boolean),
                    shift2: [l_S2, ...staff_S2].filter(Boolean),
                    shift3: [l_S3, ...staff_S3].filter(Boolean)
                };
                applyFixedShiftsToDayData(regObj);
                sheet.data[dStr] = regObj;
            }
        }
    }

    try {
        localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
        localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
    } catch(e) {}

    await renderScheduleTable({ skipSwapSync: true });
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    await syncScheduleToSupabase(sheet);
    showToast('ສຳເລັດ', 'ສ້າງຕາຕະລາງ Zigzag ຕໍ່ຈາກແມ່ແບບອາທິດທີ 1 ຄົບທຸກອາທິດແລ້ວ!', 'success');
}
window.executeZigzagFromWeek1 = executeZigzagFromWeek1;

// ⭐ 7. FAIRNESS SUMMARY MODAL FUNCTIONS
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

// ⭐ 8. HOLIDAY MODAL FUNCTIONS
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

// ⭐ 9. RENDER ຕາຕະລາງໃຫຍ່ (ສະແດງສະເພາະຂໍ້ມູນຈາກ Supabase)
async function renderScheduleTable(options) {
    var opts = options || {};
    
    renderSheetDropdown();
    if (typeof window.renderScheduleStaffRoster === 'function') window.renderScheduleStaffRoster();

    var sheet = getActiveSheet();
    var tbody = document.getElementById('scheduleTableBody');
    var titleEl = document.getElementById('scheduleTableTitle');
    var notesEl = document.getElementById('scheduleNotesDisplay');
    var banner = document.getElementById('scheduleStatusBanner');
    var badge = document.getElementById('scheduleStatusBadge');

    // ✅ ຖ້າບໍ່ມີຕາຕະລາງໃນ Supabase ໃຫ້ສະແດງຂໍ້ຄວາມວ່າງເປົ່າ ບໍ່ສ້າງຕາຕະລາງຈຳລອງຂຶ້ນເອງ!
    if (!sheet) {
        if (titleEl) titleEl.innerHTML = '<span class="text-slate-400">ຍັງບໍ່ມີຂໍ້ມູນຕາຕະລາງໃນລະບົບ Supabase</span>';
        if (notesEl) notesEl.innerText = '';
        if (badge) badge.innerHTML = '<span class="text-slate-500">ບໍ່ພົບຕາຕະລາງ</span>';
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-12 text-center text-slate-400 font-lao text-sm">' +
                'ຍັງບໍ່ມີຕາຕະລາງປະຈຳການໃນຖານຂໍ້ມູນ Supabase (ກະລຸນາກົດປຸ່ມ "ສ້າງຕາຕະລາງໃໝ່" ຫຼື "ສ້າງລ່ວງໜ້າ")' +
                '</td></tr>';
        }
        return;
    }

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

    if (titleEl) {
        titleEl.innerHTML = '<span>' + currentTitle + '</span>' +
            '<span class="no-print ml-2 text-xs font-semibold ' + (isOfficial ? 'text-emerald-700' : 'text-amber-700') + '">' +
                '(' + (isOfficial ? 'ສະບັບທາງການ' : 'ສະບັບຮ່າງລ່ວງໜ້າ') + ')' +
            '</span>';
    }
    
    if (notesEl) notesEl.innerText = currentNotes;

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

// 11. CELL MODAL & UPDATES
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

// ⭐ 12. DROPDOWN & SHEET ACTIONS (ບໍ່ສ້າງຕາຕະລາງຈຳລອງ)
function renderSheetDropdown() {
    var select = document.getElementById('scheduleSheetSelect');
    if (!select) return;
    select.innerHTML = '';

    if (!window.scheduleSheets || window.scheduleSheets.length === 0) {
        var emptyOpt = document.createElement('option');
        emptyOpt.value = '';
        emptyOpt.innerText = '-- ບໍ່ມີຕາຕະລາງໃນ Supabase --';
        select.appendChild(emptyOpt);
        return;
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
    if (!month) {
        showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາເລືອກເດືອນ', 'error');
        return;
    }
    var title = document.getElementById('newSheetTitleInput')?.value.trim() || ('ຕາຕະລາງປະຈຳການ ' + month);
    var [y, m] = month.split('-').map(Number);
    var newId = 'sheet-' + Date.now();
    
    var isContract = title.includes('ສັນຍາ');
    var targetMembers = isContract ? getContractStaffList() : getPermanentStaffList();
    var generated = generateMonthDataZigzag(y, m, targetMembers);

    var activeSheet = getActiveSheet();
    var inheritedNotes = activeSheet?.notes || activeSheet?.data?._meta?.notes || window.defaultNotesTemplate || '';

    var newSheet = {
        id: newId,
        monthKey: month,
        title: title,
        notes: inheritedNotes,
        status: 'DRAFT',
        isG7GroupSheet: isContract,
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
    document.getElementById('editSheetNotesInput').value = sheet.notes || sheet.data?._meta?.notes || window.defaultNotesTemplate || '';
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

// ⭐ 13. ຟັງຊັນ RESET ຕາຕະລາງ (ລ້າງຊື່ພະນັກງານທຸກຄົນອອກ 100% ໃຫ້ເປັນຕາຕະລາງວ່າງ)
async function promptResetSchedule() {
    var sheet = getActiveSheet();
    if (!sheet) return;
    if (!confirm('ທ່ານຕ້ອງການລ້າງຊື່ທັງໝົດອອກຈາກຕາຕະລາງນີ້ (Reset ເປັນຕາຕະລາງວ່າງ) ແທ້ບໍ່?')) return;

    var parts = (sheet.monthKey || '2026-10').split('-').map(Number);
    var year = parts[0] || 2026;
    var month = parts[1] || 10;

    sheet.data = createBlankMonthData(year, month);

    try {
        localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
        localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
    } catch(e) {}

    await renderScheduleTable({ skipSwapSync: true });
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    showToast('ສຳເລັດ', 'ລ້າງຊື່ພະນັກງານອອກຈາກຕາຕະລາງທັງໝົດແລ້ວ!', 'success');

    await syncScheduleToSupabase(sheet);
}

async function promptDeleteCurrentSheet() {
    var sheet = getActiveSheet();
    if (!sheet) return;
    if (!confirm('ທ່ານຕ້ອງການລຶບ "' + sheet.title + '" ອອກຈາກລະບົບແທ້ບໍ່?')) return;

    var delId = sheet.id;
    window.scheduleSheets = (window.scheduleSheets || []).filter(function(s) { return String(s.id) !== String(delId); });
    window.activeSheetId = window.scheduleSheets.length > 0 ? window.scheduleSheets[0].id : null;

    try {
        localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
        localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
    } catch(e) {}

    if (window.supabaseClient) {
        await window.supabaseClient.from('schedule_sheets').delete().eq('id', delId);
    }

    renderSheetDropdown();
    await renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    showToast('ສຳເລັດ', 'ລຶບຕາຕະລາງອອກແລ້ວ!', 'success');
}

async function saveDraft() { 
    var sheet = getActiveSheet();
    if (!sheet) return;
    sheet.status = 'DRAFT'; 
    renderSheetDropdown(); 
    await renderScheduleTable({ skipSwapSync: true }); 
    showToast('ສຳເລັດ', 'ບັນທຶກສະບັບຮ່າງ (Draft) ສຳເລັດ', 'success'); 
    await syncScheduleToSupabase(sheet);
}

async function publishSchedule() {
    var sheet = getActiveSheet();
    if (!sheet) return;
    sheet.status = 'PUBLISHED';
    renderSheetDropdown();
    await renderScheduleTable({ skipSwapSync: true });
    showToast('ເຜີຍແຜ່ສຳເລັດ', 'ຕາຕະລາງຖືກ Publish ເປັນທາງການແລ້ວ!', 'success');
    await syncScheduleToSupabase(sheet);
}

// 14. REBALANCE SHIFT 3
async function rebalanceNightShifts() {
    var sheet = getActiveSheet();
    var schedData = sheet?.data || {};
    var dates = Object.keys(schedData).filter(function(k) { return !k.startsWith('_'); });
    if (dates.length === 0) {
        showToast('ແຈ້ງເຕືອນ', 'ຕາຕະລາງຍັງວ່າງເປົ່າ', 'info');
        return;
    }

    var leaderNames = ['ແສງດາວ', 'ພອນສະຫວັນ', 'ບຸນປະເສີດ', 'ພັນນິກອນ'];
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
                }
            }
        }
    });

    await renderScheduleTable({ skipSwapSync: true });
    await syncScheduleToSupabase(sheet);
    showToast('Rebalance ສຳເລັດ', 'ປັບສົມດຸນຮຽບຮ້ອຍ!', 'success');
}

// 15. EXPORT A4 PDF
function exportToA4PDF() {
    var sheet = getActiveSheet();
    var element = document.getElementById('pdfExportArea');
    if (!element || !sheet) return;

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

// Auto-load ຈາກ Supabase ເທົ່ານັ້ນ
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
// ================= ⭐ 17. INTERACTIVE SCHEDULE IMAGE-STYLE ZOOM & PAN VIEWER =================
window.schedZoomScale = 1;
window.schedIsFullscreen = false;

function initScheduleZoomViewer() {
    var exportArea = document.getElementById('pdfExportArea');
    if (!exportArea) return;
    var scrollContainer = exportArea.parentElement;
    if (!scrollContainer) return;

    // 1. ປົດລັອກຂໍ້ຈຳກັດ user-scalable=no ໃນ meta viewport ເພື່ອໃຫ້ມືຖືຖ່າງຊູມໄດ້
    var metaVp = document.querySelector('meta[name="viewport"]');
    if (metaVp) {
        metaVp.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
    }

    // 2. ສ້າງແຖບປຸ່ມລອຍ Floating Zoom Controls (no-print ເພື່ອບໍ່ໃຫ້ຕິດຕອນ Export PDF)
    if (!document.getElementById('schedFloatingZoomBar')) {
        var bar = document.createElement('div');
        bar.id = 'schedFloatingZoomBar';
        bar.className = 'no-print fixed bottom-6 right-6 z-40 bg-slate-900/90 backdrop-blur-md text-white px-3 py-2 rounded-2xl shadow-2xl border border-white/15 flex items-center gap-1.5 font-lao select-none';
        bar.innerHTML =
            '<button type="button" onclick="adjustScheduleZoom(-0.15)" class="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer" title="ຊູມອອກ (Zoom Out)">' +
                '<span class="material-symbols-outlined text-lg">zoom_out</span>' +
            '</button>' +
            '<button type="button" onclick="resetScheduleZoom()" id="schedZoomPercentLabel" class="px-2.5 h-8 rounded-xl bg-white/5 hover:bg-white/15 text-xs font-bold font-mono min-w-[54px] text-center transition cursor-pointer" title="ກົດເພື່ອຄືນຄ່າ 100%">100%</button>' +
            '<button type="button" onclick="adjustScheduleZoom(0.15)" class="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer" title="ຊູມເຂົ້າ (Zoom In)">' +
                '<span class="material-symbols-outlined text-lg">zoom_in</span>' +
            '</button>' +
            '<div class="w-px h-5 bg-white/20 mx-0.5"></div>' +
            '<button type="button" onclick="fitScheduleToScreen()" class="px-2.5 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer" title="ປັບຂະໜາດພໍດີໜ້າຈໍ">' +
                '<span class="material-symbols-outlined text-sm">fit_screen</span> <span class="hidden sm:inline">ພໍດີຈໍ</span>' +
            '</button>' +
            '<button type="button" onclick="toggleScheduleFullscreen()" class="w-8 h-8 rounded-xl bg-brand-red hover:bg-brand-red-dark flex items-center justify-center transition cursor-pointer shadow-md" title="ເບິ່ງເຕັມຈໍຄືຮູບພາບ">' +
                '<span class="material-symbols-outlined text-lg" id="schedFullscreenIcon">fullscreen</span>' +
            '</button>';
        
        var viewSched = document.getElementById('view-schedule');
        if (viewSched) viewSched.appendChild(bar);
    }

    if (scrollContainer.dataset.zoomBound === '1') return;
    scrollContainer.dataset.zoomBound = '1';

    // 3. ຮອງຮັບ Ctrl + Mouse Wheel Zoom ໃນຄອມພິວເຕີ
    scrollContainer.addEventListener('wheel', function(e) {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            var delta = e.deltaY < 0 ? 0.12 : -0.12;
            adjustScheduleZoom(delta);
        }
    }, { passive: false });

    // 4. ຮອງຮັບໃຊ້ 2 ນິ້ວຖ່າງຊູມ (Pinch-to-Zoom) ໃນມືຖື Android / iOS
    var initialPinchDist = null;
    var initialScale = 1;

    scrollContainer.addEventListener('touchstart', function(e) {
        if (e.touches.length === 2) {
            e.preventDefault();
            var dx = e.touches[0].clientX - e.touches[1].clientX;
            var dy = e.touches[0].clientY - e.touches[1].clientY;
            initialPinchDist = Math.hypot(dx, dy);
            initialScale = window.schedZoomScale || 1;
        }
    }, { passive: false });

    scrollContainer.addEventListener('touchmove', function(e) {
        if (e.touches.length === 2 && initialPinchDist) {
            e.preventDefault();
            var dx = e.touches[0].clientX - e.touches[1].clientX;
            var dy = e.touches[0].clientY - e.touches[1].clientY;
            var dist = Math.hypot(dx, dy);
            var ratio = dist / initialPinchDist;
            setScheduleZoom(initialScale * ratio);
        }
    }, { passive: false });

    scrollContainer.addEventListener('touchend', function(e) {
        if (e.touches.length < 2) {
            initialPinchDist = null;
        }
    });

    // 5. ຮອງຮັບ Double-Click / Double-Tap ເພື່ອຊູມເຂົ້າ-ອອກທັນທີ (ສະເພາະ User ທົ່ວໄປ)
    var lastTapTime = 0;
    scrollContainer.addEventListener('click', function(e) {
        var isAdmin = window.currentUser && window.currentUser.role === 'SUPER_ADMIN';
        if (isAdmin) return; // Admin ໃຊ້ກົດເພື່ອແກ້ໄຂຊື່
        var now = Date.now();
        if (now - lastTapTime < 300) {
            if (Math.abs(window.schedZoomScale - 1) < 0.05) {
                setScheduleZoom(1.45);
            } else {
                fitScheduleToScreen();
            }
            lastTapTime = 0;
        } else {
            lastTapTime = now;
        }
    });

    // 6. ຮອງຮັບກົດຄ້າງແລ້ວລາກເລື່ອນຊ້າຍ-ຂວາ-ເທິງ-ລຸ່ມ (Click & Drag Pan ສຳລັບ User ທົ່ວໄປ)
    var isPanning = false;
    var startX = 0, startY = 0, scrollL = 0, scrollT = 0;

    scrollContainer.addEventListener('mousedown', function(e) {
        var isAdmin = window.currentUser && window.currentUser.role === 'SUPER_ADMIN';
        if (isAdmin) return; // ບໍ່ລົບກວນລະບົບ Drag & Drop ຂອງ Admin
        if (e.button !== 0) return;
        isPanning = true;
        scrollContainer.style.cursor = 'grabbing';
        startX = e.pageX - scrollContainer.offsetLeft;
        startY = e.pageY - scrollContainer.offsetTop;
        scrollL = scrollContainer.scrollLeft;
        scrollT = scrollContainer.scrollTop;
    });

    window.addEventListener('mouseup', function() {
        if (isPanning) {
            isPanning = false;
            scrollContainer.style.cursor = '';
        }
    });

    scrollContainer.addEventListener('mousemove', function(e) {
        if (!isPanning) return;
        e.preventDefault();
        var x = e.pageX - scrollContainer.offsetLeft;
        var y = e.pageY - scrollContainer.offsetTop;
        scrollContainer.scrollLeft = scrollL - (x - startX) * 1.2;
        scrollContainer.scrollTop = scrollT - (y - startY) * 1.2;
    });

    // ຖ້າເປີດໃນຈໍມືຖືນ້ອຍ ໃຫ້ປັບ Fit ພໍດີຈໍອັດຕະໂນມັດໃນຄັ້ງທຳອິດ
    if (window.innerWidth < 768) {
        setTimeout(fitScheduleToScreen, 250);
    }
}

function setScheduleZoom(newScale) {
    var clamped = Math.min(Math.max(newScale, 0.35), 2.5);
    window.schedZoomScale = Math.round(clamped * 100) / 100;

    var exportArea = document.getElementById('pdfExportArea');
    if (exportArea) {
        // ໃຊ້ CSS zoom (ຮອງຮັບການ Scroll ທຸກທິດທາງໃນ Chrome/Android/Safari ໂດຍບໍ່ຕັດຂອບ)
        exportArea.style.zoom = window.schedZoomScale;
        exportArea.style.transformOrigin = 'top left';
    }

    var label = document.getElementById('schedZoomPercentLabel');
    if (label) {
        label.innerText = Math.round(window.schedZoomScale * 100) + '%';
    }
}

function adjustScheduleZoom(delta) {
    setScheduleZoom((window.schedZoomScale || 1) + delta);
}

function resetScheduleZoom() {
    setScheduleZoom(1);
}

function fitScheduleToScreen() {
    var exportArea = document.getElementById('pdfExportArea');
    if (!exportArea || !exportArea.parentElement) return;
    var containerWidth = exportArea.parentElement.clientWidth - 24;
    var tableNaturalWidth = 980; // ຄວາມກວ້າງມາດຕະຖານຂອງຕາຕະລາງ A4
    if (containerWidth > 200 && containerWidth < tableNaturalWidth) {
        setScheduleZoom(containerWidth / tableNaturalWidth);
    } else {
        setScheduleZoom(1);
    }
}

function toggleScheduleFullscreen() {
    var viewSched = document.getElementById('view-schedule');
    var icon = document.getElementById('schedFullscreenIcon');
    if (!viewSched) return;

    window.schedIsFullscreen = !window.schedIsFullscreen;
    if (window.schedIsFullscreen) {
        viewSched.classList.add('fixed', 'inset-0', 'z-[95]', 'bg-slate-100');
        if (icon) icon.innerText = 'fullscreen_exit';
        showToast('ໂໝດເບິ່ງເຕັມຈໍ', 'ສາມາດຊູມເຂົ້າ-ອອກ ຫຼື ລາກເລື່ອນເບິ່ງຕາຕະລາງໄດ້ເລີຍ', 'info');
    } else {
        viewSched.classList.remove('fixed', 'inset-0', 'z-[95]', 'bg-slate-100');
        if (icon) icon.innerText = 'fullscreen';
    }
}

// ກ່ອນກົດ Export A4 PDF ໃຫ້ຄືນຄ່າ Zoom ເປັນ 100% ຊົ່ວຄາວ ເພື່ອບໍ່ໃຫ້ໄຟລ໌ PDF ຜິດຂະໜາດ
var _origExportToA4PDF = window.exportToA4PDF;
window.exportToA4PDF = function() {
    var savedScale = window.schedZoomScale || 1;
    setScheduleZoom(1);
    if (typeof _origExportToA4PDF === 'function') {
        _origExportToA4PDF();
    }
    setTimeout(function() {
        setScheduleZoom(savedScale);
    }, 1500);
};

// ເອີ້ນໃຊ້ລະບົບ Zoom ທຸກຄັ້ງທີ່ Render ຕາຕະລາງ
var _origRenderSchedForZoom = window.renderScheduleTable;
window.renderScheduleTable = async function(options) {
    if (typeof _origRenderSchedForZoom === 'function') {
        await _origRenderSchedForZoom(options);
    }
    initScheduleZoomViewer();
};

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initScheduleZoomViewer, 400);
});

// ⭐ ຜູກຄົບທຸກ Functions ຂອງປຸ່ມ Toolbar ເຂົ້າ Window 100%
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
window.openFixedShiftModal = openFixedShiftModal;
window.renderActiveFixedShiftsList = renderActiveFixedShiftsList;
window.handleAddFixedShift = handleAddFixedShift;
window.removeFixedShift = removeFixedShift;
window.openFairnessSummaryModal = openFairnessSummaryModal;
window.closeFairnessSummaryModal = closeFairnessSummaryModal;
window.renderFairnessSummaryData = renderFairnessSummaryData;
window.openHolidayModal = openHolidayModal;
window.handleSaveHolidayRange = handleSaveHolidayRange;
window.createBlankMonthData = createBlankMonthData;
window.applyFixedShiftsToDayData = applyFixedShiftsToDayData;
window.initScheduleZoomViewer = initScheduleZoomViewer;
window.setScheduleZoom = setScheduleZoom;
window.adjustScheduleZoom = adjustScheduleZoom;
window.resetScheduleZoom = resetScheduleZoom;
window.fitScheduleToScreen = fitScheduleToScreen;
window.toggleScheduleFullscreen = toggleScheduleFullscreen;

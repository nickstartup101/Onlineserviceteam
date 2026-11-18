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

// 0.29 ENGINE ບັງຄັບລັອກກະປະຈຳ (ແບບ SWAP + ຢາຍກະ 3 ແລະ ກະ 2 ຂອງຄົນທີ່ຖືກ Fix Shift ໃຫ້ທຸກຄົນສະເລ່ຍ 1-2 ມື້)
function applyFixedShiftsToDayData(dayData, fixedTracker) {
    if (!dayData || !window.fixedShiftsConfig || window.fixedShiftsConfig.length === 0) return;

    var allUsers = window.users || [];
    var isLeaderUser = function(name) {
        if (!name) return false;
        var u = allUsers.find(function(usr) { return usr && usr.nameLao && isSchedNameMatch(usr.nameLao, name); });
        return Boolean(u && u.isLeader) || ['ແສງດາວ', 'ພອນສະຫວັນ', 'ບຸນປະເສີດ', 'ພັນນິກອນ'].some(function(ln) {
            return isSchedNameMatch(ln, name);
        });
    };
    var isLockedToShift = function(name, shiftKey) {
        return (window.fixedShiftsConfig || []).some(function(cfg) {
            return cfg && isSchedNameMatch(cfg.nameLao, name) && cfg.fixedShift === shiftKey;
        });
    };

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
            if (!dayData[targetShift]) dayData[targetShift] = [];
            var targetArr = dayData[targetShift];
            var movingIsLeader = isLeaderUser(name);

            // ເລືອກຄົນປະເພດດຽວກັນໃນກະປາຍທາງທີ່ບໍ່ໄດ້ຖືກລັອກ ແລະ ຊ່ວຍແທນກະນີ້ໜ້ອຍສຸດ (ກະຈາຍຄົນລະ 1-2 ມື້)
            var swapIdx = -1;
            var bestScore = Infinity;

            for (var j = 0; j < targetArr.length; j++) {
                var candidate = targetArr[j];
                if (!candidate) continue;
                if (isLeaderUser(candidate) === movingIsLeader && !isLockedToShift(candidate, targetShift)) {
                    if (fixedTracker) {
                        var shiftMap = (fixedTracker.coverByShift && fixedTracker.coverByShift[currentShift]) || {};
                        var cCover = shiftMap[candidate] || 0;
                        var cS3 = (fixedTracker.s3Count && fixedTracker.s3Count[candidate]) || 0;
                        var score = cCover * 100 + (currentShift === 'shift3' ? cS3 : 0);
                        if (score < bestScore) {
                            bestScore = score;
                            swapIdx = j;
                        }
                    } else {
                        swapIdx = j;
                    }
                }
            }

            if (swapIdx !== -1) {
                var swappedOut = targetArr[swapIdx];
                targetArr[swapIdx] = dayData[currentShift][currentIdx];
                dayData[currentShift][currentIdx] = swappedOut;

                if (fixedTracker) {
                    if (!fixedTracker.coverByShift) fixedTracker.coverByShift = {};
                    if (!fixedTracker.coverByShift[currentShift]) fixedTracker.coverByShift[currentShift] = {};
                    fixedTracker.coverByShift[currentShift][swappedOut] = (fixedTracker.coverByShift[currentShift][swappedOut] || 0) + 1;
                }
            } else {
                if (dayData.isWeekend && movingIsLeader && targetShift === 'shift1') {
                    return;
                }
                dayData[currentShift].splice(currentIdx, 1);
                targetArr.push(name);
            }
        }
    });

    if (fixedTracker) {
        if (!fixedTracker.s3Count) fixedTracker.s3Count = {};
        (dayData.shift3 || []).forEach(function(nm) {
            if (nm) fixedTracker.s3Count[nm] = (fixedTracker.s3Count[nm] || 0) + 1;
        });
    }
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

// 1.5 HELPER: ຄົ້ນຫາ & ດຶງລຳດັບຕໍ່ເນື່ອງຈາກເດືອນກ່ອນໜ້າ
function findPreviousMonthSheet(year, month, isContract) {
    var prevY = month === 1 ? year - 1 : year;
    var prevM = month === 1 ? 12 : month - 1;
    var prevMKey = prevY + '-' + (prevM < 10 ? '0' + prevM : '' + prevM);
    var sheets = window.scheduleSheets || [];

    var hasData = function(s) {
        return s && s.data && Object.keys(s.data).some(function(k) { return !k.startsWith('_'); });
    };

    var candidates = sheets.filter(function(s) {
        return s && String(s.monthKey) === prevMKey && hasData(s);
    });
    if (candidates.length === 0) return null;

    var exactPub = candidates.find(function(s) {
        return Boolean(s.isG7GroupSheet) === Boolean(isContract) && s.status === 'PUBLISHED';
    });
    if (exactPub) return exactPub;

    var exactAny = candidates.find(function(s) {
        return Boolean(s.isG7GroupSheet) === Boolean(isContract);
    });
    if (exactAny) return exactAny;

    return candidates[0];
}

function getUnswappedDayCopy(rawDay, dStr) {
    var copyDay = {
        shift1: (rawDay && rawDay.shift1 ? rawDay.shift1 : []).slice(),
        shift2: (rawDay && rawDay.shift2 ? rawDay.shift2 : []).slice(),
        shift3: (rawDay && rawDay.shift3 ? rawDay.shift3 : []).slice()
    };

    (window.swapHistory || []).forEach(function(sw) {
        if (!sw || sw.swapType === 'COVER') return;
        if (String(sw.status || '').toUpperCase() !== 'COMPLETED') return;
        var sStart = sw.startDate || sw.start_date;
        var sEnd = sw.endDate || sw.end_date || sStart;
        if (dStr < sStart || dStr > sEnd) return;

        var fKey = normalizeSchedShiftKey(sw.fromShift || sw.from_shift);
        var tKey = normalizeSchedShiftKey(sw.toShift || sw.to_shift);
        var fName = sw.fromName || sw.from_name;
        var tName = sw.toName || sw.to_name;
        if (fKey && tKey && fKey !== tKey && fName && tName) {
            var idxInTo = (copyDay[tKey] || []).findIndex(function(n) { return isSchedNameMatch(n, fName); });
            var idxInFrom = (copyDay[fKey] || []).findIndex(function(n) { return isSchedNameMatch(n, tName); });
            if (idxInTo !== -1 && idxInFrom !== -1) {
                var tmp = copyDay[tKey][idxInTo];
                copyDay[tKey][idxInTo] = copyDay[fKey][idxInFrom];
                copyDay[fKey][idxInFrom] = tmp;
            }
        }
    });

    return copyDay;
}

function extractZigzagConfigFromSheet(prevSheet) {
    if (!prevSheet || !prevSheet.data) return null;

    // 1. ຖ້າມີ _zigzagConfig ບັນທຶກໄວ້ແລ້ວ ໃຊ້ໄດ້ທັນທີ 100%
    if (prevSheet.data._zigzagConfig) {
        return JSON.parse(JSON.stringify(prevSheet.data._zigzagConfig));
    }

    var dates = Object.keys(prevSheet.data)
        .filter(function(k) { return !k.startsWith('_'); })
        .sort();
    if (dates.length === 0) return null;

    // 2. ກໍລະນີກຸ່ມສັນຍາ 7 ຄົນ (Legacy Sheet)
    if (prevSheet.isG7GroupSheet) {
        var lastG7Date = null;
        for (var g = dates.length - 1; g >= 0; g--) {
            var gd = prevSheet.data[dates[g]];
            if (gd && ((gd.shift1 || []).filter(Boolean).length + (gd.shift2 || []).filter(Boolean).length + (gd.shift3 || []).filter(Boolean).length) >= 5) {
                lastG7Date = dates[g];
                break;
            }
        }
        if (!lastG7Date) return null;
        var gDay = prevSheet.data[lastG7Date];
        var s1g = (gDay.shift1 || []).filter(Boolean);
        var s2g = (gDay.shift2 || []).filter(Boolean);
        var s3g = (gDay.shift3 || []).filter(Boolean);
        var active5 = [].concat(s1g, s2g, s3g);
        var all7 = getContractStaffList();
        var off2 = all7.filter(function(n) {
            return !active5.some(function(a) { return isSchedNameMatch(a, n); });
        });
        var dailySlots = active5.concat(off2).slice(0, 7);

        var detectedMode = 0;
        if (s1g.length === 1 && s2g.length === 2 && s3g.length === 2) detectedMode = 1;
        else if (s1g.length === 2 && s2g.length === 1 && s3g.length === 2) detectedMode = 2;

        var pParts = lastG7Date.split('-').map(Number);
        var curUtc = new Date(Date.UTC(pParts[0], pParts[1] - 1, pParts[2]));
        var epochUtc = new Date(Date.UTC(2026, 0, 1));
        var baseDays = Math.floor((curUtc.getTime() - epochUtc.getTime()) / 86400000);
        var randomOffset7 = ((detectedMode - (baseDays % 3)) % 3 + 3) % 3;

        var reconstructed7 = [];
        for (var p = 0; p < 7; p++) {
            reconstructed7[p] = dailySlots[(p + baseDays + randomOffset7) % 7];
        }
        return {
            type: '7',
            list: reconstructed7,
            randomOffset: randomOffset7
        };
    }

    // 3. ກໍລະນີກຸ່ມຫຼັກ 17 ຄົນ (Legacy Sheet ເຊັ່ນ ເດືອນ 11)
    var lastWeekday = null;
    for (var i = dates.length - 1; i >= 0; i--) {
        var dStr = dates[i];
        var dp = dStr.split('-').map(Number);
        var dObj = new Date(Date.UTC(dp[0], dp[1] - 1, dp[2]));
        var dow = dObj.getUTCDay();
        var dayData = prevSheet.data[dStr];
        if (dow !== 0 && dow !== 6 && !isDateInHolidayRange(dStr) && dayData && !dayData.isWeekend) {
            var totalNames = (dayData.shift1 || []).filter(Boolean).length +
                             (dayData.shift2 || []).filter(Boolean).length +
                             (dayData.shift3 || []).filter(Boolean).length;
            if (totalNames >= 10) {
                lastWeekday = dStr;
                break;
            }
        }
    }
    if (!lastWeekday) return null;

    var copyDay = getUnswappedDayCopy(prevSheet.data[lastWeekday], lastWeekday);

    var lp = lastWeekday.split('-').map(Number);
    var lastDateObj = new Date(Date.UTC(lp[0], lp[1] - 1, lp[2]));
    var W = getMondayBasedWeekIndex(lastDateObj);

    // ນັບກະຫຼັກຈາກທຸກມື້ຈັນ-ສຸກໃນອາທິດກ່ອນໜ້າ (W - 1) ດ້ວຍສຽງສ່ວນຫຼາຍ
    var prevWeekCounts = {};
    for (var j = 0; j < dates.length; j++) {
        var pdStr = dates[j];
        var pdp = pdStr.split('-').map(Number);
        var pdObj = new Date(Date.UTC(pdp[0], pdp[1] - 1, pdp[2]));
        var pdow = pdObj.getUTCDay();
        var pData = prevSheet.data[pdStr];
        if (pdow !== 0 && pdow !== 6 && !isDateInHolidayRange(pdStr) && pData && !pData.isWeekend) {
            if (getMondayBasedWeekIndex(pdObj) === W - 1) {
                var pCopy = getUnswappedDayCopy(pData, pdStr);
                ['shift1', 'shift2', 'shift3'].forEach(function(sk) {
                    (pCopy[sk] || []).forEach(function(nm) {
                        if (!nm) return;
                        var key = nm.toString().trim();
                        if (!prevWeekCounts[key]) prevWeekCounts[key] = { shift1: 0, shift2: 0, shift3: 0 };
                        prevWeekCounts[key][sk]++;
                    });
                });
            }
        }
    }
    var getPrevMainShift = function(name) {
        var matchedKey = Object.keys(prevWeekCounts).find(function(k) { return isSchedNameMatch(k, name); });
        if (!matchedKey) return null;
        var c = prevWeekCounts[matchedKey];
        if (c.shift1 >= c.shift2 && c.shift1 >= c.shift3 && c.shift1 > 0) return 'shift1';
        if (c.shift2 >= c.shift1 && c.shift2 >= c.shift3 && c.shift2 > 0) return 'shift2';
        if (c.shift3 > 0) return 'shift3';
        return null;
    };

    var allUsers = window.users || [];
    var permList = getPermanentStaffList();
    var knownLeaders = permList.filter(function(name) {
        var u = allUsers.find(function(usr) { return usr && usr.nameLao && isSchedNameMatch(usr.nameLao, name); });
        return u && u.isLeader;
    });
    if (knownLeaders.length < 4) {
        knownLeaders = ['ແສງດາວ', 'ພອນສະຫວັນ', 'ບຸນປະເສີດ', 'ພັນນິກອນ'];
    }
    var isLeaderFn = function(name) {
        return knownLeaders.some(function(ln) { return isSchedNameMatch(ln, name); });
    };

    var extractedLeaders = [];
    var pushUnique = function(arr, val) {
        if (val && !arr.some(function(x) { return isSchedNameMatch(x, val); })) arr.push(val);
    };

    // ດຶງຫົວໜ້າກະຕາມລຳດັບ [1A, 1B, 2, 3] ເພື່ອໃຫ້ອາທິດຕໍ່ໄປເລື່ອນແບບ 3 -> 2 -> 1B -> 1A -> 3
    (copyDay.shift1 || []).forEach(function(n) { if (n && isLeaderFn(n)) pushUnique(extractedLeaders, n); });
    (copyDay.shift2 || []).forEach(function(n) { if (n && isLeaderFn(n)) pushUnique(extractedLeaders, n); });
    (copyDay.shift3 || []).forEach(function(n) { if (n && isLeaderFn(n)) pushUnique(extractedLeaders, n); });
    knownLeaders.forEach(function(ln) { pushUnique(extractedLeaders, ln); });

    var s3Staff = [];
    var s2Staff = [];
    var s1Staff = [];
    (copyDay.shift3 || []).forEach(function(n) { if (n && !isLeaderFn(n)) pushUnique(s3Staff, n); });
    (copyDay.shift2 || []).forEach(function(n) { if (n && !isLeaderFn(n)) pushUnique(s2Staff, n); });
    (copyDay.shift1 || []).forEach(function(n) { if (n && !isLeaderFn(n)) pushUnique(s1Staff, n); });

    if (Object.keys(prevWeekCounts).length > 0) {
        var wasInS2 = function(name) { return getPrevMainShift(name) === 'shift2'; };
        var wasInS1 = function(name) { return getPrevMainShift(name) === 'shift1'; };
        s2Staff = s2Staff.filter(function(n) { return !wasInS2(n); })
            .concat(s2Staff.filter(function(n) { return wasInS2(n); }));
        s1Staff = s1Staff.filter(function(n) { return !wasInS1(n); })
            .concat(s1Staff.filter(function(n) { return wasInS1(n); }));
    }

    var extractedStaff = [];
    [].concat(s3Staff, s2Staff, s1Staff).forEach(function(n) { pushUnique(extractedStaff, n); });
    permList.forEach(function(pn) { if (!isLeaderFn(pn)) pushUnique(extractedStaff, pn); });

    return {
        type: '17',
        leaderNames: extractedLeaders.slice(0, 4),
        regularStaff: extractedStaff.slice(0, 13),
        randomLeaderShiftOffset: ((4 - (W % 4)) % 4 + 4) % 4,
        randomStaffShiftOffset: ((W * 3) % 13 + 13) % 13
    };
}

// 2. ສູດທີມຫຼັກ 17 ຄົນ: CONTINUOUS WEEKLY ZIGZAG
// - ຫົວໜ້າ (1A - 1B - 2 - 3): ກະ 3 -> ກະ 2 -> 1B -> 1A -> ກະ 3
// - ວິຊາການ (5 - 5 - 3): ກະ 3 -> ກະ 2 -> ກະ 1 -> ກະ 3
function generate17PersonLeadersAndStaffZigzag(year, month, staffList, isReshuffle, carryConfig) {
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
    var numRegular = regularStaff.length || 13;

    var randomStaffShiftOffset = 0;
    var randomLeaderShiftOffset = 0;

    if (isReshuffle) {
        leaderNames = shuffleArray(leaderNames);
        regularStaff = shuffleArray(regularStaff);
        randomStaffShiftOffset = Math.floor(Math.random() * numRegular);
        randomLeaderShiftOffset = Math.floor(Math.random() * 4);
    } else if (carryConfig && carryConfig.type === '17') {
        leaderNames = (carryConfig.leaderNames || leaderNames).slice();
        regularStaff = (carryConfig.regularStaff || regularStaff).slice();
        numRegular = regularStaff.length || 13;
        randomStaffShiftOffset = carryConfig.randomStaffShiftOffset || 0;
        randomLeaderShiftOffset = carryConfig.randomLeaderShiftOffset || 0;
    }

    var fixedTracker = { coverByShift: { shift2: {}, shift3: {} }, s3Count: {} };

    for (var i = 1; i <= daysCount; i++) {
        var dayNum = i < 10 ? '0' + i : '' + i;
        var mNum = month < 10 ? '0' + month : '' + month;
        var dStr = year + '-' + mNum + '-' + dayNum;
        var dateObj = new Date(Date.UTC(year, month - 1, i));
        var dayOfWeek = dateObj.getUTCDay();
        var isWeekend = (dayOfWeek === 6 || dayOfWeek === 0 || isDateInHolidayRange(dStr));

        if (isWeekend) {
            var gWeekend = getGlobalWeekendDayIndex(dateObj);
            if (dayOfWeek !== 6 && dayOfWeek !== 0) {
                gWeekend += i;
            }

            // ໝູນວຽນຫົວໜ້າທັງ 4 ຄົນໃຫ້ໄດ້ກະ 2 ແລະ ກະ 3 ວັນພັກເທົ່າກັນທຸກຄົນ
            var lPairIdx = ((gWeekend + randomLeaderShiftOffset) % 4 + 4) % 4;
            var wLeaderS2, wLeaderS3;
            if (lPairIdx === 0)      { wLeaderS2 = leaderNames[0]; wLeaderS3 = leaderNames[1]; }
            else if (lPairIdx === 1) { wLeaderS2 = leaderNames[2]; wLeaderS3 = leaderNames[3]; }
            else if (lPairIdx === 2) { wLeaderS2 = leaderNames[1]; wLeaderS3 = leaderNames[0]; }
            else                     { wLeaderS2 = leaderNames[3]; wLeaderS3 = leaderNames[2]; }

            var wStaff = [];
            for (var k = 0; k < 5; k++) {
                wStaff.push(regularStaff[((gWeekend * 5 + k + randomStaffShiftOffset) % numRegular + numRegular) % numRegular]);
            }

            var dayObj = {
                isWeekend: true,
                isG7Team: false,
                shift1: ['', wStaff[0], ''],
                shift2: [wLeaderS2, wStaff[1], wStaff[2]],
                shift3: [wLeaderS3, wStaff[3], wStaff[4]]
            };
            applyFixedShiftsToDayData(dayObj, fixedTracker);
            data[dStr] = dayObj;
        } else {
            var W = getMondayBasedWeekIndex(dateObj);

            // ຫົວໜ້າກະ: ກະ 2 -> 1B -> 1A -> ກະ 3 -> ກະ 2
            var l_1A = leaderNames[((W + randomLeaderShiftOffset + 0) % 4 + 4) % 4];
            var l_1B = leaderNames[((W + randomLeaderShiftOffset + 1) % 4 + 4) % 4];
            var l_S2 = leaderNames[((W + randomLeaderShiftOffset + 2) % 4 + 4) % 4];
            var l_S3 = leaderNames[((W + randomLeaderShiftOffset + 3) % 4 + 4) % 4];

            // ວິຊາການ: ກະ 1 = 5 ຄົນ, ກະ 2 = 5 ຄົນ, ກະ 3 = 3 ຄົນ (ກະ 3 -> ກະ 2 -> ກະ 1 -> ກະ 3)
            var staffOffset = ((13000 - W * 3 + randomStaffShiftOffset) % numRegular + numRegular) % numRegular;
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
            applyFixedShiftsToDayData(dayObj, fixedTracker);
            data[dStr] = dayObj;
        }
    }

    data._zigzagConfig = {
        type: '17',
        leaderNames: leaderNames.slice(),
        regularStaff: regularStaff.slice(),
        randomLeaderShiftOffset: randomLeaderShiftOffset,
        randomStaffShiftOffset: randomStaffShiftOffset
    };

    return data;
}

// 3. ສູດກຸ່ມ 7 ຄົນ: Rolling 5/2 (ທີມສັນຍາ 7 ຄົນ)
function generate7PersonFlexZigzag(year, month, staffList, isReshuffle, carryConfig) {
    var daysCount = new Date(year, month, 0).getDate();
    var data = {};
    var N = 7;
    var epochDate = new Date(Date.UTC(2026, 0, 1));
    var list = (staffList && staffList.length === 7) ? staffList.slice() : getContractStaffList();

    var randomOffset = 0;
    if (isReshuffle) {
        list = shuffleArray(list);
        randomOffset = Math.floor(Math.random() * N);
    } else if (carryConfig && carryConfig.type === '7') {
        list = (carryConfig.list || list).slice();
        randomOffset = carryConfig.randomOffset || 0;
    }

    var fixedTracker = { coverByShift: { shift2: {}, shift3: {} }, s3Count: {} };

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
            var assignedSlot = ((p + totalDays) % N + N) % N;
            dailySlots[assignedSlot] = list[p];
        }

        var mode = ((totalDays % 3) + 3) % 3;
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
        applyFixedShiftsToDayData(dayObj, fixedTracker);
        data[dStr] = dayObj;
    }

    data._zigzagConfig = {
        type: '7',
        list: list.slice(),
        randomOffset: randomOffset
    };

    return data;
}

function generateMonthDataZigzag(year, month, targetGroupMembers, isReshuffle, carryConfig) {
    var staffList = [];
    if (targetGroupMembers && targetGroupMembers.length > 0) {
        staffList = [...targetGroupMembers];
    } else {
        staffList = getPermanentStaffList();
    }

    if (staffList.length === 7) {
        return generate7PersonFlexZigzag(year, month, staffList, Boolean(isReshuffle), carryConfig);
    } else {
        return generate17PersonLeadersAndStaffZigzag(year, month, staffList, Boolean(isReshuffle), carryConfig);
    }
}

// 4. MODAL ສຸ່ມກຸ່ມ (ເພີ່ມຕົວເລືອກ "ຈັດຕໍ່ເນື່ອງຈາກທ້າຍເດືອນກ່ອນໜ້າ" ໄວ້ທຳອິດ)
function openRandomGroupSelectModal() {
    var select = document.getElementById('randomSelectedGroupId');
    if (!select) return;
    select.innerHTML = '';

    var optContinue = document.createElement('option');
    optContinue.value = 'CONTINUE_PREV';
    optContinue.innerText = '🔄 ຈັດຕາຕະລາງຕໍ່ເນື່ອງຈາກທ້າຍເດືອນກ່ອນໜ້າ (ແນະນຳ)';
    select.appendChild(optContinue);

    var optMain = document.createElement('option');
    optMain.value = 'GRP_MAIN_17';
    optMain.innerText = '🎲 ສຸ່ມໃໝ່: ກຸ່ມທີມວິຊາການສົມບູນ (17 ຄົນ - Weekly Zigzag)';
    select.appendChild(optMain);

    var optContract = document.createElement('option');
    optContract.value = 'GRP_CONTRACT_7';
    optContract.innerText = '🎲 ສຸ່ມໃໝ່: ກຸ່ມທີມວິຊາການສັນຍາ (7 ຄົນ - Rolling 5/2)';
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

// 4.1 EXECUTE RANDOM (ຫຼື ຕໍ່ເນື່ອງຈາກເດືອນກ່ອນໜ້າ)
async function executeGroupRandomSchedule() {
    var sheet = getActiveSheet();
    if (!sheet) {
        showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາສ້າງຕາຕະລາງໃໝ່ກ່ອນ', 'warning');
        return;
    }

    var selectedGrpId = document.getElementById('randomSelectedGroupId')?.value || 'CONTINUE_PREV';

    if (selectedGrpId === 'CONTINUE_PREV') {
        document.getElementById('randomGroupSelectModal')?.classList.add('hidden');
        await continueCurrentSheetFromPreviousMonth();
        return;
    }

    var [year, month] = (sheet.monthKey || '2026-10').split('-').map(Number);

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

    await renderScheduleTable();
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

    await fetchScheduleSwapsFromCloud();

    var isContract = (selectedGrpId === 'GRP_CONTRACT_7');
    var selectedMembers = isContract ? getContractStaffList() : getPermanentStaffList();
    if (selectedGrpId !== 'GRP_MAIN_17' && selectedGrpId !== 'GRP_CONTRACT_7') {
        var foundGrp = (window.employeeGroups || []).find(function(g) { return g && g.id === selectedGrpId; });
        if (foundGrp && foundGrp.members && foundGrp.members.length > 0) {
            selectedMembers = foundGrp.members;
            isContract = (selectedMembers.length === 7);
        }
    }

    var [startYear, startMonth] = startM.split('-').map(Number);
    var prevBeforeBatch = findPreviousMonthSheet(startYear, startMonth, isContract);
    var carryConfig = extractZigzagConfigFromSheet(prevBeforeBatch);

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

        var generatedData = generateMonthDataZigzag(y, m, selectedMembers, false, carryConfig);
        if (!carryConfig && generatedData._zigzagConfig) {
            carryConfig = generatedData._zigzagConfig;
        }

        var existingIdx = window.scheduleSheets.findIndex(function(s) {
            return s && s.monthKey === monthKey && Boolean(s.isG7GroupSheet) === isContract;
        });
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
    await renderScheduleTable();
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
        var fixedTracker = { coverByShift: { shift2: {}, shift3: {} }, s3Count: {} };
        Object.keys(sheet.data).filter(function(k) { return !k.startsWith('_'); }).sort().forEach(function(dStr) {
            applyFixedShiftsToDayData(sheet.data[dStr], fixedTracker);
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
            badgesHtml += '<span class="w-1.5 h-1.5 rounded-full bg-brand-red ml-1 shrink-0 inline-block pointer-events-none" title="ຫົວໜ້າກະ"></span>';
        }
        if (isSwapped && name) {
            badgesHtml += '<span class="no-print inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-amber-100 text-amber-700 ml-1 shrink-0 shadow-2xs pointer-events-none" title="ປ່ຽນກະມາ">' +
                            '<span class="material-symbols-outlined text-[10px] leading-none">sync_alt</span>' +
                          '</span>';
        }
        if (leaveInfo && name) {
            badgesHtml += '<span class="no-print ml-1 px-1 py-0.2 rounded text-[8px] font-bold bg-rose-100 text-rose-600 shrink-0 no-underline pointer-events-none">ພັກ</span>';
        }

        html += '<div class="grid-cell-box ' + borderR + ' ' + borderB + ' ' + cellBg + ' flex items-center justify-center px-1 text-center transition-all select-none ' + (isAdmin ? 'editable cursor-grab active:cursor-grabbing' : '') + '" ' + clickHandler + dragAttrs + dropAttrs + ' title="' + (name ? 'ກົດແກ້ໄຂ ຫຼື ລາກຊື່ນີ້ໄປສະຫຼັບກະອື່ນ' : 'ຊ່ອງວ່າງ (ລາກຊື່ອື່ນມາໃສ່ໄດ້)') + '">' +
            '<span class="inline-flex items-center justify-center pointer-events-none ' + textClass + '">' +
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

// 12. DROPDOWN & SHEET ACTIONS (ສະແດງສະເພາະຕາຕະລາງຕົວຈິງ)
function renderSheetDropdown() {
    var select = document.getElementById('scheduleSheetSelect');
    if (!select) return;
    select.innerHTML = '';

    var sheets = window.scheduleSheets || [];

    if (sheets.length === 0) {
        var opt = document.createElement('option');
        opt.value = '';
        opt.innerText = 'ບໍ່ພົບຕາຕະລາງໃນ Supabase';
        select.appendChild(opt);
        return;
    }

    sheets.forEach(function(sheet) {
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

    await fetchScheduleSwapsFromCloud();

    var isContract = title.includes('ສັນຍາ');
    var targetMembers = isContract ? getContractStaffList() : getPermanentStaffList();

    var prevSheet = findPreviousMonthSheet(y, m, isContract);
    var carryConfig = extractZigzagConfigFromSheet(prevSheet);
    var generated = generateMonthDataZigzag(y, m, targetMembers, false, carryConfig);

    var activeSheet = getActiveSheet();
    var inheritedNotes = activeSheet?.notes || activeSheet?.data?._meta?.notes || window.defaultNotesTemplate;

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
    await renderScheduleTable();
    showToast('ສຳເລັດ', 'ສ້າງ "' + title + '"' + (carryConfig ? ' (ຕໍ່ເນື່ອງຈາກເດືອນກ່ອນ)' : '') + ' ສຳເລັດ!', 'success');

    await syncScheduleToSupabase(newSheet);
}

// 12.1 ປັບຕາຕະລາງປັດຈຸບັນໃຫ້ຕໍ່ເນື່ອງຈາກເດືອນກ່ອນໜ້າທັນທີ
async function continueCurrentSheetFromPreviousMonth() {
    var sheet = getActiveSheet();
    if (!sheet) {
        showToast('ແຈ້ງເຕືອນ', 'ບໍ່ພົບຕາຕະລາງປັດຈຸບັນ', 'warning');
        return;
    }

    var parts = (sheet.monthKey || '').split('-').map(Number);
    var y = parts[0], m = parts[1];
    if (!y || !m) return;

    await fetchScheduleSwapsFromCloud();

    var isContract = Boolean(sheet.isG7GroupSheet);
    var prevSheet = findPreviousMonthSheet(y, m, isContract);
    if (!prevSheet) {
        showToast('ແຈ້ງເຕືອນ', 'ບໍ່ພົບຕາຕະລາງເດືອນກ່ອນໜ້າໃນລະບົບ', 'warning');
        return;
    }

    var carryConfig = extractZigzagConfigFromSheet(prevSheet);
    if (!carryConfig) {
        showToast('ແຈ້ງເຕືອນ', 'ບໍ່ສາມາດອ່ານລຳດັບຈາກເດືອນກ່ອນໄດ້', 'error');
        return;
    }

    var targetMembers = isContract ? getContractStaffList() : getPermanentStaffList();
    sheet.data = generateMonthDataZigzag(y, m, targetMembers, false, carryConfig);

    try {
        localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
        localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
    } catch(e) {}

    await renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    await syncScheduleToSupabase(sheet);
    showToast('ສຳເລັດ', 'ປັບຕາຕະລາງໃຫ້ຕໍ່ເນື່ອງຈາກເດືອນ ' + prevSheet.monthKey + ' ຮຽບຮ້ອຍ!', 'success');
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

// 13. ຟັງຊັນ RESET ຕາຕະລາງ
async function promptResetSchedule() {
    if (!confirm('ທ່ານຕ້ອງການລ້າງຊື່ທັງໝົດອອກຈາກຕາຕະລາງນີ້ (Reset ເປັນຕາຕະລາງວ່າງ) ແທ້ບໍ່?')) return;
    var sheet = getActiveSheet();
    if (!sheet) return;

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

function promptDeleteCurrentSheet() {
    if ((window.scheduleSheets || []).length === 0) {
        showToast('ແຈ້ງເຕືອນ', 'ບໍ່ມີຕາຕະລາງໃຫ້ລຶບ', 'error');
        return;
    }
    var sheet = getActiveSheet();
    if (!sheet) return;

    if (!confirm('ທ່ານຕ້ອງການລຶບ "' + sheet.title + '" ອອກຈາກລະບົບແທ້ບໍ່?')) return;

    var delId = sheet.id;
    window.scheduleSheets = window.scheduleSheets.filter(function(s) { return String(s.id) !== String(delId); });
    window.activeSheetId = window.scheduleSheets.length > 0 ? window.scheduleSheets[0].id : null;

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
    await renderScheduleTable();
    showToast('ເຜີຍແຜ່ສຳເລັດ', 'ຕາຕະລາງຖືກ Publish ເປັນທາງການແລ້ວ!', 'success');
    await syncScheduleToSupabase(sheet);
}

// 14. REBALANCE SHIFT 3 (ປັບສົມດຸນກະ 3 ແບບບໍ່ກະທົບກະຫຼັກ — ຖ້າປັບບໍ່ໄດ້ຈະແຈ້ງບອກຊັດເຈນ)
async function rebalanceNightShifts() {
    var sheet = getActiveSheet();
    if (!sheet) return;
    var schedData = sheet.data || {};
    var dates = Object.keys(schedData).filter(function(k) { return !k.startsWith('_'); }).sort();
    if (dates.length === 0) {
        showToast('ແຈ້ງເຕືອນ', 'ຕາຕະລາງຍັງວ່າງເປົ່າ', 'info');
        return;
    }

    await fetchScheduleSwapsFromCloud();

    var allUsers = window.users || [];
    var isLeaderUser = function(name) {
        if (!name) return false;
        var u = allUsers.find(function(usr) { return usr && usr.nameLao && isSchedNameMatch(usr.nameLao, name); });
        return Boolean(u && u.isLeader) || ['ແສງດາວ', 'ພອນສະຫວັນ', 'ບຸນປະເສີດ', 'ພັນນິກອນ'].some(function(ln) {
            return isSchedNameMatch(ln, name);
        });
    };

    var isLockedUser = function(name) {
        return (window.fixedShiftsConfig || []).some(function(cfg) {
            return cfg && isSchedNameMatch(cfg.nameLao, name);
        });
    };

    var hasSwapOrLeaveOnDate = function(name, dStr) {
        var swapped = (window.swapHistory || []).some(function(sw) {
            if (!sw) return false;
            var st = String(sw.status || '').toUpperCase();
            var sStart = sw.startDate || sw.start_date;
            var sEnd = sw.endDate || sw.end_date || sStart;
            return st === 'COMPLETED' && dStr >= sStart && dStr <= sEnd &&
                   (isSchedNameMatch(sw.fromName || sw.from_name, name) || isSchedNameMatch(sw.toName || sw.to_name, name));
        });
        if (swapped) return true;
        if (typeof getStaffLeaveInfo === 'function') {
            if (getStaffLeaveInfo(name, 'shift1', dStr) || getStaffLeaveInfo(name, 'shift2', dStr) || getStaffLeaveInfo(name, 'shift3', dStr)) {
                return true;
            }
        }
        return false;
    };

    var firstDateParts = dates[0].split('-').map(Number);
    var firstWeekIdx = getMondayBasedWeekIndex(new Date(Date.UTC(firstDateParts[0], firstDateParts[1] - 1, firstDateParts[2])));

    // 1. ແກ້ໄຂຖ້າວັນທຳມະດາມີຫົວໜ້າກະຊ້ຳກັນ 2 ຄົນໃນກະ 3
    dates.forEach(function(d) {
        var day = schedData[d];
        if (day && !day.isWeekend && !isDateInHolidayRange(d)) {
            var s3 = day.shift3 || [];
            var s2 = day.shift2 || [];
            var lInS3 = s3.filter(function(n) { return isLeaderUser(n); });
            var lInS2 = s2.filter(function(n) { return isLeaderUser(n); });

            if (lInS3.length > 1 && lInS2.length === 0) {
                var extraLeader = lInS3[1];
                var s2StaffIdx = s2.findIndex(function(n) { return n && !isLeaderUser(n) && !isLockedUser(n); });
                if (s2StaffIdx !== -1) {
                    var s2Staff = s2[s2StaffIdx];
                    var idx3 = s3.indexOf(extraLeader);
                    s3[idx3] = s2Staff;
                    s2[s2StaffIdx] = extraLeader;
                }
            }
        }
    });

    var getStats = function(isLeaderGroup) {
        var s3Counts = {};
        var s2Counts = {};
        var s1Counts = {};
        var totalCounts = {};
        var pool = [];

        dates.forEach(function(d) {
            var day = schedData[d] || {};
            ['shift1', 'shift2', 'shift3'].forEach(function(sk) {
                (day[sk] || []).forEach(function(nm) {
                    if (!nm) return;
                    if (isLeaderUser(nm) !== isLeaderGroup) return;
                    if (isLockedUser(nm)) return;
                    if (!pool.some(function(p) { return isSchedNameMatch(p, nm); })) {
                        pool.push(nm);
                        s1Counts[nm] = 0;
                        s2Counts[nm] = 0;
                        s3Counts[nm] = 0;
                        totalCounts[nm] = 0;
                    }
                    var key = pool.find(function(p) { return isSchedNameMatch(p, nm); });
                    totalCounts[key]++;
                    if (sk === 'shift1') s1Counts[key]++;
                    if (sk === 'shift2') s2Counts[key]++;
                    if (sk === 'shift3') s3Counts[key]++;
                });
            });
        });
        return { pool: pool, s1Counts: s1Counts, s2Counts: s2Counts, s3Counts: s3Counts, totalCounts: totalCounts };
    };

    var swapCount = 0;

    var runSafeSameDayBalance = function(isLeaderGroup, maxIter) {
        for (var iter = 0; iter < maxIter; iter++) {
            var st = getStats(isLeaderGroup);
            if (st.pool.length < 2) break;

            var sorted = st.pool.slice().sort(function(a, b) {
                return st.s3Counts[b] - st.s3Counts[a];
            });
            var over = sorted[0];
            var under = sorted[sorted.length - 1];

            if (st.s3Counts[over] - st.s3Counts[under] <= 1) break;

            var bestMove = null;
            var bestScore = -999999;

            for (var di = 0; di < dates.length; di++) {
                var dStr = dates[di];
                var day = schedData[dStr];
                if (!day) continue;

                // ກົດເຫຼັກ 1: ຫ້າມແຕະອາທິດທີ 1 ເພື່ອຮັກສາຄວາມຕໍ່ເນື່ອງຈາກເດືອນກ່ອນໜ້າ
                var dp = dStr.split('-').map(Number);
                var wIdx = getMondayBasedWeekIndex(new Date(Date.UTC(dp[0], dp[1] - 1, dp[2])));
                if (dates.length > 10 && wIdx === firstWeekIdx) continue;

                var idxOver = (day.shift3 || []).findIndex(function(n) { return isSchedNameMatch(n, over); });
                if (idxOver === -1) continue;
                if (hasSwapOrLeaveOnDate(over, dStr)) continue;

                var prevDay = di > 0 ? schedData[dates[di - 1]] : null;
                var nextDay = di < dates.length - 1 ? schedData[dates[di + 1]] : null;

                var overWorkedS3Yesterday = prevDay && (prevDay.shift3 || []).some(function(n) { return isSchedNameMatch(n, over); });
                var underWorksS1Tomorrow = nextDay && (nextDay.shift1 || []).some(function(n) { return isSchedNameMatch(n, under); });
                var underWorksS2Tomorrow = nextDay && (nextDay.shift2 || []).some(function(n) { return isSchedNameMatch(n, under); });

                // ກົດເຫຼັກ 2: ຫ້າມໃຫ້ under ລົງກະ 3 ມື້ນີ້ ຖ້າມື້ອື່ນມີກະ 1
                if (underWorksS1Tomorrow) continue;

                ['shift2', 'shift1'].forEach(function(targetSk) {
                    // ກົດເຫຼັກ 3: ຫ້າມໃຫ້ over ຍ້າຍຈາກກະ 3 ມື້ນີ້ໄປກະ 1 ຖ້າມື້ວານລົງກະ 3
                    if (targetSk === 'shift1' && overWorkedS3Yesterday) return;

                    var tArr = day[targetSk] || [];
                    for (var ti = 0; ti < tArr.length; ti++) {
                        if (!isSchedNameMatch(tArr[ti], under)) continue;
                        if (hasSwapOrLeaveOnDate(under, dStr)) continue;

                        // ກົດເຫຼັກ 4: ບໍ່ສັບຈົນກະ 1 ຫຼື ກະ 2 ຂອງ under ຫຼຸດຜິດປົກກະຕິ
                        if (!isLeaderGroup) {
                            if (targetSk === 'shift1' && st.s1Counts[under] <= 3) continue;
                            if (targetSk === 'shift2' && st.s2Counts[under] <= 3) continue;
                        }

                        var score = 0;
                        if (targetSk === 'shift2') score += 50;
                        if (!overWorkedS3Yesterday) score += 40;
                        if (!underWorksS2Tomorrow) score += 40;
                        if (day.isWeekend || isDateInHolidayRange(dStr)) score += 20;

                        if (score > bestScore) {
                            bestScore = score;
                            bestMove = { dStr: dStr, targetSk: targetSk, idxOver: idxOver, idxUnder: ti };
                        }
                    }
                });
            }

            if (!bestMove) break;

            var mDay = schedData[bestMove.dStr];
            var tmpName = mDay.shift3[bestMove.idxOver];
            mDay.shift3[bestMove.idxOver] = mDay[bestMove.targetSk][bestMove.idxUnder];
            mDay[bestMove.targetSk][bestMove.idxUnder] = tmpName;
            swapCount++;
        }
    };

    if (!sheet.isG7GroupSheet) {
        runSafeSameDayBalance(true, 20);
    }
    runSafeSameDayBalance(false, 100);

    var finalStaffStats = getStats(false);
    var vals = finalStaffStats.pool.map(function(p) { return finalStaffStats.s3Counts[p]; });
    var minV = vals.length ? Math.min.apply(null, vals) : 0;
    var maxV = vals.length ? Math.max.apply(null, vals) : 0;
    var isBalanced = (maxV - minV <= 1);

    if (swapCount > 0) {
        try {
            localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
            localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
        } catch(e) {}

        await renderScheduleTable({ skipSwapSync: true });
        if (typeof window.renderDashboard === 'function') window.renderDashboard();
        if (typeof renderFairnessSummaryData === 'function' && !document.getElementById('fairnessModal')?.classList.contains('hidden')) {
            renderFairnessSummaryData();
        }
        await syncScheduleToSupabase(sheet);
    }

    if (isBalanced) {
        showToast(
            'Rebalance ກະ 3 ສຳເລັດ!',
            'ວິຊາການກະ 3 ສົມດຸນແລ້ວ (' + minV + '–' + maxV + ' ກະ' + (swapCount > 0 ? ', ສັບ ' + swapCount + ' ຈຸດ' : '') + ') ໂດຍບໍ່ກະທົບກະຫຼັກ!',
            'success'
        );
    } else {
        var msg = (swapCount > 0
            ? 'ປັບໄດ້ບາງສ່ວນ (' + swapCount + ' ຈຸດ) ແຕ່ບໍ່ສາມາດປັບກະ 3 ໃຫ້ເທົ່າກັນ (+/- 1) ໄດ້ທັງໝົດ'
            : 'ບໍ່ສາມາດປັບສົມດຸນກະ 3 ໄດ້') +
            ' ເພາະຈະກະທົບຕໍ່ການຈັດການກະຫຼັກ / ເວລາພັກ (ກະ 3 ຕໍ່ກະ 1) ຫຼື ກະອື່ນ (ປັດຈຸບັນກະ 3: ' + minV + '–' + maxV + ' ກະ)';
        showToast('ບໍ່ສາມາດປັບສົມດຸນເພີ່ມໄດ້', msg, 'warning');
    }
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
        filename:     (sheet.title || sheet.data?._meta?.title || 'ຕາຕະລາງປະຈຳການ') + '.pdf',
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
window.findPreviousMonthSheet = findPreviousMonthSheet;
window.getUnswappedDayCopy = getUnswappedDayCopy;
window.extractZigzagConfigFromSheet = extractZigzagConfigFromSheet;
window.continueCurrentSheetFromPreviousMonth = continueCurrentSheetFromPreviousMonth;
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
window.shuffleArray = shuffleArray;
window.handleCellDragStart = handleCellDragStart;
window.handleCellDragEnd = handleCellDragEnd;
window.handleCellDragOver = handleCellDragOver;
window.handleCellDragLeave = handleCellDragLeave;
window.handleCellDrop = handleCellDrop;

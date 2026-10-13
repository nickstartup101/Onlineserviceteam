// ================= ⭐ DAILY OPERATIONAL MONITOR (UNIVERSAL ENGINE SYNC) =================

function isDashNameMatch(a, b) {
    if (!a || !b) return false;
    var clean = function(s) {
        return s.toString().trim().toLowerCase()
            .replace(/^(ທ້າວ|ນາງ|ທ\.|ນ\.)\s*/, '')
            .replace(/\s+/g, '');
    };
    return clean(a) === clean(b);
}

function getTodayLocalDateStr() {
    var now = new Date();
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, '0');
    var d = String(now.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
}

function getStaffPhotoHtml(nameLao, isOffline) {
    var user = (window.users || []).find(function(u) { return isDashNameMatch(u.nameLao, nameLao); });
    if (user && user.photo) {
        var extraClass = isOffline ? 'grayscale opacity-40' : 'border border-slate-300';
        return '<img src="' + user.photo + '" class="w-4 h-4 rounded-full object-cover inline-block mr-1 ' + extraClass + '" alt="' + nameLao + '"/>';
    }
    return '';
}

function isStaffLeader(nameLao) {
    var user = (window.users || []).find(function(u) { return isDashNameMatch(u.nameLao, nameLao); });
    return user ? Boolean(user.isLeader) : false;
}

function normalizeShiftKey(s) {
    if (!s) return null;
    var str = s.toString().toLowerCase().trim();
    if (str.includes('ທຸກກະ') || str.includes('all')) return null;
    if (str.includes('ກະ 1') || str.includes('ກະ1') || str.includes('shift1') || str.includes('shift 1') || str === '1') return 'shift1';
    if (str.includes('ກະ 2') || str.includes('ກະ2') || str.includes('shift2') || str.includes('shift 2') || str === '2') return 'shift2';
    if (str.includes('ກະ 3') || str.includes('ກະ3') || str.includes('shift3') || str.includes('shift 3') || str === '3') return 'shift3';
    return null;
}

function getStaffLeaveInfo(nameLao, shiftKey, targetDate) {
    var leaves = (window.annualBookings || []).filter(function(b) {
        var bStart = b.startDate || b.start_date;
        var bEnd = b.endDate || b.end_date;
        var bStatus = String(b.status || '').toUpperCase();
        return bStatus === 'CONFIRMED' && (targetDate >= bStart && targetDate <= bEnd);
    });

    for (var i = 0; i < leaves.length; i++) {
        var l = leaves[i];
        var lName = l.nameLao || l.name_lao;
        if (isDashNameMatch(lName, nameLao)) {
            var normShift = normalizeShiftKey(l.shift);
            if (!normShift || normShift === shiftKey) {
                return {
                    shift: l.shift || 'ທຸກກະ',
                    reason: l.reason || 'ລາພັກ'
                };
            }
        }
    }
    return null;
}

function getSheetsForMonth(dateStr) {
    var monthKey = dateStr.slice(0, 7);
    var sheets = (window.scheduleSheets || []).filter(function(s) {
        var sMKey = (s.monthKey || s.month_key || '').slice(0, 7);
        return sMKey === monthKey;
    });

    if (sheets.length === 0 && window.activeSheetId) {
        var active = (window.scheduleSheets || []).find(function(s) { return s.id === window.activeSheetId; });
        if (active) sheets = [active];
    }
    return sheets;
}

function openStaffInfoModal(encodedOrRawName) {
    var nameLao = decodeURIComponent(encodedOrRawName || '');
    var user = (window.users || []).find(function(u) {
        return isDashNameMatch(u.nameLao, nameLao) || isDashNameMatch(u.fullName, nameLao) || isDashNameMatch(u.user, nameLao);
    });

    var defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23c01e2e'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

    var photoEl = document.getElementById('staffInfoModalPhoto');
    var leaderBadgeEl = document.getElementById('staffInfoModalLeaderBadge');
    var nameEl = document.getElementById('staffInfoModalName');
    var fullNameEl = document.getElementById('staffInfoModalFullName');
    var codeEl = document.getElementById('staffInfoModalCode');
    var deptEl = document.getElementById('staffInfoModalDept');
    var posEl = document.getElementById('staffInfoModalPos');
    var phoneEl = document.getElementById('staffInfoModalPhone');
    var callBtnEl = document.getElementById('staffInfoModalCallBtn');

    if (user) {
        if (photoEl) photoEl.src = user.photo || defaultAvatar;
        if (leaderBadgeEl) {
            if (user.isLeader) leaderBadgeEl.classList.remove('hidden');
            else leaderBadgeEl.classList.add('hidden');
        }
        if (nameEl) nameEl.innerText = user.nameLao || nameLao;
        if (fullNameEl) fullNameEl.innerText = user.fullName || user.nameLao || '';
        if (codeEl) codeEl.innerText = user.user || 'BCEL';
        if (deptEl) deptEl.innerText = user.dept || user.department || 'ຂະແໜງບໍລິການອອນລາຍ';
        if (posEl) posEl.innerText = user.isLeader ? 'ຫົວໜ້າກະປະຈຳການ (Shift Leader)' : (user.position || 'ພະນັກງານວິຊາການ');

        var phoneStr = (user.phone && user.phone.trim()) ? user.phone.trim() : 'ຍັງບໍ່ໄດ້ລະບຸເບີໂທ';
        if (phoneEl) phoneEl.innerText = phoneStr;
        if (callBtnEl) {
            if (user.phone && user.phone.trim()) {
                callBtnEl.href = 'tel:' + user.phone.replace(/\s+/g, '');
                callBtnEl.classList.remove('opacity-50', 'pointer-events-none');
            } else {
                callBtnEl.href = '#';
                callBtnEl.classList.add('opacity-50', 'pointer-events-none');
            }
        }
    } else {
        if (photoEl) photoEl.src = defaultAvatar;
        if (leaderBadgeEl) leaderBadgeEl.classList.add('hidden');
        if (nameEl) nameEl.innerText = nameLao;
        if (fullNameEl) fullNameEl.innerText = nameLao;
        if (codeEl) codeEl.innerText = '-';
        if (deptEl) deptEl.innerText = 'ຂະແໜງບໍລິການອອນລາຍ';
        if (posEl) posEl.innerText = 'ພະນັກງານວິຊາການ';
        if (phoneEl) phoneEl.innerText = 'ຍັງບໍ່ໄດ້ລະບຸເບີໂທ';
        if (callBtnEl) {
            callBtnEl.href = '#';
            callBtnEl.classList.add('opacity-50', 'pointer-events-none');
        }
    }

    var modal = document.getElementById('staffInfoModal');
    if (modal) modal.classList.remove('hidden');
}

function closeStaffInfoModal() {
    var modal = document.getElementById('staffInfoModal');
    if (modal) modal.classList.add('hidden');
}

async function fetchDashboardDataFromCloud() {
    try {
        var cachedLeaves = localStorage.getItem('ot_annual_bookings');
        if (cachedLeaves) window.annualBookings = JSON.parse(cachedLeaves);
        var cachedSwaps = localStorage.getItem('ot_swap_history');
        if (cachedSwaps) window.swapHistory = JSON.parse(cachedSwaps);
    } catch(e) {}

    if (window.supabaseClient) {
        try {
            var resLeaves = await window.supabaseClient.from('annual_bookings').select('*');
            if (!resLeaves.error && resLeaves.data) {
                window.annualBookings = resLeaves.data.map(function(d) {
                    return {
                        id: d.id,
                        user: d.user_code || d.user,
                        nameLao: d.name_lao || d.nameLao,
                        startDate: d.start_date || d.startDate,
                        endDate: d.end_date || d.endDate,
                        days: d.days,
                        shift: d.shift || 'ທຸກກະ',
                        reason: d.reason || '',
                        status: String(d.status || '').toUpperCase()
                    };
                });
                localStorage.setItem('ot_annual_bookings', JSON.stringify(window.annualBookings));
            }

            var resSwaps = await window.supabaseClient.from('shift_swaps').select('*');
            if (!resSwaps.error && resSwaps.data) {
                window.swapHistory = resSwaps.data.map(function(d) {
                    var isCover = Boolean(d.reason && d.reason.indexOf('[COVER]') !== -1);
                    return {
                        id: d.id,
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
                localStorage.setItem('ot_swap_history', JSON.stringify(window.swapHistory));
            }
        } catch(err) {
            console.warn("Cloud sync exception in dashboard:", err);
        }
    }
}

// ⭐ 1. RENDER DASHBOARD (ເຊື່ອມຕໍ່ສູດດຽວກັນກັບ SCHEDULE.JS 100%)
async function renderDashboard() {
    var dateInput = document.getElementById('dashDateInput');
    
    if (dateInput && (!dateInput.value || !window._dashUserHasPickedDate)) {
        dateInput.value = getTodayLocalDateStr();
    }

    var targetDate = (dateInput && dateInput.value) ? dateInput.value : getTodayLocalDateStr();

    updateDayTypeBadge(targetDate);
    updateLiveShiftIndicators(targetDate);

    await fetchDashboardDataFromCloud();

    var sheets = getSheetsForMonth(targetDate);
    
    // ⭐ ຮຽກໃຊ້ Universal State Engine ຈາກ schedule.js ເພື່ອໃຫ້ກົງກັນ 100%
    sheets.forEach(function(sheet) {
        if (typeof syncAllApprovedSwapsIntoSheet === 'function') {
            syncAllApprovedSwapsIntoSheet(sheet);
        }
    });

    var swapsToday = (window.swapHistory || []).filter(function(s) {
        var sStart = s.startDate || s.start_date;
        var sEnd = s.endDate || s.end_date;
        var sStatus = String(s.status || '').toUpperCase();
        return sStatus === 'COMPLETED' && (targetDate >= sStart && targetDate <= sEnd);
    });

    var swappedStaffSet = new Set();
    swapsToday.forEach(function(s) {
        swappedStaffSet.add(s.fromName || s.from_name);
        swappedStaffSet.add(s.toName || s.to_name);
    });

    renderShiftCards(targetDate, sheets, swappedStaffSet);
    renderLeavesToday(targetDate);
    renderDashboardSwapsWithChains(targetDate, swapsToday);
}

function updateLiveShiftIndicators(targetDate) {
    var todayStr = getTodayLocalDateStr();
    var isToday = (targetDate === todayStr);
    var hour = new Date().getHours();

    var s1Live = isToday && (hour >= 8 && hour < 16);
    var s2Live = isToday && (hour >= 12 && hour < 20);
    var s3Live = isToday && (hour >= 20 || hour < 8);

    var lb1 = document.getElementById('liveBadge1');
    var lb2 = document.getElementById('liveBadge2');
    var lb3 = document.getElementById('liveBadge3');

    if (lb1) { lb1.classList.toggle('hidden', !s1Live); lb1.classList.toggle('inline-flex', s1Live); }
    if (lb2) { lb2.classList.toggle('hidden', !s2Live); lb2.classList.toggle('inline-flex', s2Live); }
    if (lb3) { lb3.classList.toggle('hidden', !s3Live); lb3.classList.toggle('inline-flex', s3Live); }
}

function updateDayTypeBadge(dateStr) {
    var badge = document.getElementById('dayTypeBadge');
    if (!badge) return;

    var parts = dateStr.split('-').map(Number);
    var dObj = new Date(parts[0], parts[1] - 1, parts[2]);
    var dayOfWeek = dObj.getDay();
    var isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
    var isHol = typeof isDateInHolidayRange === 'function' ? isDateInHolidayRange(dateStr) : false;

    if (isHol) {
        badge.className = "px-3.5 py-1.5 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1.5";
        badge.innerHTML = '<span class="material-symbols-outlined text-sm text-purple-700">celebration</span> ວັນພັກພິເສດ (Holiday)';
    } else if (isWeekend) {
        badge.className = "px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5";
        badge.innerHTML = '<span class="material-symbols-outlined text-sm text-amber-700">wb_twilight</span> ວັນພັກ (Weekend)';
    } else {
        badge.className = "px-3.5 py-1.5 rounded-full text-xs font-bold bg-red-50 text-brand-red border border-red-200 flex items-center gap-1.5";
        badge.innerHTML = '<span class="material-symbols-outlined text-sm text-brand-red">wb_sunny</span> ວັນທຳມະດາ (Weekday)';
    }

    var actDateLabel = document.getElementById('dashActivityDateLabel');
    if (actDateLabel) {
        actDateLabel.innerText = 'ວັນທີ ' + (parts[2] < 10 ? '0' + parts[2] : parts[2]) + '/' + (parts[1] < 10 ? '0' + parts[1] : parts[1]) + '/' + parts[0];
    }
}

function renderShiftCards(targetDate, sheets, swappedStaffSet) {
    var shifts = [
        { key: 'shift1', containerId: 'shift1Names', badgeId: 'shift1CountBadge', timeTextId: 'shift1TimeText', defaultTime: '08:00 - 16:00', weekendTime: '08:00 - 13:30' },
        { key: 'shift2', containerId: 'shift2Names', badgeId: 'shift2CountBadge', timeTextId: 'shift2TimeText', defaultTime: '12:00 - 20:00', weekendTime: '13:30 - 19:00' },
        { key: 'shift3', containerId: 'shift3Names', badgeId: 'shift3CountBadge', timeTextId: 'shift3TimeText', defaultTime: '20:00 - 08:00', weekendTime: '19:00 - 08:00' }
    ];

    var dObj = new Date(targetDate + 'T00:00:00Z');
    var isWeekendOrHol = (dObj.getUTCDay() === 0 || dObj.getUTCDay() === 6) || (typeof isDateInHolidayRange === 'function' && isDateInHolidayRange(targetDate));

    shifts.forEach(function(s) {
        var container = document.getElementById(s.containerId);
        var badge = document.getElementById(s.badgeId);
        var timeText = document.getElementById(s.timeTextId);

        if (timeText) {
            timeText.innerText = isWeekendOrHol ? s.weekendTime : s.defaultTime;
        }

        if (!container) return;
        container.innerHTML = '';

        var totalActiveStaffCount = 0;
        var totalLeaveStaffCount = 0;

        if (sheets.length === 0) {
            container.innerHTML = '<p class="text-slate-400 text-xs italic py-2">ບໍ່ພົບຕາຕະລາງໃນເດືອນນີ້</p>';
            if (badge) badge.innerText = '0 ຄົນ';
            return;
        }

        sheets.forEach(function(sheet) {
            var dayData = (sheet.data && sheet.data[targetDate]) ? sheet.data[targetDate] : null;
            var staffInSlot = dayData ? (dayData[s.key] || []) : [];

            var sheetActiveCount = 0;
            var sheetLeaveCount = 0;

            staffInSlot.forEach(function(name) {
                var leaveInfo = getStaffLeaveInfo(name, s.key, targetDate);
                if (leaveInfo) {
                    sheetLeaveCount++;
                    totalLeaveStaffCount++;
                } else {
                    sheetActiveCount++;
                    totalActiveStaffCount++;
                }
            });

            if (staffInSlot.length > 0 || sheets.length > 1) {
                var sheetTitle = sheet.title || sheet.data?._meta?.title || 'ຕາຕະລາງປະຈຳການ';
                var leaveNoteInHeader = sheetLeaveCount > 0 ? ' <span class="text-rose-500 font-normal">(-' + sheetLeaveCount + ' ພັກ)</span>' : '';
                var sheetHeader = '<div class="pt-1.5 pb-1 flex justify-between items-center text-[11px] text-slate-500 font-bold border-b border-slate-100">' +
                                    '<span class="truncate max-w-[210px] flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-brand-red"></span> ' + sheetTitle + '</span>' +
                                    '<span class="text-slate-600 text-[10px] font-bold">' + sheetActiveCount + ' ຄົນ' + leaveNoteInHeader + '</span>' +
                                  '</div>';

                var pillsHtml = '<div class="flex flex-wrap gap-1.5 pt-1.5 pb-2">';
                staffInSlot.forEach(function(name) {
                    var isLeader = isStaffLeader(name);
                    var isSwapped = swappedStaffSet.has(name);
                    var leaveInfo = getStaffLeaveInfo(name, s.key, targetDate);
                    var isOffline = Boolean(leaveInfo);
                    var avatarHtml = getStaffPhotoHtml(name, isOffline);
                    var safeName = encodeURIComponent(name);

                    if (isOffline) {
                        pillsHtml += '<button type="button" onclick="openStaffInfoModal(\'' + safeName + '\')" class="inline-flex items-center px-2 py-0.5 rounded-xl text-xs border border-dashed border-slate-300 bg-slate-100/70 text-slate-400 opacity-40 grayscale cursor-pointer hover:opacity-75 transition" title="ລາພັກມື້ນີ້ (' + (leaveInfo.reason || 'ລາພັກ') + ')">' +
                                        avatarHtml +
                                        '<span class="line-through decoration-slate-400">' + name + '</span>' +
                                        '<span class="text-[9px] bg-rose-100 text-rose-600 font-bold px-1 py-0.2 rounded ml-1">ພັກ</span>' +
                                     '</button>';
                    } else {
                        var leaderDot = isLeader ? '<span class="w-1.5 h-1.5 rounded-full bg-brand-red ml-0.5" title="ຫົວໜ້າກະ"></span>' : '';
                        var swapIcon = isSwapped 
                            ? '<span class="material-symbols-outlined text-[13px] text-amber-600 ml-0.5 leading-none align-middle" title="ປ່ຽນກະມາ">sync_alt</span>' 
                            : '';

                        var borderClass = isSwapped ? 'border-amber-300 bg-amber-50/50 hover:bg-amber-100/60' : 'border-slate-200 bg-slate-50 hover:bg-slate-100';
                        var textClass = isLeader ? 'text-brand-red font-bold' : 'text-slate-800 font-semibold';

                        pillsHtml += '<button type="button" onclick="openStaffInfoModal(\'' + safeName + '\')" class="inline-flex items-center px-2.5 py-1 rounded-xl text-xs border shadow-2xs cursor-pointer hover:border-brand-red hover:scale-[1.03] transition ' + borderClass + ' ' + textClass + '" title="ກົດເພື່ອເບິ່ງຂໍ້ມູນພະນັກງານ">' +
                                        avatarHtml + '<span>' + name + '</span>' + leaderDot + swapIcon +
                                     '</button>';
                    }
                });
                pillsHtml += '</div>';

                container.innerHTML += sheetHeader + pillsHtml;
            }
        });

        if (badge) {
            var leaveBadgeTag = totalLeaveStaffCount > 0 ? ' <span class="text-[10px] text-rose-500 font-normal">(-' + totalLeaveStaffCount + ' ພັກ)</span>' : '';
            badge.innerHTML = totalActiveStaffCount + ' ຄົນ' + leaveBadgeTag;
        }
    });
}

function renderLeavesToday(targetDate) {
    var container = document.getElementById('dashLeavesContainer');
    if (!container) return;
    container.innerHTML = '';

    var leaves = (window.annualBookings || []).filter(function(b) {
        var bStart = b.startDate || b.start_date;
        var bEnd = b.endDate || b.end_date;
        var bStatus = String(b.status || '').toUpperCase();
        return bStatus === 'CONFIRMED' && (targetDate >= bStart && targetDate <= bEnd);
    });

    if (leaves.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-xs italic py-1 font-lao">ບໍ່ມີພະນັກງານລາພັກໃນວັນທີນີ້</p>';
        return;
    }

    leaves.forEach(function(l) {
        var staffName = l.nameLao || l.name_lao || 'ພະນັກງານ';
        var safeName = encodeURIComponent(staffName);

        container.innerHTML += '<div onclick="openStaffInfoModal(\'' + safeName + '\')" class="p-2.5 bg-red-50/60 hover:bg-red-50 border border-red-100 rounded-xl flex justify-between items-center text-xs font-lao cursor-pointer transition">' +
            '<div>' +
                '<span class="font-bold text-brand-red hover:underline">' + staffName + '</span>' +
                '<span class="text-slate-500 text-[11px] ml-2">[' + (l.shift || 'ທຸກກະ') + ']</span>' +
                (l.reason ? '<p class="text-[10px] text-slate-400 italic mt-0.5">"' + l.reason + '"</p>' : '') +
            '</div>' +
            '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-brand-red flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">flight_takeoff</span> ລາພັກ</span>' +
        '</div>';
    });
}

function renderDashboardSwapsWithChains(targetDate, swapsToday) {
    var container = document.getElementById('dashSwapsContainer');
    if (!container) return;

    if (!swapsToday || swapsToday.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-xs italic py-1 font-lao">ບໍ່ມີການປ່ຽນກະໃນວັນທີນີ້</p>';
        return;
    }

    var countMap = {};
    swapsToday.forEach(function(s) {
        var pFrom = s.fromName || s.from_name;
        var pTo = s.toName || s.to_name;
        countMap[pFrom] = (countMap[pFrom] || 0) + 1;
        countMap[pTo] = (countMap[pTo] || 0) + 1;
    });

    var formatShiftTag = function(shift) {
        if (!shift) return '';
        if (shift.includes('shift1') || shift.includes('ກະ 1')) return 'ກະ 1';
        if (shift.includes('shift2') || shift.includes('ກະ 2')) return 'ກະ 2';
        if (shift.includes('shift3') || shift.includes('ກະ 3')) return 'ກະ 3';
        return shift;
    };

    var html = '';

    html += '<div class="flex justify-between items-center pb-1 mb-1">' +
                '<span class="text-[11px] text-slate-500 font-bold">ສຳເລັດ ' + swapsToday.length + ' ລາຍການ</span>' +
                '<button type="button" onclick="openSwapChainInspectorModal(\'' + targetDate + '\')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold shadow-xs flex items-center gap-1.5 cursor-pointer transition">' +
                    '<span class="material-symbols-outlined text-[14px] text-amber-400">alt_route</span>' +
                    '<span>ເບິ່ງເສັ້ນທາງການປ່ຽນກະທຸກຄົນ</span>' +
                '</button>' +
            '</div>';

    swapsToday.forEach(function(s) {
        var pFrom = s.fromName || s.from_name;
        var pTo = s.toName || s.to_name;
        var isChained = (countMap[pFrom] > 1 || countMap[pTo] > 1);
        var sA = formatShiftTag(s.fromShift || s.from_shift);
        var sB = formatShiftTag(s.toShift || s.to_shift);

        var remarkTag = (sA && sB) 
            ? '<span class="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">' +
                '<span>' + sA + '</span>' +
                '<span class="material-symbols-outlined text-[11px] text-slate-400">sync_alt</span>' +
                '<span>' + sB + '</span>' +
              '</span>'
            : '';

        var chainedBadge = isChained 
            ? '<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200">' +
                '<span class="material-symbols-outlined text-[12px] leading-none">autorenew</span>' +
                '<span>ປ່ຽນຕໍ່ເນື່ອງ</span>' +
              '</span>' 
            : '';

        html += '<div onclick="openSwapChainInspectorModal(\'' + targetDate + '\')" class="p-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 rounded-2xl flex justify-between items-center gap-2 cursor-pointer transition shadow-2xs font-lao group">' +
                    '<div class="flex-1 min-w-0">' +
                        '<div class="flex items-center gap-1.5 flex-wrap text-xs">' +
                            '<span class="font-bold text-slate-800 group-hover:text-brand-red transition">' + pFrom + '</span>' +
                            '<span class="material-symbols-outlined text-[13px] text-slate-400">arrow_forward</span>' +
                            '<span class="font-bold text-slate-800 group-hover:text-brand-red transition">' + pTo + '</span>' +
                            remarkTag +
                            chainedBadge +
                        '</div>' +
                        (s.reason ? '<p class="text-[10px] text-slate-400 truncate mt-0.5 italic">"' + s.reason + '"</p>' : '') +
                    '</div>' +
                    '<div class="flex items-center gap-1 shrink-0">' +
                        '<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">' +
                            '<span class="material-symbols-outlined text-[12px]">check_circle</span>' +
                            '<span>ປ່ຽນສຳເລັດ</span>' +
                        '</span>' +
                        '<span class="material-symbols-outlined text-slate-300 group-hover:text-slate-600 text-sm">chevron_right</span>' +
                    '</div>' +
                '</div>';
    });

    container.innerHTML = html;
}

function openSwapChainInspectorModal(dateStr) {
    var sheets = getSheetsForMonth(dateStr);
    var swapsToday = (window.swapHistory || []).filter(function(s) {
        var sStart = s.startDate || s.start_date;
        var sEnd = s.endDate || s.end_date;
        var sStatus = String(s.status || '').toUpperCase();
        return sStatus === 'COMPLETED' && (dateStr >= sStart && dateStr <= sEnd);
    }).sort(function(a, b) { return (a.id || 0) - (b.id || 0); });

    if (swapsToday.length === 0) {
        showToast('ແຈ້ງເຕືອນ', 'ບໍ່ມີປະຫວັດການປ່ຽນກະໃນວັນທີນີ້', 'info');
        return;
    }

    var involvedStaff = new Set();
    swapsToday.forEach(function(s) {
        involvedStaff.add(s.fromName || s.from_name);
        involvedStaff.add(s.toName || s.to_name);
    });

    var modal = document.getElementById('swapChainInspectorModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'swapChainInspectorModal';
        modal.className = 'fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 font-lao';
        document.body.appendChild(modal);
    }

    var timelineHtml = '';
    swapsToday.forEach(function(s, idx) {
        var pFrom = s.fromName || s.from_name;
        var pTo = s.toName || s.to_name;
        timelineHtml += '<div class="flex items-start gap-3 relative">' +
                            '<div class="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 z-10">' + (idx + 1) + '</div>' +
                            '<div class="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs">' +
                                '<div class="flex justify-between items-center mb-1">' +
                                    '<span class="font-bold text-slate-800 flex items-center gap-1.5">' +
                                        pFrom +
                                        '<span class="material-symbols-outlined text-[13px] text-slate-400">sync_alt</span>' +
                                        pTo +
                                    '</span>' +
                                    '<span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">' +
                                        '<span class="material-symbols-outlined text-[11px]">check_circle</span> ສຳເລັດ' +
                                    '</span>' +
                                '</div>' +
                                '<p class="text-slate-600 text-[11px] leading-relaxed">' +
                                    '• <strong>' + pFrom + '</strong> ສະລັບກະກັບ <strong>' + pTo + '</strong> (' + (s.fromShift || s.from_shift || 'ກະເດີມ') + ' ↔ ' + (s.toShift || s.to_shift || 'ກະເດີມ') + ')' +
                                '</p>' +
                                (s.reason ? '<p class="text-slate-400 text-[10px] mt-1 italic">ໝາຍເຫດ: "' + s.reason + '"</p>' : '') +
                            '</div>' +
                        '</div>';
    });

    var finalLocationHtml = '';
    involvedStaff.forEach(function(name) {
        var currentSlot = 'ພັກຜ່ອນ (OFF)';
        var slotTime = '-';
        var slotBadgeClass = 'bg-slate-100 text-slate-600 border-slate-200';
        var safeName = encodeURIComponent(name);

        sheets.forEach(function(sheet) {
            var dayData = (sheet.data && sheet.data[dateStr]) ? sheet.data[dateStr] : null;
            if (dayData) {
                if ((dayData.shift1 || []).includes(name)) {
                    currentSlot = 'ກະ 1';
                    slotTime = '08:00 - 16:00';
                    slotBadgeClass = 'bg-red-50 text-brand-red border-red-200';
                } else if ((dayData.shift2 || []).includes(name)) {
                    currentSlot = 'ກະ 2';
                    slotTime = '12:00 - 20:00';
                    slotBadgeClass = 'bg-purple-50 text-purple-800 border-purple-200';
                } else if ((dayData.shift3 || []).includes(name)) {
                    currentSlot = 'ກະ 3';
                    slotTime = '20:00 - 08:00';
                    slotBadgeClass = 'bg-slate-800 text-white border-slate-900';
                }
            }
        });

        finalLocationHtml += '<div onclick="closeSwapChainInspectorModal(); openStaffInfoModal(\'' + safeName + '\');" class="p-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl flex justify-between items-center shadow-2xs cursor-pointer transition">' +
                                '<div>' +
                                    '<h5 class="font-bold text-slate-800 text-xs flex items-center gap-1">' + getStaffPhotoHtml(name) + '<span>' + name + '</span></h5>' +
                                    '<p class="text-[10px] text-slate-400 mt-0.5">ເວລາເຂົ້າວຽກ: ' + slotTime + '</p>' +
                                '</div>' +
                                '<span class="px-2.5 py-1 rounded-xl text-[11px] font-bold border ' + slotBadgeClass + '">' + currentSlot + '</span>' +
                             '</div>';
    });

    modal.innerHTML = '<div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col font-lao animate-in fade-in zoom-in-95 duration-150">' +
        '<div class="p-4 md:p-5 bg-slate-800 text-white flex justify-between items-center shrink-0">' +
            '<div class="flex items-center gap-2">' +
                '<span class="material-symbols-outlined text-amber-400 text-xl">alt_route</span>' +
                '<div>' +
                    '<h3 class="font-bold text-sm">ເສັ້ນທາງການປ່ຽນກະ & ຜົນຮັບຕົວຈິງ</h3>' +
                    '<p class="text-[10px] text-slate-300">ປະຈຳວັນທີ: ' + dateStr + '</p>' +
                '</div>' +
            '</div>' +
            '<button type="button" onclick="closeSwapChainInspectorModal()" class="text-white/80 hover:text-white cursor-pointer"><span class="material-symbols-outlined text-xl">close</span></button>' +
        '</div>' +
        '<div class="p-5 space-y-4 overflow-y-auto flex-1 text-xs">' +
            '<div>' +
                '<h4 class="font-bold text-slate-700 mb-2.5 flex items-center gap-1.5"><span class="material-symbols-outlined text-base text-brand-red">timeline</span> ລຳດັບການສະລັບກະ (Swap Steps):</h4>' +
                '<div class="space-y-2.5 relative pl-1">' + timelineHtml + '</div>' +
            '</div>' +
            '<div class="pt-3 border-t border-slate-100">' +
                '<h4 class="font-bold text-slate-700 mb-2.5 flex items-center gap-1.5"><span class="material-symbols-outlined text-base text-emerald-600">verified</span> ຕຳແໜ່ງກະສຸດທ້າຍຕົວຈິງມື້ນີ້ (Final Destination Shifts):</h4>' +
                '<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">' + finalLocationHtml + '</div>' +
            '</div>' +
        '</div>' +
        '<div class="p-3 bg-slate-50 border-t flex justify-end">' +
            '<button type="button" onclick="closeSwapChainInspectorModal()" class="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs cursor-pointer">ປິດໜ້າຕ່າງ</button>' +
        '</div>' +
    '</div>';

    modal.classList.remove('hidden');
}

function closeSwapChainInspectorModal() {
    var modal = document.getElementById('swapChainInspectorModal');
    if (modal) modal.classList.add('hidden');
}

document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'dashDateInput') {
        window._dashUserHasPickedDate = true;
        renderDashboard();
    }
});

var _origTabForDash = window.switchTab;
window.switchTab = function(tab) {
    if (typeof _origTabForDash === 'function') _origTabForDash(tab);
    if (tab === 'dashboard') {
        window._dashUserHasPickedDate = false;
        setTimeout(renderDashboard, 50);
    }
};

document.addEventListener('DOMContentLoaded', function() {
    window._dashUserHasPickedDate = false;
    setTimeout(renderDashboard, 100);
});

window.renderDashboard = renderDashboard;
window.fetchDashboardDataFromCloud = fetchDashboardDataFromCloud;
window.getTodayLocalDateStr = getTodayLocalDateStr;
window.openStaffInfoModal = openStaffInfoModal;
window.closeStaffInfoModal = closeStaffInfoModal;
window.getStaffLeaveInfo = getStaffLeaveInfo;
window.updateLiveShiftIndicators = updateLiveShiftIndicators;
window.updateDayTypeBadge = updateDayTypeBadge;
window.renderShiftCards = renderShiftCards;
window.renderLeavesToday = renderLeavesToday;
window.renderDashboardSwapsWithChains = renderDashboardSwapsWithChains;
window.openSwapChainInspectorModal = openSwapChainInspectorModal;
window.closeSwapChainInspectorModal = closeSwapChainInspectorModal;

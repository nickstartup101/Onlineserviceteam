// ================= ⭐ DAILY OPERATIONAL MONITOR & AUTO-SWAP ENGINE =================

// 0. HELPER ປຽບທຽບຊື່ແບບ STRICT EXACT MATCH
function isDashNameMatch(a, b) {
    if (!a || !b) return false;
    var cleanA = a.toString().trim().toLowerCase().replace(/\s+/g, '');
    var cleanB = b.toString().trim().toLowerCase().replace(/\s+/g, '');
    return cleanA === cleanB;
}

// 0.1 HELPER ດຶງຮູບ Avatar
function getStaffPhotoHtml(nameLao) {
    var user = (window.users || []).find(function(u) { return isDashNameMatch(u.nameLao, nameLao); });
    if (user && user.photo) {
        return '<img src="' + user.photo + '" class="w-4 h-4 rounded-full object-cover inline-block mr-1 border border-slate-300" alt="' + nameLao + '"/>';
    }
    return '';
}

// 0.2 HELPER ກວດສອບຫົວໜ້າກະ
function isStaffLeader(nameLao) {
    var user = (window.users || []).find(function(u) { return isDashNameMatch(u.nameLao, nameLao); });
    return user ? Boolean(user.isLeader) : false;
}

// 0.3 ແປງຊື່ກະໃຫ້ເປັນ Standard Key ('shift1', 'shift2', 'shift3')
function normalizeShiftKey(s) {
    if (!s) return null;
    var str = s.toString().toLowerCase();
    if (str.includes('1') || str.includes('shift1') || str.includes('ກະ 1')) return 'shift1';
    if (str.includes('2') || str.includes('shift2') || str.includes('ກະ 2')) return 'shift2';
    if (str.includes('3') || str.includes('shift3') || str.includes('ກະ 3')) return 'shift3';
    return null;
}

// 0.4 ດຶງ Sheet ຂອງເດືອນທີ່ກົງກັບວັນທີ
function getSheetsForMonth(dateStr) {
    var monthKey = dateStr.slice(0, 7); // YYYY-MM
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

// ⭐ 0.5 ລະບົບ AUTO-APPLY SWAPS ອັດຕະໂນມັດ 100% (ແກ້ໄຂບັນຫາຊື່ບໍ່ສະລັບ)
function autoApplyCompletedSwapsForDate(targetDate) {
    var swapsToday = (window.swapHistory || []).filter(function(s) {
        return s.status === 'COMPLETED' && (targetDate >= s.startDate && targetDate <= s.endDate);
    });

    if (swapsToday.length === 0) return false;

    var sheets = (window.scheduleSheets || []).filter(function(s) {
        return Boolean(s && s.data && s.data[targetDate]);
    });

    if (sheets.length === 0) return false;

    var hasAnyChange = false;

    swapsToday.forEach(function(req) {
        var personA = req.fromName;
        var personB = req.toName;
        var targetShiftA = normalizeShiftKey(req.toShift);   // ກະທີ່ personA ຕ້ອງໄປຢູ່
        var targetShiftB = normalizeShiftKey(req.fromShift); // ກະທີ່ personB ຕ້ອງໄປຢູ່
        var isCover = (req.swapType === 'COVER');

        sheets.forEach(function(sheet) {
            var day = sheet.data[targetDate];
            if (!day) return;

            if (isCover) {
                ['shift1', 'shift2', 'shift3'].forEach(function(sName) {
                    var arr = day[sName] || [];
                    for (var i = 0; i < arr.length; i++) {
                        if (isDashNameMatch(arr[i], personB)) {
                            arr[i] = personA;
                            hasAnyChange = true;
                        }
                    }
                });
            } else {
                // ຊອກຫາຕຳແໜ່ງປັດຈຸບັນຂອງທັງສອງຄົນ
                var findSlot = function(name) {
                    for (var sName of ['shift1', 'shift2', 'shift3']) {
                        var arr = day[sName] || [];
                        for (var i = 0; i < arr.length; i++) {
                            if (isDashNameMatch(arr[i], name)) {
                                return { shift: sName, index: i };
                            }
                        }
                    }
                    return null;
                };

                var posA = findSlot(personA);
                var posB = findSlot(personB);

                // ⭐ ກວດສອບ: ຖ້າທັງສອງຄົນຍັງຢູ່ບ່ອນເກົ່າ (ຍັງບໍ່ທັນສະລັບ) ໃຫ້ສັ່ງສະລັບທັນທີ
                if (posA && posB && posA.shift !== posB.shift) {
                    var needsSwap = false;

                    if (targetShiftA && targetShiftB) {
                        // ຖ້າ personA ຍັງບໍ່ທັນຮອດ targetShiftA ສະແດງວ່າຍັງບໍ່ທັນສະລັບ
                        if (posA.shift !== targetShiftA && posB.shift !== targetShiftB) {
                            needsSwap = true;
                        }
                    } else {
                        needsSwap = true;
                    }

                    if (needsSwap) {
                        day[posA.shift][posA.index] = personB;
                        day[posB.shift][posB.index] = personA;
                        hasAnyChange = true;
                    }
                }
            }
        });
    });

    if (hasAnyChange) {
        try {
            localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
            localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));
            if (typeof saveAll === 'function') saveAll();
        } catch(e) {}
    }

    return hasAnyChange;
}

// ⭐ 1. ຟັງຊັນຫຼັກ RENDER DASHBOARD
function renderDashboard() {
    var dateInput = document.getElementById('dashDateInput');
    var targetDate = dateInput ? dateInput.value : '';
    if (!targetDate) {
        targetDate = new Date().toISOString().split('T')[0];
        if (dateInput) dateInput.value = targetDate;
    }

    // 1. ອັບເດດ Badge ປະເພດວັນ
    updateDayTypeBadge(targetDate);

    // ⭐ 2. ສັ່ງ Auto-Apply ທຸກຄູ່ທີ່ປ່ຽນກະສຳເລັດໃຫ້ສະລັບບ່ອນນັ່ງທັນທີ!
    autoApplyCompletedSwapsForDate(targetDate);

    // 3. ດຶງ Sheet ແລະ ລາຍການ Swap ຂອງວັນນີ້
    var sheets = getSheetsForMonth(targetDate);
    var swapsToday = (window.swapHistory || []).filter(function(s) {
        return s.status === 'COMPLETED' && (targetDate >= s.startDate && targetDate <= s.endDate);
    });

    var swappedStaffSet = new Set();
    swapsToday.forEach(function(s) {
        swappedStaffSet.add(s.fromName);
        swappedStaffSet.add(s.toName);
    });

    // 4. Render 3 ກະ (Shift 1, Shift 2, Shift 3)
    renderShiftCards(targetDate, sheets, swappedStaffSet);

    // 5. Render ພະນັກງານລາພັກມື້ນີ້
    renderLeavesToday(targetDate);

    // 6. Render ລາຍການປ່ຽນກະ & Swap Chain Inspector
    renderDashboardSwapsWithChains(targetDate, swapsToday);
}

// 2. ອັບເດດ BADGE ວັນທີ
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
        actDateLabel.innerText = 'ວັນທີ ' + parts[2] + '/' + (parts[1] < 10 ? '0' + parts[1] : parts[1]) + '/' + parts[0];
    }
}

// 3. RENDER CARDS ທັງ 3 ກະ (ໂທມິກ & ສົມຊາຍ ຈະສະລັບບ່ອນກັນທັນທີ)
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
        var totalShiftCount = 0;

        if (sheets.length === 0) {
            container.innerHTML = '<p class="text-slate-400 text-xs italic py-2">ບໍ່ພົບຕາຕະລາງໃນເດືອນນີ້</p>';
            if (badge) badge.innerText = '0 ຄົນ';
            return;
        }

        sheets.forEach(function(sheet) {
            var dayData = (sheet.data && sheet.data[targetDate]) ? sheet.data[targetDate] : null;
            var staffInSlot = dayData ? (dayData[s.key] || []) : [];
            totalShiftCount += staffInSlot.length;

            if (staffInSlot.length > 0 || sheets.length > 1) {
                var sheetTitle = sheet.title || sheet.data?._meta?.title || 'ຕາຕະລາງປະຈຳການ';

                var sheetHeader = '<div class="pt-1.5 pb-1 flex justify-between items-center text-[11px] text-slate-500 font-bold border-b border-slate-100">' +
                                    '<span class="truncate max-w-[210px] flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-brand-red"></span> ' + sheetTitle + '</span>' +
                                    '<span class="text-slate-400 text-[10px]">' + staffInSlot.length + ' ຄົນ</span>' +
                                  '</div>';

                var pillsHtml = '<div class="flex flex-wrap gap-1.5 pt-1.5 pb-2">';
                staffInSlot.forEach(function(name) {
                    var isLeader = isStaffLeader(name);
                    var isSwapped = swappedStaffSet.has(name);
                    var avatarHtml = getStaffPhotoHtml(name);

                    var leaderDot = isLeader ? '<span class="w-1.5 h-1.5 rounded-full bg-brand-red ml-0.5" title="ຫົວໜ້າກະ"></span>' : '';
                    var swapIcon = isSwapped ? '<span class="text-amber-600 text-[11px] ml-0.5 font-bold" title="ປ່ຽນກະມາ">⇄</span>' : '';

                    var borderClass = isSwapped ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 bg-slate-50';
                    var textClass = isLeader ? 'text-brand-red font-bold' : 'text-slate-800 font-semibold';

                    pillsHtml += '<span class="inline-flex items-center px-2.5 py-1 rounded-xl text-xs border shadow-2xs ' + borderClass + ' ' + textClass + '">' +
                                    avatarHtml + '<span>' + name + '</span>' + leaderDot + swapIcon +
                                 '</span>';
                });
                pillsHtml += '</div>';

                container.innerHTML += sheetHeader + pillsHtml;
            }
        });

        if (totalShiftCount === 0) {
            container.innerHTML = '<p class="text-slate-400 text-xs italic py-2">ບໍ່ມີພະນັກງານໃນກະນີ້</p>';
        }

        if (badge) badge.innerText = totalShiftCount + ' ຄົນ';
    });
}

// 4. RENDER ພະນັກງານລາພັກມື້ນີ້
function renderLeavesToday(targetDate) {
    var container = document.getElementById('dashLeavesContainer');
    if (!container) return;
    container.innerHTML = '';

    var leaves = (window.annualBookings || []).filter(function(b) {
        return b.status === 'CONFIRMED' && (targetDate >= b.startDate && targetDate <= b.endDate);
    });

    if (leaves.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-xs italic py-1 font-lao">ບໍ່ມີພະນັກງານລາພັກໃນວັນທີນີ້</p>';
        return;
    }

    leaves.forEach(function(l) {
        container.innerHTML += '<div class="p-2.5 bg-red-50/60 border border-red-100 rounded-xl flex justify-between items-center text-xs font-lao">' +
            '<div>' +
                '<span class="font-bold text-brand-red">' + l.nameLao + '</span>' +
                '<span class="text-slate-500 text-[11px] ml-2">[' + (l.shift || 'ທຸກກະ') + ']</span>' +
                (l.reason ? '<p class="text-[10px] text-slate-400 italic mt-0.5">"' + l.reason + '"</p>' : '') +
            '</div>' +
            '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-brand-red">ລາພັກ</span>' +
        '</div>';
    });
}

// ⭐ 5. RENDER ລາຍການປ່ຽນກະ & ປຸ່ມ INSPECTOR
function renderDashboardSwapsWithChains(targetDate, swapsToday) {
    var container = document.getElementById('dashSwapsContainer');
    if (!container) return;

    if (!swapsToday || swapsToday.length === 0) {
        container.innerHTML = '<p class="text-slate-400 text-xs italic py-1 font-lao">ບໍ່ມີການປ່ຽນກະໃນວັນທີນີ້</p>';
        return;
    }

    var countMap = {};
    swapsToday.forEach(function(s) {
        countMap[s.fromName] = (countMap[s.fromName] || 0) + 1;
        countMap[s.toName] = (countMap[s.toName] || 0) + 1;
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
                '<button type="button" onclick="openSwapChainInspectorModal(\'' + targetDate + '\')" class="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold shadow-xs flex items-center gap-1 cursor-pointer transition">' +
                    '<span class="material-symbols-outlined text-[13px] text-amber-400">route</span> ເບິ່ງເສັ້ນທາງການປ່ຽນກະທຸກຄົນ' +
                '</button>' +
            '</div>';

    swapsToday.forEach(function(s) {
        var isChained = (countMap[s.fromName] > 1 || countMap[s.toName] > 1);
        var sA = formatShiftTag(s.fromShift);
        var sB = formatShiftTag(s.toShift);
        var remarkTag = (sA && sB) ? ('[' + sA + ' ⇄ ' + sB + ']') : '';

        var chainedBadge = isChained 
            ? '<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200">🔄 ປ່ຽນຕໍ່ເນື່ອງ</span>' 
            : '';

        html += '<div onclick="openSwapChainInspectorModal(\'' + targetDate + '\')" class="p-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 rounded-2xl flex justify-between items-center gap-2 cursor-pointer transition shadow-2xs font-lao group">' +
                    '<div class="flex-1 min-w-0">' +
                        '<div class="flex items-center gap-1.5 flex-wrap text-xs">' +
                            '<span class="font-bold text-slate-800 group-hover:text-brand-red transition">' + s.fromName + '</span>' +
                            '<span class="text-slate-400 text-[10px]">➔</span>' +
                            '<span class="font-bold text-slate-800 group-hover:text-brand-red transition">' + s.toName + '</span>' +
                            (remarkTag ? '<span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">' + remarkTag + '</span>' : '') +
                            chainedBadge +
                        '</div>' +
                        (s.reason ? '<p class="text-[10px] text-slate-400 truncate mt-0.5 italic">"' + s.reason + '"</p>' : '') +
                    '</div>' +
                    '<div class="flex items-center gap-1 shrink-0">' +
                        '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">ປ່ຽນສຳເລັດ</span>' +
                        '<span class="material-symbols-outlined text-slate-300 group-hover:text-slate-600 text-sm">chevron_right</span>' +
                    '</div>' +
                '</div>';
    });

    container.innerHTML = html;
}

// ⭐ 6. MODAL INSPECTOR ສະແດງ TIMELINE & ຕຳແໜ່ງສຸດທ້າຍ
function openSwapChainInspectorModal(dateStr) {
    var sheets = getSheetsForMonth(dateStr);
    var swapsToday = (window.swapHistory || []).filter(function(s) {
        return s.status === 'COMPLETED' && (dateStr >= s.startDate && dateStr <= s.endDate);
    }).sort(function(a, b) { return (a.id || 0) - (b.id || 0); });

    if (swapsToday.length === 0) {
        showToast('ແຈ້ງເຕືອນ', 'ບໍ່ມີປະຫວັດການປ່ຽນກະໃນວັນທີນີ້', 'info');
        return;
    }

    var involvedStaff = new Set();
    swapsToday.forEach(function(s) {
        involvedStaff.add(s.fromName);
        involvedStaff.add(s.toName);
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
        timelineHtml += '<div class="flex items-start gap-3 relative">' +
                            '<div class="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 z-10">' + (idx + 1) + '</div>' +
                            '<div class="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs">' +
                                '<div class="flex justify-between items-center mb-1">' +
                                    '<span class="font-bold text-slate-800">' + s.fromName + ' ⇄ ' + s.toName + '</span>' +
                                    '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">ສຳເລັດ</span>' +
                                '</div>' +
                                '<p class="text-slate-600 text-[11px] leading-relaxed">' +
                                    '• <strong>' + s.fromName + '</strong> ສະລັບກະກັບ <strong>' + s.toName + '</strong> (' + (s.fromShift || 'ກະເດີມ') + ' ↔ ' + (s.toShift || 'ກະເດີມ') + ')' +
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

        finalLocationHtml += '<div class="p-3 bg-white border border-slate-200 rounded-2xl flex justify-between items-center shadow-2xs">' +
                                '<div>' +
                                    '<h5 class="font-bold text-slate-800 text-xs">' + name + '</h5>' +
                                    '<p class="text-[10px] text-slate-400 mt-0.5">ເວລາເຂົ້າວຽກ: ' + slotTime + '</p>' +
                                '</div>' +
                                '<span class="px-2.5 py-1 rounded-xl text-[11px] font-bold border ' + slotBadgeClass + '">' + currentSlot + '</span>' +
                             '</div>';
    });

    modal.innerHTML = '<div class="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col font-lao animate-in fade-in zoom-in-95 duration-150">' +
        '<div class="p-4 md:p-5 bg-slate-800 text-white flex justify-between items-center shrink-0">' +
            '<div class="flex items-center gap-2">' +
                '<span class="material-symbols-outlined text-amber-400 text-xl">route</span>' +
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

// ⭐ Auto-load
var _origTabForDash = window.switchTab;
window.switchTab = function(tab) {
    if (typeof _origTabForDash === 'function') _origTabForDash(tab);
    if (tab === 'dashboard') {
        setTimeout(renderDashboard, 50);
    }
};

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(renderDashboard, 100);
});

// ຜູກ Functions ເຂົ້າ Window
window.renderDashboard = renderDashboard;
window.autoApplyCompletedSwapsForDate = autoApplyCompletedSwapsForDate;
window.updateDayTypeBadge = updateDayTypeBadge;
window.renderShiftCards = renderShiftCards;
window.renderLeavesToday = renderLeavesToday;
window.renderDashboardSwapsWithChains = renderDashboardSwapsWithChains;
window.openSwapChainInspectorModal = openSwapChainInspectorModal;
window.closeSwapChainInspectorModal = closeSwapChainInspectorModal;

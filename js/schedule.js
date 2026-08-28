// ================= ⭐ FIX SHIFT & SMART FAIR ROTATION ENGINE =================

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
                    <span class="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">🔒 ${shiftLabel}</span>
                </div>
                <button type="button" onclick="removeFixedShift(${idx})" class="text-brand-red hover:underline font-bold text-xs">ລຶບ</button>
            </div>
        `;
    });
}

function handleAddFixedShift() {
    var name = document.getElementById('fixedShiftUserSelect').value;
    var shift = document.getElementById('fixedShiftSlotSelect').value;

    window.fixedShiftsConfig = window.fixedShiftsConfig.filter(f => f.nameLao !== name);
    window.fixedShiftsConfig.push({ nameLao: name, fixedShift: shift });

    saveAll();
    renderActiveFixedShiftsList();
    showToast('ສຳເລັດ', `ລັອກ "${name}" ໄວ້ ${shift} ແລ້ວ!`, 'success');
}

function removeFixedShift(idx) {
    window.fixedShiftsConfig.splice(idx, 1);
    saveAll();
    renderActiveFixedShiftsList();
    showToast('ສຳເລັດ', 'ຍົກເລີກການລັອກກະແລ້ວ', 'success');
}

// 1. ສູດ 7 ຄົນ ພ້ອມຮອງຮັບ Fix Shift (ກະຈາຍກະດຶກໃຫ້ຄົນທີ່ເຫຼືອແບບ Fair)
function generate7PersonFlexZigzag(year, month, staffList) {
    var daysCount = new Date(year, month, 0).getDate();
    var data = {};

    var fixedStaff = staffList.filter(n => window.fixedShiftsConfig.some(f => f.nameLao === n));
    var rotatingStaff = staffList.filter(n => !window.fixedShiftsConfig.some(f => f.nameLao === n));

    var epochDate = new Date(Date.UTC(2026, 0, 1));

    for (var i = 1; i <= daysCount; i++) {
        var dayNum = i < 10 ? '0' + i : '' + i;
        var mNum = month < 10 ? '0' + month : '' + month;
        var dStr = `${year}-${mNum}-${dayNum}`;
        var currentDate = new Date(Date.UTC(year, month - 1, i));

        var totalDays = Math.floor((currentDate.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24));
        var dayOfWeek = (currentDate.getUTCDay() + 6) % 7;

        var s1List = [];
        var s2List = [];
        var s3List = [];

        // 1. ເອົາຄົນທີ່ຖືກ Fix ໃສ່ປະຈຳກ່ອນ
        fixedStaff.forEach(fName => {
            var cfg = window.fixedShiftsConfig.find(f => f.nameLao === fName);
            if (cfg.fixedShift === 'shift1') s1List.push(fName);
            else if (cfg.fixedShift === 'shift2') s2List.push(fName);
            else if (cfg.fixedShift === 'shift3') s3List.push(fName);
        });

        // 2. ໝູນວຽນຄົນທີ່ເຫຼືອໃສ່ຊ່ອງທີ່ຍັງຕ້ອງການ
        var rotN = rotatingStaff.length;
        var dailyRotSlots = [];
        for (var p = 0; p < rotN; p++) {
            var assignedSlot = (p + totalDays) % rotN;
            dailyRotSlots[assignedSlot] = rotatingStaff[p];
        }

        // ຕື່ມກະດຶກ (ກະ 3) ໃຫ້ເຕັມກ່ອນສະເໝີ
        if (s3List.length < 1 && dailyRotSlots.length > 0) s3List.push(dailyRotSlots[0] || '');
        if (s2List.length < 1 && dailyRotSlots.length > 1) s2List.push(dailyRotSlots[1] || '');
        for (var k = 2; k < dailyRotSlots.length; k++) {
            if (s1List.length < 3 && dailyRotSlots[k]) s1List.push(dailyRotSlots[k]);
        }

        data[dStr] = {
            isWeekend: (dayOfWeek === 5 || dayOfWeek === 6),
            shift1: s1List,
            shift2: s2List,
            shift3: s3List
        };
    }
    return data;
}

// 2. ສູດທີມໃຫຍ່ທົ່ວໄປ
function generateStandardMonthDataZigzag(year, month, staffList) {
    var daysCount = new Date(year, month, 0).getDate();
    var data = {};

    var fixedStaff = staffList.filter(n => window.fixedShiftsConfig.some(f => f.nameLao === n));
    var rotatingStaff = staffList.filter(n => !window.fixedShiftsConfig.some(f => f.nameLao === n));

    var leaderNames = rotatingStaff.filter(name => {
        var u = window.users.find(usr => usr.nameLao === name);
        return u && u.isLeader;
    });

    if (leaderNames.length < 4) leaderNames = ['ແສງດາວ', 'ພອນສະຫວັນ', 'ບຸນປະເສີດ', 'ພັນນິກອນ'].filter(n => rotatingStaff.includes(n));
    var regularStaff = rotatingStaff.filter(n => !leaderNames.includes(n));
    var N = regularStaff.length;

    var s3Count = Math.max(1, Math.floor(N / 3));
    var s2Count = Math.max(1, Math.floor(N / 3));
    var s1Count = N - s3Count - s2Count;

    for (var i = 1; i <= daysCount; i++) {
        var dayNum = i < 10 ? '0' + i : '' + i;
        var mNum = month < 10 ? '0' + month : '' + month;
        var dStr = `${year}-${mNum}-${dayNum}`;
        var dateObj = new Date(Date.UTC(year, month - 1, i));
        var dayOfWeek = dateObj.getUTCDay();
        var isWeekend = (dayOfWeek === 6 || dayOfWeek === 0 || isDateInHolidayRange(dStr));
        var W = getGlobalWeekIndex(dateObj);

        var s1List = [];
        var s2List = [];
        var s3List = [];

        fixedStaff.forEach(fName => {
            var cfg = window.fixedShiftsConfig.find(f => f.nameLao === fName);
            if (cfg.fixedShift === 'shift1') s1List.push(fName);
            else if (cfg.fixedShift === 'shift2') s2List.push(fName);
            else if (cfg.fixedShift === 'shift3') s3List.push(fName);
        });

        var l_1A = leaderNames.length > 0 ? leaderNames[(0 + W) % leaderNames.length] : '';
        var l_1B = leaderNames.length > 1 ? leaderNames[(1 + W) % leaderNames.length] : '';
        var l_S2 = leaderNames.length > 2 ? leaderNames[(2 + W) % leaderNames.length] : '';
        var l_S3 = leaderNames.length > 3 ? leaderNames[(3 + W) % leaderNames.length] : '';

        var shiftOffset = (W * s3Count) % (N || 1);
        var rotatedStaff = [];
        for (var r = 0; r < N; r++) rotatedStaff.push(regularStaff[(r + shiftOffset) % N]);

        var staff_S3 = rotatedStaff.slice(0, s3Count);
        var staff_S2 = rotatedStaff.slice(s3Count, s3Count + s2Count);
        var staff_S1 = rotatedStaff.slice(s3Count + s2Count, N);

        if (isWeekend) {
            var isSat = (dayOfWeek === 6);
            data[dStr] = {
                isWeekend: true,
                shift1: [...s1List, isSat ? l_1A : l_1B, staff_S1[0] || ''].filter(Boolean),
                shift2: [...s2List, isSat ? l_S2 : staff_S2[0] || ''].filter(Boolean),
                shift3: [...s3List, isSat ? l_S3 : staff_S3[0] || ''].filter(Boolean)
            };
        } else {
            data[dStr] = {
                isWeekend: false,
                shift1: [...s1List, l_1A, l_1B, ...staff_S1].filter(Boolean),
                shift2: [...s2List, l_S2, ...staff_S2].filter(Boolean),
                shift3: [...s3List, l_S3, ...staff_S3].filter(Boolean)
            };
        }
    }
    return data;
}

function generateMonthDataZigzag(year, month, targetGroupMembers) {
    var staffList = [];
    if (targetGroupMembers && targetGroupMembers.length > 0) {
        staffList = [...targetGroupMembers];
    } else {
        staffList = window.users.filter(u => u.role !== 'SUPER_ADMIN').map(u => u.nameLao);
    }

    if (staffList.length === 7) return generate7PersonFlexZigzag(year, month, staffList);
    else return generateStandardMonthDataZigzag(year, month, staffList);
}

function executeGroupRandomSchedule() {
    var sheet = getActiveSheet();
    var [year, month] = sheet.monthKey.split('-').map(Number);
    var selectedGrpId = document.getElementById('randomSelectedGroupId')?.value || 'ALL';
    
    var members = null;
    if (selectedGrpId !== 'ALL') {
        var found = window.employeeGroups.find(g => g.id === selectedGrpId);
        if (found && found.members) members = found.members;
    }

    sheet.data = generateMonthDataZigzag(year, month, members);
    saveAll();
    document.getElementById('randomGroupSelectModal')?.classList.add('hidden');
    renderScheduleTable();
    renderDashboard();
    if (window.currentUser && window.currentUser.role === 'SUPER_ADMIN') renderAdminAllStaffReport();
    else renderUserCurrentWeekWorkspace();
    showToast('Zigzag Rotation ສຳເລັດ', `ສ້າງຕາຕະລາງຮອບວຽນ Zigzag ແບບເທົ່າທຽມສຳເລັດ!`, 'success');
}

function executeBatchMonthGenerate() {
    var startM = document.getElementById('batchStartMonth')?.value;
    var count = parseInt(document.getElementById('batchMonthCount')?.value) || 6;
    if (!startM) return;

    var [startYear, startMonth] = startM.split('-').map(Number);
    var currentSheet = getActiveSheet();

    var selectedMembers = null;
    var currentGrp = window.employeeGroups.find(g => currentSheet.title.includes(g.name));
    if (currentGrp) selectedMembers = currentGrp.members;

    for (var c = 0; c < count; c++) {
        var targetDate = new Date(startYear, startMonth - 1 + c, 1);
        var y = targetDate.getFullYear();
        var m = targetDate.getMonth() + 1;
        var mStr = m < 10 ? '0' + m : '' + m;
        var monthKey = `${y}-${mStr}`;
        var title = `ຕາຕະລາງປະຈຳການບໍລິການອອນໄລປະຈຳເດືອນ ${mStr}/${y}`;

        var existingSheet = window.scheduleSheets.find(s => s.monthKey === monthKey);
        var generatedData = generateMonthDataZigzag(y, m, selectedMembers);

        if (existingSheet) {
            existingSheet.data = generatedData;
        } else {
            window.scheduleSheets.push({
                id: 'sheet-' + Date.now() + '-' + c,
                monthKey: monthKey,
                title: title,
                notes: defaultNotesTemplate,
                status: 'DRAFT', // ຕັ້ງເປັນ Draft ສຳລັບເບິ່ງລ່ວງໜ້າ
                data: generatedData
            });
        }
    }

    window.activeSheetId = window.scheduleSheets.find(s => s.monthKey === `${startYear}-${startMonth < 10 ? '0' + startMonth : startMonth}`)?.id || window.scheduleSheets[0].id;
    saveAll();
    document.getElementById('batchMonthModal')?.classList.add('hidden');
    renderScheduleTable();
    renderDashboard();
    showToast('ສຳເລັດ', `ສ້າງຕາຕະລາງລ່ວງໜ້າ ${count} ເດືອນຮຽບຮ້ອຍແລ້ວ!`, 'success');
}

// ຕາຕະລາງສະແດງຜົນ + Watermark Banner + Cell Highlight
function renderScheduleTable() {
    renderSheetDropdown();
    renderScheduleStaffRoster();
    var sheet = getActiveSheet();
    var scheduleData = sheet.data || {};
    var [year, month] = sheet.monthKey.split('-').map(Number);
    var daysCount = new Date(year, month, 0).getDate();

    document.getElementById('scheduleTableTitle').innerText = sheet.title;
    document.getElementById('scheduleNotesDisplay').innerText = sheet.notes || defaultNotesTemplate;

    // ອັບເດດ Status Banner
    var banner = document.getElementById('scheduleStatusBanner');
    var badge = document.getElementById('scheduleStatusBadge');
    var modCountText = document.getElementById('modifiedCellCountText');

    var isOfficial = sheet.status === 'PUBLISHED';
    if (isOfficial) {
        banner.className = "px-6 py-2.5 bg-emerald-50 border-b border-emerald-200 flex justify-between items-center text-xs";
        badge.className = "font-bold text-emerald-800 flex items-center gap-2";
        badge.innerHTML = `<span class="material-symbols-outlined text-sm text-emerald-600">verified</span> ✅ ຕາຕະລາງທາງການ (Published Official)`;
    } else {
        banner.className = "px-6 py-2.5 bg-amber-100/90 border-b border-amber-300 flex justify-between items-center text-xs";
        badge.className = "font-bold text-amber-900 flex items-center gap-2";
        badge.innerHTML = `<span class="material-symbols-outlined text-sm text-amber-700">warning</span> ⚠️ ສະບັບຮ່າງລ່ວງໜ້າ (ຍັງບໍ່ເປັນທາງການ - ສຳລັບວາງແຜນພັກຜ່ອນ)`;
    }

    var sheetLogs = window.scheduleAuditLogs.filter(l => l.sheetId === sheet.id);
    if (modCountText) {
        modCountText.innerText = sheetLogs.length > 0 ? `✏️ ມີການດັດແກ້ຫຼັງ Publish: ${sheetLogs.length} ຈຸດ` : '';
    }

    var tbody = document.getElementById('scheduleTableBody');
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
                <td class="p-0">${renderPixelExcelGrid(dStr, 'shift1', dayData.shift1 || [], isWeekendOrHol ? 1 : 2, isWeekendOrHol ? 3 : Math.max(3, Math.ceil((dayData.shift1 || []).length / 2)), isAdmin, sheet.id)}</td>
                <td class="p-0">${renderPixelExcelGrid(dStr, 'shift2', dayData.shift2 || [], isWeekendOrHol ? 1 : 2, isWeekendOrHol ? 3 : Math.max(3, Math.ceil((dayData.shift2 || []).length / 2)), isAdmin, sheet.id)}</td>
                <td class="p-0">${renderPixelExcelGrid(dStr, 'shift3', dayData.shift3 || [], isWeekendOrHol ? 1 : 2, isWeekendOrHol ? 3 : Math.max(2, Math.ceil((dayData.shift3 || []).length / 2)), isAdmin, sheet.id)}</td>
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
        var isLeader = window.users.find(u => u.nameLao === name && u.isLeader);
        var clickHandler = isAdmin ? `onclick="openCellModal('${date}', '${shift}', ${idx}, '${name}')"` : '';

        // ກວດສອບວ່າຊ່ອງນີ້ເຄີຍຖືກດັດແກ້ຫຼັງ Publish ບໍ່
        var isModified = window.scheduleAuditLogs.some(l => l.sheetId === sheetId && l.date === date && l.shift === shift && l.newName === name);
        var highlightClass = isModified ? 'bg-amber-200/80 font-bold text-amber-950 border-amber-400 ring-1 ring-amber-400' : '';

        var borderR = ((idx + 1) % cols !== 0) ? 'border-r border-black' : '';
        var borderB = (idx < (rows - 1) * cols) ? 'border-b border-black' : '';

        html += `
            <div class="grid-cell-box ${borderR} ${borderB} ${isAdmin ? 'editable' : ''} ${highlightClass} ${isLeader ? 'text-brand-red font-semibold' : 'text-slate-800'}" ${clickHandler} title="${isModified ? '✏️ ຊ່ອງນີ້ມີການປັບປ່ຽນຫຼັງ Publish' : ''}">
                ${name} ${isModified ? '<span class="text-[9px] ml-0.5">✏️</span>' : ''}
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

    // ຖ້າຕາຕະລາງ Publish ໄປແລ້ວ ຕ້ອງຖາມເຫດຜົນ (Remark)
    if (sheet.status === 'PUBLISHED' && currentName !== nameLao) {
        var reason = prompt(`⚠️ ຕາຕະລາງນີ້ຖືກ Publish ແລ້ວ!\nກະລຸນາໃສ່ເຫດຜົນການປ່ຽນແປງ (${currentName || 'ວ່າງ'} ➔ ${nameLao}):`, 'ປ່ຽນແທນຍ້ອນພະນັກງານຕິດທຸລະກິດກະທັນຫັນ');
        if (reason === null) return; // ຍົກເລີກ

        window.scheduleAuditLogs.unshift({
            id: Date.now(),
            sheetId: sheet.id,
            sheetTitle: sheet.title,
            date: date,
            shift: shift,
            oldName: currentName || '(ວ່າງ)',
            newName: nameLao,
            reason: reason || 'ບໍ່ໄດ້ລະບຸເຫດຜົນ',
            adminName: window.currentUser.fullName || 'Admin',
            timestamp: new Date().toLocaleString('lo-LA')
        });
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
        var reason = prompt(`⚠️ ຕາຕະລາງນີ້ຖືກ Publish ແລ້ວ!\nກະລຸນາໃສ່ເຫດຜົນການລຶບ ${currentName} ອອກ:`, 'ຍົກເລີກກະປະຈຳການ');
        if (reason === null) return;

        window.scheduleAuditLogs.unshift

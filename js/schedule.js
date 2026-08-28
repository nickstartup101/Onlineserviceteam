// ================= ⭐ FAIR ZIGZAG SCHEDULE ENGINE =================

// 1. ຈັດການລັອກກະປະຈຳ (Fix Shift)
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

// 2. ສູດສຳລັບທີມ 7 ຄົນ
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
        var dayOfWeek = (currentDate.getUTCDay() + 6) % 7;

        var dailySlots = [];
        for (var p = 0; p < N; p++) {
            var assignedSlot = (p + totalDays) % N;
            dailySlots[assignedSlot] = staffList[p];
        }

        data[dStr] = {
            isWeekend: (dayOfWeek === 5 || dayOfWeek === 6),
            shift1: [dailySlots[2] || '', dailySlots[3] || '', dailySlots[4] || ''],
            shift2: [dailySlots[1] || ''],
            shift3: [dailySlots[0] || '']
        };
    }
    return data;
}

// 3. ສູດສຳລັບທີມ 17 ຄົນ (4 ຫົວໜ້າ + 13 ພະນັກງານ)
function generate17PersonLeadersAndStaffZigzag(year, month, staffList) {
    var daysCount = new Date(year, month, 0).getDate();
    var data = {};

    var fixedStaff = staffList.filter(n => window.fixedShiftsConfig.some(f => f.nameLao === n));
    var rotatingStaff = staffList.filter(n => !window.fixedShiftsConfig.some(f => f.nameLao === n));

    var leaderNames = rotatingStaff.filter(name => {
        var u = window.users.find(usr => usr.nameLao === name);
        return u && u.isLeader;
    });

    if (leaderNames.length < 4) {
        leaderNames = ['ແສງດາວ', 'ພອນສະຫວັນ', 'ບຸນປະເສີດ', 'ພັນນິກອນ'].filter(n => rotatingStaff.includes(n));
    }
    var regularStaff = rotatingStaff.filter(n => !leaderNames.includes(n));
    var numRegular = regularStaff.length;

    var weekendCounter = 0;

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

        if (isWeekend) {
            weekendCounter++;
            var isSat = (dayOfWeek === 6);

            var weekendLeaderS1 = isSat ? l_1A : l_1B;
            var weekendLeaderS2 = l_S2;
            var weekendLeaderS3 = l_S3;

            var p1 = regularStaff[(weekendCounter * 3 + 0) % numRegular];
            var p2 = regularStaff[(weekendCounter * 3 + 1) % numRegular];
            var p3 = regularStaff[(weekendCounter * 3 + 2) % numRegular];

            data[dStr] = {
                isWeekend: true,
                shift1: [...s1List, weekendLeaderS1, p1].filter(Boolean),
                shift2: [...s2List, weekendLeaderS2, p2].filter(Boolean),
                shift3: [...s3List, weekendLeaderS3, p3].filter(Boolean)
            };
        } else {
            var shiftOffset = (W * 3) % numRegular;
            var rotatedStaff = [];
            for (var r = 0; r < numRegular; r++) {
                rotatedStaff.push(regularStaff[(r + shiftOffset) % numRegular]);
            }

            var staff_S3 = rotatedStaff.slice(0, 3);
            var staff_S2 = rotatedStaff.slice(3, 8);
            var staff_S1 = rotatedStaff.slice(8, 13);

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

// 4. Dispatcher
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
    showToast('Zigzag Rotation ສຳເລັດ', `ສ້າງຕາຕະລາງຮອບວຽນ Zigzag ສຳເລັດ!`, 'success');
}

// ================= ⭐ 5. ລະບົບສ້າງຕາຕະລາງລ່ວງໜ້າຫຼາຍເດືອນ (BATCH GENERATOR - FIXED) =================
function openBatchMonthModal() {
    var select = document.getElementById('batchTargetGroupSelect');
    if (select) {
        select.innerHTML = `<option value="ALL">⭐ ພະນັກງານທັງໝົດ (All Staff)</option>`;
        (window.employeeGroups || []).forEach(grp => {
            select.innerHTML += `<option value="${grp.id}">👥 ${grp.name} (${grp.members.length} ຄົນ)</option>`;
        });
    }
    document.getElementById('batchMonthModal')?.classList.remove('hidden');
}

function executeBatchMonthGenerate() {
    var startM = document.getElementById('batchStartMonth')?.value;
    var count = parseInt(document.getElementById('batchMonthCount')?.value) || 6;
    var selectedGrpId = document.getElementById('batchTargetGroupSelect')?.value || 'ALL';

    if (!startM) {
        showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາເລືອກເດືອນເລີ່ມຕົ້ນ', 'error');
        return;
    }

    var selectedMembers = null;
    var groupNameTag = '';
    if (selectedGrpId !== 'ALL') {
        var foundGrp = window.employeeGroups.find(g => g.id === selectedGrpId);
        if (foundGrp) {
            selectedMembers = foundGrp.members;
            groupNameTag = ` (${foundGrp.name})`;
        }
    }

    var [startYear, startMonth] = startM.split('-').map(Number);
    var firstGeneratedSheetId = null;

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
        if (existingIdx !== -1) {
            window.scheduleSheets[existingIdx].data = generatedData;
            window.scheduleSheets[existingIdx].title = title;
        } else {
            window.scheduleSheets.push({
                id: sheetId,
                monthKey: monthKey,
                title: title,
                notes: defaultNotesTemplate,
                status: 'DRAFT', // ຕັ້ງເປັນສະບັບຮ່າງລ່ວງໜ້າ
                data: generatedData
            });
        }

        if (c === 0) firstGeneratedSheetId = sheetId;
    }

    if (firstGeneratedSheetId) window.activeSheetId = firstGeneratedSheetId;

    saveAll();
    document.getElementById('batchMonthModal')?.classList.add('hidden');
    renderSheetDropdown(); // ອັບເດດ Dropdown ທັນທີ!
    renderScheduleTable();
    renderDashboard();
    showToast('ສຳເລັດ', `ສ້າງຕາຕະລາງຕໍ່ເນື່ອງ ${count} ເດືອນຮຽບຮ້ອຍແລ້ວ!`, 'success');
}

function renderScheduleTable() {
    renderSheetDropdown();
    renderScheduleStaffRoster();
    var sheet = getActiveSheet();
    var scheduleData = sheet.data || {};
    var [year, month] = sheet.monthKey.split('-').map(Number);
    var daysCount = new Date(year, month, 0).getDate();

    document.getElementById('scheduleTableTitle').innerText = sheet.title;
    document.getElementById('scheduleNotesDisplay').innerText = sheet.notes || defaultNotesTemplate;

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

    if (sheet.status === 'PUBLISHED' && currentName !== nameLao) {
        var reason = prompt(`⚠️ ຕາຕະລາງນີ້ຖືກ Publish ແລ້ວ!\nກະລຸນາໃສ່ເຫດຜົນການປ່ຽນແປງ (${currentName || 'ວ່າງ'} ➔ ${nameLao}):`, 'ປ່ຽນແທນຍ້ອນພະນັກງານຕິດທຸລະກິດກະທັນຫັນ');
        if (reason === null) return;

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

        window.scheduleAuditLogs.unshift({
            id: Date.now(),
            sheetId: sheet.id,
            sheetTitle: sheet.title,
            date: date,
            shift: shift,
            oldName: currentName,
            newName: '(ວ່າງ)',
            reason: reason || 'ລຶບອອກຈາກກະ',
            adminName: window.currentUser.fullName || 'Admin',
            timestamp: new Date().toLocaleString('lo-LA')
        });
    }

    if (sheet.data[date]?.[shift]) {
        sheet.data[date][shift][index] = '';
        saveAll();
        closeCellModal();
        renderScheduleTable();
    }
}

function renderSheetDropdown() {
    var select = document.getElementById('scheduleSheetSelect');
    if (!select) return;
    select.innerHTML = '';
    window.scheduleSheets.forEach(sheet => {
        var opt = document.createElement('option');
        opt.value = sheet.id;
        opt.innerText = (sheet.status === 'PUBLISHED' ? '✅ ' : '⚠️ [Draft] ') + sheet.title;
        if (sheet.id === window.activeSheetId) opt.selected = true;
        select.appendChild(opt);
    });
}

function changeActiveSheet() {
    window.activeSheetId = document.getElementById('scheduleSheetSelect').value;
    saveAll();
    renderScheduleTable();
    renderDashboard();
    if (window.currentUser && window.currentUser.role === 'SUPER_ADMIN') renderAdminAllStaffReport();
    else renderUserCurrentWeekWorkspace();
}

function openNewSheetModal() { document.getElementById('newSheetTitleInput').value = ''; document.getElementById('newSheetModal')?.classList.remove('hidden'); }
function handleCreateNewSheet() {
    var month = document.getElementById('newSheetMonthInput').value;
    var title = document.getElementById('newSheetTitleInput').value.trim() || `ຕາຕະລາງປະຈຳການ ${month}`;
    var [y, m] = month.split('-').map(Number);
    var newId = 'sheet-' + Date.now();
    var generated = generateMonthDataZigzag(y, m, null);
    window.scheduleSheets.push({ id: newId, monthKey: month, title: title, notes: defaultNotesTemplate, status: 'DRAFT', data: generated });
    window.activeSheetId = newId;
    saveAll();
    document.getElementById('newSheetModal')?.classList.add('hidden');
    renderSheetDropdown();
    renderScheduleTable();
    showToast('ສຳເລັດ', `ສ້າງ "${title}" ສຳເລັດ!`, 'success');
}

function openEditSheetInfoModal() {
    var sheet = getActiveSheet();
    document.getElementById('editSheetTitleInput').value = sheet.title;
    document.getElementById('editSheetNotesInput').value = sheet.notes || defaultNotesTemplate;
    document.getElementById('editSheetInfoModal')?.classList.remove('hidden');
}

function handleSaveSheetInfo() {
    var sheet = getActiveSheet();
    sheet.title = document.getElementById('editSheetTitleInput').value.trim();
    sheet.notes = document.getElementById('editSheetNotesInput').value.trim();
    saveAll();
    document.getElementById('editSheetInfoModal')?.classList.add('hidden');
    renderSheetDropdown();
    renderScheduleTable();
    showToast('ສຳເລັດ', 'ບັນທຶກການແກ້ໄຂແລ້ວ', 'success');
}

function promptResetSchedule() {
    askConfirm('ຣີເຊັດຕາຕະລາງ', 'ທ່ານຕ້ອງການຣີເຊັດຕາຕະລາງນີ້ທັງໝົດແທ້ບໍ່?', () => {
        var sheet = getActiveSheet();
        sheet.data = {};
        saveAll();
        renderScheduleTable();
        showToast('ສຳເລັດ', 'ຣີເຊັດຕາຕະລາງແລ້ວ', 'success');
    }, 'delete_sweep', 'Reset');
}

function saveDraft() { getActiveSheet().status = 'DRAFT'; saveAll(); renderSheetDropdown(); renderScheduleTable(); showToast('ສຳເລັດ', 'ບັນທຶກສະບັບຮ່າງ (Draft) ສຳເລັດ', 'success'); }
function publishSchedule() { getActiveSheet().status = 'PUBLISHED'; saveAll(); renderSheetDropdown(); renderScheduleTable(); showToast('ເຜີຍແຜ່ສຳເລັດ', 'ຕາຕະລາງຖືກ Publish ເປັນທາງການແລ້ວ', 'success'); }

function exportToA4PDF() {
    var sheet = getActiveSheet();
    html2pdf().set({
        margin: [3, 3, 3, 3],
        filename: `${sheet.title}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(document.getElementById('pdfExportArea')).save();
}

function openHolidayModal() { document.getElementById('holidayModal')?.classList.remove('hidden'); }
function handleSaveHolidayRange() {
    var title = document.getElementById('holidayTitleInput').value.trim();
    var start = document.getElementById('holidayStartDateInput').value;
    var end = document.getElementById('holidayEndDateInput').value;
    if (!title || !start || !end) return;
    window.specialHolidayRanges.push({ title, start, end });
    saveAll();
    document.getElementById('holidayModal')?.classList.add('hidden');
    renderScheduleTable();
    renderDashboard();
    showToast('ສຳເລັດ', 'ບັນທຶກວັນພັກພິເສດແລ້ວ', 'success');
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
function filterCellStaffList() { renderCellStaffList(document.getElementById('searchCellStaffInput').value.trim()); }

function openRandomGroupSelectModal() {
    var select = document.getElementById('randomSelectedGroupId');
    if (!select) return;
    select.innerHTML = '';
    var optAll = document.createElement('option');
    optAll.value = 'ALL';
    optAll.innerText = '⭐ ພະນັກງານທັງໝົດ (All Staff)';
    select.appendChild(optAll);

    window.employeeGroups.forEach(grp => {
        var opt = document.createElement('option');
        opt.value = grp.id;
        opt.innerText = `${grp.name} (${grp.members.length} ຄົນ)`;
        select.appendChild(opt);
    });
    document.getElementById('randomGroupSelectModal')?.classList.remove('hidden');
}

// ================= ⭐ SMART ZIGZAG SCHEDULE GENERATION ALGORITHM =================

// 1. ສູດສຳລັບທີມ 7 ຄົນ (Flexible 24/7: ກະ1=3, ກະ2=1, ກະ3=1, ພັກ 2 ມື້/ອາທິດ)
function generate7PersonFlexZigzag(year, month, staffList) {
    var daysCount = new Date(year, month, 0).getDate();
    var data = {};
    var N = staffList.length; // 7 ຄົນ

    // ຕາຕະລາງມື້ພັກ 2 ມື້ຕໍ່ອາທິດຂອງ 7 ຄົນ (ໝູນວຽນແບບຄົງທີ່ບໍ່ຊ້ອນກັນ)
    // 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
    var offDaysPattern = [
        [0, 1], // ຄົນທີ 0: ພັກ ຈັນ-ອັງຄານ
        [1, 2], // ຄົນທີ 1: ພັກ ອັງຄານ-ພຸດ
        [2, 3], // ຄົນທີ 2: ພັກ ພຸດ-ພະຫັດ
        [3, 4], // ຄົນທີ 3: ພັກ ພະຫັດ-ສຸກ
        [4, 5], // ຄົນທີ 4: ພັກ ສຸກ-ເສົາ
        [5, 6], // ຄົນທີ 5: ພັກ ເສົາ-ອາທິດ
        [6, 0]  // ຄົນທີ 6: ພັກ ອາທິດ-ຈັນ
    ];

    for (var i = 1; i <= daysCount; i++) {
        var dayNum = i < 10 ? '0' + i : '' + i;
        var mNum = month < 10 ? '0' + month : '' + month;
        var dStr = `${year}-${mNum}-${dayNum}`;
        var dateObj = new Date(Date.UTC(year, month - 1, i));
        var dayOfWeek = (dateObj.getUTCDay() + 6) % 7; // 0 = Mon, ..., 6 = Sun
        var W = getGlobalWeekIndex(dateObj);

        // ໝູນວຽນລຳດັບພະນັກງານຕາມອາທິດ (Zigzag Wheel: 3 -> 2 -> 1)
        var weeklyRotatedStaff = [];
        for (var r = 0; r < N; r++) {
            weeklyRotatedStaff.push(staffList[(r + W) % N]);
        }

        // ແຍກຄົນເຮັດວຽກ ແລະ ຄົນພັກຜ່ອນໃນມື້ນີ້
        var workingToday = [];
        var offToday = [];

        for (var sIdx = 0; sIdx < N; sIdx++) {
            var originalStaffIndex = staffList.indexOf(weeklyRotatedStaff[sIdx]);
            var myOffDays = offDaysPattern[originalStaffIndex];

            if (myOffDays.includes(dayOfWeek)) {
                offToday.push(weeklyRotatedStaff[sIdx]);
            } else {
                workingToday.push(weeklyRotatedStaff[sIdx]);
            }
        }

        // ຈັດສັນເຂົ້າ 3 ກະ (workingToday ມີ 5 ຄົນສະເໝີ: ກະ3 = 1, ກະ2 = 1, ກະ1 = 3)
        // workingToday[0] -> ກະ 3 (Night)
        // workingToday[1] -> ກະ 2 (Afternoon)
        // workingToday[2,3,4] -> ກະ 1 (Morning 3 ຄົນ)
        data[dStr] = {
            isWeekend: (dayOfWeek === 5 || dayOfWeek === 6), // ສຳລັບສະແດງສີ
            shift1: [workingToday[2] || '', workingToday[3] || '', workingToday[4] || ''],
            shift2: [workingToday[1] || ''],
            shift3: [workingToday[0] || '']
        };
    }
    return data;
}

// 2. ສູດສຳລັບທີມໃຫຍ່ປົກກະຕິ (Standard Multi-Person Team)
function generateStandardMonthDataZigzag(year, month, staffList) {
    var daysCount = new Date(year, month, 0).getDate();
    var data = {};

    var leaderNames = staffList.filter(name => {
        var u = window.users.find(usr => usr.nameLao === name);
        return u && u.isLeader;
    });

    if (leaderNames.length < 4) leaderNames = ['ແສງດາວ', 'ພອນສະຫວັນ', 'ບຸນປະເສີດ', 'ພັນນິກອນ'].filter(n => staffList.includes(n));
    var regularStaff = staffList.filter(n => !leaderNames.includes(n));
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

        var l_1A = leaderNames.length > 0 ? leaderNames[(0 + W) % leaderNames.length] : '';
        var l_1B = leaderNames.length > 1 ? leaderNames[(1 + W) % leaderNames.length] : '';
        var l_S2 = leaderNames.length > 2 ? leaderNames[(2 + W) % leaderNames.length] : '';
        var l_S3 = leaderNames.length > 3 ? leaderNames[(3 + W) % leaderNames.length] : '';

        var shiftOffset = (W * s3Count) % (N || 1);
        var rotatedStaff = [];
        for (var r = 0; r < N; r++) {
            rotatedStaff.push(regularStaff[(r + shiftOffset) % N]);
        }

        var staff_S3 = rotatedStaff.slice(0, s3Count);
        var staff_S2 = rotatedStaff.slice(s3Count, s3Count + s2Count);
        var staff_S1 = rotatedStaff.slice(s3Count + s2Count, N);

        if (isWeekend) {
            var isSat = (dayOfWeek === 6);
            data[dStr] = {
                isWeekend: true,
                shift1: isSat ? [l_1A, staff_S1[0] || ''].filter(Boolean) : [l_1B, staff_S1[1] || ''].filter(Boolean),
                shift2: isSat ? [l_S2, staff_S2[0] || ''].filter(Boolean) : [staff_S2[1] || '', staff_S2[2] || ''].filter(Boolean),
                shift3: isSat ? [l_S3, staff_S3[0] || ''].filter(Boolean) : [staff_S3[1] || '', staff_S3[2] || ''].filter(Boolean)
            };
        } else {
            data[dStr] = {
                isWeekend: false,
                shift1: [l_1A, l_1B, ...staff_S1].filter(Boolean),
                shift2: [l_S2, ...staff_S2].filter(Boolean),
                shift3: [l_S3, ...staff_S3].filter(Boolean)
            };
        }
    }
    return data;
}

// 3. Main Dispatcher Function
function generateMonthDataZigzag(year, month, targetGroupMembers) {
    // ກັ່ນຕອງສະເພາະຜູ້ທີ່ຢູ່ໃນກຸ່ມເທົ່ານັ້ນ
    var staffList = [];
    if (targetGroupMembers && targetGroupMembers.length > 0) {
        staffList = [...targetGroupMembers];
    } else {
        staffList = window.users.filter(u => u.role !== 'SUPER_ADMIN').map(u => u.nameLao);
    }

    // ຖ້າກຸ່ມມີ 7 ຄົນ -> ໃຊ້ສູດ 7-Person Flex
    if (staffList.length === 7) {
        return generate7PersonFlexZigzag(year, month, staffList);
    } else {
        return generateStandardMonthDataZigzag(year, month, staffList);
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
    showToast('Zigzag Rotation ສຳເລັດ', `ສ້າງຕາຕະລາງຮອບວຽນ Zigzag ໃຫ້ສະມາຊິກໃນກຸ່ມສຳເລັດ!`, 'success');
}

function openBatchMonthModal() { document.getElementById('batchMonthModal')?.classList.remove('hidden'); }

function executeBatchMonthGenerate() {
    var startM = document.getElementById('batchStartMonth')?.value;
    var count = parseInt(document.getElementById('batchMonthCount')?.value) || 6;
    if (!startM) return;

    var [startYear, startMonth] = startM.split('-').map(Number);
    var currentSheet = getActiveSheet();

    // ກວດສອບກຸ່ມທີ່ຜູກກັບ Sheet ປັດຈຸບັນ
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
                status: 'PUBLISHED',
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

function renderScheduleTable() {
    renderSheetDropdown();
    renderScheduleStaffRoster();
    var sheet = getActiveSheet();
    var scheduleData = sheet.data || {};
    var [year, month] = sheet.monthKey.split('-').map(Number);
    var daysCount = new Date(year, month, 0).getDate();

    document.getElementById('scheduleTableTitle').innerText = sheet.title;
    document.getElementById('scheduleNotesDisplay').innerText = sheet.notes || defaultNotesTemplate;

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
                <td class="p-0">${renderPixelExcelGrid(dStr, 'shift1', dayData.shift1 || [], isWeekendOrHol ? 1 : 2, isWeekendOrHol ? 3 : Math.max(3, Math.ceil((dayData.shift1 || []).length / 2)), isAdmin)}</td>
                <td class="p-0">${renderPixelExcelGrid(dStr, 'shift2', dayData.shift2 || [], isWeekendOrHol ? 1 : 2, isWeekendOrHol ? 3 : Math.max(3, Math.ceil((dayData.shift2 || []).length / 2)), isAdmin)}</td>
                <td class="p-0">${renderPixelExcelGrid(dStr, 'shift3', dayData.shift3 || [], isWeekendOrHol ? 1 : 2, isWeekendOrHol ? 3 : Math.max(2, Math.ceil((dayData.shift3 || []).length / 2)), isAdmin)}</td>
            </tr>
        `;
    }
}

function renderPixelExcelGrid(date, shift, list, rows, cols, isAdmin) {
    cols = Math.max(cols, 2); rows = Math.max(rows, 1);
    var html = `<div class="grid w-full h-full" style="grid-template-columns: repeat(${cols}, minmax(0, 1fr)); grid-template-rows: repeat(${rows}, minmax(0, 1fr)); height: 48px;">`;
    var total = rows * cols;
    for (var idx = 0; idx < total; idx++) {
        var name = list[idx] || '';
        var isLeader = window.users.find(u => u.nameLao === name && u.isLeader);
        var clickHandler = isAdmin ? `onclick="openCellModal('${date}', '${shift}', ${idx}, '${name}')"` : '';
        var borderR = ((idx + 1) % cols !== 0) ? 'border-r border-black' : '';
        var borderB = (idx < (rows - 1) * cols) ? 'border-b border-black' : '';
        html += `<div class="grid-cell-box ${borderR} ${borderB} ${isAdmin ? 'editable' : ''} ${isLeader ? 'text-brand-red font-semibold' : 'text-slate-800'}" ${clickHandler}>${name}</div>`;
    }
    html += `</div>`;
    return html;
}

function renderSheetDropdown() {
    var select = document.getElementById('scheduleSheetSelect');
    if (!select) return;
    select.innerHTML = '';
    window.scheduleSheets.forEach(sheet => {
        var opt = document.createElement('option');
        opt.value = sheet.id;
        opt.innerText = sheet.title;
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
    renderScheduleTable();
    showToast('ສຳເລັດ', `ສ້າງ "${title}" ສຳເລັດ!`, 'success');
}

function openDuplicateSheetModal() {
    var sheet = getActiveSheet();
    var month = prompt('ກະລຸນາໃສ່ເດືອນທີ່ຕ້ອງການ Clone (ເຊັ່ນ: 2026-11):', '2026-11');
    if (!month) return;
    var [y, m] = month.split('-').map(Number);
    var newId = 'sheet-' + Date.now();
    var title = `ຕາຕະລາງປະຈຳການບໍລິການອອນໄລປະຈຳເດືອນ ${m < 10 ? '0' + m : m}/${y}`;
    var clonedData = JSON.parse(JSON.stringify(sheet.data));

    window.scheduleSheets.push({ id: newId, monthKey: month, title: title, notes: sheet.notes || defaultNotesTemplate, status: 'DRAFT', data: clonedData });
    window.activeSheetId = newId;
    saveAll();
    renderScheduleTable();
    renderDashboard();
    showToast('ສຳເລັດ', `ຄັດລອກ Template ໄປເດືອນ ${month} ແລ້ວ!`, 'success');
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

function saveDraft() { getActiveSheet().status = 'DRAFT'; saveAll(); showToast('ສຳເລັດ', 'ບັນທຶກສະບັບຮ່າງ (Draft) ສຳເລັດ', 'success'); }
function publishSchedule() { getActiveSheet().status = 'PUBLISHED'; saveAll(); showToast('ເຜີຍແຜ່ສຳເລັດ', 'ຕາຕະລາງຖືກ Publish ຮຽບຮ້ອຍແລ້ວ', 'success'); }

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
function selectStaffForCell(nameLao) {
    if (!window.activeEditCell) return;
    var { date, shift, index } = window.activeEditCell;
    var sheet = getActiveSheet();
    if (!sheet.data[date]) sheet.data[date] = { shift1: [], shift2: [], shift3: [] };
    if (!sheet.data[date][shift]) sheet.data[date][shift] = [];
    sheet.data[date][shift][index] = nameLao;
    saveAll();
    closeCellModal();
    renderScheduleTable();
}
function clearCurrentCell() {
    if (!window.activeEditCell) return;
    var { date, shift, index } = window.activeEditCell;
    var sheet = getActiveSheet();
    if (sheet.data[date]?.[shift]) {
        sheet.data[date][shift][index] = '';
        saveAll();
        closeCellModal();
        renderScheduleTable();
    }
}
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

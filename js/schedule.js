// ================= ⭐ ລະບົບດັດແກ້ຕາຕະລາງທີ່ PUBLISHED ແລ້ວ =================

window.pendingPublishedCellEdit = null;

// ເປີດ Modal ຖາມ Remark
function openEditPublishedRemarkModal(editData) {
    window.pendingPublishedCellEdit = editData;
    document.getElementById('remarkModalTargetInfo').innerText = `ວັນທີ: ${editData.date} [${editData.shift} - ຊ່ອງທີ ${editData.index + 1}]`;
    document.getElementById('remarkOldName').innerText = editData.currentName || '(ຊ່ອງວ່າງ)';
    document.getElementById('remarkNewName').innerText = editData.newName;
    document.getElementById('editPublishedRemarkInput').value = '';
    document.getElementById('editPublishedRemarkModal')?.classList.remove('hidden');
}

function closeEditPublishedRemarkModal() {
    document.getElementById('editPublishedRemarkModal')?.classList.add('hidden');
    window.pendingPublishedCellEdit = null;
}

// ຢືນຢັນການດັດແກ້: ບັນທຶກ Audit Log + Highlight + ສົ່ງແຈ້ງເຕືອນຫາທຸກຄົນ
function confirmApplyPublishedCellUpdate() {
    if (!window.pendingPublishedCellEdit) return;
    var { date, shift, index, currentName, newName } = window.pendingPublishedCellEdit;
    var reason = document.getElementById('editPublishedRemarkInput').value.trim() || 'ດັດແກ້ຕາມຄວາມຈຳເປັນ';
    var sheet = getActiveSheet();

    // 1. ບັນທຶກລົງ Audit Log
    var auditEntry = {
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
    };
    window.scheduleAuditLogs.unshift(auditEntry);

    // 2. ສົ່ງແຈ້ງເຕືອນຫາພະນັກງານທຸກຄົນ (System Notification)
    window.systemNotifications.unshift({
        id: Date.now(),
        title: `ມີການປັບປ່ຽນຕາຕະລາງ: ${sheet.title}`,
        message: `ວັນທີ ${date} [${shift}]: ປ່ຽນ ${currentName || 'ວ່າງ'} ➔ ${newName} (ເຫດຜົນ: ${reason})`,
        tag: 'ຕາຕະລາງດັດແກ້',
        date: new Date().toLocaleString('lo-LA'),
        readBy: [window.currentUser?.user]
    });

    // 3. ອັບເດດຊ່ອງໃນຕາຕະລາງ
    if (!sheet.data[date]) sheet.data[date] = { shift1: [], shift2: [], shift3: [] };
    if (!sheet.data[date][shift]) sheet.data[date][shift] = [];
    sheet.data[date][shift][index] = newName;

    saveAll();
    closeEditPublishedRemarkModal();
    closeCellModal();
    renderScheduleTable();
    updateNotificationBadge();
    showToast('ອັບເດດສຳເລັດ', `ດັດແກ້ຕາຕະລາງ ແລະ ແຈ້ງເຕືອນຫາພະນັກງານແລ້ວ!`, 'success');
}

// ເວລາຄລິກເລືອກຄົນໃສ່ຊ່ອງ
function selectStaffForCell(nameLao) {
    if (!window.activeEditCell) return;
    var { date, shift, index, currentName } = window.activeEditCell;
    var sheet = getActiveSheet();

    // ຖ້າຕາຕະລາງຖືກ Publish ແລ້ວ ໃຫ້ເປີດ Modal ຖາມ Remark
    if (sheet.status === 'PUBLISHED' && currentName !== nameLao) {
        openEditPublishedRemarkModal({ date, shift, index, currentName, newName: nameLao });
        return;
    }

    // ຖ້າເປັນສະບັບຮ່າງ (Draft) ໃຫ້ປ່ຽນໄດ້ເລີຍປົກກະຕິ
    if (!sheet.data[date]) sheet.data[date] = { shift1: [], shift2: [], shift3: [] };
    if (!sheet.data[date][shift]) sheet.data[date][shift] = [];
    sheet.data[date][shift][index] = nameLao;

    saveAll();
    closeCellModal();
    renderScheduleTable();
    showToast('ສຳເລັດ', 'ປັບປ່ຽນພະນັກງານໃນກະຮຽບຮ້ອຍ', 'success');
}

// ເວລາຄລິກລຶບຄົນອອກຈາກຊ່ອງ
function clearCurrentCell() {
    if (!window.activeEditCell) return;
    var { date, shift, index, currentName } = window.activeEditCell;
    var sheet = getActiveSheet();

    if (sheet.status === 'PUBLISHED' && currentName) {
        openEditPublishedRemarkModal({ date, shift, index, currentName, newName: '(ວ່າງ)' });
        return;
    }

    if (sheet.data[date]?.[shift]) {
        sheet.data[date][shift][index] = '';
        saveAll();
        closeCellModal();
        renderScheduleTable();
    }
}

// Render Cell ພ້ອມ Highlight ສີເຫຼືອງທອງ ✏️ ແລະ Hover Tooltip ສະແດງເຫດຜົນ
function renderPixelExcelGrid(date, shift, list, rows, cols, isAdmin, sheetId) {
    cols = Math.max(cols, 2); rows = Math.max(rows, 1);
    var html = `<div class="grid w-full h-full" style="grid-template-columns: repeat(${cols}, minmax(0, 1fr)); grid-template-rows: repeat(${rows}, minmax(0, 1fr)); height: 48px;">`;
    var total = rows * cols;

    for (var idx = 0; idx < total; idx++) {
        var name = list[idx] || '';
        var isLeader = window.users.find(u => u.nameLao === name && u.isLeader);
        var clickHandler = isAdmin ? `onclick="openCellModal('${date}', '${shift}', ${idx}, '${name}')"` : '';

        // ກວດສອບປະຫວັດການດັດແກ້ຊ່ອງນີ້
        var log = window.scheduleAuditLogs.find(l => l.sheetId === sheetId && l.date === date && l.shift === shift && l.newName === name);
        var isModified = !!log;
        var highlightClass = isModified ? 'bg-amber-200/90 font-bold text-amber-950 border-2 border-amber-500 shadow-inner' : '';
        var tooltip = isModified ? `✏️ ດັດແກ້: ${log.oldName} ➔ ${log.newName}\nເຫດຜົນ: "${log.reason}"\nໂດຍ: ${log.adminName} (${log.timestamp})` : '';

        var borderR = ((idx + 1) % cols !== 0) ? 'border-r border-black' : '';
        var borderB = (idx < (rows - 1) * cols) ? 'border-b border-black' : '';

        html += `
            <div class="grid-cell-box ${borderR} ${borderB} ${isAdmin ? 'editable' : ''} ${highlightClass} ${isLeader ? 'text-brand-red font-semibold' : 'text-slate-800'}" ${clickHandler} title="${tooltip}">
                ${name} ${isModified ? '<span class="text-[9px] text-amber-800 font-extrabold ml-0.5 animate-pulse">✏️</span>' : ''}
            </div>
        `;
    }
    html += `</div>`;
    return html;
}

// ⭐ 1. ຟັງຊັນບັນທຶກຊື່ລົງຊ່ອງຕາຕະລາງ (ໃຊ້ໄດ້ທັງ Drag & Drop ແລະ Click)
async function applyStaffToCell(date, shift, index, staffName) {
    if (!staffName || !date || !shift || isNaN(index)) return;

    var isAdmin = window.currentUser && window.currentUser.role === 'SUPER_ADMIN';
    if (!isAdmin) {
        showToast('ແຈ້ງເຕືອນ', 'ສະເພາະ Admin ເທົ່ານັ້ນທີ່ສາມາດແກ້ໄຂຕາຕະລາງໄດ້', 'error');
        return;
    }

    var sheet = (typeof getActiveSheet === 'function') ? getActiveSheet() : null;
    if (!sheet) return;

    var currentName = (sheet.data && sheet.data[date] && sheet.data[date][shift] && sheet.data[date][shift][index]) || '';
    if (currentName === staffName) return;

    // ຖ້າເປັນຕາຕະລາງ Published ຈະຖາມເຫດຜົນ (Remark)
    if (sheet.status === 'PUBLISHED') {
        if (typeof window.openEditPublishedRemarkModal === 'function') {
            window.openEditPublishedRemarkModal({ date: date, shift: shift, index: index, currentName: currentName, newName: staffName });
            return;
        }
    }

    if (!sheet.data) sheet.data = {};
    if (!sheet.data[date]) sheet.data[date] = { shift1: [], shift2: [], shift3: [] };
    if (!sheet.data[date][shift]) sheet.data[date][shift] = [];
    sheet.data[date][shift][index] = staffName;

    if (typeof saveAll === 'function') await saveAll();
    if (typeof syncScheduleToSupabase === 'function') await syncScheduleToSupabase(sheet);
    if (typeof renderScheduleTable === 'function') renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();

    if (typeof showToast === 'function') {
        showToast('ສຳເລັດ', `ວາງ "${staffName}" ໃສ່ [${shift}] ວັນທີ ${date} ແລ້ວ!`, 'success');
    }
}
window.applyStaffToCell = applyStaffToCell;

// ⭐ 2. RENDER ຊ່ອງພະນັກງານ (ຝັງ DATA ATTRIBUTES ໃຫ້ຮອງຮັບ DRAG & DROP 100%)
function renderPixelExcelGrid(date, shift, list, rows, cols, isAdmin, sheetId) {
    cols = Math.max(cols, 2); 
    rows = Math.max(rows, 1);
    
    var html = `<div class="grid w-full h-full text-center" style="grid-template-columns: repeat(${cols}, minmax(0, 1fr)); grid-template-rows: repeat(${rows}, minmax(0, 1fr)); min-height: 48px; height: 48px;">`;
    var total = rows * cols;

    for (var idx = 0; idx < total; idx++) {
        var name = (list && list[idx]) ? String(list[idx]).trim() : '';
        var isLeader = false;
        if (name) {
            isLeader = (window.users || []).some(function(u) { return u && u.nameLao === name && u.isLeader; });
        }

        var clickHandler = isAdmin ? `onclick="openCellModal('${date}', '${shift}', ${idx}, '${name}')"` : '';
        var isModified = (window.scheduleAuditLogs || []).some(function(l) { return l && l.sheetId === sheetId && l.date === date && l.shift === shift && l.newName === name; });
        var highlightClass = isModified ? 'bg-amber-100 font-medium text-amber-950' : '';

        var borderR = ((idx + 1) % cols !== 0) ? 'border-r border-black' : '';
        var borderB = (idx < (rows - 1) * cols) ? 'border-b border-black' : '';
        var cursorClass = isAdmin ? 'cursor-pointer hover:bg-slate-50 transition' : '';
        var textColor = isLeader ? 'text-brand-red font-normal' : 'text-slate-800 font-normal';

        // ຝັງ data-date, data-shift, data-index ໃສ່ທຸກໆຊ່ອງ
        html += `
            <div data-cell-drop="true" data-date="${date}" data-shift="${shift}" data-index="${idx}" class="grid-cell-box flex items-center justify-center text-center p-0.5 text-xs select-none ${borderR} ${borderB} ${cursorClass} ${highlightClass} ${textColor}" ${clickHandler} title="${isAdmin ? 'ກົດເພື່ອເລືອກ/ພິມຊື່ ຫຼື ລາກຊື່ມາວາງໃສ່ໄດ້' : ''}">
                <span class="truncate px-0.5 font-normal pointer-events-none">${name}</span>
            </div>
        `;
    }
    html += `</div>`;
    return html;
}
window.renderPixelExcelGrid = renderPixelExcelGrid;

// ⭐ 3. GLOBAL DRAG & DROP CONTROLLER (ຄວບຄຸມການລາກວາງທົ່ວທັງລະບົບ ບໍ່ມີວັນຫຼຸດ)
document.addEventListener('dragover', function(e) {
    var cell = e.target.closest('[data-cell-drop="true"]');
    if (cell) {
        e.preventDefault(); // ບັງຄັບໃຫ້ Browser ອະນຸຍາດໃຫ້ວາງສະເໝີ (ຂຶ້ນໄອຄອນ +)
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    }
});

document.addEventListener('dragenter', function(e) {
    var cell = e.target.closest('[data-cell-drop="true"]');
    if (cell) {
        cell.style.backgroundColor = '#dbeafe'; // ສີຟ້າອ່ອນ
        cell.style.outline = '2px dashed #2563eb'; // ຂອບເສັ້ນປະສີຟ້າ
        cell.style.outlineOffset = '-2px';
    }
});

document.addEventListener('dragleave', function(e) {
    var cell = e.target.closest('[data-cell-drop="true"]');
    if (cell && !cell.contains(e.relatedTarget)) {
        cell.style.backgroundColor = '';
        cell.style.outline = '';
    }
});

document.addEventListener('drop', async function(e) {
    var cell = e.target.closest('[data-cell-drop="true"]');
    if (!cell) return;
    
    e.preventDefault();
    cell.style.backgroundColor = '';
    cell.style.outline = '';

    var staffName = '';
    if (e.dataTransfer) {
        staffName = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text');
    }
    if (!staffName && window.draggedStaffName) {
        staffName = window.draggedStaffName;
    }

    if (!staffName) return;

    var date = cell.getAttribute('data-date');
    var shift = cell.getAttribute('data-shift');
    var index = parseInt(cell.getAttribute('data-index'));

    await applyStaffToCell(date, shift, index, staffName);
    window.draggedStaffName = null;
});

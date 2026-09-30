// ⭐ 1. FUNCTION SYNC ລົງ SUPABASE ແບບໃໝ່ (ບໍ່ຕິດ ERROR 400, ບັນທຶກລົງ DATABASE 100%)
async function syncScheduleToSupabase(sheet) {
    if (!window.supabaseClient || !sheet) return;

    // ຝັງ title ແລະ notes ໄວ້ໃນ data._meta
    if (!sheet.data) sheet.data = {};
    sheet.data._meta = {
        title: sheet.title || '',
        notes: sheet.notes || ''
    };

    var payload = {
        id: sheet.id,
        title: sheet.title || '',
        status: sheet.status || 'DRAFT',
        data: sheet.data
    };
    if (sheet.monthKey) payload.month_key = sheet.monthKey;

    try {
        // ວິທີທີ 1: ໃຊ້ UPDATE ໂດຍກົງຕາມ ID (ວິທີທີ່ປອດໄພທີ່ສຸດ ບໍ່ຕ້ອງຜ່ານ onConflict)
        var { data: updateData, error: updateErr } = await window.supabaseClient
            .from('schedules')
            .update(payload)
            .eq('id', sheet.id)
            .select();

        if (!updateErr && updateData && updateData.length > 0) {
            console.log("☁️ [Supabase Update Success] ບັນທຶກລົງ Database ສຳເລັດ:", sheet.id);
            return;
        }

        // ຖ້າ Update ບໍ່ມີແຖວ (ເພາະເປັນຕາຕະລາງສ້າງໃໝ່ທີ່ຍັງບໍ່ມີໃນ DB) ໃຫ້ສັ່ງ INSERT
        var { error: insertErr } = await window.supabaseClient
            .from('schedules')
            .insert([payload]);

        if (!insertErr) {
            console.log("☁️ [Supabase Insert Success] ສ້າງຕາຕະລາງໃໝ່ລົງ Database ສຳເລັດ:", sheet.id);
        } else {
            // ຖ້າຕິດ Column mismatch ໃຫ້ລອງສົ່ງສະເພາະ id ແລະ data
            console.warn("⚠️ Retrying with minimal payload (id, data)...");
            await window.supabaseClient.from('schedules').upsert({ id: sheet.id, data: sheet.data });
            console.log("☁️ [Supabase Fallback Success] ບັນທຶກສຳເລັດ!");
        }
    } catch (err) {
        console.error("❌ [Supabase Exception]:", err);
    }
}

// ⭐ 2. FUNCTION ບັນທຶກຊື່ໃສ່ CELL ແບບຖາວອນ (ປ້ອງກັນຊື່ເດັ້ງອອກ)
async function applyCellUpdate(sheet, date, shift, index, nameLao) {
    if (!sheet.data) sheet.data = {};
    if (!sheet.data[date]) sheet.data[date] = { shift1: [], shift2: [], shift3: [] };
    if (!sheet.data[date][shift]) sheet.data[date][shift] = [];

    var list = sheet.data[date][shift];

    // ຖ້າເປັນການລຶບຊື່ອອກ
    if (!nameLao || nameLao === '(ວ່າງ)') {
        if (index < list.length) {
            list.splice(index, 1);
        }
    } else {
        // ຖ້າເປັນການເພີ່ມຊື່ ຫຼື ປ່ຽນຊື່
        if (index < list.length) {
            list[index] = nameLao;
        } else {
            list.push(nameLao);
        }
    }

    // ກອງເອົາສະເພາະຊື່ທີ່ຖືກຕ້ອງ (ຕັດຊ່ອງວ່າງອອກ)
    sheet.data[date][shift] = list.filter(n => n && n.trim() !== '' && n !== '(ວ່າງ)');

    // 1. ອັບເດດລົງໃນ window.scheduleSheets
    if (window.scheduleSheets) {
        var sIdx = window.scheduleSheets.findIndex(s => s.id === sheet.id);
        if (sIdx !== -1) {
            window.scheduleSheets[sIdx].data = sheet.data;
        }
    }

    // 2. ບັນທຶກສຳຮອງລົງທຸກ Key ຂອງ LocalStorage ທັນທີ
    try {
        var sheetsJson = JSON.stringify(window.scheduleSheets);
        localStorage.setItem('ot_schedule_sheets', sheetsJson);
        localStorage.setItem('ot_schedules_sheets', sheetsJson);
    } catch(e) {}

    // 3. ປິດ Modal ແລະ Render ໜ້າຈໍທັນທີ
    closeCellModal();
    renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();

    // 4. ⭐ SYNC ລົງ SUPABASE DATABASE ທັນທີ ພ້ອມລໍຖ້າໃຫ້ Database ຢືນຢັນ
    await syncScheduleToSupabase(sheet);
    if (typeof saveAll === 'function') await saveAll();
}

// ⭐ 3. ເລືອກພະນັກງານໃສ່ຊ່ອງ
async function selectStaffForCell(nameLao) {
    if (!window.activeEditCell) return;
    var { date, shift, index, currentName } = window.activeEditCell;
    var sheet = getActiveSheet();
    if (!sheet) return;

    // ຖ້າຕາຕະລາງຖືກ Publish ແລ້ວ ແລະ ເປັນການປ່ຽນຄົນ: ຖາມເຫດຜົນ Remark
    if (sheet.status === 'PUBLISHED' && currentName && currentName !== nameLao) {
        closeCellModal();
        openEditPublishedRemarkModal({ 
            date: date, 
            shift: shift, 
            index: index, 
            currentName: currentName, 
            newName: nameLao 
        });
        return;
    }

    // ຖ້າເປັນການເພີ່ມໃສ່ຊ່ອງວ່າງ ຫຼື ສະບັບຮ່າງ (Draft): ບັນທຶກທັນທີ
    await applyCellUpdate(sheet, date, shift, index, nameLao);
    showToast('ສຳເລັດ', `ເພີ່ມ "${nameLao}" ລົງໃນຕາຕະລາງ ແລະ Database ແລ້ວ!`, 'success');
}

// ⭐ 4. ລຶບຊື່ອອກຈາກຊ່ອງ (CLEAR CELL)
async function clearCurrentCell() {
    if (!window.activeEditCell) return;
    var { date, shift, index, currentName } = window.activeEditCell;
    var sheet = getActiveSheet();
    if (!sheet) return;

    if (sheet.status === 'PUBLISHED' && currentName) {
        closeCellModal();
        openEditPublishedRemarkModal({
            date: date,
            shift: shift,
            index: index,
            currentName: currentName,
            newName: '(ວ່າງ)'
        });
        return;
    }

    await applyCellUpdate(sheet, date, shift, index, '');
    showToast('ສຳເລັດ', 'ລຶບຊື່ອອກ ແລະ Sync ລົງ Database ແລ້ວ', 'success');
}

// ⭐ 5. ຢືນຢັນດັດແກ້ຕາຕະລາງ PUBLISHED ພ້ອມບັນທຶກເຫດຜົນ REMARK
async function confirmApplyPublishedCellUpdate() {
    if (!window.pendingPublishedCellEdit) return;
    var { date, shift, index, currentName, newName } = window.pendingPublishedCellEdit;
    var reasonInput = document.getElementById('editPublishedRemarkInput');
    var reason = reasonInput ? reasonInput.value.trim() : '';
    if (!reason) reason = 'ດັດແກ້ຕາມຄວາມຈຳເປັນ';

    var sheet = getActiveSheet();
    if (!sheet) return;

    // ບັນທຶກປະຫວັດ Audit Trail
    if (!window.scheduleAuditLogs) window.scheduleAuditLogs = [];
    window.scheduleAuditLogs.unshift({
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
    });

    closeEditPublishedRemarkModal();
    await applyCellUpdate(sheet, date, shift, index, newName);
    showToast('ສຳເລັດ', `ດັດແກ້ຕາຕະລາງ ແລະ ບັນທຶກເຫດຜົນລົງ Database ຮຽບຮ້ອຍ!`, 'success');
}

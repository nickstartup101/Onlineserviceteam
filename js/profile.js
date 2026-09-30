// ⭐ 8. ກົດ ACCEPT: ສະຫຼັບຊື່ໃນທຸກ SHEET ແບບ REAL-TIME 100% ບໍ່ມີພາດ
async function acceptSwap(id) {
    var req = (window.swapHistory || []).find(r => r.id == id);
    if (!req) return;

    req.status = 'COMPLETED';

    // Helper ສ້າງ Array ວັນທີແບບປອດໄພ ບໍ່ຕິດ Timezone Bug
    function getDatesList(sDate, eDate) {
        var list = [];
        var start = new Date(sDate + 'T00:00:00Z');
        var end = new Date((eDate || sDate) + 'T00:00:00Z');
        while (start <= end) {
            list.push(start.toISOString().split('T')[0]);
            start.setUTCDate(start.getUTCDate() + 1);
        }
        return list;
    }

    var targetDates = getDatesList(req.startDate, req.endDate);
    var isCover = (req.swapType === 'COVER');

    // ⭐ ກວດສອບ ແລະ ສະຫຼັບຊື່ໃນ "ທຸກໆ SHEET" ທີ່ຢູ່ໃນລະບົບ (ທັງຕາຕະລາງສົມບູນ ແລະ ສັນຍາ)
    (window.scheduleSheets || []).forEach(sheet => {
        if (!sheet || !sheet.data) return;

        targetDates.forEach(dStr => {
            if (sheet.data[dStr]) {
                var day = sheet.data[dStr];

                if (isCover) {
                    // ກໍລະນີ: ຍາມແທນ (Cover) -> fromName ຂຶ້ນແທນ toName
                    ['shift1', 'shift2', 'shift3'].forEach(sName => {
                        var arr = day[sName] || [];
                        var idx = arr.findIndex(n => isNameMatch(n, req.toName));
                        if (idx !== -1) {
                            arr[idx] = req.fromName;
                        }
                    });
                } else {
                    // ກໍລະນີ: ແລກປ່ຽນກະ (1:1 Swap) -> ສະຫຼັບບ່ອນກັນທັນທີ
                    var findPos = function(name) {
                        for (var sName of ['shift1', 'shift2', 'shift3']) {
                            var arr = day[sName] || [];
                            var idx = arr.findIndex(n => isNameMatch(n, name));
                            if (idx !== -1) return { shift: sName, index: idx };
                        }
                        return null;
                    };

                    var posFrom = findPos(req.fromName);
                    var posTo = findPos(req.toName);

                    // ຖ້າພົບຊື່ທັງສອງຄົນໃນມື້ນີ້ ໃຫ້ສະຫຼັບຊື່ກັນທັນທີ
                    if (posFrom && posTo) {
                        day[posFrom.shift][posFrom.index] = req.toName;
                        day[posTo.shift][posTo.index] = req.fromName;
                    }
                }
            }
        });
    });

    // ບັນທຶກລົງ LocalStorage
    localStorage.setItem('ot_swap_history', JSON.stringify(window.swapHistory));
    localStorage.setItem('ot_schedule_sheets', JSON.stringify(window.scheduleSheets));
    localStorage.setItem('ot_schedules_sheets', JSON.stringify(window.scheduleSheets));

    // ⭐ ອັບເດດໜ້າຈໍທັນທີ Real-time 0 ວິນາທີ!
    renderSwapHistory();
    renderUserCurrentWeekWorkspace();
    if (typeof window.renderScheduleTable === 'function') window.renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();

    showToast('ປ່ຽນກະສຳເລັດ', `ສັບປ່ຽນກະລະຫວ່າງ ${req.fromName} ແລະ ${req.toName} ຮຽບຮ້ອຍແລ້ວ!`, 'success');

    // Sync ຂຶ້ນ Supabase Cloud ຢູ່ເບື້ອງຫຼັງ
    try {
        if (typeof saveAll === 'function') await saveAll();
        if (window.supabaseClient) {
            await window.supabaseClient.from('shift_swaps').update({ status: 'COMPLETED' }).eq('id', req.id);
            // Sync ທຸກ Sheet ທີ່ຖືກແກ້ໄຂ
            for (var s of (window.scheduleSheets || [])) {
                if (typeof syncScheduleToSupabase === 'function') {
                    await syncScheduleToSupabase(s);
                }
            }
        }
    } catch (e) {
        console.warn("Background Sync:", e);
    }
}

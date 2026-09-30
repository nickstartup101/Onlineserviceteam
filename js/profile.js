// ⭐ 1. ສົ່ງຄຳຮ້ອງຂໍປ່ຽນກະ (ບັນທຶກລົງ SUPABASE + LOCAL ທັນທີ)
async function handleCreateSwap() {
    var start = document.getElementById('swapDateStart')?.value;
    var end = document.getElementById('swapDateEnd')?.value;
    var toName = document.getElementById('swapTargetPeer')?.value;
    var fromShift = document.getElementById('swapMyShift')?.value;
    var toShift = document.getElementById('swapTargetShift')?.value;
    var reason = document.getElementById('swapReason')?.value.trim();

    if (!start || !end || !toName) { 
        showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາເລືອກຂໍ້ມູນໃຫ້ຄົບຖ້ວນ', 'error'); 
        return; 
    }

    var newSwap = {
        id: Date.now(),
        fromName: window.currentUser.nameLao,
        toName: toName,
        startDate: start,
        endDate: end,
        fromShift: fromShift,
        toShift: toShift,
        reason: reason || 'ຂໍປ່ຽນກະປະຈຳການ',
        status: 'PENDING',
        createdAt: new Date().toLocaleString('lo-LA')
    };

    if (!window.swapHistory) window.swapHistory = [];
    window.swapHistory.unshift(newSwap);

    await saveAll();

    // Sync ຂຶ້ນ Supabase
    if (window.supabaseClient) {
        try {
            await window.supabaseClient.from('shift_swaps').insert([{
                id: newSwap.id,
                from_name: newSwap.fromName,
                to_name: newSwap.toName,
                start_date: newSwap.startDate,
                end_date: newSwap.endDate,
                from_shift: newSwap.fromShift,
                to_shift: newSwap.toShift,
                reason: newSwap.reason,
                status: 'PENDING'
            }]);
            console.log("☁️ [Supabase]: Shift swap inserted successfully!");
        } catch (e) {
            console.error("Supabase Swap Insert Error:", e);
        }
    }

    renderSwapHistory();
    if (typeof window.updateNotificationBadge === 'function') window.updateNotificationBadge();
    showToast('ສຳເລັດ', `ສົ່ງຄຳຮ້ອງຂໍປ່ຽນກະຫາ "${toName}" ຮຽບຮ້ອຍແລ້ວ!`, 'success');
}

// ⭐ 2. ສະແດງລາຍການຂໍປ່ຽນກະ (ພ້ອມປຸ່ມ ACCEPT ສຳລັບຜູ້ຮັບ ແລະ ADMIN)
async function renderSwapHistory() {
    var container = document.getElementById('incomingSwapsList');
    if (!container) return;

    // ດຶງຂໍ້ມູນຫຼ້າສຸດຈາກ Supabase ຖ້າມີການເຊື່ອມຕໍ່
    if (window.supabaseClient) {
        try {
            var { data, error } = await window.supabaseClient
                .from('shift_swaps')
                .select('*')
                .order('created_at', { ascending: false });
            if (!error && data) {
                // ແປງ field ຈາກ database ໃຫ້ຕົງກັບ client
                window.swapHistory = data.map(d => ({
                    id: d.id,
                    fromName: d.from_name,
                    toName: d.to_name,
                    startDate: d.start_date,
                    endDate: d.end_date,
                    fromShift: d.from_shift,
                    toShift: d.to_shift,
                    reason: d.reason,
                    status: d.status,
                    createdAt: d.created_at
                }));
            }
        } catch (err) {
            console.warn("Could not fetch remote swaps, using local cache:", err);
        }
    }

    container.innerHTML = '';
    var history = window.swapHistory || [];

    if (history.length === 0) {
        container.innerHTML = `<p class="text-slate-400 text-xs italic py-3 text-center font-lao">ຍັງບໍ່ມີປະຫວັດການຂໍປ່ຽນກະ</p>`;
        return;
    }

    var myNameLao = (window.currentUser?.nameLao || '').trim().toLowerCase();
    var myFullName = (window.currentUser?.fullName || '').trim().toLowerCase();
    var myUserCode = (window.currentUser?.user || '').trim().toLowerCase();
    var isAdmin = (window.currentUser?.role === 'SUPER_ADMIN');

    history.forEach(req => {
        var reqTo = (req.toName || '').trim().toLowerCase();
        var reqFrom = (req.fromName || '').trim().toLowerCase();

        // ເງື່ອນໄຂກວດສອບວ່າ "ແມ່ນຂ້ອຍບໍ່ທີ່ເປັນຜູ້ຮັບ" (ກວດທັງຊື່ຫຍໍ້, ຊື່ເຕັມ, ແລະ ລະຫັດ)
        var isForMe = (reqTo === myNameLao || reqTo === myFullName || reqTo === myUserCode) && (req.status === 'PENDING');
        var isCreatedByMe = (reqFrom === myNameLao || reqFrom === myFullName || reqFrom === myUserCode) && (req.status === 'PENDING');

        // Admin ສາມາດກົດ Accept ຊ່ວຍໄດ້
        var canAccept = isForMe || (isAdmin && req.status === 'PENDING');

        var statusBadge = '';
        if (req.status === 'COMPLETED') {
            statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">ສຳເລັດ (Accepted)</span>';
        } else if (req.status === 'PENDING') {
            statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">ລໍຖ້າຕອບຮັບ</span>';
        } else {
            statusBadge = '<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">ປະຕິເສດແລ້ວ</span>';
        }

        container.innerHTML += `
            <div class="p-3.5 bg-slate-50 border rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 font-lao">
                <div class="space-y-0.5">
                    <p class="font-bold text-slate-800 text-xs">
                        <span class="text-brand-red">${req.fromName}</span> ➔ ຂໍແລກປ່ຽນກະກັບ 
                        <span class="text-blue-700 font-bold">${req.toName}</span>
                    </p>
                    <p class="text-slate-500 text-[11px]">
                        ຊ່ວງວັນທີ: <strong>${req.startDate} ຫາ ${req.endDate}</strong> | 
                        <span class="font-bold text-purple-700">${req.fromShift}</span> ↔ 
                        <span class="font-bold text-emerald-700">${req.toShift}</span>
                    </p>
                    ${req.reason ? `<p class="text-slate-400 text-[10px] italic">"${req.reason}"</p>` : ''}
                </div>
                <div class="flex items-center gap-2">
                    ${canAccept ? `
                        <button type="button" onclick="acceptSwap(${req.id})" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1 cursor-pointer">
                            <span class="material-symbols-outlined text-xs">check_circle</span> ຍອມຮັບ (Accept)
                        </button>
                        <button type="button" onclick="declineSwap(${req.id})" class="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer">
                            ປະຕິເສດ
                        </button>
                    ` : (isCreatedByMe ? `
                        ${statusBadge}
                        <button type="button" onclick="promptCancelSwap(${req.id})" class="px-2.5 py-1 bg-white hover:bg-red-50 text-brand-red border border-red-200 rounded-xl text-xs font-bold transition">
                            ຍົກເລີກ
                        </button>
                    ` : `
                        ${statusBadge}
                    `)}
                </div>
            </div>
        `;
    });
}

// ⭐ 3. ກົດຍອມຮັບ (ACCEPT) ປ່ຽນກະທັນທີ + SYNC ລົງ ຕາຕະລາງ ແລະ SUPABASE
async function acceptSwap(id) {
    var req = (window.swapHistory || []).find(r => r.id == id);
    if (!req) return;

    req.status = 'COMPLETED';

    // ສັບປ່ຽນຊື່ໃນຕາຕະລາງປະຈຳການຕົວຈິງ
    var startD = new Date(req.startDate);
    var endD = new Date(req.endDate);
    var sheet = getActiveSheet();

    if (sheet && sheet.data) {
        for (var d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
            var y = d.getFullYear();
            var m = (d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1);
            var dayN = d.getDate() < 10 ? '0' + d.getDate() : d.getDate();
            var dStr = `${y}-${m}-${dayN}`;

            if (sheet.data[dStr]) {
                var sFrom = sheet.data[dStr][req.fromShift] || [];
                var sTo = sheet.data[dStr][req.toShift] || [];

                var idxFrom = sFrom.indexOf(req.fromName);
                var idxTo = sTo.indexOf(req.toName);

                if (idxFrom !== -1 && idxTo !== -1) {
                    sFrom[idxFrom] = req.toName;
                    sTo[idxTo] = req.fromName;
                } else if (idxFrom !== -1) {
                    sFrom[idxFrom] = req.toName;
                } else if (idxTo !== -1) {
                    sTo[idxTo] = req.fromName;
                }
            }
        }
    }

    await saveAll();
    
    // Sync ສະຖານະ Swap ລົງ Supabase
    if (window.supabaseClient) {
        try {
            await window.supabaseClient.from('shift_swaps')
                .update({ status: 'COMPLETED' })
                .eq('id', req.id);

            // Sync ຕາຕະລາງຫຼັງປ່ຽນຄົນແລ້ວຂຶ້ນ Supabase
            if (typeof syncScheduleToSupabase === 'function' && sheet) {
                await syncScheduleToSupabase(sheet);
            }
        } catch (e) {
            console.error("Supabase Accept Swap Error:", e);
        }
    }

    renderSwapHistory();
    renderUserCurrentWeekWorkspace();
    if (typeof window.renderScheduleTable === 'function') window.renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();
    showToast('ປ່ຽນກະສຳເລັດ', `ສັບປ່ຽນກະລະຫວ່າງ ${req.fromName} ແລະ ${req.toName} ຮຽບຮ້ອຍແລ້ວ!`, 'success');
}

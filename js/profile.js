// ================= ⭐ PROFILE, LEAVE & P2P SHIFT SWAP HUB =================

function renderAdminAllStaffReport() {
    if (!window.currentUser || window.currentUser.role !== 'SUPER_ADMIN') return;

    var sheet = getActiveSheet();
    var matrixTbody = document.getElementById('adminAllStaffMatrixReportBody');
    var auditTbody = document.getElementById('adminScheduleAuditTableBody');
    var secTbody = document.getElementById('adminSecurityAuditTableBody');

    var staffList = (window.users || []).filter(u => u.role !== 'SUPER_ADMIN');
    var staffCountEl = document.getElementById('adminMetricStaffCount');
    var swapCountEl = document.getElementById('adminMetricSwapCount');
    var leaveCountEl = document.getElementById('adminMetricLeaveCount');
    var dutyCountEl = document.getElementById('adminMetricDutyCount');

    if (staffCountEl) staffCountEl.innerText = `${staffList.length} ທ່ານ`;
    if (swapCountEl) swapCountEl.innerText = `${(window.swapHistory || []).length} ລາຍການ`;

    var totalLeavesCount = 0;
    var totalDutyCount = 0;

    var stats = {};
    staffList.forEach(u => {
        var usedL = u.usedAnnual || 0;
        totalLeavesCount += usedL;
        stats[u.nameLao] = { ...u, s1: 0, s2: 0, s3: 0, totalDuty: 0 };
    });

    if (leaveCountEl) leaveCountEl.innerText = `${totalLeavesCount} ມື້`;

    var schedData = sheet?.data || {};
    Object.values(schedData).forEach(day => {
        (day.shift1 || []).forEach(n => { if (stats[n]) { stats[n].s1++; stats[n].totalDuty++; totalDutyCount++; } });
        (day.shift2 || []).forEach(n => { if (stats[n]) { stats[n].s2++; stats[n].totalDuty++; totalDutyCount++; } });
        (day.shift3 || []).forEach(n => { if (stats[n]) { stats[n].s3++; stats[n].totalDuty++; totalDutyCount++; } });
    });

    if (dutyCountEl) dutyCountEl.innerText = `${totalDutyCount} ກະ`;

    // 1. Matrix Report
    if (matrixTbody) {
        matrixTbody.innerHTML = '';
        Object.values(stats).forEach(st => {
            var quota = st.annualQuota || 15;
            var used = st.usedAnnual || 0;
            var remaining = quota - used;

            matrixTbody.innerHTML += `
                <tr class="hover:bg-slate-50 font-lao">
                    <td class="p-3 font-bold text-slate-700">${st.user}</td>
                    <td class="p-3 font-semibold text-slate-800">${st.fullName}</td>
                    <td class="p-3 font-bold ${st.isLeader ? 'text-brand-red' : 'text-slate-800'}">
                        ${st.nameLao} ${st.isLeader ? '<span class="text-[9px] bg-red-50 text-brand-red px-1.5 py-0.5 rounded ml-1 border border-red-200">ຫົວໜ້າ</span>' : ''}
                    </td>
                    <td class="p-3 text-center">${st.s1}</td>
                    <td class="p-3 text-center">${st.s2}</td>
                    <td class="p-3 text-center font-bold text-brand-red bg-red-50/40">${st.s3}</td>
                    <td class="p-3 text-center font-bold text-slate-900 bg-slate-100/50">${st.totalDuty} ກະ</td>
                    <td class="p-3 text-amber-700 font-bold text-center">${used} / ${quota}</td>
                    <td class="p-3 text-brand-red font-bold text-center">${remaining} ມື້</td>
                    <td class="p-3 text-center text-slate-600 font-semibold">${used + (st.otherLeaves || 0)} ມື້</td>
                </tr>
            `;
        });
    }

    // 2. Schedule Modifications Audit Trail
    if (auditTbody) {
        auditTbody.innerHTML = '';
        var auditLogs = window.scheduleAuditLogs || [];
        if (auditLogs.length === 0) {
            auditTbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400">ຍັງບໍ່ມີປະຫວັດການແກ້ໄຂຕາຕະລາງຫຼັງ Publish</td></tr>`;
        } else {
            auditLogs.forEach(log => {
                auditTbody.innerHTML += `
                    <tr class="hover:bg-slate-50 font-lao">
                        <td class="p-3 font-bold text-slate-700 truncate max-w-[150px]">${log.sheetTitle}</td>
                        <td class="p-3 font-semibold">${log.date} (${log.shift})</td>
                        <td class="p-3 text-amber-950 font-bold bg-amber-50 rounded">${log.oldName} ➔ ${log.newName}</td>
                        <td class="p-3 text-slate-600 italic">"${log.reason}"</td>
                        <td class="p-3 font-medium text-brand-red">${log.adminName}</td>
                        <td class="p-3 text-right text-slate-400 text-[11px]">${log.timestamp}</td>
                    </tr>
                `;
            });
        }
    }

    // 3. Security Audit Logs
    if (secTbody) {
        secTbody.innerHTML = '';
        var secLogs = window.securityAuditLogs || [];
        if (secLogs.length === 0) {
            secTbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400">ຍັງບໍ່ມີປະຫວັດ Security Logs</td></tr>`;
        } else {
            secLogs.forEach(log => {
                var typeBadge = '';
                if (log.type === 'FAILED_LOGIN') {
                    typeBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-brand-red border border-red-200">ປ້ອນລະຫັດຜິດ</span>';
                } else if (log.type === 'PASSWORD_CHANGE') {
                    typeBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">ປ່ຽນລະຫັດຜ່ານ</span>';
                } else {
                    typeBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Login ສຳເລັດ</span>';
                }

                secTbody.innerHTML += `
                    <tr class="hover:bg-slate-50 font-lao">
                        <td class="p-3">${typeBadge}</td>
                        <td class="p-3 font-bold text-slate-700">${log.user}</td>
                        <td class="p-3 text-slate-800 font-medium">${log.fullName || '-'}</td>
                        <td class="p-3 text-slate-600 font-mono text-[11px]">${log.details}</td>
                        <td class="p-3 text-center font-bold ${log.status === 'FAILED' ? 'text-brand-red' : 'text-emerald-700'}">${log.status}</td>
                        <td class="p-3 text-right text-slate-400 text-[11px]">${log.timestamp}</td>
                    </tr>
                `;
            });
        }
    }
}

// ⭐ ສະແດງຂໍ້ມູນສ່ວນຕົວໃນ WORKSPACE (ດຶງຊື່, ຂະແໜງ, ເບີໂທ ອັດຕະໂນມັດ)
function renderUserCurrentWeekWorkspace() {
    if (!window.currentUser) return;
    var sheet = getActiveSheet();
    var titleEl = document.getElementById('userCurrentShiftTitle');
    var pillsContainer = document.getElementById('userWeekDaysPills');

    // ດຶງຂໍ້ມູນເຂົ້າຊ່ອງ Form ໂປຣໄຟລ໌
    var nameInput = document.getElementById('profNameInput');
    var deptInput = document.getElementById('profDeptInput');
    var phoneInput = document.getElementById('profPhoneInput');
    var nameDisplay = document.getElementById('profNameDisplay');
    var codeDisplay = document.getElementById('profCodeDisplay');
    var photoPreview = document.getElementById('profPhotoPreview');

    if (nameInput) nameInput.value = window.currentUser.fullName || '';
    if (deptInput) deptInput.value = window.currentUser.dept || window.currentUser.department || 'ຂະແໜງບໍລິການອອນລາຍ';
    if (phoneInput) phoneInput.value = window.currentUser.phone || '';
    if (nameDisplay) nameDisplay.innerText = `${window.currentUser.nameLao} (${window.currentUser.fullName})`;
    if (codeDisplay) codeDisplay.innerText = window.currentUser.user || '';
    if (photoPreview && window.currentUser.photo) photoPreview.src = window.currentUser.photo;

    if (!titleEl || !pillsContainer) return;

    var myName = window.currentUser.nameLao;
    pillsContainer.innerHTML = '';
    var [y, m] = (sheet?.monthKey || '2026-09').split('-').map(Number);
    var myShifts = [];

    for (var i = 1; i <= 7; i++) {
        var dNum = i < 10 ? '0' + i : '' + i;
        var mNum = m < 10 ? '0' + m : '' + m;
        var dStr = `${y}-${mNum}-${dNum}`;
        var dInfo = sheet?.data?.[dStr] || {};
        var shift = 'ພັກ (OFF)';
        var pillClass = 'bg-slate-100 text-slate-500';

        if (dInfo.shift1?.includes(myName)) { shift = 'ກະ 1'; pillClass = 'bg-red-50 text-brand-red font-bold border-red-200'; myShifts.push('ກະ 1 (08:00 - 16:00)'); }
        else if (dInfo.shift2?.includes(myName)) { shift = 'ກະ 2'; pillClass = 'bg-purple-50 text-purple-800 font-bold border-purple-200'; myShifts.push('ກະ 2 (12:00 - 20:00)'); }
        else if (dInfo.shift3?.includes(myName)) { shift = 'ກະ 3'; pillClass = 'bg-slate-800 text-white font-bold'; myShifts.push('ກະ 3 (20:00 - 08:00)'); }

        pillsContainer.innerHTML += `
            <div class="px-2.5 py-1 border rounded-lg text-center text-[10px] ${pillClass}">
                <div class="font-bold">${i}/${mNum}</div>
                <div>${shift}</div>
            </div>
        `;
    }

    titleEl.innerText = myShifts.length > 0 ? `ອາທິດນີ້: ${myShifts[0]}` : 'ອາທິດນີ້: ພັກຜ່ອນ (OFF)';

    var peerSelect = document.getElementById('swapTargetPeer');
    if (peerSelect) {
        peerSelect.innerHTML = '';
        (window.users || []).filter(u => u.nameLao !== window.currentUser.nameLao && u.role !== 'SUPER_ADMIN').forEach(u => {
            peerSelect.innerHTML += `<option value="${u.nameLao}">${u.nameLao} (${u.fullName})</option>`;
        });
    }

    renderAnnualLeaveBookings();
    renderSwapHistory();
}

// 1. ອັບໂຫຼດຮູບໂປຣໄຟລ໌
function handlePhotoUploadAndCompress(event) {
    var file = event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(e) {
        var img = new Image();
        img.onload = async function() {
            var canvas = document.createElement('canvas');
            var max = 150;
            var w = img.width, h = img.height;
            if (w > h) { if (w > max) { h = Math.round((h * max) / w); w = max; } }
            else { if (h > max) { w = Math.round((w * max) / h); h = max; } }
            canvas.width = w; canvas.height = h;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, w, h);
            var photoBase64 = canvas.toDataURL('image/jpeg', 0.7);

            window.currentUser.photo = photoBase64;
            var userIdx = (window.users || []).findIndex(u => u.user.toLowerCase() === window.currentUser.user.toLowerCase());
            if (userIdx !== -1) {
                window.users[userIdx].photo = photoBase64;
            }

            saveAll();
            localStorage.setItem('ot_auth_live', JSON.stringify(window.currentUser));

            var topAvatar = document.getElementById('topAvatar');
            var profPreview = document.getElementById('profPhotoPreview');
            if (topAvatar) topAvatar.src = photoBase64;
            if (profPreview) profPreview.src = photoBase64;

            if (typeof window.renderDashboard === 'function') window.renderDashboard();
            if (typeof window.renderEmployeesTable === 'function') window.renderEmployeesTable();

            // UPDATE ຮູບລົງ SUPABASE
            if (window.supabaseClient) {
                try {
                    await window.supabaseClient
                        .from('profiles')
                        .update({ photo: photoBase64 })
                        .eq('user_code', window.currentUser.user);
                    console.log("☁️ [Supabase]: Profile photo updated in cloud!");
                } catch (err) {
                    console.error("Supabase Photo Exception:", err);
                }
            }

            showToast('ສຳເລັດ', 'ອັບເດດຮູບໂປຣໄຟລ໌ລົງ Supabase ຮຽບຮ້ອຍ!', 'success');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ⭐ 2. ປັບປຸງໂປຣໄຟລ໌: ບັນທຶກຊື່, ຂະແໜງ, ເບີໂທ ແລະ ລະຫັດຜ່ານ ລົງ SUPABASE
async function handleUpdateProfile() {
    var nameInput = document.getElementById('profNameInput');
    var passInput = document.getElementById('profPassInput');
    var deptInput = document.getElementById('profDeptInput');
    var phoneInput = document.getElementById('profPhoneInput');

    var name = nameInput ? nameInput.value.trim() : '';
    var pass = passInput ? passInput.value.trim() : '';
    var dept = deptInput ? deptInput.value.trim() : 'ຂະແໜງບໍລິການອອນລາຍ';
    var phone = phoneInput ? phoneInput.value.trim() : '';

    if (!name) { 
        showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາໃສ່ຊື່ເຕັມ', 'error'); 
        return; 
    }

    if (pass) {
        if (!window.securityAuditLogs) window.securityAuditLogs = [];
        window.securityAuditLogs.unshift({
            id: Date.now(),
            type: 'PASSWORD_CHANGE',
            user: window.currentUser.user,
            fullName: name,
            details: `ພະນັກງານປ່ຽນລະຫັດຜ່ານໃໝ່`,
            status: 'UPDATED',
            timestamp: new Date().toLocaleString('lo-LA')
        });
        window.currentUser.pass = pass;
    }

    // ອັບເດດ State ໃນ Client
    window.currentUser.fullName = name;
    window.currentUser.dept = dept;
    window.currentUser.department = dept;
    window.currentUser.phone = phone;

    var idx = (window.users || []).findIndex(u => u.user.toLowerCase() === window.currentUser.user.toLowerCase());
    if (idx !== -1) {
        window.users[idx] = { 
            ...window.users[idx], 
            fullName: name, 
            dept: dept,
            department: dept,
            phone: phone,
            pass: pass || window.users[idx].pass 
        };
    }

    saveAll();
    localStorage.setItem('ot_auth_live', JSON.stringify(window.currentUser));

    // ⭐ SYNC ລົງ SUPABASE TABLE "profiles"
    if (window.supabaseClient) {
        try {
            var updatePayload = { 
                full_name: name,
                dept: dept,
                phone: phone
            };
            if (pass) {
                updatePayload.pass = pass;
                updatePayload.password = pass;
            }

            const { error } = await window.supabaseClient
                .from('profiles')
                .update(updatePayload)
                .eq('user_code', window.currentUser.user);

            if (error) {
                console.error("❌ Supabase Profile Update Error:", error);
            } else {
                console.log("☁️ [Supabase]: Profile (Name, Dept, Phone) updated in cloud!");
            }
        } catch (e) {
            console.error("Supabase Profile Exception:", e);
        }
    }

    if (typeof window.checkAuth === 'function') window.checkAuth();
    if (typeof window.renderEmployeesTable === 'function') window.renderEmployeesTable();
    showToast('ສຳເລັດ', 'ອັບເດດຂໍ້ມູນສ່ວນຕົວ ແລະ Sync ລົງ Supabase ແລ້ວ!', 'success');
}

// 3. ຈອງມື້ພັກປະຈຳປີ
async function handleBookAnnualLeave() {
    var start = document.getElementById('bookLeaveStart')?.value;
    var end = document.getElementById('bookLeaveEnd')?.value;
    var shift = document.getElementById('bookLeaveShiftSelect')?.value || 'ກະ 1 (08:00 - 16:00)';
    var reason = document.getElementById('bookLeaveReason')?.value.trim();
    if (!start || !end || !reason) { showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາປ້ອນຂໍ້ມູນໃຫ້ຄົບ', 'error'); return; }

    var diffDays = Math.ceil(Math.abs(new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
    window.currentUser.usedAnnual = (window.currentUser.usedAnnual || 0) + diffDays;
    var idx = (window.users || []).findIndex(u => u.user.toLowerCase() === window.currentUser.user.toLowerCase());
    if (idx !== -1) window.users[idx].usedAnnual = window.currentUser.usedAnnual;

    var newBooking = {
        id: Date.now(),
        user: window.currentUser.user,
        nameLao: window.currentUser.nameLao,
        startDate: start,
        endDate: end,
        shift: shift,
        days: diffDays,
        reason: reason,
        status: 'CONFIRMED'
    };

    if (!window.annualBookings) window.annualBookings = [];
    window.annualBookings.unshift(newBooking);

    if (!window.leavesList) window.leavesList = [];
    window.leavesList.unshift({
        id: Date.now(),
        date: start,
        shift: shift,
        empName: window.currentUser.nameLao,
        reason: reason
    });

    saveAll();
    renderAnnualLeaveBookings();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();

    if (window.supabaseClient) {
        try {
            await window.supabaseClient.from('annual_bookings').insert([{
                user_code: window.currentUser.user,
                name_lao: window.currentUser.nameLao,
                start_date: start,
                end_date: end,
                shift: shift,
                days: diffDays,
                reason: reason,
                status: 'CONFIRMED'
            }]);
            console.log("☁️ [Supabase]: Leave inserted successfully!");
        } catch (e) {
            console.error("Supabase Leave Insert Exception:", e);
        }
    }

    showToast('ສຳເລັດ', `ຈອງມື້ພັກ [${shift}] ຈຳນວນ ${diffDays} ມື້ສຳເລັດ!`, 'success');
}

function promptCancelAnnualLeave(bookingId) {
    var booking = (window.annualBookings || []).find(b => b.id === bookingId);
    if (!booking) return;

    askConfirm(
        'ຍົກເລີກການຈອງມື້ພັກ',
        `ທ່ານຕ້ອງການຍົກເລີກການຈອງມື້ພັກວັນທີ ${booking.startDate} ຫາ ${booking.endDate} (${booking.days} ມື້) ແທ້ບໍ່? ລະບົບຈະຄືນໂຄຕ້າມື້ພັກໃຫ້ທ່ານທັນທີ.`,
        async () => {
            window.currentUser.usedAnnual = Math.max(0, (window.currentUser.usedAnnual || 0) - booking.days);
            var idx = (window.users || []).findIndex(u => u.user.toLowerCase() === window.currentUser.user.toLowerCase());
            if (idx !== -1) window.users[idx].usedAnnual = window.currentUser.usedAnnual;

            window.annualBookings = window.annualBookings.filter(b => b.id !== bookingId);
            window.leavesList = (window.leavesList || []).filter(l => l.date !== booking.startDate || l.empName !== booking.nameLao);

            saveAll();
            renderAnnualLeaveBookings();
            if (typeof window.renderDashboard === 'function') window.renderDashboard();

            if (window.supabaseClient) {
                try {
                    await window.supabaseClient.from('annual_bookings')
                        .delete()
                        .eq('user_code', booking.user || window.currentUser.user)
                        .eq('start_date', booking.startDate);
                    console.log("☁️ [Supabase]: Leave booking deleted!");
                } catch (e) {
                    console.error("Supabase Cancel Leave Error:", e);
                }
            }

            showToast('ສຳເລັດ', `ຍົກເລີກການຈອງມື້ພັກ ແລະ ຄືນໂຄຕ້າ ${booking.days} ມື້ຮຽບຮ້ອຍແລ້ວ!`, 'success');
        },
        'delete',
        'ຍົກເລີກມື້ພັກ'
    );
}

function renderAnnualLeaveBookings() {
    var tbody = document.getElementById('annualLeaveBookingsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    var bookings = window.annualBookings || [];
    if (bookings.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-slate-400 font-lao">ຍັງບໍ່ມີລາຍການຈອງມື້ພັກປະຈຳປີ</td></tr>`;
        return;
    }

    bookings.forEach(b => {
        var isMyBooking = (b.user === window.currentUser?.user || b.nameLao === window.currentUser?.nameLao) || (window.currentUser?.role === 'SUPER_ADMIN');

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 font-lao">
                <td class="p-3 font-bold text-brand-red">${b.nameLao}</td>
                <td class="p-3 text-slate-700">${b.startDate} ຫາ ${b.endDate}</td>
                <td class="p-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">${b.shift || 'ກະ 1 (08:00 - 16:00)'}</span></td>
                <td class="p-3 font-bold">${b.days} ມື້</td>
                <td class="p-3 text-slate-500">${b.reason}</td>
                <td class="p-3 text-right">
                    <div class="flex items-center justify-end gap-2">
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">${b.status}</span>
                        ${isMyBooking ? `
                            <button type="button" onclick="promptCancelAnnualLeave(${b.id})" class="px-2.5 py-1 bg-white hover:bg-red-50 text-brand-red border border-red-200 rounded-lg text-xs font-bold transition flex items-center gap-0.5" title="ຍົກເລີກການຈອງນີ້">
                                <span class="material-symbols-outlined text-xs">delete</span> ຍົກເລີກ
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    });
}

// 4. P2P Shift Swap
async function handleCreateSwap() {
    var start = document.getElementById('swapDateStart')?.value;
    var end = document.getElementById('swapDateEnd')?.value;
    var toName = document.getElementById('swapTargetPeer')?.value;
    var fromShift = document.getElementById('swapMyShift')?.value;
    var toShift = document.getElementById('swapTargetShift')?.value;
    var reason = document.getElementById('swapReason')?.value.trim();
    if (!start || !end || !toName) { showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາເລືອກຂໍ້ມູນໃຫ້ຄົບ', 'error'); return; }

    var newSwap = {
        id: Date.now(),
        fromName: window.currentUser.nameLao,
        toName: toName,
        startDate: start,
        endDate: end,
        fromShift: fromShift,
        toShift: toShift,
        reason: reason,
        status: 'PENDING',
        createdAt: new Date().toLocaleString('lo-LA')
    };

    if (!window.swapHistory) window.swapHistory = [];
    window.swapHistory.unshift(newSwap);

    saveAll();
    renderSwapHistory();
    if (typeof window.updateNotificationBadge === 'function') window.updateNotificationBadge();

    if (window.supabaseClient) {
        try {
            await window.supabaseClient.from('shift_swaps').insert([{
                from_name: window.currentUser.nameLao,
                to_name: toName,
                start_date: start,
                end_date: end,
                from_shift: fromShift,
                to_shift: toShift,
                reason: reason,
                status: 'PENDING'
            }]);
            console.log("☁️ [Supabase]: Swap inserted successfully!");
        } catch (e) {
            console.error("Supabase Swap Error:", e);
        }
    }

    showToast('ສຳເລັດ', `ສົ່ງຄຳຮ້ອງຂໍປ່ຽນກະຫາ "${toName}" ແລ້ວ!`, 'success');
}

function promptCancelSwap(swapId) {
    askConfirm(
        'ຍົກເລີກຄຳຮ້ອງຂໍປ່ຽນກະ',
        'ທ່ານຕ້ອງການຍົກເລີກຄຳຮ້ອງຂໍປ່ຽນກະນີ້ແທ້ບໍ່?',
        async () => {
            var swapObj = (window.swapHistory || []).find(s => s.id === swapId);
            window.swapHistory = (window.swapHistory || []).filter(s => s.id !== swapId);
            saveAll();
            renderSwapHistory();

            if (window.supabaseClient && swapObj) {
                try {
                    await window.supabaseClient.from('shift_swaps')
                        .delete()
                        .eq('from_name', swapObj.fromName)
                        .eq('start_date', swapObj.startDate);
                    console.log("☁️ [Supabase]: Swap request deleted!");
                } catch (e) {
                    console.error("Supabase Delete Swap Error:", e);
                }
            }

            showToast('ສຳເລັດ', 'ຍົກເລີກຄຳຮ້ອງຂໍປ່ຽນກະຮຽບຮ້ອຍແລ້ວ!', 'success');
        },
        'delete',
        'ຍົກເລີກຄຳຮ້ອງ'
    );
}

function renderSwapHistory() {
    var container = document.getElementById('incomingSwapsList');
    if (!container) return;
    container.innerHTML = '';

    var history = window.swapHistory || [];
    if (history.length === 0) {
        container.innerHTML = `<p class="text-slate-400 text-xs italic py-3 text-center font-lao">ຍັງບໍ່ມີປະຫວັດການຂໍປ່ຽນກະ</p>`;
        return;
    }

    history.forEach(req => {
        var isForMe = req.toName === window.currentUser?.nameLao && req.status === 'PENDING';
        var isCreatedByMe = req.fromName === window.currentUser?.nameLao && req.status === 'PENDING';
        var statusBadge = req.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : (req.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200');

        container.innerHTML += `
            <div class="p-3.5 bg-slate-50 border rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 font-lao">
                <div class="space-y-0.5">
                    <p class="font-bold text-slate-800 text-xs">${req.fromName} ຂໍແລກປ່ຽນກະກັບ ${req.toName}</p>
                    <p class="text-slate-500 text-[11px]">ຊ່ວງວັນທີ: <strong>${req.startDate} ຫາ ${req.endDate}</strong> | ${req.fromShift} ↔ ${req.toShift}</p>
                    ${req.reason ? `<p class="text-slate-400 text-[10px] italic">"${req.reason}"</p>` : ''}
                </div>
                <div class="flex items-center gap-2">
                    ${isForMe ? `
                        <button type="button" onclick="acceptSwap(${req.id})" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition">ຍອມຮັບ (Accept)</button>
                        <button type="button" onclick="declineSwap(${req.id})" class="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition">ປະຕິເສດ</button>
                    ` : (isCreatedByMe ? `
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}">ລໍຖ້າຕອບຮັບ</span>
                        <button type="button" onclick="promptCancelSwap(${req.id})" class="px-2.5 py-1 bg-white hover:bg-red-50 text-brand-red border border-red-200 rounded-xl text-xs font-bold transition">ຍົກເລີກ</button>
                    ` : `
                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge}">${req.status}</span>
                    `)}
                </div>
            </div>
        `;
    });
}

async function acceptSwap(id) {
    var req = (window.swapHistory || []).find(r => r.id === id);
    if (!req) return;

    req.status = 'COMPLETED';

    var startD = new Date(req.startDate);
    var endD = new Date(req.endDate);
    var sheet = getActiveSheet();

    for (var d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
        var dStr = d.toISOString().split('T')[0];

        if (sheet?.data?.[dStr]) {
            var sFrom = sheet.data[dStr][req.fromShift] || [];
            var sTo = sheet.data[dStr][req.toShift] || [];

            var idxFrom = sFrom.indexOf(req.fromName);
            var idxTo = sTo.indexOf(req.toName);

            if (idxFrom !== -1) sFrom[idxFrom] = req.toName;
            if (idxTo !== -1) sTo[idxTo] = req.fromName;
        }
    }

    saveAll();
    renderSwapHistory();
    renderUserCurrentWeekWorkspace();
    if (typeof window.renderScheduleTable === 'function') window.renderScheduleTable();
    if (typeof window.renderDashboard === 'function') window.renderDashboard();

    if (window.supabaseClient) {
        try {
            await window.supabaseClient.from('shift_swaps')
                .update({ status: 'COMPLETED' })
                .eq('from_name', req.fromName)
                .eq('start_date', req.startDate);
        } catch (e) {
            console.error("Supabase Accept Swap Error:", e);
        }
    }

    showToast('ປ່ຽນກະສຳເລັດ', `ສັບປ່ຽນກະປະຈຳການລະຫວ່າງ ${req.fromName} ແລະ ${req.toName} ຮຽບຮ້ອຍແລ້ວ!`, 'success');
}

async function declineSwap(id) {
    var req = (window.swapHistory || []).find(r => r.id === id);
    if (req) req.status = 'DECLINED';
    saveAll();
    renderSwapHistory();
    if (window.supabaseClient && req) {
        await window.supabaseClient.from('shift_swaps').update({ status: 'DECLINED' }).eq('from_name', req.fromName).eq('start_date', req.startDate);
    }
    showToast('ປະຕິເສດແລ້ວ', 'ປະຕິເສດຄຳຮ້ອງຂໍປ່ຽນກະ', 'info');
}

// ຜູກທຸກ Function ເຂົ້າ window
window.renderAdminAllStaffReport = renderAdminAllStaffReport;
window.renderUserCurrentWeekWorkspace = renderUserCurrentWeekWorkspace;
window.handlePhotoUploadAndCompress = handlePhotoUploadAndCompress;
window.handleUpdateProfile = handleUpdateProfile;
window.handleBookAnnualLeave = handleBookAnnualLeave;
window.promptCancelAnnualLeave = promptCancelAnnualLeave;
window.renderAnnualLeaveBookings = renderAnnualLeaveBookings;
window.handleCreateSwap = handleCreateSwap;
window.promptCancelSwap = promptCancelSwap;
window.renderSwapHistory = renderSwapHistory;
window.acceptSwap = acceptSwap;
window.declineSwap = declineSwap;

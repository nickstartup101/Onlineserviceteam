function openFairnessSummaryModal() {
    var groupSelect = document.getElementById('fairnessGroupFilterSelect');
    if (groupSelect) {
        groupSelect.innerHTML = `<option value="ALL">⭐ ພະນັກງານທັງໝົດ (All Staff)</option>`;
        window.employeeGroups.forEach(grp => {
            groupSelect.innerHTML += `<option value="${grp.id}">👥 ${grp.name}</option>`;
        });
    }
    renderFairnessSummaryData();
    document.getElementById('fairnessModal')?.classList.remove('hidden');
}

function renderFairnessSummaryData() {
    var sheet = getActiveSheet();
    var tbody = document.getElementById('fairnessSummaryTableBody');
    var filterId = document.getElementById('fairnessGroupFilterSelect')?.value || 'ALL';
    if (!tbody) return;
    tbody.innerHTML = '';

    document.getElementById('fairnessModalSub').innerText = `ຕາຕະລາງ: ${sheet.title}`;

    // 1. ກວດສອບກຸ່ມທີ່ເລືອກ
    var targetMembers = null;
    if (filterId !== 'ALL') {
        var foundGrp = window.employeeGroups.find(g => g.id === filterId);
        if (foundGrp) targetMembers = foundGrp.members;
    } else {
        // ຖ້າເລືອກ ALL ໃຫ້ເບິ່ງວ່າຕາຕະລາງປັດຈຸບັນມີໃຜເຮັດວຽກແດ່ (ຕັດຄົນທີ່ໄດ້ 0 ກະອອກ)
        var activeWorkers = new Set();
        Object.values(sheet.data || {}).forEach(day => {
            [...(day.shift1 || []), ...(day.shift2 || []), ...(day.shift3 || [])].forEach(n => {
                if (n) activeWorkers.add(n);
            });
        });
        if (activeWorkers.size > 0 && activeWorkers.size < 20) {
            targetMembers = Array.from(activeWorkers);
        }
    }

    var staffStats = {};
    window.users.filter(u => u.role !== 'SUPER_ADMIN' && (!targetMembers || targetMembers.includes(u.nameLao))).forEach(u => {
        staffStats[u.nameLao] = { nameLao: u.nameLao, isLeader: u.isLeader, s1: 0, s2: 0, s3: 0, offDays: 0, total: 0 };
    });

    var [year, month] = sheet.monthKey.split('-').map(Number);
    var daysCount = new Date(year, month, 0).getDate();

    for (var d = 1; d <= daysCount; d++) {
        var dNum = d < 10 ? '0' + d : '' + d;
        var mNum = month < 10 ? '0' + month : '' + month;
        var dStr = `${year}-${mNum}-${dNum}`;
        var dayInfo = sheet.data?.[dStr] || { shift1: [], shift2: [], shift3: [] };

        var workingToday = [...(dayInfo.shift1 || []), ...(dayInfo.shift2 || []), ...(dayInfo.shift3 || [])];

        Object.keys(staffStats).forEach(name => {
            if (dayInfo.shift1?.includes(name)) { staffStats[name].s1++; staffStats[name].total++; }
            else if (dayInfo.shift2?.includes(name)) { staffStats[name].s2++; staffStats[name].total++; }
            else if (dayInfo.shift3?.includes(name)) { staffStats[name].s3++; staffStats[name].total++; }
            else { staffStats[name].offDays++; } // ມື້ພັກຜ່ອນ
        });
    }

    var index = 1;
    Object.values(staffStats).forEach(stat => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-50">
                <td class="p-3 font-semibold text-slate-400">${index++}</td>
                <td class="p-3 font-bold ${stat.isLeader ? 'text-brand-red' : 'text-slate-800'}">
                    ${stat.nameLao} ${stat.isLeader ? '<span class="text-[9px] bg-red-50 text-brand-red px-1.5 py-0.5 rounded ml-1 border border-red-200">ຫົວໜ້າ</span>' : ''}
                </td>
                <td class="p-3 text-center font-semibold text-slate-700">${stat.s1}</td>
                <td class="p-3 text-center font-semibold text-purple-700">${stat.s2}</td>
                <td class="p-3 text-center font-bold text-brand-red bg-red-50/40">${stat.s3}</td>
                <td class="p-3 text-center font-bold text-emerald-700 bg-emerald-50/40">${stat.offDays} ວັນ</td>
                <td class="p-3 text-right font-bold text-slate-800">${stat.total} ກະ</td>
            </tr>
        `;
    });
}

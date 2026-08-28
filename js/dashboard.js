function renderDashboard() {
    var date = document.getElementById('dashDateInput').value;
    var isWeekend = new Date(date).getDay() === 6 || new Date(date).getDay() === 0;

    document.getElementById('shift1TimeText').innerText = isWeekend ? '08:00 - 13:30' : '08:00 - 16:00';
    document.getElementById('shift2TimeText').innerText = isWeekend ? '13:30 - 19:00' : '12:00 - 20:00';
    document.getElementById('shift3TimeText').innerText = isWeekend ? '19:00 - 08:00' : '20:00 - 08:00';

    var sheet = getActiveSheet();
    var dayData = sheet.data?.[date] || { shift1: [], shift2: [], shift3: [] };

    function renderStaffBadges(names) {
        return names.filter(n => n).map(n => {
            var isL = users.find(u => u.nameLao === n && u.isLeader);
            return `<span class="inline-block px-2.5 py-0.5 rounded-lg text-xs border mr-1 mb-1 font-lao ${isL ? 'bg-red-50 border-red-200 text-brand-red font-bold' : 'bg-slate-50 border-slate-200 text-slate-700'}">${n}</span>`;
        }).join('');
    }

    document.getElementById('shift1Names').innerHTML = renderStaffBadges(dayData.shift1 || []);
    document.getElementById('shift2Names').innerHTML = renderStaffBadges(dayData.shift2 || []);
    document.getElementById('shift3Names').innerHTML = renderStaffBadges(dayData.shift3 || []);

    document.getElementById('shift1CountBadge').innerText = `${(dayData.shift1 || []).filter(n => n).length} ຄົນ`;
    document.getElementById('shift2CountBadge').innerText = `${(dayData.shift2 || []).filter(n => n).length} ຄົນ`;
    document.getElementById('shift3CountBadge').innerText = `${(dayData.shift3 || []).filter(n => n).length} ຄົນ`;

    // Render Daily Leaves & Swaps
    document.getElementById('dashActivityDateLabel').innerText = `ວັນທີ ${date}`;
    var dayLeaves = leavesList.filter(l => l.date === date);
    var leavesDiv = document.getElementById('dashLeavesContainer');
    leavesDiv.innerHTML = '';
    if (dayLeaves.length === 0) {
        leavesDiv.innerHTML = `<p class="text-slate-400 italic text-xs py-1">ບໍ່ມີພະນັກງານລາພັກໃນວັນນີ້</p>`;
    } else {
        dayLeaves.forEach(l => {
            leavesDiv.innerHTML += `
                <div class="p-2.5 bg-red-50/60 border border-red-100 rounded-xl flex justify-between items-center">
                    <div><span class="font-bold text-slate-800">${l.empName}</span> <span class="text-[10px] text-slate-500">(${l.shift})</span></div>
                    <span class="text-brand-red bg-red-100 px-2 py-0.5 rounded text-[10px] font-bold">${l.reason}</span>
                </div>
            `;
        });
    }

    var daySwaps = swapHistory.filter(s => s.status === 'COMPLETED' && date >= s.startDate && date <= s.endDate);
    var swapsDiv = document.getElementById('dashSwapsContainer');
    swapsDiv.innerHTML = '';
    if (daySwaps.length === 0) {
        swapsDiv.innerHTML = `<p class="text-slate-400 italic text-xs py-1">ບໍ່ມີລາຍການປ່ຽນກະໃນວັນນີ້</p>`;
    } else {
        daySwaps.forEach(s => {
            swapsDiv.innerHTML += `
                <div class="p-2.5 bg-emerald-50/60 border border-emerald-100 rounded-xl flex justify-between items-center">
                    <div><span class="font-bold text-slate-800">${s.fromName} ↔ ${s.toName}</span></div>
                    <span class="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold">ປ່ຽນສຳເລັດ</span>
                </div>
            `;
        });
    }
}

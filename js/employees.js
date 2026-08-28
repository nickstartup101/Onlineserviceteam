function renderEmployeesTable() {
    var tbody = document.getElementById('employeesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    document.getElementById('empCountHeader').innerText = users.length;

    users.forEach((u, idx) => {
        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 font-lao">
                <td class="p-3.5 font-bold text-brand-red">${u.user}</td>
                <td class="p-3.5 font-semibold text-slate-700">${u.fullName}</td>
                <td class="p-3.5 font-bold ${u.isLeader ? 'text-brand-red' : 'text-slate-800'}">
                    ${u.nameLao} ${u.isLeader ? '<span class="text-[10px] bg-red-50 text-brand-red px-2 py-0.5 rounded-full border border-red-200 ml-1">ຫົວໜ້າກະ</span>' : ''}
                </td>
                <td class="p-3.5"><span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'SUPER_ADMIN' ? 'bg-red-gradient text-white' : 'bg-slate-100 text-slate-700'}">${u.role}</span></td>
                <td class="p-3.5 text-right">
                    <button type="button" onclick="openEditEmpModal(${idx})" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer">
                        <span class="material-symbols-outlined text-xs">edit</span> ແກ້ໄຂ
                    </button>
                </td>
            </tr>
        `;
    });
}

function promptRestoreDefaultUsers() {
    askConfirm('ກູ້ຄືນລາຍຊື່ເລີ່ມຕົ້ນ', 'ທ່ານຕ້ອງການຣີເຊັດລາຍຊື່ພະນັກງານທັງໝົດ 25 ທ່ານໃຫ້ເປັນຄ່າເລີ່ມຕົ້ນແທ້ບໍ່?', () => {
        users = MASTER_USERS_DEFAULT.map(u => ({ ...u, photo: '', annualQuota: 15, usedAnnual: 2, otherLeaves: 0 }));
        saveAll();
        renderEmployeesTable();
        renderScheduleStaffRoster();
        showToast('ກູ້ຄືນສຳເລັດ', 'ລາຍຊື່ພະນັກງານ 25 ທ່ານຖືກກູ້ຄືນແລ້ວ', 'success');
    }, 'restart_alt', 'ກູ້ຄືນຂໍ້ມູນ');
}

function openAddEmpModal() {
    document.getElementById('empModalTitle').innerText = 'ເພີ່ມພະນັກງານໃໝ່';
    document.getElementById('editEmpId').value = '';
    document.getElementById('modalEmpUser').value = '';
    document.getElementById('modalEmpFullName').value = '';
    document.getElementById('modalEmpNameLao').value = '';
    document.getElementById('modalEmpPass').value = 'bcel2026';
    document.getElementById('modalEmpIsLeader').checked = false;
    document.getElementById('empModal').classList.remove('hidden');
}

function openEditEmpModal(index) {
    var emp = users[index];
    document.getElementById('empModalTitle').innerText = 'ແກ້ໄຂຂໍ້ມູນພະນັກງານ';
    document.getElementById('editEmpId').value = index;
    document.getElementById('modalEmpUser').value = emp.user;
    document.getElementById('modalEmpFullName').value = emp.fullName;
    document.getElementById('modalEmpNameLao').value = emp.nameLao;
    document.getElementById('modalEmpPass').value = emp.pass;
    document.getElementById('modalEmpIsLeader').checked = emp.isLeader || false;
    document.getElementById('empModal').classList.remove('hidden');
}

function closeEmpModal() { document.getElementById('empModal').classList.add('hidden'); }

function handleSaveEmployee() {
    var editId = document.getElementById('editEmpId').value;
    var u = document.getElementById('modalEmpUser').value.trim();
    var full = document.getElementById('modalEmpFullName').value.trim();
    var lao = document.getElementById('modalEmpNameLao').value.trim();
    var p = document.getElementById('modalEmpPass').value.trim();
    var leader = document.getElementById('modalEmpIsLeader').checked;

    if (!u || !full || !lao || !p) { showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາປ້ອນຂໍ້ມູນພະນັກງານໃຫ້ຄົບ', 'error'); return; }

    if (editId !== '') {
        users[editId] = { ...users[editId], user: u, fullName: full, nameLao: lao, pass: p, isLeader: leader };
    } else {
        users.push({ user: u, pass: p, fullName: full, nameLao: lao, role: 'STAFF', isLeader: leader, photo: '', annualQuota: 15, usedAnnual: 0, otherLeaves: 0 });
    }

    closeEmpModal();
    renderEmployeesTable();
    renderScheduleStaffRoster();
    saveAll();
    showToast('ສຳເລັດ', 'ບັນທຶກຂໍ້ມູນພະນັກງານແລ້ວ', 'success');
}

function renderScheduleStaffRoster() {
    var container = document.getElementById('scheduleStaffRoster');
    if (!container) return;
    container.innerHTML = '';
    var staffOnly = users.filter(u => u.role !== 'SUPER_ADMIN');
    document.getElementById('rosterCountText').innerText = staffOnly.length;
    var q = (document.getElementById('rosterSearchInput')?.value || '').toLowerCase().trim();
    var filtered = staffOnly.filter(u => u.nameLao.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q));

    filtered.forEach(u => {
        container.innerHTML += `
            <div class="p-2.5 rounded-2xl border flex items-center justify-between gap-2 shadow-sm ${u.isLeader ? 'bg-red-50/60 border-red-200' : 'bg-white border-slate-200/80'}">
                <div class="truncate"><p class="text-xs font-bold text-slate-800">${u.nameLao}</p><p class="text-[9px] text-slate-400">${u.user}</p></div>
                ${u.isLeader ? `<span class="bg-brand-red text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold">ຫົວໜ້າ</span>` : ''}
            </div>
        `;
    });
}

function filterRosterSidebar() { renderScheduleStaffRoster(); }

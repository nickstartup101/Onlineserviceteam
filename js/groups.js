function renderGroupsTab() {
    var grid = document.getElementById('groupsListGrid');
    if (!grid) return;
    grid.innerHTML = '';

    employeeGroups.forEach((grp, idx) => {
        grid.innerHTML += `
            <div class="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                    <div class="flex justify-between items-start mb-2">
                        <h3 class="font-bold text-base text-slate-800">${grp.name}</h3>
                        <span class="px-2.5 py-1 bg-red-50 text-brand-red rounded-xl font-bold text-[10px] border border-red-200">Zigzag Active</span>
                    </div>
                    <p class="text-xs text-slate-500 font-semibold mb-3">ສະມາຊິກໃນກຸ່ມ (${grp.members.length} ຄົນ):</p>
                    <div class="flex flex-wrap gap-1 max-h-36 overflow-y-auto">
                        ${grp.members.map(m => `<span class="bg-slate-100 px-2 py-0.5 rounded-lg text-xs font-lao">${m}</span>`).join('')}
                    </div>
                </div>
                <div class="flex justify-end gap-2 pt-3 border-t">
                    <button type="button" onclick="openEditGroupModal(${idx})" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer">ແກ້ໄຂ</button>
                    <button type="button" onclick="promptDeleteGroup(${idx})" class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-brand-red rounded-xl text-xs font-bold cursor-pointer">ລຶບ</button>
                </div>
            </div>
        `;
    });
}

function openAddGroupModal() {
    document.getElementById('groupModalTitle').innerText = 'ສ້າງໝວດ/ກຸ່ມພະນັກງານໃໝ່';
    document.getElementById('editGroupId').value = '';
    document.getElementById('groupNameInput').value = '';
    renderGroupMemberCheckboxes([]);
    document.getElementById('groupModal').classList.remove('hidden');
}

function openEditGroupModal(index) {
    var grp = employeeGroups[index];
    document.getElementById('groupModalTitle').innerText = 'ແກ້ໄຂໝວດ/ກຸ່ມພະນັກງານ';
    document.getElementById('editGroupId').value = index;
    document.getElementById('groupNameInput').value = grp.name;
    renderGroupMemberCheckboxes(grp.members || []);
    document.getElementById('groupModal').classList.remove('hidden');
}

function closeGroupModal() { document.getElementById('groupModal').classList.add('hidden'); }

function renderGroupMemberCheckboxes(selectedMembers) {
    var container = document.getElementById('groupMemberCheckboxList');
    if (!container) return;
    container.innerHTML = '';

    var staffList = users.filter(u => u.role !== 'SUPER_ADMIN');
    staffList.forEach(u => {
        var isChecked = selectedMembers && selectedMembers.includes(u.nameLao) ? 'checked' : '';
        container.innerHTML += `
            <label class="flex items-center gap-2 text-xs p-1.5 hover:bg-white rounded-xl cursor-pointer border border-transparent hover:border-slate-200 transition">
                <input type="checkbox" value="${u.nameLao}" class="group-member-checkbox rounded text-brand-red focus:ring-brand-red h-4 w-4" ${isChecked}/>
                <span class="${u.isLeader ? 'text-brand-red font-bold' : 'text-slate-800'}">${u.nameLao} (${u.fullName})</span>
            </label>
        `;
    });
}

function toggleSelectAllGroupMembers(select) {
    document.querySelectorAll('.group-member-checkbox').forEach(cb => cb.checked = select);
}

function handleSaveGroup() {
    var editId = document.getElementById('editGroupId').value;
    var name = document.getElementById('groupNameInput').value.trim();

    if (!name) { showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາໃສ່ຊື່ກຸ່ມ', 'error'); return; }

    var selected = [];
    document.querySelectorAll('.group-member-checkbox:checked').forEach(cb => selected.push(cb.value));

    if (selected.length === 0) {
        showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາເລືອກສະມາຊິກໃນກຸ່ມຢ່າງໜ້ອຍ 1 ຄົນ', 'error');
        return;
    }

    if (editId !== '') {
        employeeGroups[editId] = { ...employeeGroups[editId], name, members: selected };
    } else {
        employeeGroups.push({ id: 'grp-' + Date.now(), name, members: selected });
    }

    saveAll();
    closeGroupModal();
    renderGroupsTab();
    showToast('ສຳເລັດ', 'ບັນທຶກຂໍ້ມູນໝວດກຸ່ມຮຽບຮ້ອຍ', 'success');
}

function promptDeleteGroup(idx) {
    var grp = employeeGroups[idx];
    askConfirm('ລຶບກຸ່ມ', `ທ່ານຕ້ອງການລຶບກຸ່ມ "${grp.name}" ແທ້ບໍ່?`, () => {
        employeeGroups.splice(idx, 1);
        saveAll();
        renderGroupsTab();
        showToast('ສຳເລັດ', 'ລຶບກຸ່ມຮຽບຮ້ອຍ', 'success');
    }, 'delete', 'ລຶບ');
}

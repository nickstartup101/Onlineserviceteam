// ================= ⭐ EMPLOYEE GROUPS CONTROLLER =================

// 1. RENDER ລາຍການກຸ່ມທັງໝົດ (ປ້ອງກັນກຸ່ມຫາຍ 100%)
function renderGroupsListGrid() {
    var container = document.getElementById('groupsListGrid');
    if (!container) return;

    // ຖ້າກຸ່ມຫວ່າງເປົ່າ ໃຫ້ດຶງກຸ່ມມາດຕະຖານມາໃສ່ທັນທີ
    if (!window.employeeGroups || window.employeeGroups.length === 0) {
        window.employeeGroups = [
            {
                id: 'grp-g7-flex',
                name: 'ກຸ່ມທີມບໍລິການ 7 ຄົນ (G7 Flex)',
                members: ['ສົມທະຍາ', 'ມິກກີ້', 'ທູຮັກ', 'ແພັກກີ້', 'ເອກສະຫວ່າງ', 'ໂທມິກ', 'ບຸນຮັກ']
            },
            {
                id: 'grp-main-17',
                name: 'ກຸ່ມທີມບໍລິການຫຼັກ (17 ຄົນ)',
                members: ['ແສງດາວ', 'ພອນສະຫວັນ', 'ບຸນປະເສີດ', 'ພັນນິກອນ', 'ສົມທະຍາ', 'ມິກກີ້', 'ທູຮັກ', 'ແພັກກີ້', 'ເອກສະຫວ່າງ', 'ໂທມິກ', 'ບຸນຮັກ', 'ປະສັງສິນ', 'ສາຍທອງ', 'ສົມຊາຍ', 'ສີຊຸມພູ', 'ສຸລິຍະສັກ', 'ໄທສະຫວາດ']
            }
        ];
        if (typeof saveAll === 'function') saveAll();
    }

    container.innerHTML = '';

    window.employeeGroups.forEach(function(grp, idx) {
        var memberBadges = (grp.members || []).map(function(m) {
            return `<span class="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold">${m}</span>`;
        }).join(' ');

        var isG7 = (grp.members || []).length === 7;

        container.innerHTML += `
            <div class="bg-white border-2 ${isG7 ? 'border-blue-300 shadow-blue-50' : 'border-slate-200'} rounded-3xl p-5 shadow-sm hover:shadow-md transition space-y-3 font-lao">
                <div class="flex justify-between items-start border-b pb-3">
                    <div>
                        <div class="flex items-center gap-1.5">
                            <h3 class="font-bold text-sm text-slate-800">${grp.name}</h3>
                            ${isG7 ? '<span class="px-2 py-0.5 bg-blue-100 text-blue-800 text-[9px] rounded-full font-black">G7 Rolling 5/2</span>' : ''}
                        </div>
                        <p class="text-[11px] text-slate-500 mt-0.5">ຈຳນວນສະມາຊິກ: <strong>${(grp.members || []).length} ຄົນ</strong></p>
                    </div>
                    <div class="flex items-center gap-1">
                        <button type="button" onclick="openEditGroupModal('${grp.id}')" class="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition" title="ແກ້ໄຂກຸ່ມ">
                            <span class="material-symbols-outlined text-base">edit</span>
                        </button>
                        <button type="button" onclick="promptDeleteGroup('${grp.id}')" class="p-1.5 hover:bg-red-50 rounded-lg text-brand-red transition" title="ລຶບກຸ່ມ">
                            <span class="material-symbols-outlined text-base">delete</span>
                        </button>
                    </div>
                </div>
                <div class="flex flex-wrap gap-1.5 pt-1">
                    ${memberBadges || '<span class="text-xs text-slate-400 italic">ຍັງບໍ່ມີສະມາຊິກ</span>'}
                </div>
            </div>
        `;
    });
}
window.renderGroupsListGrid = renderGroupsListGrid;

// 2. ເປີດ MODAL ສ້າງກຸ່ມໃໝ່
function openAddGroupModal() {
    document.getElementById('editGroupId').value = '';
    document.getElementById('groupNameInput').value = '';
    renderGroupMemberCheckboxes([]);
    var modalTitle = document.getElementById('groupModalTitle');
    if (modalTitle) modalTitle.innerText = 'ສ້າງໝວດ/ກຸ່ມພະນັກງານໃໝ່';
    document.getElementById('groupModal')?.classList.remove('hidden');
}
window.openAddGroupModal = openAddGroupModal;

// 3. ເປີດ MODAL ແກ້ໄຂກຸ່ມ
function openEditGroupModal(id) {
    var grp = (window.employeeGroups || []).find(function(g) { return g.id === id; });
    if (!grp) return;

    document.getElementById('editGroupId').value = grp.id;
    document.getElementById('groupNameInput').value = grp.name;
    renderGroupMemberCheckboxes(grp.members || []);
    var modalTitle = document.getElementById('groupModalTitle');
    if (modalTitle) modalTitle.innerText = 'ແກ້ໄຂໝວດ/ກຸ່ມ: ' + grp.name;
    document.getElementById('groupModal')?.classList.remove('hidden');
}
window.openEditGroupModal = openEditGroupModal;

function closeGroupModal() {
    document.getElementById('groupModal')?.classList.add('hidden');
}
window.closeGroupModal = closeGroupModal;

// 4. ສະແດງ CHECKBOX ລາຍຊື່ພະນັກງານໃຫ້ເລືອກເຂົ້າກຸ່ມ
function renderGroupMemberCheckboxes(selectedMembers) {
    var container = document.getElementById('groupMemberCheckboxList');
    if (!container) return;

    container.innerHTML = '';
    var staffList = (window.users || []).filter(function(u) { return u && u.role !== 'SUPER_ADMIN'; });

    staffList.forEach(function(u) {
        var isChecked = selectedMembers.includes(u.nameLao);
        container.innerHTML += `
            <label class="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-xl cursor-pointer text-xs">
                <input type="checkbox" name="groupMemberChk" value="${u.nameLao}" ${isChecked ? 'checked' : ''} class="rounded text-brand-red focus:ring-brand-red h-4 w-4"/>
                <span class="font-bold ${u.isLeader ? 'text-brand-red' : 'text-slate-800'}">${u.nameLao} (${u.fullName})</span>
                ${u.isLeader ? '<span class="text-[9px] bg-red-50 text-brand-red px-1 rounded font-bold border border-red-200">ຫົວໜ້າ</span>' : ''}
            </label>
        `;
    });
}

function toggleSelectAllGroupMembers(selectAll) {
    var chks = document.querySelectorAll('input[name="groupMemberChk"]');
    chks.forEach(function(c) { c.checked = selectAll; });
}
window.toggleSelectAllGroupMembers = toggleSelectAllGroupMembers;

// 5. ບັນທຶກກຸ່ມ ລົງ SUPABASE
async function handleSaveGroup() {
    var id = document.getElementById('editGroupId')?.value;
    var name = document.getElementById('groupNameInput')?.value.trim();
    if (!name) {
        showToast('ແຈ້ງເຕືອນ', 'ກະລຸນາໃສ່ຊື່ກຸ່ມ', 'error');
        return;
    }

    var chks = document.querySelectorAll('input[name="groupMemberChk"]:checked');
    var members = Array.from(chks).map(function(c) { return c.value; });

    if (!window.employeeGroups) window.employeeGroups = [];

    var newGroup = {
        id: id || ('grp-' + Date.now()),
        name: name,
        members: members
    };

    var idx = window.employeeGroups.findIndex(function(g) { return g.id === newGroup.id; });
    if (idx !== -1) {
        window.employeeGroups[idx] = newGroup;
    } else {
        window.employeeGroups.push(newGroup);
    }

    saveAll();

    // Sync ລົງ Supabase table "employee_groups"
    if (window.supabaseClient) {
        try {
            await window.supabaseClient.from('employee_groups').upsert(newGroup, { onConflict: 'id' });
        } catch (err) {
            console.error("Supabase Save Group Error:", err);
        }
    }

    closeGroupModal();
    renderGroupsListGrid();
    showToast('ສຳເລັດ', `ບັນທຶກກຸ່ມ "${name}" ແລະ Sync ລົງ Supabase ແລ້ວ!`, 'success');
}
window.handleSaveGroup = handleSaveGroup;

// 6. ລຶບກຸ່ມ + DELETE ຈາກ SUPABASE
function promptDeleteGroup(id) {
    var grp = (window.employeeGroups || []).find(function(g) { return g.id === id; });
    if (!grp) return;

    askConfirm('ຢືນຢັນການລຶບກຸ່ມ', `ທ່ານຕ້ອງການລຶບ "${grp.name}" ແທ້ບໍ່?`, async function() {
        window.employeeGroups = (window.employeeGroups || []).filter(function(g) { return g.id !== id; });
        saveAll();

        if (window.supabaseClient) {
            try {
                await window.supabaseClient.from('employee_groups').delete().eq('id', id);
            } catch (e) {}
        }

        renderGroupsListGrid();
        showToast('ສຳເລັດ', `ລຶບກຸ່ມ "${grp.name}" ອອກຈາກລະບົບແລ້ວ`, 'success');
    }, 'delete', 'ລຶບກຸ່ມ');
}
window.promptDeleteGroup = promptDeleteGroup;

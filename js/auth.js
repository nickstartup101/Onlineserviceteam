function checkAuth() {
    var modal = document.getElementById('loginModal');
    if (!window.currentUser) {
        if (modal) modal.classList.remove('hidden');
    } else {
        if (modal) modal.classList.add('hidden');
        document.getElementById('topUserName').innerText = window.currentUser.nameLao;
        document.getElementById('topUserRole').innerText = window.currentUser.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Staff';
        
        var avatar = window.currentUser.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(window.currentUser.nameLao)}&background=c01e2e&color=fff`;
        document.getElementById('topAvatar').src = avatar;
        document.getElementById('profPhotoPreview').src = avatar;
        document.getElementById('profNameDisplay').innerText = window.currentUser.fullName;
        document.getElementById('profCodeDisplay').innerText = window.currentUser.user;
        document.getElementById('profNameInput').value = window.currentUser.fullName;

        var isAdmin = window.currentUser.role === 'SUPER_ADMIN';
        document.querySelectorAll('.admin-only').forEach(el => el.style.display = isAdmin ? 'flex' : 'none');

        var topProfileNav = document.getElementById('topProfileNavTitle');
        var sideProfileNav = document.getElementById('sideProfileNavTitle');
        var mobSideProfileNav = document.getElementById('mobSideProfileNavTitle');
        var profileHeaderTitle = document.getElementById('profilePageHeaderTitle');
        var profileHeaderSub = document.getElementById('profilePageHeaderSub');

        if (isAdmin) {
            if (topProfileNav) topProfileNav.innerText = "Reports Hub & Admin";
            if (sideProfileNav) sideProfileNav.innerText = "Reports Hub & Admin";
            if (mobSideProfileNav) mobSideProfileNav.innerText = "Reports Hub & Admin";
            if (profileHeaderTitle) profileHeaderTitle.innerText = "ສູນລວມລາຍງານການປະຈຳການ, ການລາພັກ & ການ Swap (Admin Hub)";
            if (profileHeaderSub) profileHeaderSub.innerText = "ສະຫຼຸບຈຳນວນກະປະຈຳການ, ມື້ພັກ 15 ມື້ຂອງພະນັກງານທຸກຄົນ ແລະ ປະຫວັດການປ່ຽນກະສູນກາງ";
            
            document.getElementById('adminReportsSection')?.classList.remove('hidden');
            document.getElementById('userStaffWorkspaceSection')?.classList.add('hidden');
            renderAdminAllStaffReport();
        } else {
            if (topProfileNav) topProfileNav.innerText = "My Workspace & Hub";
            if (sideProfileNav) sideProfileNav.innerText = "My Workspace & Hub";
            if (mobSideProfileNav) mobSideProfileNav.innerText = "My Workspace & Hub";
            if (profileHeaderTitle) profileHeaderTitle.innerText = "My Workspace, Profile & Leave Hub";
            if (profileHeaderSub) profileHeaderSub.innerText = "ຕາຕະລາງປະຈຳການສ່ວນຕົວຂອງທ່ານ, ສະຫຼຸບມື້ພັກປະຈຳປີ ແລະ ປະຕິທິນຈອງວັນພັກ";
            
            document.getElementById('adminReportsSection')?.classList.add('hidden');
            document.getElementById('userStaffWorkspaceSection')?.classList.remove('hidden');
            renderUserCurrentWeekWorkspace();
        }

        renderDashboard();
        renderEmployeesTable();
        renderScheduleStaffRoster();
    }
}

function doLogin() {
    var u = document.getElementById('loginUsername').value.trim();
    var p = document.getElementById('loginPassword').value.trim();
    
    // ດຶງຖານຂໍ້ມູນພະນັກງານແບບປອດໄພ 100%
    var userPool = window.users || JSON.parse(localStorage.getItem('ot_users_master')) || window.MASTER_USERS_DEFAULT || [];
    
    if (!window.users || window.users.length === 0) {
        window.users = userPool;
    }

    var found = userPool.find(usr => usr.user.toLowerCase() === u.toLowerCase() && usr.pass === p);

    if (found) {
        window.currentUser = { ...found };
        localStorage.setItem('ot_auth_live', JSON.stringify(window.currentUser));
        document.getElementById('loginModal').classList.add('hidden');
        checkAuth();
        showToast('ເຂົ້າສູ່ລະບົບສຳເລັດ', `ຍິນດີຕ້ອນຮັບທ່ານ ${window.currentUser.nameLao}`, 'success');
    } else {
        var err = document.getElementById('loginErrMsg');
        err.innerText = "Username ຫຼື Password ບໍ່ຖືກຕ້ອງ!";
        err.classList.remove('hidden');
    }
}

function logout() {
    localStorage.removeItem('ot_auth_live');
    window.currentUser = null;
    location.reload();
}

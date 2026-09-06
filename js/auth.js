// ================= ⭐ RESILIENT UNIVERSAL AUTHENTICATION =================

function normalizeUserObject(u) {
    if (!u) return null;
    return {
        user: (u.user || u.user_code || u.username || '').trim(),
        pass: (u.pass || u.password || 'bcel2026').trim(),
        fullName: (u.fullName || u.full_name || '').trim(),
        nameLao: (u.nameLao || u.name_lao || '').trim(),
        role: (u.role || 'STAFF').toUpperCase().trim(),
        isLeader: !!(u.isLeader || u.is_leader),
        dept: (u.dept || 'ຂະແໜງບໍລິການອອນລາຍ').trim(),
        position: (u.position || (u.isLeader ? 'ຫົວໜ້າກະ' : 'ພະນັກງານ')).trim(),
        phone: (u.phone || '020 5599 8877').trim(),
        photo: u.photo || '',
        annualQuota: u.annualQuota || 15,
        usedAnnual: u.usedAnnual || 0,
        otherLeaves: u.otherLeaves || 0
    };
}

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
            if (profileHeaderTitle) profileHeaderTitle.innerText = "ສູນລວມລາຍງານການປະຈຳການ, ການລາພັກ, ການ Swap & Security Logs";
            if (profileHeaderSub) profileHeaderSub.innerText = "ສະຫຼຸບຈຳນວນກະປະຈຳການ, ມື້ພັກ 15 ມື້ຂອງພະນັກງານທຸກຄົນ ແລະ ປະຫວັດຄວາມປອດໄພການເຂົ້າລະຫັດ";
            
            document.getElementById('adminReportsSection')?.classList.remove('hidden');
            document.getElementById('userStaffWorkspaceSection')?.classList.add('hidden');
            if (typeof window.renderAdminAllStaffReport === 'function') window.renderAdminAllStaffReport();
        } else {
            if (topProfileNav) topProfileNav.innerText = "My Workspace & Hub";
            if (sideProfileNav) sideProfileNav.innerText = "My Workspace & Hub";
            if (mobSideProfileNav) mobSideProfileNav.innerText = "My Workspace & Hub";
            if (profileHeaderTitle) profileHeaderTitle.innerText = "My Workspace, Profile & Leave Hub";
            if (profileHeaderSub) profileHeaderSub.innerText = "ຕາຕະລາງປະຈຳການສ່ວນຕົວຂອງທ່ານ, ສະຫຼຸບມື້ພັກປະຈຳປີ ແລະ ປະຕິທິນຈອງວັນພັກ";
            
            document.getElementById('adminReportsSection')?.classList.add('hidden');
            document.getElementById('userStaffWorkspaceSection')?.classList.remove('hidden');
            if (typeof window.renderUserCurrentWeekWorkspace === 'function') window.renderUserCurrentWeekWorkspace();
        }

        if (typeof window.renderDashboard === 'function') window.renderDashboard();
        if (typeof window.renderEmployeesTable === 'function') window.renderEmployeesTable();
        if (typeof window.renderScheduleStaffRoster === 'function') window.renderScheduleStaffRoster();
        if (typeof window.updateNotificationBadge === 'function') window.updateNotificationBadge();
    }
}

// ⭐ ລະບົບ Login ແບບ Auto-Trim & Universal Match (100% Guaranteed)
function doLogin() {
    var uInput = document.getElementById('loginUsername');
    var pInput = document.getElementById('loginPassword');
    if (!uInput || !pInput) return;

    var u = uInput.value.trim().toLowerCase();
    var p = pInput.value.trim();
    
    var rawPool = (window.users && window.users.length > 0) 
        ? window.users 
        : (safeJSONParse('ot_users_master', null) || window.MASTER_USERS_DEFAULT || []);

    var userPool = rawPool.map(normalizeUserObject);
    window.users = userPool;

    // 1. ຄົ້ນຫາໃນຖານຂໍ້ມູນ
    var found = userPool.find(usr => {
        var dbUser = usr.user.toLowerCase().trim();
        var dbPass = usr.pass.trim();
        return dbUser === u && dbPass === p;
    });

    // 2. Fallback ພິເສດສຳລັບບັນຊີເລີ່ມຕົ້ນ (ປ້ອງກັນການຕິດຂັດ)
    if (!found) {
        var defaultAcc = window.MASTER_USERS_DEFAULT.find(d => d.user.toLowerCase() === u && d.pass === p);
        if (defaultAcc) {
            found = normalizeUserObject(defaultAcc);
        }
    }

    if (found) {
        window.currentUser = { ...found };
        localStorage.setItem('ot_auth_live', JSON.stringify(window.currentUser));
        
        var modal = document.getElementById('loginModal');
        if (modal) modal.classList.add('hidden');
        
        checkAuth();
        showToast('ເຂົ້າສູ່ລະບົບສຳເລັດ', `ຍິນດີຕ້ອນຮັບທ່ານ ${window.currentUser.nameLao}`, 'success');
    } else {
        var err = document.getElementById('loginErrMsg');
        if (err) {
            err.innerText = "Username ຫຼື Password ບໍ່ຖືກຕ້ອງ!";
            err.classList.remove('hidden');
        }
    }
}

function logout() {
    localStorage.removeItem('ot_auth_live');
    window.currentUser = null;
    location.reload();
}

window.checkAuth = checkAuth;
window.doLogin = doLogin;
window.logout = logout;
window.normalizeUserObject = normalizeUserObject;

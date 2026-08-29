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

// ⭐ ລະບົບ Login ພ້ອມບັນທຶກ Security Log ໃນ Database
function doLogin() {
    var u = document.getElementById('loginUsername').value.trim();
    var p = document.getElementById('loginPassword').value.trim();
    
    var userPool = window.users || JSON.parse(localStorage.getItem('ot_users_master')) || window.MASTER_USERS_DEFAULT || [];
    if (!window.users || window.users.length === 0) window.users = userPool;

    if (!window.securityAuditLogs) window.securityAuditLogs = [];

    var foundUserOnly = userPool.find(usr => usr.user.toLowerCase() === u.toLowerCase());
    var found = userPool.find(usr => usr.user.toLowerCase() === u.toLowerCase() && usr.pass === p);

    if (found) {
        // ບັນທຶກ Log: ເຂົ້າລະຫັດຖືກຕ້ອງ
        window.securityAuditLogs.unshift({
            id: Date.now(),
            type: 'SUCCESS_LOGIN',
            user: u,
            fullName: found.fullName,
            details: `ເຂົ້າສູ່ລະບົບສຳເລັດ (${found.nameLao})`,
            status: 'SUCCESS',
            timestamp: new Date().toLocaleString('lo-LA')
        });

        window.currentUser = { ...found };
        localStorage.setItem('ot_auth_live', JSON.stringify(window.currentUser));
        saveAll();
        document.getElementById('loginModal').classList.add('hidden');
        checkAuth();
        showToast('ເຂົ້າສູ່ລະບົບສຳເລັດ', `ຍິນດີຕ້ອນຮັບທ່ານ ${window.currentUser.nameLao}`, 'success');
    } else {
        // ⭐ ບັນທຶກ Log: ປ້ອນລະຫັດຜິດ (Failed Login)
        window.securityAuditLogs.unshift({
            id: Date.now(),
            type: 'FAILED_LOGIN',
            user: u || '(ບໍ່ໄດ້ປ້ອນ)',
            fullName: foundUserOnly ? foundUserOnly.fullName : 'ບໍ່ພົບ Username ໃນລະບົບ',
            details: `ປ້ອນລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ (ລະຫັດທີ່ພະຍາຍາມປ້ອນ: "${p}")`,
            status: 'FAILED',
            timestamp: new Date().toLocaleString('lo-LA')
        });
        saveAll();

        var err = document.getElementById('loginErrMsg');
        err.innerText = "Username ຫຼື Password ບໍ່ຖືກຕ້ອງ! (ລະບົບໄດ້ບັນທຶກ Log ຄວາມພະຍາຍາມເຂົ້າລະຫັດແລ້ວ)";
        err.classList.remove('hidden');
    }
}

// ⭐ ລະບົບຂໍຄວາມຊ່ວຍເຫຼືອ "ລືມລະຫັດຜ່ານ"
function handleForgotPassword() {
    var u = prompt('ກະລຸນາໃສ່ Username ຫຼື ລະຫັດພະນັກງານຂອງທ່ານ:');
    if (!u) return;

    if (!window.securityAuditLogs) window.securityAuditLogs = [];
    window.securityAuditLogs.unshift({
        id: Date.now(),
        type: 'FORGOT_PASSWORD_REQUEST',
        user: u,
        fullName: 'ພະນັກງານແຈ້ງລືມລະຫັດ',
        details: `ພະນັກງານກົດຂໍ Reset ລະຫັດຜ່ານ ເນື່ອງຈາກບໍ່ຈື່ລະຫັດ`,
        status: 'PENDING_RESET',
        timestamp: new Date().toLocaleString('lo-LA')
    });

    if (!window.systemNotifications) window.systemNotifications = [];
    window.systemNotifications.unshift({
        id: Date.now(),
        title: `ແຈ້ງເຕືອນລືມລະຫັດຜ່ານ: ${u}`,
        message: `ພະນັກງານລະຫັດ ${u} ໄດ້ແຈ້ງລືມລະຫັດຜ່ານ ກະລຸນາກວດສອບ ແລະ Reset ລະຫັດໃຫ້ເພິ່ນ.`,
        tag: 'Security',
        date: new Date().toLocaleString('lo-LA'),
        readBy: []
    });

    saveAll();
    alert('ລະບົບໄດ້ບັນທຶກຄຳຮ້ອງ ແລະ ແຈ້ງເຕືອນຫາ Super Admin ຮຽບຮ້ອຍແລ້ວ! ກະລຸນາຕິດຕໍ່ Admin ເພື່ອຮັບລະຫັດໃໝ່.');
}

function logout() {
    localStorage.removeItem('ot_auth_live');
    window.currentUser = null;
    location.reload();
}

window.checkAuth = checkAuth;
window.doLogin = doLogin;
window.handleForgotPassword = handleForgotPassword;
window.logout = logout;

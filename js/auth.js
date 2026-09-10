// ================= ⭐ AUTHENTICATION & LOGIN CONTROLLER =================

// 1. ລາຍຊື່ພະນັກງານເລີ່ມຕົ້ນ (Default Users Roster)
var defaultSystemUsers = [
    { user: 'admin', pass: 'admin123', nameLao: 'Admin', fullName: 'Super Admin', role: 'SUPER_ADMIN', isLeader: true, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5599 8877' },
    { user: 'BCEL0765', pass: 'bcel2026', nameLao: 'ແສງດາວ', fullName: 'SENGDAO DOUANGPRASEUTH', role: 'Staff', isLeader: true, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5501 2345' },
    { user: 'BCEL0272', pass: 'bcel2026', nameLao: 'ພອນສະຫວັນ', fullName: 'PHONSAVANH PHOMMAVONG', role: 'Staff', isLeader: true, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5502 3456' },
    { user: 'BCEL1055', pass: 'bcel2026', nameLao: 'ບຸນປະເສີດ', fullName: 'BOUNPRASEUTH VILAYPHONE', role: 'Staff', isLeader: true, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5503 4567' },
    { user: 'BCEL0872', pass: 'bcel2026', nameLao: 'ພັນນິກອນ', fullName: 'PHANNIKHONE PHOMMASENG', role: 'Staff', isLeader: true, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5504 5678' },
    { user: 'BCEL0277', pass: 'bcel2026', nameLao: 'ສົມທະຍາ', fullName: 'SOMTHAYA BOUTDAXAY', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5505 6789' },
    { user: 'BCEL0707', pass: 'bcel2026', nameLao: 'ມິກກີ້', fullName: 'MIKKY SAYALATH', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5506 7890' },
    { user: 'BCEL1431', pass: 'bcel2026', nameLao: 'ທູຮັກ', fullName: 'THOUHAK SENGCHALEUN', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5507 8901' },
    { user: 'BCEL1532', pass: 'bcel2026', nameLao: 'ແພັກກີ້', fullName: 'PACKY PHOMMALATH', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5508 9012' },
    { user: 'BCEL2007', pass: 'bcel2026', nameLao: 'ເອກສະຫວ່າງ', fullName: 'EKXAVANG PHANTHAVONG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5509 0123' },
    { user: 'BCEL2120', pass: 'bcel2026', nameLao: 'ໂທມິກ', fullName: 'TONICK BOUDDASIEN', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5599 1122' },
    { user: 'BCEL1101', pass: 'bcel2026', nameLao: 'ບຸນຮັກ', fullName: 'BOUNHAK XAYAVONG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5510 1122' },
    { user: 'BCEL1102', pass: 'bcel2026', nameLao: 'ປະສັງສິນ', fullName: 'PASANGSIN SOULIVONG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5511 2233' },
    { user: 'BCEL1103', pass: 'bcel2026', nameLao: 'ສາຍທອງ', fullName: 'SAYTHONG MANIVONG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5512 3344' },
    { user: 'BCEL1104', pass: 'bcel2026', nameLao: 'ສົມຊາຍ', fullName: 'SOMCHAY VONGXAY', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5513 4455' },
    { user: 'BCEL1105', pass: 'bcel2026', nameLao: 'ສີຊຸມພູ', fullName: 'SICHUMPHOU LATTHAVONG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5514 5566' },
    { user: 'BCEL1106', pass: 'bcel2026', nameLao: 'ສຸລິຍະສັກ', fullName: 'SOULIYASACK PHANTHAMALY', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5515 6677' },
    { user: 'BCEL1107', pass: 'bcel2026', nameLao: 'ໄທສະຫວາດ', fullName: 'THAISAVATH PHOMMAVONG', role: 'Staff', isLeader: false, dept: 'ຂະແໜງບໍລິການອອນລາຍ', phone: '020 5516 7788' }
];

// ກວດສອບ ແລະ ຕັ້ງຄ່າ window.users ເລີ່ມຕົ້ນ
if (!window.users || window.users.length === 0) {
    var storedUsers = typeof window.safeJSONParse === 'function' 
        ? window.safeJSONParse(localStorage.getItem('ot_users'), defaultSystemUsers)
        : defaultSystemUsers;
    window.users = (storedUsers && storedUsers.length > 0) ? storedUsers : defaultSystemUsers;
}

// 2. ຟັງຊັນດຶງລາຍຊື່ User ທີ່ໃຊ້ໄດ້ຈິງ (ປ້ອງກັນ String Corrupt)
function getActiveUsersList() {
    if (window.users && window.users.length > 0) return window.users;
    var raw = localStorage.getItem('ot_users');
    if (raw && typeof window.safeJSONParse === 'function') {
        var parsed = window.safeJSONParse(raw, null);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            window.users = parsed;
            return parsed;
        }
    }
    window.users = defaultSystemUsers;
    return defaultSystemUsers;
}

// ⭐ 3. LOGIN FUNCTION (ແກ້ໄຂ Error ແຖວ 93 ແລະ ປົດລັອກການເຂົ້າສູ່ລະບົບ 100%)
async function doLogin() {
    var uInput = document.getElementById('loginUsername');
    var pInput = document.getElementById('loginPassword');
    var errMsg = document.getElementById('loginErrMsg');

    var username = uInput ? uInput.value.trim() : '';
    var password = pInput ? pInput.value.trim() : '';

    if (errMsg) errMsg.classList.add('hidden');

    if (!username || !password) {
        if (errMsg) {
            errMsg.innerText = 'ກະລຸນາປ້ອນຊື່ຜູ້ໃຊ້ ແລະ ລະຫັດຜ່ານ';
            errMsg.classList.remove('hidden');
        }
        return;
    }

    // ດຶງລາຍຊື່ຜູ້ໃຊ້ແບບປອດໄພ
    var userList = getActiveUsersList();

    // 1. ຄົ້ນຫາ User ຈາກຖານຂໍ້ມູນທ້ອງຖິ່ນ
    var foundUser = userList.find(function(u) {
        if (!u) return false;
        var matchUser = (u.user && u.user.toLowerCase() === username.toLowerCase()) ||
                        (u.nameLao && u.nameLao.toLowerCase() === username.toLowerCase());
        var matchPass = (String(u.pass) === String(password)) || (String(u.password) === String(password));
        return matchUser && matchPass;
    });

    // 2. ຖ້າບໍ່ພົບ, ລອງກວດສອບກັບ Supabase Table "profiles" ໂດຍກົງ
    if (!foundUser && window.supabaseClient) {
        try {
            var res = await window.supabaseClient
                .from('profiles')
                .select('*')
                .or(`user_code.ilike.${username},name_lao.ilike.${username}`)
                .limit(1);

            if (res.data && res.data.length > 0) {
                var cp = res.data[0];
                var cloudPass = cp.pass || cp.password;
                if (String(cloudPass) === String(password)) {
                    foundUser = {
                        user: cp.user_code,
                        pass: cloudPass,
                        nameLao: cp.name_lao || cp.user_code,
                        fullName: cp.full_name || cp.user_code,
                        role: cp.role || 'Staff',
                        isLeader: !!cp.is_leader,
                        dept: cp.dept || 'ຂະແໜງບໍລິການອອນລາຍ',
                        phone: cp.phone || '',
                        photo: cp.photo || ''
                    };
                    // ເພີ່ມລົງໃນລາຍຊື່ທ້ອງຖິ່ນ
                    window.users.push(foundUser);
                    if (typeof saveAll === 'function') saveAll();
                }
            }
        } catch (err) {
            console.warn("Supabase auth fallback check:", err);
        }
    }

    // 3. ກໍລະນີ Login ສຳເລັດ
    if (foundUser) {
        window.currentUser = foundUser;
        localStorage.setItem('ot_auth_live', JSON.stringify(foundUser));

        // ອັບເດດ UI Header
        updateAuthUI(foundUser);

        // ເຊື່ອງ Login Modal
        var modal = document.getElementById('loginModal');
        if (modal) modal.classList.add('hidden');

        if (uInput) uInput.value = '';
        if (pInput) pInput.value = '';

        if (typeof showToast === 'function') {
            showToast('ເຂົ້າສູ່ລະບົບສຳເລັດ', `ຍິນດີຕ້ອນຮັບທ່ານ ${foundUser.nameLao} (${foundUser.role})`, 'success');
        }

        // ໂຫຼດຂໍ້ມູນໜ້າຕ່າງໆ
        if (typeof switchTab === 'function') switchTab('dashboard');
        if (typeof loadEverythingFromSupabase === 'function') setTimeout(loadEverythingFromSupabase, 500);

    } else {
        // 4. ກໍລະນີລະຫັດຜ່ານ ຫຼື Username ບໍ່ຖືກ
        if (errMsg) {
            errMsg.innerText = 'ຊື່ຜູ້ໃຊ້ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ!';
            errMsg.classList.remove('hidden');
        }
    }
}
window.doLogin = doLogin;

// 4. ອັບເດດ UI ຕາມສິດທິຜູ້ໃຊ້ (Admin / Staff)
function updateAuthUI(user) {
    if (!user) return;

    var topName = document.getElementById('topUserName');
    var topRole = document.getElementById('topUserRole');
    var topAv = document.getElementById('topAvatar');

    if (topName) topName.innerText = user.nameLao || user.user;
    if (topRole) topRole.innerText = user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Staff';
    if (topAv && user.photo) topAv.src = user.photo;

    // ເຊື່ອງ / ສະແດງປຸ່ມ Admin
    var isAdmin = (user.role === 'SUPER_ADMIN');
    var adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(function(el) {
        if (isAdmin) {
            el.classList.remove('hidden');
            el.style.display = '';
        } else {
            el.classList.add('hidden');
            el.style.display = 'none';
        }
    });
}
window.updateAuthUI = updateAuthUI;

// 5. ກວດສອບ Session ເມື່ອເປີດເວັບ (Check Auth)
function checkAuth() {
    var stored = localStorage.getItem('ot_auth_live');
    var user = typeof window.safeJSONParse === 'function' ? window.safeJSONParse(stored, null) : null;

    if (user && user.user) {
        window.currentUser = user;
        updateAuthUI(user);
        var modal = document.getElementById('loginModal');
        if (modal) modal.classList.add('hidden');
    } else {
        var modal = document.getElementById('loginModal');
        if (modal) modal.classList.remove('hidden');
    }
}
window.checkAuth = checkAuth;

// 6. LOGOUT FUNCTION
function logout() {
    window.currentUser = null;
    localStorage.removeItem('ot_auth_live');
    var modal = document.getElementById('loginModal');
    if (modal) modal.classList.remove('hidden');

    var uInput = document.getElementById('loginUsername');
    var pInput = document.getElementById('loginPassword');
    if (uInput) uInput.value = '';
    if (pInput) pInput.value = '';

    if (typeof showToast === 'function') {
        showToast('ອອກຈາກລະບົບ', 'ທ່ານໄດ້ອອກຈາກລະບົບຮຽບຮ້ອຍແລ້ວ', 'info');
    }
}
window.logout = logout;

// ກວດສອບ Auth ທັນທີຕອນໂຫຼດໄຟລ໌
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
});

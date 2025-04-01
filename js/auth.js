// Kimlik doğrulama işlemleri için JavaScript

// Kullanıcı girişi fonksiyonu
function login(userType) {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showMessage('error', 'Kullanıcı adı ve şifre gereklidir!');
        return;
    }
    
    console.log('Login attempt:', userType, username, password);
    
    // İçinde bulunduğumuz sayfanın yolu
    const currentPath = window.location.pathname;
    const isInSpecificFolder = currentPath.includes(`/${userType}/`);
    
    // Demo için basit doğrulama
    // Gerçek uygulamada API isteği yapılacak
    if (userType === 'admin' && username === 'admin' && password === 'admin123') {
        // Admin girişi başarılı
        setLoginSession(userType, username);
        window.location.href = 'redirect.html?type=admin';
    } else if (userType === 'user' && username === 'user' && password === 'user123') {
        // Kullanıcı girişi başarılı
        setLoginSession(userType, username);
        window.location.href = 'redirect.html?type=user';
    } else if (userType === 'member' && username === 'member' && password === 'member123') {
        // Üye girişi başarılı
        setLoginSession(userType, username);
        window.location.href = 'redirect.html?type=member';
    } else {
        showMessage('error', 'Geçersiz kullanıcı adı veya şifre!');
    }
}

// Kullanıcı kaydı fonksiyonu
function register(userType) {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (!username || !email || !password || !confirmPassword) {
        showMessage('error', 'Tüm alanları doldurunuz!');
        return;
    }
    
    if (password !== confirmPassword) {
        showMessage('error', 'Şifreler eşleşmiyor!');
        return;
    }
    
    // Demo için basit kayıt (gerçekte API isteği yapılacak)
    showMessage('success', 'Kayıt işleminiz başarıyla tamamlandı! Giriş yapabilirsiniz.');
    
    // Giriş sayfasına yönlendir
    setTimeout(() => {
        // URL yolu düzeltildi - göreceli yoldan tam yola geçiş
        if (window.location.pathname.includes(`/${userType}/`)) {
            window.location.href = 'login.html';
        } else {
            window.location.href = `${userType}/login.html`;
        }
    }, 2000);
}

// Çıkış yapma fonksiyonu
function logout() {
    clearLoginSession();
    window.location.href = 'index.html';
}

// Oturum durumunu localStorage'da saklama
function setLoginSession(userType, username) {
    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('userType', userType);
    localStorage.setItem('username', username);
    
    // Demo için coin bakiyesi (sadece üyeler için)
    if (userType === 'member' && !localStorage.getItem('coinBalance')) {
        localStorage.setItem('coinBalance', '50'); // Üyelere başlangıç olarak 50 coin
    }
}

// Oturumu temizleme
function clearLoginSession() {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('userType');
    localStorage.removeItem('username');
}

// Oturum kontrolü
function checkSession() {
    const loggedIn = localStorage.getItem('loggedIn');
    const userType = localStorage.getItem('userType');
    const username = localStorage.getItem('username');
    
    // Kullanıcı adını göster (eğer giriş yapılmışsa)
    const userNameEl = document.querySelector('.user-name');
    if (userNameEl && username) {
        userNameEl.textContent = username;
    }
    
    // Coin bakiyesini göster (eğer üye ise)
    const coinBalanceEl = document.querySelector('.coin-balance');
    if (coinBalanceEl && userType === 'member') {
        coinBalanceEl.textContent = localStorage.getItem('coinBalance') || '0';
    }
    
    // Erişim kontrolü (bazı sayfalar için gerekli)
    const currentPath = window.location.pathname;
    
    // Admin paneline erişim kontrolü
    if (currentPath.includes('/admin/') && currentPath !== '/admin/login.html') {
        if (!loggedIn || userType !== 'admin') {
            window.location.href = '../admin/login.html';
            return;
        }
    }
    
    // Kullanıcı paneline erişim kontrolü
    if (currentPath.includes('/user/') && currentPath !== '/user/login.html' && currentPath !== '/user/register.html') {
        if (!loggedIn || userType !== 'user') {
            window.location.href = '../user/login.html';
            return;
        }
    }
    
    // Üye paneline erişim kontrolü
    if (currentPath.includes('/member/') && currentPath !== '/member/login.html' && currentPath !== '/member/register.html') {
        if (!loggedIn || userType !== 'member') {
            window.location.href = '../member/login.html';
            return;
        }
    }
    
    // Menü elemanlarını güncelle
    updateMenuItems();
}

// Menü elemanlarını güncelle
function updateMenuItems() {
    const loggedIn = localStorage.getItem('loggedIn');
    const userType = localStorage.getItem('userType');
    
    const loginButtons = document.querySelectorAll('.btn-login');
    const userMenuButton = document.querySelector('.user-menu-btn');
    
    if (loggedIn === 'true') {
        // Giriş butonlarını gizle
        loginButtons.forEach(btn => {
            btn.style.display = 'none';
        });
        
        // Kullanıcı menü butonunu göster
        if (userMenuButton) {
            userMenuButton.style.display = 'block';
            
            // Kullanıcı tipine göre panel linki güncelle
            const panelLink = userMenuButton.querySelector('.panel-link');
            if (panelLink) {
            if (userType === 'admin') {
                panelLink.href = 'admin/dashboard.html';
                panelLink.textContent = 'Admin Paneli';
            } else if (userType === 'user') {
                panelLink.href = 'user/dashboard.html';
                panelLink.textContent = 'Kullanıcı Paneli';
            } else if (userType === 'member') {
                panelLink.href = 'member/dashboard.html';
                panelLink.textContent = 'Üye Paneli';
            }
            }
        }
    } else {
        // Giriş butonlarını göster
        loginButtons.forEach(btn => {
            btn.style.display = 'inline-block';
        });
        
        // Kullanıcı menü butonunu gizle
        if (userMenuButton) {
            userMenuButton.style.display = 'none';
        }
    }
}

// Mesaj gösterme fonksiyonu
function showMessage(type, message) {
    // Var olan mesaj kutusu varsa kaldır
    const existingMessage = document.querySelector('.message-box');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Yeni mesaj kutusu oluştur
    const messageBox = document.createElement('div');
    messageBox.className = `message-box ${type}`;
    messageBox.innerHTML = `
        <div class="message-content">
            <p>${message}</p>
        </div>
        <span class="message-close">&times;</span>
    `;
    
    // Mesajı sayfaya ekle
    document.body.appendChild(messageBox);
    
    // Mesaj kutusu göster
    setTimeout(() => {
        messageBox.classList.add('show');
    }, 10);
    
    // Mesajı otomatik kapat
    setTimeout(() => {
        messageBox.classList.remove('show');
        setTimeout(() => {
            messageBox.remove();
        }, 300);
    }, 3000);
    
    // Kapatma düğmesi
    const closeBtn = messageBox.querySelector('.message-close');
    closeBtn.addEventListener('click', () => {
        messageBox.classList.remove('show');
        setTimeout(() => {
            messageBox.remove();
        }, 300);
    });
}

// Sayfa yüklendiğinde oturum kontrolü yap
document.addEventListener('DOMContentLoaded', checkSession);

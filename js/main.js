// Ana JavaScript Dosyası

// Sayfa Yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    console.log('Website loaded successfully');
    
    // Mobil menü toggle
    const mobileToggle = document.createElement('div');
    mobileToggle.className = 'mobile-toggle';
    mobileToggle.innerHTML = '<i class="fas fa-bars"></i>';
    
    const header = document.querySelector('header .container');
    const nav = document.querySelector('nav');
    
    if (header && nav) {
        header.insertBefore(mobileToggle, nav);
        
        mobileToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
            mobileToggle.querySelector('i').classList.toggle('fa-bars');
            mobileToggle.querySelector('i').classList.toggle('fa-times');
        });
    }
    
    // İlanları Yükle (Normalde API'den gelecek)
    loadSampleListings();
});

// Örnek İlanları Yükle
function loadSampleListings() {
    const listingGrid = document.querySelector('.listing-grid');
    if (!listingGrid) return;
    
    // Bu kısım normalde bir API'den gelen verilerle doldurulacak
    const sampleListings = [
        {
            id: 1,
            title: 'Örnek İlan 1',
            price: '50 TL/saat',
            description: 'Bu bir örnek ilan açıklamasıdır. Gerçek ilanlar kullanıcılar tarafından eklenecektir.'
        },
        {
            id: 2,
            title: 'Örnek İlan 2',
            price: '75 TL/saat',
            description: 'Bu bir örnek ilan açıklamasıdır. Gerçek ilanlar kullanıcılar tarafından eklenecektir.'
        },
        {
            id: 3,
            title: 'Örnek İlan 3',
            price: '100 TL/saat',
            description: 'Bu bir örnek ilan açıklamasıdır. Gerçek ilanlar kullanıcılar tarafından eklenecektir.'
        }
    ];
    
    // İlanları temizle
    listingGrid.innerHTML = '';
    
    // İlanları ekle
    sampleListings.forEach(listing => {
        const listingEl = document.createElement('div');
        listingEl.className = 'listing';
        listingEl.innerHTML = `
            <div class="listing-header">
                <h3>${listing.title}</h3>
                <span class="price">${listing.price}</span>
            </div>
            <div class="listing-body">
                <p>${listing.description}</p>
            </div>
            <div class="listing-footer">
                <a href="listing-detail.html?id=${listing.id}" class="btn">Detaylar</a>
            </div>
        `;
        
        listingGrid.appendChild(listingEl);
    });
}

// Form Doğrulama
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    let isValid = true;
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
        if (input.hasAttribute('required') && !input.value.trim()) {
            isValid = false;
            input.classList.add('error');
            
            // Hata mesajı ekleme
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = 'Bu alan zorunludur';
            
            // Eğer zaten bir hata mesajı yoksa ekle
            if (!input.parentNode.querySelector('.error-message')) {
                input.parentNode.appendChild(errorMsg);
            }
        } else {
            input.classList.remove('error');
            const errorMsg = input.parentNode.querySelector('.error-message');
            if (errorMsg) {
                errorMsg.remove();
            }
        }
    });
    
    return isValid;
}

// URL Parametresi Alma
function getUrlParam(param) {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    return urlParams.get(param);
}

// Coin Satın Alma İşlemi
function buyCoin(packageId, amount, price) {
    // Normalde ödeme API'si entegre edilecek
    console.log(`Buying ${amount} coins for ${price} from package ${packageId}`);
    
    // Başarılı ödeme simülasyonu
    alert(`${amount} coin satın alma işleminiz başarıyla tamamlandı!`);
    updateCoinBalance(amount);
}

// Coin Bakiyesi Güncelleme
function updateCoinBalance(amount) {
    const currentBalance = localStorage.getItem('coinBalance') || 0;
    const newBalance = parseInt(currentBalance) + parseInt(amount);
    
    localStorage.setItem('coinBalance', newBalance);
    
    // Ekrandaki bakiyeyi güncelle
    const balanceEl = document.querySelector('.coin-balance');
    if (balanceEl) {
        balanceEl.textContent = newBalance;
    }
}

// Görüşme Başlatma
function startCall(listingId, userId) {
    // Normalde WebRTC veya benzer bir teknoloji kullanılacak
    console.log(`Starting call with user ${userId} for listing ${listingId}`);
    
    // Görüşme sayfasına yönlendir
    window.location.href = `call.html?listing=${listingId}&user=${userId}`;
}

// Görüşme Zamanlayıcısı
let callTimer;
let callSeconds = 0;
let callActive = false;

function startCallTimer() {
    const timerEl = document.querySelector('.call-timer');
    if (!timerEl) return;
    
    callActive = true;
    callSeconds = 0;
    
    callTimer = setInterval(() => {
        callSeconds++;
        const minutes = Math.floor(callSeconds / 60);
        const seconds = callSeconds % 60;
        
        timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Coin bakiyesi kontrol et ve gerekirse görüşmeyi sonlandır
        checkCoinBalance();
    }, 1000);
}

function endCallTimer() {
    callActive = false;
    clearInterval(callTimer);
}

function checkCoinBalance() {
    if (!callActive) return;
    
    const currentBalance = parseInt(localStorage.getItem('coinBalance') || 0);
    const costPerMinute = 5; // Dakika başına 5 coin (örnek)
    
    // Her dakika coin düş
    if (callSeconds % 60 === 0 && callSeconds > 0) {
        if (currentBalance >= costPerMinute) {
            updateCoinBalance(-costPerMinute);
        } else {
            // Yeterli coin yoksa görüşmeyi sonlandır
            endCall();
            alert('Yetersiz coin! Görüşme sonlandırıldı.');
        }
    }
}

function endCall() {
    endCallTimer();
    
    // Görüşme istatistiklerini göster
    const statsEl = document.querySelector('.call-stats');
    if (statsEl) {
        const minutes = Math.floor(callSeconds / 60);
        const seconds = callSeconds % 60;
        const duration = `${minutes} dakika ${seconds} saniye`;
        const cost = Math.ceil(callSeconds / 60) * 5; // Dakika başına 5 coin
        
        statsEl.innerHTML = `
            <h3>Görüşme İstatistikleri</h3>
            <p><span>Süre:</span> ${duration}</p>
            <p><span>Harcanan Coin:</span> ${cost}</p>
        `;
    }
    
    // Ana sayfaya dönüş butonu göster
    const controlsEl = document.querySelector('.call-controls');
    if (controlsEl) {
        controlsEl.innerHTML = `<a href="index.html" class="btn">Ana Sayfaya Dön</a>`;
    }
}

// Dashboard İstatistikleri
function loadDashboardStats() {
    const userType = localStorage.getItem('userType');
    
    if (userType === 'admin') {
        loadAdminStats();
    } else if (userType === 'user') {
        loadUserStats();
    } else if (userType === 'member') {
        loadMemberStats();
    }
}

function loadAdminStats() {
    // Örnek admin istatistikleri
    const stats = {
        totalUsers: 150,
        totalMembers: 250,
        totalListings: 120,
        totalCalls: 430,
        totalRevenue: 15000
    };
    
    updateDashboardCards(stats);
    loadRecentTransactions();
}

function loadUserStats() {
    // Örnek kullanıcı istatistikleri
    const stats = {
        activeListings: 3,
        completedCalls: 25,
        totalEarnings: 1800,
        averageRating: 4.7
    };
    
    updateDashboardCards(stats);
    loadRecentCalls();
}

function loadMemberStats() {
    // Örnek üye istatistikleri
    const stats = {
        coinBalance: localStorage.getItem('coinBalance') || 0,
        completedCalls: 12,
        totalSpent: 950,
        favoriteListings: 5
    };
    
    updateDashboardCards(stats);
    loadRecentCalls();
}

function updateDashboardCards(stats) {
    const cardsContainer = document.querySelector('.dashboard-cards');
    if (!cardsContainer) return;
    
    cardsContainer.innerHTML = '';
    
    // İstatistikleri ekle
    for (const [key, value] of Object.entries(stats)) {
        let icon, label;
        
        switch(key) {
            case 'totalUsers':
                icon = 'fas fa-users';
                label = 'Toplam Kullanıcı';
                break;
            case 'totalMembers':
                icon = 'fas fa-user-friends';
                label = 'Toplam Üye';
                break;
            case 'totalListings':
                icon = 'fas fa-list';
                label = 'Toplam İlan';
                break;
            case 'totalCalls':
                icon = 'fas fa-phone';
                label = 'Toplam Görüşme';
                break;
            case 'totalRevenue':
                icon = 'fas fa-money-bill-wave';
                label = 'Toplam Gelir';
                value = `${value} TL`;
                break;
            case 'activeListings':
                icon = 'fas fa-bullhorn';
                label = 'Aktif İlanlar';
                break;
            case 'completedCalls':
                icon = 'fas fa-headset';
                label = 'Tamamlanan Görüşmeler';
                break;
            case 'totalEarnings':
                icon = 'fas fa-wallet';
                label = 'Toplam Kazanç';
                value = `${value} TL`;
                break;
            case 'averageRating':
                icon = 'fas fa-star';
                label = 'Ortalama Puan';
                break;
            case 'coinBalance':
                icon = 'fas fa-coins';
                label = 'Coin Bakiyesi';
                break;
            case 'totalSpent':
                icon = 'fas fa-shopping-cart';
                label = 'Toplam Harcama';
                value = `${value} TL`;
                break;
            case 'favoriteListings':
                icon = 'fas fa-heart';
                label = 'Favori İlanlar';
                break;
            default:
                icon = 'fas fa-chart-bar';
                label = key;
        }
        
        const card = document.createElement('div');
        card.className = 'dashboard-card';
        card.innerHTML = `
            <div class="dashboard-card-content">
                <h3>${label}</h3>
                <p>${value}</p>
            </div>
            <div class="dashboard-card-icon">
                <i class="${icon}"></i>
            </div>
        `;
        
        cardsContainer.appendChild(card);
    }
}

function loadRecentTransactions() {
    const tableContainer = document.querySelector('.dashboard-table');
    if (!tableContainer) return;
    
    // Örnek işlemler
    const transactions = [
        { id: 1, user: 'Ahmet Yılmaz', type: 'Coin Satın Alma', amount: '200 TL', date: '01.04.2025' },
        { id: 2, user: 'Mehmet Demir', type: 'İlan Yayınlama', amount: '100 TL', date: '31.03.2025' },
        { id: 3, user: 'Ayşe Kaya', type: 'Görüşme Ücreti', amount: '75 TL', date: '30.03.2025' },
        { id: 4, user: 'Fatma Şahin', type: 'Coin Satın Alma', amount: '150 TL', date: '29.03.2025' },
        { id: 5, user: 'Ali Yıldız', type: 'İlan Yayınlama', amount: '100 TL', date: '28.03.2025' }
    ];
    
    tableContainer.innerHTML = `
        <h3>Son İşlemler</h3>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Kullanıcı</th>
                    <th>İşlem Türü</th>
                    <th>Tutar</th>
                    <th>Tarih</th>
                </tr>
            </thead>
            <tbody>
                ${transactions.map(t => `
                    <tr>
                        <td>#${t.id}</td>
                        <td>${t.user}</td>
                        <td>${t.type}</td>
                        <td>${t.amount}</td>
                        <td>${t.date}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function loadRecentCalls() {
    const tableContainer = document.querySelector('.dashboard-table');
    if (!tableContainer) return;
    
    // Örnek görüşmeler
    const calls = [
        { id: 1, user: 'Ahmet Yılmaz', duration: '15 dakika', cost: '75 Coin', date: '01.04.2025' },
        { id: 2, user: 'Mehmet Demir', duration: '8 dakika', cost: '40 Coin', date: '31.03.2025' },
        { id: 3, user: 'Ayşe Kaya', duration: '22 dakika', cost: '110 Coin', date: '30.03.2025' },
        { id: 4, user: 'Fatma Şahin', duration: '5 dakika', cost: '25 Coin', date: '29.03.2025' },
        { id: 5, user: 'Ali Yıldız', duration: '12 dakika', cost: '60 Coin', date: '28.03.2025' }
    ];
    
    tableContainer.innerHTML = `
        <h3>Son Görüşmeler</h3>
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Kullanıcı</th>
                    <th>Süre</th>
                    <th>Maliyet</th>
                    <th>Tarih</th>
                </tr>
            </thead>
            <tbody>
                ${calls.map(c => `
                    <tr>
                        <td>#${c.id}</td>
                        <td>${c.user}</td>
                        <td>${c.duration}</td>
                        <td>${c.cost}</td>
                        <td>${c.date}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Giriş ve Kayıt İşlemleri
function login(userType) {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        alert('Kullanıcı adı ve şifre gereklidir!');
        return;
    }
    
    // Normalde bir API isteği yapılacak
    // Burada başarılı giriş simülasyonu yapıyoruz
    localStorage.setItem('loggedIn', true);
    localStorage.setItem('userType', userType);
    localStorage.setItem('username', username);
    
    // Yönlendirme
    if (userType === 'admin') {
        window.location.href = '/admin/dashboard.html';
    } else if (userType === 'user') {
        window.location.href = '/user/dashboard.html';
    } else {
        window.location.href = '/member/dashboard.html';
    }
}

function register(userType) {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (!username || !email || !password || !confirmPassword) {
        alert('Tüm alanları doldurunuz!');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Şifreler eşleşmiyor!');
        return;
    }
    
    // Normalde bir API isteği yapılacak
    // Burada başarılı kayıt simülasyonu yapıyoruz
    alert('Kayıt işleminiz başarıyla tamamlandı! Giriş yapabilirsiniz.');
    
    // Giriş sayfasına yönlendir
    window.location.href = `/${userType}/login.html`;
}

function logout() {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('userType');
    localStorage.removeItem('username');
    
    // Ana sayfaya yönlendir
    window.location.href = '/index.html';
}

// Oturum Kontrolü
function checkSession() {
    const loggedIn = localStorage.getItem('loggedIn');
    const userType = localStorage.getItem('userType');
    
    // Oturum açılmış mı kontrol et
    if (!loggedIn) {
        // Eğer özel bir sayfadaysak giriş sayfasına yönlendir
        if (window.location.pathname.includes('/admin/') || 
            window.location.pathname.includes('/user/') || 
            window.location.pathname.includes('/member/')) {
            
            window.location.href = '/index.html';
        }
    } else {
        // Kullanıcı tipine göre yanlış panel erişimini engelle
        if (window.location.pathname.includes('/admin/') && userType !== 'admin') {
            window.location.href = '/index.html';
        } else if (window.location.pathname.includes('/user/') && userType !== 'user') {
            window.location.href = '/index.html';
        } else if (window.location.pathname.includes('/member/') && userType !== 'member') {
            window.location.href = '/index.html';
        }
        
        // Kullanıcı adını göster
        updateUserInfo();
    }
}

function updateUserInfo() {
    const userNameEl = document.querySelector('.user-name');
    if (userNameEl) {
        userNameEl.textContent = localStorage.getItem('username') || 'Kullanıcı';
    }
}

// İlan Yönetimi
function createListing() {
    const title = document.getElementById('listing-title').value;
    const price = document.getElementById('listing-price').value;
    const description = document.getElementById('listing-description').value;
    const features = document.getElementById('listing-features').value;
    
    if (!title || !price || !description) {
        alert('Lütfen zorunlu alanları doldurun!');
        return;
    }
    
    // Normalde bir API isteği yapılacak
    // Burada başarılı ilan oluşturma simülasyonu yapıyoruz
    alert('İlanınız başarıyla oluşturuldu!');
    
    // Kullanıcı paneline yönlendir
    window.location.href = '/user/listings.html';
}

function updateListing(listingId) {
    const title = document.getElementById('listing-title').value;
    const price = document.getElementById('listing-price').value;
    const description = document.getElementById('listing-description').value;
    const features = document.getElementById('listing-features').value;
    
    if (!title || !price || !description) {
        alert('Lütfen zorunlu alanları doldurun!');
        return;
    }
    
    // Normalde bir API isteği yapılacak
    // Burada başarılı ilan güncelleme simülasyonu yapıyoruz
    alert('İlanınız başarıyla güncellendi!');
    
    // Kullanıcı paneline yönlendir
    window.location.href = '/user/listings.html';
}

function deleteListing(listingId) {
    if (confirm('Bu ilanı silmek istediğinize emin misiniz?')) {
        // Normalde bir API isteği yapılacak
        // Burada başarılı ilan silme simülasyonu yapıyoruz
        alert('İlan başarıyla silindi!');
        
        // Sayfayı yenile
        window.location.reload();
    }
}

// Sayfa Yüklendiğinde Çalışacak İşlemler
document.addEventListener('DOMContentLoaded', function() {
    // Oturum kontrolü yap
    checkSession();
    
    // Dashboard istatistiklerini yükle
    if (window.location.pathname.includes('dashboard.html')) {
        loadDashboardStats();
    }
    
    // Görüşme sayfası kontrolü
    if (window.location.pathname.includes('call.html')) {
        startCallTimer();
    }
});

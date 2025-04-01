// Site genelinde kullanılacak JavaScript fonksiyonları

document.addEventListener('DOMContentLoaded', function() {
    // Kullanıcı menü açılır-kapanır
    const userMenuBtn = document.querySelector('.user-menu-btn');
    if (userMenuBtn) {
        const avatar = userMenuBtn.querySelector('.avatar');
        const dropdown = userMenuBtn.querySelector('.dropdown');
        
        // Avatar'a tıklandığında
        avatar.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        
        // Sayfa herhangi bir yerine tıklandığında dropdown'ı kapat
        document.addEventListener('click', function() {
            dropdown.classList.remove('show');
        });
        
        // Dropdown içine tıklandığında kapanmasını önle
        dropdown.addEventListener('click', function(e) {
            e.stopPropagation();
        });
        
        // Kullanıcı adının baş harfini göster
        const initial = userMenuBtn.querySelector('.initial');
        const username = localStorage.getItem('username');
        if (initial && username) {
            initial.textContent = username.charAt(0).toUpperCase();
        }
        
        // Profil linki güncelle
        const userType = localStorage.getItem('userType');
        const profileLink = document.getElementById('user-profile-link');
        if (profileLink && userType) {
            profileLink.href = `/${userType}/profile.html`;
        }
    }
    
    // Mobil menü toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileMenu = document.querySelector('nav ul');
    
    if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('show');
            mobileMenuToggle.classList.toggle('active');
        });
    }
    
    // İlan Filtreleme İşlemleri (ilanlar sayfası için)
    setupListingFilters();
});

// İlan Filtreleme İşlemleri
function setupListingFilters() {
    const categorySelect = document.getElementById('category');
    const priceSelect = document.getElementById('price');
    const sortSelect = document.getElementById('sort');
    const searchInput = document.querySelector('.search-bar input');
    const searchButton = document.querySelector('.search-bar button');
    
    if (!categorySelect || !priceSelect || !sortSelect) return;
    
    // Filtreleme fonksiyonu
    function filterListings() {
        const category = categorySelect.value;
        const price = priceSelect.value;
        const sort = sortSelect.value;
        const search = searchInput ? searchInput.value : '';
        
        // URL parametreleriyle sayfa yeniden yükle
        const params = new URLSearchParams();
        if (category) params.set('category', category);
        if (price) params.set('price', price);
        if (sort) params.set('sort', sort);
        if (search) params.set('search', search);
        
        // Gerçek uygulamada burada bir API isteği yapılacak
        // Şimdilik filtreleri konsola yazdıralım
        console.log('Filtreleme Parametreleri:', {
            category,
            price,
            sort,
            search
        });
        
        // Filtreleme mesajı göster
        showMessage('info', 'Filtreleme yapılıyor... İlanlar güncelleniyor.');
        
        // Gerçek uygulamada burada AJAX isteği yapılacak ve ilanlar güncellenecek
        // Demo için sayfayı 1 saniye sonra yeniden yükle
        setTimeout(() => {
            // window.location.href = `/listings.html?${params.toString()}`;
            // Demo için sayfayı yeniden yüklemeyelim
        }, 1000);
    }
    
    // Event listeners
    if (categorySelect) categorySelect.addEventListener('change', filterListings);
    if (priceSelect) priceSelect.addEventListener('change', filterListings);
    if (sortSelect) sortSelect.addEventListener('change', filterListings);
    if (searchButton) searchButton.addEventListener('click', filterListings);
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                filterListings();
            }
        });
    }
    
    // URL'den parametreleri al ve form elemanlarını doldur
    const urlParams = new URLSearchParams(window.location.search);
    if (categorySelect && urlParams.has('category')) {
        categorySelect.value = urlParams.get('category');
    }
    if (priceSelect && urlParams.has('price')) {
        priceSelect.value = urlParams.get('price');
    }
    if (sortSelect && urlParams.has('sort')) {
        sortSelect.value = urlParams.get('sort');
    }
    if (searchInput && urlParams.has('search')) {
        searchInput.value = urlParams.get('search');
    }
}

// Mesaj gösterme fonksiyonu (genel)
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

// İlan Sayfası: İlan Detayı Yükleme
function loadListingDetail(listingId) {
    if (!listingId) return;
    
    // Gerçek uygulamada burada bir API isteği yapılacak
    // Şimdilik konsola yazdıralım
    console.log('İlan detayı yükleniyor, ID:', listingId);
    
    // Demo için örnek veriler
    const demoListing = {
        id: listingId,
        title: 'Örnek İlan ' + listingId,
        price: (50 + (listingId * 10)) + ' TL/saat',
        description: 'Bu bir örnek ilan açıklamasıdır. Gerçek uygulamada, bu alan kullanıcının ilan oluştururken girdiği içerikle doldurulacaktır.',
        features: [
            'Örnek Hizmet 1',
            'Örnek Hizmet 2',
            'Örnek Hizmet 3',
            'Örnek Hizmet 4',
            'Örnek Hizmet 5'
        ],
        contactOptions: ['voice', 'video'],
        availability: 'Hafta içi 18:00-22:00, Hafta sonu 10:00-20:00',
        user: {
            id: 1,
            name: 'Ahmet Yılmaz',
            avatar: '../images/avatar-placeholder.jpg',
            rating: 4.8,
            reviewCount: 65,
            memberSince: 'Ocak 2025',
            callCount: 127
        },
        stats: {
            views: 245,
            publishedAt: '01.04.2025',
            category: 'Kategori 1'
        }
    };
    
    // İlan başlığını güncelle
    const listingTitle = document.querySelector('.listing-detail-header h2');
    if (listingTitle) {
        listingTitle.textContent = demoListing.title;
    }
    
    // Fiyatı güncelle
    const listingPrice = document.querySelector('.listing-detail-header .price');
    if (listingPrice) {
        listingPrice.textContent = demoListing.price;
    }
    
    // Açıklamayı güncelle
    const listingDescription = document.querySelector('.listing-detail-body p');
    if (listingDescription) {
        listingDescription.textContent = demoListing.description;
    }
    
    // Özellikleri güncelle
    const featuresContainer = document.querySelector('.listing-detail-features ul');
    if (featuresContainer) {
        featuresContainer.innerHTML = '';
        demoListing.features.forEach(feature => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-check"></i> ${feature}`;
            featuresContainer.appendChild(li);
        });
    }
    
    // Sayfa başlığını güncelle
    document.title = demoListing.title + ' - İlan Platformu';
}

// Coin satın alma işlemi
function buyCoin(packageId, amount, price) {
    // Normalde burada ödeme API'si entegre edilecek
    console.log(`Buying ${amount} coins for ${price} from package ${packageId}`);
    
    // Başarılı ödeme simülasyonu
    showMessage('success', `${amount} coin satın alma işleminiz başarıyla tamamlandı!`);
    
    // Coin bakiyesini güncelle
    updateCoinBalance(amount);
}

// Coin bakiyesi güncelleme
function updateCoinBalance(amount) {
    const currentBalance = parseInt(localStorage.getItem('coinBalance') || 0);
    const newBalance = currentBalance + parseInt(amount);
    
    localStorage.setItem('coinBalance', newBalance);
    
    // Ekrandaki bakiyeyi güncelle
    const balanceEls = document.querySelectorAll('.coin-balance');
    balanceEls.forEach(el => {
        el.textContent = newBalance;
    });
    
    // Coin uyarı durumunu güncelle
    updateCoinWarningStatus();
}

// Coin uyarı durumunu güncelle
function updateCoinWarningStatus() {
    const coinBalance = parseInt(localStorage.getItem('coinBalance') || 0);
    const coinWarning = document.querySelector('.coin-warning');
    const callActions = document.querySelector('.call-action');
    
    if (!coinWarning || !callActions) return;
    
    // Eğer coin yoksa veya yetersizse uyarı göster, call butonlarını gizle
    if (coinBalance < 5) {
        coinWarning.style.display = 'block';
        callActions.style.display = 'none';
    } else {
        coinWarning.style.display = 'none';
        callActions.style.display = 'block';
    }
}

// Görüşme başlatma
function startCall(listingId, userId, isVideo = false) {
    // Normalde WebRTC veya benzer bir teknoloji kullanılacak
    console.log(`Starting ${isVideo ? 'video' : 'voice'} call with user ${userId} for listing ${listingId}`);
    
    // Önce yeterli coin kontrolü yap
    const coinBalance = parseInt(localStorage.getItem('coinBalance') || 0);
    const coinPerMinute = isVideo ? 8 : 5; // Video için 8, ses için 5 coin
    
    if (coinBalance < coinPerMinute) {
        showMessage('error', 'Yetersiz coin! Görüşme yapmak için coin satın alın.');
        return;
    }
    
    // Görüşme sayfasına yönlendir
    window.location.href = `../call.html?listing=${listingId}&user=${userId}&type=${isVideo ? 'video' : 'voice'}`;
}

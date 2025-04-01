// Kimlik Doğrulama Denetleyicisi
import UserModel from '../models/user.model.js';

class AuthController {
    constructor() {
        // Oturum bilgisi
        this.currentUser = null;
        
        // Sayfa yüklendiğinde oturum kontrolü yap
        document.addEventListener('DOMContentLoaded', () => this.checkSession());
    }

    // Kullanıcı girişi
    async login(userType, username, password) {
        try {
            console.log(`Login attempt for ${userType}: ${username}`);
            
            if (!username || !password) {
                this.showMessage('error', 'Kullanıcı adı ve şifre gereklidir!');
                return false;
            }
            
            // Kimlik doğrulama isteği
            const result = await UserModel.login(username, password);
            
            if (result.success) {
                // Oturumu başlat
                this.setSession(result.user);
                this.showMessage('success', result.message || 'Giriş başarılı!');
                
                // Kullanıcı tipine göre yönlendir
                setTimeout(() => {
                    if (userType === 'admin') {
                        window.location.href = 'admin/dashboard.html';
                    } else if (userType === 'user') {
                        window.location.href = 'user/dashboard.html';
                    } else if (userType === 'member') {
                        window.location.href = 'member/dashboard.html';
                    }
                }, 1000);
                
                return true;
            } else {
                this.showMessage('error', result.message || 'Giriş başarısız!');
                return false;
            }
        } catch (error) {
            console.error('Giriş sırasında hata:', error);
            this.showMessage('error', 'Giriş sırasında beklenmeyen bir hata oluştu.');
            return false;
        }
    }

    // Kullanıcı kaydı
    async register(userType, userData) {
        try {
            if (!userData.username || !userData.email || !userData.password || !userData.confirmPassword) {
                this.showMessage('error', 'Tüm zorunlu alanları doldurunuz!');
                return false;
            }
            
            if (userData.password !== userData.confirmPassword) {
                this.showMessage('error', 'Şifreler eşleşmiyor!');
                return false;
            }
            
            // Kayıt isteği
            const result = await UserModel.register({
                ...userData,
                userType: userType
            });
            
            if (result.success) {
                this.showMessage('success', result.message || 'Kayıt işleminiz başarıyla tamamlandı!');
                
                // Giriş sayfasına yönlendir
                setTimeout(() => {
                    window.location.href = `${userType}/login.html`;
                }, 2000);
                
                return true;
            } else {
                this.showMessage('error', result.message || 'Kayıt işlemi başarısız!');
                return false;
            }
        } catch (error) {
            console.error('Kayıt sırasında hata:', error);
            this.showMessage('error', 'Kayıt sırasında beklenmeyen bir hata oluştu.');
            return false;
        }
    }

    // Çıkış yap
    logout() {
        this.clearSession();
        window.location.href = 'index.html';
    }

    // Oturum bilgilerini localStorage'a kaydet
    setSession(user) {
        this.currentUser = user;
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('isLoggedIn', 'true');
        
        // Üye bakiyesini kaydet
        if (user.user_type === 'member' && user.coin_balance) {
            localStorage.setItem('coinBalance', user.coin_balance.toString());
        }
    }

    // Oturum bilgilerini kontrol et
    checkSession() {
        const userStr = localStorage.getItem('user');
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        
        if (isLoggedIn && userStr) {
            try {
                this.currentUser = JSON.parse(userStr);
                this.updateUI();
                return true;
            } catch (e) {
                this.clearSession();
                return false;
            }
        }
        
        return false;
    }

    // Oturumu temizle
    clearSession() {
        this.currentUser = null;
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
    }

    // UI'ı oturum durumuna göre güncelle
    updateUI() {
        const loginButtons = document.querySelectorAll('.btn-login');
        const userMenuButton = document.querySelector('.user-menu-btn');
        
        if (this.currentUser) {
            // Giriş butonlarını gizle
            loginButtons.forEach(btn => {
                btn.style.display = 'none';
            });
            
            // Kullanıcı menü butonunu göster
            if (userMenuButton) {
                userMenuButton.style.display = 'block';
                
                // Avatar baş harfini güncelle
                const initial = userMenuButton.querySelector('.initial');
                if (initial && this.currentUser.username) {
                    initial.textContent = this.currentUser.username.charAt(0).toUpperCase();
                }
                
                // Profil linkini güncelle
                const profileLink = userMenuButton.querySelector('.panel-link');
                if (profileLink) {
                    const userType = this.currentUser.user_type;
                    const dashboardPath = `${userType}/dashboard.html`;
                    
                    profileLink.href = dashboardPath;
                    profileLink.textContent = userType === 'admin' ? 'Admin Paneli' : 
                                            userType === 'user' ? 'Kullanıcı Paneli' : 
                                            'Üye Paneli';
                }
            }
            
            // Kullanıcı tipine özgü alanları güncelle
            if (this.currentUser.user_type === 'member') {
                // Coin bakiyesi
                const coinBalanceEls = document.querySelectorAll('.coin-balance');
                const balance = localStorage.getItem('coinBalance') || this.currentUser.coin_balance || '0';
                
                coinBalanceEls.forEach(el => {
                    el.textContent = balance;
                });
                
                // Coin uyarı durumunu güncelle
                this.updateCoinWarningStatus();
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

    // Coin uyarı durumunu güncelle
    updateCoinWarningStatus() {
        const coinWarning = document.querySelector('.coin-warning');
        const callActions = document.querySelector('.call-action');
        
        if (!coinWarning || !callActions) return;
        
        const coinBalance = parseInt(localStorage.getItem('coinBalance') || '0');
        
        // Eğer coin yoksa veya yetersizse uyarı göster, call butonlarını gizle
        if (coinBalance < 5) {
            coinWarning.style.display = 'block';
            callActions.style.display = 'none';
        } else {
            coinWarning.style.display = 'none';
            callActions.style.display = 'block';
        }
    }

    // Mesaj gösterme
    showMessage(type, message) {
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
    
    // Kullanıcının erişim yetkisi var mı?
    hasPermission(requiredUserType) {
        // Kullanıcı giriş yapmamışsa yetki yok
        if (!this.currentUser) return false;
        
        // Admin her şeye erişebilir
        if (this.currentUser.user_type === 'admin') return true;
        
        // Kullanıcı tipi, gereken tip ile eşleşiyor mu?
        return this.currentUser.user_type === requiredUserType;
    }
    
    // Mevcut kullanıcının ID'sini getir
    getCurrentUserId() {
        return this.currentUser ? this.currentUser.id : null;
    }
    
    // Mevcut kullanıcının tipini getir
    getCurrentUserType() {
        return this.currentUser ? this.currentUser.user_type : null;
    }
}

export default new AuthController();

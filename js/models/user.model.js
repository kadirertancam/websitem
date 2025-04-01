// Kullanıcı modeli ve işlemleri
import DatabaseService from '../database.js';

class UserModel {
    // Kullanıcı girişi
    async login(username, password) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            // Kullanıcıyı kontrol et
            const query = `
                SELECT u.id, u.username, u.email, u.user_type, u.status, 
                       up.full_name, up.avatar, up.rating, up.review_count
                FROM users u
                LEFT JOIN user_profiles up ON u.id = up.user_id
                WHERE u.username = ? AND u.password = ? AND u.status = 'active'
            `;
            
            const user = DatabaseService.querySingle(query, [username, password]);
            
            if (!user) {
                return { success: false, message: 'Geçersiz kullanıcı adı veya şifre!' };
            }
            
            // Son giriş zamanını güncelle
            DatabaseService.execute(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                [user.id]
            );
            
            // Üye ise bakiyesini getir
            if (user.user_type === 'member') {
                const balanceQuery = 'SELECT coin_balance FROM member_balances WHERE user_id = ?';
                const balance = DatabaseService.querySingle(balanceQuery, [user.id]);
                
                if (balance) {
                    user.coin_balance = balance.coin_balance;
                } else {
                    // Bakiye yoksa oluştur
                    DatabaseService.execute(
                        'INSERT INTO member_balances (user_id, coin_balance) VALUES (?, 50)',
                        [user.id]
                    );
                    user.coin_balance = 50;
                }
            }
            
            // Kullanıcı bilgilerini döndür (şifre hariç)
            delete user.password;
            
            return { 
                success: true, 
                user: user,
                message: 'Giriş başarılı!'
            };
        } catch (error) {
            console.error('Giriş yaparken hata oluştu:', error);
            return { 
                success: false, 
                message: 'Giriş yapılırken bir hata oluştu: ' + error.message 
            };
        }
    }

    // Kullanıcı kaydı
    async register(userData) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            // Kullanıcı adı ve e-postanın benzersiz olduğunu kontrol et
            const checkQuery = 'SELECT id FROM users WHERE username = ? OR email = ?';
            const existingUser = DatabaseService.querySingle(checkQuery, [userData.username, userData.email]);
            
            if (existingUser) {
                return { 
                    success: false, 
                    message: 'Bu kullanıcı adı veya e-posta adresi zaten kullanılıyor.' 
                };
            }
            
            // Kullanıcıyı ekle
            DatabaseService.execute(
                `INSERT INTO users (username, email, password, user_type) 
                 VALUES (?, ?, ?, ?)`,
                [userData.username, userData.email, userData.password, userData.userType]
            );
            
            // Eklenen kullanıcının ID'sini al
            const userId = DatabaseService.lastInsertRowId();
            
            // Kullanıcı profilini oluştur
            DatabaseService.execute(
                `INSERT INTO user_profiles (user_id, full_name, phone) 
                 VALUES (?, ?, ?)`,
                [userId, userData.fullName || userData.username, userData.phone || '']
            );
            
            // Eğer üye ise bakiye oluştur
            if (userData.userType === 'member') {
                DatabaseService.execute(
                    'INSERT INTO member_balances (user_id, coin_balance) VALUES (?, 50)',
                    [userId]
                );
            }
            
            // Veritabanını kaydet
            DatabaseService.saveDatabase();
            
            return { 
                success: true, 
                message: 'Kayıt başarıyla tamamlandı!' 
            };
        } catch (error) {
            console.error('Kayıt olurken hata oluştu:', error);
            return { 
                success: false, 
                message: 'Kayıt olurken bir hata oluştu: ' + error.message 
            };
        }
    }

    // Kullanıcı bilgilerini getir
    async getUserById(userId) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            const query = `
                SELECT u.id, u.username, u.email, u.user_type, u.status, u.created_at,
                       up.full_name, up.phone, up.avatar, up.bio, up.rating, up.review_count
                FROM users u
                LEFT JOIN user_profiles up ON u.id = up.user_id
                WHERE u.id = ?
            `;
            
            const user = DatabaseService.querySingle(query, [userId]);
            
            if (!user) {
                return { success: false, message: 'Kullanıcı bulunamadı.' };
            }
            
            // Üye ise bakiyesini getir
            if (user.user_type === 'member') {
                const balanceQuery = 'SELECT coin_balance FROM member_balances WHERE user_id = ?';
                const balance = DatabaseService.querySingle(balanceQuery, [userId]);
                
                if (balance) {
                    user.coin_balance = balance.coin_balance;
                }
            }
            
            return { 
                success: true, 
                user: user 
            };
        } catch (error) {
            console.error('Kullanıcı bilgileri getirilirken hata oluştu:', error);
            return { 
                success: false, 
                message: 'Kullanıcı bilgileri getirilirken bir hata oluştu: ' + error.message 
            };
        }
    }

    // Kullanıcının ilanlarını getir
    async getUserListings(userId) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            const query = `
                SELECT l.id, l.title, l.description, l.price, l.status, l.created_at, l.view_count,
                       c.name as category_name
                FROM listings l
                LEFT JOIN categories c ON l.category_id = c.id
                WHERE l.user_id = ?
                ORDER BY l.created_at DESC
            `;
            
            const listings = DatabaseService.query(query, [userId]);
            
            return { 
                success: true, 
                listings: listings 
            };
        } catch (error) {
            console.error('Kullanıcının ilanları getirilirken hata oluştu:', error);
            return { 
                success: false, 
                message: 'Kullanıcının ilanları getirilirken bir hata oluştu: ' + error.message 
            };
        }
    }

    // Kullanıcı profilini güncelle
    async updateUserProfile(userId, profileData) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            // Profil var mı kontrol et
            const checkQuery = 'SELECT id FROM user_profiles WHERE user_id = ?';
            const existingProfile = DatabaseService.querySingle(checkQuery, [userId]);
            
            if (existingProfile) {
                // Profili güncelle
                DatabaseService.execute(
                    `UPDATE user_profiles 
                     SET full_name = ?, phone = ?, bio = ?
                     WHERE user_id = ?`,
                    [profileData.fullName, profileData.phone, profileData.bio, userId]
                );
            } else {
                // Profil oluştur
                DatabaseService.execute(
                    `INSERT INTO user_profiles (user_id, full_name, phone, bio) 
                     VALUES (?, ?, ?, ?)`,
                    [userId, profileData.fullName, profileData.phone, profileData.bio]
                );
            }
            
            // Veritabanını kaydet
            DatabaseService.saveDatabase();
            
            return { 
                success: true, 
                message: 'Profil başarıyla güncellendi!' 
            };
        } catch (error) {
            console.error('Profil güncellenirken hata oluştu:', error);
            return { 
                success: false, 
                message: 'Profil güncellenirken bir hata oluştu: ' + error.message 
            };
        }
    }
}

export default new UserModel();

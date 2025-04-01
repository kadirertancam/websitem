// Admin modeli ve işlemleri
import DatabaseService from '../database.js';

class AdminModel {
    // Tüm kullanıcıları getir
    async getAllUsers(userType = null) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            let query = `
                SELECT u.id, u.username, u.email, u.user_type, u.status, u.created_at, u.last_login,
                       up.full_name, up.phone, up.avatar, up.rating, up.review_count
                FROM users u
                LEFT JOIN user_profiles up ON u.id = up.user_id
            `;
            
            const params = [];
            
            if (userType) {
                query += ' WHERE u.user_type = ?';
                params.push(userType);
            }
            
            query += ' ORDER BY u.created_at DESC';
            
            const users = DatabaseService.query(query, params);
            
            return { 
                success: true, 
                users: users 
            };
        } catch (error) {
            console.error('Kullanıcılar getirilirken hata oluştu:', error);
            return { 
                success: false, 
                message: 'Kullanıcılar getirilirken bir hata oluştu: ' + error.message 
            };
        }
    }

    // Tüm ilanları getir
    async getAllListings(includeInactive = false) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            let query = `
                SELECT l.id, l.user_id, l.title, l.description, l.price, l.status, 
                       l.created_at, l.updated_at, l.view_count,
                       u.username as user_username, 
                       up.full_name as user_fullname,
                       c.name as category_name
                FROM listings l
                JOIN users u ON l.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN categories c ON l.category_id = c.id
            `;
            
            if (!includeInactive) {
                query += ' WHERE l.status = "active"';
            }
            
            query += ' ORDER BY l.created_at DESC';
            
            const listings = DatabaseService.query(query);
            
            return { 
                success: true, 
                listings: listings 
            };
        } catch (error) {
            console.error('İlanlar getirilirken hata oluştu:', error);
            return { 
                success: false, 
                message: 'İlanlar getirilirken bir hata oluştu: ' + error.message 
            };
        }
    }

    // İlan durumunu değiştir
    async changeListingStatus(listingId, status) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            if (!['active', 'inactive', 'pending', 'rejected'].includes(status)) {
                return { 
                    success: false, 
                    message: 'Geçersiz durum değeri.' 
                };
            }
            
            // İlanı güncelle
            DatabaseService.execute(
                'UPDATE listings SET status = ? WHERE id = ?',
                [status, listingId]
            );
            
            // Veritabanını kaydet
            DatabaseService.saveDatabase();
            
            return { 
                success: true, 
                message: 'İlan durumu başarıyla güncellendi.'
            };
        } catch (error) {
            console.error('İlan durumu değiştirilirken hata oluştu:', error);
            return { 
                success: false, 
                message: 'İlan durumu değiştirilirken bir hata oluştu: ' + error.message 
            };
        }
    }

    // Kullanıcı durumunu değiştir
    async changeUserStatus(userId, status) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            if (!['active', 'inactive', 'banned'].includes(status)) {
                return { 
                    success: false, 
                    message: 'Geçersiz durum değeri.' 
                };
            }
            
            // Kullanıcıyı güncelle
            DatabaseService.execute(
                'UPDATE users SET status = ? WHERE id = ?',
                [status, userId]
            );
            
            // Veritabanını kaydet
            DatabaseService.saveDatabase();
            
            return { 
                success: true, 
                message: 'Kullanıcı durumu başarıyla güncellendi.'
            };
        } catch (error) {
            console.error('Kullanıcı durumu değiştirilirken hata oluştu:', error);
            return { 
                success: false, 
                message: 'Kullanıcı durumu değiştirilirken bir hata oluştu: ' + error.message 
            };
        }
    }

    // Tüm görüşmeleri getir
    async getAllCalls() {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            const query = `
                SELECT c.id, c.listing_id, c.caller_id, c.receiver_id, 
                       c.start_time, c.end_time, c.duration, 
                       c.call_type, c.coin_spent, c.status,
                       l.title as listing_title,
                       u1.username as caller_username,
                       up1.full_name as caller_full_name,
                       u2.username as receiver_username,
                       up2.full_name as receiver_full_name
                FROM calls c
                JOIN listings l ON c.listing_id = l.id
                JOIN users u1 ON c.caller_id = u1.id
                LEFT JOIN user_profiles up1 ON u1.id = up1.user_id
                JOIN users u2 ON c.receiver_id = u2.id
                LEFT JOIN user_profiles up2 ON u2.id = up2.user_id
                ORDER BY c.start_time DESC
            `;
            
            const calls = DatabaseService.query(query);
            
            return { 
                success: true, 
                calls: calls 
            };
        } catch (error) {
            console.error('Görüşmeler getirilirken hata oluştu:', error);
            return { 
                success: false, 
                message: 'Görüşmeler getirilirken bir hata oluştu: ' + error.message 
            };
        }
    }

    // Tüm işlemleri getir
    async getAllTransactions() {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            const query = `
                SELECT t.id, t.user_id, t.transaction_type, t.amount, t.package_id, 
                       t.description, t.created_at,
                       u.username as user_username,
                       up.full_name as user_full_name,
                       p.name as package_name, p.price as package_price
                FROM coin_transactions t
                JOIN users u ON t.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN coin_packages p ON t.package_id = p.id
                ORDER BY t.created_at DESC
            `;
            
            const transactions = DatabaseService.query(query);
            
            return { 
                success: true, 
                transactions: transactions 
            };
        } catch (error) {
            console.error('İşlemler getirilirken hata oluştu:', error);
            return { 
                success: false, 
                message: 'İşlemler getirilirken bir hata oluştu: ' + error.message 
            };
        }
    }

    // İstatistikleri getir
    async getStats() {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            // Kullanıcı sayıları
            const userCountsQuery = `
                SELECT user_type, COUNT(*) as count
                FROM users
                GROUP BY user_type
            `;
            const userCounts = DatabaseService.query(userCountsQuery);
            
            // İlan sayısı
            const listingCountQuery = 'SELECT COUNT(*) as count FROM listings';
            const listingCount = DatabaseService.querySingle(listingCountQuery);
            
            // Görüşme sayısı
            const callCountQuery = 'SELECT COUNT(*) as count FROM calls';
            const callCount = DatabaseService.querySingle(callCountQuery);
            
            // Toplam coin harcaması
            const coinSpentQuery = 'SELECT SUM(coin_spent) as total FROM calls';
            const coinSpent = DatabaseService.querySingle(coinSpentQuery);
            
            // Toplam gelir (coin satın alma)
            const revenueQuery = `
                SELECT SUM(t.amount) as coin_sold, SUM(p.price) as total_revenue
                FROM coin_transactions t
                JOIN coin_packages p ON t.package_id = p.id
                WHERE t.transaction_type = 'purchase'
            `;
            const revenue = DatabaseService.querySingle(revenueQuery);
            
            return { 
                success: true, 
                stats: {
                    userCounts: userCounts,
                    totalListings: listingCount?.count || 0,
                    totalCalls: callCount?.count || 0,
                    totalCoinSpent: coinSpent?.total || 0,
                    totalCoinSold: revenue?.coin_sold || 0,
                    totalRevenue: revenue?.total_revenue || 0
                }
            };
        } catch (error) {
            console.error('İstatistikler getirilirken hata oluştu:', error);
            return { 
                success: false, 
                message: 'İstatistikler getirilirken bir hata oluştu: ' + error.message 
            };
        }
    }

    // Kategorileri yönet
    async manageCategories(action, data) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            let result;
            
            switch (action) {
                case 'get':
                    const categoriesQuery = `
                        SELECT c.id, c.name, c.description, c.parent_id, c.status,
                               p.name as parent_name
                        FROM categories c
                        LEFT JOIN categories p ON c.parent_id = p.id
                        ORDER BY c.name ASC
                    `;
                    result = { 
                        success: true, 
                        categories: DatabaseService.query(categoriesQuery)
                    };
                    break;
                    
                case 'add':
                    DatabaseService.execute(
                        'INSERT INTO categories (name, description, parent_id) VALUES (?, ?, ?)',
                        [data.name, data.description, data.parentId]
                    );
                    result = { 
                        success: true, 
                        message: 'Kategori başarıyla eklendi.',
                        categoryId: DatabaseService.lastInsertRowId()
                    };
                    break;
                    
                case 'update':
                    DatabaseService.execute(
                        'UPDATE categories SET name = ?, description = ?, parent_id = ?, status = ? WHERE id = ?',
                        [data.name, data.description, data.parentId, data.status, data.id]
                    );
                    result = { 
                        success: true, 
                        message: 'Kategori başarıyla güncellendi.'
                    };
                    break;
                    
                case 'delete':
                    // Önce bağlı ilanları kontrol et
                    const listingsQuery = 'SELECT COUNT(*) as count FROM listings WHERE category_id = ?';
                    const listingsCount = DatabaseService.querySingle(listingsQuery, [data.id]);
                    
                    if (listingsCount && listingsCount.count > 0) {
                        result = { 
                            success: false, 
                            message: 'Bu kategoriye bağlı ilanlar bulunduğu için silinemez.'
                        };
                    } else {
                        // Alt kategorileri kontrol et
                        const subCategoriesQuery = 'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?';
                        const subCategoriesCount = DatabaseService.querySingle(subCategoriesQuery, [data.id]);
                        
                        if (subCategoriesCount && subCategoriesCount.count > 0) {
                            result = { 
                                success: false, 
                                message: 'Bu kategoriye bağlı alt kategoriler bulunduğu için silinemez.'
                            };
                        } else {
                            // Kategoriyi sil
                            DatabaseService.execute('DELETE FROM categories WHERE id = ?', [data.id]);
                            result = { 
                                success: true, 
                                message: 'Kategori başarıyla silindi.'
                            };
                        }
                    }
                    break;
                    
                default:
                    result = { 
                        success: false, 
                        message: 'Geçersiz işlem.' 
                    };
            }
            
            // Veritabanını kaydet
            DatabaseService.saveDatabase();
            
            return result;
        } catch (error) {
            console.error('Kategoriler yönetilirken hata oluştu:', error);
            return { 
                success: false, 
                message: 'Kategoriler yönetilirken bir hata oluştu: ' + error.message 
            };
        }
    }

    // Coin paketlerini yönet
    async manageCoinPackages(action, data) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            let result;
            
            switch (action) {
                case 'get':
                    const packagesQuery = `
                        SELECT id, name, coin_amount, price, discount_percentage, status
                        FROM coin_packages
                        ORDER BY coin_amount ASC
                    `;
                    result = { 
                        success: true, 
                        packages: DatabaseService.query(packagesQuery)
                    };
                    break;
                    
                case 'add':
                    DatabaseService.execute(
                        `INSERT INTO coin_packages (name, coin_amount, price, discount_percentage, status) 
                         VALUES (?, ?, ?, ?, 'active')`,
                        [data.name, data.coinAmount, data.price, data.discountPercentage || 0]
                    );
                    result = { 
                        success: true, 
                        message: 'Coin paketi başarıyla eklendi.',
                        packageId: DatabaseService.lastInsertRowId()
                    };
                    break;
                    
                case 'update':
                    DatabaseService.execute(
                        `UPDATE coin_packages 
                         SET name = ?, coin_amount = ?, price = ?, 
                             discount_percentage = ?, status = ?
                         WHERE id = ?`,
                        [
                            data.name, 
                            data.coinAmount, 
                            data.price, 
                            data.discountPercentage || 0,
                            data.status,
                            data.id
                        ]
                    );
                    result = { 
                        success: true, 
                        message: 'Coin paketi başarıyla güncellendi.'
                    };
                    break;
                    
                case 'delete':
                    // İşlemler tablosunda kullanılıp kullanılmadığını kontrol et
                    const transactionsQuery = 'SELECT COUNT(*) as count FROM coin_transactions WHERE package_id = ?';
                    const transactionsCount = DatabaseService.querySingle(transactionsQuery, [data.id]);
                    
                    if (transactionsCount && transactionsCount.count > 0) {
                        result = { 
                            success: false, 
                            message: 'Bu coin paketi işlemlerde kullanıldığı için silinemez.'
                        };
                    } else {
                        // Paketi sil
                        DatabaseService.execute('DELETE FROM coin_packages WHERE id = ?', [data.id]);
                        result = { 
                            success: true, 
                            message: 'Coin paketi başarıyla silindi.'
                        };
                    }
                    break;
                    
                default:
                    result = { 
                        success: false, 
                        message: 'Geçersiz işlem.' 
                    };
            }
            
            // Veritabanını kaydet
            DatabaseService.saveDatabase();
            
            return result;
        } catch (error) {
            console.error('Coin paketleri yönetilirken hata oluştu:', error);
            return { 
                success: false, 
                message: 'Coin paketleri yönetilirken bir hata oluştu: ' + error.message 
            };
        }
    }
}

export default new AdminModel();

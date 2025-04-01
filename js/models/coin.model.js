// Coin modeli ve işlemleri
import DatabaseService from '../database.js';

class CoinModel {
    // Coin paketlerini getir
    async getCoinPackages() {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            const query = `
                SELECT id, name, coin_amount, price, discount_percentage, status
                FROM coin_packages
                WHERE status = 'active'
                ORDER BY coin_amount ASC
            `;
            
            const packages = DatabaseService.query(query);
            
            return { 
                success: true, 
                packages: packages 
            };
        } catch (error) {
            console.error('Coin paketleri getirilirken hata oluştu:', error);
            return { 
                success: false, 
                message: 'Coin paketleri getirilirken bir hata oluştu: ' + error.message 
            };
        }
    }

    // Kullanıcının bakiyesini getir
    async getUserBalance(userId) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            const query = 'SELECT coin_balance FROM member_balances WHERE user_id = ?';
            const balance = DatabaseService.querySingle(query, [userId]);
            
            if (!balance) {
                // Bakiye kaydı yoksa oluştur
                DatabaseService.execute(
                    'INSERT INTO member_balances (user_id, coin_balance) VALUES (?, 0)',
                    [userId]
                );
                
                return { 
                    success: true, 
                    balance: 0
                };
            }
            
            return { 
                success: true, 
                balance: balance.coin_balance 
            };
        } catch (error) {
            console.error('Bakiye getirilirken hata oluştu:', error);
            return { 
                success: false, 
                message: 'Bakiye getirilirken bir hata oluştu: ' + error.message 
            };
        }
    }

    // Coin satın al
    async buyCoin(userId, packageId) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            // Coin paketini kontrol et
            const packageQuery = 'SELECT * FROM coin_packages WHERE id = ? AND status = "active"';
            const coinPackage = DatabaseService.querySingle(packageQuery, [packageId]);
            
            if (!coinPackage) {
                return { 
                    success: false, 
                    message: 'Geçersiz coin paketi.' 
                };
            }
            
            // Bakiyeyi kontrol et ve güncelle
            const balanceQuery = 'SELECT id, coin_balance FROM member_balances WHERE user_id = ?';
            const balanceRecord = DatabaseService.querySingle(balanceQuery, [userId]);
            
            if (balanceRecord) {
                // Mevcut bakiyeyi güncelle
                DatabaseService.execute(
                    'UPDATE member_balances SET coin_balance = coin_balance + ? WHERE user_id = ?',
                    [coinPackage.coin_amount, userId]
                );
            } else {
                // Yeni bakiye kaydı oluştur
                DatabaseService.execute(
                    'INSERT INTO member_balances (user_id, coin_balance) VALUES (?, ?)',
                    [userId, coinPackage.coin_amount]
                );
            }
            
            // İşlem kaydı oluştur
            DatabaseService.execute(
                `INSERT INTO coin_transactions 
                 (user_id, transaction_type, amount, package_id, description) 
                 VALUES (?, 'purchase', ?, ?, ?)`,
                [
                    userId, 
                    coinPackage.coin_amount, 
                    packageId,
                    `${coinPackage.name} satın alındı (${coinPackage.price} TL)`
                ]
            );
            
            // Veritabanını kaydet
            DatabaseService.saveDatabase();
            
            return { 
                success: true, 
                package: coinPackage,
                message: `${coinPackage.coin_amount} coin satın alma işleminiz başarıyla tamamlandı!`
            };
        } catch (error) {
            console.error('Coin satın alınırken hata oluştu:', error);
            return { 
                success: false, 
                message: 'Coin satın alınırken bir hata oluştu: ' + error.message 
            };
        }
    }

    // Coin harca (görüşme için)
    async spendCoin(userId, amount, callId) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            // Bakiyeyi kontrol et
            const balanceQuery = 'SELECT coin_balance FROM member_balances WHERE user_id = ?';
            const balance = DatabaseService.querySingle(balanceQuery, [userId]);
            
            if (!balance) {
                return { 
                    success: false, 
                    message: 'Bakiye kaydı bulunamadı.' 
                };
            }
            
            if (balance.coin_balance < amount) {
                return { 
                    success: false, 
                    message: 'Yetersiz coin bakiyesi.' 
                };
            }
            
            // Bakiyeyi güncelle
            DatabaseService.execute(
                'UPDATE member_balances SET coin_balance = coin_balance - ? WHERE user_id = ?',
                [amount, userId]
            );
            
            // İşlem kaydı oluştur
            DatabaseService.execute(
                `INSERT INTO coin_transactions 
                 (user_id, transaction_type, amount, description) 
                 VALUES (?, 'usage', ?, ?)`,
                [
                    userId, 
                    amount,
                    `Görüşme için ${amount} coin harcandı (Görüşme ID: ${callId})`
                ]
            );
            
            // Veritabanını kaydet
            DatabaseService.saveDatabase();
            
            return { 
                success: true, 
                remainingBalance: balance.coin_balance - amount,
                message: `${amount} coin başarıyla harcandı.`
            };
        } catch (error) {
            console.error('Coin harcanırken hata oluştu:', error);
            return { 
                success: false, 
                message: 'Coin harcanırken bir hata oluştu: ' + error.message 
            };
        }
    }

    // Kullanıcının coin işlemlerini getir
    async getUserTransactions(userId) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            const query = `
                SELECT t.id, t.transaction_type, t.amount, t.description, t.created_at,
                       p.name as package_name, p.price as package_price
                FROM coin_transactions t
                LEFT JOIN coin_packages p ON t.package_id = p.id
                WHERE t.user_id = ?
                ORDER BY t.created_at DESC
            `;
            
            const transactions = DatabaseService.query(query, [userId]);
            
            return { 
                success: true, 
                transactions: transactions 
            };
        } catch (error) {
            console.error('İşlem geçmişi getirilirken hata oluştu:', error);
            return { 
                success: false, 
                message: 'İşlem geçmişi getirilirken bir hata oluştu: ' + error.message 
            };
        }
    }
}

export default new CoinModel();

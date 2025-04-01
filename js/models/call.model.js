// Görüşme modeli ve işlemleri
import DatabaseService from '../database.js';
import CoinModel from './coin.model.js';

class CallModel {
    // Görüşme başlat
    async startCall(listingId, callerId, receiverId, callType) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            // İlanı kontrol et
            const listingQuery = 'SELECT * FROM listings WHERE id = ? AND status = "active"';
            const listing = DatabaseService.querySingle(listingQuery, [listingId]);
            
            if (!listing) {
                return { 
                    success: false, 
                    message: 'İlan bulunamadı veya aktif değil.' 
                };
            }
            
            // İletişim tipinin desteklendiğini kontrol et
            const contactOptionsQuery = 'SELECT * FROM listing_contact_options WHERE listing_id = ? AND contact_type = ?';
            const contactOption = DatabaseService.querySingle(contactOptionsQuery, [listingId, callType]);
            
            if (!contactOption) {
                return { 
                    success: false, 
                    message: 'Bu ilan için seçilen iletişim tipi desteklenmiyor.' 
                };
            }
            
            // Görüşme oluştur
            DatabaseService.execute(
                `INSERT INTO calls 
                 (listing_id, caller_id, receiver_id, call_type, status) 
                 VALUES (?, ?, ?, ?, 'active')`,
                [listingId, callerId, receiverId, callType]
            );
            
            // Oluşturulan görüşmenin ID'sini al
            const callId = DatabaseService.lastInsertRowId();
            
            // Veritabanını kaydet
            DatabaseService.saveDatabase();
            
            return { 
                success: true, 
                callId: callId,
                message: 'Görüşme başlatıldı!'
            };
        } catch (error) {
            console.error('Görüşme başlatılırken hata oluştu:', error);
            return { 
                success: false, 
                message: 'Görüşme başlatılırken bir hata oluştu: ' + error.message 
            };
        }
    }

    // Görüşmeyi sonlandır
    async endCall(callId, duration) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            // Görüşmeyi kontrol et
            const callQuery = 'SELECT * FROM calls WHERE id = ? AND status = "active"';
            const call = DatabaseService.querySingle(callQuery, [callId]);
            
            if (!call) {
                return { 
                    success: false, 
                    message: 'Aktif görüşme bulunamadı.' 
                };
            }
            
            // Görüşmeyi güncelle
            DatabaseService.execute(
                `UPDATE calls 
                 SET end_time = CURRENT_TIMESTAMP, duration = ?, status = 'completed' 
                 WHERE id = ?`,
                [duration, callId]
            );
            
            // Coin ücretlendirmesi
            const coinPerMinute = call.call_type === 'video' ? 8 : 5; // Video için 8, ses için 5 coin
            const coinUsed = Math.ceil(duration / 60) * coinPerMinute;
            
            // Üye coin harcaması
            const spendResult = await CoinModel.spendCoin(call.caller_id, coinUsed, callId);
            
            if (!spendResult.success) {
                return { 
                    success: false, 
                    message: 'Coin harcama işlemi başarısız: ' + spendResult.message 
                };
            }
            
            // Görüşme için harcanan coin'i kaydet
            DatabaseService.execute(
                'UPDATE calls SET coin_spent = ? WHERE id = ?',
                [coinUsed, callId]
            );
            
            // Veritabanını kaydet
            DatabaseService.saveDatabase();
            
            return { 
                success: true, 
                duration: duration,
                coinSpent: coinUsed,
                message: 'Görüşme başarıyla sonlandırıldı.'
            };
        } catch (error) {
            console.error('Görüşme sonlandırılırken hata oluştu:', error);
            return { 
                success: false, 
                message: 'Görüşme sonlandırılırken bir hata oluştu: ' + error.message 
            };
        }
    }

    // Kullanıcının görüşmelerini getir
    async getUserCalls(userId, userType = 'member') {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            let query;
            
            if (userType === 'member') {
                // Üye (arayan) ise
                query = `
                    SELECT c.id, c.listing_id, c.start_time, c.end_time, c.duration, 
                           c.call_type, c.coin_spent, c.status,
                           l.title as listing_title, l.price as listing_price,
                           u.username as receiver_username,
                           up.full_name as receiver_full_name
                    FROM calls c
                    JOIN listings l ON c.listing_id = l.id
                    JOIN users u ON c.receiver_id = u.id
                    LEFT JOIN user_profiles up ON u.id = up.user_id
                    WHERE c.caller_id = ?
                    ORDER BY c.start_time DESC
                `;
            } else {
                // Kullanıcı (alıcı) ise
                query = `
                    SELECT c.id, c.listing_id, c.start_time, c.end_time, c.duration, 
                           c.call_type, c.coin_spent, c.status,
                           l.title as listing_title, l.price as listing_price,
                           u.username as caller_username,
                           up.full_name as caller_full_name
                    FROM calls c
                    JOIN listings l ON c.listing_id = l.id
                    JOIN users u ON c.caller_id = u.id
                    LEFT JOIN user_profiles up ON u.id = up.user_id
                    WHERE c.receiver_id = ?
                    ORDER BY c.start_time DESC
                `;
            }
            
            const calls = DatabaseService.query(query, [userId]);
            
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

    // Görüşme detayını getir
    async getCallById(callId) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            const query = `
                SELECT c.id, c.listing_id, c.caller_id, c.receiver_id, 
                       c.start_time, c.end_time, c.duration, 
                       c.call_type, c.coin_spent, c.status,
                       l.title as listing_title, l.price as listing_price,
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
                WHERE c.id = ?
            `;
            
            const call = DatabaseService.querySingle(query, [callId]);
            
            if (!call) {
                return { 
                    success: false, 
                    message: 'Görüşme bulunamadı.' 
                };
            }
            
            return { 
                success: true, 
                call: call 
            };
        } catch (error) {
            console.error('Görüşme detayı getirilirken hata oluştu:', error);
            return { 
                success: false, 
                message: 'Görüşme detayı getirilirken bir hata oluştu: ' + error.message 
            };
        }
    }

    // Görüşmeyi iptal et
    async cancelCall(callId) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            // Görüşmeyi kontrol et
            const callQuery = 'SELECT * FROM calls WHERE id = ? AND status = "active"';
            const call = DatabaseService.querySingle(callQuery, [callId]);
            
            if (!call) {
                return { 
                    success: false, 
                    message: 'Aktif görüşme bulunamadı.' 
                };
            }
            
            // Görüşmeyi güncelle
            DatabaseService.execute(
                'UPDATE calls SET status = "cancelled" WHERE id = ?',
                [callId]
            );
            
            // Veritabanını kaydet
            DatabaseService.saveDatabase();
            
            return { 
                success: true, 
                message: 'Görüşme iptal edildi.'
            };
        } catch (error) {
            console.error('Görüşme iptal edilirken hata oluştu:', error);
            return { 
                success: false, 
                message: 'Görüşme iptal edilirken bir hata oluştu: ' + error.message 
            };
        }
    }
}

export default new CallModel();

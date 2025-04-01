// İlan modeli ve işlemleri
import DatabaseService from '../database.js';

class ListingModel {
    // Tüm ilanları getir
    async getAllListings(filters = {}) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            let query = `
                SELECT l.id, l.title, l.description, l.price, l.status, l.created_at, l.view_count,
                       u.username as user_username, 
                       up.full_name as user_fullname, up.rating as user_rating,
                       c.name as category_name
                FROM listings l
                JOIN users u ON l.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN categories c ON l.category_id = c.id
                WHERE l.status = 'active'
            `;
            
            const params = [];
            
            // Filtreleri uygula
            if (filters.category) {
                query += ' AND l.category_id = ?';
                params.push(filters.category);
            }
            
            if (filters.minPrice) {
                query += ' AND l.price >= ?';
                params.push(filters.minPrice);
            }
            
            if (filters.maxPrice) {
                query += ' AND l.price <= ?';
                params.push(filters.maxPrice);
            }
            
            if (filters.search) {
                query += ' AND (l.title LIKE ? OR l.description LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm);
            }
            
            // Sıralama
            if (filters.sortBy) {
                const sortField = filters.sortBy === 'price' ? 'l.price' : 
                                  filters.sortBy === 'date' ? 'l.created_at' : 
                                  filters.sortBy === 'popularity' ? 'l.view_count' : 'l.created_at';
                
                const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
                query += ` ORDER BY ${sortField} ${sortOrder}`;
            } else {
                query += ' ORDER BY l.created_at DESC';
            }
            
            // Limit ve sayfalama
            if (filters.limit) {
                query += ' LIMIT ?';
                params.push(filters.limit);
                
                if (filters.offset) {
                    query += ' OFFSET ?';
                    params.push(filters.offset);
                }
            }
            
            const listings = DatabaseService.query(query, params);
            
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

    // İlan detayını getir
    async getListingById(listingId) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            // Görüntülenme sayısını arttır
            DatabaseService.execute(
                'UPDATE listings SET view_count = view_count + 1 WHERE id = ?',
                [listingId]
            );
            
            // İlan bilgilerini getir
            const query = `
                SELECT l.id, l.user_id, l.title, l.description, l.price, l.status, 
                       l.created_at, l.updated_at, l.view_count,
                       u.username as user_username, 
                       up.full_name as user_fullname, up.avatar as user_avatar, 
                       up.rating as user_rating, up.review_count as user_review_count,
                       c.id as category_id, c.name as category_name
                FROM listings l
                JOIN users u ON l.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN categories c ON l.category_id = c.id
                WHERE l.id = ?
            `;
            
            const listing = DatabaseService.querySingle(query, [listingId]);
            
            if (!listing) {
                return { success: false, message: 'İlan bulunamadı.' };
            }
            
            // İlan özelliklerini getir
            const featuresQuery = 'SELECT feature FROM listing_features WHERE listing_id = ?';
            const features = DatabaseService.query(featuresQuery, [listingId]);
            
            // İletişim tercihlerini getir
            const contactOptionsQuery = 'SELECT contact_type FROM listing_contact_options WHERE listing_id = ?';
            const contactOptions = DatabaseService.query(contactOptionsQuery, [listingId]);
            
            // Uygunluk saatlerini getir
            const availabilityQuery = `
                SELECT day_of_week, start_time, end_time 
                FROM listing_availability 
                WHERE listing_id = ?
            `;
            const availability = DatabaseService.query(availabilityQuery, [listingId]);
            
            // Sonuçları birleştir
            listing.features = features.map(f => f.feature);
            listing.contact_options = contactOptions.map(co => co.contact_type);
            listing.availability = availability;
            
            return { 
                success: true, 
                listing: listing 
            };
        } catch (error) {
            console.error('İlan detayı getirilirken hata oluştu:', error);
            return { 
                success: false, 
                message: 'İlan detayı getirilirken bir hata oluştu: ' + error.message 
            };
        }
    }

    // Yeni ilan oluştur
    async createListing(listingData) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            // İlanı ekle
            DatabaseService.execute(
                `INSERT INTO listings (user_id, title, description, price, category_id, status) 
                 VALUES (?, ?, ?, ?, ?, 'active')`,
                [
                    listingData.userId, 
                    listingData.title, 
                    listingData.description, 
                    listingData.price, 
                    listingData.categoryId
                ]
            );
            
            // Eklenen ilanın ID'sini al
            const listingId = DatabaseService.lastInsertRowId();
            
            // İlan özelliklerini ekle
            if (listingData.features && listingData.features.length > 0) {
                for (const feature of listingData.features) {
                    DatabaseService.execute(
                        'INSERT INTO listing_features (listing_id, feature) VALUES (?, ?)',
                        [listingId, feature]
                    );
                }
            }
            
            // İletişim tercihlerini ekle
            if (listingData.contactOptions && listingData.contactOptions.length > 0) {
                for (const contactType of listingData.contactOptions) {
                    DatabaseService.execute(
                        'INSERT INTO listing_contact_options (listing_id, contact_type) VALUES (?, ?)',
                        [listingId, contactType]
                    );
                }
            }
            
            // Uygunluk saatlerini ekle
            if (listingData.availability && listingData.availability.length > 0) {
                for (const avail of listingData.availability) {
                    DatabaseService.execute(
                        `INSERT INTO listing_availability (listing_id, day_of_week, start_time, end_time) 
                         VALUES (?, ?, ?, ?)`,
                        [listingId, avail.dayOfWeek, avail.startTime, avail.endTime]
                    );
                }
            }
            
            // Veritabanını kaydet
            DatabaseService.saveDatabase();
            
            return { 
                success: true, 
                listingId: listingId,
                message: 'İlan başarıyla oluşturuldu!' 
            };
        } catch (error) {
            console.error('İlan oluşturulurken hata oluştu:', error);
            return { 
                success: false, 
                message: 'İlan oluşturulurken bir hata oluştu: ' + error.message 
            };
        }
    }

    // İlanı güncelle
    async updateListing(listingId, listingData) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            // İlanı güncelle
            DatabaseService.execute(
                `UPDATE listings 
                 SET title = ?, description = ?, price = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
                [
                    listingData.title, 
                    listingData.description, 
                    listingData.price, 
                    listingData.categoryId,
                    listingId
                ]
            );
            
            // Mevcut özellikleri sil
            DatabaseService.execute('DELETE FROM listing_features WHERE listing_id = ?', [listingId]);
            
            // Yeni özellikleri ekle
            if (listingData.features && listingData.features.length > 0) {
                for (const feature of listingData.features) {
                    DatabaseService.execute(
                        'INSERT INTO listing_features (listing_id, feature) VALUES (?, ?)',
                        [listingId, feature]
                    );
                }
            }
            
            // Mevcut iletişim tercihlerini sil
            DatabaseService.execute('DELETE FROM listing_contact_options WHERE listing_id = ?', [listingId]);
            
            // Yeni iletişim tercihlerini ekle
            if (listingData.contactOptions && listingData.contactOptions.length > 0) {
                for (const contactType of listingData.contactOptions) {
                    DatabaseService.execute(
                        'INSERT INTO listing_contact_options (listing_id, contact_type) VALUES (?, ?)',
                        [listingId, contactType]
                    );
                }
            }
            
            // Mevcut uygunluk saatlerini sil
            DatabaseService.execute('DELETE FROM listing_availability WHERE listing_id = ?', [listingId]);
            
            // Yeni uygunluk saatlerini ekle
            if (listingData.availability && listingData.availability.length > 0) {
                for (const avail of listingData.availability) {
                    DatabaseService.execute(
                        `INSERT INTO listing_availability (listing_id, day_of_week, start_time, end_time) 
                         VALUES (?, ?, ?, ?)`,
                        [listingId, avail.dayOfWeek, avail.startTime, avail.endTime]
                    );
                }
            }
            
            // Veritabanını kaydet
            DatabaseService.saveDatabase();
            
            return { 
                success: true, 
                message: 'İlan başarıyla güncellendi!' 
            };
        } catch (error) {
            console.error('İlan güncellenirken hata oluştu:', error);
            return { 
                success: false, 
                message: 'İlan güncellenirken bir hata oluştu: ' + error.message 
            };
        }
    }

    // İlanı sil
    async deleteListing(listingId) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            // İlişkili verileri sil
            DatabaseService.execute('DELETE FROM listing_features WHERE listing_id = ?', [listingId]);
            DatabaseService.execute('DELETE FROM listing_contact_options WHERE listing_id = ?', [listingId]);
            DatabaseService.execute('DELETE FROM listing_availability WHERE listing_id = ?', [listingId]);
            DatabaseService.execute('DELETE FROM favorites WHERE listing_id = ?', [listingId]);
            
            // İlanı sil
            DatabaseService.execute('DELETE FROM listings WHERE id = ?', [listingId]);
            
            // Veritabanını kaydet
            DatabaseService.saveDatabase();
            
            return { 
                success: true, 
                message: 'İlan başarıyla silindi!' 
            };
        } catch (error) {
            console.error('İlan silinirken hata oluştu:', error);
            return { 
                success: false, 
                message: 'İlan silinirken bir hata oluştu: ' + error.message 
            };
        }
    }

    // İlanı favorilere ekle
    async addToFavorites(userId, listingId) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            // Daha önce eklenmiş mi kontrol et
            const checkQuery = 'SELECT id FROM favorites WHERE user_id = ? AND listing_id = ?';
            const existingFavorite = DatabaseService.querySingle(checkQuery, [userId, listingId]);
            
            if (existingFavorite) {
                return { 
                    success: false, 
                    message: 'Bu ilan zaten favorilerinizde.' 
                };
            }
            
            // Favorilere ekle
            DatabaseService.execute(
                'INSERT INTO favorites (user_id, listing_id) VALUES (?, ?)',
                [userId, listingId]
            );
            
            // Veritabanını kaydet
            DatabaseService.saveDatabase();
            
            return { 
                success: true, 
                message: 'İlan favorilerinize eklendi!' 
            };
        } catch (error) {
            console.error('İlan favorilere eklenirken hata oluştu:', error);
            return { 
                success: false, 
                message: 'İlan favorilere eklenirken bir hata oluştu: ' + error.message 
            };
        }
    }

    // İlanı favorilerden çıkar
    async removeFromFavorites(userId, listingId) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            // Favorilerden çıkar
            DatabaseService.execute(
                'DELETE FROM favorites WHERE user_id = ? AND listing_id = ?',
                [userId, listingId]
            );
            
            // Veritabanını kaydet
            DatabaseService.saveDatabase();
            
            return { 
                success: true, 
                message: 'İlan favorilerinizden çıkarıldı!' 
            };
        } catch (error) {
            console.error('İlan favorilerden çıkarılırken hata oluştu:', error);
            return { 
                success: false, 
                message: 'İlan favorilerden çıkarılırken bir hata oluştu: ' + error.message 
            };
        }
    }

    // Kullanıcının favori ilanlarını getir
    async getUserFavorites(userId) {
        try {
            // Veritabanının başlatıldığından emin ol
            await DatabaseService.init();
            
            const query = `
                SELECT l.id, l.title, l.description, l.price, l.status, l.created_at, l.view_count,
                       u.username as user_username, 
                       up.full_name as user_fullname, up.rating as user_rating,
                       c.name as category_name,
                       f.created_at as favorite_date
                FROM favorites f
                JOIN listings l ON f.listing_id = l.id
                JOIN users u ON l.user_id = u.id
                LEFT JOIN user_profiles up ON u.id = up.user_id
                LEFT JOIN categories c ON l.category_id = c.id
                WHERE f.user_id = ?
                ORDER BY f.created_at DESC
            `;
            
            const favorites = DatabaseService.query(query, [userId]);
            
            return { 
                success: true, 
                favorites: favorites 
            };
        } catch (error) {
            console.error('Favori ilanlar getirilirken hata oluştu:', error);
            return { 
                success: false, 
                message: 'Favori ilanlar getirilirken bir hata oluştu: ' + error.message 
            };
        }
    }
}

export default new ListingModel();

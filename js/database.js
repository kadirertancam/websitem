// SQLite veritabanı bağlantı ve işlemleri

// SQLite'ı tarayıcıda kullanmak için SQL.js kullanıyoruz
// Not: Gerçek bir uygulamada, bu işlemler sunucu tarafında gerçekleştirilir

class Database {
    constructor() {
        this.db = null;
        this.initialized = false;
    }

    // Veritabanını başlat
    async init() {
        if (this.initialized) return;

        try {
            // SQL.js'yi dinamik olarak yükle
            const SQL = await this.loadSQL();
            
            // Veritabanı dosyasını kontrol et
            let dbData;
            
            try {
                // Eğer veritabanı dosyası varsa yükle
                const response = await fetch('database/platform.db');
                dbData = await response.arrayBuffer();
            } catch (e) {
                // Dosya yoksa yeni veritabanı oluştur
                console.log('Veritabanı dosyası bulunamadı, yeni oluşturuluyor...');
                dbData = null;
            }
            
            // Veritabanını oluştur ya da aç
            if (dbData) {
                this.db = new SQL.Database(new Uint8Array(dbData));
            } else {
                this.db = new SQL.Database();
                await this.createSchema();
            }
            
            this.initialized = true;
            console.log('Veritabanı başarıyla başlatıldı');
        } catch (error) {
            console.error('Veritabanı başlatılırken hata oluştu:', error);
            throw error;
        }
    }

    // SQL.js kütüphanesini yükle
    async loadSQL() {
        return new Promise((resolve, reject) => {
            // SQL.js CDN bağlantısı
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.min.js';
            script.async = true;
            
            script.onload = async () => {
                try {
                    // SQL.js'yi başlat
                    const SQL = await initSqlJs({
                        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
                    });
                    resolve(SQL);
                } catch (error) {
                    reject(error);
                }
            };
            
            script.onerror = () => {
                reject(new Error('SQL.js yüklenemedi'));
            };
            
            document.head.appendChild(script);
        });
    }

    // Şemayı oluştur
    async createSchema() {
        try {
            const schemaResponse = await fetch('database/schema.sql');
            const schemaSQL = await schemaResponse.text();
            
            // SQL komutlarını ayrı ayrı çalıştır
            const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
            
            for (const statement of statements) {
                if (statement.trim()) {
                    try {
                        this.db.exec(statement + ';');
                    } catch (error) {
                        console.error('SQL komutu çalıştırılırken hata oluştu:', statement, error);
                    }
                }
            }
            
            console.log('Veritabanı şeması başarıyla oluşturuldu');
        } catch (error) {
            console.error('Şema oluşturulurken hata oluştu:', error);
            throw error;
        }
    }

    // Veritabanını kaydet
    saveDatabase() {
        if (!this.db) return null;
        
        try {
            // Veritabanını Uint8Array olarak dışa aktar
            const data = this.db.export();
            
            // LocalStorage'a kaydetmek için Base64'e dönüştür
            // Not: Bu yöntem büyük veritabanları için uygun değildir
            const base64Data = this.arrayBufferToBase64(data);
            localStorage.setItem('database', base64Data);
            
            console.log('Veritabanı başarıyla kaydedildi');
            return data;
        } catch (error) {
            console.error('Veritabanı kaydedilirken hata oluştu:', error);
            return null;
        }
    }

    // Veritabanını yükle (localStorage'dan)
    loadDatabase() {
        try {
            const base64Data = localStorage.getItem('database');
            if (!base64Data) return false;
            
            const data = this.base64ToArrayBuffer(base64Data);
            this.db = new SQL.Database(new Uint8Array(data));
            
            console.log('Veritabanı başarıyla yüklendi');
            return true;
        } catch (error) {
            console.error('Veritabanı yüklenirken hata oluştu:', error);
            return false;
        }
    }

    // Uint8Array'i Base64'e dönüştür
    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        
        return window.btoa(binary);
    }

    // Base64'ü ArrayBuffer'a dönüştür
    base64ToArrayBuffer(base64) {
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        return bytes.buffer;
    }

    // Sorgu çalıştır (SELECT sorguları için)
    query(sql, params = []) {
        if (!this.db) throw new Error('Veritabanı başlatılmadı');
        
        try {
            const stmt = this.db.prepare(sql);
            
            // Parametreleri bağla
            if (params.length > 0) {
                stmt.bind(params);
            }
            
            const results = [];
            while (stmt.step()) {
                results.push(stmt.getAsObject());
            }
            
            stmt.free();
            return results;
        } catch (error) {
            console.error('Sorgu çalıştırılırken hata oluştu:', sql, error);
            throw error;
        }
    }

    // Tek bir sonuç döndüren sorgu
    querySingle(sql, params = []) {
        const results = this.query(sql, params);
        return results.length > 0 ? results[0] : null;
    }

    // Değişiklik sorgusu çalıştır (INSERT, UPDATE, DELETE sorguları için)
    execute(sql, params = []) {
        if (!this.db) throw new Error('Veritabanı başlatılmadı');
        
        try {
            const stmt = this.db.prepare(sql);
            
            // Parametreleri bağla
            if (params.length > 0) {
                stmt.bind(params);
            }
            
            stmt.run();
            stmt.free();
            
            // Etkilenen satır sayısını döndür
            return this.db.getRowsModified();
        } catch (error) {
            console.error('Sorgu çalıştırılırken hata oluştu:', sql, error);
            throw error;
        }
    }

    // Eklenen son kaydın ID'sini döndür
    lastInsertRowId() {
        return this.querySingle('SELECT last_insert_rowid() as id').id;
    }
}

// Veritabanı servisi (singleton)
const DatabaseService = new Database();

// Sayfa yüklendiğinde veritabanını başlat
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await DatabaseService.init();
    } catch (error) {
        console.error('Veritabanı başlatılamadı:', error);
    }
});

export default DatabaseService;

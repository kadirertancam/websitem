-- Veritabanı Şeması

-- Kullanıcılar tablosu (admin, user, member)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    user_type TEXT NOT NULL CHECK(user_type IN ('admin', 'user', 'member')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'banned'))
);

-- Kullanıcı Profilleri tablosu
CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    full_name TEXT,
    phone TEXT,
    avatar TEXT,
    bio TEXT,
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Kategoriler tablosu
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    parent_id INTEGER,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- İlanlar tablosu
CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    category_id INTEGER,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'pending', 'inactive', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    view_count INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- İlan Özellikleri tablosu
CREATE TABLE IF NOT EXISTS listing_features (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    feature TEXT NOT NULL,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

-- İlan İletişim Tercihleri tablosu
CREATE TABLE IF NOT EXISTS listing_contact_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    contact_type TEXT NOT NULL CHECK(contact_type IN ('voice', 'video')),
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

-- İlan Uygunluk Saatleri tablosu
CREATE TABLE IF NOT EXISTS listing_availability (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

-- Coin Paketleri tablosu
CREATE TABLE IF NOT EXISTS coin_packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    coin_amount INTEGER NOT NULL,
    price REAL NOT NULL,
    discount_percentage INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive'))
);

-- Üye Bakiyeleri tablosu
CREATE TABLE IF NOT EXISTS member_balances (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    coin_balance INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Coin İşlemleri tablosu
CREATE TABLE IF NOT EXISTS coin_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL CHECK(transaction_type IN ('purchase', 'usage', 'refund', 'admin_adjustment')),
    amount INTEGER NOT NULL,
    package_id INTEGER,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (package_id) REFERENCES coin_packages(id) ON DELETE SET NULL
);

-- Görüşmeler tablosu
CREATE TABLE IF NOT EXISTS calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    caller_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    duration INTEGER DEFAULT 0,
    call_type TEXT NOT NULL CHECK(call_type IN ('voice', 'video')),
    coin_spent INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'cancelled', 'failed')),
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY (caller_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Favoriler tablosu
CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    listing_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    UNIQUE(user_id, listing_id)
);

-- Değerlendirmeler tablosu
CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reviewer_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    listing_id INTEGER,
    call_id INTEGER,
    rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE SET NULL,
    FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE SET NULL
);

-- Bildirimler tablosu
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notification_type TEXT NOT NULL,
    related_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Örnek Veriler

-- Admin kullanıcısı
INSERT INTO users (username, email, password, user_type) 
VALUES ('admin', 'admin@ilanplatformu.com', 'admin123', 'admin');

-- Kullanıcı (İlan Veren)
INSERT INTO users (username, email, password, user_type) 
VALUES ('user', 'user@example.com', 'user123', 'user');

-- Üye (İlan Görüntüleyen)
INSERT INTO users (username, email, password, user_type) 
VALUES ('member', 'member@example.com', 'member123', 'member');

-- Örnek Kullanıcı Profilleri
INSERT INTO user_profiles (user_id, full_name, phone, bio, rating, review_count) 
VALUES (1, 'Admin Kullanıcı', '555-123-4567', 'Platform Yöneticisi', 5.0, 10);

INSERT INTO user_profiles (user_id, full_name, phone, bio, rating, review_count) 
VALUES (2, 'Ahmet Yılmaz', '555-987-6543', 'İlan veren örnek kullanıcı', 4.8, 65);

INSERT INTO user_profiles (user_id, full_name, phone, bio, rating, review_count) 
VALUES (3, 'Mehmet Demir', '555-456-7890', 'Üye örnek kullanıcı', 4.5, 30);

-- Örnek Kategoriler
INSERT INTO categories (name, description) VALUES ('Kategori 1', 'Örnek kategori açıklaması 1');
INSERT INTO categories (name, description) VALUES ('Kategori 2', 'Örnek kategori açıklaması 2');
INSERT INTO categories (name, description) VALUES ('Kategori 3', 'Örnek kategori açıklaması 3');
INSERT INTO categories (name, description) VALUES ('Kategori 4', 'Örnek kategori açıklaması 4');

-- Örnek İlanlar
INSERT INTO listings (user_id, title, description, price, category_id, view_count) 
VALUES (2, 'Örnek İlan 1', 'Bu bir örnek ilan açıklamasıdır. Gerçek uygulamada, bu alan kullanıcının ilan oluştururken girdiği içerikle doldurulacaktır.', 50.00, 1, 245);

INSERT INTO listings (user_id, title, description, price, category_id, view_count) 
VALUES (2, 'Örnek İlan 2', 'Bu bir örnek ilan açıklamasıdır. Gerçek uygulamada, bu alan kullanıcının ilan oluştururken girdiği içerikle doldurulacaktır.', 75.00, 2, 178);

INSERT INTO listings (user_id, title, description, price, category_id, view_count) 
VALUES (2, 'Örnek İlan 3', 'Bu bir örnek ilan açıklamasıdır. Gerçek uygulamada, bu alan kullanıcının ilan oluştururken girdiği içerikle doldurulacaktır.', 100.00, 3, 120);

-- Örnek İlan Özellikleri
INSERT INTO listing_features (listing_id, feature) VALUES (1, 'Örnek Hizmet 1');
INSERT INTO listing_features (listing_id, feature) VALUES (1, 'Örnek Hizmet 2');
INSERT INTO listing_features (listing_id, feature) VALUES (1, 'Örnek Hizmet 3');
INSERT INTO listing_features (listing_id, feature) VALUES (2, 'Örnek Hizmet 1');
INSERT INTO listing_features (listing_id, feature) VALUES (2, 'Örnek Hizmet 2');
INSERT INTO listing_features (listing_id, feature) VALUES (3, 'Örnek Hizmet 1');

-- Örnek İlan İletişim Tercihleri
INSERT INTO listing_contact_options (listing_id, contact_type) VALUES (1, 'voice');
INSERT INTO listing_contact_options (listing_id, contact_type) VALUES (1, 'video');
INSERT INTO listing_contact_options (listing_id, contact_type) VALUES (2, 'voice');
INSERT INTO listing_contact_options (listing_id, contact_type) VALUES (3, 'voice');
INSERT INTO listing_contact_options (listing_id, contact_type) VALUES (3, 'video');

-- Örnek Coin Paketleri
INSERT INTO coin_packages (name, coin_amount, price, discount_percentage) 
VALUES ('Başlangıç Paketi', 100, 50.00, 0);

INSERT INTO coin_packages (name, coin_amount, price, discount_percentage) 
VALUES ('Standart Paket', 250, 100.00, 0);

INSERT INTO coin_packages (name, coin_amount, price, discount_percentage) 
VALUES ('Popüler Paket', 600, 200.00, 20);

INSERT INTO coin_packages (name, coin_amount, price, discount_percentage) 
VALUES ('Premium Paket', 1000, 300.00, 25);

-- Örnek Üye Bakiyesi
INSERT INTO member_balances (user_id, coin_balance) VALUES (3, 50);

-- Örnek Favoriler
INSERT INTO favorites (user_id, listing_id) VALUES (3, 1);
INSERT INTO favorites (user_id, listing_id) VALUES (3, 3);

-- 1. Cấu hình an toàn cho SQLite 
PRAGMA defer_foreign_keys=TRUE; 

-- 2. Xóa bảng cũ để làm sạch (theo thứ tự để tránh lỗi khóa ngoại)
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS chat_histories;
DROP TABLE IF EXISTS users;

-- 3. Bảng USERS 
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL, 
    password TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user',   
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- 4. Bảng CHAT_HISTORIES
CREATE TABLE chat_histories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Bảng MESSAGES
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_history_id INTEGER NOT NULL,
    role TEXT NOT NULL, 
    content TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    
    FOREIGN KEY (chat_history_id) REFERENCES chat_histories(id) ON DELETE CASCADE
);


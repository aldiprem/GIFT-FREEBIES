# database.py
import sqlite3
from config import Config
from utils import log_info, log_error, get_jakarta_time

class Database:
    def __init__(self):
        self.db_path = Config.DB_PATH
        self.conn = None
        self.init_db()
    
    def get_connection(self):
        """Mendapatkan koneksi database"""
        if self.conn is None:
            self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
            self.conn.row_factory = sqlite3.Row
            log_info("Database connected")
        return self.conn
    
    def get_cursor(self):
        """Mendapatkan cursor baru"""
        conn = self.get_connection()
        return conn.cursor()
    
    def init_db(self):
        """Inisialisasi database dan membuat tabel users"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # Buat tabel users
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY,
                fullname TEXT NOT NULL,
                username TEXT,
                phone_number TEXT,
                language_code TEXT,
                is_bot INTEGER DEFAULT 0,
                is_premium INTEGER DEFAULT 0,
                first_seen TEXT,
                last_seen TEXT,
                total_participations INTEGER DEFAULT 0,
                total_wins INTEGER DEFAULT 0,
                created_at TEXT,
                updated_at TEXT
            )
            """)
            
            # Buat index untuk pencarian
            cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_users_username 
            ON users(username)
            """)
            
            cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_users_last_seen 
            ON users(last_seen)
            """)
            
            conn.commit()
            log_info("Table 'users' created/verified")
            
        except Exception as e:
            log_error(f"Error initializing database: {e}")
    
    def add_user(self, user_id, fullname, username=None, phone_number=None,
                 language_code=None, is_bot=0, is_premium=0):
        """Menambah atau mengupdate user"""
        now = get_jakarta_time()
        cursor = self.get_cursor()
        
        try:
            # Cek apakah user sudah ada
            cursor.execute(
                "SELECT user_id FROM users WHERE user_id = ?",
                (user_id,)
            )
            existing = cursor.fetchone()
            
            if existing:
                # Update user yang sudah ada
                cursor.execute("""
                UPDATE users SET
                    fullname = ?,
                    username = ?,
                    phone_number = ?,
                    language_code = ?,
                    is_bot = ?,
                    is_premium = ?,
                    last_seen = ?,
                    updated_at = ?
                WHERE user_id = ?
                """, (
                    fullname, username, phone_number, language_code,
                    is_bot, is_premium, now, now, user_id
                ))
                log_info(f"User {user_id} updated")
            else:
                # Insert user baru
                cursor.execute("""
                INSERT INTO users (
                    user_id, fullname, username, phone_number, language_code,
                    is_bot, is_premium, first_seen, last_seen, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    user_id, fullname, username, phone_number, language_code,
                    is_bot, is_premium, now, now, now, now
                ))
                log_info(f"User {user_id} added")
            
            self.conn.commit()
            return True
            
        except Exception as e:
            log_error(f"Error adding user: {e}")
            return False
        finally:
            cursor.close()
    
    def get_user(self, user_id):
        """Mendapatkan data user berdasarkan ID"""
        cursor = self.get_cursor()
        try:
            cursor.execute("""
            SELECT user_id, fullname, username, phone_number, language_code,
                   is_bot, is_premium, first_seen, last_seen,
                   total_participations, total_wins
            FROM users WHERE user_id = ?
            """, (user_id,))
            
            user = cursor.fetchone()
            return dict(user) if user else None
            
        except Exception as e:
            log_error(f"Error getting user: {e}")
            return None
        finally:
            cursor.close()
    
    def get_user_by_username(self, username):
        """Mendapatkan user berdasarkan username"""
        cursor = self.get_cursor()
        try:
            cursor.execute("""
            SELECT user_id, fullname, username, phone_number, language_code,
                   is_bot, is_premium, first_seen, last_seen,
                   total_participations, total_wins
            FROM users WHERE username = ?
            """, (username,))
            
            user = cursor.fetchone()
            return dict(user) if user else None
            
        except Exception as e:
            log_error(f"Error getting user by username: {e}")
            return None
        finally:
            cursor.close()
    
    def get_all_users(self, limit=100, offset=0):
        """Mendapatkan semua users dengan pagination"""
        cursor = self.get_cursor()
        try:
            cursor.execute("""
            SELECT user_id, fullname, username, language_code, is_premium,
                   first_seen, last_seen, total_participations, total_wins
            FROM users
            ORDER BY last_seen DESC
            LIMIT ? OFFSET ?
            """, (limit, offset))
            
            users = cursor.fetchall()
            return [dict(user) for user in users]
            
        except Exception as e:
            log_error(f"Error getting all users: {e}")
            return []
        finally:
            cursor.close()
    
    def update_user_stats(self, user_id, participated=False, won=False):
        """Update statistik user"""
        cursor = self.get_cursor()
        try:
            updates = []
            params = []
            
            if participated:
                updates.append("total_participations = total_participations + 1")
            
            if won:
                updates.append("total_wins = total_wins + 1")
            
            if not updates:
                return True
            
            query = f"""
            UPDATE users 
            SET {', '.join(updates)}, last_seen = ?
            WHERE user_id = ?
            """
            
            params.append(get_jakarta_time())
            params.append(user_id)
            
            cursor.execute(query, params)
            self.conn.commit()
            
            log_info(f"User {user_id} stats updated")
            return True
            
        except Exception as e:
            log_error(f"Error updating user stats: {e}")
            return False
        finally:
            cursor.close()
    
    def search_users(self, query, limit=20):
        """Mencari users berdasarkan nama atau username"""
        cursor = self.get_cursor()
        try:
            search_term = f"%{query}%"
            cursor.execute("""
            SELECT user_id, fullname, username, language_code, is_premium,
                   first_seen, total_participations, total_wins
            FROM users
            WHERE fullname LIKE ? OR username LIKE ?
            ORDER BY last_seen DESC
            LIMIT ?
            """, (search_term, search_term, limit))
            
            users = cursor.fetchall()
            return [dict(user) for user in users]
            
        except Exception as e:
            log_error(f"Error searching users: {e}")
            return []
        finally:
            cursor.close()
    
    def get_user_count(self):
        """Mendapatkan total jumlah users"""
        cursor = self.get_cursor()
        try:
            cursor.execute("SELECT COUNT(*) FROM users")
            count = cursor.fetchone()[0]
            return count
        except Exception as e:
            log_error(f"Error getting user count: {e}")
            return 0
        finally:
            cursor.close()
    
    def get_active_users(self, days=7):
        """Mendapatkan jumlah user aktif dalam X hari terakhir"""
        cursor = self.get_cursor()
        try:
            from datetime import datetime, timedelta
            jakarta_tz = pytz.timezone('Asia/Jakarta')
            cutoff = (datetime.now(jakarta_tz) - timedelta(days=days)).strftime('%Y-%m-%d %H:%M:%S')
            
            cursor.execute("""
            SELECT COUNT(*) FROM users WHERE last_seen > ?
            """, (cutoff,))
            
            count = cursor.fetchone()[0]
            return count
        except Exception as e:
            log_error(f"Error getting active users: {e}")
            return 0
        finally:
            cursor.close()
    
    def close(self):
        """Menutup koneksi database"""
        if self.conn:
            self.conn.close()
            self.conn = None
            log_info("Database connection closed")

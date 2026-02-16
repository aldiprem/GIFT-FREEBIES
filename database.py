# database.py
import sqlite3
import json
from config import Config
from utils import log_info, log_error, get_jakarta_time
import pytz
from datetime import datetime, timedelta

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
        """Inisialisasi database dan membuat semua tabel"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            
            # ==================== TABEL USERS ====================
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
            
            # Index untuk users
            cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_users_username 
            ON users(username)
            """)
            
            cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_users_last_seen 
            ON users(last_seen)
            """)
            
            # ==================== TABEL GIVEAWAYS ====================
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS giveaways (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                giveaway_id TEXT UNIQUE NOT NULL,
                creator_user_id INTEGER NOT NULL,
                prizes TEXT NOT NULL, -- JSON array of prizes
                requirements TEXT, -- JSON array of requirements
                giveaway_text TEXT NOT NULL,
                duration_type TEXT,
                duration_value INTEGER,
                duration_unit TEXT,
                end_date TEXT,
                media_path TEXT,
                captcha_enabled INTEGER DEFAULT 1,
                participants_count INTEGER DEFAULT 0,
                winners_count INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active',
                created_at TEXT,
                updated_at TEXT,
                FOREIGN KEY (creator_user_id) REFERENCES users(user_id)
            )
            """)
            
            # Index untuk giveaways
            cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_giveaways_creator 
            ON giveaways(creator_user_id)
            """)
            
            cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_giveaways_status 
            ON giveaways(status)
            """)
            
            cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_giveaways_end_date 
            ON giveaways(end_date)
            """)
            
            # ==================== TABEL PARTICIPANTS ====================
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS participants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                giveaway_id TEXT NOT NULL,
                user_id INTEGER NOT NULL,
                tickets INTEGER DEFAULT 1,
                joined_at TEXT,
                is_winner INTEGER DEFAULT 0,
                win_position INTEGER,
                has_claimed INTEGER DEFAULT 0,
                claimed_at TEXT,
                FOREIGN KEY (giveaway_id) REFERENCES giveaways(giveaway_id),
                FOREIGN KEY (user_id) REFERENCES users(user_id),
                UNIQUE(giveaway_id, user_id)
            )
            """)
            
            # Index untuk participants
            cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_participants_giveaway 
            ON participants(giveaway_id)
            """)
            
            cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_participants_user 
            ON participants(user_id)
            """)
            
            # ==================== TABEL WINNERS ====================
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS winners (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                giveaway_id TEXT NOT NULL,
                user_id INTEGER NOT NULL,
                win_position INTEGER,
                announced_at TEXT,
                claimed_at TEXT,
                claim_deadline TEXT,
                delivery_status TEXT DEFAULT 'pending',
                FOREIGN KEY (giveaway_id) REFERENCES giveaways(giveaway_id),
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            )
            """)
            
            # ==================== TABEL GIVEAWAY_LOGS ====================
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS giveaway_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                giveaway_id TEXT NOT NULL,
                action TEXT NOT NULL,
                performed_by INTEGER,
                details TEXT,
                ip_address TEXT,
                created_at TEXT,
                FOREIGN KEY (giveaway_id) REFERENCES giveaways(giveaway_id),
                FOREIGN KEY (performed_by) REFERENCES users(user_id)
            )
            """)
            
            conn.commit()
            log_info("All tables created/verified")
            
        except Exception as e:
            log_error(f"Error initializing database: {e}")
    
    # ==================== USER METHODS ====================
    
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
    
    # ==================== GIVEAWAY METHODS ====================
    
    def create_giveaway(self, giveaway_id, creator_user_id, prizes, giveaway_text,
                       requirements=None, duration_type=None, duration_value=None,
                       duration_unit=None, end_date=None, media_path=None,
                       captcha_enabled=1):
        """Membuat giveaway baru"""
        now = get_jakarta_time()
        cursor = self.get_cursor()
        
        try:
            # Convert lists to JSON strings
            prizes_json = json.dumps(prizes)
            requirements_json = json.dumps(requirements) if requirements else None
            
            cursor.execute("""
            INSERT INTO giveaways (
                giveaway_id, creator_user_id, prizes, requirements,
                giveaway_text, duration_type, duration_value, duration_unit,
                end_date, media_path, captcha_enabled, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                giveaway_id, creator_user_id, prizes_json, requirements_json,
                giveaway_text, duration_type, duration_value, duration_unit,
                end_date, media_path, captcha_enabled, now, now
            ))
            
            self.conn.commit()
            log_info(f"Giveaway created: {giveaway_id}")
            
            # Add log
            self.add_giveaway_log(giveaway_id, 'CREATE', creator_user_id, 'Giveaway created')
            
            return True
            
        except Exception as e:
            log_error(f"Error creating giveaway: {e}")
            return False
        finally:
            cursor.close()
    
    def get_giveaway(self, giveaway_id):
        """Mendapatkan data giveaway berdasarkan ID"""
        cursor = self.get_cursor()
        try:
            cursor.execute("""
            SELECT * FROM giveaways WHERE giveaway_id = ?
            """, (giveaway_id,))
            
            giveaway = cursor.fetchone()
            
            if giveaway:
                result = dict(giveaway)
                # Parse JSON fields
                result['prizes'] = json.loads(result['prizes'])
                if result['requirements']:
                    result['requirements'] = json.loads(result['requirements'])
                
                # Get participants count
                cursor.execute("""
                SELECT COUNT(*) FROM participants WHERE giveaway_id = ?
                """, (giveaway_id,))
                result['participants_count'] = cursor.fetchone()[0]
                
                return result
            
            return None
            
        except Exception as e:
            log_error(f"Error getting giveaway: {e}")
            return None
        finally:
            cursor.close()
    
    def get_all_giveaways(self, status='active', limit=50, offset=0):
        """Mendapatkan semua giveaways"""
        cursor = self.get_cursor()
        try:
            now = get_jakarta_time()
            
            if status == 'active':
                query = """
                SELECT * FROM giveaways 
                WHERE status = 'active' AND (end_date IS NULL OR end_date > ?)
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
                """
                params = (now, limit, offset)
            elif status == 'ended':
                query = """
                SELECT * FROM giveaways 
                WHERE status = 'ended' OR (end_date IS NOT NULL AND end_date <= ?)
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
                """
                params = (now, limit, offset)
            else:
                query = """
                SELECT * FROM giveaways 
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
                """
                params = (limit, offset)
            
            cursor.execute(query, params)
            giveaways = cursor.fetchall()
            
            result = []
            for g in giveaways:
                giveaway_dict = dict(g)
                giveaway_dict['prizes'] = json.loads(giveaway_dict['prizes'])
                if giveaway_dict['requirements']:
                    giveaway_dict['requirements'] = json.loads(giveaway_dict['requirements'])
                result.append(giveaway_dict)
            
            return result
            
        except Exception as e:
            log_error(f"Error getting all giveaways: {e}")
            return []
        finally:
            cursor.close()
    
    def get_user_giveaways(self, user_id, status='all', limit=50, offset=0):
        """Mendapatkan semua giveaways yang dibuat oleh user"""
        cursor = self.get_cursor()
        try:
            now = get_jakarta_time()
            
            if status == 'active':
                query = """
                SELECT * FROM giveaways 
                WHERE creator_user_id = ? AND status = 'active' 
                AND (end_date IS NULL OR end_date > ?)
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
                """
                params = (user_id, now, limit, offset)
            elif status == 'ended':
                query = """
                SELECT * FROM giveaways 
                WHERE creator_user_id = ? AND (status = 'ended' OR (end_date IS NOT NULL AND end_date <= ?))
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
                """
                params = (user_id, now, limit, offset)
            else:
                query = """
                SELECT * FROM giveaways 
                WHERE creator_user_id = ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
                """
                params = (user_id, limit, offset)
            
            cursor.execute(query, params)
            giveaways = cursor.fetchall()
            
            result = []
            for g in giveaways:
                giveaway_dict = dict(g)
                giveaway_dict['prizes'] = json.loads(giveaway_dict['prizes'])
                if giveaway_dict['requirements']:
                    giveaway_dict['requirements'] = json.loads(giveaway_dict['requirements'])
                result.append(giveaway_dict)
            
            return result
            
        except Exception as e:
            log_error(f"Error getting user giveaways: {e}")
            return []
        finally:
            cursor.close()
    
    def update_giveaway(self, giveaway_id, data):
        """Update giveaway"""
        cursor = self.get_cursor()
        try:
            updates = []
            params = []
            
            # Fields yang bisa diupdate
            updatable_fields = ['prizes', 'requirements', 'giveaway_text', 
                               'end_date', 'media_path', 'captcha_enabled', 'status']
            
            for field in updatable_fields:
                if field in data:
                    if field in ['prizes', 'requirements']:
                        # Convert to JSON
                        updates.append(f"{field} = ?")
                        params.append(json.dumps(data[field]))
                    else:
                        updates.append(f"{field} = ?")
                        params.append(data[field])
            
            if not updates:
                return True
            
            updates.append("updated_at = ?")
            params.append(get_jakarta_time())
            params.append(giveaway_id)
            
            query = f"""
            UPDATE giveaways 
            SET {', '.join(updates)}
            WHERE giveaway_id = ?
            """
            
            cursor.execute(query, params)
            self.conn.commit()
            
            log_info(f"Giveaway {giveaway_id} updated")
            
            # Add log
            self.add_giveaway_log(giveaway_id, 'UPDATE', None, 'Giveaway updated')
            
            return True
            
        except Exception as e:
            log_error(f"Error updating giveaway: {e}")
            return False
        finally:
            cursor.close()
    
    def delete_giveaway(self, giveaway_id):
        """Soft delete giveaway"""
        cursor = self.get_cursor()
        try:
            cursor.execute("""
            UPDATE giveaways 
            SET status = 'deleted', updated_at = ?
            WHERE giveaway_id = ?
            """, (get_jakarta_time(), giveaway_id))
            
            self.conn.commit()
            log_info(f"Giveaway {giveaway_id} deleted")
            
            return True
            
        except Exception as e:
            log_error(f"Error deleting giveaway: {e}")
            return False
        finally:
            cursor.close()
    
    def search_giveaways(self, query, limit=20):
        """Mencari giveaways berdasarkan prize atau text"""
        cursor = self.get_cursor()
        try:
            search_term = f"%{query}%"
            cursor.execute("""
            SELECT * FROM giveaways 
            WHERE giveaway_text LIKE ? OR prizes LIKE ?
            ORDER BY created_at DESC
            LIMIT ?
            """, (search_term, search_term, limit))
            
            giveaways = cursor.fetchall()
            
            result = []
            for g in giveaways:
                giveaway_dict = dict(g)
                giveaway_dict['prizes'] = json.loads(giveaway_dict['prizes'])
                if giveaway_dict['requirements']:
                    giveaway_dict['requirements'] = json.loads(giveaway_dict['requirements'])
                result.append(giveaway_dict)
            
            return result
            
        except Exception as e:
            log_error(f"Error searching giveaways: {e}")
            return []
        finally:
            cursor.close()
    
    def get_giveaway_count(self):
        """Mendapatkan total jumlah giveaways"""
        cursor = self.get_cursor()
        try:
            cursor.execute("SELECT COUNT(*) FROM giveaways")
            count = cursor.fetchone()[0]
            return count
        except Exception as e:
            log_error(f"Error getting giveaway count: {e}")
            return 0
        finally:
            cursor.close()
    
    def get_giveaway_stats(self):
        """Mendapatkan statistik giveaway"""
        cursor = self.get_cursor()
        try:
            stats = {}
            
            # Total giveaways
            cursor.execute("SELECT COUNT(*) FROM giveaways")
            stats['total'] = cursor.fetchone()[0]
            
            # Active giveaways
            now = get_jakarta_time()
            cursor.execute("""
            SELECT COUNT(*) FROM giveaways 
            WHERE status = 'active' AND (end_date IS NULL OR end_date > ?)
            """, (now,))
            stats['active'] = cursor.fetchone()[0]
            
            # Ended giveaways
            cursor.execute("""
            SELECT COUNT(*) FROM giveaways 
            WHERE status = 'ended' OR (end_date IS NOT NULL AND end_date <= ?)
            """, (now,))
            stats['ended'] = cursor.fetchone()[0]
            
            # Total participants
            cursor.execute("SELECT COUNT(*) FROM participants")
            stats['total_participants'] = cursor.fetchone()[0]
            
            return stats
            
        except Exception as e:
            log_error(f"Error getting giveaway stats: {e}")
            return {}
        finally:
            cursor.close()
    
    # ==================== PARTICIPANT METHODS ====================
    
    def add_participant(self, giveaway_id, user_id, tickets=1):
        """Menambah participant ke giveaway"""
        now = get_jakarta_time()
        cursor = self.get_cursor()
        
        try:
            # Cek apakah user sudah join
            cursor.execute("""
            SELECT id, tickets FROM participants 
            WHERE giveaway_id = ? AND user_id = ?
            """, (giveaway_id, user_id))
            
            existing = cursor.fetchone()
            
            if existing:
                # Update tickets
                cursor.execute("""
                UPDATE participants 
                SET tickets = tickets + ?, joined_at = ?
                WHERE giveaway_id = ? AND user_id = ?
                """, (tickets, now, giveaway_id, user_id))
                
                log_info(f"Updated tickets for user {user_id} in {giveaway_id}")
            else:
                # Insert baru
                cursor.execute("""
                INSERT INTO participants (giveaway_id, user_id, tickets, joined_at)
                VALUES (?, ?, ?, ?)
                """, (giveaway_id, user_id, tickets, now))
                
                # Update participants count di giveaways
                cursor.execute("""
                UPDATE giveaways 
                SET participants_count = participants_count + 1
                WHERE giveaway_id = ?
                """, (giveaway_id,))
                
                log_info(f"New participant {user_id} in {giveaway_id}")
            
            self.conn.commit()
            
            # Add log
            self.add_giveaway_log(giveaway_id, 'PARTICIPATE', user_id, f'Joined with {tickets} tickets')
            
            return True
            
        except Exception as e:
            log_error(f"Error adding participant: {e}")
            return False
        finally:
            cursor.close()
    
    def get_participants(self, giveaway_id):
        """Mendapatkan semua participants dari giveaway"""
        cursor = self.get_cursor()
        try:
            cursor.execute("""
            SELECT p.*, u.fullname, u.username 
            FROM participants p
            JOIN users u ON p.user_id = u.user_id
            WHERE p.giveaway_id = ?
            ORDER BY p.joined_at DESC
            """, (giveaway_id,))
            
            participants = cursor.fetchall()
            return [dict(p) for p in participants]
            
        except Exception as e:
            log_error(f"Error getting participants: {e}")
            return []
        finally:
            cursor.close()
    
    # ==================== LOG METHODS ====================
    
    def add_giveaway_log(self, giveaway_id, action, performed_by=None, details=None):
        """Menambah log giveaway"""
        now = get_jakarta_time()
        cursor = self.get_cursor()
        
        try:
            cursor.execute("""
            INSERT INTO giveaway_logs (giveaway_id, action, performed_by, details, created_at)
            VALUES (?, ?, ?, ?, ?)
            """, (giveaway_id, action, performed_by, details, now))
            
            self.conn.commit()
            return True
            
        except Exception as e:
            log_error(f"Error adding log: {e}")
            return False
        finally:
            cursor.close()
    
    def get_giveaway_logs(self, giveaway_id, limit=50):
        """Mendapatkan logs dari giveaway"""
        cursor = self.get_cursor()
        try:
            cursor.execute("""
            SELECT * FROM giveaway_logs 
            WHERE giveaway_id = ?
            ORDER BY created_at DESC
            LIMIT ?
            """, (giveaway_id, limit))
            
            logs = cursor.fetchall()
            return [dict(log) for log in logs]
            
        except Exception as e:
            log_error(f"Error getting logs: {e}")
            return []
        finally:
            cursor.close()
    
    
    def close(self):
        """Menutup koneksi database"""
        if self.conn:
            self.conn.close()
            self.conn = None
            log_info("Database connection closed")

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
            
            # ==================== TABEL GIVEAWAYS - DIPERBARUI ====================
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS giveaways (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                giveaway_id TEXT UNIQUE NOT NULL,
                creator_user_id INTEGER NOT NULL,
                creator_fullname TEXT,
                creator_username TEXT,
                prizes TEXT NOT NULL, -- JSON array of prizes
                channels TEXT, -- JSON array of channels/groups
                links TEXT, -- JSON array of links
                requirements TEXT, -- JSON array of requirements
                giveaway_text TEXT,
                duration_days INTEGER DEFAULT 0,
                duration_hours INTEGER DEFAULT 0,
                duration_minutes INTEGER DEFAULT 0,
                duration_seconds INTEGER DEFAULT 0,
                total_seconds INTEGER,
                end_date TEXT,
                media_path TEXT,
                media_type TEXT,
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

            # ==================== TABEL CHAT ID DATA (CHANNEL/GROUP) ====================
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS chatid_data (
                chat_id INTEGER PRIMARY KEY,
                chat_title TEXT,
                chat_username TEXT,
                chat_type TEXT,
                invite_link TEXT,
                admin_count INTEGER DEFAULT 0,
                participants_count INTEGER DEFAULT 0,
                is_verified INTEGER DEFAULT 0,
                is_scam INTEGER DEFAULT 0,
                is_fake INTEGER DEFAULT 0,
                slow_mode_enabled INTEGER DEFAULT 0,
                slow_mode_seconds INTEGER DEFAULT 0,
                created_at TEXT,
                updated_at TEXT
            )
            """)
            
            # Index untuk chatid_data
            cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_chatid_username 
            ON chatid_data(chat_username)
            """)
            
            cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_chatid_type 
            ON chatid_data(chat_type)
            """)
            
            # ==================== TABEL CHAT ADMINS ====================
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS chat_admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chat_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                username TEXT,
                fullname TEXT,
                role TEXT DEFAULT 'admin',
                created_at TEXT,
                updated_at TEXT,
                UNIQUE(chat_id, user_id)
            )
            """)
            
            # Index untuk chat_admins
            cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_chat_admins_chat 
            ON chat_admins(chat_id)
            """)
            
            cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_chat_admins_user 
            ON chat_admins(user_id)
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
    
    # ==================== GIVEAWAY METHODS - DIPERBARUI ====================
    
    def create_giveaway(self, giveaway_data):
        """Membuat giveaway baru dengan semua field dari form"""
        cursor = self.get_cursor()
        try:
            now = get_jakarta_time()
            
            # Hitung total seconds
            total_seconds = (
                giveaway_data.get('duration_days', 0) * 86400 +
                giveaway_data.get('duration_hours', 0) * 3600 +
                giveaway_data.get('duration_minutes', 0) * 60 +
                giveaway_data.get('duration_seconds', 0)
            )
            
            # Hitung end_date
            end_date = None
            if total_seconds > 0:
                jakarta_tz = pytz.timezone('Asia/Jakarta')
                end_date = (datetime.now(jakarta_tz) + timedelta(seconds=total_seconds)).strftime('%Y-%m-%d %H:%M:%S')
            
            cursor.execute("""
            INSERT INTO giveaways (
                giveaway_id, creator_user_id, creator_fullname, creator_username,
                prizes, channels, links, requirements, giveaway_text,
                duration_days, duration_hours, duration_minutes, duration_seconds,
                total_seconds, end_date, media_path, media_type, captcha_enabled,
                status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                giveaway_data['giveaway_id'],
                giveaway_data['creator_user_id'],
                giveaway_data.get('creator_fullname'),
                giveaway_data.get('creator_username'),
                json.dumps(giveaway_data.get('prizes', [])),
                json.dumps(giveaway_data.get('channels', [])),
                json.dumps(giveaway_data.get('links', [])),
                json.dumps(giveaway_data.get('requirements', [])),
                giveaway_data.get('giveaway_text'),
                giveaway_data.get('duration_days', 0),
                giveaway_data.get('duration_hours', 0),
                giveaway_data.get('duration_minutes', 0),
                giveaway_data.get('duration_seconds', 0),
                total_seconds,
                end_date,
                giveaway_data.get('media_path'),
                giveaway_data.get('media_type'),
                giveaway_data.get('captcha_enabled', 1),
                giveaway_data.get('status', 'active'),
                now,
                now
            ))
            
            self.conn.commit()
            log_info(f"Giveaway {giveaway_data['giveaway_id']} created")
            
            # Log creation
            self.add_giveaway_log(
                giveaway_data['giveaway_id'],
                'created',
                giveaway_data['creator_user_id'],
                {'prizes_count': len(giveaway_data.get('prizes', []))}
            )
            
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
                for field in ['prizes', 'channels', 'links', 'requirements']:
                    if result.get(field):
                        try:
                            result[field] = json.loads(result[field])
                        except:
                            result[field] = []
                return result
            return None
            
        except Exception as e:
            log_error(f"Error getting giveaway: {e}")
            return None
        finally:
            cursor.close()
    
    def get_giveaways_by_creator(self, creator_user_id, limit=50, offset=0):
        """Mendapatkan semua giveaway yang dibuat oleh user tertentu"""
        cursor = self.get_cursor()
        try:
            cursor.execute("""
            SELECT * FROM giveaways 
            WHERE creator_user_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """, (creator_user_id, limit, offset))
            
            giveaways = cursor.fetchall()
            result = []
            for g in giveaways:
                g_dict = dict(g)
                for field in ['prizes', 'channels', 'links', 'requirements']:
                    if g_dict.get(field):
                        try:
                            g_dict[field] = json.loads(g_dict[field])
                        except:
                            g_dict[field] = []
                result.append(g_dict)
            return result
            
        except Exception as e:
            log_error(f"Error getting giveaways by creator: {e}")
            return []
        finally:
            cursor.close()
    
    def get_active_giveaways(self, limit=50):
        """Mendapatkan giveaway yang masih aktif"""
        cursor = self.get_cursor()
        try:
            now = get_jakarta_time()
            cursor.execute("""
            SELECT * FROM giveaways 
            WHERE status = 'active' AND (end_date IS NULL OR end_date > ?)
            ORDER BY created_at DESC
            LIMIT ?
            """, (now, limit))
            
            giveaways = cursor.fetchall()
            result = []
            for g in giveaways:
                g_dict = dict(g)
                for field in ['prizes', 'channels', 'links', 'requirements']:
                    if g_dict.get(field):
                        try:
                            g_dict[field] = json.loads(g_dict[field])
                        except:
                            g_dict[field] = []
                result.append(g_dict)
            return result
            
        except Exception as e:
            log_error(f"Error getting active giveaways: {e}")
            return []
        finally:
            cursor.close()
    
    def update_giveaway_status(self, giveaway_id, status):
        """Update status giveaway"""
        cursor = self.get_cursor()
        try:
            now = get_jakarta_time()
            cursor.execute("""
            UPDATE giveaways 
            SET status = ?, updated_at = ?
            WHERE giveaway_id = ?
            """, (status, now, giveaway_id))
            
            self.conn.commit()
            log_info(f"Giveaway {giveaway_id} status updated to {status}")
            
            # Log status change
            self.add_giveaway_log(giveaway_id, f'status_changed_to_{status}', None)
            
            return True
            
        except Exception as e:
            log_error(f"Error updating giveaway status: {e}")
            return False
        finally:
            cursor.close()
    
    def increment_participants(self, giveaway_id):
        """Menambah jumlah peserta giveaway"""
        cursor = self.get_cursor()
        try:
            cursor.execute("""
            UPDATE giveaways 
            SET participants_count = participants_count + 1,
                updated_at = ?
            WHERE giveaway_id = ?
            """, (get_jakarta_time(), giveaway_id))
            
            self.conn.commit()
            return True
            
        except Exception as e:
            log_error(f"Error incrementing participants: {e}")
            return False
        finally:
            cursor.close()
    
    # ==================== PARTICIPANT METHODS ====================
    
    def add_participant(self, giveaway_id, user_id, tickets=1):
        """Menambah peserta giveaway"""
        cursor = self.get_cursor()
        try:
            now = get_jakarta_time()
            
            cursor.execute("""
            INSERT OR REPLACE INTO participants 
            (giveaway_id, user_id, tickets, joined_at)
            VALUES (?, ?, ?, ?)
            """, (giveaway_id, user_id, tickets, now))
            
            self.conn.commit()
            
            # Update user stats
            self.update_user_stats(user_id, participated=True)
            
            log_info(f"User {user_id} joined giveaway {giveaway_id}")
            return True
            
        except Exception as e:
            log_error(f"Error adding participant: {e}")
            return False
        finally:
            cursor.close()
    
    def get_participants(self, giveaway_id):
        """Mendapatkan semua peserta giveaway"""
        cursor = self.get_cursor()
        try:
            cursor.execute("""
            SELECT p.*, u.fullname, u.username, u.is_premium
            FROM participants p
            JOIN users u ON p.user_id = u.user_id
            WHERE p.giveaway_id = ?
            ORDER BY p.joined_at ASC
            """, (giveaway_id,))
            
            participants = cursor.fetchall()
            return [dict(p) for p in participants]
            
        except Exception as e:
            log_error(f"Error getting participants: {e}")
            return []
        finally:
            cursor.close()
    
    def get_participant_count(self, giveaway_id):
        """Mendapatkan jumlah peserta giveaway"""
        cursor = self.get_cursor()
        try:
            cursor.execute("""
            SELECT COUNT(*) FROM participants WHERE giveaway_id = ?
            """, (giveaway_id,))
            
            count = cursor.fetchone()[0]
            return count
            
        except Exception as e:
            log_error(f"Error getting participant count: {e}")
            return 0
        finally:
            cursor.close()
    
    def check_participant(self, giveaway_id, user_id):
        """Cek apakah user sudah ikut giveaway"""
        cursor = self.get_cursor()
        try:
            cursor.execute("""
            SELECT * FROM participants 
            WHERE giveaway_id = ? AND user_id = ?
            """, (giveaway_id, user_id))
            
            return cursor.fetchone() is not None
            
        except Exception as e:
            log_error(f"Error checking participant: {e}")
            return False
        finally:
            cursor.close()
    
    # ==================== WINNER METHODS ====================
    
    def add_winners(self, giveaway_id, winners):
        """Menambah pemenang giveaway"""
        cursor = self.get_cursor()
        try:
            now = get_jakarta_time()
            jakarta_tz = pytz.timezone('Asia/Jakarta')
            claim_deadline = (datetime.now(jakarta_tz) + timedelta(days=3)).strftime('%Y-%m-%d %H:%M:%S')
            
            for winner in winners:
                cursor.execute("""
                INSERT INTO winners 
                (giveaway_id, user_id, win_position, announced_at, claim_deadline)
                VALUES (?, ?, ?, ?, ?)
                """, (
                    giveaway_id,
                    winner['user_id'],
                    winner.get('position'),
                    now,
                    claim_deadline
                ))
                
                # Update user stats
                self.update_user_stats(winner['user_id'], won=True)
                
                # Update participant as winner
                cursor.execute("""
                UPDATE participants 
                SET is_winner = 1, win_position = ?
                WHERE giveaway_id = ? AND user_id = ?
                """, (winner.get('position'), giveaway_id, winner['user_id']))
            
            # Update giveaway winners count
            cursor.execute("""
            UPDATE giveaways 
            SET winners_count = winners_count + ?,
                updated_at = ?
            WHERE giveaway_id = ?
            """, (len(winners), now, giveaway_id))
            
            self.conn.commit()
            log_info(f"{len(winners)} winners added to giveaway {giveaway_id}")
            return True
            
        except Exception as e:
            log_error(f"Error adding winners: {e}")
            return False
        finally:
            cursor.close()
    
    def get_winners(self, giveaway_id):
        """Mendapatkan pemenang giveaway"""
        cursor = self.get_cursor()
        try:
            cursor.execute("""
            SELECT w.*, u.fullname, u.username, u.is_premium
            FROM winners w
            JOIN users u ON w.user_id = u.user_id
            WHERE w.giveaway_id = ?
            ORDER BY w.win_position ASC
            """, (giveaway_id,))
            
            winners = cursor.fetchall()
            return [dict(w) for w in winners]
            
        except Exception as e:
            log_error(f"Error getting winners: {e}")
            return []
        finally:
            cursor.close()
    
    def claim_prize(self, giveaway_id, user_id):
        """User mengklaim hadiah"""
        cursor = self.get_cursor()
        try:
            now = get_jakarta_time()
            
            cursor.execute("""
            UPDATE winners 
            SET claimed_at = ?, delivery_status = 'claimed'
            WHERE giveaway_id = ? AND user_id = ?
            """, (now, giveaway_id, user_id))
            
            cursor.execute("""
            UPDATE participants 
            SET has_claimed = 1, claimed_at = ?
            WHERE giveaway_id = ? AND user_id = ?
            """, (now, giveaway_id, user_id))
            
            self.conn.commit()
            log_info(f"User {user_id} claimed prize for giveaway {giveaway_id}")
            return True
            
        except Exception as e:
            log_error(f"Error claiming prize: {e}")
            return False
        finally:
            cursor.close()
    
    # ==================== LOG METHODS ====================
    
    def add_giveaway_log(self, giveaway_id, action, performed_by=None, details=None):
        """Menambah log giveaway"""
        cursor = self.get_cursor()
        try:
            now = get_jakarta_time()
            
            cursor.execute("""
            INSERT INTO giveaway_logs 
            (giveaway_id, action, performed_by, details, created_at)
            VALUES (?, ?, ?, ?, ?)
            """, (
                giveaway_id,
                action,
                performed_by,
                json.dumps(details) if details else None,
                now
            ))
            
            self.conn.commit()
            return True
            
        except Exception as e:
            log_error(f"Error adding giveaway log: {e}")
            return False
        finally:
            cursor.close()
    
    def get_giveaway_logs(self, giveaway_id, limit=50):
        """Mendapatkan log giveaway"""
        cursor = self.get_cursor()
        try:
            cursor.execute("""
            SELECT * FROM giveaway_logs 
            WHERE giveaway_id = ?
            ORDER BY created_at DESC
            LIMIT ?
            """, (giveaway_id, limit))
            
            logs = cursor.fetchall()
            result = []
            for log in logs:
                log_dict = dict(log)
                if log_dict.get('details'):
                    try:
                        log_dict['details'] = json.loads(log_dict['details'])
                    except:
                        pass
                result.append(log_dict)
            return result
            
        except Exception as e:
            log_error(f"Error getting giveaway logs: {e}")
            return []
        finally:
            cursor.close()
    
    # ==================== STATS METHODS ====================
    
    def get_giveaway_stats(self):
        """Mendapatkan statistik giveaway"""
        cursor = self.get_cursor()
        try:
            stats = {}
            
            # Total giveaways
            cursor.execute("SELECT COUNT(*) FROM giveaways")
            stats['total'] = cursor.fetchone()[0]
            
            # Active giveaways
            cursor.execute("SELECT COUNT(*) FROM giveaways WHERE status = 'active'")
            stats['active'] = cursor.fetchone()[0]
            
            # Ended giveaways
            cursor.execute("SELECT COUNT(*) FROM giveaways WHERE status = 'ended'")
            stats['ended'] = cursor.fetchone()[0]
            
            # Total participants
            cursor.execute("SELECT COUNT(*) FROM participants")
            stats['total_participants'] = cursor.fetchone()[0]
            
            # Total winners
            cursor.execute("SELECT COUNT(*) FROM winners")
            stats['total_winners'] = cursor.fetchone()[0]
            
            return stats
            
        except Exception as e:
            log_error(f"Error getting giveaway stats: {e}")
            return {}
        finally:
            cursor.close()
    
    def close(self):
        """Menutup koneksi database"""
        if self.conn:
            self.conn.close()
            self.conn = None
            log_info("Database connection closed")
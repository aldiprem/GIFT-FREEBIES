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
            
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen)")
            
            # ==================== TABEL GIVEAWAYS ====================
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS giveaways (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                giveaway_id TEXT UNIQUE NOT NULL,
                creator_user_id INTEGER NOT NULL,
                creator_fullname TEXT,
                creator_username TEXT,
                prizes TEXT NOT NULL,
                channels TEXT,
                links TEXT,
                requirements TEXT,
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
            
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_giveaways_creator ON giveaways(creator_user_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_giveaways_status ON giveaways(status)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_giveaways_end_date ON giveaways(end_date)")
            
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
            
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_participants_giveaway ON participants(giveaway_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_participants_user ON participants(user_id)")
            
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

            # ==================== TABEL CHAT ID DATA ====================
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
            
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_chatid_username ON chatid_data(chat_username)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_chatid_type ON chatid_data(chat_type)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_chat_admins_chat ON chat_admins(chat_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS idx_chat_admins_user ON chat_admins(user_id)")

            conn.commit()
            log_info("All tables created/verified")
            
        except Exception as e:
            log_error(f"Error initializing database: {e}")
    
    def reset_database(self):
        """Mereset database dengan menghapus file dan membuat ulang"""
        try:
            if self.conn:
                self.conn.close()
                self.conn = None
            
            log_info("🗑️  Mereset database...")
            
            import os
            if os.path.exists(self.db_path):
                os.remove(self.db_path)
                log_info(f"✅ File database dihapus: {self.db_path}")
            else:
                log_info(f"ℹ️ File database tidak ditemukan: {self.db_path}")
            
            self.init_db()
            
            cursor = self.get_cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = cursor.fetchall()
            cursor.close()
            
            log_info(f"✅ Database berhasil direset. Tabel yang dibuat: {len(tables)}")
            return True
            
        except Exception as e:
            log_error(f"❌ Error resetting database: {e}")
            return False

    # ==================== USER METHODS ====================
    def add_user(self, user_id, fullname, username=None, phone_number=None,
                 language_code=None, is_bot=0, is_premium=0):
        """Menambah atau mengupdate user"""
        now = get_jakarta_time()
        cursor = self.get_cursor()
        
        try:
            cursor.execute(
                "SELECT user_id FROM users WHERE user_id = ?",
                (user_id,)
            )
            existing = cursor.fetchone()
            
            if existing:
                cursor.execute("""
                UPDATE users SET
                    fullname = ?, username = ?, phone_number = ?,
                    language_code = ?, is_bot = ?, is_premium = ?,
                    last_seen = ?, updated_at = ?
                WHERE user_id = ?
                """, (fullname, username, phone_number, language_code,
                      is_bot, is_premium, now, now, user_id))
                log_info(f"User {user_id} updated")
            else:
                cursor.execute("""
                INSERT INTO users (
                    user_id, fullname, username, phone_number, language_code,
                    is_bot, is_premium, first_seen, last_seen, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (user_id, fullname, username, phone_number, language_code,
                      is_bot, is_premium, now, now, now, now))
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
            
            return [dict(user) for user in cursor.fetchall()]
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
            UPDATE users SET {', '.join(updates)}, last_seen = ? WHERE user_id = ?
            """
            params.append(get_jakarta_time())
            params.append(user_id)
            
            cursor.execute(query, params)
            self.conn.commit()
            log_info(f"User {user_id} stats updated")
            return True
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
            
            return [dict(user) for user in cursor.fetchall()]
        finally:
            cursor.close()
    
    def get_user_count(self):
        """Mendapatkan total jumlah users"""
        cursor = self.get_cursor()
        try:
            cursor.execute("SELECT COUNT(*) FROM users")
            return cursor.fetchone()[0]
        finally:
            cursor.close()
    
    def get_active_users(self, days=7):
        """Mendapatkan jumlah user aktif dalam X hari terakhir"""
        cursor = self.get_cursor()
        try:
            jakarta_tz = pytz.timezone('Asia/Jakarta')
            cutoff = (datetime.now(jakarta_tz) - timedelta(days=days)).strftime('%Y-%m-%d %H:%M:%S')
            
            cursor.execute("SELECT COUNT(*) FROM users WHERE last_seen > ?", (cutoff,))
            return cursor.fetchone()[0]
        finally:
            cursor.close()
    
    # ==================== GIVEAWAY METHODS ====================
    def create_giveaway(self, giveaway_data):
        """Membuat giveaway baru"""
        cursor = self.get_cursor()
        try:
            now = get_jakarta_time()
            
            total_seconds = (
                giveaway_data.get('duration_days', 0) * 86400 +
                giveaway_data.get('duration_hours', 0) * 3600 +
                giveaway_data.get('duration_minutes', 0) * 60 +
                giveaway_data.get('duration_seconds', 0)
            )
            
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
            cursor.execute("SELECT * FROM giveaways WHERE giveaway_id = ?", (giveaway_id,))
            giveaway = cursor.fetchone()
            
            if giveaway:
                result = dict(giveaway)
                for field in ['prizes', 'channels', 'links', 'requirements']:
                    if result.get(field):
                        try:
                            result[field] = json.loads(result[field])
                        except:
                            result[field] = []
                return result
            return None
        finally:
            cursor.close()
    
    def get_user_giveaways(self, user_id, status='all', limit=50, offset=0):
        """Mendapatkan semua giveaway yang dibuat oleh user tertentu"""
        cursor = self.get_cursor()
        try:
            if status == 'all':
                cursor.execute("""
                SELECT * FROM giveaways WHERE creator_user_id = ?
                ORDER BY created_at DESC LIMIT ? OFFSET ?
                """, (user_id, limit, offset))
            else:
                cursor.execute("""
                SELECT * FROM giveaways WHERE creator_user_id = ? AND status = ?
                ORDER BY created_at DESC LIMIT ? OFFSET ?
                """, (user_id, status, limit, offset))
            
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
        finally:
            cursor.close()
    
    def get_all_giveaways(self, status='active', limit=50, offset=0):
        """Mendapatkan semua giveaway dengan filter status"""
        cursor = self.get_cursor()
        try:
            if status == 'all':
                cursor.execute("""
                SELECT * FROM giveaways ORDER BY created_at DESC LIMIT ? OFFSET ?
                """, (limit, offset))
            else:
                cursor.execute("""
                SELECT * FROM giveaways WHERE status = ?
                ORDER BY created_at DESC LIMIT ? OFFSET ?
                """, (status, limit, offset))
            
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
        finally:
            cursor.close()
    
    def update_giveaway(self, giveaway_id, data):
        """Update giveaway"""
        cursor = self.get_cursor()
        try:
            now = get_jakarta_time()
            
            update_fields = []
            params = []
            
            if 'prizes' in data:
                update_fields.append("prizes = ?")
                params.append(json.dumps(data['prizes']))
            if 'requirements' in data:
                update_fields.append("requirements = ?")
                params.append(json.dumps(data['requirements']))
            if 'giveaway_text' in data:
                update_fields.append("giveaway_text = ?")
                params.append(data['giveaway_text'])
            if 'status' in data:
                update_fields.append("status = ?")
                params.append(data['status'])
            
            update_fields.append("updated_at = ?")
            params.append(now)
            
            if not update_fields:
                return True
            
            query = f"UPDATE giveaways SET {', '.join(update_fields)} WHERE giveaway_id = ?"
            params.append(giveaway_id)
            
            cursor.execute(query, params)
            self.conn.commit()
            log_info(f"Giveaway {giveaway_id} updated")
            return True
        finally:
            cursor.close()
    
    def delete_giveaway(self, giveaway_id):
        """Soft delete giveaway"""
        return self.update_giveaway(giveaway_id, {'status': 'deleted'})
    
    def search_giveaways(self, query, limit=20):
        """Mencari giveaway berdasarkan prize atau text"""
        cursor = self.get_cursor()
        try:
            search_term = f"%{query}%"
            cursor.execute("""
            SELECT * FROM giveaways 
            WHERE prizes LIKE ? OR giveaway_text LIKE ?
            ORDER BY created_at DESC LIMIT ?
            """, (search_term, search_term, limit))
            
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
        finally:
            cursor.close()
    
    def get_giveaway_count(self):
        """Mendapatkan total jumlah giveaway"""
        cursor = self.get_cursor()
        try:
            cursor.execute("SELECT COUNT(*) FROM giveaways")
            return cursor.fetchone()[0]
        finally:
            cursor.close()
    
    def get_giveaway_stats(self):
        """Mendapatkan statistik giveaway"""
        cursor = self.get_cursor()
        try:
            stats = {}
            cursor.execute("SELECT COUNT(*) FROM giveaways")
            stats['total'] = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM giveaways WHERE status = 'active'")
            stats['active'] = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM giveaways WHERE status = 'ended'")
            stats['ended'] = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM participants")
            stats['total_participants'] = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM winners")
            stats['total_winners'] = cursor.fetchone()[0]
            return stats
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
            self.update_user_stats(user_id, participated=True)
            log_info(f"User {user_id} joined giveaway {giveaway_id}")
            return True
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
            
            return [dict(p) for p in cursor.fetchall()]
        finally:
            cursor.close()
    
    def get_participant_count(self, giveaway_id):
        """Mendapatkan jumlah peserta giveaway"""
        cursor = self.get_cursor()
        try:
            cursor.execute("SELECT COUNT(*) FROM participants WHERE giveaway_id = ?", (giveaway_id,))
            return cursor.fetchone()[0]
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
                """, (giveaway_id, winner['user_id'], winner.get('position'), now, claim_deadline))
                
                self.update_user_stats(winner['user_id'], won=True)
                
                cursor.execute("""
                UPDATE participants SET is_winner = 1, win_position = ?
                WHERE giveaway_id = ? AND user_id = ?
                """, (winner.get('position'), giveaway_id, winner['user_id']))
            
            cursor.execute("""
            UPDATE giveaways SET winners_count = winners_count + ?, updated_at = ?
            WHERE giveaway_id = ?
            """, (len(winners), now, giveaway_id))
            
            self.conn.commit()
            log_info(f"{len(winners)} winners added to giveaway {giveaway_id}")
            return True
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
            
            return [dict(w) for w in cursor.fetchall()]
        finally:
            cursor.close()
    
    def claim_prize(self, giveaway_id, user_id):
        """User mengklaim hadiah"""
        cursor = self.get_cursor()
        try:
            now = get_jakarta_time()
            cursor.execute("""
            UPDATE winners SET claimed_at = ?, delivery_status = 'claimed'
            WHERE giveaway_id = ? AND user_id = ?
            """, (now, giveaway_id, user_id))
            
            cursor.execute("""
            UPDATE participants SET has_claimed = 1, claimed_at = ?
            WHERE giveaway_id = ? AND user_id = ?
            """, (now, giveaway_id, user_id))
            
            self.conn.commit()
            log_info(f"User {user_id} claimed prize for giveaway {giveaway_id}")
            return True
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
            """, (giveaway_id, action, performed_by, json.dumps(details) if details else None, now))
            
            self.conn.commit()
            return True
        finally:
            cursor.close()
    
    def get_giveaway_logs(self, giveaway_id, limit=50):
        """Mendapatkan log giveaway"""
        cursor = self.get_cursor()
        try:
            cursor.execute("""
            SELECT * FROM giveaway_logs WHERE giveaway_id = ?
            ORDER BY created_at DESC LIMIT ?
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
        finally:
            cursor.close()

    # Di dalam kelas Database, tambahkan method untuk create tabel participants
    def create_participants_table(self):
        """Membuat tabel participants jika belum ada"""
        try:
            self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS participants (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                giveaway_id TEXT NOT NULL,
                user_id INTEGER NOT NULL,
                fullname TEXT NOT NULL,
                username TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (giveaway_id) REFERENCES giveaways(giveaway_id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
                UNIQUE(giveaway_id, user_id)
            )
            """)
            
            # Create index untuk performance
            self.cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_participants_giveaway ON participants(giveaway_id)
            """)
            
            self.cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_participants_user ON participants(user_id)
            """)
            
            self.conn.commit()
            log_info("✅ Participants table created/verified")
            
        except Exception as e:
            log_error(f"Error creating participants table: {e}")

    def close(self):
        """Menutup koneksi database"""
        if self.conn:
            self.conn.close()
            self.conn = None
            log_info("Database connection closed")

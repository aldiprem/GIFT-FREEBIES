# flask_api.py
import sqlite3
from datetime import datetime
import pytz
import random
import string
from flask import Flask, request, jsonify, g
from flask_cors import CORS
import logging
import socket

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==================== KONFIGURASI ====================
DB_PATH = 'giveaway.db'

# ==================== FUNGSI UTILITY ====================
def get_jakarta_time():
    """Mendapatkan waktu Jakarta dalam format string"""
    jakarta_tz = pytz.timezone('Asia/Jakarta')
    return datetime.now(jakarta_tz).strftime('%Y-%m-%d %H:%M:%S')

def generate_giveaway_id():
    """Generate giveaway ID 25 karakter random"""
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(25))

# ==================== DATABASE CLASS ====================
class GiveawayDatabase:
    def __init__(self):
        self.conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        logger.info("✅ Database connected")
    
    def get_cursor(self):
        """Mendapatkan cursor baru untuk setiap operasi"""
        return self.conn.cursor()
    
    def create_tables(self):
        """Membuat semua tabel yang diperlukan"""
        cur = self.get_cursor()
        
        # Tabel users
        cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            fullname TEXT,
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

        # Tabel giveaways
        cur.execute("""
        CREATE TABLE IF NOT EXISTS giveaways (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            giveaway_id TEXT UNIQUE NOT NULL,
            creator_user_id INTEGER NOT NULL,
            title TEXT,
            prize TEXT NOT NULL,
            prize_description TEXT,
            prize_value REAL DEFAULT 0,
            prize_currency TEXT DEFAULT 'IDR',
            total_winners INTEGER DEFAULT 1,
            total_tickets INTEGER DEFAULT 0,
            max_tickets_per_user INTEGER DEFAULT 1,
            direct_link TEXT,
            giveaway_text TEXT NOT NULL,
            giveaway_photo TEXT,
            button_text TEXT DEFAULT 'Ikut Giveaway',
            chat_id TEXT NOT NULL,
            message_id TEXT,
            channel_username TEXT,
            share_mode TEXT DEFAULT 'nonaktif',
            share_channels TEXT,
            require_join_channel INTEGER DEFAULT 0,
            require_join_channels TEXT,
            require_comment INTEGER DEFAULT 0,
            require_reaction INTEGER DEFAULT 0,
            duration_hours INTEGER,
            duration_minutes INTEGER,
            start_time TEXT,
            end_time TEXT,
            status TEXT DEFAULT 'active',
            is_sent INTEGER DEFAULT 0,
            participants_count INTEGER DEFAULT 0,
            created_at TEXT,
            updated_at TEXT,
            ended_at TEXT
        )
        """)

        # Tabel participants
        cur.execute("""
        CREATE TABLE IF NOT EXISTS participants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            giveaway_id TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            tickets INTEGER DEFAULT 1,
            fullname TEXT,
            username TEXT,
            joined_at TEXT,
            is_winner INTEGER DEFAULT 0,
            win_position INTEGER,
            has_claimed INTEGER DEFAULT 0,
            claimed_at TEXT,
            qualification_data TEXT,
            FOREIGN KEY (giveaway_id) REFERENCES giveaways(giveaway_id),
            FOREIGN KEY (user_id) REFERENCES users(user_id),
            UNIQUE(giveaway_id, user_id)
        )
        """)

        # Tabel winners
        cur.execute("""
        CREATE TABLE IF NOT EXISTS winners (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            giveaway_id TEXT NOT NULL,
            user_id INTEGER NOT NULL,
            win_position INTEGER,
            win_ticket_number TEXT,
            announced_at TEXT,
            claimed_at TEXT,
            claim_deadline TEXT,
            delivery_status TEXT DEFAULT 'pending',
            delivery_details TEXT,
            FOREIGN KEY (giveaway_id) REFERENCES giveaways(giveaway_id),
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
        """)

        # Tabel giveaway_logs
        cur.execute("""
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

        self.conn.commit()
        cur.close()
        logger.info("✅ All tables created/verified")

    def add_user(self, user_id, fullname, username=None, phone_number=None, 
                 language_code=None, is_bot=0, is_premium=0):
        """Menambah atau mengupdate user"""
        now = get_jakarta_time()
        cur = self.get_cursor()
        try:
            cur.execute("""
            INSERT OR REPLACE INTO users 
            (user_id, fullname, username, phone_number, language_code, is_bot, 
             is_premium, first_seen, last_seen, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (user_id, fullname, username, phone_number, language_code, 
                  is_bot, is_premium, now, now, now, now))
            self.conn.commit()
            logger.info(f"✅ User added/updated: {user_id}")
            return True
        except Exception as e:
            logger.error(f"Error adding user: {e}")
            return False
        finally:
            cur.close()

    def create_giveaway(self, creator_user_id, prize, giveaway_text, chat_id, **kwargs):
        """Membuat giveaway baru"""
        giveaway_id = generate_giveaway_id()
        now = get_jakarta_time()
        cur = self.get_cursor()
        
        # Hitung end_time jika duration diberikan
        end_time = None
        if 'duration_hours' in kwargs or 'duration_minutes' in kwargs:
            hours = kwargs.get('duration_hours', 0)
            minutes = kwargs.get('duration_minutes', 0)
            jakarta_tz = pytz.timezone('Asia/Jakarta')
            start = datetime.now(jakarta_tz)
            from datetime import timedelta
            end = start + timedelta(hours=hours, minutes=minutes)
            end_time = end.strftime('%Y-%m-%d %H:%M:%S')
        
        try:
            cur.execute("""
            INSERT INTO giveaways (
                giveaway_id, creator_user_id, title, prize, prize_description,
                prize_value, prize_currency, total_winners, max_tickets_per_user,
                direct_link, giveaway_text, giveaway_photo, button_text, chat_id,
                message_id, channel_username, share_mode, share_channels,
                require_join_channel, require_join_channels, require_comment,
                require_reaction, duration_hours, duration_minutes, start_time,
                end_time, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                giveaway_id, creator_user_id, kwargs.get('title'), prize, 
                kwargs.get('prize_description'), kwargs.get('prize_value', 0),
                kwargs.get('prize_currency', 'IDR'), kwargs.get('total_winners', 1),
                kwargs.get('max_tickets_per_user', 1), kwargs.get('direct_link'),
                giveaway_text, kwargs.get('giveaway_photo'), 
                kwargs.get('button_text', 'Ikut Giveaway'), chat_id,
                kwargs.get('message_id'), kwargs.get('channel_username'),
                kwargs.get('share_mode', 'nonaktif'), kwargs.get('share_channels'),
                kwargs.get('require_join_channel', 0), kwargs.get('require_join_channels'),
                kwargs.get('require_comment', 0), kwargs.get('require_reaction', 0),
                kwargs.get('duration_hours'), kwargs.get('duration_minutes'),
                now, end_time, now, now
            ))
            self.conn.commit()
            logger.info(f"✅ Giveaway created: {giveaway_id}")
            
            # Add log
            self.add_log(giveaway_id, 'CREATE', creator_user_id, 'Giveaway created')
            
            return giveaway_id
        except Exception as e:
            logger.error(f"Error creating giveaway: {e}")
            return None
        finally:
            cur.close()

    def add_participant(self, giveaway_id, user_id, fullname, username=None, tickets=1):
        """Menambah partisipan ke giveaway"""
        now = get_jakarta_time()
        cur = self.get_cursor()
        try:
            # Cek apakah user sudah pernah join
            cur.execute("""
            SELECT id FROM participants WHERE giveaway_id = ? AND user_id = ?
            """, (giveaway_id, user_id))
            
            if cur.fetchone():
                # Update tickets jika sudah pernah join
                cur.execute("""
                UPDATE participants 
                SET tickets = tickets + ?, joined_at = ?
                WHERE giveaway_id = ? AND user_id = ?
                """, (tickets, now, giveaway_id, user_id))
                logger.info(f"✅ Updated tickets for user {user_id} in {giveaway_id}")
            else:
                # Insert baru
                cur.execute("""
                INSERT INTO participants (giveaway_id, user_id, tickets, fullname, 
                                         username, joined_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """, (giveaway_id, user_id, tickets, fullname, username, now))
                
                # Update participants count di giveaways
                cur.execute("""
                UPDATE giveaways 
                SET participants_count = participants_count + 1,
                    total_tickets = total_tickets + ?
                WHERE giveaway_id = ?
                """, (tickets, giveaway_id))
                logger.info(f"✅ New participant {user_id} in {giveaway_id}")
            
            # Update user total participations
            cur.execute("""
            UPDATE users 
            SET total_participations = total_participations + 1,
                last_seen = ?
            WHERE user_id = ?
            """, (now, user_id))
            
            self.conn.commit()
            
            # Add log
            self.add_log(giveaway_id, 'PARTICIPATE', user_id, f'Joined with {tickets} tickets')
            
            return True
        except Exception as e:
            logger.error(f"Error adding participant: {e}")
            return False
        finally:
            cur.close()

    def add_log(self, giveaway_id, action, performed_by=None, details=None):
        """Menambah log aktivitas"""
        now = get_jakarta_time()
        cur = self.get_cursor()
        try:
            cur.execute("""
            INSERT INTO giveaway_logs (giveaway_id, action, performed_by, details, created_at)
            VALUES (?, ?, ?, ?, ?)
            """, (giveaway_id, action, performed_by, details, now))
            self.conn.commit()
            return True
        except Exception as e:
            logger.error(f"Error adding log: {e}")
            return False
        finally:
            cur.close()

    def close(self):
        """Menutup koneksi database"""
        self.conn.close()
        logger.info("✅ Database connection closed")

# ==================== INISIALISASI DATABASE ====================
db = GiveawayDatabase()
db.create_tables()

# ==================== FLASK API ====================
app = Flask(__name__)

# CORS configuration
CORS(app,
     origins=[
         "https://aldiprem.github.io",
         "http://localhost:5500",
         "http://127.0.0.1:5500",
         "http://localhost:3000",
         "http://localhost:5000"
     ],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Accept", "Authorization"],
     supports_credentials=True)

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'https://aldiprem.github.io')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Accept,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Helper function untuk execute query
def execute_query(query, params=(), one=False):
    """Helper untuk execute query dengan cursor baru"""
    cur = db.get_cursor()
    try:
        cur.execute(query, params)
        if one:
            result = cur.fetchone()
        else:
            result = cur.fetchall()
        return result
    finally:
        cur.close()

# Root endpoint
@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'name': 'GiftFreebies API',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': [
            '/api/health',
            '/api/user/<user_id>',
            '/api/user/<user_id>/stats',
            '/api/user/<user_id>/giveaways',
            '/api/giveaways',
            '/api/giveaways/<giveaway_id>',
            '/api/giveaways/search',
            '/api/giveaways/<giveaway_id>/join',
            '/api/giveaways/<giveaway_id>/participants/<user_id>'
        ]
    })

# Get user by ID
@app.route('/api/user/<int:user_id>', methods=['GET'])
def get_user(user_id):
    try:
        user = execute_query("""
        SELECT user_id, fullname, username, phone_number, language_code, 
               is_premium, first_seen, last_seen, total_participations, total_wins
        FROM users WHERE user_id = ?
        """, (user_id,), one=True)
        
        if user:
            # Generate avatar from first letter
            first_char = user[1][0] if user[1] and len(user[1]) > 0 else 'U'
            
            return jsonify({
                'user_id': user[0],
                'fullname': user[1],
                'username': user[2],
                'phone_number': user[3],
                'language_code': user[4],
                'is_premium': bool(user[5]),
                'first_seen': user[6],
                'last_seen': user[7],
                'total_participations': user[8],
                'total_wins': user[9],
                'avatar': f'https://ui-avatars.com/api/?name={first_char}&size=120&background=1e88e5&color=fff'
            })
        else:
            return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        logger.error(f"Error in get_user: {e}")
        return jsonify({'error': str(e)}), 500

# Get user stats
@app.route('/api/user/<int:user_id>/stats', methods=['GET'])
def get_user_stats(user_id):
    try:
        # Total giveaways created
        total_giveaways = execute_query(
            "SELECT COUNT(*) FROM giveaways WHERE creator_user_id = ?", 
            (user_id,), one=True
        )[0]
        
        # Total participations
        total_participations = execute_query(
            "SELECT COUNT(*) FROM participants WHERE user_id = ?", 
            (user_id,), one=True
        )[0]
        
        # Total wins
        total_wins = execute_query(
            "SELECT COUNT(*) FROM winners WHERE user_id = ?", 
            (user_id,), one=True
        )[0]
        
        # Total tickets
        result = execute_query(
            "SELECT SUM(tickets) FROM participants WHERE user_id = ?", 
            (user_id,), one=True
        )
        total_tickets = result[0] or 0
        
        # Active giveaways created
        active_giveaways = execute_query("""
        SELECT COUNT(*) FROM giveaways 
        WHERE creator_user_id = ? AND status = 'active'
        """, (user_id,), one=True)[0]
        
        return jsonify({
            'total_giveaways': total_giveaways,
            'active_giveaways': active_giveaways,
            'total_participations': total_participations,
            'total_wins': total_wins,
            'total_tickets': total_tickets
        })
    except Exception as e:
        logger.error(f"Error in get_user_stats: {e}")
        return jsonify({'error': str(e)}), 500

# Get user's giveaways
@app.route('/api/user/<int:user_id>/giveaways', methods=['GET'])
def get_user_giveaways(user_id):
    try:
        giveaways = execute_query("""
        SELECT giveaway_id, prize, prize_description, giveaway_text, 
               participants_count, total_tickets, status, created_at, end_time
        FROM giveaways 
        WHERE creator_user_id = ?
        ORDER BY created_at DESC
        """, (user_id,))
        
        result = []
        for g in giveaways:
            result.append({
                'giveaway_id': g[0],
                'prize': g[1],
                'prize_description': g[2],
                'giveaway_text': g[3][:100] + '...' if len(g[3]) > 100 else g[3],
                'participants_count': g[4] or 0,
                'total_tickets': g[5] or 0,
                'status': g[6],
                'created_at': g[7],
                'end_time': g[8]
            })
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in get_user_giveaways: {e}")
        return jsonify({'error': str(e)}), 500

# Create new giveaway
@app.route('/api/giveaways', methods=['POST'])
def create_giveaway():
    try:
        data = request.json
        logger.info(f"Creating giveaway with data: {data}")
        
        # Required fields
        required_fields = ['creator_user_id', 'prize', 'giveaway_text', 'chat_id']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Field {field} is required'}), 400
        
        # Create giveaway in database
        giveaway_id = db.create_giveaway(
            creator_user_id=data['creator_user_id'],
            prize=data['prize'],
            giveaway_text=data['giveaway_text'],
            chat_id=data['chat_id'],
            title=data.get('title'),
            prize_description=data.get('prize_description'),
            prize_value=data.get('prize_value', 0),
            total_winners=data.get('total_winners', 1),
            max_tickets_per_user=data.get('max_tickets_per_user', 1),
            button_text=data.get('button_text', 'Ikut Giveaway'),
            share_mode=data.get('share_mode', 'nonaktif'),
            duration_hours=data.get('duration_hours', 24),
            duration_minutes=data.get('duration_minutes', 0),
            require_join_channel=data.get('require_join_channel', 0),
            require_join_channels=data.get('require_join_channels'),
            require_comment=data.get('require_comment', 0),
            require_reaction=data.get('require_reaction', 0)
        )
        
        if giveaway_id:
            # Add user if not exists
            db.add_user(
                user_id=data['creator_user_id'],
                fullname=data.get('fullname', 'Unknown'),
                username=data.get('username')
            )
            
            # Generate direct link
            direct_link = f"https://aldiprem.github.io/giveaway/?giveaway_id={giveaway_id}"
            
            return jsonify({
                'success': True,
                'giveaway_id': giveaway_id,
                'direct_link': direct_link,
                'message': 'Giveaway created successfully'
            }), 201
        else:
            return jsonify({'error': 'Failed to create giveaway'}), 500
            
    except Exception as e:
        logger.error(f"Error in create_giveaway: {e}")
        return jsonify({'error': str(e)}), 500

# Get giveaway by ID
@app.route('/api/giveaways/<giveaway_id>', methods=['GET'])
def get_giveaway(giveaway_id):
    try:
        cur = db.get_cursor()
        cur.execute("SELECT * FROM giveaways WHERE giveaway_id = ?", (giveaway_id,))
        giveaway = cur.fetchone()
        
        if not giveaway:
            cur.close()
            return jsonify({'error': 'Giveaway not found'}), 404
        
        # Get column names
        columns = [description[0] for description in cur.description]
        result = dict(zip(columns, giveaway))
        cur.close()
        
        # Get participants count (pakai cursor baru)
        cur2 = db.get_cursor()
        cur2.execute("""
        SELECT COUNT(DISTINCT user_id), COALESCE(SUM(tickets), 0)
        FROM participants WHERE giveaway_id = ?
        """, (giveaway_id,))
        participants, total_tickets = cur2.fetchone()
        cur2.close()
        
        result['participants_count'] = participants or 0
        result['total_tickets'] = total_tickets or 0
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in get_giveaway: {e}")
        return jsonify({'error': str(e)}), 500

# Get all active giveaways
@app.route('/api/giveaways', methods=['GET'])
def get_all_giveaways():
    try:
        now = get_jakarta_time()
        giveaways = execute_query("""
        SELECT giveaway_id, prize, giveaway_text, participants_count, 
               total_tickets, status, end_time
        FROM giveaways 
        WHERE status = 'active' AND (end_time IS NULL OR end_time > ?)
        ORDER BY created_at DESC
        LIMIT 50
        """, (now,))
        
        result = []
        for g in giveaways:
            result.append({
                'giveaway_id': g[0],
                'prize': g[1],
                'giveaway_text': g[2][:100] + '...' if g[2] and len(g[2]) > 100 else g[2],
                'participants_count': g[3] or 0,
                'total_tickets': g[4] or 0,
                'status': g[5],
                'end_time': g[6]
            })
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in get_all_giveaways: {e}")
        return jsonify({'error': str(e)}), 500

# Search giveaways
@app.route('/api/giveaways/search', methods=['GET'])
def search_giveaways():
    try:
        query = request.args.get('q', '')
        if len(query) < 2:
            return jsonify([])
        
        search_term = f'%{query}%'
        giveaways = execute_query("""
        SELECT giveaway_id, prize, giveaway_text, participants_count, 
               status, end_time
        FROM giveaways 
        WHERE prize LIKE ? OR giveaway_text LIKE ?
        ORDER BY created_at DESC
        LIMIT 20
        """, (search_term, search_term))
        
        result = []
        for g in giveaways:
            result.append({
                'giveaway_id': g[0],
                'prize': g[1],
                'giveaway_text': g[2][:100] + '...' if g[2] and len(g[2]) > 100 else g[2],
                'participants_count': g[3] or 0,
                'status': g[4],
                'end_time': g[5]
            })
        
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error in search_giveaways: {e}")
        return jsonify({'error': str(e)}), 500

# Join giveaway
@app.route('/api/giveaways/<giveaway_id>/join', methods=['POST'])
def join_giveaway(giveaway_id):
    try:
        data = request.json
        user_id = data.get('user_id')
        fullname = data.get('fullname', 'Unknown')
        username = data.get('username')
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        # Check if giveaway exists and is active (pakai cursor terpisah)
        cur = db.get_cursor()
        cur.execute("""
        SELECT status, end_time, max_tickets_per_user, prize 
        FROM giveaways WHERE giveaway_id = ?
        """, (giveaway_id,))
        giveaway = cur.fetchone()
        cur.close()
        
        if not giveaway:
            return jsonify({'error': 'Giveaway not found'}), 404
        
        status, end_time, max_tickets, prize = giveaway
        
        if status != 'active':
            return jsonify({'error': 'Giveaway is not active'}), 400
        
        if end_time and end_time < get_jakarta_time():
            return jsonify({'error': 'Giveaway has ended'}), 400
        
        # Check if user already joined (pakai cursor baru)
        cur2 = db.get_cursor()
        cur2.execute("""
        SELECT tickets FROM participants 
        WHERE giveaway_id = ? AND user_id = ?
        """, (giveaway_id, user_id))
        existing = cur2.fetchone()
        cur2.close()
        
        if existing and existing[0] >= max_tickets:
            return jsonify({
                'error': f'Maximum tickets reached (max: {max_tickets})',
                'current_tickets': existing[0],
                'max_tickets': max_tickets
            }), 400
        
        # Add participant
        success = db.add_participant(giveaway_id, user_id, fullname, username, 1)
        
        if success:
            # Add user if not exists
            db.add_user(user_id, fullname, username)
            
            # Get updated ticket count (pakai cursor baru)
            cur3 = db.get_cursor()
            cur3.execute("""
            SELECT tickets FROM participants 
            WHERE giveaway_id = ? AND user_id = ?
            """, (giveaway_id, user_id))
            new_tickets = cur3.fetchone()[0]
            cur3.close()
            
            return jsonify({
                'success': True,
                'tickets': new_tickets,
                'message': f'Berhasil join giveaway {prize}!',
                'giveaway_id': giveaway_id,
                'prize': prize
            })
        else:
            return jsonify({'error': 'Failed to join giveaway'}), 500
            
    except Exception as e:
        logger.error(f"Error in join_giveaway: {e}")
        return jsonify({'error': str(e)}), 500

# Check if user participated
@app.route('/api/giveaways/<giveaway_id>/participants/<int:user_id>', methods=['GET'])
def check_participation(giveaway_id, user_id):
    try:
        result = execute_query("""
        SELECT tickets, joined_at FROM participants 
        WHERE giveaway_id = ? AND user_id = ?
        """, (giveaway_id, user_id), one=True)
        
        if result:
            return jsonify({
                'participated': True,
                'tickets': result[0],
                'joined_at': result[1]
            })
        else:
            return jsonify({
                'participated': False
            })
    except Exception as e:
        logger.error(f"Error in check_participation: {e}")
        return jsonify({'error': str(e)}), 500

# Health check
@app.route('/api/health', methods=['GET'])
def health_check():
    # Get client IP
    cf_ip = request.headers.get('CF-Connecting-IP', 
               request.headers.get('X-Forwarded-For', 
               request.remote_addr))
    
    # Get database stats
    db_stats = {}
    try:
        users = execute_query("SELECT COUNT(*) FROM users", one=True)
        db_stats['users'] = users[0] if users else 0
        
        giveaways = execute_query("SELECT COUNT(*) FROM giveaways", one=True)
        db_stats['giveaways'] = giveaways[0] if giveaways else 0
        
        participants = execute_query("SELECT COUNT(*) FROM participants", one=True)
        db_stats['participants'] = participants[0] if participants else 0
    except Exception as e:
        logger.error(f"Error getting db stats: {e}")
        db_stats = {'error': 'Could not fetch stats'}
    
    return jsonify({
        'status': 'ok',
        'timestamp': get_jakarta_time(),
        'server': 'giftfreebies-api',
        'version': '1.0.0',
        'database': 'connected',
        'database_stats': db_stats,
        'client_ip': cf_ip,
        'via_cloudflare': request.headers.get('CF-Ray') is not None
    })

# ==================== MAIN ====================
if __name__ == "__main__":
    print("""
    ╔══════════════════════════════════════════╗
    ║        🎁 GIFT FREEBIES FLASK API        ║
    ╠══════════════════════════════════════════╣
    ║  📦 Version: 1.0.0                       ║
    ║  🐍 Python: 3.13                         ║
    ║  🌐 Flask API: Port 5001                  ║
    ╚══════════════════════════════════════════╝
    """)
    
    # Cek port
    port = 5001
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('127.0.0.1', port))
    if result == 0:
        print(f"❌ Port {port} already in use! Trying port 5002...")
        port = 5002
    sock.close()
    
    print(f"✅ Flask API starting on port {port}")
    print(f"🌐 Health check: http://127.0.0.1:{port}/api/health")
    print(f"📝 Press CTRL+C to stop")
    
    app.run(host="0.0.0.0", port=port, debug=True, threaded=True)

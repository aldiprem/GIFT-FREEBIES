# app.py
from flask import Flask, Blueprint, request, jsonify
from flask_cors import CORS
import socket
import json
import os
import time
import threading
from config import Config
from database import Database
from utils import log_info, log_error, get_jakarta_time
import time
from datetime import datetime, timedelta
import pytz
import random
import string

app = Flask(__name__)

# Register blueprints
users_bp = Blueprint('users', __name__, url_prefix='/api/users')
giveaways_bp = Blueprint('giveaways', __name__, url_prefix='/api/giveaways')
chatid_bp = Blueprint('chatid', __name__, url_prefix='/api/chatid')

CORS(app, origins=Config.ALLOWED_ORIGINS, supports_credentials=True)

# ==================== DATABASE MANAGER ====================
class DatabaseManager:
    """Manager untuk mengelola koneksi database dengan auto-reconnect"""
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
            return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        self._initialized = True
        
        self.db = None
        self.last_modified = None
        self.last_check = 0
        self.check_interval = 2  # Cek setiap 2 detik
        self.db_path = Config.DB_PATH
        self._connect()
    
    def _connect(self):
        """Membuat koneksi database baru"""
        try:
            if self.db:
                try:
                    self.db.close()
                except:
                    pass
            self.db = Database()
            if os.path.exists(self.db_path):
                self.last_modified = os.path.getmtime(self.db_path)
            log_info("✅ Database connected")
        except Exception as e:
            log_error(f"❌ Database connection error: {e}")
            self.db = None
    
    def get_db(self):
        """Mendapatkan instance database dengan auto-reconnect jika file berubah"""
        now = time.time()
        
        # Cek apakah perlu memeriksa file
        if now - self.last_check < self.check_interval:
            return self.db
        
        self.last_check = now
        
        # Jika database belum terkoneksi
        if self.db is None:
            self._connect()
            return self.db
        
        # Cek apakah file database ada
        if not os.path.exists(self.db_path):
            log_warning("⚠️ Database file not found, reconnecting...")
            self._connect()
            return self.db
        
        # Cek apakah file database berubah
        try:
            current_mtime = os.path.getmtime(self.db_path)
            
            if self.last_modified is None:
                self.last_modified = current_mtime
            elif current_mtime != self.last_modified:
                log_info("🔄 Database file changed, reconnecting...")
                self._connect()
                self.last_modified = current_mtime
        except Exception as e:
            log_error(f"Error checking database file: {e}")
        
        return self.db
    
    def force_reconnect(self):
        """Memaksa reconnect database"""
        log_info("🔄 Forcing database reconnect...")
        self._connect()
        return self.db

# Inisialisasi database manager (singleton)
db_manager = DatabaseManager()

# Fungsi helper untuk mendapatkan database
def get_db():
    """Mendapatkan instance database dari manager"""
    return db_manager.get_db()

# ==================== UTILITY FUNCTIONS ====================
def generate_avatar_url(name):
    """Generate avatar URL dari ui-avatars.com"""
    first_char = name[0] if name and len(name) > 0 else 'U'
    return f"https://ui-avatars.com/api/?name={first_char}&size=120&background=1e88e5&color=fff"

def get_client_ip():
    """Mendapatkan IP client (support Cloudflare)"""
    cf_ip = request.headers.get('CF-Connecting-IP')
    if cf_ip:
        return cf_ip
    
    forwarded = request.headers.get('X-Forwarded-For')
    if forwarded:
        return forwarded.split(',')[0].strip()
    
    return request.remote_addr

def generate_giveaway_id():
    """Generate giveaway ID 25 karakter random"""
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(25))

def calculate_end_time(duration_value, duration_unit):
    jakarta_tz = pytz.timezone('Asia/Jakarta')
    now = datetime.now(jakarta_tz)
    
    if duration_unit == 'minutes':
        end_time = now + timedelta(minutes=duration_value)
    elif duration_unit == 'hours':
        end_time = now + timedelta(hours=duration_value)
    elif duration_unit == 'days':
        end_time = now + timedelta(days=duration_value)
    elif duration_unit == 'weeks':
        end_time = now + timedelta(weeks=duration_value)
    elif duration_unit == 'months':
        end_time = now + timedelta(days=duration_value * 30)
    else:
        end_time = now + timedelta(hours=24)
    
    return end_time.strftime('%Y-%m-%d %H:%M:%S')

def update_expired_giveaways():
    """Background task untuk mengupdate giveaway yang sudah expired dan memilih pemenang"""
    while True:
        try:
            # Cek setiap 60 detik
            time.sleep(60)
            
            # Dapatkan koneksi database
            current_db = get_db()
            if not current_db:
                continue
                
            jakarta_tz = pytz.timezone('Asia/Jakarta')
            now = datetime.now(jakarta_tz).strftime('%Y-%m-%d %H:%M:%S')
            
            log_info(f"⏰ Checking for expired giveaways at {now}")
            
            cursor = current_db.get_cursor()
            
            # Cari giveaway dengan status 'active' yang sudah melewati end_date
            cursor.execute("""
                SELECT giveaway_id FROM giveaways 
                WHERE status = 'active' 
                AND end_date IS NOT NULL 
                AND end_date < ?
            """, (now,))
            
            expired_giveaways = cursor.fetchall()
            
            if expired_giveaways:
                log_info(f"📦 Found {len(expired_giveaways)} expired giveaways")
                
                for giveaway in expired_giveaways:
                    giveaway_id = giveaway['giveaway_id']
                    
                    # Update status menjadi 'ended'
                    cursor.execute("""
                        UPDATE giveaways 
                        SET status = 'ended', updated_at = ? 
                        WHERE giveaway_id = ?
                    """, (now, giveaway_id))
                    
                    log_info(f"✅ Updated giveaway {giveaway_id} to ended")
                    
                    # Pilih pemenang secara otomatis
                    try:
                        # Panggil fungsi draw_winners
                        from flask import current_app
                        with current_app.app_context():
                            # Ambil data giveaway
                            g_data = current_db.get_giveaway(giveaway_id)
                            if g_data and g_data.get('participants_count', 0) > 0:
                                # Pilih pemenang
                                draw_result = draw_winners(giveaway_id)
                                log_info(f"🏆 Winners drawn for {giveaway_id}")
                    except Exception as e:
                        log_error(f"Error drawing winners for {giveaway_id}: {e}")
                
                current_db.conn.commit()
            
            cursor.close()
            
        except Exception as e:
            log_error(f"❌ Error in update_expired_giveaways: {e}")

def start_background_tasks():
    """Memulai semua background tasks"""
    thread = threading.Thread(target=update_expired_giveaways, daemon=True)
    thread.start()
    log_info("✅ Background task started: update_expired_giveaways")

@giveaways_bp.route('/update-expired', methods=['POST'])
def manually_update_expired():
    """Endpoint untuk manual update giveaway yang expired"""
    try:
        current_db = get_db()
        
        jakarta_tz = pytz.timezone('Asia/Jakarta')
        now = datetime.now(jakarta_tz).strftime('%Y-%m-%d %H:%M:%S')
        
        cursor = current_db.get_cursor()
        
        # Cari giveaway dengan status 'active' yang sudah melewati end_date
        cursor.execute("""
            SELECT giveaway_id, end_date FROM giveaways 
            WHERE status = 'active' 
            AND end_date IS NOT NULL 
            AND end_date < ?
        """, (now,))
        
        expired_giveaways = cursor.fetchall()
        
        updated_count = 0
        for giveaway in expired_giveaways:
            giveaway_id = giveaway['giveaway_id']
            cursor.execute("""
                UPDATE giveaways 
                SET status = 'ended', updated_at = ? 
                WHERE giveaway_id = ?
            """, (now, giveaway_id))
            updated_count += 1
        
        if updated_count > 0:
            current_db.conn.commit()
        
        cursor.close()
        
        return jsonify({
            'success': True,
            'message': f'Updated {updated_count} expired giveaways',
            'updated_count': updated_count,
            'timestamp': now
        })
        
    except Exception as e:
        log_error(f"Error updating expired giveaways: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@giveaways_bp.route('/check-expired', methods=['GET'])
def check_expired_giveaways():
    """Endpoint untuk mengecek giveaway yang sudah expired (tanpa update)"""
    try:
        current_db = get_db()
        
        jakarta_tz = pytz.timezone('Asia/Jakarta')
        now = datetime.now(jakarta_tz).strftime('%Y-%m-%d %H:%M:%S')
        
        cursor = current_db.get_cursor()
        
        # Cari giveaway dengan status 'active' yang sudah melewati end_date
        cursor.execute("""
            SELECT giveaway_id, end_date, prizes, creator_username 
            FROM giveaways 
            WHERE status = 'active' 
            AND end_date IS NOT NULL 
            AND end_date < ?
            ORDER BY end_date DESC
        """, (now,))
        
        expired_giveaways = cursor.fetchall()
        cursor.close()
        
        result = []
        for g in expired_giveaways:
            result.append({
                'giveaway_id': g['giveaway_id'],
                'end_date': g['end_date'],
                'prizes': g['prizes'],
                'creator_username': g['creator_username']
            })
        
        return jsonify({
            'success': True,
            'count': len(result),
            'expired_giveaways': result,
            'current_time': now
        })
        
    except Exception as e:
        log_error(f"Error checking expired giveaways: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
        
@giveaways_bp.route('/<giveaway_id>/check-status', methods=['POST'])
def check_and_update_giveaway_status(giveaway_id):
    """Cek dan update status single giveaway jika expired"""
    try:
        current_db = get_db()
        
        # Ambil data giveaway
        giveaway = current_db.get_giveaway(giveaway_id)
        
        if not giveaway:
            return jsonify({
                'success': False,
                'error': 'Giveaway not found'
            }), 404
        
        # Jika sudah ended, tidak perlu update
        if giveaway['status'] == 'ended':
            return jsonify({
                'success': True,
                'message': 'Giveaway already ended',
                'status': 'ended'
            })
        
        # Jika tidak ada end_date
        if not giveaway['end_date']:
            return jsonify({
                'success': True,
                'message': 'Giveaway has no end date',
                'status': giveaway['status']
            })
        
        # Cek apakah sudah expired
        jakarta_tz = pytz.timezone('Asia/Jakarta')
        now = datetime.now(jakarta_tz)
        end_date = datetime.strptime(giveaway['end_date'], '%Y-%m-%d %H:%M:%S')
        end_date = jakarta_tz.localize(end_date) if end_date.tzinfo is None else end_date
        
        if now > end_date:
            # Update status
            cursor = current_db.get_cursor()
            cursor.execute("""
                UPDATE giveaways 
                SET status = 'ended', updated_at = ? 
                WHERE giveaway_id = ?
            """, (now.strftime('%Y-%m-%d %H:%M:%S'), giveaway_id))
            current_db.conn.commit()
            cursor.close()
            
            return jsonify({
                'success': True,
                'message': 'Giveaway expired and updated to ended',
                'status': 'ended',
                'end_date': giveaway['end_date']
            })
        else:
            return jsonify({
                'success': True,
                'message': 'Giveaway still active',
                'status': 'active',
                'end_date': giveaway['end_date']
            })
        
    except Exception as e:
        log_error(f"Error checking giveaway status: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== ROOT ENDPOINT ====================
@app.route('/', methods=['GET'])
def index():
    """Root endpoint - API info"""
    return jsonify({
        'name': 'GiftFreebies API',
        'version': '1.0.0',
        'description': 'API untuk menyimpan data users dan giveaways',
        'status': 'running',
        'endpoints': {
            'users': {
                'GET /api/users': 'Get all users',
                'GET /api/users/count': 'Get total users count',
                'GET /api/users/active': 'Get active users count',
                'GET /api/users/<user_id>': 'Get user by ID',
                'GET /api/users/username/<username>': 'Get user by username',
                'POST /api/users': 'Create/update user',
                'PUT /api/users/<user_id>/stats': 'Update user stats',
                'GET /api/users/search?q=<query>': 'Search users',
                'GET /api/users/top': 'Get top users'
            },
            'giveaways': {
                'POST /api/giveaways': 'Create new giveaway',
                'GET /api/giveaways': 'Get all giveaways',
                'GET /api/giveaways/<giveaway_id>': 'Get giveaway by ID',
                'GET /api/giveaways/user/<user_id>': 'Get giveaways by user',
                'PUT /api/giveaways/<giveaway_id>': 'Update giveaway',
                'DELETE /api/giveaways/<giveaway_id>': 'Delete giveaway',
                'GET /api/giveaways/search?q=<query>': 'Search giveaways',
                'GET /api/giveaways/stats': 'Get giveaway statistics'
            },
            'chat': {
                'POST /api/chatid': 'Save chat data',
                'GET /api/chatid/username/<username>': 'Get chat by username',
                'POST /api/chatid/sync/<username>': 'Trigger chat sync',
                'GET /api/chatid/status/<username>': 'Check sync status',
                'GET /api/chatid/search?q=<query>': 'Search chats',
                'GET /api/chatid/check-role/<username>/<int:user_id>': 'Check if user is admin/owner'
            },
            'health': {
                'GET /api/health': 'Health check'
            }
        },
        'timestamp': get_jakarta_time()
    })

# ==================== HEALTH CHECK ====================
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        current_db = get_db()
        user_count = current_db.get_user_count()
        giveaway_count = current_db.get_giveaway_count()
        
        return jsonify({
            'status': 'healthy',
            'timestamp': get_jakarta_time(),
            'server': 'giftfreebies-api',
            'version': '1.0.0',
            'database': {
                'connected': True,
                'users_count': user_count,
                'giveaways_count': giveaway_count
            },
            'client': {
                'ip': get_client_ip(),
                'via_cloudflare': request.headers.get('CF-Ray') is not None
            }
        })
        
    except Exception as e:
        log_error(f"Health check failed: {e}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': get_jakarta_time()
        }), 500

# ==================== USERS ENDPOINTS ====================
@users_bp.route('', methods=['GET'])
def get_all_users():
    """Get all users with pagination"""
    try:
        current_db = get_db()
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        users = current_db.get_all_users(limit=limit, offset=offset)
        
        for user in users:
            user['avatar'] = generate_avatar_url(user['fullname'])
        
        return jsonify({
            'success': True,
            'count': len(users),
            'limit': limit,
            'offset': offset,
            'users': users
        })
        
    except Exception as e:
        log_error(f"Error in get_all_users: {e}")
        return jsonify({'error': str(e)}), 500

@users_bp.route('', methods=['POST'])
def create_user():
    """Create new user or update existing"""
    try:
        current_db = get_db()
        data = request.json
        log_info(f"Received user data: {data}")
        
        required_fields = ['user_id', 'fullname']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Field {field} is required'
                }), 400
        
        success = current_db.add_user(
            user_id=data['user_id'],
            fullname=data['fullname'],
            username=data.get('username'),
            phone_number=data.get('phone_number'),
            language_code=data.get('language_code', 'id'),
            is_bot=data.get('is_bot', 0),
            is_premium=data.get('is_premium', 0)
        )
        
        if success:
            user = current_db.get_user(data['user_id'])
            if user:
                user['avatar'] = generate_avatar_url(user['fullname'])
            
            return jsonify({
                'success': True,
                'message': 'User created/updated successfully',
                'user': user
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to save user'
            }), 500
            
    except Exception as e:
        log_error(f"Error in create_user: {e}")
        return jsonify({'error': str(e)}), 500

@users_bp.route('/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get user by ID"""
    try:
        current_db = get_db()
        user = current_db.get_user(user_id)
        
        if user:
            user['avatar'] = generate_avatar_url(user['fullname'])
            return jsonify({
                'success': True,
                'user': user
            })
        else:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
            
    except Exception as e:
        log_error(f"Error in get_user: {e}")
        return jsonify({'error': str(e)}), 500

@users_bp.route('/username/<username>', methods=['GET'])
def get_user_by_username(username):
    """Get user by username"""
    try:
        current_db = get_db()
        user = current_db.get_user_by_username(username)
        
        if user:
            user['avatar'] = generate_avatar_url(user['fullname'])
            return jsonify({
                'success': True,
                'user': user
            })
        else:
            return jsonify({
                'success': False,
                'error': 'User not found'
            }), 404
            
    except Exception as e:
        log_error(f"Error in get_user_by_username: {e}")
        return jsonify({'error': str(e)}), 500

@users_bp.route('/<int:user_id>/stats', methods=['PUT'])
def update_user_stats(user_id):
    """Update user statistics"""
    try:
        current_db = get_db()
        data = request.json
        participated = data.get('participated', False)
        won = data.get('won', False)
        
        success = current_db.update_user_stats(user_id, participated, won)
        
        if success:
            user = current_db.get_user(user_id)
            return jsonify({
                'success': True,
                'message': 'User stats updated',
                'user': user
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update stats'
            }), 500
            
    except Exception as e:
        log_error(f"Error in update_user_stats: {e}")
        return jsonify({'error': str(e)}), 500

@users_bp.route('/search', methods=['GET'])
def search_users():
    """Search users by name or username"""
    try:
        current_db = get_db()
        query = request.args.get('q', '')
        if len(query) < 2:
            return jsonify({
                'success': False,
                'error': 'Search query must be at least 2 characters'
            }), 400
        
        users = current_db.search_users(query)
        
        for user in users:
            user['avatar'] = generate_avatar_url(user['fullname'])
        
        return jsonify({
            'success': True,
            'count': len(users),
            'query': query,
            'users': users
        })
        
    except Exception as e:
        log_error(f"Error in search_users: {e}")
        return jsonify({'error': str(e)}), 500

@users_bp.route('/count', methods=['GET'])
def get_user_count():
    """Get total number of users"""
    try:
        current_db = get_db()
        count = current_db.get_user_count()
        
        return jsonify({
            'success': True,
            'count': count,
            'timestamp': get_jakarta_time()
        })
        
    except Exception as e:
        log_error(f"Error in get_user_count: {e}")
        return jsonify({'error': str(e)}), 500

@users_bp.route('/active', methods=['GET'])
def get_active_users():
    """Get number of active users in last X days"""
    try:
        current_db = get_db()
        days = request.args.get('days', 7, type=int)
        count = current_db.get_active_users(days)
        
        return jsonify({
            'success': True,
            'days': days,
            'count': count,
            'timestamp': get_jakarta_time()
        })
        
    except Exception as e:
        log_error(f"Error in get_active_users: {e}")
        return jsonify({'error': str(e)}), 500

@users_bp.route('/top', methods=['GET'])
def get_top_users():
    """Get top users by total participations"""
    try:
        current_db = get_db()
        limit = request.args.get('limit', 10, type=int)
        
        cursor = current_db.get_cursor()
        cursor.execute("""
        SELECT user_id, fullname, username, total_participations, total_wins
        FROM users
        ORDER BY total_participations DESC
        LIMIT ?
        """, (limit,))
        
        users = cursor.fetchall()
        cursor.close()
        
        result = []
        for user in users:
            result.append({
                'user_id': user[0],
                'fullname': user[1],
                'username': user[2],
                'total_participations': user[3] or 0,
                'total_wins': user[4] or 0,
                'avatar': generate_avatar_url(user[1])
            })
        
        return jsonify({
            'success': True,
            'limit': limit,
            'users': result
        })
        
    except Exception as e:
        log_error(f"Error in get_top_users: {e}")
        return jsonify({'error': str(e)}), 500

@giveaways_bp.route('', methods=['POST'])
def create_giveaway():
    """Create new giveaway"""
    try:
        current_db = get_db()
        data = request.json
        log_info(f"Received giveaway data: {data}")
        
        required_fields = ['creator_user_id', 'prizes', 'giveaway_text']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Field {field} is required'
                }), 400
        
        # Generate giveaway ID
        giveaway_id = generate_giveaway_id()
        
        # Hitung end_date dari duration jika ada
        end_date = None
        if data.get('duration_days') is not None or data.get('duration_hours') is not None or \
           data.get('duration_minutes') is not None or data.get('duration_seconds') is not None:
            
            total_seconds = (
                data.get('duration_days', 0) * 86400 +
                data.get('duration_hours', 0) * 3600 +
                data.get('duration_minutes', 0) * 60 +
                data.get('duration_seconds', 0)
            )
            
            if total_seconds > 0:
                from datetime import datetime, timedelta
                jakarta_tz = pytz.timezone('Asia/Jakarta')
                end_date = (datetime.now(jakarta_tz) + timedelta(seconds=total_seconds)).strftime('%Y-%m-%d %H:%M:%S')
        
        # Simpan user jika belum ada
        current_db.add_user(
            user_id=data['creator_user_id'],
            fullname=data.get('creator_fullname', 'Unknown'),
            username=data.get('creator_username')
        )
        
        # Siapkan data untuk disimpan ke database
        giveaway_data = {
            'giveaway_id': giveaway_id,
            'creator_user_id': data['creator_user_id'],
            'creator_fullname': data.get('creator_fullname'),
            'creator_username': data.get('creator_username'),
            'prizes': data['prizes'],
            'channels': data.get('channels', []),
            'links': data.get('links', []),
            'requirements': data.get('requirements', []),
            'giveaway_text': data['giveaway_text'],
            'duration_days': data.get('duration_days', 0),
            'duration_hours': data.get('duration_hours', 0),
            'duration_minutes': data.get('duration_minutes', 0),
            'duration_seconds': data.get('duration_seconds', 0),
            'captcha_enabled': data.get('captcha_enabled', 1),
            'end_date': end_date,
            'status': 'active'
        }
        
        # Panggil method create_giveaway dengan satu parameter dictionary
        success = current_db.create_giveaway(giveaway_data)
        
        if success:
            # Gunakan format URL yang sesuai dengan main.js (parameter search)
            direct_link = f"https://aldiprem.github.io/GIFT-FREEBIES/?search={giveaway_id}"
            
            return jsonify({
                'success': True,
                'message': 'Giveaway created successfully',
                'giveaway_id': giveaway_id,
                'direct_link': direct_link,
                'end_time': end_date
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to create giveaway'
            }), 500
            
    except Exception as e:
        log_error(f"Error in create_giveaway: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@giveaways_bp.route('', methods=['GET'])
def get_all_giveaways():
    """Get all giveaways with optional filters"""
    try:
        current_db = get_db()
        status = request.args.get('status', 'active')
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        giveaways = current_db.get_all_giveaways(status=status, limit=limit, offset=offset)
        
        return jsonify({
            'success': True,
            'count': len(giveaways),
            'status': status,
            'limit': limit,
            'offset': offset,
            'giveaways': giveaways
        })
        
    except Exception as e:
        log_error(f"Error in get_all_giveaways: {e}")
        return jsonify({'error': str(e)}), 500

@giveaways_bp.route('/<giveaway_id>', methods=['GET'])
def get_giveaway(giveaway_id):
    """Get giveaway by ID"""
    try:
        current_db = get_db()
        log_info(f"🔍 Fetching giveaway: {giveaway_id}")
        giveaway = current_db.get_giveaway(giveaway_id)
        
        if giveaway:
            creator = current_db.get_user(giveaway['creator_user_id'])
            if creator:
                giveaway['creator'] = {
                    'fullname': creator['fullname'],
                    'username': creator['username'],
                    'avatar': generate_avatar_url(creator['fullname'])
                }
            
            # Pastikan participants_count ada
            if 'participants_count' not in giveaway:
                giveaway['participants_count'] = 0
            
            log_info(f"✅ Giveaway found: {giveaway_id}, participants: {giveaway['participants_count']}")
            
            return jsonify({
                'success': True,
                'giveaway': giveaway
            })
        else:
            log_info(f"❌ Giveaway not found: {giveaway_id}")
            return jsonify({
                'success': False,
                'error': 'Giveaway not found'
            }), 404
            
    except Exception as e:
        log_error(f"Error in get_giveaway: {e}")
        return jsonify({'error': str(e)}), 500

@giveaways_bp.route('/user/<int:user_id>', methods=['GET'])
def get_user_giveaways(user_id):
    """Get all giveaways created by a specific user"""
    try:
        current_db = get_db()
        status = request.args.get('status', 'all')
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        giveaways = current_db.get_user_giveaways(user_id, status=status, limit=limit, offset=offset)
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'count': len(giveaways),
            'status': status,
            'giveaways': giveaways
        })
        
    except Exception as e:
        log_error(f"Error in get_user_giveaways: {e}")
        return jsonify({'error': str(e)}), 500

@giveaways_bp.route('/<giveaway_id>', methods=['PUT'])
def update_giveaway(giveaway_id):
    """Update giveaway details"""
    try:
        current_db = get_db()
        data = request.json
        
        existing = current_db.get_giveaway(giveaway_id)
        if not existing:
            return jsonify({
                'success': False,
                'error': 'Giveaway not found'
            }), 404
        
        success = current_db.update_giveaway(giveaway_id, data)
        
        if success:
            updated = current_db.get_giveaway(giveaway_id)
            return jsonify({
                'success': True,
                'message': 'Giveaway updated successfully',
                'giveaway': updated
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update giveaway'
            }), 500
            
    except Exception as e:
        log_error(f"Error in update_giveaway: {e}")
        return jsonify({'error': str(e)}), 500

@giveaways_bp.route('/<giveaway_id>', methods=['DELETE'])
def delete_giveaway(giveaway_id):
    """Delete giveaway (soft delete)"""
    try:
        current_db = get_db()
        existing = current_db.get_giveaway(giveaway_id)
        if not existing:
            return jsonify({
                'success': False,
                'error': 'Giveaway not found'
            }), 404
        
        success = current_db.delete_giveaway(giveaway_id)
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Giveaway deleted successfully'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to delete giveaway'
            }), 500
            
    except Exception as e:
        log_error(f"Error in delete_giveaway: {e}")
        return jsonify({'error': str(e)}), 500

@giveaways_bp.route('/search', methods=['GET'])
def search_giveaways():
    """Search giveaways by prize or text"""
    try:
        current_db = get_db()
        query = request.args.get('q', '')
        if len(query) < 2:
            return jsonify({
                'success': False,
                'error': 'Search query must be at least 2 characters'
            }), 400
        
        limit = request.args.get('limit', 20, type=int)
        
        giveaways = current_db.search_giveaways(query, limit=limit)
        
        return jsonify({
            'success': True,
            'count': len(giveaways),
            'query': query,
            'giveaways': giveaways
        })
        
    except Exception as e:
        log_error(f"Error in search_giveaways: {e}")
        return jsonify({'error': str(e)}), 500

@giveaways_bp.route('/stats', methods=['GET'])
def get_giveaway_stats():
    """Get giveaway statistics"""
    try:
        current_db = get_db()
        stats = current_db.get_giveaway_stats()
        
        return jsonify({
            'success': True,
            'stats': stats,
            'timestamp': get_jakarta_time()
        })
        
    except Exception as e:
        log_error(f"Error in get_giveaway_stats: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== CHAT ID ENDPOINTS ====================
@chatid_bp.route('', methods=['POST'])
def save_chat_data():
    """Menyimpan data chat ID dari bot"""
    try:
        current_db = get_db()
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        chat_id = data.get('chat_id')
        if not chat_id:
            return jsonify({'error': 'chat_id is required'}), 400
        
        # Bersihkan username
        chat_username = data.get('chat_username')
        if chat_username:
            chat_username = chat_username.replace('@', '').strip().lower()
            log_info(f"Cleaned username: {chat_username}")
        else:
            chat_username = None
        
        now = get_jakarta_time()
        cursor = current_db.get_cursor()
        
        cursor.execute("""
        INSERT INTO chatid_data (
            chat_id, chat_title, chat_username, chat_type, invite_link,
            admin_count, participants_count, is_verified, is_scam, is_fake,
            slow_mode_enabled, slow_mode_seconds, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(chat_id) DO UPDATE SET
            chat_title=excluded.chat_title,
            chat_username=excluded.chat_username,
            chat_type=excluded.chat_type,
            invite_link=excluded.invite_link,
            admin_count=excluded.admin_count,
            participants_count=excluded.participants_count,
            is_verified=excluded.is_verified,
            is_scam=excluded.is_scam,
            is_fake=excluded.is_fake,
            slow_mode_enabled=excluded.slow_mode_enabled,
            slow_mode_seconds=excluded.slow_mode_seconds,
            updated_at=excluded.updated_at
        """, (
            chat_id,
            data.get('chat_title'),
            chat_username,
            data.get('chat_type'),
            data.get('invite_link'),
            data.get('admin_count', 0),
            data.get('participants_count', 0),
            data.get('is_verified', 0),
            data.get('is_scam', 0),
            data.get('is_fake', 0),
            data.get('slow_mode_enabled', 0),
            data.get('slow_mode_seconds', 0),
            now,
            now
        ))
        
        # Simpan data admin jika ada
        admins = data.get('admins', [])
        if admins:
            cursor.execute("DELETE FROM chat_admins WHERE chat_id = ?", (chat_id,))
            
            for admin in admins:
                cursor.execute("""
                INSERT INTO chat_admins (
                    chat_id, user_id, username, fullname, role, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    chat_id,
                    admin.get('user_id'),
                    admin.get('username'),
                    admin.get('fullname'),
                    admin.get('role', 'admin'),
                    now,
                    now
                ))
        
        current_db.conn.commit()
        cursor.close()
        
        log_info(f"✅ Chat data saved for ID: {chat_id}")
        return jsonify({'success': True, 'message': 'Chat data saved successfully'})
        
    except Exception as e:
        log_error(f"Error saving chat data: {e}")
        return jsonify({'error': str(e)}), 500

@chatid_bp.route('/username/<username>', methods=['GET'])
def get_chat_by_username(username):
    """Mendapatkan data chat berdasarkan username"""
    try:
        current_db = get_db()
        clean_username = username.replace('@', '').strip().lower()
        log_info(f"🔍 Looking up chat by username: '{clean_username}'")
        
        cursor = current_db.get_cursor()
        cursor.execute("SELECT * FROM chatid_data WHERE LOWER(chat_username) = ?", (clean_username,))
        chat_data = cursor.fetchone()
        
        if not chat_data:
            cursor.close()
            return jsonify({'error': 'Chat not found'}), 404
        
        result = dict(chat_data)
        
        cursor.execute("""
        SELECT user_id, username, fullname, role 
        FROM chat_admins WHERE chat_id = ?
        """, (result['chat_id'],))
        
        admins = cursor.fetchall()
        result['admins'] = [dict(admin) for admin in admins]
        
        cursor.close()
        return jsonify(result)
        
    except Exception as e:
        log_error(f"Error getting chat by username: {e}")
        return jsonify({'error': str(e)}), 500

@chatid_bp.route('/sync/<username>', methods=['POST'])
def sync_chat_from_bot(username):
    """Memanggil bot untuk sync data channel/group"""
    try:
        current_db = get_db()
        clean_username = username.replace('@', '').strip().lower()
        log_info(f"📡 Sync requested for @{clean_username}")
        
        # Cek apakah channel sudah ada
        cursor = current_db.get_cursor()
        cursor.execute("SELECT * FROM chatid_data WHERE LOWER(chat_username) = ?", (clean_username,))
        existing = cursor.fetchone()
        cursor.close()
        
        if existing:
            log_info(f"✅ Data already exists for @{clean_username}")
            return jsonify({
                'success': True,
                'exists': True,
                'message': f'Data untuk @{clean_username} sudah ada',
                'data': dict(existing)
            })
        
        # Buat file request untuk bot
        marker_file = f"/tmp/sync_{clean_username}.request"
        with open(marker_file, 'w') as f:
            f.write(clean_username)
        
        log_info(f"✅ Sync request created for @{clean_username}")
        
        return jsonify({
            'success': True,
            'message': f'Proses sinkronisasi untuk @{clean_username} dimulai',
            'status': 'processing'
        }), 202
        
    except Exception as e:
        log_error(f"Error starting sync: {e}")
        return jsonify({
            'success': False,
            'error': f'Gagal memulai sinkronisasi: {str(e)}'
        }), 500

@chatid_bp.route('/status/<username>', methods=['GET'])
def check_sync_status(username):
    """Cek status sinkronisasi"""
    try:
        current_db = get_db()
        clean_username = username.replace('@', '').strip().lower()
        
        # Cek di database
        cursor = current_db.get_cursor()
        cursor.execute("SELECT * FROM chatid_data WHERE LOWER(chat_username) = ?", (clean_username,))
        chat_data = cursor.fetchone()
        cursor.close()
        
        if chat_data:
            return jsonify({
                'success': True,
                'completed': True,
                'data': dict(chat_data)
            })
        
        # Cek file marker
        import os
        marker = f"/tmp/sync_{clean_username}.done"
        if os.path.exists(marker):
            with open(marker, 'r') as f:
                data = json.loads(f.read())
            return jsonify({
                'success': True,
                'completed': True,
                'data': data
            })
        
        # Cek apakah masih ada request
        request_file = f"/tmp/sync_{clean_username}.request"
        if os.path.exists(request_file):
            return jsonify({
                'success': True,
                'completed': False,
                'message': 'Sinkronisasi sedang dalam antrian...'
            })
        
        return jsonify({
            'success': True,
            'completed': False,
            'message': 'Sinkronisasi masih dalam proses...'
        })
        
    except Exception as e:
        log_error(f"Error checking sync status: {e}")
        return jsonify({'error': str(e)}), 500

@chatid_bp.route('/check-role/<username>/<int:user_id>', methods=['GET'])
def check_user_role(username, user_id):
    """Cek apakah user adalah admin atau owner di channel"""
    try:
        current_db = get_db()
        clean_username = username.replace('@', '').strip().lower()
        log_info(f"🔍 Checking role for user {user_id} in @{clean_username}")
        
        cursor = current_db.get_cursor()
        
        # Cari chat berdasarkan username
        cursor.execute("SELECT chat_id FROM chatid_data WHERE LOWER(chat_username) = ?", (clean_username,))
        chat = cursor.fetchone()
        
        if not chat:
            cursor.close()
            return jsonify({
                'success': False,
                'error': 'Chat not found'
            }), 404
        
        chat_id = chat['chat_id']
        
        # Cek apakah user ada di tabel admins
        cursor.execute("""
        SELECT role FROM chat_admins 
        WHERE chat_id = ? AND user_id = ?
        """, (chat_id, user_id))
        
        admin = cursor.fetchone()
        cursor.close()
        
        if admin:
            # User ditemukan di tabel admins
            role = admin['role']
            is_authorized = role in ['owner', 'admin']
            
            log_info(f"✅ User {user_id} ditemukan dengan role: {role}")
            
            return jsonify({
                'success': True,
                'is_authorized': is_authorized,
                'role': role,
                'message': f'User adalah {role} di channel ini'
            })
        else:
            # User tidak ditemukan di tabel admins
            log_info(f"❌ User {user_id} tidak ditemukan di daftar admin/owner")
            
            return jsonify({
                'success': True,
                'is_authorized': False,
                'role': None,
                'message': 'User bukan admin atau owner di channel ini'
            })
        
    except Exception as e:
        log_error(f"Error checking user role: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@chatid_bp.route('/search', methods=['GET'])
def search_chats():
    """Mencari chat berdasarkan query"""
    try:
        current_db = get_db()
        query = request.args.get('q', '')
        if not query:
            return jsonify({'error': 'Query parameter required'}), 400
            
        cursor = current_db.get_cursor()
        search_term = f"%{query}%"
        
        cursor.execute("""
        SELECT chat_id, chat_title, chat_username, chat_type, invite_link,
               admin_count, participants_count, updated_at
        FROM chatid_data 
        WHERE chat_title LIKE ? OR chat_username LIKE ?
        ORDER BY updated_at DESC
        LIMIT 20
        """, (search_term, search_term))
        
        chats = cursor.fetchall()
        cursor.close()
        
        return jsonify([dict(chat) for chat in chats])
        
    except Exception as e:
        log_error(f"Error searching chats: {e}")
        return jsonify({'error': str(e)}), 500

@giveaways_bp.route('/<giveaway_id>/winners', methods=['GET'])
def get_giveaway_winners(giveaway_id):
    """Get winners for a specific giveaway"""
    try:
        current_db = get_db()
        giveaway = current_db.get_giveaway(giveaway_id)
        
        if not giveaway:
            return jsonify({
                'success': False,
                'error': 'Giveaway not found'
            }), 404
        
        # Ambil data pemenang dari database
        # Ini contoh data dummy, sesuaikan dengan struktur database Anda
        cursor = current_db.get_cursor()
        cursor.execute("""
            SELECT u.user_id, u.fullname, u.username, u.photo_url, w.prize_index
            FROM winners w
            JOIN users u ON w.user_id = u.user_id
            WHERE w.giveaway_id = ?
        """, (giveaway_id,))
        
        winners_data = cursor.fetchall()
        cursor.close()
        
        winners = []
        for w in winners_data:
            winners.append({
                'id': w['user_id'],
                'first_name': w['fullname'].split(' ')[0] if ' ' in w['fullname'] else w['fullname'],
                'last_name': w['fullname'].split(' ')[1] if ' ' in w['fullname'] and len(w['fullname'].split(' ')) > 1 else '',
                'username': w['username'],
                'photo_url': w['photo_url'],
                'prize_index': w['prize_index']
            })
        
        return jsonify({
            'success': True,
            'winners': winners
        })
        
    except Exception as e:
        log_error(f"Error getting winners: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@giveaways_bp.route('/<giveaway_id>/participants', methods=['GET'])
def get_giveaway_participants(giveaway_id):
    """Mendapatkan daftar partisipan giveaway"""
    try:
        current_db = get_db()
        
        # Cek apakah giveaway ada
        giveaway = current_db.get_giveaway(giveaway_id)
        if not giveaway:
            return jsonify({
                'success': False,
                'error': 'Giveaway not found'
            }), 404
        
        # Ambil daftar partisipan - PERBAIKAN: JOIN dengan tabel users untuk dapat fullname
        cursor = current_db.get_cursor()
        cursor.execute("""
            SELECT p.user_id, u.fullname, u.username, p.joined_at as participated_at
            FROM participants p
            JOIN users u ON p.user_id = u.user_id
            WHERE p.giveaway_id = ?
            ORDER BY p.joined_at DESC
        """, (giveaway_id,))
        
        participants_data = cursor.fetchall()
        cursor.close()
        
        participants = []
        for p in participants_data:
            participants.append({
                'user_id': p['user_id'],
                'fullname': p['fullname'],
                'username': p['username'],
                'participated_at': p['participated_at']
            })
        
        return jsonify({
            'success': True,
            'giveaway_id': giveaway_id,
            'count': len(participants),
            'participants': participants
        })
        
    except Exception as e:
        log_error(f"Error getting participants: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@users_bp.route('/<int:user_id>/participation-history', methods=['GET'])
def get_user_participation_history(user_id):
    """Mendapatkan history partisipasi user"""
    try:
        current_db = get_db()
        
        cursor = current_db.get_cursor()
        cursor.execute("""
            SELECT COUNT(*) as total_participations
            FROM participants
            WHERE user_id = ?
        """, (user_id,))
        
        result = cursor.fetchone()
        total_participations = result['total_participations'] if result else 0
        
        cursor.execute("""
            SELECT giveaway_id, joined_at as participated_at
            FROM participants
            WHERE user_id = ?
            ORDER BY joined_at DESC
            LIMIT 10
        """, (user_id,))
        
        recent = cursor.fetchall()
        cursor.close()
        
        recent_participations = []
        for r in recent:
            recent_participations.append({
                'giveaway_id': r['giveaway_id'],
                'participated_at': r['participated_at']
            })
        
        return jsonify({
            'success': True,
            'user_id': user_id,
            'total_participations': total_participations,
            'recent_participations': recent_participations
        })
        
    except Exception as e:
        log_error(f"Error getting participation history: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/check-subscription', methods=['POST'])
def check_subscription():
    """Memeriksa apakah user subscribe ke channel/group secara LANGSUNG ke Telegram"""
    try:
        data = request.json
        user_id = data.get('user_id')
        channel_username = data.get('channel_username')
        
        if not user_id or not channel_username:
            return jsonify({
                'success': False,
                'error': 'user_id and channel_username are required'
            }), 400
        
        clean_username = channel_username.replace('@', '').strip().lower()
        log_info(f"🔍 Checking subscription for user {user_id} to @{clean_username}")
        
        # LANGSUNG buat request ke bot, tanpa cek database dulu
        import json
        import os
        
        request_data = {
            'user_id': user_id,
            'channel_username': clean_username,
            'timestamp': get_jakarta_time()
        }
        
        request_file = f"/tmp/check_sub_{user_id}_{clean_username}.request"
        with open(request_file, 'w') as f:
            f.write(json.dumps(request_data))
        
        # Langsung return 202, client akan polling
        return jsonify({
            'success': False,
            'requires_check': True,
            'message': f'Memeriksa keanggotaan di @{clean_username}...',
            'channel_username': clean_username
        }), 202
        
    except Exception as e:
        log_error(f"Error checking subscription: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/check-subscription-status/<path:channel_username>/<int:user_id>', methods=['GET'])
def check_subscription_status(channel_username, user_id):
    """Endpoint untuk polling status pengecekan subscription"""
    try:
        clean_username = channel_username.replace('@', '').strip().lower()
        
        # Cek apakah sudah ada result
        result_file = f"/tmp/check_sub_{user_id}_{clean_username}.result"
        if os.path.exists(result_file):
            with open(result_file, 'r') as f:
                result = json.loads(f.read())
            
            # Hapus file result
            try:
                os.remove(result_file)
            except:
                pass
            
            # Ambil data channel dari database
            current_db = get_db()
            cursor = current_db.get_cursor()
            cursor.execute("SELECT * FROM chatid_data WHERE LOWER(chat_username) = ?", (clean_username,))
            chat_data = cursor.fetchone()
            cursor.close()
            
            if chat_data and result.get('is_subscribed'):
                result['channel_info'] = {
                    'chat_id': chat_data['chat_id'],
                    'title': chat_data['chat_title'],
                    'username': chat_data['chat_username'],
                    'type': chat_data['chat_type'],
                    'is_verified': chat_data['is_verified'],
                    'invite_link': chat_data['invite_link'],
                    'participants_count': chat_data['participants_count']
                }
            
            return jsonify({
                'success': True,
                'completed': True,
                'result': result
            })
        
        # Cek apakah masih ada request
        request_file = f"/tmp/check_sub_{user_id}_{clean_username}.request"
        if os.path.exists(request_file):
            return jsonify({
                'success': True,
                'completed': False,
                'message': 'Pengecekan sedang berlangsung...'
            })
        
        # Cek apakah perlu sync dulu
        sync_file = f"/tmp/check_sub_sync_{clean_username}.request"
        if os.path.exists(sync_file):
            return jsonify({
                'success': True,
                'completed': False,
                'requires_sync': True,
                'message': 'Mengambil data channel...'
            })
        
        return jsonify({
            'success': True,
            'completed': False,
            'message': 'Memulai pengecekan...'
        })
        
    except Exception as e:
        log_error(f"Error checking subscription status: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@giveaways_bp.route('/<giveaway_id>/participate', methods=['POST'])
def participate_giveaway(giveaway_id):
    """Menyimpan partisipasi user ke giveaway"""
    try:
        current_db = get_db()
        data = request.json
        log_info(f"📝 Participation request for giveaway {giveaway_id}: {data}")
        
        # Validasi data
        required_fields = ['user_id', 'fullname']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Field {field} is required'
                }), 400
        
        # Cek apakah giveaway ada
        giveaway = current_db.get_giveaway(giveaway_id)
        if not giveaway:
            return jsonify({
                'success': False,
                'error': 'Giveaway not found'
            }), 404
        
        # Cek apakah giveaway masih active
        if giveaway['status'] != 'active':
            return jsonify({
                'success': False,
                'error': 'Giveaway sudah berakhir'
            }), 400
        
        # Cek apakah user sudah pernah berpartisipasi
        cursor = current_db.get_cursor()
        cursor.execute("""
            SELECT COUNT(*) as count FROM participants 
            WHERE giveaway_id = ? AND user_id = ?
        """, (giveaway_id, data['user_id']))
        
        result = cursor.fetchone()
        if result and result['count'] > 0:
            cursor.close()
            return jsonify({
                'success': False,
                'error': 'Anda sudah pernah berpartisipasi'
            }), 400
        
        # Simpan user jika belum ada
        current_db.add_user(
            user_id=data['user_id'],
            fullname=data['fullname'],
            username=data.get('username'),
            is_premium=data.get('is_premium', 0)
        )
        
        # Simpan partisipasi
        now = get_jakarta_time()
        cursor.execute("""
            INSERT INTO participants (giveaway_id, user_id, joined_at)
            VALUES (?, ?, ?)
        """, (
            giveaway_id,
            data['user_id'],
            now
        ))
        
        # Update total_participations di tabel users
        cursor.execute("""
            UPDATE users 
            SET total_participations = total_participations + 1,
                updated_at = ?
            WHERE user_id = ?
        """, (now, data['user_id']))
        
        # Update participants_count di tabel giveaways
        cursor.execute("""
            UPDATE giveaways 
            SET participants_count = participants_count + 1,
                updated_at = ?
            WHERE giveaway_id = ?
        """, (now, giveaway_id))
        
        current_db.conn.commit()
        cursor.close()
        
        log_info(f"✅ Participation saved for user {data['user_id']} in giveaway {giveaway_id}")
        
        return jsonify({
            'success': True,
            'message': 'Berhasil berpartisipasi',
            'participant': {
                'user_id': data['user_id'],
                'fullname': data['fullname'],
                'username': data.get('username'),
                'participated_at': now
            }
        }), 201
        
    except Exception as e:
        log_error(f"Error in participate_giveaway: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@giveaways_bp.route('/<giveaway_id>/draw-winners', methods=['POST'])
def draw_winners(giveaway_id):
    """Memilih pemenang secara acak untuk giveaway yang sudah berakhir"""
    try:
        current_db = get_db()
        
        # Ambil data giveaway
        giveaway = current_db.get_giveaway(giveaway_id)
        if not giveaway:
            return jsonify({
                'success': False,
                'error': 'Giveaway not found'
            }), 404
        
        # Cek apakah giveaway sudah ended
        if giveaway['status'] != 'ended':
            return jsonify({
                'success': False,
                'error': 'Giveaway masih aktif'
            }), 400
        
        # Ambil daftar partisipan
        cursor = current_db.get_cursor()
        cursor.execute("""
            SELECT user_id FROM participants 
            WHERE giveaway_id = ? AND is_winner = 0
            ORDER BY RANDOM()
        """, (giveaway_id,))
        
        participants = cursor.fetchall()
        
        if not participants:
            cursor.close()
            return jsonify({
                'success': False,
                'error': 'Tidak ada peserta'
            }), 400
        
        # Hitung jumlah pemenang berdasarkan jumlah hadiah
        prizes = giveaway.get('prizes', [])
        if isinstance(prizes, str):
            try:
                prizes = json.loads(prizes)
            except:
                prizes = [prizes]
        
        num_winners = len(prizes)
        
        # Pilih pemenang secara acak
        selected_winners = []
        now = get_jakarta_time()
        
        for i in range(min(num_winners, len(participants))):
            winner = participants[i]
            prize_index = i
            
            # Simpan ke tabel winners
            cursor.execute("""
                INSERT INTO winners (giveaway_id, user_id, win_position, announced_at)
                VALUES (?, ?, ?, ?)
            """, (giveaway_id, winner['user_id'], prize_index + 1, now))
            
            # Update participants
            cursor.execute("""
                UPDATE participants 
                SET is_winner = 1, win_position = ?
                WHERE giveaway_id = ? AND user_id = ?
            """, (prize_index + 1, giveaway_id, winner['user_id']))
            
            # Update user stats
            cursor.execute("""
                UPDATE users 
                SET total_wins = total_wins + 1,
                    updated_at = ?
                WHERE user_id = ?
            """, (now, winner['user_id']))
            
            # Ambil data user untuk response
            cursor.execute("""
                SELECT user_id, fullname, username, photo_url
                FROM users WHERE user_id = ?
            """, (winner['user_id'],))
            
            user_data = cursor.fetchone()
            
            selected_winners.append({
                'user_id': winner['user_id'],
                'fullname': user_data['fullname'] if user_data else 'User',
                'username': user_data['username'] if user_data else None,
                'photo_url': user_data['photo_url'] if user_data else None,
                'prize_index': prize_index,
                'prize': prizes[prize_index] if prize_index < len(prizes) else 'Hadiah'
            })
        
        # Update winners_count di giveaways
        cursor.execute("""
            UPDATE giveaways 
            SET winners_count = ?, updated_at = ?
            WHERE giveaway_id = ?
        """, (len(selected_winners), now, giveaway_id))
        
        current_db.conn.commit()
        cursor.close()
        
        log_info(f"✅ Winners drawn for giveaway {giveaway_id}: {len(selected_winners)} winners")
        
        return jsonify({
            'success': True,
            'message': f'Berhasil memilih {len(selected_winners)} pemenang',
            'winners': selected_winners
        }), 200
        
    except Exception as e:
        log_error(f"Error drawing winners: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Update endpoint get_giveaway_winners untuk mengambil dari database
@giveaways_bp.route('/<giveaway_id>/winners', methods=['GET'])
def get_giveaway_winners(giveaway_id):
    """Get winners for a specific giveaway"""
    try:
        current_db = get_db()
        giveaway = current_db.get_giveaway(giveaway_id)
        
        if not giveaway:
            return jsonify({
                'success': False,
                'error': 'Giveaway not found'
            }), 404
        
        # Ambil data pemenang dari database
        cursor = current_db.get_cursor()
        cursor.execute("""
            SELECT w.user_id, w.win_position, 
                   u.fullname, u.username, u.photo_url
            FROM winners w
            JOIN users u ON w.user_id = u.user_id
            WHERE w.giveaway_id = ?
            ORDER BY w.win_position ASC
        """, (giveaway_id,))
        
        winners_data = cursor.fetchall()
        cursor.close()
        
        # Parse prizes
        prizes = giveaway.get('prizes', [])
        if isinstance(prizes, str):
            try:
                prizes = json.loads(prizes)
            except:
                prizes = [prizes]
        
        winners = []
        for w in winners_data:
            prize_index = w['win_position'] - 1 if w['win_position'] else 0
            winners.append({
                'id': w['user_id'],
                'first_name': w['fullname'].split(' ')[0] if ' ' in w['fullname'] else w['fullname'],
                'last_name': w['fullname'].split(' ')[1] if ' ' in w['fullname'] and len(w['fullname'].split(' ')) > 1 else '',
                'username': w['username'],
                'photo_url': w['photo_url'],
                'prize_index': prize_index,
                'prize': prizes[prize_index] if prize_index < len(prizes) else 'Hadiah',
                'win_position': w['win_position']
            })
        
        return jsonify({
            'success': True,
            'winners': winners
        })
        
    except Exception as e:
        log_error(f"Error getting winners: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Register all blueprints
app.register_blueprint(users_bp)
app.register_blueprint(giveaways_bp)
app.register_blueprint(chatid_bp)

# ==================== MAIN ====================
if __name__ == "__main__":
    print("""
    ╔══════════════════════════════════════════╗
    ║        🎁 GIFT FREEBIES API              ║
    ╠══════════════════════════════════════════╣
    ║  📦 Version: 1.0.0                       ║
    ║  🗄️  Database: SQLite3                    ║
    ║  👥 Feature: Users & Giveaways            ║
    ║  🔄 Auto-reconnect: Active                ║
    ║  ⏰ Auto-expire: Active (every 60s)       ║
    ╚══════════════════════════════════════════╝
    """)
    
    # Start background tasks
    start_background_tasks()
    
    port = Config.PORT
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('127.0.0.1', port))
    
    if result == 0:
        print(f"⚠️  Port {port} already in use!")
        port = 5002
        print(f"✅ Using port {port} instead")
    sock.close()
    
    print(f"\n🌐 Server running at: http://{Config.HOST}:{port}")
    print(f"📝 API Documentation: http://{Config.HOST}:{port}/")
    print(f"🔍 Health Check: http://{Config.HOST}:{port}/api/health")
    print(f"👥 Users endpoint: http://{Config.HOST}:{port}/api/users")
    print(f"🎁 Giveaways endpoint: http://{Config.HOST}:{port}/api/giveaways")
    print(f"   • POST /api/giveaways/update-expired - Update all expired giveaways")
    print(f"   • GET /api/giveaways/check-expired - Check expired giveaways")
    print(f"   • POST /api/giveaways/<id>/check-status - Check single giveaway")
    print(f"💬 Chat endpoint: http://{Config.HOST}:{port}/api/chatid")
    print(f"   • GET /api/chatid/check-role/<username>/<user_id> - Check if user is admin/owner")
    print(f"🔄 Auto-reconnect: Active (cek setiap 2 detik)")
    print(f"⏰ Auto-expire: Active (cek setiap 60 detik)")
    print(f"\n📌 Press CTRL+C to stop\n")
    
    app.run(host=Config.HOST, port=port, debug=Config.DEBUG, threaded=True)

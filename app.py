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
    """Menghitung waktu akhir berdasarkan durasi"""
    from datetime import datetime, timedelta
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

# ==================== GIVEAWAY ENDPOINTS ====================
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
        
        giveaway_id = generate_giveaway_id()
        
        end_time = None
        if data.get('duration_type') == 'duration':
            duration_value = data.get('duration_value', 24)
            duration_unit = data.get('duration_unit', 'hours')
            end_time = calculate_end_time(duration_value, duration_unit)
        elif data.get('duration_type') == 'date' and data.get('end_date'):
            end_date_str = data.get('end_date').replace('T', ' ')
            if ':' in end_date_str and end_date_str.count(':') == 1:
                end_date_str += ':00'
            end_time = end_date_str
        
        current_db.add_user(
            user_id=data['creator_user_id'],
            fullname=data.get('fullname', 'Unknown'),
            username=data.get('username')
        )
        
        success = current_db.create_giveaway(
            giveaway_id=giveaway_id,
            creator_user_id=data['creator_user_id'],
            prizes=data['prizes'],
            requirements=data.get('requirements', []),
            giveaway_text=data['giveaway_text'],
            duration_type=data.get('duration_type', 'duration'),
            duration_value=data.get('duration_value'),
            duration_unit=data.get('duration_unit'),
            end_date=end_time,
            media_path=data.get('media_path'),
            captcha_enabled=data.get('captcha_enabled', 1)
        )
        
        if success:
            direct_link = f"https://aldiprem.github.io/giveaway/?id={giveaway_id}"
            
            return jsonify({
                'success': True,
                'message': 'Giveaway created successfully',
                'giveaway_id': giveaway_id,
                'direct_link': direct_link,
                'end_time': end_time
            }), 201
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to create giveaway'
            }), 500
            
    except Exception as e:
        log_error(f"Error in create_giveaway: {e}")
        return jsonify({'error': str(e)}), 500

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
        giveaway = current_db.get_giveaway(giveaway_id)
        
        if giveaway:
            creator = current_db.get_user(giveaway['creator_user_id'])
            if creator:
                giveaway['creator'] = {
                    'fullname': creator['fullname'],
                    'username': creator['username'],
                    'avatar': generate_avatar_url(creator['fullname'])
                }
            
            return jsonify({
                'success': True,
                'giveaway': giveaway
            })
        else:
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
            
            return jsonify({
                'success': True,
                'is_authorized': is_authorized,
                'role': role,
                'message': f'User adalah {role} di channel ini'
            })
        else:
            # User tidak ditemukan di tabel admins
            return jsonify({
                'success': True,
                'is_authorized': False,
                'role': None,
                'message': 'User bukan admin atau owner di channel ini'
            })
        
    except Exception as e:
        log_error(f"Error checking user role: {e}")
        return jsonify({'error': str(e)}), 500

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
    ╚══════════════════════════════════════════╝
    """)
    
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
    print(f"💬 Chat endpoint: http://{Config.HOST}:{port}/api/chatid")
    print(f"   • GET /api/chatid/check-role/<username>/<user_id> - Check if user is admin/owner")
    print(f"🔄 Auto-reconnect: Active (cek setiap 2 detik)")
    print(f"\n📌 Press CTRL+C to stop\n")
    
    app.run(host=Config.HOST, port=port, debug=Config.DEBUG, threaded=True)

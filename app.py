# app.py
from flask import Flask, Blueprint, request, jsonify
from flask_cors import CORS
import socket
import json
import os
from config import Config
from database import Database
from utils import log_info, log_error, get_jakarta_time
import pytz
import random
import string

app = Flask(__name__)

chatid_bp = Blueprint('chatid', __name__)
CORS(app, origins=Config.ALLOWED_ORIGINS, supports_credentials=True)

db = Database()

@app.after_request
def after_request(response):
    """Middleware untuk menambahkan headers CORS"""
    origin = request.headers.get('Origin')
    if origin in Config.ALLOWED_ORIGINS:
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Headers', 
                           'Content-Type,Accept,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 
                           'GET,POST,PUT,DELETE,OPTIONS')
        response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

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
        end_time = now + timedelta(hours=24)  # Default 24 jam
    
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
                'GET /api/giveaways/search?q=<query>': 'Search giveaways'
            },
            'health': {
                'GET /api/health': 'Health check'
            }
        },
        'timestamp': get_jakarta_time()
    })

# ==================== USERS ENDPOINTS ====================

# Get all users
@app.route('/api/users', methods=['GET'])
def get_all_users():
    """Get all users with pagination"""
    try:
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        users = db.get_all_users(limit=limit, offset=offset)
        
        # Add avatar URL
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

# Get user by ID
@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user(user_id):
    """Get user by ID"""
    try:
        user = db.get_user(user_id)
        
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

# Get user by username
@app.route('/api/users/username/<username>', methods=['GET'])
def get_user_by_username(username):
    """Get user by username"""
    try:
        user = db.get_user_by_username(username)
        
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

# Create or update user
@app.route('/api/users', methods=['POST'])
def create_user():
    """Create new user or update existing"""
    try:
        data = request.json
        log_info(f"Received user data: {data}")
        
        # Required fields
        required_fields = ['user_id', 'fullname']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Field {field} is required'
                }), 400
        
        # Add user to database
        success = db.add_user(
            user_id=data['user_id'],
            fullname=data['fullname'],
            username=data.get('username'),
            phone_number=data.get('phone_number'),
            language_code=data.get('language_code', 'id'),
            is_bot=data.get('is_bot', 0),
            is_premium=data.get('is_premium', 0)
        )
        
        if success:
            # Get the updated user
            user = db.get_user(data['user_id'])
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

# Update user stats
@app.route('/api/users/<int:user_id>/stats', methods=['PUT'])
def update_user_stats(user_id):
    """Update user statistics (participations/wins)"""
    try:
        data = request.json
        participated = data.get('participated', False)
        won = data.get('won', False)
        
        success = db.update_user_stats(user_id, participated, won)
        
        if success:
            user = db.get_user(user_id)
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

# Search users
@app.route('/api/users/search', methods=['GET'])
def search_users():
    """Search users by name or username"""
    try:
        query = request.args.get('q', '')
        if len(query) < 2:
            return jsonify({
                'success': False,
                'error': 'Search query must be at least 2 characters'
            }), 400
        
        users = db.search_users(query)
        
        # Add avatar URL
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

# Get total users count
@app.route('/api/users/count', methods=['GET'])
def get_user_count():
    """Get total number of users"""
    try:
        count = db.get_user_count()
        
        return jsonify({
            'success': True,
            'count': count,
            'timestamp': get_jakarta_time()
        })
        
    except Exception as e:
        log_error(f"Error in get_user_count: {e}")
        return jsonify({'error': str(e)}), 500

# Get active users count
@app.route('/api/users/active', methods=['GET'])
def get_active_users():
    """Get number of active users in last X days"""
    try:
        days = request.args.get('days', 7, type=int)
        count = db.get_active_users(days)
        
        return jsonify({
            'success': True,
            'days': days,
            'count': count,
            'timestamp': get_jakarta_time()
        })
        
    except Exception as e:
        log_error(f"Error in get_active_users: {e}")
        return jsonify({'error': str(e)}), 500

# Get top users by participations
@app.route('/api/users/top', methods=['GET'])
def get_top_users():
    """Get top users by total participations"""
    try:
        limit = request.args.get('limit', 10, type=int)
        
        cursor = db.get_cursor()
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

# Create new giveaway
@app.route('/api/giveaways', methods=['POST'])
def create_giveaway():
    """Create new giveaway"""
    try:
        data = request.json
        log_info(f"Received giveaway data: {data}")
        
        # Required fields
        required_fields = ['creator_user_id', 'prizes', 'giveaway_text']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Field {field} is required'
                }), 400
        
        # Generate giveaway ID
        giveaway_id = generate_giveaway_id()
        
        # Calculate end time
        end_time = None
        if data.get('duration_type') == 'duration':
            duration_value = data.get('duration_value', 24)
            duration_unit = data.get('duration_unit', 'hours')
            end_time = calculate_end_time(duration_value, duration_unit)
        elif data.get('duration_type') == 'date' and data.get('end_date'):
            # Convert from datetime-local format
            end_date_str = data.get('end_date').replace('T', ' ')
            if ':' in end_date_str and end_date_str.count(':') == 1:
                end_date_str += ':00'
            end_time = end_date_str
        
        # Add creator user if not exists
        db.add_user(
            user_id=data['creator_user_id'],
            fullname=data.get('fullname', 'Unknown'),
            username=data.get('username')
        )
        
        # Create giveaway in database
        success = db.create_giveaway(
            giveaway_id=giveaway_id,
            creator_user_id=data['creator_user_id'],
            prizes=data['prizes'],  # List of prizes
            requirements=data.get('requirements', []),  # List of requirements
            giveaway_text=data['giveaway_text'],
            duration_type=data.get('duration_type', 'duration'),
            duration_value=data.get('duration_value'),
            duration_unit=data.get('duration_unit'),
            end_date=end_time,
            media_path=data.get('media_path'),
            captcha_enabled=data.get('captcha_enabled', 1)
        )
        
        if success:
            # Generate direct link
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

# Get all giveaways
@app.route('/api/giveaways', methods=['GET'])
def get_all_giveaways():
    """Get all giveaways with optional filters"""
    try:
        status = request.args.get('status', 'active')
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        giveaways = db.get_all_giveaways(status=status, limit=limit, offset=offset)
        
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

# Get giveaway by ID
@app.route('/api/giveaways/<giveaway_id>', methods=['GET'])
def get_giveaway(giveaway_id):
    """Get giveaway by ID"""
    try:
        giveaway = db.get_giveaway(giveaway_id)
        
        if giveaway:
            # Get creator info
            creator = db.get_user(giveaway['creator_user_id'])
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

# Get giveaways by user
@app.route('/api/giveaways/user/<int:user_id>', methods=['GET'])
def get_user_giveaways(user_id):
    """Get all giveaways created by a specific user"""
    try:
        status = request.args.get('status', 'all')
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        giveaways = db.get_user_giveaways(user_id, status=status, limit=limit, offset=offset)
        
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

# Update giveaway
@app.route('/api/giveaways/<giveaway_id>', methods=['PUT'])
def update_giveaway(giveaway_id):
    """Update giveaway details"""
    try:
        data = request.json
        
        # Check if giveaway exists
        existing = db.get_giveaway(giveaway_id)
        if not existing:
            return jsonify({
                'success': False,
                'error': 'Giveaway not found'
            }), 404
        
        # Update giveaway
        success = db.update_giveaway(giveaway_id, data)
        
        if success:
            updated = db.get_giveaway(giveaway_id)
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

# Delete giveaway
@app.route('/api/giveaways/<giveaway_id>', methods=['DELETE'])
def delete_giveaway(giveaway_id):
    """Delete giveaway (soft delete)"""
    try:
        # Check if giveaway exists
        existing = db.get_giveaway(giveaway_id)
        if not existing:
            return jsonify({
                'success': False,
                'error': 'Giveaway not found'
            }), 404
        
        # Delete giveaway
        success = db.delete_giveaway(giveaway_id)
        
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

# Search giveaways
@app.route('/api/giveaways/search', methods=['GET'])
def search_giveaways():
    """Search giveaways by prize or text"""
    try:
        query = request.args.get('q', '')
        if len(query) < 2:
            return jsonify({
                'success': False,
                'error': 'Search query must be at least 2 characters'
            }), 400
        
        limit = request.args.get('limit', 20, type=int)
        
        giveaways = db.search_giveaways(query, limit=limit)
        
        return jsonify({
            'success': True,
            'count': len(giveaways),
            'query': query,
            'giveaways': giveaways
        })
        
    except Exception as e:
        log_error(f"Error in search_giveaways: {e}")
        return jsonify({'error': str(e)}), 500

# Get giveaway statistics
@app.route('/api/giveaways/stats', methods=['GET'])
def get_giveaway_stats():
    """Get giveaway statistics"""
    try:
        stats = db.get_giveaway_stats()
        
        return jsonify({
            'success': True,
            'stats': stats,
            'timestamp': get_jakarta_time()
        })
        
    except Exception as e:
        log_error(f"Error in get_giveaway_stats: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== HEALTH CHECK ====================
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        user_count = db.get_user_count()
        giveaway_count = db.get_giveaway_count()
        
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


@chatid_bp.route('/api/chatid', methods=['POST'])
def save_chat_data():
    """Menyimpan data chat ID dari bot"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        chat_id = data.get('chat_id')
        if not chat_id:
            return jsonify({'error': 'chat_id is required'}), 400
        
        now = get_jakarta_time()
        cursor = db.get_cursor()
        
        # Simpan data chat
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
            data.get('chat_username'),
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
            # Hapus admin lama
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
        
        db.conn.commit()
        cursor.close()
        
        log_info(f"Chat data saved for ID: {chat_id}")
        return jsonify({'success': True, 'message': 'Chat data saved successfully'})
        
    except Exception as e:
        log_error(f"Error saving chat data: {e}")
        return jsonify({'error': str(e)}), 500

@chatid_bp.route('/api/chatid/<chat_id>', methods=['GET'])
def get_chat_data(chat_id):
    """Mendapatkan data chat berdasarkan ID"""
    try:
        cursor = db.get_cursor()
        
        cursor.execute("SELECT * FROM chatid_data WHERE chat_id = ?", (chat_id,))
        chat_data = cursor.fetchone()
        
        if not chat_data:
            cursor.close()
            return jsonify({'error': 'Chat not found'}), 404
        
        result = dict(chat_data)
        
        # Ambil data admin
        cursor.execute("""
        SELECT user_id, username, fullname, role 
        FROM chat_admins WHERE chat_id = ?
        """, (chat_id,))
        
        admins = cursor.fetchall()
        result['admins'] = [dict(admin) for admin in admins]
        
        cursor.close()
        return jsonify(result)
        
    except Exception as e:
        log_error(f"Error getting chat data: {e}")
        return jsonify({'error': str(e)}), 500

@chatid_bp.route('/api/chatid/username/<username>', methods=['GET'])
def get_chat_by_username(username):
    """Mendapatkan data chat berdasarkan username"""
    try:
        clean_username = username.replace('@', '')
        cursor = db.get_cursor()
        
        cursor.execute("SELECT * FROM chatid_data WHERE chat_username = ?", (clean_username,))
        chat_data = cursor.fetchone()
        
        if not chat_data:
            cursor.close()
            return jsonify({'error': 'Chat not found'}), 404
        
        result = dict(chat_data)
        
        # Ambil data admin
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

# app.py - Tambah di bagian CHATID ENDPOINTS

@chatid_bp.route('/api/chatid/fetch/<username>', methods=['GET'])
def fetch_chat_from_bot(username):
    """Memanggil bot untuk mengambil data channel/group secara langsung"""
    try:
        clean_username = username.replace('@', '')
        
        log_info(f"📡 Fetch requested for @{clean_username}")
        
        # Panggil fungsi sync dari bot (import module)
        try:
            # Import di sini supaya tidak circular import
            import importlib.util
            import sys
            
            # Load bot module
            spec = importlib.util.spec_from_file_location("bot_module", "b.py")
            bot_module = importlib.util.module_from_spec(spec)
            sys.modules["bot_module"] = bot_module
            spec.loader.exec_module(bot_module)
            
            # Panggil fungsi sync
            result = asyncio.run(bot_module.sync_channel_data(clean_username))
            
            if result and result.get('success'):
                return jsonify({
                    'success': True,
                    'message': f'Data untuk @{clean_username} berhasil diambil',
                    'data': result.get('data')
                })
            else:
                return jsonify({
                    'success': False,
                    'error': result.get('error', 'Gagal mengambil data channel')
                }), 404
                
        except Exception as e:
            log_error(f"Error calling bot sync: {e}")
            return jsonify({
                'success': False,
                'error': f'Gagal memanggil bot: {str(e)}'
            }), 500
        
    except Exception as e:
        log_error(f"Error fetching chat from bot: {e}")
        return jsonify({'error': str(e)}), 500

@chatid_bp.route('/api/chatid/search', methods=['GET'])
def search_chats():
    """Mencari chat berdasarkan query"""
    try:
        query = request.args.get('q', '')
        if not query:
            return jsonify({'error': 'Query parameter required'}), 400
            
        cursor = db.get_cursor()
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
    ╚══════════════════════════════════════════╝
    """)
    
    # Cek port availability
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
    print(f"\n📌 Press CTRL+C to stop\n")
    
    app.run(host=Config.HOST, port=port, debug=Config.DEBUG, threaded=True)

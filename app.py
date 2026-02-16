# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import socket
from config import Config
from database import Database
from utils import log_info, log_error, get_jakarta_time

# Inisialisasi Flask
app = Flask(__name__)

# Konfigurasi CORS
CORS(app, origins=Config.ALLOWED_ORIGINS, supports_credentials=True)

# Inisialisasi Database
db = Database()

# ==================== MIDDLEWARE ====================
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

# ==================== HELPER FUNCTIONS ====================
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

# ==================== ROOT ENDPOINT ====================
@app.route('/', methods=['GET'])
def index():
    """Root endpoint - API info"""
    return jsonify({
        'name': 'GiftFreebies API',
        'version': '1.0.0',
        'description': 'API untuk menyimpan data users',
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

# ==================== HEALTH CHECK ====================
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        user_count = db.get_user_count()
        
        return jsonify({
            'status': 'healthy',
            'timestamp': get_jakarta_time(),
            'server': 'giftfreebies-api',
            'version': '1.0.0',
            'database': {
                'connected': True,
                'users_count': user_count
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

# ==================== MAIN ====================
if __name__ == "__main__":
    print("""
    ╔══════════════════════════════════════════╗
    ║        🎁 GIFT FREEBIES API              ║
    ╠══════════════════════════════════════════╣
    ║  📦 Version: 1.0.0                       ║
    ║  🗄️  Database: SQLite3                    ║
    ║  👥 Feature: Users only                   ║
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
    print(f"\n📌 Press CTRL+C to stop\n")
    
    app.run(host=Config.HOST, port=port, debug=Config.DEBUG, threaded=True)

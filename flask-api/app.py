from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
from datetime import datetime
import pytz
import sys
import os
import threading
import asyncio
import random
import string

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from b import GiveawayDatabase, get_jakarta_time, generate_giveaway_id

app = Flask(__name__)

# CORS configuration - Allow GitHub Pages
CORS(app,
     origins=[
         "https://aldiprem.github.io",
         "http://localhost:5500",
         "http://127.0.0.1:5500",
         "http://localhost:3000"
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

# Inisialisasi database
db = GiveawayDatabase()

# API Routes

# Get user by ID
@app.route('/api/user/<int:user_id>', methods=['GET'])
def get_user(user_id):
    try:
        db.cur.execute("""
        SELECT user_id, fullname, username, phone_number, language_code, 
               is_premium, first_seen, last_seen, total_participations, total_wins
        FROM users WHERE user_id = ?
        """, (user_id,))
        user = db.cur.fetchone()
        
        if user:
            return jsonify({
                'user_id': user[0],
                'fullname': user[1],
                'username': user[2],
                'phone_number': user[3],
                'language_code': user[4],
                'is_premium': user[5],
                'first_seen': user[6],
                'last_seen': user[7],
                'total_participations': user[8],
                'total_wins': user[9],
                'avatar': f'https://via.placeholder.com/120?text={user[1][0]}'
            })
        else:
            return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get user stats
@app.route('/api/user/<int:user_id>/stats', methods=['GET'])
def get_user_stats(user_id):
    try:
        # Total giveaways created
        db.cur.execute("SELECT COUNT(*) FROM giveaways WHERE creator_user_id = ?", (user_id,))
        total_giveaways = db.cur.fetchone()[0]
        
        # Total participations
        db.cur.execute("SELECT COUNT(*) FROM participants WHERE user_id = ?", (user_id,))
        total_participations = db.cur.fetchone()[0]
        
        # Total wins
        db.cur.execute("SELECT COUNT(*) FROM winners WHERE user_id = ?", (user_id,))
        total_wins = db.cur.fetchone()[0]
        
        # Total tickets
        db.cur.execute("SELECT SUM(tickets) FROM participants WHERE user_id = ?", (user_id,))
        total_tickets = db.cur.fetchone()[0] or 0
        
        return jsonify({
            'total_giveaways': total_giveaways,
            'total_participations': total_participations,
            'total_wins': total_wins,
            'total_tickets': total_tickets
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get user's giveaways
@app.route('/api/user/<int:user_id>/giveaways', methods=['GET'])
def get_user_giveaways(user_id):
    try:
        db.cur.execute("""
        SELECT giveaway_id, prize, prize_description, giveaway_text, 
               participants_count, total_tickets, status, created_at, end_time
        FROM giveaways 
        WHERE creator_user_id = ?
        ORDER BY created_at DESC
        """, (user_id,))
        giveaways = db.cur.fetchall()
        
        result = []
        for g in giveaways:
            result.append({
                'giveaway_id': g[0],
                'prize': g[1],
                'prize_description': g[2],
                'giveaway_text': g[3],
                'participants_count': g[4],
                'total_tickets': g[5],
                'status': g[6],
                'created_at': g[7],
                'end_time': g[8]
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Create new giveaway
@app.route('/api/giveaways', methods=['POST'])
def create_giveaway():
    try:
        data = request.json
        
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
            
            return jsonify({
                'success': True,
                'giveaway_id': giveaway_id,
                'message': 'Giveaway created successfully'
            }), 201
        else:
            return jsonify({'error': 'Failed to create giveaway'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get giveaway by ID
@app.route('/api/giveaways/<giveaway_id>', methods=['GET'])
def get_giveaway(giveaway_id):
    try:
        db.cur.execute("""
        SELECT * FROM giveaways WHERE giveaway_id = ?
        """, (giveaway_id,))
        giveaway = db.cur.fetchone()
        
        if giveaway:
            # Get column names
            columns = [description[0] for description in db.cur.description]
            result = dict(zip(columns, giveaway))
            
            # Get participants count
            db.cur.execute("""
            SELECT COUNT(DISTINCT user_id), SUM(tickets) 
            FROM participants WHERE giveaway_id = ?
            """, (giveaway_id,))
            participants, total_tickets = db.cur.fetchone() or (0, 0)
            
            result['participants_count'] = participants or 0
            result['total_tickets'] = total_tickets or 0
            
            return jsonify(result)
        else:
            return jsonify({'error': 'Giveaway not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get all active giveaways
@app.route('/api/giveaways', methods=['GET'])
def get_all_giveaways():
    try:
        now = get_jakarta_time()
        db.cur.execute("""
        SELECT giveaway_id, prize, giveaway_text, participants_count, 
               total_tickets, status, end_time
        FROM giveaways 
        WHERE status = 'active' AND (end_time IS NULL OR end_time > ?)
        ORDER BY created_at DESC
        LIMIT 50
        """, (now,))
        giveaways = db.cur.fetchall()
        
        result = []
        for g in giveaways:
            result.append({
                'giveaway_id': g[0],
                'prize': g[1],
                'giveaway_text': g[2],
                'participants_count': g[3],
                'total_tickets': g[4],
                'status': g[5],
                'end_time': g[6]
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Search giveaways
@app.route('/api/giveaways/search', methods=['GET'])
def search_giveaways():
    try:
        query = request.args.get('q', '')
        if len(query) < 3:
            return jsonify([])
        
        db.cur.execute("""
        SELECT giveaway_id, prize, giveaway_text, participants_count, 
               status, end_time
        FROM giveaways 
        WHERE prize LIKE ? OR giveaway_text LIKE ?
        ORDER BY created_at DESC
        LIMIT 20
        """, (f'%{query}%', f'%{query}%'))
        giveaways = db.cur.fetchall()
        
        result = []
        for g in giveaways:
            result.append({
                'giveaway_id': g[0],
                'prize': g[1],
                'giveaway_text': g[2],
                'participants_count': g[3],
                'status': g[4],
                'end_time': g[5]
            })
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Join giveaway
@app.route('/api/giveaways/<giveaway_id>/join', methods=['POST'])
def join_giveaway(giveaway_id):
    try:
        data = request.json
        user_id = data.get('user_id')
        fullname = data.get('fullname')
        username = data.get('username')
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        # Check if giveaway exists and is active
        db.cur.execute("""
        SELECT status, end_time, max_tickets_per_user 
        FROM giveaways WHERE giveaway_id = ?
        """, (giveaway_id,))
        giveaway = db.cur.fetchone()
        
        if not giveaway:
            return jsonify({'error': 'Giveaway not found'}), 404
        
        status, end_time, max_tickets = giveaway
        
        if status != 'active':
            return jsonify({'error': 'Giveaway is not active'}), 400
        
        if end_time and end_time < get_jakarta_time():
            return jsonify({'error': 'Giveaway has ended'}), 400
        
        # Check if user already joined
        db.cur.execute("""
        SELECT tickets FROM participants 
        WHERE giveaway_id = ? AND user_id = ?
        """, (giveaway_id, user_id))
        existing = db.cur.fetchone()
        
        if existing and existing[0] >= max_tickets:
            return jsonify({'error': 'Maximum tickets reached'}), 400
        
        # Add participant
        tickets = 1
        success = db.add_participant(giveaway_id, user_id, fullname, username, tickets)
        
        if success:
            # Add user if not exists
            db.add_user(user_id, fullname, username)
            
            return jsonify({
                'success': True,
                'tickets': tickets,
                'message': 'Successfully joined giveaway'
            })
        else:
            return jsonify({'error': 'Failed to join giveaway'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Check if user participated
@app.route('/api/giveaways/<giveaway_id>/participants/<int:user_id>', methods=['GET'])
def check_participation(giveaway_id, user_id):
    try:
        db.cur.execute("""
        SELECT id FROM participants 
        WHERE giveaway_id = ? AND user_id = ?
        """, (giveaway_id, user_id))
        
        participated = db.cur.fetchone() is not None
        
        return jsonify({
            'participated': participated
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Health check
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'timestamp': get_jakarta_time()
    })

# Run Flask app
def run_flask():
    app.run(host="0.0.0.0", port=5000, debug=False, threaded=True)

if __name__ == "__main__":
    print("✅ Flask API started on port 5000")
    run_flask()

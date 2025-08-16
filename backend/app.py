import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import jwt
from datetime import datetime, timedelta

# --- App Initialization ---
app = Flask(__name__)
# এটি খুবই গুরুত্বপূর্ণ! আপনার নিজের একটি কঠিন SECRET_KEY দিন।
# Render-এ এটিকে Environment Variable হিসেবে সেট করা ভালো।
app.config['SECRET_KEY'] = 'your-very-secret-and-hard-to-guess-key'
CORS(app) # ফ্রন্টএন্ড থেকে API কল করার অনুমতি দেয়।

# --- ইন-মেমোরি ডামি ডাটাবেস (আপাতত ব্যবহারের জন্য) ---
# সার্ভার রিস্টার্ট হলে এই ডেটা মুছে যাবে।
users = {} # উদাহরণ: {'user1': {'password': 'pass1'}}
bots = {}  # উদাহরণ: {'user1': ['bot_token_1', 'bot_token_2']}

# --- Helper Function for Token ---
def token_required(f):
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            # হেডার থেকে টোকেন আলাদা করা (Bearer <token>)
            token = request.headers['Authorization'].split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            # টোকেন ভেরিফাই করা
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = data['username']
        except Exception as e:
            return jsonify({'message': 'Token is invalid!', 'error': str(e)}), 401
            
        return f(current_user, *args, **kwargs)
    decorated.__name__ = f.__name__
    return decorated

# --- API Routes ---

@app.route('/')
def home():
    return jsonify({"status": "ok", "message": "OpenBotHost API is running!"})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required!'}), 400

    if username in users:
        return jsonify({'message': 'User already exists!'}), 409

    users[username] = {'password': password}
    return jsonify({'message': 'User registered successfully!'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = users.get(username)
    if not user or user['password'] != password:
        return jsonify({'message': 'Invalid credentials!'}), 401

    # লগইন সফল হলে একটি JWT টোকেন তৈরি করা হবে
    token = jwt.encode({
        'username': username,
        'exp': datetime.utcnow() + timedelta(hours=24) # টোকেন ২৪ ঘণ্টা পর এক্সপায়ার হবে
    }, app.config['SECRET_KEY'], algorithm="HS256")

    return jsonify({'token': token})

@app.route('/api/bots', methods=['GET', 'POST'])
@token_required
def manage_bots(current_user):
    # GET রিকোয়েস্টের জন্য
    if request.method == 'GET':
        user_bots = bots.get(current_user, [])
        return jsonify({'bots': user_bots})

    # POST রিকোয়েস্টের জন্য
    if request.method == 'POST':
        data = request.get_json()
        bot_token = data.get('bot_token')
        if not bot_token:
            return jsonify({'message': 'Bot token is missing!'}), 400

        if current_user not in bots:
            bots[current_user] = []
        
        bots[current_user].append(bot_token)
        return jsonify({'message': 'Bot added successfully!'}), 201

# --- Gunicorn-এর জন্য এই অংশটির দরকার নেই, কিন্তু Termux-এ সরাসরি চালানোর জন্য দরকারি ---
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

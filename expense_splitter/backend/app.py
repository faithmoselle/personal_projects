from flask import Flask, request, jsonify
from flask_cors import CORS
from calculator import calculate_split
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# In-memory storage (replace with database for production)
sessions = {}

@app.route('/api/create_session', methods=['POST'])
def create_session():
    """Create a new expense splitting session"""
    session_id = f"session_{len(sessions) + 1}"
    sessions[session_id] = {
        'participants': [],
        'items': [],
        'created_at': datetime.now().isoformat()
    }
    return jsonify({'session_id': session_id})

@app.route('/api/add_participant', methods=['POST'])
def add_participant():
    """Add participant to session"""
    data = request.json
    session_id = data.get('session_id')
    
    if session_id not in sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    participant = {
        'id': len(sessions[session_id]['participants']) + 1,
        'name': data['name'],
        'email': data.get('email', ''),
        'share': data.get('share', 100)
    }
    
    sessions[session_id]['participants'].append(participant)
    return jsonify({'success': True, 'participant': participant})

@app.route('/api/add_item', methods=['POST'])
def add_item():
    """Add expense item to session"""
    data = request.json
    session_id = data.get('session_id')
    
    item = {
        'id': len(sessions[session_id]['items']) + 1,
        'description': data['description'],
        'price': float(data['price']),
        'payer': data['payer'],
        'participants': data.get('participants', []),
        'category': data.get('category', 'other')
    }
    
    sessions[session_id]['items'].append(item)
    return jsonify({'success': True, 'item': item})

@app.route('/api/calculate/<session_id>', methods=['GET'])
def calculate(session_id):
    """Calculate splits for a session"""
    if session_id not in sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    session = sessions[session_id]
    debts = calculate_split(session['participants'], session['items'])
    
    # Calculate totals
    total = sum(item['price'] for item in session['items'])
    
    return jsonify({
        'total': total,
        'debts': debts,
        'summary': generate_summary(debts, session['participants'])
    })

@app.route('/api/export/<session_id>', methods=['GET'])
def export_session(session_id):
    """Export session data as JSON"""
    if session_id not in sessions:
        return jsonify({'error': 'Session not found'}), 404
    
    return jsonify(sessions[session_id])

if __name__ == '__main__':
    app.run(debug=True, port=5000)
from flask import Flask, render_template, request, jsonify
from datetime import datetime
import json
import os
#new import
import atexit
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, time

app = Flask(__name__, static_folder='static', template_folder='templates')

# File for storing data
DATA_FILE = 'meal_data.json'

def load_data():
    """Load meal data from file"""
    try:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r') as f:
                return json.load(f)
    except:
        pass
    return []

def save_data(data):
    """Save meal data to file"""
    try:
        with open(DATA_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except:
        return False

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/today-data')
def get_today_data():
    """Get today's meal data"""
    try:
        today = datetime.now().strftime('%Y-%m-%d')
        all_data = load_data()
        today_data = [meal for meal in all_data if meal.get('date') == today]
        
        return jsonify({
            'success': True, 
            'data': today_data
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/api/save-preference', methods=['POST'])
def save_preference():
    """Save meal preference"""
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        meal_id = data.get('mealId', '').strip()
        breakfast = data.get('breakfast', '0')
        night_meal = data.get('nightMeal', '0')
        
        if not name or not meal_id:
            return jsonify({'success': False, 'error': 'Name and Meal ID are required'})
        
        today = datetime.now().strftime('%Y-%m-%d')
        timestamp = datetime.now().isoformat()
        
        # Load existing data
        all_data = load_data()
        
        # Remove existing entry for this meal ID today
        all_data = [meal for meal in all_data 
                   if not (meal.get('mealId') == meal_id and meal.get('date') == today)]
        
        # Add new entry
        new_meal = {
            'timestamp': timestamp,
            'name': name,
            'mealId': meal_id,
            'breakfast': breakfast,
            'nightMeal': night_meal,
            'date': today
        }
        
        all_data.append(new_meal)
        
        # Save to file
        if save_data(all_data):
            return jsonify({
                'success': True, 
                'message': 'Preferences saved successfully!'
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to save data'})
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

def clear_old_data():
    """Clear data older than today at 11:59 PM"""
    try:
        today = datetime.now().strftime('%Y-%m-%d')
        all_data = load_data()
        
        # Keep only today's data
        today_data = [meal for meal in all_data if meal.get('date') == today]
        
        if len(today_data) < len(all_data):
            save_data(today_data)
            print(f"✅ Cleared old data. Kept {len(today_data)} entries for today.")
    
    except Exception as e:
        print(f"❌ Error clearing old data: {e}")

def schedule_daily_clear():
    """Schedule daily data clearing at 11:59 PM"""
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        func=clear_old_data,
        trigger='cron',
        hour=23,
        minute=59,
        id='clear_old_data'
    )
    scheduler.start()
    atexit.register(lambda: scheduler.shutdown())

@app.route('/api/generate-id')
def generate_id():
    """Generate a unique meal ID"""
    import random
    import string
    timestamp = str(int(datetime.now().timestamp()))[-6:]
    random_chars = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
    meal_id = f"M{timestamp}{random_chars}"
    return jsonify({'success': True, 'mealId': meal_id})

@app.route('/api/test-connection')
def test_connection():
    """Test connection"""
    return jsonify({'success': True, 'message': 'Python Flask server is running!'})
# Schedule daily data clearing
schedule_daily_clear()
if __name__ == '__main__':
    print("🚀 Python Flask Meal Manager running at http://localhost:5000")
    print("💾 Using local file storage (meal_data.json)")
    app.run(debug=True, port=5000)
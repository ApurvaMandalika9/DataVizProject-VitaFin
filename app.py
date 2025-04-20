# Import required libraries
from flask import Flask, request, jsonify, render_template
from healthapi import health_api
from budgetapi import budget_api
import json, os

# Initialize Flask application
app = Flask(__name__)
app.register_blueprint(health_api, url_prefix='/api') # Register health API blueprint
app.register_blueprint(budget_api, url_prefix='/api/budget') # Register budget API blueprint

# File paths for JSON data
HEALTH_FILE = 'health.json'
BUDGET_FILE = 'budget.json'
REFERENCE_HEALTH_FILE = 'reference_health.json'

# To load JSON data from the given file path. If the file doesn't exist, initialize it with an empty list
def load_json(path):
    if not os.path.exists(path):
        with open(path, 'w') as f:
            json.dump([], f)
    with open(path, 'r') as f:
        return json.load(f)

# To save the given data to the specified file path in JSON format
def save_json(path, data):
    with open(path, 'w') as f:
        json.dump(data, f, indent=4)

# To render the homepage
@app.route('/')
def index():
    return render_template('index.html')

# To receive and store submitted health data into health.json
@app.route('/add-health', methods=['POST'])
def add_health():
    data = load_json(HEALTH_FILE)
    data.append(request.json)
    save_json(HEALTH_FILE, data)
    return jsonify({'message': 'Health data added successfully.'})

# To receive and store submitted budget data into budget.json
@app.route('/add-budget', methods=['POST'])
def add_budget():
    data = load_json(BUDGET_FILE)
    data.append(request.json)
    save_json(BUDGET_FILE, data)
    return jsonify({'message': 'Budget data added successfully.'})

# To render the health dashboard page
@app.route('/health')
def health():
    return render_template('health.html')

# To render the budget dashboard page
@app.route('/budget')
def budget():
    return render_template('budget.html')

# API endpoint to retrieve reference health data from reference_health.json
@app.route('/api/reference-health')
def get_reference_health():
    return jsonify(load_json(REFERENCE_HEALTH_FILE))

#To render the form page for user data entry.
@app.route('/form')
def form():
    return render_template('form.html')

if __name__ == '__main__':
    app.run(debug=True)

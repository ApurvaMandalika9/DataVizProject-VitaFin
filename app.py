from flask import Flask, render_template, request, jsonify
import json

app = Flask(__name__)

# Paths to each data file
HEALTH_FILE = 'health.json'
BUDGET_FILE = 'budget.json'
REFERENCE_HEALTH_FILE = 'reference_health.json'

# Generic data handlers
def load_json(path):
    with open(path, 'r') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w') as f:
        json.dump(data, f, indent=4)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/add-health', methods=['POST'])
def add_health():
    data = load_json(HEALTH_FILE)
    data.append(request.json)
    save_json(HEALTH_FILE, data)
    return jsonify({'message': 'Health data added'})

@app.route('/add-budget', methods=['POST'])
def add_budget():
    data = load_json(BUDGET_FILE)
    data.append(request.json)
    save_json(BUDGET_FILE, data)
    return jsonify({'message': 'Budget data added'})

@app.route('/api/health')
def get_health():
    return jsonify(load_json(HEALTH_FILE))

@app.route('/health')
def health():
    return render_template('health.html')

@app.route('/api/budget')
def get_budget():
    return jsonify(load_json(BUDGET_FILE))

@app.route('/budget')
def budget():
    return render_template('budget.html')

@app.route('/api/reference-health')
def get_reference_health():
    return jsonify(load_json(REFERENCE_HEALTH_FILE))

@app.route('/form')
def form():
    return render_template('form.html')

if __name__ == '__main__':
    app.run(debug=True)

# Data APIs for Health Visualizations

from flask import Blueprint, request, jsonify
from datetime import datetime
from collections import defaultdict
import json
import os

# Creating a Flask Blueprint for health-related API routes
health_api = Blueprint('health_api', __name__)

# File paths
HEALTH_FILE = 'health.json'
REFERENCE_HEALTH_FILE = 'reference_health.json'

# Loading user health data from HEALTH_FILE. If the file does not exist, create it with an empty list.
def load_data():
    if not os.path.exists(HEALTH_FILE):
        with open(HEALTH_FILE, 'w') as f:
            json.dump([], f)
    with open(HEALTH_FILE, 'r') as f:
        return json.load(f)

# Loading reference health data from REFERENCE_HEALTH_FILE. If not found, return an empty dictionary.
def load_reference():
    if not os.path.exists(REFERENCE_HEALTH_FILE):
        return {}
    with open(REFERENCE_HEALTH_FILE, 'r') as f:
        return json.load(f)

# Computing average value for a given key from the reference dataset.
def compute_reference_average(ref_data, key):
    values = [d[key] for d in ref_data if key in d]
    return round(sum(values) / len(values), 2) if values else None

# API endpoint to retrieve all stored health records.
@health_api.route('/health', methods=['GET'])
def get_health():
    return jsonify(load_data())

# API endpoint to retrieve steps trend data (daily, monthly, or yearly) and reference average steps.
@health_api.route('/health/steps-trend', methods=['GET'])
def steps_trend():
    data = load_data()
    ref_data = load_reference()
    ref_avg = compute_reference_average(ref_data, "steps")
    start_str = request.args.get('start')
    end_str = request.args.get('end')
    view = request.args.get('view', 'daily')

    try:
        start_date = datetime.strptime(start_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_str, '%Y-%m-%d')
    except Exception:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    # Filter records in range
    filtered = [
        entry for entry in data
        if start_str <= entry["date"] <= end_str and "steps" in entry
    ]

    from collections import defaultdict

    if view in ("daily", "monthly"):
        # Daily values for every date
        result = [
            { "date": entry["date"], "steps": entry["steps"] }
            for entry in filtered
        ]

    elif view == "yearly":
        # Average per month
        monthly_grouped = defaultdict(list)
        for entry in filtered:
            month = entry["date"][:7]  # YYYY-MM
            monthly_grouped[month].append(entry["steps"])

        result = [
            {
                "month": month,
                "average_steps": round(sum(values) / len(values), 2)
            }
            for month, values in sorted(monthly_grouped.items())
        ]

    else:
        return jsonify({"error": "Invalid view type. Use 'daily', 'monthly', or 'yearly'."}), 400

    return jsonify({
        "reference_average": ref_avg,
        "trend": result  
    })

# API endpoint to retrieve heart rate trend data (daily, monthly, or yearly) and reference average heart rate.
@health_api.route('/health/heart-rate-trend', methods=['GET'])
def heart_rate_trend():
    data = load_data()
    ref_data = load_reference()
    ref_avg = compute_reference_average(ref_data, "heart_rate")
    start_str = request.args.get('start')
    end_str = request.args.get('end')
    view = request.args.get('view', 'daily')

    try:
        start_date = datetime.strptime(start_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_str, '%Y-%m-%d')
    except Exception:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    filtered = [
        entry for entry in data
        if start_str <= entry["date"] <= end_str and "heart_rate" in entry
    ]

    from collections import defaultdict

    if view in ("daily", "monthly"):
        # Return heart rate per day (for daily/monthly trend lines)
        result = [
            { "date": entry["date"], "heart_rate": entry["heart_rate"] }
            for entry in filtered
        ]

    elif view == "yearly":
        grouped = defaultdict(list)
        for entry in filtered:
            month = entry["date"][:7]  # YYYY-MM
            grouped[month].append(entry["heart_rate"])

        result = [
            {
                "month": month,
                "average_heart_rate": round(sum(hr_list) / len(hr_list), 2)
            }
            for month, hr_list in sorted(grouped.items())
        ]

    else:
        return jsonify({"error": "Invalid view type. Use 'daily', 'monthly', or 'yearly'."}), 400

    return jsonify({
        "reference_average": ref_avg,
        "trend": result 
    })

# API endpoint to retrieve sleep hours trend data (daily, monthly, or yearly) and reference average sleep hours.
@health_api.route('/health/sleep-trend', methods=['GET'])
def sleep_trend():
    data = load_data()
    ref_data = load_reference()
    ref_avg = compute_reference_average(ref_data, "sleep_hours") 
    start_str = request.args.get('start')
    end_str = request.args.get('end')
    view = request.args.get('view', 'daily')

    if not start_str or not end_str:
        return jsonify({"error": "Missing 'start' or 'end' parameter."}), 400

    try:
        start_date = datetime.strptime(start_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_str, '%Y-%m-%d')
    except Exception:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    filtered = [
        entry for entry in data
        if start_str <= entry["date"] <= end_str and "sleep_hours" in entry
    ]

    if view in ("daily", "monthly"):
        result = [
            { "date": entry["date"], "sleep_hours": entry["sleep_hours"] }
            for entry in filtered
        ]
    elif view == "yearly":
        from collections import defaultdict
        grouped = defaultdict(list)
        for entry in filtered:
            month = entry["date"][:7]
            grouped[month].append(entry["sleep_hours"])
        result = [
            {
                "month": month,
                "average_sleep_hours": round(sum(sleeps) / len(sleeps), 2)
            }
            for month, sleeps in sorted(grouped.items())
        ]
    else:
        return jsonify({"error": "Invalid view type. Use 'daily', 'monthly', or 'yearly'."}), 400

    return jsonify({
        "reference_average": ref_avg,
        "trend": result
    })

# API endpoint to retrieve BMI trend data (daily, monthly, or yearly) and reference average BMI.
@health_api.route('/health/bmi-trend', methods=['GET'])
def bmi_trend():
    data = load_data()
    ref_data = load_reference()
    ref_avg = compute_reference_average(ref_data, "bmi")
    start_str = request.args.get('start')
    end_str = request.args.get('end')
    view = request.args.get('view', 'daily')

    if not start_str or not end_str:
        return jsonify({"error": "Missing 'start' or 'end' parameter."}), 400

    try:
        start_date = datetime.strptime(start_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_str, '%Y-%m-%d')
    except Exception:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    filtered = [
        entry for entry in data
        if start_str <= entry["date"] <= end_str and "bmi" in entry
    ]

    if view in ("daily", "monthly"):
        result = [
            { "date": entry["date"], "bmi": entry["bmi"] }
            for entry in filtered
        ]
    elif view == "yearly":
        from collections import defaultdict
        grouped = defaultdict(list)
        for entry in filtered:
            month = entry["date"][:7]
            grouped[month].append(entry["bmi"])
        result = [
            {
                "month": month,
                "average_bmi": round(sum(bmis) / len(bmis), 2)
            }
            for month, bmis in sorted(grouped.items())
        ]
    else:
        return jsonify({"error": "Invalid view type. Use 'daily', 'monthly', or 'yearly'."}), 400

    return jsonify({
        "reference_average": ref_avg,
        "trend": result 
    })


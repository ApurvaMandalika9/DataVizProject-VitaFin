# budgetapi.py

# Flask Blueprint providing API routes for budget data management and visualization.
# Supports expense breakdowns, income-expense comparisons, and net balance trends for driving financial insights on the dashboard.

from flask import Blueprint, request, jsonify
from datetime import datetime
from collections import defaultdict
import os
import json

# Defining a Flask Blueprint for budget APIs
budget_api = Blueprint('budget_api', __name__)

# Path to the user's financial records file
BUDGET_FILE = 'budget.json'

# Loading user's budget data from the JSON file. If the file does not exist, initialize it with an empty list.
def load_budget_data():
    if not os.path.exists(BUDGET_FILE):
        with open(BUDGET_FILE, 'w') as f:
            json.dump([], f)
    with open(BUDGET_FILE, 'r') as f:
        return json.load(f)

# Returning all budget entries to the client as JSON. Used for listing all raw financial records.
@budget_api.route('/budget', methods=['GET'])
def get_budget():
    return jsonify(load_budget_data())

# 1. Expense Distribution by Category: /expense-categories

# Returning total expenses grouped by category for a specified date range. Supports pie chart visualization of spending patterns.
@budget_api.route('/expense-categories', methods=['GET'])
def expense_category_pie():
    data = load_budget_data()
    start = request.args.get('start') # Query parameter: start date
    end = request.args.get('end') # Query parameter: end date

    # Filtering expenses within the date range
    filtered = [
        entry for entry in data
        if entry["type"] == "expense" and start <= entry["date"] <= end
    ]

    # Aggregating expenses by category
    category_totals = defaultdict(float)
    for entry in filtered:
        category_totals[entry["category"]] += entry["amount"]

    # Preparing response for pie chart
    result = [{"category": cat, "total": round(amount, 2)} for cat, amount in category_totals.items()]
    return jsonify(result)

# 2. Income vs Expense Aggregation: /income-vs-expense

# Returning aggregated totals of income and expenses for a given date range. 
@budget_api.route('/income-vs-expense', methods=['GET'])
def income_vs_expense_pie():
    data = load_budget_data()
    start = request.args.get('start')
    end = request.args.get('end')

    income = 0
    expense = 0

    # Aggregating income and expenses separately
    for entry in data:
        if start <= entry["date"] <= end:
            if entry["type"] == "income":
                income += entry["amount"]
            elif entry["type"] == "expense":
                expense += entry["amount"]

    # Preparing response for pie chart
    result = [
        { "type": "income", "total": round(income, 2) },
        { "type": "expense", "total": round(expense, 2) }
    ]
    return jsonify(result)

# 3. Net Balance Trend Over Time: /net-trend

# Returning aggregated totals of income and expenses for a given date range. 
@budget_api.route('/net-trend', methods=['GET'])
def net_trend():
    data = load_budget_data()
    start_str = request.args.get('start') # Query parameter: start date
    end_str = request.args.get('end') # Query parameter: end date
    view = request.args.get('view', 'daily') # 'daily', 'monthly', or 'yearly'

    # Validating and parsing date strings
    try:
        start_date = datetime.strptime(start_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_str, '%Y-%m-%d')
    except:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    # Filtering entries within the given date range
    data = [d for d in data if start_str <= d["date"] <= end_str]

    # Grouping entries based on the selected view
    grouped = defaultdict(lambda: {"income": 0, "expense": 0})

    for entry in data:
        key = entry["date"] # Default: daily view
        if view == "monthly":
            key = entry["date"][:7] # YYYY-MM
        elif view == "yearly":
            key = entry["date"][:4] # YYYY

        if entry["type"] == "income":
            grouped[key]["income"] += entry["amount"]
        elif entry["type"] == "expense":
            grouped[key]["expense"] += entry["amount"]

    # Calculating cumulative net balance over time
    result = []
    cumulative = 0
    for key in sorted(grouped):
        income = grouped[key]["income"]
        expense = grouped[key]["expense"]
        net = income - expense
        cumulative += net
        result.append({
            view: key,
            "net_balance": round(cumulative, 2),
            "income": round(income, 2),
            "expense": round(expense, 2)
        })

    return jsonify(result)
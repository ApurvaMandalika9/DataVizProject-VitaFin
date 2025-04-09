# budgetapi.py

from flask import Blueprint, request, jsonify
from datetime import datetime
from collections import defaultdict
import os
import json

budget_api = Blueprint('budget_api', __name__)
BUDGET_FILE = 'budget.json'

def load_budget_data():
    if not os.path.exists(BUDGET_FILE):
        with open(BUDGET_FILE, 'w') as f:
            json.dump([], f)
    with open(BUDGET_FILE, 'r') as f:
        return json.load(f)

@budget_api.route('/budget', methods=['GET'])
def get_budget():
    return jsonify(load_budget_data())

# 1. Expense Pie Chart by Category
@budget_api.route('/expense-categories', methods=['GET'])
def expense_category_pie():
    data = load_budget_data()
    start = request.args.get('start')
    end = request.args.get('end')

    filtered = [
        entry for entry in data
        if entry["type"] == "expense" and start <= entry["date"] <= end
    ]

    category_totals = defaultdict(float)
    for entry in filtered:
        category_totals[entry["category"]] += entry["amount"]

    result = [{"category": cat, "total": round(amount, 2)} for cat, amount in category_totals.items()]
    return jsonify(result)

# 2. Pie Chart: Income vs Expense
@budget_api.route('/income-vs-expense', methods=['GET'])
def income_vs_expense_pie():
    data = load_budget_data()
    start = request.args.get('start')
    end = request.args.get('end')

    income = 0
    expense = 0

    for entry in data:
        if start <= entry["date"] <= end:
            if entry["type"] == "income":
                income += entry["amount"]
            elif entry["type"] == "expense":
                expense += entry["amount"]

    result = [
        { "type": "income", "total": round(income, 2) },
        { "type": "expense", "total": round(expense, 2) }
    ]
    return jsonify(result)

# 3. Net Balance Trend (daily, monthly, yearly)
@budget_api.route('/net-trend', methods=['GET'])
def net_trend():
    data = load_budget_data()
    start_str = request.args.get('start')
    end_str = request.args.get('end')
    view = request.args.get('view', 'daily')

    try:
        start_date = datetime.strptime(start_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_str, '%Y-%m-%d')
    except:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    # Filter relevant data
    data = [d for d in data if start_str <= d["date"] <= end_str]

    grouped = defaultdict(lambda: {"income": 0, "expense": 0})

    for entry in data:
        key = entry["date"]
        if view == "monthly":
            key = entry["date"][:7]
        elif view == "yearly":
            key = entry["date"][:4]

        if entry["type"] == "income":
            grouped[key]["income"] += entry["amount"]
        elif entry["type"] == "expense":
            grouped[key]["expense"] += entry["amount"]

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
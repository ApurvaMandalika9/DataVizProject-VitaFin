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

# 1. Expense Pie Chart by Category
@budget_api.route('/budget/expense-categories', methods=['GET'])
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
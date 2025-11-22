from flask import Flask, request, jsonify, send_from_directory
import json, os
from datetime import datetime

app = Flask(__name__)

DATA_FILE = "meal_data.json"


# -------------------------
# Utility
# -------------------------
def load_data():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, "r") as f:
        try:
            return json.load(f)
        except:
            return []


def save_data(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=4)


def today():
    return datetime.now().strftime("%Y-%m-%d")


# -------------------------
# ROUTES
# -------------------------
@app.route("/")
def home():
    return send_from_directory(".", "index.html")


@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory("static", path)


@app.route("/get_today")
def get_today():
    data = load_data()
    today_entries = [d for d in data if d["date"] == today()]
    return jsonify({"success": True, "data": today_entries})


@app.route("/save", methods=["POST"])
def save():
    name = request.form.get("name")
    breakfast = request.form.get("breakfast")
    night = request.form.get("nightMeal")

    if not name:
        return jsonify({"success": False, "message": "Name required"})

    data = load_data()
    today_date = today()

    # Check if entry exists (replace)
    for d in data:
        if d["name"].lower() == name.lower() and d["date"] == today_date:
            d["breakfast"] = breakfast
            d["nightMeal"] = night
            save_data(data)
            return jsonify({"success": True, "message": "Updated"})

    # Insert new entry
    new_entry = {
        "name": name,
        "breakfast": breakfast,
        "nightMeal": night,
        "date": today_date
    }

    data.append(new_entry)
    save_data(data)
    return jsonify({"success": True, "message": "Saved"})


@app.route("/delete", methods=["POST"])
def delete():
    name = request.form.get("name")

    data = load_data()
    today_date = today()

    data = [d for d in data if not (d["name"].lower() == name.lower() and d["date"] == today_date)]
    save_data(data)

    return jsonify({"success": True, "message": "Deleted"})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")

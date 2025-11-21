from flask import Flask, request, jsonify
import sqlite3
from datetime import datetime
import os

app = Flask(__name__)
DB_PATH = "data.db"

#initalize db
def init_db():
    if not os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("""
            CREATE TABLE measurements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                current_measurement REAL NOT NULL,
                voltage_measurement REAL NOT NULL
            )
        """)
        conn.commit()
        conn.close()

#insert data into db
def insert_measurement(current_val, voltage_val):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M:%S")

    c.execute("""
        INSERT INTO measurements (date, time, current_measurement, voltage_measurement)
        VALUES (?, ?, ?, ?)
    """, (date_str, time_str, current_val, voltage_val))
    conn.commit()
    conn.close()

@app.route("/api/esp/ping", methods=["POST"])
def receive_from_esp():
    try:
        data = request.get_json(force=True)
        current_val = float(data.get("current", 0.0))
        voltage_val = float(data.get("voltage", 0.0))

        insert_measurement(current_val, voltage_val)
        return jsonify(status="ok")
    except:
        return jsonify(status="error"), 400


@app.route("/api/data", methods=["GET"])
def get_data():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        SELECT date, time, current_measurement, voltage_measurement
        FROM measurements
        ORDER BY id DESC LIMIT 50
    """)
    rows = c.fetchall()
    conn.close()

    results = [
        {"date": r[0], "time": r[1], "current": r[2], "voltage": r[3]}
        for r in rows
    ]
    return jsonify(results)

#This route is used to check if the front end switch is on or off
@app.route("/api/switch", methods=["POST"])
def update_switch():
    data = request.get_json()

    port = data.get("port")
    state = data.get("state")  # True / False

    print(f"Switch update: Port {port} is now {'ON' if state else 'OFF'}")

    # TODO: Handle your Pi hardware logic here

    return jsonify({"success": True, "port": port, "state": state})



if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=False)
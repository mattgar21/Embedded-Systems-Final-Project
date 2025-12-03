from flask import Flask, request, jsonify
import sqlite3
from datetime import datetime, timedelta
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

DB_PATH = "data.db"


relay1_state = True
relay2_state = True


# ---------- Initialize DB ----------
def init_db():
    if not os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("""
            CREATE TABLE measurements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                s1_current REAL NOT NULL,
                s1_voltage REAL NOT NULL,
                s2_current REAL NOT NULL,
                s2_voltage REAL NOT NULL
            )
        """)
        conn.commit()
        conn.close()
        print("Created new data.db with s1/s2 columns")
    else:
        print("Using existing data.db")


# ---------- Insert one row of measurements ----------
def insert_measurement(s1_current, s1_voltage, s2_current, s2_voltage):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    now = datetime.now()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M:%S")

    c.execute("""
        INSERT INTO measurements (
            date, time,
            s1_current, s1_voltage,
            s2_current, s2_voltage
        )
        VALUES (?, ?, ?, ?, ?, ?)
    """, (date_str, time_str,
          s1_current, s1_voltage,
          s2_current, s2_voltage))
    conn.commit()
    conn.close()


# ---------- Endpoint ESP32 posts sensor data to ----------
@app.route("/api/esp/ping", methods=["POST"])
def receive_from_esp():
    try:
        data = request.get_json(force=True)
        # Expecting JSON like:
        # {
        #   "s1c": 123.45,
        #   "s1v": 5.01,
        #   "s2c": 456.78,
        #   "s2v": 4.98
        # }

        s1_current = float(data.get("s1c", 0.0))
        s1_voltage = float(data.get("s1v", 0.0))
        s2_current = float(data.get("s2c", 0.0))
        s2_voltage = float(data.get("s2v", 0.0))

        print(f"ESP data -> S1: I={s1_current}mA V={s1_voltage}V | "
              f"S2: I={s2_current}mA V={s2_voltage}V")

        insert_measurement(s1_current, s1_voltage, s2_current, s2_voltage)

        # You *could* also return relay states here if you want the ESP
        # to read them from the POST response.
        from app import relay1_state, relay2_state  # noqa: F401 (for clarity)
        return jsonify(
            status="ok",
            relay1=relay1_state,
            relay2=relay2_state
        )
    except Exception as e:
        print("Error in /api/esp/ping:", e)
        return jsonify(status="error"), 400


# ---------- Endpoint to fetch last X hours of data ----------
@app.route("/api/data", methods=["GET"])
def get_data():
    """
    Returns all measurements from the last 24 hours (by default).
    You can override with ?hours=12 etc if you want later.
    """
    hours = float(request.args.get("hours", 24))

    # Cutoff timestamp
    cutoff_dt = datetime.now() - timedelta(hours=hours)
    cutoff_str = cutoff_dt.strftime("%Y-%m-%d %H:%M:%S")

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    # Combine date + time in SQLite and compare as datetime
    c.execute("""
        SELECT date, time,
               s1_current, s1_voltage,
               s2_current, s2_voltage
        FROM measurements
        WHERE datetime(date || ' ' || time) >= ?
        ORDER BY date, time
    """, (cutoff_str,))
    rows = c.fetchall()
    conn.close()

    results = [
        {
            "date": r[0],
            "time": r[1],
            "s1_current": r[2],
            "s1_voltage": r[3],
            "s2_current": r[4],
            "s2_voltage": r[5],
        }
        for r in rows
    ]
    return jsonify(results)


# ---------- Endpoint to fetch latest row ----------
@app.route("/api/latest", methods=["GET"])
def get_latest():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        SELECT date, time,
               s1_current, s1_voltage,
               s2_current, s2_voltage
        FROM measurements
        ORDER BY id DESC
        LIMIT 1
    """)
    row = c.fetchone()
    conn.close()

    if not row:
        return jsonify({"has_data": False})

    return jsonify({
        "has_data": True,
        "date": row[0],
        "time": row[1],
        "s1_current": row[2],
        "s1_voltage": row[3],
        "s2_current": row[4],
        "s2_voltage": row[5],
    })


# ---------- Relay state API (frontend + ESP32 read from here) ----------
@app.route("/api/relays", methods=["GET"])
def get_relays():
    global relay1_state, relay2_state
    return jsonify({
        "relay1": relay1_state,
        "relay2": relay2_state,
    })


# ---------- Switch endpoint (frontend writes here) ----------
@app.route("/api/switch", methods=["POST", "OPTIONS", "GET"])
def update_switch():
    global relay1_state, relay2_state

    # CORS preflight
    if request.method == "OPTIONS":
        return jsonify({"status": "OK"}), 200

    # Allow GET to just read current states (optional, similar to /api/relays)
    if request.method == "GET":
        return jsonify({
            "relay1": relay1_state,
            "relay2": relay2_state,
        })

    # POST from frontend
    data = request.get_json()
    port = data.get("port")
    state = data.get("state")

    # state from React is already boolean True/False
    if port == 1:
        relay1_state = bool(state)
    elif port == 2:
        relay2_state = bool(state)

    print(
        f"Switch update from frontend -> "
        f"Relay1={relay1_state}, Relay2={relay2_state}"
    )

    return jsonify({
        "success": True,
        "relay1": relay1_state,
        "relay2": relay2_state,
    })


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=False)

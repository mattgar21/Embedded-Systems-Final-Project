# app.py
from flask import Flask, request, jsonify

app = Flask(__name__)


@app.post("/api/esp/ping")
def esp_ping():

    data = request.get_json(silent=True) or {}
    print("ESP32 said:", data)  # you'll see this in the Pi terminal
    return jsonify({"ok": True, "received": data})

if __name__ == "__main__":
    # listen on all interfaces so devices on LAN can reach it
    app.run(host="0.0.0.0", port=5000)

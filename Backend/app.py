# app.py
from flask import Flask, request, jsonify
from datetime import datetime, timezone
from sqlalchemy import create_engine, Integer, String, DateTime, Float
from sqlalchemy.orm import DeclarativeBase, mapped_column, Mapped, sessionmaker

app = Flask(__name__)

DB_URL = "sqlite:///esp.db"  # change to 'postgresql+psycopg://user:pass@host/dbname'
engine = create_engine(DB_URL, echo=False, future=True)

# Enable WAL (SQLite) for better concurrency
if DB_URL.startswith("sqlite"):
    with engine.connect() as conn:
        conn.exec_driver_sql("PRAGMA journal_mode=WAL;")
        conn.exec_driver_sql("PRAGMA synchronous=NORMAL;")

SessionLocal = sessionmaker(bind=engine, expire_on_commit=False, future=True)

class Base(DeclarativeBase):
    pass

class Ping(Base):
    __tablename__ = "pings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    device_id: Mapped[str] = mapped_column(String(64), index=True, nullable=True)
    msg: Mapped[str] = mapped_column(String(255), nullable=True)
    rssi: Mapped[float] = mapped_column(Float, nullable=True)
    ip: Mapped[str] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str] = mapped_column(String(255), nullable=True)

Base.metadata.create_all(engine)

@app.get("/health")
def health():
    return {"ok": True}

# @app.post("/api/esp/ping")
# def esp_ping():
#     data = request.get_json(silent=True) or {}
#     # minimal validation
#     #device_id = str(data.get("device_id") or "")
#     msg = str(data.get("msg") or "")
#     print("Da message: " +msg)
#     rssi = data.get("rssi")
#     ip = request.headers.get("X-Forwarded-For", request.remote_addr)
#     ua = request.headers.get("User-Agent")

#     with SessionLocal() as s:
#         s.add(Ping(msg=msg, rssi=rssi, ip=ip, user_agent=ua))
#         s.commit()

#   return jsonify({"ok": True, "saved": True})

@app.post("/api/esp/ping")
def esp_ping():
    data = request.get_json(silent=True) or {}
<<<<<<< HEAD
    print("ESP32:", data)  
    return jsonify({"ok": True, "received": data})
=======

    print("Received JSON:", data, flush=True)
    msg = data.get("msg")
    print("Message:", msg, flush=True)



    rssi = data.get("rssi")

    # with SessionLocal() as s:
    #     s.add(Ping(msg=msg, rssi=rssi))
    #     s.commit()

    return jsonify({"ok": True, "saved": True})

>>>>>>> a024e7a8cf3172411af04da1c1a65145163d7a2d

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)

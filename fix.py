import sqlite3
conn = sqlite3.connect('flask-backend/instance/data.db')
cursor = conn.cursor()
try:
    cursor.execute("ALTER TABLE orders ADD COLUMN refunded_at DATETIME")
    cursor.execute("ALTER TABLE orders ADD COLUMN refund_amount FLOAT")
    conn.commit()
    print("✅ Fixed! Restart Flask now.")
except:
    print("Columns may already exist. Check Flask logs.")
conn.close()

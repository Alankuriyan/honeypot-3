const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./honeypot.db", (err) => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("Connected to SQLite database");
    }
});

db.run(`
    CREATE TABLE IF NOT EXISTS deception_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER,
        record_id INTEGER,
        file_name TEXT,
        file_path TEXT,
        user_name TEXT,
        process_name TEXT,
        access_type TEXT,
        event_time TEXT,
        severity TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) {
        console.error("Table creation failed:", err.message);
    } else {
        console.log("deception_events table ready");
    }
});

module.exports = db;
const express = require("express");
const cors = require("cors");

const db = require("./database");

const app = express();

app.use(cors());
app.use(express.json());


// ============================================
// TEST ROUTE
// ============================================

app.get("/", (req, res) => {
    res.json({
        status: "online",
        message: "Honeypot API server is running"
    });
});


// ============================================
// RECEIVE DECEPTION EVENT
// ============================================

app.post("/api/events", (req, res) => {

    const {
        event_id,
        record_id,
        file_name,
        file_path,
        user_name,
        process_name,
        access_type,
        event_time,
        severity
    } = req.body;

    const sql = `
        INSERT INTO deception_events
        (
            event_id,
            record_id,
            file_name,
            file_path,
            user_name,
            process_name,
            access_type,
            event_time,
            severity
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(
        sql,
        [
            event_id,
            record_id,
            file_name,
            file_path,
            user_name,
            process_name,
            access_type,
            event_time,
            severity
        ],
        function(err) {

            if (err) {
                console.error("Database insert error:", err.message);

                return res.status(500).json({
                    success: false,
                    error: err.message
                });
            }

            console.log("🚨 Event stored:", file_name);

            res.status(201).json({
                success: true,
                message: "Event stored successfully",
                id: this.lastID
            });
        }
    );
});


// ============================================
// GET ALL EVENTS
// ============================================

app.get("/api/events", (req, res) => {

    const sql = `
        SELECT *
        FROM deception_events
        ORDER BY id DESC
    `;

    db.all(sql, [], (err, rows) => {

        if (err) {
            return res.status(500).json({
                success: false,
                error: err.message
            });
        }

        res.json(rows);
    });
});


// ============================================
// GET STATISTICS
// ============================================

app.get("/api/stats", (req, res) => {

    const queries = {
        total_events: `
            SELECT COUNT(*) AS count
            FROM deception_events
        `,

        unique_decoys: `
            SELECT COUNT(DISTINCT file_name) AS count
            FROM deception_events
        `,

        unique_users: `
            SELECT COUNT(DISTINCT user_name) AS count
            FROM deception_events
        `,

        unique_processes: `
            SELECT COUNT(DISTINCT process_name) AS count
            FROM deception_events
        `
    };

    const stats = {};

    db.get(queries.total_events, [], (err, row) => {

        if (err) {
            return res.status(500).json({ error: err.message });
        }

        stats.total_events = row.count;

        db.get(queries.unique_decoys, [], (err, row) => {

            stats.unique_decoys = row.count;

            db.get(queries.unique_users, [], (err, row) => {

                stats.unique_users = row.count;

                db.get(queries.unique_processes, [], (err, row) => {

                    stats.unique_processes = row.count;

                    res.json(stats);
                });
            });
        });
    });
});


// ============================================
// START SERVER
// ============================================

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`🚀 Honeypot API running on http://localhost:${PORT}`);
});
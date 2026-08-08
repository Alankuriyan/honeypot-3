const sqlite3 = require("sqlite3").verbose();


// ============================================
// DATABASE CONNECTION
// ============================================

const db = new sqlite3.Database(
    "./honeypot.db",
    (err) => {

        if (err) {

            console.error(
                "Database connection failed:",
                err.message
            );

        } else {

            console.log(
                "Connected to SQLite database"
            );

        }

    }
);


// ============================================
// CREATE EVENTS TABLE
// ============================================

db.run(
`
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

    risk_score INTEGER DEFAULT 0,

    risk_level TEXT DEFAULT 'UNKNOWN',

    risk_reasons TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP

)
`,
(err) => {

    if (err) {

        console.error(
            "Table creation failed:",
            err.message
        );

    } else {

        console.log(
            "deception_events table ready"
        );

        addRiskColumns();

    }

});


// ============================================
// DATABASE MIGRATION
//
// Adds risk-analysis columns to an existing
// database without deleting old events.
// ============================================

function addRiskColumns() {

    const migrations = [

        {
            name: "risk_score",
            sql:
            `ALTER TABLE deception_events
             ADD COLUMN risk_score INTEGER DEFAULT 0`
        },

        {
            name: "risk_level",
            sql:
            `ALTER TABLE deception_events
             ADD COLUMN risk_level TEXT DEFAULT 'UNKNOWN'`
        },

        {
            name: "risk_reasons",
            sql:
            `ALTER TABLE deception_events
             ADD COLUMN risk_reasons TEXT`
        }

    ];


    let completed = 0;


    migrations.forEach(
        migration => {

            db.run(
                migration.sql,
                (err) => {

                    if (err) {

                        /*
                         If the column already exists,
                         SQLite returns an error.

                         That is okay.
                        */

                        if (
                            !err.message.includes(
                                "duplicate column name"
                            )
                        ) {

                            console.log(
                                `Migration ${migration.name}:`,
                                err.message
                            );

                        }

                    } else {

                        console.log(
                            `Added column: ${migration.name}`
                        );

                    }


                    completed++;


                    if (
                        completed ===
                        migrations.length
                    ) {

                        console.log(
                            "Database migration complete"
                        );

                    }

                }
            );

        }
    );

}


// ============================================
// EXPORT DATABASE
// ============================================

module.exports = db;
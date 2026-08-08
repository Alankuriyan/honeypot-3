const express = require("express");
const cors = require("cors");

const db = require("./database");

const app = express();

app.use(cors());
app.use(express.json());


// ============================================
// RISK LEVEL FUNCTION
// ============================================

function determineRiskLevel(score) {

    if (score >= 85) {
        return "CRITICAL";
    }

    if (score >= 70) {
        return "HIGH";
    }

    if (score >= 40) {
        return "MEDIUM";
    }

    return "LOW";
}


// ============================================
// RISK ANALYSIS ENGINE
// ============================================

function calculateRisk(event, callback) {

    let score = 0;
    let reasons = [];

    const process = (
        event.process_name || ""
    ).toLowerCase();

    const fileName = (
        event.file_name || ""
    ).toLowerCase();

    const access = (
        event.access_type || ""
    ).toLowerCase();


    // ========================================
    // 1. SUSPICIOUS PROCESSES
    // ========================================

    const suspiciousProcesses = [
        "powershell.exe",
        "cmd.exe",
        "wscript.exe",
        "cscript.exe",
        "mshta.exe",
        "rundll32.exe",
        "regsvr32.exe",
        "certutil.exe",
        "bitsadmin.exe"
    ];

    const suspiciousProcessFound =
        suspiciousProcesses.some(
            processName =>
                process.includes(processName)
        );


    if (suspiciousProcessFound) {

        score += 30;

        reasons.push(
            "Suspicious process detected"
        );

    }


    // ========================================
    // 2. CREDENTIAL DECOYS
    // ========================================

    const credentialKeywords = [
        "password",
        "credential",
        "vpn",
        "login",
        "secret",
        "token",
        "api_key",
        "apikey",
        "private_key"
    ];


    const credentialDecoy =
        credentialKeywords.some(
            keyword =>
                fileName.includes(keyword)
        );


    if (credentialDecoy) {

        score += 25;

        reasons.push(
            "Credential-related decoy accessed"
        );

    }


    // ========================================
    // 3. SENSITIVE DECOYS
    // ========================================

    const sensitiveKeywords = [
        "customer",
        "employee",
        "salary",
        "financial",
        "database",
        "backup",
        "confidential",
        "hr",
        "network"
    ];


    const sensitiveDecoy =
        sensitiveKeywords.some(
            keyword =>
                fileName.includes(keyword)
        );


    if (sensitiveDecoy) {

        score += 15;

        reasons.push(
            "Sensitive decoy accessed"
        );

    }


    // ========================================
    // 4. WRITE / DELETE ACCESS
    // ========================================

    const writeOrDelete =
        access.includes("write") ||
        access.includes("delete");


    if (writeOrDelete) {

        score += 20;

        reasons.push(
            "Write or delete access detected"
        );

    }


    // ========================================
    // 5. BEHAVIORAL COMBINATION
    //
    // Credential decoy + suspicious process
    // is more dangerous than either indicator
    // individually.
    // ========================================

    if (
        credentialDecoy &&
        suspiciousProcessFound
    ) {

        score += 20;

        reasons.push(
            "Credential decoy accessed using suspicious process"
        );

    }


    // ========================================
    // 6. SENSITIVE DECOY + SUSPICIOUS PROCESS
    // ========================================

    if (
        sensitiveDecoy &&
        suspiciousProcessFound &&
        !credentialDecoy
    ) {

        score += 10;

        reasons.push(
            "Sensitive decoy accessed using suspicious process"
        );

    }


    // ========================================
    // 7. RECENT ACTIVITY
    // ========================================

    const recentQuery = `
        SELECT COUNT(*) AS count
        FROM deception_events
        WHERE created_at >= datetime('now', '-60 seconds')
    `;


    db.get(
        recentQuery,
        [],
        (err, row) => {

            if (err) {

                console.error(
                    "Risk analysis error:",
                    err.message
                );

                if (score < 0) {
                    score = 0;
                }

                if (score > 100) {
                    score = 100;
                }

                return callback(
                    score,
                    reasons,
                    determineRiskLevel(score)
                );

            }


            const recentEvents =
                row ? row.count : 0;


            // =================================
            // MULTIPLE DECOYS
            // =================================

            if (recentEvents >= 3) {

                score += 15;

                reasons.push(
                    "Multiple decoys accessed recently"
                );

            }


            // =================================
            // HIGH FREQUENCY
            // =================================

            if (recentEvents >= 6) {

                score += 10;

                reasons.push(
                    "High-frequency decoy activity"
                );

            }


            // =================================
            // 8. BENIGN PROCESSES
            // =================================

            const benignProcesses = [
                "explorer.exe",
                "notepad.exe",
                "wordpad.exe"
            ];


            const isBenign =
                benignProcesses.some(
                    processName =>
                        process.includes(processName)
                );


            if (
                isBenign &&
                !suspiciousProcessFound &&
                !credentialDecoy
            ) {

                score -= 15;

                reasons.push(
                    "Known benign application"
                );

            }


            // =================================
            // 9. CAP SCORE
            // =================================

            if (score < 0) {
                score = 0;
            }

            if (score > 100) {
                score = 100;
            }


            // =================================
            // 10. DETERMINE RISK
            // =================================

            const riskLevel =
                determineRiskLevel(score);


            // =================================
            // 11. DEFAULT REASON
            // =================================

            if (reasons.length === 0) {

                reasons.push(
                    "No significant suspicious indicators"
                );

            }


            // =================================
            // RETURN RESULT
            // =================================

            callback(
                score,
                reasons,
                riskLevel
            );

        }
    );

}


// ============================================
// TEST ROUTE
// ============================================

app.get("/", (req, res) => {

    res.json({

        status: "online",

        message:
            "Honeypot API server is running",

        risk_engine:
            "active"

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


    // ========================================
    // BASIC VALIDATION
    // ========================================

    if (!file_name || !file_path) {

        return res.status(400).json({

            success: false,

            error:
                "file_name and file_path are required"

        });

    }


    const event = {

        event_id,
        record_id,
        file_name,
        file_path,
        user_name,
        process_name,
        access_type,
        event_time,
        severity

    };


    // ========================================
    // CALCULATE RISK
    // ========================================

    calculateRisk(

        event,

        (
            riskScore,
            riskReasons,
            riskLevel
        ) => {


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
                    severity,
                    risk_score,
                    risk_level,
                    risk_reasons
                )

                VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

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
                    severity,

                    riskScore,

                    riskLevel,

                    JSON.stringify(
                        riskReasons
                    )

                ],

                function(err) {

                    if (err) {

                        console.error(
                            "Database insert error:",
                            err.message
                        );


                        return res.status(500).json({

                            success: false,

                            error:
                                err.message

                        });

                    }


                    // =================================
                    // SERVER LOG
                    // =================================

                    console.log(
                        "===================================="
                    );

                    console.log(
                        "🚨 DECEPTION EVENT"
                    );

                    console.log(
                        "File:",
                        file_name
                    );

                    console.log(
                        "Process:",
                        process_name
                    );

                    console.log(
                        `Risk: ${riskScore}/100`
                    );

                    console.log(
                        `Level: ${riskLevel}`
                    );

                    console.log(
                        "Reasons:",
                        riskReasons.join(
                            " | "
                        )
                    );

                    console.log(
                        "===================================="
                    );


                    // =================================
                    // RESPONSE
                    // =================================

                    res.status(201).json({

                        success: true,

                        message:
                            "Event stored successfully",

                        id:
                            this.lastID,

                        risk_score:
                            riskScore,

                        risk_level:
                            riskLevel,

                        risk_reasons:
                            riskReasons

                    });

                }

            );

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


    db.all(

        sql,

        [],

        (err, rows) => {

            if (err) {

                return res.status(500).json({

                    success: false,

                    error:
                        err.message

                });

            }


            res.json(rows);

        }

    );

});


// ============================================
// GET SINGLE EVENT
// ============================================

app.get("/api/events/:id", (req, res) => {

    const sql = `

        SELECT *

        FROM deception_events

        WHERE id = ?

    `;


    db.get(

        sql,

        [req.params.id],

        (err, row) => {

            if (err) {

                return res.status(500).json({

                    success: false,

                    error:
                        err.message

                });

            }


            if (!row) {

                return res.status(404).json({

                    success: false,

                    error:
                        "Event not found"

                });

            }


            res.json(row);

        }

    );

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

            SELECT COUNT(
                DISTINCT file_name
            ) AS count

            FROM deception_events

        `,


        unique_users: `

            SELECT COUNT(
                DISTINCT user_name
            ) AS count

            FROM deception_events

        `,


        unique_processes: `

            SELECT COUNT(
                DISTINCT process_name
            ) AS count

            FROM deception_events

        `,


        critical_events: `

            SELECT COUNT(*) AS count

            FROM deception_events

            WHERE risk_level = 'CRITICAL'

        `,


        high_risk_events: `

            SELECT COUNT(*) AS count

            FROM deception_events

            WHERE risk_level = 'HIGH'

        `,


        medium_risk_events: `

            SELECT COUNT(*) AS count

            FROM deception_events

            WHERE risk_level = 'MEDIUM'

        `,


        low_risk_events: `

            SELECT COUNT(*) AS count

            FROM deception_events

            WHERE risk_level = 'LOW'

        `,


        average_risk: `

            SELECT
                ROUND(
                    AVG(risk_score),
                    2
                ) AS average

            FROM deception_events

        `

    };


    const stats = {};


    // ========================================
    // TOTAL EVENTS
    // ========================================

    db.get(

        queries.total_events,

        [],

        (err, row) => {

            if (err) {

                return res.status(500).json({
                    error: err.message
                });

            }


            stats.total_events =
                row.count;


            // =================================
            // UNIQUE DECOYS
            // =================================

            db.get(

                queries.unique_decoys,

                [],

                (err, row) => {

                    if (err) {

                        return res.status(500).json({
                            error: err.message
                        });

                    }


                    stats.unique_decoys =
                        row.count;


                    // =============================
                    // UNIQUE USERS
                    // =============================

                    db.get(

                        queries.unique_users,

                        [],

                        (err, row) => {

                            if (err) {

                                return res.status(500).json({
                                    error: err.message
                                });

                            }


                            stats.unique_users =
                                row.count;


                            // =========================
                            // UNIQUE PROCESSES
                            // =========================

                            db.get(

                                queries.unique_processes,

                                [],

                                (err, row) => {

                                    if (err) {

                                        return res.status(500).json({
                                            error: err.message
                                        });

                                    }


                                    stats.unique_processes =
                                        row.count;


                                    // =====================
                                    // CRITICAL
                                    // =====================

                                    db.get(

                                        queries.critical_events,

                                        [],

                                        (err, row) => {

                                            if (err) {

                                                return res.status(500).json({
                                                    error: err.message
                                                });

                                            }


                                            stats.critical_events =
                                                row.count;


                                            // =================
                                            // HIGH
                                            // =================

                                            db.get(

                                                queries.high_risk_events,

                                                [],

                                                (err, row) => {

                                                    if (err) {

                                                        return res.status(500).json({
                                                            error: err.message
                                                        });

                                                    }


                                                    stats.high_risk_events =
                                                        row.count;


                                                    // ==============
                                                    // MEDIUM
                                                    // ==============

                                                    db.get(

                                                        queries.medium_risk_events,

                                                        [],

                                                        (err, row) => {

                                                            if (err) {

                                                                return res.status(500).json({
                                                                    error: err.message
                                                                });

                                                            }


                                                            stats.medium_risk_events =
                                                                row.count;


                                                            // ============
                                                            // LOW
                                                            // ============

                                                            db.get(

                                                                queries.low_risk_events,

                                                                [],

                                                                (err, row) => {

                                                                    if (err) {

                                                                        return res.status(500).json({
                                                                            error: err.message
                                                                        });

                                                                    }


                                                                    stats.low_risk_events =
                                                                        row.count;


                                                                    // ==================
                                                                    // AVERAGE RISK
                                                                    // ==================

                                                                    db.get(

                                                                        queries.average_risk,

                                                                        [],

                                                                        (err, row) => {

                                                                            if (err) {

                                                                                return res.status(500).json({
                                                                                    error: err.message
                                                                                });

                                                                            }


                                                                            stats.average_risk =
                                                                                row.average || 0;


                                                                            // ==================
                                                                            // FINAL RESPONSE
                                                                            // ==================

                                                                            res.json(
                                                                                stats
                                                                            );

                                                                        }

                                                                    );

                                                                }

                                                            );

                                                        }

                                                    );

                                                }

                                            );

                                        }

                                    );

                                }

                            );

                        }

                    );

                }

            );

        }

    );

});


// ============================================
// START SERVER
// ============================================

const PORT = 3000;

app.listen(

    PORT,

    () => {

        console.log(
            "===================================="
        );

        console.log(
            "🚀 HONEYPOT API SERVER"
        );

        console.log(
            `API: http://localhost:${PORT}`
        );

        console.log(
            "Risk Engine: ACTIVE"
        );

        console.log(
            "===================================="
        );

    }

);
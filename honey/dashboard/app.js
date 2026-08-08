// ============================================
// CONFIGURATION
// ============================================

const API_URL = "http://localhost:3000";


// ============================================
// DOM ELEMENTS
// ============================================

const totalEvents =
    document.getElementById("totalEvents");

const uniqueDecoys =
    document.getElementById("uniqueDecoys");

const uniqueUsers =
    document.getElementById("uniqueUsers");

const uniqueProcesses =
    document.getElementById("uniqueProcesses");

const eventsTable =
    document.getElementById("eventsTable");

const eventCount =
    document.getElementById("eventCount");

const decoyList =
    document.getElementById("decoyList");

const processList =
    document.getElementById("processList");

const lastUpdate =
    document.getElementById("lastUpdate");

const refreshBtn =
    document.getElementById("refreshBtn");


// ============================================
// RISK STATISTICS ELEMENTS
// ============================================
//
// These are optional.
// If the HTML elements don't exist yet,
// the dashboard will continue working.
//
// We will add them to HTML later.
// ============================================

const criticalEvents =
    document.getElementById("criticalEvents");

const highRiskEvents =
    document.getElementById("highRiskEvents");

const mediumRiskEvents =
    document.getElementById("mediumRiskEvents");

const lowRiskEvents =
    document.getElementById("lowRiskEvents");


// ============================================
// FETCH EVENTS
// ============================================

async function fetchEvents() {

    try {

        const response = await fetch(
            `${API_URL}/api/events`
        );


        if (!response.ok) {

            throw new Error(
                "Failed to fetch events"
            );

        }


        const events =
            await response.json();


        displayEvents(events);

        generateDecoyStatistics(events);

        generateProcessStatistics(events);


    }

    catch (error) {

        console.error(
            "Event fetch error:",
            error
        );


        eventsTable.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="loading"
                >

                    ❌ Could not connect to API

                </td>

            </tr>

        `;

    }

}


// ============================================
// FETCH STATISTICS
// ============================================

async function fetchStats() {

    try {

        const response = await fetch(
            `${API_URL}/api/stats`
        );


        if (!response.ok) {

            throw new Error(
                "Failed to fetch statistics"
            );

        }


        const stats =
            await response.json();


        // ------------------------------------
        // EXISTING STATISTICS
        // ------------------------------------

        totalEvents.textContent =
            stats.total_events;

        uniqueDecoys.textContent =
            stats.unique_decoys;

        uniqueUsers.textContent =
            stats.unique_users;

        uniqueProcesses.textContent =
            stats.unique_processes;


        // ------------------------------------
        // RISK STATISTICS
        // ------------------------------------

        if (criticalEvents) {

            criticalEvents.textContent =
                stats.critical_events || 0;

        }


        if (highRiskEvents) {

            highRiskEvents.textContent =
                stats.high_risk_events || 0;

        }


        if (mediumRiskEvents) {

            mediumRiskEvents.textContent =
                stats.medium_risk_events || 0;

        }


        if (lowRiskEvents) {

            lowRiskEvents.textContent =
                stats.low_risk_events || 0;

        }


    }

    catch (error) {

        console.error(
            "Statistics error:",
            error
        );

    }

}


// ============================================
// DISPLAY EVENTS
// ============================================

function displayEvents(events) {

    eventCount.textContent =
        `${events.length} events`;


    if (!events.length) {

        eventsTable.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="loading"
                >

                    No security events detected

                </td>

            </tr>

        `;

        return;

    }


    // ----------------------------------------
    // SHOW NEWEST FIRST
    // ----------------------------------------

    const recentEvents =
        events.slice(0, 20);


    eventsTable.innerHTML =
        recentEvents.map(event => {


            // --------------------------------
            // TIME
            // --------------------------------

            const time =
                formatDate(
                    event.event_time
                );


            // --------------------------------
            // PROCESS
            // --------------------------------

            const process =
                getProcessName(
                    event.process_name
                );


            // --------------------------------
            // SEVERITY
            // --------------------------------

            const severity =
                event.severity || "HIGH";


            // --------------------------------
            // RISK
            // --------------------------------

            const riskScore =
                event.risk_score ?? 0;


            const riskLevel =
                event.risk_level ||
                "UNKNOWN";


            // --------------------------------
            // RISK REASONS
            // --------------------------------

            const riskReasons =
                formatRiskReasons(
                    event.risk_reasons
                );


            return `

                <tr>

                    <!-- TIME -->

                    <td class="time-cell">

                        ${escapeHTML(time)}

                    </td>


                    <!-- FILE -->

                    <td class="file-cell">

                        ${escapeHTML(
                            event.file_name
                        )}

                    </td>


                    <!-- USER -->

                    <td>

                        ${escapeHTML(
                            event.user_name
                        )}

                    </td>


                    <!-- PROCESS -->

                    <td
                        class="process-cell"
                        title="${escapeHTML(
                            event.process_name
                        )}"
                    >

                        ${escapeHTML(process)}

                    </td>


                    <!-- ACCESS -->

                    <td>

                        ${escapeHTML(
                            event.access_type
                        )}

                    </td>


                    <!-- SEVERITY -->

                    <td>

                        <span
                            class="severity
                            ${severity.toLowerCase()}"
                        >

                            ${escapeHTML(
                                severity
                            )}

                        </span>

                    </td>


                    <!-- RISK -->

                    <td
                        class="risk-cell"
                        title="${escapeHTML(
                            riskReasons
                        )}"
                    >

                        <div
                            class="risk-score
                            ${getRiskClass(
                                riskLevel
                            )}"
                        >

                            ${escapeHTML(
                                String(riskScore)
                            )}

                        </div>


                        <div
                            class="risk-level"
                        >

                            ${escapeHTML(
                                riskLevel
                            )}

                        </div>

                    </td>

                </tr>

            `;

        }).join("");

}


// ============================================
// RISK CLASS
// ============================================

function getRiskClass(level) {

    if (!level) {

        return "unknown";

    }


    return String(level)
        .toLowerCase();

}


// ============================================
// FORMAT RISK REASONS
// ============================================

function formatRiskReasons(value) {

    if (!value) {

        return "No risk analysis available";

    }


    try {

        const reasons =
            JSON.parse(value);


        if (Array.isArray(reasons)) {

            return reasons.join(
                " | "
            );

        }


    }

    catch {

        return String(value);

    }


    return String(value);

}


// ============================================
// DECOY STATISTICS
// ============================================

function generateDecoyStatistics(events) {

    const counts = {};


    events.forEach(event => {

        const name =
            event.file_name ||
            "Unknown";


        counts[name] =
            (counts[name] || 0) + 1;

    });


    const sorted =
        Object.entries(counts)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )
            .slice(0, 8);


    if (!sorted.length) {

        decoyList.innerHTML = `

            <div class="loading">

                No decoy activity

            </div>

        `;

        return;

    }


    const max =
        sorted[0][1];


    decoyList.innerHTML =
        sorted.map(
            ([name, count]) => {


                const percentage =
                    (count / max) * 100;


                return `

                    <div
                        class="decoy-item"
                    >

                        <div
                            class="decoy-name"
                        >

                            ${escapeHTML(name)}

                        </div>


                        <div
                            class="progress-container"
                        >

                            <div
                                class="progress"
                                style="
                                    width:
                                    ${percentage}%
                                "
                            ></div>

                        </div>


                        <div
                            class="decoy-count"
                        >

                            ${count}

                            access${count !== 1
                                ? "es"
                                : ""}

                        </div>

                    </div>

                `;

            }
        ).join("");

}


// ============================================
// PROCESS STATISTICS
// ============================================

function generateProcessStatistics(events) {

    const counts = {};


    events.forEach(event => {

        const process =
            getProcessName(
                event.process_name
            );


        counts[process] =
            (counts[process] || 0) + 1;

    });


    const sorted =
        Object.entries(counts)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            )
            .slice(0, 8);


    if (!sorted.length) {

        processList.innerHTML = `

            <div class="loading">

                No process activity

            </div>

        `;

        return;

    }


    processList.innerHTML =
        sorted.map(
            ([process, count]) => {


                return `

                    <div
                        class="process-item"
                    >

                        <div
                            class="process-icon"
                        >

                            ⚙️

                        </div>


                        <div
                            class="process-name"
                            title="${escapeHTML(
                                process
                            )}"
                        >

                            ${escapeHTML(
                                process
                            )}

                        </div>


                        <div
                            class="process-count"
                        >

                            ${count}

                        </div>

                    </div>

                `;

            }
        ).join("");

}


// ============================================
// GET PROCESS FILE NAME
// ============================================

function getProcessName(path) {

    if (!path) {

        return "Unknown";

    }


    const parts =
        path.split("\\");


    return parts[
        parts.length - 1
    ] || path;

}


// ============================================
// FORMAT WINDOWS DATE
// ============================================

function formatDate(value) {

    if (!value) {

        return "Unknown";

    }


    try {

        /*
         Windows PowerShell returns:

         /Date(1786144225809)/
        */

        const match =
            String(value).match(
                /\/Date\((\d+)\)\//
            );


        if (match) {

            const date =
                new Date(
                    Number(match[1])
                );


            return date.toLocaleString();

        }


        const date =
            new Date(value);


        if (
            !isNaN(
                date.getTime()
            )
        ) {

            return date.toLocaleString();

        }


        return value;

    }

    catch {

        return value;

    }

}


// ============================================
// HTML SECURITY
// ============================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================
// UPDATE TIME
// ============================================

function updateLastUpdate() {

    const now =
        new Date();


    lastUpdate.textContent =
        now.toLocaleTimeString();

}


// ============================================
// REFRESH EVERYTHING
// ============================================

async function refreshDashboard() {

    refreshBtn.textContent =
        "↻ Loading...";


    refreshBtn.disabled = true;


    await Promise.all([

        fetchEvents(),

        fetchStats()

    ]);


    updateLastUpdate();


    refreshBtn.textContent =
        "↻ Refresh";


    refreshBtn.disabled =
        false;

}


// ============================================
// MANUAL REFRESH
// ============================================

refreshBtn.addEventListener(
    "click",
    refreshDashboard
);


// ============================================
// INITIAL LOAD
// ============================================

refreshDashboard();


// ============================================
// LIVE REFRESH
//
// Every 3 seconds the dashboard asks
// the API for new data.
// ============================================

setInterval(
    refreshDashboard,
    3000
);
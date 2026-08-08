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

        const events = await response.json();

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
                    colspan="6"
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

        const stats = await response.json();

        totalEvents.textContent =
            stats.total_events;

        uniqueDecoys.textContent =
            stats.unique_decoys;

        uniqueUsers.textContent =
            stats.unique_users;

        uniqueProcesses.textContent =
            stats.unique_processes;

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
                    colspan="6"
                    class="loading"
                >
                    No security events detected
                </td>
            </tr>
        `;

        return;

    }


    // Show newest first
    const recentEvents =
        events.slice(0, 20);


    eventsTable.innerHTML =
        recentEvents.map(event => {

            const time =
                formatDate(event.event_time);


            const process =
                getProcessName(
                    event.process_name
                );


            const severity =
                event.severity || "HIGH";


            return `

                <tr>

                    <td class="time-cell">
                        ${escapeHTML(time)}
                    </td>


                    <td class="file-cell">
                        ${escapeHTML(
                            event.file_name
                        )}
                    </td>


                    <td>
                        ${escapeHTML(
                            event.user_name
                        )}
                    </td>


                    <td
                        class="process-cell"
                        title="${escapeHTML(
                            event.process_name
                        )}"
                    >
                        ${escapeHTML(process)}
                    </td>


                    <td>
                        ${escapeHTML(
                            event.access_type
                        )}
                    </td>


                    <td>

                        <span
                            class="severity ${severity.toLowerCase()}"
                        >
                            ${escapeHTML(
                                severity
                            )}
                        </span>

                    </td>

                </tr>

            `;

        }).join("");

}


// ============================================
// DECOY STATISTICS
// ============================================

function generateDecoyStatistics(events) {

    const counts = {};


    events.forEach(event => {

        const name =
            event.file_name || "Unknown";

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

                    <div class="decoy-item">

                        <div class="decoy-name">
                            ${escapeHTML(name)}
                        </div>

                        <div
                            class="progress-container"
                        >

                            <div
                                class="progress"
                                style="width: ${percentage}%"
                            ></div>

                        </div>

                        <div class="decoy-count">

                            ${count}
                            access${count !== 1 ? "es" : ""}

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

                    <div class="process-item">

                        <div class="process-icon">
                            ⚙️
                        </div>

                        <div
                            class="process-name"
                            title="${escapeHTML(process)}"
                        >
                            ${escapeHTML(process)}
                        </div>

                        <div class="process-count">
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

    refreshBtn.disabled = false;

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
import subprocess
import json
import time
import requests

from pathlib import Path
from datetime import datetime


# ============================================
# CONFIGURATION
# ============================================

BASE_DIR = Path(__file__).parent.resolve()

REGISTRY_FILE = BASE_DIR / "decoy_registry.json"
LOG_FILE = BASE_DIR / "access_log.txt"
STATE_FILE = BASE_DIR / "monitor_state.json"

# Express API
SERVER_URL = "http://localhost:3000/api/events"


# ============================================
# LOAD LAST EVENT ID
# ============================================

def load_last_event_id():

    if not STATE_FILE.exists():
        return 0

    try:

        with open(
            STATE_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            data = json.load(file)

            return data.get(
                "last_record_id",
                0
            )

    except Exception as error:

        print(
            "State load error:",
            error
        )

        return 0


# ============================================
# SAVE LAST EVENT ID
# ============================================

def save_last_event_id(record_id):

    try:

        with open(
            STATE_FILE,
            "w",
            encoding="utf-8"
        ) as file:

            json.dump(
                {
                    "last_record_id": record_id
                },
                file,
                indent=4
            )

    except Exception as error:

        print(
            "State save error:",
            error
        )


# ============================================
# LOAD DECOYS
# ============================================

def get_decoy_files():

    decoys = []

    if not REGISTRY_FILE.exists():

        print(
            "Registry not found:",
            REGISTRY_FILE
        )

        return decoys

    try:

        with open(
            REGISTRY_FILE,
            "r",
            encoding="utf-8-sig"
        ) as file:

            registry = json.load(file)

        # Handle single object
        if isinstance(
            registry,
            dict
        ):

            registry = [registry]

        for entry in registry:

            path_value = entry.get(
                "Path"
            )

            if not path_value:
                continue

            path = Path(
                path_value
            ).resolve()

            if path.exists():

                decoys.append(
                    path
                )

    except Exception as error:

        print(
            "Registry error:",
            error
        )

    return decoys


# ============================================
# GET WINDOWS SECURITY EVENTS
# ============================================

def get_security_events():

    command = [

        "powershell",

        "-NoProfile",

        "-Command",

        """
        Get-WinEvent -FilterHashtable @{
            LogName='Security';
            Id=4663
        } -MaxEvents 50 |
        Select-Object RecordId,TimeCreated,Message |
        ConvertTo-Json -Compress
        """

    ]

    try:

        result = subprocess.run(

            command,

            capture_output=True,

            text=True

        )

        if not result.stdout.strip():

            return []

        events = json.loads(
            result.stdout
        )

        # If only one event exists
        if isinstance(
            events,
            dict
        ):

            events = [events]

        # Oldest → newest
        events.reverse()

        return events

    except Exception as error:

        print(
            "Event reading error:",
            error
        )

        return []


# ============================================
# FIELD EXTRACTION
# ============================================

def extract_field(
    message,
    keyword
):

    for line in message.splitlines():

        if keyword.lower() in line.lower():

            parts = line.split(
                ":",
                1
            )

            if len(parts) == 2:

                return parts[1].strip()

    return "Unknown"


# ============================================
# EXTRACT USER
# ============================================

def extract_user(message):

    return extract_field(
        message,
        "Account Name"
    )


# ============================================
# EXTRACT PROCESS
# ============================================

def extract_process(message):

    return extract_field(
        message,
        "Process Name"
    )


# ============================================
# EXTRACT ACCESS TYPE
# ============================================

def extract_access(message):

    for line in message.splitlines():

        if "Accesses:" in line:

            return (
                line.split(
                    "Accesses:",
                    1
                )[1]
                .strip()
            )

    return "Unknown"


# ============================================
# NORMALIZE WINDOWS PATH
# ============================================

def normalize_path(path):

    return (
        str(path)
        .lower()
        .replace(
            "\\\\",
            "\\"
        )
    )


# ============================================
# CHECK EVENT FOR DECOY
# ============================================

def check_event_for_decoy(
    message,
    decoys
):

    message_lower = message.lower()

    for decoy in decoys:

        normal = normalize_path(
            decoy
        )

        # Full path match
        if normal in message_lower:

            return decoy

        # Filename match
        filename = decoy.name.lower()

        if filename in message_lower:

            return decoy

    return None


# ============================================
# SEND EVENT TO EXPRESS SERVER
# ============================================

def send_event_to_server(
    event,
    decoy
):

    message = event.get(
        "Message",
        ""
    )

    event_data = {

        "event_id": 4663,

        "record_id": event.get(
            "RecordId"
        ),

        "file_name": decoy.name,

        "file_path": str(
            decoy
        ),

        "user_name": extract_user(
            message
        ),

        "process_name": extract_process(
            message
        ),

        "access_type": extract_access(
            message
        ),

        "event_time": str(
            event.get(
                "TimeCreated"
            )
        ),

        "severity": "HIGH"
    }

    try:

        response = requests.post(

            SERVER_URL,

            json=event_data,

            timeout=5

        )

        if response.status_code == 201:

            print(
                "✅ Event sent to server"
            )

        else:

            print(
                "⚠️ Server returned:",
                response.status_code
            )

            print(
                response.text
            )

    except requests.exceptions.RequestException as error:

        print(
            "❌ Could not connect to server:",
            error
        )


# ============================================
# CREATE LOCAL ALERT
# ============================================

def create_alert(
    event,
    decoy
):

    timestamp = datetime.now().strftime(
        "%Y-%m-%d %H:%M:%S"
    )

    message = event.get(
        "Message",
        ""
    )

    alert = f"""
====================================

[{timestamp}] 🚨 DECOY ACCESSED

File:
{decoy.name}

Path:
{decoy}

Windows Event:
4663

Record ID:
{event.get("RecordId")}

Event Time:
{event.get("TimeCreated")}

User:
{extract_user(message)}

Process:
{extract_process(message)}

Access:
{extract_access(message)}

====================================

"""

    print(alert)

    try:

        with open(
            LOG_FILE,
            "a",
            encoding="utf-8"
        ) as file:

            file.write(
                alert
            )

    except Exception as error:

        print(
            "Log file error:",
            error
        )


# ============================================
# PROCESS EVENTS
# ============================================

def monitor():

    last_id = load_last_event_id()

    decoys = get_decoy_files()

    if not decoys:

        print(
            "No decoys found."
        )

        return

    events = get_security_events()

    newest_id = last_id

    for event in events:

        record_id = event.get(
            "RecordId"
        )

        if not record_id:
            continue

        # Ignore already processed events
        if record_id <= last_id:
            continue

        message = event.get(
            "Message",
            ""
        )

        matched = check_event_for_decoy(

            message,

            decoys

        )

        if matched:

            # 1. Save local alert
            create_alert(
                event,
                matched
            )

            # 2. Send telemetry to server
            send_event_to_server(
                event,
                matched
            )

        # Keep track of newest Windows event
        newest_id = max(
            newest_id,
            record_id
        )

    # Save state
    if newest_id != last_id:

        save_last_event_id(
            newest_id
        )


# ============================================
# STARTUP
# ============================================

print()
print("====================================")
print("       HONEYPOT MONITOR V3")
print("====================================")
print()

print(
    "Registry:"
)

print(
    REGISTRY_FILE
)

print()

print(
    "API Server:"
)

print(
    SERVER_URL
)

print()

print(
    "Watching decoys:"
)

decoys = get_decoy_files()

for file in decoys:

    print(
        " -",
        file
    )

print()

print("Monitor started...")
print()


# ============================================
# MONITOR LOOP
# ============================================

while True:

    try:

        monitor()

        time.sleep(2)

    except KeyboardInterrupt:

        print(
            "\nMonitor stopped."
        )

        break

    except Exception as error:

        print(
            "Monitor error:",
            error
        )

        time.sleep(2)
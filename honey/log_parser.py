import csv
import re
from pathlib import Path
from datetime import datetime


LOG_FILE = Path("access_log.txt")

CSV_FILE = Path("access_events.csv")



# =====================================
# Convert Windows timestamp
# =====================================

def convert_windows_date(value):

    if not value:
        return ""


    match = re.search(
        r"/Date\((\d+)\)/",
        value
    )


    if match:

        milliseconds = int(
            match.group(1)
        )


        timestamp = milliseconds / 1000


        return datetime.fromtimestamp(
            timestamp
        ).strftime(
            "%Y-%m-%d %H:%M:%S"
        )


    return value



# =====================================
# Parse log block
# =====================================

def parse_log():

    if not LOG_FILE.exists():

        print(
            "Log file not found"
        )

        return []


    with open(
        LOG_FILE,
        "r",
        encoding="utf-8"
    ) as file:

        content = file.read()



    blocks = content.split(
        "\n\n"
    )


    events=[]


    for block in blocks:


        if "DECOY ACCESSED" not in block:

            continue



        event={}



        # Alert time

        time_match=re.search(

            r"\[(.*?)\]",

            block

        )


        if time_match:

            event["alert_time"] = (
                time_match.group(1)
            )



        # Other fields

        fields={

            "file":
            r"File:\s*(.*)",


            "event_id":
            r"Windows Event:\s*(\d+)",


            "event_time":
            r"Event Time:\s*(.*)",


            "user":
            r"User:\s*(.*)",


            "process":
            r"Process:\s*(.*)",


            "access":
            r"Access:\s*(.*)"

        }



        for key,pattern in fields.items():

            result=re.search(
                pattern,
                block
            )


            if result:

                event[key]=result.group(1).strip()


            else:

                event[key]=""



        # Split filename and path

        file_path=event.get(
            "file",
            ""
        )


        event["file_name"] = Path(
            file_path
        ).name



        event["file_path"]=file_path



        event["event_time"] = convert_windows_date(
            event["event_time"]
        )


        events.append(event)



    return events



# =====================================
# Write CSV
# =====================================

def write_csv(events):


    if not events:

        print(
            "No events found"
        )

        return



    headers=[

        "id",
        "alert_time",
        "file_name",
        "file_path",
        "event_id",
        "event_time",
        "user",
        "process",
        "access"

    ]



    file_exists = CSV_FILE.exists()



    with open(
        CSV_FILE,
        "a",
        newline="",
        encoding="utf-8"
    ) as file:


        writer=csv.DictWriter(
            file,
            fieldnames=headers
        )


        if not file_exists:

            writer.writeheader()



        start_id=1


        for event in events:


            writer.writerow({

                "id": start_id,

                "alert_time":
                event.get(
                    "alert_time",
                    ""
                ),

                "file_name":
                event.get(
                    "file_name",
                    ""
                ),

                "file_path":
                event.get(
                    "file_path",
                    ""
                ),

                "event_id":
                event.get(
                    "event_id",
                    ""
                ),

                "event_time":
                event.get(
                    "event_time",
                    ""
                ),

                "user":
                event.get(
                    "user",
                    ""
                ),

                "process":
                event.get(
                    "process",
                    ""
                ),

                "access":
                event.get(
                    "access",
                    ""
                )

            })


            start_id+=1



    print(
        "CSV created:",
        CSV_FILE
    )



# =====================================
# MAIN
# =====================================

events=parse_log()

write_csv(events)
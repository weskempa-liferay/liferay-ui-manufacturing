import csv
import json
import random
from datetime import datetime, timedelta

def excel_date_to_iso(excel_date):
    if excel_date.isdigit():
        base_date = datetime(1899, 12, 30)
        delta = timedelta(days=int(excel_date))
        return (base_date + delta).strftime('%Y-%m-%dT00:00:00Z')
    else:
        try:
            dt = datetime.strptime(excel_date, '%m/%d/%Y')
            return dt.strftime('%Y-%m-%dT00:00:00Z')
        except ValueError:
            return ""

def generate_erc(prefix, facility, iso_date):
    date_part = iso_date.split('T')[0]
    return f"{prefix}-{facility}-{date_part}"

all_roll_weeks = []
cle_sizes_data = {}
skv_sizes_data = {}

# --- PARSE SKV ---
skv_file = "SKV Roll Week Data.xlsx - 3. SKV Roll Week Data.csv"
with open(skv_file, 'r', encoding='utf-8') as f:
    reader = list(csv.reader(f))
    
    dates_row = reader[3]
    status_row = reader[4]
    
    for col_idx in range(len(dates_row)):
        raw_date = dates_row[col_idx].strip()
        if not raw_date:
            continue
            
        iso_date = excel_date_to_iso(raw_date)
        if not iso_date:
            continue
            
        status_raw = status_row[col_idx].strip().lower()
        in_operation = True if status_raw == 'yes' else False
        
        # Generate random capacity
        capacity = random.randint(40, 100) if in_operation else 100
        
        rw_erc = generate_erc("RW", "SKV", iso_date)
        
        all_roll_weeks.append({
            "externalReferenceCode": rw_erc,
            "facilityCode": "SKV",
            "weekStartDate": iso_date,
            "millInOperation": in_operation,
            "capacityPercentage": capacity
        })
        
        # Extract sizes
        sizes_for_week = []
        seq_order = 1
        for r_idx in range(6, len(reader)):
            if col_idx < len(reader[r_idx]):
                size_val = reader[r_idx][col_idx].strip()
                if size_val:
                    sizes_for_week.append({
                        "externalReferenceCode": f"SZ-SKV-{iso_date.split('T')[0]}-{seq_order}",
                        "sizeValue": size_val,
                        "sequenceOrder": seq_order,
                        "r_rollWeekToScheduledSize_c_rollWeekERC": rw_erc
                    })
                    seq_order += 1
        
        skv_sizes_data[iso_date.split('T')[0]] = sizes_for_week

# --- PARSE CLE ---
cle_file = "3. Cleveland Roll Week SBQ - Sheet1.csv"
with open(cle_file, 'r', encoding='utf-8') as f:
    reader = list(csv.reader(f))
    
    dates_row = reader[0]
    status_row = reader[1]
    
    for col_idx in range(len(dates_row)):
        raw_date = dates_row[col_idx].strip()
        if not raw_date:
            continue
            
        iso_date = excel_date_to_iso(raw_date)
        if not iso_date:
            continue
            
        status_raw = status_row[col_idx].strip().lower()
        in_operation = True if status_raw == 'yes' else False
        
        # Generate random capacity
        capacity = random.randint(40, 100) if in_operation else 100
        
        rw_erc = generate_erc("RW", "CLE", iso_date)
        
        all_roll_weeks.append({
            "externalReferenceCode": rw_erc,
            "facilityCode": "CLE",
            "weekStartDate": iso_date,
            "millInOperation": in_operation,
            "capacityPercentage": capacity
        })
        
        # Extract sizes
        sizes_for_week = []
        seq_order = 1
        for r_idx in range(2, len(reader)):
            if col_idx < len(reader[r_idx]):
                size_val = reader[r_idx][col_idx].strip()
                if size_val:
                    sizes_for_week.append({
                        "externalReferenceCode": f"SZ-CLE-{iso_date.split('T')[0]}-{seq_order}",
                        "sizeValue": size_val,
                        "sequenceOrder": seq_order,
                        "r_rollWeekToScheduledSize_c_rollWeekERC": rw_erc
                    })
                    seq_order += 1
        
        cle_sizes_data[iso_date.split('T')[0]] = sizes_for_week

# --- WRITE OUTPUTS ---
# 1. Bulk Roll Weeks
with open('../bulk_import_roll_weeks.json', 'w') as f:
    json.dump(all_roll_weeks, f, indent=2)

# 2. Chunked Scheduled Sizes (one file per week per facility)
import os
os.makedirs('../import-chunks', exist_ok=True)

for date_str, sizes in skv_sizes_data.items():
    if sizes:
        with open(f'../import-chunks/scheduledsizes_SKV_{date_str}.json', 'w') as f:
            json.dump(sizes, f, indent=2)

for date_str, sizes in cle_sizes_data.items():
    if sizes:
        with open(f'../import-chunks/scheduledsizes_CLE_{date_str}.json', 'w') as f:
            json.dump(sizes, f, indent=2)

print(f"Generated 1 bulk Roll Weeks file ({len(all_roll_weeks)} records).")
print(f"Generated {len(skv_sizes_data) + len(cle_sizes_data)} individual week chunks for Scheduled Sizes.")

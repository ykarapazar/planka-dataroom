#!/usr/bin/env python3
"""Seed the Paydaş × Taranis Data Room from David's IRL tracker xlsx.

Idempotent: re-running checks for existing project/board/list/cards by name and
skips duplicates. Safe to run multiple times during P2.

Reads admin credentials from PLANKA_BASE_URL / PLANKA_ADMIN_EMAIL / PLANKA_ADMIN_PASSWORD env.
"""
import os
import sys
import time
import openpyxl
import requests

BASE = os.environ.get("PLANKA_BASE_URL", "https://paydasdataroom.karapazarhukuk.com")
EMAIL = os.environ["PLANKA_ADMIN_EMAIL"]
PASS = os.environ["PLANKA_ADMIN_PASSWORD"]
XLSX = os.environ.get(
    "PLANKA_IRL_XLSX",
    "/tmp/dataroom-context/Paydas_Taranis_IRL_Tracker.xlsx",
)

PROJECT_NAME = "Paydaş × Taranis Data Room"
CFG_NAME = "Taranis IRL"
LIST_NAMES = ["Not Started", "In Progress", "Provided", "Blocked", "N/A"]
LIST_TYPES = ["active", "active", "closed", "active", "closed"]
LIST_POSITIONS = [65536 * (i + 1) for i in range(len(LIST_NAMES))]

STATUS_TO_LIST = {
    "Not started": "Not Started",
    "In progress": "In Progress",
    "Provided":    "Provided",
    "Blocked":     "Blocked",
    "N/A":         "N/A",
    None:          "Not Started",
    "":            "Not Started",
}

s = requests.Session()


def login():
    r = s.post(f"{BASE}/api/access-tokens", json={
        "emailOrUsername": EMAIL, "password": PASS})
    r.raise_for_status()
    body = r.json()
    if "item" in body:
        return body["item"]
    pending = body.get("pendingToken")
    if not pending:
        raise SystemExit(f"Unexpected login response: {body}")
    sig = s.get(f"{BASE}/api/terms").json()["item"]["signature"]
    r2 = s.post(f"{BASE}/api/access-tokens/accept-terms", json={
        "pendingToken": pending, "signature": sig})
    r2.raise_for_status()
    return r2.json()["item"]


def H(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def get_or_create_project(token):
    projects = s.get(f"{BASE}/api/projects", headers=H(token)).json().get("items", [])
    for p in projects:
        if p["name"] == PROJECT_NAME:
            print(f"  project exists: {p['id']}")
            return p
    r = s.post(f"{BASE}/api/projects", headers=H(token), json={
        "type": "private", "name": PROJECT_NAME})
    r.raise_for_status()
    p = r.json()["item"]
    print(f"  project created: {p['id']}")
    return p


def get_or_create_base_cfg(token, project_id):
    pinfo = s.get(f"{BASE}/api/projects/{project_id}", headers=H(token)).json()
    inc = pinfo.get("included", {})
    for g in inc.get("baseCustomFieldGroups", []):
        if g["name"] == CFG_NAME:
            print(f"  base CFG exists: {g['id']}")
            return g
    r = s.post(f"{BASE}/api/projects/{project_id}/base-custom-field-groups",
               headers=H(token), json={"name": CFG_NAME})
    r.raise_for_status()
    g = r.json()["item"]
    print(f"  base CFG created: {g['id']}")
    return g


def get_or_create_custom_fields(token, project_id, base_cfg_id):
    proj = s.get(f"{BASE}/api/projects/{project_id}", headers=H(token)).json()
    existing = [
        f for f in proj.get("included", {}).get("customFields", [])
        if f.get("customFieldGroupId") == base_cfg_id
        or f.get("baseCustomFieldGroupId") == base_cfg_id
    ]
    by_name = {f["name"]: f for f in existing}
    fields = {}
    pos = 65536
    for name in ("ref", "priority", "wave"):
        if name in by_name:
            fields[name] = by_name[name]
            print(f"    cf exists: {name} = {by_name[name]['id']}")
        else:
            r = s.post(f"{BASE}/api/base-custom-field-groups/{base_cfg_id}/custom-fields",
                       headers=H(token),
                       json={"name": name, "position": pos, "showOnFrontOfCard": True})
            r.raise_for_status()
            fields[name] = r.json()["item"]
            print(f"    cf created: {name} = {fields[name]['id']}")
        pos += 65536
    return fields


def get_or_create_board(token, project_id, name, position):
    boards = s.get(f"{BASE}/api/projects/{project_id}", headers=H(token)).json()\
        .get("included", {}).get("boards", [])
    for b in boards:
        if b["name"] == name:
            return b
    r = s.post(f"{BASE}/api/projects/{project_id}/boards", headers=H(token),
               json={"name": name, "position": position})
    r.raise_for_status()
    return r.json()["item"]


def ensure_lists(token, board_id):
    existing = s.get(f"{BASE}/api/boards/{board_id}", headers=H(token)).json()\
        .get("included", {}).get("lists", [])
    by_name = {l["name"]: l for l in existing}
    out = {}
    for ln, lt, lp in zip(LIST_NAMES, LIST_TYPES, LIST_POSITIONS):
        if ln in by_name:
            out[ln] = by_name[ln]
        else:
            r = s.post(f"{BASE}/api/boards/{board_id}/lists", headers=H(token),
                       json={"name": ln, "type": lt, "position": lp})
            r.raise_for_status()
            out[ln] = r.json()["item"]
    return out


def attach_cfg_to_board(token, board_id, base_cfg_id):
    existing = s.get(f"{BASE}/api/boards/{board_id}", headers=H(token)).json()\
        .get("included", {}).get("customFieldGroups", [])
    for g in existing:
        if g.get("baseCustomFieldGroupId") == base_cfg_id:
            return g
    r = s.post(f"{BASE}/api/boards/{board_id}/custom-field-groups", headers=H(token),
               json={"baseCustomFieldGroupId": base_cfg_id, "position": 65536})
    r.raise_for_status()
    return r.json()["item"]


def existing_card_names_in_list(token, list_id):
    info = s.get(f"{BASE}/api/lists/{list_id}", headers=H(token)).json()
    cards = info.get("included", {}).get("cards", [])
    return {c["name"] for c in cards}


def create_card(token, list_id, name, description=None, due_date=None, position=None):
    body = {"name": name, "type": "project"}
    if position is not None:
        body["position"] = position
    if description:
        body["description"] = description
    if due_date:
        body["dueDate"] = due_date
    r = s.post(f"{BASE}/api/lists/{list_id}/cards", headers=H(token), json=body)
    r.raise_for_status()
    return r.json()["item"]


def set_cf_value(token, card_id, cfg_id, field_id, content):
    if content is None or content == "":
        return None
    url = (f"{BASE}/api/cards/{card_id}/custom-field-values/"
           f"customFieldGroupId:{cfg_id}:customFieldId:{field_id}")
    r = s.patch(url, headers=H(token), json={"content": str(content)})
    r.raise_for_status()
    return r.json().get("item")


def normalize_section(raw):
    if raw is None:
        return None
    return raw.strip()


def main():
    print(f"Connecting to {BASE} as {EMAIL}")
    token = login()
    print(f"  token len: {len(token)}")

    print("Project...")
    project = get_or_create_project(token)
    print("Base custom field group...")
    base_cfg = get_or_create_base_cfg(token, project["id"])
    print("Custom fields...")
    fields = get_or_create_custom_fields(token, project["id"], base_cfg["id"])

    print(f"Reading {XLSX}")
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    ws = wb["IRL Tracker"]

    rows = list(ws.iter_rows(min_row=4, values_only=True))

    # 1) discover unique section names (in document order)
    sections = []
    seen = set()
    for row in rows:
        if not row:
            continue
        section = normalize_section(row[0])
        if section and section not in seen:
            seen.add(section)
            sections.append(section)
    print(f"Sections found: {len(sections)}")

    # 2) create boards + lists
    boards_by_section = {}
    lists_by_board = {}
    bpos = 65536
    for sec in sections:
        b = get_or_create_board(token, project["id"], sec, bpos)
        boards_by_section[sec] = b
        attach_cfg_to_board(token, b["id"], base_cfg["id"])
        lists_by_board[b["id"]] = ensure_lists(token, b["id"])
        bpos += 65536
        print(f"  board {b['id']} = {sec} (with 5 lists + Taranis IRL CFG)")

    # 3) iterate data rows and create cards
    created = 0
    skipped_existing = 0
    skipped_no_ref = 0
    list_pos = {}  # tracks next position per list_id
    for row in rows:
        section = normalize_section(row[0])
        ref = row[1]
        info = row[2]
        priority = row[3]
        wave = row[4]
        # owner = row[5]
        status = row[6]
        vdr_loc = row[7]
        # target_date = row[8]
        caveats = row[9]
        # taranis_notes = row[10]

        if not ref or not info:
            skipped_no_ref += 1
            continue
        if section not in boards_by_section:
            print(f"  ! row has section '{section}' not in boards — skipped")
            continue

        board = boards_by_section[section]
        list_name = STATUS_TO_LIST.get(status, "Not Started")
        target_list = lists_by_board[board["id"]][list_name]
        existing = existing_card_names_in_list(token, target_list["id"])
        card_name = str(info)[:1024]
        if card_name in existing:
            skipped_existing += 1
            continue

        list_pos[target_list["id"]] = list_pos.get(target_list["id"], 0) + 65536
        desc_lines = []
        if vdr_loc:
            desc_lines.append(f"**VDR Location:** {vdr_loc}")
        if caveats:
            desc_lines.append(f"**Caveats / Notes:** {caveats}")
        description = "\n\n".join(desc_lines) if desc_lines else None

        card = create_card(token, target_list["id"], card_name,
                           description=description, position=list_pos[target_list["id"]])

        # custom field values
        cfg_id = next(g["id"] for g in
                      s.get(f"{BASE}/api/boards/{board['id']}", headers=H(token)).json()
                      .get("included", {}).get("customFieldGroups", [])
                      if g.get("baseCustomFieldGroupId") == base_cfg["id"])
        set_cf_value(token, card["id"], cfg_id, fields["ref"]["id"], ref)
        set_cf_value(token, card["id"], cfg_id, fields["priority"]["id"], priority or "P3")
        wave_str = ""
        if wave:
            wave_str = str(wave) if str(wave).startswith("Wave") else f"Wave {wave}"
        set_cf_value(token, card["id"], cfg_id, fields["wave"]["id"], wave_str or "Wave 2")

        created += 1
        if created % 10 == 0:
            print(f"  created {created} cards...")

    print(f"\nSeed complete.")
    print(f"  cards created    : {created}")
    print(f"  skipped (existed): {skipped_existing}")
    print(f"  skipped (no ref) : {skipped_no_ref}")


if __name__ == "__main__":
    main()

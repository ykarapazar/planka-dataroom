#!/usr/bin/env python3
"""Onboard a user to the Paydaş × Taranis Data Room.

Creates a Planka user, adds them to a group, and (optionally) sends them
their initial credentials over WhatsApp via the local bridge running on
127.0.0.1:8080.

This script runs locally on Yüce's Mac because the WhatsApp bridge does
(per plan §8 — bridge can't run on the remote VM).

Usage:
    PLANKA_ADMIN_EMAIL=ykarapazar@karapazarhukuk.com \\
    PLANKA_ADMIN_PASSWORD=... \\
    python3 onboard.py --email aysima@sekalaw.com \\
                       --name "Aysima Kurtulus" \\
                       --username aysima \\
                       --phone +905XXXXXXXXX \\
                       --group "External Counsel" \\
                       [--password Seka2026]
                       [--no-whatsapp]
                       [--dry-run]
"""
import argparse
import json
import os
import sys
import re
import requests

PLANKA = os.environ.get("PLANKA_BASE_URL", "https://paydasdataroom.karapazarhukuk.com")
EMAIL = os.environ.get("PLANKA_ADMIN_EMAIL")
PASS = os.environ.get("PLANKA_ADMIN_PASSWORD")
WA_BRIDGE = os.environ.get("WA_BRIDGE_URL", "http://127.0.0.1:8080")


def login():
    if not EMAIL or not PASS:
        raise SystemExit("Set PLANKA_ADMIN_EMAIL and PLANKA_ADMIN_PASSWORD env vars")
    r = requests.post(f"{PLANKA}/api/access-tokens",
                      json={"emailOrUsername": EMAIL, "password": PASS})
    r.raise_for_status()
    body = r.json()
    if "item" in body:
        return body["item"]
    pending = body.get("pendingToken")
    if not pending:
        raise SystemExit(f"Unexpected login response: {body}")
    sig = requests.get(f"{PLANKA}/api/terms").json()["item"]["signature"]
    r2 = requests.post(f"{PLANKA}/api/access-tokens/accept-terms",
                       json={"pendingToken": pending, "signature": sig})
    r2.raise_for_status()
    return r2.json()["item"]


def H(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def find_group(token, name):
    groups = requests.get(f"{PLANKA}/api/groups", headers=H(token)).json().get("items", [])
    for g in groups:
        if g["name"].lower() == name.lower():
            return g
    return None


def find_user_by_email(token, email):
    resp = requests.get(f"{PLANKA}/api/users", headers=H(token)).json().get("items", [])
    for u in resp:
        if (u.get("email") or "").lower() == email.lower():
            return u
    return None


def normalize_phone(raw):
    """Convert e.g. '+90 543 334 13 65' to WhatsApp JID '905433341365@s.whatsapp.net'."""
    digits = re.sub(r"\D", "", raw)
    if not digits:
        raise SystemExit(f"Phone has no digits: {raw}")
    return f"{digits}@s.whatsapp.net"


def send_whatsapp(jid, message):
    r = requests.post(f"{WA_BRIDGE}/api/send",
                      json={"recipient": jid, "message": message},
                      timeout=15)
    if r.status_code >= 400:
        raise SystemExit(f"WhatsApp send failed {r.status_code}: {r.text[:200]}")
    return r.text


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--email", required=True)
    p.add_argument("--name", required=True, help="Full display name")
    p.add_argument("--username", required=True, help="Login username (a-z0-9._)")
    p.add_argument("--phone", required=True, help="WhatsApp phone number, any format")
    p.add_argument("--group", required=True, help="Group name to add user to")
    p.add_argument("--password", help="Initial password (default: '<UsernameTitle>2026')")
    p.add_argument("--organization", help="Organization name shown on profile")
    p.add_argument("--no-whatsapp", action="store_true", help="Skip WhatsApp send (print message instead)")
    p.add_argument("--dry-run", action="store_true", help="Print actions without executing")
    args = p.parse_args()

    if not args.password:
        # Easy memorable default per Yüce's spec (e.g., Seka2026, Aysima2026)
        args.password = args.username[:1].upper() + args.username[1:].lower() + "2026"

    if args.dry_run:
        print(f"[dry-run] Would create user: {args.email} / {args.username} / pw={args.password}")
        print(f"[dry-run] Would add to group: {args.group}")
        print(f"[dry-run] WhatsApp to {normalize_phone(args.phone)}")
        return

    print(f"Logging in to {PLANKA} as {EMAIL}")
    token = login()

    print(f"Looking up group '{args.group}'")
    group = find_group(token, args.group)
    if not group:
        raise SystemExit(f"Group '{args.group}' not found. Create it via /api/groups first.")

    print(f"Checking if user already exists ({args.email})")
    existing = find_user_by_email(token, args.email)
    if existing:
        print(f"  user already exists: id={existing['id']}, skipping create")
        user = existing
    else:
        print(f"Creating user {args.username}")
        body = {
            "email": args.email,
            "password": args.password,
            "role": "boardUser",
            "name": args.name,
            "username": args.username,
        }
        if args.organization:
            body["organization"] = args.organization
        r = requests.post(f"{PLANKA}/api/users", headers=H(token), json=body)
        if r.status_code >= 400:
            raise SystemExit(f"Create user failed {r.status_code}: {r.text[:300]}")
        user = r.json()["item"]
        print(f"  created: id={user['id']}")

    print(f"Adding {user['username']} → group {group['name']}")
    r = requests.post(f"{PLANKA}/api/groups/{group['id']}/group-memberships",
                      headers=H(token),
                      json={"userId": user["id"]})
    if r.status_code == 409:
        print("  already a member, skipping")
    elif r.status_code >= 400:
        raise SystemExit(f"Add to group failed {r.status_code}: {r.text[:300]}")
    else:
        print(f"  membership: {r.json()['item']['id']}")

    msg = (
        f"Welcome to Paydaş × Taranis Data Room.\n"
        f"URL: {PLANKA}\n"
        f"E-mail: {args.email}\n"
        f"Şifre: {args.password}\n"
        f"Lütfen kullanmaya başladıktan sonra "
        f"User → Settings → Change Password kısmından kendi şifrenizi belirleyin."
    )

    if args.no_whatsapp:
        print("--- WhatsApp message (not sent, --no-whatsapp):")
        print(msg)
        return

    jid = normalize_phone(args.phone)
    print(f"Sending WhatsApp to {jid}")
    resp = send_whatsapp(jid, msg)
    print(f"  bridge responded: {resp[:120]}")

    print("\nDone. User is onboarded.")


if __name__ == "__main__":
    main()

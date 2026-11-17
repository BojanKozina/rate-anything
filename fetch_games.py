"""
Downloads game info + cover art from IGDB and saves it into RateAnything's SQLite database.

1. Fill in the SETTINGS below.
2. pip install requests
3. python fetch_games.py
"""

import re
import sqlite3
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

# ===================== SETTINGS =====================
# From https://dev.twitch.tv/console (IGDB uses Twitch accounts)
CLIENT_ID = "39lr0ttm10bz5v9e1umoid0783seef"
CLIENT_SECRET = "r5chbfn7ljeg6u77xetwbj0ai1mw59"

# Paths are relative to the folder this script is in, so you can run it from anywhere.
# This assumes the script sits in your RateAnything folder.
SCRIPT_DIR = Path(__file__).resolve().parent

DB_PATH = SCRIPT_DIR / "build" / "rateanything.db"              # your database
COVERS_DIR = SCRIPT_DIR / "frontend" / "public" / "covers"      # where cover images go

GAMES = [
    "Far Cry 3",
    "Far Cry 4",
    "Dishonored 2",
    "The Witcher 3: Wild Hunt",
    "Portal 2",
    "Darkwood",
    "Don't Starve",
    "Dying Light",
    "Metal Gear Solid V: The Phantom Pain",
    "Red Dead Redemption 2",
    "Hollow Knight",
    "Stardew Valley",
    "Hades",
    "Elden Ring",
    "Disco Elysium",
    "Celeste",
    "PUBG",
    "Deadlock",
    "Super Meat Boy",
    "Binding of Isaac",
    "Dishonored",
    "World of Warcraft Forever",
    "Grand Theft Auto 5",
    "Stalker",
    "What Remains of Edith Finch",
    "Fortnite",
    "League of Legends",
    "Doom 1",
    "Doom",
    "Metal Gear Solid",
    "Scorn",
    "Fallout 4",
    "Fallout New Vegas",
    "Minecraft",
    "Valheim",
    "They are billions",
]
# ====================================================

TOKEN_URL = "https://id.twitch.tv/oauth2/token"
IGDB_URL = "https://api.igdb.com/v4/games"
COVER_URL = "https://images.igdb.com/igdb/image/upload/t_cover_big_2x/{image_id}.webp"

# IGDB allows 4 requests per second
REQUEST_DELAY = 0.3

SCHEMA = """
CREATE TABLE IF NOT EXISTS "Games" (
    "Id"          INTEGER PRIMARY KEY AUTOINCREMENT,
    "IgdbId"      INTEGER UNIQUE,
    "Name"        TEXT    NOT NULL,
    "Status"      INTEGER NOT NULL DEFAULT 1 CHECK ("Status" IN (1, 2, 3)),
    "Rating"      INTEGER CHECK ("Rating" BETWEEN 1 AND 5),
    "Description" TEXT,
    "ReleaseDate" TEXT,
    "CoverPath"   TEXT
);

CREATE TABLE IF NOT EXISTS "G_Categories" (
    "Id"   INTEGER PRIMARY KEY AUTOINCREMENT,
    "Name" TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS "Games_Categories" (
    "GameId"     INTEGER NOT NULL REFERENCES "Games"("Id")        ON DELETE CASCADE,
    "CategoryId" INTEGER NOT NULL REFERENCES "G_Categories"("Id") ON DELETE CASCADE,
    PRIMARY KEY ("GameId", "CategoryId")
);

CREATE TABLE IF NOT EXISTS "G_Screenshots" (
    "Id"     INTEGER PRIMARY KEY AUTOINCREMENT,
    "GameId" INTEGER NOT NULL REFERENCES "Games"("Id") ON DELETE CASCADE,
    "Path"   TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS "IX_G_Screenshots_GameId" ON "G_Screenshots"("GameId");
"""


def get_token(client_id: str, client_secret: str) -> str | None:
    """Gets an app access token from Twitch (IGDB uses Twitch accounts). Returns None on failure."""
    response = requests.post(
        TOKEN_URL,
        data={  # sent in the body, so the secret doesn't appear in error messages / URLs
            "client_id": client_id.strip(),
            "client_secret": client_secret.strip(),
            "grant_type": "client_credentials",
        },
        timeout=15,
    )
    if response.status_code != 200:
        print(f"Twitch login failed ({response.status_code}): {response.text}")
        print("Check CLIENT_ID / CLIENT_SECRET, and that the app's Client Type is 'Confidential'.")
        return None
    return response.json()["access_token"]


def search_game(name: str, headers: dict) -> dict | None:
    """Finds the best IGDB match for a game name. Returns None if nothing is found."""
    safe_name = name.replace('"', '\\"')
    query = (
        f'search "{safe_name}"; '
        "fields name, summary, first_release_date, cover.image_id, genres.name; "
        "where version_parent = null; "
        "limit 1;"
    )
    response = requests.post(IGDB_URL, headers=headers, data=query, timeout=15)
    response.raise_for_status()
    results = response.json()
    return results[0] if results else None


def slugify(name: str) -> str:
    """'The Witcher 3: Wild Hunt' -> 'the-witcher-3-wild-hunt'"""
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "game"


def download_cover(image_id: str, target: Path) -> bool:
    """Downloads the cover to target. Writes to a .part file first so failures never leave broken images."""
    response = requests.get(COVER_URL.format(image_id=image_id), timeout=30)
    if response.status_code != 200 or not response.content:
        return False

    temp = target.with_suffix(target.suffix + ".part")
    temp.write_bytes(response.content)
    temp.replace(target)
    return True


def to_date(timestamp: int | None) -> str | None:
    """IGDB gives a Unix timestamp; the database stores 'YYYY-MM-DD'."""
    if timestamp is None:
        return None
    return datetime.fromtimestamp(timestamp, tz=timezone.utc).strftime("%Y-%m-%d")


def save_game(db: sqlite3.Connection, game: dict, cover_path: str | None) -> int:
    """Inserts the game and its genres. Returns the new game's Id."""
    cursor = db.execute(
        """
        INSERT INTO "Games" ("IgdbId", "Name", "Description", "ReleaseDate", "CoverPath")
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            game["id"],
            game["name"],
            game.get("summary"),
            to_date(game.get("first_release_date")),
            cover_path,
        ),
    )
    game_id = cursor.lastrowid

    for genre in game.get("genres", []):
        db.execute('INSERT OR IGNORE INTO "G_Categories" ("Name") VALUES (?)', (genre["name"],))
        db.execute(
            """
            INSERT OR IGNORE INTO "Games_Categories" ("GameId", "CategoryId")
            SELECT ?, "Id" FROM "G_Categories" WHERE "Name" = ?
            """,
            (game_id, genre["name"]),
        )

    return game_id


def main() -> int:
    if "paste_your" in CLIENT_ID or "paste_your" in CLIENT_SECRET:
        print("Fill in CLIENT_ID and CLIENT_SECRET at the top of this file first.")
        return 1

    if not DB_PATH.parent.exists():
        print(f"Database folder not found: {DB_PATH.parent}")
        print("Put this script in your RateAnything folder (next to 'build'), or fix DB_PATH at the top.")
        return 1

    if not COVERS_DIR.parent.exists():
        print(f"Covers folder's parent not found: {COVERS_DIR.parent}")
        print("Check that COVERS_DIR at the top points into your React project's 'public' folder.")
        return 1

    COVERS_DIR.mkdir(parents=True, exist_ok=True)

    db = sqlite3.connect(DB_PATH)
    db.execute("PRAGMA foreign_keys = ON;")
    db.executescript(SCHEMA)

    token = get_token(CLIENT_ID, CLIENT_SECRET)
    if token is None:
        db.close()
        return 1
    headers = {"Client-ID": CLIENT_ID.strip(), "Authorization": f"Bearer {token}"}

    added, skipped, failed = 0, 0, 0

    for name in GAMES:
        try:
            game = search_game(name, headers)
            time.sleep(REQUEST_DELAY)

            if game is None:
                print(f"  ✗ {name}: not found on IGDB")
                failed += 1
                continue

            exists = db.execute('SELECT 1 FROM "Games" WHERE "IgdbId" = ?', (game["id"],)).fetchone()
            if exists:
                print(f"  - {game['name']}: already in database, skipped")
                skipped += 1
                continue

            cover_path = None
            image_id = game.get("cover", {}).get("image_id")
            if image_id:
                file_name = f"{slugify(game['name'])}.webp"
                if download_cover(image_id, COVERS_DIR / file_name):
                    cover_path = f"covers/{file_name}"
                time.sleep(REQUEST_DELAY)

            save_game(db, game, cover_path)
            db.commit()

            note = "" if cover_path else " (no cover)"
            print(f"  ✓ {game['name']}{note}")
            added += 1

        except requests.RequestException as e:
            print(f"  ✗ {name}: network error: {e}")
            failed += 1

    db.close()
    print(f"\nDone: {added} added, {skipped} skipped, {failed} failed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

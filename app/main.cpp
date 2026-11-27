#include <SQLiteCpp/SQLiteCpp.h>
#include <saucer/smartview.hpp>
#include <saucer/window.hpp>


namespace
{
    // One "Media" row per rateable thing. Safe to run on every startup.
    void init_schema(SQLite::Database &db)
    {
        db.exec(R"sql(
            CREATE TABLE IF NOT EXISTS "Media" (
                "Id"             INTEGER PRIMARY KEY AUTOINCREMENT,
                "Type"           TEXT    NOT NULL CHECK ("Type" IN ('game', 'movie', 'book')),
                "Name"           TEXT    NOT NULL,
                "Description"    TEXT,
                "Summary"        TEXT,
                "ReleaseDate"    TEXT,
                "CoverPath"      TEXT,
                "ExternalSource" TEXT,
                "ExternalId"     TEXT,
                "CreatedAt"      TEXT    NOT NULL DEFAULT (datetime('now')),
                UNIQUE ("ExternalSource", "ExternalId")
            );

            CREATE INDEX IF NOT EXISTS "IX_Media_Type" ON "Media"("Type", "Name");

            CREATE TABLE IF NOT EXISTS "Categories" (
                "Id"        INTEGER PRIMARY KEY AUTOINCREMENT,
                "Type"      TEXT NOT NULL CHECK ("Type" IN ('game', 'movie', 'book')),
                "Name"      TEXT NOT NULL,
                "CreatedAt" TEXT NOT NULL DEFAULT (datetime('now')),
                UNIQUE ("Type", "Name")
            );

            CREATE TABLE IF NOT EXISTS "MediaCategories" (
                "MediaId"    INTEGER NOT NULL REFERENCES "Media"("Id")      ON DELETE CASCADE,
                "CategoryId" INTEGER NOT NULL REFERENCES "Categories"("Id") ON DELETE CASCADE,
                "CreatedAt"  TEXT    NOT NULL DEFAULT (datetime('now')),
                PRIMARY KEY ("MediaId", "CategoryId")
            );

            CREATE INDEX IF NOT EXISTS "IX_MediaCategories_Category" ON "MediaCategories"("CategoryId");

            CREATE TABLE IF NOT EXISTS "MediaAssets" (
                "Id"        INTEGER PRIMARY KEY AUTOINCREMENT,
                "MediaId"   INTEGER NOT NULL REFERENCES "Media"("Id") ON DELETE CASCADE,
                "Type"      TEXT    NOT NULL CHECK ("Type" IN ('screenshot', 'trailer')),
                "Path"      TEXT    NOT NULL,
                "Position"  INTEGER NOT NULL DEFAULT 0,
                "CreatedAt" TEXT    NOT NULL DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS "IX_MediaAssets_Media" ON "MediaAssets"("MediaId", "Type", "Position");

            CREATE TABLE IF NOT EXISTS "Users" (
                "Id"           INTEGER PRIMARY KEY AUTOINCREMENT,
                "Username"     TEXT    NOT NULL UNIQUE,
                "Email"        TEXT    NOT NULL UNIQUE,
                "FirstName"    TEXT,
                "LastName"     TEXT,
                "ProfileBio"   TEXT,
                "ProfileImage" TEXT,
                "Public"       INTEGER NOT NULL DEFAULT 0,
                "CreatedAt"    TEXT    NOT NULL DEFAULT (datetime('now'))
            );

            -- A user's relationship to one item: progress and favourite.
            CREATE TABLE IF NOT EXISTS "UserMedia" (
                "UserId"    INTEGER NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
                "MediaId"   INTEGER NOT NULL REFERENCES "Media"("Id") ON DELETE CASCADE,
                "Status"    INTEGER NOT NULL DEFAULT 1 CHECK ("Status" IN (1, 2, 3)),
                "Favourite" INTEGER NOT NULL DEFAULT 0,
                "CreatedAt" TEXT    NOT NULL DEFAULT (datetime('now')),
                PRIMARY KEY ("UserId", "MediaId")
            );

            CREATE INDEX IF NOT EXISTS "IX_UserMedia_Media" ON "UserMedia"("MediaId");

            CREATE TABLE IF NOT EXISTS "Reviews" (
                "Id"        INTEGER PRIMARY KEY AUTOINCREMENT,
                "UserId"    INTEGER NOT NULL REFERENCES "Users"("Id") ON DELETE CASCADE,
                "MediaId"   INTEGER NOT NULL REFERENCES "Media"("Id") ON DELETE CASCADE,
                "Rating"    INTEGER NOT NULL CHECK ("Rating" BETWEEN 1 AND 5),
                "Title"     TEXT,
                "Body"      TEXT,
                "CreatedAt" TEXT    NOT NULL DEFAULT (datetime('now')),
                UNIQUE ("UserId", "MediaId")
            );

            CREATE INDEX IF NOT EXISTS "IX_Reviews_Media" ON "Reviews"("MediaId");

            CREATE TABLE IF NOT EXISTS "People" (
                "Id"        INTEGER PRIMARY KEY AUTOINCREMENT,
                "Name"      TEXT NOT NULL UNIQUE,
                "CreatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
            );

            -- Cast, directors and authors: a person in a role.
            CREATE TABLE IF NOT EXISTS "MediaCredits" (
                "MediaId"   INTEGER NOT NULL REFERENCES "Media"("Id")  ON DELETE CASCADE,
                "PersonId"  INTEGER NOT NULL REFERENCES "People"("Id") ON DELETE CASCADE,
                "Role"      TEXT    NOT NULL CHECK ("Role" IN ('actor', 'director', 'author', 'developer', 'publisher', 'composer')),
                "Character" TEXT,
                "Position"  INTEGER NOT NULL DEFAULT 0,
                "CreatedAt" TEXT    NOT NULL DEFAULT (datetime('now')),
                PRIMARY KEY ("MediaId", "PersonId", "Role")
            );

            CREATE INDEX IF NOT EXISTS "IX_MediaCredits_Person" ON "MediaCredits"("PersonId");

            -- Optional, 0-or-1 per item.
            CREATE TABLE IF NOT EXISTS "GameDetails" (
                "MediaId"   INTEGER PRIMARY KEY REFERENCES "Media"("Id") ON DELETE CASCADE,
                "Platform"  TEXT,
                "CreatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS "MovieDetails" (
                "MediaId"        INTEGER PRIMARY KEY REFERENCES "Media"("Id") ON DELETE CASCADE,
                "Studio"         TEXT,
                "RuntimeMinutes" INTEGER,
                "Language"       TEXT,
                "AgeRating"      TEXT,
                "CreatedAt"      TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS "BookDetails" (
                "MediaId"   INTEGER PRIMARY KEY REFERENCES "Media"("Id") ON DELETE CASCADE,
                "Publisher" TEXT,
                "PageCount" INTEGER,
                "Isbn"      TEXT,
                "CreatedAt" TEXT NOT NULL DEFAULT (datetime('now'))
            );
        )sql");
    }

}

coco::stray start(saucer::application *app)
{
    auto window  = saucer::window::create(app).value();
    auto webview = saucer::smartview::create({.window = window});

    const saucer::color background_color{0x0B, 0x09, 0x09, 0xFF};
    const saucer::size  min_window_size{800, 600};


    SQLite::Database db("rateanything.db", SQLite::OPEN_READWRITE | SQLite::OPEN_CREATE);
    db.exec("PRAGMA foreign_keys = ON;"); // must be set on every connection in SQLite
    init_schema(db);


    webview->set_dev_tools(true);
    window->set_min_size(min_window_size);
    window->set_decorations(saucer::window::decoration::partial);
    window->set_background(background_color);
    webview->set_background(background_color);


    webview->set_url("http://localhost:5173/");

    webview->on<saucer::webview::event::load>([&](auto) { window->show(); });







    

    co_await app->finish();
}

int main()
{
    return saucer::application::create({.id = "rate-anything"})->run(start);
}

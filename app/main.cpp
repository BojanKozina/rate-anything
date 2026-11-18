#include <SQLiteCpp/SQLiteCpp.h>
#include <saucer/smartview.hpp>
#include <saucer/window.hpp>

#include <optional>
#include <string>
#include <vector>


struct GameDto
{
    int id;
    std::string name;
    int status;
    std::optional<int> rating;
    std::optional<std::string> cover;
};

namespace
{
    // shortcut: single local user, hard-coded. Replace when the app grows real accounts.
    constexpr int CURRENT_USER_ID = 1;

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

    // ---------- Seeder ----------
    // Test data, only when the database is empty.

    struct SeedGame
    {
        std::string name;
        int status;                 // 1 Not started, 2 Playing, 3 Completed
        std::optional<int> rating;  // nullopt = not rated
        std::string release_date;
        std::string cover;          // "covers/far-cry-3.webp"
        std::string category;       // one of the names inserted below
    };

    void seed(SQLite::Database &db)
    {
        const int existing = db.execAndGet(R"(SELECT COUNT(*) FROM "Media")").getInt();
        if (existing > 0)
        {
            return; // already has data
        }

        // One transaction: either everything is inserted or nothing is (and it's much faster)
        SQLite::Transaction transaction(db);

        db.exec(R"(
            INSERT INTO "Users" ("Id", "Username", "Email")
            SELECT 1, 'local', 'local@localhost'
            WHERE NOT EXISTS (SELECT 1 FROM "Users" WHERE "Id" = 1)
        )");

        db.exec(R"(
            INSERT INTO "Categories" ("Type", "Name")
            VALUES ('game', 'Action'), ('game', 'RPG'), ('game', 'Puzzle')
        )");

        const std::vector<SeedGame> games = {
            {"Far Cry 3",                3, 4,            "2012-11-29", "covers/far-cry-3.webp",    "Action"},
            {"Far Cry 4",                2, std::nullopt, "2014-11-18", "covers/far-cry-4.webp",    "Action"},
            {"Dishonored 2",             1, std::nullopt, "2016-11-11", "covers/dishonored-2.webp", "Action"},
            {"The Witcher 3: Wild Hunt", 3, 5,            "2015-05-19", "covers/witcher-3.webp",    "RPG"},
            {"Portal 2",                 3, 5,            "2011-04-18", "covers/portal-2.webp",     "Puzzle"},
        };

        SQLite::Statement insert_media(db, R"(
            INSERT INTO "Media" ("Type", "Name", "ReleaseDate", "CoverPath")
            VALUES ('game', ?, ?, ?)
        )");

        SQLite::Statement insert_status(db, R"(
            INSERT INTO "UserMedia" ("UserId", "MediaId", "Status") VALUES (?, ?, ?)
        )");

        SQLite::Statement insert_review(db, R"(
            INSERT INTO "Reviews" ("UserId", "MediaId", "Rating") VALUES (?, ?, ?)
        )");

        SQLite::Statement link_category(db, R"(
            INSERT INTO "MediaCategories" ("MediaId", "CategoryId")
            SELECT ?, "Id" FROM "Categories" WHERE "Type" = 'game' AND "Name" = ?
        )");

        for (const auto &game : games)
        {
            insert_media.bind(1, game.name);
            insert_media.bind(2, game.release_date);
            insert_media.bind(3, game.cover);
            insert_media.exec();
            insert_media.reset();

            const auto media_id = db.getLastInsertRowid();

            insert_status.bind(1, CURRENT_USER_ID);
            insert_status.bind(2, media_id);
            insert_status.bind(3, game.status);
            insert_status.exec();
            insert_status.reset();

            if (game.rating)
            {
                insert_review.bind(1, CURRENT_USER_ID);
                insert_review.bind(2, media_id);
                insert_review.bind(3, *game.rating);
                insert_review.exec();
                insert_review.reset();
            }

            link_category.bind(1, media_id);
            link_category.bind(2, game.category);
            link_category.exec();
            link_category.reset();
        }

        transaction.commit();
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
    seed(db);


    webview->set_dev_tools(true);
    window->set_min_size(min_window_size);
    window->set_decorations(saucer::window::decoration::partial);
    window->set_background(background_color);
    webview->set_background(background_color);


    webview->expose("getGames", [&]() -> std::vector<GameDto>
    {
        // 'movie' or 'book' here gives the other pages.
        SQLite::Statement query(db, R"(
            SELECT m."Id", m."Name", COALESCE(um."Status", 1), r."Rating", m."CoverPath"
            FROM "Media" m
            LEFT JOIN "UserMedia" um ON um."MediaId" = m."Id" AND um."UserId" = ?
            LEFT JOIN "Reviews"   r  ON r."MediaId"  = m."Id" AND r."UserId"  = ?
            WHERE m."Type" = 'game'
            ORDER BY m."Name"
        )");

        query.bind(1, CURRENT_USER_ID);
        query.bind(2, CURRENT_USER_ID);

        std::vector<GameDto> games;

        while (query.executeStep())
        {
            GameDto game{
                .id     = query.getColumn(0).getInt(),
                .name   = query.getColumn(1).getString(),
                .status = query.getColumn(2).getInt(),
            };

            if (!query.getColumn(3).isNull())
            {
                game.rating = query.getColumn(3).getInt();
            }
            if (!query.getColumn(4).isNull())
            {
                game.cover = query.getColumn(4).getString();
            }

            games.push_back(std::move(game));
        }

        return games;
    });


    webview->set_url("http://localhost:5173/");

    webview->on<saucer::webview::event::load>([&](auto) { window->show(); });

    co_await app->finish();
}

int main()
{
    return saucer::application::create({.id = "rate-anything"})->run(start);
}

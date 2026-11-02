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
    // Creates all tables if they don't exist yet. Safe to run on every startup.
    void init_schema(SQLite::Database &db)
    {
        db.exec(R"sql(
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
        )sql");
    }
 
    // ---------- Seeder ----------
    // Fills the database with test data, but only if the Games table is empty.
 
    struct SeedGame
    {
        std::string name;
        int status;                 // 1 Not started, 2 Playing, 3 Completed
        std::optional<int> rating;  // nullopt = not rated
        std::string release_date;
        std::string cover;          // "covers/far-cry-3.webp"
        std::string category;       // one of the names in G_Categories
    };
 
    void seed(SQLite::Database &db)
    {
        const int existing = db.execAndGet(R"(SELECT COUNT(*) FROM "Games")").getInt();
        if (existing > 0)
        {
            return; // already seeded (or the user has real data)
        }
 
        // One transaction: either everything is inserted or nothing is (and it's much faster)
        SQLite::Transaction transaction(db);
 
        // Categories
        db.exec(R"(INSERT INTO "G_Categories" ("Name") VALUES ('Action'), ('RPG'), ('Puzzle'))");
 
        const std::vector<SeedGame> games = {
            {"Far Cry 3",                3, 4,            "2012-11-29", "covers/far-cry-3.webp",    "Action"},
            {"Far Cry 4",                2, std::nullopt, "2014-11-18", "covers/far-cry-4.webp",    "Action"},
            {"Dishonored 2",             1, std::nullopt, "2016-11-11", "covers/dishonored-2.webp", "Action"},
            {"The Witcher 3: Wild Hunt", 3, 5,            "2015-05-19", "covers/witcher-3.webp",    "RPG"},
            {"Portal 2",                 3, 5,            "2011-04-18", "covers/portal-2.webp",     "Puzzle"},
        };
 
        SQLite::Statement insert_game(db, R"(
            INSERT INTO "Games" ("Name", "Status", "Rating", "ReleaseDate", "CoverPath")
            VALUES (?, ?, ?, ?, ?)
        )");
 
        SQLite::Statement link_category(db, R"(
            INSERT INTO "Games_Categories" ("GameId", "CategoryId")
            SELECT ?, "Id" FROM "G_Categories" WHERE "Name" = ?
        )");
 
        for (const auto &game : games)
        {
            insert_game.bind(1, game.name);
            insert_game.bind(2, game.status);
            if (game.rating) insert_game.bind(3, *game.rating);
            else             insert_game.bind(3); // binds NULL
            insert_game.bind(4, game.release_date);
            insert_game.bind(5, game.cover);
            insert_game.exec();
            insert_game.reset();
 
            link_category.bind(1, db.getLastInsertRowid());
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
        SQLite::Statement query(db, R"(SELECT "Id", "Name", "Status", "Rating", "CoverPath" FROM "Games" ORDER BY "Name")");

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
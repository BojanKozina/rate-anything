#include "SQLiteCpp/Database.h"
#include "SQLiteCpp/Statement.h"
#include "saucer/window.hpp"
#include <SQLiteCpp/SQLiteCpp.h>
#include <print>
#include <saucer/smartview.hpp>
#include <string>

coco::stray start(saucer::application *app) {
  auto window = saucer::window::create(app).value();
  auto webview = saucer::smartview::create({.window = window});

  const saucer::color background_color{0x0B, 0x09, 0x09, 0xFF};
  const saucer::size min_window_size{800, 600};

  SQLite::Database db("test1.db", SQLite::OPEN_READWRITE | SQLite::OPEN_CREATE);

  // Testing the sqlitecpp code and trying to to undertand the synstax, im
  // leaving it uncommented but has no real use right now
  db.exec("CREATE TABLE IF NOT EXISTS USERS ( ID INTEGER PRIMARY KEY "
          "AUTOINCREMENT, Name NVARCHAR(50) NOT NULL, LastName NVARCHAR(50), "
          "IsWorking BIT DEFAULT 1 NOT NULL)");

  // This is also just some testing i did to actually try out the new database
  // db.exec("INSERT INTO USERS (Name, LastName, IsWorking) VALUES
  // ('Bojan','Kozina', 1),('Ante', 'Kante', 0)");

  webview->set_dev_tools(true);

  window->set_min_size(min_window_size);

  window->set_decorations(saucer::window::decoration::partial);

  window->set_background(background_color);
  webview->set_background(background_color);

  webview->expose("printUsers", [&]() -> std::string {
    SQLite::Statement query(db, "SELECT * FROM USERS");

    std::string resultString;

    while (query.executeStep()) {

      int id = query.getColumn(0);
      std::string name = query.getColumn(1);
      std::string lastName = query.getColumn(2);
      std::string isWorking =
          (query.getColumn(3).getInt() == 1) ? "is working" : "is not working";

      resultString +=
          std::format("User {} - {} {} {}\n", id, name, lastName, isWorking);
    }

    return resultString;
  });

  webview->expose("call_me", [&](double a, double b) {
    std::println("Called with: a = {}, b = {}", a, b);
    return a + b;
  });

  webview->expose("call_me_too", [&]() -> coco::task<double> {
    auto random = *co_await webview->evaluate<double>("Math.random()");
    std::println("Random: {}", random);
    co_return random;
  });

  webview->set_url("http://localhost:5173/");

  webview->on<saucer::webview::event::load>([&](auto state) {
    // when the page reports it finished loading:
    window->show();
  });

  co_await app->finish();
}

int main() {
  return saucer::application::create({.id = "rate-anything"})->run(start);
}
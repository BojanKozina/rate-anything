#include "saucer/window.hpp"
#include <print>
#include <saucer/smartview.hpp>

coco::stray start(saucer::application *app) {
  auto window = saucer::window::create(app).value();
  auto webview = saucer::smartview::create({.window = window});

    const saucer::color background_color{0x0B, 0x09, 0x09, 0xFF};

  window->set_title("RateAnything");

  window->set_decorations(saucer::window::decoration::partial);



  window->set_background(background_color);

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
  return saucer::application::create({.id = "hello-world"})->run(start);
}
cmake_minimum_required(VERSION 3.21)
project(RateAnything LANGUAGES CXX VERSION 0.1.0)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# ------------------------------------------------------------
# Dependencies (CPM)
# ------------------------------------------------------------

include(cmake/CPM.cmake)

CPMAddPackage(
    NAME           saucer
    GIT_TAG ver/8.2.0
    GIT_REPOSITORY "https://github.com/saucer/saucer"
)

# ------------------------------------------------------------
# Executable
# ------------------------------------------------------------

add_executable(RateAnything)
target_sources(RateAnything PRIVATE app/main.cpp)

if(WIN32)
    enable_language(RC)
    target_sources(RateAnything PRIVATE app/resources/app.rc)
endif()

target_compile_features(RateAnything PRIVATE cxx_std_23)
set_target_properties(RateAnything PROPERTIES CXX_STANDARD 23 CXX_STANDARD_REQUIRED ON)

target_link_libraries(RateAnything PRIVATE saucer::saucer)
cmake_minimum_required(VERSION 3.21)
project(RateAnything LANGUAGES CXX VERSION 0.1.0)

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)

# ------------------------------------------------------------
# Dependencies (CPM)
# ------------------------------------------------------------

include(cmake/CPM.cmake)

# saucer-fill decides whether to polyfill std::jthread / move_only_function / views::join_with by
# compiling AND LINKING a test program. Configure without the MSVC environment (VS Code's CMake
# Tools with no kit selected) and that link fails for want of the CRT, so fill concludes the types
# are missing and redeclares them into namespace std -- every build then dies on
# "C2874: multiple declaration of 'std::jthread'". MSVC 19.40+ has all three, so don't ask.
if(MSVC AND MSVC_VERSION GREATER_EQUAL 1940)
    set(fill_replacements "" CACHE STRING "Standard library features to polyfill" FORCE)
endif()

CPMAddPackage(
    NAME           saucer
    GIT_TAG ver/8.2.0
    GIT_REPOSITORY "https://github.com/saucer/saucer"
)

CPMAddPackage(
    NAME           SQLiteCpp
    GIT_TAG        3.3.2
    GIT_REPOSITORY "https://github.com/SRombauts/SQLiteCpp"
    OPTIONS
        "SQLITECPP_RUN_CPPLINT OFF"
        "SQLITECPP_RUN_CPPCHECK OFF"
        "SQLITECPP_INTERNAL_SQLITE ON"
)


# ------------------------------------------------------------
# Executable
# ------------------------------------------------------------

add_executable(RateAnything)
target_sources(RateAnything PRIVATE app/main.cpp)

if(WIN32)
    enable_language(RC)
    target_sources(RateAnything PRIVATE app/resources/app.rc)
    # RC deps are not scanned by the generator, so .ico edits alone would not relink
    set_property(SOURCE app/resources/app.rc PROPERTY OBJECT_DEPENDS
        ${CMAKE_CURRENT_SOURCE_DIR}/app/resources/app.ico)
endif()

target_compile_features(RateAnything PRIVATE cxx_std_23)
set_target_properties(RateAnything PROPERTIES CXX_STANDARD 23 CXX_STANDARD_REQUIRED ON)

target_link_libraries(RateAnything PRIVATE saucer::saucer SQLiteCpp)
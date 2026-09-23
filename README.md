
# STEENE

> A modern web-based game platform for classic board games, strategy games, card games, puzzles, and arcade experiences.

STEENE is the game platform contained in the **Dark** repository. It is designed as a centralized gaming environment where users can discover games, authenticate their accounts, configure their platform preferences, and launch supported games without leaving the main STEENE interface.

The platform combines a dark-themed game store/dashboard with a modular JavaScript host that manages navigation, authentication, audio, settings, internationalization, game registration, and game execution.

---

## Table of Contents

- [Overview](#overview)
- [What STEENE Provides](#what-steene-provides)
- [Current Games](#current-games)
- [Game Roadmap](#game-roadmap)
- [Platform Architecture](#platform-architecture)
- [Project Structure](#project-structure)
- [Game Registry](#game-registry)
- [Game Launch System](#game-launch-system)
- [Authentication](#authentication)
- [Profile](#profile)
- [Settings](#settings)
- [Internationalization](#internationalization)
- [Audio System](#audio-system)
- [Game Communication](#game-communication)
- [Game Development](#game-development)
- [Adding a New Game](#adding-a-new-game)
- [Running STEENE Locally](#running-steene-locally)
- [Browser Requirements](#browser-requirements)
- [Development Guidelines](#development-guidelines)
- [Current Platform Status](#current-platform-status)
- [Future Direction](#future-direction)
- [License](#license)

---

# Overview

STEENE is structured as a **game host platform** rather than a single standalone game.

The main application acts as the host environment. Individual games are loaded into the host through an iframe, allowing each game to maintain its own implementation while still being launched, displayed, and controlled by the STEENE platform.

At a high level, the application works like this:

```
                         STEENE
                           │
             ┌─────────────┼─────────────┐
             │             │             │
         Dashboard     Authentication   Settings
             │             │             │
             └─────────────┼─────────────┘
                           │
                      Game Registry
                           │
                     Game Launcher
                           │
                    ┌──────┴──────┐
                    │             │
                Barricade       Chess
                    │             │
                    └──────┬──────┘
                           │
                       Game Iframe

```

The architecture is intentionally modular so that new games can be added without rebuilding the entire platform.


---

What STEENE Provides

The current platform includes the following major systems.

Game Discovery

The dashboard provides a game marketplace-style interface where games are presented through cards, categories, featured content, promotional sections, and search.

Game Registry

All games are represented in a centralized registry containing information such as:

Game ID

Game name

Description

Category

Thumbnail

Number of players

Supported game modes

Game route

Availability status


Game Launcher

Available games are launched through the STEENE platform host and loaded into the platform's game runner.

Authentication

STEENE includes account authentication with:

Login

Account creation

Logout

Current-session handling

Authentication state synchronization with supported games


User Profile

The platform includes a profile view for displaying user-related information.

Settings

Users can configure a wide range of platform preferences, including:

Music

Volume

Sound effects

Theme

Reduced motion

Compact mode

Performance display

Move confirmation

Board coordinates

Automatic chess promotion

Board orientation

Notifications

Match invitations

Friend requests

Game reminders

Online status

Profile visibility

Language


Internationalization

The platform contains translation data for multiple languages and uses data-i18n attributes and translated game registry content to support localized interfaces.

Current translation support includes:

English

Spanish

French

German


Background Audio

STEENE contains a centralized background audio manager capable of:

Playing multiple music tracks

Automatically advancing between tracks

Pausing music while a game is running

Resuming music after leaving a game

Volume control

Muting/unmuting

Browser autoplay recovery

Audio caching

Saving playback position

Saving the current track



---

Current Games

The current game registry identifies two games as available for launch.

STEENE Barricade

ID: barricade

Category: Board Games

Players: 2

Modes:

Local

AI

Online


Route:

games/board-games/barricade/index.html

Barricade is a strategy board game centered around blocking, jumping, movement, and secret destinations.


---

STEENE Chess

ID: chess

Category: Board Games

Players: 2

Modes:

Local

AI

Online


Route:

games/board-games/chess/index.html

Chess is implemented as a board-game experience within the STEENE host.


---

Game Roadmap

The game registry already contains a broader roadmap beyond the currently available games.

These entries are represented in the platform but are currently marked as coming_soon unless otherwise stated.

Board Games

Checkers

Backgammon

Go

Reversi

Ludo

Snakes and Ladders

Pucket


Card Games

Poker

Blackjack

Solitaire

Spades

Whot

Dominoes


Puzzle Games

Sudoku

Minesweeper

Word Search

Mahjong


Strategy Games

Empire

Stratego

Mancala


Arcade Games

Snake

Breakout

Pong


Other

STEENE Trivia


The registry allows these games to appear as part of the platform's broader catalog while preventing games that are not yet ready from being launched.


---

Platform Architecture

STEENE is primarily built using:

HTML

CSS

JavaScript

Browser APIs

Supabase authentication/data services

HTML iframes for game execution


The platform does not depend on a large frontend framework. Instead, functionality is separated into focused JavaScript modules.

The main application is loaded through:

index.html

The application then loads the platform systems in a deliberate order.

game-registry.js
        ↓
auth-state.js
        ↓
auth-ui.js
        ↓
audio-manager.js
        ↓
host.js
        ↓
router.js
        ↓
i18n.js
        ↓
navigation.js
        ↓
dashboard.js
        ↓
profile.js
        ↓
settings.js

This ordering allows the dashboard and views to depend on the core services they require.


---

Project Structure

The repository is organized approximately as follows:

Dark/
│
├── index.html
│
├── audio-files/
│   ├── background-music1.mp3
│   ├── background-music2.mp3
│   ├── background-music3.mp3
│   ├── background-music4.mp3
│   ├── background-music5.mp3
│   └── background-music6.mp3
│
├── steene/
│   │
│   ├── assets/
│   │   └── pieces/
│   │
│   ├── css/
│   │   ├── host.css
│   │   ├── dashboard.css
│   │   ├── profile.css
│   │   ├── settings.css
│   │   └── auth.css
│   │
│   └── js/
│       │
│       ├── audio/
│       │   └── audio-manager.js
│       │
│       ├── auth/
│       │   ├── auth-state.js
│       │   └── auth-ui.js
│       │
│       ├── components/
│       │   └── navigation.js
│       │
│       ├── core/
│       │   ├── game-registry.js
│       │   ├── host.js
│       │   ├── router.js
│       │   └── i18n.js
│       │
│       └── views/
│           ├── dashboard.js
│           ├── profile.js
│           └── settings.js
│
└── games/
    │
    ├── board-games/
    │   ├── barricade/
    │   └── chess/
    │
    └── shared/


---

Game Registry

The game registry is the central catalog for STEENE.

It defines the games known by the platform and provides the metadata used by the dashboard and game launcher.

A game entry follows the general structure:

{
    id: 'example-game',
    icon: '🎮',
    thumbnail: '...',
    category: 'board-games',
    route: 'games/example-game/index.html',
    players: '2',
    supportedModes: ['local', 'ai'],
    status: 'available'
}

Important Registry Fields

id

The unique identifier for the game.

Example:

id: 'chess'

The ID is used by the launcher to find the game.


---

name

The display name of the game.

Game names and descriptions can be localized through the registry's translation data.


---

thumbnail

The image displayed by the game card.


---

category

The game category.

Examples include:

board-games
card-games
puzzle-games
strategy-games
arcade-games


---

route

The location of the game's entry page.

Example:

games/board-games/chess/index.html

A game without a valid route cannot be launched.


---

players

Describes the intended player count.

Examples:

1
2
2-4
2-8


---

supportedModes

Describes the intended play modes.

Examples:

['local']

or:

['local', 'ai', 'online']


---

status

Controls whether the platform considers the game launchable.

Currently important statuses include:

available
coming_soon

Only games marked as:

available

are intended to be launched from the dashboard.


---

Game Launch System

Games are launched through the STEENE host rather than by navigating directly away from the platform.

The general flow is:

User selects game
        ↓
Dashboard validates game
        ↓
Game ID sent to STEENE host
        ↓
Game registry finds game
        ↓
Availability is checked
        ↓
Game route is resolved
        ↓
Game iframe receives route
        ↓
Game loads inside STEENE

The central launcher is located in:

steene/js/core/host.js

The host:

1. Looks up the game by ID.


2. Verifies that the game exists.


3. Verifies that the game is available.


4. Verifies that a route exists.


5. Finds the game iframe.


6. Updates the active game title.


7. Loads the game route.


8. Pauses platform background music.


9. Synchronizes authentication state.


10. Synchronizes settings.


11. Switches the interface to the game view.




---

Game Iframe

Games run inside:

<iframe id="game-frame"></iframe>

This creates a separation between the main platform and individual game implementations.

The platform remains responsible for:

Navigation

Authentication

Platform settings

Background music

Game selection

Game lifecycle


The individual game remains responsible for its own:

Board

Rules

Game state

Rendering

Controls

AI

Game-specific logic


This separation makes it possible to develop games independently while maintaining a consistent STEENE host experience.


---

Authentication

STEENE includes an authentication system integrated into the platform.

The authentication interface supports:

Login

Account creation

Logout

Session handling

Authentication state changes


The authentication UI is located in:

steene/js/auth/auth-ui.js

Authentication state is handled by:

steene/js/auth/auth-state.js

The main authentication modal is defined in:

index.html

The platform also attempts to synchronize the authenticated session with the currently loaded game.

This allows supported games to know about the user's active STEENE session without implementing an entirely separate platform authentication flow.


---

Profile

The profile interface is rendered by:

steene/js/views/profile.js

The main application provides:

#view-profile

as the profile view.

Profile functionality is designed to work with the platform's authentication state and user information.


---

Settings

STEENE includes a comprehensive settings system.

Settings are managed by:

steene/js/views/settings.js

Audio Settings

Users can control:

Music enabled/disabled

Music volume

Sound effects


Display Settings

Users can configure:

Theme

Reduced motion

Compact mode

Performance information


Available theme values currently include:

dark
midnight
graphite

Gameplay Settings

The platform exposes settings for:

Confirming moves

Showing board coordinates

Automatically promoting to a queen

Board orientation


Board orientation options include:

auto
white
black

Notification Settings

Users can configure:

Platform notifications

Match invitations

Friend requests

Game reminders


Privacy Settings

The settings interface includes:

Online status

Profile visibility

Friend request permissions

Game history visibility


Language

The current settings interface exposes:

English
Spanish
French
German

Settings are persisted locally so that preferences can survive page reloads.


---

Internationalization

STEENE has an internationalization layer located at:

steene/js/core/i18n.js

The main HTML interface uses attributes such as:

data-i18n="navGames"

Translation keys are used throughout the interface.

Game names and descriptions are also represented in localized registry data.

The platform currently includes translation dictionaries for:

English

Spanish

French

German


The language selection is integrated with the settings system.


---

Audio System

STEENE uses a centralized audio manager:

steene/js/audio/audio-manager.js

Background music is stored in:

audio-files/

Current tracks:

background-music1.mp3
background-music2.mp3
background-music3.mp3
background-music4.mp3
background-music5.mp3
background-music6.mp3

The audio manager automatically determines the correct path to the audio directory and maintains a playlist of the six tracks.

Audio Features

Automatic Track Progression

When a track ends, the audio manager moves to the next track.

After the sixth track, playback returns to the first track.

1 → 2 → 3 → 4 → 5 → 6 → 1 → ...

Game Audio Handling

When a game is launched:

Platform Music
      ↓
    Pause
      ↓
     Game
      ↓
    Exit
      ↓
Platform Music
     Resume

Volume

Volume is stored as a value between:

0.0

and:

1.0

Mute

The platform supports persistent mute/unmute state.

Audio Caching

The audio manager uses the browser Cache Storage API to cache music tracks locally.

The cache is named:

steene-audio-v2

This reduces the need to download the same audio files repeatedly.

Browser Autoplay

Modern browsers may prevent audio from starting automatically.

STEENE therefore attempts to resume audio after the user's first click or keyboard interaction.


---

Navigation and Routing

STEENE uses a lightweight client-side routing system.

The router is located at:

steene/js/core/router.js

The platform contains views including:

dashboard
profile
settings
game

The platform host also maintains view aliases so that game routes can resolve to the game's runner view.

The game runner is represented by the section:

view-game-runner

The router and host cooperate to switch between platform views without requiring a complete page reload.


---

Dashboard

The dashboard is implemented in:

steene/js/views/dashboard.js

The dashboard is responsible for rendering the game marketplace.

It contains areas for:

Hero/intro content

Featured game

Promotional games

Game discovery

Search

Game cards


The dashboard obtains game information from the central game registry rather than hardcoding individual game cards into the HTML.

This allows new games to be added primarily through the registry.


---

Game Categories

The current registry is organized around several categories.

Board Games

Barricade
Chess
Checkers
Backgammon
Go
Reversi
Ludo
Snakes and Ladders
Pucket

Card Games

Poker
Blackjack
Solitaire
Spades
Whot
Dominoes

Puzzle Games

Sudoku
Minesweeper
Word Search
Mahjong

Strategy Games

Empire
Stratego
Mancala

Arcade Games

Snake
Breakout
Pong

Knowledge

STEENE Trivia


---

Game Development

A STEENE game should be treated as an independent game application that can be hosted by the platform.

A typical game should have its own directory:

games/
└── category/
    └── game-id/
        └── index.html

For example:

games/
└── board-games/
    └── chess/
        └── index.html

A game can contain its own:

HTML
CSS
JavaScript
assets
game logic
AI
game-specific UI

Shared platform resources should only be used when they are intentionally part of the host/game integration.


---

Adding a New Game

Step 1 — Create the Game Directory

Create a directory under the appropriate category.

Example:

games/board-games/new-game/


---

Step 2 — Create the Entry Page

Create:

games/board-games/new-game/index.html

The page should contain the complete game interface.


---

Step 3 — Add Game Logic

Keep game-specific JavaScript within the game's directory whenever possible.

For example:

games/board-games/new-game/
├── index.html
├── css/
│   └── game.css
├── js/
│   └── game.js
└── assets/


---

Step 4 — Register the Game

Add the game to:

steene/js/core/game-registry.js

Example:

{
    id: 'new-game',
    icon: '🎮',
    thumbnail: '...',
    category: 'board-games',
    route: 'games/board-games/new-game/index.html',
    players: '2',
    supportedModes: ['local'],
    status: 'available'
}


---

Step 5 — Add Translations

If the game should be localized, add its name and description to the appropriate game registry translation dictionaries.


---

Step 6 — Test the Launcher

Verify that:

1. The game appears in the dashboard.


2. The game card is clickable.


3. The game ID is correct.


4. The route is correct.


5. The game loads inside the iframe.


6. Platform music pauses when the game opens.


7. Authentication synchronization works where required.


8. Returning to the dashboard works.


9. Platform music resumes correctly.




---

Shared Game Resources

Shared game resources are located under:

games/shared/

Platform-wide resources are located under:

steene/

Developers should carefully calculate relative paths when loading shared resources from a game directory.

For example, a resource loaded from a deeply nested game directory may require a different relative path than a resource loaded from index.html.

Incorrect relative paths can result in:

Missing styles

Missing scripts

Missing images

Missing audio

Failed game initialization



---

Running STEENE Locally

STEENE is a browser-based application and should be served through a local HTTP server during development.

Do not rely exclusively on opening:

file:///...

because browser security restrictions can affect:

JavaScript

Fetch requests

Cache Storage

iframe behavior

Audio

Authentication

Local resources


Using Python

From the repository root:

python -m http.server 8000

Then open:

http://localhost:8000

The main entry point is:

index.html


---

External Services

The platform currently uses Supabase-related functionality for application authentication/data services.

The browser application also loads the Supabase JavaScript client.

Production deployments should ensure that the correct project configuration and security policies are used.

Sensitive server-side credentials must never be placed directly into browser code.


---

Browser Requirements

STEENE is designed for modern browsers supporting:

HTML5

CSS3

JavaScript ES6+

ES modules / modern JavaScript APIs

HTML5 Audio

Local Storage

Cache Storage

Fetch API

iframe

Modern DOM APIs


Recommended browsers include current versions of:

Google Chrome

Microsoft Edge

Mozilla Firefox

Safari



---

Autoplay Considerations

Browsers commonly restrict websites from automatically playing audio before the user interacts with the page.

As a result, STEENE may require an initial:

Click

Key press

Other browser-approved interaction


before background music can begin.

This is expected browser behavior rather than a game failure.


---

Development Guidelines

Preserve Public APIs

Platfo

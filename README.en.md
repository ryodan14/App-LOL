# App-LOL

[Español](README.md) · **English**

Desktop companion for League of Legends. It brings builds, counters, runes, client data and an in-game overlay together in one app, with no ads and without asking for your Riot account.

![Windows 10 and 11](https://img.shields.io/badge/Windows-10%20%7C%2011-0078D4?logo=windows11&logoColor=white)
![Version](https://img.shields.io/github/v/release/ryodan14/App-LOL?label=version&color=d4b87a)
![MIT license](https://img.shields.io/badge/license-MIT-2ea44f)

> Personal project, not affiliated with or endorsed by Riot Games. League of Legends and its assets are property of Riot Games, Inc.

**[Download the Windows installer](https://github.com/ryodan14/App-LOL/releases/latest/download/App-LOL-Setup-x64.exe)** · [All releases](https://github.com/ryodan14/App-LOL/releases)

<p align="center">
  <img src="docs/media/demo.gif" alt="App-LOL walkthrough: home, champ select and live game" width="100%" />
</p>

<details>
<summary><strong>View app screenshots</strong></summary>

### Champ select

![Champ select with recommended bans and counters](docs/media/champ-select.png)

### Live game

![Live game with gold difference by lane](docs/media/partida.png)

</details>

## Features

- **Official data**: champions, items, spells, runes and recommendations from Data Dragon and Community Dragon. The patch is detected automatically and cached locally.
- **Items by champion**: each champion page shows the items the game client recommends for that champion, with a curated build when Riot does not publish data and adaptation to the enemy composition.
- **Item catalog**: search, category filters, price sorting, stats, build path and the champions that recommend each item.
- **Build analysis**: lane start, first completed item, boots, purchase order and ability priority, plus runes, summoner spells and direct counters.
- **Export to the client**: save the build as an item set and the rune page in League of Legends with one click, without copying anything by hand.
- **ARAM and Arena**: detects the mode from champ select or the live game, limits items to those available on the map and uses Arena juices. Arena does not generate a rune page.
- **Champ select**: allied and enemy composition, picks, bans, counters, recommended bans for your pick and a timer.
- **Live game**: KDA, CS, items, level, estimated gold per player and total and per-lane differences, plus objective timers.
- **Languages**: interface and Riot data in Spanish, English or Brazilian Portuguese, with a selector in Settings.
- **Click-through, customizable overlay**: shown only during champ select, live game or reconnect. It includes counters, recommended bans, gold by lane and timers. It does not steal focus or clicks; you can change its size, opacity, position and visible sections.
- **My account**: profile, level, icon, Solo/Duo and Flex ranks, LP, win rate and champion mastery.
- **Automatic startup**: starts with Windows, stays in the tray and appears when you open League.
- **No credentials**: uses only the client's local APIs. There are no logins, accounts or own servers.

## Requirements

### To use the app

- 64-bit Windows 10 or 11.
- League of Legends installed.
- Internet connection the first time, to download the patch data.
- No administrator permissions required.

### To develop

- Node.js 22 or newer.
- npm 10 or newer.
- Git.

## Download

The executables are published on [GitHub Releases](https://github.com/ryodan14/App-LOL/releases/latest), so you do not depend on keeping them only on your Desktop. Download links always point to the latest published version.

- **Recommended installer**: [App-LOL-Setup-x64.exe](https://github.com/ryodan14/App-LOL/releases/latest/download/App-LOL-Setup-x64.exe). Installs the app, creates Desktop and Start menu shortcuts and opens it when finished.
- **Portable**: [App-LOL-Portable-x64.exe](https://github.com/ryodan14/App-LOL/releases/latest/download/App-LOL-Portable-x64.exe). No installation required.

When you open the app for the first time, it is configured to start with Windows and appear when you open League of Legends. You can change both options in **Settings → System**.

## Windows installation

The app is distributed in two ways: an installer with shortcuts or a portable executable.

### Option A: installer

1. Run `App-LOL-Setup-x64.exe`.
2. Choose the installation folder if you want to change it.
3. The installer creates Desktop and Start menu shortcuts.
4. When it finishes, App-LOL opens automatically.

### Option B: portable

1. Run `App-LOL-Portable-x64.exe`.
2. The app extracts its files to a temporary folder and runs from there.
3. You can move or rename the executable, but do not delete it while the app is open.

### SmartScreen warning

The executables are not digitally signed, so Windows may show a SmartScreen warning. If you downloaded the file from this repository or built it yourself, use **More info → Run anyway**.

## Updates

The installed version checks for a new version when the app opens and every 6 hours. The update downloads in the background and installs when you close or restart App-LOL. You can also check manually in **Settings → Updates**.

> **Important**: App-LOL 0.1.0 does not include the updater and cannot update itself. If you already had it installed, download and install 0.2.0 once from GitHub Releases. From then on, future updates will be automatic.

The **portable version does not update itself**: download the new executable from the latest release. Automatic updates are available in the installed Windows version.

Versions are published as GitHub releases. The installer is updated through `latest.yml`, and users do not have to download anything again.

## First use

1. Open App-LOL.
2. Open League of Legends. The app detects the client automatically and loads your profile.
3. If you are already in champ select or in a game, go to **Game** to see the live analysis.
4. In **Settings** you can configure startup with Windows, the overlay and the manual client connection.

The first load downloads the patch data. Later launches use the local cache and are faster.

## Pages

### Home

Summary of the client status, quick access to the game and featured champions. If there is no active game, it shows the current status and shortcuts to get started.

### Game

Champ select and live game:

- Allies, enemies, picks, bans and roles.
- Counters and build suggestions.
- Recommended bans once you have chosen your champion.
- KDA, CS, level, items and spells.
- Estimated gold per player, total team difference and per-lane difference.
- Objective timers.
- Button to show or hide the overlay.

### Champions

Search and role filters, with details for each champion: stats, abilities, passive, lore, builds, runes and counters. The page includes the recommended items for that champion and links to the catalog.

### Items

Full catalog of the patch's items with search, category filters, price sorting, stats, component items and the champions the game recommends them for. From each item you can jump to the associated champions.

### My account

Summoner profile, level, icon, Solo/Duo and Flex 5v5 ranks, LP, combined win rate, streaks and mastery for the most played champions.

Account data is read from the local client. If League is closed, the page shows an empty state or an error with a retry option.

### Settings

- Interface and Riot data language: Spain Spanish, English or Brazilian Portuguese. In Spanish, “línea” and “sostenibilidad” are used instead of “carril” and “sustain”.
- Automatic client detection or manual connection by path, port and token.
- Refresh frequency.
- Always-on-top window, move to second monitor, overlay, splash arts and reduced motion.
- Start with Windows and appear when League opens.
- Cache status and data refresh.

## Builds and item order

App-LOL combines three sources to suggest a purchase: the champion's item guide, its role and archetype, and the enemy composition. In ARAM and Arena, only items available on that map are used; the item catalog shows Summoner's Rift items.

The build panel is divided into:

- **Recommended items**: up to six items from the champion's guide, with the indicated source (game data, curated build or archetype).
- **Lane start**: Doran + potion, World Atlas + potions if you are support, or jungle pet + potion if you jungle. The champion's start is used when it fits the role; otherwise it adapts to poke and archetype.
- **First completed item**: the one that best helps win the first trade. It is not always the most expensive: percentage penetration, anti-healing and stacking items are penalized as a first purchase.
- **Boots**: chosen based on enemy damage and crowd control, with the champion's recommended boots as a fallback.
- **Core**: three completed items that define your power spike.
- **Situational**: two items to respond to healing, tanks, shields, CC or dominant damage.
- **Purchase order**: numbers the sequence from the first completed item; boots appear later so they do not hide the first power spike.
- **Abilities**: Q/W/E/R priority and ultimate levels based on the kit and role.

Item selection combines:

- Per-champion item guides extracted from Riot's game data on CommunityDragon. They cover 121 champions in the current patch.
- Curated App-LOL builds for champions without a published guide, plus an archetype fallback for any new champion.
- Official Data Dragon stats.
- Archetype and role tags.
- Bonuses for each class's usual starting items.
- Enemy threats: healing, tanks, shields, CC, poke and physical or magic damage.
- Penalties for late purchases or situational items bought too early.

> Item guides are generated from Riot's game files published on CommunityDragon. When Riot does not publish a guide for a champion, App-LOL uses a curated build and marks it on the page. The final order is still a recommendation, not a win rate or a competitive tier list. No third-party APIs are used.

## Overlay

The overlay appears over the main monitor when you are in champ select, in a game or reconnecting. It is transparent, does not steal focus and lets clicks pass through to the game.

<p align="center">
  <img src="docs/media/overlay.gif" alt="App-LOL overlay with gold by lane, objectives, bans and counters" width="100%" />
</p>

- **Show or hide**: `Ctrl + Shift + O`, the top bar button or the tray menu.
- **Size**: in **Settings** you can choose from 60% to 100%, with the labels Very small, Small, Normal, Large and Very large. It uses 80% by default. The base window is 448×664 px.
- **Readability**: higher-contrast background, more separated gold rows and timers, and your lane highlighted.
- **Opacity**: the background ranges from 35% (almost transparent) to 100% (solid). It uses 75% by default.
- **Position**: top or bottom, left or right, or center side. The centered position brings timers closer to the minimap.
- **Second monitor**: in **Settings → Window and appearance** you can move the main window to the other monitor and leave the overlay over the game.
- **Sections**: you can enable or disable estimated gold (total and per lane), objective timers and the overlay during champ select.
- **Gold with a shortcut**: if you enable “Gold only with Ctrl+Shift+G”, the gold panel starts hidden and you show or hide it with that shortcut. The game's Tab key cannot be detected through the API.
- **Scope**: counters and recommended bans during champ select, estimated gold per player with total and per-lane difference, and objective timers.
- **Estimated gold**: calculated from game time, CS, KDA and item value. It is not the exact scoreboard gold, which is why it is shown with `≈`.
- **Exclusive fullscreen**: the overlay may not be visible in that mode. Use League in borderless fullscreen or windowed mode.

## Windows startup and tray

Automatic startup and appearing when League opens are enabled by default.

- When you sign in to Windows, App-LOL starts hidden in the tray.
- When the League client is detected, the window comes out of the tray without stealing focus.
- With automatic startup enabled, **X** hides the window in the tray. To close the app completely, use **Quit** in the tray menu.
- If you disable automatic startup, **X** closes the app.
- The tray menu also lets you open the app, enable the overlay and change startup with Windows or appearing when League opens.

Automatic startup is registered for the current user, does not require administrator permissions and is removed when you uninstall.

## League connection

By default, App-LOL looks for the client in these locations:

```text
C:\Riot Games\League of Legends
C:\Program Files\Riot Games\League of Legends
C:\Program Files (x86)\Riot Games\League of Legends
D:\Riot Games\League of Legends
E:\Riot Games\League of Legends
```

It can also read the `LeagueClientUx.exe` process and its `lockfile`.

If you use a different installation:

1. Open **Settings → League of Legends**.
2. Disable **Detect the client automatically**.
3. Enter the installation path, for example `C:\Riot Games\League of Legends`.
4. If needed, fill in the client port and token.
5. Leave the field to save and use **Detect again**.

The client token is local and sensitive. The app does not send it to the internet. Do not share your `lockfile` or token with anyone.

## Data and privacy

- Static data is downloaded from Riot Games' Data Dragon and Community Dragon.
- Game and account data is read from `127.0.0.1`: the client's local API (LCU) and the Live Client Data API on port `2999`.
- There are no accounts, telemetry, ads or own servers.
- The data cache is stored in the app's data directory inside your Windows profile.
- The app does not ask for a Riot username or password.

## Development

```bash
git clone https://github.com/ryodan14/App-LOL.git
cd App-LOL
npm install
npm run dev
```

### Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the app in development mode with reload. |
| `npm run typecheck` | Checks types for the main process and the renderer. |
| `npm test` | Runs the tests with Vitest. |
| `npm run build` | Builds the app without packaging it. |
| `npm run build:win` | Generates the NSIS installer, the portable executable and `latest.yml` in `release/`. |
| `npm run build:linux` | Generates an AppImage for Linux. |
| `node scripts/generate-champion-items.mjs` | Regenerates the per-champion item guides from CommunityDragon. |

The Windows artifacts are placed in `release/`:

```text
release/App-LOL-Setup-x64.exe
release/App-LOL-Setup-x64.exe.blockmap
release/App-LOL-Portable-x64.exe
release/latest.yml
```

> On Linux or WSL, `npm run build:win` requires Wine to generate the NSIS installer. If it is not available, run `npm run build` and then `npx electron-builder --win portable --publish never` to generate only the portable executable.

### Publishing a release

The recommended way is to let GitHub Actions build and publish the release:

1. Bump the version and create the tag: `npm version patch` (or `minor`/`major`).
2. Push the commit and the tag:

```bash
git push origin main --follow-tags
```

3. The `.github/workflows/release.yml` workflow builds on Windows, runs the tests and publishes the installer, `latest.yml` and the `.blockmap`.

If you build manually with `npm run build:win`, upload the installer, the `.blockmap`, the portable executable and `latest.yml` to the release. Do not publish the installer and the portable executable separately: all assets must be in the same release.

The `package.json` version must match the tag. For updates to work, the release must be public and must not remain a draft.

### Structure

```text
src/
  main/            Electron main process
    services/      LCU, static data, snapshots, settings and cache
    index.ts       Lifecycle, IPC, tray, automatic startup and shortcuts
    overlay.ts     Overlay window
    preview.ts     Test data for screenshots and QA
    window.ts      Main window and size persistence
  preload/         Secure bridge between main and renderer
  renderer/
    src/
      pages/       Home, Game, Champions, My account and Settings
      components/  Layout and UI components
      overlay/     Overlay interface
      store/       App state with Zustand
      lib/         IPC client, formatting and game data
  shared/          Types, constants and analysis engine
build/             Icons and installer customization
docs/media/        Screenshots and GIFs used in the README
```

## Troubleshooting

### The app does not detect the client

- Check that League of Legends is open and you have signed in.
- Open **Settings → League of Legends** and use **Detect again**.
- If you use a custom installation, disable automatic detection and enter the path.
- Check that the `lockfile` file exists inside the installation folder.

### The overlay does not appear

- Enable the overlay in **Settings** or with `Ctrl + Shift + O`.
- The overlay only appears in champ select, in a game or while reconnecting. Check that “Show in champ select” is enabled if it does not appear when picking a champion.
- If gold does not appear, use `Ctrl + Shift + G` or disable “Gold only with Ctrl+Shift+G” in Settings.
- In exclusive fullscreen it may remain hidden. Try borderless fullscreen.
- If another program uses `Ctrl + Shift + O` or `Ctrl + Shift + G`, change focus and try again.

### Windows blocks the executable

It is a binary without a digital signature. Use **More info → Run anyway** if you trust the file's source.

### The app does not start or the window does not appear

- If automatic startup is enabled, the app may be in the tray. Click the App-LOL icon.
- Open the tray menu and choose **Open App-LOL**.
- If the problem persists, close the app from the tray with **Quit** and open it again.

### Patch data does not load

- Check your internet connection.
- Open **Settings → Data** and use **Update data now**.
- If the patch changed recently, it may take a few minutes to become available on Data Dragon.

### My account appears empty

- The page needs the client to be open and signed in.
- Wait a few seconds and use **Refresh account**.
- If the client is under maintenance or offline, ranks and mastery may not be available.

## Project status

App-LOL is under active development. Some known limitations:

- The exact gold of all ten players is not exposed by the official API; it is estimated and shown as approximate.
- Item guides depend on Riot publishing the champion's data on CommunityDragon. For champions where it is not published, a curated build is used; the final order is a recommendation, not a win rate.
- There is no OCR or screen reading.
- The overlay may not work in exclusive fullscreen.
- The executables are not signed, so SmartScreen may warn.
- Full integration with a real game requires League of Legends open on Windows.

## Contributing

Improvements are developed from `develop` with a short branch per change:

- `feature/...` for functionality.
- `fix/...` for bugs, copy or small adjustments.
- `docs/...` for documentation.

Each branch should have one goal and small commits. Avoid mixing the analysis engine, interface and documentation in the same commit.

Before opening a change:

```bash
npm run typecheck
npm test
npm run build
```

Commit messages are kept in Spanish. The README is available in [Spanish](README.md) and [English](README.en.md).

## Legal notice

App-LOL is not affiliated with or endorsed by Riot Games. League of Legends and all related assets are property of Riot Games, Inc. Use of the local APIs is subject to Riot Games' terms of service.

<div align="center">

<img src="apps/site/src/assets/images/logo_500.png" alt="Lokus" width="120" height="120" />

# Cherit

**Turn notes into a reliable second brain you actually use**

Local-first. Privacy-focused. Blazing fast.

[Website](https://keshav.is-a.dev/Cherit/) · [Documentation](https://keshav.is-a.dev/Cherit/docs) · [Changelog](https://github.com/Keshav-writes-code/Cherit/releases)

---

[![GitHub Stars](https://img.shields.io/github/stars/Keshav-writes-code/Cherit?style=flat&logo=github&labelColor=1a1a2e&color=9f38e8)](https://github.com/Keshav-writes-code/Cherit/stargazers)
[![License](https://img.shields.io/badge/License-GPL_2.0-blue?style=flat&labelColor=1a1a2e&color=9f38e8)](LICENSE.md)
[![Release](https://img.shields.io/github/v/release/Keshav-writes-code/Cherit?include_prereleases&style=flat&labelColor=1a1a2e&color=9f38e8)](https://github.com/Keshav-writes-code/Cherit/releases)
[![Downloads](https://img.shields.io/github/downloads/Keshav-writes-code/Cherit/total?style=flat&labelColor=1a1a2e&color=9f38e8)](https://github.com/Keshav-writes-code/Cherit/releases)

</div>
<br />
<br />

## Goal

Cherit is trying to be the one stop shop for all your digital note-taking by inovating on

- **Ease of use** - one-click setup, just start writing.
- **Availability** - your notes, on every device.
- **Performace** - instant and smooth, no lag.
- **No Subscription** — Free forever.

<br />

## Project Screenshots

<img width="1210" height="837" alt="image" src="https://github.com/user-attachments/assets/920c3f9e-f2d0-498e-bcf4-a27b7117f71f" />
<img width="1210" height="838" alt="image" src="https://github.com/user-attachments/assets/a87a2221-1d46-4348-b382-880c9da05196" />

<br />
<br />

## Features

- **Obsidian-like editor** — familiar Markdown WYSIWYG feel.
- **Local LLM** — private, on-device help for writing and organizing.
- **Offline sync** — seamless local sync with one-time pairing.
- **Offline-first** — works fully without internet.
- **Mobile-first** — all the same features as desktop, built to feel great on Android & iOS.

<br />

## Tech Stack

| Layer    | Technology                                                                                                                                                       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend | [Svelte](https://svelte.dev/), [Prosemark](https://prosemark.com/), [UnoCSS](https://unocss.dev/), [daisyui](https://daisyui.com/), [Vite](https://vite.dev/)    |
| Backend  | [Rust](https://rust-lang.org/), [Tauri](https://tauri.app/), [Automerge](https://automerge.org/), [ONNX](https://onnxruntime.ai/), [Ai-Sdk](https://ai-sdk.dev/) |
| Editor   | [Prosemark](https://prosemark.com/) (Codemirror)                                                                                                                 |
| Testing  | [Vitest](https://vitest.dev/)                                                                                                                                    |

<br />

## Motivation

Obsidan is a Great Notes taking app for everyday person but it hides the syncing functionality behind a paywall

my aim with this project is to Built a cross platform (mobile & desktop), local first version of Obsidian with syncing functionality built in and work in a seamless. hassle-free way

read the full [inspiration](http://keshav.is-a.dev/Cherit/inspiration)

<br />

## Contribution

Run the dev Server on Nvidia Driver (linux)

```sh
WEBKIT_DISABLE_DMABUF_RENDERER=1 bun tauri dev
```

<br />

## Installation

so, there are builds present under the draft releases, if you wanted to install those (which is not recommended), you might fall into the following problem

for folks having older Nvidia GPU on linux and seeing a Blank screen when opening the app, just do these things

- edit the file at `/usr/share/applications/cherit.desktop`
- next to `Exec :`, replace it with this `Exec: WEBKIT_DISABLE_DMABUF_RENDERER=1 ...`

## Star History

<a href="https://www.star-history.com/#Keshav-writes-code/Cherit&type=date&legend=bottom-right">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=Keshav-writes-code/Cherit&type=date&theme=dark&legend=bottom-right" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=Keshav-writes-code/Cherit&type=date&legend=bottom-right" />
   <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=Keshav-writes-code/Cherit&type=date&legend=bottom-right" />
 </picture>
</a>

---

<div align="center">

**[Download Cherit](https://github.com/Keshav-writes-code/Cherit/releases)** · **[Read the Docs](https://keshav.is-a.dev/Cherit/docs)**

<sub>Built with care by the Cherit team and contributors.</sub>

</div>

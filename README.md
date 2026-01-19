<h1 align="center" id="title">Cherit</h1>

<p align="center"><img src="https://socialify.git.ci/Keshav-writes-code/Cherit/image?description=1&amp;logo=https%3A%2F%2Fraw.githubusercontent.com%2FKeshav-writes-code%2FCherit%2Fmain%2Fpublic%2Flogo_500.png&amp;name=1&amp;pattern=Plus&amp;theme=Auto" alt="project-image"></p>

## Project Screenshots

<img width="1210" height="837" alt="image" src="https://github.com/user-attachments/assets/920c3f9e-f2d0-498e-bcf4-a27b7117f71f" />
<img width="1210" height="838" alt="image" src="https://github.com/user-attachments/assets/a87a2221-1d46-4348-b382-880c9da05196" />

## Motivation

Obsidan is a Great Notes taking app for everyday person but it hides the syncing functionality behind a paywall

my aim with this project is to Built a cross platform (mobile & desktop), local first version of Obsidian with syncing functionality built in and work in a seamless. hassle-free way

read the full [inspiration](http://keshav.is-a.dev/Cherit/inspiration)

## 💻Built with

Technologies used in the project:

- [tauri](https://v2.tauri.app/)
- [sveltejs](https://svelte.dev/)
- [unocss](https://unocss.dev/)
- [daisyui](https://daisyui.com/)

## Contribution

Run the dev Server on Nvidia Driver (linux)

```sh
WEBKIT_DISABLE_DMABUF_RENDERER=1 bun tauri dev
```

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

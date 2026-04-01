---
layout: ../layout/MarkdownLayout.astro
page_metadata:
  title: "Inspiration"
  description: "Inspiration for Cherit. Read about my Mindset, Future Plans, and Goal."
  open_graph:
    title: "Inspiration | Cherit"
---

<h1 class="text-4xl font-bold text-center mb-8">Inspiration</h1>

## Context

i write a lot of notes, i like to store all my **tasks, plans, thoughts** in a digital document organised with directories.\
i love how easy [markdown](https://en.wikipedia.org/wiki/Markdown) is compared to writing plain text for notes and how good it looks when formatted.\
so, for my notes taking, i enjoyed using [Obsidian](https://obsidian.md/) as my daily driver.
i like it because

- i love the markdown editor (the WYSIWYG editor obsidian gives is the best in my Opinion)
- i love that it gives me that great editor on my mobile as well as my desktop
- i kind of like that it has extra features like extensions, notes linking, graph view, etc. but i don't really care about those

## Problems

- Obsidian is great but it **takes up a lot of space**
- Obsidian **Sync Functionality** is hidden behind a paywall
- when creating a new note, it creates it in the root of the **Vault's Directory**. it doesn't allow you to create a note in the last focused directory
- Obsidian is governed by a **For Profit** entity which shapes the ideation process to not be as open and collaborative as FOSS does

### Workarounds

- i solved the syncing problem by using an always running app called [Syncthing](https://syncthing.net/).\
  you set it up one time on both your devices and it will keep your notes synced as long as both devices are on the same local network

## Solution (Proper)

at some point, i got self motivated enough to tackle all these problems in a **proper** way by:

- creating a free and open source replica of Obsidian
- fixing storage space issues with [Tauri](https://v2.tauri.app/), which is a new framework for developing cross platform apps in a much much smaller footprint
- adding better file management functionalities that solve my gripe about creating notes
- **WIP**: creating a baked in, seamless, sync functionality that requires very minimal setup from the user

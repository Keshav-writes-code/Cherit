---
title: App Skeleton
description: Overview of the Cherit frontend file structure.
---

## Frontend

```sh
󰣞 src
├──  distribute # A dir related to distribution of the software
│   └──  linux
│       └──  flatpak
├──  index.html # the SPA html
├──  package.json
├──  public
├── 󰣞 src
│   ├──  App.svelte
│   ├──  assets
│   │   └──  fonts # Fonts Assets for App
│   ├──  components # Components are organized by how they appear in the Layout of the UI
│   │   ├──  general # Components that are generally used by the App
│   │   │   ├──  breadcrumb_path
│   │   │   │   └──  index.svelte
│   │   │   ├──  context_menu
│   │   │   │   └──  index.svelte
│   │   │   ├──  root_folder_selector
│   │   │   │   ├──  index.svelte
│   │   │   │   └──  states.svelte.ts
│   │   │   └──  submit_button
│   │   │       └──  index.svelte
│   │   ├──  main_section # Components Responsible for the Main UI of the app
│   │   │   ├──  index.svelte
│   │   │   ├──  pane_menu
│   │   │   │   └──  index.svelte
│   │   │   ├──  pdf_export_dialog
│   │   │   │   ├──  index.svelte
│   │   │   │   └──  states.svelte.ts
│   │   │   ├──  text_editor
│   │   │   │   ├──  editor
│   │   │   │   │   ├──  context_menu.ts
│   │   │   │   │   ├──  editor_config
│   │   │   │   │   │   ├──  index.ts
│   │   │   │   │   │   ├──  keymaps.ts
│   │   │   │   │   │   ├──  theme.css
│   │   │   │   │   │   └──  theme.ts
│   │   │   │   │   └──  index.svelte
│   │   │   │   ├──  editor_state.svelte.ts
│   │   │   │   ├──  editor_toolbar_mobile
│   │   │   │   │   ├──  index.svelte
│   │   │   │   │   └──  toolbar_buttons.ts
│   │   │   │   └──  index.svelte
│   │   │   └──  titlebar
│   │   │       └──  index.svelte
│   │   └──  sidebar_section # Components Responsible for the Sidebar UI of the app
│   │       ├──  bottom_sidebar.svelte
│   │       ├──  file_manager
│   │       │   ├──  context_menu.ts
│   │       │   ├──  index.svelte
│   │       │   ├──  items_renderer.svelte
│   │       │   ├── 󰂺 README.md
│   │       │   ├──  states.svelte.ts
│   │       │   └──  toolbar.svelte
│   │       └──  index.svelte
│   ├──  lib # Functions, Types and States that are used through out the components
│   │   ├──  operations # Function that facilitate various features
│   │   │   ├──  editor
│   │   │   │   ├──  commands
│   │   │   │   │   └──  index.ts
│   │   │   │   └──  index.ts
│   │   │   ├──  file_tree
│   │   │   │   ├──  builder.ts
│   │   │   │   ├──  index.ts
│   │   │   │   ├──  operations.ts
│   │   │   │   └──  utils
│   │   │   │       ├──  file_tree_utils.ts
│   │   │   │       ├──  index.ts
│   │   │   │       └──  platform_utils.ts
│   │   │   ├──  pdf_export
│   │   │   │   └──  index.ts
│   │   │   ├──  picker_dialog
│   │   │   │   └──  index.ts
│   │   │   ├──  user_activity
│   │   │   │   └──  index.ts
│   │   │   ├──  window_listeners
│   │   │   │   └──  index.ts
│   │   │   └──  workspace
│   │   │       ├──  index.ts
│   │   │       └──  operations.svelte.ts
│   │   ├──  states # States that represent shared Component States
│   │   │   ├──  domain_specific
│   │   │   │   ├──  context_menu.svelte.ts
│   │   │   │   ├──  index.ts
│   │   │   │   ├──  os.svelte.ts
│   │   │   │   ├──  user_activity.svelte.ts
│   │   │   │   └──  workspace.svelte.ts
│   │   │   ├──  global
│   │   │   │   └──  index.svelte.ts
│   │   │   └──  index.ts
│   │   └──  types # Types needed through the app
│   │       ├──  index.ts
│   │       └──  schema.ts
│   ├──  main.ts # Entry Point
│   ├──  styles
│   │   ├──  fonts.css # css for Fonts loading
│   │   └──  global.css # global css rules
│   └──  vite-env.d.ts
├──  svelte.config.js
├──  test
│   └──  components
│       └──  main_section
│           └──  text_editor
│               └──  editor
│                   └──  index.test.ts
├──  tsconfig.app.json
├──  tsconfig.json
├──  tsconfig.node.json
├──  uno.config.ts
└──  vite.config.ts

```

- the components dir will contains
  - svelte file
  - state files that are only needed for current component or child compoenents
- the lib dir contains
  - operations function definitions which perform some sort of operation
  - states that are needed for more than 2 sections of the app

## Backend

```sh
├──  src-tauri
│   ├──  build.rs
│   ├──  capabilities
│   │   └──  default.json
│   ├──  Cargo.lock
│   ├──  Cargo.toml
│   ├──  gen
│   │   └──  android # Android configs and functions
│   ├── 󰣞 src
│   │   ├──  desktop_test.rs
│   │   ├──  lib.rs # Tauri Commands, and other rust functions
│   │   └──  main.rs
│   ├──  tauri.conf.json
│   └──  versoview
```

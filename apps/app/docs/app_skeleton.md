## Frontend

```sh
󰣞 src
├──  App.svelte # Main Svelte App
├──  assets
│   └──  fonts
│       ├──  DTNightingale-Light.woff2
│       └──  Recoleta-RegularDEMO.otf
├──  components # Components for the App
│   ├──  breadcrumb_path
│   │   └──  index.svelte
│   ├──  context_menu
│   │   └──  index.svelte
│   ├──  root_folder_selector
│   │   └──  index.svelte
│   ├──  sidebar
│   │   ├──  bottom_sidebar.svelte
│   │   ├──  file_manager
│   │   │   ├──  file_manager_context_menu.ts
│   │   │   ├──  index.svelte
│   │   │   ├──  items_renderer.svelte
│   │   │   ├── 󰂺 README.md
│   │   │   └──  toolbar.svelte
│   │   └──  index.svelte
│   ├──  text_editor
│   │   ├──  index.svelte
│   │   ├──  obsidian_theme.ts
│   │   ├──  prosemark.svelte
│   │   └──  toolbar_buttons.ts
│   └──  titlebar
│       └──  index.svelte
├──  fonts.css
├──  lib # various modules made to be consumed by the app
│   ├──  file_tree # modules serving the purpose of file tree related stuff
│   │   ├──  builder.ts
│   │   ├──  index.ts
│   │   ├──  operations.ts
│   │   └──  utils
│   │       ├──  file_tree_utils.ts
│   │       ├──  index.ts
│   │       └──  platform_utils.ts
│   ├──  states # various UI states. All items are .svelte.ts files
│   │   ├──  ui_states.svelte.ts
│   │   ├──  index.ts
│   │   └──  context_menu.svelte.ts
│   └──  user_activity # module serve the user activity saving logic
│       └──  index.ts
├──  main.ts # main loader for the svelte app and other css modules
├──  types
│   └──  index.ts
└──  vite-env.d.ts
```

## How does Launch work?

- first, the app loads **recent path** from the local storage by using the [ _LazyStore_ API from tauri ](https://v2.tauri.app/plugin/store/#lazystore)
  - checks if the "recent path" data schema matches the latest zod schema defined in `apps/app/src/lib/user_activity.ts`
    - if valid,
      - it loads the last last_accessed path and builds the file tree
    - if not valid,
      - it clears the _LazyStore_
      - open folder selection dialog box

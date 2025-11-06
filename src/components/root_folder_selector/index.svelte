<script lang="ts">
  import { open } from "@tauri-apps/plugin-dialog";
  import { LazyStore } from "@tauri-apps/plugin-store";
  import { onMount } from "svelte";
  let state_open = $state(true);
  $effect(() => {
    if (root_path) state_open = false;
  });
  let { root_path = $bindable() }: { root_path: string | undefined } = $props();

  const user_activity = new LazyStore("user_activity.json");
  let recent_paths: string[] = $state([]);

  onMount(async () => {
    recent_paths = (await user_activity.get<string[]>("recent_paths")) ?? [];
  });
</script>

<dialog id="my_modal_1" open={state_open} class="modal">
  <div class="modal-box p-0 size-80% max-w-none flex max-w-250">
    <div class="w-70 bg-base-content/10">
      {#if recent_paths.length}
        <ul
          class="w-full bg-transparent gap-2 menu bg-base-200 rounded-box w-56"
        >
          <button
            onclick={async () => {
              await user_activity.clear();
              recent_paths = [];
            }}
            class="btn btn-square btn-ghost color-gray"
          >
            <div class=" i-tabler:trash-filled size-4"></div>
          </button>
          {#each recent_paths as path}
            <li>
              <button
                onclick={() => {
                  root_path = path;
                }}
                class="flex gap-0 flex-col items-baseline"
              >
                <p class="text-sm text-base-content/80">
                  {path.split(/[\\/]/).filter(Boolean).pop()!}
                </p>
                <p class="text-xs text-base-content/60">{path}</p>
              </button>
            </li>
          {/each}
        </ul>
      {:else}
        <div
          class="color-purple/60 i-tabler:folder-heart size-15 mx-auto mt-20"
        ></div>
        <p class="text-base-content/40 text-center mt-2 px-13">
          Recent Folders will show up here
        </p>
      {/if}
    </div>
    <div class="grow px-10 pt-15 flex flex-col">
      <div class="w-full flex flex-col items-center">
        <img alt="logo" class="size-30" src="logo_500.png" />
        <p class="font-[Recoleta] leading-normal mt-3 capitalize text-4xl">
          {__APP_NAME__}
        </p>
        <p class="text-base-content/60">Version {__APP_VERSION__}</p>
      </div>
      <div class="w-full flex justify-between mt-20 b-b-neutral/30 pb-3 b-b-1">
        <div>
          <p class="leading-relaxed">Open Folder as Vault</p>
          <p class="text-sm text-base-content/60">
            Choose an existing folder for Markdown Files
          </p>
        </div>
        <button
          class="btn btn-primary w-30"
          onclick={async () => {
            const folder = await open({
              multiple: false,
              directory: true,
              recursive: true,
            });
            if (!folder) return;
            root_path = folder;
            if (!recent_paths.includes(folder)) {
              recent_paths = [folder, ...recent_paths].slice(0, 10);
              await user_activity.set("recent_paths", recent_paths);
              await user_activity.save();
            }
          }}>Open</button
        >
      </div>
    </div>
  </div>
</dialog>

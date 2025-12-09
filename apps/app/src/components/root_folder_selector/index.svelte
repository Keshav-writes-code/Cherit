<script lang="ts">
  import {
    current_platform,
    current_platform_type,
    get_relative_path_parts,
  } from '@/lib/file_tree';
  import { check_recent_path_schema } from '@/lib/user_activity';
  import { root_folder_picker_dialog_state } from '@/lib/misc_global_states.svelte';
  import type { GenericPath } from '@/types';
  import { open } from '@tauri-apps/plugin-dialog';
  import { LazyStore } from '@tauri-apps/plugin-store';
  import { onMount } from 'svelte';
  import { AndroidFs } from 'tauri-plugin-android-fs-api';
  let { root_path = $bindable() }: { root_path: GenericPath | undefined } =
    $props();
  $effect(() => {
    if (root_path) root_folder_picker_dialog_state.open = false;
  });

  const user_activity = new LazyStore('user_activity.json');
  let recent_paths: GenericPath[] = $state([]);

  onMount(async () => {
    recent_paths =
      (await user_activity.get<GenericPath[]>('recent_paths')) ?? [];
    if (recent_paths.length) {
      // Check for Older Data Schema
      if (!check_recent_path_schema(recent_paths)) {
        await user_activity.clear();
        return (root_folder_picker_dialog_state.open = true);
      }
      root_path = {
        path: recent_paths[0].path,
        document_top_tree_uri: recent_paths[0].document_top_tree_uri,
      };
    } else root_folder_picker_dialog_state.open = true;
  });
</script>

<dialog
  id="my_modal_1"
  open={root_folder_picker_dialog_state.open}
  class="modal z-11"
>
  <div
    class="
    {current_platform_type == 'desktop' && 'size-80% lt-sm:flex-col'}
    {current_platform_type == 'mobile' && 'size-100% lt-sm:flex-col-reverse '}
    modal-box p-0 max-w-none flex max-w-250"
  >
    <form method="dialog">
      <button
        class="btn btn-sm btn-circle btn-ghost absolute
        {current_platform_type == 'mobile'
          ? 'top-12 right-4'
          : 'top-2 right-2'} "
        onclick={() => (root_folder_picker_dialog_state.open = false)}
      >
        ✕
      </button>
    </form>

    <div class="min-w-70 bg-base-content/10">
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
            aria-label="Delete All Recent folders"
          >
            <div class=" i-tabler:trash-filled size-4"></div>
          </button>
          {#each recent_paths as { path, document_top_tree_uri }}
            {@const path_parts = get_relative_path_parts(
              path,
              current_platform == 'android'
                ? 'content://com.android.externalstorage.documents/tree/primary%3A'
                : ''
            )}
            <li class="w-full">
              <button
                onclick={() => {
                  root_path = { path, document_top_tree_uri };
                  root_folder_picker_dialog_state.open = false;
                }}
                class="
                {root_path?.path == path && 'bg-base-100'}
                flex w-full gap-0 flex-col items-baseline"
              >
                <p class="text-sm text-base-content/80">
                  {path_parts.slice(-1)[0]}
                </p>
                <p
                  class="text-xs text-ellipsis overflow-hidden whitespace-nowrap min-w-0 w-full text-base-content/60"
                >
                  {path_parts.join('/')}
                </p>
              </button>
            </li>
          {/each}
        </ul>
      {:else if current_platform_type == 'desktop'}
        <div
          class="color-purple/60 i-tabler:folder-heart size-15 mx-auto mt-20"
        ></div>
        <p class="text-base-content/40 text-center mt-2 px-13">
          Recent Folders will show up here
        </p>
      {/if}
    </div>
    <div
      class="
      {current_platform_type == 'desktop' && 'px-10'}
      {current_platform_type == 'mobile' && 'px-3'}
      grow pt-14 flex flex-col"
    >
      <div class="w-full flex flex-col items-center">
        <img alt="logo" class="size-30" src="logo_500.png" />
        <p class="font-[Recoleta] leading-normal mt-3 capitalize text-4xl">
          {__APP_NAME__}
        </p>
        <p class="text-base-content/60">Version {__APP_VERSION__}</p>
      </div>
      <div class="w-full flex justify-between mt-20 b-b-neutral/30 pb-3 b-b-1">
        {#if current_platform_type == 'desktop'}
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
              root_path = {
                path: folder,
                document_top_tree_uri: null,
              };
              if (!recent_paths.find((p) => p.path === folder)) {
                recent_paths = [
                  { path: folder, document_top_tree_uri: null },
                  ...recent_paths,
                ].slice(0, 10);
                await user_activity.set('recent_paths', recent_paths);
                await user_activity.save();
              }
            }}>Open</button
          >
        {:else if current_platform_type == 'mobile'}
          <ul class="menu menu-xl w-full rounded-box">
            <li>
              <button
                class="grid grid-cols-[auto_auto_1fr]"
                onclick={async () => {
                  const uri = await AndroidFs.showOpenDirPicker();
                  if (!uri) return;
                  root_path = {
                    path: uri.uri,
                    document_top_tree_uri: uri.documentTopTreeUri,
                  };
                  if (!recent_paths.find((p) => p.path === uri.uri)) {
                    recent_paths = [
                      {
                        path: uri.uri,
                        document_top_tree_uri: uri.documentTopTreeUri,
                      },
                      ...recent_paths,
                    ].slice(0, 10);
                    await user_activity.set('recent_paths', recent_paths);
                    await user_activity.save();
                  }
                }}
              >
                <div class="size-6 i-tabler:folder-open"></div>
                Open folder as vault
                <div
                  class="i-tabler:chevron-right size-6 justify-self-end"
                ></div>
              </button>
            </li>
          </ul>
        {/if}
      </div>
    </div>
  </div>
</dialog>

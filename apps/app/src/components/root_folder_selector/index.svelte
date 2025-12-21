<script lang="ts">
  import {
    current_platform,
    current_platform_type,
    get_relative_path_parts,
  } from '@/lib/file_tree';
  import { get_latest_recent_path, RecentPaths } from '@/lib/user_activity';
  import {
    file_tree,
    opened_filenode,
    root_folder_picker_dialog_state,
    root_path,
  } from '@/lib/states';
  import type { GenericPath, RecentPath } from '@/types';
  import { open } from '@tauri-apps/plugin-dialog';
  import { LazyStore } from '@tauri-apps/plugin-store';
  import { onMount } from 'svelte';
  import { AndroidFs } from 'tauri-plugin-android-fs-api';
  $effect(() => {
    if (root_path.data) root_folder_picker_dialog_state.open = false;
  });

  const user_activity = new LazyStore('user_activity.json');
  let recent_paths: RecentPath[] = $state([]);

  onMount(async () => {
    const raw = (await user_activity.get<RecentPath[]>('recent_paths')) ?? [];
    if (!raw.length) return (root_folder_picker_dialog_state.open = true);

    const { data, success } = RecentPaths.safeParse(raw);
    if (!success) {
      await user_activity.clear();
      root_folder_picker_dialog_state.open = true;
      return;
    }
    root_path.data = get_latest_recent_path(data);
    recent_paths = data;
  });

  async function touch_recent_paths({
    path,
    document_top_tree_uri,
  }: GenericPath) {
    let processed = recent_paths.filter((v) => v.path !== path);
    processed = [
      { path, document_top_tree_uri, last_accessed: new Date() },
      ...processed,
    ].slice(0, 10);
    await user_activity.set('recent_paths', processed);
    recent_paths = processed;
    await user_activity.save();
  }

  function reset_workspace_state() {
    file_tree.data = undefined;
    opened_filenode.data = undefined;
  }
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
                  reset_workspace_state();
                  touch_recent_paths({ path, document_top_tree_uri });
                  root_path.data = { path, document_top_tree_uri };
                  root_folder_picker_dialog_state.open = false;
                }}
                class="
                {root_path.data?.path == path && 'bg-base-100'}
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
              reset_workspace_state();
              const generic_path: GenericPath = {
                path: folder,
                document_top_tree_uri: null,
              };
              root_path.data = generic_path;
              await touch_recent_paths(generic_path);
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
                  reset_workspace_state();
                  const generic_path: GenericPath = {
                    path: uri.uri,
                    document_top_tree_uri: uri.documentTopTreeUri,
                  };
                  root_path.data = generic_path;
                  await touch_recent_paths(generic_path);
                  await AndroidFs.persistUriPermission(uri);
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

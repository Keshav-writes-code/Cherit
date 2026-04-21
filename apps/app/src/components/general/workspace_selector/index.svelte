<script lang="ts">
  import { workspace_picker_dialog_open_state } from './states.svelte';
  import {
    current_platform,
    current_platform_type,
    opened_filenode,
    workspace_root_path,
  } from '@/lib/states/session';
  import { get_relative_path_parts } from '@/lib/operations/file_tree';
  import { show_folder_picker } from '@/lib/operations/picker_dialog';
  import { init_or_update_workspace } from '@/lib/operations/workspace';
  import logo from '@workspace/shared-assets/images/logo_500.png';
  import { persistent_states } from '@/lib/states/persistent/index.svelte';
</script>

<dialog open={workspace_picker_dialog_open_state.data} class="modal z-11">
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
        onclick={() => (workspace_picker_dialog_open_state.data = false)}
      >
        ✕
      </button>
    </form>

    <div class="min-w-70 bg-base-content/10">
      {#if persistent_states.states?.app_config.workspaces_metadata.length}
        <ul
          class="w-full bg-transparent gap-2 menu bg-base-200 rounded-box w-56"
        >
          <button
            onclick={async () => {
              if (!persistent_states.states) return;
              persistent_states.states.app_config.workspaces_metadata = [];
              await persistent_states.save();
            }}
            class="btn btn-square btn-ghost color-gray"
            aria-label="Delete All Recent folders"
          >
            <div class=" i-tabler:trash-filled size-4"></div>
          </button>
          {#each persistent_states.states.app_config.workspaces_metadata as { path }}
            {@const path_parts = get_relative_path_parts(
              path.path,
              current_platform == 'android'
                ? 'content://com.android.externalstorage.documents/tree/primary%3A'
                : ''
            )}
            <li class="w-full">
              <button
                onclick={async () => {
                  const recent_filenode_path = opened_filenode.data
                    ? {
                        path: opened_filenode.data.path,
                        document_top_tree_uri: null,
                      }
                    : undefined;

                  await init_or_update_workspace(
                    workspace_root_path.data?.path,
                    { path, recent_filenode_path }
                  );
                }}
                class="
                {workspace_root_path.data?.path == path.path && 'bg-base-100'}
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
        <img alt="logo" class="size-30" src={logo} />
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
              const path = await show_folder_picker();

              const recent_filenode_path = opened_filenode.data
                ? {
                    path: opened_filenode.data.path,
                    document_top_tree_uri: null,
                  }
                : undefined;

              await init_or_update_workspace(workspace_root_path.data?.path, {
                path,
                recent_filenode_path,
              });
            }}>Open</button
          >
        {:else if current_platform_type == 'mobile'}
          <ul class="menu menu-xl w-full rounded-box">
            <li>
              <button
                class="grid grid-cols-[auto_auto_1fr]"
                onclick={async () => {
                  const path = await show_folder_picker();
                  const recent_filenode_path = opened_filenode.data
                    ? {
                        path: opened_filenode.data.path,
                        document_top_tree_uri: null,
                      }
                    : undefined;

                  await init_or_update_workspace(
                    workspace_root_path.data?.path,
                    {
                      path,
                      recent_filenode_path,
                    }
                  );
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

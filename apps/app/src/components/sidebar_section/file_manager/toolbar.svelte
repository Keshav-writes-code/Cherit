<script lang="ts">
  import { add_new_folder, add_new_note } from '@/lib/operations/file_tree';
  import {
    drawer_open,
    opened_filenode,
    workspace_root_path,
  } from '@/lib/states';
  import {
    file_tree,
    focused_subtree,
    input_rename_elem,
    rename_sel_node,
    outlined_node,
    hover_newnode_button,
    expand_override_global,
    expand_override_fine_grain,
  } from './states.svelte';
  import { current_platform_type } from '@/lib/states/';
  import { trigger } from '@/lib/haptics';
  let {
    focused_directory_path,
  }: { focused_directory_path: string | undefined } = $props();

  let is_processing = $state(false);
  let icon_size = current_platform_type == 'desktop' ? 'size-5' : 'size-7';
</script>

<div
  class="text-[color-mix(in_srgb,var(--color-base-content)_65%,black)] pt-1.5 flex *:h-full pb-2
  {current_platform_type == 'desktop'
    ? 'justify-center'
    : 'justify-around b-b-1 b-b-[color-mix(in_srgb,var(--color-base-content)_20%,black)] py-2 *:color-[var(--color-primary)]  '}
  "
>
  <button
    aria-label="New File Button"
    class="btn btn-ghost hover:bg-[color-mix(in_srgb,var(--color-base-content)_22%,black)] btn-sm max-h-none p-1"
    disabled={!focused_directory_path}
    onmouseenter={() => (hover_newnode_button.data = true)}
    onmouseleave={() => (hover_newnode_button.data = false)}
    onmousedown={() => trigger()}
    onclick={async () => {
      if (
        !focused_directory_path ||
        !file_tree.data ||
        !focused_subtree.data ||
        !workspace_root_path.data ||
        is_processing
      )
        return;
      is_processing = true;
      opened_filenode.data = await add_new_note(
        focused_subtree.data,
        focused_directory_path,
        workspace_root_path.data
      );
      is_processing = false;

      const input: HTMLInputElement | null = document.getElementById(
        'note_file_name_input'
      ) as HTMLInputElement | null;
      if (!input) return;
      drawer_open.data = false;

      setTimeout(() => {
        input.focus();
        input.select();
      }, 0);
    }}
    ><div class="i-tabler:edit {icon_size}"></div>
  </button>
  <button
    aria-label="New Folder Button"
    class="btn btn-ghost hover:bg-[color-mix(in_srgb,var(--color-base-content)_22%,black)] btn-sm max-h-none p-1"
    disabled={!focused_directory_path}
    onmouseenter={() => (hover_newnode_button.data = true)}
    onmouseleave={() => (hover_newnode_button.data = false)}
    onmousedown={() => {
      trigger();
    }}
    onclick={async () => {
      if (
        !focused_directory_path ||
        !file_tree.data ||
        !focused_subtree.data ||
        !workspace_root_path.data ||
        is_processing
      )
        return;
      is_processing = true;
      const node = await add_new_folder(
        focused_subtree.data,
        focused_directory_path,
        workspace_root_path.data
      );
      rename_sel_node.data = node;
      setTimeout(() => {
        if (input_rename_elem.data) {
          input_rename_elem.data.focus();
          input_rename_elem.data.select();
        }
      }, 0);
      outlined_node.data = node;
      is_processing = false;
    }}
    ><div class="i-tabler:folder-plus {icon_size}"></div>
  </button>
  <!-- <button -->
  <!--   aria-label="Sort Button" -->
  <!--   class="btn btn-ghost hover:bg-[color-mix(in_srgb,var(--color-base-content)_22%,black)] btn-sm max-h-none p-1" -->
  <!--   ><div class="i-tabler:sort-ascending size-5"></div> -->
  <!-- </button> -->
  <button
    aria-label="Collapse Button"
    onmousedown={() => {
      trigger();
    }}
    onclick={() => {
      if (expand_override_fine_grain.size) {
        expand_override_fine_grain.clear();
        expand_override_global.data = false;
      } else {
        expand_override_global.data = !expand_override_global.data;
      }
    }}
    class="btn btn-ghost hover:bg-[color-mix(in_srgb,var(--color-base-content)_22%,black)] btn-sm max-h-none p-1"
    ><div
      class=" {expand_override_global && expand_override_fine_grain.size
        ? 'i-famicons:chevron-collapse'
        : ' i-famicons:chevron-expand '} {icon_size}"
    ></div>
  </button>
</div>

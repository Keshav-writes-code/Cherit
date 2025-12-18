<script lang="ts">
  import { add_new_folder, add_new_note } from '@/lib/file_tree';
  import {
    file_tree,
    focused_subtree,
    opened_filenode,
    root_path,
  } from '@/lib/states/ui_states.svelte';
  let {
    collapsed_state = $bindable(),
    hover_newnode_button = $bindable(),
    focused_directory,
  }: {
    collapsed_state: boolean;
    focused_directory: string | undefined;
    hover_newnode_button: boolean;
  } = $props();
  let is_processing = $state(false);
</script>

<div
  class="text-[color-mix(in_srgb,var(--color-base-content)_65%,black)] pt-1.5 flex justify-center *:h-full mb-2"
>
  <button
    aria-label="New File Button"
    class="btn btn-ghost hover:bg-[color-mix(in_srgb,var(--color-base-content)_22%,black)] btn-sm max-h-none p-1"
    disabled={!focused_directory}
    onmouseenter={() => (hover_newnode_button = true)}
    onmouseleave={() => (hover_newnode_button = false)}
    onclick={async () => {
      if (
        !focused_directory ||
        !file_tree.data ||
        !focused_subtree.data ||
        !root_path.data ||
        is_processing
      )
        return;
      is_processing = true;
      opened_filenode.data = await add_new_note(
        focused_subtree.data,
        focused_directory,
        root_path.data
      );
      is_processing = false;

      const input: HTMLInputElement | null = document.getElementById(
        'note_file_name_input'
      ) as HTMLInputElement | null;
      if (!input) return;
      setTimeout(() => {
        input.focus();
        input.select();
      }, 50);
    }}
    ><div class="i-tabler:edit size-5"></div>
  </button>
  <button
    aria-label="New Folder Button"
    class="btn btn-ghost hover:bg-[color-mix(in_srgb,var(--color-base-content)_22%,black)] btn-sm max-h-none p-1"
    disabled={!focused_directory}
    onmouseenter={() => (hover_newnode_button = true)}
    onmouseleave={() => (hover_newnode_button = false)}
    onclick={async () => {
      if (
        !focused_directory ||
        !file_tree.data ||
        !focused_subtree.data ||
        !root_path.data ||
        is_processing
      )
        return;
      is_processing = true;
      await add_new_folder(focused_subtree.data, focused_directory, root_path.data);
      is_processing = false;
    }}
    ><div class="i-tabler:folder-plus size-5"></div>
  </button>
  <!-- <button -->
  <!--   aria-label="Sort Button" -->
  <!--   class="btn btn-ghost hover:bg-[color-mix(in_srgb,var(--color-base-content)_22%,black)] btn-sm max-h-none p-1" -->
  <!--   ><div class="i-tabler:sort-ascending size-5"></div> -->
  <!-- </button> -->
  <button
    aria-label="Collapse Button"
    onclick={() => {
      collapsed_state = !collapsed_state;
    }}
    class="btn btn-ghost hover:bg-[color-mix(in_srgb,var(--color-base-content)_22%,black)] btn-sm max-h-none p-1"
    ><div
      class=" {collapsed_state
        ? 'i-famicons:chevron-expand'
        : 'i-famicons:chevron-collapse'} size-5"
    ></div>
  </button>
</div>

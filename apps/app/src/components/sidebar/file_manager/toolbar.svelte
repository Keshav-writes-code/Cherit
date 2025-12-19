<script lang="ts">
  import { type FileNode, type GenericPath } from '@/types';
  import { add_new_folder, add_new_note } from '@/lib/file_tree';
  let {
    collapsed_state = $bindable(),
    file_tree = $bindable(),
    opened_filenode = $bindable(),
    hover_newnode_button = $bindable(),
    root_path,
    focused_directory,
    focused_subtree,
  }: {
    collapsed_state: boolean;
    file_tree: FileNode[] | undefined;
    root_path: GenericPath | undefined;
    focused_directory: string | undefined;
    opened_filenode: FileNode | undefined;
    hover_newnode_button: boolean;
    focused_subtree: FileNode[] | undefined;
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
        !file_tree ||
        !focused_subtree ||
        !root_path ||
        is_processing
      )
        return;
      is_processing = true;
      opened_filenode = await add_new_note(
        focused_subtree,
        focused_directory,
        root_path
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
        !file_tree ||
        !focused_subtree ||
        !root_path ||
        is_processing
      )
        return;
      is_processing = true;
      await add_new_folder(focused_subtree, focused_directory, root_path);
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

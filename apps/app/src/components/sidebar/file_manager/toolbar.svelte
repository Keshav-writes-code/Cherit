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
  }: {
    collapsed_state: boolean;
    file_tree: FileNode[];
    root_path: GenericPath | undefined;
    focused_directory: string | undefined;
    opened_filenode: FileNode | undefined;
    hover_newnode_button: boolean;
  } = $props();
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
      if (!focused_directory || !root_path) return;
      await add_new_note(file_tree, focused_directory, root_path);
    }}
    ><div class="i-tabler:edit size-5"></div>
  </button>
  <button
    aria-label="New Folder Button"
    class="btn btn-ghost hover:bg-[color-mix(in_srgb,var(--color-base-content)_22%,black)] btn-sm max-h-none p-1"
    onmouseenter={() => (hover_newnode_button = true)}
    onmouseleave={() => (hover_newnode_button = false)}
    onclick={async () => {
      if (!focused_directory || !root_path) return;

      await add_new_folder(file_tree, focused_directory, root_path);
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

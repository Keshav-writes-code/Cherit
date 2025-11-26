<script lang="ts">
  import { type FileNode } from '@/types';
  import { create, mkdir } from '@tauri-apps/plugin-fs';
  import { exists, insert_node_in_place } from './file_tree_functions';
  let {
    collapsed_state = $bindable(),
    file_tree = $bindable(),
    opened_filenode = $bindable(),
    hover_newfile_button = $bindable(),
    root_path,
    focused_directory,
  }: {
    collapsed_state: boolean;
    file_tree: FileNode[];
    root_path: string | undefined;
    focused_directory: string | undefined;
    opened_filenode: FileNode | undefined;
    hover_newfile_button: boolean;
  } = $props();
</script>

<div
  class="text-[color-mix(in_srgb,var(--color-base-content)_65%,black)] pt-1.5 flex justify-center *:h-full mb-2"
>
  <button
    aria-label="New File Button"
    class="btn btn-ghost hover:bg-[color-mix(in_srgb,var(--color-base-content)_22%,black)] btn-sm max-h-none p-1"
    disabled={!focused_directory}
    onmouseenter={() => (hover_newfile_button = true)}
    onmouseleave={() => (hover_newfile_button = false)}
    onclick={async () => {
      let i = 0,
        name = 'Untitled';
      while (exists(file_tree, `${focused_directory}/${name}.md`))
        name = `Untitled ${++i}`;

      const new_file_path = `${focused_directory}/${name}.md`;
      await create(new_file_path);
      const node = insert_node_in_place(
        file_tree,
        {
          name,
          path: new_file_path,
          isDirectory: false,
          children: [],
        },
        root_path
      );
      opened_filenode = node;
    }}
    ><div class="i-tabler:edit size-5"></div>
  </button>
  <button
    aria-label="New Folder Button"
    class="btn btn-ghost hover:bg-[color-mix(in_srgb,var(--color-base-content)_22%,black)] btn-sm max-h-none p-1"
    onclick={async () => {
      let i = 0,
        name = 'Untitled';
      while (exists(file_tree, `${focused_directory}/${name}`))
        name = `Untitled ${++i}`;

      const new_folder_path = `${focused_directory}/${name}`;
      await mkdir(new_folder_path);
      insert_node_in_place(
        file_tree,
        {
          name,
          path: new_folder_path,
          isDirectory: true,
          children: [],
        },
        root_path
      );
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

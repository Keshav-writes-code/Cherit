<script lang="ts">
  import {
    add_new_folder,
    add_new_note,
    current_platform_type,
  } from '@/lib/file_tree';
  import {
    file_tree,
    focused_subtree,
    opened_filenode,
    root_path,
  } from '@/lib/states';
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
  let icon_size = current_platform_type == 'desktop' ? 'size-5' : 'size-7';
</script>

<div
  class="text-[color-mix(in_srgb,var(--color-base-content)_65%,black)] pt-1.5 flex *:h-full mb-2
  {current_platform_type == 'desktop'
    ? 'justify-center'
    : 'justify-around b-b-1 b-b-[color-mix(in_srgb,var(--color-base-content)_20%,black)] py-2 *:color-[var(--color-primary)]  '}
  "
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
    ><div class="i-tabler:edit {icon_size}"></div>
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
      await add_new_folder(
        focused_subtree.data,
        focused_directory,
        root_path.data
      );
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
    onclick={() => {
      collapsed_state = !collapsed_state;
    }}
    class="btn btn-ghost hover:bg-[color-mix(in_srgb,var(--color-base-content)_22%,black)] btn-sm max-h-none p-1"
    ><div
      class=" {collapsed_state
        ? 'i-famicons:chevron-expand'
        : 'i-famicons:chevron-collapse'} {icon_size}"
    ></div>
  </button>
</div>

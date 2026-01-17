<script lang="ts">
  import { current_platform_type, rename_file } from '@/lib/file_tree';
  import { focused_subtree, root_path } from '@/lib/states';
  import type { Node } from '@/types';
  import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
  import { toast } from 'svelte-sonner';
  import Editor from './editor/index.svelte';
  import MobileToolbar from './editor_toolbar_mobile/index.svelte';
  import { editor_view } from './editor_state.svelte';

  let {
    filenode = $bindable(),
  }: {
    filenode: Node | undefined;
  } = $props();
  let text_content: string | undefined = $state();
  let current_file_name: string | undefined = $state();
  let is_file_named_changed: boolean = $state(false);
  let mobile_toolbar_visible: boolean = $state(false);

  $effect(() => {
    if (!filenode) return;
    readTextFile(filenode.path)
      .then((res) => {
        text_content = res || '\n';
        current_file_name = filenode?.name;
      })
      .catch((err) => {
        toast.error(err);
        filenode = undefined;
        text_content = undefined;
        current_file_name = undefined;
      });
  });
</script>

<div
  class="w-full isolate px-8 flex justify-center flex-1 overflow-auto
{current_platform_type == 'mobile' && 'pt-22'}
  "
>
  <div class="max-w-170 w-full font-sans" id="text_editor">
    <input
      type="text"
      id="note_file_name_input"
      oninput={(e) => {
        current_file_name = current_file_name?.replace(
          /[^A-Za-z0-9 _.\-()]/g,
          ''
        );
        is_file_named_changed = current_file_name != filenode?.name;
      }}
      onfocusout={async () => {
        if (!is_file_named_changed) return;
        if (!current_file_name || !filenode || !focused_subtree.data) return;
        try {
          await rename_file(
            filenode,
            current_file_name,
            focused_subtree.data,
            root_path.data?.document_top_tree_uri ?? null
          );
          is_file_named_changed = false;
        } catch (e) {
          if (e instanceof Error) toast.error(e.message);
        }
      }}
      onkeydown={async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (editor_view.data) editor_view.data.focus();
        }
      }}
      bind:value={current_file_name}
      class="w-full outline-none b-0 focus:ring-0 mb-16 mt-10 font-semibold text-5xl"
    />

    <Editor
      {text_content}
      write_to_file={(content) => {
        if (!filenode) return;
        writeTextFile(filenode?.path, content);
      }}
      on_focus_in={() => {
        mobile_toolbar_visible = true;
      }}
      on_focus_out={() => {
        mobile_toolbar_visible = false;
      }}
    />
  </div>
</div>

{#if current_platform_type == 'mobile' && mobile_toolbar_visible && editor_view.data}
  <MobileToolbar editor_view={editor_view.data} />
{/if}

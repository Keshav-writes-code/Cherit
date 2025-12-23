<script lang="ts">
  import { rename_file } from '@/lib/file_tree';
  import { focused_subtree } from '@/lib/states';
  import type { Node } from '@/types';
  import { type EditorView } from '@codemirror/view';
  import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
  import { toast } from 'svelte-sonner';
  import Prosemark from './prosemark.svelte';

  let {
    filenode = $bindable(),
  }: {
    filenode: Node | undefined;
  } = $props();
  let text_content: string | undefined = $state();
  let current_file_name: string | undefined = $state();
  let is_file_named_changed: boolean = $state(false);
  let editor_view: EditorView | undefined = $state();

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

<div class="w-full px-8 flex justify-center flex-1 overflow-auto">
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
          rename_file(filenode, current_file_name, focused_subtree.data);
          is_file_named_changed = false;
        } catch (e) {
          if (e instanceof Error) toast.error(e.message);
        }
      }}
      onkeydown={async (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (editor_view) editor_view.focus();
        }
      }}
      bind:value={current_file_name}
      class="w-full outline-none b-0 focus:ring-0 mb-16 mt-10 font-semibold text-5xl"
    />

    <Prosemark
      {text_content}
      bind:editor_view
      write_to_file={(content) => {
        if (!filenode) return;
        writeTextFile(filenode?.path, content);
      }}
    />
  </div>
</div>

<script lang="ts">
  import { rename_node } from '@/lib/operations/file_tree';
  import { workspace_root_path } from '@/lib/states';
  import type { Node } from '@/lib/types';
  import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
  import { invoke } from '@tauri-apps/api/core';
  import { toast } from 'svelte-sonner';
  import Editor from './editor/index.svelte';
  import MobileToolbar from './editor_toolbar_mobile/index.svelte';
  import { editor_view } from './editor_state.svelte';
  import { focused_subtree } from '@/components/sidebar_section/file_manager/states.svelte';
  import { current_platform_type } from '@/lib/states/domain_specific/os.svelte';
  import { listen } from '@tauri-apps/api/event';

  let {
    filenode = $bindable(),
  }: {
    filenode: Node | undefined;
  } = $props();
  let text_content: string | undefined = $state();
  let current_file_name: string | undefined = $state();
  let is_file_named_changed: boolean = $state(false);
  let mobile_toolbar_visible: boolean = $state(false);

  function load_file_content() {
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
  }

  $effect(() => {
    load_file_content();
  });

  $effect(() => {
    const unlisten = listen('sync-file-updated', (event) => {
      const updated_relative_path = event.payload as string;
      // The incoming event payload is a relative path.
      // For a strict match, we'd compare base_dir + relative_path to filenode.path.
      // As a simple MVP, check if the active file path ends with the updated path.
      if (filenode && filenode.path.endsWith(updated_relative_path)) {
        // Reload contents from disk. This updates text_content,
        // but the codemirror editor needs to be informed.
        // To force Svelte to recreate the Editor component or re-eval state,
        // we briefly clear the content.
        readTextFile(filenode.path)
          .then((res) => {
            // Update state if changed
            if (text_content !== res) {
              text_content = res;
              if (editor_view.data) {
                editor_view.data.dispatch({
                  changes: {
                    from: 0,
                    to: editor_view.data.state.doc.length,
                    insert: res || '\n',
                  },
                });
              }
            }
          })
          .catch(console.error);
      }
    });

    return () => {
      unlisten.then((f) => f());
    };
  });
</script>

<div
  class="w-full isolate px-8 flex justify-center flex-1 overflow-auto scrollbar-setup
{current_platform_type == 'mobile' && 'pt-22'}
  "
>
  <div class="max-w-180 w-full font-sans" id="text_editor">
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
          await rename_node({
            node: filenode,
            new_name: current_file_name,
            parent_subtree: focused_subtree.data,
            document_top_tree_uri:
              workspace_root_path.data?.document_top_tree_uri ?? null,
          });
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

        // Trigger sync if enabled
        invoke('sync_file', { filePath: filenode?.path }).catch((e) => {
          console.warn('Failed to trigger sync: ', e);
        });
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

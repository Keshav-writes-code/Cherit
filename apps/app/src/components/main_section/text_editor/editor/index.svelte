<script lang="ts">
  import { EditorView } from '@codemirror/view';
  import { editor_view, is_contents_changed } from '../editor_state.svelte';
  import type { MenuItem } from '@/lib/types';
  import { get_desktop_context_menu } from './context_menu';
  import { create_editor } from './editor_config';
  import './editor_config/theme.css';
  import { current_platform_type } from '@/lib/states/';
  import { context_menu } from '@/lib/states';
  let {
    text_content,
    write_to_file,
    on_focus_in,
    on_focus_out,
  }: {
    text_content: string | undefined;
    on_focus_in?: () => void;
    on_focus_out?: () => void;
    write_to_file: (markdown_content_state: string) => void;
  } = $props();
  let element: HTMLDivElement | undefined = $state();
  $effect(() => {
    let newEditor: EditorView | undefined;
    if (text_content && element) {
      newEditor = create_editor(text_content, element, is_contents_changed);
      editor_view.data = newEditor;
    }
    return () => {
      newEditor?.destroy();
    };
  });
  function handle_node_right_click(e: MouseEvent) {
    let context_menu_items: MenuItem[] | undefined;
    if (!editor_view.data) return;
    if (current_platform_type == 'desktop')
      context_menu_items = get_desktop_context_menu(editor_view.data);

    if (!context_menu_items) return;
    context_menu.open(e, context_menu_items);
  }
</script>

<div
  role="application"
  bind:this={element}
  onfocusout={() => {
    if (on_focus_out) on_focus_out();
    if (!editor_view.data || !is_contents_changed.data) return;
    write_to_file(editor_view.data.state.doc.toString());
    is_contents_changed.data = false;
  }}
  oncontextmenu={(e) => handle_node_right_click(e)}
  class="pb-50vh"
  id="codemirror-container"
  onfocusin={on_focus_in}
></div>

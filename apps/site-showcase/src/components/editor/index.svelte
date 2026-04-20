<script lang="ts">
  import { create_editor } from '../../../../app/src/components/main_section/text_editor/editor/editor_config/';
  import MobileToolbar from '../../../../app/src/components/main_section/text_editor/editor_toolbar_mobile/index.svelte';
  import '../../../../app/src/components/main_section/text_editor/editor/editor_config/theme.css';
  import markdown_content from './data.md?raw';
  import type { EditorView } from '@codemirror/view';

  let element: HTMLDivElement | undefined = $state();
  let editor_view = $state<EditorView>();
  let mobile_toolbar_visible = $state(false);
  let { class: classes }: { class?: string } = $props();

  $effect(() => {
    if (!element) return;
    editor_view = create_editor(markdown_content, element);
  });
</script>

<div
  role="application"
  bind:this={element}
  class=" {classes} w-full font-sans"
  id="codemirror-container"
  onfocusin={() => {
    mobile_toolbar_visible = true;
  }}
  onfocusout={() => {
    mobile_toolbar_visible = false;
  }}
></div>
{#if editor_view && mobile_toolbar_visible}
  <MobileToolbar class="sm:hidden" {editor_view} />
{/if}

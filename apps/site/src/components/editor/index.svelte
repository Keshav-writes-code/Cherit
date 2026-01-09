<script lang="ts">
  import { create_editor } from "../../../../app/src/components/main_section/text_editor/editor/editor_config";
  import "../../../../app/src/components/main_section/text_editor/editor/editor_theme/theme.css";
  let element: HTMLDivElement | undefined = $state();
  let { class: classes }: { class?: string } = $props();

  import markdown_content from "./data.md?raw";

  $effect(() => {
    if (!element) return;
    create_editor(markdown_content, element);
  });
</script>

<div
  role="application"
  bind:this={element}
  class=" {classes} w-full font-sans"
  id="codemirror-container"
></div>

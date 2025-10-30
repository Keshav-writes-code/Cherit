<script lang="ts">
  import { Editor } from "@tiptap/core";
  import { StarterKit } from "@tiptap/starter-kit";
  import { Markdown } from "@tiptap/markdown";

  let { text_content }: { text_content: string | undefined } = $props();

  let element: HTMLDivElement | undefined = $state();
  let editor: Editor | undefined = $state();

  $effect(() => {
    let newEditor: Editor | undefined;
    if (text_content && element) {
      newEditor = new Editor({
        element: element,
        extensions: [StarterKit, Markdown],
        content: text_content,
        contentType: "markdown",
      });
    }
    editor = newEditor;

    return () => {
      newEditor?.destroy();
    };
  });
</script>

<div bind:this={element} class="w-full outline-none"></div>

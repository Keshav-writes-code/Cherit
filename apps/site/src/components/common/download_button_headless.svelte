<script lang="ts">
  import type { Snippet } from "svelte";

  let { class: classes, children }: { class?: string; children: Snippet } =
    $props();
</script>

<button class="{classes} ">
  {@render children()}
</button>

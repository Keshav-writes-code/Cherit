<script lang="ts">
  import type { Snippet } from "svelte";

  let { class: classes, children }: { class?: string; children: Snippet } =
    $props();
</script>

<button
  class="{classes} btn btn-primary btn-xs sm:btn-sm md:btn-md lg:btn-lg xl:btn-xl"
>
  {@render children()}
</button>

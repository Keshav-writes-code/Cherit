<script lang="ts">
  import type { FileNode } from "@/types";
  let {
    filenode,
    root_path,
  }: { filenode: FileNode | undefined; root_path: string | undefined } =
    $props();
  function getPathSegments(filePath: string, rootPath: string): string[] {
    const relative = filePath.replace(
      rootPath.endsWith("/") ? rootPath : rootPath + "/",
      "",
    );
    return relative.split("/").filter(Boolean);
  }
  let file_path_array: string[] = $state([]);
  $effect(() => {
    if (!filenode || !root_path) {
      file_path_array = [];
      return;
    }
    file_path_array = getPathSegments(filenode.path, root_path);
  });
</script>

<div class="breadcrumbs text-xs">
  <ul>
    {#each file_path_array as segment}
      <li
        class={segment != file_path_array[file_path_array.length - 1]
          ? "text-[color-mix(in_srgb,var(--color-base-content)_80%,black)]"
          : ""}
      >
        {segment.split(".md")[0]}
      </li>
    {/each}
  </ul>
</div>

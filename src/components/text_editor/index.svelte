<script lang="ts">
  import BreadCrumb from "@/components/breadcrumb_path/index.svelte";

  import type { FileNode } from "@/types";

  let {
    filenode,
    root_path,
  }: { filenode: FileNode | undefined; root_path: string | undefined } =
    $props();
</script>

<BreadCrumb {filenode} {root_path} />
<textarea class="textarea w-full h-full b-none outline-none" placeholder="Bio"
></textarea>

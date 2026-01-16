<script lang="ts">
  import TitleBar from '@/components/main_section/titlebar/index.svelte';
  import TextEditior from '@/components/main_section/text_editor/index.svelte';
  import PdfRendered from '@/components/main_section/pdf_export_dialog/index.svelte';
  import { opened_filenode, pdf_export_status } from '@/lib/states';
  import { current_platform_type } from '@/lib/file_tree';
  import BreadCrumb from '@/components/general/breadcrumb_path/index.svelte';
  import PaneMenu from '@/components/main_section/pane_menu/index.svelte';
</script>

<TitleBar />
<div
  class="w-full z-1 bg-[linear-gradient(to_bottom,var(--color-base-100)_20%,transparent)] h-20 absolute top-0"
></div>

{#if current_platform_type == 'desktop'}
  <div class=" w-full h-10 grid grid-cols-[1fr_auto_1fr] items-center px-2">
    <!-- FOr later Use -->
    <div></div>
    <BreadCrumb filenode={opened_filenode.data} />
    <div class="justify-self-end flex py-1 h-full">
      <PaneMenu filenode={opened_filenode.data} />
    </div>
  </div>
{/if}
<TextEditior bind:filenode={opened_filenode.data} />

{#if pdf_export_status.data && opened_filenode.data}
  <PdfRendered
    bind:open={pdf_export_status.data}
    filenode={opened_filenode.data}
  />
{/if}

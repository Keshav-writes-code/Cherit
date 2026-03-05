<script lang="ts">
  import type { Node, MenuItem } from '@/lib/types';
  import { pdf_export_status } from '@/components/main_section/pdf_export_dialog/states.svelte';
  import { context_menu } from '@/lib/states';
  import { current_platform_type } from '@/lib/states/';
  import { trigger } from '@/lib/haptics';

  let { filenode }: { filenode: Node | undefined } = $props();
  const menu_items: MenuItem[] = [
    {
      label: 'Export to PDF',
      icon_class: 'i-tabler:file-type-pdf',
      action: async () => {
        if (!filenode) return;
        pdf_export_status.data = true;
      },
    },
  ];
</script>

<button
  aria-label="menu button"
  class=" btn btn-ghost text-[color-mix(in_srgb,var(--color-base-content)_80%,black)] min-h-none max-h-none h-full aspect-square p-none
  {current_platform_type == 'mobile' && 'btn-soft btn-circle btn-lg'}
  "
  onmousedown={() => trigger()}
  onclick={(e) => {
    const { right: x, bottom: y } = (
      e.currentTarget as HTMLButtonElement
    ).getBoundingClientRect();
    context_menu.open(e, menu_items, { x, y });
  }}
>
  <div
    class="i-tabler:dots-vertical size-5
    {current_platform_type == 'mobile' &&
      'color-[var(--color-primary)] size-7.5'}"
  ></div>
</button>

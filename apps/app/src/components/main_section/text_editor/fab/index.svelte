<script lang="ts">
  import type { MenuItem } from '@/types';
  type FabItem = Omit<MenuItem, 'divider' | 'icon_class'> & {
    icon_class: string;
  };

  let items: FabItem[] = [
    {
      label: 'Open Camera',
      icon_class: 'i-tabler:camera-filled size-6',
    },
    {
      label: 'Open Image Picker',
      icon_class: 'i-tabler:photo-filled size-6',
    },
    {
      label: 'Open Ai Tools',
      icon_class:
        'i-healthicons:artificial-intelligence size-7 bg-[linear-gradient(214deg,#FFFA6E_20%,#BA75FF_35%,#4476FF_68%,#3676FF_100%)]',
    },
  ];
</script>

<div class="fab fab-flower bottom-15 absolute">
  <!-- a focusable div with tabindex is necessary to work on all browsers. role="button" is necessary for accessibility -->
  <div tabindex="0" role="button" class="btn btn-circle btn-xl size-18">
    <div class="i-tabler:plus size-6"></div>
  </div>

  <!-- Main Action button replaces the original button when FAB is open -->
  <button
    class="fab-main-action btn btn-circle btn-xl size-18 btn-primary"
    aria-label="FAB"
  >
    <div class="i-tabler:pencil size-6"></div>
  </button>

  <!-- buttons that show up when FAB is open -->
  {#each items as item}
    <button class="btn btn-circle btn-lg" aria-label={item.label}>
      <div class={item.icon_class}></div>
    </button>
  {/each}
</div>

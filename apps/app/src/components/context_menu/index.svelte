<script lang="ts">
  import { context_menu } from '@/stores/context_menu.svelte';
  import { current_platform_type } from '@/lib/file_tree';
  import { fly } from 'svelte/transition';

  let dialog = $state<HTMLDialogElement>();

  // Synchronize the native dialog state with the store visibility
  $effect(() => {
    if (current_platform_type === 'mobile' && dialog) {
      if (context_menu.visible) {
        if (!dialog.open) dialog.showModal();
      } else {
        if (dialog.open) dialog.close();
      }
    }
  });

  function handle_click(action?: () => void) {
    if (action) action();
    context_menu.close();
  }

  // Handle outside clicks for desktop without putting click listeners on non-interactive elements
  function handle_window_click(e: MouseEvent) {
    if (current_platform_type === 'desktop' && context_menu.visible) {
      const target = e.target as HTMLElement;
      // Close only if the click is NOT inside the desktop menu
      if (!target.closest('.desktop-context-menu')) {
        context_menu.close();
      }
    }
  }
</script>

<svelte:window
  onclick={handle_window_click}
  onscroll={() => context_menu.close()}
  onblur={() => context_menu.close()}
  onresize={() => context_menu.close()}
/>

{#if current_platform_type === 'mobile'}
  <!-- Native Dialog for Mobile (DaisyUI Modal) -->
  <dialog
    bind:this={dialog}
    class="modal modal-bottom"
    onclose={() => context_menu.close()}
  >
    <div class="modal-box p-0 bg-base-200">
      <!-- Menu Content -->
      <ul class="menu menu-lg px-4 gap-0.5 join join-vertical w-full">
        {#each context_menu.items as item}
          {#if item.divider}
            <li class="my-1 border-b border-base-content/10"></li>
          {:else}
            <li class="join-item rounded-box bg-base-content/10">
              <button
                onclick={() => handle_click(item.action)}
                class:text-error={item.type === 'danger'}
                class:text-warning={item.type === 'warning'}
              >
                <div class={item.icon_class}></div>
                {item.label}
              </button>
            </li>
          {/if}
        {/each}
      </ul>
    </div>

    <!-- Native Backdrop: Clicking this closes the dialog automatically -->
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
{:else if context_menu.visible}
  <!-- Desktop Floating Menu -->
  <!-- We use a class for the window click handler to identify this container -->
  <div
    class="desktop-context-menu fixed z-[9999]"
    style="top: {context_menu.y}px; left: {context_menu.x}px;"
  >
    <ul
      transition:fly={{ duration: 100, y: -5 }}
      class="menu menu-sm w-56 rounded-box shadow-xl border border-base-300 bg-base-200"
      oncontextmenu={(e) => e.preventDefault()}
    >
      {#each context_menu.items as item}
        {#if item.divider}
          <li class="my-1 border-b border-base-content/10"></li>
        {:else}
          <li>
            <button
              onclick={() => handle_click(item.action)}
              class:text-error={item.type === 'danger'}
              class:text-warning={item.type === 'warning'}
            >
              <div class={item.icon_class}></div>
              {item.label}
            </button>
          </li>
        {/if}
      {/each}
    </ul>
  </div>
{/if}

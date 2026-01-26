<script lang="ts">
  import { context_menu } from '@/lib/global_states/index.svelte';
  import { current_platform_type } from '@/lib/file_system';
  import { fly } from 'svelte/transition';

  let dialog = $state<HTMLDialogElement>();

  // 1. New State for measuring dimensions
  let menu_w = $state(0);
  let menu_h = $state(0);
  let win_w = $state(0);
  let win_h = $state(0);

  let pos_x = $derived.by(() => {
    if (context_menu.x + menu_w > win_w) {
      return context_menu.x - menu_w;
    }
    return context_menu.x;
  });

  let pos_y = $derived.by(() => {
    if (context_menu.y + menu_h > win_h) {
      return context_menu.y - menu_h;
    }
    return context_menu.y;
  });

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

  function handle_window_click(e: MouseEvent) {
    if (current_platform_type === 'desktop' && context_menu.visible) {
      const target = e.target as HTMLElement;
      if (!target.closest('.desktop-context-menu')) {
        context_menu.close();
      }
    }
  }
</script>

<svelte:window
  bind:innerWidth={win_w}
  bind:innerHeight={win_h}
  onclick={handle_window_click}
  onscroll={() => context_menu.close()}
  onblur={() => context_menu.close()}
  onresize={() => context_menu.close()}
/>

{#if current_platform_type === 'mobile'}
  <dialog
    bind:this={dialog}
    class="modal modal-bottom"
    onclose={() => context_menu.close()}
  >
    <div class="modal-box p-0 bg-base-200">
      <div class="flex group w-full justify-center pt-4 pb-2">
        <div
          class="h-1.5 w-12 rounded-full bg-base-content/20 group-active:(w-10 bg-gray) transition-all duration-200"
        ></div>
      </div>
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
                {#if item.experimental}
                  {#if item.tooltip}
                    <button
                      onclick={(e) => {
                        e.stopPropagation();
                      }}
                      aria-label="Tooltip button"
                      class="tooltip tooltip-left h-full aspect-square grid place-items-center"
                      data-tip={item.tooltip}
                    >
                      <div
                        class="i-tabler:alert-triangle-filled size-4 size-4"
                      ></div>
                    </button>
                  {:else}
                    <div
                      class="i-tabler:alert-triangle-filled size-4 size-4"
                    ></div>
                  {/if}
                {/if}
              </button>
            </li>
          {/if}
        {/each}
      </ul>
    </div>
    <form method="dialog" class="modal-backdrop">
      <button>close</button>
    </form>
  </dialog>
{:else if context_menu.visible}
  <div
    class="desktop-context-menu fixed z-[9999]"
    style="top: {pos_y}px; left: {pos_x}px;"
  >
    <ul
      bind:clientWidth={menu_w}
      bind:clientHeight={menu_h}
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

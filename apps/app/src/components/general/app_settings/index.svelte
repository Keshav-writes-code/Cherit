<script lang="ts">
  import { current_platform_type } from '@/lib/file_system';
  import { app_settings_dialog_open_state } from './states.svelte';
  import Editor from './editor/index.svelte';
  import type { Component } from 'svelte';
  import { sidebar_items } from './sidebar_items';
  import { fade } from 'svelte/transition';

  const viewMap: Record<string, Component> = {
    editor: Editor,
  };
  let activeTab = $state('editor');
  let ActiveView: Component = $derived(viewMap[activeTab]);
</script>

{#if app_settings_dialog_open_state.data}
  <dialog open={app_settings_dialog_open_state.data} class="modal z-11">
    <div
      out:fade
      class="
    {current_platform_type == 'desktop' && ' w-80% h-85% lt-sm:flex-col'}
    {current_platform_type == 'mobile' && 'size-100% lt-sm:flex-col-reverse '}
    modal-box p-0 flex max-w-275 b-1 b-[color-mix(in_srgb,var(--color-base-content)_32%,black)]"
    >
      <aside
        class="max-w-63 w-full h-full b-r-1 b-r-[color-mix(in_srgb,var(--color-base-content)_22%,black)]"
      >
        <ul class="w-full gap-2">
          {#each sidebar_items as category_item}
            <li>
              <p
                class="px-5 mt-8 text-xs capitalize color-[color-mix(in_srgb,var(--color-base-content)_52%,black)]"
              >
                {category_item.category_label}
              </p>
              <ul class="menu menu-sm w-full">
                {#each category_item.items as item}
                  <li>
                    <button
                      class=" {activeTab == item.id && 'bg-base-content/10 '}"
                    >
                      <div class=" size-4 {item.icon}"></div>

                      <p class="text-3.5">{item.label}</p>
                    </button>
                  </li>
                {/each}
              </ul>
            </li>
          {/each}
        </ul>
      </aside>
      <div class="size-full px-12 bg-base-200"><ActiveView /></div>

      <div class="modal-action">
        <form method="dialog">
          <button
            class="btn btn-sm btn-circle btn-ghost absolute
        {current_platform_type == 'mobile'
              ? 'top-12 right-4'
              : 'top-2 right-2'} "
            onclick={() => (app_settings_dialog_open_state.data = false)}
          >
            ✕
          </button>
        </form>
      </div>
    </div>
  </dialog>
{/if}

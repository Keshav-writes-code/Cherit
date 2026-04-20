<script lang="ts">
  import { app_settings_dialog_open_state } from './states.svelte';
  import type { Component } from 'svelte';
  import { sidebar_items } from './sidebar_items';
  import { fade } from 'svelte/transition';
  import { current_platform_type } from '@/lib/states/session';
  import { persistent_states } from '@/lib/states/persistent/index.svelte';
  import type { AppPersistentState } from '@/lib/states/persistent/index.svelte.ts';

  const viewMap: Record<string, Component> = {};
  let activeTab = $state<string>();
  let ActiveView: Component | undefined = $derived(
    activeTab ? viewMap[activeTab] : undefined
  );
</script>

{#if app_settings_dialog_open_state.data}
  <dialog open={app_settings_dialog_open_state.data} class="modal z-11">
    <div
      out:fade
      class="
    {current_platform_type == 'desktop' && ' w-80% h-85% '}
    {current_platform_type == 'mobile' && 'size-100%  '}
    modal-box p-0 flex max-w-275 b-1 b-[color-mix(in_srgb,var(--color-base-content)_32%,black)] relative overflow-hidden"
    >
      <aside
        class="max-w-63 w-full h-full b-r-1 b-r-[color-mix(in_srgb,var(--color-base-content)_22%,black)]
        lt-md:absolute lt-md:max-w-none lt-md:inset-y-0 lt-md:left-0 lt-md:z-10 lt-md:transition-[transform,opacity] lt-md:duration-300 lt-md:ease-in-out
        {activeTab
          ? 'lt-md:-translate-x-10 lt-md:opacity-30'
          : 'lt-md:translate-x-0'}"
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
                      onclick={() => (activeTab = item.id)}
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

      <div
        class="size-full overflow-scroll px-12 bg-base-200
        lt-md:absolute lt-md:inset-y-0 lt-md:left-0 lt-md:z-20 lt-md:transition-transform lt-md:duration-300 lt-md:ease-in-out lt-md:px-4
        {activeTab ? 'lt-md:translate-x-0' : 'lt-md:translate-x-full'}"
      >
        {#if activeTab}
          <button
            class="hidden lt-md:flex mt-4 mb-2 text-sm opacity-70 gap-2"
            onclick={() => (activeTab = undefined)}
          >
            <div class="i-tabler:arrow-left size-5"></div>
            <span>Back to Menu</span>
          </button>
        {/if}
        <button
          class="btn"
          onclick={async () => {
            const data = await persistent_states.get();
            console.log(data);
          }}>get persistent states</button
        >
        <button
          class="btn"
          onclick={async () => {
            const data: AppPersistentState = {
              schema_version: 1,
              app_config: {
                workspaces_metadata: [
                  {
                    last_accessed: new Date(),
                    recent_file_node_path: {
                      path: '/home/keshav/notes',
                      document_top_tree_uri: null,
                    },
                  },
                ],
              },
              secure: {
                llm_api: 'askjdas;lidugpauisyd',
              },
            };

            await persistent_states.update(data);
          }}>save persistent states</button
        >
        <ActiveView />
      </div>

      <div class="modal-action">
        <form method="dialog">
          <button
            class="btn btn-sm btn-circle btn-ghost absolute z-30
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

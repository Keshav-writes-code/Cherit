<script lang="ts">
  import { persistent_states } from '@/lib/states/persistent/index.svelte';
  import { getNetworkInfo } from 'tauri-plugin-device-info-api';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';

  let ip = $state<string>();
  let new_nick_name = $derived(
    persistent_states.states?.app_config.sync_config.nick_name
  );
  let enable_rename_nick_name = $state(false);
  let rename_input_elem = $state<HTMLInputElement>();

  onMount(async () => {
    const network = await getNetworkInfo();
    ip = network.ipAddress;
  });

  async function rename_nick_name() {
    enable_rename_nick_name = false;
    if (!new_nick_name || !persistent_states.states) return;
    persistent_states.states.app_config.sync_config.nick_name = new_nick_name;
    try {
      await persistent_states.save();
    } catch (error) {
      if (error instanceof Error)
        toast.error(error.message, { description: error.stack });
    }
  }
</script>

<div class=" flex flex-col items-center">
  <div class="[animation:spin_10s_linear_infinite]">
    <div
      class="scale-x--100 color-[color-mix(in_srgb,var(--color-primary)_30%,white)] i-tabler:refresh-dot size-50"
    ></div>
  </div>

  <div
    class="relative mt-2 capitalize text-3xl font-semibold color-[color-mix(in_srgb,var(--color-base-content)_80%,black)] group isolate"
  >
    {#if enable_rename_nick_name}
      <input
        bind:this={rename_input_elem}
        type="text"
        class="capitalize w-full z-1 absolute text-center b-none outline-none"
        bind:value={new_nick_name}
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            rename_nick_name();
          }
        }}
      />
      <span class="ml-3 z-1 absolute left-full top-0">
        <button
          aria-label="Done button"
          class=" btn btn-ghost btn-success btn-sm transition"
          onclick={rename_nick_name}
        >
          Done
        </button>
      </span>
    {/if}
    <p class="py-0.5 {enable_rename_nick_name && 'opacity-0'}">
      {new_nick_name}
    </p>
    <button
      aria-label="Edit Name"
      class="ml-3 top-10% btn btn-ghost btn-sm px-1 absolute left-full opacity-0 transition {!enable_rename_nick_name &&
        'group-hover:opacity-100'} "
      onclick={() => {
        enable_rename_nick_name = true;
        setTimeout(() => {
          if (!rename_input_elem) return;
          rename_input_elem.select();
        }, 0);
      }}
    >
      <div class="i-tabler:pencil size-6"></div>
    </button>
  </div>
  <span
    class="badge badge-lg mt-4 color-[color-mix(in_srgb,var(--color-base-content)_80%,black)]"
  >
    #{ip?.split('.').pop()}
  </span>
</div>

<style>
  @keyframes -global-spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>

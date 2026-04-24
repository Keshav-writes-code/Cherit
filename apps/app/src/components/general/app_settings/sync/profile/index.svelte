<script lang="ts">
  import { persistent_states } from '@/lib/states/persistent/index.svelte';
  import { getNetworkInfo } from 'tauri-plugin-device-info-api';
  import { onMount } from 'svelte';

  let ip = $state<string>();

  onMount(async () => {
    const network = await getNetworkInfo();
    ip = network.ipAddress;
  });
</script>

<div class=" flex flex-col items-center">
  <div class="[animation:spin_10s_linear_infinite]">
    <div
      class="scale-x--100 color-[color-mix(in_srgb,var(--color-primary)_30%,white)] i-tabler:refresh-dot size-50"
    ></div>
  </div>

  <p
    class=" mt-2 capitalize text-3xl font-semibold color-[color-mix(in_srgb,var(--color-base-content)_80%,black)]"
  >
    {persistent_states.states?.app_config.sync_config.nick_name}
  </p>
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

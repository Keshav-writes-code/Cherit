<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { listen, type UnlistenFn } from '@tauri-apps/api/event';
  import { onDestroy, onMount } from 'svelte';
  import { devices, type DiscoveredDevice } from '../states.svelte';
  import { PLATFORM_TYPE_MAP } from '@/lib/states/session';
  import { persistent_states } from '@/lib/states/persistent/index.svelte';

  let devices_unlistner: UnlistenFn | undefined;
  onMount(async () => {
    await invoke('join_local_network', {
      nick_name: persistent_states.states?.app_config.sync_config.nick_name,
    });
    await invoke('scan_local_network');
    devices_unlistner = await listen(
      'device_found',
      (data) =>
        (devices.data = data.payload as Record<string, DiscoveredDevice>)
    );
  });
  onDestroy(async () => {
    if (devices_unlistner) devices_unlistner();
    await invoke('stop_scan_and_discover');
  });
</script>

<ul class="list bg-base-100 rounded-box shadow-md">
  {#each Object.values(devices.data) as device}
    <li class="list-row">
      <div>
        <div
          class=" 
          {PLATFORM_TYPE_MAP[device.os] == 'desktop'
            ? 'i-tabler:device-laptop'
            : 'i-tabler:device-mobile'}  size-8"
        ></div>
      </div>
      <div>
        <div>
          <p class="capitalize">{device.name}</p>
        </div>
        <div class="text-xs uppercase font-semibold opacity-60">
          <span class="badge">
            {device.host_name_2}
          </span>
          <span class="badge">
            #{device.ip.split('.').pop()}
          </span>
        </div>
      </div>
      <button aria-label="Pair Button" class="btn btn-square btn-ghost">
        <div class=" i-tabler:link size-5"></div>
      </button>
    </li>
  {:else}
    <li
      class="skeleton list-row color-[color-mix(in_srgb,var(--color-base-content)_52%,black)]"
    >
      <div class="flex flex-col gap-2">
        <span class="flex gap-2 items-center">
          <span class="loading loading-ring loading-sm text-primary"></span>
          <p>Looking for devices</p>
        </span>
        <p>
          To get everything working, just make sure all your devices are using
          the same Wi-Fi Network
        </p>
      </div>
    </li>
  {/each}
</ul>

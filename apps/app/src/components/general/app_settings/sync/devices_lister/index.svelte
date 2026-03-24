<script lang="ts">
  import { invoke } from '@tauri-apps/api/core';
  import { listen } from '@tauri-apps/api/event';
  import { onMount } from 'svelte';
  import { devices, type DiscoveredDevice } from '../states.svelte';
  import { PLATFORM_TYPE_MAP } from '@/lib/states';

  onMount(async () => {
    await invoke('join_scan_local_network');
    listen(
      'device_found',
      (data) =>
        (devices.data = data.payload as Record<string, DiscoveredDevice>)
    );
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
          {device.name}
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
      <button class="btn btn-square btn-ghost">
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

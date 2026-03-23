<script lang="ts">
  import { PLATFORM_TYPE_MAP } from '@/lib/states';
  import { invoke } from '@tauri-apps/api/core';
  import { listen } from '@tauri-apps/api/event';
  import { onMount } from 'svelte';

  type DiscoveredDevice = {
    name: String;
    ip: String;
    host_name_2: String;
    os: keyof typeof PLATFORM_TYPE_MAP;
  };

  let devices = $state<Record<string, DiscoveredDevice>>({});

  onMount(async () => {
    await invoke('join_scan_local_network');
    listen(
      'device_found',
      (data) => (devices = data.payload as Record<string, DiscoveredDevice>)
    );
  });

  $inspect(devices);
</script>

<ul class="list bg-base-100 rounded-box shadow-md">
  {#each Object.values(devices) as device}
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
  {/each}
</ul>

import { PLATFORM_TYPE_MAP } from '@/lib/states/session';

export type DiscoveredDevice = {
  name: String;
  ip: String;
  host_name_2: String;
  os: keyof typeof PLATFORM_TYPE_MAP;
};

export let devices = $state<{ data: Record<string, DiscoveredDevice> }>({
  data: {},
});

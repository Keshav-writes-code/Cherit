import { platform, type Platform } from '@tauri-apps/plugin-os';

const PLATFORM_TYPE_MAP = {
  linux: 'desktop',
  macos: 'desktop',
  ios: 'mobile',
  freebsd: 'desktop',
  dragonfly: 'desktop',
  netbsd: 'desktop',
  openbsd: 'desktop',
  solaris: 'desktop',
  android: 'mobile',
  windows: 'desktop',
} as const;

export const PATH_SEPARATOR_MAPPINGS = {
  linux: '/',
  macos: '/',
  ios: '/',
  freebsd: '/',
  dragonfly: '/',
  netbsd: '/',
  openbsd: '/',
  solaris: '/',
  android: '%2F',
  windows: '\\',
} as const satisfies Record<Platform, string>;

export const current_platform = platform();
export const current_platform_type: 'desktop' | 'mobile' =
  PLATFORM_TYPE_MAP[current_platform as keyof typeof PLATFORM_TYPE_MAP];

export const SEP = PATH_SEPARATOR_MAPPINGS[current_platform];

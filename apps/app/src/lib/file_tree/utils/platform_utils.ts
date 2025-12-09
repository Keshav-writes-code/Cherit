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

export const PATH_SEPARATOR = {
  linux: '/',
  macos: '/',
  ios: '/',
  freebsd: '/',
  dragonfly: '/',
  netbsd: '/',
  openbsd: '/',
  solaris: '/',
  android: '%2F', // URL-encoded slash
  windows: '\\',
} as const satisfies Record<Platform, string>;

export const current_platform = platform();
export const current_platform_type: 'desktop' | 'mobile' =
  PLATFORM_TYPE_MAP[current_platform as keyof typeof PLATFORM_TYPE_MAP];

export const get_parent_path = (p: string) => {
  const s = current_platform == 'android' ? '%2F' : '/';
  return p.slice(0, Math.max(0, p.lastIndexOf(s))) || (s === '/' ? '/' : p);
};
export function get_relative_path_parts(
  path: string,
  offset: string = ''
): string[] {
  const p = decodeURIComponent(path);
  const o = decodeURIComponent(offset);
  return p.replace(o, '').split(/[/\\]/).filter(Boolean);
}

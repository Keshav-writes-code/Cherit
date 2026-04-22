import { SEP } from '@/lib/states/session/domain_specific/os.svelte';

/**
 * Joins multiple path segments using the platform-specific separator.
 * Just concatinates path you give it with Seperator, nothing else
 */
export function join_path(...parts: string[]) {
  return parts.join(SEP);
}

export const get_parent_path = (p: string) => {
  return p.slice(0, Math.max(0, p.lastIndexOf(SEP))) || (SEP === '/' ? '/' : p);
};
export function get_relative_path_parts(
  path: string,
  offset: string = ''
): string[] {
  const p = decodeURIComponent(path);
  const o = decodeURIComponent(offset);
  return p.replace(o, '').split(/[/\\]/).filter(Boolean);
}

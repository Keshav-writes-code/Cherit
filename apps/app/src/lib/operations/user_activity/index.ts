import type { Workspace } from '@/lib/types';

export function get_most_recent_workspace(
  items: Workspace[]
): Workspace | undefined {
  return items.reduce<Workspace | undefined>((latest, cur) => {
    if (!latest) return cur;
    return cur.last_accessed.getTime() > latest.last_accessed.getTime()
      ? cur
      : latest;
  }, undefined);
}

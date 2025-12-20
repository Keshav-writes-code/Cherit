import type { RecentPath } from '@/types';
import { z } from 'zod';
const recent_path: z.ZodType<RecentPath> = z.object({
  path: z.string(),
  document_top_tree_uri: z.string().nullable(),
  last_accessed: z.coerce.date(),
});
export const RecentPaths = z.array(recent_path);

export function get_latest_recent_path(
  items: RecentPath[]
): RecentPath | undefined {
  return items.reduce<RecentPath | undefined>((latest, cur) => {
    if (!latest) return cur;
    return cur.last_accessed.getTime() > latest.last_accessed.getTime()
      ? cur
      : latest;
  }, undefined);
}

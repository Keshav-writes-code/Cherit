import { generic_path_zod } from '@/types/schema';
import { z } from 'zod';

const workspace = generic_path_zod.extend({
  last_accessed: z.coerce.date(),
  last_filenode_path: z.string().optional(),
});
export type Workspace = z.infer<typeof workspace>;
export const RecentWorkspaces = z.array(workspace);

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

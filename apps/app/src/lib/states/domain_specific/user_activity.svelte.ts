import { generic_path_zod } from '@/lib/types/schema';
import { z } from 'zod';

export const workspace = generic_path_zod.extend({
  last_accessed: z.coerce.date(),
  last_filenode_path: z.string().optional(),
});
export const RecentWorkspaces = z.array(workspace);

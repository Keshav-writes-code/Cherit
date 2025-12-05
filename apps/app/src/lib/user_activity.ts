import type { GenericPath } from '@/types';
import { z } from 'zod';
const recent_path: z.ZodType<GenericPath> = z.object({
  path: z.string(),
  document_top_tree_uri: z.string().nullable(),
});
const recent_paths = z.array(recent_path);

export function check_recent_path_schema(data: any) {
  const check = recent_paths.safeParse(data);
  return check.success;
}

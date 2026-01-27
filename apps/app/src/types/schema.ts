import z from 'zod';
export const generic_path_zod = z.object({
  path: z.string(),
  document_top_tree_uri: z.string().nullable(),
});
export type GenericPath = z.infer<typeof generic_path_zod>;

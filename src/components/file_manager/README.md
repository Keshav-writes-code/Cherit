# File Structure

| File                      | Purpose                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------- |
| `index.svelte`            | Read the file system and provide the `items_render.svelte` component with the File system Items |
| `items_render.svelte`     | Renders the first shell of elements                                                             |
| `items_renderer_2.svelte` | Renders the recursive deep elements                                                             |
| `build_file_tree.ts`      | containing the function to get the file system contents                                         |

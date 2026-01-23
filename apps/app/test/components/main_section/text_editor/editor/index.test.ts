import { render, fireEvent, cleanup } from '@testing-library/svelte';
import { expect, test, vi, afterEach } from 'vitest';
import Editor from '@/components/main_section/text_editor/editor/index.svelte';
import { create_editor } from '@/components/main_section/text_editor/editor/editor_config/index';

vi.mock('@tauri-apps/plugin-os', () => ({ platform: () => 'linux' }));
vi.mock('@/components/main_section/text_editor/editor/editor_config/index');
afterEach(cleanup);

test('runs write_to_file on focusout', async () => {
  let s: any;
  vi.mocked(create_editor).mockImplementation((_, __, state) => { s = state; return { state: { doc: { toString: () => 'new' } }, destroy: () => {} } as any; });
  const fn = vi.fn();
  const { getByRole } = render(Editor, { props: { text_content: 'content', write_to_file: fn } });
  s.data = true;
  await fireEvent.focusOut(getByRole('application'));
  expect(fn).toHaveBeenCalledWith('new');
});
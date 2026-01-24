import { EditorView } from '@codemirror/view';

export let editor_view: { data: EditorView | undefined } = $state({
  data: undefined,
});
export let is_contents_changed: { data: boolean } = $state({ data: false });

import { EditorView } from '@codemirror/view';

export let editor_view: { data: EditorView | undefined } = $state({
  data: undefined,
});

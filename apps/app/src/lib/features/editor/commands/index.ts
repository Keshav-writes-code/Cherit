import { EditorView } from '@codemirror/view';
import { EditorSelection } from '@codemirror/state';
import { indentMore, indentLess, undo, redo } from '@codemirror/commands';

export const wrap_selection = (
  view: EditorView | undefined,
  wrap_str: string
) => {
  if (!view) return;

  view.dispatch(
    view.state.changeByRange((range) => {
      const content = view.state.sliceDoc(range.from, range.to);
      const newContent = `${wrap_str}${content}${wrap_str}`;

      return {
        changes: {
          from: range.from,
          to: range.to,
          insert: newContent,
        },
        range: EditorSelection.range(
          range.from,
          range.from + newContent.length
        ),
      };
    })
  );
  return true;
};
export const insert_on_next_line = (
  view: EditorView | undefined,
  text_to_insert: string
) => {
  if (!view) return;
  view.dispatch(
    view.state.changeByRange((range) => {
      const line_end = view.state.doc.lineAt(range.to).to;
      return {
        changes: { from: line_end, insert: `\n${text_to_insert}` },
        range: EditorSelection.cursor(line_end + 1 + text_to_insert.length),
      };
    })
  );
  return true;
};

// wraps the built-in indent command
export const indent_in = (view: EditorView | undefined) => {
  if (!view) return;
  return indentMore(view);
};

// wraps the built-in un-indent command
export const indent_out = (view: EditorView | undefined) => {
  if (!view) return;
  return indentLess(view);
};

export function trigger_undo(view: EditorView | undefined): void {
  if (!view) return;
  undo(view);
  view.focus();
}

export function trigger_redo(view: EditorView | undefined): void {
  if (!view) return;
  redo(view);
  view.focus();
}

import { EditorView } from "@codemirror/view";

import { Decoration } from "@codemirror/view";
import { StateField } from "@codemirror/state";

export const getStartTabs = (line: string): string => {
  const match = line.match(/^[\t ]*/);
  return match ? match[0] : "";
};

const getDecorations = (state) => {
  const decorations = [];

  for (let i = 0; i < state.doc.lines; i++) {
    const line = state.doc.line(i + 1);
    const numberOfTabs = getStartTabs(line.text).length;
    if (numberOfTabs === 0) continue;

    const offset = numberOfTabs * 4;

    const linerwapper = Decoration.line({
      attributes: {
        style: `--indented: ${offset}ch;`,
        class: "indented-wrapped-line",
      },
    });

    decorations.push(linerwapper.range(line.from, line.from));
  }

  return Decoration.set(decorations);
};

const indented_line_wrap = StateField.define({
  create(state) {
    return getDecorations(state);
  },
  update(deco, tr) {
    if (!tr.docChanged) return deco;

    return getDecorations(tr.state);
  },
  provide: (f) => EditorView.decorations.from(f),
});
const required_css = EditorView.theme({
  ".indented-wrapped-line": {
    borderLeft: "transparent solid calc(var(--indented))",
  },
  ".indented-wrapped-line:before": {
    content: '""',
    marginLeft: "calc(-1 * var(--indented))",
  },
  ".cm-gutters, .cm-activeLineGutter": {
    background: "transparent",
  },
});
export const indentedLineWrap = [indented_line_wrap, required_css];

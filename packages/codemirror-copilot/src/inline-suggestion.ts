import {
  ViewPlugin,
  DecorationSet,
  EditorView,
  ViewUpdate,
  Decoration,
  WidgetType,
  keymap,
} from "@codemirror/view";
import {
  StateEffect,
  Text,
  Prec,
  StateField,
  EditorState,
  EditorSelection,
  TransactionSpec,
} from "@codemirror/state";
import { debouncePromise } from "./lib/utils";

// Current state of the autosuggestion
const InlineSuggestionState = StateField.define<{ suggestion: null | string }>({
  create() {
    return { suggestion: null };
  },
  update(__, tr) {
    const inlineSuggestion = tr.effects.find((e) =>
      e.is(InlineSuggestionEffect)
    );
    if (tr.state.doc)
      if (inlineSuggestion && tr.state.doc == inlineSuggestion.value.doc) {
        return { suggestion: inlineSuggestion.value.text };
      }
    return { suggestion: null };
  },
});

const InlineSuggestionEffect = StateEffect.define<{
  text: string | null;
  doc: Text;
}>();

/**
 * Provides a suggestion for the next word
 */
function inlineSuggestionDecoration(view: EditorView, prefix: string) {
  const pos = view.state.selection.main.head;
  const widgets = [];
  const w = Decoration.widget({
    widget: new InlineSuggestionWidget(prefix),
    side: 1,
  });
  widgets.push(w.range(pos));
  return Decoration.set(widgets);
}

class InlineSuggestionWidget extends WidgetType {
  suggestion: string;
  constructor(suggestion: string) {
    super();
    this.suggestion = suggestion;
  }
  toDOM(view: EditorView) {
    const div = document.createElement("span");
    div.style.opacity = "0.4";
    div.className = "cm-inline-suggestion";
    div.textContent = this.suggestion;
    div.onclick = (e) => {
      e.stopPropagation();
      e.preventDefault();

      const suggestionText = view.state.field(
        InlineSuggestionState
      )?.suggestion;

      // If there is no suggestion, do nothing and let the default keymap handle it
      if (!suggestionText) {
        return false;
      }

      view.dispatch({
        ...insertCompletionText(
          view.state,
          suggestionText,
          view.state.selection.main.head,
          view.state.selection.main.head
        ),
      });
      return true;
    };
    return div;
  }
}

type InlineFetchFn = (state: EditorState) => Promise<string>;

export const fetchSuggestion = (fetchFn: InlineFetchFn) =>
  ViewPlugin.fromClass(
    class Plugin {
      async update(update: ViewUpdate) {
        const doc = update.state.doc;
        // Only fetch if the document has changed
        if (!update.docChanged) {
          return;
        }

        const isAutocompleted = update.transactions.some((t) =>
          t.isUserEvent("input.complete")
        );
        if (isAutocompleted) {
          return;
        }
        //   for (const tr of update.transactions) {
        //     // Check the userEvent property of the transaction
        //     if (tr.isUserEvent("input.complete")) {
        //         console.log("Change was due to autocomplete");
        //     } else {
        //         console.log("Change was due to user input");
        //     }
        // }

        console.log("CH", update);
        const result = await fetchFn(update.state);
        update.view.dispatch({
          effects: InlineSuggestionEffect.of({ text: result, doc: doc }),
        });
      }
    }
  );

const renderInlineSuggestionPlugin = ViewPlugin.fromClass(
  class Plugin {
    decorations: DecorationSet;
    constructor() {
      // Empty decorations
      this.decorations = Decoration.none;
    }
    update(update: ViewUpdate) {
      const suggestionText = update.state.field(
        InlineSuggestionState
      )?.suggestion;
      if (!suggestionText) {
        this.decorations = Decoration.none;
        return;
      }
      //   console.log("SUGGESTION", suggestionText, update.transactions.map(t => t.effects.map(e=>e.is(InlineSuggestionEffect))));
      //   for (const tr of update.transactions) {
      //     // Check the userEvent property of the transaction
      //     if (wasAuto){
      //       wasAuto = false;
      //       debugger;
      //     }
      //     if (tr.isUserEvent("input.complete")) {
      //         console.log("Change was due to autocomplete");
      //     } else {
      //         console.log("Change was due to user input");
      //     }
      // }
      this.decorations = inlineSuggestionDecoration(
        update.view,
        suggestionText
      );
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

const inlineSuggestionKeymap = Prec.highest(
  keymap.of([
    {
      key: "Tab",
      run: (view) => {
        const suggestionText = view.state.field(
          InlineSuggestionState
        )?.suggestion;

        // If there is no suggestion, do nothing and let the default keymap handle it
        if (!suggestionText) {
          return false;
        }

        view.dispatch({
          ...insertCompletionText(
            view.state,
            suggestionText,
            view.state.selection.main.head,
            view.state.selection.main.head
          ),
        });
        return true;
      },
    },
  ])
);

function insertCompletionText(
  state: EditorState,
  text: string,
  from: number,
  to: number
): TransactionSpec {
  return {
    ...state.changeByRange((range) => {
      if (range == state.selection.main)
        return {
          changes: { from: from, to: to, insert: text },
          range: EditorSelection.cursor(from + text.length),
        };
      const len = to - from;
      if (
        !range.empty ||
        (len &&
          state.sliceDoc(range.from - len, range.from) !=
            state.sliceDoc(from, to))
      )
        return { range };
      return {
        changes: { from: range.from - len, to: range.from, insert: text },
        range: EditorSelection.cursor(range.from - len + text.length),
      };
    }),
    userEvent: "input.complete",
  };
}

type InlineSuggestionOptions = {
  fetchFn: (state: EditorState) => Promise<string>;
  delay?: number;
};

export function inlineSuggestion(options: InlineSuggestionOptions) {
  const { delay = 500 } = options;
  const fetchFn = debouncePromise(options.fetchFn, delay);
  return [
    InlineSuggestionState,
    fetchSuggestion(fetchFn),
    renderInlineSuggestionPlugin,
    inlineSuggestionKeymap,
  ];
}

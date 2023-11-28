import { inlineSuggestion } from "./inline-suggestion";
import type { EditorState } from "@codemirror/state";

export type SuggestionRequestCallback = (prefix: string, suffix: string) => Promise<string>

let localSuggestionsCache: { [key: string]: string } = {};

export const inlineCopilot = (
  onSuggestionRequest: SuggestionRequestCallback,
  delay = 1000
) => {
  const fetchSuggestion = async (state: EditorState) => {
    const { from, to } = state.selection.ranges[0];
    const text = (state.doc as any).text.join("\n");
    const prefix = text.slice(0, to);
    const suffix = text.slice(from);

    // If we have a local suggestion cache, use it
    const key = `${prefix}<:|:>${suffix}`;
    const localSuggestion = localSuggestionsCache[key];
    if (localSuggestion) {
      return localSuggestion;
    }

    const prediction = await onSuggestionRequest(prefix, suffix);
    localSuggestionsCache[key] = prediction;
    return prediction;
  };

  return inlineSuggestion({
    fetchFn: fetchSuggestion,
    delay,
  });
};

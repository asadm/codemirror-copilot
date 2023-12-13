import { inlineSuggestion } from "./inline-suggestion";
import type { EditorState } from "@codemirror/state";

/**
 * Should fetch autosuggestions from your AI
 * of choice. If there are no suggestions,
 * you should return an empty string.
 */
export type SuggestionRequestCallback = (
  prefix: string,
  suffix: string
) => Promise<string>;

const localSuggestionsCache: { [key: string]: string } = {};

/**
 * Configure the UI, state, and keymap to power
 * auto suggestions, with an abstracted
 * fetch method.
 */
export const inlineCopilot = (
  onSuggestionRequest: SuggestionRequestCallback,
  delay = 1000
) => {
  const fetchSuggestion = async (state: EditorState) => {
    const { from, to } = state.selection.ranges[0];
    const text = state.doc.toString();
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

export const clearLocalCache = () => {
  Object.keys(localSuggestionsCache).forEach((key) => {
    delete localSuggestionsCache[key];
  });
};

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
 * Wraps a user-provided fetch method so that users
 * don't have to interact directly with the EditorState
 * object, and connects it to the local result cache.
 */
function wrapUserFetcher(onSuggestionRequest: SuggestionRequestCallback) {
  return async function fetchSuggestion(state: EditorState) {
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
}

/**
 * Configure the UI, state, and keymap to power
 * auto suggestions, with an abstracted
 * fetch method.
 */
export const inlineCopilot = (
  onSuggestionRequest: SuggestionRequestCallback,
  delay = 1000,
  acceptOnClick = true
) => {
  return inlineSuggestion({
    fetchFn: wrapUserFetcher(onSuggestionRequest),
    delay,
    acceptOnClick,
  });
};

export const clearLocalCache = () => {
  Object.keys(localSuggestionsCache).forEach((key) => {
    delete localSuggestionsCache[key];
  });
};

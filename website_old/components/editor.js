import CodeMirror from '@uiw/react-codemirror';
import { inlineCopilot } from '../dist';

function CodeEditor() {
  return (
    <CodeMirror
      value=""
      height="300px"
      width='400px'
      extensions={[
        inlineCopilot(async (prefix, suffix) => {
          const res = await fetch('/api/autocomplete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prefix, suffix, language: "javascript" }),
          });
        
          const { prediction } = await res.json();
          return prediction;
        })
      ]}
    />
  );
}

export default CodeEditor;
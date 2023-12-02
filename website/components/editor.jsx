import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { sublime } from '@uiw/codemirror-theme-sublime';

import { inlineCopilot } from '../dist';

const DEFAULTCODE = 
`function add(num1, num2){
  ret
}`

function CodeEditor() {
  return (
    <CodeMirror
      style={{ width: "100%", borderRadius: "5px", overflow: "hidden", marginTop: "1rem" }}
      value={DEFAULTCODE}
      height="300px"
      width="100%"
      basicSetup={{
        autocompletion: false,
        lineNumbers: true,
      }}
      theme={sublime}
      extensions={[
        javascript({ jsx: true }),
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
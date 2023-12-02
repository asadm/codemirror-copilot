import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { dracula } from '@uiw/codemirror-theme-dracula';

import { inlineCopilot, clearLocalCache } from '../dist';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useState } from 'react';

const DEFAULTCODE = 
`function add(num1, num2){
  ret
}`

function CodeEditor() {
  const [model, setModel] = useState("gpt-3.5-turbo-1106");
  return (
    <>
    <Select value={model} onValueChange={(value)=>{
      setModel(value);
      clearLocalCache();
    }}>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Model" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="gpt-3.5-turbo-1106">GPT 3.5 Turbo <Badge variant="secondary">recommended</Badge></SelectItem>
    <SelectItem value="codellama">Code Llama <Badge variant="secondary">buggy</Badge></SelectItem>
    <SelectItem value="gpt-4-1106-preview">GPT-4 Turbo <Badge variant="destructive">expensive</Badge></SelectItem>
  </SelectContent>
</Select>
    <CodeMirror
      style={{ fontSize: "17px", width: "100%", borderRadius: "5px", overflow: "hidden", marginTop: "1rem" }}
      value={DEFAULTCODE}
      height="300px"
      width="100%"
      basicSetup={{
        autocompletion: false,
        lineNumbers: true,
      }}
      theme={dracula}
      extensions={[
        javascript({ jsx: true }),
        inlineCopilot(async (prefix, suffix) => {
          const res = await fetch('/api/autocomplete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prefix, suffix, language: "javascript", model }),
          });
        
          const { prediction } = await res.json();
          return prediction;
        }, 500)
      ]}
    />
    </>
  );
}

export default CodeEditor;
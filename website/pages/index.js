import CodeEditor from "@/components/editor";
import { Landing } from "@/components/landing";

export default function Home() {
  return (
    <div className="container mx-auto">
      <Landing>
        <CodeEditor />
      </Landing>
    </div>
  );
}

/**
 * This code was generated by v0 by Vercel.
 * @see https://v0.dev/t/fMJ3WqQYx6N
 */
import Link from "next/link"
import { Card } from "@/components/ui/card"

export function Landing({ children }) {
  return (
    (<section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
      <div className="container px-4 md:px-6">
        <div
          className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1
                className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Copilot for CodeMirror
              </h1>
              <p className="max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
                An open-source extension for CodeMirror that adds GitHub Copilot-like autocompletion using OpenAI's GPT models.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <div className="border border-gray-700 rounded-lg py-2 px-4 bg-gray-200 dark:bg-gray-900">
                <pre>npm i codemirror-copilot --save</pre>
              </div>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md bg-gray-900 px-8 text-sm font-medium text-gray-50 shadow transition-colors hover:bg-gray-900/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-50/90 dark:focus-visible:ring-gray-300"
                href="https://github.com/asadm/codemirror-copilot"
              >
                GitHub
              </Link>

            </div>
          </div>
          <Card>
            <div className="p-4">
              <h3 className="font-bold mb-3">Try it out!</h3>
              {children}
            </div>
          </Card>
        </div>
      </div>
      <footer className="container px-4 md:px-6 mt-12 text-gray-500">
        by <a href="https://asadmemon.com" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">Asad Memon</a>
      </footer>
    </section>)
  );
}
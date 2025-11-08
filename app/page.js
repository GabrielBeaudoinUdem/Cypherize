'use client';

import Link from "next/link";
import { Poppins } from "next/font/google";
import { useState } from "react";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export default function Home() {
  const [input, setInput] = useState("MATCH (n)-[r]->(m) RETURN n, r, m LIMIT 25");

  return (
    <main className={`${poppins.className} min-h-screen bg-[#11181C] text-white`}>
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-[#2A3239] bg-[#11181C]/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-semibold tracking-wide">Cypherize<span className="text-[#34B27B]">.</span></span>
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-zinc-300">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#how" className="hover:text-white">How it works</a>
            <Link href="/doc" className="hover:text-white">Documentation</Link>
            <Link href="/app" className="hover:text-white">Demo</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/app"
              className="px-4.5 py-1.5 rounded-3xl bg-[#34B27B] text-[#0B1215] font-semibold hover:opacity-90"
            >
              Explore
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-20">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#34B27B] blur-[120px]" />
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#34B27B] blur-[120px]" />
        </div>

        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl font-semibold leading-tight tracking-tight">
              LLM for <span className="text-[#34B27B]">interacting</span> with your graph
              in <span className="text-[#34B27B]">Cypher</span>.
            </h1>
            <p className="mt-4 text-zinc-300">
              Ask questions in natural language and get precise, executable Cypher queries
              tailored to your graph database schema.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="/app"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#34B27B] text-[#0B1215] font-semibold hover:opacity-90"
              >
                Start Demo
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-[#2A3239] bg-[#1A2127] text-white hover:bg-[#20282E]"
              >
                See Features
              </a>
            </div>
          </div>

          {/* Code preview */}
          <div className="mt-12 rounded-2xl border border-[#2A3239] bg-[#1A2127] overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-[#2A3239] text-xs text-zinc-400">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500/80" />
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-yellow-400/80" />
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-green-500/80" />
              <span className="ml-3">/demo/query.cypher</span>
            </div>
            <pre className="px-4 py-3 text-sm leading-7 whitespace-pre-wrap text-zinc-200">
              {`// Question: "Which communities are the most connected ?"
              MATCH (c:Community)-[r:LINKS]->(c2:Community)
              WITH c, count(r) AS deg
              RETURN c.name AS community, deg
              ORDER BY deg DESC
              LIMIT 10;`}
            </pre>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-[#2A3239] bg-[#0F1519]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl sm:text-3xl font-semibold">Why Cypherize</h2>
          <p className="mt-2 text-zinc-400 max-w-2xl">
            Accelerate graph analysis.
          </p>

          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
            { t: "NL ➜ Cypher", d: "Turn natural language into precise, optimized Cypher queries." },
            { t: "Schema Grounded", d: "Leverage your actual schema and data to generate contextually accurate queries." },
            { t: "Visualization", d: "Explore and understand results through interactive, intuitive visualizations." },
            ].map((f) => (
              <div key={f.t} className="rounded-xl border border-[#2A3239] bg-[#1A2127] p-4">
                <div className="text-[#34B27B] font-semibold">{f.t}</div>
                <div className="mt-1 text-zinc-300 text-sm">{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-t border-[#2A3239]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl sm:text-3xl font-semibold">How It Works</h2>
          <div className="mt-8 grid lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-[#2A3239] bg-[#1A2127] p-5">
              <div className="text-zinc-400 text-sm">Step 1</div>
              <div className="mt-1 font-semibold">Ask in Natural Language</div>
              <p className="mt-2 text-zinc-300 text-sm">
                Start by typing a question in plain English, like "Find the most connected movies" or "Show me all actors born after 1980." You can even drag-and-drop nodes from the graph to provide specific context.
              </p>
            </div>
            <div className="rounded-xl border border-[#2A3239] bg-[#1A2127] p-5">
              <div className="text-zinc-400 text-sm">Step 2</div>
              <div className="mt-1 font-semibold">AI Generates the Cypher Query</div>
              <p className="mt-2 text-zinc-300 text-sm">
                Your request is sent to an LLM, augmented with the real-time schema of your Kuzu database. This context-aware process (RAG) ensures the generated Cypher is accurate and tailored to your graph's structure.
              </p>
            </div>
            <div className="rounded-xl border border-[#2A3239] bg-[#1A2127] p-5">
              <div className="text-zinc-400 text-sm">Step 3</div>
              <div className="mt-1 font-semibold">Execute and Visualize the Results</div>
              <p className="mt-2 text-zinc-300 text-sm">
                The query is executed against the database. The results are parsed and transformed into a graph format, instantly updating the visual display. For data modifications, you'll be asked for confirmation before any changes are made.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="border-t border-[#2A3239] bg-[#0F1519]">
        <div className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-2xl sm:text-3xl font-semibold">Quick Demo</h2>
      <p className="mt-2 text-zinc-400 max-w-2xl">
        Type a question and get an executable Cypher query suggestion instantly.
      </p>
          <div className="mt-6 rounded-2xl border border-[#2A3239] bg-[#1A2127] p-4">
            <div className="flex items-center gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={2}
                className="flex-1  h-10 resize-none rounded-xl bg-[#151B20] border border-[#2A3239] px-3 py-2 text-sm outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-[#34B27B]/40 leading-relaxed"
                placeholder='Ex: "Trouver les 10 nœuds les plus connectés"'
              />
              <Link
                href="/app"
                className="flex items-center justify-center h-10 px-5 rounded-xl bg-[#34B27B] font-semibold text-[#0B1215] hover:opacity-90 transition-all duration-200"
              >
                Explore
              </Link>
            </div>

            <div className="mt-4 rounded-xl border border-[#2A3239] bg-[#11181C] p-3">
              <div className="text-xs text-zinc-400 mb-2">Suggestion</div>
              <pre className="whitespace-pre-wrap text-sm text-zinc-200">
                {`MATCH (n)-[r]->(m)
                WITH n, count(r) AS deg
                RETURN n AS node, deg
                ORDER BY deg DESC
                LIMIT 10;`}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2A3239]">
        <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-zinc-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} Cypherize</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white">Docs</a>
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

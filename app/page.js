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
            <a href="#features" className="hover:text-white">Fonctionnalités</a>
            <a href="#how" className="hover:text-white">Comment ça marche</a>
            <a href="/app" className="hover:text-white">Démo</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              href="/app"
              className="px-4.5 py-1.5 rounded-3xl bg-[#34B27B] text-[#0B1215] font-semibold hover:opacity-90"
            >
              Découvrir
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
              LLM pour <span className="text-[#34B27B]">interagir</span> avec votre graphe,
              en <span className="text-[#34B27B]">Cypher</span>.
            </h1>
            <p className="mt-4 text-zinc-300">
              Posez des questions en langage naturel, obtenez des requêtes Cypher optimisées
              et des visualisations prêtes à l’emploi pour Neo4j, Memgraph, ou tout moteur compatible.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="/app"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#34B27B] text-[#0B1215] font-semibold hover:opacity-90"
              >
                Lancer la démo
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-[#2A3239] bg-[#1A2127] text-white hover:bg-[#20282E]"
              >
                Voir les fonctionnalités
              </a>
            </div>

            <div className="mt-6 text-xs text-zinc-400">
              Compatible Neo4j • Cypher auto-généré • RAG sur schéma & exemples • Observabilité
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
              {`// Question: "Quelles sont les communautés les plus connectées ?"
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
          <h2 className="text-2xl sm:text-3xl font-semibold">Pourquoi Cypherize</h2>
          <p className="mt-2 text-zinc-400 max-w-2xl">
            Accélérez l’exploration des graphes, standardisez vos requêtes et réduisez les aller-retour
            entre data, produit et expertise graph.
          </p>

          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { t: "NL ➜ Cypher", d: "Du langage naturel vers des requêtes Cypher propres, typées et commentées." },
              { t: "RAG Schéma", d: "Indexe votre schéma et vos best practices pour des requêtes fidèles au contexte." },
              { t: "Visualisation", d: "Résultats au format compatible viz (JSON, GraphSON) et presets de styles." },
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
          <h2 className="text-2xl sm:text-3xl font-semibold">Comment ça marche</h2>
          <div className="mt-8 grid lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-[#2A3239] bg-[#1A2127] p-5">
              <div className="text-zinc-400 text-sm">Étape 1</div>
              <div className="mt-1 font-semibold">Décrivez votre question</div>
              <p className="mt-2 text-zinc-300 text-sm">
                “Trouve les nœuds hubs entre A et B”, “Top communautés par densité”, etc.
              </p>
            </div>
            <div className="rounded-xl border border-[#2A3239] bg-[#1A2127] p-5">
              <div className="text-zinc-400 text-sm">Étape 2</div>
              <div className="mt-1 font-semibold">Cypher est généré & validé</div>
              <p className="mt-2 text-zinc-300 text-sm">
                RAG sur votre schéma, contraintes & exemples. Propositions d’optimisation.
              </p>
            </div>
            <div className="rounded-xl border border-[#2A3239] bg-[#1A2127] p-5">
              <div className="text-zinc-400 text-sm">Étape 3</div>
              <div className="mt-1 font-semibold">Résultats & visualisation</div>
              <p className="mt-2 text-zinc-300 text-sm">
                Exécutez, récupérez les résultats formatés, exportez ou visualisez directement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="border-t border-[#2A3239] bg-[#0F1519]">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl sm:text-3xl font-semibold">Démo rapide</h2>
          <p className="mt-2 text-zinc-400 max-w-2xl">
            Saisissez une question, obtenez une suggestion Cypher prête à exécuter.
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
                Découvrir
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
            <a href="#" className="hover:text-white">Confidentialité</a>
            <a href="#" className="hover:text-white">Contact</a>
          </div>
        </div>
      </footer>
    </main>
  );
}

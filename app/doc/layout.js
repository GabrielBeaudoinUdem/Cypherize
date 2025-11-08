'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Poppins } from 'next/font/google';
import { docData } from './doc.js';

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

function Sidebar() {
  const searchParams = useSearchParams();
  const activeSectionId = searchParams.get('section') || docData[0]?.id;

  return (
    <aside className="w-64 flex-shrink-0 border-r border-[#2A3239] bg-[#1A2127] p-4">
      <h2 className="text-lg font-semibold text-white mb-4"></h2>
      <nav>
        <ul>
          {docData.map((item) => (
            <li key={item.id}>
              <Link
                href={`/doc?section=${item.id}`}
                className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                  activeSectionId === item.id
                    ? 'bg-[#34B27B] text-[#0B1215] font-semibold'
                    : 'text-zinc-300 hover:bg-[#252F36] hover:text-white'
                }`}
              >
                {item.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}


export default function DocLayout({ children }) {
  return (
    <main className={`${poppins.className} min-h-screen bg-[#11181C] text-white`}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#2A3239] bg-[#11181C]/80 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-semibold tracking-wide">Cypherize<span className="text-[#34B27B]">.</span></span>
          </Link>
          <div className="flex items-center gap-4">
             <Link href="/doc" className="text-sm text-white font-semibold">Documentation</Link>
            <Link
              href="/app"
              className="px-4 py-1.5 rounded-3xl bg-[#34B27B] text-[#0B1215] text-sm font-semibold hover:opacity-90"
            >
              Start Exploring
            </Link>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <div className="flex">
        <Sidebar />
        <div className="flex-1 p-8 overflow-y-auto">
          {children}
        </div>
      </div>
    </main>
  );
}
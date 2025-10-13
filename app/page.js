'use client';

import { Allotment } from "allotment";
import "allotment/dist/style.css";

import GraphView from "./components/GraphView";
import Chat from "./components/Chat";

export default function Home() {
  return (
    <main className="h-screen w-screen text-black dark:text-white">
      <Allotment>
        <Allotment.Pane minSize={400} preferredSize="66%">
          <GraphView />
        </Allotment.Pane>
        <Allotment.Pane minSize={200} preferredSize="34%">
          <Chat />
        </Allotment.Pane>
      </Allotment>
    </main>
  );
}
'use client';

import { useState, useRef, useEffect } from "react";
import dynamic from 'next/dynamic';
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import Chat from "@/app/components/Chat";
import InspectorPanel from "@/app/components/InspectorPanel";
import { parseKuzuData, getColorForLabel } from "@/lib/kuzu-parser";
import { Poppins } from "next/font/google";
import toast from 'react-hot-toast';

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const GraphView = dynamic(
  () => import('@/app/components/GraphView'),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#11181C] text-white z-50">
        <h1 className={`text-2xl font-bold mb-10 tracking-wide text-[#fff] ${poppins.className}`}>
          Cypherize<span className="text-[#34B27B]">.</span>
        </h1>
        <div className="w-64 h-1 bg-[#202A31] rounded-full overflow-hidden">
          <div className="h-full bg-[#34B27B] animate-[progress_2s_ease-in-out_infinite] rounded-full" />
        </div>

        <style jsx>{`
          @keyframes progress {
            0% {
              transform: translateX(-100%);
            }
            50% {
              transform: translateX(0%);
            }
            100% {
              transform: translateX(100%);
            }
          }
        `}</style>
      </div>
    ),
  }
);

const AI_CONFIG_STORAGE_KEY = 'cypherize-ai-config';

export default function Home() {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [selectedElement, setSelectedElement] = useState(null);
  const [chatInput, setChatInput] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [aiConfig, setAiConfig] = useState({
    provider: 'lmstudio', // 'lmstudio', 'openai', 'gemini', 'claude'
    lmstudio: {
      url: "http://localhost:1234/v1/chat/completions",
      model: "mistralai/devstral-small-2507",
    },
    openai: {
      apiKey: "",
      model: "gpt-5-mini",
    },
    gemini: {
      apiKey: "",
      model: "gemini-2.5-pro",
    },
    claude: {
      apiKey: "",
      model: "claude-opus-4",
    }
  });
  const [ghost, setGhost] = useState({ visible: false, x: 0, y: 0, kind: null, label: '' });
  const dragRef = useRef(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(AI_CONFIG_STORAGE_KEY);
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setAiConfig(prevConfig => ({
          ...prevConfig,
          ...parsedConfig,
          lmstudio: { ...prevConfig.lmstudio, ...parsedConfig.lmstudio },
          openai: { ...prevConfig.openai, ...parsedConfig.openai },
          gemini: { ...prevConfig.gemini, ...parsedConfig.gemini },
          claude: { ...prevConfig.claude, ...parsedConfig.claude },
        }));
      }
    } catch (error) {
      console.error("Failed to load AI config from localStorage:", error);
    }
  }, []);


  const handleAiConfigChange = (newConfig) => {
    try {
      setAiConfig(newConfig);
      localStorage.setItem(AI_CONFIG_STORAGE_KEY, JSON.stringify(newConfig));
      const activeProvider = newConfig.provider;
      const activeModel = newConfig[activeProvider].model;
      toast.success(`Configuration enregistrée ! Modèle actif : ${activeModel}`);
    } catch (error) {
      console.error("Failed to save AI config to localStorage:", error);
      toast.error("Impossible d'enregistrer la configuration.");
    }
  };


  const handleGraphDragStart = ({ id, label }) => {
    dragRef.current = { id, label };
    document.body.classList.add('cursor-grabbing');
    setGhost({ visible: true, x: 0, y: 0, label: label, id: id });
  };

  const handleGraphDragEnd = (e) => {
    document.body.classList.remove('cursor-grabbing');
    const payload = dragRef.current;
    if (!payload) return;

    const clientX = e.client.x;
    const clientY = e.client.y;

    // Récupère la zone du textarea (le composant MentionTextarea)
    const target = document.getElementById('mention-textarea-zone');
    if (!target) return;
    const rect = target.getBoundingClientRect();

    // Vérifie si le curseur est au-dessus
    const inside =
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom;

    if (inside) {
      const token = `@[${payload.label}](${payload.id})`;
      setChatInput(prev => (prev ? `${prev} ${token}` : token));
    }

    dragRef.current = null;
    setGhost(g => ({ ...g, visible: false }));
  };


  const executeQuery = async (query) => {
    try {
      const response = await fetch('/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "An API error occurred.");
      }
      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    }
  };

  const handleQuerySuccess = (kuzuResult, query) => {
    const parsedData = parseKuzuData(kuzuResult);
    setGraphData(parsedData);
    setLastQuery(query);
    setSelectedElement(null);
  };

  const handleSaveChanges = async (updateQuery) => {
    try {
      await executeQuery(updateQuery);
      console.log("Element saved.");

      if (lastQuery) {
        const freshResult = await executeQuery(lastQuery);
        const parsedData = parseKuzuData(freshResult);
        setGraphData(parsedData);

        if (selectedElement) {
          const allElements = [...parsedData.nodes, ...parsedData.edges];
          const updatedModel = allElements.find((el) => el.id === selectedElement.id);

          if (updatedModel) {
            setSelectedElement({
                id: updatedModel.id,
                isNode: !updatedModel.source,
                data: updatedModel.kuzuData,
            });
          } else {
            setSelectedElement(null);
          }
        }
      }
    } catch (error) {
      console.error("Save failed.");
    }
  };

  const handleGraphDragMove = ({ x, y }) => {
    setGhost(g => g.visible ? { ...g, x, y } : g);
  };

  const handleDeleteElement = async (deleteQuery) => {
    try {
      await executeQuery(deleteQuery);
      console.log("Element deleted.");
      setSelectedElement(null);

      if (lastQuery) {
        const freshResult = await executeQuery(lastQuery);
        const parsedData = parseKuzuData(freshResult);
        setGraphData(parsedData);
      } else {
        setGraphData({ nodes: [], edges: [] });
      }
    } catch (error) {
        console.error("Delete failed.");
    }
  };

  const handleElementClick = (element) => {
    setSelectedElement(element);
  };

  const handleCloseInspector = () => {
    setSelectedElement(null);
  };

  return (
    <main className="h-screen w-screen text-black dark:text-white bg-[#11181C]">
      {ghost.visible && (
        <div
          className="fixed z-[9999] pointer-events-none select-none"
          style={{
            left: ghost.x,
            top: ghost.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="flex items-center gap-2 px-2 py-1 rounded-md border border-[#2A3239] bg-[#1A2127] text-white text-xs shadow-lg">
            <span>{ghost.label}</span>
          </div>
        </div>
      )}

      <Allotment>
        <Allotment.Pane
          visible={!!selectedElement}
          minSize={260}
          preferredSize={360}
          snap
        >
          {selectedElement ? (
            <InspectorPanel
              element={selectedElement}
              onClose={handleCloseInspector}
              onSaveChanges={handleSaveChanges}
              onDeleteElement={handleDeleteElement}
            />
          ) : (
            <div className="h-full w-full bg-[#11181C]" />
          )}
        </Allotment.Pane>

        <Allotment.Pane minSize={300}>
          <GraphView
            data={graphData}
            onElementClick={handleElementClick}
            onDragMove={handleGraphDragMove}
            onDragStart={handleGraphDragStart}
            onDragEnd={handleGraphDragEnd}
            loading={loading}
          />
        </Allotment.Pane>

        <Allotment.Pane
          minSize={320}
          preferredSize={420}    // ~25%
          maxSize={640}
          snap
        >
          <Chat
            onQuerySuccess={handleQuerySuccess}
            externalInput={chatInput}
            setExternalInput={setChatInput}
            aiConfig={aiConfig}
            onAiConfigChange={handleAiConfigChange}
            executeQuery={executeQuery}
            lastQuery={lastQuery}
            ghost={ghost.visible}
            setLoading={setLoading}
          />
        </Allotment.Pane>
      </Allotment>
    </main>
  );
}
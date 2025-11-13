'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import EditableSyntaxHighlighter from './EditableSyntaxHighlighter';

const RegenerateIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
);

const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-[#34B27B]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const stepConfig = [
    { id: 'initial', name: 'Input' },
    { id: 'schema_review', name: 'Schema' },
    { id: 'data_review', name: 'Data' }
];

const AiImportModal = ({ isOpen, onClose, aiConfig, onQuerySuccess }) => {
  const [step, setStep] = useState('mode_selection');
  const [importMode, setImportMode] = useState(null);
  const [existingSchema, setExistingSchema] = useState('');
  const [documentText, setDocumentText] = useState('');
  const [generatedSchema, setGeneratedSchema] = useState('');
  const [generatedDataQueries, setGeneratedDataQueries] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(null);

  const resetState = () => {
    setStep('mode_selection'); setImportMode(null); setExistingSchema('');
    setDocumentText(''); setGeneratedSchema(''); setGeneratedDataQueries('');
    setIsLoading(false); setLoadingStep(null);
  };

  const handleClose = () => { resetState(); onClose(); };
  
  const handleModeSelect = async (mode) => {
    setImportMode(mode);
    if (mode === 'append') {
        setIsLoading(true);
        try {
            const res = await fetch('/api/schema');
            if (!res.ok) throw new Error('Failed to fetch existing schema.');
            const schemaData = await res.json();
            const schemaString = [...schemaData.nodeTables, ...schemaData.relTables]
                .map(table => `CREATE ${table.src ? 'REL' : 'NODE'} TABLE ${table.name}(...);`)
                .join('\n');
            setExistingSchema(schemaString);
        } catch (error) { toast.error(error.message); return; } finally { setIsLoading(false); }
    }
    setStep('initial');
  };

  const handleGenerateSchemaOrData = async () => {
    if (!documentText.trim()) {
      toast.error("Please paste a document to analyze.");
      return;
    }
    setIsLoading(true);
    setLoadingStep('schema');

    try {
        const response = await fetch('/api/ai/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ config: aiConfig, step: 'generate_schema', documentText, importMode, existingSchema }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to generate schema.");

        if (data.schema && data.schema.trim().length > 0) {
            setGeneratedSchema(data.schema);
            setStep('schema_review');
            setIsLoading(false);
            setLoadingStep(null);
        } else {
            toast.success("No new schema required. Generating data...");
            setGeneratedSchema('');
            await handleGenerateData(true);
        }
    } catch (error) { 
        toast.error(error.message); 
        setIsLoading(false);
        setLoadingStep(null);
    }
  };
  
  const handleGenerateData = async (calledFromPipeline = false) => {
    if (!calledFromPipeline) setIsLoading(true);
    setLoadingStep('data');
    try {
        const fullSchemaContext = `${existingSchema}\n${generatedSchema}`;
        const response = await fetch('/api/ai/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ config: aiConfig, step: 'generate_data', documentText, schema: fullSchemaContext }), });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to generate data queries.");
        setGeneratedDataQueries(data.queries);
        setStep('data_review');
    } catch (error) { 
        toast.error(error.message); 
        setStep(generatedSchema ? 'schema_review' : 'initial');
    } finally { 
        setLoadingStep(null);
        setIsLoading(false);
    }
  };

  const handleExecute = async () => {
    setIsLoading(true);
    setLoadingStep('execute');
    
    try {
        if (importMode === 'overwrite') {
            const resetRes = await fetch('/api/db/reset', { method: 'POST' });
            if (!resetRes.ok) {
                const err = await resetRes.json();
                throw new Error(err.error || 'Failed to reset the database.');
            }
        }
        const fullQuery = `${generatedSchema}\n\n${generatedDataQueries}`;
        const response = await fetch('/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: fullQuery }), });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Execution failed.");
        toast.success("Import successful!");
        const refreshResponse = await fetch('/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: "MATCH (n) OPTIONAL MATCH (n)-[r]->() RETURN n, r" }), });
        const refreshData = await refreshResponse.json();
        if (refreshResponse.ok) { 
            onQuerySuccess(refreshData.result, "MATCH (n) OPTIONAL MATCH (n)-[r]->() RETURN n, r"); 
        }
        handleClose();
    } catch (error) { 
        toast.error(`Import failed: ${error.message}`); 
        setStep('data_review');
    } finally { 
        setLoadingStep(null); 
        setIsLoading(false); 
    }
  };
  
  if (!isOpen) return null;

  const currentStepIndex = stepConfig.findIndex(s => s.id === step);
  const progressWidth = currentStepIndex >= 0 ? (currentStepIndex / (stepConfig.length - 1)) * 100 : 0;
  
  const getLoadingText = () => {
      switch (loadingStep) {
          case 'schema': return 'Generating schema...';
          case 'data': return 'Generating data queries...';
          case 'execute': return 'Executing queries on database...';
          default: return 'Processing...';
      }
  };

  const renderContent = () => {
    const isGeneratingSchema = loadingStep === 'schema';
    const isGeneratingData = loadingStep === 'data';
    const isExecuting = loadingStep === 'execute';

    switch (step) {
      case 'mode_selection':
        return ( <div className="text-center"> <h3 className="font-semibold text-white text-lg">Choose an Import Mode</h3> <p className="text-sm text-zinc-400 mt-2 mb-6">How should the new data be imported?</p> <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> <button onClick={() => handleModeSelect('append')} disabled={isLoading} className="p-4 rounded-lg border border-[#2A3239] hover:bg-[#252F36] hover:border-[#34B27B] transition-all disabled:opacity-50"> <h4 className="font-semibold text-white">Append to Database</h4> <p className="text-xs text-zinc-400 mt-1">Add new data while keeping existing data. The AI will add tables if needed.</p> </button> <button onClick={() => handleModeSelect('overwrite')} disabled={isLoading} className="p-4 rounded-lg border border-[#2A3239] hover:bg-[#252F36] hover:border-[#34B27B] transition-all disabled:opacity-50"> <h4 className="font-semibold text-white">Overwrite Database</h4> <p className="text-xs text-zinc-400 mt-1">Clear all existing data before importing the new data.</p> </button> </div> <div className="mt-8"> <button onClick={handleClose} className="px-4 py-2 text-sm rounded-md bg-[#252F36] text-gray-300 hover:bg-[#2A3239]">Cancel</button> </div> </div> );
      case 'initial':
        return ( <> <p className="text-sm text-zinc-400 mb-4">Paste a document (plain text, JSON, etc.). The AI will then suggest the necessary changes.</p> <textarea value={documentText} onChange={(e) => setDocumentText(e.target.value)} placeholder="Example: 'Alice, 30 years old, knows Bob who is 25 years old. Bob works at Acme Corp.'" className="w-full p-3 h-48 rounded-md bg-[#252F36] text-white border border-[#2A3239] focus:ring-2 focus:ring-[#34B27B]/50 resize-y font-mono text-xs leading-5" /> <div className="mt-6 flex justify-between"> <button onClick={() => setStep('mode_selection')} className="px-4 py-2 rounded-md bg-[#252F36] text-gray-300 hover:bg-[#2A3239]">Back</button> <button onClick={handleGenerateSchemaOrData} disabled={isLoading} className="px-4 py-2 rounded-md bg-[#34B27B] text-[#0B1215] font-semibold disabled:opacity-50"> {isGeneratingSchema ? 'Analyzing...' : 'Analyze Document'} </button> </div> </> );
      case 'schema_review':
        return ( <> <div className="flex justify-between items-center mb-2"> <h3 className="font-semibold text-white flex-shrink-0 pr-4">Suggested Schema</h3> <button onClick={handleGenerateSchemaOrData} disabled={isLoading} className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-[#252F36] text-gray-300 hover:bg-[#2A3239] disabled:opacity-50"> {isGeneratingSchema ? 'Regenerating...' : <><RegenerateIcon/> Regenerate</>} </button> </div> <p className="text-sm text-zinc-400 mb-4">Verify and edit the suggested schema before continuing.</p> <EditableSyntaxHighlighter value={generatedSchema} onChange={setGeneratedSchema} disabled={isLoading} /> <div className="mt-6 flex justify-between"> <button onClick={() => setStep('initial')} disabled={isLoading} className="px-4 py-2 rounded-md bg-[#252F36] text-gray-300 hover:bg-[#2A3239] disabled:opacity-50">Back</button> <button onClick={() => handleGenerateData(false)} disabled={isLoading} className="px-4 py-2 rounded-md bg-[#34B27B] text-[#0B1215] font-semibold disabled:opacity-50"> {isGeneratingData ? 'Generating...' : 'Generate Data'} </button> </div> </> );
      case 'data_review':
        return ( <> <h3 className="font-semibold text-white mb-4">Confirmation Required</h3> <p className="text-sm text-zinc-400 mb-4">Verify the queries before executing. You can edit the schema or data.</p> <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2"> {generatedSchema && ( <div> <div className="flex justify-between items-center mb-2"> <h4 className="text-sm font-semibold text-zinc-300 flex-shrink-0 pr-4">1. New Schema</h4> </div> <EditableSyntaxHighlighter value={generatedSchema} onChange={setGeneratedSchema} disabled={isLoading}/> </div> )} <div> <div className="flex justify-between items-center mb-2"> <h4 className="text-sm font-semibold text-zinc-300 flex-shrink-0 pr-4">{generatedSchema ? '2.' : '1.'} Data</h4> <button onClick={() => handleGenerateData(false)} disabled={isLoading} className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-[#252F36] text-gray-300 hover:bg-[#2A3239] disabled:opacity-50"> {isGeneratingData ? 'Regenerating...' : <><RegenerateIcon/> Regenerate</>} </button> </div> <EditableSyntaxHighlighter value={generatedDataQueries} onChange={setGeneratedDataQueries} disabled={isLoading}/> </div> </div> <div className="mt-6 flex justify-between"> <button onClick={() => setStep(generatedSchema ? 'schema_review' : 'initial')} disabled={isLoading} className="px-4 py-2 rounded-md bg-[#252F36] text-gray-300 hover:bg-[#2A3239] disabled:opacity-50">Back</button> <button onClick={handleExecute} disabled={isLoading} className="px-4 py-2 rounded-md bg-[#34B27B] text-[#0B1215] font-semibold disabled:opacity-50"> {isExecuting ? 'Executing...' : 'Confirm and Execute'} </button> </div> </> );
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${isOpen ? 'opacity-100 bg-[rgba(17,24,28,0.8)] backdrop-blur-sm' : 'opacity-0 pointer-events-none'}`}>
      <div className={`relative w-full max-w-2xl mx-4 p-6 rounded-lg border shadow-xl transform transition-all duration-300 bg-[#1A2127] border-[#2A3239] ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} onClick={(e) => e.stopPropagation()}>
        {isLoading && ( <div className="absolute inset-0 bg-[#1A2127]/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-20"> <LoadingSpinner /> <p className="mt-3 text-sm font-semibold text-white">{getLoadingText()}</p> </div> )}
        <div className="flex justify-between items-center mb-4"> <h2 className="text-xl font-bold text-white">Import Data via AI</h2> <button onClick={handleClose} className="text-gray-400 hover:text-white text-2xl font-light">&times;</button> </div>
        {step !== 'mode_selection' && ( <div className="w-full px-2 mb-8"> <div className="relative"> <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#2A3239] -translate-y-1/2"></div> <div className="absolute top-1/2 left-0 h-0.5 bg-[#34B27B] -translate-y-1/2 transition-all duration-300" style={{ width: `${progressWidth}%` }}></div> <div className="relative flex justify-between items-center"> {stepConfig.map((s, index) => ( <div key={s.id} className="flex flex-col items-center"> <div className={`w-4 h-4 rounded-full transition-colors duration-300 ${index <= currentStepIndex ? 'bg-[#34B27B]' : 'bg-[#2A3239]'}`}></div> <p className={`mt-2 text-xs font-semibold transition-colors duration-300 ${index <= currentStepIndex ? 'text-white' : 'text-zinc-400'}`}>{s.name}</p> </div> ))} </div> </div> </div> )}
        {renderContent()}
      </div>
    </div>
  );
};

export default AiImportModal;
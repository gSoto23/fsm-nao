import { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  MarkerType,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds,
} from '@xyflow/react';
import type { Connection, Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play, Square, Settings2, Share2, Plus, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, Download, FileText, Trash2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';

import StateNode from './components/StateNode';
import TransitionEdge from './components/TransitionEdge';
import { validateDFA, simulateDFA } from './logic/dfaSimulator';
import type { SimulationStep } from './logic/dfaSimulator';
import { compressGraph, decompressGraph } from './logic/serializer';
import { parseFSMText } from './logic/importParser';
import { generateFSMText } from './logic/exportParser';

const nodeTypes = { state: StateNode };
const edgeTypes = { transition: TransitionEdge };

const positions: Record<number, {x: number, y: number}> = {
  0: { x: 100, y: 100 },
  1: { x: 350, y: 100 },
  2: { x: 600, y: 100 },
  3: { x: 850, y: 100 },
  4: { x: 1100, y: 100 },
  
  5: { x: 1100, y: 350 },
  6: { x: 850, y: 350 },
  7: { x: 600, y: 350 },
  8: { x: 350, y: 350 },
  9: { x: 100, y: 350 },
  
  10: { x: 100, y: 600 },
  11: { x: 350, y: 600 },
  12: { x: 600, y: 600 },
};

const initialNodes: Node[] = Array.from({length: 13}).map((_, i) => ({
  id: `${i}`, 
  type: 'state', 
  position: positions[i], 
  data: { label: `q${i}`, isInitial: i === 0, isAccepting: i === 12 }
}));

const transitionsData = [
  { s: '0', t: '1', sym: '2' },
  { s: '1', t: '2', sym: '5' },
  { s: '2', t: '3', sym: '3' },
  { s: '3', t: '4', sym: '2' },
  { s: '4', t: '5', sym: '3' },
  { s: '5', t: '6', sym: '4' },
  { s: '6', t: '7', sym: '0' },
  { s: '7', t: '8', sym: '1' },
  { s: '8', t: '9', sym: '3' },
  { s: '9', t: '10', sym: '4' },
  { s: '10', t: '11', sym: '1' },
  { s: '11', t: '12', sym: '0' },
  { s: '12', t: '12', sym: '0,1,2,3,4,5' },
  { s: '0', t: '0', sym: '0,1,3,4,5' },
  { s: '1', t: '0', sym: '0,1,2,3,4' },
  { s: '2', t: '0', sym: '0,1,2,4,5' },
  { s: '3', t: '0', sym: '0,1,2,4,5' },
  { s: '4', t: '4', sym: '0,1,2,4,5' },
  { s: '5', t: '4', sym: '0,1,2,3,5' },
  { s: '6', t: '4', sym: '1,2,3,4,5' },
  { s: '7', t: '4', sym: '0,2,3,4,5' },
  { s: '8', t: '8', sym: '0,1,2,4,5' },
  { s: '9', t: '8', sym: '0,1,2,3,5' },
  { s: '10', t: '8', sym: '0,2,3,4,5' },
  { s: '11', t: '8', sym: '1,2,3,4,5' },
];

const initialEdges: Edge[] = transitionsData.map((t, idx) => ({
    id: `e${idx}`,
    source: t.s,
    target: t.t,
    type: 'transition',
    data: { symbols: t.sym },
    markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: 'hsl(var(--primary))' },
}));

let nodeId = 13;

function FlowApp() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  const { fitView } = useReactFlow();

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  
  const [testInput, setTestInput] = useState('');
  const [simulationSteps, setSimulationSteps] = useState<SimulationStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [isImporting, setIsImporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [warnings, setWarnings] = useState<any[]>([]);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  // Load from URL
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes('data=')) {
      const data = decompressGraph(hash);
      if (data) {
        setNodes(data.nodes);
        setEdges(data.edges);
        // Find max node id to avoid conflicts
        let maxId = 0;
        data.nodes.forEach(n => {
          const num = parseInt(n.id);
          if (!isNaN(num) && num > maxId) maxId = num;
        });
        nodeId = maxId + 1;
        setTimeout(() => fitView(), 100);
      }
    }
  }, []);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ 
      ...params, 
      type: 'transition', 
      data: { symbols: '' },
      markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: 'hsl(var(--primary))' },
    }, eds)),
    [setEdges],
  );

  const handleImportText = () => {
    try {
      const parsedData = parseFSMText(importText);
      if (parsedData.nodes.length === 0) {
        setToast({ msg: 'No states found in text', type: 'error' });
        return;
      }
      setNodes(parsedData.nodes);
      setEdges(parsedData.edges);
      setToast({ msg: 'Imported successfully!', type: 'success' });
      setIsImporting(false);
      setImportText('');
      setTimeout(() => fitView(), 100);
    } catch(e) {
      setToast({ msg: 'Error parsing text format', type: 'error' });
    }
  };

  const exportPdf = () => {
    const viewportNode = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewportNode || nodes.length === 0) return;
    
    // Calular area y margenes internamente sin afectar la vista del usuario
    const actNodesBounds = getNodesBounds(nodes);
    const padding = 100;
    
    const paddedBounds = {
      ...actNodesBounds,
      width: actNodesBounds.width + padding * 2,
      height: actNodesBounds.height + padding * 2,
      x: actNodesBounds.x - padding,
      y: actNodesBounds.y - padding
    };

    const imageWidth = Math.max(1024, paddedBounds.width);
    const imageHeight = Math.max(768, paddedBounds.height);

    const viewport = getViewportForBounds(
      paddedBounds,
      imageWidth,
      imageHeight,
      0.1,
      2,
      0
    );

    setToast({ msg: 'Generando PDF sin perder zoom...', type: 'success' });

    toPng(viewportNode, { 
      backgroundColor: '#ffffff',
      width: imageWidth,
      height: imageHeight,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      },
      filter: (node) => {
        // Exclude handles directly from the canvas
        if (node instanceof HTMLElement && node.classList.contains('react-flow__handle')) return false;
        return true;
      }
    }).then((dataUrl) => {
      const pdf = new jsPDF({
        orientation: imageWidth > imageHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [imageWidth, imageHeight]
      });
      pdf.addImage(dataUrl, 'PNG', 0, 0, imageWidth, imageHeight);
      pdf.save('dfa-graph.pdf');
    }).catch((err) => {
      setToast({ msg: 'Failed to export PDF', type: 'error' });
      console.error(err);
    });
  };

  const generateSchema = () => {
    const code = generateFSMText(nodes, edges);
    setImportText(code);
    setIsImporting(true); // Abre o mantiene abierto el textarea con el codigo generado
    setToast({ msg: '¡Esquema generado y listo en panel de Texto!', type: 'success' });
  };

  const addState = () => {
    const newNode: Node = {
      id: `${nodeId}`,
      position: { x: 300, y: 300 }, // in a real app, offset from center
      type: 'state',
      data: { label: `q${nodeId - 1}`, isInitial: false, isAccepting: false },
    };
    nodeId++;
    setNodes((nds) => [...nds, newNode]);
  };

  const clearGraph = () => {
    setNodes([]);
    setEdges([]);
    setSimulationSteps([]);
    setCurrentStepIndex(-1);
    setToast({ msg: 'Graph cleared!', type: 'success' });
  };

  const shareGraph = () => {
    const hash = compressGraph(nodes, edges);
    window.history.replaceState(null, '', `#data=${hash}`);
    navigator.clipboard.writeText(window.location.href);
    setToast({ msg: 'Link copied to clipboard!', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const handleValidate = () => {
    const warns = validateDFA(nodes, edges);
    setWarnings(warns);
    if (warns.length === 0) {
      setToast({ msg: 'DFA is valid!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const runSimulation = () => {
    const warns = validateDFA(nodes, edges);
    if (warns.some(w => w.type === 'error')) {
      setWarnings(warns);
      setToast({ msg: 'Fix DFA errors before simulating', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const steps = simulateDFA(nodes, edges, testInput);
    setSimulationSteps(steps);
    setCurrentStepIndex(0);
    applySimulationStep(steps[0]);
  };

  const applySimulationStep = (step: SimulationStep) => {
    setNodes(nds => nds.map(n => ({
      ...n,
      data: { ...n.data, isActive: n.id === step.state }
    })));
  };

  const stepForward = () => {
    if (currentStepIndex < simulationSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      applySimulationStep(simulationSteps[nextIndex]);
    }
  };

  const stepBackward = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      applySimulationStep(simulationSteps[prevIndex]);
    }
  };

  const resetSimulation = () => {
    setCurrentStepIndex(-1);
    setSimulationSteps([]);
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, isActive: false } })));
  };

  const updateNodeData = (id: string, data: any) => {
    setNodes(nds => nds.map(n => n.id === id ? { ...n, data: { ...n.data, ...data } } : n));
  };

  const updateEdgeData = (id: string, data: any) => {
    setEdges(eds => eds.map(e => e.id === id ? { ...e, data: { ...e.data, ...data } } : e));
  };

  return (
    <div className="app-container">
      {/* Sidebar Overlay inside app-container */}
      <div className="glass-panel sidebar">
        <div className="sidebar-header">
          <h1><Settings2 size={24} /> DFA Editor</h1>
        </div>
        <div className="sidebar-content">
          <div className="sidebar-section">
            <button className="btn btn-primary" onClick={addState}>
              <Plus size={18} /> Add State
            </button>
            <button className="btn btn-danger" onClick={clearGraph} title="Clear Graph">
              <Trash2 size={18} /> Clear
            </button>
          </div>
          
          <div className="sidebar-section" style={{flexDirection: 'row', gap: '8px', flexWrap: 'wrap'}}>
            <button className="btn btn-secondary" style={{flexGrow: 1, padding: '8px'}} onClick={shareGraph}>
              <Share2 size={18} /> Share
            </button>
            <button className="btn btn-secondary" style={{flexGrow: 1, padding: '8px'}} onClick={generateSchema} title="Generar Schema TXT">
              <FileText size={18} /> As Text
            </button>
            <button className="btn btn-secondary" style={{flexGrow: 1, padding: '8px'}} onClick={() => setIsImporting(!isImporting)} title="Import Text">
              <Download size={18} /> Import
            </button>
            <button className="btn btn-secondary" style={{flexGrow: 1, padding: '8px'}} onClick={exportPdf} title="Export to PDF">
              <FileText size={18} /> PDF
            </button>
          </div>
          
          {isImporting && (
            <div className="sidebar-section" style={{ background: 'rgba(0,0,0,0.05)', padding: '12px', borderRadius: '12px' }}>
               <h3 style={{fontSize: '0.8rem'}}>Paste FSM schema format</h3>
               <textarea 
                  className="input-field" 
                  style={{ minHeight: '150px', resize: 'vertical', fontSize: '0.8rem', fontFamily: 'monospace' }} 
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  placeholder={"#states\nq0\n...\n#transitions\nq0:1>q1"}
               />
               <button className="btn btn-primary" onClick={handleImportText}>
                 Generate Graph
               </button>
            </div>
          )}

          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)' }}/>

          <div className="sidebar-section">
            <h3>Validation</h3>
            <button className="btn btn-secondary" onClick={handleValidate}>
              Validate DFA
            </button>
            {warnings.map((w, i) => (
               <div key={i} className={`toast ${w.type === 'error' ? 'badge-danger' : 'badge-warning'}`} style={{fontSize: '0.8rem', padding: '8px', marginTop: '4px'}}>
                 {w.type === 'error' ? <AlertCircle size={14}/> : <Settings2 size={14}/>} {w.message}
               </div>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)' }}/>

          <div className="sidebar-section">
            <h3>Simulation</h3>
            <div className="input-group">
              <input 
                type="text" 
                className="input-field" 
                placeholder="Enter test string..." 
                value={testInput}
                onChange={e => setTestInput(e.target.value)}
                disabled={currentStepIndex >= 0}
              />
            </div>
            {currentStepIndex === -1 ? (
              <button className="btn btn-success" onClick={runSimulation}>
                <Play size={18} /> Run Simulator
              </button>
            ) : (
              <div className="sim-controls">
                <button className="btn btn-secondary" style={{padding: '8px'}} onClick={resetSimulation} title="Stop">
                  <Square size={18} />
                </button>
                <button className="btn btn-secondary" style={{padding: '8px'}} onClick={stepBackward} disabled={currentStepIndex === 0} title="Step Back">
                  <ChevronLeft size={18} />
                </button>
                <button className="btn btn-primary" style={{padding: '8px', flexGrow: 1}} onClick={stepForward} disabled={currentStepIndex === simulationSteps.length - 1} title="Step Forward">
                  Next Step <ChevronRight size={18} />
                </button>
              </div>
            )}

            {currentStepIndex >= 0 && (
              <div style={{ marginTop: '10px' }}>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px'}}>
                  <span>Tape</span>
                  <span>Step {currentStepIndex + 1} of {simulationSteps.length}</span>
                </div>
                <div className="tape-container">
                  {simulationSteps[currentStepIndex].consumedInput.split('').map((char, i) => (
                    <div key={`c-${i}`} className="tape-cell consumed">{char}</div>
                  ))}
                  {simulationSteps[currentStepIndex].remainingInput.split('').map((char, i) => (
                    <div key={`r-${i}`} className={`tape-cell ${i === 0 && currentStepIndex < simulationSteps.length - 1 ? 'active' : ''}`}>{char}</div>
                  ))}
                  {/* Empty case */}
                  {simulationSteps[currentStepIndex].consumedInput.length === 0 && simulationSteps[currentStepIndex].remainingInput.length === 0 && (
                     <div className="tape-cell active">ε</div>
                  )}
                </div>
                {simulationSteps[currentStepIndex].isAccepted !== null && (
                   <div className={`toast ${simulationSteps[currentStepIndex].isAccepted ? 'badge-success' : 'badge-danger'}`} style={{justifyContent: 'center', marginTop:'10px'}}>
                     {simulationSteps[currentStepIndex].isAccepted ? 'String Accepted!' : 'String Rejected'}
                   </div>
                )}
                {simulationSteps[currentStepIndex].error && (
                   <div className="toast badge-danger" style={{fontSize: '0.8rem', marginTop:'10px'}}>
                     {simulationSteps[currentStepIndex].error}
                   </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ flexGrow: 1, position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onSelectionChange={(params) => {
            setSelectedNode(params.nodes.length > 0 ? params.nodes[0] : null);
            setSelectedEdge(params.edges.length > 0 ? params.edges[0] : null);
          }}
          fitView
          colorMode="light"
        >
          <Background color="#000" gap={20} size={1} style={{ opacity: 0.05 }} />
          <Controls position="bottom-right" />
        </ReactFlow>

        {/* Properties Panel */}
        {(selectedNode || selectedEdge) && (
          <div className="glass-panel properties-panel">
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1rem' }}>
                {selectedNode ? 'State Properties' : 'Transition Properties'}
              </h3>
            </div>
            
            {selectedNode && (
              <>
                <div className="input-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Label / Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={selectedNode.data.label as string}
                    onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                  />
                </div>
                
                <div className="prop-row">
                  <span style={{ fontSize: '0.9rem' }}>Initial State</span>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={selectedNode.data.isInitial as boolean}
                      onChange={(e) => {
                        // Unset others if this gets checked
                        if (e.target.checked) {
                          setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, isInitial: true } } : { ...n, data: { ...n.data, isInitial: false } }));
                        } else {
                          updateNodeData(selectedNode.id, { isInitial: false });
                        }
                      }}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
                
                <div className="prop-row">
                  <span style={{ fontSize: '0.9rem' }}>Accepting State</span>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={selectedNode.data.isAccepting as boolean}
                      onChange={(e) => updateNodeData(selectedNode.id, { isAccepting: e.target.checked })}
                    />
                    <span className="slider"></span>
                  </label>
                </div>
              </>
            )}

            {selectedEdge && (
              <>
                 <div className="input-group" style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'hsl(var(--text-muted))' }}>Symbols (comma separated)</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. 0,1 or a,b"
                    value={selectedEdge.data?.symbols as string}
                    onChange={(e) => updateEdgeData(selectedEdge.id, { symbols: e.target.value })}
                  />
                </div>
              </>
            )}

          </div>
        )}

        {/* Global Toast */}
        {toast && (
          <div className="toast-container">
            <div className={`glass-panel toast ${toast.type === 'success' ? 'badge-success' : 'badge-danger'}`} style={{ background: 'var(--panel-bg)', border: `1px solid ${toast.type === 'success' ? 'var(--success)' : 'var(--danger)' }`}}>
              {toast.type === 'success' ? <CheckCircle2 size={16}/> : <AlertCircle size={16} />}
              {toast.msg}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <FlowApp />
    </ReactFlowProvider>
  );
}

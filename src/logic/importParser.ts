import type { Node, Edge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';

export const parseFSMText = (text: string): { nodes: Node[], edges: Edge[] } => {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  const states: string[] = [];
  let initial = '';
  const accepting: string[] = [];
  const alphabet: string[] = [];
  const transitions: string[] = [];
  
  let currentSection = '';

  for (const line of lines) {
    if (line.startsWith('#')) {
      currentSection = line;
      continue;
    }
    
    switch (currentSection) {
      case '#states':
        states.push(line);
        break;
      case '#initial':
        initial = line;
        break;
      case '#accepting':
        accepting.push(...line.split(',').map(s => s.trim()));
        break;
      case '#alphabet':
        alphabet.push(line);
        break;
      case '#transitions':
        transitions.push(line);
        break;
    }
  }

  // Layout logic: Simple horizontal snake line
  const positions: Record<string, {x: number, y: number}> = {};
  
  const GAP_X = 200;
  const GAP_Y = 150;
  const ITEMS_PER_ROW = 5;

  states.forEach((state, idx) => {
    const row = Math.floor(idx / ITEMS_PER_ROW);
    const posInRow = idx % ITEMS_PER_ROW;
    
    // Snake layout: Left-to-Right then Right-to-Left
    let x = posInRow * GAP_X + 100;
    if (row % 2 !== 0) {
      x = (ITEMS_PER_ROW - 1 - posInRow) * GAP_X + 100;
    }
    
    positions[state] = {
      x,
      y: row * GAP_Y + 100
    };
  });

  const nodes: Node[] = states.map((state, i) => ({
    id: state, // Using state name as ID for simplicity
    type: 'state',
    position: positions[state] || { x: 10 + i * 50, y: 100 },
    data: {
      label: state,
      isInitial: state === initial,
      isAccepting: accepting.includes(state)
    }
  }));

  const edges: Edge[] = transitions.map((t, i) => {
    // Format: stateA:symbol>stateB,stateC or just stateA:symbol>stateB
    // In user's example: q0:2>q1 or q1:0,1,2,3>q0
    const parts = t.match(/([^:]+):([^>]+)>([^,]+)/);
    if (!parts) return null as unknown as Edge; // Skip invalid
    
    const [, source, symbols, target] = parts;
    
    return {
      id: `e-${source}-${target}-${i}`,
      source: source.trim(),
      target: target.trim(),
      type: 'transition',
      data: { symbols: symbols.trim() },
      markerEnd: { type: MarkerType.ArrowClosed, width: 20, height: 20, color: 'hsl(var(--primary))' },
    };
  }).filter(Boolean);

  return { nodes, edges };
};

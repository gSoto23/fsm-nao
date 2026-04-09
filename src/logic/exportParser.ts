import type { Node, Edge } from '@xyflow/react';

export const generateFSMText = (nodes: Node[], edges: Edge[]): string => {
  let text = '';

  // 1. States
  text += '#states\n';
  nodes.forEach(node => {
     text += `${node.id}\n`;
  });

  // 2. Initial state
  const initialNode = nodes.find(n => n.data.isInitial);
  if (initialNode) {
     text += '#initial\n';
     text += `${initialNode.id}\n`;
  }

  // 3. Accepting states
  const acceptingNodes = nodes.filter(n => n.data.isAccepting);
  if (acceptingNodes.length > 0) {
     text += '#accepting\n';
     text += acceptingNodes.map(n => n.id).join(',') + '\n';
  }

  // 4. Alphabet (calculate from all edges)
  const alphabetSet = new Set<string>();
  edges.forEach(edge => {
     if (edge.data && edge.data.symbols) {
         const syms = (edge.data.symbols as string).split(',');
         syms.forEach(s => alphabetSet.add(s.trim()));
     }
  });
  if (alphabetSet.size > 0) {
     text += '#alphabet\n';
     Array.from(alphabetSet).sort().forEach(sym => {
        text += `${sym}\n`;
     });
  }

  // 5. Transitions
  if (edges.length > 0) {
     text += '#transitions\n';
     edges.forEach(edge => {
         // Some edges might not have symbols (epsilon). Default to epsilon or empty if not provided.
         const symbols = edge.data?.symbols ? (edge.data.symbols as string).trim() : 'epsilon';
         text += `${edge.source}:${symbols}>${edge.target}\n`;
     });
  }

  return text.trim();
};

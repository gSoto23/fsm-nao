import LZString from 'lz-string';
import type { Node, Edge } from '@xyflow/react';

export const compressGraph = (nodes: Node[], edges: Edge[]): string => {
  const data = JSON.stringify({ nodes, edges });
  return LZString.compressToEncodedURIComponent(data);
};

export const decompressGraph = (hash: string): { nodes: Node[], edges: Edge[] } | null => {
  try {
    const rawMatch = hash.match(/data=(.*)/);
    let raw = hash;
    if (rawMatch && rawMatch.length > 1) {
      raw = rawMatch[1];
    }
    if (!raw) return null;
    
    // Fallback if not url component encoded properly
    const decompressed = LZString.decompressFromEncodedURIComponent(raw);
    if (!decompressed) return null;

    return JSON.parse(decompressed);
  } catch (error) {
    console.error("Failed to parse URL hash:", error);
    return null;
  }
};

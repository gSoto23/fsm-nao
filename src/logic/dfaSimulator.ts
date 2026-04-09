export interface DFANodeData {
  label: string;
  isInitial: boolean;
  isAccepting: boolean;
}

export interface DFAEdgeData {
  symbols: string; // Comma separated, e.g. "a,b"
}

export interface ValidationWarning {
  message: string;
  type: 'warning' | 'error';
}

export interface SimulationStep {
  state: string;
  remainingInput: string;
  consumedInput: string;
  lastSymbol: string | null;
  isAccepted: boolean | null; // null if not finished
  error?: string;
}

// Validates if the given graph (nodes and edges) forms a valid DFA
export const validateDFA = (nodes: any[], edges: any[]): ValidationWarning[] => {
  const warnings: ValidationWarning[] = [];
  
  // 1. Must have exactly one initial state
  const initialNodes = nodes.filter(n => n.data.isInitial);
  if (initialNodes.length === 0) {
    warnings.push({ message: "No initial state defined.", type: 'error' });
  } else if (initialNodes.length > 1) {
    warnings.push({ message: "Multiple initial states defined. A DFA must have exactly one.", type: 'error' });
  }

  // 2. Determinism check: For any state, it cannot have multiple outgoing edges with the same symbol
  const stateTransitions = new Map<string, Set<string>>();

  edges.forEach(edge => {
    const source = edge.source;
    if (!stateTransitions.has(source)) {
      stateTransitions.set(source, new Set());
    }

    const set = stateTransitions.get(source)!;
    const symbols = (edge.data?.symbols || "").split(',').map((s: string) => s.trim()).filter((s: string) => s !== "");

    symbols.forEach((sym: string) => {
      // Empty transitions epsilon are not allowed in DFA
      if (sym === 'ε' || sym === '') {
        warnings.push({ message: `State ${getNodeLabel(nodes, source)} has an empty transition (ε), which is not allowed in a DFA.`, type: 'error' });
      }

      if (set.has(sym)) {
        warnings.push({ message: `Non-determinism detected: State ${getNodeLabel(nodes, source)} has multiple transitions for symbol '${sym}'.`, type: 'error' });
      } else {
        set.add(sym);
      }
    });

    if (symbols.length === 0) {
       warnings.push({ message: `An edge from ${getNodeLabel(nodes, source)} to ${getNodeLabel(nodes, edge.target)} has no symbols.`, type: 'warning' });
    }
  });

  // 3. Optional: Unreachable states warning
  // Could implement a BFS to find unreachable states from initial

  return warnings;
};

const getNodeLabel = (nodes: any[], id: string) => {
  const n = nodes.find(n => n.id === id);
  return n ? n.data.label : id;
}

// Runs the full simulation and returns steps
export const simulateDFA = (nodes: any[], edges: any[], input: string): SimulationStep[] => {
  const initialNodes = nodes.filter(n => n.data.isInitial);
  if (initialNodes.length !== 1) {
    return [{
      state: '',
      remainingInput: input,
      consumedInput: '',
      lastSymbol: null,
      isAccepted: false,
      error: 'Invalid DFA: Must have exactly 1 initial state'
    }];
  }

  const steps: SimulationStep[] = [];
  let currentStateId = initialNodes[0].id;
  let remainingInput = input;
  let consumedInput = "";

  // Step 0: Initial position
  steps.push({
    state: currentStateId,
    remainingInput,
    consumedInput,
    lastSymbol: null,
    isAccepted: null
  });

  for (let i = 0; i < input.length; i++) {
    const symbol = input[i];
    
    // Find transition
    const transition = edges.find(e => {
        if (e.source !== currentStateId) return false;
        const symbols = (e.data?.symbols || "").split(',').map((s: string) => s.trim());
        return symbols.includes(symbol);
    });

    remainingInput = remainingInput.substring(1);
    consumedInput += symbol;

    if (!transition) {
      // Dead end / Reject
      steps.push({
        state: currentStateId, // stay where it failed
        remainingInput,
        consumedInput,
        lastSymbol: symbol,
        isAccepted: false,
        error: `No transition from state ${getNodeLabel(nodes, currentStateId)} for symbol '${symbol}'`
      });
      return steps;
    }

    currentStateId = transition.target;
    
    const isLast = i === input.length - 1;
    let isAccepted = null;
    
    if (isLast) {
      const node = nodes.find(n => n.id === currentStateId);
      isAccepted = node?.data.isAccepting ?? false;
    }

    steps.push({
      state: currentStateId,
      remainingInput,
      consumedInput,
      lastSymbol: symbol,
      isAccepted: isAccepted
    });
  }

  // If empty input
  if (input.length === 0) {
    const node = initialNodes[0];
    steps[0].isAccepted = node.data.isAccepting;
  }

  return steps;
};

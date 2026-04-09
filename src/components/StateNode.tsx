import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';

const StateNode = ({ data, selected }: NodeProps) => {
  return (
    <div 
      className={`dfa-node ${selected ? 'selected' : ''} ${data.isAccepting ? 'accepting' : ''} ${data.isInitial ? 'initial' : ''} ${data.isActive ? 'active' : ''}`}
    >
      {/* Target Handle: For incoming connections */}
      <Handle 
        type="target" 
        position={Position.Top} 
        id="target"
        style={{ background: 'hsl(var(--primary))', border: '2px solid hsl(var(--panel-bg))', width: 12, height: 12 }} 
      />
      
      <div>{String(data.label)}</div>
      
      {/* Source Handle: For outgoing connections */}
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="source"
        style={{ background: 'hsl(var(--primary))', border: '2px solid hsl(var(--panel-bg))', width: 12, height: 12 }} 
      />
      {/* Adding side handles for more flexibility */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="sourceRight"
        style={{ background: 'hsl(var(--primary))', border: '2px solid hsl(var(--panel-bg))', width: 12, height: 12 }} 
      />
      <Handle 
        type="target" 
        position={Position.Left} 
        id="targetLeft"
        style={{ background: 'hsl(var(--primary))', border: '2px solid hsl(var(--panel-bg))', width: 12, height: 12, left: -6 }} 
      />
    </div>
  );
};

export default memo(StateNode);

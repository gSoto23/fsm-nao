import { BaseEdge, EdgeLabelRenderer, useInternalNode } from '@xyflow/react';
import type { EdgeProps } from '@xyflow/react';

// Intersection point between center-to-center line and circumference
function getIntersection(x1: number, y1: number, x2: number, y2: number, radius: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  if (length === 0) return { x: x1, y: y1 };
  return {
    x: x1 + (dx / length) * radius,
    y: y1 + (dy / length) * radius,
  };
}

export default function TransitionEdge({
  source,
  target,
  selected,
  data,
  markerEnd,
}: EdgeProps) {
  // Extracting live node dimensions & positions without needing predefined react-flow Handles
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) return null;

  const w1 = sourceNode.measured?.width ?? 60;
  const h1 = sourceNode.measured?.height ?? 60;
  const w2 = targetNode.measured?.width ?? 60;
  const h2 = targetNode.measured?.height ?? 60;

  const cx1 = (sourceNode.internals.positionAbsolute?.x ?? 0) + w1 / 2;
  const cy1 = (sourceNode.internals.positionAbsolute?.y ?? 0) + h1 / 2;
  const cx2 = (targetNode.internals.positionAbsolute?.x ?? 0) + w2 / 2;
  const cy2 = (targetNode.internals.positionAbsolute?.y ?? 0) + h2 / 2;

  let edgePath = '';
  let labelX = 0;
  let labelY = 0;

  const isSelfLoop = source === target;

  if (isSelfLoop) {
    const r = Math.max(w1, h1) / 2;
    // Angles to open the loop precisely on the top of the node circumference
    const angle1 = -Math.PI / 8; // Top right circumference
    const angle2 = -7 * Math.PI / 8; // Top left circumference
    
    const sx = cx1 + Math.cos(angle1) * r;
    const sy = cy1 + Math.sin(angle1) * r;
    const tx = cx1 + Math.cos(angle2) * r;
    const ty = cy1 + Math.sin(angle2) * r;

    // Extremely exaggerated Bezier control points to shoot it upwards
    const cpX1 = sx + 40;
    const cpY1 = sy - 110;
    const cpX2 = tx - 40;
    const cpY2 = ty - 110;

    edgePath = `M ${sx} ${sy} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${tx} ${ty}`;
    labelX = cx1;
    labelY = cy1 - r - 65; // Place right at the apex
  } else {
    // Normal Edge floating intersection logic
    const r1 = Math.max(w1, h1) / 2;
    const r2 = Math.max(w2, h2) / 2;
    
    // Intersection points on the circumference toward the counterpart node
    const p1 = getIntersection(cx1, cy1, cx2, cy2, r1 + 2); // 2px spacer buffer
    const p2 = getIntersection(cx2, cy2, cx1, cy1, r2 + 6); // 6px buffer for the closed arrow
    
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx*dx + dy*dy);

    // Apply a wide arched bend so bidirectional overlapping edges curve gracefully away from each other and avoid intermediate nodes
    const nx = -dy / length;
    const ny = dx / length;
    const bend = Math.min(length * 0.45, 300); // Massive curvature for long leaps
    
    const mx = p1.x + dx/2 + nx * bend;
    const my = p1.y + dy/2 + ny * bend;

    // Quadratic curved path
    edgePath = `M ${p1.x} ${p1.y} Q ${mx} ${my} ${p2.x} ${p2.y}`;
    
    // Accurate midpoint calculation for Q Curve label projection
    labelX = p1.x * 0.25 + mx * 0.5 + p2.x * 0.25;
    labelY = p1.y * 0.25 + my * 0.5 + p2.y * 0.25;
  }

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        style={{
          strokeWidth: selected ? 3 : 2,
          stroke: selected ? 'hsl(var(--accent))' : 'hsl(var(--primary))',
          opacity: 0.8,
          fill: 'none',
        }} 
      />
      <EdgeLabelRenderer>
        <div
          className="edge-label"
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
        >
          {data?.symbols ? (data.symbols as string) : 'epsilon'}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

import dagre from '@dagrejs/dagre';
import type { CanvasEdgeItem, CanvasNodeItem } from '../types/aws';

export const GRID_SNAP_SIZE = 16;
export const SERVICE_NODE_WIDTH = 140;
export const SERVICE_NODE_HEIGHT = 80;
export const GROUP_HEADER_HEIGHT = 32;
export const GROUP_TOP_PADDING = 56;
export const GROUP_SIDE_PADDING = 40;
export const GROUP_BOTTOM_PADDING = 40;

/**
 * Snaps any coordinate or dimension to the nearest 16px grid step
 */
export function snapToGrid(value: number, step = GRID_SNAP_SIZE): number {
  return Math.round(value / step) * step;
}

/**
 * Calculates absolute coordinates of a node by recursively accumulating
 * parent container positions.
 */
export function getNodeAbsolutePosition(
  node: CanvasNodeItem,
  allNodes?: CanvasNodeItem[]
): { x: number; y: number } {
  let x = node.position.x;
  let y = node.position.y;
  let currentParentId = node.parentId;
  const visited = new Set<string>();

  if (allNodes && allNodes.length > 0) {
    while (currentParentId && !visited.has(currentParentId)) {
      visited.add(currentParentId);
      const parent = allNodes.find((n) => n.id === currentParentId);
      if (parent) {
        x += parent.position.x;
        y += parent.position.y;
        currentParentId = parent.parentId;
      } else {
        break;
      }
    }
  }

  return { x, y };
}

/**
 * Calculates center coordinates of a node.
 * For AWS service nodes, center is aligned around the 48px icon (center at x + 70, y + 24).
 */
export function getNodeCenter(
  node: CanvasNodeItem,
  allNodes?: CanvasNodeItem[]
): { x: number; y: number } {
  const abs = getNodeAbsolutePosition(node, allNodes);
  if (node.data?.isBoundary) {
    const width = node.data.width || (node.style?.width as number) || 400;
    const height = node.data.height || (node.style?.height as number) || 280;
    return {
      x: abs.x + width / 2,
      y: abs.y + height / 2,
    };
  }

  // AWSServiceNode standard icon center (w-140)
  return {
    x: abs.x + 70,
    y: abs.y + 24,
  };
}

/**
 * Determines the optimal source and target handles between two nodes
 * based on their relative spatial vector:
 * - If |dx| >= |dy|: connect right -> left (dx >= 0) or left -> right (dx < 0)
 * - If |dy| > |dx|: connect bottom -> top (dy >= 0) or top -> bottom (dy < 0)
 *
 * This prevents connection lines from looping backward over node icons.
 */
export function resolveOptimalHandles(
  sourceNode: CanvasNodeItem,
  targetNode: CanvasNodeItem,
  allNodes?: CanvasNodeItem[]
): { sourceHandle: 'top' | 'right' | 'bottom' | 'left'; targetHandle: 'top' | 'right' | 'bottom' | 'left' } {
  const sourceCenter = getNodeCenter(sourceNode, allNodes);
  const targetCenter = getNodeCenter(targetNode, allNodes);

  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;

    // Hard-lock horizontal handles when flow is primarily horizontal
    // or when vertical delta is within reasonable horizontal band (< 80px)
    if (Math.abs(dy) < 80 || Math.abs(dx) >= Math.abs(dy)) {
      if (dx >= 0) {
        return { sourceHandle: 'right', targetHandle: 'left' };
      }
      return { sourceHandle: 'left', targetHandle: 'right' };
    }

    if (dy >= 0) {
      return { sourceHandle: 'bottom', targetHandle: 'top' };
    }
    return { sourceHandle: 'top', targetHandle: 'bottom' };
  }

  /**
   * Helper to determine which group container should enclose a service node
   * if explicit parentId is not already specified.
   */
  function inferNodeParentId(node: CanvasNodeItem, groupNodes: CanvasNodeItem[]): string | undefined {
    if (node.parentId) return node.parentId;

    // Filter groups whose bounding box covers the node's initial position
    const candidates = groupNodes.filter((group) => {
      const gx = group.position.x;
      const gy = group.position.y;
      const gw = group.data?.width || (group.style?.width as number) || 400;
      const gh = group.data?.height || (group.style?.height as number) || 280;

      return (
        node.position.x >= gx - 20 &&
        node.position.x <= gx + gw + 20 &&
        node.position.y >= gy - 20 &&
        node.position.y <= gy + gh + 20
      );
    });

    if (candidates.length === 0) return undefined;

    // Sort candidate groups by area ascending: smallest (innermost) container wins
    candidates.sort((a, b) => {
      const areaA = (a.data?.width || 400) * (a.data?.height || 280);
      const areaB = (b.data?.width || 400) * (b.data?.height || 280);
      return areaA - areaB;
    });

    return candidates[0].id;
  }

  /**
   * Deterministic Dagre Auto-Layout Engine
   * Builds an orthogonal, collision-free tiered layout using @dagrejs/dagre.
   *
   * Configures:
   * - rankdir: direction ('LR' | 'TB')
   * - align: 'UL'
   * - nodesep: 90
   * - ranksep: 160
   * - edgesep: 50
   * - marginx: 40, marginy: 40
   * - 16px grid snapping
   * - Dynamic group node bounding boxes (64px top padding, 40px side/bottom padding)
   * - Optimal directional handle assignment
   */
  export function getLayoutedElements(
    nodes: CanvasNodeItem[],
    edges: CanvasEdgeItem[],
    direction: 'LR' | 'TB' = 'LR'
  ): { nodes: CanvasNodeItem[]; edges: CanvasEdgeItem[] } {
    if (nodes.length === 0) {
      return { nodes: [], edges: [] };
    }

    const dagreGraph = new dagre.graphlib.Graph({ compound: true });
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({
      rankdir: direction,
      align: 'UL',
      nodesep: 90,
      ranksep: 160,
      edgesep: 50,
      marginx: 40,
      marginy: 40,
    });

    const boundaryNodes = nodes.filter((n) => n.data?.isBoundary);
    const serviceNodes = nodes.filter((n) => !n.data?.isBoundary);

    // Map of which service node IDs belong to which group ID
    const groupChildrenMap = new Map<string, string[]>();
    boundaryNodes.forEach((b) => groupChildrenMap.set(b.id, []));

    // Determine hierarchy and register nodes in Dagre
    serviceNodes.forEach((node) => {
      const parentId = inferNodeParentId(node, boundaryNodes);
      if (parentId && groupChildrenMap.has(parentId)) {
        groupChildrenMap.get(parentId)?.push(node.id);
      }

      dagreGraph.setNode(node.id, {
        width: SERVICE_NODE_WIDTH,
        height: SERVICE_NODE_HEIGHT,
      });
    });

    // Register edges between service nodes in Dagre
    const serviceNodeIdSet = new Set(serviceNodes.map((n) => n.id));
    edges.forEach((edge) => {
      if (serviceNodeIdSet.has(edge.source) && serviceNodeIdSet.has(edge.target)) {
        dagreGraph.setEdge(edge.source, edge.target);
      }
    });

    // Calculate layout via Dagre
    dagre.layout(dagreGraph);

    // Position service nodes and snap to 16px grid
    const nodePositionMap = new Map<string, { x: number; y: number }>();
    serviceNodes.forEach((node) => {
      const dagreNode = dagreGraph.node(node.id);
      const rawX = (dagreNode?.x ?? node.position.x) - SERVICE_NODE_WIDTH / 2;
      const rawY = (dagreNode?.y ?? node.position.y) - SERVICE_NODE_HEIGHT / 2;

      const snappedX = snapToGrid(rawX);
      const snappedY = snapToGrid(rawY);

      nodePositionMap.set(node.id, { x: snappedX, y: snappedY });
    });

    // Calculate dynamic bounding boxes for boundary group containers
    // Subnets (inner containers) are processed first, followed by VPC / Cloud outer containers
    const sortBoundaryOrder = (a: CanvasNodeItem, b: CanvasNodeItem): number => {
      const order: Record<string, number> = {
        'auto-scaling-group': 1,
        'security-group': 2,
        'data-subnet': 3,
        'private-subnet': 4,
        'public-subnet': 5,
        serverless: 6,
        vpc: 7,
        region: 8,
        'aws-cloud': 9,
      };
      const orderA = order[a.data?.boundaryType || ''] ?? 5;
      const orderB = order[b.data?.boundaryType || ''] ?? 5;
      return orderA - orderB;
    };

    const sortedBoundaries = [...boundaryNodes].sort(sortBoundaryOrder);
    const boundaryPositions = new Map<string, { x: number; y: number; width: number; height: number }>();

    sortedBoundaries.forEach((boundary) => {
      const childServiceIds = groupChildrenMap.get(boundary.id) || [];
      const childPositions: Array<{ x: number; y: number; width: number; height: number }> = [];

      // Collect positions of direct child service nodes
      childServiceIds.forEach((id) => {
        const pos = nodePositionMap.get(id);
        if (pos) {
          childPositions.push({
            x: pos.x,
            y: pos.y,
            width: SERVICE_NODE_WIDTH,
            height: SERVICE_NODE_HEIGHT,
          });
        }
      });

      // Also collect bounds of any child groups enclosed within this parent group
      boundaryPositions.forEach((childGroup, childGroupId) => {
        if (childGroupId === boundary.id) return;
        const bType = boundary.data?.boundaryType;
        const childNode = boundaryNodes.find((b) => b.id === childGroupId);
        const isHierarchicalContainer =
          bType === 'aws-cloud' || bType === 'vpc' || bType === 'region';

        if (childNode?.parentId) {
          if (childNode.parentId === boundary.id) {
            childPositions.push(childGroup);
          }
        } else if (isHierarchicalContainer) {
          childPositions.push(childGroup);
        }
      });

      if (childPositions.length > 0) {
        const minX = Math.min(...childPositions.map((c) => c.x));
        const minY = Math.min(...childPositions.map((c) => c.y));
        const maxX = Math.max(...childPositions.map((c) => c.x + c.width));
        const maxY = Math.max(...childPositions.map((c) => c.y + c.height));

        const snappedX = snapToGrid(minX - GROUP_SIDE_PADDING);
        const snappedY = snapToGrid(minY - GROUP_TOP_PADDING);
        const snappedWidth = snapToGrid(maxX - minX + GROUP_SIDE_PADDING * 2);
        const snappedHeight = snapToGrid(maxY - minY + GROUP_TOP_PADDING + GROUP_BOTTOM_PADDING);

        boundaryPositions.set(boundary.id, {
          x: snappedX,
          y: snappedY,
          width: Math.max(snappedWidth, 240),
          height: Math.max(snappedHeight, 160),
        });
      } else {
        // Fallback for standalone group boundaries with no children
        boundaryPositions.set(boundary.id, {
          x: snapToGrid(boundary.position.x),
          y: snapToGrid(boundary.position.y),
          width: snapToGrid(boundary.data?.width || 480),
          height: snapToGrid(boundary.data?.height || 320),
        });
      }
    });

    // Convert service node positions to relative to their parent container
    const layoutedServiceNodes = serviceNodes.map((node) => {
      const absPos = nodePositionMap.get(node.id) || { x: node.position.x, y: node.position.y };
      const parentId = node.parentId || inferNodeParentId(node, boundaryNodes);
      const parentComputed = parentId ? boundaryPositions.get(parentId) : undefined;

      const posX = parentComputed ? absPos.x - parentComputed.x : absPos.x;
      const posY = parentComputed ? absPos.y - parentComputed.y : absPos.y;

      return {
        ...node,
        parentId,
        position: { x: posX, y: posY },
      };
    });

    // Convert boundary node positions to relative to their parent container (e.g. subnets inside VPC)
    const layoutedBoundaryNodes = boundaryNodes.map((b) => {
      const computed = boundaryPositions.get(b.id);
      if (!computed) return b;

      const parentComputed = b.parentId ? boundaryPositions.get(b.parentId) : undefined;
      const posX = parentComputed ? computed.x - parentComputed.x : computed.x;
      const posY = parentComputed ? computed.y - parentComputed.y : computed.y;

      return {
        ...b,
        position: { x: posX, y: posY },
        zIndex: -1,
        style: {
          ...b.style,
          width: computed.width,
          height: computed.height,
        },
        data: {
          ...b.data,
          width: computed.width,
          height: computed.height,
        },
      };
    });

    const finalNodes = [...layoutedBoundaryNodes, ...layoutedServiceNodes];

    // Recalculate optimal handles for every edge using absolute coordinates
    const layoutedEdges = edges.map((edge) => {
      const srcAbs = nodePositionMap.get(edge.source);
      const tgtAbs = nodePositionMap.get(edge.target);

      if (srcAbs && tgtAbs) {
        const dx = tgtAbs.x - srcAbs.x;
        const dy = tgtAbs.y - srcAbs.y;
        let optimalSource: 'top' | 'right' | 'bottom' | 'left' = 'right';
        let optimalTarget: 'top' | 'right' | 'bottom' | 'left' = 'left';

          if (Math.abs(dy) < 80 || Math.abs(dx) >= Math.abs(dy)) {
            optimalSource = dx >= 0 ? 'right' : 'left';
            optimalTarget = dx >= 0 ? 'left' : 'right';
          } else {
            optimalSource = dy >= 0 ? 'bottom' : 'top';
            optimalTarget = dy >= 0 ? 'top' : 'bottom';
          }

          return {
            ...edge,
            sourceHandle: optimalSource,
            targetHandle: optimalTarget,
          };
        }
        return edge;
      });

    return {
      nodes: finalNodes,
      edges: layoutedEdges,
    };
  }

import type { CanvasNodeItem, CanvasEdgeItem } from '../types/aws';
import { getAWSCategoryColor } from './awsCategoryColors';

/**
 * Generates an SVG Data URI thumbnail of an architecture diagram.
 * Completely deterministic and synchronous with zero DOM or canvas context overhead.
 */
export function generateDiagramThumbnail(
  nodes: CanvasNodeItem[],
  edges: CanvasEdgeItem[],
  theme: 'dark' | 'light' = 'dark'
): string {
  const bg = theme === 'dark' ? '#161E2D' : '#FFFFFF';
  const strokeColor = theme === 'dark' ? '#354150' : '#E2E8F0';
  const textMuted = theme === 'dark' ? '#879596' : '#64748B';

  if (!nodes || nodes.length === 0) {
    const emptySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 140" width="240" height="140">
      <rect width="240" height="140" fill="${bg}" rx="6" stroke="${strokeColor}" stroke-width="1"/>
      <text x="120" y="75" text-anchor="middle" fill="${textMuted}" font-size="11" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">Blank Sandbox</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(emptySvg)}`;
  }

  // Calculate actual bounding box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((n) => {
    const isBoundary = n.data?.isBoundary;
    const w = (n.data?.width as number) || (isBoundary ? 500 : 140);
    const h = (n.data?.height as number) || (isBoundary ? 300 : 80);
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + w);
    maxY = Math.max(maxY, n.position.y + h);
  });

  const pad = 40;
  minX -= pad;
  minY -= pad;
  maxX += pad;
  maxY += pad;
  const totalW = Math.max(200, maxX - minX);
  const totalH = Math.max(120, maxY - minY);

  // Group boundaries rendered first in background
  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.data?.isBoundary && !b.data?.isBoundary) return -1;
    if (!a.data?.isBoundary && b.data?.isBoundary) return 1;
    return 0;
  });

  const nodeElements = sortedNodes
    .map((n) => {
      const isBoundary = n.data?.isBoundary;
      const isAnnotation = n.data?.isAnnotation;
      const w = (n.data?.width as number) || (isBoundary ? 500 : 140);
      const h = (n.data?.height as number) || (isBoundary ? 300 : 80);
      const x = n.position.x;
      const y = n.position.y;

      if (isBoundary) {
        const bType = n.data?.boundaryType || 'vpc';
        const bColor =
          n.data?.accentColor ||
          (bType === 'vpc'
            ? '#8C4FFF'
            : bType === 'public-subnet'
            ? '#1D8102'
            : bType === 'private-subnet'
            ? '#0073BB'
            : bType === 'security-group'
            ? '#DD344C'
            : '#545B64');
        const dash = bType === 'region' || bType === 'security-group' ? 'stroke-dasharray="4 4"' : '';
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${bColor}" fill-opacity="0.08" stroke="${bColor}" stroke-width="2" ${dash}/>`;
      }

      if (isAnnotation) {
        return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="#F59E0B" fill-opacity="0.12" stroke="#F59E0B" stroke-width="1.5"/>`;
      }

      const catColor = getAWSCategoryColor(n.data?.category || 'Compute', theme);
      const label = (n.data?.customTitle || n.data?.label || '').replace(/[<>&"]/g, '');

      return `<g transform="translate(${x},${y})">
        <rect width="${w}" height="${h}" rx="6" fill="${theme === 'dark' ? '#192534' : '#FFFFFF'}" stroke="${catColor}" stroke-width="1.5"/>
        <rect x="8" y="10" width="18" height="18" rx="4" fill="${catColor}"/>
        <text x="32" y="23" font-size="11" font-weight="600" fill="${theme === 'dark' ? '#EAEDED' : '#16191F'}" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif">${label.slice(0, 16)}</text>
      </g>`;
    })
    .join('');

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const edgeElements = edges
    .map((e) => {
      const src = nodeMap.get(e.source);
      const tgt = nodeMap.get(e.target);
      if (!src || !tgt) return '';
      const sx = src.position.x + 70;
      const sy = src.position.y + 40;
      const tx = tgt.position.x + 70;
      const ty = tgt.position.y + 40;
      const edgeStroke = e.data?.edgeColor || (theme === 'dark' ? '#539FE5' : '#0972D3');
      return `<path d="M ${sx} ${sy} Q ${(sx + tx) / 2} ${(sy + ty) / 2 - 20} ${tx} ${ty}" stroke="${edgeStroke}" stroke-width="1.75" stroke-dasharray="3 3" fill="none"/>`;
    })
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${totalW} ${totalH}" width="240" height="140">
    <rect x="${minX}" y="${minY}" width="${totalW}" height="${totalH}" fill="${bg}" rx="6"/>
    ${nodeElements}
    ${edgeElements}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}


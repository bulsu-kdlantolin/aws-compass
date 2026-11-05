// src/utils/mermaidWithIcons.ts
// Enriches Mermaid flowchart source strings with official AWS architecture service icons
// and actor vector tiles so architecture flows look properly represented (matching Architecture Canvas).

import type { AWSService } from '../types/aws';
import { getAWSServiceIconUrl } from '../components/icons/awsIconRegistry';
import { matchServiceOrActor } from './mermaidToDiagram';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const ACTOR_DATA_URIS: Record<string, string> = {
  'user-browser':
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="36" height="36"><rect width="32" height="32" rx="4" fill="#0972D3"/><g fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="24" height="18" rx="2"/><line x1="4" y1="10" x2="28" y2="10"/><circle cx="7.5" cy="7.5" r="0.75" fill="#FFFFFF"/><circle cx="10.5" cy="7.5" r="0.75" fill="#FFFFFF"/><circle cx="16" cy="15" r="2.5"/><path d="M12 21C12 18.8 13.8 17 16 17C18.2 17 20 18.8 20 21"/></g></svg>`
    ),
  'mobile-client':
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="36" height="36"><rect width="32" height="32" rx="4" fill="#0972D3"/><g fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="14" height="26" rx="3"/><line x1="13" y1="6" x2="19" y2="6"/><circle cx="16" cy="25" r="1.5" fill="#FFFFFF"/></g></svg>`
    ),
  'corporate-datacenter':
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="36" height="36"><rect width="32" height="32" rx="4" fill="#545B64"/><g fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="20" height="24" rx="2"/><line x1="6" y1="12" x2="26" y2="12"/><line x1="6" y1="20" x2="26" y2="20"/><circle cx="10" cy="8" r="1" fill="#FFFFFF"/><circle cx="10" cy="16" r="1" fill="#FFFFFF"/><circle cx="10" cy="24" r="1" fill="#FFFFFF"/></g></svg>`
    ),
  'third-party-api':
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="36" height="36"><rect width="32" height="32" rx="4" fill="#8C4FFF"/><g fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="16" r="9"/><line x1="7" y1="16" x2="25" y2="16"/><path d="M16 7a13 13 0 0 0 0 18M16 7a13 13 0 0 1 0 18"/></g></svg>`
    ),
  'external-webhook':
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="36" height="36"><rect width="32" height="32" rx="4" fill="#E7157B"/><g fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="3"/><circle cx="22" cy="10" r="3"/><circle cx="16" cy="22" r="3"/><line x1="12" y1="12" x2="15" y2="20"/><line x1="20" y1="12" x2="17" y2="20"/></g></svg>`
    ),
};

/**
 * Transforms standard Mermaid flowchart text to include official AWS icons & layout inside nodes
 */
export function enrichMermaidWithIcons(chart: string, services: AWSService[]): string {
  if (!chart || !chart.trim()) return chart;

  const lines = chart.split('\n');
  const enrichedLines = lines.map((line) => {
    const trimmed = line.trim();
    // Do not touch structural, style, or class statements
    if (
      !trimmed ||
      trimmed.startsWith('subgraph') ||
      trimmed.startsWith('end') ||
      trimmed.startsWith('flowchart') ||
      trimmed.startsWith('graph') ||
      trimmed.startsWith('classDef') ||
      trimmed.startsWith('class ') ||
      trimmed.startsWith('style ') ||
      trimmed.startsWith('click ')
    ) {
      return line;
    }

    // Pattern matching node definitions: NodeId([Label]), NodeId[(Label)], NodeId[Label], etc.
    const pattern = /\b([a-zA-Z0-9_-]+)\s*(\(\[|\[\(|\[\[|\{\{|\[|\()([\s\S]*?)(\]\)|\)\]|\]\]|\}\}|\]|\))/g;

    return line.replace(pattern, (match, nodeId, openBracket, rawLabel, closeBracket) => {
      // Avoid double-enriching
      if (rawLabel.includes('<img') || rawLabel.includes('<div')) {
        return match;
      }
      // If label contains connection arrows, it's not a node label
      if (rawLabel.includes('-->') || rawLabel.includes('-.->') || rawLabel.includes('==>')) {
        return match;
      }
      // Skip flowchart keywords
      if (['subgraph', 'end', 'class', 'style', 'click'].includes(nodeId)) {
        return match;
      }

      const cleanLabel = rawLabel.replace(/^["']|["']$/g, '').trim();
      const matchResult = matchServiceOrActor(nodeId, cleanLabel, services);

      let iconUrl: string | null = null;
      if (matchResult.type === 'service' && matchResult.service) {
        iconUrl = getAWSServiceIconUrl(matchResult.service.id);
      } else if (matchResult.type === 'actor') {
        const actorKey = matchResult.actorType || 'user-browser';
        iconUrl = ACTOR_DATA_URIS[actorKey] || ACTOR_DATA_URIS['user-browser'];
      }

      if (!iconUrl) {
        return match;
      }

      const escapedLabel = escapeHtml(cleanLabel);
      const innerHtml = `<div style='display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:3px 2px;'><img src='${iconUrl}' width='36' height='36' style='display:block;border-radius:4px;box-shadow:0 1px 3px rgba(0,0,0,0.25);' /><span style='font-size:11px;font-weight:600;line-height:1.2;text-align:center;'>${escapedLabel}</span></div>`;

      // Enclose in double quotes inside brackets for 100% valid Mermaid parser syntax
      return `${nodeId}${openBracket}"${innerHtml}"${closeBracket}`;
    });
  });

  return enrichedLines.join('\n');
}


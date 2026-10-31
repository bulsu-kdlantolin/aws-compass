import type {
  AWSService,
  CanvasEdgeItem,
  CanvasNodeItem,
  EdgeProtocol,
  ExternalActorType,
  GroupBoundaryType,
} from '../types/aws';
import { getLayoutedElements } from './canvasAutoLayout';

// Common mapping of known IDs or shorthand tokens to AWS service IDs
const TOKEN_TO_SERVICE_ID: Record<string, string> = {
  s3: 's3',
  bucket: 's3',
  ec2: 'ec2',
  instance: 'ec2',
  vm: 'ec2',
  lambda: 'lambda',
  fn: 'lambda',
  function: 'lambda',
  rds: 'rds',
  aurora: 'rds',
  dynamo: 'dynamodb',
  dynamodb: 'dynamodb',
  cf: 'cloudfront',
  cloudfront: 'cloudfront',
  cdn: 'cloudfront',
  alb: 'alb',
  elb: 'alb',
  nlb: 'alb',
  kms: 'kms',
  key: 'kms',
  sns: 'sns',
  topic: 'sns',
  sqs: 'sqs',
  queue: 'sqs',
  cw: 'cloudwatch',
  cloudwatch: 'cloudwatch',
  logs: 'cloudwatch',
  apigw: 'apigateway',
  apigateway: 'apigateway',
  api: 'apigateway',
  gateway: 'apigateway',
  cognito: 'cognito',
  auth: 'cognito',
  userpool: 'cognito',
  iam: 'iam',
  role: 'iam',
  policy: 'iam',
  secretsmanager: 'secretsmanager',
  secrets: 'secretsmanager',
  route53: 'route53',
  dns: 'route53',
  waf: 'waf',
  firewall: 'waf',
  shield: 'shield',
  eventbridge: 'eventbridge',
  events: 'eventbridge',
  stepfunctions: 'stepfunctions',
  sfn: 'stepfunctions',
  ecs: 'ecs',
  fargate: 'ecs',
  eks: 'eks',
  k8s: 'eks',
  kubernetes: 'eks',
  elasticache: 'elasticache',
  redis: 'elasticache',
  memcached: 'elasticache',
  athena: 'athena',
  glue: 'glue',
  kinesis: 'kinesis',
  firehose: 'kinesis',
};

// External actor identification patterns
const ACTOR_MAP: Record<string, ExternalActorType> = {
  client: 'user-browser',
  user: 'user-browser',
  browser: 'user-browser',
  customer: 'user-browser',
  mobile: 'mobile-client',
  app: 'mobile-client',
  ios: 'mobile-client',
  android: 'mobile-client',
  onprem: 'corporate-datacenter',
  datacenter: 'corporate-datacenter',
  corporate: 'corporate-datacenter',
  branch: 'branch-office',
  office: 'branch-office',
  thirdparty: 'third-party-api',
  api: 'third-party-api',
  partner: 'third-party-api',
  webhook: 'external-webhook',
  github: 'external-webhook',
  stripe: 'external-webhook',
};

/**
 * Determine GroupBoundaryType from subgraph title or ID
 */
function resolveBoundaryType(text: string): GroupBoundaryType {
  const lower = text.toLowerCase();
  if (lower.includes('public subnet') || lower.includes('public-subnet')) return 'public-subnet';
  if (lower.includes('private subnet') || lower.includes('private-subnet')) return 'private-subnet';
  if (lower.includes('data subnet') || lower.includes('database subnet')) return 'data-subnet';
  if (lower.includes('security group') || lower.includes('security-group')) return 'security-group';
  if (lower.includes('auto scaling') || lower.includes('asg')) return 'auto-scaling-group';
  if (lower.includes('serverless')) return 'serverless';
  if (lower.includes('datacenter') || lower.includes('on-prem')) return 'corporate-datacenter';
  if (lower.includes('vpc')) return 'vpc';
  if (lower.includes('region')) return 'region';
  if (lower.includes('aws') || lower.includes('cloud')) return 'aws-cloud';
  return 'vpc';
}

/**
 * Match a Mermaid node token or label to a catalog AWSService or External Actor
 */
function matchServiceOrActor(
  rawId: string,
  label: string,
  allServices: AWSService[]
): {
  type: 'service' | 'actor' | 'annotation';
  service?: AWSService;
  actorType?: ExternalActorType;
  resolvedLabel: string;
} {
  const cleanId = rawId.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanLabel = label.toLowerCase();

  // 1. Check if it's an external actor
  for (const [key, actorType] of Object.entries(ACTOR_MAP)) {
    if (cleanId.includes(key) || cleanLabel.includes(key)) {
      return {
        type: 'actor',
        actorType,
        resolvedLabel: label || 'External Client',
      };
    }
  }

  // 2. Direct exact or shorthand token match in TOKEN_TO_SERVICE_ID
  const shorthandMatchId = TOKEN_TO_SERVICE_ID[cleanId];
  if (shorthandMatchId) {
    const found = allServices.find((s) => s.id === shorthandMatchId);
    if (found) {
      return {
        type: 'service',
        service: found,
        resolvedLabel: label || found.name,
      };
    }
  }

  // 3. Search in allServices by exact ID match
  const exactService = allServices.find((s) => s.id.toLowerCase() === cleanId);
  if (exactService) {
    return {
      type: 'service',
      service: exactService,
      resolvedLabel: label || exactService.name,
    };
  }

  // 4. Search by service name substring in label or rawId
  const nameService = allServices.find((s) => {
    const sName = s.name.toLowerCase();
    const sId = s.id.toLowerCase();
    return (
      cleanLabel.includes(sName) ||
      cleanLabel.includes(sId) ||
      sName.includes(cleanLabel) ||
      cleanId.includes(sId)
    );
  });
  if (nameService) {
    return {
      type: 'service',
      service: nameService,
      resolvedLabel: label || nameService.name,
    };
  }

  // 5. Fallback: If label mentions database/storage/compute keywords
  if (cleanLabel.includes('db') || cleanLabel.includes('database') || cleanLabel.includes('sql')) {
    const rds = allServices.find((s) => s.id === 'rds' || s.id === 'dynamodb');
    if (rds) return { type: 'service', service: rds, resolvedLabel: label || rds.name };
  }

  if (cleanLabel.includes('bucket') || cleanLabel.includes('storage')) {
    const s3 = allServices.find((s) => s.id === 's3');
    if (s3) return { type: 'service', service: s3, resolvedLabel: label || s3.name };
  }

  // Generic annotation fallback
  return {
    type: 'annotation',
    resolvedLabel: label || rawId,
  };
}

/**
 * Infer EdgeProtocol from the edge connection syntax and label
 */
function inferProtocol(operator: string, label?: string): EdgeProtocol {
  if (!label) {
    if (operator === '-.->') return 'Event Trigger';
    return 'HTTPS/REST';
  }

  const l = label.toLowerCase();
  if (l.includes('iam') || l.includes('role') || l.includes('sigv4') || l.includes('assume') || l.includes('oac')) {
    return 'IAM Role Assumption';
  }
  if (l.includes('privatelink') || l.includes('vpc') || l.includes('peering') || l.includes('transit')) {
    return 'VPC PrivateLink';
  }
  if (l.includes('event') || l.includes('trigger') || l.includes('notify') || l.includes('pub/sub') || l.includes('publish') || l.includes('poll')) {
    return 'Event Trigger';
  }
  if (l.includes('sql') || l.includes('query') || l.includes('tcp') || l.includes('port') || l.includes('postgres') || l.includes('mysql') || l.includes('jdbc')) {
    return 'SQL/TCP';
  }
  if (l.includes('grpc')) {
    return 'gRPC';
  }
  if (l.includes('ws') || l.includes('websocket')) {
    return 'WebSocket';
  }
  return 'HTTPS/REST';
}

/**
 * Clean edge labels like "1. HTTPS:443" -> "HTTPS:443"
 */
function cleanEdgeLabel(rawLabel?: string): string {
  if (!rawLabel) return 'HTTPS/REST';
  return rawLabel.replace(/^\d+[\.\)]\s*/, '').trim();
}

export interface ParsedDiagramResult {
  nodes: CanvasNodeItem[];
  edges: CanvasEdgeItem[];
  title?: string;
}

/**
 * Parses a Mermaid flowchart string into native AWS Compass CanvasNodeItem and CanvasEdgeItem
 * instances with deterministic Dagre auto-layout applied.
 */
export function parseMermaidToCanvas(
  chart: string,
  currentService?: AWSService,
  allServices: AWSService[] = []
): ParsedDiagramResult {
  const effectiveServices = allServices.length > 0 ? allServices : currentService ? [currentService] : [];
  const lines = chart
    .replace(/^```mermaid/i, '')
    .replace(/^```/i, '')
    .replace(/```$/i, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const rawNodeMap = new Map<
    string,
    {
      id: string;
      label: string;
      subgraphId?: string;
      shape: 'box' | 'cylinder' | 'stadium' | 'circle' | 'round';
    }
  >();

  interface RawSubgraph {
    id: string;
    label: string;
    boundaryType: GroupBoundaryType;
  }

  const subgraphs: RawSubgraph[] = [];
  let currentSubgraph: RawSubgraph | null = null;

  interface RawEdge {
    source: string;
    target: string;
    operator: string;
    label?: string;
  }

  const rawEdges: RawEdge[] = [];

  // Regex patterns for Mermaid node declarations
  // e.g. NodeId[(Label)] -> cylinder
  const cylinderRegex = /^([a-zA-Z0-9_-]+)\[\((.*?)\)\]/;
  // e.g. NodeId([Label]) -> stadium (actor)
  const stadiumRegex = /^([a-zA-Z0-9_-]+)\(\[(.*?)\]\)/;
  // e.g. NodeId["Label"] or NodeId[Label] -> box
  const boxRegex = /^([a-zA-Z0-9_-]+)\[["']?(.*?)["']?\]/;
  // e.g. NodeId((Label)) -> circle
  const circleRegex = /^([a-zA-Z0-9_-]+)\(\((.*?)\)\)/;
  // e.g. NodeId(Label) -> rounded
  const roundedRegex = /^([a-zA-Z0-9_-]+)\((.*?)\)/;

  // Regex for connection line
  // e.g. A -->|Label| B or A -.-> B or A <-->|Label| B
  const edgeRegex = /([a-zA-Z0-9_-]+(?:\(.*?\)|\[.*?\])?)\s*(-->|-\.->|<-->|--o|--x|---|==>)\s*(?:\|(.*?)\|)?\s*([a-zA-Z0-9_-]+(?:\(.*?\)|\[.*?\])?)/;

  for (const line of lines) {
    if (line.startsWith('%%') || line.startsWith('graph') || line.startsWith('flowchart')) {
      continue;
    }

    // Subgraph Start
    const subgraphMatch = line.match(/^subgraph\s+([a-zA-Z0-9_-]+)(?:\s*\[["']?(.*?)["']?\])?/i);
    if (subgraphMatch) {
      const subId = subgraphMatch[1];
      const subLabel = subgraphMatch[2] || subId;
      const boundaryType = resolveBoundaryType(subLabel || subId);
      currentSubgraph = {
        id: subId,
        label: subLabel,
        boundaryType,
      };
      subgraphs.push(currentSubgraph);
      continue;
    }

    // Subgraph End
    if (line === 'end') {
      currentSubgraph = null;
      continue;
    }

    // Edge check
    const edgeMatch = line.match(edgeRegex);
    if (edgeMatch) {
      const rawSrc = edgeMatch[1];
      const operator = edgeMatch[2];
      const edgeLabel = edgeMatch[3];
      const rawTgt = edgeMatch[4];

      // Extract node IDs and optional embedded labels
      const extractNodeFromToken = (token: string) => {
        let m = token.match(cylinderRegex);
        if (m) {
          rawNodeMap.set(m[1], {
            id: m[1],
            label: m[2],
            shape: 'cylinder',
            subgraphId: currentSubgraph?.id,
          });
          return m[1];
        }
        m = token.match(stadiumRegex);
        if (m) {
          rawNodeMap.set(m[1], {
            id: m[1],
            label: m[2],
            shape: 'stadium',
            subgraphId: currentSubgraph?.id,
          });
          return m[1];
        }
        m = token.match(boxRegex);
        if (m) {
          rawNodeMap.set(m[1], {
            id: m[1],
            label: m[2],
            shape: 'box',
            subgraphId: currentSubgraph?.id,
          });
          return m[1];
        }
        m = token.match(circleRegex);
        if (m) {
          rawNodeMap.set(m[1], {
            id: m[1],
            label: m[2],
            shape: 'circle',
            subgraphId: currentSubgraph?.id,
          });
          return m[1];
        }
        m = token.match(roundedRegex);
        if (m) {
          rawNodeMap.set(m[1], {
            id: m[1],
            label: m[2],
            shape: 'round',
            subgraphId: currentSubgraph?.id,
          });
          return m[1];
        }
        // Bare identifier
        const bareId = token.trim();
        if (bareId && !rawNodeMap.has(bareId)) {
          rawNodeMap.set(bareId, {
            id: bareId,
            label: bareId,
            shape: 'box',
            subgraphId: currentSubgraph?.id,
          });
        }
        return bareId;
      };

      const srcId = extractNodeFromToken(rawSrc);
      const tgtId = extractNodeFromToken(rawTgt);

      if (srcId && tgtId) {
        rawEdges.push({
          source: srcId,
          target: tgtId,
          operator,
          label: edgeLabel,
        });
      }
      continue;
    }

    // Standalone node declaration
    let m = line.match(cylinderRegex);
    if (m) {
      rawNodeMap.set(m[1], {
        id: m[1],
        label: m[2],
        shape: 'cylinder',
        subgraphId: currentSubgraph?.id,
      });
      continue;
    }
    m = line.match(stadiumRegex);
    if (m) {
      rawNodeMap.set(m[1], {
        id: m[1],
        label: m[2],
        shape: 'stadium',
        subgraphId: currentSubgraph?.id,
      });
      continue;
    }
    m = line.match(boxRegex);
    if (m) {
      rawNodeMap.set(m[1], {
        id: m[1],
        label: m[2],
        shape: 'box',
        subgraphId: currentSubgraph?.id,
      });
      continue;
    }
    m = line.match(circleRegex);
    if (m) {
      rawNodeMap.set(m[1], {
        id: m[1],
        label: m[2],
        shape: 'circle',
        subgraphId: currentSubgraph?.id,
      });
      continue;
    }
    m = line.match(roundedRegex);
    if (m) {
      rawNodeMap.set(m[1], {
        id: m[1],
        label: m[2],
        shape: 'round',
        subgraphId: currentSubgraph?.id,
      });
      continue;
    }

    // Standalone bare node inside subgraph
    const bareIdentifier = line.match(/^([a-zA-Z0-9_-]+)$/);
    if (bareIdentifier && !rawNodeMap.has(bareIdentifier[1])) {
      rawNodeMap.set(bareIdentifier[1], {
        id: bareIdentifier[1],
        label: bareIdentifier[1],
        shape: 'box',
        subgraphId: currentSubgraph?.id,
      });
    }
  }

  // Map subgraphs to GroupBoundary nodes
  const boundaryNodes: CanvasNodeItem[] = subgraphs.map((sub, idx) => {
    const boundaryId = `group-${sub.boundaryType}-${idx}-${Date.now()}`;
    return {
      id: boundaryId,
      type: 'awsGroup',
      position: { x: 0, y: 0 },
      zIndex: -1,
      data: {
        serviceId: `bound-${sub.boundaryType}`,
        label: sub.label,
        category: 'Networking',
        tier: 1,
        isBoundary: true,
        boundaryType: sub.boundaryType,
        boundaryLabel: sub.label,
        width: 440,
        height: 280,
        cidr: sub.boundaryType === 'vpc' ? '10.0.0.0/16' : sub.boundaryType.includes('subnet') ? '10.0.1.0/24' : undefined,
      },
    };
  });

  // Map raw nodes to CanvasNodeItem
  const nodeIdMapping = new Map<string, string>();
  const serviceNodes: CanvasNodeItem[] = [];

  let nodeIndex = 0;
  for (const rawNode of rawNodeMap.values()) {
    nodeIndex++;
    const match = matchServiceOrActor(rawNode.id, rawNode.label, effectiveServices);
    const parentBoundary = boundaryNodes.find((b) => {
      const sub = subgraphs.find((s) => s.id === rawNode.subgraphId);
      return sub && b.data?.boundaryLabel === sub.label;
    });

    const canvasNodeId = `node-${rawNode.id}-${nodeIndex}-${Date.now()}`;
    nodeIdMapping.set(rawNode.id, canvasNodeId);

    if (match.type === 'actor') {
      serviceNodes.push({
        id: canvasNodeId,
        type: 'externalActor',
        position: { x: nodeIndex * 180, y: 150 },
        parentId: parentBoundary?.id,
        extent: parentBoundary ? ('parent' as const) : undefined,
        data: {
          serviceId: `actor-${match.actorType || 'user-browser'}`,
          label: match.resolvedLabel,
          category: 'Networking',
          tier: 1,
          isExternalActor: true,
          actorType: match.actorType || 'user-browser',
          customTitle: match.resolvedLabel,
          roleSubtitle: 'Client / External Origin',
          env: 'Prod',
        },
      });
    } else if (match.type === 'service' && match.service) {
      serviceNodes.push({
        id: canvasNodeId,
        type: 'awsService',
        position: { x: nodeIndex * 180, y: 150 },
        parentId: parentBoundary?.id,
        extent: parentBoundary ? ('parent' as const) : undefined,
        data: {
          serviceId: match.service.id,
          label: match.service.name,
          category: match.service.category,
          tier: match.service.tier,
          isFavorite: match.service.isFavorite,
          customNotes: match.service.summary,
          arnPattern: match.service.arnExample,
          customTitle: match.resolvedLabel || match.service.name,
          roleSubtitle: match.service.summary,
          env: 'Prod',
        },
      });
    } else {
      // Annotation or generic node fallback
      serviceNodes.push({
        id: canvasNodeId,
        type: 'annotation',
        position: { x: nodeIndex * 180, y: 150 },
        parentId: parentBoundary?.id,
        extent: parentBoundary ? ('parent' as const) : undefined,
        data: {
          serviceId: `annot-${rawNode.id}`,
          label: match.resolvedLabel,
          category: 'Compute',
          tier: 1,
          isAnnotation: true,
          annotationTitle: match.resolvedLabel,
          customTitle: match.resolvedLabel,
        },
      });
    }
  }

  // Construct edges
  const edges: CanvasEdgeItem[] = [];
  rawEdges.forEach((re, idx) => {
    const srcId = nodeIdMapping.get(re.source);
    const tgtId = nodeIdMapping.get(re.target);
    if (!srcId || !tgtId) return;

    const protocol = inferProtocol(re.operator, re.label);
    const label = cleanEdgeLabel(re.label);
    const isBidirectional = re.operator === '<-->';

    edges.push({
      id: `edge-${srcId}-${tgtId}-${idx}-${Date.now()}`,
      source: srcId,
      target: tgtId,
      sourceHandle: 'right',
      targetHandle: 'left',
      protocol,
      label,
      animated: true,
      data: {
        protocol,
        label,
        customLabel: label,
        lineStyle: re.operator.includes('-.-') ? 'dashed' : 'solid',
        directionality: isBidirectional ? 'bi-directional' : 'one-way',
        animated: true,
      },
    });
  });

  const allInitialNodes = [...boundaryNodes, ...serviceNodes];

  // Run Dagre deterministic auto-layout
  const layouted = getLayoutedElements(allInitialNodes, edges, 'LR');

  return {
    nodes: layouted.nodes,
    edges: layouted.edges,
    title: currentService ? `${currentService.name} Flow` : 'Architecture Flow',
  };
}

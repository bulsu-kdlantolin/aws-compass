/**
 * AWS Compass - Core Type Definitions
 * Strictly typed interfaces for AWS services, canvas nodes, and diagramming.
 */

export type AWSCategory =
  | 'Compute'
  | 'Storage'
  | 'Database'
  | 'Networking'
  | 'Security/IAM'
  | 'Serverless';

export type ServiceTier = 1 | 2 | 3;

export type StudyStatus = 'not-started' | 'in-progress' | 'mastered' | 'review';

export type EdgeProtocol =
  | 'HTTPS/REST'
  | 'IAM Role Assumption'
  | 'Event Trigger'
  | 'VPC PrivateLink'
  | 'SQL/TCP'
  | 'gRPC'
  | 'WebSocket';

export interface AWSService {
  id: string;
  name: string;
  category: AWSCategory;
  tier: ServiceTier;
  studyStatus: StudyStatus;
  summary: string;
  markdownDoc: string;
  icon?: string;
  color?: string;
  arnExample?: string;
  docsUrl?: string;
  order?: number;
  updatedAt: number;
}

export type GroupBoundaryType =
  | 'aws-cloud'
  | 'region'
  | 'vpc'
  | 'public-subnet'
  | 'private-subnet'
  | 'data-subnet'
  | 'security-group'
  | 'auto-scaling-group'
  | 'serverless'
  | 'corporate-datacenter';

export type ExternalActorType =
  | 'user-browser'
  | 'mobile-client'
  | 'corporate-datacenter'
  | 'external-webhook';

export type NodeEnvironment = 'None' | 'Prod' | 'Staging' | 'Dev';

export interface CanvasNodeData {
  serviceId: string;
  label: string;
  category: AWSCategory;
  tier: ServiceTier;
  status: StudyStatus;
  customNotes?: string;
  arnPattern?: string;

  // Custom sandbox properties for service nodes
  customTitle?: string;
  roleSubtitle?: string;
  env?: NodeEnvironment;
  az?: string;
  metadataPill?: string;

  // Group boundary properties
  isBoundary?: boolean;
  boundaryType?: GroupBoundaryType;
  boundaryLabel?: string;
  cidr?: string;
  accentColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  width?: number;
  height?: number;

  // External Actor properties
  isActor?: boolean;
  actorType?: ExternalActorType;

  // Annotation / Sticky Note properties
  isAnnotation?: boolean;
  annotationTitle?: string;
  annotationContent?: string;
  annotationColor?: string;

  [key: string]: unknown;
}

export interface CanvasNodePosition {
  x: number;
  y: number;
}

export interface CanvasNodeItem {
  id: string;
  type: string;
  position: CanvasNodePosition;
  data: CanvasNodeData;
  style?: Record<string, string | number>;
  zIndex?: number;
  parentId?: string;
}

export type EdgeLineStyle = 'solid' | 'dashed' | 'dotted';
export type EdgeDirectionality = 'one-way' | 'bi-directional' | 'none';

export interface CanvasEdgeData {
  protocol?: EdgeProtocol;
  label?: string;
  customLabel?: string;
  lineStyle?: EdgeLineStyle;
  directionality?: EdgeDirectionality;
  edgeColor?: string;
  animated?: boolean;
  offset?: number;
  [key: string]: unknown;
}

export interface CanvasEdgeItem {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
  protocol?: EdgeProtocol;
  animated?: boolean;
  style?: Record<string, string | number>;
  data?: CanvasEdgeData;
}

export interface Diagram {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNodeItem[];
  edges: CanvasEdgeItem[];
  createdAt: number;
  updatedAt: number;
}

export interface ServiceFilterState {
  search: string;
  category: AWSCategory | 'All';
  tier: ServiceTier | 'All';
  studyStatus: StudyStatus | 'All';
}

export type WorkspaceMode = 'vault' | 'canvas';

export type ThemeMode = 'dark' | 'light';

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
  | 'serverless';

export interface CanvasNodeData {
  serviceId: string;
  label: string;
  category: AWSCategory;
  tier: ServiceTier;
  status: StudyStatus;
  customNotes?: string;
  arnPattern?: string;
  isBoundary?: boolean;
  boundaryType?: GroupBoundaryType;
  boundaryLabel?: string;
  width?: number;
  height?: number;
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

export interface CanvasEdgeData {
  protocol?: EdgeProtocol;
  label?: string;
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

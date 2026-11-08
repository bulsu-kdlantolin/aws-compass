/**
 * AWS Compass - Core Type Definitions
 * Strictly typed interfaces for AWS services, canvas nodes, and diagramming.
 */

export type CanonicalAWSCategory =
  | 'Compute'
  | 'Containers'
  | 'Serverless'
  | 'Storage'
  | 'Database'
  | 'Networking & Content Delivery'
  | 'Security, Identity & Compliance'
  | 'Application Integration'
  | 'Analytics'
  | 'Machine Learning & AI'
  | 'Management & Governance'
  | 'Developer Tools'
  | 'Migration & Transfer'
  | 'Front-End Web & Mobile'
  | 'Internet of Things (IoT)'
  | 'Cloud Financial Management';

export type AWSCategory =
  | CanonicalAWSCategory
  | 'Networking'
  | 'Security/IAM'
  | 'Security & IAM';

export type ServiceTier = 1 | 2 | 3;

export type EdgeProtocol =
  | 'HTTPS/REST'
  | 'IAM Role Assumption'
  | 'Event Trigger'
  | 'VPC PrivateLink'
  | 'SQL/TCP'
  | 'gRPC'
  | 'WebSocket'
  | 'MQTT';

export interface AWSCatalogEntry {
  id: string;
  name: string;
  shortName: string;
  category: AWSCategory;
  tier: ServiceTier;
  cliPrefix: string;
  arnPattern: string;
  summary: string;
  primitives: Array<{ name: string; detail: string }>;
  flow: {
    upstream: string[];
    downstream: string[];
    edgeProtocol: EdgeProtocol;
    subgraphLabel: string;
  };
  gotchas: string[];
  cliCommands: Array<{ description: string; command: string }>;
  docsUrl?: string;
}

export interface AWSService {
  id: string;
  name: string;
  shortName?: string;
  category: AWSCategory;
  tier: ServiceTier;
  isFavorite: boolean;
  summary: string;
  markdownDoc: string;
  icon?: string;
  color?: string;
  arnExample?: string;
  docsUrl?: string;
  cliPrefix?: string;
  order?: number;
  updatedAt: number;
}

export type GroupBoundaryType =
  | 'aws-organization'
  | 'aws-account'
  | 'region'
  | 'availability-zone'
  | 'vpc'
  | 'public-subnet'
  | 'private-subnet'
  | 'data-subnet'
  | 'security-group'
  | 'auto-scaling-group'
  | 'serverless'
  | 'corporate-datacenter'
  | 'aws-cloud';

export type ExternalActorType =
  | 'user-browser'
  | 'mobile-client'
  | 'corporate-datacenter'
  | 'branch-office'
  | 'third-party-api'
  | 'external-webhook'
  | 'iam-admin'
  | 'cicd-pipeline'
  | 'idp-auth'
  | 'saas-webhook'
  | 'vpc-gateway-endpoint'
  | 'vpc-interface-endpoint'
  | 'route-table'
  | 'network-acl'
  | 'customer-gateway';

export type StepBadgeType = 'flow-step' | 'tls-badge' | 'risk-pin';
export type StepBadgeColor = 'orange' | 'blue' | 'green' | 'crimson';

export type NodeEnvironment = 'None' | 'Prod' | 'Staging' | 'Dev';

export interface CanvasNodeData {
  serviceId: string;
  label: string;
  category: AWSCategory;
  tier: ServiceTier;
  isFavorite?: boolean;
  customNotes?: string;
  arnPattern?: string;

  // Custom sandbox properties for service nodes
  customTitle?: string;
  roleSubtitle?: string;
  env?: NodeEnvironment;
  az?: string;
  metadataPill?: string;
  capacityTier?: 'S' | 'M' | 'L' | 'Free';

  // Group boundary properties
  isBoundary?: boolean;
  boundaryType?: GroupBoundaryType;
  boundaryLabel?: string;
  cidr?: string;
  accountId?: string;
  azName?: string;
  asgMin?: number;
  asgDesired?: number;
  asgMax?: number;
  securityGroupPorts?: string;
  accentColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  width?: number;
  height?: number;

  // External Actor & Network Primitive properties
  isActor?: boolean;
  actorType?: ExternalActorType;

  // Flow Step Marker & Risk Pin properties
  isStepBadge?: boolean;
  stepType?: StepBadgeType;
  stepNumber?: number;
  stepColor?: StepBadgeColor;
  stepCaption?: string;

  // Annotation / Sticky Note, Spec Stamp & Text Block properties
  isAnnotation?: boolean;
  isTextOnly?: boolean;
  isSpecStamp?: boolean;
  fontSize?: number;
  annotationTitle?: string;
  annotationContent?: string;
  annotationColor?: string;

  // SLA & DR Spec Stamp properties
  specSystemName?: string;
  specRevision?: string;
  specTargetSla?: string;
  specRpoRto?: string;
  specCompliance?: string;
  specClassification?: string;

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
  extent?: 'parent' | [[number, number], [number, number]];
  selected?: boolean;
}

export type EdgeLineStyle = 'solid' | 'dashed' | 'dotted';
export type EdgeDirectionality = 'one-way' | 'bi-directional' | 'none';
export type EdgeRoutingStyle = 'smoothstep' | 'bezier' | 'straight';

export interface CanvasEdgeData {
  protocol?: EdgeProtocol;
  label?: string;
  customLabel?: string;
  lineStyle?: EdgeLineStyle;
  directionality?: EdgeDirectionality;
  routingStyle?: EdgeRoutingStyle;
  edgeColor?: string;
  strokeWidth?: number;
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
  selected?: boolean;
  style?: Record<string, string | number>;
  data?: CanvasEdgeData;
}

export interface Diagram {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNodeItem[];
  edges: CanvasEdgeItem[];
  thumbnail?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ServiceFilterState {
  search: string;
  category: AWSCategory | 'All';
  tier: ServiceTier | 'All';
  favoritesOnly: boolean;
}

export type WorkspaceMode = 'vault' | 'canvas';

export type ThemeMode = 'dark' | 'light';

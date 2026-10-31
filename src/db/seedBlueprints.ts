import type { CanvasEdgeItem, CanvasNodeItem, EdgeProtocol, GroupBoundaryType } from '../types/aws';
import { SEED_SERVICES } from './seedServices';
import { getLayoutedElements } from '../utils/canvasAutoLayout';

export interface ArchitectureBlueprint {
  id: string;
  name: string;
  category: string;
  description: string;
  flowDirection: 'LR' | 'TB';
  nodes: CanvasNodeItem[];
  edges: CanvasEdgeItem[];
}

/**
 * Resolves standard AWS service data or creates an architectural placeholder
 */
function resolveServiceData(serviceId: string, customNotes?: string) {
  const svc = SEED_SERVICES.find((s) => s.id === serviceId);
  if (svc) {
    return {
      serviceId: svc.id,
      label: svc.name,
      category: svc.category,
      tier: svc.tier,
      isFavorite: svc.isFavorite,
      customNotes: customNotes || svc.summary,
      arnPattern: svc.arnExample,
    };
  }

  // Fallbacks for dedicated infrastructure components
  const fallbacks: Record<string, { label: string; category: string; tier: number; arn: string }> = {
    igw: {
      label: 'Internet Gateway (IGW)',
      category: 'Networking',
      tier: 1,
      arn: 'arn:aws:ec2:*:*:internet-gateway/igw-*',
    },
    ecr: {
      label: 'Amazon ECR (Container Registry)',
      category: 'Compute',
      tier: 2,
      arn: 'arn:aws:ecr:*:*:repository/*',
    },
    cloudwatch: {
      label: 'Amazon CloudWatch (Logs & Metrics)',
      category: 'Compute',
      tier: 1,
      arn: 'arn:aws:logs:*:*:log-group:*',
    },
    autoscaling: {
      label: 'EC2 Auto Scaling Group',
      category: 'Compute',
      tier: 1,
      arn: 'arn:aws:autoscaling:*:*:autoScalingGroup:*',
    },
  };

  const fb = fallbacks[serviceId] || {
    label: serviceId.toUpperCase(),
    category: 'Networking',
    tier: 1,
    arn: `arn:aws:${serviceId}:*:*`,
  };

  return {
    serviceId,
    label: fb.label,
    category: fb.category as any,
    tier: fb.tier as any,
    isFavorite: false,
    customNotes: customNotes || fb.label,
    arnPattern: fb.arn,
  };
}

/**
 * Creates a resizable boundary container node
 */
function createBoundaryNode(
  id: string,
  type: GroupBoundaryType,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number,
  parentId?: string
): CanvasNodeItem {
  return {
    id,
    type: 'awsGroup',
    position: { x, y },
    zIndex: -1,
    parentId,
    style: { width, height },
    data: {
      serviceId: id,
      label,
      category: 'Networking',
      tier: 1,
      isBoundary: true,
      boundaryType: type,
      boundaryLabel: label,
      width,
      height,
    },
  };
}

const RAW_BLUEPRINTS: Record<string, ArchitectureBlueprint> = {
  // =========================================================================
  // 1. Serverless Microservice
  // Route 53 -> CloudFront -> S3 + API Gateway -> Lambda -> DynamoDB
  // =========================================================================
  'serverless-microservice': {
    id: 'serverless-microservice',
    name: 'Serverless Microservice',
    category: 'Serverless',
    description:
      'High-throughput, globally distributed serverless architecture combining Route 53, CloudFront edge caching, S3 static assets, API Gateway, Lambda, and DynamoDB.',
    flowDirection: 'LR',
    nodes: [
      // Outer Boundary
      createBoundaryNode(
        'bound-srv-cloud',
        'aws-cloud',
        'Serverless Microservice (AWS Cloud)',
        20,
        20,
        1180,
        480
      ),
      createBoundaryNode(
        'bound-srv-stack',
        'serverless',
        'Serverless Microservice (Stack)',
        220,
        60,
        920,
        380,
        'bound-srv-cloud'
      ),

      // Nodes
      {
        id: 'node-r53',
        type: 'awsService',
        parentId: 'bound-srv-cloud',
        position: { x: 40, y: 160 },
        data: resolveServiceData('route53', 'Global latency-based Anycast DNS routing'),
      },
      {
        id: 'node-cf',
        type: 'awsService',
        parentId: 'bound-srv-stack',
        position: { x: 50, y: 140 },
        data: resolveServiceData('cloudfront', 'CloudFront edge distribution with TLS 1.3 termination'),
      },
      {
        id: 'node-s3',
        type: 'awsService',
        parentId: 'bound-srv-stack',
        position: { x: 260, y: 65 },
        data: resolveServiceData('s3', 'Private S3 origin for SPA frontend via Origin Access Control (OAC)'),
      },
      {
        id: 'node-apigw',
        type: 'awsService',
        parentId: 'bound-srv-stack',
        position: { x: 260, y: 225 },
        data: resolveServiceData('api-gateway', 'Amazon API Gateway HTTP API with JWT authorizer and rate throttling'),
      },
      {
        id: 'node-lambda',
        type: 'awsService',
        parentId: 'bound-srv-stack',
        position: { x: 490, y: 225 },
        data: resolveServiceData('lambda', 'Python 3.12 / Node 20 ARM64 Graviton3 Lambda microservice handler'),
      },
      {
        id: 'node-ddb',
        type: 'awsService',
        parentId: 'bound-srv-stack',
        position: { x: 720, y: 225 },
        data: resolveServiceData('dynamodb', 'On-Demand DynamoDB table with sub-10ms single-digit read/write latency'),
      },
    ],
    edges: [
      {
        id: 'e-r53-cf',
        source: 'node-r53',
        target: 'node-cf',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'HTTPS/REST' as EdgeProtocol,
        label: 'HTTPS/REST',
        animated: true,
      },
      {
        id: 'e-cf-s3',
        source: 'node-cf',
        target: 'node-s3',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'HTTPS/REST' as EdgeProtocol,
        label: 'HTTPS/REST',
        data: { offset: 36 },
      },
      {
        id: 'e-cf-apigw',
        source: 'node-cf',
        target: 'node-apigw',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'HTTPS/REST' as EdgeProtocol,
        label: 'HTTPS/REST',
        animated: true,
        data: { offset: 16 },
      },
      {
        id: 'e-apigw-lambda',
        source: 'node-apigw',
        target: 'node-lambda',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'Event Trigger' as EdgeProtocol,
        label: 'Event Trigger',
        animated: true,
      },
      {
        id: 'e-lambda-ddb',
        source: 'node-lambda',
        target: 'node-ddb',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'HTTPS/REST' as EdgeProtocol,
        label: 'HTTPS/REST',
        animated: true,
      },
    ],
  },

  // =========================================================================
  // 2. 3-Tier VPC Web App
  // IGW -> ALB -> EC2 Auto Scaling -> RDS Multi-AZ
  // =========================================================================
  '3-tier-vpc': {
    id: '3-tier-vpc',
    name: '3-Tier VPC Web App',
    category: 'Networking',
    description:
      'Production-grade High Availability 3-tier architecture with an Internet Gateway, Public ALB, Private Auto Scaling EC2 tier, and Multi-AZ RDS MySQL/PostgreSQL tier.',
    flowDirection: 'LR',
    nodes: [
      // Outer VPC Boundary
      createBoundaryNode(
        'bound-vpc-outer',
        'vpc',
        '3-Tier VPC Web App (10.0.0.0/16)',
        20,
        20,
        1220,
        480
      ),

      // Tier 1: Public Subnet
      createBoundaryNode(
        'bound-sub-pub',
        'public-subnet',
        'Tier 1: Public ingress subnet · 10.0.1.0/24',
        200,
        60,
        300,
        380,
        'bound-vpc-outer'
      ),

      // Tier 2: App Private Subnet
      createBoundaryNode(
        'bound-sub-app',
        'private-subnet',
        'Tier 2: Application private subnet · 10.0.2.0/24',
        530,
        60,
        300,
        380,
        'bound-vpc-outer'
      ),

      // Tier 3: Database Private Subnet
      createBoundaryNode(
        'bound-sub-data',
        'private-subnet',
        'Tier 3: Database isolated subnet · 10.0.3.0/24',
        860,
        60,
        320,
        380,
        'bound-vpc-outer'
      ),

      // Nodes
      {
        id: 'node-igw',
        type: 'awsService',
        parentId: 'bound-vpc-outer',
        position: { x: 40, y: 160 },
        data: resolveServiceData('igw', 'Internet Gateway attached to VPC route table 0.0.0.0/0'),
      },
      {
        id: 'node-alb',
        type: 'awsService',
        parentId: 'bound-sub-pub',
        position: { x: 80, y: 100 },
        data: resolveServiceData('alb', 'Dual-stack Application Load Balancer with TLS cert from ACM'),
      },
      {
        id: 'node-ec2-asg',
        type: 'awsService',
        parentId: 'bound-sub-app',
        position: { x: 80, y: 100 },
        data: resolveServiceData('ec2', 'EC2 Auto Scaling Group (m6i.large) across 2 Availability Zones'),
      },
      {
        id: 'node-rds-primary',
        type: 'awsService',
        parentId: 'bound-sub-data',
        position: { x: 90, y: 70 },
        data: resolveServiceData('rds', 'Amazon RDS PostgreSQL Multi-AZ Primary instance (db.r6g.xlarge)'),
      },
      {
        id: 'node-rds-standby',
        type: 'awsService',
        parentId: 'bound-sub-data',
        position: { x: 90, y: 225 },
        data: resolveServiceData('aurora', 'Synchronous Standby replica with automated failover in secondary AZ'),
      },
    ],
    edges: [
      {
        id: 'e-igw-alb',
        source: 'node-igw',
        target: 'node-alb',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'HTTPS/REST' as EdgeProtocol,
        label: 'HTTPS/REST',
        animated: true,
      },
      {
        id: 'e-alb-ec2',
        source: 'node-alb',
        target: 'node-ec2-asg',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'HTTPS/REST' as EdgeProtocol,
        label: 'HTTPS/REST',
        animated: true,
      },
      {
        id: 'e-ec2-rds',
        source: 'node-ec2-asg',
        target: 'node-rds-primary',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'SQL/TCP' as EdgeProtocol,
        label: 'SQL/TCP (5432)',
      },
      {
        id: 'e-rds-sync',
        source: 'node-rds-primary',
        target: 'node-rds-standby',
        sourceHandle: 'bottom',
        targetHandle: 'top',
        protocol: 'SQL/TCP' as EdgeProtocol,
        label: 'Sync Replication',
      },
    ],
  },

  // =========================================================================
  // 3. Event-Driven Decoupled Pipeline
  // S3 Event -> SNS -> SQS -> Lambda
  // =========================================================================
  'event-driven-pipeline': {
    id: 'event-driven-pipeline',
    name: 'Event-Driven Decoupled Pipeline',
    category: 'Serverless',
    description:
      'Resilient asynchronous ingestion pipeline: S3 file upload generates event to SNS topic, fanning out into SQS dead-lettered buffer and processed concurrently by Lambda workers.',
    flowDirection: 'LR',
    nodes: [
      createBoundaryNode(
        'bound-event-pipeline',
        'serverless',
        'Event-Driven Pipeline (Decoupled)',
        20,
        20,
        1460,
        480
      ),

      {
        id: 'node-s3-ingest',
        type: 'awsService',
        parentId: 'bound-event-pipeline',
        position: { x: 60, y: 190 },
        data: resolveServiceData('s3', 'Ingestion bucket emitting s3:ObjectCreated:* events'),
      },
      {
        id: 'node-sns-fanout',
        type: 'awsService',
        parentId: 'bound-event-pipeline',
        position: { x: 380, y: 190 },
        data: resolveServiceData('sns', 'Amazon SNS standard topic with fan-out subscription filtering'),
      },
      {
        id: 'node-sqs-orders',
        type: 'awsService',
        parentId: 'bound-event-pipeline',
        position: { x: 680, y: 120 },
        data: resolveServiceData('sqs', 'SQS orders processing queue with redrive Dead-Letter Queue (DLQ)'),
      },
      {
        id: 'node-sqs-analytics',
        type: 'awsService',
        parentId: 'bound-event-pipeline',
        position: { x: 680, y: 290 },
        data: resolveServiceData('sqs', 'SQS analytics queue for data lake streaming ingestion'),
      },
      {
        id: 'node-lambda-processor',
        type: 'awsService',
        parentId: 'bound-event-pipeline',
        position: { x: 960, y: 120 },
        data: resolveServiceData('lambda', 'Lambda batch worker processing up to 10 records per execution batch'),
      },
      {
        id: 'node-ddb-sink',
        type: 'awsService',
        parentId: 'bound-event-pipeline',
        position: { x: 1220, y: 120 },
        data: resolveServiceData('dynamodb', 'Processed events datastore with TTL item expiration enabled'),
      },
    ],
    edges: [
      {
        id: 'e-s3-sns',
        source: 'node-s3-ingest',
        target: 'node-sns-fanout',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'Event Trigger' as EdgeProtocol,
        label: 'Event Trigger',
        animated: true,
      },
      {
        id: 'e-sns-sqs-orders',
        source: 'node-sns-fanout',
        target: 'node-sqs-orders',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'Event Trigger' as EdgeProtocol,
        label: 'Event Trigger',
        animated: true,
        data: { offset: 36 },
      },
      {
        id: 'e-sns-sqs-analytics',
        source: 'node-sns-fanout',
        target: 'node-sqs-analytics',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'Event Trigger' as EdgeProtocol,
        label: 'Event Trigger',
        animated: true,
        data: { offset: 16 },
      },
      {
        id: 'e-sqs-lambda',
        source: 'node-sqs-orders',
        target: 'node-lambda-processor',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'Event Trigger' as EdgeProtocol,
        label: 'Event Trigger',
        animated: true,
      },
      {
        id: 'e-lambda-ddb-sink',
        source: 'node-lambda-processor',
        target: 'node-ddb-sink',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'HTTPS/REST' as EdgeProtocol,
        label: 'HTTPS/REST',
        animated: true,
      },
    ],
  },

  // =========================================================================
  // 4. Containerized Fargate Service
  // ALB -> ECS Fargate -> Amazon ECR + CloudWatch
  // =========================================================================
  'containerized-fargate': {
    id: 'containerized-fargate',
    name: 'Containerized Fargate Service',
    category: 'Compute',
    description:
      'Serverless containerized workload: Public ALB routes traffic to private AWS Fargate ECS tasks, pulling immutable container images from Amazon ECR and streaming telemetry to CloudWatch.',
    flowDirection: 'LR',
    nodes: [
      // VPC Boundary
      createBoundaryNode(
        'bound-fargate-vpc',
        'vpc',
        'Containerized Fargate (VPC 172.16.0.0/16)',
        20,
        20,
        1000,
        460
      ),

      // Public Subnet for ALB
      createBoundaryNode(
        'bound-alb-pub',
        'public-subnet',
        'Public load balancer subnet · 172.16.1.0/24',
        40,
        60,
        300,
        360,
        'bound-fargate-vpc'
      ),

      // Private Subnet for Fargate Tasks
      createBoundaryNode(
        'bound-fargate-priv',
        'private-subnet',
        'Private Fargate tasks subnet · 172.16.2.0/24',
        380,
        60,
        300,
        360,
        'bound-fargate-vpc'
      ),

      // Infrastructure / Services
      {
        id: 'node-fargate-alb',
        type: 'awsService',
        parentId: 'bound-alb-pub',
        position: { x: 80, y: 140 },
        data: resolveServiceData('alb', 'Public HTTPS Application Load Balancer with target health probes'),
      },
      {
        id: 'node-fargate-tasks',
        type: 'awsService',
        parentId: 'bound-fargate-priv',
        position: { x: 80, y: 140 },
        data: resolveServiceData('fargate', 'Serverless AWS Fargate tasks running containerized microservices'),
      },
      {
        id: 'node-fargate-ecr',
        type: 'awsService',
        parentId: 'bound-fargate-vpc',
        position: { x: 740, y: 90 },
        data: resolveServiceData('ecr', 'Amazon ECR private repository holding signed, vulnerability-scanned OCI images'),
      },
      {
        id: 'node-fargate-cw',
        type: 'awsService',
        parentId: 'bound-fargate-vpc',
        position: { x: 740, y: 245 },
        data: resolveServiceData('cloudwatch', 'Amazon CloudWatch Container Insights, metrics alarms, and centralized logs'),
      },
    ],
    edges: [
      {
        id: 'e-alb-fargate',
        source: 'node-fargate-alb',
        target: 'node-fargate-tasks',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'HTTPS/REST' as EdgeProtocol,
        label: 'HTTPS/REST (8080)',
        animated: true,
      },
      {
        id: 'e-fargate-ecr',
        source: 'node-fargate-tasks',
        target: 'node-fargate-ecr',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'VPC PrivateLink' as EdgeProtocol,
        label: 'VPC PrivateLink',
        data: { offset: 36 },
      },
      {
        id: 'e-fargate-cw',
        source: 'node-fargate-tasks',
        target: 'node-fargate-cw',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'IAM Role Assumption' as EdgeProtocol,
        label: 'IAM Role Assumption',
        animated: true,
        data: { offset: 16 },
      },
    ],
  },
};

/**
 * All reference blueprints are deterministically layouted through Dagre with 16px grid snapping,
 * dynamic boundary container bounds, and optimal directional handles.
 */
export const SEED_BLUEPRINTS: Record<string, ArchitectureBlueprint> = Object.entries(
  RAW_BLUEPRINTS
).reduce((acc, [key, bp]) => {
  const layouted = getLayoutedElements(bp.nodes, bp.edges, bp.flowDirection || 'LR');
  acc[key] = {
    ...bp,
    nodes: layouted.nodes,
    edges: layouted.edges,
  };
  return acc;
}, {} as Record<string, ArchitectureBlueprint>);

// Aliases for seamless canvas template compatibility
SEED_BLUEPRINTS['serverless-api'] = SEED_BLUEPRINTS['serverless-microservice'];
SEED_BLUEPRINTS['three-tier-web'] = SEED_BLUEPRINTS['3-tier-vpc'];
SEED_BLUEPRINTS['event-pipeline'] = SEED_BLUEPRINTS['event-driven-pipeline'];
SEED_BLUEPRINTS['container-fargate'] = SEED_BLUEPRINTS['containerized-fargate'];

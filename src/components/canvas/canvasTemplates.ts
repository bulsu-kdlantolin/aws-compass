import type { CanvasEdgeItem, CanvasNodeItem, EdgeProtocol, GroupBoundaryType } from '../../types/aws';
import { SEED_SERVICES } from '../../db/seedServices';

function getServiceData(serviceId: string, customNotes?: string) {
  const svc = SEED_SERVICES.find((s) => s.id === serviceId);
  if (!svc) {
    return {
      serviceId,
      label: serviceId.toUpperCase(),
      category: 'Compute' as const,
      tier: 1 as const,
      status: 'not-started' as const,
      customNotes,
      arnPattern: `arn:aws:${serviceId}:*`,
    };
  }
  return {
    serviceId: svc.id,
    label: svc.name,
    category: svc.category,
    tier: svc.tier,
    status: svc.studyStatus,
    customNotes: customNotes || svc.summary,
    arnPattern: svc.arnExample,
  };
}

function createBoundaryNode(
  id: string,
  type: GroupBoundaryType,
  label: string,
  x: number,
  y: number,
  width: number,
  height: number
): CanvasNodeItem {
  return {
    id,
    type: 'architectureGroup',
    position: { x, y },
    zIndex: -1,
    data: {
      serviceId: id,
      label,
      category: 'Networking',
      tier: 1,
      status: 'not-started',
      isBoundary: true,
      boundaryType: type,
      boundaryLabel: label,
      width,
      height,
    },
  };
}

export interface ArchitectureTemplate {
  id: string;
  name: string;
  description: string;
  flowDirection: 'LR' | 'TB';
  nodes: CanvasNodeItem[];
  edges: CanvasEdgeItem[];
}

export const ARCHITECTURE_TEMPLATES: Record<string, ArchitectureTemplate> = {
  // 1. Serverless Event-Driven API (Left-to-Right LR Flow)
  'serverless-api': {
    id: 'serverless-api',
    name: 'Serverless Event-Driven API',
    description: 'Enterprise event-driven REST architecture with CloudFront, API Gateway, Lambda, DynamoDB, SQS, and SNS.',
    flowDirection: 'LR',
    nodes: [
      // Outermost Boundary
      createBoundaryNode('bound-serverless', 'serverless', 'AWS SERVERLESS APPLICATION STACK · US-EAST-1', 20, 20, 1360, 460),

      // Service Nodes
      {
        id: 'node-cf',
        type: 'awsService',
        position: { x: 60, y: 160 },
        data: getServiceData('cloudfront', 'Global CDN Edge termination & OAC caching'),
      },
      {
        id: 'node-apigw',
        type: 'awsService',
        position: { x: 340, y: 160 },
        data: getServiceData('api-gateway', 'HTTP API endpoint with JWT authorizer'),
      },
      {
        id: 'node-lambda-api',
        type: 'awsService',
        position: { x: 620, y: 160 },
        data: getServiceData('lambda', 'Order validation & synchronous checkout handler'),
      },
      {
        id: 'node-ddb',
        type: 'awsService',
        position: { x: 920, y: 60 },
        data: getServiceData('dynamodb', 'Orders table (single-digit ms latency)'),
      },
      {
        id: 'node-sqs',
        type: 'awsService',
        position: { x: 920, y: 260 },
        data: getServiceData('sqs', 'Decoupled fulfillment task buffer (FIFO)'),
      },
      {
        id: 'node-lambda-worker',
        type: 'awsService',
        position: { x: 1140, y: 260 },
        data: getServiceData('lambda', 'Async payment & invoice processor'),
      },
    ],
    edges: [
      {
        id: 'edge-cf-apigw',
        source: 'node-cf',
        target: 'node-apigw',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'HTTPS/REST' as EdgeProtocol,
        label: 'HTTPS/REST',
        animated: true,
      },
      {
        id: 'edge-apigw-lambda',
        source: 'node-apigw',
        target: 'node-lambda-api',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'Event Trigger' as EdgeProtocol,
        label: 'Event Trigger',
        animated: true,
      },
      {
        id: 'edge-lambda-ddb',
        source: 'node-lambda-api',
        target: 'node-ddb',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'SQL/TCP' as EdgeProtocol,
        label: 'SQL/TCP',
      },
      {
        id: 'edge-lambda-sqs',
        source: 'node-lambda-api',
        target: 'node-sqs',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'Event Trigger' as EdgeProtocol,
        label: 'Event Trigger',
        animated: true,
      },
      {
        id: 'edge-sqs-worker',
        source: 'node-sqs',
        target: 'node-lambda-worker',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'Event Trigger' as EdgeProtocol,
        label: 'Event Trigger',
        animated: true,
      },
    ],
  },

  // 2. Multi-AZ 3-Tier Enterprise VPC (Top-to-Bottom TB Flow)
  '3-tier-vpc': {
    id: '3-tier-vpc',
    name: 'Multi-AZ 3-Tier Enterprise VPC',
    description: 'High availability decoupled VPC design with Route 53, ALB, Auto-Scaled EC2 instances, and Aurora Multi-AZ.',
    flowDirection: 'TB',
    nodes: [
      // Outermost VPC Boundary
      createBoundaryNode('bound-vpc', 'vpc', 'PRODUCTION VPC (10.0.0.0/16)', 80, 160, 940, 560),
      createBoundaryNode('bound-pub', 'public-subnet', 'PUBLIC SUBNET (10.0.1.0/24)', 110, 200, 880, 120),
      createBoundaryNode('bound-priv', 'private-subnet', 'PRIVATE APP SUBNET (10.0.2.0/24)', 110, 350, 880, 170),
      createBoundaryNode('bound-data', 'data-subnet', 'ISOLATED DATA SUBNET (10.0.3.0/24)', 110, 540, 880, 150),

      // Outside DNS
      {
        id: 'node-r53',
        type: 'awsService',
        position: { x: 420, y: 40 },
        data: getServiceData('route53', 'Zone apex DNS latency routing'),
      },

      // Tier 1: Public Subnet ALB
      {
        id: 'node-alb',
        type: 'awsService',
        position: { x: 420, y: 220 },
        data: getServiceData('alb', 'Public subnet Internet-facing ALB'),
      },

      // Tier 2: Private Subnet Compute
      {
        id: 'node-ec2-a',
        type: 'awsService',
        position: { x: 180, y: 390 },
        data: getServiceData('ec2', 'Private Subnet AZ-A compute instance'),
      },
      {
        id: 'node-ec2-b',
        type: 'awsService',
        position: { x: 460, y: 390 },
        data: getServiceData('ec2', 'Private Subnet AZ-B compute instance'),
      },
      {
        id: 'node-s3-endpoint',
        type: 'awsService',
        position: { x: 720, y: 390 },
        data: getServiceData('s3', 'Gateway VPC Endpoint artifact storage'),
      },

      // Tier 3: Isolated Database
      {
        id: 'node-aurora',
        type: 'awsService',
        position: { x: 420, y: 580 },
        data: getServiceData('aurora', 'Isolated data subnet Multi-AZ cluster'),
      },
    ],
    edges: [
      {
        id: 'edge-r53-alb',
        source: 'node-r53',
        target: 'node-alb',
        sourceHandle: 'bottom',
        targetHandle: 'top',
        protocol: 'HTTPS/REST' as EdgeProtocol,
        label: 'HTTPS/REST',
        animated: true,
      },
      {
        id: 'edge-alb-ec2a',
        source: 'node-alb',
        target: 'node-ec2-a',
        sourceHandle: 'bottom',
        targetHandle: 'top',
        protocol: 'HTTPS/REST' as EdgeProtocol,
        label: 'HTTPS/REST',
      },
      {
        id: 'edge-alb-ec2b',
        source: 'node-alb',
        target: 'node-ec2-b',
        sourceHandle: 'bottom',
        targetHandle: 'top',
        protocol: 'HTTPS/REST' as EdgeProtocol,
        label: 'HTTPS/REST',
      },
      {
        id: 'edge-ec2a-aurora',
        source: 'node-ec2-a',
        target: 'node-aurora',
        sourceHandle: 'bottom',
        targetHandle: 'left',
        protocol: 'SQL/TCP' as EdgeProtocol,
        label: 'SQL/TCP',
      },
      {
        id: 'edge-ec2b-aurora',
        source: 'node-ec2-b',
        target: 'node-aurora',
        sourceHandle: 'bottom',
        targetHandle: 'top',
        protocol: 'SQL/TCP' as EdgeProtocol,
        label: 'SQL/TCP',
      },
      {
        id: 'edge-ec2b-s3',
        source: 'node-ec2-b',
        target: 'node-s3-endpoint',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'VPC PrivateLink' as EdgeProtocol,
        label: 'VPC PrivateLink',
      },
    ],
  },

  // 3. Secure Edge Static Hosting (Left-to-Right LR Flow)
  'secure-web': {
    id: 'secure-web',
    name: 'Secure Edge Static Hosting',
    description: 'Hardened S3 static website architecture with AWS WAF, CloudFront Origin Access Control, and KMS encryption.',
    flowDirection: 'LR',
    nodes: [
      createBoundaryNode('bound-edge', 'aws-cloud', 'AWS SECURE EDGE PERIMETER', 30, 40, 1150, 420),

      {
        id: 'node-waf',
        type: 'awsService',
        position: { x: 70, y: 180 },
        data: getServiceData('waf', 'SQLi and rate-limit Layer 7 inspection'),
      },
      {
        id: 'node-cf-sec',
        type: 'awsService',
        position: { x: 340, y: 180 },
        data: getServiceData('cloudfront', 'CloudFront distribution with SigV4 OAC'),
      },
      {
        id: 'node-iam-oac',
        type: 'awsService',
        position: { x: 620, y: 80 },
        data: getServiceData('iam', 'Bucket policy restricting access to OAC ARN'),
      },
      {
        id: 'node-s3-origin',
        type: 'awsService',
        position: { x: 620, y: 280 },
        data: getServiceData('s3', 'Private S3 bucket with Block Public Access'),
      },
      {
        id: 'node-kms-key',
        type: 'awsService',
        position: { x: 910, y: 280 },
        data: getServiceData('kms', 'Customer-managed key (CMK) SSE-KMS'),
      },
    ],
    edges: [
      {
        id: 'edge-waf-cf',
        source: 'node-waf',
        target: 'node-cf-sec',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'HTTPS/REST' as EdgeProtocol,
        label: 'HTTPS/REST',
        animated: true,
      },
      {
        id: 'edge-cf-iam',
        source: 'node-cf-sec',
        target: 'node-iam-oac',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'IAM Role Assumption' as EdgeProtocol,
        label: 'IAM Role Assumption',
      },
      {
        id: 'edge-cf-s3',
        source: 'node-cf-sec',
        target: 'node-s3-origin',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'HTTPS/REST' as EdgeProtocol,
        label: 'HTTPS/REST',
        animated: true,
      },
      {
        id: 'edge-s3-kms',
        source: 'node-s3-origin',
        target: 'node-kms-key',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'IAM Role Assumption' as EdgeProtocol,
        label: 'IAM Role Assumption',
      },
    ],
  },

  // 4. Real-Time Streaming & Analytics Data Lake (Draw.io Pipeline: Ingestion -> Processing -> Storage -> Analytics)
  'data-lake-analytics': {
    id: 'data-lake-analytics',
    name: 'Real-Time Streaming & Analytics Data Lake',
    description: 'Draw.io pipeline flow: Kinesis streaming ingestion, Lambda micro-batching, S3 raw/refined lake, Glue catalog, and Athena queries.',
    flowDirection: 'LR',
    nodes: [
      createBoundaryNode('bound-lake', 'aws-cloud', 'BIG DATA & SERVERLESS ANALYTICS PIPELINE', 30, 30, 1360, 440),

      {
        id: 'node-kinesis',
        type: 'awsService',
        position: { x: 70, y: 170 },
        data: getServiceData('kinesis', 'High-throughput clickstream event ingestion stream'),
      },
      {
        id: 'node-lambda-etl',
        type: 'awsService',
        position: { x: 350, y: 170 },
        data: getServiceData('lambda', 'Parquet compaction & schema validation worker'),
      },
      {
        id: 'node-s3-lake',
        type: 'awsService',
        position: { x: 630, y: 170 },
        data: getServiceData('s3', 'Immutable Iceberg/Parquet data lake bucket'),
      },
      {
        id: 'node-glue',
        type: 'awsService',
        position: { x: 910, y: 70 },
        data: getServiceData('glue', 'Scheduled metadata crawler & Data Catalog'),
      },
      {
        id: 'node-athena',
        type: 'awsService',
        position: { x: 910, y: 270 },
        data: getServiceData('athena', 'Ad-hoc distributed serverless SQL queries'),
      },
      {
        id: 'node-cloudwatch-stream',
        type: 'awsService',
        position: { x: 1140, y: 170 },
        data: getServiceData('cloudwatch', 'IteratorAgeMilliseconds lag telemetry & alerts'),
      },
    ],
    edges: [
      {
        id: 'edge-kin-lambda',
        source: 'node-kinesis',
        target: 'node-lambda-etl',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'Event Trigger' as EdgeProtocol,
        label: 'Event Trigger',
        animated: true,
      },
      {
        id: 'edge-lambda-s3',
        source: 'node-lambda-etl',
        target: 'node-s3-lake',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'HTTPS/REST' as EdgeProtocol,
        label: 'HTTPS/REST',
      },
      {
        id: 'edge-s3-glue',
        source: 'node-s3-lake',
        target: 'node-glue',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'IAM Role Assumption' as EdgeProtocol,
        label: 'IAM Role Assumption',
      },
      {
        id: 'edge-glue-athena',
        source: 'node-glue',
        target: 'node-athena',
        sourceHandle: 'bottom',
        targetHandle: 'top',
        protocol: 'SQL/TCP' as EdgeProtocol,
        label: 'SQL/TCP',
      },
      {
        id: 'edge-s3-athena',
        source: 'node-s3-lake',
        target: 'node-athena',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'SQL/TCP' as EdgeProtocol,
        label: 'SQL/TCP',
      },
      {
        id: 'edge-athena-cw',
        source: 'node-athena',
        target: 'node-cloudwatch-stream',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'HTTPS/REST' as EdgeProtocol,
        label: 'HTTPS/REST',
      },
    ],
  },

  // 5. Microservices Container Mesh with Cache (Top-to-Bottom TB Flow)
  'microservices-mesh': {
    id: 'microservices-mesh',
    name: 'Microservices Container Mesh with Cache',
    description: 'Enterprise containerized architecture with Route 53, ALB, Amazon ECS Fargate, Redis caching, and Aurora PostgreSQL.',
    flowDirection: 'TB',
    nodes: [
      createBoundaryNode('bound-mesh-vpc', 'vpc', 'CONTAINER WORKLOAD VPC (10.10.0.0/16)', 80, 150, 940, 560),
      createBoundaryNode('bound-mesh-pub', 'public-subnet', 'INGRESS SUBNET (10.10.1.0/24)', 110, 190, 880, 110),
      createBoundaryNode('bound-mesh-priv', 'private-subnet', 'FARGATE CONTAINER SUBNET (10.10.2.0/24)', 110, 330, 880, 170),
      createBoundaryNode('bound-mesh-data', 'data-subnet', 'CACHE & DATABASE SUBNET (10.10.3.0/24)', 110, 530, 880, 150),

      {
        id: 'node-r53-mesh',
        type: 'awsService',
        position: { x: 420, y: 30 },
        data: getServiceData('route53', 'Public DNS alias record pointing to ALB'),
      },
      {
        id: 'node-alb-mesh',
        type: 'awsService',
        position: { x: 420, y: 210 },
        data: getServiceData('alb', 'Path-based routing (/api/*, /auth/*)'),
      },
      {
        id: 'node-ecs-fargate',
        type: 'awsService',
        position: { x: 420, y: 360 },
        data: getServiceData('ecs', 'Auto-scaled Fargate microservice containers'),
      },
      {
        id: 'node-secrets',
        type: 'awsService',
        position: { x: 720, y: 360 },
        data: getServiceData('secrets-manager', 'Automated RDS database secret rotation'),
      },
      {
        id: 'node-elasticache',
        type: 'awsService',
        position: { x: 200, y: 560 },
        data: getServiceData('elasticache', 'Redis session token and read-through cache'),
      },
      {
        id: 'node-rds-pg',
        type: 'awsService',
        position: { x: 500, y: 560 },
        data: getServiceData('rds', 'Multi-AZ PostgreSQL primary database'),
      },
    ],
    edges: [
      {
        id: 'edge-r53-alb-mesh',
        source: 'node-r53-mesh',
        target: 'node-alb-mesh',
        sourceHandle: 'bottom',
        targetHandle: 'top',
        protocol: 'HTTPS/REST' as EdgeProtocol,
        label: 'HTTPS/REST',
        animated: true,
      },
      {
        id: 'edge-alb-ecs',
        source: 'node-alb-mesh',
        target: 'node-ecs-fargate',
        sourceHandle: 'bottom',
        targetHandle: 'top',
        protocol: 'HTTPS/REST' as EdgeProtocol,
        label: 'HTTPS/REST',
      },
      {
        id: 'edge-ecs-secrets',
        source: 'node-ecs-fargate',
        target: 'node-secrets',
        sourceHandle: 'right',
        targetHandle: 'left',
        protocol: 'IAM Role Assumption' as EdgeProtocol,
        label: 'IAM Role Assumption',
      },
      {
        id: 'edge-ecs-redis',
        source: 'node-ecs-fargate',
        target: 'node-elasticache',
        sourceHandle: 'bottom',
        targetHandle: 'top',
        protocol: 'SQL/TCP' as EdgeProtocol,
        label: 'SQL/TCP',
      },
      {
        id: 'edge-ecs-rds',
        source: 'node-ecs-fargate',
        target: 'node-rds-pg',
        sourceHandle: 'bottom',
        targetHandle: 'top',
        protocol: 'SQL/TCP' as EdgeProtocol,
        label: 'SQL/TCP',
      },
    ],
  },
};

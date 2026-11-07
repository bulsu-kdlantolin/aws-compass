// src/utils/costEstimator.ts
// Deterministic AWS T-Shirt Sizing FinOps & Rough Monthly Cost Estimator for AWS Compass.
// Provides realistic us-east-1 On-Demand baseline pricing heuristics across Small, Medium, and Large workload tiers.

import type { CanvasNodeItem, CanvasEdgeItem } from '../types/aws';

export type WorkloadTier = 'small' | 'medium' | 'large';
export type NodeCapacityTier = 'S' | 'M' | 'L' | 'Free';
export type BillingModel = 'Fixed baseline' | 'Usage-based' | 'Free construct';

export interface NodeCostEstimate {
  nodeId: string;
  serviceId: string;
  serviceName: string;
  category: string;
  effectiveTier: WorkloadTier | 'free';
  monthlyCost: number;
  billingModel: BillingModel;
  pricingDetails: string;
  isMultiAz: boolean;
  isInsideAsg: boolean;
  percentageOfTotal: number;
}

export interface CostOptimizationInsight {
  id: string;
  title: string;
  description: string;
  type: 'saving' | 'warning' | 'info';
  estimatedSavingMonthly?: number;
}

export interface ArchitectureCostEstimate {
  workloadTier: WorkloadTier;
  totalMonthlyCost: number;
  fixedBaselineCost: number;
  usageBasedCost: number;
  fixedPercentage: number;
  usagePercentage: number;
  nodeEstimates: NodeCostEstimate[];
  insights: CostOptimizationInsight[];
}

/**
 * Baseline monthly pricing table (us-east-1 On-Demand baseline).
 * Keyed by serviceId lowercase.
 */
interface ServicePricingRule {
  small: number;
  medium: number;
  large: number;
  billingModel: BillingModel;
  details: (tier: WorkloadTier, isMultiAz: boolean, isInsideAsg: boolean) => string;
  supportsMultiAzMultiplier?: boolean;
}

const SERVICE_PRICING_RULES: Record<string, ServicePricingRule> = {
  // 1. Fixed Hourly & Always-On Infrastructure
  'nat-gateway': {
    small: 45, // $32 base + $13 data processing
    medium: 95, // $32 base + $63 data processing
    large: 320, // $32 base + $288 data processing
    billingModel: 'Fixed baseline',
    details: (tier) =>
      tier === 'small'
        ? '$32/mo fixed ENI base + $13/mo data processing'
        : tier === 'medium'
          ? '$32/mo fixed ENI base + $63/mo data processing'
          : '$32/mo fixed ENI base + $288/mo data processing',
  },
  alb: {
    small: 22,
    medium: 48,
    large: 165,
    billingModel: 'Fixed baseline',
    details: (tier) =>
      tier === 'small'
        ? '$16.20/mo base + ~$6 LCU usage'
        : tier === 'medium'
          ? '$16.20/mo base + ~$32 LCU usage'
          : '$16.20/mo base + ~$149 LCU usage',
  },
  nlb: {
    small: 20,
    medium: 45,
    large: 150,
    billingModel: 'Fixed baseline',
    details: (tier) =>
      tier === 'small'
        ? '$16.20/mo base + ~$4 NLCU usage'
        : tier === 'medium'
          ? '$16.20/mo base + ~$29 NLCU usage'
          : '$16.20/mo base + ~$134 NLCU usage',
  },
  ec2: {
    small: 14, // t4g.small (2 vCPU, 2GB) ~$14/mo
    medium: 65, // m7g.large (2 vCPU, 8GB) ~$65/mo
    large: 245, // c7g.2xlarge (8 vCPU, 16GB) ~$245/mo
    billingModel: 'Fixed baseline',
    supportsMultiAzMultiplier: true,
    details: (tier, isMultiAz, isInsideAsg) => {
      const mult = isMultiAz || isInsideAsg ? ' (2x Multi-AZ / ASG fleet)' : '';
      return tier === 'small'
        ? `t4g.small instance ~$14/mo${mult}`
        : tier === 'medium'
          ? `m7g.large instance ~$65/mo${mult}`
          : `c7g.2xlarge instance ~$245/mo${mult}`;
    },
  },
  ecs: {
    small: 14,
    medium: 65,
    large: 245,
    billingModel: 'Fixed baseline',
    supportsMultiAzMultiplier: true,
    details: (tier, isMultiAz, isInsideAsg) => {
      const mult = isMultiAz || isInsideAsg ? ' (2x Multi-AZ task spread)' : '';
      return tier === 'small'
        ? `1 task (0.5 vCPU, 1GB) ~$14/mo${mult}`
        : tier === 'medium'
          ? `2 tasks (1 vCPU, 2GB) ~$65/mo${mult}`
          : `Scaled container cluster ~$245/mo${mult}`;
    },
  },
  fargate: {
    small: 14,
    medium: 65,
    large: 245,
    billingModel: 'Fixed baseline',
    supportsMultiAzMultiplier: true,
    details: (tier, isMultiAz, isInsideAsg) => {
      const mult = isMultiAz || isInsideAsg ? ' (2x Multi-AZ tasks)' : '';
      return tier === 'small'
        ? `0.5 vCPU / 1GB RAM task ~$14/mo${mult}`
        : tier === 'medium'
          ? `2 vCPU / 4GB RAM tasks ~$65/mo${mult}`
          : `Enterprise task fleet ~$245/mo${mult}`;
    },
  },
  eks: {
    small: 115, // $73 control plane + $42 small worker
    medium: 240, // $73 control plane + $167 2x m7g.large
    large: 650, // $73 control plane + $577 cluster fleet
    billingModel: 'Fixed baseline',
    details: (tier) =>
      tier === 'small'
        ? '$73/mo control plane + $42/mo small worker node'
        : tier === 'medium'
          ? '$73/mo control plane + $167/mo managed node group'
          : '$73/mo control plane + $577/mo enterprise worker nodes',
  },
  rds: {
    small: 28, // db.t4g.micro ~$28/mo
    medium: 140, // db.m7g.large ~$140/mo
    large: 580, // db.r7g.xlarge ~$580/mo
    billingModel: 'Fixed baseline',
    supportsMultiAzMultiplier: true,
    details: (tier, isMultiAz) => {
      const mult = isMultiAz ? ' (2x Multi-AZ Standby)' : '';
      return tier === 'small'
        ? `db.t4g.small ~$28/mo${mult}`
        : tier === 'medium'
          ? `db.m7g.large ~$140/mo${mult}`
          : `db.r7g.xlarge ~$580/mo${mult}`;
    },
  },
  aurora: {
    small: 32,
    medium: 155,
    large: 620,
    billingModel: 'Fixed baseline',
    supportsMultiAzMultiplier: true,
    details: (tier, isMultiAz) => {
      const mult = isMultiAz ? ' (2x Multi-AZ Read Replica)' : '';
      return tier === 'small'
        ? `Aurora Serverless v2 0.5 ACU + storage ~$32/mo${mult}`
        : tier === 'medium'
          ? `Aurora Serverless v2 2 ACUs + replicated storage ~$155/mo${mult}`
          : `Aurora cluster 8 ACUs + high I/O ~$620/mo${mult}`;
    },
  },
  elasticache: {
    small: 18,
    medium: 85,
    large: 340,
    billingModel: 'Fixed baseline',
    supportsMultiAzMultiplier: true,
    details: (tier, isMultiAz) => {
      const mult = isMultiAz ? ' (2x Multi-AZ Primary + Replica)' : '';
      return tier === 'small'
        ? `cache.t4g.micro ~$18/mo${mult}`
        : tier === 'medium'
          ? `cache.m7g.large ~$85/mo${mult}`
          : `cache.r7g.xlarge cluster ~$340/mo${mult}`;
    },
  },
  opensearch: {
    small: 38,
    medium: 160,
    large: 620,
    billingModel: 'Fixed baseline',
    details: (tier) =>
      tier === 'small'
        ? 't3.small.search single node ~$38/mo'
        : tier === 'medium'
          ? 'm6g.large.search multi-AZ ~$160/mo'
          : 'r6g.xlarge.search cluster with master nodes ~$620/mo',
  },
  msk: {
    small: 140,
    medium: 380,
    large: 1150,
    billingModel: 'Fixed baseline',
    details: (tier) =>
      tier === 'small'
        ? 'kafka.t3.small (3 brokers) ~$140/mo'
        : tier === 'medium'
          ? 'kafka.m5.large (3 brokers) ~$380/mo'
          : 'kafka.m5.2xlarge cluster ~$1,150/mo',
  },
  redshift: {
    small: 180,
    medium: 540,
    large: 1950,
    billingModel: 'Fixed baseline',
    details: (tier) =>
      tier === 'small'
        ? 'dc2.large single node ~$180/mo'
        : tier === 'medium'
          ? 'ra3.xlplus (2 nodes) ~$540/mo'
          : 'ra3.4xlplus enterprise cluster ~$1,950/mo',
  },

  // 2. Consumption / Serverless / Pay-Per-Use Services
  lambda: {
    small: 0, // Free tier covers ~1M calls
    medium: 18, // ~5M invocations @ 256MB
    large: 145, // ~50M invocations @ 512MB
    billingModel: 'Usage-based',
    details: (tier) =>
      tier === 'small'
        ? 'Free tier (up to 1M invocations & 400k GB-s) ~$0/mo'
        : tier === 'medium'
          ? '5M invocations @ 256MB average duration ~$18/mo'
          : '50M invocations high concurrency ~$145/mo',
  },
  'api-gateway': {
    small: 1,
    medium: 20,
    large: 160,
    billingModel: 'Usage-based',
    details: (tier) =>
      tier === 'small'
        ? 'Under 500k HTTP API requests ~$1/mo'
        : tier === 'medium'
          ? '5M API calls ~$20/mo'
          : '50M API calls + authorizer evaluations ~$160/mo',
  },
  sqs: {
    small: 0,
    medium: 12,
    large: 85,
    billingModel: 'Usage-based',
    details: (tier) =>
      tier === 'small'
        ? 'First 1M requests free ~$0/mo'
        : tier === 'medium'
          ? '30M standard queue requests ~$12/mo'
          : '200M requests + FIFO queue batching ~$85/mo',
  },
  sns: {
    small: 0,
    medium: 12,
    large: 85,
    billingModel: 'Usage-based',
    details: (tier) =>
      tier === 'small'
        ? 'First 1M requests free ~$0/mo'
        : tier === 'medium'
          ? '20M notifications published ~$12/mo'
          : '150M notifications + HTTPS/SMS push delivery ~$85/mo',
  },
  eventbridge: {
    small: 0,
    medium: 15,
    large: 95,
    billingModel: 'Usage-based',
    details: (tier) =>
      tier === 'small'
        ? 'Native AWS service events ingested free ~$0/mo'
        : tier === 'medium'
          ? '15M custom events ingested ~$15/mo'
          : '95M custom events + schema registry ~$95/mo',
  },
  'step-functions': {
    small: 1,
    medium: 25,
    large: 180,
    billingModel: 'Usage-based',
    details: (tier) =>
      tier === 'small'
        ? 'Standard state transitions under free tier ~$1/mo'
        : tier === 'medium'
          ? 'Express workflows (~1M executions) ~$25/mo'
          : 'High-throughput express workflow pipeline ~$180/mo',
  },
  s3: {
    small: 3, // ~50GB Standard
    medium: 28, // ~500GB Standard + API requests
    large: 180, // ~5TB + data retrieval
    billingModel: 'Usage-based',
    details: (tier) =>
      tier === 'small'
        ? '~50GB Standard storage + requests ~$3/mo'
        : tier === 'medium'
          ? '~500GB Standard storage + lifecycle rules ~$28/mo'
          : '~5TB storage + S3 analytics ~$180/mo',
  },
  ebs: {
    small: 4, // 50GB gp3
    medium: 25, // 250GB gp3
    large: 160, // 1.5TB gp3 + IOPS
    billingModel: 'Fixed baseline',
    details: (tier) =>
      tier === 'small'
        ? '50GB gp3 storage volume ~$4/mo'
        : tier === 'medium'
          ? '250GB gp3 (3,000 baseline IOPS) ~$25/mo'
          : '1.5TB gp3 + provisioned IOPS ~$160/mo',
  },
  efs: {
    small: 6,
    medium: 45,
    large: 220,
    billingModel: 'Usage-based',
    details: (tier) =>
      tier === 'small'
        ? '20GB Standard storage ~$6/mo'
        : tier === 'medium'
          ? '150GB Standard + Infrequent Access tiering ~$45/mo'
          : '1TB elastic throughput storage ~$220/mo',
  },
  dynamodb: {
    small: 1, // Free tier covers 25GB
    medium: 35, // ~150 WCU/RCU
    large: 210, // ~1,500 WCU/RCU, On-Demand
    billingModel: 'Usage-based',
    details: (tier) =>
      tier === 'small'
        ? '25GB storage + 25 WCU/RCU under free tier ~$1/mo'
        : tier === 'medium'
          ? 'On-Demand capacity (~15M reads/writes) ~$35/mo'
          : 'High-scale on-demand table + streams ~$210/mo',
  },
  cloudfront: {
    small: 2,
    medium: 32,
    large: 195,
    billingModel: 'Usage-based',
    details: (tier) =>
      tier === 'small'
        ? '1TB free tier transfer out ~$2/mo'
        : tier === 'medium'
          ? '3TB data transfer out + HTTPS requests ~$32/mo'
          : '20TB global edge delivery ~$195/mo',
  },
  route53: {
    small: 1,
    medium: 3,
    large: 12,
    billingModel: 'Usage-based',
    details: (tier) =>
      tier === 'small'
        ? '1 hosted zone ($0.50) + basic DNS queries ~$1/mo'
        : tier === 'medium'
          ? '2 hosted zones + health check monitoring ~$3/mo'
          : 'Multiple hosted zones + latency routing records ~$12/mo',
  },
  waf: {
    small: 10,
    medium: 28,
    large: 110,
    billingModel: 'Fixed baseline',
    details: (tier) =>
      tier === 'small'
        ? '1 WebACL + 2 rules ~$10/mo'
        : tier === 'medium'
          ? '1 WebACL + AWS Managed Rules ~$28/mo'
          : 'Multiple WebACLs + Bot Control rule group ~$110/mo',
  },
  kms: {
    small: 1,
    medium: 4,
    large: 25,
    billingModel: 'Usage-based',
    details: (tier) =>
      tier === 'small'
        ? '1 Customer Managed Key ($1/mo) + requests ~$1/mo'
        : tier === 'medium'
          ? '3 Customer Managed Keys + cryptographic requests ~$4/mo'
          : 'Multiple CMKs across environments ~$25/mo',
  },
  'secrets-manager': {
    small: 2,
    medium: 12,
    large: 65,
    billingModel: 'Usage-based',
    details: (tier) =>
      tier === 'small'
        ? '3 secrets ($0.40/secret/mo) ~$2/mo'
        : tier === 'medium'
          ? '15 secrets + automated rotation ~$12/mo'
          : '80 secrets + multi-region replication ~$65/mo',
  },
  'transit-gateway': {
    small: 42,
    medium: 115,
    large: 380,
    billingModel: 'Fixed baseline',
    details: (tier) =>
      tier === 'small'
        ? '1 attachment ($36.50/mo) + minimal data processing ~$42/mo'
        : tier === 'medium'
          ? '2 VPC attachments ($73/mo) + data processing ~$115/mo'
          : 'Multiple attachments + peering data traffic ~$380/mo',
  },
  privatelink: {
    small: 15,
    medium: 45,
    large: 180,
    billingModel: 'Fixed baseline',
    details: (tier) =>
      tier === 'small'
        ? '2 interface endpoints ($14.60/mo) ~$15/mo'
        : tier === 'medium'
          ? '4 interface endpoints + data processing ~$45/mo'
          : 'High-throughput endpoint service fleet ~$180/mo',
  },
};

/**
 * Free logical constructs that never incur AWS infrastructure billing.
 */
const FREE_LOGICAL_IDS = new Set([
  'vpc',
  'public-subnet',
  'private-subnet',
  'data-subnet',
  'security-group',
  'iam',
  'iam-role',
  'internet-gateway',
  'auto-scaling-group',
  'corporate-datacenter',
  'branch-office',
  'user-browser',
  'mobile-client',
  'third-party-api',
  'external-webhook',
]);

/**
 * Checks whether a node is placed in a Multi-AZ configuration.
 */
function isNodeMultiAz(node: CanvasNodeItem): boolean {
  const az = (node.data?.az || '').toLowerCase().trim();
  return az.includes('multi') || az.includes('multi-az') || az === 'multi';
}

/**
 * Checks whether a node is contained inside an Auto Scaling Group boundary container.
 */
function isNodeInsideAsg(node: CanvasNodeItem, allNodes: CanvasNodeItem[]): boolean {
  if (!node.parentId) return false;
  const parent = allNodes.find((n) => n.id === node.parentId);
  if (!parent) return false;
  const bType = parent.data?.boundaryType || '';
  const label = (parent.data?.boundaryLabel || parent.data?.label || '').toLowerCase();
  return bType === 'auto-scaling-group' || label.includes('auto scaling') || label.includes('asg');
}

/**
 * Category-based fallback baseline when a service is not specifically mapped.
 */
function getCategoryFallbackRule(category: string): ServicePricingRule {
  const cat = category.toLowerCase();
  if (cat.includes('compute') || cat.includes('container')) {
    return {
      small: 14,
      medium: 65,
      large: 220,
      billingModel: 'Fixed baseline',
      supportsMultiAzMultiplier: true,
      details: (tier, isMultiAz) =>
        `Compute instance ~$${tier === 'small' ? 14 : tier === 'medium' ? 65 : 220}/mo${isMultiAz ? ' (2x Multi-AZ)' : ''
        }`,
    };
  }
  if (cat.includes('database')) {
    return {
      small: 28,
      medium: 130,
      large: 450,
      billingModel: 'Fixed baseline',
      supportsMultiAzMultiplier: true,
      details: (tier, isMultiAz) =>
        `Database instance ~$${tier === 'small' ? 28 : tier === 'medium' ? 130 : 450}/mo${isMultiAz ? ' (2x Multi-AZ)' : ''
        }`,
    };
  }
  if (cat.includes('storage')) {
    return {
      small: 5,
      medium: 30,
      large: 150,
      billingModel: 'Usage-based',
      details: (tier) =>
        `Storage capacity ~$${tier === 'small' ? 5 : tier === 'medium' ? 30 : 150}/mo`,
    };
  }
  if (cat.includes('network')) {
    return {
      small: 15,
      medium: 45,
      large: 120,
      billingModel: 'Fixed baseline',
      details: (tier) =>
        `Network resource ~$${tier === 'small' ? 15 : tier === 'medium' ? 45 : 120}/mo`,
    };
  }
  if (cat.includes('analytics')) {
    return {
      small: 25,
      medium: 90,
      large: 320,
      billingModel: 'Fixed baseline',
      details: (tier) =>
        `Analytics cluster ~$${tier === 'small' ? 25 : tier === 'medium' ? 90 : 320}/mo`,
    };
  }
  return {
    small: 5,
    medium: 25,
    large: 90,
    billingModel: 'Usage-based',
    details: (tier) =>
      `Managed service ~$${tier === 'small' ? 5 : tier === 'medium' ? 25 : 90}/mo`,
  };
}

/**
 * Calculates a single node's monthly cost estimate.
 */
export function estimateSingleNodeCost(
  node: CanvasNodeItem,
  allNodes: CanvasNodeItem[],
  globalWorkloadTier: WorkloadTier = 'medium'
): NodeCostEstimate {
  const serviceId = (node.data?.serviceId || node.id || '').toLowerCase();
  const serviceName = node.data?.customTitle || node.data?.label || serviceId.toUpperCase();
  const category = node.data?.category || 'Compute';

  // 1. Check if node is an annotation, boundary container, or free construct
  if (node.data?.isBoundary || node.data?.isAnnotation || node.data?.isExternalActor || FREE_LOGICAL_IDS.has(serviceId)) {
    return {
      nodeId: node.id,
      serviceId,
      serviceName,
      category: 'Logical & Boundary',
      effectiveTier: 'free',
      monthlyCost: 0,
      billingModel: 'Free construct',
      pricingDetails: '$0/mo · Free architectural construct',
      isMultiAz: false,
      isInsideAsg: false,
      percentageOfTotal: 0,
    };
  }

  // 2. Resolve effective workload tier (Node override takes precedence over global)
  const nodeOverride = node.data?.capacityTier as NodeCapacityTier | undefined;
  let effectiveTier: WorkloadTier | 'free';

  if (nodeOverride === 'Free') {
    return {
      nodeId: node.id,
      serviceId,
      serviceName,
      category,
      effectiveTier: 'free',
      monthlyCost: 0,
      billingModel: 'Free construct',
      pricingDetails: '$0/mo · Explicitly marked free / zero capacity',
      isMultiAz: false,
      isInsideAsg: false,
      percentageOfTotal: 0,
    };
  }

  if (nodeOverride === 'S') effectiveTier = 'small';
  else if (nodeOverride === 'M') effectiveTier = 'medium';
  else if (nodeOverride === 'L') effectiveTier = 'large';
  else effectiveTier = globalWorkloadTier;

  // 3. Resolve Multi-AZ and ASG flags
  const isMultiAz = isNodeMultiAz(node);
  const isInsideAsg = isNodeInsideAsg(node, allNodes);

  // 4. Resolve pricing rule
  const rule = SERVICE_PRICING_RULES[serviceId] || getCategoryFallbackRule(category);
  let baseCost = rule[effectiveTier];

  // Apply 2x multiplier for Multi-AZ or ASG if supported
  if (rule.supportsMultiAzMultiplier && (isMultiAz || isInsideAsg)) {
    baseCost *= 2;
  }

  const details = rule.details(effectiveTier, isMultiAz, isInsideAsg);

  return {
    nodeId: node.id,
    serviceId,
    serviceName,
    category,
    effectiveTier,
    monthlyCost: Math.round(baseCost),
    billingModel: rule.billingModel,
    pricingDetails: `~$${Math.round(baseCost)}/mo · ${details}`,
    isMultiAz,
    isInsideAsg,
    percentageOfTotal: 0, // Computed in batch function
  };
}

/**
 * Computes actionable FinOps cost optimization insights based on the active diagram.
 */
function generateCostInsights(
  nodeEstimates: NodeCostEstimate[],
  totalCost: number,
  workloadTier: WorkloadTier
): CostOptimizationInsight[] {
  const insights: CostOptimizationInsight[] = [];
  if (totalCost === 0) return insights;

  // 1. NAT Gateway Data Processing Optimization
  const natNodes = nodeEstimates.filter((n) => n.serviceId === 'nat-gateway');
  const s3OrDynamoNodes = nodeEstimates.filter(
    (n) => n.serviceId === 's3' || n.serviceId === 'dynamodb'
  );

  if (natNodes.length > 0) {
    const natTotal = natNodes.reduce((sum, n) => sum + n.monthlyCost, 0);
    const natPct = Math.round((natTotal / totalCost) * 100);

    if (natPct >= 20 && s3OrDynamoNodes.length > 0) {
      insights.push({
        id: 'nat-gateway-endpoint',
        title: `NAT Gateway accounts for ${natPct}% of architecture cost`,
        description:
          'Add an Amazon S3 and DynamoDB VPC Gateway Endpoint ($0/mo) to route storage and database traffic privately, bypassing NAT Gateway per-GB data processing fees.',
        type: 'saving',
        estimatedSavingMonthly: Math.round(natTotal * 0.4),
      });
    }
  }

  // 2. Multi-AZ in Dev / Prototype Tier
  if (workloadTier === 'small') {
    const multiAzNodes = nodeEstimates.filter((n) => n.isMultiAz && n.monthlyCost > 20);
    if (multiAzNodes.length > 0) {
      const excess = multiAzNodes.reduce((sum, n) => sum + Math.round(n.monthlyCost / 2), 0);
      insights.push({
        id: 'multi-az-dev',
        title: 'Multi-AZ enabled on Dev / Prototype workload',
        description: `Nodes (${multiAzNodes.map((n) => n.serviceName).join(', ')}) have Multi-AZ enabled, which doubles baseline instance and storage costs. Consider Single-AZ for dev/staging environments.`,
        type: 'warning',
        estimatedSavingMonthly: excess,
      });
    }
  }

  // 3. EKS Fixed Overhead for Small Scale
  const eksNodes = nodeEstimates.filter((n) => n.serviceId === 'eks');
  const computeNodes = nodeEstimates.filter(
    (n) => n.serviceId === 'ec2' || n.serviceId === 'fargate' || n.serviceId === 'ecs'
  );

  if (eksNodes.length > 0 && computeNodes.length <= 2 && workloadTier !== 'large') {
    insights.push({
      id: 'eks-cluster-overhead',
      title: 'EKS control plane fee ($73/mo) represents high overhead',
      description:
        'Amazon EKS has a mandatory $73/mo fixed cluster management fee. If running only 1–2 small container workloads, ECS on AWS Fargate ($0/mo cluster fee) offers substantial cost savings.',
      type: 'info',
      estimatedSavingMonthly: 73,
    });
  }

  // 4. Single-AZ Database in Production / Enterprise Workload
  if (workloadTier === 'large') {
    const singleAzDbNodes = nodeEstimates.filter(
      (n) => (n.serviceId === 'rds' || n.serviceId === 'aurora') && !n.isMultiAz
    );
    if (singleAzDbNodes.length > 0) {
      insights.push({
        id: 'db-ha-risk',
        title: 'Production database lacks Multi-AZ redundancy',
        description: `High-scale tier detected, but ${singleAzDbNodes
          .map((n) => n.serviceName)
          .join(', ')} is deployed in Single-AZ. Enable Multi-AZ to prevent failover downtime during AZ outages.`,
        type: 'warning',
      });
    }
  }

  return insights;
}

/**
 * Main FinOps calculation engine.
 * Computes itemized node costs, category aggregations, fixed vs usage split, and optimization insights.
 */
export function estimateArchitectureCost(
  nodes: CanvasNodeItem[],
  _edges: CanvasEdgeItem[],
  workloadTier: WorkloadTier = 'medium'
): ArchitectureCostEstimate {
  // Filter only visible active service nodes and boundaries
  const serviceNodes = nodes.filter((n) => !n.data?.isAnnotation);

  const nodeEstimates = serviceNodes.map((node) =>
    estimateSingleNodeCost(node, nodes, workloadTier)
  );

  const totalMonthlyCost = nodeEstimates.reduce((sum, n) => sum + n.monthlyCost, 0);

  // Compute percentage of total for each node
  nodeEstimates.forEach((n) => {
    n.percentageOfTotal = totalMonthlyCost > 0 ? Math.round((n.monthlyCost / totalMonthlyCost) * 100) : 0;
  });

  // Sort node estimates descending by cost
  nodeEstimates.sort((a, b) => b.monthlyCost - a.monthlyCost);

  // Fixed vs. Usage-based breakdown
  const fixedBaselineCost = nodeEstimates
    .filter((n) => n.billingModel === 'Fixed baseline')
    .reduce((sum, n) => sum + n.monthlyCost, 0);

  const usageBasedCost = nodeEstimates
    .filter((n) => n.billingModel === 'Usage-based')
    .reduce((sum, n) => sum + n.monthlyCost, 0);

  const fixedPercentage =
    totalMonthlyCost > 0 ? Math.round((fixedBaselineCost / totalMonthlyCost) * 100) : 0;
  const usagePercentage =
    totalMonthlyCost > 0 ? Math.max(0, 100 - fixedPercentage) : 0;

  const insights = generateCostInsights(nodeEstimates, totalMonthlyCost, workloadTier);

  return {
    workloadTier,
    totalMonthlyCost,
    fixedBaselineCost,
    usageBasedCost,
    fixedPercentage,
    usagePercentage,
    nodeEstimates,
    insights,
  };
}

/**
 * Generates an executive Markdown Bill of Materials & Cost table.
 */
export function exportBomAndCostToMarkdown(
  diagramName: string,
  costEstimate: ArchitectureCostEstimate,
  boundaryNodes: CanvasNodeItem[],
  edges: CanvasEdgeItem[]
): string {
  const { workloadTier, totalMonthlyCost, fixedBaselineCost, usageBasedCost, nodeEstimates, insights } =
    costEstimate;

  const tierLabel =
    workloadTier === 'small'
      ? 'Dev / Prototype (Small)'
      : workloadTier === 'large'
        ? 'High-Scale Enterprise (Large)'
        : 'Production / Startup (Medium)';

  const lines: string[] = [
    `# Architecture Bill of Materials (BOM) & FinOps Cost Estimate`,
    `*Diagram: ${diagramName}*`,
    `*Generated by AWS Compass Architecture Studio on ${new Date().toISOString().split('T')[0]}*`,
    '',
    `## Executive FinOps Summary`,
    `- **Workload Sizing Tier**: ${tierLabel}`,
    `- **Estimated Monthly Total**: **~$${totalMonthlyCost.toLocaleString()}/mo** (On-Demand us-east-1 baseline)`,
    `- **Fixed Hourly Infrastructure**: ~$${fixedBaselineCost.toLocaleString()}/mo (${costEstimate.fixedPercentage}%)`,
    `- **Variable Usage-Based Consumption**: ~$${usageBasedCost.toLocaleString()}/mo (${costEstimate.usagePercentage}%)`,
    `- **Active AWS Services**: ${nodeEstimates.filter((n) => n.monthlyCost > 0).length} paid, ${nodeEstimates.filter((n) => n.monthlyCost === 0).length
    } free/logical constructs`,
    `- **Group Boundaries**: ${boundaryNodes.length}`,
    `- **Inter-Service Data Flows**: ${edges.length}`,
    '',
    `## Itemized Resource & Monthly Cost Manifest`,
    `| Service Name | AWS ID | Category | Sizing Tier | Billing Model | Multi-AZ | Est. Cost ($/mo) | % of Total |`,
    `|---|---|---|---|---|---|---|---|`,
  ];

  nodeEstimates.forEach((n) => {
    const multiAzLabel = n.isMultiAz ? 'Yes' : 'No';
    const tierDisplay = n.effectiveTier === 'free' ? 'Free/0' : n.effectiveTier.toUpperCase();
    lines.push(
      `| ${n.serviceName} | \`${n.serviceId}\` | ${n.category} | ${tierDisplay} | ${n.billingModel} | ${multiAzLabel} | $${n.monthlyCost}/mo | ${n.percentageOfTotal}% |`
    );
  });

  lines.push(
    `| **Total Estimated Monthly Cost** | | | **${tierLabel}** | | | **~$${totalMonthlyCost.toLocaleString()}/mo** | **100%** |`
  );

  if (insights.length > 0) {
    lines.push('');
    lines.push(`## Architectural Cost Optimization Insights`);
    insights.forEach((insight) => {
      const saving = insight.estimatedSavingMonthly
        ? ` *(Est. Potential Saving: ~$${insight.estimatedSavingMonthly}/mo)*`
        : '';
      lines.push(`- **${insight.title}**${saving}: ${insight.description}`);
    });
  }

  lines.push('');
  return lines.join('\n');
}

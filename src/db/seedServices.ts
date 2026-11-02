// src/db/seedServices.ts
// Compiled AWS Service Catalog and Documentation Engine
// Powers all 230+ active AWS Services across 16 official AWS architectural domains.

import type { AWSService, AWSCatalogEntry } from '../types/aws';
import { AWS_CATALOG_DATA } from './awsCatalogData';
import { CUSTOM_LEGACY_DOCS } from './legacyCustomDocs';
import { getAWSCategoryColor } from '../utils/awsCategoryColors';

/**
 * Format a service ID or name into an authentic AWS service label
 */
function formatServiceDisplayName(id: string): string {
  const overrides: Record<string, string> = {
    client: 'Client / App',
    user: 'End User',
    'api-gateway': 'Amazon API Gateway',
    alb: 'Application Load Balancer',
    nlb: 'Network Load Balancer',
    cloudfront: 'Amazon CloudFront',
    route53: 'Amazon Route 53',
    s3: 'Amazon S3',
    dynamodb: 'Amazon DynamoDB',
    rds: 'Amazon RDS',
    aurora: 'Amazon Aurora',
    lambda: 'AWS Lambda',
    ec2: 'Amazon EC2',
    ecs: 'Amazon ECS',
    eks: 'Amazon EKS',
    fargate: 'AWS Fargate',
    sqs: 'Amazon SQS',
    sns: 'Amazon SNS',
    eventbridge: 'Amazon EventBridge',
    'step-functions': 'AWS Step Functions',
    kms: 'AWS KMS',
    secretsmanager: 'AWS Secrets Manager',
    'secrets-manager': 'AWS Secrets Manager',
    cloudwatch: 'Amazon CloudWatch',
    cloudtrail: 'AWS CloudTrail',
    iam: 'AWS IAM',
    waf: 'AWS WAF',
    shield: 'AWS Shield',
    quicksight: 'Amazon QuickSight',
    athena: 'Amazon Athena',
    glue: 'AWS Glue',
    kinesis: 'Amazon Kinesis',
    bedrock: 'Amazon Bedrock',
    sagemaker: 'Amazon SageMaker',
    cognito: 'Amazon Cognito',
    elasticache: 'Amazon ElastiCache',
    opensearch: 'Amazon OpenSearch',
    redshift: 'Amazon Redshift',
  };

  if (overrides[id]) return overrides[id];
  return id
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Deterministic compiler generating the strictly compliant 6-part documentation sheet
 * Adheres strictly to the Cloudscape Architecture documentation spec:
 * Section 1: 1-Sentence Core Purpose
 * Section 2: Architectural Primitives
 * Section 3: Enterprise Flow (Strictly flowchart LR, 4-5 real AWS nodes, 1-3 word edge labels, 1 clean subgraph, ZERO sequenceDiagram)
 * Section 4: Canvas Connections (Upstream Triggers & Downstream Targets)
 * Section 5: Exam & Production Gotchas
 * Section 6: 3 Production CLI Commands (with ${region}, ${accountId}, ${resourceName})
 */
export function compileServiceMarkdown(entry: AWSCatalogEntry): string {
  const shortName = entry.shortName || entry.name.replace(/^(Amazon|AWS)\s+/, '');
  const safeLabel = (text: string) => text.replace(/"/g, "'").trim();

  // Section 1: 1-Sentence Core Purpose
  const section1 = `## 1. 1 - Sentence Core Purpose\n${ entry.summary }`;

  // Section 2: Architectural Primitives
  const primitivesList =
    entry.primitives && entry.primitives.length > 0
      ? entry.primitives.map((p) => `- ** ${ p.name } **: ${ p.detail }`).join('\n')
      : `- ** Core Engine **: Fully managed execution engine and runtime primitives for ${ entry.name }.\n - ** Configuration & Policies **: Fine - grained IAM policies, resource tagging, and lifecycle configurations.\n - ** Operational Telemetry **: Integrated metrics, audit trails, and alarms emitted to Amazon CloudWatch.`;
  const section2 = `## 2. Architectural Primitives\n${ primitivesList } `;

  // Section 3: Enterprise Flow (Mermaid flowchart LR)
  const upNodes = (entry.flow.upstream || []).filter((u) => u !== entry.id);
  const downNodes = (entry.flow.downstream || []).filter((d) => d !== entry.id);

  const upstreamId = upNodes[0] || 'client';
  const upstreamLabel = formatServiceDisplayName(upstreamId);

const downstream1Id = downNodes[0] || 'cloudwatch';
const downstream1Label = formatServiceDisplayName(downstream1Id);

  const downstream2Id =
    downNodes[1] || (downstream1Id === 'cloudwatch' ? 'kms' : 'cloudwatch');
  const downstream2Label = formatServiceDisplayName(downstream2Id);

  const downstream3Id =
    downNodes[2] || (downstream2Id === 'kms' ? 's3' : 'kms');
  const downstream3Label = formatServiceDisplayName(downstream3Id);

  const edgeProtocol = entry.flow.edgeProtocol || 'HTTPS/REST';
  const protocolWord = edgeProtocol.split('/')[0].trim() || 'Forward';
  const subgraphLabel = entry.flow.subgraphLabel || `${ entry.category } Tier`;

  const section3 = `## 3. Enterprise Flow(Mermaid) \n\`\`\`mermaid
flowchart LR
    Upstream(["${safeLabel(upstreamLabel)}"]) -->|1. Ingest| SvcNode["${safeLabel(shortName)}"]

    subgraph Scope ["${safeLabel(subgraphLabel)}"]
        SvcNode
        TargetA["${safeLabel(downstream1Label)}"]
    end

    SvcNode -->|2. ${protocolWord}| TargetA
    TargetA -->|3. Persist| TargetB["${safeLabel(downstream2Label)}"]
    SvcNode -.->|4. Audit| TargetC["${safeLabel(downstream3Label)}"]
\`\`\``;

  // Section 4: Canvas Connections
  const upFormatted = (entry.flow.upstream || []).map(formatServiceDisplayName).join(', ');
  const downFormatted = (entry.flow.downstream || []).map(formatServiceDisplayName).join(', ');
  const section4 = `## 4. Canvas Connections\n- **Upstream Triggers**: ${upFormatted || 'Direct API/SDK, Client Application'}\n- **Downstream Targets**: ${downFormatted || 'Amazon CloudWatch, AWS KMS'}`;

  // Section 5: Exam & Production Gotchas
  const gotchasList =
      entry.gotchas && entry.gotchas.length > 0
        ? entry.gotchas.map((g) => `- ${g}`).join('\n')
        : `- **Least Privilege Scope**: Restrict access policies using condition keys to prevent unauthorized cross-service operations.\n- **High Availability**: Distribute critical workloads across multiple Availability Zones with automated health-check failover.\n- **Quota & Throttling Limits**: Monitor API invocation rates against regional service quotas using AWS Service Quotas and CloudWatch Alarms.`;
  const section5 = `## 5. Exam & Production Gotchas\n${gotchasList}`;

  // Section 6: 3 Production CLI Commands
  const cliCommandsFormatted =
    entry.cliCommands && entry.cliCommands.length > 0
      ? entry.cliCommands.map((c, i) => `# ${ i + 1 }. ${ c.description } \n${ c.command } `).join('\n\n')
      : `# 1. Describe active service status and configuration\n${ entry.cliPrefix || `aws ${entry.id}` } describe - ${ entry.id } --region \${ region } \n\n# 2. List resources with standard pagination\n${ entry.cliPrefix || `aws ${entry.id}` } list - ${ entry.id } s--max - items 20 --output table\n\n# 3. Inspect resource telemetry and operational health\n${ entry.cliPrefix || `aws ${entry.id}` } get - ${ entry.id } --id \${ resourceName } --region \${ region } `;
  const section6 = `## 6. 3 Production CLI Commands\n\`\`\`bash\n${cliCommandsFormatted}\n\`\`\``;

  return [section1, section2, section3, section4, section5, section6].join('\n\n');
}

/**
 * Returns default Lucide icon fallback string for service based on category and id
 */
function resolveServiceIcon(category: string, id: string): string {
  if (id.includes('database') || id.includes('rds') || id.includes('dynamo') || category === 'Database') return 'Database';
  if (id.includes('storage') || id.includes('s3') || id.includes('ebs') || id.includes('efs') || category === 'Storage') return 'HardDrive';
  if (category === 'Compute') return 'Server';
  if (category === 'Containers') return 'Box';
  if (category === 'Serverless') return 'Cpu';
  if (category.includes('Network')) return 'Network';
  if (category.includes('Security')) return 'Shield';
  if (category.includes('Integration')) return 'Workflow';
  if (category.includes('Analytics')) return 'BarChart3';
  if (category.includes('Machine Learning') || category.includes('AI')) return 'Brain';
  if (category.includes('Developer')) return 'Code2';
  if (category.includes('Management') || category.includes('Governance')) return 'Sliders';
  if (category.includes('Migration')) return 'ArrowRightLeft';
  if (category.includes('Front-End') || category.includes('Mobile')) return 'Smartphone';
  if (category.includes('IoT')) return 'Radio';
  if (category.includes('Financial')) return 'DollarSign';
  return 'Cloud';
}

/**
 * Master 230+ AWS Services Seed Dataset
 * Preserves custom hand-crafted documentation for foundational services,
 * dynamically compiles verified 6-part documentation for all other services.
 */
export const SEED_SERVICES: AWSService[] = AWS_CATALOG_DATA.map((entry, index) => {
  const customDoc = CUSTOM_LEGACY_DOCS[entry.id];
  const markdownDoc = customDoc || compileServiceMarkdown(entry);

  return {
    id: entry.id,
    name: entry.name,
    shortName: entry.shortName,
    category: entry.category,
    tier: entry.tier,
    isFavorite: false,
    summary: entry.summary,
    icon: resolveServiceIcon(entry.category, entry.id),
    color: getAWSCategoryColor(entry.category),
    arnExample: entry.arnPattern
      .replace(/\$\{region\}/g, 'us-east-1')
      .replace(/\$\{accountId\}/g, '123456789012')
      .replace(/\$\{resourceName\}/g, `${entry.id}-prod-primary`),
    docsUrl: entry.docsUrl || `https://docs.aws.amazon.com/${entry.id}/`,
    cliPrefix: entry.cliPrefix,
    markdownDoc,
    order: index,
    updatedAt: Date.now(),
  };
});

  export default SEED_SERVICES;

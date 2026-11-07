// src/utils/serviceComparisonEngine.ts
// Deterministic Architectural Trade-Off Engine for AWS Compass Concept Vault.
// Generates side-by-side matrices comparing 2 to 3 AWS services across 8 standardized dimensions.

import type { AWSService } from '../types/aws';
import { AWS_CATALOG_DATA } from '../db/awsCatalogData';

export interface ComparisonDimension {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
}

export const COMPARISON_DIMENSIONS: ComparisonDimension[] = [
  {
    id: 'role',
    label: 'Primary Architectural Role',
    shortLabel: 'Role',
    description: '1-sentence infrastructure capability and core engineering problem solved.',
  },
  {
    id: 'tier',
    label: 'Category & Complexity Tier',
    shortLabel: 'Category & Tier',
    description: 'AWS functional domain and operational maturity tier (T1 Core, T2 Enterprise, T3 Specialized).',
  },
  {
    id: 'scaling',
    label: 'Scaling & Concurrency Model',
    shortLabel: 'Scaling Model',
    description: 'How the service scales connections, throughput, workers, shards, or instances.',
  },
  {
    id: 'latency',
    label: 'Latency & Throughput Profile',
    shortLabel: 'Latency & Throughput',
    description: 'Response time expectations, network transit latency, and processing bandwidth.',
  },
  {
    id: 'state',
    label: 'State & Persistence',
    shortLabel: 'State & Durability',
    description: 'Storage durability guarantees, multi-AZ replication, and statefulness.',
  },
  {
    id: 'pricing',
    label: 'Pricing & Billing Dimension',
    shortLabel: 'Pricing Model',
    description: 'Primary cost drivers, idle base cost vs per-unit usage metrics.',
  },
  {
    id: 'fit',
    label: 'Primary Upstream / Downstream Fit',
    shortLabel: 'Topology Fit',
    description: 'Standard calling services (upstream) and target integration endpoints (downstream).',
  },
  {
    id: 'gotcha',
    label: 'When to Choose / Key Gotcha',
    shortLabel: 'Decision & Gotcha',
    description: 'Architectural sweet-spot selection rationale paired with critical production pitfalls.',
  },
];

export interface ComparisonPreset {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  serviceIds: [string, string] | [string, string, string];
}

export const COMPARISON_PRESETS: ComparisonPreset[] = [
  {
    id: 'preset-ingress',
    title: 'Load Balancing & Ingress',
    subtitle: 'ALB vs. NLB vs. API Gateway',
    category: 'Networking & Content Delivery',
    serviceIds: ['alb', 'nlb', 'api-gateway'],
  },
  {
    id: 'preset-messaging',
    title: 'Event & Messaging Buses',
    subtitle: 'SQS vs. SNS vs. EventBridge',
    category: 'Application Integration',
    serviceIds: ['sqs', 'sns', 'eventbridge'],
  },
  {
    id: 'preset-compute',
    title: 'Container & Serverless Compute',
    subtitle: 'Lambda vs. Fargate vs. EKS',
    category: 'Compute & Containers',
    serviceIds: ['lambda', 'fargate', 'eks'],
  },
  {
    id: 'preset-database',
    title: 'Relational vs. NoSQL Databases',
    subtitle: 'RDS vs. Aurora vs. DynamoDB',
    category: 'Database',
    serviceIds: ['rds', 'aurora', 'dynamodb'],
  },
  {
    id: 'preset-storage',
    title: 'File & Object Storage',
    subtitle: 'S3 vs. EFS vs. EBS',
    category: 'Storage',
    serviceIds: ['s3', 'efs', 'ebs'],
  },
  {
    id: 'preset-connectivity',
    title: 'Hybrid & VPC Connectivity',
    subtitle: 'VPC Peering vs. Transit Gateway vs. PrivateLink',
    category: 'Networking & Content Delivery',
    serviceIds: ['vpc', 'transit-gateway', 'privatelink'],
  },
  {
    id: 'preset-streaming',
    title: 'Data Streaming & Analytics',
    subtitle: 'Kinesis Streams vs. Data Firehose vs. MSK',
    category: 'Analytics',
    serviceIds: ['kinesis-streams', 'data-firehose', 'msk'],
  },
  {
    id: 'preset-secrets',
    title: 'Secrets & Configuration',
    subtitle: 'Secrets Manager vs. Parameter Store vs. KMS',
    category: 'Security & Management',
    serviceIds: ['secrets-manager', 'systems-manager', 'kms'],
  },
];

export interface ServiceDimensionCell {
  summary: string;
  badge?: string;
  badgeType?: 'core' | 'enterprise' | 'specialized' | 'neutral' | 'warning';
  subtext?: string;
  bulletPoints?: string[];
}

export interface ServiceComparisonRow {
  dimension: ComparisonDimension;
  cells: Record<string, ServiceDimensionCell>;
}

export interface ServiceComparisonMatrix {
  services: AWSService[];
  dimensions: ComparisonDimension[];
  rows: ServiceComparisonRow[];
}

/**
 * Curated deep architectural trade-off data for the 24 classic high-frequency services.
 * Supplies battle-tested, authoritative insights when comparing preset or catalog services.
 */
interface CuratedServiceProfile {
  role: string;
  scaling: string;
  scalingBullets?: string[];
  latency: string;
  latencyBullets?: string[];
  state: string;
  stateBullets?: string[];
  pricing: string;
  pricingBullets?: string[];
  fit: string;
  fitBullets?: string[];
  gotcha: string;
  gotchaBullets?: string[];
}

const CURATED_SERVICE_PROFILES: Record<string, CuratedServiceProfile> = {
  alb: {
    role: 'Layer 7 application proxy routing HTTP/HTTPS, gRPC, and WebSockets based on URL path, host header, and query parameters.',
    scaling: 'Dynamically scales Load Balancer Capacity Units (LCUs); handles hundreds of thousands of concurrent requests.',
    scalingBullets: [
      'Automatic elastic LCU scaling',
      'Pre-warming support for 10x sudden surges',
      'Cross-zone load balancing by default',
    ],
    latency: '3–10ms Layer 7 parsing and TLS termination overhead.',
    latencyBullets: ['TLS 1.3 hardware offloading', 'HTTP/2 and gRPC binary multiplexing'],
    state: 'Stateless proxy; supports sticky sessions via application/load-balancer cookies and connection draining.',
    stateBullets: ['Session stickiness (up to 7 days)', 'Graceful deregistration delay (1–3600s)'],
    pricing: '$0.0225/hr base fee + $0.008/LCU-hr (connections, active flows, bandwidth, rule evaluations).',
    pricingBullets: ['Fixed base fee per AZ ($16–$20/mo)', 'Metered by highest LCU dimension'],
    fit: 'Upstream: CloudFront, Route 53, Internet Gateway. Downstream: ECS Fargate, EKS Ingress, EC2 Target Groups, Lambda.',
    fitBullets: [
      'Direct AWS WAF ACL attachment',
      'Cognito / OIDC authentication offload at the edge',
    ],
    gotcha: 'Choose for modern HTTP container microservices and path-based routing. Gotcha: No static public IP assignment; DNS CNAME only.',
    gotchaBullets: [
      'Hard 4,000 targets limit per target group',
      'DNS-based resolution requires client HTTP libraries to respect DNS TTLs',
    ],
  },
  nlb: {
    role: 'Layer 4 ultra-high performance proxy terminating raw TCP/UDP/TLS at millions of requests/sec with dedicated static IPs.',
    scaling: 'Instantaneous hardware-level scaling handling sudden volatile traffic surges without pre-warming.',
    scalingBullets: [
      'Scales to millions of concurrent flows',
      'Directly mapped to elastic network interfaces (ENIs)',
      'Zero pre-warming ticket required',
    ],
    latency: 'Sub-millisecond ultra-low latency (under 1ms); bypasses application-layer processing.',
    latencyBullets: ['Kernel-bypass hardware acceleration', 'Minimal packet inspection overhead'],
    state: 'Stateless Layer 4 connection distributor; preserves original client source IP to target instances.',
    stateBullets: ['True client IP preservation without X-Forwarded-For', 'Target group health checks over TCP/HTTP'],
    pricing: '$0.0225/hr base fee + $0.006/NLCU-hr (new flows, active flows, and processed bytes).',
    pricingBullets: ['Slightly cheaper per NLCU than ALB', 'Charges apply per active AZ'],
    fit: 'Upstream: Route 53, Direct Connect, Client VPN. Downstream: EC2 instances, PrivateLink VPC Endpoint Services, Kubernetes NodePorts.',
    fitBullets: [
      'Foundation for AWS PrivateLink VPC endpoint services',
      'Ideal for gaming servers, IoT telemetry, and financial trading engines',
    ],
    gotcha: 'Choose for extreme throughput, static IP whitelisting, and non-HTTP protocols. Gotcha: Layer 7 features (URL rewriting, cookie stickiness) are unavailable.',
    gotchaBullets: [
      'Cannot terminate HTTP redirects or parse headers',
      'Cross-zone balancing incurs inter-AZ data transfer fees if not enabled carefully',
    ],
  },
  'api-gateway': {
    role: 'Fully managed serverless API management plane providing request validation, throttling, API keys, CORS, and auth offloading.',
    scaling: 'Serverless request-driven scaling up to 10,000 req/sec standard regional quota (burstable to 5,000).',
    scalingBullets: [
      'Account-level token bucket throttling (rate & burst)',
      'Usage plans with API key quota tracking',
      'Automatic multi-AZ redundancy',
    ],
    latency: '10–35ms overhead for authorizer validation, JSON schema evaluation, and gateway backend mapping.',
    latencyBullets: [
      'HTTP APIs provide lower latency (~10ms) than REST APIs (~30ms)',
      'Edge-optimized endpoints leverage CloudFront distribution points',
    ],
    state: 'Stateless API facade; optional provisioned stage caching (TTL 0.5s–3600s) and WebSocket connection state tracking.',
    stateBullets: ['Managed 2-way WebSocket connection tracking ($connectionId)', 'Optional provisioned in-memory cache'],
    pricing: 'Pay-per-request: $1.00/M requests (HTTP APIs); $3.50/M requests (REST APIs); zero hourly idle base fee.',
    pricingBullets: ['Zero charge when idle', 'Data transfer out billed at standard AWS rates'],
    fit: 'Upstream: Route 53, CloudFront, Mobile/SPA Clients. Downstream: AWS Lambda, Step Functions, EventBridge, VPC PrivateLink backends.',
    fitBullets: [
      'Direct service integration without intermediate Lambda compute',
      'Cognito User Pools & Lambda Authorizers native integration',
    ],
    gotcha: 'Choose for public serverless REST/HTTP APIs with auth, API keys, and rate limits. Gotcha: Strict 29-second integration timeout cannot be raised.',
    gotchaBullets: [
      '10MB payload size limit per request',
      'REST APIs cost 3.5x more than lightweight HTTP APIs',
    ],
  },
  sqs: {
    role: 'Distributed point-to-point message queuing service decoupling producers and consumers with backpressure buffering.',
    scaling: 'Standard queues offer virtually unlimited throughput; FIFO queues deliver up to 3,000 msg/sec with batching.',
    scalingBullets: ['Auto-scales to billions of queued messages', 'Horizontal worker pool consumption'],
    latency: '10–50ms polling response; pull-based consumer model with long-polling (up to 20s).',
    latencyBullets: ['Short polling vs long polling (WaitTimeSeconds)', 'Message visibility timeout window (0s–12h)'],
    state: 'Durable message retention from 1 minute to 14 days (default 4 days); dead-letter queue (DLQ) support.',
    stateBullets: ['At-least-once delivery (Standard)', 'Exactly-once processing & ordering (FIFO)'],
    pricing: '$0.40 per million requests (first 1M free/month); billed in 64KB message payload chunks.',
    pricingBullets: ['Zero hourly idle fee', 'Batch operations (10 messages) billed as 1 request'],
    fit: 'Upstream: API Gateway, SNS subscriptions, Lambda, S3 event notifications. Downstream: EC2 workers, ECS tasks, Lambda event source mapping.',
    fitBullets: ['Native Lambda event source mapping with automated batching', 'Ideal for asynchronous task queues'],
    gotcha: 'Choose for 1-to-1 asynchronous worker decoupling and absorbing traffic spikes. Gotcha: Standard queues deliver at-least-once, requiring idempotent consumers.',
    gotchaBullets: [
      'Max message payload is 256KB (use S3 Extended Client for larger payloads)',
      'FIFO queues require MessageGroupId and MessageDeduplicationId',
    ],
  },
  sns: {
    role: 'High-throughput publish/subscribe push messaging service broadcasting notifications to thousands of subscribers simultaneously.',
    scaling: 'Massive push fan-out scaling; virtually unlimited messages/sec for Standard topics; FIFO topics support up to 3,000 msg/sec.',
    scalingBullets: ['Millions of subscribers per topic', 'Instantaneous concurrent delivery'],
    latency: 'Sub-100ms push delivery to HTTP/HTTPS webhooks, Lambda functions, and SQS queue endpoints.',
    latencyBullets: ['Near real-time push model', 'Zero consumer polling delay'],
    state: 'Transient transport layer with no durable storage (drops message if subscriber is unreachable unless backed by SQS or dead-letter queue).',
    stateBullets: ['Subscriber-level dead-letter queues', 'Message filtering policies applied at subscription'],
    pricing: '$0.50 per million API requests + delivery fees ($0.50/M to SQS/Lambda, $2.00/M to HTTP endpoints, $0.75/M mobile push).',
    pricingBullets: ['First 1M requests free per month', 'SMS delivery priced per country'],
    fit: 'Upstream: CloudWatch Alarms, EventBridge, S3, internal microservices. Downstream: SQS queues (fan-out pattern), Lambda, Email, SMS, Webhooks.',
    fitBullets: [
      'SNS -> multiple SQS queues (classic fan-out decoupling)',
      'Direct mobile push notifications (APNs, FCM)',
    ],
    gotcha: 'Choose for 1-to-many broadcasting and immediate push notifications. Gotcha: Push delivery can overwhelm unthrottled downstream HTTP webhooks.',
    gotchaBullets: [
      'No message retention; cannot replay historical messages',
      'HTTP endpoints must handle sudden concurrency spikes',
    ],
  },
  eventbridge: {
    role: 'Serverless event bus routing JSON events across 30+ AWS services, SaaS partners, and custom applications using declarative rules.',
    scaling: 'Managed serverless throughput handling up to 10,000 events/sec per bus (regional soft limit, adjustable).',
    scalingBullets: ['Content-based pattern matching rules', 'Schema Registry with code bindings'],
    latency: '200–500ms typical end-to-end routing latency; optimized for routing intelligence over sub-millisecond speed.',
    latencyBullets: ['Rule evaluation pipeline overhead', 'Event bus cross-account dispatch'],
    state: 'Configurable event archive and replay capability; dead-letter queues on targets; events expire if unrouted.',
    stateBullets: ['Immutable event archive with custom retention', 'Event replay for disaster recovery & testing'],
    pricing: '$1.00 per million custom events ingested; free ingestion for native AWS service events and SaaS partner events.',
    pricingBullets: ['No base infrastructure fee', 'Event archive storage billed at $0.023/GB-mo'],
    fit: 'Upstream: AWS service state changes, SaaS apps (Datadog, Zendesk, Stripe), custom microservices. Downstream: Step Functions, Lambda, SQS, Kinesis, CodePipeline.',
    fitBullets: [
      'EventBridge Pipes for point-to-point enrichment',
      'EventBridge Scheduler for millions of cron tasks',
    ],
    gotcha: 'Choose for choreographing event-driven architectures based on payload contents. Gotcha: Slower latency (~300ms) makes it unsuitable for real-time synchronous RPC.',
    gotchaBullets: [
      'Max 300 rules per event bus and max 5 targets per rule',
      '256KB max payload limit per event',
    ],
  },
  lambda: {
    role: 'Event-driven serverless compute service executing ephemeral code functions with automated zero-admin provisioning.',
    scaling: 'Rapid sub-second scaling per request up to 1,000 concurrent executions per region (default quota, burstable).',
    scalingBullets: ['Automatic horizontal container concurrency', 'Provisioned Concurrency eliminates cold starts'],
    latency: 'Sub-second execution; cold starts range from 80ms (Node.js/Python) to 1–2s (Java/.NET/VPC ENI attachment).',
    latencyBullets: ['SnapStart for Java reduces cold starts up to 90%', 'Arm64 Graviton2 yields 20% lower latency'],
    state: 'Strictly stateless runtime; 512MB to 10GB ephemeral `/tmp` disk storage; mountable to Amazon EFS for shared files.',
    stateBullets: ['Memory allocation 128MB to 10,240MB', 'CPU allocation scales proportionally with memory'],
    pricing: '$0.20 per million requests + $0.0000166667 per GB-second of execution time (billed to nearest 1ms).',
    pricingBullets: ['Zero cost when idle', 'Generous 1M requests & 3.2M seconds free tier/mo'],
    fit: 'Upstream: API Gateway, S3 triggers, SQS, EventBridge, DynamoDB Streams. Downstream: DynamoDB, RDS, S3, Secrets Manager.',
    fitBullets: ['Native IAM execution role per function', 'Lambda Function URLs for direct HTTP endpoints'],
    gotcha: 'Choose for event-driven workflows, asynchronous jobs, and spiky microservices. Gotcha: 15-minute maximum execution timeout is an unchangeable hard AWS limit.',
    gotchaBullets: [
      'Relational database connections can saturate without RDS Proxy',
      'Container images capped at 10GB',
    ],
  },
  fargate: {
    role: 'Serverless container compute engine running standard Docker images on ECS or EKS without managing underlying EC2 worker nodes.',
    scaling: 'Scales container tasks based on CPU/memory utilization, CloudWatch alarms, or SQS backlog metrics.',
    scalingBullets: ['Auto Scaling based on target tracking policies', 'Task launch latency typically 30–75 seconds'],
    latency: 'Sub-millisecond execution once tasks are warm; handles long-lived daemon processes and persistent TCP connections.',
    latencyBullets: ['Zero cold start on running tasks', 'Fast inter-service communication via AWS Cloud Map'],
    state: 'Ephemeral container root filesystem (20GB default, up to 200GB); mountable to Amazon EFS; no raw EBS volume mounting.',
    stateBullets: ['Dedicated VPC ENI per task with private IP', 'Support for ReadOnlyRootFilesystem security'],
    pricing: 'Pay strictly for provisioned vCPU-hour ($0.04048) and GB-hour ($0.004445); 1-minute minimum billing increment.',
    pricingBullets: ['Fargate Spot offers up to 70% discount', 'Zero idle cluster management fees'],
    fit: 'Upstream: ALB, NLB, EventBridge Scheduled Tasks, SQS worker consumers. Downstream: Aurora, ElastiCache, S3, KMS.',
    fitBullets: ['ECS Service Connect for service-to-service mesh', 'CloudWatch Container Insights telemetry'],
    gotcha: 'Choose for long-running microservices, web apps, and batch jobs without K8s complexity. Gotcha: Task launch delay (45s+) is too slow for instantaneous spiky bursts.',
    gotchaBullets: [
      'No GPU instance support on Fargate (requires EC2 launch type)',
      'No privileged mode container access or daemonsets',
    ],
  },
  eks: {
    role: 'Managed Kubernetes control plane orchestrating complex container fleets, custom operators, and multi-tenant workloads.',
    scaling: 'Dual-layer scaling: Node autoscaling via Karpenter / Cluster Autoscaler + Pod scaling via HPA and KEDA.',
    scalingBullets: ['Karpenter launches right-sized EC2 nodes in seconds', 'KEDA enables event-driven pod autoscaling'],
    latency: 'Microsecond inter-pod network latency using AWS VPC CNI plugin with direct VPC IP allocation.',
    latencyBullets: ['eBPF accelerated routing via Cilium', 'Direct pod-to-pod networking without overlay tunnels'],
    state: 'Stateful and stateless workloads supported; PersistentVolumes backed by EBS (gp3/io2), EFS, and local NVMe storage.',
    stateBullets: ['StatefulSets with automated volume attachments', 'Multi-AZ pod topology spread constraints'],
    pricing: '$0.10/hour ($73/mo) fixed cluster control plane fee + underlying EC2 or Fargate compute instances.',
    pricingBullets: ['Fixed base cluster cost whether running 1 pod or 500', 'Managed node groups billed at standard EC2 rates'],
    fit: 'Upstream: AWS Load Balancer Controller (ALB/NLB), Route 53. Downstream: Managed databases, external APIs, service mesh microservices.',
    fitBullets: [
      'IRSA (IAM Roles for Service Accounts) fine-grained auth',
      'Helm chart and GitOps (ArgoCD/Flux) deployment pipelines',
    ],
    gotcha: 'Choose for Kubernetes standardization, custom operators, and complex microservice meshes. Gotcha: High operational complexity and fixed cluster management overhead.',
    gotchaBullets: [
      'Control plane upgrades required every 14 months',
      'VPC IP address exhaustion risk without secondary CIDR or IPv6',
    ],
  },
  rds: {
    role: 'Managed relational database engine (PostgreSQL, MySQL, MariaDB, SQL Server, Oracle) with automated backups and read replicas.',
    scaling: 'Vertical instance resizing (requires brief failover); up to 15 read replicas; connection scaling limited by database RAM.',
    scalingBullets: ['Storage autoscaling up to 64TB', 'Read replicas for read-heavy offloading'],
    latency: 'Single-digit millisecond query latency (1–5ms); throughput bounded by instance CPU/RAM and EBS storage IOPS.',
    latencyBullets: ['Multi-AZ synchronous replication overhead (~1-2ms)', 'RDS Proxy provides connection pooling'],
    state: 'Durable EBS storage volume attached to primary instance; Multi-AZ synchronous standby failover (60–120s failover time).',
    stateBullets: ['Automated daily snapshots + point-in-time recovery (PITR)', 'Multi-AZ standby node in separate AZ'],
    pricing: 'Hourly provisioned DB instance fee + provisioned storage ($0.115/GB-mo gp3) + provisioned IOPS + backup storage.',
    pricingBullets: ['Multi-AZ doubles the instance and storage cost', 'Reserved Instances offer up to 60% savings'],
    fit: 'Upstream: EC2, ECS, RDS Proxy, Lambda. Downstream: CloudWatch Metrics, S3 (snapshot exports), IAM authentication.',
    fitBullets: ['RDS Proxy buffers serverless connection storms', 'Direct IAM database authentication support'],
    gotcha: 'Choose for standard SQL workloads, legacy schema compatibility, and predictable load. Gotcha: Failover causes 60–120 seconds of complete connection disruption.',
    gotchaBullets: [
      'Vertical scaling requires instance downtime or failover',
      'Connection pooling mandatory for serverless consumers',
    ],
  },
  aurora: {
    role: 'Cloud-native enterprise relational database with decoupled compute and distributed self-healing multi-AZ storage architecture.',
    scaling: 'Storage auto-scales up to 128TB; up to 15 low-latency read replicas (<10ms lag); Aurora Serverless v2 scales compute in ACUs.',
    scalingBullets: ['Serverless v2 scales compute in 0.5 ACU increments in seconds', 'Reader instances scale automatically based on CPU'],
    latency: 'Sub-millisecond to low single-digit ms queries; up to 5x throughput over standard MySQL and 3x over PostgreSQL.',
    latencyBullets: ['Storage I/O offloaded to distributed storage tier', 'Fast read replica promotion under 30 seconds'],
    state: 'Continuous 6-way storage replication across 3 AZs; survives loss of 2 copies without affecting write availability and 3 without affecting reads.',
    stateBullets: ['Self-healing disk blocks in 10GB chunks', 'Global Database replication lag under 1 second'],
    pricing: 'ACU-hours ($0.12/ACU-hr) or provisioned instances + replicated storage ($0.10/GB-mo) + I/O requests ($0.20/M requests).',
    pricingBullets: ['Aurora I/O-Optimized pricing option removes I/O charges', 'Higher base entry cost than standard RDS'],
    fit: 'Upstream: ECS Fargate, EKS, Lambda, RDS Proxy. Downstream: S3 (automated loading), Aurora Machine Learning, CloudWatch Logs.',
    fitBullets: [
      'Aurora Serverless v2 handles volatile traffic spikes',
      'Parallel query acceleration for analytical aggregations',
    ],
    gotcha: 'Choose for mission-critical enterprise SQL needing rapid failover (<30s), high concurrency, and automated storage growth. Gotcha: Substantially higher baseline cost than standard RDS.',
    gotchaBullets: [
      'I/O request billing can lead to unexpected bills without I/O-Optimized mode',
      'Database cloning creates instant copy-on-write environments',
    ],
  },
  dynamodb: {
    role: 'Fully managed distributed NoSQL key-value and document database delivering single-digit millisecond latency at any scale.',
    scaling: 'On-Demand mode auto-scales to hundreds of thousands of read/write requests/sec across horizontally partitioned hash tables.',
    scalingBullets: ['Automated partition splitting based on data & throughput', 'Push-button provisioned capacity with Auto Scaling'],
    latency: 'Consistent single-digit millisecond (under 10ms) read/write latency; sub-millisecond with DynamoDB Accelerator (DAX).',
    latencyBullets: ['Consistent latency regardless of table data size', 'DAX in-memory cache provides microsecond reads'],
    state: 'Durable automatic replication across 3 AZs; optional Global Tables for active-active multi-region replication in under 1 second.',
    stateBullets: ['Point-in-Time Recovery (PITR) for continuous backup', 'Item TTL automatically deletes expired records'],
    pricing: 'Pay-per-request ($0.625/M writes, $0.125/M reads) or provisioned capacity mode + $0.25/GB-month table storage.',
    pricingBullets: ['25GB storage and 25 WCU/RCU free tier forever', 'Zero base fee in On-Demand mode when idle'],
    fit: 'Upstream: AWS Lambda, API Gateway, AppSync, App Runner. Downstream: DynamoDB Streams -> Lambda, EventBridge Pipes, Kinesis.',
    fitBullets: [
      'DynamoDB Streams triggers change-data-capture workflows',
      'Single-table design models complex relational patterns',
    ],
    gotcha: 'Choose for massive scale, predictable sub-10ms lookups, serverless apps, and key-value access. Gotcha: No ad-hoc joins or flexible SQL queries; access patterns must be known beforehand.',
    gotchaBullets: [
      '400KB maximum item size limit',
      'Hot partition throttling if partition key is poorly distributed',
    ],
  },
  s3: {
    role: 'Exabyte-scale object storage service accessed over HTTPS/REST with fine-grained tiering, versioning, and lifecycle automation.',
    scaling: 'Virtually unlimited storage capacity; auto-scales to 3,500 PUT/POST and 5,500 GET requests/sec per prefix without partitioning limits.',
    scalingBullets: ['Partition prefixes scale throughput horizontally', 'No pre-provisioning required'],
    latency: '20–100ms first-byte latency over HTTP; massive aggregate multi-GB/s parallel throughput using multipart uploads.',
    latencyBullets: ['S3 Express One Zone delivers single-digit ms latency', 'S3 Transfer Acceleration speeds global uploads via CloudFront'],
    state: '99.999999999% (11 9s) durability across minimum 3 AZs; Object Lock (WORM), Versioning, and Cross-Region Replication (CRR).',
    stateBullets: ['Strong read-after-write consistency for PUTs and DELETEs', 'Intelligent-Tiering automatically optimizes costs'],
    pricing: 'Tiered storage pricing (Standard: $0.023/GB-mo, Glacier Flexible: $0.0036/GB-mo) + API request fees ($0.005/1k PUTs) + egress transfer.',
    pricingBullets: ['No minimum volume commitment', 'Lifecycle rules transition stale objects to cold tiers'],
    fit: 'Upstream: CloudFront, API clients, Backup agents, Data Firehose. Downstream: Athena, Lambda (event notifications), Macie.',
    fitBullets: [
      'S3 Event Notifications trigger Lambda/SQS/EventBridge',
      'Static website hosting and CloudFront origin',
    ],
    gotcha: 'Choose for static assets, data lakes, backups, and media files accessed via web APIs. Gotcha: Not a mountable filesystem; append/update operations require rewriting the entire object.',
    gotchaBullets: [
      '5TB maximum single object size limit',
      'Public access blocked by default (S3 Block Public Access)',
    ],
  },
  efs: {
    role: 'Elastic serverless POSIX NFS shared filesystem mountable concurrently by thousands of compute instances and containers.',
    scaling: 'Automatically grows and shrinks elastically up to petabytes; scales throughput up to 10+ GB/s based on provisioned or elastic mode.',
    scalingBullets: ['Elastic throughput mode scales on demand', 'Concurrent mount access from EC2, ECS, and Lambda'],
    latency: 'Low single-digit millisecond latency (1–3ms); NFS network file locking overhead can slow down millions of small file reads.',
    latencyBullets: ['General Purpose performance mode (lowest latency)', 'Max I/O mode for big data parallel compute clusters'],
    state: 'Multi-AZ durability by default (One Zone storage class available for 47% cost savings); automated lifecycle tiering to Infrequent Access.',
    stateBullets: ['POSIX compliant permissions (file locks, chmod, chown)', 'Native encryption at rest and in transit'],
    pricing: '$0.30/GB-month for Standard storage; $0.016/GB-month for Infrequent Access + elastic throughput charges ($0.03/GB read).',
    pricingBullets: ['Lifecycle management reduces blended cost by up to 90%', 'Pay strictly for storage consumed'],
    fit: 'Upstream: ECS Fargate tasks, AWS Lambda functions, EC2 autoscaling groups. Downstream: AWS Backup, CloudWatch Metrics.',
    fitBullets: [
      'Mount directly into Lambda functions via VPC ENI',
      'Shared content management systems (WordPress, Drupal, Jenkins home)',
    ],
    gotcha: 'Choose when multiple containers or EC2 instances need concurrent read/write access to shared file trees. Gotcha: Substantially more expensive per GB ($0.30) than S3 ($0.023) or EBS ($0.08).',
    gotchaBullets: [
      'Linux POSIX only (no native Windows SMB support; use FSx for Windows)',
      'Bursting throughput mode can exhaust burst credits on small filesystems',
    ],
  },
  ebs: {
    role: 'Low-latency raw block storage volumes attached over dedicated NVMe buses to single Amazon EC2 compute instances.',
    scaling: 'Fixed provisioned volume size (up to 64TB per volume); IOPS and throughput scale based on volume type (gp3, io2 Block Express).',
    scalingBullets: ['Elastic Volumes allow dynamic size & IOPS expansion without downtime', 'gp3 decouples IOPS from storage size'],
    latency: 'Sub-millisecond to single-digit millisecond access over dedicated PCIe/NVMe channels; io2 delivers up to 256,000 IOPS.',
    latencyBullets: ['Sub-millisecond average latency on SSD volumes', 'Dedicated EBS-optimized instance network bandwidth'],
    state: 'AZ-scoped durability (99.8% to 99.999%); snapshot backups stored durably in Amazon S3; Multi-Attach available for io2 within 1 AZ.',
    stateBullets: ['Point-in-time incremental crash-consistent snapshots', 'Enforced encryption using AWS KMS keys'],
    pricing: 'Provisioned capacity pricing (gp3: $0.08/GB-mo + $0.005/provisioned IOPS above 3,000) whether data is written or not.',
    pricingBullets: ['Billed for allocated capacity, not used bytes', 'io2 Block Express is premium priced for extreme databases'],
    fit: 'Upstream: EC2 operating systems, relational database data directories (PostgreSQL, MySQL). Downstream: EBS Snapshots, Data Lifecycle Manager.',
    fitBullets: [
      'Direct root boot drive for all EC2 instances',
      'High-performance OLTP database storage',
    ],
    gotcha: 'Choose for OS boot drives, database data files, and high-performance random I/O. Gotcha: Tied strictly to a single AZ; cannot be shared across regions or mounted over HTTP.',
    gotchaBullets: [
      'Volume is bound to a single AZ (cannot attach to EC2 in another AZ)',
      'Unattached volumes continue incurring full hourly storage charges',
    ],
  },
  vpc: {
    role: 'Logically isolated virtual network providing private IP subnets, route tables, network gateways, and VPC Peering connections.',
    scaling: 'VPC Peering scales as a point-to-point mesh (N*(N-1)/2); zero bandwidth bottleneck or single point of failure.',
    scalingBullets: ['Direct line-rate throughput between peered VPCs', 'No intermediary hardware device bottleneck'],
    latency: 'Lowest possible latency; identical to intra-AWS backbone routing without gateway hops.',
    latencyBullets: ['Zero gateway processing delay', 'Full MTU 9001 jumbo frames support within region'],
    state: 'Stateless routing table entries; requires non-overlapping CIDR blocks; no transitive routing capability.',
    stateBullets: ['Explicit route table target (`pcx-...`)', 'Security groups reference peered security group IDs'],
    pricing: '$0.00 base hourly fee (VPC Peering is completely free to create); standard inter-AZ/inter-region data transfer fees apply ($0.01/GB).',
    pricingBullets: ['Zero hourly connection fee', 'Same-AZ intra-region peering is free'],
    fit: 'Upstream: Private subnets in VPC A. Downstream: Private subnets in VPC B (e.g. shared services, database tier).',
    fitBullets: [
      'Direct connection between 2 VPCs with dedicated workloads',
      'Cross-account VPC peering within same or different regions',
    ],
    gotcha: 'Choose for low-complexity environments with 2–5 VPCs needing maximum throughput and zero hourly cost. Gotcha: No transitive routing (VPC A <-> B <-> C does not allow A to talk to C).',
    gotchaBullets: [
      'CIDRs must strictly not overlap (cannot peer 10.0.0.0/16 with 10.0.0.0/16)',
      'Mesh scaling becomes unmanageable beyond ~10 VPCs',
    ],
  },
  'transit-gateway': {
    role: 'Regional network transit hub interconnecting hundreds of VPCs, on-premises networks, and SD-WAN appliances with central route control.',
    scaling: 'Hub-and-spoke architecture supporting up to 5,000 attachments and 50 Gbps maximum bandwidth per VPC attachment.',
    scalingBullets: ['Interconnects thousands of VPCs into a central hub', 'Supports Transit Gateway Peering across AWS regions'],
    latency: 'Single additional network hop latency (~1ms); centralized route table management and packet inspection.',
    latencyBullets: ['Consistent sub-2ms transit latency', 'Equal-Cost Multi-Path (ECMP) routing for VPN connections'],
    state: 'Centralized routing state with multiple route tables, route propagation, multicast domains, and appliance mode for firewalls.',
    stateBullets: ['Multiple isolated route tables (e.g. Prod, Dev, Shared)', 'Appliance Mode ensures symmetric firewall traffic'],
    pricing: '$0.05 per attachment per hour ($36.50/mo per VPC) + $0.02 per GB of data processed through the transit hub.',
    pricingBullets: ['Significant data processing costs on high-volume traffic', 'Separate attachment fee for Direct Connect & VPN'],
    fit: 'Upstream: Direct Connect Gateway, Site-to-Site VPN, Core VPCs. Downstream: Spoke application VPCs, inspection VPCs (Network Firewall).',
    fitBullets: [
      'Centralized egress VPC for all outbound internet traffic',
      'Inspection VPC pattern with inline firewall appliances',
    ],
    gotcha: 'Choose for enterprise hub-and-spoke networks with 10+ VPCs, hybrid on-premises connectivity, and centralized inspection. Gotcha: $0.02/GB processing fee can become very expensive at scale.',
    gotchaBullets: [
      'Hourly attachment fees add up across dozens of VPCs',
      'Max 50 Gbps throughput per VPC attachment (requires multiple attachments for higher throughput)',
    ],
  },
  privatelink: {
    role: 'Secure private unidirectional connectivity exposing specific services to consumer VPCs via Elastic Network Interfaces (ENIs).',
    scaling: 'Service-level endpoint scaling; handles tens of thousands of requests/sec per interface endpoint without IP conflicts.',
    scalingBullets: ['Scales across AZs with independent ENIs', 'Zero risk of IP space conflicts across organizations'],
    latency: 'Sub-millisecond latency within AZ; high-bandwidth throughput per ENI without touching public internet or VPC route tables.',
    latencyBullets: ['Direct ENI communication over AWS hyperplane', 'No NAT Gateway traversal required for AWS APIs'],
    state: 'Unidirectional connection state; consumer accesses provider service over private IP without network-level peering or CIDR overlap issues.',
    stateBullets: ['Endpoint service accepts/rejects consumer connection requests', 'Provider never sees or accesses consumer VPC'],
    pricing: '$0.01 per interface endpoint per hour ($7.30/mo per AZ) + $0.01 per GB of data processed.',
    pricingBullets: ['Gateway endpoints for S3 and DynamoDB are 100% free', 'Cost scales with number of interface endpoints deployed'],
    fit: 'Upstream: Consumer VPC workloads (Lambda, EC2, ECS). Downstream: AWS SaaS providers, internal microservices, AWS services (S3/DynamoDB).',
    fitBullets: [
      'Secure access to AWS services without Internet Gateway or NAT Gateway',
      'Publishing SaaS platforms to customer VPCs securely',
    ],
    gotcha: 'Choose when publishing services to other accounts/VPCs with overlapping CIDRs or strict security requirements. Gotcha: Unidirectional only; consumer cannot accept inbound connections from provider.',
    gotchaBullets: [
      'Requires an interface endpoint in every AZ to prevent cross-AZ data fees',
      'Only supports TCP-based protocols (no UDP or ICMP)',
    ],
  },
  'kinesis-streams': {
    role: 'Real-time durable data streaming service ingesting millions of events/sec for custom stream processing applications.',
    scaling: 'Sharded architecture (Provisioned: 1MB/s in, 2MB/s out per shard) or On-Demand mode scaling automatically up to GBs/sec.',
    scalingBullets: ['On-Demand mode scales automatically based on throughput', 'Enhanced fan-out provides dedicated consumer throughput'],
    latency: 'Real-time sub-second latency (200–500ms); enhanced fan-out provides dedicated 2MB/s throughput with ~70ms latency.',
    latencyBullets: ['Standard consumer shared 2MB/s read limit', 'HTTP/2 push streaming with Enhanced Fan-Out'],
    state: 'Durable distributed append-only log with configurable retention from 24 hours up to 365 days; immutable ordered records.',
    stateBullets: ['Data replicated across 3 AZs synchronously', 'Sequence numbers guarantee per-shard ordering'],
    pricing: 'Provisioned: $0.015/shard-hr + $0.014/1M PUT units. On-Demand: $0.04/stream-hr + $0.08/GB data ingested.',
    pricingBullets: ['Extended data retention (>24h) incurs small storage fee', 'Enhanced fan-out incurs consumer-shard-hour charges'],
    fit: 'Upstream: IoT Core, CloudWatch Logs, SDK producers, API Gateway. Downstream: Kinesis Data Analytics, Lambda, Apache Flink, EC2 consumers.',
    fitBullets: [
      'Lambda event source mapping with parallelization factor',
      'Kinesis Client Library (KCL) for stateful stream processing',
    ],
    gotcha: 'Choose for custom real-time event stream processing needing sub-second latency and multiple independent consumers. Gotcha: Requires custom consumer logic (KCL/Lambda) to handle checkpoints and shard management.',
    gotchaBullets: [
      '1MB or 1,000 records per second write limit per provisioned shard',
      'Out-of-order records across different partition keys',
    ],
  },
  'data-firehose': {
    role: 'Fully managed ETL streaming delivery service capturing, transforming, and loading streaming data into data lakes and warehouses.',
    scaling: 'Automated serverless scaling buffer; scales up to thousands of records/sec based on buffer size (1–128MB) and interval (60–900s).',
    scalingBullets: ['Zero shard provisioning or cluster management', 'Automatic buffer auto-tuning based on target ingestion rates'],
    latency: 'Near real-time batched delivery (60s minimum interval or 1MB threshold); optimized for bulk ingestion rather than millisecond processing.',
    latencyBullets: ['Configurable buffer hints (size in MB vs time in seconds)', 'Inline Lambda transformation adds slight delay'],
    state: 'Ephemeral in-flight buffer; temporary backup of unprocessed or failed records to Amazon S3 for error recovery.',
    stateBullets: ['Automatic retry with S3 error logging', 'Dynamic partitioning writes data directly to S3 partitioned keys'],
    pricing: 'Pay purely per GB ingested ($0.029/GB for first 500TB/mo); optional dynamic partitioning ($0.02/GB) and format conversion charges.',
    pricingBullets: ['Zero base fee when no data flows', 'Billed in 5KB increments per record'],
    fit: 'Upstream: Kinesis Data Streams, CloudWatch Logs, IoT Core, Direct HTTP producers. Downstream: Amazon S3, Redshift, OpenSearch, Splunk, Datadog.',
    fitBullets: [
      'Direct conversion to Apache Parquet / ORC format for Athena queries',
      'Direct ingestion into Amazon Redshift and OpenSearch Service',
    ],
    gotcha: 'Choose for zero-code ingestion pipelines loading streaming logs directly into S3, OpenSearch, or Redshift. Gotcha: Not real-time (minimum 60s buffer delay); cannot be consumed by custom interactive consumer apps.',
    gotchaBullets: [
      'Cannot be queried interactively; delivery-only pipeline',
      'Inline Lambda transformation has 5-minute timeout',
    ],
  },
  msk: {
    role: 'Fully managed, highly available Apache Kafka cluster service running open-source Kafka APIs and standard client ecosystems.',
    scaling: 'Broker-based scaling (provisioned broker instances) or MSK Serverless automatically managing partition capacity and memory.',
    scalingBullets: ['Multi-broker scaling up to hundreds of brokers', 'MSK Serverless scales partitions on demand'],
    latency: 'Ultra-low latency (single-digit milliseconds, 5–15ms) high-throughput message bus supporting millions of events/sec.',
    latencyBullets: ['Direct TCP socket Kafka wire protocol', 'Zero API wrapper latency overhead'],
    state: 'Persistent Kafka topic partition logs backed by EBS or tiered storage for indefinite data retention.',
    stateBullets: ['Configurable topic replication factor (min 3 across 3 AZs)', 'Tiered storage offloads cold log segments to S3 automatically'],
    pricing: 'Hourly broker instance charges (e.g. kafka.m5.large: $0.21/hr per broker, min 3 brokers = ~$450/mo) + provisioned storage.',
    pricingBullets: ['MSK Serverless: $0.75/cluster-hr + $0.10/GB in + $0.05/GB out', 'High fixed monthly minimum for provisioned clusters'],
    fit: 'Upstream: Kafka Producer APIs, Kafka Connect, Debezium CDC, Microservices. Downstream: Kafka Streams, Apache Flink, Spark, Snowflake, RDS.',
    fitBullets: [
      'Drop-in replacement for existing open-source Apache Kafka applications',
      'AWS Glue Schema Registry for Avro / Protobuf schema enforcement',
    ],
    gotcha: 'Choose when the enterprise already uses the Apache Kafka ecosystem, Kafka Connect, or multi-cloud streaming architectures. Gotcha: High minimum monthly cost compared to serverless alternatives.',
    gotchaBullets: [
      'Provisioned clusters require broker sizing and partition planning',
      'Kafka version upgrades require planned maintenance orchestration',
    ],
  },
  'secrets-manager': {
    role: 'Dedicated secret lifecycle manager providing automated rotation, fine-grained access control, and cross-account replication.',
    scaling: 'Regional API rate limit of 10,000 requests/sec for GetSecretValue; highly scalable across client SDKs.',
    scalingBullets: ['Client-side caching libraries reduce API rate consumption', 'Cross-region replication to multiple target regions'],
    latency: 'Low latency API retrieval (15–40ms); client-side caching (AWS Secrets Manager caching library) recommended.',
    latencyBullets: ['In-memory caching avoids repeated network calls', 'Direct integration with RDS IAM credentials'],
    state: 'Durable encrypted secret storage with automated version staging labels (AWSCURRENT, AWSPREVIOUS); cross-region replication.',
    stateBullets: ['Automated Lambda-based password rotation for RDS/Redshift/DocumentDB', 'Encrypted with AWS KMS Customer Master Keys'],
    pricing: '$0.40 per secret per month + $0.05 per 10,000 API calls (automated rotation costs standard Lambda execution fee).',
    pricingBullets: ['No free tier for secrets', 'Replicated secrets billed at $0.40/mo per replica region'],
    fit: 'Upstream: IAM policies, CloudFormation, Terraform. Downstream: RDS (automated rotation Lambda), ECS task definitions, EKS external secrets.',
    fitBullets: [
      'Direct integration with ECS task definition `secrets` block',
      'External Secrets Operator for Kubernetes',
    ],
    gotcha: 'Choose for database passwords, API tokens, and credentials that require automated zero-downtime rotation. Gotcha: Monthly cost ($0.40/secret) adds up if storing hundreds of individual microservice config keys.',
    gotchaBullets: [
      '64KB maximum secret value size limit',
      'Rotation Lambda function failure can lead to desynchronized credentials',
    ],
  },
  'systems-manager': {
    role: 'Centralized key-value configuration and hierarchical parameter store supporting plain text, lists, and encrypted strings.',
    scaling: 'Standard tier: 40 req/sec (free); Advanced tier: up to 10,000 req/sec with parameter policies and notifications.',
    scalingBullets: ['Hierarchical namespace tree (/app/prod/db/url)', 'Parameter policies for expiration and notifications'],
    latency: 'Fast single-digit to low double-digit ms retrieval (10–25ms); native integration into EC2, ECS, and Lambda environments.',
    latencyBullets: ['AWS AppConfig integration for dynamic runtime configuration', 'Direct AWS CLI and SDK retrieval'],
    state: 'Durable hierarchical tree storage with version history up to 100 versions per parameter.',
    stateBullets: ['SecureString type encrypted with AWS KMS', 'Immutable version tracking on every update'],
    pricing: 'Standard tier is completely free (up to 10,000 parameters); Advanced tier: $0.05/parameter-mo + $0.05/10k API calls.',
    pricingBullets: ['Standard parameters have zero monthly storage fee', 'Advanced tier required for parameters > 4KB'],
    fit: 'Upstream: CI/CD pipelines, CDK, CloudFormation. Downstream: EC2 user data, ECS container environment variables, Lambda extensions.',
    fitBullets: [
      'AWS Parameters and Secrets Lambda Extension caches values locally',
      'Direct reference in CloudFormation templates',
    ],
    gotcha: 'Choose for application configuration variables, feature flags, and non-rotating secrets without recurring per-key fees. Gotcha: Standard tier has a 4KB value limit and strict 40 TPS throughput limit.',
    gotchaBullets: [
      'No native automated secret rotation (use Secrets Manager instead)',
      '40 TPS default rate limit on standard tier can cause throttling during fleet boots',
    ],
  },
  kms: {
    role: 'Hardware Security Module (HSM) managed cryptographic key engine generating, storing, and controlling envelope encryption keys.',
    scaling: 'High-performance cryptographic engine: 10,000–50,000 requests/sec depending on region; request caching reduces API calls.',
    scalingBullets: ['AWS KMS request caching SDK reduces API latency', 'Multi-Region Keys provide shared key material across regions'],
    latency: 'Fast cryptographic operations (under 10ms); envelope encryption allows data keys to decrypt large files locally.',
    latencyBullets: ['Cryptographic hardware offloading', 'Sub-10ms response for GenerateDataKey and Decrypt'],
    state: 'Durable FIPS 140-2 Level 3 HSM hardware backed keys; Customer Managed Keys (CMK) cannot be exported in plaintext.',
    stateBullets: ['Annual automated key rotation without re-encrypting existing data', 'Key policies control access independently of IAM'],
    pricing: '$1.00 per customer managed key per month + $0.03 per 10,000 cryptographic requests (AWS managed keys are free).',
    pricingBullets: ['AWS managed keys (aws/s3, aws/ebs) have $0.00 monthly fee', 'Key generation and rotation included in base price'],
    fit: 'Upstream: AWS services (S3, EBS, RDS, Secrets Manager, DynamoDB) requesting cryptographic operations. Downstream: CloudTrail audit logs.',
    fitBullets: [
      'Mandatory envelope encryption standard for all AWS storage services',
      'CloudTrail logs every single decryption and key usage event',
    ],
    gotcha: 'Choose to manage master encryption keys and perform cryptographic signature/verification operations. Gotcha: Does not store secrets directly; encrypts/decrypts data keys using envelope encryption.',
    gotchaBullets: [
      'Max 4KB payload limit for direct Encrypt/Decrypt API calls',
      'Key policy misconfiguration can permanently lock down access to encrypted data',
    ],
  },
};

/**
 * Extracts or derives architectural dimension cell values for any arbitrary AWS service.
 */
function deriveServiceDimensionCell(
  service: AWSService,
  dimensionId: string
): ServiceDimensionCell {
  const catalogEntry = AWS_CATALOG_DATA.find((e) => e.id === service.id);
  const curated = CURATED_SERVICE_PROFILES[service.id];

  switch (dimensionId) {
    case 'role': {
      if (curated) {
        return { summary: curated.role };
      }
      return {
        summary: service.summary || catalogEntry?.summary || `${service.name} core infrastructure component.`,
      };
    }

    case 'tier': {
      const tierName =
        service.tier === 1 ? 'Core' : service.tier === 2 ? 'Enterprise' : 'Specialized';
      const badgeType: ServiceDimensionCell['badgeType'] =
        service.tier === 1 ? 'core' : service.tier === 2 ? 'enterprise' : 'specialized';

      return {
        summary: `${service.category} domain`,
        badge: `T${service.tier} · ${tierName}`,
        badgeType,
        subtext: `CLI Prefix: aws ${service.id}`,
      };
    }

    case 'scaling': {
      if (curated) {
        return {
          summary: curated.scaling,
          bulletPoints: curated.scalingBullets,
        };
      }
      // Deterministic dynamic heuristic based on category
      const cat = service.category.toLowerCase();
      if (cat.includes('serverless') || service.id.includes('lambda')) {
        return {
          summary: 'Automatic request-driven serverless scaling with regional concurrency quotas.',
          bulletPoints: ['Zero idle capacity required', 'Burstable concurrency scaling'],
        };
      }
      if (cat.includes('container') || cat.includes('compute')) {
        return {
          summary: 'Horizontal instance/task auto-scaling based on CPU, memory, or custom CloudWatch metrics.',
          bulletPoints: ['Auto Scaling groups / task counts', 'Configurable target tracking policies'],
        };
      }
      if (cat.includes('database')) {
        return {
          summary: 'Read replica scaling, storage auto-growth, and connection pooling support.',
          bulletPoints: ['Read offloading via replicas', 'Vertical instance compute scaling'],
        };
      }
      if (cat.includes('storage')) {
        return {
          summary: 'Elastic capacity scaling with automatic partition distribution.',
          bulletPoints: ['Independent capacity and throughput expansion', 'No manual pre-allocation required'],
        };
      }
      if (cat.includes('analytics') || cat.includes('integration')) {
        return {
          summary: 'Partition, shard, or queue-based distributed scaling model.',
          bulletPoints: ['Horizontal shard allocation', 'Asynchronous buffering'],
        };
      }
      return {
        summary: 'Fully managed AWS control plane scaling within regional service limits.',
        bulletPoints: ['Multi-AZ distributed redundancy', 'Elastic API request handling'],
      };
    }

    case 'latency': {
      if (curated) {
        return {
          summary: curated.latency,
          bulletPoints: curated.latencyBullets,
        };
      }
      const cat = service.category.toLowerCase();
      if (cat.includes('network') || service.id.includes('nlb')) {
        return {
          summary: 'Sub-millisecond to low single-digit millisecond network packet transit latency.',
          bulletPoints: ['Direct line-rate throughput', 'Hardware-level packet switching'],
        };
      }
      if (cat.includes('database')) {
        return {
          summary: 'Single-digit millisecond query response times under standard indexing.',
          bulletPoints: ['Sub-10ms read/write targets', 'Memory caching optimizes repetitive lookups'],
        };
      }
      if (cat.includes('storage')) {
        return {
          summary: 'Low-latency block/file access or double-digit ms first-byte HTTP object retrieval.',
          bulletPoints: ['Optimized for sustained aggregate bandwidth', 'Parallel stream support'],
        };
      }
      return {
        summary: 'Low-latency managed API operations typically between 10ms and 50ms.',
        bulletPoints: ['Regional edge availability', 'API caching recommended where applicable'],
      };
    }

    case 'state': {
      if (curated) {
        return {
          summary: curated.state,
          bulletPoints: curated.stateBullets,
        };
      }
      const cat = service.category.toLowerCase();
      if (cat.includes('compute') || cat.includes('serverless')) {
        return {
          summary: 'Stateless compute execution; ephemeral local scratch storage.',
          bulletPoints: ['Ephemeral execution runtime', 'State must be persisted to external databases or S3'],
        };
      }
      if (cat.includes('storage') || cat.includes('database')) {
        return {
          summary: 'Multi-AZ durable persistence with automated snapshots and recovery.',
          bulletPoints: ['Durable storage across multiple availability zones', 'Point-in-time recovery and snapshot exports'],
        };
      }
      return {
        summary: 'High-availability regional persistence backed by AWS managed control plane.',
        bulletPoints: ['Automatic cross-AZ state synchronization', 'CloudTrail audit logging'],
      };
    }

    case 'pricing': {
      if (curated) {
        return {
          summary: curated.pricing,
          bulletPoints: curated.pricingBullets,
        };
      }
      const cat = service.category.toLowerCase();
      if (cat.includes('serverless')) {
        return {
          summary: 'Pay-per-request / pay-per-duration billing with zero hourly base fee when idle.',
          bulletPoints: ['Billed strictly for execution duration', 'Generous AWS Free Tier allocation'],
        };
      }
      if (cat.includes('storage')) {
        return {
          summary: 'Per-GB-month capacity pricing + API request fees and data egress transfer.',
          bulletPoints: ['Tiered storage rates based on access frequency', 'Billed for allocated or consumed gigabytes'],
        };
      }
      return {
        summary: 'Provisioned hourly instance/node rate plus metered network data transfer.',
        bulletPoints: ['Reserved and Savings Plans discounts available', 'Charges apply while resources are provisioned'],
      };
    }

    case 'fit': {
      if (curated) {
        return {
          summary: curated.fit,
          bulletPoints: curated.fitBullets,
        };
      }
      const up = catalogEntry?.flow.upstream.join(', ') || 'Clients, API Gateway, CloudFront';
      const down = catalogEntry?.flow.downstream.join(', ') || 'RDS, S3, CloudWatch';
      return {
        summary: `Upstream callers: ${up}. Downstream targets: ${down}.`,
        bulletPoints: [
          `Protocol: ${catalogEntry?.flow.edgeProtocol || 'HTTPS/REST'}`,
          `Sub-topology: ${catalogEntry?.flow.subgraphLabel || 'Cloud Architecture Tier'}`,
        ],
      };
    }

    case 'gotcha': {
      if (curated) {
        return {
          summary: curated.gotcha,
          bulletPoints: curated.gotchaBullets,
        };
      }
      const prim = catalogEntry?.primitives[0];
      const gotcha = catalogEntry?.gotchas[0] || 'Be mindful of regional resource quotas and cross-AZ data transfer fees.';
      return {
        summary: `Primary primitive: ${prim?.name ? `${prim.name} - ${prim.detail}` : 'Managed AWS service engine'}.`,
        bulletPoints: [
          `Production gotcha: ${gotcha}`,
        ],
      };
    }

    default:
      return { summary: 'Standard architectural dimension specification.' };
  }
}

/**
 * Builds the complete side-by-side trade-off matrix for any 2 or 3 selected services.
 */
export function generateComparisonMatrix(services: AWSService[]): ServiceComparisonMatrix {
  const rows: ServiceComparisonRow[] = COMPARISON_DIMENSIONS.map((dimension) => {
    const cells: Record<string, ServiceDimensionCell> = {};
    for (const service of services) {
      cells[service.id] = deriveServiceDimensionCell(service, dimension.id);
    }
    return {
      dimension,
      cells,
    };
  });

  return {
    services,
    dimensions: COMPARISON_DIMENSIONS,
    rows,
  };
}

/**
 * Exports the generated comparison matrix to a clean GitHub-Flavored Markdown table.
 * Ideal for pasting directly into RFCs, architecture review documents, or PRs.
 */
export function exportComparisonToMarkdown(matrix: ServiceComparisonMatrix): string {
  const { services, rows } = matrix;
  if (services.length === 0) return '';

  const header = `| Architectural Dimension | ${services.map((s) => s.shortName || s.name).join(' | ')} |`;
  const separator = `| :--- | ${services.map(() => ':---').join(' | ')} |`;

  const bodyRows = rows.map((row) => {
    const dimLabel = `**${row.dimension.label}**`;
    const serviceCells = services.map((s) => {
      const cell = row.cells[s.id];
      if (!cell) return '-';
      let content = cell.summary.replace(/\|/g, '\\|');
      if (cell.badge) {
        content = `\`${cell.badge}\` ${content}`;
      }
      if (cell.bulletPoints && cell.bulletPoints.length > 0) {
        const bullets = cell.bulletPoints.map((b) => `<br>• ${b.replace(/\|/g, '\\|')}`).join('');
        content += bullets;
      }
      return content;
    });
    return `| ${dimLabel} | ${serviceCells.join(' | ')} |`;
  });

  return [
    `# AWS Architectural Trade-Off Matrix: ${services.map((s) => s.shortName || s.name).join(' vs. ')}`,
    '',
    `*Generated by AWS Compass Architecture Studio on ${new Date().toISOString().split('T')[0]}*`,
    '',
    header,
    separator,
    ...bodyRows,
    '',
  ].join('\n');
}


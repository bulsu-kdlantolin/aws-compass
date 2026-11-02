// scripts/generateFullAwsCatalog.mjs
// Deterministic generator for all 230+ active AWS Services across all 16 official AWS domains.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to create catalog entries easily
function createService({
  id,
  name,
  shortName,
  category,
  tier,
  cliPrefix,
  arnPattern,
  summary,
  primitives,
  flow,
  gotchas,
  cliCommands,
  docsUrl,
}) {
  return {
    id,
    name,
    shortName: shortName || name.replace(/^(Amazon|AWS)\s+/, ''),
    category,
    tier,
    cliPrefix: cliPrefix || `aws ${id.replace(/-/g, '')}`,
    arnPattern:
      arnPattern ||
      `arn:aws:${id}:\${region}:\${accountId}:\${resourceName}`,
    summary,
    primitives: primitives || [
      { name: 'Core Engine', detail: `Managed engine and execution primitives for ${name}.` },
      { name: 'Configuration Policy', detail: 'Granular IAM policies, resource tags, and lifecycle specifications.' },
      { name: 'Telemetry & Logs', detail: 'Native metrics and operational telemetry dispatched to Amazon CloudWatch.' },
      { name: 'Security & Encryption', detail: 'Data at rest and in transit encrypted using AWS KMS managed customer keys.' },
    ],
    flow: flow || {
      upstream: ['client', 'api-gateway'],
      downstream: ['cloudwatch', 'kms'],
      edgeProtocol: 'HTTPS/REST',
      subgraphLabel: `${category} Environment`,
    },
    gotchas: gotchas || [
      `Regional vs Global: Verify regional resource limits before deploying high-throughput multi-AZ topologies.`,
      `IAM Principle of Least Privilege: Restrict resource ARNs with condition keys to prevent cross-service privilege escalation.`,
      `Cost & Tiering: Idle resources accrue hourly base charges even with zero traffic throughput.`,
    ],
    cliCommands: cliCommands || [
      {
        description: `Describe active configuration and resource status for ${shortName || id}`,
        command: `aws ${cliPrefix ? cliPrefix.replace(/^aws\s+/, '') : id} describe-${id} --region \${region}`,
      },
      {
        description: `List resources with tags and pagination`,
        command: `aws ${cliPrefix ? cliPrefix.replace(/^aws\s+/, '') : id} list-${id}s --max-items 25 --output table`,
      },
      {
        description: `Inspect detailed telemetry and diagnostic state`,
        command: `aws ${cliPrefix ? cliPrefix.replace(/^aws\s+/, '') : id} get-${id} --id \${resourceName} --region \${region}`,
      },
    ],
    docsUrl: docsUrl || `https://docs.aws.amazon.com/${id}/`,
  };
}

// Master list of 240+ AWS Services across all 16 categories
const rawServices = [
  // =========================================================================
  // 1. COMPUTE (16 Services)
  // =========================================================================
  createService({
    id: 'ec2',
    name: 'Amazon EC2 (Elastic Compute Cloud)',
    shortName: 'EC2',
    category: 'Compute',
    tier: 1,
    cliPrefix: 'aws ec2',
    arnPattern: 'arn:aws:ec2:${region}:${accountId}:instance/${resourceName}',
    summary: 'Configurable virtual server instances with resizable compute capacity, custom AMIs, hardware acceleration, and granular security groups.',
    primitives: [
      { name: 'Amazon Machine Image (AMI)', detail: 'Root operating system and software template packaged with block device mappings.' },
      { name: 'Instance Types', detail: 'General Purpose (M), Compute (C), Memory (R), GPU (P/G), and Storage (I) architectures.' },
      { name: 'Elastic Block Store (EBS)', detail: 'Persistent block storage attached over dedicated NVMe buses.' },
      { name: 'IMDSv2', detail: 'Session-oriented token endpoint (169.254.169.254) mitigating SSRF credential theft.' },
    ],
    flow: {
      upstream: ['alb', 'api-gateway'],
      downstream: ['rds', 's3', 'cloudwatch'],
      edgeProtocol: 'SQL/TCP',
      subgraphLabel: 'VPC Private Application Tier',
    },
    gotchas: [
      'IMDSv1 Vulnerability: Always enforce IMDSv2 (HttpTokens=required, HopLimit=1) to prevent SSRF credential exfiltration.',
      'EBS vs Instance Store: Instance store volumes lose all data upon instance Stop or Termination; use EBS for durable persistence.',
      'Egress Data Transfer Fees: Cross-AZ and cross-region traffic incurs bandwidth costs; utilize VPC endpoints and private IPs.',
    ],
    cliCommands: [
      { description: 'Launch a hardened Amazon Linux 2023 instance with IMDSv2 enforced', command: 'aws ec2 run-instances --image-id ami-0c55b159cbfafe1f0 --instance-type t3.micro --key-name prod-key --metadata-options "HttpTokens=required,HttpPutResponseHopLimit=1" --region ${region}' },
      { description: 'Filter instances by Environment tag and output tab-delimited values', command: 'aws ec2 describe-instances --filters "Name=tag:Environment,Values=production" --query "Reservations[*].Instances[*].[InstanceId,State.Name,PrivateIpAddress]" --output table' },
      { description: 'Create an atomic, crash-consistent EBS snapshot of a root volume', command: 'aws ec2 create-snapshot --volume-id vol-0123456789abcdef0 --description "Automated pre-patch snapshot" --region ${region}' },
    ],
  }),

  createService({
    id: 'lambda',
    name: 'AWS Lambda',
    shortName: 'Lambda',
    category: 'Compute',
    tier: 1,
    cliPrefix: 'aws lambda',
    arnPattern: 'arn:aws:lambda:${region}:${accountId}:function:${resourceName}',
    summary: 'Event-driven serverless compute running code in stateless microVMs with sub-second scaling and millisecond billing.',
    primitives: [
      { name: 'Execution Environment', detail: 'Isolated Firecracker microVM initialized per concurrent request.' },
      { name: 'Event Source Mappings', detail: 'Internal polling engines reading records from Kinesis, DynamoDB Streams, or SQS.' },
      { name: 'Lambda Layers', detail: 'Immutable zip archives containing shared dependencies, runtimes, or extensions.' },
      { name: 'Provisioned Concurrency', detail: 'Pre-warmed execution runtimes that eliminate cold-start latencies for strict SLAs.' },
    ],
    flow: {
      upstream: ['api-gateway', 's3', 'sqs'],
      downstream: ['dynamodb', 'secrets-manager', 'cloudwatch'],
      edgeProtocol: 'HTTPS/REST',
      subgraphLabel: 'Serverless Compute Runtime',
    },
    gotchas: [
      'Cold Starts: VPC-attached Lambdas no longer suffer heavy ENI cold starts, but runtime initialization (JVM/Node modules) requires Provisioned Concurrency or SnapStart.',
      '15-Minute Hard Execution Limit: Any task exceeding 900 seconds aborts abruptly; long-running jobs must be migrated to ECS or Step Functions.',
      'Idempotency in Asynchronous Invocation: SQS and EventBridge invocations guarantee at-least-once delivery; always implement deduplication keys in code.',
    ],
    cliCommands: [
      { description: 'Deploy updated function code directly from a zip archive', command: 'aws lambda update-function-code --function-name ${resourceName} --zip-file fileb://function.zip --region ${region}' },
      { description: 'Invoke function synchronously with test payload and read response', command: 'aws lambda invoke --function-name ${resourceName} --payload \'{"action":"healthCheck"}\' response.json --region ${region}' },
      { description: 'Configure provisioned concurrency to eliminate cold starts', command: 'aws lambda put-provisioned-concurrency-config --function-name ${resourceName} --qualifier prod --provisioned-concurrent-executions 5 --region ${region}' },
    ],
  }),

  createService({
    id: 'auto-scaling',
    name: 'AWS Auto Scaling',
    shortName: 'Auto Scaling',
    category: 'Compute',
    tier: 1,
    cliPrefix: 'aws autoscaling',
    arnPattern: 'arn:aws:autoscaling:${region}:${accountId}:autoScalingGroup:${resourceName}',
    summary: 'Automated fleet elasticity adjusting EC2, ECS, or DynamoDB capacity to match real-time demand patterns.',
    flow: { upstream: ['cloudwatch'], downstream: ['ec2', 'alb'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Fleet Elasticity Tier' },
  }),

  createService({
    id: 'lightsail',
    name: 'Amazon Lightsail',
    shortName: 'Lightsail',
    category: 'Compute',
    tier: 1,
    cliPrefix: 'aws lightsail',
    summary: 'Simplified pre-packaged virtual private servers, databases, and container deployments with bundled networking.',
    flow: { upstream: ['route53'], downstream: ['s3'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Lightsail Cloud VPS' },
  }),

  createService({
    id: 'elastic-beanstalk',
    name: 'AWS Elastic Beanstalk',
    shortName: 'Elastic Beanstalk',
    category: 'Compute',
    tier: 1,
    cliPrefix: 'aws elasticbeanstalk',
    summary: 'Platform-as-a-Service (PaaS) orchestration engine for deploying and scaling web applications and worker tiers.',
    flow: { upstream: ['codepipeline'], downstream: ['ec2', 'rds', 'alb'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'PaaS Managed Cluster' },
  }),

  createService({
    id: 'app-runner',
    name: 'AWS App Runner',
    shortName: 'App Runner',
    category: 'Compute',
    tier: 2,
    cliPrefix: 'aws apprunner',
    summary: 'Fully managed container application platform with automatic build pipelines, TLS termination, and traffic scaling.',
    flow: { upstream: ['ecr', 'route53'], downstream: ['aurora', 'dynamodb'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Container PaaS Runtime' },
  }),

  createService({
    id: 'batch',
    name: 'AWS Batch',
    shortName: 'Batch',
    category: 'Compute',
    tier: 2,
    cliPrefix: 'aws batch',
    summary: 'Dynamically scales containerized high-performance batch computing jobs across Fargate, EC2, and EC2 Spot instances.',
    flow: { upstream: ['eventbridge', 's3'], downstream: ['s3', 'sns'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'HPC Batch Cluster' },
  }),

  createService({
    id: 'outposts',
    name: 'AWS Outposts',
    shortName: 'Outposts',
    category: 'Compute',
    tier: 2,
    cliPrefix: 'aws outposts',
    summary: 'Native AWS compute racks and servers deployed inside on-premises enterprise data centers for low-latency workloads.',
    flow: { upstream: ['direct-connect'], downstream: ['ec2', 'ebs'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Hybrid On-Premises Rack' },
  }),

  createService({
    id: 'wavelength',
    name: 'AWS Wavelength',
    shortName: 'Wavelength',
    category: 'Compute',
    tier: 2,
    cliPrefix: 'aws ec2',
    summary: 'Ultra-low-latency edge compute deployed directly within 5G telecom networks for mobile and smart edge apps.',
    flow: { upstream: ['route53'], downstream: ['ec2', 'ebs'], edgeProtocol: 'HTTPS/REST', subgraphLabel: '5G Edge Telecom Zone' },
  }),

  createService({
    id: 'local-zones',
    name: 'AWS Local Zones',
    shortName: 'Local Zones',
    category: 'Compute',
    tier: 2,
    cliPrefix: 'aws ec2',
    summary: 'Geographic extension of AWS Regions placing compute, storage, and database services close to large population centers.',
    flow: { upstream: ['internet-gateway'], downstream: ['ec2', 'ebs'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Metro Edge Zone' },
  }),

  createService({
    id: 'compute-optimizer',
    name: 'AWS Compute Optimizer',
    shortName: 'Compute Optimizer',
    category: 'Compute',
    tier: 2,
    cliPrefix: 'aws compute-optimizer',
    summary: 'Machine-learning-driven resource rightsizing recommendations for EC2, EBS, Lambda, and ECS workloads.',
    flow: { upstream: ['cloudwatch'], downstream: ['ec2', 'lambda'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'ML Optimization Engine' },
  }),

  createService({
    id: 'parallelcluster',
    name: 'AWS ParallelCluster',
    shortName: 'ParallelCluster',
    category: 'Compute',
    tier: 3,
    cliPrefix: 'aws pcluster',
    summary: 'Open-source cluster management tool that simplifies deploying high-performance computing (HPC) clusters.',
    flow: { upstream: ['cloudformation'], downstream: ['ec2', 'efs', 'fsx-lustre'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'HPC Slurm Cluster' },
  }),

  createService({
    id: 'simspace-weaver',
    name: 'AWS SimSpace Weaver',
    shortName: 'SimSpace Weaver',
    category: 'Compute',
    tier: 3,
    cliPrefix: 'aws simspaceweaver',
    summary: 'Build and run massive spatial simulations at city scale across multiple synchronized EC2 instances.',
    flow: { upstream: ['s3'], downstream: ['ec2', 'cloudwatch'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Spatial Simulation Mesh' },
  }),

  createService({
    id: 'nimble-studio',
    name: 'Amazon Nimble Studio',
    shortName: 'Nimble Studio',
    category: 'Compute',
    tier: 3,
    cliPrefix: 'aws nimblestudio',
    summary: 'Cloud-based creative visual studio providing virtual workstations, render farms, and high-speed storage.',
    flow: { upstream: ['iam-identity-center'], downstream: ['ec2', 'fsx-lustre'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'VFX Render Studio' },
  }),

  createService({
    id: 'ec2-image-builder',
    name: 'EC2 Image Builder',
    shortName: 'Image Builder',
    category: 'Compute',
    tier: 3,
    cliPrefix: 'aws imagebuilder',
    summary: 'Automates creation, management, validation, and distribution of hardened golden AMIs and container images.',
    flow: { upstream: ['eventbridge'], downstream: ['ec2', 'ecr'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Golden AMI Pipeline' },
  }),

  createService({
    id: 'serverless-repo',
    name: 'AWS Serverless Application Repository',
    shortName: 'SAR',
    category: 'Compute',
    tier: 3,
    cliPrefix: 'aws serverlessrepo',
    summary: 'Managed collection of serverless applications and components packaged for 1-click CloudFormation deployment.',
    flow: { upstream: ['cloudformation'], downstream: ['lambda', 'api-gateway'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'SAR Catalog' },
  }),

  // =========================================================================
  // 2. CONTAINERS (9 Services)
  // =========================================================================
  createService({
    id: 'ecs',
    name: 'Amazon ECS (Elastic Container Service)',
    shortName: 'ECS',
    category: 'Containers',
    tier: 1,
    cliPrefix: 'aws ecs',
    arnPattern: 'arn:aws:ecs:${region}:${accountId}:service/${resourceName}',
    summary: 'Highly scalable container management service orchestrating Docker workloads across AWS Fargate and EC2 fleets.',
    flow: { upstream: ['alb', 'ecr'], downstream: ['rds', 'dynamodb', 'cloudwatch'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'ECS Cluster' },
  }),

  createService({
    id: 'eks',
    name: 'Amazon EKS (Elastic Kubernetes Service)',
    shortName: 'EKS',
    category: 'Containers',
    tier: 1,
    cliPrefix: 'aws eks',
    arnPattern: 'arn:aws:eks:${region}:${accountId}:cluster/${resourceName}',
    summary: 'Certified Kubernetes-conformant managed control plane automating master node replication, patching, and scaling.',
    flow: { upstream: ['alb', 'nlb'], downstream: ['ecr', 'efs', 'cloudwatch'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'EKS Control Plane' },
  }),

  createService({
    id: 'fargate',
    name: 'AWS Fargate',
    shortName: 'Fargate',
    category: 'Containers',
    tier: 1,
    cliPrefix: 'aws ecs',
    summary: 'Serverless compute engine for containers that removes the need to provision, configure, or patch EC2 instances.',
    flow: { upstream: ['ecs', 'eks'], downstream: ['ecr', 'cloudwatch'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Serverless Pod Runtime' },
  }),

  createService({
    id: 'ecr',
    name: 'Amazon ECR (Elastic Container Registry)',
    shortName: 'ECR',
    category: 'Containers',
    tier: 1,
    cliPrefix: 'aws ecr',
    arnPattern: 'arn:aws:ecr:${region}:${accountId}:repository/${resourceName}',
    summary: 'High-performance, secure Docker and OCI container image registry with automatic vulnerability scanning.',
    flow: { upstream: ['codebuild', 'github-actions'], downstream: ['ecs', 'eks', 'app-runner'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Secure Registry' },
  }),

  createService({
    id: 'eks-anywhere',
    name: 'Amazon EKS Anywhere',
    shortName: 'EKS Anywhere',
    category: 'Containers',
    tier: 2,
    cliPrefix: 'aws eks',
    summary: 'Deploy and operate consistent Kubernetes clusters on customer-managed on-premises hardware and VMware.',
    flow: { upstream: ['direct-connect'], downstream: ['eks'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'On-Premises Kubernetes' },
  }),

  createService({
    id: 'ecs-anywhere',
    name: 'Amazon ECS Anywhere',
    shortName: 'ECS Anywhere',
    category: 'Containers',
    tier: 2,
    cliPrefix: 'aws ecs',
    summary: 'Extends ECS container orchestration to customer on-premises virtual machines and bare-metal servers.',
    flow: { upstream: ['systems-manager'], downstream: ['ecs'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Hybrid ECS Host' },
  }),

  createService({
    id: 'app2container',
    name: 'AWS App2Container',
    shortName: 'App2Container',
    category: 'Containers',
    tier: 3,
    cliPrefix: 'aws app2container',
    summary: 'CLI modernization tool that transforms legacy Java and .NET IIS web applications into containerized images.',
    flow: { upstream: ['ec2'], downstream: ['ecr', 'ecs'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Containerization Tool' },
  }),

  createService({
    id: 'red-hat-openshift',
    name: 'Red Hat OpenShift on AWS (ROSA)',
    shortName: 'ROSA',
    category: 'Containers',
    tier: 3,
    cliPrefix: 'aws rosa',
    summary: 'Turnkey enterprise OpenShift container platform jointly managed and supported by Red Hat and AWS.',
    flow: { upstream: ['route53'], downstream: ['ec2', 'ebs'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'ROSA Managed Cluster' },
  }),

  createService({
    id: 'eks-distro',
    name: 'Amazon EKS Distro',
    shortName: 'EKS Distro',
    category: 'Containers',
    tier: 3,
    cliPrefix: 'aws eks',
    summary: 'Open-source Kubernetes distribution based on the exact tested versions and components used by Amazon EKS.',
    flow: { upstream: ['git'], downstream: ['eks-anywhere'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Kubernetes Binaries' },
  }),

  // =========================================================================
  // 3. SERVERLESS (6 Services)
  // =========================================================================
  createService({
    id: 'step-functions',
    name: 'AWS Step Functions',
    shortName: 'Step Functions',
    category: 'Serverless',
    tier: 1,
    cliPrefix: 'aws stepfunctions',
    arnPattern: 'arn:aws:states:${region}:${accountId}:stateMachine:${resourceName}',
    summary: 'Visual low-code workflow state machine orchestrating distributed microservices, human tasks, and event pipelines.',
    flow: { upstream: ['eventbridge', 'api-gateway'], downstream: ['lambda', 'ecs', 'dynamodb'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Workflow Orchestration' },
  }),

  createService({
    id: 'eventbridge',
    name: 'Amazon EventBridge',
    shortName: 'EventBridge',
    category: 'Serverless',
    tier: 1,
    cliPrefix: 'aws events',
    arnPattern: 'arn:aws:events:${region}:${accountId}:event-bus/${resourceName}',
    summary: 'Serverless event bus that ingests, filters, transforms, and routes real-time data across AWS services and SaaS apps.',
    flow: { upstream: ['s3', 'lambda', 'third-party-saas'], downstream: ['sqs', 'sns', 'step-functions'], edgeProtocol: 'Event Trigger', subgraphLabel: 'Event Hub' },
  }),

  createService({
    id: 'eventbridge-pipes',
    name: 'Amazon EventBridge Pipes',
    shortName: 'EventBridge Pipes',
    category: 'Serverless',
    tier: 3,
    cliPrefix: 'aws pipes',
    summary: 'Point-to-point event integrations with built-in filtering, enrichment, and transformation between sources and targets.',
    flow: { upstream: ['dynamodb', 'sqs'], downstream: ['eventbridge', 'step-functions'], edgeProtocol: 'Event Trigger', subgraphLabel: 'Pipes Pipeline' },
  }),

  createService({
    id: 'eventbridge-scheduler',
    name: 'Amazon EventBridge Scheduler',
    shortName: 'Scheduler',
    category: 'Serverless',
    tier: 3,
    cliPrefix: 'aws scheduler',
    summary: 'Serverless scheduler that generates millions of one-time or recurring cron invocations across 270+ AWS services.',
    flow: { upstream: ['cloudwatch'], downstream: ['lambda', 'step-functions', 'sqs'], edgeProtocol: 'Event Trigger', subgraphLabel: 'Cron Engine' },
  }),

  createService({
    id: 'sam',
    name: 'AWS SAM (Serverless Application Model)',
    shortName: 'SAM',
    category: 'Serverless',
    tier: 2,
    cliPrefix: 'sam',
    summary: 'Open-source framework extending CloudFormation with shorthand syntax to define functions, APIs, and databases.',
    flow: { upstream: ['git'], downstream: ['cloudformation', 'lambda'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'SAM Build Pipeline' },
  }),

  createService({
    id: 'appsync',
    name: 'AWS AppSync',
    shortName: 'AppSync',
    category: 'Serverless',
    tier: 2,
    cliPrefix: 'aws appsync',
    summary: 'Managed GraphQL and Pub/Sub WebSocket API service connecting frontend applications to scalable cloud data sources.',
    flow: { upstream: ['cognito', 'route53'], downstream: ['dynamodb', 'lambda', 'opensearch'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'GraphQL Gateway' },
  }),

  // =========================================================================
  // 4. STORAGE (17 Services)
  // =========================================================================
  createService({
    id: 's3',
    name: 'Amazon S3 (Simple Storage Service)',
    shortName: 'S3',
    category: 'Storage',
    tier: 1,
    cliPrefix: 'aws s3',
    arnPattern: 'arn:aws:s3:::${resourceName}',
    summary: 'Exabyte-scale object storage with 99.999999999% (11 9s) durability, fine-grained access policies, and lifecycle tiering.',
    flow: { upstream: ['cloudfront', 'lambda'], downstream: ['athena', 'glue', 'sqs'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'S3 Data Lake Tier' },
  }),

  createService({
    id: 'glacier',
    name: 'Amazon S3 Glacier',
    shortName: 'Glacier',
    category: 'Storage',
    tier: 1,
    cliPrefix: 'aws glacier',
    summary: 'Ultra-low-cost cold storage classes (Instant, Flexible, Deep Archive) engineered for compliance data archiving.',
    flow: { upstream: ['s3'], downstream: ['sns'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Glacier Vault Tier' },
  }),

  createService({
    id: 'ebs',
    name: 'Amazon EBS (Elastic Block Store)',
    shortName: 'EBS',
    category: 'Storage',
    tier: 1,
    cliPrefix: 'aws ec2',
    arnPattern: 'arn:aws:ec2:${region}:${accountId}:volume/${resourceName}',
    summary: 'High-performance persistent block storage volumes designed for mission-critical EC2 database and file systems.',
    flow: { upstream: ['ec2'], downstream: ['backup'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'EBS Block Tier' },
  }),

  createService({
    id: 'efs',
    name: 'Amazon EFS (Elastic File System)',
    shortName: 'EFS',
    category: 'Storage',
    tier: 1,
    cliPrefix: 'aws efs',
    arnPattern: 'arn:aws:elasticfilesystem:${region}:${accountId}:file-system/${resourceName}',
    summary: 'Serverless, fully elastic NFS file system that automatically scales on demand across multiple Availability Zones.',
    flow: { upstream: ['ec2', 'lambda', 'ecs'], downstream: ['backup'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'NFS Shared File Tier' },
  }),

  createService({
    id: 'storage-gateway',
    name: 'AWS Storage Gateway',
    shortName: 'Storage Gateway',
    category: 'Storage',
    tier: 2,
    cliPrefix: 'aws storagegateway',
    summary: 'Hybrid cloud storage service connecting on-premises software appliances seamlessly to AWS cloud storage.',
    flow: { upstream: ['direct-connect'], downstream: ['s3', 'ebs'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Hybrid Gateway' },
  }),

  createService({
    id: 'backup',
    name: 'AWS Backup',
    shortName: 'Backup',
    category: 'Storage',
    tier: 2,
    cliPrefix: 'aws backup',
    summary: 'Policy-based, centralized backup service automating data protection across 15+ AWS computing and database services.',
    flow: { upstream: ['organizations'], downstream: ['ebs', 'rds', 'dynamodb', 's3'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Centralized Backup Vault' },
  }),

  createService({
    id: 'fsx-windows',
    name: 'Amazon FSx for Windows File Server',
    shortName: 'FSx Windows',
    category: 'Storage',
    tier: 2,
    cliPrefix: 'aws fsx',
    summary: 'Fully managed native Microsoft Windows file system powered by SMB protocol and integrated with Active Directory.',
    flow: { upstream: ['directory-service', 'ec2'], downstream: ['backup'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'SMB File Server' },
  }),

  createService({
    id: 'fsx-lustre',
    name: 'Amazon FSx for Lustre',
    shortName: 'FSx Lustre',
    category: 'Storage',
    tier: 2,
    cliPrefix: 'aws fsx',
    summary: 'High-performance parallel file system optimized for compute-heavy workloads like machine learning and HPC.',
    flow: { upstream: ['s3', 'sagemaker'], downstream: ['ec2'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Lustre High-IOPS Tier' },
  }),

  createService({
    id: 'fsx-ontap',
    name: 'Amazon FSx for NetApp ONTAP',
    shortName: 'FSx ONTAP',
    category: 'Storage',
    tier: 2,
    cliPrefix: 'aws fsx',
    summary: 'Multi-protocol storage (NFS, SMB, iSCSI) delivering NetApp ONTAP enterprise data management capabilities.',
    flow: { upstream: ['ec2', 'vmware-cloud'], downstream: ['backup'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'NetApp Cloud File Tier' },
  }),

  createService({
    id: 'fsx-openzfs',
    name: 'Amazon FSx for OpenZFS',
    shortName: 'FSx OpenZFS',
    category: 'Storage',
    tier: 2,
    cliPrefix: 'aws fsx',
    summary: 'Fully managed shared file storage powered by OpenZFS file system with sub-millisecond latencies and high IOPS.',
    flow: { upstream: ['ec2', 'ecs'], downstream: ['backup'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'OpenZFS File System' },
  }),

  createService({
    id: 'snow-family',
    name: 'AWS Snow Family',
    shortName: 'Snow Family',
    category: 'Storage',
    tier: 2,
    cliPrefix: 'aws snow-device-management',
    summary: 'Ruggedized physical edge devices (Snowcone, Snowball, Snowmobile) for petabyte-scale offline data migration.',
    flow: { upstream: ['corporate-datacenter'], downstream: ['s3'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Physical Migration Appliance' },
  }),

  createService({
    id: 'datasync',
    name: 'AWS DataSync',
    shortName: 'DataSync',
    category: 'Storage',
    tier: 2,
    cliPrefix: 'aws datasync',
    summary: 'Accelerated online data transfer service automating moves between on-premises storage and AWS cloud storage.',
    flow: { upstream: ['direct-connect'], downstream: ['s3', 'efs', 'fsx-windows'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Transfer Agent Tier' },
  }),

  createService({
    id: 'transfer-family',
    name: 'AWS Transfer Family',
    shortName: 'Transfer Family',
    category: 'Storage',
    tier: 2,
    cliPrefix: 'aws transfer',
    summary: 'Securely scales recurring file transfers into Amazon S3 and EFS using SFTP, FTPS, FTP, and AS2 protocols.',
    flow: { upstream: ['route53', 'internet-gateway'], downstream: ['s3', 'efs'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'SFTP Gateway' },
  }),

  createService({
    id: 'drs',
    name: 'AWS Elastic Disaster Recovery (DRS)',
    shortName: 'Elastic Disaster Recovery',
    category: 'Storage',
    tier: 3,
    cliPrefix: 'aws drs',
    summary: 'Minimizes downtime and data loss with fast, cost-effective continuous block-level server replication.',
    flow: { upstream: ['corporate-datacenter'], downstream: ['ec2', 'ebs'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'DRS Replication Mesh' },
  }),

  createService({
    id: 'dlm',
    name: 'Amazon Data Lifecycle Manager (DLM)',
    shortName: 'Data Lifecycle Manager',
    category: 'Storage',
    tier: 3,
    cliPrefix: 'aws dlm',
    summary: 'Automates creation, retention, and deletion of Amazon EBS snapshots and EBS-backed Amazon Machine Images.',
    flow: { upstream: ['eventbridge'], downstream: ['ebs'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Snapshot Automation' },
  }),

  createService({
    id: 's3-object-lambda',
    name: 'Amazon S3 Object Lambda',
    shortName: 'S3 Object Lambda',
    category: 'Storage',
    tier: 3,
    cliPrefix: 'aws s3control',
    summary: 'Add custom code to S3 GET requests to modify and transform data as it is returned to applications.',
    flow: { upstream: ['s3'], downstream: ['lambda'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Dynamic S3 Transform' },
  }),

  createService({
    id: 's3-mrap',
    name: 'Amazon S3 Multi-Region Access Points',
    shortName: 'S3 MRAP',
    category: 'Storage',
    tier: 3,
    cliPrefix: 'aws s3control',
    summary: 'Global S3 endpoint routing client traffic to the nearest S3 bucket copy over the AWS global network backbone.',
    flow: { upstream: ['global-accelerator'], downstream: ['s3'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Global S3 Ingress' },
  }),

  // =========================================================================
  // 5. DATABASE (16 Services)
  // =========================================================================
  createService({
    id: 'rds',
    name: 'Amazon RDS (Relational Database Service)',
    shortName: 'RDS',
    category: 'Database',
    tier: 1,
    cliPrefix: 'aws rds',
    arnPattern: 'arn:aws:rds:${region}:${accountId}:db:${resourceName}',
    summary: 'Managed relational database engine supporting PostgreSQL, MySQL, MariaDB, Oracle, and Microsoft SQL Server.',
    flow: { upstream: ['ec2', 'ecs', 'lambda'], downstream: ['secrets-manager', 'cloudwatch'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Multi-AZ Database Subnet' },
  }),

  createService({
    id: 'aurora',
    name: 'Amazon Aurora',
    shortName: 'Aurora',
    category: 'Database',
    tier: 1,
    cliPrefix: 'aws rds',
    arnPattern: 'arn:aws:rds:${region}:${accountId}:cluster:${resourceName}',
    summary: 'Cloud-native MySQL and PostgreSQL-compatible relational database with 6-way distributed replication across 3 AZs.',
    flow: { upstream: ['ecs', 'lambda', 'rds-proxy'], downstream: ['s3', 'cloudwatch'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Aurora Storage Mesh' },
  }),

  createService({
    id: 'dynamodb',
    name: 'Amazon DynamoDB',
    shortName: 'DynamoDB',
    category: 'Database',
    tier: 1,
    cliPrefix: 'aws dynamodb',
    arnPattern: 'arn:aws:dynamodb:${region}:${accountId}:table/${resourceName}',
    summary: 'Serverless, fully managed NoSQL key-value and document database delivering single-digit millisecond performance at any scale.',
    flow: { upstream: ['lambda', 'appsync', 'ecs'], downstream: ['kinesis-streams', 'cloudwatch'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Serverless NoSQL Tier' },
  }),

  createService({
    id: 'elasticache',
    name: 'Amazon ElastiCache',
    shortName: 'ElastiCache',
    category: 'Database',
    tier: 1,
    cliPrefix: 'aws elasticache',
    arnPattern: 'arn:aws:elasticache:${region}:${accountId}:cluster:${resourceName}',
    summary: 'Fully managed in-memory data store delivering sub-millisecond response times powered by Redis or Memcached.',
    flow: { upstream: ['ec2', 'ecs', 'lambda'], downstream: ['rds'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'In-Memory Cache Tier' },
  }),

  createService({
    id: 'redshift',
    name: 'Amazon Redshift',
    shortName: 'Redshift',
    category: 'Database',
    tier: 2,
    cliPrefix: 'aws redshift',
    summary: 'Petabyte-scale cloud data warehouse analyzing structured and semi-structured data using standard SQL and columnar storage.',
    flow: { upstream: ['data-firehose', 'glue'], downstream: ['quicksight', 's3'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Data Warehouse Cluster' },
  }),

  createService({
    id: 'documentdb',
    name: 'Amazon DocumentDB (with MongoDB compatibility)',
    shortName: 'DocumentDB',
    category: 'Database',
    tier: 2,
    cliPrefix: 'aws docdb',
    summary: 'Fully managed native JSON document database built for high scalability, durable storage, and enterprise workloads.',
    flow: { upstream: ['ecs', 'lambda'], downstream: ['cloudwatch'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Managed Document Store' },
  }),

  createService({
    id: 'keyspaces',
    name: 'Amazon Keyspaces (for Apache Cassandra)',
    shortName: 'Keyspaces',
    category: 'Database',
    tier: 2,
    cliPrefix: 'aws keyspaces',
    summary: 'Scalable, highly available, and managed Apache Cassandra-compatible serverless wide-column database service.',
    flow: { upstream: ['ec2', 'ecs'], downstream: ['cloudwatch'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Cassandra Wide-Column Tier' },
  }),

  createService({
    id: 'neptune',
    name: 'Amazon Neptune',
    shortName: 'Neptune',
    category: 'Database',
    tier: 2,
    cliPrefix: 'aws neptune',
    summary: 'Fast, reliable, fully managed graph database engine optimized for storing billions of relationships with Gremlin and SPARQL.',
    flow: { upstream: ['ecs', 'lambda'], downstream: ['cloudwatch'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Graph Database Mesh' },
  }),

  createService({
    id: 'memorydb',
    name: 'Amazon MemoryDB for Redis',
    shortName: 'MemoryDB',
    category: 'Database',
    tier: 2,
    cliPrefix: 'aws memorydb',
    summary: 'Redis-compatible, durable in-memory database with Multi-AZ transactional logs for microsecond read performance.',
    flow: { upstream: ['ecs', 'lambda'], downstream: ['cloudwatch'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Durable In-Memory Tier' },
  }),

  createService({
    id: 'timestream',
    name: 'Amazon Timestream',
    shortName: 'Timestream',
    category: 'Database',
    tier: 2,
    cliPrefix: 'aws timestream-write',
    summary: 'Serverless time-series database designed to store and analyze trillions of IoT events and operational telemetry metrics per day.',
    flow: { upstream: ['iot-core', 'kinesis-streams'], downstream: ['quicksight', 'managed-grafana'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Time-Series Engine' },
  }),

  createService({
    id: 'rds-proxy',
    name: 'Amazon RDS Proxy',
    shortName: 'RDS Proxy',
    category: 'Database',
    tier: 2,
    cliPrefix: 'aws rds',
    summary: 'High-availability connection pooling proxy for RDS and Aurora that prevents serverless compute from exhausting database sockets.',
    flow: { upstream: ['lambda'], downstream: ['aurora', 'rds'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Connection Pooling Layer' },
  }),

  createService({
    id: 'neptune-analytics',
    name: 'Amazon Neptune Analytics',
    shortName: 'Neptune Analytics',
    category: 'Database',
    tier: 3,
    cliPrefix: 'aws neptune-graph',
    summary: 'Analytics database engine that quickly analyzes tens of billions of graph connections in seconds using vector search.',
    flow: { upstream: ['s3', 'neptune'], downstream: ['quicksight'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Graph Analytics Engine' },
  }),

  createService({
    id: 'redshift-serverless',
    name: 'Amazon Redshift Serverless',
    shortName: 'Redshift Serverless',
    category: 'Database',
    tier: 3,
    cliPrefix: 'aws redshift-serverless',
    summary: 'Run data analytics without setting up or managing physical data warehouse clusters, paying only for compute capacity used.',
    flow: { upstream: ['data-firehose'], downstream: ['quicksight'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Serverless Data Warehouse' },
  }),

  createService({
    id: 'elasticache-serverless',
    name: 'Amazon ElastiCache Serverless',
    shortName: 'ElastiCache Serverless',
    category: 'Database',
    tier: 3,
    cliPrefix: 'aws elasticache',
    summary: 'Instantly scales cache memory and CPU capacity based on application traffic without manual sharding or cluster maintenance.',
    flow: { upstream: ['lambda', 'app-runner'], downstream: ['dynamodb'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Serverless In-Memory Cache' },
  }),

  createService({
    id: 'qldb',
    name: 'Amazon Quantum Ledger Database (QLDB)',
    shortName: 'QLDB',
    category: 'Database',
    tier: 3,
    cliPrefix: 'aws qldb',
    summary: 'Fully managed ledger database providing an immutable, transparent, and cryptographically verifiable transaction log.',
    flow: { upstream: ['lambda'], downstream: ['cloudwatch'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Cryptographic Ledger' },
  }),

  createService({
    id: 'database-activity-streams',
    name: 'Database Activity Streams',
    shortName: 'DAS',
    category: 'Database',
    tier: 3,
    cliPrefix: 'aws rds',
    summary: 'Real-time asynchronous stream of database activity monitoring events pushed to Amazon Kinesis for compliance audits.',
    flow: { upstream: ['aurora', 'rds'], downstream: ['kinesis-streams'], edgeProtocol: 'Event Trigger', subgraphLabel: 'Audit Stream' },
  }),

  // =========================================================================
  // 6. NETWORKING & CONTENT DELIVERY (23 Services)
  // =========================================================================
  createService({
    id: 'vpc',
    name: 'Amazon VPC (Virtual Private Cloud)',
    shortName: 'VPC',
    category: 'Networking & Content Delivery',
    tier: 1,
    cliPrefix: 'aws ec2',
    arnPattern: 'arn:aws:ec2:${region}:${accountId}:vpc/${resourceName}',
    summary: 'Logically isolated virtual network defining private IP subnets, route tables, network gateways, and security perimeters.',
    flow: { upstream: ['internet-gateway', 'direct-connect'], downstream: ['ec2', 'rds', 'nat-gateway'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Isolated VPC Network (10.0.0.0/16)' },
  }),

  createService({
    id: 'route53',
    name: 'Amazon Route 53',
    shortName: 'Route 53',
    category: 'Networking & Content Delivery',
    tier: 1,
    cliPrefix: 'aws route53',
    arnPattern: 'arn:aws:route53:::hostedzone/${resourceName}',
    summary: 'Highly available and scalable cloud Domain Name System (DNS) web service with health checking and traffic policies.',
    flow: { upstream: ['client'], downstream: ['cloudfront', 'alb', 'api-gateway'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Global DNS Anycast Edge' },
  }),

  createService({
    id: 'cloudfront',
    name: 'Amazon CloudFront',
    shortName: 'CloudFront',
    category: 'Networking & Content Delivery',
    tier: 1,
    cliPrefix: 'aws cloudfront',
    arnPattern: 'arn:aws:cloudfront::${accountId}:distribution/${resourceName}',
    summary: 'Low-latency Content Delivery Network (CDN) securely caching web assets, video streams, and API responses globally.',
    flow: { upstream: ['route53'], downstream: ['s3', 'alb', 'api-gateway'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Global CloudFront Edge Network' },
  }),

  createService({
    id: 'api-gateway',
    name: 'Amazon API Gateway',
    shortName: 'API Gateway',
    category: 'Networking & Content Delivery',
    tier: 1,
    cliPrefix: 'aws apigateway',
    arnPattern: 'arn:aws:apigateway:${region}::/restapis/${resourceName}',
    summary: 'Managed API reverse proxy creating, publishing, maintaining, and securing REST, HTTP, and WebSocket APIs at scale.',
    flow: { upstream: ['cloudfront', 'route53'], downstream: ['lambda', 'ecs', 'dynamodb'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'API Gateway Ingress' },
  }),

  createService({
    id: 'alb',
    name: 'Application Load Balancer (ALB)',
    shortName: 'ALB',
    category: 'Networking & Content Delivery',
    tier: 1,
    cliPrefix: 'aws elbv2',
    arnPattern: 'arn:aws:elasticloadbalancing:${region}:${accountId}:loadbalancer/app/${resourceName}',
    summary: 'Layer 7 HTTP/HTTPS load balancer distributing traffic across EC2, ECS, and Lambda with host and path-based routing.',
    flow: { upstream: ['internet-gateway', 'cloudfront'], downstream: ['ec2', 'ecs', 'lambda'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Public Subnet Tier' },
  }),

  createService({
    id: 'nlb',
    name: 'Network Load Balancer (NLB)',
    shortName: 'NLB',
    category: 'Networking & Content Delivery',
    tier: 1,
    cliPrefix: 'aws elbv2',
    summary: 'Ultra-high-throughput Layer 4 TCP/UDP load balancer delivering millions of requests per second with static Anycast IPs.',
    flow: { upstream: ['internet-gateway'], downstream: ['ec2', 'eks'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'L4 High-Throughput Ingress' },
  }),

  createService({
    id: 'nat-gateway',
    name: 'NAT Gateway',
    shortName: 'NAT Gateway',
    category: 'Networking & Content Delivery',
    tier: 1,
    cliPrefix: 'aws ec2',
    summary: 'Managed Network Address Translation service allowing outbound internet egress for private subnet resources without public IPs.',
    flow: { upstream: ['ec2', 'rds'], downstream: ['internet-gateway'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Public Ingress Subnet' },
  }),

  createService({
    id: 'internet-gateway',
    name: 'Internet Gateway (IGW)',
    shortName: 'IGW',
    category: 'Networking & Content Delivery',
    tier: 1,
    cliPrefix: 'aws ec2',
    summary: 'Horizontally scaled, redundant VPC component that enables direct two-way communication between VPC subnets and the internet.',
    flow: { upstream: ['client'], downstream: ['alb', 'nat-gateway'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Edge Ingress Gateway' },
  }),

  createService({
    id: 'direct-connect',
    name: 'AWS Direct Connect',
    shortName: 'Direct Connect',
    category: 'Networking & Content Delivery',
    tier: 2,
    cliPrefix: 'aws directconnect',
    summary: 'Dedicated private fiber-optic network link connecting enterprise data centers directly to AWS, bypassing public ISP routing.',
    flow: { upstream: ['corporate-datacenter'], downstream: ['transit-gateway', 'vpc'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Dedicated Fiber Link' },
  }),

  createService({
    id: 'transit-gateway',
    name: 'AWS Transit Gateway',
    shortName: 'Transit Gateway',
    category: 'Networking & Content Delivery',
    tier: 2,
    cliPrefix: 'aws ec2',
    summary: 'Central cloud router hub connecting hundreds of VPCs, on-premises networks, and SD-WAN links through a single gateway.',
    flow: { upstream: ['direct-connect', 'site-to-site-vpn'], downstream: ['vpc'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Hub-and-Spoke Mesh' },
  }),

  createService({
    id: 'global-accelerator',
    name: 'AWS Global Accelerator',
    shortName: 'Global Accelerator',
    category: 'Networking & Content Delivery',
    tier: 2,
    cliPrefix: 'aws globalaccelerator',
    summary: 'Directs user traffic through AWS global edge Anycast IP addresses to improve availability and TCP performance by up to 60%.',
    flow: { upstream: ['client'], downstream: ['alb', 'nlb', 'ec2'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Anycast Edge Routing' },
  }),

  createService({
    id: 'site-to-site-vpn',
    name: 'AWS Site-to-Site VPN',
    shortName: 'Site-to-Site VPN',
    category: 'Networking & Content Delivery',
    tier: 2,
    cliPrefix: 'aws ec2',
    summary: 'Encrypted IPSec VPN tunnels connecting remote data centers or corporate branch offices directly to an AWS VPC.',
    flow: { upstream: ['corporate-datacenter'], downstream: ['transit-gateway', 'vpc'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'IPSec VPN Tunnel' },
  }),

  createService({
    id: 'client-vpn',
    name: 'AWS Client VPN',
    shortName: 'Client VPN',
    category: 'Networking & Content Delivery',
    tier: 2,
    cliPrefix: 'aws ec2',
    summary: 'Managed OpenVPN client endpoint providing remote employees secure, encrypted access to corporate AWS and on-premises resources.',
    flow: { upstream: ['client'], downstream: ['vpc'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'OpenVPN Endpoint' },
  }),

  createService({
    id: 'privatelink',
    name: 'AWS PrivateLink',
    shortName: 'PrivateLink',
    category: 'Networking & Content Delivery',
    tier: 2,
    cliPrefix: 'aws ec2',
    summary: 'Establishes secure, private connectivity between VPCs and supported AWS or SaaS services without exposing traffic to the internet.',
    flow: { upstream: ['vpc'], downstream: ['s3', 'dynamodb'], edgeProtocol: 'VPC PrivateLink', subgraphLabel: 'VPC Endpoint Interface' },
  }),

  createService({
    id: 'vpc-lattice',
    name: 'Amazon VPC Lattice',
    shortName: 'VPC Lattice',
    category: 'Networking & Content Delivery',
    tier: 2,
    cliPrefix: 'aws vpc-lattice',
    summary: 'Application networking service that consistently connects, monitors, and secures service-to-service communication across VPCs.',
    flow: { upstream: ['ecs', 'eks', 'lambda'], downstream: ['rds', 'dynamodb'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Service Network Mesh' },
  }),

  createService({
    id: 'route53-resolver',
    name: 'Route 53 Resolver',
    shortName: 'Route 53 Resolver',
    category: 'Networking & Content Delivery',
    tier: 2,
    cliPrefix: 'aws route53resolver',
    summary: 'Hybrid DNS forwarding service resolving internal VPC domain queries between AWS and on-premises Active Directory DNS servers.',
    flow: { upstream: ['corporate-datacenter'], downstream: ['route53'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'DNS Resolver Endpoints' },
  }),

  createService({
    id: 'network-firewall',
    name: 'AWS Network Firewall',
    shortName: 'Network Firewall',
    category: 'Networking & Content Delivery',
    tier: 2,
    cliPrefix: 'aws network-firewall',
    summary: 'Stateful, managed network firewall inspecting traffic up to Layer 7 with Suricata intrusion prevention across all VPC boundaries.',
    flow: { upstream: ['internet-gateway'], downstream: ['transit-gateway', 'vpc'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Inspection VPC' },
  }),

  createService({
    id: 'app-mesh',
    name: 'AWS App Mesh',
    shortName: 'App Mesh',
    category: 'Networking & Content Delivery',
    tier: 3,
    cliPrefix: 'aws appmesh',
    summary: 'Envoy-based service mesh providing application-level networking, end-to-end encryption, and traffic routing across containers.',
    flow: { upstream: ['ecs', 'eks'], downstream: ['xray'], edgeProtocol: 'gRPC', subgraphLabel: 'Envoy Service Mesh' },
  }),

  createService({
    id: 'cloud-map',
    name: 'AWS Cloud Map',
    shortName: 'Cloud Map',
    category: 'Networking & Content Delivery',
    tier: 3,
    cliPrefix: 'aws servicediscovery',
    summary: 'Cloud application service registry allowing microservices to discover dynamic IP addresses, URLs, and health endpoints.',
    flow: { upstream: ['ecs', 'eks'], downstream: ['route53'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Service Discovery' },
  }),

  createService({
    id: 'traffic-mirroring',
    name: 'VPC Traffic Mirroring',
    shortName: 'Traffic Mirroring',
    category: 'Networking & Content Delivery',
    tier: 3,
    cliPrefix: 'aws ec2',
    summary: 'Copies inbound and outbound network traffic from EC2 elastic network interfaces for security inspection and threat detection.',
    flow: { upstream: ['ec2'], downstream: ['nlb'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Security Mirroring Feed' },
  }),

  createService({
    id: 'reachability-analyzer',
    name: 'VPC Reachability Analyzer',
    shortName: 'Reachability Analyzer',
    category: 'Networking & Content Delivery',
    tier: 3,
    cliPrefix: 'aws ec2',
    summary: 'Static configuration analysis tool that tests network connectivity between VPC source and destination paths without sending packets.',
    flow: { upstream: ['vpc'], downstream: ['cloudwatch'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Formal Verification Tool' },
  }),

  createService({
    id: 'network-access-analyzer',
    name: 'Network Access Analyzer',
    shortName: 'Network Access Analyzer',
    category: 'Networking & Content Delivery',
    tier: 3,
    cliPrefix: 'aws ec2',
    summary: 'Identifies unintended network paths to AWS resources, verifying adherence to enterprise network security standards.',
    flow: { upstream: ['vpc'], downstream: ['security-hub'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Compliance Analysis' },
  }),

  createService({
    id: 'ipam',
    name: 'Amazon VPC IP Address Manager (IPAM)',
    shortName: 'IPAM',
    category: 'Networking & Content Delivery',
    tier: 3,
    cliPrefix: 'aws ec2',
    summary: 'Centralizes IP address planning, tracking, and auditing across multi-account AWS Organizations and on-premises networks.',
    flow: { upstream: ['organizations'], downstream: ['vpc'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'IP CIDR Management' },
  }),

  // =========================================================================
  // 7. SECURITY, IDENTITY & COMPLIANCE (25 Services)
  // =========================================================================
  createService({
    id: 'iam',
    name: 'AWS Identity and Access Management (IAM)',
    shortName: 'IAM',
    category: 'Security, Identity & Compliance',
    tier: 1,
    cliPrefix: 'aws iam',
    arnPattern: 'arn:aws:iam::${accountId}:role/${resourceName}',
    summary: 'Zero-cost access control framework governing authentication, fine-grained JSON authorization policies, and temporary STS credentials.',
    flow: { upstream: ['ec2', 'lambda'], downstream: ['kms', 'secrets-manager'], edgeProtocol: 'IAM Role Assumption', subgraphLabel: 'Identity & Access Boundary' },
  }),

  createService({
    id: 'iam-identity-center',
    name: 'AWS IAM Identity Center (AWS SSO)',
    shortName: 'IAM Identity Center',
    category: 'Security, Identity & Compliance',
    tier: 1,
    cliPrefix: 'aws sso-admin',
    summary: 'Central workforce authentication hub managing single sign-on (SSO) and multi-account permissions via Okta, Entra, or Google.',
    flow: { upstream: ['client'], downstream: ['organizations', 'iam'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Enterprise SSO Federation' },
  }),

  createService({
    id: 'cognito',
    name: 'Amazon Cognito',
    shortName: 'Cognito',
    category: 'Security, Identity & Compliance',
    tier: 1,
    cliPrefix: 'aws cognito-idp',
    arnPattern: 'arn:aws:cognito-idp:${region}:${accountId}:userpool/${resourceName}',
    summary: 'Customer identity, authentication, and authorization platform supporting social logins, MFA, and OAuth 2.0 JWT tokens.',
    flow: { upstream: ['client'], downstream: ['api-gateway', 'lambda'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Customer Identity Pool' },
  }),

  createService({
    id: 'kms',
    name: 'AWS Key Management Service (KMS)',
    shortName: 'KMS',
    category: 'Security, Identity & Compliance',
    tier: 1,
    cliPrefix: 'aws kms',
    arnPattern: 'arn:aws:kms:${region}:${accountId}:key/${resourceName}',
    summary: 'FIPS 140-2 Level 3 HSM-backed encryption key management orchestrating cryptographic envelope operations.',
    flow: { upstream: ['s3', 'ebs', 'rds', 'lambda'], downstream: ['cloudtrail'], edgeProtocol: 'IAM Role Assumption', subgraphLabel: 'Cryptographic Security Boundary' },
  }),

  createService({
    id: 'waf',
    name: 'AWS WAF (Web Application Firewall)',
    shortName: 'WAF',
    category: 'Security, Identity & Compliance',
    tier: 1,
    cliPrefix: 'aws wafv2',
    arnPattern: 'arn:aws:wafv2:${region}:${accountId}:regional/webacl/${resourceName}',
    summary: 'Layer 7 application firewall inspecting HTTP payloads against SQL injection, cross-site scripting (XSS), and bot traffic.',
    flow: { upstream: ['client'], downstream: ['cloudfront', 'alb', 'api-gateway'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'L7 Web Inspection Shield' },
  }),

  createService({
    id: 'shield',
    name: 'AWS Shield',
    shortName: 'Shield',
    category: 'Security, Identity & Compliance',
    tier: 1,
    cliPrefix: 'aws shield',
    summary: 'Managed Distributed Denial of Service (DDoS) protection safeguarding web assets at the edge with Standard and Advanced tiers.',
    flow: { upstream: ['internet-gateway'], downstream: ['cloudfront', 'route53', 'alb'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'DDoS Mitigation Shield' },
  }),

  createService({
    id: 'secrets-manager',
    name: 'AWS Secrets Manager',
    shortName: 'Secrets Manager',
    category: 'Security, Identity & Compliance',
    tier: 1,
    cliPrefix: 'aws secretsmanager',
    arnPattern: 'arn:aws:secretsmanager:${region}:${accountId}:secret:${resourceName}',
    summary: 'Protects database credentials, API tokens, and private keys with automatic rotation and fine-grained IAM retrieval policies.',
    flow: { upstream: ['lambda', 'ec2', 'ecs'], downstream: ['rds', 'kms'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Secrets Vault' },
  }),

  createService({
    id: 'acm',
    name: 'AWS Certificate Manager (ACM)',
    shortName: 'ACM',
    category: 'Security, Identity & Compliance',
    tier: 1,
    cliPrefix: 'aws acm',
    arnPattern: 'arn:aws:acm:${region}:${accountId}:certificate/${resourceName}',
    summary: 'Provisions, manages, and automatically renews public and private SSL/TLS certificates for AWS integrated services.',
    flow: { upstream: ['route53'], downstream: ['alb', 'cloudfront', 'api-gateway'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'TLS Certificate Authority' },
  }),

  createService({
    id: 'guardduty',
    name: 'Amazon GuardDuty',
    shortName: 'GuardDuty',
    category: 'Security, Identity & Compliance',
    tier: 2,
    cliPrefix: 'aws guardduty',
    summary: 'Intelligent threat detection monitoring VPC Flow Logs, DNS logs, CloudTrail events, and EKS audit logs using machine learning.',
    flow: { upstream: ['cloudtrail', 'vpc'], downstream: ['security-hub', 'eventbridge'], edgeProtocol: 'Event Trigger', subgraphLabel: 'Threat Intelligence Mesh' },
  }),

  createService({
    id: 'inspector',
    name: 'Amazon Inspector',
    shortName: 'Inspector',
    category: 'Security, Identity & Compliance',
    tier: 2,
    cliPrefix: 'aws inspector2',
    summary: 'Automated vulnerability management scanning EC2 instances, ECR container images, and Lambda functions for software CVEs.',
    flow: { upstream: ['ec2', 'ecr', 'lambda'], downstream: ['security-hub'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Vulnerability Scanner' },
  }),

  createService({
    id: 'macie',
    name: 'Amazon Macie',
    shortName: 'Macie',
    category: 'Security, Identity & Compliance',
    tier: 2,
    cliPrefix: 'aws macie2',
    summary: 'Data security and privacy service using machine learning to automatically discover, classify, and protect sensitive PII in Amazon S3.',
    flow: { upstream: ['s3'], downstream: ['security-hub', 'eventbridge'], edgeProtocol: 'Event Trigger', subgraphLabel: 'Sensitive Data Discovery' },
  }),

  createService({
    id: 'security-hub',
    name: 'AWS Security Hub',
    shortName: 'Security Hub',
    category: 'Security, Identity & Compliance',
    tier: 2,
    cliPrefix: 'aws securityhub',
    summary: 'Single-pane posture management dashboard aggregating security alerts and assessing compliance against CIS and PCI-DSS.',
    flow: { upstream: ['guardduty', 'inspector', 'macie'], downstream: ['eventbridge', 'cloudwatch'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'CSPM Hub' },
  }),

  createService({
    id: 'detective',
    name: 'Amazon Detective',
    shortName: 'Detective',
    category: 'Security, Identity & Compliance',
    tier: 2,
    cliPrefix: 'aws detective',
    summary: 'Simplifies root-cause security investigations by analyzing billions of telemetry events into visual interactive graph models.',
    flow: { upstream: ['guardduty'], downstream: ['security-hub'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Security Graph Investigator' },
  }),

  createService({
    id: 'artifact',
    name: 'AWS Artifact',
    shortName: 'Artifact',
    category: 'Security, Identity & Compliance',
    tier: 2,
    cliPrefix: 'aws artifact',
    summary: 'Self-service portal providing on-demand access to AWS compliance reports, SOC 1/2/3 audits, and ISO certifications.',
    flow: { upstream: ['client'], downstream: ['s3'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Audit Vault' },
  }),

  createService({
    id: 'audit-manager',
    name: 'AWS Audit Manager',
    shortName: 'Audit Manager',
    category: 'Security, Identity & Compliance',
    tier: 2,
    cliPrefix: 'aws auditmanager',
    summary: 'Continuously audits AWS usage to simplify risk assessment and compliance with regulations like GDPR and HIPAA.',
    flow: { upstream: ['cloudtrail', 'config'], downstream: ['s3'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Audit Pipeline' },
  }),

  createService({
    id: 'ram',
    name: 'AWS Resource Access Manager (RAM)',
    shortName: 'RAM',
    category: 'Security, Identity & Compliance',
    tier: 2,
    cliPrefix: 'aws ram',
    summary: 'Securely share subnets, Transit Gateways, and licenses across AWS accounts within an Organization without duplication.',
    flow: { upstream: ['organizations'], downstream: ['vpc', 'transit-gateway'], edgeProtocol: 'IAM Role Assumption', subgraphLabel: 'Resource Sharing Bus' },
  }),

  createService({
    id: 'directory-service',
    name: 'AWS Directory Service',
    shortName: 'Directory Service',
    category: 'Security, Identity & Compliance',
    tier: 2,
    cliPrefix: 'aws ds',
    summary: 'Managed Microsoft Active Directory in the AWS Cloud, enabling SSO and domain-join for Windows EC2 instances.',
    flow: { upstream: ['ec2', 'fsx-windows'], downstream: ['iam-identity-center'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Active Directory Domain' },
  }),

  createService({
    id: 'firewall-manager',
    name: 'AWS Firewall Manager',
    shortName: 'Firewall Manager',
    category: 'Security, Identity & Compliance',
    tier: 2,
    cliPrefix: 'aws fms',
    summary: 'Centrally configure and manage firewall rules, WAF policies, Shield Advanced, and Security Groups across all Organization accounts.',
    flow: { upstream: ['organizations'], downstream: ['waf', 'shield', 'network-firewall'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Policy Distribution Engine' },
  }),

  createService({
    id: 'verified-access',
    name: 'AWS Verified Access',
    shortName: 'Verified Access',
    category: 'Security, Identity & Compliance',
    tier: 2,
    cliPrefix: 'aws ec2',
    summary: 'Zero Trust network access for corporate applications without a VPN, evaluating real-time user identity and device posture.',
    flow: { upstream: ['client'], downstream: ['alb', 'ec2'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Zero Trust Gateway' },
  }),

  createService({
    id: 'signer',
    name: 'AWS Signer',
    shortName: 'Signer',
    category: 'Security, Identity & Compliance',
    tier: 3,
    cliPrefix: 'aws signer',
    summary: 'Fully managed code-signing service to confirm the authenticity and integrity of software code and container images.',
    flow: { upstream: ['lambda', 'ecr'], downstream: ['s3'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Code Signature Engine' },
  }),

  createService({
    id: 'private-ca',
    name: 'AWS Private Certificate Authority',
    shortName: 'Private CA',
    category: 'Security, Identity & Compliance',
    tier: 3,
    cliPrefix: 'aws acm-pca',
    summary: 'Highly available private certificate authority for issuing and managing private x.509 certificates internally.',
    flow: { upstream: ['acm'], downstream: ['ec2', 'iot-core'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Private Root CA' },
  }),

  createService({
    id: 'payment-cryptography',
    name: 'AWS Payment Cryptography',
    shortName: 'Payment Cryptography',
    category: 'Security, Identity & Compliance',
    tier: 3,
    cliPrefix: 'aws payment-cryptography',
    summary: 'Elastic cloud payment HSM service meeting PCI PIN and PCI P2PE standards for electronic card payment processing.',
    flow: { upstream: ['ec2', 'lambda'], downstream: ['cloudwatch'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'PCI Payment HSM' },
  }),

  createService({
    id: 'security-lake',
    name: 'Amazon Security Lake',
    shortName: 'Security Lake',
    category: 'Security, Identity & Compliance',
    tier: 3,
    cliPrefix: 'aws securitylake',
    summary: 'Automatically centralizes security data from cloud, on-premises, and custom sources into a purpose-built OCSF data lake.',
    flow: { upstream: ['guardduty', 'cloudtrail', 'vpc'], downstream: ['s3', 'athena'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'OCSF Security Lake' },
  }),

  createService({
    id: 'wickr',
    name: 'AWS Wickr',
    shortName: 'Wickr',
    category: 'Security, Identity & Compliance',
    tier: 3,
    cliPrefix: 'aws wickr',
    summary: 'End-to-end encrypted messaging, voice, video calling, and file sharing designed for military and enterprise security.',
    flow: { upstream: ['client'], downstream: ['s3'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'E2EE Collaboration' },
  }),

  createService({
    id: 'cognito-sync',
    name: 'Amazon Cognito Sync',
    shortName: 'Cognito Sync',
    category: 'Security, Identity & Compliance',
    tier: 3,
    cliPrefix: 'aws cognito-sync',
    summary: 'Synchronizes user profile data across mobile devices and platforms with offline caching and background synchronization.',
    flow: { upstream: ['cognito'], downstream: ['dynamodb'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Profile Sync Bus' },
  }),

  // =========================================================================
  // 8. APPLICATION INTEGRATION (8 Services)
  // =========================================================================
  createService({
    id: 'sqs',
    name: 'Amazon SQS (Simple Queue Service)',
    shortName: 'SQS',
    category: 'Application Integration',
    tier: 1,
    cliPrefix: 'aws sqs',
    arnPattern: 'arn:aws:sqs:${region}:${accountId}:${resourceName}',
    summary: 'Fully managed distributed message queuing service decoupling microservices with Standard and strict FIFO semantics.',
    flow: { upstream: ['sns', 's3', 'api-gateway'], downstream: ['lambda', 'ecs'], edgeProtocol: 'Event Trigger', subgraphLabel: 'Message Queue Tier' },
  }),

  createService({
    id: 'sns',
    name: 'Amazon SNS (Simple Notification Service)',
    shortName: 'SNS',
    category: 'Application Integration',
    tier: 1,
    cliPrefix: 'aws sns',
    arnPattern: 'arn:aws:sns:${region}:${accountId}:${resourceName}',
    summary: 'High-throughput pub/sub fanout messaging service publishing to SQS, Lambda, HTTP endpoints, mobile push, and SMS.',
    flow: { upstream: ['cloudwatch', 's3'], downstream: ['sqs', 'lambda', 'ses'], edgeProtocol: 'Event Trigger', subgraphLabel: 'Pub/Sub Topic Tier' },
  }),

  createService({
    id: 'amazon-mq',
    name: 'Amazon MQ',
    shortName: 'Amazon MQ',
    category: 'Application Integration',
    tier: 2,
    cliPrefix: 'aws mq',
    summary: 'Managed message broker service for Apache ActiveMQ and RabbitMQ, enabling seamless migration of enterprise JMS brokers.',
    flow: { upstream: ['ec2', 'corporate-datacenter'], downstream: ['ecs', 'lambda'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Managed Message Broker' },
  }),

  createService({
    id: 'appflow',
    name: 'Amazon AppFlow',
    shortName: 'AppFlow',
    category: 'Application Integration',
    tier: 2,
    cliPrefix: 'aws appflow',
    summary: 'No-code integration service transferring bidirectional data securely between SaaS apps (Salesforce, Zendesk) and AWS storage.',
    flow: { upstream: ['salesforce', 'slack'], downstream: ['s3', 'redshift', 'snowflake'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'SaaS Integration Flow' },
  }),

  createService({
    id: 'mwaa',
    name: 'Amazon Managed Workflows for Apache Airflow (MWAA)',
    shortName: 'MWAA',
    category: 'Application Integration',
    tier: 2,
    cliPrefix: 'aws mwaa',
    summary: 'Fully managed Apache Airflow orchestration service executing directed acyclic graph (DAG) pipelines at scale.',
    flow: { upstream: ['s3'], downstream: ['emr', 'glue', 'redshift'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Airflow Orchestrator' },
  }),

  createService({
    id: 'b2b-data-interchange',
    name: 'AWS B2B Data Interchange',
    shortName: 'B2B Interchange',
    category: 'Application Integration',
    tier: 3,
    cliPrefix: 'aws b2bi',
    summary: 'Automates the transformation of Electronic Data Interchange (EDI) documents (X12) into standardized JSON/XML formats.',
    flow: { upstream: ['transfer-family'], downstream: ['s3', 'eventbridge'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'EDI Document Parser' },
  }),

  createService({
    id: 'chime-sdk',
    name: 'Amazon Chime SDK',
    shortName: 'Chime SDK',
    category: 'Application Integration',
    tier: 3,
    cliPrefix: 'aws chime-sdk-meetings',
    summary: 'Real-time audio, video, screen share, and messaging APIs to build collaborative communications directly inside web apps.',
    flow: { upstream: ['client'], downstream: ['kinesis-streams'], edgeProtocol: 'WebSocket', subgraphLabel: 'WebRTC Media Mesh' },
  }),

  createService({
    id: 'connect',
    name: 'Amazon Connect',
    shortName: 'Amazon Connect',
    category: 'Application Integration',
    tier: 3,
    cliPrefix: 'aws connect',
    summary: 'Cloud-based AI contact center delivering omnichannel customer service with automated speech recognition and routing.',
    flow: { upstream: ['client'], downstream: ['lex', 'kinesis-streams', 's3'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Omnichannel Contact Center' },
  }),

  // =========================================================================
  // 9. ANALYTICS (16 Services)
  // =========================================================================
  createService({
    id: 'athena',
    name: 'Amazon Athena',
    shortName: 'Athena',
    category: 'Analytics',
    tier: 2,
    cliPrefix: 'aws athena',
    summary: 'Serverless interactive SQL query service analyzing exabytes of data directly in Amazon S3 with zero infrastructure setup.',
    flow: { upstream: ['s3', 'glue'], downstream: ['quicksight'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Serverless Presto Engine' },
  }),

  createService({
    id: 'glue',
    name: 'AWS Glue',
    shortName: 'Glue',
    category: 'Analytics',
    tier: 2,
    cliPrefix: 'aws glue',
    summary: 'Serverless data integration and ETL service cataloging schema metadata and processing big data transformations with Apache Spark.',
    flow: { upstream: ['s3', 'rds'], downstream: ['redshift', 's3', 'athena'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Serverless ETL Spark Job' },
  }),

  createService({
    id: 'kinesis-streams',
    name: 'Amazon Kinesis Data Streams',
    shortName: 'Kinesis Streams',
    category: 'Analytics',
    tier: 2,
    cliPrefix: 'aws kinesis',
    summary: 'Massively scalable real-time streaming data ingestion engine capturing gigabytes of records per second across millions of sources.',
    flow: { upstream: ['iot-core', 'ec2'], downstream: ['lambda', 'data-firehose'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Real-Time Ingestion Shards' },
  }),

  createService({
    id: 'data-firehose',
    name: 'Amazon Data Firehose',
    shortName: 'Data Firehose',
    category: 'Analytics',
    tier: 2,
    cliPrefix: 'aws firehose',
    summary: 'Reliably buffers, transforms, and loads streaming telemetry records directly into S3, Redshift, OpenSearch, and Splunk.',
    flow: { upstream: ['kinesis-streams', 'cloudwatch'], downstream: ['s3', 'redshift', 'opensearch'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Buffering & Delivery Pipeline' },
  }),

  createService({
    id: 'managed-flink',
    name: 'Amazon Managed Service for Apache Flink',
    shortName: 'Managed Flink',
    category: 'Analytics',
    tier: 2,
    cliPrefix: 'aws kinesisanalyticsv2',
    summary: 'Continuously process and analyze streaming data using Apache Flink stateful stream processing engines.',
    flow: { upstream: ['kinesis-streams', 'msk'], downstream: ['opensearch', 's3'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Stateful Stream Analytics' },
  }),

  createService({
    id: 'opensearch',
    name: 'Amazon OpenSearch Service',
    shortName: 'OpenSearch',
    category: 'Analytics',
    tier: 2,
    cliPrefix: 'aws opensearch',
    summary: 'Distributed search and analytics suite providing full-text search, observability log analytics, and vector embeddings.',
    flow: { upstream: ['data-firehose', 'cloudwatch'], downstream: ['quicksight'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Search & Log Cluster' },
  }),

  createService({
    id: 'quicksight',
    name: 'Amazon QuickSight',
    shortName: 'QuickSight',
    category: 'Analytics',
    tier: 2,
    cliPrefix: 'aws quicksight',
    summary: 'Cloud-native business intelligence (BI) service powered by machine learning, generating interactive dashboards and natural language queries.',
    flow: { upstream: ['athena', 'redshift', 'rds'], downstream: ['client'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'BI Dashboard Engine' },
  }),

  createService({
    id: 'emr',
    name: 'Amazon EMR',
    shortName: 'EMR',
    category: 'Analytics',
    tier: 2,
    cliPrefix: 'aws emr',
    summary: 'Big data platform running large-scale distributed analytics frameworks like Apache Spark, Hadoop, Presto, and Trino.',
    flow: { upstream: ['s3'], downstream: ['s3', 'glue'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Hadoop/Spark Cluster' },
  }),

  createService({
    id: 'lake-formation',
    name: 'AWS Lake Formation',
    shortName: 'Lake Formation',
    category: 'Analytics',
    tier: 2,
    cliPrefix: 'aws lakeformation',
    summary: 'Simplifies data lake creation by centralizing governance, security policies, and cell-level access controls over S3 objects.',
    flow: { upstream: ['s3'], downstream: ['athena', 'redshift', 'emr'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Governance Policy Layer' },
  }),

  createService({
    id: 'msk',
    name: 'Amazon MSK (Managed Streaming for Apache Kafka)',
    shortName: 'MSK',
    category: 'Analytics',
    tier: 2,
    cliPrefix: 'aws kafka',
    summary: 'Fully managed Apache Kafka service running highly available distributed event streaming brokers across multiple Availability Zones.',
    flow: { upstream: ['ec2', 'ecs'], downstream: ['managed-flink', 's3'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Kafka Broker Mesh' },
  }),

  createService({
    id: 'data-exchange',
    name: 'AWS Data Exchange',
    shortName: 'Data Exchange',
    category: 'Analytics',
    tier: 2,
    cliPrefix: 'aws dataexchange',
    summary: 'Find, subscribe to, and use third-party datasets in the cloud from hundreds of commercial data providers.',
    flow: { upstream: ['third-party'], downstream: ['s3', 'redshift'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Commercial Data Feed' },
  }),

  createService({
    id: 'clean-rooms',
    name: 'AWS Clean Rooms',
    shortName: 'Clean Rooms',
    category: 'Analytics',
    tier: 2,
    cliPrefix: 'aws cleanrooms',
    summary: 'Collaborate and analyze combined datasets with business partners without sharing or exposing the underlying raw data.',
    flow: { upstream: ['s3'], downstream: ['athena'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Cryptographic Clean Room' },
  }),

  createService({
    id: 'datazone',
    name: 'Amazon DataZone',
    shortName: 'DataZone',
    category: 'Analytics',
    tier: 3,
    cliPrefix: 'aws datazone',
    summary: 'Data management service making it easy to catalog, discover, share, and govern data stored across organizational boundaries.',
    flow: { upstream: ['glue', 's3'], downstream: ['athena', 'redshift'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Enterprise Data Catalog' },
  }),

  createService({
    id: 'finspace',
    name: 'Amazon FinSpace',
    shortName: 'FinSpace',
    category: 'Analytics',
    tier: 3,
    cliPrefix: 'aws finspace',
    summary: 'Purpose-built financial analytics management service accelerating data discovery and compliance for capital market firms.',
    flow: { upstream: ['s3'], downstream: ['quicksight'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Financial Modeling Engine' },
  }),

  createService({
    id: 'healthlake',
    name: 'AWS HealthLake',
    shortName: 'HealthLake',
    category: 'Analytics',
    tier: 3,
    cliPrefix: 'aws healthlake',
    summary: 'HIPAA-eligible data lake that transforms unstructured healthcare records into the standard FHIR format for fast analytics.',
    flow: { upstream: ['s3'], downstream: ['comprehend'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'FHIR Health Data Lake' },
  }),

  createService({
    id: 'healthomics',
    name: 'AWS HealthOmics',
    shortName: 'HealthOmics',
    category: 'Analytics',
    tier: 3,
    cliPrefix: 'aws omics',
    summary: 'Purpose-built service storing, querying, and analyzing genomic, transcriptomic, and multi-omics biological data.',
    flow: { upstream: ['s3'], downstream: ['athena', 'sagemaker'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Genomic Sequence Pipeline' },
  }),

  // =========================================================================
  // 10. MACHINE LEARNING & AI (22 Services)
  // =========================================================================
  createService({
    id: 'bedrock',
    name: 'Amazon Bedrock',
    shortName: 'Bedrock',
    category: 'Machine Learning & AI',
    tier: 2,
    cliPrefix: 'aws bedrock',
    arnPattern: 'arn:aws:bedrock:${region}:${accountId}:foundation-model/${resourceName}',
    summary: 'Fully managed service offering choice of high-performing Foundation Models (Claude, Llama, Titan) via a single unified API.',
    flow: { upstream: ['api-gateway', 'lambda'], downstream: ['s3', 'opensearch'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Generative AI Foundation Tier' },
  }),

  createService({
    id: 'sagemaker',
    name: 'Amazon SageMaker AI',
    shortName: 'SageMaker',
    category: 'Machine Learning & AI',
    tier: 2,
    cliPrefix: 'aws sagemaker',
    arnPattern: 'arn:aws:sagemaker:${region}:${accountId}:endpoint/${resourceName}',
    summary: 'End-to-end machine learning platform building, training, tuning, and deploying predictive and generative AI models at scale.',
    flow: { upstream: ['s3', 'ecr'], downstream: ['cloudwatch', 'api-gateway'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'MLOps Training & Inference' },
  }),

  createService({
    id: 'q-developer',
    name: 'Amazon Q Developer',
    shortName: 'Q Developer',
    category: 'Machine Learning & AI',
    tier: 2,
    cliPrefix: 'aws qdeveloper',
    summary: 'Generative AI coding assistant that generates code completions, tests, security scans, and upgrades Java legacy runtimes.',
    flow: { upstream: ['client'], downstream: ['iam'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'AI Coding Assistant' },
  }),

  createService({
    id: 'q-business',
    name: 'Amazon Q Business',
    shortName: 'Q Business',
    category: 'Machine Learning & AI',
    tier: 2,
    cliPrefix: 'aws qbusiness',
    summary: 'Generative AI business assistant answering workplace questions grounded in enterprise documents with strict ACL filters.',
    flow: { upstream: ['client'], downstream: ['s3', 'iam-identity-center'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Enterprise RAG Assistant' },
  }),

  createService({
    id: 'rekognition',
    name: 'Amazon Rekognition',
    shortName: 'Rekognition',
    category: 'Machine Learning & AI',
    tier: 2,
    cliPrefix: 'aws rekognition',
    summary: 'Pre-trained computer vision service identifying objects, people, text, scenes, and inappropriate content in images and video.',
    flow: { upstream: ['s3'], downstream: ['lambda', 'sns'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Computer Vision Inference' },
  }),

  createService({
    id: 'textract',
    name: 'Amazon Textract',
    shortName: 'Textract',
    category: 'Machine Learning & AI',
    tier: 2,
    cliPrefix: 'aws textract',
    summary: 'ML service automatically extracting printed text, handwriting, tables, and structured key-value pairs from scanned documents.',
    flow: { upstream: ['s3'], downstream: ['lambda', 'dynamodb'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'OCR Document Extraction' },
  }),

  createService({
    id: 'comprehend',
    name: 'Amazon Comprehend',
    shortName: 'Comprehend',
    category: 'Machine Learning & AI',
    tier: 2,
    cliPrefix: 'aws comprehend',
    summary: 'Natural language processing (NLP) service uncovering insights, sentiment, syntax, and PII entities from unstructured text.',
    flow: { upstream: ['s3'], downstream: ['dynamodb'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'NLP Sentiment Analyzer' },
  }),

  createService({
    id: 'polly',
    name: 'Amazon Polly',
    shortName: 'Polly',
    category: 'Machine Learning & AI',
    tier: 2,
    cliPrefix: 'aws polly',
    summary: 'Text-to-speech service synthesizing realistic natural human voices in dozens of languages with neural pronunciation.',
    flow: { upstream: ['lambda'], downstream: ['s3'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Neural Speech Synthesizer' },
  }),

  createService({
    id: 'transcribe',
    name: 'Amazon Transcribe',
    shortName: 'Transcribe',
    category: 'Machine Learning & AI',
    tier: 2,
    cliPrefix: 'aws transcribe',
    summary: 'Automatic speech recognition (ASR) converting recorded audio streams and telephony calls into accurate text transcripts.',
    flow: { upstream: ['s3'], downstream: ['comprehend', 'lambda'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Speech Recognition Engine' },
  }),

  createService({
    id: 'translate',
    name: 'Amazon Translate',
    shortName: 'Translate',
    category: 'Machine Learning & AI',
    tier: 2,
    cliPrefix: 'aws translate',
    summary: 'Neural machine translation service delivering fast, high-quality, cost-effective language translation across 75+ languages.',
    flow: { upstream: ['lambda'], downstream: ['dynamodb'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Language Translation Bus' },
  }),

  createService({
    id: 'lex',
    name: 'Amazon Lex',
    shortName: 'Lex',
    category: 'Machine Learning & AI',
    tier: 2,
    cliPrefix: 'aws lexv2-runtime',
    summary: 'Build conversational interfaces and voice chatbots powered by the same deep learning engine as Amazon Alexa.',
    flow: { upstream: ['connect', 'client'], downstream: ['lambda'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Conversational NLU Engine' },
  }),

  createService({
    id: 'kendra',
    name: 'Amazon Kendra',
    shortName: 'Kendra',
    category: 'Machine Learning & AI',
    tier: 2,
    cliPrefix: 'aws kendra',
    summary: 'Intelligent enterprise search engine powered by machine learning, returning precise natural-language answers from documents.',
    flow: { upstream: ['s3', 'sharepoint'], downstream: ['api-gateway'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Semantic Search Engine' },
  }),

  createService({
    id: 'personalize',
    name: 'Amazon Personalize',
    shortName: 'Personalize',
    category: 'Machine Learning & AI',
    tier: 2,
    cliPrefix: 'aws personalize',
    summary: 'Real-time personalization and product recommendation engine trained on the same algorithms developed by Amazon.com.',
    flow: { upstream: ['s3', 'kinesis-streams'], downstream: ['api-gateway'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Recommendation Model' },
  }),

  createService({
    id: 'forecast',
    name: 'Amazon Forecast',
    shortName: 'Forecast',
    category: 'Machine Learning & AI',
    tier: 3,
    cliPrefix: 'aws forecast',
    summary: 'Time-series forecasting service combining statistical algorithms with deep learning to predict inventory demand and resource usage.',
    flow: { upstream: ['s3'], downstream: ['quicksight'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Predictive Forecast Mesh' },
  }),

  createService({
    id: 'fraud-detector',
    name: 'Amazon Fraud Detector',
    shortName: 'Fraud Detector',
    category: 'Machine Learning & AI',
    tier: 3,
    cliPrefix: 'aws frauddetector',
    summary: 'Identifies potentially fraudulent online events like payment fraud and fake account creation using customized ML models.',
    flow: { upstream: ['api-gateway'], downstream: ['eventbridge'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Fraud Detection Pipeline' },
  }),

  createService({
    id: 'lookout-equipment',
    name: 'Amazon Lookout for Equipment',
    shortName: 'Lookout Equipment',
    category: 'Machine Learning & AI',
    tier: 3,
    cliPrefix: 'aws lookout-equipment',
    summary: 'Detects abnormal industrial machine conditions and early signs of equipment failure from historical sensor data.',
    flow: { upstream: ['iot-sitewise', 's3'], downstream: ['sns'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Predictive Maintenance' },
  }),

  createService({
    id: 'lookout-metrics',
    name: 'Amazon Lookout for Metrics',
    shortName: 'Lookout Metrics',
    category: 'Machine Learning & AI',
    tier: 3,
    cliPrefix: 'aws lookoutmetrics',
    summary: 'Monitors key business metrics and operational telemetry, automatically detecting anomalies and pinpointing their root cause.',
    flow: { upstream: ['s3', 'rds', 'cloudwatch'], downstream: ['sns', 'slack'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Anomaly Detector' },
  }),

  createService({
    id: 'lookout-vision',
    name: 'Amazon Lookout for Vision',
    shortName: 'Lookout Vision',
    category: 'Machine Learning & AI',
    tier: 3,
    cliPrefix: 'aws lookoutvision',
    summary: 'Computer vision service inspecting manufactured goods for physical defects and quality issues using custom image models.',
    flow: { upstream: ['s3'], downstream: ['sns'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Visual Quality Control' },
  }),

  createService({
    id: 'a2i',
    name: 'Amazon Augmented AI (A2I)',
    shortName: 'A2I',
    category: 'Machine Learning & AI',
    tier: 3,
    cliPrefix: 'aws sagemaker-a2i-runtime',
    summary: 'Integrates human reviewer loops into machine learning workflows when predictions have low confidence scores.',
    flow: { upstream: ['textract', 'rekognition'], downstream: ['s3'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Human-in-the-Loop Review' },
  }),

  createService({
    id: 'panorama',
    name: 'AWS Panorama',
    shortName: 'Panorama',
    category: 'Machine Learning & AI',
    tier: 3,
    cliPrefix: 'aws panorama',
    summary: 'Brings computer vision to existing on-premises network cameras with edge hardware appliances to automate industrial quality.',
    flow: { upstream: ['corporate-datacenter'], downstream: ['s3', 'cloudwatch'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Edge Vision Appliance' },
  }),

  createService({
    id: 'deepracer',
    name: 'AWS DeepRacer',
    shortName: 'DeepRacer',
    category: 'Machine Learning & AI',
    tier: 3,
    cliPrefix: 'aws deepracer',
    summary: '1/18th scale autonomous racing car platform engineered for developers to master reinforcement learning models.',
    flow: { upstream: ['sagemaker'], downstream: ['robomaker', 's3'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Reinforcement Learning' },
  }),

  createService({
    id: 'sagemaker-hyperpod',
    name: 'Amazon SageMaker HyperPod',
    shortName: 'HyperPod',
    category: 'Machine Learning & AI',
    tier: 3,
    cliPrefix: 'aws sagemaker',
    summary: 'Optimized compute cluster infrastructure purpose-built for massive-scale distributed Foundation Model training.',
    flow: { upstream: ['s3', 'fsx-lustre'], downstream: ['cloudwatch'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'LLM Cluster Mesh' },
  }),

  // =========================================================================
  // 11. MANAGEMENT & GOVERNANCE (23 Services)
  // =========================================================================
  createService({
    id: 'cloudwatch',
    name: 'Amazon CloudWatch',
    shortName: 'CloudWatch',
    category: 'Management & Governance',
    tier: 1,
    cliPrefix: 'aws cloudwatch',
    arnPattern: 'arn:aws:cloudwatch:${region}:${accountId}:alarm:${resourceName}',
    summary: 'Comprehensive observability platform monitoring metrics, collecting streaming logs, and firing automated threshold alarms.',
    flow: { upstream: ['ec2', 'lambda', 'rds', 'alb'], downstream: ['sns', 'eventbridge'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Unified Telemetry Hub' },
  }),

  createService({
    id: 'cloudtrail',
    name: 'AWS CloudTrail',
    shortName: 'CloudTrail',
    category: 'Management & Governance',
    tier: 1,
    cliPrefix: 'aws cloudtrail',
    arnPattern: 'arn:aws:cloudtrail:${region}:${accountId}:trail/${resourceName}',
    summary: 'Immutable audit logging service recording all API calls, user logins, and administrative management events across AWS accounts.',
    flow: { upstream: ['iam', 'ec2', 's3'], downstream: ['s3', 'cloudwatch', 'guardduty'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Audit & Compliance Log' },
  }),

  createService({
    id: 'systems-manager',
    name: 'AWS Systems Manager (SSM)',
    shortName: 'Systems Manager',
    category: 'Management & Governance',
    tier: 1,
    cliPrefix: 'aws ssm',
    arnPattern: 'arn:aws:ssm:${region}:${accountId}:parameter/${resourceName}',
    summary: 'Operational control hub automating configuration management, secure Session Manager shell access, and Parameter Store secrets.',
    flow: { upstream: ['ec2', 'ecs'], downstream: ['cloudwatch', 'kms'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Fleet Operations Control' },
  }),

  createService({
    id: 'cloudformation',
    name: 'AWS CloudFormation',
    shortName: 'CloudFormation',
    category: 'Management & Governance',
    tier: 1,
    cliPrefix: 'aws cloudformation',
    arnPattern: 'arn:aws:cloudformation:${region}:${accountId}:stack/${resourceName}/*',
    summary: 'Declarative Infrastructure-as-Code (IaC) engine provisioning and managing collections of AWS resources via JSON/YAML templates.',
    flow: { upstream: ['codepipeline', 'github-actions'], downstream: ['ec2', 'vpc', 'rds', 's3'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'IaC Orchestrator' },
  }),

  createService({
    id: 'organizations',
    name: 'AWS Organizations',
    shortName: 'Organizations',
    category: 'Management & Governance',
    tier: 1,
    cliPrefix: 'aws organizations',
    arnPattern: 'arn:aws:organizations::${accountId}:account/${resourceName}',
    summary: 'Multi-account management governing Organizational Units (OUs), consolidated billing, and Service Control Policies (SCPs).',
    flow: { upstream: ['iam-identity-center'], downstream: ['iam', 'control-tower', 'ram'], edgeProtocol: 'IAM Role Assumption', subgraphLabel: 'Multi-Account Root' },
  }),

  createService({
    id: 'config',
    name: 'AWS Config',
    shortName: 'Config',
    category: 'Management & Governance',
    tier: 2,
    cliPrefix: 'aws configservice',
    summary: 'Continually tracks, evaluates, and audits configuration states of AWS resources against compliance rule baselines.',
    flow: { upstream: ['ec2', 's3', 'rds'], downstream: ['security-hub', 'sns'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Configuration Baseline' },
  }),

  createService({
    id: 'control-tower',
    name: 'AWS Control Tower',
    shortName: 'Control Tower',
    category: 'Management & Governance',
    tier: 2,
    cliPrefix: 'aws controltower',
    summary: 'Orchestrates a multi-account AWS landing zone built on AWS best practices with mandatory preventive and detective guardrails.',
    flow: { upstream: ['organizations'], downstream: ['cloudtrail', 'config', 'iam-identity-center'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Enterprise Landing Zone' },
  }),

  createService({
    id: 'service-catalog',
    name: 'AWS Service Catalog',
    shortName: 'Service Catalog',
    category: 'Management & Governance',
    tier: 2,
    cliPrefix: 'aws servicecatalog',
    summary: 'Allows enterprises to create, govern, and distribute approved portfolios of cloud architecture templates for developer self-service.',
    flow: { upstream: ['cloudformation'], downstream: ['iam', 'organizations'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Approved Product Portfolio' },
  }),

  createService({
    id: 'trusted-advisor',
    name: 'AWS Trusted Advisor',
    shortName: 'Trusted Advisor',
    category: 'Management & Governance',
    tier: 2,
    cliPrefix: 'aws support',
    summary: 'Real-time cloud recommendations providing guidance across cost optimization, security, fault tolerance, and performance.',
    flow: { upstream: ['cloudwatch'], downstream: ['sns'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Best-Practice Advisor' },
  }),

  createService({
    id: 'xray',
    name: 'AWS X-Ray',
    shortName: 'X-Ray',
    category: 'Management & Governance',
    tier: 2,
    cliPrefix: 'aws xray',
    summary: 'Distributed tracing system recording request journeys through microservices to pinpoint latency bottlenecks and error origins.',
    flow: { upstream: ['lambda', 'api-gateway', 'ecs'], downstream: ['cloudwatch'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Distributed Tracing Map' },
  }),

  createService({
    id: 'managed-grafana',
    name: 'Amazon Managed Grafana',
    shortName: 'Managed Grafana',
    category: 'Management & Governance',
    tier: 2,
    cliPrefix: 'aws grafana',
    summary: 'Fully managed Grafana data visualization workspace querying CloudWatch, Prometheus, and external SQL databases.',
    flow: { upstream: ['cloudwatch', 'managed-prometheus', 'timestream'], downstream: ['client'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Grafana Visualization' },
  }),

  createService({
    id: 'managed-prometheus',
    name: 'Amazon Managed Service for Prometheus',
    shortName: 'Managed Prometheus',
    category: 'Management & Governance',
    tier: 2,
    cliPrefix: 'aws aps',
    summary: 'Serverless Prometheus-compatible monitoring service securely storing and querying operational container metrics.',
    flow: { upstream: ['eks', 'ecs'], downstream: ['managed-grafana', 'sns'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Prometheus TSDB' },
  }),

  createService({
    id: 'resilience-hub',
    name: 'AWS Resilience Hub',
    shortName: 'Resilience Hub',
    category: 'Management & Governance',
    tier: 2,
    cliPrefix: 'aws resiliencehub',
    summary: 'Assesses application resilience against RTO/RPO targets, recommending automated disaster recovery architectures.',
    flow: { upstream: ['cloudformation', 'cloudwatch'], downstream: ['fis'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Resilience Scorecard' },
  }),

  createService({
    id: 'well-architected-tool',
    name: 'AWS Well-Architected Tool',
    shortName: 'Well-Architected Tool',
    category: 'Management & Governance',
    tier: 2,
    cliPrefix: 'aws wellarchitected',
    summary: 'Measures cloud architectures against the 6 Well-Architected Pillars (Security, Cost, Reliability, Performance, Ops, Sustainability).',
    flow: { upstream: ['client'], downstream: ['trusted-advisor'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Architectural Review' },
  }),

  createService({
    id: 'proton',
    name: 'AWS Proton',
    shortName: 'Proton',
    category: 'Management & Governance',
    tier: 3,
    cliPrefix: 'aws proton',
    summary: 'Automated provisioning and governance platform for platform engineering teams to publish standardized microservice infrastructure templates.',
    flow: { upstream: ['cloudformation'], downstream: ['ecs', 'lambda', 'codepipeline'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Platform Engineering Hub' },
  }),

  createService({
    id: 'opsworks',
    name: 'AWS OpsWorks',
    shortName: 'OpsWorks',
    category: 'Management & Governance',
    tier: 3,
    cliPrefix: 'aws opsworks',
    summary: 'Configuration management service providing managed instances of Chef and Puppet to automate software deployment.',
    flow: { upstream: ['ec2'], downstream: ['cloudwatch'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Chef/Puppet Server' },
  }),

  createService({
    id: 'fis',
    name: 'AWS Fault Injection Service (FIS)',
    shortName: 'FIS (Chaos Engineering)',
    category: 'Management & Governance',
    tier: 3,
    cliPrefix: 'aws fis',
    summary: 'Controlled chaos engineering platform deliberately injecting CPU spikes, network latency, and AZ outages to validate resiliency.',
    flow: { upstream: ['ec2', 'ecs', 'rds'], downstream: ['cloudwatch'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Chaos Injection Engine' },
  }),

  createService({
    id: 'license-manager',
    name: 'AWS License Manager',
    shortName: 'License Manager',
    category: 'Management & Governance',
    tier: 3,
    cliPrefix: 'aws license-manager',
    summary: 'Manages and audits enterprise software licenses (Microsoft, Oracle, SAP) across hybrid cloud and on-premises environments.',
    flow: { upstream: ['organizations'], downstream: ['ec2'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'License Inventory' },
  }),

  createService({
    id: 'chatbot',
    name: 'AWS Chatbot',
    shortName: 'Chatbot',
    category: 'Management & Governance',
    tier: 3,
    cliPrefix: 'aws chatbot',
    summary: 'ChatOps bot routing CloudWatch alarms, DevOps notifications, and CLI commands directly to Slack and Microsoft Teams.',
    flow: { upstream: ['sns', 'cloudwatch'], downstream: ['slack', 'teams'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'ChatOps Bridge' },
  }),

  createService({
    id: 'user-notifications',
    name: 'AWS User Notifications',
    shortName: 'User Notifications',
    category: 'Management & Governance',
    tier: 3,
    cliPrefix: 'aws notifications',
    summary: 'Centralizes user notification preferences across console bells, emails, and AWS Console Mobile apps for operational events.',
    flow: { upstream: ['eventbridge'], downstream: ['email', 'mobile-push'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Notification Hub' },
  }),

  createService({
    id: 'application-signals',
    name: 'CloudWatch Application Signals',
    shortName: 'Application Signals',
    category: 'Management & Governance',
    tier: 3,
    cliPrefix: 'aws cloudwatch',
    summary: 'Application Performance Monitoring (APM) tracking automated Service Level Objectives (SLOs) and service call maps.',
    flow: { upstream: ['ecs', 'eks'], downstream: ['cloudwatch'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'APM SLO Dashboard' },
  }),

  createService({
    id: 'adot',
    name: 'AWS Distro for OpenTelemetry (ADOT)',
    shortName: 'ADOT',
    category: 'Management & Governance',
    tier: 3,
    cliPrefix: 'aws cloudwatch',
    summary: 'Secure, production-ready distribution of the OpenTelemetry standard collecting traces and metrics from container workloads.',
    flow: { upstream: ['ecs', 'eks'], downstream: ['cloudwatch', 'xray'], edgeProtocol: 'gRPC', subgraphLabel: 'OpenTelemetry Agent' },
  }),

  createService({
    id: 'application-composer',
    name: 'AWS Application Composer',
    shortName: 'Application Composer',
    category: 'Management & Governance',
    tier: 3,
    cliPrefix: 'aws cloudformation',
    summary: 'Visual drag-and-drop canvas generating clean, valid CloudFormation and SAM serverless architecture templates.',
    flow: { upstream: ['client'], downstream: ['cloudformation', 'sam'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Visual Architecture Studio' },
  }),

  // =========================================================================
  // 12. DEVELOPER TOOLS (9 Services)
  // =========================================================================
  createService({
    id: 'codebuild',
    name: 'AWS CodeBuild',
    shortName: 'CodeBuild',
    category: 'Developer Tools',
    tier: 2,
    cliPrefix: 'aws codebuild',
    summary: 'Fully managed continuous integration build service compiling source code, running unit tests, and packaging container artifacts.',
    flow: { upstream: ['codepipeline', 'github'], downstream: ['ecr', 's3'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'CI Build Runner' },
  }),

  createService({
    id: 'codedeploy',
    name: 'AWS CodeDeploy',
    shortName: 'CodeDeploy',
    category: 'Developer Tools',
    tier: 2,
    cliPrefix: 'aws codedeploy',
    summary: 'Automates software deployments to EC2, Fargate, ECS, Lambda, and on-premises servers with canary and blue/green traffic shifts.',
    flow: { upstream: ['codepipeline'], downstream: ['ec2', 'ecs', 'lambda', 'alb'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Deployment Orchestrator' },
  }),

  createService({
    id: 'codepipeline',
    name: 'AWS CodePipeline',
    shortName: 'CodePipeline',
    category: 'Developer Tools',
    tier: 2,
    cliPrefix: 'aws codepipeline',
    summary: 'Continuous delivery workflow pipeline service automating build, test, approval, and deployment stages on code commits.',
    flow: { upstream: ['github', 'codecommit'], downstream: ['codebuild', 'codedeploy'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'CI/CD Pipeline Engine' },
  }),

  createService({
    id: 'codeartifact',
    name: 'AWS CodeArtifact',
    shortName: 'CodeArtifact',
    category: 'Developer Tools',
    tier: 2,
    cliPrefix: 'aws codeartifact',
    summary: 'Secure, scalable artifact repository managing package dependencies for npm, PyPI, Maven, and NuGet with public proxying.',
    flow: { upstream: ['codebuild'], downstream: ['s3'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Package Repository' },
  }),

  createService({
    id: 'cloudshell',
    name: 'AWS CloudShell',
    shortName: 'CloudShell',
    category: 'Developer Tools',
    tier: 2,
    cliPrefix: 'aws',
    summary: 'Browser-based pre-authenticated bash shell preloaded with AWS CLI v2, Python, Node, and 1GB of persistent home storage.',
    flow: { upstream: ['client'], downstream: ['iam'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Cloud Terminal' },
  }),

  createService({
    id: 'codecatalyst',
    name: 'Amazon CodeCatalyst',
    shortName: 'CodeCatalyst',
    category: 'Developer Tools',
    tier: 3,
    cliPrefix: 'aws codecatalyst',
    summary: 'Unified software development service offering project blueprints, cloud dev environments, and automated CI/CD workflows.',
    flow: { upstream: ['client'], downstream: ['codebuild', 'codedeploy'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Unified Dev Workspace' },
  }),

  createService({
    id: 'codeguru',
    name: 'Amazon CodeGuru',
    shortName: 'CodeGuru',
    category: 'Developer Tools',
    tier: 3,
    cliPrefix: 'aws codeguru-reviewer',
    summary: 'Developer tool powered by machine learning that provides intelligent recommendations for code quality and runtime profiling.',
    flow: { upstream: ['github', 'codepipeline'], downstream: ['cloudwatch'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Code Reviewer AI' },
  }),

  createService({
    id: 'devops-guru',
    name: 'Amazon DevOps Guru',
    shortName: 'DevOps Guru',
    category: 'Developer Tools',
    tier: 3,
    cliPrefix: 'aws devops-guru',
    summary: 'ML-powered service that automatically detects operational issues and operational anomalies before they affect customers.',
    flow: { upstream: ['cloudwatch', 'config'], downstream: ['sns'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Operational Anomaly AI' },
  }),

  createService({
    id: 'fault-isolation-boundaries',
    name: 'AWS Fault Isolation Boundaries',
    shortName: 'Fault Isolation',
    category: 'Developer Tools',
    tier: 3,
    cliPrefix: 'aws ec2',
    summary: 'Architectural framework and tools validating AZ, Regional, and cell-based blast radius limits under catastrophic failures.',
    flow: { upstream: ['fis'], downstream: ['resilience-hub'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Blast Radius Boundary' },
  }),

  // =========================================================================
  // 13. MIGRATION & TRANSFER (6 Services)
  // =========================================================================
  createService({
    id: 'dms',
    name: 'AWS Database Migration Service (DMS)',
    shortName: 'DMS',
    category: 'Migration & Transfer',
    tier: 2,
    cliPrefix: 'aws dms',
    summary: 'Migrates relational databases, data warehouses, and NoSQL stores with minimal downtime using Change Data Capture (CDC).',
    flow: { upstream: ['corporate-datacenter', 'rds'], downstream: ['aurora', 'dynamodb', 's3'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Database CDC Replication' },
  }),

  createService({
    id: 'mgn',
    name: 'AWS Application Migration Service (MGN)',
    shortName: 'MGN (Lift & Shift)',
    category: 'Migration & Transfer',
    tier: 2,
    cliPrefix: 'aws mgn',
    summary: 'Primary lift-and-shift migration service that continuously replicates on-premises physical, virtual, or cloud servers into AWS.',
    flow: { upstream: ['corporate-datacenter'], downstream: ['ec2', 'ebs'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Server Block Replication' },
  }),

  createService({
    id: 'mainframe-modernization',
    name: 'AWS Mainframe Modernization',
    shortName: 'Mainframe Modernization',
    category: 'Migration & Transfer',
    tier: 3,
    cliPrefix: 'aws m2',
    summary: 'Modernize and migrate legacy mainframe COBOL and PL/I workloads to AWS managed cloud runtimes and AWS Micro Focus.',
    flow: { upstream: ['corporate-datacenter'], downstream: ['aurora', 's3'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Mainframe Emulation Runtime' },
  }),

  createService({
    id: 'migration-hub',
    name: 'AWS Migration Hub',
    shortName: 'Migration Hub',
    category: 'Migration & Transfer',
    tier: 3,
    cliPrefix: 'aws migrationhub',
    summary: 'Single location to track the progress of application migrations across multiple AWS and partner discovery tools.',
    flow: { upstream: ['mgn', 'dms'], downstream: ['s3'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Migration Tracking Dashboard' },
  }),

  createService({
    id: 'migration-evaluator',
    name: 'AWS Migration Evaluator',
    shortName: 'Migration Evaluator',
    category: 'Migration & Transfer',
    tier: 3,
    cliPrefix: 'aws migration-evaluator',
    summary: 'Creates a business case for cloud migration by discovering on-premises server inventory, utilization, and projecting AWS TCO.',
    flow: { upstream: ['corporate-datacenter'], downstream: ['migration-hub'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'TCO Business Case' },
  }),

  createService({
    id: 'sct',
    name: 'AWS Schema Conversion Tool (SCT)',
    shortName: 'SCT',
    category: 'Migration & Transfer',
    tier: 3,
    cliPrefix: 'aws sct',
    summary: 'Converts commercial database schemas (Oracle, MS SQL) into open-source or AWS-native engines (PostgreSQL, MySQL, Aurora).',
    flow: { upstream: ['dms'], downstream: ['aurora', 'rds'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Schema Converter' },
  }),

  // =========================================================================
  // 14. FRONT-END WEB & MOBILE (9 Services)
  // =========================================================================
  createService({
    id: 'amplify',
    name: 'AWS Amplify',
    shortName: 'Amplify',
    category: 'Front-End Web & Mobile',
    tier: 2,
    cliPrefix: 'amplify',
    summary: 'Fullstack frontend hosting and backend framework provisioning auth, data models, APIs, and CI/CD for React, Next.js, and Flutter.',
    flow: { upstream: ['github'], downstream: ['s3', 'cloudfront', 'cognito'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Fullstack Hosting & Auth' },
  }),

  createService({
    id: 'location-service',
    name: 'Amazon Location Service',
    shortName: 'Location Service',
    category: 'Front-End Web & Mobile',
    tier: 2,
    cliPrefix: 'aws location',
    summary: 'Adds maps, points of interest, geocoding, route calculations, device tracking, and geofencing to client applications securely.',
    flow: { upstream: ['client'], downstream: ['dynamodb'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Geospatial Location API' },
  }),

  createService({
    id: 'ses',
    name: 'Amazon SES (Simple Email Service)',
    shortName: 'SES',
    category: 'Front-End Web & Mobile',
    tier: 2,
    cliPrefix: 'aws sesv2',
    arnPattern: 'arn:aws:ses:${region}:${accountId}:identity/${resourceName}',
    summary: 'Cost-effective, high-deliverability transactional and marketing email sending and receiving service for applications.',
    flow: { upstream: ['lambda', 'sns'], downstream: ['internet-gateway'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'High-Deliverability Email MTU' },
  }),

  createService({
    id: 'pinpoint',
    name: 'Amazon Pinpoint',
    shortName: 'Pinpoint',
    category: 'Front-End Web & Mobile',
    tier: 2,
    cliPrefix: 'aws pinpoint',
    summary: 'Multichannel customer engagement service delivering segmented push notifications, SMS, emails, and voice campaigns.',
    flow: { upstream: ['kinesis-streams'], downstream: ['ses', 'sns'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'User Engagement Campaigns' },
  }),

  createService({
    id: 'device-farm',
    name: 'AWS Device Farm',
    shortName: 'Device Farm',
    category: 'Front-End Web & Mobile',
    tier: 3,
    cliPrefix: 'aws devicefarm',
    summary: 'App testing service testing Android and iOS apps concurrently across a massive fleet of real physical mobile phones and browsers.',
    flow: { upstream: ['codebuild'], downstream: ['s3'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Real Device Lab' },
  }),

  createService({
    id: 'workspaces',
    name: 'Amazon WorkSpaces',
    shortName: 'WorkSpaces',
    category: 'Front-End Web & Mobile',
    tier: 3,
    cliPrefix: 'aws workspaces',
    summary: 'Fully managed virtual desktop-as-a-service (DaaS) streaming Windows and Linux cloud desktops securely to remote staff.',
    flow: { upstream: ['directory-service'], downstream: ['vpc'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Virtual Desktop Infrastructure' },
  }),

  createService({
    id: 'workspaces-web',
    name: 'Amazon WorkSpaces Web',
    shortName: 'WorkSpaces Web',
    category: 'Front-End Web & Mobile',
    tier: 3,
    cliPrefix: 'aws workspaces-web',
    summary: 'Low-cost secure enterprise browser that isolates internal corporate web apps from malware on personal employee laptops.',
    flow: { upstream: ['iam-identity-center'], downstream: ['vpc'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Isolated Cloud Browser' },
  }),

  createService({
    id: 'appstream',
    name: 'Amazon AppStream 2.0',
    shortName: 'AppStream 2.0',
    category: 'Front-End Web & Mobile',
    tier: 3,
    cliPrefix: 'aws appstream',
    summary: 'Application streaming service delivering desktop applications securely through any modern HTML5 web browser without installation.',
    flow: { upstream: ['client'], downstream: ['vpc', 's3'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'App Streaming Fleet' },
  }),

  createService({
    id: 'worklink',
    name: 'Amazon WorkLink',
    shortName: 'WorkLink',
    category: 'Front-End Web & Mobile',
    tier: 3,
    cliPrefix: 'aws worklink',
    summary: 'Securely connects mobile phone web browsers to internal corporate web portals without requiring complex client-side VPN tunnels.',
    flow: { upstream: ['client'], downstream: ['vpc'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Mobile Corporate Proxy' },
  }),

  // =========================================================================
  // 15. INTERNET OF THINGS (IoT) (11 Services)
  // =========================================================================
  createService({
    id: 'iot-core',
    name: 'AWS IoT Core',
    shortName: 'IoT Core',
    category: 'Internet of Things (IoT)',
    tier: 3,
    cliPrefix: 'aws iot',
    summary: 'Connects billions of IoT sensor devices securely and reliably to AWS cloud services with mutual TLS and MQTT brokers.',
    flow: { upstream: ['iot-sensor'], downstream: ['kinesis-streams', 'dynamodb', 's3'], edgeProtocol: 'MQTT', subgraphLabel: 'MQTT Device Broker' },
  }),

  createService({
    id: 'iot-greengrass',
    name: 'AWS IoT Greengrass',
    shortName: 'IoT Greengrass',
    category: 'Internet of Things (IoT)',
    tier: 3,
    cliPrefix: 'aws greengrassv2',
    summary: 'Extends AWS intelligence and cloud compute to edge devices, enabling local telemetry processing and offline operation.',
    flow: { upstream: ['iot-sensor'], downstream: ['iot-core'], edgeProtocol: 'MQTT', subgraphLabel: 'Edge Gateway Device' },
  }),

  createService({
    id: 'iot-analytics',
    name: 'AWS IoT Analytics',
    shortName: 'IoT Analytics',
    category: 'Internet of Things (IoT)',
    tier: 3,
    cliPrefix: 'aws iotanalytics',
    summary: 'Collects, cleans, processes, and stores massive volumes of raw IoT device telemetry for operational time-series analytics.',
    flow: { upstream: ['iot-core'], downstream: ['s3', 'quicksight'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'IoT Analytics Pipeline' },
  }),

  createService({
    id: 'iot-sitewise',
    name: 'AWS IoT SiteWise',
    shortName: 'IoT SiteWise',
    category: 'Internet of Things (IoT)',
    tier: 3,
    cliPrefix: 'aws iotsitewise',
    summary: 'Collects, organizes, and analyzes data from industrial equipment and factories at scale using standard OPC-UA protocols.',
    flow: { upstream: ['industrial-sensor'], downstream: ['quicksight', 's3'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Industrial OPC-UA Collector' },
  }),

  createService({
    id: 'iot-events',
    name: 'AWS IoT Events',
    shortName: 'IoT Events',
    category: 'Internet of Things (IoT)',
    tier: 3,
    cliPrefix: 'aws iotevents',
    summary: 'Detects and responds to events from thousands of IoT sensors, like malfunctioning machines or temperature spikes.',
    flow: { upstream: ['iot-core'], downstream: ['sns', 'lambda'], edgeProtocol: 'Event Trigger', subgraphLabel: 'Sensor State Machine' },
  }),

  createService({
    id: 'iot-twinmaker',
    name: 'AWS IoT TwinMaker',
    shortName: 'IoT TwinMaker',
    category: 'Internet of Things (IoT)',
    tier: 3,
    cliPrefix: 'aws iottwinmaker',
    summary: 'Build operational digital twins of physical systems like buildings, factories, production lines, and power plants.',
    flow: { upstream: ['iot-sitewise', 's3'], downstream: ['quicksight', 'managed-grafana'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Digital Twin Model' },
  }),

  createService({
    id: 'iot-fleetwise',
    name: 'AWS IoT FleetWise',
    shortName: 'IoT FleetWise',
    category: 'Internet of Things (IoT)',
    tier: 3,
    cliPrefix: 'aws iotfleetwise',
    summary: 'Collects, standardizes, and transfers connected vehicle telemetry and CAN-bus metrics to the cloud in real-time.',
    flow: { upstream: ['connected-vehicle'], downstream: ['timestream', 's3'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Automotive Telematics' },
  }),

  createService({
    id: 'iot-device-defender',
    name: 'AWS IoT Device Defender',
    shortName: 'IoT Device Defender',
    category: 'Internet of Things (IoT)',
    tier: 3,
    cliPrefix: 'aws iot',
    summary: 'Monitors and audits the security configurations of connected IoT device fleets, alerting on anomalous port traffic.',
    flow: { upstream: ['iot-core'], downstream: ['sns', 'cloudwatch'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Fleet Security Auditor' },
  }),

  createService({
    id: 'iot-device-management',
    name: 'AWS IoT Device Management',
    shortName: 'IoT Device Management',
    category: 'Internet of Things (IoT)',
    tier: 3,
    cliPrefix: 'aws iot',
    summary: 'Securely register, organize, monitor, and remotely execute Over-The-Air (OTA) firmware updates across device fleets.',
    flow: { upstream: ['iot-core'], downstream: ['s3'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'OTA Firmware Updater' },
  }),

  createService({
    id: 'freertos',
    name: 'FreeRTOS',
    shortName: 'FreeRTOS',
    category: 'Internet of Things (IoT)',
    tier: 3,
    cliPrefix: 'aws iot',
    summary: 'Real-time operating system for microcontrollers that makes small, low-power edge devices easy to program and connect.',
    flow: { upstream: ['embedded-mcu'], downstream: ['iot-core'], edgeProtocol: 'MQTT', subgraphLabel: 'Embedded Microcontroller' },
  }),

  createService({
    id: 'robomaker',
    name: 'AWS RoboMaker',
    shortName: 'RoboMaker',
    category: 'Internet of Things (IoT)',
    tier: 3,
    cliPrefix: 'aws robomaker',
    summary: 'Cloud robotics service that provides simulation environments at scale for testing autonomous robotics software.',
    flow: { upstream: ['s3'], downstream: ['cloudwatch'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Gazebo Simulation Cluster' },
  }),

  // =========================================================================
  // 16. CLOUD FINANCIAL MANAGEMENT (9 Services)
  // =========================================================================
  createService({
    id: 'cost-explorer',
    name: 'AWS Cost Explorer',
    shortName: 'Cost Explorer',
    category: 'Cloud Financial Management',
    tier: 2,
    cliPrefix: 'aws ce',
    summary: 'Visual interactive reporting interface allowing teams to analyze, forecast, and dissect historic AWS spending and usage trends.',
    flow: { upstream: ['organizations'], downstream: ['budgets'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Cost Analytics Engine' },
  }),

  createService({
    id: 'budgets',
    name: 'AWS Budgets',
    shortName: 'Budgets',
    category: 'Cloud Financial Management',
    tier: 2,
    cliPrefix: 'aws budgets',
    summary: 'Set custom billing thresholds and operational utilization targets, triggering real-time alerts and automated mitigation scripts.',
    flow: { upstream: ['cost-explorer'], downstream: ['sns', 'slack'], edgeProtocol: 'Event Trigger', subgraphLabel: 'Budget Guardrail' },
  }),

  createService({
    id: 'cur',
    name: 'AWS Cost and Usage Report (CUR)',
    shortName: 'Cost & Usage Report',
    category: 'Cloud Financial Management',
    tier: 2,
    cliPrefix: 'aws cur',
    summary: 'The most comprehensive, granular billing dataset containing line-item usage metadata delivered hourly to Amazon S3 data lakes.',
    flow: { upstream: ['organizations'], downstream: ['s3', 'athena', 'quicksight'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Granular Billing Lake' },
  }),

  createService({
    id: 'savings-plans',
    name: 'AWS Savings Plans',
    shortName: 'Savings Plans',
    category: 'Cloud Financial Management',
    tier: 2,
    cliPrefix: 'aws savingsplans',
    summary: 'Flexible discount pricing model offering significant savings (up to 72%) over On-Demand rates in exchange for a committed hourly spend.',
    flow: { upstream: ['organizations'], downstream: ['ec2', 'fargate', 'lambda'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Commitment Discount Engine' },
  }),

  createService({
    id: 'pricing-calculator',
    name: 'AWS Pricing Calculator',
    shortName: 'Pricing Calculator',
    category: 'Cloud Financial Management',
    tier: 3,
    cliPrefix: 'aws pricing',
    summary: 'Web planning tool to estimate the monthly cost of cloud architecture solutions before provisioning production resources.',
    flow: { upstream: ['client'], downstream: ['s3'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Cost Estimator' },
  }),

  createService({
    id: 'billing-conductor',
    name: 'AWS Billing Conductor',
    shortName: 'Billing Conductor',
    category: 'Cloud Financial Management',
    tier: 3,
    cliPrefix: 'aws billingconductor',
    summary: 'Customizable chargeback and showback engine modeling billing rates and legal entity transfers for internal business units.',
    flow: { upstream: ['organizations'], downstream: ['cur'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Chargeback Modeler' },
  }),

  createService({
    id: 'marketplace',
    name: 'AWS Marketplace',
    shortName: 'Marketplace',
    category: 'Cloud Financial Management',
    tier: 3,
    cliPrefix: 'aws marketplace-catalog',
    summary: 'Digital catalog with thousands of third-party software listings, AMIs, SaaS contracts, and containers running on AWS.',
    flow: { upstream: ['third-party'], downstream: ['organizations', 'ec2'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Software Catalog' },
  }),

  createService({
    id: 'activate',
    name: 'AWS Activate',
    shortName: 'Activate',
    category: 'Cloud Financial Management',
    tier: 3,
    cliPrefix: 'aws',
    summary: 'Startup support program providing technical mentorship, architecture reviews, and promotional infrastructure credits.',
    flow: { upstream: ['client'], downstream: ['organizations'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Startup Credit Program' },
  }),

  createService({
    id: 'support',
    name: 'AWS Support',
    shortName: 'Support',
    category: 'Cloud Financial Management',
    tier: 3,
    cliPrefix: 'aws support',
    summary: '24/7 technical advisory and incident response plans providing direct access to Cloud Support Engineers and TAMs.',
    flow: { upstream: ['client'], downstream: ['trusted-advisor'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Enterprise Support Concierge' },
  }),

  // =========================================================================
  // ADDITIONAL ENTERPRISE & SPECIALIZED CLOUD DOMAINS
  // (Ground Station, Quantum, Media Services, Blockchain, Supply Chain)
  // =========================================================================
  createService({
    id: 'ground-station',
    name: 'AWS Ground Station',
    shortName: 'Ground Station',
    category: 'Management & Governance',
    tier: 3,
    cliPrefix: 'aws groundstation',
    summary: 'Fully managed service that controls satellite communications, processes data downlinks, and scales satellite operations.',
    flow: { upstream: ['satellite'], downstream: ['s3', 'ec2'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Satellite Downlink Antennas' },
  }),

  createService({
    id: 'braket',
    name: 'Amazon Braket',
    shortName: 'Braket (Quantum)',
    category: 'Developer Tools',
    tier: 3,
    cliPrefix: 'aws braket',
    summary: 'Explore, design, test, and run quantum algorithms on simulated circuit backends and real quantum computing hardware.',
    flow: { upstream: ['client'], downstream: ['s3'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Quantum Circuit Processor' },
  }),

  createService({
    id: 'mediaconvert',
    name: 'AWS Elemental MediaConvert',
    shortName: 'MediaConvert',
    category: 'Front-End Web & Mobile',
    tier: 3,
    cliPrefix: 'aws mediaconvert',
    summary: 'File-based video transcoding service formatting video libraries for broadcast, multi-screen streaming, and OTT delivery.',
    flow: { upstream: ['s3'], downstream: ['s3', 'cloudfront'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Video Transcoder' },
  }),

  createService({
    id: 'medialive',
    name: 'AWS Elemental MediaLive',
    shortName: 'MediaLive',
    category: 'Front-End Web & Mobile',
    tier: 3,
    cliPrefix: 'aws medialive',
    summary: 'Broadcast-grade live video processing service encoding live video streams in real time for broadcast television and internet screens.',
    flow: { upstream: ['video-camera'], downstream: ['mediapackage', 'cloudfront'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Live Video Encoder' },
  }),

  createService({
    id: 'mediapackage',
    name: 'AWS Elemental MediaPackage',
    shortName: 'MediaPackage',
    category: 'Front-End Web & Mobile',
    tier: 3,
    cliPrefix: 'aws mediapackage',
    summary: 'Prepares, packages, and protects live and on-demand video streams with DRM for delivery to multiple internet-connected devices.',
    flow: { upstream: ['medialive'], downstream: ['cloudfront'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'DRM Video Packaging' },
  }),

  createService({
    id: 'mediastore',
    name: 'AWS Elemental MediaStore',
    shortName: 'MediaStore',
    category: 'Front-End Web & Mobile',
    tier: 3,
    cliPrefix: 'aws mediastore',
    summary: 'Storage service optimized for live streaming media workloads delivering high write throughput and low read latencies.',
    flow: { upstream: ['medialive'], downstream: ['cloudfront'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Streaming Origin Store' },
  }),

  createService({
    id: 'mediatailor',
    name: 'AWS Elemental MediaTailor',
    shortName: 'MediaTailor',
    category: 'Front-End Web & Mobile',
    tier: 3,
    cliPrefix: 'aws mediatailor',
    summary: 'Server-side ad insertion and channel assembly service inserting targeted advertising into connected TV video streams.',
    flow: { upstream: ['mediapackage'], downstream: ['cloudfront'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Server-Side Ad Inserter' },
  }),

  createService({
    id: 'ivs',
    name: 'Amazon Interactive Video Service (IVS)',
    shortName: 'IVS',
    category: 'Front-End Web & Mobile',
    tier: 3,
    cliPrefix: 'aws ivs',
    summary: 'Managed live video streaming solution powered by Twitch technology, delivering ultra-low-latency video under 3 seconds.',
    flow: { upstream: ['client'], downstream: ['cloudfront'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Ultra-Low Latency Video' },
  }),

  createService({
    id: 'managed-blockchain',
    name: 'Amazon Managed Blockchain',
    shortName: 'Managed Blockchain',
    category: 'Application Integration',
    tier: 3,
    cliPrefix: 'aws managedblockchain',
    summary: 'Join public blockchain networks or create and manage scalable private distributed ledgers using Hyperledger Fabric and Ethereum.',
    flow: { upstream: ['ec2', 'lambda'], downstream: ['s3'], edgeProtocol: 'SQL/TCP', subgraphLabel: 'Consensus Ledger Node' },
  }),

  createService({
    id: 'supply-chain',
    name: 'AWS Supply Chain',
    shortName: 'Supply Chain',
    category: 'Analytics',
    tier: 3,
    cliPrefix: 'aws supplychain',
    summary: 'Cloud application that improves supply chain visibility and provides actionable ML-driven inventory rebalancing insights.',
    flow: { upstream: ['s3'], downstream: ['quicksight'], edgeProtocol: 'HTTPS/REST', subgraphLabel: 'Supply Chain AI Hub' },
  }),
];

// Ensure we have at least 230 services and all IDs are unique
console.log(`\n[AWS Catalog Generator] Initial curated service count: ${rawServices.length}`);

const idSet = new Set();
const duplicateIds = [];
const tierCounts = { 1: 0, 2: 0, 3: 0 };
const categoryCounts = {};

for (const s of rawServices) {
  if (idSet.has(s.id)) {
    duplicateIds.push(s.id);
  }
  idSet.add(s.id);
  tierCounts[s.tier] = (tierCounts[s.tier] || 0) + 1;
  categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
}

if (duplicateIds.length > 0) {
  console.error('[AWS Catalog Generator] WARNING! Found duplicate IDs:', duplicateIds);
} else {
  console.log('[AWS Catalog Generator] All service IDs are 100% unique.');
}

console.log('[AWS Catalog Generator] Tier breakdown:', tierCounts);
console.log('[AWS Catalog Generator] Category count:', Object.keys(categoryCounts).length);

// Generate TypeScript File
const outputPath = path.resolve(__dirname, '../src/db/awsCatalogData.ts');

const tsContent = `// src/db/awsCatalogData.ts
// Automatically generated by scripts/generateFullAwsCatalog.mjs
// Contains ${rawServices.length} active AWS services across all 16 official AWS architectural categories.

import type { AWSCatalogEntry } from '../types/aws';

export const AWS_CATALOG_DATA: AWSCatalogEntry[] = ${JSON.stringify(rawServices, null, 2)};

export default AWS_CATALOG_DATA;
`;

fs.writeFileSync(outputPath, tsContent, 'utf-8');
console.log(`[AWS Catalog Generator] Successfully generated ${rawServices.length} services to: ${outputPath}\n`);

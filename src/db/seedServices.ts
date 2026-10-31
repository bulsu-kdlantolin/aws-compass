import type { AWSService } from '../types/aws';

export const SEED_SERVICES: AWSService[] = [
  // ==========================================
  // STORAGE
  // ==========================================
  {
    id: 's3',
    name: 'Amazon S3 (Simple Storage Service)',
    category: 'Storage',
    tier: 1,
    isFavorite: false,
    summary: 'Exabyte-scale object storage with 99.999999999% (11 9s) durability, fine-grained access policies, and lifecycle tiering.',
    icon: 'Database',
    color: '#22c55e',
    arnExample: 'arn:aws:s3:::production-datalake-artifacts/*',
    docsUrl: 'https://docs.aws.amazon.com/s3/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
Amazon S3 provides virtually infinite, highly durable (99.999999999%) object storage for unstructured data, enabling secure static hosting, analytical data lakes, and automated archival tiering.

## 2. Architectural Primitives
- **Buckets & Keys**: Universally unique globally named containers holding objects consisting of binary payloads, metadata key-value pairs, and version IDs.
- **Storage Classes**: Intelligent-Tiering, Standard, Standard-IA, One Zone-IA, Glacier Instant Retrieval, Glacier Flexible Retrieval, and Glacier Deep Archive.
- **Access Control Mechanisms**: Dual-layer authorization comprising Bucket Policies (resource-based JSON policies), IAM Policies (identity-based), and Access Control Lists (ACLs - legacy, disabled by default via S3 Object Ownership).
- **Object Lock & Versioning**: WORM (Write Once, Read Many) compliance protection via Governance or Compliance modes, backed by immutable object version trees.
- **Event Notifications**: Asynchronous pub/sub dispatch to SNS, SQS, EventBridge, or Lambda upon object creation, deletion, or restore operations.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    Client([User / Browser]) -->|1. HTTPS GET| CF[Amazon CloudFront]
    
    subgraph AWS [AWS Region]
        S3[(Amazon S3 Bucket)]
        KMS[AWS KMS]
        Lambda[AWS Lambda]
    end

    CF -->|2. OAC SigV4| S3
    S3 <-->|3. SSE-KMS Decrypt| KMS
    S3 -.->|4. S3 Event| Lambda
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: Amazon CloudFront (Origin distribution), AWS Lambda (Upload processing), Direct API / SDK PutObject, Storage Gateway, AWS Backup.
- **Downstream Targets**: AWS Lambda (Event notifications on s3:ObjectCreated:*), Amazon SQS / SNS (Event fanout), Amazon Athena (Direct SQL queries via Presto), AWS Glue (Crawler metadata cataloging).

## 5. Exam & Production Gotchas
- **Bucket Naming Scope**: Bucket names reside in a single global namespace across all AWS partitions and regions. Names must be DNS-compliant (lowercase, no underscores, 3-63 characters).
- **Strong Read-After-Write Consistency**: Since December 2020, S3 provides strong read-after-write consistency for PUT and DELETE requests of objects in all regions without performance penalty.
- **S3 Block Public Access**: Account-level and bucket-level Block Public Access settings override permissive bucket policies. If enabled, public policies return a 403 error on creation.
- **Glacier Deep Archive Restore Latency**: Standard retrieval takes 12 hours; bulk retrieval takes 48 hours. Always factor retrieval time and per-GB retrieval fees into RTO/RPO calculations.
- **KMS Throttling on High-Throughput Buckets**: High-request S3 workloads encrypted with SSE-KMS will trigger KMS request quota throttles (\`KMS.ThrottlingException\`). Use S3 Bucket Keys to reduce KMS calls by up to 99%.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Sync local build directory to bucket with KMS encryption and aggressive cache headers
aws s3 sync ./dist s3://my-prod-bucket/static/ \\
  --sse aws:kms \\
  --sse-kms-key-id arn:aws:kms:us-east-1:123456789012:key/abc-123 \\
  --cache-control "public, max-age=31536000, immutable" \\
  --delete

# 2. Generate a time-limited pre-signed URL for secure client uploads without IAM credentials
aws s3 presign s3://my-prod-bucket/uploads/report.pdf \\
  --expires-in 300 \\
  --region us-east-1

# 3. Retrieve storage class distribution and total object count via S3 Inventory or summary
aws s3 ls s3://my-prod-bucket/ --recursive --human-readable --summarize
\`\`\``,
  },

  // ==========================================
  // COMPUTE
  // ==========================================
  {
    id: 'ec2',
    name: 'Amazon EC2 (Elastic Compute Cloud)',
    category: 'Compute',
    tier: 1,
    isFavorite: false,
    summary: 'Configurable virtual server instances with resizable compute capacity, custom AMIs, hardware acceleration, and granular security groups.',
    icon: 'Server',
    color: '#f97316',
    arnExample: 'arn:aws:ec2:us-east-1:123456789012:instance/i-0abcdef1234567890',
    docsUrl: 'https://docs.aws.amazon.com/ec2/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
Amazon EC2 provisions secure, resizable compute capacity via virtual machines (instances) running in private VPC subnets to host traditional workloads, microservices, and high-performance computing clusters.

## 2. Architectural Primitives
- **Amazon Machine Image (AMI)**: Pre-configured root operating system and software template packaged with block device mappings.
- **Instance Types**: Tailored compute architectures spanning General Purpose (M), Compute Optimized (C), Memory Optimized (R/X), Accelerated Computing (P/G), and Storage Optimized (I).
- **Elastic Block Store (EBS)**: Persistent, low-latency block-level storage volumes attached over a dedicated NVMe network bus.
- **Instance Store**: Ephemeral physically attached NVMe block storage delivering maximum IOPS, with data deleted upon instance stop or termination.
- **Instance Metadata Service v2 (IMDSv2)**: Session-oriented token-based HTTP endpoint (169.254.169.254) providing temporary IAM credentials and network configuration, mitigating SSRF credential theft.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    Client([Web User]) -->|1. HTTPS:443| ALB[Application Load Balancer]
    
    subgraph VPC [VPC Private Subnet]
        EC2[Amazon EC2 Instance]
        RDS[(Amazon RDS Aurora)]
    end
    
    CW[Amazon CloudWatch]

    ALB -->|2. HTTP Forward| EC2
    EC2 -->|3. SQL Query| RDS
    EC2 -.->|4. Push Metrics| CW
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: Application Load Balancer (Target Group health checks), Auto Scaling Group (Metric-driven scaling), EventBridge (Scheduled instance management).
- **Downstream Targets**: Amazon RDS / Aurora (Database connectivity), Amazon S3 (Object read/write via IAM role), Amazon SQS (Worker queue polling), Amazon CloudWatch (Logs and unified metrics agent).

## 5. Exam & Production Gotchas
- **Stateful Security Groups vs Stateless Network ACLs**: Security Group rules are stateful (inbound return traffic is automatically allowed regardless of outbound rules). Subnet NACLs are stateless (both inbound and outbound ephemeral ports 1024-65535 must be explicitly opened).
- **Stopping vs. Terminating**: Stopping an EBS-backed instance preserves EBS volume data and releases the private/public IPv4 address (Elastic IP remains retained). Terminating destroys instance store volumes and deletes the root EBS volume unless \`DeleteOnTermination=false\` is configured.
- **IMDSv1 Vulnerability**: Legacy IMDSv1 does not require token authentication, enabling Server-Side Request Forgery (SSRF) vulnerabilities to extract IAM instance credentials. Enforce \`HttpTokens=required\` (IMDSv2) via AWS Systems Manager or SCP.
- **Placement Groups**: Cluster placement groups provide low-latency 10-100 Gbps networking in a single AZ (cannot span multiple AZs). Spread and Partition placement groups reduce correlated hardware failure across distinct racks.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Launch a hardened Amazon Linux 2023 instance with IMDSv2 enforced and EBS gp3 encryption
aws ec2 run-instances \\
  --image-id ami-0c101f26f147fa7fd \\
  --instance-type t3.micro \\
  --key-name prod-ssh-key \\
  --security-group-ids sg-0123456789abcdef0 \\
  --subnet-id subnet-0123456789abcdef0 \\
  --iam-instance-profile Name="EC2AppServerRole" \\
  --metadata-options "HttpEndpoint=enabled,HttpTokens=required,HttpPutResponseHopLimit=1" \\
  --block-device-mappings '[{"DeviceName":"/dev/xvda","Ebs":{"VolumeSize":30,"VolumeType":"gp3","Encrypted":true}}]'

# 2. Inspect running instances with custom tag queries and private IP mapping
aws ec2 describe-instances \\
  --filters "Name=instance-state-name,Values=running" "Name=tag:Environment,Values=Production" \\
  --query "Reservations[*].Instances[*].{ID:InstanceId,Type:InstanceType,PrivateIP:PrivateIpAddress,AZ:Placement.AvailabilityZone}" \\
  --output table

# 3. Modify an existing instance to enforce IMDSv2 and block legacy metadata requests
aws ec2 modify-instance-metadata-options \\
  --instance-id i-0123456789abcdef0 \\
  --http-tokens required \\
  --http-endpoint enabled
\`\`\``,
  },

  // ==========================================
  // SERVERLESS
  // ==========================================
  {
    id: 'lambda',
    name: 'AWS Lambda',
    category: 'Serverless',
    tier: 1,
    isFavorite: false,
    summary: 'Event-driven serverless compute service executing stateless code in isolated microVMs with sub-second automated scaling.',
    icon: 'Zap',
    color: '#ec4899',
    arnExample: 'arn:aws:lambda:us-east-1:123456789012:function:order-processor',
    docsUrl: 'https://docs.aws.amazon.com/lambda/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
AWS Lambda runs code in response to events without provisioning or managing servers, charging strictly per millisecond of compute execution and memory consumption.

## 2. Architectural Primitives
- **Function Handler**: The execution entry point receiving an event object and runtime execution context.
- **Execution Environment (MicroVM)**: Firecracker microVM container running the chosen runtime (Node.js, Python, Java, Go, Rust, or Custom Docker Image).
- **Execution Role**: IAM assume-role policy conferring the exact resource permissions granted to the function.
- **Concurrency Controls**: Reserved Concurrency (guaranteed ceiling and floor per function) and Provisioned Concurrency (pre-warmed execution environments eliminating cold starts).
- **Lambda Layers**: Shared ZIP archives containing common dependencies, shared libraries, or custom runtimes imported across multiple functions.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    Client([API Consumer]) -->|1. HTTPS POST| APIGW[Amazon API Gateway]
    
    subgraph Serverless [AWS Serverless]
        Lambda[AWS Lambda Function]
        DDB[(Amazon DynamoDB)]
    end
    
    Secrets[AWS Secrets Manager]

    APIGW -->|2. Sync Invoke| Lambda
    Lambda <-->|3. Fetch Secret| Secrets
    Lambda -->|4. PutItem Write| DDB
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: Amazon API Gateway (REST/HTTP endpoints), Amazon S3 (Object creation events), Amazon DynamoDB Streams (CDC events), Amazon SQS (Queue worker), Amazon EventBridge (Event bus routing).
- **Downstream Targets**: Amazon DynamoDB (NoSQL writes), Amazon RDS / Aurora Serverless (Database transactions), Amazon SNS / SQS (Downstream fanout), AWS Secrets Manager (Credential retrieval).

## 5. Exam & Production Gotchas
- **Execution Timeout Limit**: The absolute maximum execution timeout for an AWS Lambda function is 15 minutes (900 seconds). For tasks exceeding 15 minutes, orchestrate with AWS Step Functions or run on AWS Fargate / AWS Batch.
- **VPC Cold Starts (Resolved since Hyperplane)**: Historically, VPC-attached Lambdas suffered 10-30s cold starts for ENI allocation. Since 2019 AWS uses pre-created Hyperplane ENIs, reducing VPC cold start overhead to milliseconds.
- **Concurrency Exhaustion**: Account-level default concurrency is 1,000 per region. A single uncontrolled function without Reserved Concurrency can consume the entire quota, starving all other functions in the account.
- **Idempotency in Asynchronous Invocation**: Event sources like SQS, Kinesis, and DynamoDB Streams deliver messages with at-least-once delivery semantics. Lambda functions must be designed to be strictly idempotent.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Deploy updated function code package from local deployment zip
aws lambda update-function-code \\
  --function-name order-processor \\
  --zip-file fileb://build/function.zip \\
  --publish

# 2. Invoke a function synchronously with a test payload and inspect base64 execution logs
aws lambda invoke \\
  --function-name order-processor \\
  --cli-binary-format raw-in-base64-out \\
  --payload '{"orderId":"ord-9821","amount":89.50}' \\
  --log-type Tail \\
  response.json

# 3. Configure Provisioned Concurrency to eradicate cold starts on production endpoints
aws lambda put-provisioned-concurrency-config \\
  --function-name order-processor \\
  --qualifier live \\
  --provisioned-concurrent-executions 10
\`\`\``,
  },

  // ==========================================
  // NETWORKING
  // ==========================================
  {
    id: 'vpc',
    name: 'Amazon VPC (Virtual Private Cloud)',
    category: 'Networking',
    tier: 1,
    isFavorite: false,
    summary: 'Isolated software-defined cloud network with custom IP address ranges, subnets, route tables, network gateways, and VPC endpoints.',
    icon: 'Network',
    color: '#a855f7',
    arnExample: 'arn:aws:ec2:us-east-1:123456789012:vpc/vpc-0abcdef1234567890',
    docsUrl: 'https://docs.aws.amazon.com/vpc/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
Amazon VPC provides a logically isolated virtual network within the AWS cloud where compute and data resources operate with custom IPv4/IPv6 CIDR blocks, private routing, and multi-tier network topologies.

## 2. Architectural Primitives
- **Subnets**: Segmented IP ranges within an AZ categorized as Public (direct route to IGW) or Private (no direct internet route).
- **Internet Gateway (IGW) & NAT Gateway**: An IGW provides two-way horizontal internet connectivity for public subnets; a managed NAT Gateway allows egress-only outbound internet access for private subnets.
- **Route Tables**: Sets of rules (destinations and targets) dictating how network packets navigate between subnets, gateways, and peered connections.
- **Security Groups & Network ACLs**: Layered defense consisting of stateful instance-level firewalls (Security Groups) and stateless subnet boundary firewalls (Network ACLs).
- **VPC Endpoints (PrivateLink & Gateway Endpoints)**: Private networking to AWS services (S3, DynamoDB, Secrets Manager) without traversing the public internet.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    Client([Internet User]) -->|1. Public HTTPS| IGW[Internet Gateway]
    
    subgraph VPC [Amazon VPC]
        ALB[Application Load Balancer]
        App[EC2 App Instances]
        DB[(Amazon Aurora DB)]
    end

    IGW -->|2. Route Traffic| ALB
    ALB -->|3. Private Forward| App
    App -->|4. PrivateLink TCP| DB
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: Internet Gateway (External ingress), Transit Gateway / Direct Connect (On-premise hybrid connectivity), VPC Peering (Inter-VPC mesh).
- **Downstream Targets**: Amazon EC2, Amazon ECS / EKS, Amazon RDS, AWS Lambda (VPC-enabled), VPC Interface & Gateway Endpoints.

## 5. Exam & Production Gotchas
- **Gateway Endpoints vs Interface Endpoints**: Gateway Endpoints exist ONLY for Amazon S3 and Amazon DynamoDB, operate via Route Table prefix lists, and are completely free of charge. All other services use Interface Endpoints (PrivateLink) which provision an ENI and cost hourly + data processing fees.
- **NAT Gateway High Availability**: A NAT Gateway is an AZ-level resource, NOT region-level. If that AZ fails, all subnets routing through that NAT Gateway lose internet egress. Always provision a NAT Gateway per Availability Zone for high availability.
- **CIDR Modification Constraints**: You cannot change or overlap primary VPC CIDRs once created, though you can associate secondary CIDR blocks. Plan enterprise IP schemas carefully to prevent VPC Peering collisions.
- **VPC Peering Non-Transitive Rule**: VPC Peering is non-transitive: if VPC A peers with VPC B, and VPC B peers with VPC C, VPC A cannot reach VPC C through B. Use AWS Transit Gateway for hub-and-spoke multi-VPC topologies.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Create a production VPC with a /16 CIDR block and DNS hostnames enabled
aws ec2 create-vpc \\
  --cidr-block 10.0.0.0/16 \\
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=prod-vpc}]'

# 2. Allocate an Elastic IP and create an Availability-Zone resilient NAT Gateway
aws ec2 create-nat-gateway \\
  --subnet-id subnet-0123456789abcdef0 \\
  --allocation-id eipalloc-0123456789abcdef0 \\
  --tag-specifications 'ResourceType=natgateway,Tags=[{Key=Name,Value=nat-az1}]'

# 3. Create a free S3 Gateway Endpoint attached to specified private route tables
aws ec2 create-vpc-endpoint \\
  --vpc-id vpc-0123456789abcdef0 \\
  --service-name com.amazonaws.us-east-1.s3 \\
  --route-table-ids rtb-0123456789abcdef0 \\
  --vpc-endpoint-type Gateway
\`\`\``,
  },

  // ==========================================
  // SECURITY & IAM
  // ==========================================
  {
    id: 'iam',
    name: 'AWS IAM (Identity & Access Management)',
    category: 'Security/IAM',
    tier: 1,
    isFavorite: false,
    summary: 'Global identity and privilege governance plane enforcing authentication, authorization policies, and short-lived STS credentials.',
    icon: 'ShieldCheck',
    color: '#ef4444',
    arnExample: 'arn:aws:iam::123456789012:role/ProductionEksNodeRole',
    docsUrl: 'https://docs.aws.amazon.com/iam/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
AWS IAM securely governs authentication and granular authorization across all AWS API actions, services, and human identities using the principle of least privilege.

## 2. Architectural Primitives
- **Principals**: IAM Users, Groups, and Roles (assumed by services, federated identities, or human engineers).
- **JSON Policy Documents**: Declarative permission specifications combining Effect (Allow/Deny), Action, Resource, and Condition blocks.
- **Policy Hierarchy**: Service Control Policies (SCPs at Org level) > Permissions Boundaries > Identity-based Policies > Resource-based Policies.
- **AWS Security Token Service (STS)**: Issues short-lived, auto-expiring temporary security credentials for roles and federated sessions.
- **IAM Access Analyzer**: Evaluates resource policies mathematically using automated reasoning to detect external or unintended access.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    User([Developer / CI]) -->|1. AssumeRole Request| STS[AWS STS]
    
    subgraph AWS [AWS Cloud]
        IAM[IAM Evaluation Engine]
        S3[(Amazon S3)]
        Audit[AWS CloudTrail]
    end

    STS -->|2. Issue Credentials| User
    User -->|3. Signed API| S3
    S3 <-->|4. Evaluate Policy| IAM
    S3 -.->|5. Log Access| Audit
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: IAM Identity Center / SSO (Enterprise SAML/OIDC federation), AWS STS (Role assumption), GitHub Actions / OIDC Providers.
- **Downstream Targets**: Every single AWS service (authorizes EC2 instance profiles, Lambda execution roles, ECS task execution roles, Cross-Account roles).

## 5. Exam & Production Gotchas
- **The Golden Evaluation Rule**: Explicit Deny ALWAYS trumps Explicit Allow. If no explicit allow exists, access is default denied.
- **IAM is a Global Service**: IAM resources (users, roles, policies) are global and replicated worldwide. However, STS regional endpoints should be used to reduce latency and eliminate us-east-1 blast-radius dependencies.
- **Role Delegation vs User Access Keys**: Never create permanent IAM User access keys for production applications or CI/CD pipelines. Use OpenID Connect (OIDC) identity federation or IAM Roles Anywhere.
- **Permissions Boundary Trap**: A permissions boundary sets the maximum allowable permissions an identity-based policy can grant, but it does NOT grant permissions by itself.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Create a secure IAM role for AWS Lambda with a trusted entity assume-role policy
aws iam create-role \\
  --role-name lambda-s3-read-role \\
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "lambda.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

# 2. Attach an AWS managed policy to the newly created role
aws iam attach-role-policy \\
  --role-name lambda-s3-read-role \\
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# 3. Simulate and test IAM permissions against a resource to verify authorization before deployment
aws iam simulate-principal-policy \\
  --policy-source-arn arn:aws:iam::123456789012:role/lambda-s3-read-role \\
  --action-names s3:GetObject s3:PutObject \\
  --resource-arns arn:aws:s3:::prod-bucket/*
\`\`\``,
  },

  // ==========================================
  // ADDITIONAL COMPUTE SERVICES
  // ==========================================
  {
    id: 'ecs',
    name: 'Amazon ECS (Elastic Container Service)',
    category: 'Compute',
    tier: 1,
    isFavorite: false,
    summary: 'Highly scalable container management service supporting Docker containers with AWS Fargate serverless or EC2 capacity providers.',
    icon: 'Box',
    color: '#f97316',
    arnExample: 'arn:aws:ecs:us-east-1:123456789012:cluster/production-cluster',
    docsUrl: 'https://docs.aws.amazon.com/ecs/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
Amazon ECS coordinates production Docker container deployments and lifecycle scaling across AWS Fargate serverless compute or self-managed EC2 instance clusters with native AWS IAM and VPC integration.

## 2. Architectural Primitives
- **Task Definition**: Declarative blueprint specifying container images, CPU/memory reservations, port mappings, and logging drivers.
- **Task**: The instantiated, running container workload conforming to a task definition.
- **Service**: Long-running supervisor maintaining desired task counts, handling rolling updates, and registering tasks to ALB target groups.
- **Capacity Provider**: Infrastructure backing tasks, either AWS Fargate / Fargate Spot or Auto Scaling Groups of EC2 instances.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    Client([Client Traffic]) -->|1. HTTPS Traffic| ALB[Application Load Balancer]
    
    subgraph VPC [Private Subnet]
        ECS[Amazon ECS Tasks]
    end
    
    subgraph AWS [AWS Services]
        ECR[Amazon ECR]
        CW[Amazon CloudWatch]
    end

    ALB -->|2. Forward Port| ECS
    ECS -->|3. Pull Image| ECR
    ECS -.->|4. Stream Logs| CW
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: Application Load Balancer, Amazon EventBridge (Scheduled tasks), CodePipeline (CI/CD deployments).
- **Downstream Targets**: Amazon ECR (Image pulls), Amazon RDS (Data persistence), AWS Secrets Manager (Environment secret injection).

## 5. Exam & Production Gotchas
- **Task Role vs Task Execution Role**: Task Execution Role is used by the ECS agent to pull container images from ECR and send logs to CloudWatch. Task Role is used by your application container code to access AWS services (S3, DynamoDB).
- **Network Mode**: \`awsvpc\` network mode assigns each task its own dedicated Elastic Network Interface (ENI) and private IP, providing native Security Group isolation.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Register a new task definition revision
aws ecs register-task-definition --cli-input-json file://task-def.json

# 2. Update an ECS service to force a new deployment
aws ecs update-service --cluster prod-cluster --service web-app --force-new-deployment

# 3. List active running tasks in a cluster
aws ecs list-tasks --cluster prod-cluster --desired-status RUNNING
\`\`\``,
  },
  {
    id: 'eks',
    name: 'Amazon EKS (Elastic Kubernetes Service)',
    category: 'Compute',
    tier: 2,
    isFavorite: false,
    summary: 'Managed Kubernetes service running upstream-certified Kubernetes control planes with automated patching and multi-AZ resilience.',
    icon: 'Boxes',
    color: '#f97316',
    arnExample: 'arn:aws:eks:us-east-1:123456789012:cluster/prod-eks',
    docsUrl: 'https://docs.aws.amazon.com/eks/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
Amazon EKS manages the availability and scalability of Kubernetes control plane instances across multiple AWS availability zones while integrating natively with VPC CNI, IAM Roles for Service Accounts (IRSA), and AWS load balancers.

## 2. Architectural Primitives
- **Control Plane**: Managed etcd and Kubernetes API server instances replicated across 3 AZs.
- **Managed Node Groups**: EC2 instances provisioned and updated by EKS with automated drainage.
- **Fargate Profiles**: Serverless pod execution without managing EC2 worker nodes.
- **IAM Roles for Service Accounts (IRSA)**: Associates IAM roles directly to Kubernetes service accounts via OIDC.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    Admin([Engineer / CI]) -->|1. kubectl Apply| EKS[EKS Control Plane]
    
    subgraph VPC [Worker Nodes]
        Pod[Kubernetes Pods]
    end
    
    subgraph AWS [AWS Services]
        IAM[IAM Roles IRSA]
        Secrets[AWS Secrets Manager]
    end

    EKS -->|2. Schedule Spec| Pod
    Pod -->|3. AssumeRole WebIdentity| IAM
    Pod -->|4. Fetch Credentials| Secrets
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: AWS Load Balancer Controller (Ingress), Route 53 (ExternalDNS).
- **Downstream Targets**: Amazon ECR, Amazon EBS (CSI Driver), Amazon EFS (Shared volumes).

## 5. Exam & Production Gotchas
- **IRSA vs Node Role**: Never assign AWS privileges to the worker node IAM role; always use IRSA or EKS Pod Identities to isolate pod permissions.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Update local kubeconfig to connect to EKS cluster
aws eks update-kubeconfig --region us-east-1 --name prod-eks

# 2. Describe cluster status and endpoint details
aws eks describe-cluster --name prod-eks --query "cluster.status"

# 3. List installed EKS Add-ons (VPC-CNI, CoreDNS, kube-proxy)
aws eks list-addons --cluster-name prod-eks
\`\`\``,
  },
  {
    id: 'fargate',
    name: 'AWS Fargate',
    category: 'Compute',
    tier: 2,
    isFavorite: false,
    summary: 'Serverless compute engine for Amazon ECS and EKS containers that eliminates EC2 server provisioning, patching, and capacity planning.',
    icon: 'Cpu',
    color: '#f97316',
    arnExample: 'arn:aws:ecs:us-east-1:123456789012:task/prod-cluster/*',
    docsUrl: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
AWS Fargate runs containers on-demand with dedicated kernel isolation without requiring the customer to manage EC2 instances or cluster capacity.

## 2. Architectural Primitives
- **Fargate Task Specification**: Exact vCPU and memory allocation pairs (e.g., 0.5 vCPU / 1 GB RAM).
- **Fargate Spot**: Excess AWS compute capacity offering up to 70% discount for fault-tolerant tasks.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    ControlPlane[ECS / EKS Cluster] -->|1. Schedule Task| Fargate[AWS Fargate Fleet]
    
    subgraph FargateFleet [AWS Fargate Network]
        ENI[Private Subnet ENI]
    end
    
    subgraph AWS [AWS Backend]
        Aurora[(Amazon Aurora)]
        CW[Amazon CloudWatch]
    end

    Fargate -->|2. Attach Elastic| ENI
    ENI -->|3. Private Query| Aurora
    Fargate -.->|4. Stream Telemetry| CW
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: Amazon ECS, Amazon EKS.
- **Downstream Targets**: Amazon CloudWatch (Logging), Amazon RDS.

## 5. Exam & Production Gotchas
- **No DaemonSets or Privileged Containers**: Fargate does not allow privileged access or Docker daemon access.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Run a standalone Fargate task on ECS
aws ecs run-task --cluster prod --task-definition web:1 --launch-type FARGATE --network-configuration "awsvpcConfiguration={subnets=[subnet-123],assignPublicIp=ENABLED}"
\`\`\``,
  },
  {
    id: 'lightsail',
    name: 'Amazon Lightsail',
    category: 'Compute',
    tier: 3,
    isFavorite: false,
    summary: 'Simplified easy-to-use virtual private server (VPS) bundles including compute, storage, DNS, and static IP for fixed predictable pricing.',
    icon: 'Compass',
    color: '#f97316',
    arnExample: 'arn:aws:lightsail:us-east-1:123456789012:Instance/*',
    docsUrl: 'https://docs.aws.amazon.com/lightsail/latest/userguide/what-is-amazon-lightsail.html',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
Amazon Lightsail delivers low-cost pre-configured virtual private servers with bundled bandwidth and storage for simple websites and development environments.

## 2. Architectural Primitives
- **Lightsail Instance**: Virtual machine bundled with memory, SSD storage, and transfer allowance.
- **Lightsail Container Service**: Simplified serverless container hosting.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    Client([Web User]) -->|1. HTTPS Request| DNS[Lightsail DNS Zone]
    
    subgraph Lightsail [Lightsail Managed Environment]
        VPS[Lightsail Virtual Server]
        Disk[(Attached Block Disk)]
        DB[(Lightsail Managed DB)]
    end

    DNS -->|2. Static Route| VPS
    VPS <-->|3. Mount Storage| Disk
    VPS -->|4. Private SQL| DB
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: Direct internet traffic.
- **Downstream Targets**: Lightsail Managed Database, S3 Bucket.

## 5. Exam & Production Gotchas
- **VPC Peering**: Lightsail runs in its own shadow VPC; communication with standard VPC resources requires Lightsail VPC Peering.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. List all active Lightsail instances
aws lightsail get-instances
\`\`\``,
  },

  // ==========================================
  // ADDITIONAL STORAGE SERVICES
  // ==========================================
  {
    id: 'ebs',
    name: 'Amazon EBS (Elastic Block Store)',
    category: 'Storage',
    tier: 1,
    isFavorite: false,
    summary: 'High-performance block storage volumes designed for mission-critical EC2 workloads with provisioned IOPS and automated snapshots.',
    icon: 'HardDrive',
    color: '#22c55e',
    arnExample: 'arn:aws:ec2:us-east-1:123456789012:volume/vol-0123456789abcdef0',
    docsUrl: 'https://docs.aws.amazon.com/ebs/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
Amazon EBS delivers persistent, low-latency, point-in-time snapshot-capable block storage volumes formatted and mounted directly to Amazon EC2 instances.

## 2. Architectural Primitives
- **Volume Types**: General Purpose SSD (\`gp3\`, \`gp2\`), Provisioned IOPS SSD (\`io2 Block Express\`, \`io1\`), Throughput Optimized HDD (\`st1\`), and Cold HDD (\`sc1\`).
- **EBS Snapshots**: Incremental point-in-time backups stored transparently in Amazon S3.
- **EBS Multi-Attach**: Allows an \`io2\` volume to be attached concurrently to up to 16 Nitro instances in the same AZ.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    subgraph AZ [Availability Zone A]
        EC2[Amazon EC2 Instance]
        EBS[(EBS Volume gp3)]
    end
    
    subgraph Regional [AWS Regional Storage]
        Snapshot[(EBS Snapshot Archive)]
        S3[(Amazon S3)]
    end
    
    KMS[AWS KMS]

    EC2 <-->|1. NVMe IO| EBS
    EBS <-->|2. KMS Encrypt| KMS
    EBS -.->|3. Snapshot Archive| Snapshot
    Snapshot -->|4. Cold Backup| S3
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: Amazon EC2, AWS Backup, Data Lifecycle Manager (DLM).
- **Downstream Targets**: Amazon S3 (Snapshot storage).

## 5. Exam & Production Gotchas
- **AZ Bound**: An EBS volume is strictly bound to a single Availability Zone. You cannot attach an EBS volume in us-east-1a to an instance in us-east-1b without taking a snapshot and restoring it into the target AZ.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Create a 50GB gp3 volume with 3000 IOPS and 125 MB/s throughput
aws ec2 create-volume --availability-zone us-east-1a --size 50 --volume-type gp3 --encrypted

# 2. Attach volume to a running EC2 instance
aws ec2 attach-volume --volume-id vol-0123456789abcdef0 --instance-id i-0123456789abcdef0 --device /dev/sdf

# 3. Create a snapshot with tag metadata
aws ec2 create-snapshot --volume-id vol-0123456789abcdef0 --description "Pre-deployment snapshot"
\`\`\``,
  },
  {
    id: 'efs',
    name: 'Amazon EFS (Elastic File System)',
    category: 'Storage',
    tier: 2,
    isFavorite: false,
    summary: 'Serverless, fully managed elastic NFS file system supporting concurrent read/write access from thousands of EC2 instances and containers.',
    icon: 'FolderTree',
    color: '#22c55e',
    arnExample: 'arn:aws:elasticfilesystem:us-east-1:123456789012:file-system/fs-0123456789abcdef0',
    docsUrl: 'https://docs.aws.amazon.com/efs/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
Amazon EFS provides a serverless POSIX-compliant Network File System (NFSv4) that grows and shrinks automatically, shareable across thousands of compute nodes across multiple AZs.

## 2. Architectural Primitives
- **Mount Targets**: IP endpoints provisioned within each VPC subnet for compute connections.
- **Storage Classes**: EFS Standard, EFS Infrequent Access (IA), and EFS Archive with automated lifecycle tiering.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    subgraph VPC [Amazon VPC Subnets]
        EC2[EC2 Linux Nodes]
        ECS[ECS Fargate Tasks]
    end
    
    subgraph EFSFleet [AWS EFS Managed Storage]
        MT[EFS Mount Target]
        EFS[(Elastic File System)]
    end
    
    Backup[AWS Backup]

    EC2 -->|1. NFSv4 Mount| MT
    ECS -->|1. NFSv4 Mount| MT
    MT <-->|2. POSIX IO| EFS
    EFS -.->|3. Automated Backup| Backup
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: Amazon EC2, AWS Lambda, Amazon ECS / EKS.
- **Downstream Targets**: AWS Backup.

## 5. Exam & Production Gotchas
- **Linux Only**: EFS is standard NFSv4 and supports Linux clients. For Windows environments, select Amazon FSx for Windows File Server (SMB protocol).

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Create an encrypted EFS file system
aws efs create-file-system --performance-mode generalPurpose --encrypted
\`\`\``,
  },
  {
    id: 'glacier',
    name: 'Amazon S3 Glacier',
    category: 'Storage',
    tier: 2,
    isFavorite: false,
    summary: 'Ultra-low-cost cloud storage classes for data archiving, compliance backups, and long-term retention with retrieval flexibility.',
    icon: 'Archive',
    color: '#22c55e',
    arnExample: 'arn:aws:s3:::archive-vault-2026/*',
    docsUrl: 'https://docs.aws.amazon.com/amazonglacier/latest/dev/introduction.html',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
Amazon S3 Glacier provides secure, durable archival storage costing fractions of a cent per gigabyte for regulatory compliance and tape replacement.

## 2. Architectural Primitives
- **Glacier Instant Retrieval**: Millisecond retrieval for rarely accessed data.
- **Glacier Flexible Retrieval**: 1–5 minute expedited, 3–5 hour standard, 5–12 hour bulk.
- **Glacier Deep Archive**: 12–48 hour retrieval offering lowest-cost cloud storage.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    S3[(Amazon S3 Standard)]
    
    subgraph GlacierVault [Cold Archival Storage]
        Flex[(Glacier Flexible Retrieval)]
        Deep[(Glacier Deep Archive)]
    end
    
    subgraph Downstream [Retrieval Target]
        Restore[(Restored S3 Object)]
        SQS[Amazon SQS Notification]
    end

    S3 -->|1. Lifecycle Rule| Flex
    Flex -->|2. Transition Rule| Deep
    Deep -.->|3. Restore Request| Restore
    Restore -.->|4. Completion Event| SQS
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: S3 Lifecycle policies, AWS Backup.
- **Downstream Targets**: Restore requests.

## 5. Exam & Production Gotchas
- **Minimum Storage Duration**: Glacier Flexible incurs a 90-day minimum billable duration; Deep Archive incurs 180 days. Deleting early triggers pro-rated fees.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Restore an object from Glacier Flexible using expedited retrieval
aws s3api restore-object --bucket my-archive-bucket --key dataset.tar.gz --restore-request '{"Days":7,"GlacierJobParameters":{"Tier":"Expedited"}}'
\`\`\``,
  },
  {
    id: 'storage-gateway',
    name: 'AWS Storage Gateway',
    category: 'Storage',
    tier: 3,
    isFavorite: false,
    summary: 'Hybrid cloud storage service connecting on-premises IT environments directly to virtually unlimited AWS cloud storage.',
    icon: 'Layers',
    color: '#22c55e',
    arnExample: 'arn:aws:storagegateway:us-east-1:123456789012:gateway/sgw-12345678',
    docsUrl: 'https://docs.aws.amazon.com/storagegateway/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
AWS Storage Gateway bridges on-premises physical or virtual infrastructure to AWS S3 and EBS with local disk caching for low-latency access.

## 2. Architectural Primitives
- **S3 File Gateway**: Exposes S3 buckets via NFS and SMB protocols.
- **Volume Gateway**: Block storage via iSCSI (Cached or Stored volumes).
- **Tape Gateway (VTL)**: Replaces physical tape backup systems with cloud VTL.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    subgraph OnPrem [On-Premises Datacenter]
        App[Enterprise Application]
        GW[Storage Gateway Appliance]
    end
    
    subgraph AWS [AWS Cloud]
        DX[AWS Direct Connect]
        S3[(Amazon S3 Bucket)]
        EBS[(EBS Snapshots)]
    end

    App -->|1. NFS/SMB Mount| GW
    GW -->|2. Encrypted Tunnel| DX
    DX -->|3. File Sync| S3
    DX -->|4. Volume Sync| EBS
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: On-premise servers and backup tools.
- **Downstream Targets**: Amazon S3, Amazon EBS Snapshots.

## 5. Exam & Production Gotchas
- **Cached vs Stored**: Cached stores primary data in S3 and keeps frequently accessed data locally; Stored stores entire data locally and backs up asynchronously to S3.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. List active storage gateways
aws storagegateway list-gateways
\`\`\``,
  },

  // ==========================================
  // DATABASE SERVICES
  // ==========================================
  {
    id: 'rds',
    name: 'Amazon RDS (Relational Database Service)',
    category: 'Database',
    tier: 1,
    isFavorite: false,
    summary: 'Managed relational database engine supporting PostgreSQL, MySQL, MariaDB, Oracle, and SQL Server with automated backups and Multi-AZ failover.',
    icon: 'Database',
    color: '#3b82f6',
    arnExample: 'arn:aws:rds:us-east-1:123456789012:db:production-postgres',
    docsUrl: 'https://docs.aws.amazon.com/rds/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
Amazon RDS automates relational database provisioning, hardware sizing, OS/engine patching, point-in-time recovery, and synchronous Multi-AZ disaster failover.

## 2. Architectural Primitives
- **DB Instance**: Dedicated compute environment running selected SQL database engine.
- **Multi-AZ Deployment**: Synchronous physical replication to standby instance in another AZ with automatic DNS failover (60-120 seconds).
- **Read Replicas**: Asynchronous replication across same region or cross-region for horizontal read scaling.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    App[EC2 / ECS App Server]
    
    subgraph VPC [VPC Multi-AZ Fleet]
        Primary[(RDS Primary DB)]
        Standby[(RDS Standby DB)]
        Replica[(RDS Read Replica)]
    end
    
    KMS[AWS KMS]

    App -->|1. SQL Write| Primary
    Primary -->|2. Sync Replication| Standby
    Primary -.->|3. Async Binlog| Replica
    App -->|4. SQL Read| Replica
    Primary <-->|5. SSE-KMS Encryption| KMS
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: Amazon EC2, Amazon ECS, AWS Lambda (via RDS Proxy).
- **Downstream Targets**: Amazon S3 (Automated backups and exports), AWS KMS (Encryption at rest).

## 5. Exam & Production Gotchas
- **Multi-AZ vs Read Replica**: Multi-AZ is strictly for High Availability / Disaster Recovery (standby cannot serve read queries). Read Replicas are for performance / read scaling (can serve reads, but replication is asynchronous).
- **Lambda Connection Exhaustion**: Serverless Lambda functions spinning up thousands of concurrent containers will exhaust relational DB connection pools. Always deploy Amazon RDS Proxy between Lambda and RDS.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Create a production PostgreSQL Multi-AZ instance
aws rds create-db-instance \\
  --db-instance-identifier prod-postgres \\
  --db-instance-class db.r6g.large \\
  --engine postgres \\
  --allocated-storage 100 \\
  --multi-az \\
  --master-username dbadmin \\
  --manage-master-user-password

# 2. Trigger an immediate failover drill on a Multi-AZ instance
aws rds reboot-db-instance --db-instance-identifier prod-postgres --force-failover

# 3. Create a read replica in a different AZ
aws rds create-db-instance-read-replica --db-instance-identifier prod-postgres-replica --source-db-instance-identifier prod-postgres
\`\`\``,
  },
  {
    id: 'dynamodb',
    name: 'Amazon DynamoDB',
    category: 'Database',
    tier: 1,
    isFavorite: false,
    summary: 'Fully managed NoSQL key-value and document database delivering single-digit millisecond latency at any scale with ACID transactions.',
    icon: 'Table',
    color: '#3b82f6',
    arnExample: 'arn:aws:dynamodb:us-east-1:123456789012:table/Orders',
    docsUrl: 'https://docs.aws.amazon.com/dynamodb/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
Amazon DynamoDB delivers serverless, single-digit millisecond read/write performance for schemaless key-value and document data at virtually limitless throughput.

## 2. Architectural Primitives
- **Partition Key & Sort Key**: Primary key schema determining internal physical shard routing and localized sorting.
- **Global Secondary Index (GSI) & LSI**: GSI allows querying on alternate keys with independent throughput; LSI shares partition key with different sort key.
- **DynamoDB Streams**: Ordered time-sequenced record of item-level changes (Change Data Capture) with 24-hour retention.
- **DynamoDB Accelerator (DAX)**: In-memory hardware cache accelerating read response times from milliseconds to microseconds.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    Client([Lambda / ECS Workload])
    
    subgraph DDBCluster [DynamoDB Engine]
        DAX[Amazon DynamoDB DAX]
        DDB[(DynamoDB Table)]
        Stream[DynamoDB Streams]
    end
    
    Consumer[AWS Lambda Consumer]

    Client -->|1. Cached Read| DAX
    DAX <-->|2. Cache Miss| DDB
    Client -->|3. PutItem Write| DDB
    DDB -.->|4. CDC Mutations| Stream
    Stream -->|5. Event Batch| Consumer
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: AWS Lambda, Amazon API Gateway, Amazon ECS, AppSync.
- **Downstream Targets**: AWS Lambda (via DynamoDB Streams), Amazon OpenSearch (via streaming ETL), S3 (via Point-in-time export).

## 5. Exam & Production Gotchas
- **Hot Partitions**: If partition keys are poorly distributed (e.g., partitioning by status or timestamp), requests concentrate on a single shard, triggering throttling exceptions even with provisioned capacity.
- **GSI Backpressure Throttling**: In provisioned mode, if a write occurs to a table and a GSI lacks sufficient write capacity, the entire table write is throttled.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Create a pay-per-request (on-demand) table with composite primary key
aws dynamodb create-table \\
  --table-name Orders \\
  --attribute-definitions AttributeName=pk,AttributeType=S AttributeName=sk,AttributeType=S \\
  --key-schema AttributeName=pk,KeyType=HASH AttributeName=sk,KeyType=RANGE \\
  --billing-mode PAY_PER_REQUEST

# 2. Query items matching a partition key and range condition
aws dynamodb query \\
  --table-name Orders \\
  --key-condition-expression "pk = :userId AND sk begins_with(:prefix)" \\
  --expression-attribute-values '{":userId":{"S":"USER#99"},":prefix":{"S":"ORDER#2026"}}'

# 3. Enable Continuous Backups with Point-in-Time Recovery (PITR)
aws dynamodb update-continuous-backups --table-name Orders --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true
\`\`\``,
  },
  {
    id: 'aurora',
    name: 'Amazon Aurora',
    category: 'Database',
    tier: 1,
    isFavorite: false,
    summary: 'Cloud-native MySQL and PostgreSQL-compatible relational database with distributed storage replicated 6 ways across 3 AZs.',
    icon: 'Database',
    color: '#3b82f6',
    arnExample: 'arn:aws:rds:us-east-1:123456789012:cluster/prod-aurora-cluster',
    docsUrl: 'https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_AuroraOverview.html',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
Amazon Aurora delivers enterprise-grade MySQL and PostgreSQL performance (up to 5x MySQL and 3x Postgres) with an independent self-healing distributed storage plane.

## 2. Architectural Primitives
- **Shared Storage Fleet**: Automatically scales up to 128 TiB, striping data across 6 copies in 3 AZs (requires 4/6 quorum for writes, 3/6 for reads).
- **Aurora Serverless v2**: Instantaneous scaling in fine-grained Aurora Capacity Units (ACUs) to match dynamic traffic spikes.
- **Aurora Global Database**: Cross-region physical replication with latency under 1 second.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    App[Application Services]
    
    subgraph AuroraCluster [Multi-AZ Aurora Cluster]
        Writer[(Aurora Writer AZ-A)]
        Reader[(Aurora Reader AZ-B)]
        Storage[(Shared Cluster Storage)]
    end
    
    KMS[AWS KMS]

    App -->|1. ReadWrite SQL| Writer
    App -->|2. ReadOnly SQL| Reader
    Writer -->|3. Storage Quorum| Storage
    Storage -.->|4. Low-latency Replication| Reader
    Storage <-->|5. KMS Decrypt| KMS
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: Amazon EC2, Amazon ECS, AWS Lambda.
- **Downstream Targets**: Amazon S3 (Fast exports), AWS Secrets Manager.

## 5. Exam & Production Gotchas
- **Failover Speed**: Aurora failover to a read replica completes in under 30 seconds because replicas share the same underlying storage engine without replay lag.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Create an Aurora PostgreSQL Serverless v2 cluster
aws rds create-db-cluster \\
  --db-cluster-identifier prod-aurora \\
  --engine aurora-postgresql \\
  --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=16 \\
  --master-username adminuser \\
  --manage-master-user-password
\`\`\``,
  },
  {
    id: 'elasticache',
    name: 'Amazon ElastiCache',
    category: 'Database',
    tier: 2,
    isFavorite: false,
    summary: 'Ultra-fast in-memory data store compatible with Redis and Memcached delivering sub-millisecond response times for real-time applications.',
    icon: 'Zap',
    color: '#3b82f6',
    arnExample: 'arn:aws:elasticache:us-east-1:123456789012:cluster/session-cache',
    docsUrl: 'https://docs.aws.amazon.com/elasticache/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
Amazon ElastiCache caches high-frequency read queries and session state in memory (Redis / Valkey / Memcached) to offload relational databases and deliver sub-millisecond latencies.

## 2. Architectural Primitives
- **Cache Nodes & Shards**: Primary and replica nodes supporting cluster mode enabled or disabled.
- **Eviction Policies**: LRU, LFU, and Volatile TTL mechanisms governing memory saturation.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    App[Application Workload]
    
    subgraph CacheTier [Amazon ElastiCache Redis]
        Primary[Primary Cache Node]
        Replica[Read Replica Node]
    end
    
    subgraph Persistence [Database Tier]
        RDS[(Primary RDS Multi-AZ)]
    end

    App <-->|1. Sub-ms ReadWrite| Primary
    Primary -->|2. Async Replication| Replica
    App -->|3. Read Scale| Replica
    App <-->|4. Cache Miss| RDS
    RDS -.->|5. Lazy Backfill| Primary
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: Application tier (EC2 / ECS / Lambda).
- **Downstream Targets**: Amazon RDS / Aurora (Write-through or lazy loading).

## 5. Exam & Production Gotchas
- **VPC Placement**: ElastiCache instances cannot be assigned public IP addresses and can only be accessed from within their VPC or via Direct Connect / VPN.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Describe replication group status
aws elasticache describe-replication-groups --replication-group-id prod-redis-cluster
\`\`\``,
  },
  {
    id: 'redshift',
    name: 'Amazon Redshift',
    category: 'Database',
    tier: 2,
    isFavorite: false,
    summary: 'Fast, petabyte-scale cloud data warehouse analyzing structured and semi-structured data using standard SQL and columnar storage.',
    icon: 'BarChart',
    color: '#3b82f6',
    arnExample: 'arn:aws:redshift:us-east-1:123456789012:cluster/prod-dwh',
    docsUrl: 'https://docs.aws.amazon.com/redshift/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
Amazon Redshift delivers mass-parallel processing (MPP) columnar data warehousing for complex BI analytics across petabytes of enterprise data.

## 2. Architectural Primitives
- **Leader Node & Compute Nodes**: Leader node coordinates query planning and execution across compute node slices.
- **Redshift Spectrum**: Queries exabytes of unstructured data directly in S3 data lakes without loading.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    BI([QuickSight / SQL BI])
    
    subgraph RedshiftCluster [Amazon Redshift RA3]
        Leader[Leader Node]
        Compute[Compute Node Fleet]
        Managed[(Managed Storage Tier)]
    end
    
    S3[(Amazon S3 Data Lake)]

    BI -->|1. JDBC Query| Leader
    Leader -->|2. Distribute Plan| Compute
    Compute <-->|3. Columnar Scan| Managed
    Compute -.->|4. Redshift Spectrum| S3
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: Amazon Kinesis Data Firehose, AWS Glue, DMS.
- **Downstream Targets**: Amazon QuickSight, Tableau.

## 5. Exam & Production Gotchas
- **Distribution Keys**: Choose Even, Key, or All distribution carefully; mismatched distribution keys force expensive network data shuffling during SQL joins.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Describe Redshift cluster status
aws redshift describe-clusters --cluster-identifier prod-dwh
\`\`\``,
  },

  // ==========================================
  // ADDITIONAL NETWORKING SERVICES
  // ==========================================
  {
    id: 'route53',
    name: 'Amazon Route 53',
    category: 'Networking',
    tier: 1,
    isFavorite: false,
    summary: 'Highly available and scalable cloud Domain Name System (DNS) web service with health checking, failover routing, and private DNS zones.',
    icon: 'Globe',
    color: '#a855f7',
    arnExample: 'arn:aws:route53:::hostedzone/Z1234567890ABC',
    docsUrl: 'https://docs.aws.amazon.com/route53/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
Amazon Route 53 routes end-user internet traffic globally to AWS resources and external endpoints with health-checked DNS resolution and intelligent latency routing.

## 2. Architectural Primitives
- **Hosted Zones**: Public zones resolved on the internet; Private zones resolved strictly within VPCs.
- **Routing Policies**: Simple, Weighted, Latency-based, Failover (Active-Passive), Geolocation, Geoproximity, and Multi-Value Answer.
- **Alias Records**: AWS-specific extension to DNS that routes naked domains (zone apex) directly to AWS resources (ALB, CloudFront, S3) without CNAME restrictions.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    Client([Web Browser / Client]) -->|1. DNS Query| R53[Amazon Route 53]
    
    subgraph PrimaryRegion [us-east-1]
        ALB1[Primary ALB Origin]
    end
    
    subgraph FailoverRegion [us-west-2]
        ALB2[Failover ALB Origin]
    end
    
    HC[Route 53 Health Check]

    HC -.->|2. HTTP Check| ALB1
    R53 -->|3. Active Route| ALB1
    R53 -.->|4. Failover Route| ALB2
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: Global client DNS queries.
- **Downstream Targets**: CloudFront, ALB/NLB, S3 Static Websites, API Gateway.

## 5. Exam & Production Gotchas
- **CNAME vs Alias Record**: A standard DNS CNAME cannot be created for the zone apex (e.g., \`example.com\`). You MUST use a Route 53 Alias record to point the zone apex to an ALB or CloudFront distribution.
- **Health Checks inside Private Subnets**: Route 53 health checkers reside on the public internet. They cannot directly check private IP addresses inside a VPC unless accessed via public IP or metric-based CloudWatch alarm health checks.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. List all hosted zones in the account
aws route53 list-hosted-zones

# 2. Test DNS query response resolution directly through Route 53 servers
aws route53 test-dns-answer --hosted-zone-id Z1234567890ABC --record-name api.example.com --record-type A

# 3. Create a DNS record set change batch
aws route53 change-resource-record-sets --hosted-zone-id Z1234567890ABC --change-batch file://dns-change.json
\`\`\``,
  },
  {
    id: 'cloudfront',
    name: 'Amazon CloudFront',
    category: 'Networking',
    tier: 1,
    isFavorite: false,
    summary: 'Global Content Delivery Network (CDN) securely distributing data, videos, applications, and APIs with low latency and edge compute.',
    icon: 'Radio',
    color: '#a855f7',
    arnExample: 'arn:aws:cloudfront::123456789012:distribution/EDFDVBD632BHDS5',
    docsUrl: 'https://docs.aws.amazon.com/cloudfront/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
Amazon CloudFront speeds up web distribution by caching content at hundreds of global edge locations while terminating TLS and mitigating DDoS attacks.

## 2. Architectural Primitives
- **Edge Locations & Regional Edge Caches**: Global network of PoPs caching static objects and accelerating dynamic requests.
- **Origin & Origin Groups**: Backend origins (S3 buckets, ALBs, custom servers) with automated failover policies.
- **Origin Access Control (OAC)**: SigV4 authenticated signing restricting S3 access strictly to CloudFront distributions.
- **CloudFront Functions & Lambda@Edge**: Sub-millisecond JavaScript edge manipulation of headers and authentication.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    Client([Global End User]) -->|1. HTTPS Request| CF[Amazon CloudFront PoP]
    
    subgraph Edge [AWS Edge Network]
        WAF[AWS WAF Web ACL]
    end
    
    subgraph Origins [Origin Perimeter]
        S3[(Private S3 Bucket)]
        ALB[Application Load Balancer]
    end

    CF <-->|2. Inspect Rules| WAF
    CF -->|3. OAC SigV4| S3
    CF -->|4. Origin Forward| ALB
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: Amazon Route 53, Public Clients.
- **Downstream Targets**: Amazon S3 (OAC), Application Load Balancer, API Gateway.

## 5. Exam & Production Gotchas
- **OAC replaces OAI**: Legacy Origin Access Identity (OAI) is deprecated; Origin Access Control (OAC) supports all S3 buckets in all regions, SSE-KMS encryption, and dynamic POST/PUT requests.
- **Cache Invalidation Costs**: The first 1,000 invalidation paths per month are free; thereafter each path incurs a cost. Use object versioning in filenames (\`app.v2.js\`) rather than wildcards.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Create a cache invalidation for updated assets
aws cloudfront create-invalidation --distribution-id EDFDVBD632BHDS5 --paths "/index.html" "/static/*"

# 2. Get distribution configuration details
aws cloudfront get-distribution --id EDFDVBD632BHDS5
\`\`\``,
  },
  {
    id: 'alb',
    name: 'Elastic Load Balancing (ALB / NLB)',
    category: 'Networking',
    tier: 1,
    isFavorite: false,
    summary: 'Distributes incoming application and network traffic across multiple targets (EC2, ECS, Lambda, IPs) with high availability and health routing.',
    icon: 'Shuffle',
    color: '#a855f7',
    arnExample: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/prod-alb/1234567890',
    docsUrl: 'https://docs.aws.amazon.com/elasticloadbalancing/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
Elastic Load Balancing automatically distributes application traffic across multiple targets in multiple availability zones to ensure fault tolerance.

## 2. Architectural Primitives
- **Application Load Balancer (ALB)**: Layer 7 load balancer routing on HTTP/HTTPS path, host headers, query params, and gRPC.
- **Network Load Balancer (NLB)**: Layer 4 ultra-high-throughput TCP/UDP load balancer handling millions of requests per second with static IP addresses.
- **Target Groups**: Logical collections of backend targets (EC2 instance IDs, container IP addresses, Lambda functions).

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    Client([Internet Client]) -->|1. HTTPS:443| ALB[Application Load Balancer]
    
    subgraph PrivateSubnets [VPC Private Subnets]
        ECS[ECS Fargate Tasks]
        EC2[EC2 Auto Scaling]
    end
    
    WAF[AWS WAF]

    ALB <-->|2. Shield Inspect| WAF
    ALB -->|3. Route API| ECS
    ALB -->|4. Route Web| EC2
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: Amazon Route 53, Amazon CloudFront.
- **Downstream Targets**: Amazon EC2, Amazon ECS, AWS Lambda.

## 5. Exam & Production Gotchas
- **ALB has no Static IP**: An Application Load Balancer does NOT have static IP addresses (it scales dynamically and resolves via DNS name). If static IPs or allowlisting is required, place an NLB in front with an ALB target or use AWS Global Accelerator.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Describe health of targets in a target group
aws elbv2 describe-target-health --target-group-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/prod-tg/123

# 2. Modify ALB attributes to enable access logging to S3
aws elbv2 modify-load-balancer-attributes --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/prod-alb/123 --attributes Key=access_logs.s3.enabled,Value=true Key=access_logs.s3.bucket,Value=prod-logs-bucket
\`\`\``,
  },
  {
    id: 'api-gateway',
    name: 'Amazon API Gateway',
    category: 'Networking',
    tier: 1,
    isFavorite: false,
    summary: 'Fully managed service that makes it easy for developers to create, publish, maintain, monitor, and secure APIs at any scale.',
    icon: 'Code2',
    color: '#a855f7',
    arnExample: 'arn:aws:apigateway:us-east-1::/restapis/abc123xyz',
    docsUrl: 'https://docs.aws.amazon.com/apigateway/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
Amazon API Gateway acts as the secure front door for applications to access backend services, managing traffic, authorization, throttling, and API versioning.

## 2. Architectural Primitives
- **API Types**: REST APIs (full-featured, request validation, API keys), HTTP APIs (low latency, cost-effective), and WebSocket APIs (bi-directional real-time).
- **Authorizers**: Lambda Custom Authorizers, Cognito User Pools, and IAM SigV4 authorizers.
- **Usage Plans & API Keys**: Controls rate limits, burst quotas, and billing metering per consumer.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    Client([API Consumer / Web]) -->|1. HTTPS Call| APIGW[Amazon API Gateway]
    
    subgraph AWS [AWS Backend Tier]
        Cognito[Amazon Cognito]
        Lambda[AWS Lambda Function]
        SFN[AWS Step Functions]
    end

    APIGW <-->|2. Validate JWT| Cognito
    APIGW -->|3. Sync Invoke| Lambda
    APIGW -.->|4. Async Start| SFN
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: Web / Mobile clients, Route 53.
- **Downstream Targets**: AWS Lambda, VPC Link (Internal ALB/NLB), Step Functions.

## 5. Exam & Production Gotchas
- **REST vs HTTP API**: HTTP APIs are up to 70% cheaper and have lower latency than REST APIs, but lack features like API Keys, Usage Plans, Request Validation, and WAF integration (though WAF support was added).

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Deploy API Gateway to a stage
aws apigateway create-deployment --rest-api-id abc123xyz --stage-name production
\`\`\``,
  },

  // ==========================================
  // ADDITIONAL SECURITY & IAM SERVICES
  // ==========================================
  {
    id: 'kms',
    name: 'AWS Key Management Service (KMS)',
    category: 'Security/IAM',
    tier: 1,
    isFavorite: false,
    summary: 'Managed service that makes it easy to create and control cryptographic keys used to encrypt data across AWS services and applications.',
    icon: 'Key',
    color: '#ef4444',
    arnExample: 'arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012',
    docsUrl: 'https://docs.aws.amazon.com/kms/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
AWS KMS generates, protects, and governs cryptographic master keys (KMS keys) enforcing hardware security module (FIPS 140-2 Level 3) envelope encryption.

## 2. Architectural Primitives
- **Customer Master Key (CMK) / KMS Key**: Logical key holding metadata; plaintext key material never leaves AWS HSMs.
- **Envelope Encryption**: KMS generates a plaintext data key and encrypted data key; your app encrypts data locally and discards the plaintext key.
- **Key Policies**: Mandatory JSON resource policy controlling key access (IAM policies alone cannot grant access without Key Policy permission).

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    Client([Caller App / S3])
    
    subgraph KMSBoundary [AWS KMS Fleet]
        KMS[AWS KMS HSM]
        KMSKey[(Customer Managed Key)]
    end
    
    subgraph Auditing [Security Observability]
        Trail[AWS CloudTrail]
        CW[Amazon CloudWatch]
    end

    Client -->|1. GenerateDataKey| KMS
    KMS <-->|2. HSM Wrap| KMSKey
    KMS -->|3. Return Keys| Client
    KMS -.->|4. Audit Event| Trail
    Trail -.->|5. Alarm Filter| CW
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: Amazon S3, Amazon EBS, Amazon RDS, DynamoDB, Secrets Manager.
- **Downstream Targets**: CloudTrail (Comprehensive audit logging of every cryptographic operation).

## 5. Exam & Production Gotchas
- **Key Policy is Sovereign**: If you delete or misconfigure the root statement in a Key Policy (\`Principal: { AWS: "arn:aws:iam::ACCOUNT_ID:root" }\`), even the AWS account root user cannot manage or decrypt with that key.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Create a customer-managed KMS key with automatic rotation enabled
aws kms create-key --description "Production database encryption key"

# 2. Enable automatic annual rotation on a KMS key
aws kms enable-key-rotation --key-id 12345678-1234-1234-1234-123456789012
\`\`\``,
  },
  {
    id: 'secrets-manager',
    name: 'AWS Secrets Manager',
    category: 'Security/IAM',
    tier: 2,
    isFavorite: false,
    summary: 'Automates secret lifecycle management, storing database credentials and API keys with built-in automatic rotation.',
    icon: 'Lock',
    color: '#ef4444',
    arnExample: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:prod/db/credentials-abc',
    docsUrl: 'https://docs.aws.amazon.com/secretsmanager/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
AWS Secrets Manager stores, retrieves, and automatically rotates database passwords and API tokens using serverless Lambda rotation functions.

## 2. Architectural Primitives
- **Secret**: Encrypted key-value JSON string secured by KMS.
- **Rotation Lambda**: Function triggered automatically every 30-90 days to update the database password and secret simultaneously.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    App[EC2 / ECS Container]
    
    subgraph SecretsBoundary [AWS Secrets Manager]
        SM[AWS Secrets Manager]
        KMS[AWS KMS]
    end
    
    subgraph DatabaseTarget [VPC Data Tier]
        Rotator[Lambda Rotation Function]
        RDS[(Amazon RDS Database)]
    end

    App -->|1. GetSecretValue| SM
    SM <-->|2. Decrypt Secret| KMS
    SM -.->|3. Trigger Rotation| Rotator
    Rotator -->|4. Alter Password| RDS
    Rotator -->|5. Store Secret| SM
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: EC2, ECS, Lambda, CodeBuild.
- **Downstream Targets**: Amazon RDS, DocumentDB, Redshift.

## 5. Exam & Production Gotchas
- **Secrets Manager vs Systems Manager Parameter Store**: Parameter Store SecureString is free for standard parameters, but lacks automated rotation out of the box. Secrets Manager costs $0.40/secret/month and includes native database rotation templates.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Retrieve secret string value
aws secretsmanager get-secret-value --secret-id prod/db/credentials
\`\`\``,
  },
  {
    id: 'waf',
    name: 'AWS WAF (Web Application Firewall)',
    category: 'Security/IAM',
    tier: 2,
    isFavorite: false,
    summary: 'Protects web applications and APIs against common web exploits, SQL injections, cross-site scripting (XSS), and bot traffic.',
    icon: 'Shield',
    color: '#ef4444',
    arnExample: 'arn:aws:wafv2:us-east-1:123456789012:regional/webacl/prod-waf/abc',
    docsUrl: 'https://docs.aws.amazon.com/waf/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
AWS WAF inspects HTTP/HTTPS requests at Layer 7 to block SQL injection, cross-site scripting, rate-limit brute force attacks, and filter bad bots.

## 2. Architectural Primitives
- **Web ACL**: Rule group container attached to resources.
- **Rules & Managed Rule Groups**: AWS Managed Rules (Core rule set, SQLi, Known Bad Inputs) + Custom rate-based rules.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    Client([Incoming Web Traffic]) -->|1. HTTPS Request| WAF[AWS WAF Web ACL]
    
    subgraph ProtectedAssets [Ingress Endpoints]
        CF[Amazon CloudFront]
        ALB[Application Load Balancer]
        APIGW[Amazon API Gateway]
    end

    WAF -->|2. Forward Clean| CF
    WAF -->|3. Forward Clean| ALB
    WAF -->|4. Forward Clean| APIGW
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: Internet clients.
- **Downstream Targets**: CloudFront, ALB, API Gateway, AppSync.

## 5. Exam & Production Gotchas
- **Scope Setting**: When creating a Web ACL for CloudFront, scope MUST be \`CLOUDFRONT\` and created in \`us-east-1\`. For ALB or API Gateway, scope is \`REGIONAL\`.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. List regional Web ACLs
aws wafv2 list-web-acls --scope REGIONAL
\`\`\``,
  },
  {
    id: 'shield',
    name: 'AWS Shield',
    category: 'Security/IAM',
    tier: 3,
    isFavorite: false,
    summary: 'Managed Distributed Denial of Service (DDoS) protection service safeguarding web applications running on AWS.',
    icon: 'ShieldAlert',
    color: '#ef4444',
    arnExample: 'arn:aws:shield::123456789012:protection/*',
    docsUrl: 'https://docs.aws.amazon.com/shield/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
AWS Shield provides automated Layer 3 and 4 DDoS defense (Shield Standard, free for all AWS customers) and 24/7 Shield Response Team protection against Layer 7 volumetric attacks (Shield Advanced).

## 2. Architectural Primitives
- **Shield Standard**: Automatic SYN/UDP floods and reflection attack mitigation.
- **Shield Advanced**: Cost protection against scaling spikes during DDoS, SRT 24/7 support, and bundled WAF rules.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    Traffic([Internet Traffic / Attacks]) -->|1. Anycast Ingress| Shield[AWS Shield Advanced]
    
    subgraph Perimeter [Protected AWS Assets]
        R53[Amazon Route 53]
        CF[Amazon CloudFront]
        ALB[Application Load Balancer]
    end

    Shield -->|2. Filter DNS| R53
    Shield -->|3. Filter Edge| CF
    Shield -->|4. Filter Web| ALB
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: Internet transit.
- **Downstream Targets**: CloudFront, Route 53, Elastic IPs.

## 5. Exam & Production Gotchas
- **Cost Protection**: Shield Advanced guarantees financial credits for bill spikes caused by auto-scaling during a confirmed DDoS attack.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Describe Shield subscription status
aws shield describe-subscription
\`\`\``,
  },

  // ==========================================
  // ADDITIONAL SERVERLESS & EVENT SERVICES
  // ==========================================
  {
    id: 'sqs',
    name: 'Amazon SQS (Simple Queue Service)',
    category: 'Serverless',
    tier: 1,
    isFavorite: false,
    summary: 'Fully managed distributed message queuing service enabling decoupling and scaling of microservices and serverless architectures.',
    icon: 'ListOrdered',
    color: '#ec4899',
    arnExample: 'arn:aws:sqs:us-east-1:123456789012:order-processing-queue',
    docsUrl: 'https://docs.aws.amazon.com/sqs/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
Amazon SQS buffers and decouples asynchronous distributed workloads with at-least-once or strictly ordered first-in-first-out (FIFO) message queues.

## 2. Architectural Primitives
- **Standard Queues**: Nearly unlimited throughput with best-effort ordering and at-least-once delivery.
- **FIFO Queues**: Strictly ordered delivery and exactly-once processing with deduplication IDs (capped at 3,000 msgs/s with batching or 300 msgs/s without).
- **Visibility Timeout**: The window during which a consumed message remains hidden from other workers while being processed (0s to 12h, default 30s).
- **Dead Letter Queue (DLQ)**: Quarantine queue isolating poisoned messages exceeding \`maxReceiveCount\`.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    Producer([Producer Microservice])
    
    subgraph QueueTier [Amazon SQS Queue]
        SQS[(Amazon SQS Standard/FIFO)]
        DLQ[(Dead Letter Queue)]
    end
    
    subgraph ConsumerTier [Processing Fleet]
        Worker[AWS Lambda Worker]
        CW[Amazon CloudWatch]
    end

    Producer -->|1. SendMessage| SQS
    Worker <-->|2. Long Polling| SQS
    Worker -->|3. DeleteMessage| SQS
    SQS -.->|4. MaxReceive Fail| DLQ
    SQS -.->|5. QueueDepth Alarm| CW
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: Amazon SNS (Fanout), AWS Lambda, API Gateway, S3 Events.
- **Downstream Targets**: AWS Lambda (Event source mapping), EC2 Auto Scaling, ECS workers.

## 5. Exam & Production Gotchas
- **Visibility Timeout vs Lambda Timeout**: The SQS Visibility Timeout MUST be configured to at least 6x the timeout of the consuming Lambda function to prevent duplicate processing.
- **Short Polling vs Long Polling**: Long polling (\`ReceiveMessageWaitTimeSeconds = 20\`) significantly reduces cost and empty responses by waiting for messages to arrive.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Create a Dead Letter Queue and main queue
aws sqs create-queue --queue-name order-processing-queue

# 2. Receive messages using long polling (20s)
aws sqs receive-message --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/order-processing-queue --wait-time-seconds 20

# 3. Purge all messages in a test queue
aws sqs purge-queue --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/test-queue
\`\`\``,
  },
  {
    id: 'sns',
    name: 'Amazon SNS (Simple Notification Service)',
    category: 'Serverless',
    tier: 1,
    isFavorite: false,
    summary: 'High-throughput publish/subscribe (Pub/Sub) messaging service fanning out notifications to SQS, Lambda, HTTP endpoints, SMS, and email.',
    icon: 'Bell',
    color: '#ec4899',
    arnExample: 'arn:aws:sns:us-east-1:123456789012:order-events-topic',
    docsUrl: 'https://docs.aws.amazon.com/sns/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
Amazon SNS delivers high-throughput, push-based publish/subscribe message fanout to multiple subscriber endpoints simultaneously.

## 2. Architectural Primitives
- **Topics**: Publisher communication channels (Standard or FIFO).
- **Subscriptions**: Destination endpoints registered to receive messages (SQS, Lambda, HTTPS, Email, SMS).
- **Subscription Filter Policies**: JSON filter policies routing messages strictly to subscribers with matching attribute keys.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    Publisher([Publisher Microservice]) -->|1. Publish Message| SNS[Amazon SNS Topic]
    
    subgraph Subscribers [Fan-out Subscribers]
        SQS[(Amazon SQS Queue)]
        Lambda[AWS Lambda Function]
        Email[Amazon SES / Email]
    end

    SNS -->|2. Fanout Message| SQS
    SNS -->|3. Async Invoke| Lambda
    SNS -.->|4. Filtered Alert| Email
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: Amazon S3 Events, Amazon CloudWatch Alarms, EventBridge, Lambda.
- **Downstream Targets**: Amazon SQS (SNS-SQS Fanout pattern), AWS Lambda, HTTPS Webhooks.

## 5. Exam & Production Gotchas
- **SNS + SQS Fanout Pattern**: The canonical AWS enterprise decoupling pattern. Instead of publisher sending to 5 queues, publisher sends once to SNS, and SNS fans out in parallel to 5 independent SQS queues with individual DLQs.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Publish a message with message attributes for filter policies
aws sns publish \\
  --topic-arn arn:aws:sns:us-east-1:123456789012:order-events-topic \\
  --message '{"orderId":"1029","amount":150}' \\
  --message-attributes '{"category":{"DataType":"String","StringValue":"electronics"}}'
\`\`\``,
  },
  {
    id: 'eventbridge',
    name: 'Amazon EventBridge',
    category: 'Serverless',
    tier: 1,
    isFavorite: false,
    summary: 'Serverless event bus ingesting, filtering, transforming, and routing events from AWS services, SaaS applications, and custom code.',
    icon: 'GitFork',
    color: '#ec4899',
    arnExample: 'arn:aws:events:us-east-1:123456789012:event-bus/custom-app-bus',
    docsUrl: 'https://docs.aws.amazon.com/eventbridge/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
Amazon EventBridge coordinates real-time event-driven architectures by filtering, transforming, and dispatching JSON events from AWS, SaaS providers, and microservices.

## 2. Architectural Primitives
- **Event Bus**: The pipeline routing events (Default, Custom, or Partner SaaS event bus).
- **Rules & Event Patterns**: JSON filter patterns matching incoming event source, detail-type, and payload values.
- **Targets**: AWS services invoked upon rule match (Lambda, SQS, Step Functions, ECS, Kinesis).
- **Schema Registry**: Discovers and generates TypeScript/Python code bindings for event payloads.

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    Source([AWS Service / SaaS])
    
    subgraph BusBoundary [EventBridge Event Bus]
        Bus[EventBridge Event Bus]
        Archive[(EventBridge Archive)]
    end
    
    subgraph Targets [Downstream Execution]
        SFN[AWS Step Functions]
        Lambda[AWS Lambda Function]
    end

    Source -->|1. PutEvents Ingest| Bus
    Bus -.->|2. Store Replay| Archive
    Bus -->|3. Rule Match| SFN
    Bus -->|4. Rule Match| Lambda
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: All AWS services (CloudTrail events, EC2 state changes), SaaS partners (Datadog, Shopify, Zendesk), custom apps.
- **Downstream Targets**: AWS Step Functions, AWS Lambda, Amazon SQS, ECS RunTask.

## 5. Exam & Production Gotchas
- **EventBridge vs SNS**: SNS is push-based pub/sub best for simple high-throughput fanout. EventBridge supports complex content-based JSON filtering, input transformation, event replay, and 30+ AWS targets.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Put a custom event onto an EventBridge bus
aws events put-events --entries file://event.json
\`\`\``,
  },
  {
    id: 'step-functions',
    name: 'AWS Step Functions',
    category: 'Serverless',
    tier: 2,
    isFavorite: false,
    summary: 'Visual low-code workflow orchestration service coordinating distributed microservices and serverless functions into resilient workflows.',
    icon: 'Workflow',
    color: '#ec4899',
    arnExample: 'arn:aws:states:us-east-1:123456789012:stateMachine:OrderFulfillmentWorkflow',
    docsUrl: 'https://docs.aws.amazon.com/step-functions/',
    updatedAt: Date.now(),
    markdownDoc: `## 1. 1-Sentence Core Purpose
AWS Step Functions orchestrates multi-step distributed application workflows with automated retries, error handling, branching logic, and human approval gates.

## 2. Architectural Primitives
- **State Machine**: Workflows defined in Amazon States Language (ASL) JSON.
- **Standard Workflows**: Up to 1-year execution duration, exactly-once processing, audit history.
- **Express Workflows**: Up to 5-minute execution, at-least-once processing, high volume (100k+ executions/sec).

## 3. Enterprise Flow (Mermaid)
\`\`\`mermaid
flowchart LR
    Trigger([Event / API Call])
    
    subgraph Workflow [Step Functions State Machine]
        SFN[AWS Step Functions]
    end
    
    subgraph Tasks [Integrated AWS Services]
        Lambda[AWS Lambda Task]
        ECS[Amazon ECS Fargate]
        DDB[(Amazon DynamoDB)]
    end

    Trigger -->|1. StartExecution| SFN
    SFN -->|2. Validate Order| Lambda
    SFN -->|3. Dispatch Batch| ECS
    ECS -->|4. Persist Record| DDB
\`\`\`

## 4. Canvas Connections
- **Upstream Triggers**: API Gateway, EventBridge, Lambda.
- **Downstream Targets**: Lambda, ECS, SNS, DynamoDB.

## 5. Exam & Production Gotchas
- **Saga Pattern**: Step Functions is the recommended pattern to implement the Saga distributed transaction pattern across microservices.

## 6. 3 Production CLI Commands
\`\`\`bash
# 1. Start execution of a state machine
aws stepfunctions start-execution --state-machine-arn arn:aws:states:us-east-1:123456789012:stateMachine:OrderFulfillmentWorkflow --input '{"orderId":"109"}'
\`\`\``,
  },
];

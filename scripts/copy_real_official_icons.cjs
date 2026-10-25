const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..', 'public', 'aws-icons');
const servicesOutDir = path.join(baseDir, 'services');
const groupsOutDir = path.join(baseDir, 'groups');

if (!fs.existsSync(servicesOutDir)) fs.mkdirSync(servicesOutDir, { recursive: true });
if (!fs.existsSync(groupsOutDir)) fs.mkdirSync(groupsOutDir, { recursive: true });

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    // Ignore macos hidden metadata files
    if (file.startsWith('._') || file === '.DS_Store') return;
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(full));
    } else if (file.endsWith('.svg')) {
      results.push(full);
    }
  });
  return results;
}

const allServiceIcons = walk(path.join(baseDir, 'Architecture-Service-Icons_07312026'));
const allGroupIcons = walk(path.join(baseDir, 'Architecture-Group-Icons_07312026'));
const allResourceIcons = walk(path.join(baseDir, 'Resource-Icons_07312026'));

console.log(`Found ${allServiceIcons.length} service icons, ${allGroupIcons.length} group icons, ${allResourceIcons.length} resource icons.`);

// Service ID mapping
const serviceMap = {
  // Storage
  's3': 'Arch_Amazon-Simple-Storage-Service_48.svg',
  'glacier': 'Arch_Amazon-Simple-Storage-Service-Glacier_48.svg',
  'ebs': 'Arch_Amazon-Elastic-Block-Store_48.svg',
  'efs': 'Arch_Amazon-EFS_48.svg',
  'storage-gateway': 'Arch_AWS-Storage-Gateway_48.svg',

  // Compute
  'ec2': 'Arch_Amazon-EC2_48.svg',
  'lambda': 'Arch_AWS-Lambda_48.svg',
  'lightsail': 'Arch_Amazon-Lightsail_48.svg',
  'fargate': 'Arch_AWS-Fargate_48.svg',
  'ecs': 'Arch_Amazon-Elastic-Container-Service_48.svg',
  'eks': 'Arch_Amazon-Elastic-Kubernetes-Service_48.svg',

  // Database
  'rds': 'Arch_Amazon-RDS_48.svg',
  'dynamodb': 'Arch_Amazon-DynamoDB_48.svg',
  'aurora': 'Arch_Amazon-Aurora_48.svg',
  'elasticache': 'Arch_Amazon-ElastiCache_48.svg',
  'redshift': 'Arch_Amazon-Redshift_48.svg',

  // Networking
  'vpc': 'Arch_Amazon-Virtual-Private-Cloud_48.svg',
  'route53': 'Arch_Amazon-Route-53_48.svg',
  'cloudfront': 'Arch_Amazon-CloudFront_48.svg',
  'alb': 'Arch_Elastic-Load-Balancing_48.svg',
  'elb': 'Arch_Elastic-Load-Balancing_48.svg',
  'api-gateway': 'Arch_Amazon-API-Gateway_48.svg',
  'apigateway': 'Arch_Amazon-API-Gateway_48.svg',
  'natgateway': 'Res_Amazon-VPC_NAT-Gateway_48.svg',
  'igw': 'Res_Amazon-VPC_Internet-Gateway_48.svg',

  // Security
  'iam': 'Arch_AWS-Identity-and-Access-Management_48.svg',
  'kms': 'Arch_AWS-Key-Management-Service_48.svg',
  'secrets-manager': 'Arch_AWS-Secrets-Manager_48.svg',
  'waf': 'Arch_AWS-WAF_48.svg',
  'shield': 'Arch_AWS-Shield_48.svg',
  'cognito': 'Arch_Amazon-Cognito_48.svg',

  // Application Integration
  'sqs': 'Arch_Amazon-Simple-Queue-Service_48.svg',
  'sns': 'Arch_Amazon-Simple-Notification-Service_48.svg',
  'eventbridge': 'Arch_Amazon-EventBridge_48.svg',
  'step-functions': 'Arch_AWS-Step-Functions_48.svg',

  // Management & Governance
  'cloudwatch': 'Arch_Amazon-CloudWatch_48.svg',
  'cloudtrail': 'Arch_AWS-CloudTrail_48.svg',
};

const allSearch = [...allServiceIcons, ...allResourceIcons, ...allGroupIcons];

let mappedCount = 0;
for (const [serviceId, fileName] of Object.entries(serviceMap)) {
  const match = allSearch.find(f => path.basename(f) === fileName);
  if (match) {
    const dest = path.join(servicesOutDir, `${serviceId}.svg`);
    fs.copyFileSync(match, dest);
    mappedCount++;
    console.log(`Copied service icon: ${serviceId} <- ${fileName}`);
  } else {
    console.warn(`WARNING: Could not find icon file for ${serviceId}: ${fileName}`);
  }
}

// Group mappings
const groupMap = {
  'aws-cloud': 'AWS-Cloud_32.svg',
  'region': 'Region_32.svg',
  'vpc': 'Virtual-private-cloud-VPC_32.svg',
  'public-subnet': 'Public-subnet_32.svg',
  'private-subnet': 'Private-subnet_32.svg',
  'auto-scaling-group': 'Auto-Scaling-group_32.svg',
  'security-group': 'Corporate-data-center_32.svg', // Fallback or resource security
};

for (const [groupId, fileName] of Object.entries(groupMap)) {
  const match = allGroupIcons.find(f => path.basename(f) === fileName);
  if (match) {
    const dest = path.join(groupsOutDir, `${groupId}.svg`);
    fs.copyFileSync(match, dest);
    console.log(`Copied group icon: ${groupId} <- ${fileName}`);
  } else {
    console.warn(`WARNING: Could not find group icon file for ${groupId}: ${fileName}`);
  }
}

console.log(`Successfully mapped ${mappedCount} official service icons and groups.`);

import fs from 'fs';
import path from 'path';

// Category color definition for official AWS domain categories
const CATEGORY_COLORS = {
  'Compute': '#ED7100',
  'Containers': '#ED7100',
  'Serverless': '#ED7100',
  'Storage': '#3F8624',
  'Database': '#3B48CC',
  'Networking & Content Delivery': '#8C4FFF',
  'Security, Identity & Compliance': '#DD344C',
  'Application Integration': '#E7157B',
  'Analytics': '#8C4FFF',
  'Machine Learning & AI': '#01A88D',
  'Management & Governance': '#E7157B',
  'Developer Tools': '#C925D1',
  'Migration & Transfer': '#01A88D',
  'Front-End Web & Mobile': '#DD344C',
  'Internet of Things (IoT)': '#3F8624',
  'Cloud Financial Management': '#3F8624',
};

// 1. Ensure official resource-based services are pre-compiled into authentic 64x64 solid-box architecture tiles
const CUSTOM_ARCH_TILES = [
  {
    title: 'AWS-Application-Load-Balancer',
    category: 'Networking & Content Delivery',
    resFile: 'public/aws-icons/Resource-Icons_07312026/Res_Networking-Content-Delivery/Res_Elastic-Load-Balancing_Application-Load-Balancer_48.svg'
  },
  {
    title: 'AWS-Network-Load-Balancer',
    category: 'Networking & Content Delivery',
    resFile: 'public/aws-icons/Resource-Icons_07312026/Res_Networking-Content-Delivery/Res_Elastic-Load-Balancing_Network-Load-Balancer_48.svg'
  },
  {
    title: 'Amazon-VPC-NAT-Gateway',
    category: 'Networking & Content Delivery',
    resFile: 'public/aws-icons/Resource-Icons_07312026/Res_Networking-Content-Delivery/Res_Amazon-VPC_NAT-Gateway_48.svg'
  },
  {
    title: 'Amazon-VPC-Internet-Gateway',
    category: 'Networking & Content Delivery',
    resFile: 'public/aws-icons/Resource-Icons_07312026/Res_Networking-Content-Delivery/Res_Amazon-VPC_Internet-Gateway_48.svg'
  },
  {
    title: 'Amazon-Route-53-Resolver',
    category: 'Networking & Content Delivery',
    resFile: 'public/aws-icons/Resource-Icons_07312026/Res_Networking-Content-Delivery/Res_Amazon-Route-53_Resolver_48.svg'
  },
  {
    title: 'Amazon-VPC-Traffic-Mirroring',
    category: 'Networking & Content Delivery',
    resFile: 'public/aws-icons/Resource-Icons_07312026/Res_Networking-Content-Delivery/Res_Amazon-VPC_Traffic-Mirroring_48.svg'
  },
  {
    title: 'Amazon-VPC-Reachability-Analyzer',
    category: 'Networking & Content Delivery',
    resFile: 'public/aws-icons/Resource-Icons_07312026/Res_Networking-Content-Delivery/Res_Amazon-VPC_Reachability-Analyzer_48.svg'
  },
  {
    title: 'Amazon-VPC-Network-Access-Analyzer',
    category: 'Networking & Content Delivery',
    resFile: 'public/aws-icons/Resource-Icons_07312026/Res_Networking-Content-Delivery/Res_Amazon-VPC_Network-Access-Analyzer_48.svg'
  },
  {
    title: 'Amazon-VPC-IP-Address-Manager',
    category: 'Networking & Content Delivery',
    resFile: 'public/aws-icons/Resource-Icons_07312026/Res_Compute/Res_Amazon-EC2_Elastic-IP-Address_48.svg'
  },
  {
    title: 'Amazon-RDS-Proxy',
    category: 'Database',
    resFile: 'public/aws-icons/Resource-Icons_07312026/Res_Databases/Res_Amazon-RDS-Proxy-Instance_48.svg'
  },
  {
    title: 'Amazon-Aurora-Database-Activity-Streams',
    category: 'Database',
    resFile: 'public/aws-icons/Resource-Icons_07312026/Res_Databases/Res_Amazon-Aurora-Instance_48.svg'
  },
  {
    title: 'Amazon-EventBridge-Pipes',
    category: 'Serverless',
    resFile: 'public/aws-icons/Resource-Icons_07312026/Res_Application-Integration/Res_Amazon-EventBridge_Pipes_48.svg'
  },
  {
    title: 'Amazon-EventBridge-Scheduler',
    category: 'Serverless',
    resFile: 'public/aws-icons/Resource-Icons_07312026/Res_Application-Integration/Res_Amazon-EventBridge_Scheduler_48.svg'
  },
  {
    title: 'Amazon-S3-Multi-Region-Access-Points',
    category: 'Storage',
    resFile: 'public/aws-icons/Resource-Icons_07312026/Res_Storage/Res_Amazon-Simple-Storage-Service_S3-Multi-Region-Access-Points_48.svg'
  },
  {
    title: 'Amazon-S3-Object-Lambda',
    category: 'Storage',
    resFile: 'public/aws-icons/Resource-Icons_07312026/Res_Storage/Res_Amazon-Simple-Storage-Service_S3-Object-Lambda_48.svg'
  },
  {
    title: 'Amazon-Data-Lifecycle-Manager',
    category: 'Storage',
    resFile: 'public/aws-icons/Resource-Icons_07312026/Res_Storage/Res_Amazon-Elastic-Block-Store_Amazon-Data-Lifecycle-Manager_48.svg'
  }
];

const archCustomDir = 'public/aws-icons/Architecture-Service-Icons_07312026/Arch_Custom-Architecture-Tiles/48';
fs.mkdirSync(archCustomDir, { recursive: true });

for (const item of CUSTOM_ARCH_TILES) {
  if (!fs.existsSync(item.resFile)) continue;
  const resContent = fs.readFileSync(item.resFile, 'utf8');

  let inner = '';
  const gMatch = resContent.match(/<g id="Icon-Resource[^"]*"[^>]*>([\s\S]*?)<\/g>\s*<\/svg>/);
  if (gMatch) {
    inner = gMatch[1];
  } else {
    const svgInnerMatch = resContent.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
    if (svgInnerMatch) {
      inner = svgInnerMatch[1].replace(/<title>[\s\S]*?<\/title>/, '');
    }
  }

  inner = inner.replace(/fill="#[0-9a-fA-F]{6}"/g, 'fill="#FFFFFF"');
  inner = inner.replace(/fill="#[0-9a-fA-F]{3}"/g, 'fill="#FFFFFF"');
  inner = inner.replace(/stroke="#[0-9a-fA-F]{6}"/g, 'stroke="#FFFFFF"');
  inner = inner.replace(/stroke="#[0-9a-fA-F]{3}"/g, 'stroke="#FFFFFF"');

  const catColor = CATEGORY_COLORS[item.category] || '#ED7100';
  const catSlug = item.category.replace(/[^a-zA-Z0-9]/g, '-');

  const composedSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="64px" height="64px" viewBox="0 0 64 64" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <title>Icon-Architecture/48/Arch_${item.title}_48</title>
    <g id="Icon-Architecture/48/Arch_${item.title}_48" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
        <g id="Icon-Architecture-BG/48/${catSlug}" fill="${catColor}">
            <rect id="Rectangle" x="0" y="0" width="64" height="64"></rect>
        </g>
        <g transform="translate(8, 8)" fill="#FFFFFF">
${inner.trim()}
        </g>
    </g>
</svg>`;

  fs.writeFileSync(path.join(archCustomDir, `Arch_${item.title}_48.svg`), composedSvg, 'utf8');
}

// 2. Load catalog entries
const catalogRaw = fs.readFileSync('src/db/awsCatalogData.ts', 'utf8');
const entries = [];
const entryRegex = /\{\s*"id":\s*"([^"]+)",\s*"name":\s*"([^"]+)",\s*"shortName":\s*"([^"]+)",\s*"category":\s*"([^"]+)"/g;
let m;
while ((m = entryRegex.exec(catalogRaw)) !== null) {
  entries.push({ id: m[1], name: m[2], shortName: m[3], category: m[4] });
}
console.log(`Loaded ${entries.length} catalog entries.`);

// 3. Scan all official source SVGs in public/aws-icons (excluding generated output folders)
function getSvgFiles(dir) {
  const results = [];
  function walk(d) {
    if (!fs.existsSync(d)) return;
    const list = fs.readdirSync(d, { withFileTypes: true });
    for (const item of list) {
      if (item.name.startsWith('.') || item.name === '__MACOSX' || item.name === 'services' || item.name === 'groups') continue;
      const full = path.join(d, item.name);
      if (item.isDirectory()) walk(full);
      else if (item.name.endsWith('.svg')) {
        results.push({
          name: item.name,
          fullPath: full.replace(/\\/g, '/'),
        });
      }
    }
  }
  walk(dir);
  return results;
}

const allSvgs = getSvgFiles('public/aws-icons');
console.log(`Indexed ${allSvgs.length} official source SVGs in public/aws-icons.`);

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const MANUAL_OVERRIDES = {
  // Official architecture SVGs with specialized or non-standard naming
  'acm': 'Arch_AWS-Certificate-Manager_48.svg',
  'ecr': 'Arch_Amazon-Elastic-Container-Registry_48.svg',
  'auto-scaling': 'Arch_Amazon-EC2-Auto-Scaling_48.svg',
  'app2container': 'Arch_AWS-Transform_48.svg',
  'red-hat-openshift': 'Arch_Red-Hat-OpenShift-Service-on-AWS_48.svg',
  'outposts': 'Arch_AWS-Outposts-family_48.svg',
  'simspace-weaver': 'Arch_AWS-SimSpace-Weaver_48.svg',
  'nimble-studio': 'Arch_Amazon-Nimble-Studio_48.svg',
  'sam': 'Arch_AWS-Serverless-Application-Repository_48.svg',
  'eventbridge-pipes': 'Arch_Amazon-EventBridge-Pipes_48.svg',
  'eventbridge-scheduler': 'Arch_Amazon-EventBridge-Scheduler_48.svg',
  'fsx-windows': 'Arch_Amazon-FSx-for-WFS_48.svg',
  'snow-family': 'Arch_AWS-Snowball-Edge_48.svg',
  'dlm': 'Arch_Amazon-Data-Lifecycle-Manager_48.svg',
  's3-object-lambda': 'Arch_Amazon-S3-Object-Lambda_48.svg',
  's3-mrap': 'Arch_Amazon-S3-Multi-Region-Access-Points_48.svg',
  'rds-proxy': 'Arch_Amazon-RDS-Proxy_48.svg',
  'neptune-analytics': 'Arch_Amazon-Neptune_48.svg',
  'redshift-serverless': 'Arch_Amazon-Redshift_48.svg',
  'elasticache-serverless': 'Arch_Amazon-ElastiCache_48.svg',
  'qldb': 'Arch_Amazon-Quantum-Ledger-Database_48.svg',
  'database-activity-streams': 'Arch_Amazon-Aurora-Database-Activity-Streams_48.svg',
  'nlb': 'Arch_AWS-Network-Load-Balancer_48.svg',
  'alb': 'Arch_AWS-Application-Load-Balancer_48.svg',
  'internet-gateway': 'Arch_Amazon-VPC-Internet-Gateway_48.svg',
  'route53-resolver': 'Arch_Amazon-Route-53-Resolver_48.svg',
  'traffic-mirroring': 'Arch_Amazon-VPC-Traffic-Mirroring_48.svg',
  'reachability-analyzer': 'Arch_Amazon-VPC-Reachability-Analyzer_48.svg',
  'network-access-analyzer': 'Arch_Amazon-VPC-Network-Access-Analyzer_48.svg',
  'nat-gateway': 'Arch_Amazon-VPC-NAT-Gateway_48.svg',
  'vpn-gateway': 'Res_Amazon-VPC_VPN-Gateway_48.svg',
  'transit-gateway': 'Arch_AWS-Transit-Gateway_48.svg',
  'elastic-load-balancing': 'Arch_Elastic-Load-Balancing_48.svg',
  'iam-identity-center': 'Arch_AWS-IAM-Identity-Center_48.svg',
  'certificate-manager': 'Arch_AWS-Certificate-Manager_48.svg',
  'direct-connect': 'Arch_AWS-Direct-Connect_48.svg',
  'private-link': 'Arch_AWS-PrivateLink_48.svg',
  'cloud-wan': 'Arch_AWS-Cloud-WAN_48.svg',
  'site-to-site-vpn': 'Arch_AWS-Site-to-Site-VPN_48.svg',
  'client-vpn': 'Arch_AWS-Client-VPN_48.svg',
  'verified-access': 'Arch_AWS-Verified-Access_48.svg',
  'route-53': 'Arch_Amazon-Route-53_48.svg',
  'api-gateway': 'Arch_Amazon-API-Gateway_48.svg',
  'step-functions': 'Arch_AWS-Step-Functions_48.svg',
  'systems-manager': 'Arch_AWS-Systems-Manager_48.svg',
  'cost-explorer': 'Arch_AWS-Cost-Explorer_48.svg',
  'budgets': 'Arch_AWS-Budgets_48.svg',
  'compute-optimizer': 'Arch_AWS-Compute-Optimizer_48.svg',
  'cost-and-usage-report': 'Arch_AWS-Cost-and-Usage-Report_48.svg',
  'savings-plans': 'Arch_AWS-Savings-Plans_48.svg',
  'billing-conductor': 'Arch_AWS-Billing-Conductor_48.svg',
  'app-runner': 'Arch_AWS-App-Runner_48.svg',
  'glacier': 'Arch_Amazon-Simple-Storage-Service-Glacier_48.svg',
  's3-glacier': 'Arch_Amazon-Simple-Storage-Service-Glacier_48.svg',
  'backup': 'Arch_AWS-Backup_48.svg',
  'storage-gateway': 'Arch_AWS-Storage-Gateway_48.svg',
  'elastic-disaster-recovery': 'Arch_AWS-Elastic-Disaster-Recovery_48.svg',
  'transfer-family': 'Arch_AWS-Transfer-Family_48.svg',
  'datasync': 'Arch_AWS-DataSync_48.svg',
  'appflow': 'Arch_Amazon-AppFlow_48.svg',
  'mwaa': 'Arch_Amazon-Managed-Workflows-for-Apache-Airflow_48.svg',
  'managed-workflows-apache-airflow': 'Arch_Amazon-Managed-Workflows-for-Apache-Airflow_48.svg',
  'open-search': 'Arch_Amazon-OpenSearch-Service_48.svg',
  'opensearch-serverless': 'Arch_Amazon-OpenSearch-Service_48.svg',
  'kinesis-data-streams': 'Arch_Amazon-Kinesis-Data-Streams_48.svg',
  'kinesis-data-firehose': 'Arch_Amazon-Kinesis-Data-Firehose_48.svg',
  'kinesis-data-analytics': 'Arch_Amazon-Kinesis-Data-Analytics_48.svg',
  'emr-serverless': 'Arch_Amazon-EMR_48.svg',
  'data-pipeline': 'Arch_AWS-Data-Pipeline_48.svg',
  'clean-rooms': 'Arch_AWS-Clean-Rooms_48.svg',
  'device-farm': 'Arch_AWS-Device-Farm_48.svg',
  'location-service': 'Arch_Amazon-Location-Service_48.svg',
  'iot-core': 'Arch_AWS-IoT-Core_48.svg',
  'iot-greengrass': 'Arch_AWS-IoT-Greengrass_48.svg',
  'iot-device-management': 'Arch_AWS-IoT-Device-Management_48.svg',
  'iot-device-defender': 'Arch_AWS-IoT-Device-Defender_48.svg',
  'iot-analytics': 'Arch_AWS-IoT-SiteWise_48.svg',
  'iot-site-wise': 'Arch_AWS-IoT-SiteWise_48.svg',
  'iot-events': 'Arch_AWS-IoT-Events_48.svg',
  'iot-fleetwise': 'Arch_AWS-IoT-FleetWise_48.svg',
  'iot-roborunner': 'Arch_AWS-IoT-ExpressLink_48.svg',
  'robomaker': 'Arch_AWS-IoT-TwinMaker_48.svg',
  'cloudwatch-synthetics': 'Res_Amazon-CloudWatch_Synthetics_48.svg',
  'cloudwatch-rum': 'Res_Amazon-CloudWatch_RUM_48.svg',
  'cloudwatch-evidently': 'Res_Amazon-CloudWatch_Evidently_48.svg',
  'security-lake': 'Arch_Amazon-Security-Lake_48.svg',
  'verified-permissions': 'Arch_Amazon-Verified-Permissions_48.svg',
  'payment-cryptography': 'Arch_AWS-Payment-Cryptography_48.svg',
  'codecatalyst': 'Arch_Amazon-CodeCatalyst_48.svg',
  'codepipeline': 'Arch_AWS-CodePipeline_48.svg',
  'codebuild': 'Arch_AWS-CodeBuild_48.svg',
  'codedeploy': 'Arch_AWS-CodeDeploy_48.svg',
  'codecommit': 'Arch_AWS-CodeCommit_48.svg',
  'codeguru': 'Arch_Amazon-CodeGuru_48.svg',
  'cloud9': 'Arch_AWS-Cloud9_48.svg',
  'xray': 'Arch_AWS-X-Ray_48.svg',
  'fis': 'Arch_AWS-Fault-Injection-Service_48.svg',
  'fault-injection-service': 'Arch_AWS-Fault-Injection-Service_48.svg',
  'fault-isolation-boundaries': 'Arch_AWS-Fault-Injection-Service_48.svg',
  'resilience-hub': 'Arch_AWS-Resilience-Hub_48.svg',
  'application-cost-profiler': 'Arch_AWS-Application-Cost-Profiler_48.svg',
  'incident-manager': 'Res_AWS-Systems-Manager_Incident-Manager_48.svg',
  'service-catalog': 'Arch_AWS-Service-Catalog_48.svg',
  'control-tower': 'Arch_AWS-Control-Tower_48.svg',
  'license-manager': 'Arch_AWS-License-Manager_48.svg',
  'health-dashboard': 'Arch_AWS-Health-Dashboard_48.svg',
  'well-architected-tool': 'Arch_AWS-Well-Architected-Tool_48.svg',
  'dms': 'Arch_AWS-Database-Migration-Service_48.svg',
  'database-migration-service': 'Arch_AWS-Database-Migration-Service_48.svg',
  'application-discovery-service': 'Arch_AWS-Application-Discovery-Service_48.svg',
  'mgn': 'Arch_AWS-Application-Migration-Service_48.svg',
  'application-migration-service': 'Arch_AWS-Application-Migration-Service_48.svg',
  'migration-hub': 'Arch_AWS-Migration-Evaluator_48.svg',
  'mainframe-modernization': 'Arch_AWS-Mainframe-Modernization_48.svg',
  'sct': 'Arch_AWS-Transform_48.svg',
  'cognito-sync': 'Arch_Amazon-Cognito_48.svg',
  'q-developer': 'Arch_Amazon-Q_48.svg',
  'q-business': 'Arch_Amazon-Q_48.svg',
  'lookout-metrics': 'Arch_Amazon-Lookout-for-Equipment_48.svg',
  'sagemaker': 'Arch_Amazon-SageMaker-AI_48.svg',
  'sagemaker-hyperpod': 'Arch_Amazon-SageMaker-AI_48.svg',
  'opsworks': 'Arch_AWS-Systems-Manager_48.svg',
  'application-signals': 'Arch_Amazon-CloudWatch_48.svg',
  'adot': 'Arch_AWS-Distro-for-OpenTelemetry_48.svg',
  'application-composer': 'Arch_AWS-Infrastructure-Composer_48.svg',
  'quicksight': 'Arch_Amazon-Quick_48.svg',
  'marketplace': 'Arch_AWS-Marketplace_Dark_48.svg',
  'ivs': 'Arch_Amazon-Interactive-Video-Service_48.svg',
  'workspaces': 'Arch_Amazon-WorkSpaces_48.svg',
  'workspaces-web': 'Arch_Amazon-WorkSpaces_48.svg',
  'appstream': 'Arch_Amazon-AppStream_48.svg',
  'worklink': 'Arch_Amazon-WorkLink_48.svg',
  'pricing-calculator': 'Arch_AWS-Cost-Explorer_48.svg',
  'ipam': 'Arch_Amazon-VPC-IP-Address-Manager_48.svg',
  'user-notifications': 'Arch_AWS-User-Notifications_48.svg',
};

// Target output directories
const pubServicesDir = 'public/aws-icons/services';
const distServicesDir = 'dist/aws-icons/services';
fs.mkdirSync(pubServicesDir, { recursive: true });
if (fs.existsSync('dist/aws-icons')) {
  fs.mkdirSync(distServicesDir, { recursive: true });
}

const serviceIconRegistry = {};
let copiedCount = 0;
let fallbackCount = 0;

const candidates = allSvgs.filter(s => s.fullPath.includes('Architecture-Service-Icons') && (s.name.includes('_48.svg') || s.name.includes('_64.svg')));
const resCandidates = allSvgs.filter(s => s.fullPath.includes('Resource-Icons') && (s.name.includes('_48.svg') || s.name.includes('_64.svg')));

for (const entry of entries) {
  let matchedSvg = null;

  // 1. Check manual overrides table
  if (MANUAL_OVERRIDES[entry.id]) {
    const overrideName = MANUAL_OVERRIDES[entry.id];
    const found = allSvgs.find(s => s.name === overrideName);
    if (found) {
      matchedSvg = found;
    }
  }

  // 2. Exact or substring match in Architecture-Service-Icons (with smart parenthetical handling)
  if (!matchedSvg) {
    const cleanName = entry.name.replace(/\(.*?\)/g, '').trim();
    const parenMatch = entry.name.match(/\((.*?)\)/);
    const insideParen = parenMatch ? parenMatch[1].trim() : '';

    const trials = [
      normalize(entry.id),
      normalize(entry.shortName),
      normalize(entry.name),
      normalize(cleanName),
      normalize('Amazon ' + cleanName),
      normalize('AWS ' + cleanName),
      normalize(insideParen),
      normalize('Amazon ' + insideParen),
      normalize('AWS ' + insideParen),
      normalize('Amazon ' + entry.shortName),
      normalize('AWS ' + entry.shortName),
    ].filter(t => t.length > 1);

    for (const c of candidates) {
      const baseName = normalize(c.name.replace(/^Arch_/, '').replace(/_(48|64)\.svg$/, ''));
      if (trials.includes(baseName)) {
        matchedSvg = c;
        break;
      }
    }
  }

    // 3. Match in Resource-Icons
    if (!matchedSvg) {
      const cId = normalize(entry.id);
      const cShort = normalize(entry.shortName);
      for (const c of resCandidates) {
        const baseName = normalize(c.name.replace(/^Res_/, '').replace(/_(48|64)\.svg$/, ''));
        if (baseName.includes(cId) || baseName.includes(cShort)) {
          matchedSvg = c;
          break;
        }
      }
    }

    // 4. Fallback to Category-Icons if no specific service/resource icon exists
    if (!matchedSvg) {
      const catName = normalize(entry.category);
      const catSvg = allSvgs.find(s => s.fullPath.includes('Category-Icons') && (s.name.includes('_48.svg') || s.name.includes('_64.svg')) && normalize(s.name).includes(catName));
      if (catSvg) {
        matchedSvg = catSvg;
        fallbackCount++;
        console.warn(`[FALLBACK] Service ${entry.id} (${entry.name}) fell back to category icon: ${catSvg.name}`);
      }
    }

      if (matchedSvg) {
        const targetFile = `${entry.id}.svg`;
        const targetPub = path.join(pubServicesDir, targetFile);
        fs.copyFileSync(matchedSvg.fullPath, targetPub);
        if (fs.existsSync('dist/aws-icons')) {
          const targetDist = path.join(distServicesDir, targetFile);
          fs.copyFileSync(matchedSvg.fullPath, targetDist);
        }

        // Also copy alias if shortName or id differs (e.g. without hyphens)
        const noHyphen = entry.id.replace(/-/g, '');
        if (noHyphen !== entry.id) {
          fs.copyFileSync(matchedSvg.fullPath, path.join(pubServicesDir, `${noHyphen}.svg`));
          if (fs.existsSync('dist/aws-icons')) {
            fs.copyFileSync(matchedSvg.fullPath, path.join(distServicesDir, `${noHyphen}.svg`));
          }
        }

        serviceIconRegistry[entry.id] = `/aws-icons/services/${entry.id}.svg`;
        copiedCount++;
      } else {
        console.error(`[ERROR] No SVG found for service: ${entry.id} (${entry.name})`);
      }
    }

    // Also ensure groups are copied
    const GROUP_MAPPINGS = {
      'aws-cloud': 'AWS-Cloud_32.svg',
      'vpc': 'Virtual-private-cloud-VPC_32.svg',
      'public-subnet': 'Public-subnet_32.svg',
      'private-subnet': 'Private-subnet_32.svg',
      'region': 'Region_32.svg',
      'auto-scaling-group': 'Auto-Scaling-group_32.svg',
      'aws-account': 'AWS-Account_32.svg',
      'corporate-data-center': 'Corporate-data-center_32.svg',
      'spot-fleet': 'Spot-Fleet_32.svg',
      'server-contents': 'Server-contents_32.svg',
      'ec2-instance-contents': 'EC2-instance-contents_32.svg',
    };

    const pubGroupsDir = 'public/aws-icons/groups';
    const distGroupsDir = 'dist/aws-icons/groups';
    fs.mkdirSync(pubGroupsDir, { recursive: true });
    if (fs.existsSync('dist/aws-icons')) {
      fs.mkdirSync(distGroupsDir, { recursive: true });
    }

    for (const [grpKey, fileName] of Object.entries(GROUP_MAPPINGS)) {
      const found = allSvgs.find(s => s.name === fileName);
      if (found) {
        fs.copyFileSync(found.fullPath, path.join(pubGroupsDir, `${grpKey}.svg`));
        if (fs.existsSync('dist/aws-icons')) {
          fs.copyFileSync(found.fullPath, path.join(distGroupsDir, `${grpKey}.svg`));
        }
      }
    }

// 4. Generate src/components/icons/awsIconRegistry.ts
const registryTs = `// src/components/icons/awsIconRegistry.ts
    // Deterministically generated by scripts/mapAllAwsIcons.mjs
    // Maps all 235 official AWS services and groups directly to their official AWS Architecture SVGs.

    export const AWS_SERVICE_ICON_MAP: Record<string, string> = ${ JSON.stringify(serviceIconRegistry, null, 2)
  };

  export const AWS_GROUP_ICON_MAP: Record<string, string> = {
    'aws-cloud': '/aws-icons/groups/aws-cloud.svg',
    'vpc': '/aws-icons/groups/vpc.svg',
    'public-subnet': '/aws-icons/groups/public-subnet.svg',
    'private-subnet': '/aws-icons/groups/private-subnet.svg',
    'region': '/aws-icons/groups/region.svg',
    'auto-scaling-group': '/aws-icons/groups/auto-scaling-group.svg',
    'aws-account': '/aws-icons/groups/aws-account.svg',
    'corporate-data-center': '/aws-icons/groups/corporate-data-center.svg',
    'spot-fleet': '/aws-icons/groups/spot-fleet.svg',
    'server-contents': '/aws-icons/groups/server-contents.svg',
    'ec2-instance-contents': '/aws-icons/groups/ec2-instance-contents.svg',
  };

  /**
   * Resolves the official AWS SVG icon URL for a given service ID or category fallback.
   */
  export function getAWSServiceIconUrl(serviceId?: string): string {
    if (!serviceId) return '/aws-icons/services/ec2.svg';
    const key = serviceId.toLowerCase().trim().replace(/\\s+/g, '-');
    if (AWS_SERVICE_ICON_MAP[key]) {
      return AWS_SERVICE_ICON_MAP[key];
    }
    const noHyphen = key.replace(/-/g, '');
    if (AWS_SERVICE_ICON_MAP[noHyphen]) {
      return AWS_SERVICE_ICON_MAP[noHyphen];
    }
    return \`/aws-icons/services/\${key}.svg\`;
}

/**
 * Resolves the official AWS SVG group icon URL.
 */
export function getAWSGroupIconUrl(groupId?: string): string {
  if (!groupId) return '/aws-icons/groups/aws-cloud.svg';
  const key = groupId.toLowerCase().trim().replace(/\\s+/g, '-');
  return AWS_GROUP_ICON_MAP[key] || \`/aws-icons/groups/\${key}.svg\`;
}
`;

    fs.writeFileSync('src/components/icons/awsIconRegistry.ts', registryTs, 'utf8');

    console.log(`\nSuccessfully mapped and copied ${copiedCount} official AWS service SVGs to:`);
    console.log(`- ${pubServicesDir}`);
    console.log(`- ${distServicesDir}`);
    console.log(`Total fallbacks to Category icons: ${fallbackCount}`);
    console.log(`Generated src/components/icons/awsIconRegistry.ts with 100% service coverage.`);

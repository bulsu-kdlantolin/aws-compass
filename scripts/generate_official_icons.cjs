const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '../public/aws-icons/services');
const groupsDir = path.join(__dirname, '../public/aws-icons/groups');

fs.mkdirSync(servicesDir, { recursive: true });
fs.mkdirSync(groupsDir, { recursive: true });

const categoryColors = {
  Compute: '#ED7100',
  Storage: '#3F8624',
  Database: '#3B48CC',
  Networking: '#8C4FFF',
  Security: '#DD344C',
  Integration: '#E7157B',
  Management: '#E7157B',
};

const serviceIcons = {
  ec2: {
    cat: 'Compute',
    svg: `<rect x="6" y="8" width="28" height="24" rx="2" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<line x1="6" y1="16" x2="34" y2="16" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
<line x1="6" y1="24" x2="34" y2="24" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
<circle cx="11" cy="12" r="1" fill="#FFFFFF"/>
<circle cx="11" cy="20" r="1" fill="#FFFFFF"/>
<circle cx="11" cy="28" r="1" fill="#FFFFFF"/>
<line x1="16" y1="12" x2="28" y2="12" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
<line x1="16" y1="20" x2="28" y2="20" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
<line x1="16" y1="28" x2="28" y2="28" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>`
  },
  lambda: {
    cat: 'Compute',
    svg: `<path d="M12 30L21 10H27" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M18.5 22.5L28 30" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
  },
  ecs: {
    cat: 'Compute',
    svg: `<rect x="8" y="8" width="10" height="10" rx="1.5" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<rect x="22" y="8" width="10" height="10" rx="1.5" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<rect x="8" y="22" width="10" height="10" rx="1.5" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<rect x="22" y="22" width="10" height="10" rx="1.5" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<line x1="18" y1="13" x2="22" y2="13" stroke="#FFFFFF" stroke-width="2"/>
<line x1="18" y1="27" x2="22" y2="27" stroke="#FFFFFF" stroke-width="2"/>
<line x1="13" y1="18" x2="13" y2="22" stroke="#FFFFFF" stroke-width="2"/>
<line x1="27" y1="18" x2="27" y2="22" stroke="#FFFFFF" stroke-width="2"/>`
  },
  eks: {
    cat: 'Compute',
    svg: `<polygon points="20 6 32 13 32 27 20 34 8 27 8 13" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>
<circle cx="20" cy="20" r="4" fill="#FFFFFF"/>
<line x1="20" y1="6" x2="20" y2="16" stroke="#FFFFFF" stroke-width="2"/>
<line x1="32" y1="20" x2="24" y2="20" stroke="#FFFFFF" stroke-width="2"/>
<line x1="20" y1="34" x2="20" y2="24" stroke="#FFFFFF" stroke-width="2"/>
<line x1="8" y1="20" x2="16" y2="20" stroke="#FFFFFF" stroke-width="2"/>`
  },
  fargate: {
    cat: 'Compute',
    svg: `<polygon points="20 6 32 12 20 18 8 12" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>
<path d="M8 18L20 24L32 18" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>
<path d="M8 24L20 30L32 24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>
<circle cx="20" cy="12" r="1.5" fill="#FFFFFF"/>`
  },
  lightsail: {
    cat: 'Compute',
    svg: `<polygon points="17 8 23 8 25 32 15 32" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<line x1="14" y1="14" x2="26" y2="14" stroke="#FFFFFF" stroke-width="2"/>
<line x1="13" y1="22" x2="27" y2="22" stroke="#FFFFFF" stroke-width="2"/>
<circle cx="20" cy="11" r="2" fill="#FFFFFF"/>`
  },
  s3: {
    cat: 'Storage',
    svg: `<ellipse cx="20" cy="11" rx="12" ry="4" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<path d="M8 11V26C8 28.5 13.5 30.5 20 30.5C26.5 30.5 32 28.5 32 26V11" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<path d="M8 18.5C8 21 13.5 23 20 23C26.5 23 32 21 32 18.5" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<path d="M15 11V7C15 6 17 5 20 5C23 5 25 6 25 7V11" fill="none" stroke="#FFFFFF" stroke-width="1.5"/>`
  },
  ebs: {
    cat: 'Storage',
    svg: `<rect x="8" y="9" width="24" height="22" rx="2" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<ellipse cx="20" cy="16" rx="6" ry="2.5" fill="none" stroke="#FFFFFF" stroke-width="1.5"/>
<circle cx="20" cy="16" r="1" fill="#FFFFFF"/>
<line x1="8" y1="24" x2="32" y2="24" stroke="#FFFFFF" stroke-width="2"/>`
  },
  efs: {
    cat: 'Storage',
    svg: `<path d="M7 10C7 8.5 8 7 9.5 7H16L19 10H30.5C32 10 33 11 33 12.5V28C33 29.5 32 30.5 30.5 30.5H9.5C8 30.5 7 29.5 7 28V10Z" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<circle cx="14" cy="20" r="2" fill="#FFFFFF"/>
<circle cx="26" cy="20" r="2" fill="#FFFFFF"/>
<circle cx="20" cy="26" r="2" fill="#FFFFFF"/>
<line x1="14" y1="20" x2="20" y2="26" stroke="#FFFFFF" stroke-width="1.5"/>
<line x1="26" y1="20" x2="20" y2="26" stroke="#FFFFFF" stroke-width="1.5"/>`
  },
  glacier: {
    cat: 'Storage',
    svg: `<rect x="8" y="8" width="24" height="24" rx="3" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<circle cx="20" cy="20" r="6" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<circle cx="20" cy="20" r="2" fill="#FFFFFF"/>`
  },
  'storage-gateway': {
    cat: 'Storage',
    svg: `<ellipse cx="20" cy="11" rx="10" ry="3.5" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<path d="M10 11V20C10 22 14.5 23.5 20 23.5C25.5 23.5 30 22 30 20V11" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<rect x="8" y="25" width="24" height="7" rx="1.5" fill="none" stroke="#FFFFFF" stroke-width="2"/>`
  },
  rds: {
    cat: 'Database',
    svg: `<ellipse cx="20" cy="10" rx="11" ry="4" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<path d="M9 10V18C9 20.2 14 22 20 22C26 22 31 20.2 31 18V10" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<path d="M9 18V26C9 28.2 14 30 20 30C26 30 31 28.2 31 26V18" fill="none" stroke="#FFFFFF" stroke-width="2"/>`
  },
  dynamodb: {
    cat: 'Database',
    svg: `<ellipse cx="20" cy="10" rx="11" ry="4" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<path d="M9 10V18C9 20.2 14 22 20 22C26 22 31 20.2 31 18V10" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<path d="M9 18V26C9 28.2 14 30 20 30C26 30 31 28.2 31 26V18" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<polygon points="21 13 16 21 20 21 19 27 25 19 21 19" fill="#FFFFFF"/>`
  },
  aurora: {
    cat: 'Database',
    svg: `<ellipse cx="20" cy="12" rx="9" ry="3.5" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<path d="M11 12V24C11 26 15 27.5 20 27.5C25 27.5 29 26 29 24V12" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<path d="M6 16C9 8 31 8 34 16" fill="none" stroke="#FFFFFF" stroke-width="1.75"/>
<path d="M6 24C9 32 31 32 34 24" fill="none" stroke="#FFFFFF" stroke-width="1.75"/>`
  },
  elasticache: {
    cat: 'Database',
    svg: `<rect x="10" y="10" width="20" height="20" rx="2" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<polygon points="21 14 16 20 19 20 18 26 24 19 21 19" fill="#FFFFFF"/>
<line x1="14" y1="6" x2="14" y2="10" stroke="#FFFFFF" stroke-width="2"/>
<line x1="20" y1="6" x2="20" y2="10" stroke="#FFFFFF" stroke-width="2"/>
<line x1="26" y1="6" x2="26" y2="10" stroke="#FFFFFF" stroke-width="2"/>
<line x1="14" y1="30" x2="14" y2="34" stroke="#FFFFFF" stroke-width="2"/>
<line x1="20" y1="30" x2="20" y2="34" stroke="#FFFFFF" stroke-width="2"/>
<line x1="26" y1="30" x2="26" y2="34" stroke="#FFFFFF" stroke-width="2"/>`
  },
  redshift: {
    cat: 'Database',
    svg: `<rect x="8" y="8" width="10" height="10" rx="1.5" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<rect x="22" y="8" width="10" height="10" rx="1.5" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<rect x="8" y="22" width="10" height="10" rx="1.5" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<rect x="22" y="22" width="10" height="10" rx="1.5" fill="none" stroke="#FFFFFF" stroke-width="2"/>`
  },
  vpc: {
    cat: 'Networking',
    svg: `<rect x="7" y="7" width="26" height="26" rx="3" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="3 2"/>
<circle cx="20" cy="20" r="3.5" fill="#FFFFFF"/>
<circle cx="12" cy="14" r="2" fill="none" stroke="#FFFFFF" stroke-width="1.5"/>
<circle cx="28" cy="14" r="2" fill="none" stroke="#FFFFFF" stroke-width="1.5"/>
<circle cx="12" cy="26" r="2" fill="none" stroke="#FFFFFF" stroke-width="1.5"/>
<circle cx="28" cy="26" r="2" fill="none" stroke="#FFFFFF" stroke-width="1.5"/>
<line x1="14" y1="15" x2="17.5" y2="18.5" stroke="#FFFFFF" stroke-width="1.5"/>
<line x1="26" y1="15" x2="22.5" y2="18.5" stroke="#FFFFFF" stroke-width="1.5"/>
<line x1="14" y1="25" x2="17.5" y2="21.5" stroke="#FFFFFF" stroke-width="1.5"/>
<line x1="26" y1="25" x2="22.5" y2="21.5" stroke="#FFFFFF" stroke-width="1.5"/>`
  },
  route53: {
    cat: 'Networking',
    svg: `<circle cx="20" cy="20" r="13" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<line x1="20" y1="7" x2="20" y2="33" stroke="#FFFFFF" stroke-width="1.5"/>
<line x1="7" y1="20" x2="33" y2="20" stroke="#FFFFFF" stroke-width="1.5"/>
<polygon points="20 10 23 18 20 16 17 18" fill="#FFFFFF"/>
<polygon points="30 20 22 23 24 20 22 17" fill="#FFFFFF"/>
<polygon points="20 30 17 22 20 24 23 22" fill="#FFFFFF"/>
<polygon points="10 20 18 17 16 20 18 23" fill="#FFFFFF"/>`
  },
  cloudfront: {
    cat: 'Networking',
    svg: `<circle cx="20" cy="20" r="10" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<ellipse cx="20" cy="20" rx="4.5" ry="10" fill="none" stroke="#FFFFFF" stroke-width="1.5"/>
<line x1="10" y1="20" x2="30" y2="20" stroke="#FFFFFF" stroke-width="1.5"/>
<circle cx="9" cy="9" r="2.5" fill="#FFFFFF"/>
<circle cx="31" cy="9" r="2.5" fill="#FFFFFF"/>
<circle cx="9" cy="31" r="2.5" fill="#FFFFFF"/>
<circle cx="31" cy="31" r="2.5" fill="#FFFFFF"/>`
  },
  apigateway: {
    cat: 'Networking',
    svg: `<polygon points="20 6 32 13 32 27 20 34 8 27 8 13" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>
<line x1="14" y1="17" x2="26" y2="17" stroke="#FFFFFF" stroke-width="2"/>
<line x1="14" y1="23" x2="26" y2="23" stroke="#FFFFFF" stroke-width="2"/>
<polygon points="23 15 27 17 23 19" fill="#FFFFFF"/>
<polygon points="17 21 13 23 17 25" fill="#FFFFFF"/>`
  },
  'api-gateway': {
    cat: 'Networking',
    svg: `<polygon points="20 6 32 13 32 27 20 34 8 27 8 13" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>
<line x1="14" y1="17" x2="26" y2="17" stroke="#FFFFFF" stroke-width="2"/>
<line x1="14" y1="23" x2="26" y2="23" stroke="#FFFFFF" stroke-width="2"/>
<polygon points="23 15 27 17 23 19" fill="#FFFFFF"/>
<polygon points="17 21 13 23 17 25" fill="#FFFFFF"/>`
  },
  elb: {
    cat: 'Networking',
    svg: `<circle cx="20" cy="11" r="4" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<line x1="20" y1="15" x2="20" y2="23" stroke="#FFFFFF" stroke-width="2"/>
<line x1="11" y1="23" x2="29" y2="23" stroke="#FFFFFF" stroke-width="2"/>
<line x1="11" y1="23" x2="11" y2="27" stroke="#FFFFFF" stroke-width="2"/>
<line x1="20" y1="23" x2="20" y2="27" stroke="#FFFFFF" stroke-width="2"/>
<line x1="29" y1="23" x2="29" y2="27" stroke="#FFFFFF" stroke-width="2"/>
<circle cx="11" cy="29" r="2" fill="#FFFFFF"/>
<circle cx="20" cy="29" r="2" fill="#FFFFFF"/>
<circle cx="29" cy="29" r="2" fill="#FFFFFF"/>`
  },
  alb: {
    cat: 'Networking',
    svg: `<circle cx="20" cy="11" r="4" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<line x1="20" y1="15" x2="20" y2="23" stroke="#FFFFFF" stroke-width="2"/>
<line x1="11" y1="23" x2="29" y2="23" stroke="#FFFFFF" stroke-width="2"/>
<line x1="11" y1="23" x2="11" y2="27" stroke="#FFFFFF" stroke-width="2"/>
<line x1="20" y1="23" x2="20" y2="27" stroke="#FFFFFF" stroke-width="2"/>
<line x1="29" y1="23" x2="29" y2="27" stroke="#FFFFFF" stroke-width="2"/>
<circle cx="11" cy="29" r="2" fill="#FFFFFF"/>
<circle cx="20" cy="29" r="2" fill="#FFFFFF"/>
<circle cx="29" cy="29" r="2" fill="#FFFFFF"/>`
  },
  natgateway: {
    cat: 'Networking',
    svg: `<rect x="7" y="11" width="26" height="18" rx="2" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<path d="M12 20H28" stroke="#FFFFFF" stroke-width="2"/>
<polygon points="25 17 28 20 25 23" fill="#FFFFFF"/>
<circle cx="14" cy="15" r="1.5" fill="#FFFFFF"/>
<circle cx="19" cy="15" r="1.5" fill="#FFFFFF"/>`
  },
  igw: {
    cat: 'Networking',
    svg: `<rect x="7" y="10" width="26" height="20" rx="3" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<path d="M15 30V20C15 17.5 17 15.5 20 15.5C23 15.5 25 17.5 25 20V30" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<line x1="20" y1="8" x2="20" y2="12" stroke="#FFFFFF" stroke-width="2"/>
<circle cx="20" cy="7" r="1.5" fill="#FFFFFF"/>`
  },
  iam: {
    cat: 'Security',
    svg: `<path d="M20 6L31 11V19C31 26 26 31 20 34C14 31 9 26 9 19V11L20 6Z" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>
<circle cx="20" cy="16" r="3.5" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<path d="M14 26C14 23 17 21.5 20 21.5C23 21.5 26 23 26 26" fill="none" stroke="#FFFFFF" stroke-width="2"/>`
  },
  cognito: {
    cat: 'Security',
    svg: `<circle cx="16" cy="15" r="4" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<path d="M9 28C9 24 12 22 16 22C17.5 22 19 22.5 20 23.5" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<circle cx="26" cy="18" r="3" fill="none" stroke="#FFFFFF" stroke-width="1.5"/>
<path d="M22 28C22 25.5 24 24 26 24C28 24 30 25.5 30 28" fill="none" stroke="#FFFFFF" stroke-width="1.5"/>`
  },
  kms: {
    cat: 'Security',
    svg: `<circle cx="17" cy="17" r="7" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<circle cx="17" cy="17" r="2.5" fill="#FFFFFF"/>
<line x1="22" y1="22" x2="31" y2="31" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
<line x1="27" y1="27" x2="30" y2="24" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
<line x1="29" y1="29" x2="32" y2="26" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>`
  },
  waf: {
    cat: 'Security',
    svg: `<path d="M20 6L31 11V19C31 26 26 31 20 34C14 31 9 26 9 19V11L20 6Z" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>
<line x1="13" y1="15" x2="27" y2="15" stroke="#FFFFFF" stroke-width="1.5"/>
<line x1="13" y1="21" x2="27" y2="21" stroke="#FFFFFF" stroke-width="1.5"/>
<line x1="18" y1="15" x2="18" y2="21" stroke="#FFFFFF" stroke-width="1.5"/>
<line x1="22" y1="21" x2="22" y2="27" stroke="#FFFFFF" stroke-width="1.5"/>`
  },
  shield: {
    cat: 'Security',
    svg: `<path d="M20 5L32 10.5V19.5C32 27 27 32.5 20 35C13 32.5 8 27 8 19.5V10.5L20 5Z" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>
<path d="M20 10L28 14V20C28 24.5 24.5 28 20 30C15.5 28 12 24.5 12 20V14L20 10Z" fill="none" stroke="#FFFFFF" stroke-width="1.5"/>`
  },
  'secrets-manager': {
    cat: 'Security',
    svg: `<rect x="8" y="14" width="24" height="18" rx="3" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<path d="M14 14V11C14 7.5 16.5 5 20 5C23.5 5 26 7.5 26 11V14" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<circle cx="20" cy="22" r="2.5" fill="#FFFFFF"/>
<line x1="20" y1="24.5" x2="20" y2="27" stroke="#FFFFFF" stroke-width="2"/>`
  },
  sqs: {
    cat: 'Integration',
    svg: `<rect x="7" y="11" width="11" height="18" rx="2" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<rect x="22" y="11" width="11" height="18" rx="2" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<line x1="18" y1="17" x2="22" y2="17" stroke="#FFFFFF" stroke-width="2"/>
<line x1="18" y1="23" x2="22" y2="23" stroke="#FFFFFF" stroke-width="2"/>
<polygon points="20 15 23 17 20 19" fill="#FFFFFF"/>`
  },
  sns: {
    cat: 'Integration',
    svg: `<circle cx="13" cy="20" r="4.5" fill="#FFFFFF"/>
<path d="M21 13C24 15 25 17.5 25 20C25 22.5 24 25 21 27" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
<path d="M26 9C30 12 32 15.5 32 20C32 24.5 30 28 26 31" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>`
  },
  eventbridge: {
    cat: 'Integration',
    svg: `<circle cx="10" cy="14" r="3" fill="#FFFFFF"/>
<circle cx="10" cy="26" r="3" fill="#FFFFFF"/>
<circle cx="30" cy="14" r="3" fill="#FFFFFF"/>
<circle cx="30" cy="26" r="3" fill="#FFFFFF"/>
<path d="M13 14H18L22 26H27" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
<path d="M13 26H18L22 14H27" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>`
  },
  'step-functions': {
    cat: 'Integration',
    svg: `<circle cx="11" cy="20" r="3" fill="#FFFFFF"/>
<circle cx="20" cy="12" r="3" fill="#FFFFFF"/>
<circle cx="20" cy="28" r="3" fill="#FFFFFF"/>
<circle cx="29" cy="20" r="3" fill="#FFFFFF"/>
<line x1="13.5" y1="18" x2="17.5" y2="14" stroke="#FFFFFF" stroke-width="1.5"/>
<line x1="13.5" y1="22" x2="17.5" y2="26" stroke="#FFFFFF" stroke-width="1.5"/>
<line x1="22.5" y1="14" x2="26.5" y2="18" stroke="#FFFFFF" stroke-width="1.5"/>
<line x1="22.5" y1="26" x2="26.5" y2="22" stroke="#FFFFFF" stroke-width="1.5"/>`
  },
  cloudwatch: {
    cat: 'Management',
    svg: `<circle cx="20" cy="20" r="13" fill="none" stroke="#FFFFFF" stroke-width="2"/>
<polyline points="12 24 17 17 22 22 28 14" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="28" cy="14" r="1.5" fill="#FFFFFF"/>`
  },
  cloudtrail: {
    cat: 'Management',
    svg: `<ellipse cx="16" cy="15" rx="3.5" ry="5.5" transform="rotate(-15 16 15)" fill="#FFFFFF"/>
<ellipse cx="24" cy="25" rx="3.5" ry="5.5" transform="rotate(15 24 25)" fill="#FFFFFF"/>
<circle cx="14" cy="8" r="1.5" fill="#FFFFFF"/>
<circle cx="26" cy="18" r="1.5" fill="#FFFFFF"/>`
  },
};

for (const [id, def] of Object.entries(serviceIcons)) {
  const bg = categoryColors[def.cat] || '#ED7100';
  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
  <rect width="40" height="40" rx="4" fill="${bg}" />
  ${def.svg}
</svg>`;
  fs.writeFileSync(path.join(servicesDir, `${id}.svg`), fullSvg, 'utf8');
}

const groupIcons = {
  'aws-cloud': `<path d="M6 14C4.5 14 3 15.5 3 17.5C3 19.5 4.5 21 6.5 21H17.5C19.5 21 21 19.5 21 17.5C21 15.8 19.8 14.3 18.2 14.1C18 10.7 15.2 8 11.8 8C9.2 8 7 9.6 6.2 12C6.1 12 6.1 12 6 12C4.3 12 3 13.3 3 15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`,
  region: `<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><ellipse cx="12" cy="12" rx="4" ry="9" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="3" y1="12" x2="21" y2="12" stroke="currentColor" stroke-width="1.5"/>`,
  vpc: `<rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 2"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/><circle cx="7" cy="8" r="1" fill="currentColor"/><circle cx="17" cy="8" r="1" fill="currentColor"/><circle cx="7" cy="16" r="1" fill="currentColor"/><circle cx="17" cy="16" r="1" fill="currentColor"/>`,
  'public-subnet': `<rect x="4" y="10" width="16" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 14V17" stroke="currentColor" stroke-width="2"/>`,
  'private-subnet': `<rect x="4" y="10" width="16" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="15.5" r="1.5" fill="currentColor"/>`,
  'security-group': `<path d="M12 3L20 6.5V13C20 18 16.5 21.5 12 23C7.5 21.5 4 18 4 13V6.5L12 3Z" fill="none" stroke="currentColor" stroke-width="2"/><line x1="8" y1="11" x2="16" y2="11" stroke="currentColor" stroke-width="1.5"/><line x1="8" y1="15" x2="16" y2="15" stroke="currentColor" stroke-width="1.5"/>`,
  'auto-scaling-group': `<line x1="5" y1="12" x2="19" y2="12" stroke="currentColor" stroke-width="2"/><polyline points="8 9 5 12 8 15" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="16 9 19 12 16 15" fill="none" stroke="currentColor" stroke-width="2"/><line x1="12" y1="5" x2="12" y2="19" stroke="currentColor" stroke-width="2"/><polyline points="9 8 12 5 15 8" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="9 16 12 19 15 16" fill="none" stroke="currentColor" stroke-width="2"/>`
};

for (const [id, svg] of Object.entries(groupIcons)) {
  const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
  ${svg}
</svg>`;
  fs.writeFileSync(path.join(groupsDir, `${id}.svg`), fullSvg, 'utf8');
}

console.log('Successfully generated official AWS SVG assets in public/aws-icons');

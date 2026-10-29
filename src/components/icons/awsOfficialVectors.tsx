import React from 'react';

export interface AWSIconVectorDef {
  category: string;
  tileBg: {
    dark: string;
    light: string;
  };
  paths: React.ReactNode;
}

export const OFFICIAL_CATEGORY_COLORS = {
  Compute: { dark: '#ED7100', light: '#ED7100' },
  Storage: { dark: '#3F8624', light: '#3F8624' },
  Database: { dark: '#3B48CC', light: '#3B48CC' },
  'Networking & Content Delivery': { dark: '#8C4FFF', light: '#8C4FFF' },
  Networking: { dark: '#8C4FFF', light: '#8C4FFF' },
  'Security, Identity & Compliance': { dark: '#DD344C', light: '#DD344C' },
  'Security/IAM': { dark: '#DD344C', light: '#DD344C' },
  Security: { dark: '#DD344C', light: '#DD344C' },
  'Application Integration': { dark: '#E7157B', light: '#E7157B' },
  Serverless: { dark: '#E7157B', light: '#E7157B' },
  Integration: { dark: '#E7157B', light: '#E7157B' },
  'Management & Governance': { dark: '#E7157B', light: '#E7157B' },
  Management: { dark: '#E7157B', light: '#E7157B' },
} as const;

export const AWS_SERVICE_VECTORS: Record<string, AWSIconVectorDef> = {
  // COMPUTE (#ED7100)
  ec2: {
    category: 'Compute',
    tileBg: OFFICIAL_CATEGORY_COLORS.Compute,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="8" width="28" height="24" rx="2" />
        <line x1="6" y1="16" x2="34" y2="16" />
        <line x1="6" y1="24" x2="34" y2="24" />
        <circle cx="11" cy="12" r="1" fill="#FFFFFF" />
        <circle cx="11" cy="20" r="1" fill="#FFFFFF" />
        <circle cx="11" cy="28" r="1" fill="#FFFFFF" />
        <line x1="16" y1="12" x2="28" y2="12" />
        <line x1="16" y1="20" x2="28" y2="20" />
        <line x1="16" y1="28" x2="28" y2="28" />
      </g>
    ),
  },

  lambda: {
    category: 'Compute',
    tileBg: OFFICIAL_CATEGORY_COLORS.Compute,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 30L21 10H27" />
        <path d="M18.5 22.5L28 30" />
      </g>
    ),
  },

  ecs: {
    category: 'Compute',
    tileBg: OFFICIAL_CATEGORY_COLORS.Compute,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="8" width="10" height="10" rx="1.5" />
        <rect x="22" y="8" width="10" height="10" rx="1.5" />
        <rect x="8" y="22" width="10" height="10" rx="1.5" />
        <rect x="22" y="22" width="10" height="10" rx="1.5" />
        <line x1="18" y1="13" x2="22" y2="13" />
        <line x1="18" y1="27" x2="22" y2="27" />
        <line x1="13" y1="18" x2="13" y2="22" />
        <line x1="27" y1="18" x2="27" y2="22" />
      </g>
    ),
  },

  eks: {
    category: 'Compute',
    tileBg: OFFICIAL_CATEGORY_COLORS.Compute,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="20 6 32 13 32 27 20 34 8 27 8 13" />
        <circle cx="20" cy="20" r="4" fill="#FFFFFF" />
        <line x1="20" y1="6" x2="20" y2="16" />
        <line x1="32" y1="20" x2="24" y2="20" />
        <line x1="20" y1="34" x2="20" y2="24" />
        <line x1="8" y1="20" x2="16" y2="20" />
      </g>
    ),
  },

  fargate: {
    category: 'Compute',
    tileBg: OFFICIAL_CATEGORY_COLORS.Compute,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="20 6 32 12 20 18 8 12" />
        <path d="M8 18L20 24L32 18" />
        <path d="M8 24L20 30L32 24" />
        <circle cx="20" cy="12" r="1.5" fill="#FFFFFF" />
      </g>
    ),
  },

  lightsail: {
    category: 'Compute',
    tileBg: OFFICIAL_CATEGORY_COLORS.Compute,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="17 8 23 8 25 32 15 32" />
        <line x1="14" y1="14" x2="26" y2="14" />
        <line x1="13" y1="22" x2="27" y2="22" />
        <circle cx="20" cy="11" r="2" fill="#FFFFFF" />
        <line x1="27" y1="9" x2="33" y2="6" strokeWidth="1.5" />
        <line x1="13" y1="9" x2="7" y2="6" strokeWidth="1.5" />
      </g>
    ),
  },

  // STORAGE (#3F8624)
  s3: {
    category: 'Storage',
    tileBg: OFFICIAL_CATEGORY_COLORS.Storage,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="20" cy="11" rx="12" ry="4" />
        <path d="M8 11V26C8 28.5 13.5 30.5 20 30.5C26.5 30.5 32 28.5 32 26V11" />
        <path d="M8 18.5C8 21 13.5 23 20 23C26.5 23 32 21 32 18.5" />
        <path d="M15 11V7C15 6 17 5 20 5C23 5 25 6 25 7V11" strokeWidth="1.5" />
      </g>
    ),
  },

  ebs: {
    category: 'Storage',
    tileBg: OFFICIAL_CATEGORY_COLORS.Storage,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="9" width="24" height="22" rx="2" />
        <ellipse cx="20" cy="16" rx="6" ry="2.5" />
        <circle cx="20" cy="16" r="1" fill="#FFFFFF" />
        <line x1="8" y1="24" x2="32" y2="24" />
        <circle cx="14" cy="27.5" r="1" fill="#FFFFFF" />
        <circle cx="18" cy="27.5" r="1" fill="#FFFFFF" />
      </g>
    ),
  },

  efs: {
    category: 'Storage',
    tileBg: OFFICIAL_CATEGORY_COLORS.Storage,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 10C7 8.5 8 7 9.5 7H16L19 10H30.5C32 10 33 11 33 12.5V28C33 29.5 32 30.5 30.5 30.5H9.5C8 30.5 7 29.5 7 28V10Z" />
        <circle cx="14" cy="20" r="2" fill="#FFFFFF" />
        <circle cx="26" cy="20" r="2" fill="#FFFFFF" />
        <circle cx="20" cy="26" r="2" fill="#FFFFFF" />
        <line x1="14" y1="20" x2="20" y2="26" strokeWidth="1.5" />
        <line x1="26" y1="20" x2="20" y2="26" strokeWidth="1.5" />
      </g>
    ),
  },

  glacier: {
    category: 'Storage',
    tileBg: OFFICIAL_CATEGORY_COLORS.Storage,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="8" width="24" height="24" rx="3" />
        <circle cx="20" cy="20" r="6" />
        <circle cx="20" cy="20" r="2" fill="#FFFFFF" />
        <line x1="20" y1="11" x2="20" y2="14" />
        <line x1="20" y1="26" x2="20" y2="29" />
        <line x1="11" y1="20" x2="14" y2="20" />
        <line x1="26" y1="20" x2="29" y2="20" />
      </g>
    ),
  },

  'storage-gateway': {
    category: 'Storage',
    tileBg: OFFICIAL_CATEGORY_COLORS.Storage,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="20" cy="11" rx="10" ry="3.5" />
        <path d="M10 11V20C10 22 14.5 23.5 20 23.5C25.5 23.5 30 22 30 20V11" />
        <rect x="8" y="25" width="24" height="7" rx="1.5" />
        <circle cx="12" cy="28.5" r="1" fill="#FFFFFF" />
        <circle cx="16" cy="28.5" r="1" fill="#FFFFFF" />
      </g>
    ),
  },

  // DATABASE (#527FFF in Dark, #3B48CC in Light)
  rds: {
    category: 'Database',
    tileBg: OFFICIAL_CATEGORY_COLORS.Database,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="20" cy="10" rx="11" ry="4" />
        <path d="M9 10V18C9 20.2 14 22 20 22C26 22 31 20.2 31 18V10" />
        <path d="M9 18V26C9 28.2 14 30 20 30C26 30 31 28.2 31 26V18" />
        <line x1="20" y1="14" x2="20" y2="30" strokeWidth="1.5" strokeDasharray="2 2" />
      </g>
    ),
  },

  dynamodb: {
    category: 'Database',
    tileBg: OFFICIAL_CATEGORY_COLORS.Database,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="20" cy="10" rx="11" ry="4" />
        <path d="M9 10V18C9 20.2 14 22 20 22C26 22 31 20.2 31 18V10" />
        <path d="M9 18V26C9 28.2 14 30 20 30C26 30 31 28.2 31 26V18" />
        <polygon points="21 13 16 21 20 21 19 27 25 19 21 19" fill="#FFFFFF" stroke="none" />
      </g>
    ),
  },

  aurora: {
    category: 'Database',
    tileBg: OFFICIAL_CATEGORY_COLORS.Database,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="20" cy="12" rx="9" ry="3.5" />
        <path d="M11 12V24C11 26 15 27.5 20 27.5C25 27.5 29 26 29 24V12" />
        <path d="M6 16C9 8 31 8 34 16" strokeWidth="1.75" />
        <path d="M6 24C9 32 31 32 34 24" strokeWidth="1.75" />
      </g>
    ),
  },

  elasticache: {
    category: 'Database',
    tileBg: OFFICIAL_CATEGORY_COLORS.Database,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="10" y="10" width="20" height="20" rx="2" />
        <polygon points="21 14 16 20 19 20 18 26 24 19 21 19" fill="#FFFFFF" stroke="none" />
        <line x1="14" y1="6" x2="14" y2="10" />
        <line x1="20" y1="6" x2="20" y2="10" />
        <line x1="26" y1="6" x2="26" y2="10" />
        <line x1="14" y1="30" x2="14" y2="34" />
        <line x1="20" y1="30" x2="20" y2="34" />
        <line x1="26" y1="30" x2="26" y2="34" />
      </g>
    ),
  },

  redshift: {
    category: 'Database',
    tileBg: OFFICIAL_CATEGORY_COLORS.Database,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="8" width="10" height="10" rx="1.5" />
        <rect x="22" y="8" width="10" height="10" rx="1.5" />
        <rect x="8" y="22" width="10" height="10" rx="1.5" />
        <rect x="22" y="22" width="10" height="10" rx="1.5" />
        <line x1="13" y1="8" x2="13" y2="18" strokeWidth="1" strokeDasharray="1 1" />
        <line x1="27" y1="8" x2="27" y2="18" strokeWidth="1" strokeDasharray="1 1" />
        <line x1="13" y1="22" x2="13" y2="32" strokeWidth="1" strokeDasharray="1 1" />
        <line x1="27" y1="22" x2="27" y2="32" strokeWidth="1" strokeDasharray="1 1" />
      </g>
    ),
  },

  // NETWORKING & CONTENT DELIVERY (#8C4FFF)
  vpc: {
    category: 'Networking & Content Delivery',
    tileBg: OFFICIAL_CATEGORY_COLORS.Networking,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="7" width="26" height="26" rx="3" strokeDasharray="3 2" />
        <circle cx="20" cy="20" r="3.5" fill="#FFFFFF" />
        <circle cx="12" cy="14" r="2" />
        <circle cx="28" cy="14" r="2" />
        <circle cx="12" cy="26" r="2" />
        <circle cx="28" cy="26" r="2" />
        <line x1="14" y1="15" x2="17.5" y2="18.5" strokeWidth="1.5" />
        <line x1="26" y1="15" x2="22.5" y2="18.5" strokeWidth="1.5" />
        <line x1="14" y1="25" x2="17.5" y2="21.5" strokeWidth="1.5" />
        <line x1="26" y1="25" x2="22.5" y2="21.5" strokeWidth="1.5" />
      </g>
    ),
  },

  route53: {
    category: 'Networking & Content Delivery',
    tileBg: OFFICIAL_CATEGORY_COLORS.Networking,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="20" cy="20" r="13" />
        <line x1="20" y1="7" x2="20" y2="33" strokeWidth="1.5" />
        <line x1="7" y1="20" x2="33" y2="20" strokeWidth="1.5" />
        <polygon points="20 10 23 18 20 16 17 18" fill="#FFFFFF" stroke="none" />
        <polygon points="30 20 22 23 24 20 22 17" fill="#FFFFFF" stroke="none" />
        <polygon points="20 30 17 22 20 24 23 22" fill="#FFFFFF" stroke="none" />
        <polygon points="10 20 18 17 16 20 18 23" fill="#FFFFFF" stroke="none" />
      </g>
    ),
  },

  cloudfront: {
    category: 'Networking & Content Delivery',
    tileBg: OFFICIAL_CATEGORY_COLORS.Networking,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="20" cy="20" r="10" />
        <ellipse cx="20" cy="20" rx="4.5" ry="10" strokeWidth="1.5" />
        <line x1="10" y1="20" x2="30" y2="20" strokeWidth="1.5" />
        <circle cx="9" cy="9" r="2.5" fill="#FFFFFF" />
        <circle cx="31" cy="9" r="2.5" fill="#FFFFFF" />
        <circle cx="9" cy="31" r="2.5" fill="#FFFFFF" />
        <circle cx="31" cy="31" r="2.5" fill="#FFFFFF" />
      </g>
    ),
  },

  apigateway: {
    category: 'Networking & Content Delivery',
    tileBg: OFFICIAL_CATEGORY_COLORS.Networking,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="20 6 32 13 32 27 20 34 8 27 8 13" />
        <line x1="14" y1="17" x2="26" y2="17" />
        <line x1="14" y1="23" x2="26" y2="23" />
        <polygon points="23 15 27 17 23 19" fill="#FFFFFF" stroke="none" />
        <polygon points="17 21 13 23 17 25" fill="#FFFFFF" stroke="none" />
      </g>
    ),
  },
  'api-gateway': {
    category: 'Networking & Content Delivery',
    tileBg: OFFICIAL_CATEGORY_COLORS.Networking,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="20 6 32 13 32 27 20 34 8 27 8 13" />
        <line x1="14" y1="17" x2="26" y2="17" />
        <line x1="14" y1="23" x2="26" y2="23" />
        <polygon points="23 15 27 17 23 19" fill="#FFFFFF" stroke="none" />
        <polygon points="17 21 13 23 17 25" fill="#FFFFFF" stroke="none" />
      </g>
    ),
  },

  elb: {
    category: 'Networking & Content Delivery',
    tileBg: OFFICIAL_CATEGORY_COLORS.Networking,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="20" cy="11" r="4" />
        <line x1="20" y1="15" x2="20" y2="23" />
        <line x1="11" y1="23" x2="29" y2="23" />
        <line x1="11" y1="23" x2="11" y2="27" />
        <line x1="20" y1="23" x2="20" y2="27" />
        <line x1="29" y1="23" x2="29" y2="27" />
        <circle cx="11" cy="29" r="2" fill="#FFFFFF" />
        <circle cx="20" cy="29" r="2" fill="#FFFFFF" />
        <circle cx="29" cy="29" r="2" fill="#FFFFFF" />
      </g>
    ),
  },
  alb: {
    category: 'Networking & Content Delivery',
    tileBg: OFFICIAL_CATEGORY_COLORS.Networking,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="20" cy="11" r="4" />
        <line x1="20" y1="15" x2="20" y2="23" />
        <line x1="11" y1="23" x2="29" y2="23" />
        <line x1="11" y1="23" x2="11" y2="27" />
        <line x1="20" y1="23" x2="20" y2="27" />
        <line x1="29" y1="23" x2="29" y2="27" />
        <circle cx="11" cy="29" r="2" fill="#FFFFFF" />
        <circle cx="20" cy="29" r="2" fill="#FFFFFF" />
        <circle cx="29" cy="29" r="2" fill="#FFFFFF" />
      </g>
    ),
  },

  natgateway: {
    category: 'Networking & Content Delivery',
    tileBg: OFFICIAL_CATEGORY_COLORS.Networking,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="11" width="26" height="18" rx="2" />
        <path d="M12 20H28" />
        <polygon points="25 17 28 20 25 23" fill="#FFFFFF" stroke="none" />
        <circle cx="14" cy="15" r="1.5" fill="#FFFFFF" />
        <circle cx="19" cy="15" r="1.5" fill="#FFFFFF" />
      </g>
    ),
  },

  igw: {
    category: 'Networking & Content Delivery',
    tileBg: OFFICIAL_CATEGORY_COLORS.Networking,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="10" width="26" height="20" rx="3" />
        <path d="M15 30V20C15 17.5 17 15.5 20 15.5C23 15.5 25 17.5 25 20V30" />
        <line x1="20" y1="8" x2="20" y2="12" />
        <circle cx="20" cy="7" r="1.5" fill="#FFFFFF" />
      </g>
    ),
  },

  // SECURITY, IDENTITY & COMPLIANCE (#DD344C)
  iam: {
    category: 'Security, Identity & Compliance',
    tileBg: OFFICIAL_CATEGORY_COLORS.Security,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L31 11V19C31 26 26 31 20 34C14 31 9 26 9 19V11L20 6Z" />
        <circle cx="20" cy="16" r="3.5" />
        <path d="M14 26C14 23 17 21.5 20 21.5C23 21.5 26 23 26 26" />
      </g>
    ),
  },

  cognito: {
    category: 'Security, Identity & Compliance',
    tileBg: OFFICIAL_CATEGORY_COLORS.Security,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="16" cy="15" r="4" />
        <path d="M9 28C9 24 12 22 16 22C17.5 22 19 22.5 20 23.5" />
        <circle cx="26" cy="18" r="3" strokeWidth="1.5" />
        <path d="M22 28C22 25.5 24 24 26 24C28 24 30 25.5 30 28" strokeWidth="1.5" />
      </g>
    ),
  },

  kms: {
    category: 'Security, Identity & Compliance',
    tileBg: OFFICIAL_CATEGORY_COLORS.Security,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="17" cy="17" r="7" />
        <circle cx="17" cy="17" r="2.5" fill="#FFFFFF" />
        <line x1="22" y1="22" x2="31" y2="31" strokeWidth="2.5" />
        <line x1="27" y1="27" x2="30" y2="24" strokeWidth="2" />
        <line x1="29" y1="29" x2="32" y2="26" strokeWidth="2" />
      </g>
    ),
  },

  waf: {
    category: 'Security, Identity & Compliance',
    tileBg: OFFICIAL_CATEGORY_COLORS.Security,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L31 11V19C31 26 26 31 20 34C14 31 9 26 9 19V11L20 6Z" />
        <line x1="13" y1="15" x2="27" y2="15" strokeWidth="1.5" />
        <line x1="13" y1="21" x2="27" y2="21" strokeWidth="1.5" />
        <line x1="18" y1="15" x2="18" y2="21" strokeWidth="1.5" />
        <line x1="22" y1="21" x2="22" y2="27" strokeWidth="1.5" />
      </g>
    ),
  },

  shield: {
    category: 'Security, Identity & Compliance',
    tileBg: OFFICIAL_CATEGORY_COLORS.Security,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 5L32 10.5V19.5C32 27 27 32.5 20 35C13 32.5 8 27 8 19.5V10.5L20 5Z" />
        <path d="M20 10L28 14V20C28 24.5 24.5 28 20 30C15.5 28 12 24.5 12 20V14L20 10Z" strokeWidth="1.5" />
      </g>
    ),
  },

  'secrets-manager': {
    category: 'Security, Identity & Compliance',
    tileBg: OFFICIAL_CATEGORY_COLORS.Security,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="14" width="24" height="18" rx="3" />
        <path d="M14 14V11C14 7.5 16.5 5 20 5C23.5 5 26 7.5 26 11V14" />
        <circle cx="20" cy="22" r="2.5" fill="#FFFFFF" />
        <line x1="20" y1="24.5" x2="20" y2="27" strokeWidth="2" />
      </g>
    ),
  },

  // APPLICATION INTEGRATION & SERVERLESS (#E7157B)
  sqs: {
    category: 'Application Integration',
    tileBg: OFFICIAL_CATEGORY_COLORS.Integration,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="11" width="11" height="18" rx="2" />
        <rect x="22" y="11" width="11" height="18" rx="2" />
        <line x1="18" y1="17" x2="22" y2="17" strokeWidth="2" />
        <line x1="18" y1="23" x2="22" y2="23" strokeWidth="2" />
        <polygon points="20 15 23 17 20 19" fill="#FFFFFF" stroke="none" />
      </g>
    ),
  },

  sns: {
    category: 'Application Integration',
    tileBg: OFFICIAL_CATEGORY_COLORS.Integration,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13" cy="20" r="4.5" fill="#FFFFFF" />
        <path d="M21 13C24 15 25 17.5 25 20C25 22.5 24 25 21 27" strokeWidth="2" />
        <path d="M26 9C30 12 32 15.5 32 20C32 24.5 30 28 26 31" strokeWidth="2" />
      </g>
    ),
  },

  eventbridge: {
    category: 'Application Integration',
    tileBg: OFFICIAL_CATEGORY_COLORS.Integration,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="14" r="3" fill="#FFFFFF" />
        <circle cx="10" cy="26" r="3" fill="#FFFFFF" />
        <circle cx="30" cy="14" r="3" fill="#FFFFFF" />
        <circle cx="30" cy="26" r="3" fill="#FFFFFF" />
        <path d="M13 14H18L22 26H27" strokeWidth="2" />
        <path d="M13 26H18L22 14H27" strokeWidth="2" />
      </g>
    ),
  },

  'step-functions': {
    category: 'Application Integration',
    tileBg: OFFICIAL_CATEGORY_COLORS.Integration,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="20" r="3" fill="#FFFFFF" />
        <circle cx="20" cy="12" r="3" fill="#FFFFFF" />
        <circle cx="20" cy="28" r="3" fill="#FFFFFF" />
        <circle cx="29" cy="20" r="3" fill="#FFFFFF" />
        <line x1="13.5" y1="18" x2="17.5" y2="14" strokeWidth="1.5" />
        <line x1="13.5" y1="22" x2="17.5" y2="26" strokeWidth="1.5" />
        <line x1="22.5" y1="14" x2="26.5" y2="18" strokeWidth="1.5" />
        <line x1="22.5" y1="26" x2="26.5" y2="22" strokeWidth="1.5" />
      </g>
    ),
  },

  // MANAGEMENT & GOVERNANCE (#E7157B)
  cloudwatch: {
    category: 'Management & Governance',
    tileBg: OFFICIAL_CATEGORY_COLORS.Management,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="20" cy="20" r="13" />
        <polyline points="12 24 17 17 22 22 28 14" strokeWidth="2" />
        <circle cx="28" cy="14" r="1.5" fill="#FFFFFF" />
      </g>
    ),
  },

  cloudtrail: {
    category: 'Management & Governance',
    tileBg: OFFICIAL_CATEGORY_COLORS.Management,
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="16" cy="15" rx="3.5" ry="5.5" transform="rotate(-15 16 15)" fill="#FFFFFF" />
        <ellipse cx="24" cy="25" rx="3.5" ry="5.5" transform="rotate(15 24 25)" fill="#FFFFFF" />
        <circle cx="14" cy="8" r="1.5" fill="#FFFFFF" />
        <circle cx="26" cy="18" r="1.5" fill="#FFFFFF" />
      </g>
    ),
  },
};

// Group Vectors (20x20 boundary badges)
export const AWS_GROUP_VECTORS: Record<string, { label: string; paths: React.ReactNode }> = {
  'aws-cloud': {
    label: 'AWS Cloud',
    paths: (
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 14C4.5 14 3 15.5 3 17.5C3 19.5 4.5 21 6.5 21H17.5C19.5 21 21 19.5 21 17.5C21 15.8 19.8 14.3 18.2 14.1C18 10.7 15.2 8 11.8 8C9.2 8 7 9.6 6.2 12C6.1 12 6.1 12 6 12C4.3 12 3 13.3 3 15" />
      </g>
    ),
  },
  region: {
    label: 'Region',
    paths: (
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <ellipse cx="12" cy="12" rx="4" ry="9" />
        <line x1="3" y1="12" x2="21" y2="12" />
      </g>
    ),
  },
  vpc: {
    label: 'VPC',
    paths: (
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="3 2" />
        <circle cx="12" cy="12" r="2.5" fill="currentColor" />
        <circle cx="7" cy="8" r="1" />
        <circle cx="17" cy="8" r="1" />
        <circle cx="7" cy="16" r="1" />
        <circle cx="17" cy="16" r="1" />
      </g>
    ),
  },
  'public-subnet': {
    label: 'Public subnet',
    paths: (
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10" />
        <path d="M12 14V17" />
      </g>
    ),
  },
  'private-subnet': {
    label: 'Private subnet',
    paths: (
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7C8 4.8 9.8 3 12 3C14.2 3 16 4.8 16 7V10" />
        <circle cx="12" cy="15.5" r="1.5" fill="currentColor" />
      </g>
    ),
  },
  'security-group': {
    label: 'Security group',
    paths: (
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3L20 6.5V13C20 18 16.5 21.5 12 23C7.5 21.5 4 18 4 13V6.5L12 3Z" />
        <line x1="8" y1="11" x2="16" y2="11" strokeWidth="1.5" />
        <line x1="8" y1="15" x2="16" y2="15" strokeWidth="1.5" />
      </g>
    ),
  },
  'auto-scaling-group': {
    label: 'Auto scaling group',
    paths: (
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="8 9 5 12 8 15" />
        <polyline points="16 9 19 12 16 15" />
        <line x1="12" y1="5" x2="12" y2="19" />
        <polyline points="9 8 12 5 15 8" />
        <polyline points="9 16 12 19 15 16" />
      </g>
    ),
  },
  'corporate-datacenter': {
    label: 'Corporate data center',
    paths: (
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <line x1="8" y1="7" x2="16" y2="7" />
        <line x1="8" y1="11" x2="16" y2="11" />
        <line x1="8" y1="15" x2="16" y2="15" />
        <circle cx="6" cy="7" r="0.8" fill="currentColor" />
        <circle cx="6" cy="11" r="0.8" fill="currentColor" />
        <circle cx="6" cy="15" r="0.8" fill="currentColor" />
      </g>
    ),
  },
};

export const AWS_ACTOR_VECTORS: Record<
  string,
  { label: string; stroke: string; bg: string; paths: React.ReactNode }
> = {
  'user-browser': {
    label: 'User / Client Browser',
    stroke: '#0972D3',
    bg: '#0972D3',
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="5" width="24" height="18" rx="2" />
        <line x1="4" y1="10" x2="28" y2="10" />
        <circle cx="7.5" cy="7.5" r="0.75" fill="#FFFFFF" />
        <circle cx="10.5" cy="7.5" r="0.75" fill="#FFFFFF" />
        <circle cx="16" cy="15" r="2.5" />
        <path d="M12 21C12 18.8 13.8 17 16 17C18.2 17 20 18.8 20 21" />
      </g>
    ),
  },
  'mobile-client': {
    label: 'Mobile / IoT Client',
    stroke: '#1D8102',
    bg: '#1D8102',
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="4" width="16" height="24" rx="3" />
        <line x1="14" y1="7" x2="18" y2="7" />
        <circle cx="16" cy="24" r="1" fill="#FFFFFF" />
        <path d="M5 8C3.5 10.5 3.5 13.5 5 16" />
        <path d="M27 8C28.5 10.5 28.5 13.5 27 16" />
      </g>
    ),
  },
  'corporate-datacenter': {
    label: 'Corporate On-Premises Data Center',
    stroke: '#545B64',
    bg: '#545B64',
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="4" width="20" height="24" rx="2" />
        <line x1="6" y1="12" x2="26" y2="12" />
        <line x1="6" y1="20" x2="26" y2="20" />
        <circle cx="10" cy="8" r="1" fill="#FFFFFF" />
        <circle cx="10" cy="16" r="1" fill="#FFFFFF" />
        <circle cx="10" cy="24" r="1" fill="#FFFFFF" />
        <line x1="14" y1="8" x2="22" y2="8" />
        <line x1="14" y1="16" x2="22" y2="16" />
        <line x1="14" y1="24" x2="22" y2="24" />
      </g>
    ),
  },
  'external-webhook': {
    label: 'External Webhook / 3rd-Party API',
    stroke: '#8C4FFF',
    bg: '#8C4FFF',
    paths: (
      <g fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="16" r="3" />
        <circle cx="23" cy="9" r="3" />
        <circle cx="23" cy="23" r="3" />
        <path d="M11.5 14.5L20.5 10.5" />
        <path d="M11.5 17.5L20.5 21.5" />
      </g>
    ),
  },
};

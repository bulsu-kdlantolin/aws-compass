import type { ThemeMode } from '../types/aws';

/**
 * Official AWS Architecture Category Colors (All 16 Official Architectural Domains)
 * Reference: AWS Cloudscape Design System & AWS Architecture Icons standard
 */
export const AWS_CATEGORY_COLORS = {
  Compute: '#ED7100',
  Containers: '#ED7100',
  Serverless: '#ED7100',
  Storage: '#3F8624',
  Database: '#3B48CC',
  'Networking & Content Delivery': '#8C4FFF',
  Networking: '#8C4FFF',
  'Security, Identity & Compliance': '#DD344C',
  'Security/IAM': '#DD344C',
  'Application Integration': '#E7157B',
  Integration: '#E7157B',
  Analytics: '#8C4FFF',
  'Machine Learning & AI': '#01A88D',
  'Management & Governance': '#E7157B',
  'Developer Tools': '#C925D1',
  'Migration & Transfer': '#01A88D',
  'Front-End Web & Mobile': '#DD344C',
  'Internet of Things (IoT)': '#3F8624',
  'Cloud Financial Management': '#3F8624',
} as const;

/**
 * Returns the exact hex color for any AWS Category based on active theme
 */
export function getAWSCategoryColor(category: string, _theme: ThemeMode = 'dark'): string {
  const norm = (category || '').trim().toLowerCase();

  if (norm === 'compute') return AWS_CATEGORY_COLORS.Compute;
  if (norm === 'containers') return AWS_CATEGORY_COLORS.Containers;
  if (norm === 'serverless') return AWS_CATEGORY_COLORS.Serverless;
  if (norm === 'storage') return AWS_CATEGORY_COLORS.Storage;
  if (norm === 'database') return AWS_CATEGORY_COLORS.Database;
  if (norm.includes('network') || norm.includes('content delivery')) return AWS_CATEGORY_COLORS['Networking & Content Delivery'];
  if (norm.includes('security') || norm.includes('identity') || norm.includes('compliance') || norm.includes('iam')) return AWS_CATEGORY_COLORS['Security, Identity & Compliance'];
  if (norm.includes('integration')) return AWS_CATEGORY_COLORS['Application Integration'];
  if (norm === 'analytics') return AWS_CATEGORY_COLORS.Analytics;
  if (norm.includes('machine learning') || norm.includes('ai') || norm.includes('sagemaker') || norm.includes('bedrock')) return AWS_CATEGORY_COLORS['Machine Learning & AI'];
  if (norm.includes('management') || norm.includes('governance')) return AWS_CATEGORY_COLORS['Management & Governance'];
  if (norm.includes('developer') || norm.includes('devtools')) return AWS_CATEGORY_COLORS['Developer Tools'];
  if (norm.includes('migration') || norm.includes('transfer')) return AWS_CATEGORY_COLORS['Migration & Transfer'];
  if (norm.includes('front-end') || norm.includes('mobile') || norm.includes('web')) return AWS_CATEGORY_COLORS['Front-End Web & Mobile'];
  if (norm.includes('iot') || norm.includes('things')) return AWS_CATEGORY_COLORS['Internet of Things (IoT)'];
  if (norm.includes('financial') || norm.includes('cost') || norm.includes('billing')) return AWS_CATEGORY_COLORS['Cloud Financial Management'];

  return AWS_CATEGORY_COLORS.Compute;
}

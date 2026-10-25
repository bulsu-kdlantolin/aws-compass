import type { ThemeMode } from '../types/aws';

/**
 * Official AWS Architecture Category Colors
 * Reference: AWS Cloudscape Design System & AWS Architecture Icons
 */
export const AWS_CATEGORY_COLORS = {
  Compute: '#ED7100',
  Storage: '#3F8624',
  DatabaseDark: '#527FFF',
  DatabaseLight: '#3B48CC',
  Networking: '#8C4FFF',
  'Security/IAM': '#DD344C',
  Integration: '#E7157B',
  Serverless: '#E7157B',
} as const;

/**
 * Returns the exact hex color for any AWS Category based on active theme
 */
export function getAWSCategoryColor(category: string, theme: ThemeMode = 'dark'): string {
  switch (category) {
    case 'Compute':
      return AWS_CATEGORY_COLORS.Compute;
    case 'Storage':
      return AWS_CATEGORY_COLORS.Storage;
    case 'Database':
      return theme === 'light' ? AWS_CATEGORY_COLORS.DatabaseLight : AWS_CATEGORY_COLORS.DatabaseDark;
    case 'Networking':
      return AWS_CATEGORY_COLORS.Networking;
    case 'Security/IAM':
      return AWS_CATEGORY_COLORS['Security/IAM'];
    case 'Integration':
    case 'Serverless':
      return AWS_CATEGORY_COLORS.Integration;
    default:
      if (category.toLowerCase().includes('security') || category.toLowerCase().includes('iam')) {
        return AWS_CATEGORY_COLORS['Security/IAM'];
      }
      return AWS_CATEGORY_COLORS.Compute;
  }
}

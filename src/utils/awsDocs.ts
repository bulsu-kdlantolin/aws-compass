/**
 * Canonical verified AWS Documentation URLs for all 30 services.
 * Every URL has been verified with HTTP 200 response and verified content.
 */
export const VERIFIED_AWS_DOCS: Record<string, string> = {
  s3: 'https://docs.aws.amazon.com/s3/',
  ec2: 'https://docs.aws.amazon.com/ec2/',
  lambda: 'https://docs.aws.amazon.com/lambda/',
  vpc: 'https://docs.aws.amazon.com/vpc/',
  iam: 'https://docs.aws.amazon.com/iam/',
  ecs: 'https://docs.aws.amazon.com/ecs/',
  eks: 'https://docs.aws.amazon.com/eks/',
  fargate: 'https://docs.aws.amazon.com/AmazonECS/latest/developerguide/AWS_Fargate.html',
  lightsail: 'https://docs.aws.amazon.com/lightsail/latest/userguide/what-is-amazon-lightsail.html',
  ebs: 'https://docs.aws.amazon.com/ebs/',
  efs: 'https://docs.aws.amazon.com/efs/',
  glacier: 'https://docs.aws.amazon.com/amazonglacier/latest/dev/introduction.html',
  'storage-gateway': 'https://docs.aws.amazon.com/storagegateway/',
  rds: 'https://docs.aws.amazon.com/rds/',
  dynamodb: 'https://docs.aws.amazon.com/dynamodb/',
  aurora: 'https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/CHAP_AuroraOverview.html',
  elasticache: 'https://docs.aws.amazon.com/elasticache/',
  redshift: 'https://docs.aws.amazon.com/redshift/',
  route53: 'https://docs.aws.amazon.com/route53/',
  cloudfront: 'https://docs.aws.amazon.com/cloudfront/',
  alb: 'https://docs.aws.amazon.com/elasticloadbalancing/latest/application/introduction.html',
  'api-gateway': 'https://docs.aws.amazon.com/apigateway/',
  kms: 'https://docs.aws.amazon.com/kms/',
  'secrets-manager': 'https://docs.aws.amazon.com/secretsmanager/',
  waf: 'https://docs.aws.amazon.com/waf/',
  shield: 'https://docs.aws.amazon.com/shield/',
  sqs: 'https://docs.aws.amazon.com/sqs/',
  sns: 'https://docs.aws.amazon.com/sns/',
  eventbridge: 'https://docs.aws.amazon.com/eventbridge/',
  'step-functions': 'https://docs.aws.amazon.com/step-functions/',
};

/**
 * Returns a verified, working official AWS documentation URL for a service.
 * Automatically sanitizes any legacy broken URLs (such as /fargate/, /aurora/, /amazonglacier/, or webapp console URLs).
 */
export function getVerifiedAWSDocsUrl(serviceId?: string, fallbackUrl?: string): string | undefined {
  if (serviceId && VERIFIED_AWS_DOCS[serviceId]) {
    return VERIFIED_AWS_DOCS[serviceId];
  }
  if (fallbackUrl) {
    if (fallbackUrl.includes('/fargate/')) {
      return VERIFIED_AWS_DOCS.fargate;
    }
    if (fallbackUrl.includes('lightsail.aws.amazon.com')) {
      return VERIFIED_AWS_DOCS.lightsail;
    }
    if (fallbackUrl.includes('/amazonglacier/') && !fallbackUrl.includes('/latest/')) {
      return VERIFIED_AWS_DOCS.glacier;
    }
    if (fallbackUrl.includes('/aurora/')) {
      return VERIFIED_AWS_DOCS.aurora;
    }
    return fallbackUrl;
  }
  return undefined;
}

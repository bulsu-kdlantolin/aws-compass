import React, { useState } from 'react';
import {
  AWS_SERVICE_VECTORS,
  AWS_GROUP_VECTORS,
} from './awsOfficialVectors';
import { useCompassStore } from '../../store/useCompassStore';

export interface AWSServiceIconProps {
  serviceId?: string;
  groupId?: string;
  size?: number;
  className?: string;
  variant?: 'service' | 'resource' | 'group';
}

export const AWSServiceIcon: React.FC<AWSServiceIconProps> = ({
  serviceId,
  groupId,
  size = 24,
  className = '',
  variant = 'service',
}) => {
  const theme = useCompassStore((s) => s.theme);
  const [assetLoadFailed, setAssetLoadFailed] = useState(false);

  // Normalize service key: lowercase, trim
  const rawKey = (variant === 'group' ? groupId : serviceId) || '';
  const normalizedKey = rawKey.toLowerCase().trim().replace(/\s+/g, '-');

  // Group Icon Variant
  if (variant === 'group') {
    const groupDef = AWS_GROUP_VECTORS[normalizedKey] || AWS_GROUP_VECTORS['aws-cloud'];
    const assetUrl = `/aws-icons/groups/${normalizedKey}.svg`;

    if (!assetLoadFailed) {
      return (
        <span
          className={`inline-flex items-center justify-center shrink-0 overflow-hidden select-none ${className}`}
          style={{ width: size, height: size, borderRadius: 2 }}
          title={groupDef.label}
        >
          <img
            src={assetUrl}
            alt={groupDef.label}
            width={size}
            height={size}
            onError={() => setAssetLoadFailed(true)}
            className="w-full h-full object-contain block pointer-events-none"
            loading="eager"
          />
        </span>
      );
    }

    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        className={`inline-block shrink-0 ${className}`}
      >
        {groupDef.paths}
      </svg>
    );
  }

  // Service / Resource Icon Variant
  const vectorDef =
    AWS_SERVICE_VECTORS[normalizedKey] ||
    AWS_SERVICE_VECTORS[normalizedKey.replace(/-/g, '')] ||
    AWS_SERVICE_VECTORS['ec2'];

  const tileBgColor = theme === 'dark' ? vectorDef.tileBg.dark : vectorDef.tileBg.light;
  const borderRadius = size <= 24 ? 2 : 4;
  const assetUrl = `/aws-icons/services/${normalizedKey}.svg`;

  // Official AWS Architecture SVG asset pack resolution
  if (!assetLoadFailed) {
    return (
      <span
        style={{
          width: size,
          height: size,
          borderRadius,
        }}
        className={`inline-flex items-center justify-center shrink-0 overflow-hidden select-none ${className}`}
        title={`AWS ${serviceId || 'Service'}`}
      >
        <img
          src={assetUrl}
          alt={`AWS ${serviceId}`}
          width={size}
          height={size}
          onError={() => setAssetLoadFailed(true)}
          className="w-full h-full object-contain block pointer-events-none"
          loading="eager"
        />
      </span>
    );
  }

  // Built-in crisp SVG vector fallback
  return (
    <span
      style={{
        width: size,
        height: size,
        backgroundColor: tileBgColor,
        borderRadius,
      }}
      className={`inline-flex items-center justify-center p-[6%] shrink-0 shadow-xs select-none ${className}`}
      title={`AWS ${serviceId || 'Service'}`}
    >
      <svg
        viewBox="0 0 40 40"
        width="100%"
        height="100%"
        className="w-full h-full overflow-visible"
      >
        {vectorDef.paths}
      </svg>
    </span>
  );
};

export default AWSServiceIcon;

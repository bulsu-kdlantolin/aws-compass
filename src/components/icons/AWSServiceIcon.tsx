import React, { memo, useState } from 'react';
import {
  AWS_SERVICE_VECTORS,
  AWS_GROUP_VECTORS,
  AWS_ACTOR_VECTORS,
  getCategoryDomainVector,
} from './awsOfficialVectors';
import { getAWSServiceIconUrl, getAWSGroupIconUrl } from './awsIconRegistry';
import { useCompassStore } from '../../store/useCompassStore';
import { SEED_SERVICES } from '../../db/seedServices';

// Precomputed category lookup map to eliminate store subscriptions across hundreds of icons
const SERVICE_CATEGORY_CACHE = new Map<string, string>();
for (const s of SEED_SERVICES) {
  SERVICE_CATEGORY_CACHE.set(s.id.toLowerCase(), s.category);
}

// Global cache for failed asset URLs so an icon only ever fails once across the entire session
const globalFailedUrls = new Set<string>();

export interface AWSServiceIconProps {
  serviceId?: string;
  category?: string;
  groupId?: string;
  actorId?: string;
  size?: number;
  className?: string;
  variant?: 'service' | 'resource' | 'group' | 'actor';
}

  export const AWSServiceIcon: React.FC<AWSServiceIconProps> = memo(({
    serviceId,
    category,
    groupId,
    actorId,
    size = 24,
    className = '',
    variant = 'service',
  }) => {
    const theme = useCompassStore((s) => s.theme);

    // Normalize service key: lowercase, trim
    const rawKey = (variant === 'group' ? groupId : variant === 'actor' ? actorId : serviceId) || '';
    const normalizedKey = rawKey.toLowerCase().trim().replace(/\s+/g, '-');

    const assetUrl =
      variant === 'group'
        ? getAWSGroupIconUrl(normalizedKey)
        : variant === 'service' || variant === 'resource'
          ? getAWSServiceIconUrl(normalizedKey)
          : '';

    const [hasFailed, setHasFailed] = useState(() => (assetUrl ? globalFailedUrls.has(assetUrl) : false));

    // External Actor Variant
    if (variant === 'actor') {
      const actorDef = AWS_ACTOR_VECTORS[normalizedKey] || AWS_ACTOR_VECTORS['user-browser'];
      const borderRadius = size <= 24 ? 2 : 4;
      return (
        <span
          className={`inline-flex items-center justify-center shrink-0 overflow-hidden select-none ${className}`}
          style={{
            width: size,
            height: size,
            borderRadius,
            backgroundColor: actorDef.bg,
          }}
          title={actorDef.label}
        >
          <svg
            viewBox="0 0 32 32"
            width={size * 0.72}
            height={size * 0.72}
            className="block pointer-events-none"
          >
            {actorDef.paths}
          </svg>
        </span>
      );
    }

    // Group Icon Variant
    if (variant === 'group') {
      const groupDef = AWS_GROUP_VECTORS[normalizedKey] || AWS_GROUP_VECTORS['aws-cloud'];

        if (!hasFailed && assetUrl) {
          return (
            <span
              className={`inline-flex items-center justify-center shrink-0 overflow-hidden select-none ${className}`}
              style={{ width: size, height: size, borderRadius: 2 }}
              title={groupDef.label}
            >
              <img
                key={assetUrl}
                src={assetUrl}
                alt={groupDef.label}
                width={size}
                height={size}
                draggable={false}
                onError={() => {
                  globalFailedUrls.add(assetUrl);
                  setHasFailed(true);
                }}
                className="w-full h-full object-contain block pointer-events-none"
                loading="lazy"
                decoding="async"
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
      const resolvedCategory =
        category ||
        SERVICE_CATEGORY_CACHE.get(normalizedKey) ||
        useCompassStore.getState().services.find((s) => s.id === normalizedKey || s.id === serviceId)?.category ||
        '';

      const vectorDef =
        AWS_SERVICE_VECTORS[normalizedKey] ||
        AWS_SERVICE_VECTORS[normalizedKey.replace(/-/g, '')] ||
      getCategoryDomainVector(resolvedCategory);

      const tileBgColor = theme === 'dark' ? vectorDef.tileBg.dark : vectorDef.tileBg.light;
      const borderRadius = size <= 24 ? 2 : 4;

      // Official AWS Architecture SVG asset pack resolution
        if (!hasFailed && assetUrl) {
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
                key={assetUrl}
                src={assetUrl}
                alt={`AWS ${serviceId || 'Service'}`}
                width={size}
                height={size}
                draggable={false}
                onError={() => {
                  globalFailedUrls.add(assetUrl);
                  setHasFailed(true);
                }}
                className="w-full h-full object-contain block pointer-events-none"
                loading="lazy"
                decoding="async"
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
    });

  export default AWSServiceIcon;

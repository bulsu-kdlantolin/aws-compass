import React from 'react';
import { AWSServiceIcon as OfficialAWSServiceIcon, type AWSServiceIconProps } from '../icons/AWSServiceIcon';

export interface AWSIconProps {
  serviceId?: string;
  className?: string;
  size?: number;
}

export const AWSServiceIcon: React.FC<AWSServiceIconProps> = (props) => {
  return <OfficialAWSServiceIcon {...props} />;
};

export default AWSServiceIcon;

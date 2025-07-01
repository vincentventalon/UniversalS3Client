export type S3ProviderType = 
  | 'aws' 
  | 'hetzner'
  | 'cloudflare'
  | 'digitalocean'
  | 'google'
  | 'azure'
  | 'oracle'
  | 'ibm'
  | 'wasabi'
  | 'backblaze'
  | 'scaleway'
  | 'vultr'
  | 'linode';

export interface S3Provider {
  id: string;
  name: string;
  type: S3ProviderType;
  endpoint: string;
  accessKey: string;
  secretKey: string;
  region?: string;
  // Additional provider-specific configs
  accountId?: string; // For Cloudflare R2
  namespace?: string; // For Oracle OCI
  locationHint?: string; // For Cloudflare R2
  clusterId?: string; // For Linode
}

export interface Bucket {
  name: string;
  region?: string;
  creationDate?: Date;
  url: string;
}

export interface S3Object {
  key: string;
  name: string;
  lastModified: Date | null;
  size: number;
  isFolder: boolean;
  fullPath: string;
}

export interface AppState {
  isLocked: boolean;
  userPassword: string | null;
  providers: S3Provider[];
  selectedProvider: S3Provider | null;
  buckets: Bucket[];
}

// Provider configuration for regions and endpoints
export interface ProviderConfig {
  name: string;
  type: S3ProviderType;
  regions: Array<{
    value: string;
    label: string;
  }>;
  endpointPattern: string;
  requiresAccountId?: boolean;
  requiresNamespace?: boolean;
  requiresClusterId?: boolean;
  supportsLocationHints?: boolean;
  locationHints?: Array<{
    value: string;
    label: string;
  }>;
} 
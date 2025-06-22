export interface S3Provider {
  id: string;
  name: string;
  type: 'aws' | 'hetzner';
  endpoint: string;
  accessKey: string;
  secretKey: string;
  region?: string;
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
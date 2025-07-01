import { ProviderConfig, S3ProviderType } from '../types';

export const PROVIDER_CONFIGS: Record<S3ProviderType, ProviderConfig> = {
  aws: {
    name: 'AWS S3',
    type: 'aws',
    endpointPattern: 'https://s3.{region}.amazonaws.com',
    regions: [
      { value: 'us-east-1', label: 'us-east-1 (N. Virginia)' },
      { value: 'us-east-2', label: 'us-east-2 (Ohio)' },
      { value: 'us-west-1', label: 'us-west-1 (N. California)' },
      { value: 'us-west-2', label: 'us-west-2 (Oregon)' },
      { value: 'af-south-1', label: 'af-south-1 (Cape Town)' },
      { value: 'ap-east-1', label: 'ap-east-1 (Hong Kong)' },
      { value: 'ap-south-2', label: 'ap-south-2 (Hyderabad)' },
      { value: 'ap-southeast-3', label: 'ap-southeast-3 (Jakarta)' },
      { value: 'ap-southeast-5', label: 'ap-southeast-5 (Kuala Lumpur)' },
      { value: 'ap-southeast-4', label: 'ap-southeast-4 (Melbourne)' },
      { value: 'ap-south-1', label: 'ap-south-1 (Mumbai)' },
      { value: 'ap-northeast-3', label: 'ap-northeast-3 (Osaka)' },
      { value: 'ap-northeast-2', label: 'ap-northeast-2 (Seoul)' },
      { value: 'ap-southeast-1', label: 'ap-southeast-1 (Singapore)' },
      { value: 'ap-southeast-2', label: 'ap-southeast-2 (Sydney)' },
      { value: 'ap-northeast-1', label: 'ap-northeast-1 (Tokyo)' },
      { value: 'ca-central-1', label: 'ca-central-1 (Central Canada)' },
      { value: 'ca-west-1', label: 'ca-west-1 (Calgary)' },
      { value: 'eu-central-1', label: 'eu-central-1 (Frankfurt)' },
      { value: 'eu-west-1', label: 'eu-west-1 (Ireland)' },
      { value: 'eu-west-2', label: 'eu-west-2 (London)' },
      { value: 'eu-south-1', label: 'eu-south-1 (Milan)' },
      { value: 'eu-west-3', label: 'eu-west-3 (Paris)' },
      { value: 'eu-south-2', label: 'eu-south-2 (Spain)' },
      { value: 'eu-north-1', label: 'eu-north-1 (Stockholm)' },
      { value: 'eu-central-2', label: 'eu-central-2 (Zurich)' },
      { value: 'il-central-1', label: 'il-central-1 (Tel Aviv)' },
      { value: 'me-south-1', label: 'me-south-1 (Bahrain)' },
      { value: 'me-central-1', label: 'me-central-1 (UAE)' },
      { value: 'mx-central-1', label: 'mx-central-1 (Mexico City)' },
      { value: 'sa-east-1', label: 'sa-east-1 (São Paulo)' },
      { value: 'us-gov-east-1', label: 'us-gov-east-1 (GovCloud US-East)' },
      { value: 'us-gov-west-1', label: 'us-gov-west-1 (GovCloud US-West)' },
    ],
  },

  hetzner: {
    name: 'Hetzner Storage Box',
    type: 'hetzner',
    endpointPattern: 'https://{region}.your-objectstorage.com',
    regions: [
      { value: 'fsn1', label: 'Falkenstein (fsn1)' },
      { value: 'nbg1', label: 'Nuremberg (nbg1)' },
      { value: 'hel1', label: 'Helsinki (hel1)' },
    ],
  },

  cloudflare: {
    name: 'Cloudflare R2',
    type: 'cloudflare',
    endpointPattern: 'https://{accountId}.r2.cloudflarestorage.com',
    requiresAccountId: true,
    supportsLocationHints: true,
    regions: [
      { value: 'auto', label: 'Automatic' },
    ],
    locationHints: [
      { value: 'wnam', label: 'Western North America' },
      { value: 'enam', label: 'Eastern North America' },
      { value: 'weur', label: 'Western Europe' },
      { value: 'eeur', label: 'Eastern Europe' },
      { value: 'apac', label: 'Asia-Pacific' },
      { value: 'oc', label: 'Oceania' },
    ],
  },

  digitalocean: {
    name: 'DigitalOcean Spaces',
    type: 'digitalocean',
    endpointPattern: 'https://{region}.digitaloceanspaces.com',
    regions: [
      { value: 'nyc3', label: 'New York (nyc3)' },
      { value: 'ams3', label: 'Amsterdam (ams3)' },
      { value: 'sgp1', label: 'Singapore (sgp1)' },
      { value: 'fra1', label: 'Frankfurt (fra1)' },
      { value: 'sfo3', label: 'San Francisco (sfo3)' },
    ],
  },

  google: {
    name: 'Google Cloud Storage',
    type: 'google',
    endpointPattern: 'https://storage.googleapis.com',
    regions: [
      { value: 'us', label: 'Multi-Regional US' },
      { value: 'eu', label: 'Multi-Regional EU' },
      { value: 'asia', label: 'Multi-Regional Asia' },
      { value: 'us-central1', label: 'us-central1 (Iowa)' },
      { value: 'us-east1', label: 'us-east1 (South Carolina)' },
      { value: 'us-east4', label: 'us-east4 (Northern Virginia)' },
      { value: 'us-west1', label: 'us-west1 (Oregon)' },
      { value: 'us-west2', label: 'us-west2 (Los Angeles)' },
      { value: 'us-west3', label: 'us-west3 (Salt Lake City)' },
      { value: 'us-west4', label: 'us-west4 (Las Vegas)' },
      { value: 'europe-north1', label: 'europe-north1 (Finland)' },
      { value: 'europe-west1', label: 'europe-west1 (Belgium)' },
      { value: 'europe-west2', label: 'europe-west2 (London)' },
      { value: 'europe-west3', label: 'europe-west3 (Frankfurt)' },
      { value: 'europe-west4', label: 'europe-west4 (Netherlands)' },
      { value: 'europe-west6', label: 'europe-west6 (Zurich)' },
      { value: 'asia-east1', label: 'asia-east1 (Taiwan)' },
      { value: 'asia-east2', label: 'asia-east2 (Hong Kong)' },
      { value: 'asia-northeast1', label: 'asia-northeast1 (Tokyo)' },
      { value: 'asia-south1', label: 'asia-south1 (Mumbai)' },
      { value: 'asia-southeast1', label: 'asia-southeast1 (Singapore)' },
    ],
  },

  azure: {
    name: 'Microsoft Azure Blob Storage',
    type: 'azure',
    endpointPattern: 'https://{account}.blob.core.windows.net',
    regions: [
      { value: 'eastus', label: 'East US' },
      { value: 'eastus2', label: 'East US 2' },
      { value: 'westus', label: 'West US' },
      { value: 'westus2', label: 'West US 2' },
      { value: 'centralus', label: 'Central US' },
      { value: 'northeurope', label: 'North Europe' },
      { value: 'westeurope', label: 'West Europe' },
      { value: 'eastasia', label: 'East Asia' },
      { value: 'southeastasia', label: 'Southeast Asia' },
      { value: 'japaneast', label: 'Japan East' },
      { value: 'japanwest', label: 'Japan West' },
      { value: 'australiaeast', label: 'Australia East' },
      { value: 'australiasoutheast', label: 'Australia Southeast' },
    ],
  },

  oracle: {
    name: 'Oracle Cloud Infrastructure',
    type: 'oracle',
    endpointPattern: 'https://{namespace}.compat.objectstorage.{region}.oraclecloud.com',
    requiresNamespace: true,
    regions: [
      { value: 'us-ashburn-1', label: 'us-ashburn-1 (Ashburn)' },
      { value: 'us-phoenix-1', label: 'us-phoenix-1 (Phoenix)' },
      { value: 'eu-amsterdam-1', label: 'eu-amsterdam-1 (Amsterdam)' },
      { value: 'eu-frankfurt-1', label: 'eu-frankfurt-1 (Frankfurt)' },
      { value: 'eu-zurich-1', label: 'eu-zurich-1 (Zurich)' },
      { value: 'ap-mumbai-1', label: 'ap-mumbai-1 (Mumbai)' },
      { value: 'ap-seoul-1', label: 'ap-seoul-1 (Seoul)' },
      { value: 'ap-sydney-1', label: 'ap-sydney-1 (Sydney)' },
      { value: 'ap-tokyo-1', label: 'ap-tokyo-1 (Tokyo)' },
      { value: 'ca-toronto-1', label: 'ca-toronto-1 (Toronto)' },
      { value: 'sa-saopaulo-1', label: 'sa-saopaulo-1 (São Paulo)' },
    ],
  },

  ibm: {
    name: 'IBM Cloud Object Storage',
    type: 'ibm',
    endpointPattern: 'https://s3.{region}.cloud-object-storage.appdomain.cloud',
    regions: [
      { value: 'us', label: 'Cross-Region US' },
      { value: 'eu', label: 'Cross-Region EU' },
      { value: 'ap', label: 'Cross-Region Asia-Pacific' },
      { value: 'us-south', label: 'us-south (Dallas)' },
      { value: 'us-east', label: 'us-east (Washington DC)' },
      { value: 'eu-gb', label: 'eu-gb (London)' },
      { value: 'eu-de', label: 'eu-de (Frankfurt)' },
      { value: 'jp-tok', label: 'jp-tok (Tokyo)' },
      { value: 'au-syd', label: 'au-syd (Sydney)' },
    ],
  },

  wasabi: {
    name: 'Wasabi',
    type: 'wasabi',
    endpointPattern: 'https://s3.{region}.wasabisys.com',
    regions: [
      { value: 'us-east-1', label: 'us-east-1 (N. Virginia)' },
      { value: 'us-east-2', label: 'us-east-2 (N. Virginia)' },
      { value: 'us-central-1', label: 'us-central-1 (Texas)' },
      { value: 'us-west-1', label: 'us-west-1 (Oregon)' },
      { value: 'eu-central-1', label: 'eu-central-1 (Amsterdam)' },
      { value: 'ap-northeast-1', label: 'ap-northeast-1 (Tokyo)' },
    ],
  },

  backblaze: {
    name: 'Backblaze B2',
    type: 'backblaze',
    endpointPattern: 'https://s3.{region}.backblazeb2.com',
    regions: [
      { value: 'us-west-001', label: 'us-west-001 (California)' },
      { value: 'us-west-002', label: 'us-west-002 (Arizona)' },
      { value: 'eu-central-003', label: 'eu-central-003 (Amsterdam)' },
    ],
  },

  scaleway: {
    name: 'Scaleway Object Storage',
    type: 'scaleway',
    endpointPattern: 'https://s3.{region}.scw.cloud',
    regions: [
      { value: 'fr-par', label: 'fr-par (Paris)' },
      { value: 'nl-ams', label: 'nl-ams (Amsterdam)' },
      { value: 'pl-waw', label: 'pl-waw (Warsaw)' },
    ],
  },

  vultr: {
    name: 'Vultr Object Storage',
    type: 'vultr',
    endpointPattern: 'https://{region}.vultrobjects.com',
    regions: [
      { value: 'ewr', label: 'ewr (New Jersey)' },
      { value: 'lax', label: 'lax (Los Angeles)' },
      { value: 'fra', label: 'fra (Frankfurt)' },
      { value: 'sgp', label: 'sgp (Singapore)' },
      { value: 'nrt', label: 'nrt (Tokyo)' },
      { value: 'syd', label: 'syd (Sydney)' },
    ],
  },

  linode: {
    name: 'Linode Object Storage',
    type: 'linode',
    endpointPattern: 'https://{clusterId}.linodeobjects.com',
    requiresClusterId: true,
    regions: [
      { value: 'us-east-1', label: 'us-east-1 (Newark)' },
      { value: 'eu-central-1', label: 'eu-central-1 (Frankfurt)' },
      { value: 'ap-south-1', label: 'ap-south-1 (Singapore)' },
    ],
  },
};

export function getProviderConfig(type: S3ProviderType): ProviderConfig {
  return PROVIDER_CONFIGS[type];
}

export function generateEndpoint(
  type: S3ProviderType,
  region?: string,
  accountId?: string,
  namespace?: string,
  clusterId?: string
): string {
  const config = getProviderConfig(type);
  let endpoint = config.endpointPattern;

  if (region) {
    endpoint = endpoint.replace('{region}', region);
  }
  if (accountId) {
    endpoint = endpoint.replace('{accountId}', accountId);
  }
  if (namespace) {
    endpoint = endpoint.replace('{namespace}', namespace);
  }
  if (clusterId) {
    endpoint = endpoint.replace('{clusterId}', clusterId);
  }

  return endpoint;
}
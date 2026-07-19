// S3-compatible storage providers for programmatic "GUI for <provider>" pages.
// Source: apps/app/s3-compatible-providers-research.md
// Every provider below speaks the S3 API, so Universal S3 Client connects to it
// via a custom endpoint + access key / secret key.

export type Provider = {
  slug: string;
  name: string;
  // Short marketing tagline shown in the hero subtitle.
  tagline: string;
  // Endpoint pattern the user points the app at.
  endpoint: string;
  // Human summary of regions / locations.
  regions: string;
  // Headline storage price.
  storage: string;
  // Egress / transfer note.
  egress: string;
  // 3 selling points for this provider (used as feature bullets).
  highlights: string[];
  // Whether the app ships first-class presets for it today (vs. custom endpoint).
  builtIn?: boolean;
};

export const providers: Provider[] = [
  {
    slug: 'aws-s3',
    name: 'AWS S3',
    tagline: 'The original object storage — 33 regions, deep IAM, the S3 API itself.',
    endpoint: 'https://s3.{region}.amazonaws.com',
    regions: '33 regions, from us-east-1 to us-gov-west-1',
    storage: 'from $0.023/GB/month (Standard)',
    egress: 'Egress billed per GB after the free tier',
    highlights: ['33 AWS regions out of the box', 'Full IAM & bucket policy support', 'The reference S3 implementation'],
    builtIn: true,
  },
  {
    slug: 'hetzner',
    name: 'Hetzner Object Storage',
    tagline: 'European object storage at Hetzner prices, S3-compatible.',
    endpoint: 'https://{location}.your-objectstorage.com',
    regions: 'Falkenstein (fsn1), Nuremberg (nbg1), Helsinki (hel1)',
    storage: 'Flat European pricing',
    egress: 'Generous included transfer',
    highlights: ['German/Finnish data centers', 'Low, predictable pricing', 'GDPR-friendly EU hosting'],
    builtIn: true,
  },
  {
    slug: 'cloudflare-r2',
    name: 'Cloudflare R2',
    tagline: 'Zero egress fees on a global edge network.',
    endpoint: 'https://{account-id}.r2.cloudflarestorage.com',
    regions: 'Auto-selected via location hints (wnam, enam, weur, eeur, apac, oc)',
    storage: '$0.015/GB/month',
    egress: 'Zero egress fees',
    highlights: ['No egress charges, ever', 'Global Cloudflare edge network', 'Simple, flat pricing'],
  },
  {
    slug: 'digitalocean-spaces',
    name: 'DigitalOcean Spaces',
    tagline: 'Developer-friendly object storage with a built-in CDN.',
    endpoint: 'https://{region}.digitaloceanspaces.com',
    regions: 'nyc3, ams3, sgp1, fra1, sfo3',
    storage: '$5/month for 250 GB + 1 TB transfer',
    egress: '1 TB transfer included, then $0.01/GB',
    highlights: ['Built-in CDN', 'Simple flat-rate pricing', 'Good regional coverage'],
  },
  {
    slug: 'google-cloud-storage',
    name: 'Google Cloud Storage',
    tagline: 'Enterprise-grade storage with global reach via the S3 XML API.',
    endpoint: 'https://storage.googleapis.com',
    regions: 'Multi-region (us, eu, asia) plus 20+ regional locations',
    storage: 'from $0.020/GB/month (Standard)',
    egress: 'Tiered egress pricing',
    highlights: ['Standard, Nearline, Coldline & Archive classes', 'Global infrastructure', 'S3 interoperability API'],
  },
  {
    slug: 'azure-blob',
    name: 'Azure Blob Storage',
    tagline: "Microsoft's object storage across 60+ regions.",
    endpoint: 'https://{account}.blob.core.windows.net',
    regions: '60+ regions (eastus, westeurope, southeastasia, …)',
    storage: 'from $0.018/GB/month (Hot)',
    egress: 'Tiered by access pattern',
    highlights: ['Hot, Cool, Cold & Archive tiers', 'Enterprise Azure integration', 'S3 compatibility layer'],
  },
  {
    slug: 'oracle-cloud',
    name: 'Oracle Cloud (OCI)',
    tagline: 'Full S3-compatible object storage for enterprise workloads.',
    endpoint: 'https://{namespace}.compat.objectstorage.{region}.oraclecloud.com',
    regions: 'Ashburn, Phoenix, Frankfurt, Zurich, Amsterdam, Mumbai, Tokyo, …',
    storage: 'from $0.025/GB/month (Standard)',
    egress: 'Large free egress allowance',
    highlights: ['Full S3 API compatibility', 'Namespace-based multi-tenancy', 'Infrequent Access & Archive tiers'],
  },
  {
    slug: 'ibm-cloud',
    name: 'IBM Cloud Object Storage',
    tagline: 'Resilient object storage with cross-region options.',
    endpoint: 'https://s3.{region}.cloud-object-storage.appdomain.cloud',
    regions: 'Cross-region (us, eu, ap) plus regional data centers',
    storage: 'from $0.023/GB/month (Standard)',
    egress: 'Tiered egress pricing',
    highlights: ['Standard, Vault, Cold Vault & Flex classes', 'Multiple resiliency options', 'Full S3 API compatibility'],
  },
  {
    slug: 'wasabi',
    name: 'Wasabi',
    tagline: 'Hot cloud storage with no egress fees and no API charges.',
    endpoint: 'https://s3.{region}.wasabisys.com',
    regions: 'us-east-1/2, us-central-1, us-west-1, eu-central-1, ap-northeast-1',
    storage: '$6.99/TB/month',
    egress: 'No egress fees, no API request charges',
    highlights: ['Flat $6.99/TB pricing', 'No egress or request fees', '90-day minimum retention'],
  },
  {
    slug: 'backblaze-b2',
    name: 'Backblaze B2',
    tagline: 'The cost-effective choice for backups and archives.',
    endpoint: 'https://s3.{region}.backblazeb2.com',
    regions: 'us-west-001, us-west-002, eu-central-003',
    storage: '$6/TB/month',
    egress: 'Free egress via the Cloudflare partnership',
    highlights: ['$6/TB storage', 'Free egress through Cloudflare', 'Native B2 and S3 APIs'],
  },
  {
    slug: 'scaleway',
    name: 'Scaleway Object Storage',
    tagline: 'European data sovereignty, S3-compatible.',
    endpoint: 'https://s3.{region}.scw.cloud',
    regions: 'fr-par (Paris), nl-ams (Amsterdam), pl-waw (Warsaw)',
    storage: 'from €0.0146/GB/month (Standard)',
    egress: 'Tiered egress pricing',
    highlights: ['European data sovereignty', 'Standard, Infrequent Access & Glacier', 'Full S3 API compatibility'],
  },
  {
    slug: 'vultr',
    name: 'Vultr Object Storage',
    tagline: 'S3-compatible storage next to Vultr compute.',
    endpoint: 'https://{region}.vultrobjects.com',
    regions: 'New Jersey (ewr), Los Angeles (lax), Frankfurt (fra), Singapore (sgp), …',
    storage: '$5/month for 250 GB + 1 TB transfer',
    egress: '1 TB transfer included',
    highlights: ['Co-located with Vultr compute', 'Simple monthly pricing', 'S3 API compatible'],
  },
  {
    slug: 'linode',
    name: 'Linode Object Storage',
    tagline: "Akamai's developer-focused object storage.",
    endpoint: 'https://{cluster-id}.linodeobjects.com',
    regions: 'Newark (us-east-1), Frankfurt (eu-central-1), Singapore (ap-south-1)',
    storage: '$5/month for 250 GB + 1 TB transfer',
    egress: '1 TB transfer included, then $0.02/GB',
    highlights: ['Backed by Akamai', 'Flat, predictable pricing', 'S3 API compatible'],
  },
];

export const getProvider = (slug: string) => providers.find((p) => p.slug === slug);

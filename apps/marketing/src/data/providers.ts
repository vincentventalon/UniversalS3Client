// S3-compatible storage providers for programmatic "GUI for <provider>" pages.
// Sources: apps/app/s3-compatible-providers-research.md and apps/app/src/config/providers.ts
// (the app's real preset list — keep both in sync when the app adds a provider).
// Prices are ballpark figures as of 2026 — always check the provider's pricing page.

export type ProviderFaq = { q: string; a: string };

export type ProviderGroup = 'hyperscaler' | 'independent' | 'selfhosted';

export type Provider = {
  slug: string;
  name: string;
  // Short tagline shown in the hero subtitle and directory cards.
  tagline: string;
  // Endpoint pattern the app generates or asks for.
  endpoint: string;
  // Human summary of regions / locations.
  regions: string;
  // Ballpark storage price.
  storage: string;
  // Egress / transfer note.
  egress: string;
  // 3 selling points for this provider.
  highlights: string[];
  // Credential fields the app asks for when adding this provider.
  authFields: string[];
  // Where access keys are created.
  consoleUrl: string;
  consoleName: string;
  // Provider-specific steps to create S3 credentials (rendered as numbered steps).
  keySteps: string[];
  // Gotchas worth knowing (empty array allowed).
  quirks: string[];
  // Per-provider FAQ, also emitted as FAQPage JSON-LD.
  faq: ProviderFaq[];
  // Slugs of 3 related providers, for internal linking.
  related: string[];
  // Grouping for the /gui directory page.
  group: ProviderGroup;
};

export const providers: Provider[] = [
  {
    slug: 'aws-s3',
    name: 'AWS S3',
    tagline: 'The original object storage — 33 regions, deep IAM, the S3 API itself.',
    endpoint: 'https://s3.{region}.amazonaws.com',
    regions: '33 regions, from us-east-1 to us-gov-west-1',
    storage: 'around $0.023/GB/month (Standard, 2026)',
    egress: 'billed per GB after a small free tier',
    highlights: [
      '33 AWS regions out of the box',
      'Full IAM & bucket policy support',
      'The reference S3 implementation',
    ],
    authFields: ['Access Key ID', 'Secret Access Key', 'Region'],
    consoleUrl: 'https://console.aws.amazon.com/iam/',
    consoleName: 'AWS IAM console',
    keySteps: [
      'Sign in to the AWS Console and open IAM.',
      'Create a dedicated IAM user (or pick an existing one) and attach an S3 policy — AmazonS3FullAccess, or a policy scoped to the buckets you want to manage.',
      'On the user’s "Security credentials" tab, choose "Create access key".',
      'Copy the Access Key ID and Secret Access Key into Universal S3 Client and pick your region.',
    ],
    quirks: [
      'Avoid using root account keys — create a scoped IAM user instead. The app works with any policy that allows ListAllMyBuckets, ListBucket and object read/write.',
    ],
    faq: [
      {
        q: 'Is there a free S3 browser for iPhone and Mac?',
        a: 'Yes. Universal S3 Client is a free, MIT-licensed S3 browser for iPhone, iPad and Apple Silicon Macs. It lists your buckets, uploads and downloads files, and generates presigned URLs — no subscription, no ads.',
      },
      {
        q: 'What AWS permissions does the app need?',
        a: 'An access key for an IAM user with s3:ListAllMyBuckets plus list/read/write permissions on the buckets you want to manage. Nothing outside S3 is ever called.',
      },
      {
        q: 'Which AWS regions are supported?',
        a: 'All 33 public regions, from us-east-1 to us-gov-west-1, are selectable in the app. The endpoint is built automatically as https://s3.{region}.amazonaws.com.',
      },
      {
        q: 'Where are my AWS keys stored?',
        a: 'In the device Keychain (iOS Secure Enclave-backed storage), encrypted on-device. The app has no backend and never transmits your credentials anywhere except to AWS itself.',
      },
    ],
    related: ['cloudflare-r2', 'google-cloud-storage', 'wasabi'],
    group: 'hyperscaler',
  },
  {
    slug: 'hetzner',
    name: 'Hetzner Object Storage',
    tagline: 'European object storage at Hetzner prices, S3-compatible.',
    endpoint: 'https://{location}.your-objectstorage.com',
    regions: 'Falkenstein (fsn1), Nuremberg (nbg1), Helsinki (hel1)',
    storage: 'flat European pricing with included storage quota',
    egress: 'generous included transfer',
    highlights: ['German/Finnish data centers', 'Low, predictable pricing', 'GDPR-friendly EU hosting'],
    authFields: ['Access Key ID', 'Secret Access Key', 'Location'],
    consoleUrl: 'https://console.hetzner.cloud/',
    consoleName: 'Hetzner Cloud Console',
    keySteps: [
      'Log in to the Hetzner Cloud Console and select your project.',
      'Open "Object Storage" in the sidebar and create a bucket in fsn1, nbg1 or hel1 if you don’t have one.',
      'Go to "Manage credentials" and generate a new access key / secret key pair.',
      'In Universal S3 Client, add Hetzner, pick the same location as your bucket and paste the keys.',
    ],
    quirks: [
      'Buckets live in one of three EU locations only (fsn1, nbg1, hel1) — the endpoint is location-specific, so pick the location that matches your bucket.',
      'Hetzner enforces newer S3 checksum behavior inconsistently; Universal S3 Client pins an SDK version that is verified to work with Hetzner uploads.',
    ],
    faq: [
      {
        q: 'Does Universal S3 Client work with Hetzner Object Storage?',
        a: 'Yes — Hetzner is a first-class preset. Pick your location (fsn1, nbg1 or hel1), paste your access keys, and the app builds the https://{location}.your-objectstorage.com endpoint for you.',
      },
      {
        q: 'Is there a Hetzner Object Storage app for iPhone?',
        a: 'Universal S3 Client is a free iPhone, iPad and Mac app that manages Hetzner buckets: browse folders, upload with progress, preview JSON/YAML/CSV files and share presigned links.',
      },
      {
        q: 'Why do some S3 tools fail to upload to Hetzner?',
        a: 'Newer AWS SDKs enforce payload checksums that Hetzner’s implementation rejects. This app ships with an SDK version tested against Hetzner, so uploads work out of the box.',
      },
      {
        q: 'Is Hetzner Object Storage GDPR-friendly?',
        a: 'Data stays in German or Finnish data centers under EU jurisdiction, which makes Hetzner a common choice for GDPR-sensitive workloads.',
      },
    ],
    related: ['scaleway', 'cloudflare-r2', 'minio'],
    group: 'independent',
  },
  {
    slug: 'cloudflare-r2',
    name: 'Cloudflare R2',
    tagline: 'Zero egress fees on a global edge network.',
    endpoint: 'https://{account-id}.r2.cloudflarestorage.com',
    regions: 'Auto-selected via location hints (wnam, enam, weur, eeur, apac, oc)',
    storage: 'around $0.015/GB/month (2026)',
    egress: 'zero egress fees',
    highlights: ['No egress charges, ever', 'Global Cloudflare edge network', 'Simple, flat pricing'],
    authFields: ['Cloudflare Account ID', 'Access Key ID', 'Secret Access Key'],
    consoleUrl: 'https://dash.cloudflare.com/',
    consoleName: 'Cloudflare dashboard',
    keySteps: [
      'Open the Cloudflare dashboard and go to R2.',
      'Click "Manage R2 API Tokens" and create a token with "Object Read & Write" permission.',
      'Cloudflare shows an Access Key ID and Secret Access Key for the token — copy both.',
      'Copy your Account ID (shown on the R2 overview page), then add Cloudflare R2 in Universal S3 Client with the account ID and the two keys.',
    ],
    quirks: [
      'R2 S3 credentials come from "R2 API Tokens", not from your global Cloudflare API key — a global key will not work.',
      'R2 has no regions: buckets use location hints (wnam, enam, weur, eeur, apac, oc) that only influence where data is first stored.',
    ],
    faq: [
      {
        q: 'Is there a GUI for Cloudflare R2 on iPhone and Mac?',
        a: 'Yes — Universal S3 Client connects to R2 through its S3-compatible API. It’s free and open source, and runs on iPhone, iPad and Apple Silicon Macs.',
      },
      {
        q: 'What credentials do I need to connect to R2?',
        a: 'Three things: your Cloudflare Account ID, plus the Access Key ID and Secret Access Key from an R2 API token with Object Read & Write permission. The app then builds the https://{account-id}.r2.cloudflarestorage.com endpoint.',
      },
      {
        q: 'Does R2 really have zero egress fees?',
        a: 'Yes — Cloudflare charges for storage and operations but not for data transfer out. That makes R2 popular for serving assets and for moving data between tools without transfer costs.',
      },
      {
        q: 'Can I share files from R2 with a link?',
        a: 'Yes. The app generates time-limited presigned URLs for any object, so you can share a file from an otherwise private R2 bucket directly from your phone.',
      },
    ],
    related: ['backblaze-b2', 'wasabi', 'aws-s3'],
    group: 'independent',
  },
  {
    slug: 'digitalocean-spaces',
    name: 'DigitalOcean Spaces',
    tagline: 'Developer-friendly object storage with a built-in CDN.',
    endpoint: 'https://{region}.digitaloceanspaces.com',
    regions: 'nyc3, ams3, sgp1, fra1, sfo3',
    storage: 'around $5/month for 250 GB included (2026)',
    egress: '1 TB transfer included, then per-GB',
    highlights: ['Built-in CDN at no extra cost', 'Simple flat-rate pricing', 'Five regions across three continents'],
    authFields: ['Access Key', 'Secret Key', 'Region'],
    consoleUrl: 'https://cloud.digitalocean.com/',
    consoleName: 'DigitalOcean control panel',
    keySteps: [
      'Log in to the DigitalOcean control panel.',
      'Open "API" in the left sidebar, then the "Spaces Keys" tab.',
      'Click "Generate New Key", name it, and copy the access key and secret shown once.',
      'Add DigitalOcean Spaces in Universal S3 Client, choose the region of your Space and paste the keys.',
    ],
    quirks: [
      'Spaces keys are separate from DigitalOcean personal access tokens — API tokens for droplets won’t work with the S3 API.',
    ],
    faq: [
      {
        q: 'Can I manage DigitalOcean Spaces from my iPhone?',
        a: 'Yes — Universal S3 Client is a free app for iPhone, iPad and Mac that browses your Spaces, uploads and downloads files, and previews JSON, YAML, CSV and images inline.',
      },
      {
        q: 'What keys do I need for Spaces?',
        a: 'A Spaces access key pair, generated under API → Spaces Keys in the control panel. Personal access tokens (used for droplets) do not work with the S3-compatible Spaces API.',
      },
      {
        q: 'Which Spaces regions are supported?',
        a: 'All five: nyc3, ams3, sgp1, fra1 and sfo3. The app builds the https://{region}.digitaloceanspaces.com endpoint from your selection.',
      },
      {
        q: 'Is the app really free — no premium tier?',
        a: 'Completely free: no in-app purchases, no ads, no account. The source code is MIT-licensed on GitHub.',
      },
    ],
    related: ['vultr', 'linode', 'cloudflare-r2'],
    group: 'independent',
  },
  {
    slug: 'google-cloud-storage',
    name: 'Google Cloud Storage',
    tagline: 'Enterprise-grade storage, reachable over the S3-compatible XML API.',
    endpoint: 'https://storage.googleapis.com',
    regions: '37 regions plus us/eu/asia multi-regions',
    storage: 'around $0.020/GB/month (Standard, 2026)',
    egress: 'tiered per-GB pricing',
    highlights: ['One endpoint for every region', 'Storage classes down to Archive', 'Multi-regional replication'],
    authFields: ['HMAC Access Key', 'HMAC Secret'],
    consoleUrl: 'https://console.cloud.google.com/storage/settings',
    consoleName: 'Google Cloud Console',
    keySteps: [
      'Open the Google Cloud Console and go to Cloud Storage → Settings.',
      'Select the "Interoperability" tab — this is Google’s S3-compatible XML API.',
      'Create an HMAC key for a service account (recommended) or for your user account.',
      'Copy the HMAC access key and secret into Universal S3 Client — the endpoint is always https://storage.googleapis.com.',
    ],
    quirks: [
      'GCS speaks S3 through its XML "interoperability" API: you authenticate with HMAC keys, not with service-account JSON files or OAuth.',
      'The service account behind the HMAC key needs Storage Object Admin (or equivalent) on the buckets you want to manage.',
    ],
    faq: [
      {
        q: 'Does Google Cloud Storage work with S3 clients?',
        a: 'Yes, through its XML interoperability API. Create an HMAC key in Cloud Storage settings and any S3 client — including Universal S3 Client on iPhone, iPad and Mac — can list buckets, upload and download objects.',
      },
      {
        q: 'Do I need a service account JSON file?',
        a: 'No. The S3-compatible path uses HMAC keys (an access key and secret, like AWS). You create them on the Interoperability tab of Cloud Storage settings, ideally bound to a service account.',
      },
      {
        q: 'Which endpoint do I use for GCS?',
        a: 'Always https://storage.googleapis.com, regardless of the bucket’s region — Google routes requests to the right location.',
      },
      {
        q: 'Can I preview files stored in GCS from my phone?',
        a: 'Yes — Universal S3 Client previews and edits JSON, YAML, CSV and text files in place, and shows image thumbnails, straight from your GCS buckets.',
      },
    ],
    related: ['aws-s3', 'azure-blob', 'oracle-cloud'],
    group: 'hyperscaler',
  },
  {
    slug: 'azure-blob',
    name: 'Azure Blob Storage',
    tagline: 'Microsoft’s object storage, connected via your storage account.',
    endpoint: 'https://{account}.blob.core.windows.net',
    regions: '60+ Azure regions worldwide',
    storage: 'around $0.018/GB/month (Hot, 2026)',
    egress: 'tiered per-GB pricing',
    highlights: ['60+ regions worldwide', 'Hot / Cool / Cold / Archive tiers', 'Deep Microsoft ecosystem integration'],
    authFields: ['Storage account name', 'Access key'],
    consoleUrl: 'https://portal.azure.com/',
    consoleName: 'Azure Portal',
    keySteps: [
      'Sign in to the Azure Portal and open your storage account.',
      'Under "Security + networking", open "Access keys".',
      'Click "Show keys" and copy the storage account name and one of the two access keys.',
      'Add Azure in Universal S3 Client with the account name and key.',
    ],
    quirks: [
      'Azure Blob Storage does not expose a native S3 API — the app’s Azure preset targets your storage account’s Blob endpoint, and S3-style compatibility is more limited than on true S3 providers. Treat it as best-effort and verify your workflow.',
    ],
    faq: [
      {
        q: 'Is Azure Blob Storage S3-compatible?',
        a: 'Not natively — Azure has its own Blob API. Universal S3 Client ships an Azure preset that connects with your storage account name and access key, but compatibility is more limited than with true S3 providers like AWS or R2.',
      },
      {
        q: 'What credentials does the Azure preset use?',
        a: 'Your storage account name and one of its access keys, both found under Access keys in the Azure Portal. The endpoint becomes https://{account}.blob.core.windows.net.',
      },
      {
        q: 'Should I use Azure or an S3-native provider with this app?',
        a: 'If you’re choosing storage specifically to manage it from this app, an S3-native provider (AWS, R2, Wasabi, B2…) will give you the most complete experience. The Azure preset exists for users who already have data in Azure.',
      },
      {
        q: 'Are my Azure keys stored securely?',
        a: 'Keys are encrypted in the device Keychain and never leave your device — the app has no backend and no analytics.',
      },
    ],
    related: ['google-cloud-storage', 'aws-s3', 'ibm-cloud'],
    group: 'hyperscaler',
  },
  {
    slug: 'oracle-cloud',
    name: 'Oracle Cloud (OCI)',
    tagline: 'Full S3 compatibility on Oracle Cloud Infrastructure.',
    endpoint: 'https://{namespace}.compat.objectstorage.{region}.oraclecloud.com',
    regions: 'Ashburn, Phoenix, Frankfurt, Zurich, Tokyo and more',
    storage: 'around $0.025/GB/month (Standard, 2026)',
    egress: 'large free monthly allowance',
    highlights: ['Dedicated S3 compatibility endpoint', 'Generous free egress allowance', 'Archive tier for cold data'],
    authFields: ['Object Storage namespace', 'Access Key', 'Secret Key', 'Region'],
    consoleUrl: 'https://cloud.oracle.com/',
    consoleName: 'OCI Console',
    keySteps: [
      'Sign in to the OCI Console, open your profile menu and choose "User settings".',
      'Under "Customer secret keys", click "Generate secret key" — this creates an S3-style access key and secret.',
      'Find your Object Storage namespace under Governance & Administration → Tenancy details.',
      'Add Oracle in Universal S3 Client with the namespace, region and both keys.',
    ],
    quirks: [
      'S3 credentials on OCI are called "Customer Secret Keys" — regular OCI API signing keys will not work with the S3 compatibility endpoint.',
      'The endpoint embeds your tenancy’s Object Storage namespace, so the app asks for it explicitly.',
    ],
    faq: [
      {
        q: 'Does OCI Object Storage work with S3 clients?',
        a: 'Yes — OCI exposes a dedicated S3 compatibility endpoint per region. Universal S3 Client builds it from your namespace and region: https://{namespace}.compat.objectstorage.{region}.oraclecloud.com.',
      },
      {
        q: 'What are Customer Secret Keys?',
        a: 'OCI’s name for S3-style credentials: an access key and secret generated under User settings → Customer secret keys. They are separate from OCI’s native API signing keys.',
      },
      {
        q: 'Where do I find my Object Storage namespace?',
        a: 'In the OCI Console under Tenancy details — it’s a short auto-generated string that identifies your tenancy and is part of the S3 endpoint.',
      },
      {
        q: 'Is there a free OCI Object Storage app for iPhone?',
        a: 'Universal S3 Client is free and open source, and manages OCI buckets from iPhone, iPad and Mac: browse, upload, download, rename and share via presigned URLs.',
      },
    ],
    related: ['ibm-cloud', 'aws-s3', 'google-cloud-storage'],
    group: 'hyperscaler',
  },
  {
    slug: 'ibm-cloud',
    name: 'IBM Cloud Object Storage',
    tagline: 'Resilient object storage with cross-region options.',
    endpoint: 'https://s3.{region}.cloud-object-storage.appdomain.cloud',
    regions: 'Cross-region (us, eu, ap) plus regional endpoints',
    storage: 'around $0.023/GB/month (Standard, 2026)',
    egress: 'tiered per-GB pricing',
    highlights: ['Cross-region resiliency options', 'Vault & Cold Vault tiers', 'Full S3 API compatibility'],
    authFields: ['HMAC Access Key', 'HMAC Secret', 'Region'],
    consoleUrl: 'https://cloud.ibm.com/',
    consoleName: 'IBM Cloud console',
    keySteps: [
      'Open your Cloud Object Storage instance in the IBM Cloud console.',
      'Go to "Service credentials" and click "New credential".',
      'Enable the "Include HMAC Credential" toggle (this adds S3-style keys) and create the credential.',
      'Expand the credential JSON, copy access_key_id and secret_access_key from cos_hmac_keys, and add IBM in Universal S3 Client.',
    ],
    quirks: [
      'By default IBM service credentials only contain an API key, which S3 clients cannot use — you must enable "Include HMAC Credential" when creating the credential to get S3-style keys.',
    ],
    faq: [
      {
        q: 'How do I get S3 credentials for IBM Cloud Object Storage?',
        a: 'Create a service credential on your COS instance with the "Include HMAC Credential" option enabled. The resulting JSON contains cos_hmac_keys with an access_key_id and secret_access_key that any S3 client can use.',
      },
      {
        q: 'What’s the difference between regional and cross-region storage?',
        a: 'Regional buckets live in one location (like us-south); cross-region buckets (us, eu, ap) replicate across several data centers for resiliency. Both are reachable through the same S3 endpoint pattern.',
      },
      {
        q: 'Can I browse IBM COS buckets from an iPhone?',
        a: 'Yes — Universal S3 Client lists your buckets and objects, uploads with progress, and previews structured files, all from iPhone, iPad or Mac. It’s free and open source.',
      },
      {
        q: 'Does the app support IBM’s storage tiers?',
        a: 'The app manages objects over the S3 API regardless of the bucket’s tier (Standard, Vault, Cold Vault). Tier selection itself is done in the IBM console when creating the bucket.',
      },
    ],
    related: ['oracle-cloud', 'azure-blob', 'aws-s3'],
    group: 'hyperscaler',
  },
  {
    slug: 'wasabi',
    name: 'Wasabi',
    tagline: 'Hot cloud storage with no egress fees.',
    endpoint: 'https://s3.{region}.wasabisys.com',
    regions: 'us-east, us-central, us-west, eu-central, ap-northeast',
    storage: 'around $6.99/TB/month (2026)',
    egress: 'no egress fees, no API request charges',
    highlights: ['Flat $/TB pricing', 'No egress or API charges', 'S3-compatible hot storage'],
    authFields: ['Access Key', 'Secret Key', 'Region'],
    consoleUrl: 'https://console.wasabisys.com/',
    consoleName: 'Wasabi console',
    keySteps: [
      'Log in to the Wasabi console.',
      'Open "Access Keys" in the menu and click "Create New Access Key".',
      'Choose whether the key is for your root user or a sub-user, then copy the key pair.',
      'Add Wasabi in Universal S3 Client, pick your bucket’s region and paste the keys.',
    ],
    quirks: [
      'Wasabi bills deleted objects for a 90-day minimum retention period — cheap for storage you keep, less ideal for rapidly-churning data.',
      'Egress is free under a fair-use policy sized to your stored volume.',
    ],
    faq: [
      {
        q: 'Is there a Wasabi client for iPhone and Mac?',
        a: 'Yes — Universal S3 Client connects to Wasabi’s S3 API from iPhone, iPad and Apple Silicon Macs. Free, open source, no account needed.',
      },
      {
        q: 'Why is Wasabi so much cheaper than S3?',
        a: 'Wasabi charges a flat rate per TB (around $7/TB/month) with no egress or API request fees, but bills a 90-day minimum retention on deleted data. For hot data you keep around, it often undercuts AWS significantly.',
      },
      {
        q: 'Which Wasabi regions does the app support?',
        a: 'All public regions: us-east-1/2, us-central-1, us-west-1, eu-central-1 and ap-northeast-1, using the https://s3.{region}.wasabisys.com endpoint.',
      },
      {
        q: 'Can I share Wasabi files with someone without an account?',
        a: 'Yes — generate a time-limited presigned URL in the app and send it. The link works for anyone until it expires.',
      },
    ],
    related: ['backblaze-b2', 'cloudflare-r2', 'idrive-e2'],
    group: 'independent',
  },
  {
    slug: 'backblaze-b2',
    name: 'Backblaze B2',
    tagline: 'Cost-effective storage with an S3-compatible API.',
    endpoint: 'https://s3.{region}.backblazeb2.com',
    regions: 'us-west-001, us-west-002, eu-central-003',
    storage: 'around $6/TB/month (2026)',
    egress: 'free daily allowance, free via Cloudflare',
    highlights: ['Among the lowest $/TB prices', 'Free egress through Cloudflare', 'Native and S3 APIs side by side'],
    authFields: ['Application Key ID', 'Application Key', 'Region'],
    consoleUrl: 'https://secure.backblaze.com/',
    consoleName: 'Backblaze account',
    keySteps: [
      'Log in to your Backblaze account and open "Application Keys".',
      'Click "Add a New Application Key" — scope it to a single bucket or all buckets.',
      'Copy the keyID and applicationKey shown once; the S3 endpoint for your account (with its region) is shown on the same screen.',
      'Add Backblaze in Universal S3 Client with the key pair and your region.',
    ],
    quirks: [
      'The master application key does not work with the S3-compatible API — create a standard application key instead.',
      'Very old B2 buckets (created before the S3 API existed) may not be reachable over S3; recreating the bucket fixes it.',
    ],
    faq: [
      {
        q: 'Does Backblaze B2 work with S3 apps?',
        a: 'Yes — B2 exposes an S3-compatible endpoint per region (https://s3.{region}.backblazeb2.com). Universal S3 Client connects with a standard application key from iPhone, iPad or Mac.',
      },
      {
        q: 'Why doesn’t my B2 master key work?',
        a: 'Backblaze’s master application key is excluded from the S3-compatible API by design. Create a new application key under Application Keys — those work with any S3 client.',
      },
      {
        q: 'How do I find my B2 region?',
        a: 'It’s embedded in the S3 endpoint shown next to your application keys — for example us-west-002 or eu-central-003. Pick the same region when adding B2 in the app.',
      },
      {
        q: 'Is B2 good for backups managed from a phone?',
        a: 'B2’s low storage price makes it popular for backups, and the app lets you verify, browse and retrieve backup files on the go — including previewing config files and downloading archives.',
      },
    ],
    related: ['wasabi', 'cloudflare-r2', 'idrive-e2'],
    group: 'independent',
  },
  {
    slug: 'scaleway',
    name: 'Scaleway Object Storage',
    tagline: 'European data sovereignty with full S3 compatibility.',
    endpoint: 'https://s3.{region}.scw.cloud',
    regions: 'fr-par (Paris), nl-ams (Amsterdam), pl-waw (Warsaw)',
    storage: 'around €0.0146/GB/month (Standard, 2026)',
    egress: 'tiered per-GB pricing',
    highlights: ['French/EU cloud provider', 'Glacier tier for archives', 'Straightforward S3 API'],
    authFields: ['Access Key', 'Secret Key', 'Region'],
    consoleUrl: 'https://console.scaleway.com/',
    consoleName: 'Scaleway console',
    keySteps: [
      'Log in to the Scaleway console.',
      'Open IAM (top-right menu) → "API keys" and generate a new API key.',
      'Copy the access key and secret key — these double as S3 credentials.',
      'Add Scaleway in Universal S3 Client, choose fr-par, nl-ams or pl-waw and paste the keys.',
    ],
    quirks: [
      'Scaleway IAM API keys are also the S3 credentials — there is no separate S3 key type. Scope the key’s IAM policy to Object Storage if you want least privilege.',
    ],
    faq: [
      {
        q: 'Is there a Scaleway Object Storage app for iPhone?',
        a: 'Universal S3 Client manages Scaleway buckets from iPhone, iPad and Mac over the S3 API — browse, upload, preview and share. It’s free and MIT-licensed.',
      },
      {
        q: 'Which credentials work with Scaleway’s S3 API?',
        a: 'Your IAM API key: the access key and secret key generated in the console’s IAM section. The app builds the https://s3.{region}.scw.cloud endpoint from your region choice.',
      },
      {
        q: 'Why choose an EU provider like Scaleway?',
        a: 'Data stays in Paris, Amsterdam or Warsaw under EU jurisdiction — a common requirement for GDPR-sensitive projects and public-sector work.',
      },
      {
        q: 'Does the app track what I store?',
        a: 'No. There is no backend, no analytics and no account — the app talks directly from your device to Scaleway’s endpoint, and credentials stay in the device Keychain.',
      },
    ],
    related: ['hetzner', 'cloudflare-r2', 'minio'],
    group: 'independent',
  },
  {
    slug: 'vultr',
    name: 'Vultr Object Storage',
    tagline: 'S3-compatible storage next to your Vultr compute.',
    endpoint: 'https://{region}.vultrobjects.com',
    regions: 'ewr, lax, fra, sgp, nrt, syd',
    storage: 'from around $5/month with included quota (2026)',
    egress: 'included transfer, then per-GB',
    highlights: ['Six regions on three continents', 'Flat monthly base pricing', 'Lives next to Vultr instances'],
    authFields: ['Access Key', 'Secret Key', 'Region'],
    consoleUrl: 'https://my.vultr.com/',
    consoleName: 'Vultr customer portal',
    keySteps: [
      'Log in to the Vultr customer portal and open Products → Object Storage.',
      'Create an object storage subscription in your preferred region if you don’t have one.',
      'Open the subscription’s "Overview" tab — the S3 hostname, access key and secret key are listed there.',
      'Add Vultr in Universal S3 Client with the matching region and the key pair.',
    ],
    quirks: [
      'Credentials are per object-storage subscription (per region), not account-wide — each subscription has its own key pair.',
    ],
    faq: [
      {
        q: 'Does Universal S3 Client support Vultr Object Storage?',
        a: 'Yes — Vultr is a built-in preset. Pick your region (ewr, lax, fra, sgp, nrt or syd), paste the subscription’s keys, and browse your buckets from iPhone, iPad or Mac.',
      },
      {
        q: 'Where do I find my Vultr S3 keys?',
        a: 'On the Overview tab of your object storage subscription in the Vultr portal — it lists the S3 hostname, access key and secret key together.',
      },
      {
        q: 'Can I use one key pair for all Vultr regions?',
        a: 'No — each object storage subscription is tied to a region and has its own credentials. Add each subscription as a separate connection in the app.',
      },
      {
        q: 'What can I do with my buckets from the app?',
        a: 'List and create folders, upload with progress, download, rename, copy, delete (including recursive folder deletes), preview JSON/YAML/CSV/text files and share presigned URLs.',
      },
    ],
    related: ['linode', 'digitalocean-spaces', 'wasabi'],
    group: 'independent',
  },
  {
    slug: 'linode',
    name: 'Linode Object Storage',
    tagline: 'Akamai’s developer-focused S3-compatible storage.',
    endpoint: 'https://{cluster-id}.linodeobjects.com',
    regions: 'Newark, Frankfurt, Singapore',
    storage: 'from around $5/month with included quota (2026)',
    egress: '1 TB included, then per-GB',
    highlights: ['Part of Akamai’s cloud platform', 'Simple flat base price', 'Cluster-based endpoints'],
    authFields: ['Cluster ID', 'Access Key', 'Secret Key'],
    consoleUrl: 'https://cloud.linode.com/',
    consoleName: 'Linode Cloud Manager',
    keySteps: [
      'Log in to Linode Cloud Manager and open "Object Storage".',
      'Switch to the "Access Keys" tab and click "Create Access Key".',
      'Optionally limit the key to specific buckets, then copy the access key and secret key.',
      'Add Linode in Universal S3 Client with your cluster ID (for example us-east-1) and the key pair.',
    ],
    quirks: [
      'Endpoints are cluster-based, not region-named: the cluster ID (like us-east-1 or eu-central-1) is part of the hostname, and the app asks for it explicitly.',
    ],
    faq: [
      {
        q: 'How do I connect an S3 client to Linode Object Storage?',
        a: 'Create an access key under Object Storage → Access Keys in Cloud Manager, then point the client at https://{cluster-id}.linodeobjects.com. Universal S3 Client builds that endpoint from the cluster ID you enter.',
      },
      {
        q: 'What is a Linode cluster ID?',
        a: 'The identifier of the data center hosting your buckets — us-east-1 (Newark), eu-central-1 (Frankfurt) or ap-south-1 (Singapore). It’s shown next to each bucket in Cloud Manager.',
      },
      {
        q: 'Is there a free Linode storage browser for iOS?',
        a: 'Yes — Universal S3 Client is free and open source, and manages Linode buckets from iPhone, iPad and Apple Silicon Macs.',
      },
      {
        q: 'Can I restrict what the app can access?',
        a: 'Yes — Linode access keys can be limited to specific buckets with read or read/write permissions when you create them. The app works with any scope that allows listing and object access.',
      },
    ],
    related: ['vultr', 'digitalocean-spaces', 'backblaze-b2'],
    group: 'independent',
  },
  {
    slug: 'minio',
    name: 'MinIO',
    tagline: 'The self-hosted S3 standard — your server, your data.',
    endpoint: 'https://{your-minio-host}',
    regions: 'Wherever you run it — bare metal, VPS, Kubernetes or NAS',
    storage: 'free and open source (your own hardware)',
    egress: 'whatever your server’s bandwidth costs',
    highlights: [
      'Fully self-hosted, no vendor lock-in',
      'The de-facto S3 reference outside AWS',
      'Runs on anything from a NAS to Kubernetes',
    ],
    authFields: ['Server endpoint (URL)', 'Access Key', 'Secret Key'],
    consoleUrl: 'https://min.io/docs/minio/linux/administration/console.html',
    consoleName: 'MinIO Console',
    keySteps: [
      'Open your MinIO Console (typically on port 9001) and log in.',
      'Go to "Access Keys" and click "Create access key" — this issues an S3 key pair tied to your user’s policies.',
      'Copy the access key and secret key.',
      'Add MinIO in Universal S3 Client and enter your server’s S3 endpoint (typically port 9000, e.g. https://minio.example.com:9000) with the keys.',
    ],
    quirks: [
      'The endpoint must be reachable over HTTPS with a valid certificate — iOS blocks plain HTTP and self-signed certificates by default, so put MinIO behind TLS (Let’s Encrypt or a reverse proxy).',
      'The S3 API usually listens on port 9000; the web console on 9001. The app talks to the API port.',
    ],
    faq: [
      {
        q: 'Is there an iPhone client for MinIO?',
        a: 'Yes — Universal S3 Client connects to any MinIO deployment over its S3 API. Enter your server’s endpoint and an access key, and browse your buckets from iPhone, iPad or Mac.',
      },
      {
        q: 'Why can’t the app reach my MinIO server?',
        a: 'The most common cause is TLS: iOS requires HTTPS with a valid certificate, so plain HTTP or self-signed MinIO endpoints are blocked by the system. Terminate TLS with a proper certificate and it works.',
      },
      {
        q: 'Which credentials should I use — root or an access key?',
        a: 'Create a dedicated access key in the MinIO Console rather than using the root user. Keys inherit the policies of the user that created them, so you can scope access per bucket.',
      },
      {
        q: 'Does this work with MinIO running on my NAS?',
        a: 'Yes, as long as the S3 endpoint is reachable from your device over HTTPS — many users run MinIO on Synology/TrueNAS boxes and manage it remotely with the app.',
      },
    ],
    related: ['hetzner', 'idrive-e2', 'scaleway'],
    group: 'selfhosted',
  },
  {
    slug: 'idrive-e2',
    name: 'IDrive e2',
    tagline: 'Aggressively priced S3-compatible storage from IDrive.',
    endpoint: 'https://{your-e2-endpoint}',
    regions: 'US, EU and Asia regions — endpoint assigned per account',
    storage: 'low flat $/TB pricing (2026)',
    egress: 'free egress allowance tied to stored volume',
    highlights: ['Among the cheapest $/TB offers', 'Regions across US, EU and Asia', 'Straightforward S3 API'],
    authFields: ['Endpoint (from dashboard)', 'Access Key', 'Secret Key'],
    consoleUrl: 'https://app.idrivee2.com/',
    consoleName: 'IDrive e2 dashboard',
    keySteps: [
      'Log in to the IDrive e2 dashboard.',
      'Open "Access Keys" and create a new access key for your region.',
      'Note the endpoint shown with the key — e2 endpoints are assigned per region and account (copy it exactly).',
      'Add IDrive e2 in Universal S3 Client using that endpoint and the key pair.',
    ],
    quirks: [
      'There is no single global endpoint — each region (and sometimes account) gets its own hostname, so always copy the endpoint from the dashboard rather than guessing it.',
    ],
    faq: [
      {
        q: 'Does IDrive e2 work with standard S3 clients?',
        a: 'Yes — e2 implements the S3 API. Copy the endpoint and access keys from your e2 dashboard into Universal S3 Client and manage your buckets from iPhone, iPad or Mac.',
      },
      {
        q: 'What endpoint do I enter for e2?',
        a: 'The one shown next to your access key in the e2 dashboard. Endpoints are per-region and per-account, so there is no universal hostname to memorize.',
      },
      {
        q: 'Is e2 a good Wasabi/B2 alternative?',
        a: 'It plays in the same league: flat low $/TB pricing with an egress allowance. If you already use IDrive backup products, e2 keeps everything under one account.',
      },
      {
        q: 'Is the app safe for storing e2 credentials?',
        a: 'Credentials are encrypted in the device Keychain and only ever sent to your e2 endpoint. The app has no server side at all.',
      },
    ],
    related: ['wasabi', 'backblaze-b2', 'minio'],
    group: 'independent',
  },
];

export function getProvider(slug: string): Provider | undefined {
  return providers.find((p) => p.slug === slug);
}

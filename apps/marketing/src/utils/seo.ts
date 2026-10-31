// Local replacement for the abandoned @astrolib/seo: same tags, same order, limited to what MetaData can carry.

export interface OpenGraphImage {
  url: string;
  width?: number;
  height?: number;
}

export interface OpenGraph {
  url?: string;
  type?: string;
  title?: string;
  description?: string;
  images?: ReadonlyArray<OpenGraphImage>;
  locale?: string;
  site_name?: string;
}

export interface SeoProps {
  title?: string;
  titleTemplate?: string;
  noindex?: boolean;
  nofollow?: boolean;
  description?: string;
  canonical?: string;
  openGraph?: OpenGraph;
  twitter?: {
    handle?: string;
    site?: string;
    cardType?: string;
  };
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' };
const escape = (value: string) => value.replace(/[&<>'"]/g, (char) => ESCAPES[char]);

const tag = (name: 'meta' | 'link', attributes: Record<string, string>) =>
  `<${name} ${Object.entries(attributes)
    .map(([key, value]) => `${key}="${escape(value)}"`)
    .join(' ')}>`;

const og = (property: string, content: string) => tag('meta', { property: `og:${property}`, content });

export const buildSeoTags = (config: SeoProps): string => {
  const tags: string[] = [];

  if (config.title) {
    const title = config.titleTemplate ? config.titleTemplate.replace('%s', config.title) : config.title;
    tags.push(`<title>${escape(title)}</title>`);
  }

  if (config.description) {
    tags.push(tag('meta', { name: 'description', content: config.description }));
  }

  const robots: string[] = [];
  if (typeof config.noindex !== 'undefined') robots.push(config.noindex ? 'noindex' : 'index');
  if (typeof config.nofollow !== 'undefined') robots.push(config.nofollow ? 'nofollow' : 'follow');
  if (robots.length > 0) {
    tags.push(tag('meta', { name: 'robots', content: robots.join(',') }));
  }

  if (config.canonical) {
    tags.push(tag('link', { rel: 'canonical', href: config.canonical }));
  }

  const { openGraph, twitter } = config;
  if (openGraph) {
    const title = openGraph.title || config.title;
    if (title) tags.push(og('title', title));

    const description = openGraph.description || config.description;
    if (description) tags.push(og('description', description));

    if (openGraph.url) tags.push(og('url', openGraph.url));
    if (openGraph.type) tags.push(og('type', openGraph.type));

    for (const image of openGraph.images ?? []) {
      tags.push(og('image', image.url));
      if (image.width) tags.push(og('image:width', image.width.toString()));
      if (image.height) tags.push(og('image:height', image.height.toString()));
    }

    if (openGraph.locale) tags.push(og('locale', openGraph.locale));
    if (openGraph.site_name) tags.push(og('site_name', openGraph.site_name));
  }

  if (twitter) {
    if (twitter.cardType) tags.push(tag('meta', { name: 'twitter:card', content: twitter.cardType }));
    if (twitter.site) tags.push(tag('meta', { name: 'twitter:site', content: twitter.site }));
    if (twitter.handle) tags.push(tag('meta', { name: 'twitter:creator', content: twitter.handle }));
  }

  return tags.join('\n');
};

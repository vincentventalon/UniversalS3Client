import path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import { unified } from '@astrojs/markdown-remark';
import icon from 'astro-icon';
import compress from 'astro-compress';
import type { AstroIntegration } from 'astro';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

import astrowind from './vendor/integration';

import { readingTimeRemarkPlugin, responsiveTablesRehypePlugin, lazyImagesRehypePlugin } from './src/utils/frontmatter';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const hasExternalScripts = false;
const whenExternalScripts = (items: (() => AstroIntegration) | (() => AstroIntegration)[] = []) =>
  hasExternalScripts ? (Array.isArray(items) ? items.map((item) => item()) : [items()]) : [];

export default defineConfig({
  output: 'static',

  // Astro 7 defaults to 'jsx' whitespace rules, which would change the visible text.
  compressHTML: true,

  integrations: [
    sitemap(),
    mdx(),
    icon({
      include: {
        tabler: ['*'],
        'flat-color-icons': [
          'template',
          'gallery',
          'approval',
          'document',
          'advertising',
          'currency-exchange',
          'voice-presentation',
          'business-contact',
          'database',
        ],
      },
    }),

    ...whenExternalScripts(() =>
      partytown({
        config: { forward: ['dataLayer.push'] },
      })
    ),

    compress({
      CSS: true,
      HTML: {
        'html-minifier-terser': {
          removeAttributeQuotes: false,
        },
      },
      Image: false,
      JavaScript: true,
      SVG: false,
      Logger: 1,
    }),

    astrowind({
      config: './src/config.yaml',
    }),
  ],

  image: {
    domains: ['cdn.pixabay.com'],
  },

  markdown: {
    // Astro 7's default processor (Sätteri) doesn't run unified remark/rehype plugins.
    processor: unified({
      remarkPlugins: [readingTimeRemarkPlugin],
      rehypePlugins: [responsiveTablesRehypePlugin, lazyImagesRehypePlugin],
    }),
  },

  vite: {
    build: {
      // Same CSS minifier and target as before Astro 7. Vite 8's default (Lightning CSS) rounds lengths (1px shifts),
      // strips prefixes, and writes `@media (width>=...)`, which the csso step of astro-compress silently deletes.
      // Without this target, esbuild drops -webkit-backdrop-filter, still needed by Safari before 18.
      cssMinify: 'esbuild',
      cssTarget: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    },
    // @astrojs/tailwind is capped at Astro 5: Tailwind v3 now runs as a plain PostCSS plugin.
    css: {
      postcss: {
        plugins: [tailwindcss(), autoprefixer()],
      },
    },
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },
    },
  },
});

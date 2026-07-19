import { getPermalink, getBlogPermalink } from './utils/permalinks';
import { APP_STORE_URL, GITHUB_URL } from './data/links';

export const headerData = {
  links: [
    {
      text: 'Providers',
      href: getPermalink('/gui'),
    },
    {
      text: 'Blog',
      href: getBlogPermalink(),
    },
  ],
  actions: [{ text: 'Download', href: APP_STORE_URL, target: '_blank' }],
};

export const footerData = {
  links: [
    {
      title: 'Product',
      links: [
        { text: 'Download on the App Store', href: APP_STORE_URL },
        { text: 'Source code on GitHub', href: GITHUB_URL },
      ],
    },
    {
      title: 'Site',
      links: [
        { text: 'Providers', href: '/gui' },
        { text: 'Blog', href: '/blog' },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Terms', href: getPermalink('/terms') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],
  socialLinks: [
    { ariaLabel: 'X', icon: 'tabler:brand-x', href: 'https://x.com/VincentVentalon' },
    { ariaLabel: 'GitHub', icon: 'tabler:brand-github', href: GITHUB_URL },
  ],
  footNote: `
Made by <a class="text-primary underline" href="https://vincentventalon.com/">Vincent Ventalon</a> · MIT licensed
  `,
};

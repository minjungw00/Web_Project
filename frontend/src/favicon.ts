import android144 from './assets/favicon/android-icon-144x144.png';
import android192 from './assets/favicon/android-icon-192x192.png';
import android36 from './assets/favicon/android-icon-36x36.png';
import android48 from './assets/favicon/android-icon-48x48.png';
import android72 from './assets/favicon/android-icon-72x72.png';
import android96 from './assets/favicon/android-icon-96x96.png';
import apple114 from './assets/favicon/apple-icon-114x114.png';
import apple120 from './assets/favicon/apple-icon-120x120.png';
import apple144 from './assets/favicon/apple-icon-144x144.png';
import apple152 from './assets/favicon/apple-icon-152x152.png';
import apple180 from './assets/favicon/apple-icon-180x180.png';
import apple57 from './assets/favicon/apple-icon-57x57.png';
import apple60 from './assets/favicon/apple-icon-60x60.png';
import apple72 from './assets/favicon/apple-icon-72x72.png';
import apple76 from './assets/favicon/apple-icon-76x76.png';
import applePrecomposed from './assets/favicon/apple-icon-precomposed.png';
import appleDefault from './assets/favicon/apple-icon.png';
import favicon16 from './assets/favicon/favicon-16x16.png';
import favicon32 from './assets/favicon/favicon-32x32.png';
import favicon96 from './assets/favicon/favicon-96x96.png';
import faviconIco from './assets/favicon/favicon.ico';
import msIcon144 from './assets/favicon/ms-icon-144x144.png';
import msIcon150 from './assets/favicon/ms-icon-150x150.png';
import msIcon310 from './assets/favicon/ms-icon-310x310.png';
import msIcon70 from './assets/favicon/ms-icon-70x70.png';

const MANAGED_ATTR = 'data-managed';
const LINK_SCOPE = 'app-favicon';
const META_SCOPE = 'app-favicon-meta';

const toAbsoluteUrl = (path: string) =>
  new URL(path, window.location.origin).href;

const manifestUrl = `data:application/manifest+json,${encodeURIComponent(
  JSON.stringify({
    name: 'App',
    icons: [
      { src: toAbsoluteUrl(android36), sizes: '36x36', type: 'image/png' },
      { src: toAbsoluteUrl(android48), sizes: '48x48', type: 'image/png' },
      { src: toAbsoluteUrl(android72), sizes: '72x72', type: 'image/png' },
      { src: toAbsoluteUrl(android96), sizes: '96x96', type: 'image/png' },
      { src: toAbsoluteUrl(android144), sizes: '144x144', type: 'image/png' },
      { src: toAbsoluteUrl(android192), sizes: '192x192', type: 'image/png' },
    ],
  }),
)}`;
const browserconfigUrl = new URL(
  './assets/favicon/browserconfig.xml',
  import.meta.url,
).href;

const removeManagedElements = () => {
  const managedSelectors = [
    `link[${MANAGED_ATTR}="${LINK_SCOPE}"]`,
    `meta[${MANAGED_ATTR}="${META_SCOPE}"]`,
  ].join(', ');

  document.head.querySelectorAll(managedSelectors).forEach((element) => {
    element.remove();
  });

  document.head
    .querySelectorAll('link[rel="icon"][href*="vite.svg"]')
    .forEach((element) => element.remove());
};

const createLink = (definition: LinkDefinition) => {
  const link = document.createElement('link');
  link.setAttribute(MANAGED_ATTR, LINK_SCOPE);
  link.rel = definition.rel;
  link.href = definition.href;
  if (definition.type) {
    link.type = definition.type;
  }
  if (definition.sizes) {
    link.sizes = definition.sizes;
  }
  if (definition.color) {
    link.setAttribute('color', definition.color);
  }
  document.head.append(link);
};

const createMeta = ({ name, content }: MetaDefinition) => {
  const meta =
    document.head.querySelector<HTMLMetaElement>(
      `meta[${MANAGED_ATTR}="${META_SCOPE}"][name="${name}"]`,
    ) ?? document.createElement('meta');

  meta.setAttribute(MANAGED_ATTR, META_SCOPE);
  meta.name = name;
  meta.content = content;

  if (!meta.isConnected) {
    document.head.append(meta);
  }
};

interface LinkDefinition {
  rel: string;
  href: string;
  type?: string;
  sizes?: string;
  color?: string;
}

interface MetaDefinition {
  name: string;
  content: string;
}

const iconDefinitions: LinkDefinition[] = [
  { rel: 'icon', type: 'image/png', sizes: '16x16', href: favicon16 },
  { rel: 'icon', type: 'image/png', sizes: '32x32', href: favicon32 },
  { rel: 'icon', type: 'image/png', sizes: '96x96', href: favicon96 },
  { rel: 'icon', type: 'image/x-icon', href: faviconIco },
  { rel: 'icon', type: 'image/png', sizes: '36x36', href: android36 },
  { rel: 'icon', type: 'image/png', sizes: '48x48', href: android48 },
  { rel: 'icon', type: 'image/png', sizes: '72x72', href: android72 },
  { rel: 'icon', type: 'image/png', sizes: '96x96', href: android96 },
  { rel: 'icon', type: 'image/png', sizes: '144x144', href: android144 },
  { rel: 'icon', type: 'image/png', sizes: '192x192', href: android192 },
  { rel: 'apple-touch-icon', sizes: '57x57', href: apple57 },
  { rel: 'apple-touch-icon', sizes: '60x60', href: apple60 },
  { rel: 'apple-touch-icon', sizes: '72x72', href: apple72 },
  { rel: 'apple-touch-icon', sizes: '76x76', href: apple76 },
  { rel: 'apple-touch-icon', sizes: '114x114', href: apple114 },
  { rel: 'apple-touch-icon', sizes: '120x120', href: apple120 },
  { rel: 'apple-touch-icon', sizes: '144x144', href: apple144 },
  { rel: 'apple-touch-icon', sizes: '152x152', href: apple152 },
  { rel: 'apple-touch-icon', sizes: '180x180', href: apple180 },
  { rel: 'apple-touch-icon', href: appleDefault },
  { rel: 'apple-touch-icon-precomposed', href: applePrecomposed },
  { rel: 'manifest', href: manifestUrl },
];

const metaDefinitions: MetaDefinition[] = [
  { name: 'theme-color', content: '#15161B' },
  { name: 'msapplication-TileColor', content: '#15161B' },
  { name: 'msapplication-TileImage', content: msIcon144 },
  { name: 'msapplication-square70x70logo', content: msIcon70 },
  { name: 'msapplication-square150x150logo', content: msIcon150 },
  { name: 'msapplication-square310x310logo', content: msIcon310 },
  { name: 'msapplication-config', content: browserconfigUrl },
];

removeManagedElements();
iconDefinitions.forEach(createLink);
metaDefinitions.forEach(createMeta);

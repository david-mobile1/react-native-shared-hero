import { readFileSync } from 'node:fs';
import {
  type DefaultTheme,
  type HeadConfig,
  type PageData,
  defineConfig,
} from 'vitepress';

const repo = 'https://github.com/maitrungduc1410/react-native-shared-hero';
const base = '/react-native-shared-hero/';
// Production origin + base. Sitemap URLs and canonical links are built from it.
const site = `https://maitrungduc1410.github.io${base}`;
const { version } = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
) as { version: string };

// Written by `yarn api` (TypeDoc) before VitePress runs.
const apiSidebar = JSON.parse(
  readFileSync(new URL('../api/typedoc-sidebar.json', import.meta.url), 'utf8')
) as DefaultTheme.SidebarItem[];

type Labels = {
  guide: string;
  api: string;
  groups: [string, string, string, string];
  pages: Record<(typeof slugs)[number], string>;
  changelog: string;
};

const slugs = [
  '',
  'installation',
  'quick-start',
  'transition-modes',
  'timing-and-motion',
  'events-and-lifecycle',
  'navigation',
  'in-place',
  'gestures-and-lists',
  'architecture',
  'troubleshooting',
] as const;

const groups: (typeof slugs)[number][][] = [
  ['', 'installation', 'quick-start'],
  ['transition-modes', 'timing-and-motion', 'events-and-lifecycle'],
  ['navigation', 'in-place', 'gestures-and-lists'],
  ['architecture', 'troubleshooting'],
];

function guideSidebar(prefix: string, l: Labels): DefaultTheme.SidebarItem[] {
  return groups.map((group, i) => ({
    text: l.groups[i],
    items: group.map((slug) => ({
      text: l.pages[slug],
      link: `${prefix}/guide/${slug}`,
    })),
  }));
}

function themeConfig(prefix: string, l: Labels): DefaultTheme.Config {
  return {
    nav: [
      {
        text: l.guide,
        link: `${prefix}/guide/`,
        activeMatch: `^${prefix}/guide/`,
      },
      { text: l.api, link: '/api/', activeMatch: '^/api/' },
      {
        text: `v${version}`,
        items: [
          { text: l.changelog, link: `${repo}/blob/master/CHANGELOG.md` },
          {
            text: 'npm',
            link: 'https://www.npmjs.com/package/react-native-shared-hero',
          },
        ],
      },
    ],
    sidebar: {
      [`${prefix}/guide/`]: guideSidebar(prefix, l),
      '/api/': [{ text: l.api, link: '/api/', items: apiSidebar }],
    },
  };
}

const en: Labels = {
  guide: 'Guide',
  api: 'API reference',
  changelog: 'Changelog',
  groups: [
    'Introduction',
    'Core concepts',
    'Navigation & patterns',
    'Under the hood',
  ],
  pages: {
    '': 'What is it?',
    'installation': 'Installation & Expo',
    'quick-start': 'Quick start',
    'transition-modes': 'Transition modes & morphing',
    'timing-and-motion': 'Timing, springs & motion paths',
    'events-and-lifecycle': 'Events & lifecycle',
    'navigation': 'Stack, modals, sheets & tabs',
    'in-place': 'In-place transitions',
    'gestures-and-lists': 'Interactive gestures & FlatList',
    'architecture': 'Architecture',
    'troubleshooting': 'Troubleshooting',
  },
};

const vi: Labels = {
  guide: 'Hướng dẫn',
  api: 'Tài liệu API',
  changelog: 'Nhật ký thay đổi',
  groups: [
    'Giới thiệu',
    'Cơ chế chuyển cảnh',
    'Điều hướng và mẫu thực tế',
    'Kiến trúc và gỡ lỗi',
  ],
  pages: {
    '': 'Tổng quan',
    'installation': 'Cài đặt và Expo',
    'quick-start': 'Bắt đầu nhanh',
    'transition-modes': 'Chế độ chuyển cảnh và Morph',
    'timing-and-motion': 'Thời gian, Spring và quỹ đạo bay',
    'events-and-lifecycle': 'Sự kiện và vòng đời',
    'navigation': 'Stack, Modal, Sheet và Tab',
    'in-place': 'Chuyển cảnh tại chỗ',
    'gestures-and-lists': 'Vuốt trả về và FlatList',
    'architecture': 'Kiến trúc bên dưới',
    'troubleshooting': 'Khắc phục sự cố',
  },
};

const zh: Labels = {
  guide: '指南',
  api: 'API 参考',
  changelog: '更新日志',
  groups: ['入门', '核心概念', '导航与常见模式', '底层原理与排障'],
  pages: {
    '': '概览',
    'installation': '安装与 Expo',
    'quick-start': '快速开始',
    'transition-modes': '过渡模式与容器变形',
    'timing-and-motion': '时间曲线、弹簧与运动轨迹',
    'events-and-lifecycle': '事件与生命周期',
    'navigation': 'Stack、弹窗、半屏面板与标签页',
    'in-place': '同屏原地过渡',
    'gestures-and-lists': '交互式手势返回与 FlatList',
    'architecture': '底层架构原理',
    'troubleshooting': '故障排查',
  },
};

// SEO: locale metadata used for hreflang, og:locale and the preview image alt text.
const seoLocales = {
  root: {
    prefix: '',
    lang: 'en-US',
    og: 'en_US',
    imageAlt:
      'React Native Shared Hero: a card morphing along a curved arc from a list screen to a detail header on iOS and Android',
  },
  vi: {
    prefix: 'vi/',
    lang: 'vi-VN',
    og: 'vi_VN',
    imageAlt:
      'React Native Shared Hero: thẻ hình ảnh bay và biến đổi kích thước theo đường cong từ danh sách sang màn hình chi tiết trên iOS và Android',
  },
  zh: {
    prefix: 'zh/',
    lang: 'zh-CN',
    og: 'zh_CN',
    imageAlt:
      'React Native Shared Hero：卡片沿弧形轨迹从列表页平滑变形飞入详情页（支持 iOS 与 Android）',
  },
} as const;
type SeoLocale = keyof typeof seoLocales;

function localeOf(page: string): SeoLocale {
  const first = page.split('/')[0];
  return first === 'vi' || first === 'zh' ? first : 'root';
}

/** `vi/guide/index.md` -> `vi/guide/`, `api/functions/SharedHeroView.md` -> `api/functions/SharedHeroView`. */
function pageUrl(page: string): string {
  return page.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '');
}

/** Description for generated TypeDoc pages, which have no frontmatter. */
function apiDescription(relativePath: string): string | undefined {
  const m = relativePath.match(/^api\/(?:(\w[\w-]*)\/)?([^/]+)\.md$/);
  if (!m) return undefined;
  const [, kind, name] = m;
  const lib = 'react-native-shared-hero';
  switch (kind) {
    case undefined:
      return `API reference for ${lib}: SharedHero component, useSharedHero hook, and all TypeScript prop and transition types.`;
    case 'functions':
      return `API reference for ${name}() in ${lib}: signature, props or parameters, return value, and usage examples.`;
    case 'interfaces':
      return `API reference for the ${name} interface in ${lib}, listing every property with its type, default, and description.`;
    case 'type-aliases':
      return `API reference for the ${name} type in ${lib}, with its full TypeScript definition and member descriptions.`;
    default:
      return undefined;
  }
}

export default defineConfig({
  title: 'React Native Shared Hero',
  description:
    'Window-level native shared element transitions for React Native (Fabric): router-agnostic, snapshot and morph modes, spring physics, and interactive gestures for iOS and Android.',
  base,
  cleanUrls: true,
  lastUpdated: true,
  appearance: 'dark',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: `${base}logo.svg` }],
    [
      'link',
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: `${base}apple-touch-icon.png`,
      },
    ],
    ['meta', { name: 'theme-color', content: '#6366F1' }],
    [
      'meta',
      {
        name: 'google-site-verification',
        content: 'tQKWpMESb7_XYCOMCID91lFgoQ4_dt3sqGoXzuRu-ZQ',
      },
    ],
  ],
  sitemap: {
    // VitePress 1.6 builds item URLs without `base`, so the hostname carries it.
    hostname: site,
    transformItems: (items) =>
      items.map((item) => {
        const enItem = item.links?.find(
          (l) => l.lang === seoLocales.root.lang
        );
        return enItem
          ? {
              ...item,
              links: [...item.links!, { lang: 'x-default', url: enItem.url }],
            }
          : item;
      }),
  },
  transformPageData(pageData: PageData) {
    const description = apiDescription(pageData.relativePath);
    if (description && !pageData.frontmatter.description) {
      return {
        description,
        frontmatter: { ...pageData.frontmatter, description },
      };
    }
  },
  transformHead({ page, pageData, siteConfig, title, description }) {
    if (page === '404.md' || pageData.isNotFound) {
      return [['meta', { name: 'robots', content: 'noindex' }]];
    }
    const locale = localeOf(page);
    const key = locale === 'root' ? page : page.slice(locale.length + 1);
    const url = site + pageUrl(page);
    const exists = new Set(siteConfig.pages);
    const variants = (Object.keys(seoLocales) as SeoLocale[]).filter((l) =>
      exists.has(seoLocales[l].prefix + key)
    );
    const isHome = pageData.frontmatter.layout === 'home';
    const image = `${site}og.png`;
    const imageAlt = seoLocales[locale].imageAlt;

    const head: HeadConfig[] = [['link', { rel: 'canonical', href: url }]];
    if (variants.length > 1) {
      for (const l of variants) {
        head.push([
          'link',
          {
            rel: 'alternate',
            hreflang: seoLocales[l].lang,
            href: site + pageUrl(seoLocales[l].prefix + key),
          },
        ]);
      }
      if (variants.includes('root')) {
        head.push([
          'link',
          { rel: 'alternate', hreflang: 'x-default', href: site + pageUrl(key) },
        ]);
      }
    }
    const og: [string, string][] = [
      ['og:type', isHome ? 'website' : 'article'],
      ['og:site_name', 'React Native Shared Hero'],
      ['og:title', title],
      ['og:description', description],
      ['og:url', url],
      ['og:locale', seoLocales[locale].og],
      ...variants
        .filter((l) => l !== locale)
        .map((l): [string, string] => [
          'og:locale:alternate',
          seoLocales[l].og,
        ]),
      ['og:image', image],
      ['og:image:type', 'image/png'],
      ['og:image:width', '1200'],
      ['og:image:height', '630'],
      ['og:image:alt', imageAlt],
    ];
    for (const [property, content] of og) {
      head.push(['meta', { property, content }]);
    }
    const twitter: [string, string][] = [
      ['twitter:card', 'summary_large_image'],
      ['twitter:title', title],
      ['twitter:description', description],
      ['twitter:image', image],
      ['twitter:image:alt', imageAlt],
    ];
    for (const [name, content] of twitter) {
      head.push(['meta', { name, content }]);
    }
    return head;
  },
  vite: { build: { chunkSizeWarningLimit: 2000 } },
  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      themeConfig: themeConfig('', en),
    },
    vi: {
      label: 'Tiếng Việt',
      lang: 'vi-VN',
      title: 'React Native Shared Hero',
      description:
        'Chuyển cảnh shared element ở tầng window cho React Native (Fabric): độc lập với thư viện điều hướng, hỗ trợ snapshot và morph, hiệu ứng vật lý spring và cử chỉ vuốt mượt mà trên iOS và Android.',
      themeConfig: {
        ...themeConfig('/vi', vi),
        outline: { level: [2, 3], label: 'Trên trang này' },
        docFooter: { prev: 'Trang trước', next: 'Trang sau' },
        lastUpdated: { text: 'Cập nhật lần cuối' },
        editLink: {
          pattern: ({ filePath }) =>
            filePath.startsWith('api/')
              ? 'https://github.com/maitrungduc1410/react-native-shared-hero/tree/master/src'
              : `https://github.com/maitrungduc1410/react-native-shared-hero/edit/master/docs/${filePath}`,
          text: 'Sửa trang này trên GitHub',
        },
        returnToTopLabel: 'Về đầu trang',
        sidebarMenuLabel: 'Menu',
        darkModeSwitchLabel: 'Giao diện',
        lightModeSwitchTitle: 'Chuyển sang giao diện sáng',
        darkModeSwitchTitle: 'Chuyển sang giao diện tối',
        langMenuLabel: 'Đổi ngôn ngữ',
        notFound: {
          title: 'KHÔNG TÌM THẤY TRANG',
          quote: 'Trang bạn tìm không tồn tại hoặc đã được chuyển đi.',
          linkText: 'Về trang chủ',
        },
        footer: { message: 'Phát hành theo giấy phép MIT.' },
      },
    },
    zh: {
      label: '简体中文',
      lang: 'zh-CN',
      title: 'React Native Shared Hero',
      description:
        'React Native（Fabric 新架构）窗口级原生共享元素过渡库：与路由库解耦，支持快照与容器变形（Morph）、弹簧物理动画与手势返回，覆盖 iOS 与 Android。',
      themeConfig: {
        ...themeConfig('/zh', zh),
        outline: { level: [2, 3], label: '页面导航' },
        docFooter: { prev: '上一页', next: '下一页' },
        lastUpdated: { text: '最后更新于' },
        editLink: {
          pattern: ({ filePath }) =>
            filePath.startsWith('api/')
              ? 'https://github.com/maitrungduc1410/react-native-shared-hero/tree/master/src'
              : `https://github.com/maitrungduc1410/react-native-shared-hero/edit/master/docs/${filePath}`,
          text: '在 GitHub 上编辑此页',
        },
        returnToTopLabel: '回到顶部',
        sidebarMenuLabel: '菜单',
        darkModeSwitchLabel: '外观',
        lightModeSwitchTitle: '切换到浅色模式',
        darkModeSwitchTitle: '切换到深色模式',
        langMenuLabel: '切换语言',
        notFound: {
          title: '页面未找到',
          quote: '你访问的页面不存在或已被移动。',
          linkText: '返回首页',
        },
        footer: { message: '基于 MIT 许可证发布。' },
      },
    },
  },
  themeConfig: {
    logo: '/logo.svg',
    socialLinks: [{ icon: 'github', link: repo }],
    search: {
      provider: 'local',
      options: {
        locales: {
          vi: {
            translations: {
              button: { buttonText: 'Tìm kiếm', buttonAriaLabel: 'Tìm kiếm' },
              modal: {
                displayDetails: 'Hiển thị chi tiết',
                resetButtonTitle: 'Xóa tìm kiếm',
                backButtonTitle: 'Đóng tìm kiếm',
                noResultsText: 'Không có kết quả cho',
                footer: {
                  selectText: 'chọn',
                  navigateText: 'di chuyển',
                  closeText: 'đóng',
                },
              },
            },
          },
          zh: {
            translations: {
              button: { buttonText: '搜索', buttonAriaLabel: '搜索' },
              modal: {
                displayDetails: '显示详情',
                resetButtonTitle: '清除查询',
                backButtonTitle: '关闭搜索',
                noResultsText: '没有找到相关结果',
                footer: {
                  selectText: '选择',
                  navigateText: '切换',
                  closeText: '关闭',
                },
              },
            },
          },
        },
      },
    },
    editLink: {
      pattern: ({ filePath }) =>
        filePath.startsWith('api/')
          ? 'https://github.com/maitrungduc1410/react-native-shared-hero/tree/master/src'
          : `https://github.com/maitrungduc1410/react-native-shared-hero/edit/master/docs/${filePath}`,
      text: 'Edit this page on GitHub',
    },
    outline: { level: [2, 3] },
    footer: { message: 'Released under the MIT License.' },
  },
});

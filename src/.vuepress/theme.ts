import { hopeTheme } from "vuepress-theme-hope";

import { enNavbar, zhNavbar } from "./navbar/index.js";
import { enSidebar, zhSidebar } from "./sidebar/index.js";

export default hopeTheme({
  hostname: "https://it-pxs.github.io/IT-Learn/",

  author: {
    name: "爱编程的小生",
    url: "https://it-pxs.github.io/IT-Learn/",
  },

  logo: "home.jpg",

  repo: "IT-PXS/IT-Learn",
  // 默认从 `repo` 内容中推断为以下之一：
  // "GitHub" / "GitLab" / "Gitee" / "Bitbucket" / "Source"
  repoLabel: "GitHub",
  repoDisplay: true,

  docsDir: "src",

  navbarLayout: {
    start: ["Brand"],
    center: ["Links"],
    end: ["Language", "Repo", "Outlook", "Search"],
  },

  sidebarSorter: ["date"],

  blog: {
    medias: {
      // Baidu: "https://example.com",
      // BiliBili: "https://example.com",
      // Bitbucket: "https://example.com",
      // Dingding: "https://example.com",
      // Discord: "https://example.com",
      // Dribbble: "https://example.com",
      // Email: "mailto:info@example.com",
      // Evernote: "https://example.com",
      // Facebook: "https://example.com",
      // Flipboard: "https://example.com",
      // Gitee: "https://example.com",
      QQ: "3032428600@qq.com",
      Email: "mailto:3032428600@qq.com",
      GitHub: "https://github.com/IT-PXS/IT-Learn",
      // Gitlab: "https://example.com",
      // Gmail: "mailto:info@example.com",
      // Instagram: "https://example.com",
      // Lark: "https://example.com",
      // Lines: "https://example.com",
      // Linkedin: "https://example.com",
      // Pinterest: "https://example.com",
      // Pocket: "https://example.com",
      // QQ: "3032428600@qq.com",
      // Qzone: "https://example.com",
      // Reddit: "https://example.com",
      // Rss: "https://example.com",
      // Steam: "https://example.com",
      // Twitter: "https://example.com",
      // Wechat: "https://example.com",
      // Weibo: "https://example.com",
      // Whatsapp: "https://example.com",
      // Youtube: "https://example.com",
      // Zhihu: "https://example.com",
    },
  },

  locales: {
    // "/": {
    //   // navbar
    //   navbar: enNavbar,

    //   // sidebar
    //   sidebar: enSidebar,

    //   footer: "Default footer",

    //   displayFooter: true,

    //   blog: {
    //     description: "A FrontEnd programmer",
    //     intro: "/intro.html",
    //   },

    //   metaLocales: {
    //     editLink: "Edit this page on GitHub",
    //   },
    // },

    /**
     * Chinese locale config
     */
    "/": {
      // navbar
      navbar: zhNavbar,

      // sidebar
      sidebar: zhSidebar,

      footer: "默认页脚",

      displayFooter: true,

      blog: {
        description: "码农攻城狮，懒癌患者，不定时更新",
        intro: "/intro.html",
      },

      // page meta
      metaLocales: {
        editLink: "在 GitHub 上编辑此页",
      },
    },
  },

  encrypt: {
    config: {
      // "/demo/encrypt.html": {
      //   hint: "Password: 1234",
      //   password: "1234",
      // },
      // "/zh/demo/encrypt.html": {
      //   hint: "Password: 1234",
      //   password: "1234",
      // },
    },
  },

  // enable it to preview all changes in time
  // hotReload: true,

  // These features are enabled for demo, only preserve features you need here
  markdown: {
    align: true,
    attrs: true,
    codeTabs: true,
    component: true,
    demo: true,
    figure: true,
    gfm: true,
    imgLazyload: true,
    imgSize: true,
    include: true,
    mark: true,
    plantuml: true,
    spoiler: true,
    stylize: [
      {
        matcher: "Recommended",
        replacer: ({ tag }) => {
          if (tag === "em")
            return {
              tag: "Badge",
              attrs: { type: "tip" },
              content: "Recommended",
            };
        },
      },
    ],
    sub: true,
    sup: true,
    tabs: true,
    tasklist: true,
    vPre: true,

    // uncomment these if you need TeX support
    // math: {
    //   // install katex before enabling it
    //   type: "katex",
    //   // or install mathjax-full before enabling it
    //   type: "mathjax",
    // },

    // install chart.js before enabling it
    // chartjs: true,

    // install echarts before enabling it
    // echarts: true,

    // install flowchart.ts before enabling it
    // flowchart: true,

    // install mermaid before enabling it
    // mermaid: true,

    // playground: {
    //   presets: ["ts", "vue"],
    // },

    // install @vue/repl before enabling it
    // vuePlayground: true,

    // install sandpack-vue3 before enabling it
    // sandpack: true,

    // install @vuepress/plugin-revealjs and uncomment these if you need slides
    // revealjs: {
    //   plugins: ["highlight", "math", "search", "notes", "zoom"],
    // },
  },

  plugins: {
    // blog: true,
    blog: {
      excerpt: false
    },
    // 目录配置
    catalog: {
      index: true
    },

    // 启用搜索功能
    search: {
      // 搜索配置
      locales: {
        "/": {
          placeholder: "搜索",
        },
      },
      // 搜索热键
      hotKeys: ["s", "/"],
      // 最大建议数
      maxSuggestions: 5,
      // 搜索高亮
      isSearchable: (page) => page.path !== "/",
    },
    // 通过 `backToTop: false` 禁用返回顶部按钮
    // 或自定义返回顶部按钮
    backToTop: {
      /**
       * 显示返回顶部按钮的滚动阈值距离（以像素为单位）
       *
       * @default 100
       */
      threshold: 500,
      /**
       * 是否显示滚动进度
       *
       * @default true
       */
      progress: true,
    },
    // notice: [
    //   {
    //     path: "/",
    //     title: "Notice Title",
    //     content: "Notice Content",
    //     actions: [
    //       {
    //         text: "Primary Action",
    //         link: "https://theme-hope.vuejs.press/",
    //         type: "primary",
    //       },
    //       { text: "Default Action" },
    //     ],
    //   },
    // ],
    watermark: false,
    copyright: true,

    // Install @waline/client before enabling it
    // Note: This is for testing ONLY!
    // You MUST generate and use your own comment service in production.
    comment: {
      provider: "Giscus",
      // serverURL: "https://waline-comment.vuejs.press",
      repo: "IT-PXS/IT-Learn",
      repoId: "R_kgDOPcw8wQ",
      category: "Announcements",
      categoryId: "DIC_kwDOPcw8wc4CuIbN"
      //       <script src="https://giscus.app/client.js"
      //         data-repo="IT-PXS/IT-Learn"
      //         data-repo-id="R_kgDOPcw8wQ"
      //         data-category="Announcements"
      //         data-category-id="DIC_kwDOPcw8wc4CuIbN"
      //         data-mapping="pathname"
      //         data-strict="0"
      //         data-reactions-enabled="1"
      //         data-emit-metadata="0"
      //         data-input-position="bottom"
      //         data-theme="preferred_color_scheme"
      //         data-lang="zh-CN"
      //         crossorigin="anonymous"
      //         async>
      // </script>
    },

    components: {
      components: ["Badge", "VPCard"],
    },

    icon: {
      prefix: "fa6-solid:",
      assets: "iconify"
    },
    // 添加sitemap插件配置
    sitemap: {
      // hostname 已在 hopeTheme 根级别配置
      sitemapFilename: "BingSiteAuth.xml"
    },

    // install @vuepress/plugin-pwa and uncomment these if you want a PWA
    // pwa: {
    //   favicon: "/favicon.ico",
    //   cacheHTML: true,
    //   cacheImage: true,
    //   appendBase: true,
    //   apple: {
    //     icon: "/assets/icon/apple-icon-152.png",
    //     statusBarColor: "black",
    //   },
    //   msTile: {
    //     image: "/assets/icon/ms-icon-144.png",
    //     color: "#ffffff",
    //   },
    //   manifest: {
    //     icons: [
    //       {
    //         src: "/assets/icon/chrome-mask-512.png",
    //         sizes: "512x512",
    //         purpose: "maskable",
    //         type: "image/png",
    //       },
    //       {
    //         src: "/assets/icon/chrome-mask-192.png",
    //         sizes: "192x192",
    //         purpose: "maskable",
    //         type: "image/png",
    //       },
    //       {
    //         src: "/assets/icon/chrome-512.png",
    //         sizes: "512x512",
    //         type: "image/png",
    //       },
    //       {
    //         src: "/assets/icon/chrome-192.png",
    //         sizes: "192x192",
    //         type: "image/png",
    //       },
    //     ],
    //     shortcuts: [
    //       {
    //         name: "Demo",
    //         short_name: "Demo",
    //         url: "/demo/",
    //         icons: [
    //           {
    //             src: "/assets/icon/guide-maskable.png",
    //             sizes: "192x192",
    //             purpose: "maskable",
    //             type: "image/png",
    //           },
    //         ],
    //       },
    //     ],
    //   },
    // },
  },
});
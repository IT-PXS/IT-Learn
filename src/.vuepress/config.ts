import { defineUserConfig } from "vuepress";

import theme from "./theme.js";
import { baiduAnalyticsPlugin } from '@vuepress/plugin-baidu-analytics'

export default defineUserConfig({
  base: "/IT-Learn/",

  locales: {
    "/": {
      lang: "zh-CN",
      title: "爱编程的小生",
      description: "记录学习计算机知识日常",
    },
  },

  theme,
  // Enable it with pwa
  // shouldPrefetch: false,
  plugins: [
    baiduAnalyticsPlugin({
      id: '22f9890054d18a4a0df8eeb8eafb976b',
    })
  ],
  // 排除 TODO 和 More 等文件
  pagePatterns: ["**/*.md", "!.vuepress", "!node_modules", "!TODO", "!More", "!Java/Socket"],
});
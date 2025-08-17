import { defineUserConfig } from "vuepress";

import theme from "./theme.js";
import { baiduAnalyticsPlugin } from '@vuepress/plugin-baidu-analytics'

export default defineUserConfig({
  base: "/IT-Learn/",

  // locales: {
  //   "/": {
  //     lang: "en-US",
  //     title: "Blog Demo",
  //     description: "A blog demo for vuepress-theme-hope",
  //   },
  //   "/zh/": {
  //     lang: "zh-CN",
  //     title: "爱编程的小生",
  //     description: "记录学习计算机知识日常",
  //   },
  // },

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
    }),
  ]
});

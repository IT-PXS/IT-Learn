import { sidebar } from "vuepress-theme-hope";

export const zhSidebar = sidebar({
  // "/zh/": [
  //   "",
  //   {
  //     text: "如何使用",
  //     icon: "laptop-code",
  //     prefix: "demo/",
  //     link: "demo/",
  //     children: "structure",
  //   },
  //   {
  //     text: "文章",
  //     icon: "book",
  //     prefix: "posts/",
  //     children: "structure",
  //   },
  //   "intro",
  //   {
  //     text: "幻灯片",
  //     icon: "person-chalkboard",
  //     link: "https://ecosystem.vuejs.press/zh/plugins/markdown/revealjs/demo.html",
  //   },
  // ],
  "/Java/": [
    {
      text: "SpringBoot",
      icon: "book",
      prefix: "SpringBoot/",
      children: "structure",
    },
    {
      text: "SpringCloud",
      icon: "book",
      prefix: "SpringCloud/",
      children: "structure",
    },
    {
      text: "SpringSecurity",
      icon: "book",
      prefix: "SpringSecurity/",
      children: "structure",
    },
    {
      text: "Excel",
      icon: "book",
      prefix: "Excel/",
      children: "structure",
    },
  ],
});

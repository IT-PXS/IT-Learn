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
    // {
    //   text: "SpringBoot",
    //   // icon: "book",
    //   prefix: "SpringBoot/",
    //   children: "structure",
    //   collapsible: true,
    // },
    // {
    //   text: "SpringCloud",
    //   // icon: "book",
    //   prefix: "SpringCloud/",
    //   children: "structure",
    //   collapsible: true,
    // },
    {
      text: "SpringSecurity5",
      prefix: "SpringSecurity5/",
      children: "structure",
      collapsible: true,
    },
    {
      text: "Excel",
      prefix: "Excel/",
      children: "structure",
      collapsible: true,
    },
    {
      text: "工作技巧",
      prefix: "Work/",
      children: "structure",
      collapsible: true,
    },
    {
      text: "定时任务",
      prefix: "CronTask/",
      children: "structure",
      collapsible: true,
    },
  ],
  "/Front/": [
    {
      text: "HTML",
      prefix: "HTML/",
      children: "structure",
      collapsible: true,
    },
    {
      text: "CSS",
      prefix: "CSS/",
      children: "structure",
      collapsible: true,
    },
  ],
  // "/Database/": [
  //   {
  //     text: "MySQL",
  //     prefix: "MySQL/",
  //     children: "structure",
  //     collapsible: true,
  //   },
  // ],
});

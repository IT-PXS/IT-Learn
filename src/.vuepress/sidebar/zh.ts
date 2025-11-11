import { sidebar } from "vuepress-theme-hope";

export const zhSidebar = sidebar({
  "/Java/": [
    {
      text: "SpringBoot",
      prefix: "SpringBoot/",
      children: "structure",
      collapsible: true,
    },
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
    {
      text: "Netty",
      prefix: "Netty/",
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
  "/Database/": [
    {
      text: "MySQL",
      prefix: "MySQL/",
      children: "structure",
      collapsible: true,
    },
  ],
});

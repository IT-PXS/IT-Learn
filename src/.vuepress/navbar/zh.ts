import { navbar } from "vuepress-theme-hope";

export const zhNavbar = navbar([
  {
    text: "首页",
    icon: "house",
    link: "/",
  },
  {
    text: "分类",
    icon: "layer-group",
    link: "/category/",
  },
  {
    text: "标签",
    icon: "tags",
    link: "/tag/",
  },
  {
    text: "时间线",
    icon: "clock-rotate-left",
    link: "/timeline/",
  },
  {
    text: "Java",
    link: "Java/SpringSecurity5/",
    icon: "fa6-brands:java",
  },
  {
    text: "前端",
    link: "Front/",
    icon: "laptop-code",
  },
  {
    text: "数据库",
    link: "Database/",
    icon: "database",
  },
  {
    text: "心得",
    link: "More/",
    icon: "lightbulb",
  }
]);

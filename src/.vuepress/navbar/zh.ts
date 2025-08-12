import { navbar } from "vuepress-theme-hope";

export const zhNavbar = navbar([
  "/",
  {
    text: "Java",
    icon: "book",
    prefix: "/Java/",
    children: [
      // "SpringBoot",
      // "SpringCloud",
      // "SpringSecurity",
      {
        text: "SpringBoot",
        prefix: "SpringBoot/",
        link: "SpringBoot/"
      },
      {
        text: "SpringCloud",
        prefix: "SpringCloud/",
        link: "SpringCloud/"
      },
      {
        text: "SpringSecurity",
        prefix: "SpringSecurity/",
        link: "SpringSecurity/"
      },
      {
        text: "Excel",
        prefix: "Excel/",
        link: "Excel/"
      },
    ],
  },
  {
    text: "前端",
    icon: "book",
    prefix: "/Front/",
    children: [
      {
        text: "Html",
        prefix: "Html/",
        link: "Html/"
      },
      {
        text: "Css",
        prefix: "Css/",
        link: "Css/"
      },
      {
        text: "JavaScript",
        prefix: "JavaScript/",
        link: "JavaScript/"
      },
      {
        text: "Vue",
        prefix: "Vue/",
        link: "Vue/"
      }
    ],
  },
  {
    text: "数据库",
    icon: "book",
    prefix: "/Database/",
    children: [
      {
        text: "Mysql",
        prefix: "Mysql/",
        link: "Mysql/"
      },
      {
        text: "Redis",
        prefix: "Redis/",
        link: "Redis/"
      }
    ],
  },
]);

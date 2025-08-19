import { navbar } from "vuepress-theme-hope";

export const zhNavbar = navbar([
  "/",
  "/category/",
  "/tag/",
  "/timeline/",
  {
    text: "Java",
    link: "Java/SpringSecurity5/",
    // icon: "book",
    // prefix: "/Java/",
    // children: [
    //   // "SpringBoot",
    //   // "SpringCloud",
    //   // "SpringSecurity",
    //   {
    //     text: "SpringBoot",
    //     // icon: "leaf",
    //     prefix: "SpringBoot/",
    //     link: "SpringBoot/"
    //   },
    //   {
    //     text: "SpringCloud",
    //     // icon: "cloud",
    //     prefix: "SpringCloud/",
    //     link: "SpringCloud/"
    //   },
    //   {
    //     text: "SpringSecurity",
    //     // icon: "shield-alt",
    //     prefix: "SpringSecurity/",
    //     link: "SpringSecurity/"
    //   },
    //   {
    //     text: "Excel",
    //     prefix: "Excel/",
    //     link: "Excel/"
    //   },
    // ],
  },
  {
    text: "前端",
    link: "Front/",
    // prefix: "/Front/",
    // children: [
    //   {
    //     text: "HTML",
    //     // icon: "file-code",
    //     prefix: "Html/",
    //     link: "Html/"
    //   },
    //   {
    //     text: "CSS",
    //     // icon: "paint-brush",
    //     prefix: "Css/",
    //     link: "Css/"
    //   },
    //   {
    //     text: "JavaScript",
    //     // icon: "js",
    //     prefix: "JavaScript/",
    //     link: "JavaScript/"
    //   },
    //   {
    //     text: "Vue",
    //     // icon: "vuejs",
    //     prefix: "Vue/",
    //     link: "Vue/"
    //   }
    // ],
  },
  {
    text: "数据库",
    prefix: "/Database/",
    children: [
      {
        text: "MySQL",
        // icon: "server",
        prefix: "Mysql/",
        link: "Mysql/"
      },
      {
        text: "Redis",
        // icon: "memory",
        prefix: "Redis/",
        link: "Redis/"
      }
    ],
  },
]);

// cannot use path alias here because unocss can not resolve it
import { defineConfig } from "./toolkit/themeConfig";

export default defineConfig({
//网站默认语言
  siteName: "Blog",//左上角标题栏名字
  locale: "zh-CN",   // zh-CN | zh-TW | ja | en

//首页大标题
    brand: {
    title: "轻沣的航海日志",
    subtitle: "技术与简单日常记录",
    logo: "✨",
  },

//侧边栏
  sidebar: {
    author: "轻沣",
    description: "独立游戏开发中",
    //社交配置
    social: {
      github: {
        url: "https://github.com/LanFeng97",
        icon: "i-ri-github-fill",
      },
      /*
      twitter: {
        url: "https://twitter.com/yourname",
        icon: "i-ri-twitter-x-line",
      },
      email: {
        url: "mailto:your@email.com",
        icon: "i-ri-mail-line",
      },
      */
    },
  },




});


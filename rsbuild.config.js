/* eslint-disable */
import { defineConfig } from "@rsbuild/core";
import { pluginEslint } from "@rsbuild/plugin-eslint";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSass } from "@rsbuild/plugin-sass";
import { pluginTypeCheck } from "@rsbuild/plugin-type-check";
import { rspack } from "@rspack/core";
// eslint-disable-next-line no-undef
console.log(process.env.CROSS_ENV);
export default defineConfig({
  plugins: [
    pluginReact(),
    pluginSass(),
    pluginEslint(),
    pluginTypeCheck({
      enable: true, // 启用类型检查
      // 可选配置
      // tsconfigPath: './tsconfig.json', // 自定义 tsconfig 路径
      // forkTsCheckerOptions: { /* 额外的检查器选项 */ }
    }),
  ],
  entry: "index.js",
  output: {
    // 启用externals配置
    polyfill: "usage",
  },
  tools: {
    babel: {
      plugins: [
        [
          "babel-plugin-react-compiler",
          {
            // 可选：排除不需要编译的文件（支持 glob 模式）
            exclude: /node_modules/,
            // 其他插件配置项（参考官方文档）
          },
        ],
      ],
    },
    rspack: {
      // 添加externals配置，将peerDependencies中的库排除在打包范围外
      // externals: {
      //   'react': 'React',
      //   'react-dom': 'ReactDOM',
      //   // 'react-router-dom': 'ReactRouterDOM' // 添加这一行
      // },
      plugins: [
        new rspack.HtmlRspackPlugin({
          title: "My HTML Template",
          template: "public/index.html",
          filename: "index.html",
          scriptLoading: "defer",
          inject: "body",
        }),
      ],
    },
  },
  html: false,
  resolve: {
    alias: {
      "@": "./src",
    },
  },
  performance: {
    removeConsole: process.env.CROSS_ENV === "production" ? true : false,
    chunkSplit: {
      strategy: "custom",
      splitChunks: {
        cacheGroups: {
          react: {
            test: /node_modules[\\/](react|react-dom|react-router-dom)[\\/]/,
            name: "react",
            minChunks: 1,
            priority: -2,
            chunks: "all",
            enforce: true,
          },
          antd: {
            test: /node_modules[\\/](antd)[\\/]/,
            name: "antd",
            minChunks: 1,
            priority: -9,
            chunks: "all",
            enforce: true,
          },

          vendor: {
            name: "vendor",
            chunks: "all",
            minChunks: 3,
            priority: -10,
            test: /[\\/]node_modules[\\/]/,
            reuseExistingChunk: true,
          },
          default: {
            chunks: "all",
            test: /[\\/]src[\\/]/,
            minChunks: 3,
            priority: -20,
            reuseExistingChunk: true,
            name: "common",
          },
        },
      },
    },
    // bundleAnalyze:{
    //   analyzerMode: 'server',
    //   openAnalyzer: true,
    // }
  },
  source: {
    define: {
      "process.env.CROSS_ENV": JSON.stringify(process.env.CROSS_ENV),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});

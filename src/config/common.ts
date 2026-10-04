export const baseUrl = () => {
  console.log("CROSS_ENV:", process.env.CROSS_ENV);
  if (process.env.CROSS_ENV === "dev" || process.env.CROSS_ENV === "test") {
    // 开发环境走 rsbuild dev 代理，见 rsbuild.config.js server.proxy
    return "";
  }
  return "xxx";
};

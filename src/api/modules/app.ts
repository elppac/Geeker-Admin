import page from "@/assets/json/page.json";
import project from "@/assets/json/project.json";
import { PORT1 } from "@/api/config/servicePort";
import http from "@/api";

export const getPage = (params: { name: string }) => {
  console.log(`获取${params.name}页面配置`);
  if (params.name === "project") {
    return { ...project, name: params.name, time: new Date().getTime() };
  }
  return { ...page, name: params.name, time: new Date().getTime() };
};

export const getModel = (name: string, params?: any) => {
  if (name.indexOf("#") === 0) {
    return http.get(PORT1 + `/${name.substring(1)}`, params);
  }
  return http.get(PORT1 + `/user/${name}`, params);
};

export const getDef = (name: string, params?: any) => {
  if (name.indexOf("#") === 0) {
    return http.get(PORT1 + `/${name.substring(1)}`, params);
  }
  return http.get(PORT1 + `/user/${name}`, params);
};

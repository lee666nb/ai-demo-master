import request from "@/base/http/request";

export const getBookings = (params: any): Promise<any> => {
  return request({
    url: "/orders",
    method: "get",
    params,
  });
};

package com.fox.toolcallingdemo.tool.weather.function;

import java.util.function.Function;

public class WeatherFunction implements Function<WeatherFunction.WeatherRequest, String> {
    @Override
    public String apply(WeatherRequest request) {
        // 此处省略了实际的天气查询逻辑，直接返回一个示例字符串
        // 实际应用中需要根据请求参数调用天气API获取天气信息
        return "The weather in " + request.getCity() + " is sunny.";
    }
    public static class WeatherRequest {
        private String city;
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
    }
}

package com.fox.toolcallingdemo.tool.weather.method;


import org.springframework.ai.tool.annotation.Tool;

public class WeatherToolImpl implements WeatherTool {
    @Override
    @Tool(description = "获取指定城市的天气信息。")
    public String getWeather(String city) {
        return "The weather in " + city + " is sunny.";
    }
}

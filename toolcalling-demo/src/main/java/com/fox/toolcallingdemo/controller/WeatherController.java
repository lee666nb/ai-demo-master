package com.fox.toolcallingdemo.controller;


import com.fox.toolcallingdemo.tool.weather.method.WeatherTool;
import com.fox.toolcallingdemo.tool.weather.method.WeatherToolImpl;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/weather")
public class WeatherController {

    private final ChatClient dashScopeChatClient;

    public WeatherController(ChatClient.Builder chatClientBuilder) {
        this.dashScopeChatClient = chatClientBuilder
                //.defaultFunctions("weatherFunction")
                //.defaultTools(new WeatherToolImpl())
                .build();
    }

    /**
     * 无工具版
     */
    @GetMapping("/chat")
    public String simpleChat(@RequestParam(value = "query", defaultValue = "北京今天的天气") String query) {
        return dashScopeChatClient.prompt(query).call().content();
    }

    /**
     * 调用工具版 - function
     */
    @GetMapping("/chat-tool-function")
    public String chatTranslateFunction(@RequestParam(value = "query", defaultValue = "北京今天的天气") String query) {

        return dashScopeChatClient.prompt(query).functions("weatherFunction").call().content();
    }



    /**
     * 调用工具版 - method
     */
    @GetMapping("/chat-tool-method")
    public String chatTranslateMethod(@RequestParam(value = "query", defaultValue = "北京今天的天气") String query) {

        return dashScopeChatClient.prompt(query).tools(new WeatherToolImpl()).call().content();
    }
}

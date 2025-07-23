package com.fox.alibabaaidemo.controller;


import com.alibaba.cloud.ai.dashscope.chat.DashScopeChatOptions;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import java.io.IOException;

@RestController
public class ChatModelController {
    private final ChatModel chatModel;

    public ChatModelController(@Qualifier("dashscopeChatModel") ChatModel chatModel) {
        this.chatModel = chatModel;
    }

    @RequestMapping("/chat2")
    public String chat2(String input) {

        DashScopeChatOptions options = DashScopeChatOptions.builder()
                .withTemperature(0.9)
                .withMaxToken(1500)
           //     .withTopP(0.01)
                .build();

        Prompt prompt = new Prompt(input, options);
        ChatResponse response = chatModel.call(prompt);
        //ChatResponse response = chatModel.call(new Prompt(input));
        return response.getResult().getOutput().getText();
    }


    @RequestMapping("/streamChat")
    public Flux<String> streamChat(String input, HttpServletResponse response) throws IOException {
        response.setContentType("text/event-stream");
        response.setCharacterEncoding("UTF-8");
        return chatModel.stream(input);
    }


}
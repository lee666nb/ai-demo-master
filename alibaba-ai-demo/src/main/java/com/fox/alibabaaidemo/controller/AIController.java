package com.fox.alibabaaidemo.controller;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public  class AIController {
      private final ChatClient chatClient;
    public AIController(ChatClient.Builder builder) {
        this.chatClient =  builder
                .defaultSystem("你是一个友好的聊天机器人，回答问题时要使用{voice}的语气")
                .build();
    }
      @GetMapping("/ai")
      Map<String, String> completion(@RequestParam(value = "message", defaultValue = "说一个笑话") String message, String voice) {
        return Map.of(
            "completion",
            this.chatClient.prompt()
                .system(sp -> sp.param("voice", voice))
                .user(message)
                .call()
                .content());
      }
    }


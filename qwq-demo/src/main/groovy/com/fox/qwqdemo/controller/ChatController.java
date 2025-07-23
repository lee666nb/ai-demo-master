package com.fox.qwqdemo.controller;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RestController
    public class ChatController {

      private final ChatClient chatClient;

      public ChatController(ChatClient.Builder builder) {
        this.chatClient = builder.build();
      }

      @GetMapping(value = "/stream",produces = "text/html;charset=utf-8")
      public Flux<String> stream(String input) {
        return this.chatClient.prompt()
            .user(input)
            .stream()
            .content();
      }
    }
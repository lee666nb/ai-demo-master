package com.fox.higressdemo.controller;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ChatModelController {
  private final ChatModel chatModel;

  public ChatModelController(ChatModel chatModel) {
    this.chatModel = chatModel;
  }

  @RequestMapping("/chat")
  public String chat(String input) {
    ChatResponse response = chatModel.call(new Prompt(input));
    return response.getResult().getOutput().toString();
  }
}
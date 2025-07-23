package com.fox.bailianagent.controller;

import com.alibaba.cloud.ai.dashscope.agent.DashScopeAgent;
import com.alibaba.cloud.ai.dashscope.agent.DashScopeAgentOptions;
import com.alibaba.cloud.ai.dashscope.api.DashScopeAgentApi;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class BailianAgentRagController {
  private DashScopeAgent agent;

  @Value("${spring.ai.dashscope.agent.app-id}")
  private String appId;

  public BailianAgentRagController(DashScopeAgentApi dashscopeAgentApi) {
    this.agent = new DashScopeAgent(dashscopeAgentApi);
  }

  @GetMapping("/bailian/agent/call")
  public String call(@RequestParam(value = "message") String message) {
    ChatResponse response = agent.call(
            new Prompt(message, DashScopeAgentOptions.builder()
                    .withAppId(appId)
                    .build()));
    AssistantMessage app_output = response.getResult().getOutput();
    return app_output.getText();
  }
}
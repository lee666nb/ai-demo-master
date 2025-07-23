package com.fox.tlmallordermcpserver;

import com.fox.tlmallordermcpserver.service.OpenOrderService;
import org.springframework.ai.tool.ToolCallbackProvider;
import org.springframework.ai.tool.method.MethodToolCallbackProvider;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class TlmallOrderMcpServerApplication {

    public static void main(String[] args) {
        SpringApplication.run(TlmallOrderMcpServerApplication.class, args);
    }

    @Bean
    public ToolCallbackProvider orderTools(OpenOrderService openOrderService) {
        return MethodToolCallbackProvider.builder().toolObjects(openOrderService).build();
    }

}

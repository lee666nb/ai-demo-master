package com.fox.baidumapmcpdemo;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.InMemoryChatMemory;
import org.springframework.ai.mcp.client.McpClient;
import org.springframework.ai.mcp.client.McpSyncClient;
import org.springframework.ai.mcp.client.stdio.ServerParameters;
import org.springframework.ai.mcp.client.stdio.StdioClientTransport;
import org.springframework.ai.mcp.spring.McpFunctionCallback;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Bean;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Scanner;

@SpringBootApplication
public class BaidumapMcpDemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(BaidumapMcpDemoApplication.class, args);
    }


    @Bean
    public CommandLineRunner interactiveChat(ChatClient.Builder chatClientBuilder,
                                             List<McpFunctionCallback> functionCallbacks,
                                             ConfigurableApplicationContext context) {
        return args -> {

            var chatClient = chatClientBuilder
                    .defaultFunctions(functionCallbacks.toArray(new McpFunctionCallback[0]))
                    .defaultAdvisors(new MessageChatMemoryAdvisor(new InMemoryChatMemory()))
                    .build();

            var scanner = new Scanner(System.in);
            System.out.println("\n开始互动聊天会话。输入'exit'可退出聊天。");

            try {
                while (true) {
                    System.out.print("\n USER: ");
                    String input = scanner.nextLine();

                    if (input.equalsIgnoreCase("exit")) {
                        System.out.println("结束聊天会话。");
                        break;
                    }

                    System.out.print("ASSISTANT: ");
                    System.out.println(chatClient.prompt(input).call().content());
                }
            } finally {
                scanner.close();
                context.close();
            }

        };
    }



    @Bean
    public List<McpFunctionCallback> functionCallbacks(McpSyncClient mcpClient) {

        var callbacks = mcpClient.listTools(null)
                .tools()
                .stream()
                .map(tool -> new McpFunctionCallback(mcpClient, tool))
                .toList();
        return callbacks;
    }

    @Bean(destroyMethod = "close")
    public McpSyncClient mcpClient() {
        // based on
        // https://lbsyun.baidu.com/faq/api?title=mcpserver/quickstart
        //注意windows系统下，需要使用npx.cmd来启动mcp-server-filesystem
        var stdioParams = ServerParameters.builder("npx.cmd")
                .args("-y", "@baidumap/mcp-server-baidu-map")
                .addEnvVar("BAIDU_MAP_API_KEY", System.getProperty("BAIDU_MAP_API_KEY"))
                .build();

        var mcpClient = McpClient.using(new StdioClientTransport(stdioParams))
                .requestTimeout(Duration.ofSeconds(10)).sync();

        var init = mcpClient.initialize();

        System.out.println("MCP Initialized: " + init);

        return mcpClient;

    }




}

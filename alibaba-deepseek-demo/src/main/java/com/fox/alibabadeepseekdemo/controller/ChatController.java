package com.fox.alibabadeepseekdemo.controller;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.publisher.Flux;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/ai")
@CrossOrigin(origins = "*") // 添加跨域支持
public class ChatController {
    private final ChatClient chatClient;
 
    public ChatController(ChatClient.Builder chatClient) {
        this.chatClient = chatClient.build();
    }

    @GetMapping(value = "/chat")
    public ResponseEntity<String> chat(@RequestParam(value = "input") String input) {
        try {
            if (input == null || input.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("输入不能为空");
            }

            String response = this.chatClient.prompt()
                    .user(input)
                    .call()
                    .content();

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body("AI服务暂时不可用，请稍后重试。错误信息：" + e.getMessage());
        }
    }

    @GetMapping(value = "/stream", produces = "text/plain;charset=UTF-8")
    public Flux<String> stream(@RequestParam(value = "input") String input) {
        try {
            if (input == null || input.trim().isEmpty()) {
                return Flux.just("输入不能为空");
            }

            return this.chatClient.prompt()
                    .user(input)
                    .stream()
                    .content()
                    .onErrorReturn("AI服务出现错误，请稍后重试");
        } catch (Exception e) {
            e.printStackTrace();
            return Flux.just("AI服务暂时不可用：" + e.getMessage());
        }
    }

    @GetMapping(value = "/sseChat")
    public SseEmitter sseChat(@RequestParam(value = "input", defaultValue = "你是谁") String input) {
        SseEmitter sseEmitter = new SseEmitter(30000L) { // 设置30秒超时
            @Override
            protected void extendResponse(ServerHttpResponse outputMessage) {
                HttpHeaders headers = outputMessage.getHeaders();
                headers.setContentType(new MediaType("text", "event-stream", StandardCharsets.UTF_8));
                headers.set("Cache-Control", "no-cache");
                headers.set("Connection", "keep-alive");
            }
        };

        try {
            if (input == null || input.trim().isEmpty()) {
                sseEmitter.send("输入不能为空");
                sseEmitter.complete();
                return sseEmitter;
            }

            Flux<String> stream = chatClient
                    .prompt()
                    .user(input)
                    .stream()
                    .content();

            stream.subscribe(
                token -> {
                    try {
                        sseEmitter.send(token);
                    } catch (IOException e) {
                        sseEmitter.completeWithError(e);
                    }
                },
                error -> {
                    try {
                        sseEmitter.send("AI服务出现错误：" + error.getMessage());
                    } catch (IOException e) {
                        // 忽略发送错误
                    }
                    sseEmitter.completeWithError(error);
                },
                sseEmitter::complete
            );
        } catch (Exception e) {
            try {
                sseEmitter.send("AI服务暂时不可用：" + e.getMessage());
            } catch (IOException ioException) {
                // 忽略发送错误
            }
            sseEmitter.completeWithError(e);
        }

        return sseEmitter;
    }

    // 添加健康检查接口
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        try {
            // 发送一个简单的测试请求
            String testResponse = this.chatClient.prompt()
                    .user("hello")
                    .call()
                    .content();
            return ResponseEntity.ok("AI服务正常运行");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("AI服务异常：" + e.getMessage());
        }
    }
}
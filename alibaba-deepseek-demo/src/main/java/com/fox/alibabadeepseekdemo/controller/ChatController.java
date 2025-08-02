package com.fox.alibabadeepseekdemo.controller;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ChatController {
    private final ChatClient chatClient;

    // 存储聊天会话
    private final Map<String, ChatSession> chatSessions = new ConcurrentHashMap<>();
    private final Map<String, List<String>> userChats = new ConcurrentHashMap<>();

    public ChatController(ChatClient.Builder chatClient) {
        this.chatClient = chatClient.build();
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(@RequestBody ChatRequest request) {
        Map<String, Object> response = new HashMap<>();

        try {
            if (request.getMessage() == null || request.getMessage().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "消息不能为空");
                return ResponseEntity.badRequest().body(response);
            }

            String chatId = request.getChatId();
            if (chatId == null) {
                chatId = generateChatId();
            }

            // 获取或创建聊天会话
            ChatSession session = chatSessions.computeIfAbsent(chatId, k -> new ChatSession(k));

            // 添加用户消息到历史
            session.addMessage("user", request.getMessage());

            // 构建对话上下文
            StringBuilder contextBuilder = new StringBuilder();
            for (ChatMessage msg : session.getMessages()) {
                contextBuilder.append(msg.getRole()).append(": ").append(msg.getContent()).append("\n");
            }

            // 调用AI服务
            String aiResponse = this.chatClient.prompt()
                    .user(request.getMessage())
                    .call()
                    .content();

            // 添加AI回复到历史
            session.addMessage("assistant", aiResponse);
            session.setLastActiveTime(System.currentTimeMillis());
            session.setTitle(generateChatTitle(request.getMessage()));

            // 更新用户的聊天列表
            String username = request.getUsername();
            if (username != null) {
                userChats.computeIfAbsent(username, k -> new ArrayList<>());
                if (!userChats.get(username).contains(chatId)) {
                    userChats.get(username).add(0, chatId); // 添加到开头
                }
            }

            response.put("success", true);
            response.put("reply", aiResponse);
            response.put("chatId", chatId);
            response.put("timestamp", System.currentTimeMillis());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "AI服务暂时不可用，请稍后重试");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/chats/{username}")
    public ResponseEntity<Map<String, Object>> getUserChats(@PathVariable String username) {
        Map<String, Object> response = new HashMap<>();

        try {
            List<String> chatIds = userChats.getOrDefault(username, new ArrayList<>());
            List<Map<String, Object>> chats = new ArrayList<>();

            for (String chatId : chatIds) {
                ChatSession session = chatSessions.get(chatId);
                if (session != null) {
                    Map<String, Object> chatInfo = new HashMap<>();
                    chatInfo.put("id", chatId);
                    chatInfo.put("title", session.getTitle());
                    chatInfo.put("lastActiveTime", session.getLastActiveTime());
                    chatInfo.put("messageCount", session.getMessages().size());
                    chats.add(chatInfo);
                }
            }

            response.put("success", true);
            response.put("chats", chats);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取聊天记录失败");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/chat/{chatId}")
    public ResponseEntity<Map<String, Object>> getChatHistory(@PathVariable String chatId) {
        Map<String, Object> response = new HashMap<>();

        try {
            ChatSession session = chatSessions.get(chatId);
            if (session == null) {
                response.put("success", false);
                response.put("message", "聊天记录不存在");
                return ResponseEntity.notFound().build();
            }

            response.put("success", true);
            response.put("chatId", chatId);
            response.put("title", session.getTitle());
            response.put("messages", session.getMessages());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取聊天记录失败");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @DeleteMapping("/chat/{chatId}")
    public ResponseEntity<Map<String, Object>> deleteChat(@PathVariable String chatId, @RequestParam String username) {
        Map<String, Object> response = new HashMap<>();

        try {
            chatSessions.remove(chatId);
            List<String> userChatList = userChats.get(username);
            if (userChatList != null) {
                userChatList.remove(chatId);
            }

            response.put("success", true);
            response.put("message", "聊天记录已删除");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "删除聊天记录失败");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    private String generateChatId() {
        return "chat_" + System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8);
    }

    private String generateChatTitle(String firstMessage) {
        if (firstMessage.length() > 20) {
            return firstMessage.substring(0, 20) + "...";
        }
        return firstMessage;
    }

    // 内部类
    public static class ChatRequest {
        private String message;
        private String chatId;
        private String username;

        // Getters and Setters
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }

        public String getChatId() { return chatId; }
        public void setChatId(String chatId) { this.chatId = chatId; }

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
    }

    public static class ChatSession {
        private String id;
        private String title;
        private List<ChatMessage> messages;
        private long lastActiveTime;
        private long createdTime;

        public ChatSession(String id) {
            this.id = id;
            this.title = "新对话";
            this.messages = new ArrayList<>();
            this.createdTime = System.currentTimeMillis();
            this.lastActiveTime = System.currentTimeMillis();
        }

        public void addMessage(String role, String content) {
            messages.add(new ChatMessage(role, content, System.currentTimeMillis()));
        }

        // Getters and Setters
        public String getId() { return id; }
        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public List<ChatMessage> getMessages() { return messages; }
        public long getLastActiveTime() { return lastActiveTime; }
        public void setLastActiveTime(long lastActiveTime) { this.lastActiveTime = lastActiveTime; }
        public long getCreatedTime() { return createdTime; }
    }

    public static class ChatMessage {
        private String role;
        private String content;
        private long timestamp;

        public ChatMessage(String role, String content, long timestamp) {
            this.role = role;
            this.content = content;
            this.timestamp = timestamp;
        }

        // Getters and Setters
        public String getRole() { return role; }
        public String getContent() { return content; }
        public long getTimestamp() { return timestamp; }
    }
}
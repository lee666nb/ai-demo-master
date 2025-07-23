package com.fox.tlmallai.services;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.PromptChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.QuestionAnswerAdvisor;
import org.springframework.ai.chat.client.advisor.SimpleLoggerAdvisor;
import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.time.LocalDate;

import static org.springframework.ai.chat.client.advisor.AbstractChatMemoryAdvisor.CHAT_MEMORY_CONVERSATION_ID_KEY;
import static org.springframework.ai.chat.client.advisor.AbstractChatMemoryAdvisor.CHAT_MEMORY_RETRIEVE_SIZE_KEY;

@Service
public class CustomerSupportAssistant {

    private final ChatClient chatClient;

    public CustomerSupportAssistant(ChatClient.Builder modelBuilder, VectorStore vectorStore, ChatMemory chatMemory) {
        this.chatClient = modelBuilder
               .defaultSystem("""
                        您是电商平台的智能客服助手。请以友好、热情、专业的态度回复客户。
                        您可以支持查询订单详情、取消订单等操作。在进行这些操作前，请务必获取用户ID。
                        当用户询问订单详情时，请先确认用户ID。
                        可以根据用户ID查询用户订单列表
                        请先检查聊天历史记录中是否已有订单号，避免重复询问。
                        取消订单时，必须提供订单号，请用户确认，用户确认后才能取消订单。
                        使用提供的函数功能获取订单详情和取消订单。
                        若需要，可调用相应函数辅助完成。
                        请讲中文。
                        今天的日期是 {current_date}.
                    """)
               .defaultAdvisors(
                        new PromptChatMemoryAdvisor(chatMemory),
                        new QuestionAnswerAdvisor(vectorStore,
                                SearchRequest.builder().topK(4).similarityThresholdAll().build()),
                        new SimpleLoggerAdvisor()
                )
               .defaultFunctions("getOrderByUserId","getOrderDetails", "cancelOrder")
               .build();
    }

    public Flux<String> chat(String chatId, String userMessageContent) {
        return this.chatClient.prompt()
               .system(s -> s.param("current_date", LocalDate.now().toString()))
               .user(userMessageContent)
               .advisors(a -> a.param(CHAT_MEMORY_CONVERSATION_ID_KEY, chatId).param(CHAT_MEMORY_RETRIEVE_SIZE_KEY, 100))
               .stream()
               .content();
    }
}
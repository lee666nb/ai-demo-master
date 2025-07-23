/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.fox.alibabaaidemo.controller;

import com.fox.myredismemory.RedisChatMemory;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.memory.InMemoryChatMemory;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import static org.springframework.ai.chat.client.advisor.AbstractChatMemoryAdvisor.CHAT_MEMORY_CONVERSATION_ID_KEY;
import static org.springframework.ai.chat.client.advisor.AbstractChatMemoryAdvisor.CHAT_MEMORY_RETRIEVE_SIZE_KEY;


@RestController
@RequestMapping("/chat-memory")
public class ChatMemoryController {

	private final ChatClient chatClient;

	public ChatMemoryController(ChatModel chatModel) {

		this.chatClient = ChatClient
				.builder(chatModel)
				.defaultSystem("你是一个旅游规划师，请根据用户的需求提供旅游规划建议。")
//				.defaultAdvisors(new MessageChatMemoryAdvisor(new InMemoryChatMemory()))
//				.defaultAdvisors(new MessageChatMemoryAdvisor(new RedisChatMemory(
//						"127.0.0.1",
//						6379,
//						null
//				)))
				.build();
	}


	/**
	 * 获取内存中的聊天内容
	 * 根据提供的prompt和chatId，从内存中获取相关的聊天内容，并设置响应的字符编码为UTF-8。
	 *
	 * @param prompt 用于获取聊天内容的提示信息
	 * @param chatId 聊天的唯一标识符，用于区分不同的聊天会话
	 * @param response HTTP响应对象，用于设置响应的字符编码
	 * @return 返回包含聊天内容的Flux<String>对象
	 */
	@GetMapping("/in-memory")
	public Flux<String> memory(
			@RequestParam("prompt") String prompt,
			@RequestParam("chatId") String chatId,
			HttpServletResponse response
	) {

		response.setCharacterEncoding("UTF-8");
		return chatClient.prompt(prompt).advisors(
				a -> a
						.param(CHAT_MEMORY_CONVERSATION_ID_KEY, chatId)
						.param(CHAT_MEMORY_RETRIEVE_SIZE_KEY, 100)
		).stream().content();
	}

	/**
	 * 从Redis中获取聊天内容
	 * 根据提供的prompt和chatId，从Redis中检索聊天内容，并以Flux<String>的形式返回
	 *
	 * @param prompt 聊天内容的提示或查询关键字
	 * @param chatId 聊天的唯一标识符，用于从Redis中检索特定的聊天内容
	 * @param response HttpServletResponse对象，用于设置响应的字符编码为UTF-8
	 * @return Flux<String> 包含聊天内容的反应式流
	 */
	@GetMapping("/redis")
	public Flux<String> redis(
			@RequestParam("prompt") String prompt,
			@RequestParam("chatId") String chatId,
			HttpServletResponse response
	) {

		response.setCharacterEncoding("UTF-8");

		return chatClient.prompt(prompt)
//				.advisors(
//				a -> a
//						.param(CHAT_MEMORY_CONVERSATION_ID_KEY, chatId)
//						.param(CHAT_MEMORY_RETRIEVE_SIZE_KEY, 10)
//				)
				.stream().content();
	}

}

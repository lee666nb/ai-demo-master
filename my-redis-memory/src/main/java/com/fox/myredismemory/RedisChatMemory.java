package com.fox.myredismemory;

import java.util.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.messages.UserMessage;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;

import org.springframework.ai.chat.memory.ChatMemory;
import org.springframework.ai.chat.messages.Message;

/**
 *
 * 基于Redis的聊天记忆实现。
 * 该类实现了ChatMemory接口，提供了将聊天消息存储到Redis中的功能。
 *
 * @author Fox
 */
public class RedisChatMemory implements ChatMemory, AutoCloseable {

    private static final Logger logger = LoggerFactory.getLogger(RedisChatMemory.class);

    private static final String DEFAULT_KEY_PREFIX = "chat:";

    private static final String DEFAULT_HOST = "127.0.0.1";

    private static final int DEFAULT_PORT = 6379;

    private static final String DEFAULT_PASSWORD = null;

    private final JedisPool jedisPool;


    private final ObjectMapper objectMapper;

    public RedisChatMemory() {

        this(DEFAULT_HOST, DEFAULT_PORT, DEFAULT_PASSWORD);
    }

    public RedisChatMemory(String host, int port, String password) {

        JedisPoolConfig poolConfig = new JedisPoolConfig();

        this.jedisPool = new JedisPool(poolConfig, host, port, 2000, password);
        this.objectMapper = new ObjectMapper();
        logger.info("Connected to Redis at {}:{}", host, port);
    }

    @Override
    public void add(String conversationId, List<Message> messages) {

        String key = DEFAULT_KEY_PREFIX + conversationId;

        AtomicLong timestamp = new AtomicLong(System.currentTimeMillis());

        try (Jedis jedis = jedisPool.getResource()) {
            // 使用pipeline批量操作提升性能
            var pipeline = jedis.pipelined();
            messages.forEach(message ->
                    pipeline.hset(key, String.valueOf(timestamp.getAndIncrement()), message.toString())
            );
            pipeline.sync();
        }

        logger.info("Added messages to conversationId: {}", conversationId);
    }

    @Override
    public List<Message> get(String conversationId, int lastN) {

        String key = DEFAULT_KEY_PREFIX + conversationId;

        try (Jedis jedis = jedisPool.getResource()) {
            Map<String, String> allMessages = jedis.hgetAll(key);
            if (allMessages.isEmpty()) {
                return List.of();
            }

            return allMessages.entrySet().stream()
                    .sorted((e1, e2) ->
                            Long.compare(Long.parseLong(e2.getKey()), Long.parseLong(e1.getKey()))
                    )
                    .limit(lastN)
                    .map(entry -> new UserMessage(entry.getValue()))
                    .collect(Collectors.toList());
        }


    }

    @Override
    public void clear(String conversationId) {

        String key = DEFAULT_KEY_PREFIX + conversationId;

        try (Jedis jedis = jedisPool.getResource()) {
            jedis.del(key);
        }
        logger.info("Cleared messages for conversationId: {}", conversationId);
    }

    @Override
    public void close() {
        try (Jedis jedis = jedisPool.getResource()) {
            if (jedis != null) {

                jedis.close();

                logger.info("Redis connection closed.");
            }
            if (jedisPool != null) {

                jedisPool.close();

                logger.info("Jedis pool closed.");
            }
        }

    }

    public void clearOverLimit(String conversationId, int maxLimit, int deleteSize) {
        try {
            String key = DEFAULT_KEY_PREFIX + conversationId;
            try (Jedis jedis = jedisPool.getResource()) {
                List<String> all = jedis.lrange(key, 0, -1);

                if (all.size() >= maxLimit) {
                    all = all.stream().skip(Math.max(0, deleteSize)).toList();
                }
                this.clear(conversationId);
                for (String message : all) {
                    jedis.rpush(key, message);
                }
            }
        }
        catch (Exception e) {
            logger.error("Error clearing messages from Redis chat memory", e);
            throw new RuntimeException(e);
        }
    }

}
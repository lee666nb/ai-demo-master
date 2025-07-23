package com.fox.higressdemo.demo;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

public class OpenAIClient {

    private static final String API_URL = "http://192.168.65.185:8080/v1/chat/completions";

    public static void main(String[] args) {
        // 创建请求头
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // 创建请求体
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", "qwen-turbo");

        Map<String, String> message = new HashMap<>();
        message.put("role", "user");
        message.put("content", "你是谁!");
        requestBody.put("messages", Arrays.asList(message));

        // 创建 HttpEntity 对象
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        // 创建 RestTemplate 实例
        RestTemplate restTemplate = new RestTemplate();

        // 发送 POST 请求
        ResponseEntity<String> response = restTemplate.postForEntity(API_URL, entity, String.class);

        // 打印响应结果
        System.out.println("响应状态码: " + response.getStatusCode());
        System.out.println("响应体: " + response.getBody());
    }
} 
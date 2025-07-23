package com.fox.alibabaaidemo.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.lang.reflect.Type;
import java.util.List;

@RestController
public class ChatController {

    private final ChatClient chatClient;

    public ChatController(ChatClient.Builder builder) {
        this.chatClient = builder
                .defaultSystem("你是一个演员，请列出你所参演的电影")
                .build();
    }


    @GetMapping("/chat")
    public String chat(@RequestParam(value = "input") String input) {

        return this.chatClient.prompt()
                .user(input)
                .call()
                .content();
    }



    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> stream(String input) {
        return this.chatClient.prompt()
                .user(input)
                .stream()
                .content();
    }


    /**
     * 演员电影信息类
     */
    static class ActorFilms {
        private final String actor;
        private final List<String> movies;

        public ActorFilms(String actor, List<String> movies) {
            this.actor = actor;
            this.movies = movies;
        }

        public String getActor() {
            return actor;
        }

        public List<String> getMovies() {
            return movies;
        }
    }

    @GetMapping("/movies")
    public ActorFilms movies(@RequestParam(value = "input") String input) throws Exception {
        String json = this.chatClient.prompt()
                .user(input)
                .call()
                .content();
        return new ObjectMapper().readValue(json, ActorFilms.class);
    }

    @GetMapping("/movies2")
    public List<ActorFilms> movies2(@RequestParam(value = "input") String input) throws Exception {
        String json = this.chatClient.prompt()
                .user(input)
                .call()
                .content();
        return new ObjectMapper().readValue(json, new TypeReference<List<ActorFilms>>() {});
    }




}
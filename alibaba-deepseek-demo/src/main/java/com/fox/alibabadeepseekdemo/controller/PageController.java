package com.fox.alibabadeepseekdemo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    @GetMapping("/")
    public String index() {
        return "redirect:/login";
    }

    @GetMapping("/login")
    public String loginPage() {
        return "forward:/static/login.html";
    }

    @GetMapping("/register")
    public String registerPage() {
        return "forward:/static/register.html";
    }

    @GetMapping("/chat")
    public String chatPage() {
        return "forward:/static/chat.html";
    }

    @GetMapping("/ecmo")
    public String ecmoPage() {
        return "forward:/static/ecmo-expert.html";
    }

    @GetMapping("/ecmo-expert")
    public String ecmoExpertPage() {
        return "forward:/static/ecmo-expert.html";
    }
}

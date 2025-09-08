package com.fox.alibabadeepseekdemo.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class PageController {

    @GetMapping("/")
    public String index() {
        return "redirect:/login.html"; // 直接使用静态页面
    }

    @GetMapping("/login")
    public String loginPage() {
        return "redirect:/login.html"; // 避免循环视图
    }

    @GetMapping("/register")
    public String registerPage() {
        return "redirect:/register.html";
    }

    @GetMapping("/ecmo")
    public String ecmoPage() {
        return "redirect:/ecmo-expert.html";
    }

    @GetMapping("/ecmo-expert")
    public String ecmoExpertPage() {
        return "redirect:/ecmo-expert.html";
    }
}

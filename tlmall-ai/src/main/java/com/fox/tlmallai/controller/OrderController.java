package com.fox.tlmallai.controller;


import com.fox.tlmallai.data.Order;
import com.fox.tlmallai.services.OrderService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;

@Controller
@RequestMapping("/")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @RequestMapping("/")
    public String index() {
        return "index";
    }

    @RequestMapping("/api/orders")
    @ResponseBody
    public List<Order> getOrders() {
        return orderService.getOrders();
    }
}
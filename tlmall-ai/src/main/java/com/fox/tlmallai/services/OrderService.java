package com.fox.tlmallai.services;


import com.fox.tlmallai.data.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

@Service
public class OrderService{

    @Autowired
    private RestTemplate restTemplate;


    public List<Order> getOrders() {
        // 尝试远程调用
        String url = "http://localhost:8081/orders/list";
        return restTemplate.getForObject(url, List.class);
    }

    public List<Order> getOrdersByUserId(String userId) {

        // 尝试远程调用
        String url = "http://localhost:8081/orders/user/" + userId;
        return restTemplate.getForObject(url, List.class);

    }

    public Order getOrderById(String orderId) {
        String url = "http://localhost:8081/orders/{orderId}";
        return restTemplate.getForObject(url, Order.class, orderId);
    }

    public boolean cancelOrder(String orderId) {
        String url = "http://localhost:8081/orders/cancel/{orderId}";
        return restTemplate.postForObject(url, null, Boolean.class, orderId);
    }


}
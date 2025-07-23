package com.fox.tlmallai.services;


import com.fox.tlmallai.data.Order;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Description;
import org.springframework.core.NestedExceptionUtils;

import java.util.List;
import java.util.function.Function;

@Configuration
public class OrderTools {

    private static final Logger logger = LoggerFactory.getLogger(OrderTools.class);

    @Autowired
    private OrderService orderService;

    public record OrderRequest(String orderId) {
    }

    public record CancelOrderRequest(String orderId,Integer orderStatus) {
    }

    public record OrderUserRequest(String userId) {
    }

    @Bean
    @Description("根据用户ID获取订单列表")
    public Function<OrderUserRequest, List<Order>> getOrderByUserId() {
        return request -> {
            try {
                return orderService.getOrdersByUserId(request.userId());
            } catch (Exception e) {
                logger.warn("用户的订单列表: {}", NestedExceptionUtils.getMostSpecificCause(e).getMessage());
                return null;
            }
        };
    }


    @Bean
    @Description("获取订单详细信息")
    public Function<OrderRequest, Order> getOrderDetails() {
        return request -> {
            try {
                return orderService.getOrderById(request.orderId());
            } catch (Exception e) {
                logger.warn("Order详情: {}", NestedExceptionUtils.getMostSpecificCause(e).getMessage());
                return null;
            }
        };
    }

    @Bean
    @Description("取消订单")
    public Function<CancelOrderRequest, String> cancelOrder() {

        return request -> {
            validateCancelOrder(request.orderId(),request.orderStatus());
            orderService.cancelOrder(request.orderId());
            return "";
        };
    }

    /**
     * 取消订单逻辑校验
     * @throws IllegalStateException 当订单状态≥2时抛出异常
     */
    public void validateCancelOrder(String orderId,Integer orderStatus) {
        // 状态验证
        if (orderStatus >= 2) {
            throw new IllegalStateException("订单[" + orderId + "]已发货/完成，不可取消");
        }

        //  其他逻辑验证

    }
}
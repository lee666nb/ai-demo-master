package com.fox.toolcallingdemo.tool.product;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class Product {
    private String productId;
    private String productName;
    private String description;
    private String specifications;
    private String usageInfo;
    private String brand;
    private BigDecimal price;
    private Integer stockQuantity;
    private String categoryId;
    private Integer status;
}
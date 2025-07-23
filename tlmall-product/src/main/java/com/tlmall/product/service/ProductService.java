package com.tlmall.product.service;

import com.tlmall.product.entity.Product;
import java.util.List;

public interface ProductService {
    Product getProductById(String productId);
    List<Product> getProductsByCategoryId(String categoryId);
    List<Product> getProductsByBrandAndCategoryId(String brand, String categoryId);
}
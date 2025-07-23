package com.tlmall.product.service.impl;

import com.tlmall.product.entity.Product;
import com.tlmall.product.mapper.ProductMapper;
import com.tlmall.product.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductServiceImpl implements ProductService {
    @Autowired
    private ProductMapper productMapper;

    @Override
    public Product getProductById(String productId) {
        return productMapper.selectByProductId(productId);
    }

    @Override
    public List<Product> getProductsByCategoryId(String categoryId) {
        return productMapper.selectByCategoryId(categoryId);
    }

    @Override
    public List<Product> getProductsByBrandAndCategoryId(String brand, String categoryId) {
        return productMapper.selectByBrandAndCategoryId(brand, categoryId);
    }
}
package com.fox.promptdemo.config;

import com.alibaba.cloud.ai.prompt.ConfigurablePromptTemplateFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PromptTemplateConfig {

    @Bean
    public ConfigurablePromptTemplateFactory configurablePromptTemplateFactory() {
        // 这里假设ConfigurablePromptTemplateFactory有一个无参构造函数
        return new ConfigurablePromptTemplateFactory();
        // 如果需要配置参数，可以在这里进行配置
        // return new ConfigurablePromptTemplateFactory(param1, param2);
    }
}
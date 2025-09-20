# ECMO专家诊疗系统部署指南

##  部署概述

本系统使用MySQL数据库持久化所有用户数据，包括：
- 用户注册信息
- 个人资料和头像
- ECMO评估记录
- 诊断历史

##  生产环境部署步骤

### 1. 云服务器选择
推荐选择以下云服务商：

腾讯云CVM + 云数据库MySQL


### 2. 数据库配置

#### 2.1 创建云数据库实例
```sql
-- 数据库配置
数据库类型: MySQL 8.0
字符集: utf8mb4
排序规则: utf8mb4_unicode_ci
存储引擎: InnoDB
```

#### 2.2 生产环境配置文件
创建 `application-prod.yml`:

```yaml
server:
  port: 8080

spring:
  application:
    name: ecmo-expert-system
  
  datasource:
    url: jdbc:mysql://你的云数据库地址:3306/ECMO?useSSL=true&serverTimezone=Asia/Shanghai&characterEncoding=utf8mb4&useUnicode=true
    driver-class-name: com.mysql.cj.jdbc.Driver
    username: ${DB_USERNAME:your_db_username}
    password: ${DB_PASSWORD:your_db_password}
    hikari:
      maximum-pool-size: 50
      minimum-idle: 10
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000

  jpa:
    hibernate:
      ddl-auto: validate  # 生产环境使用validate，不要用update
    show-sql: false       # 生产环境关闭SQL日志
    properties:
      hibernate:
        dialect: org.hibernate.dialect.MySQLDialect

  ai:
    openai:
      api-key: ${AI_API_KEY:your_api_key}
      base-url: https://api.siliconflow.cn

logging:
  level:
    com.fox.alibabadeepseekdemo: INFO
    root: WARN
```

### 3. 数据备份策略

#### 3.1 自动备份
```bash
# 每日凌晨2点自动备份
0 2 * * * /usr/bin/mysqldump -h你的数据库地址 -u用户名 -p密码 ECMO > /backup/ecmo_$(date +\%Y\%m\%d).sql
```

#### 3.2 备份保留策略
- 每日备份保留30天
- 每周备份保留12周
- 每月备份保留12个月

### 4. 安全配置

#### 4.1 数据库安全
- 启用SSL连接
- 设置白名单IP访问
- 定期更换数据库密码
- 启用慢查询日志监控

#### 4.2 应用安全
- 使用HTTPS协议
- 配置防火墙规则
- 定期更新依赖包
- 启用应用监控

### 5. 扩容策略

#### 5.1 数据库扩容
- **读写分离**：配置主从数据库
- **分库分表**：当数据量超过500万条时考虑
- **缓存层**：添加Redis缓存热点数据

#### 5.2 应用扩容
- **负载均衡**：使用Nginx或ALB
- **多实例部署**：水平扩展应用服务器
- **CDN加速**：静态资源使用CDN

### 6. 监控告警

#### 6.1 数据库监控
- 连接数监控
- 慢查询监控
- 磁盘空间监控
- 主从延迟监控

#### 6.2 应用监控
- JVM内存监控
- 接口响应时间
- 错误率统计
- 用户活跃度

## 📈 数据增长预估

| 用户规模 | 日活跃 | 存储需求 | 建议配置 |
|---------|--------|----------|----------|
| 1000用户 | 100人 | 500MB | 1核2G + 20G存储 |
| 1万用户 | 1000人 | 5GB | 2核4G + 100G存储 |
| 10万用户 | 1万人 | 50GB | 4核8G + 500G存储 |
| 100万用户 | 10万人 | 500GB | 8核16G + 2T存储 |

## 🔧 部署命令

### 打包应用
```bash
mvn clean package -Pprod
```

### 启动应用
```bash
java -jar -Dspring.profiles.active=prod target/alibaba-deepseek-demo-1.0.jar
```

### Docker部署
```dockerfile
FROM openjdk:17-jre-slim
COPY target/alibaba-deepseek-demo-1.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar", "--spring.profiles.active=prod"]
```

##  注意事项

1. **数据库初始化**：首次部署时需要执行 `database_schema.sql`
2. **环境变量**：敏感信息通过环境变量配置
3. **SSL证书**：生产环境必须使用HTTPS
4. **定期备份**：确保数据安全
5. **监控告警**：及时发现和处理问题

##  技术支持

如遇到部署问题，请检查：
1. 数据库连接是否正常
2. 防火墙端口是否开放
3. SSL证书是否有效
4. 应用日志错误信息

package com.fox.alibabadeepseekdemo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class UserController {

    // 模拟数据库存储用户信息
    private final Map<String, User> users = new ConcurrentHashMap<>();
    private final Map<String, User> usersByEmail = new ConcurrentHashMap<>();

    // 邮箱验证正则表达式
    private final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$"
    );

    // 用户名验证正则表达式
    private final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_]{3,20}$");

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        Map<String, Object> response = new HashMap<>();

        try {
            // 验证输入参数
            String validationError = validateRegisterRequest(request);
            if (validationError != null) {
                response.put("success", false);
                response.put("message", validationError);
                return ResponseEntity.badRequest().body(response);
            }

            // 检查用户名是否已存在
            if (users.containsKey(request.getUsername())) {
                response.put("success", false);
                response.put("message", "用户名已存在，请选择其他用户名");
                return ResponseEntity.badRequest().body(response);
            }

            // 检查邮箱是否已存在
            if (usersByEmail.containsKey(request.getEmail())) {
                response.put("success", false);
                response.put("message", "邮箱已被注册，请使用其他邮箱");
                return ResponseEntity.badRequest().body(response);
            }

            // 创建新用户
            User newUser = new User();
            newUser.setUsername(request.getUsername());
            newUser.setEmail(request.getEmail());
            newUser.setPassword(hashPassword(request.getPassword())); // 简单哈希处理
            newUser.setCreatedAt(System.currentTimeMillis());

            // 保存用户
            users.put(request.getUsername(), newUser);
            usersByEmail.put(request.getEmail(), newUser);

            response.put("success", true);
            response.put("message", "注册成功！");
            response.put("username", request.getUsername());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "注册失败，请稍后重试");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        Map<String, Object> response = new HashMap<>();

        try {
            // 验证输入参数
            if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "用户名不能为空");
                return ResponseEntity.badRequest().body(response);
            }

            if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "密码不能为空");
                return ResponseEntity.badRequest().body(response);
            }

            // 查找用户
            User user = users.get(request.getUsername());
            if (user == null) {
                response.put("success", false);
                response.put("message", "用户名或密码错误");
                return ResponseEntity.badRequest().body(response);
            }

            // 验证密码
            if (!verifyPassword(request.getPassword(), user.getPassword())) {
                response.put("success", false);
                response.put("message", "用户名或密码错误");
                return ResponseEntity.badRequest().body(response);
            }

            // 登录成功
            response.put("success", true);
            response.put("message", "登录成功");
            response.put("username", user.getUsername());
            response.put("email", user.getEmail());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "登录失败，请稍后重试");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<Map<String, Object>> getUserInfo(@PathVariable String username) {
        Map<String, Object> response = new HashMap<>();

        User user = users.get(username);
        if (user == null) {
            response.put("success", false);
            response.put("message", "用户不存在");
            return ResponseEntity.notFound().build();
        }

        response.put("success", true);
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("createdAt", user.getCreatedAt());

        return ResponseEntity.ok(response);
    }

    private String validateRegisterRequest(RegisterRequest request) {
        if (request.getUsername() == null || request.getUsername().trim().isEmpty()) {
            return "用户名不能为空";
        }

        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            return "邮箱不能为空";
        }

        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            return "密码不能为空";
        }

        if (!USERNAME_PATTERN.matcher(request.getUsername()).matches()) {
            return "用户名只能包含字母、数字和下划线，长度3-20位";
        }

        if (!EMAIL_PATTERN.matcher(request.getEmail()).matches()) {
            return "请输入有效的邮箱地址";
        }

        if (request.getPassword().length() < 6) {
            return "密码长度至少6位";
        }

        return null; // 验证通过
    }

    private String hashPassword(String password) {
        // 简单的密码哈希处理，实际项目中应该使用更安全的哈希算法
        return Integer.toString(password.hashCode());
    }

    private boolean verifyPassword(String rawPassword, String hashedPassword) {
        return hashPassword(rawPassword).equals(hashedPassword);
    }

    // 内部类定义
    public static class RegisterRequest {
        private String username;
        private String email;
        private String password;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class LoginRequest {
        private String username;
        private String password;
        private boolean rememberMe;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public boolean isRememberMe() { return rememberMe; }
        public void setRememberMe(boolean rememberMe) { this.rememberMe = rememberMe; }
    }

    public static class User {
        private String username;
        private String email;
        private String password;
        private long createdAt;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        public long getCreatedAt() { return createdAt; }
        public void setCreatedAt(long createdAt) { this.createdAt = createdAt; }
    }
}

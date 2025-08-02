package com.fox.alibabadeepseekdemo.service;

import com.fox.alibabadeepseekdemo.entity.User;
import com.fox.alibabadeepseekdemo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User getUserByToken(String token) {
        Optional<User> userOpt = userRepository.findByAuthToken(token);
        return userOpt.orElse(null);
    }

    public User getUserByUsername(String username) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        return userOpt.orElse(null);
    }

    public User createUser(String username, String password, String email) {
        User user = new User(username, password, email);
        return userRepository.save(user);
    }

    public String generateToken(User user) {
        String token = UUID.randomUUID().toString();
        user.setAuthToken(token);
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        return token;
    }

    public boolean validateToken(String token) {
        User user = getUserByToken(token);
        return user != null;
    }

    public void logout(String token) {
        Optional<User> userOpt = userRepository.findByAuthToken(token);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setAuthToken(null);
            userRepository.save(user);
        }
    }

    public Map<String, Object> login(String username, String password) {
        Map<String, Object> result = new HashMap<>();

        try {
            Optional<User> userOpt = userRepository.findByUsername(username);

            if (userOpt.isEmpty()) {
                result.put("success", false);
                result.put("message", "用户不存在");
                return result;
            }

            User user = userOpt.get();

            if (!user.getPassword().equals(password)) {
                result.put("success", false);
                result.put("message", "密码错误");
                return result;
            }

            // 生成token
            String token = generateToken(user);

            result.put("success", true);
            result.put("message", "登录成功");
            result.put("token", token);
            result.put("user", Map.of(
                    "id", user.getId(),
                    "username", user.getUsername(),
                    "email", user.getEmail()
            ));

        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "登录失败：" + e.getMessage());
        }

        return result;
    }

    public Map<String, Object> register(String username, String password, String email) {
        Map<String, Object> result = new HashMap<>();

        try {
            // 检查用户名是否已存在
            if (userRepository.findByUsername(username).isPresent()) {
                result.put("success", false);
                result.put("message", "用户名已存在");
                return result;
            }

            // 检查邮箱是否已存在
            if (userRepository.findByEmail(email).isPresent()) {
                result.put("success", false);
                result.put("message", "邮箱已被注册");
                return result;
            }

            // 创建新用户
            User user = createUser(username, password, email);

            // 生成token
            String token = generateToken(user);

            result.put("success", true);
            result.put("message", "注册成功");
            result.put("token", token);
            result.put("user", Map.of(
                    "id", user.getId(),
                    "username", user.getUsername(),
                    "email", user.getEmail()
            ));

        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "注册失败：" + e.getMessage());
        }

        return result;
    }
}

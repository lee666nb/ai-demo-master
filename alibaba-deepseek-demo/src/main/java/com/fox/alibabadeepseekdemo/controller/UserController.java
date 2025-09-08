package com.fox.alibabadeepseekdemo.controller;

import com.fox.alibabadeepseekdemo.entity.User;
import com.fox.alibabadeepseekdemo.service.UserService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        Map<String, Object> resp = new HashMap<>();
        try {
            User user = userService.register(
                request.getUsername(),
                request.getEmail(),
                request.getPassword(),
                request.getRealName(),
                request.getDepartment(),
                request.getTitle(),
                request.getHospital()
            );

            resp.put("success", true);
            resp.put("message", "注册成功！");
            resp.put("user", Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail() != null ? user.getEmail() : "",
                "realName", user.getRealName() != null ? user.getRealName() : "",
                "department", user.getDepartment() != null ? user.getDepartment() : "",
                "title", user.getTitle() != null ? user.getTitle() : "",
                "hospital", user.getHospital() != null ? user.getHospital() : "",
                "avatarUrl", user.getAvatarUrl(),
                "createdAt", user.getCreatedAt()
            ));
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", "注册失败，请稍后重试");
            return ResponseEntity.internalServerError().body(resp);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody LoginRequest request) {
        Map<String, Object> resp = new HashMap<>();
        try {
            User user = userService.login(request.getUsername(), request.getPassword());

            resp.put("success", true);
            resp.put("message", "登录成功！");
            resp.put("user", Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail() != null ? user.getEmail() : "",
                "realName", user.getRealName() != null ? user.getRealName() : "",
                "department", user.getDepartment() != null ? user.getDepartment() : "",
                "title", user.getTitle() != null ? user.getTitle() : "",
                "hospital", user.getHospital() != null ? user.getHospital() : "",
                "avatarUrl", user.getAvatarUrl(),
                "lastLoginAt", user.getLastLoginAt()
            ));
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", "登录失败，请稍后重试");
            return ResponseEntity.internalServerError().body(resp);
        }
    }

    @PostMapping("/profile/update")
    public ResponseEntity<Map<String, Object>> updateProfile(@RequestBody UpdateProfileRequest request) {
        Map<String, Object> resp = new HashMap<>();
        try {
            User user = userService.updateProfile(
                request.getUserId(),
                request.getRealName(),
                request.getDepartment(),
                request.getTitle(),
                request.getHospital(),
                request.getPhone(),
                request.getEmail()
            );

            resp.put("success", true);
            resp.put("message", "个人信息更新成功！");
            resp.put("user", Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "email", user.getEmail() != null ? user.getEmail() : "",
                "realName", user.getRealName() != null ? user.getRealName() : "",
                "department", user.getDepartment() != null ? user.getDepartment() : "",
                "title", user.getTitle() != null ? user.getTitle() : "",
                "hospital", user.getHospital() != null ? user.getHospital() : "",
                "phone", user.getPhone() != null ? user.getPhone() : "",
                "avatarUrl", user.getAvatarUrl()
            ));
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", "更新失败，请稍后重试");
            return ResponseEntity.internalServerError().body(resp);
        }
    }

    @PostMapping("/avatar/update")
    public ResponseEntity<Map<String, Object>> updateAvatar(@RequestBody UpdateAvatarRequest request) {
        Map<String, Object> resp = new HashMap<>();
        try {
            User user = userService.updateAvatar(request.getUserId(), request.getAvatarUrl());

            resp.put("success", true);
            resp.put("message", "头像更新成功！");
            resp.put("avatarUrl", user.getAvatarUrl());
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", "头像更新失败，请稍后重试");
            return ResponseEntity.internalServerError().body(resp);
        }
    }

    @Data
    public static class RegisterRequest {
        private String username;
        private String email;
        private String password;
        private String realName;
        private String department;
        private String title;
        private String hospital;
    }

    @Data
    public static class LoginRequest {
        private String username;
        private String password;
    }

    @Data
    public static class UpdateProfileRequest {
        private Long userId;
        private String realName;
        private String department;
        private String title;
        private String hospital;
        private String phone;
        private String email;
    }

    @Data
    public static class UpdateAvatarRequest {
        private Long userId;
        private String avatarUrl;
    }
}

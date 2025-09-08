package com.fox.alibabadeepseekdemo.service;

import com.fox.alibabadeepseekdemo.entity.User;
import com.fox.alibabadeepseekdemo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$"
    );
    private static final Pattern USERNAME_PATTERN = Pattern.compile("^[a-zA-Z0-9_]{3,20}$");
    private static final String DEFAULT_AVATAR = "/static/image/default-avatar.jpg";

    public User register(String username, String email, String rawPassword, String realName, String department, String title, String hospital) {
        String err = validate(username, email, rawPassword);
        if (err != null) {
            throw new IllegalArgumentException(err);
        }

        if (userRepository.findByUsername(username).isPresent()) {
            throw new IllegalArgumentException("用户名已存在，请选择其他用户名");
        }

        if (email != null && userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("邮箱已被注册，请使用其他邮箱");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRealName(realName);
        user.setDepartment(department);
        user.setTitle(title);
        user.setHospital(hospital);
        user.setAvatarUrl(DEFAULT_AVATAR);
        user.setStatus(1);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        return userRepository.save(user);
    }

    public User register(String username, String email, String rawPassword) {
        return register(username, email, rawPassword, null, null, null, null);
    }

    public User login(String username, String rawPassword) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("用户名或密码错误");
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new IllegalArgumentException("用户名或密码错误");
        }

        if (user.getStatus() != 1) {
            throw new IllegalArgumentException("账户已被禁用，请联系管理员");
        }

        // 更新最后登录时间
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        return user;
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }

    public User findById(Long id) {
        return userRepository.findById(id).orElse(null);
    }

    public User updateProfile(Long userId, String realName, String department, String title, String hospital, String phone, String email) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));

        if (realName != null) user.setRealName(realName);
        if (department != null) user.setDepartment(department);
        if (title != null) user.setTitle(title);
        if (hospital != null) user.setHospital(hospital);
        if (phone != null) user.setPhone(phone);
        if (email != null && !email.equals(user.getEmail())) {
            if (userRepository.findByEmail(email).isPresent()) {
                throw new IllegalArgumentException("邮箱已被使用");
            }
            user.setEmail(email);
        }

        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    public User updateAvatar(Long userId, String avatarUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("用户不存在"));

        user.setAvatarUrl(avatarUrl);
        user.setUpdatedAt(LocalDateTime.now());
        return userRepository.save(user);
    }

    private String validate(String username, String email, String password) {
        if (username == null || username.isBlank()) {
            return "用户名不能为空";
        }
        if (!USERNAME_PATTERN.matcher(username).matches()) {
            return "用户名只能包含字母、数字和下划线，长度3-20字符";
        }
        if (email != null && !email.isBlank() && !EMAIL_PATTERN.matcher(email).matches()) {
            return "邮箱格式不正确";
        }
        if (password == null || password.length() < 6) {
            return "密码长度至少6字符";
        }
        if (password.length() > 100) {
            return "密码长度不能超过100字符";
        }
        return null;
    }
}

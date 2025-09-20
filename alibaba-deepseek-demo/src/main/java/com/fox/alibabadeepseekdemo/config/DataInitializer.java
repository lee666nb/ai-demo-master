package com.fox.alibabadeepseekdemo.config;

import com.fox.alibabadeepseekdemo.entity.User;
import com.fox.alibabadeepseekdemo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {

    private final PasswordEncoder passwordEncoder;

    @Bean
    public CommandLineRunner initDefaultUser(UserRepository userRepository) {
        return args -> {
            final String defaultUsername = "doctor";
            final String defaultPassword = "ecmo123";
            if (userRepository.findByUsername(defaultUsername).isEmpty()) {
                User u = new User();
                u.setUsername(defaultUsername);
                u.setPassword(passwordEncoder.encode(defaultPassword));
                u.setEmail("doctor@example.com");
                u.setRealName("ECMO医生");
                u.setDepartment("重症医学科");
                u.setTitle("主任医师");
                u.setHospital("示例医院");
                u.setAvatarUrl("/static/image/1.jpg");
                u.setStatus(1);
                u.setCreatedAt(LocalDateTime.now());
                u.setUpdatedAt(LocalDateTime.now());
                userRepository.save(u);
            }
        };
    }
}


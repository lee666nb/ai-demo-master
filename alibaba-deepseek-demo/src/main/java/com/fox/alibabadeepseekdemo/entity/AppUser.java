package com.fox.alibabadeepseekdemo.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "app_user", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"username"}),
        @UniqueConstraint(columnNames = {"email"})
})
public class AppUser {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(nullable = false, length = 120)
    private String email;

    @Column(nullable = false, length = 200)
    private String password;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    @Column(length = 120)
    private String nickname;

    @Column(length = 500)
    private String bio;

    @Column(length = 300)
    private String avatar; // 可以是相对路径或data URL
}

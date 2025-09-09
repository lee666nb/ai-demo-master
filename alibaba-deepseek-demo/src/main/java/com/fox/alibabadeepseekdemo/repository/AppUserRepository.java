package com.fox.alibabadeepseekdemo.repository;

import com.fox.alibabadeepseekdemo.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByUsername(String username);
    Optional<AppUser> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    // 添加统计方法
    long countByCreatedAtAfter(Instant instant);

    @Query("SELECT COUNT(u) FROM AppUser u WHERE u.createdAt >= :startTime")
    long countUsersCreatedAfter(@Param("startTime") Instant startTime);
}

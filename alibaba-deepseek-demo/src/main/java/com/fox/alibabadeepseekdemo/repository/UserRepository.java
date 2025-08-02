package com.fox.alibabadeepseekdemo.repository;

import com.fox.alibabadeepseekdemo.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByAuthToken(String authToken);

    Optional<User> findByEmail(String email);
}

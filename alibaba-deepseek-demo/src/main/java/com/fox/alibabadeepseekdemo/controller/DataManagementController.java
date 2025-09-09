package com.fox.alibabadeepseekdemo.controller;

import com.fox.alibabadeepseekdemo.entity.AppUser;
import com.fox.alibabadeepseekdemo.entity.AssessmentHistory;
import com.fox.alibabadeepseekdemo.repository.AppUserRepository;
import com.fox.alibabadeepseekdemo.repository.AssessmentHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 数据管理控制器
 * 用于管理和监控用户数据
 */
@RestController
@RequestMapping("/api/admin")
public class DataManagementController {

    @Autowired
    private AppUserRepository userRepository;

    @Autowired
    private AssessmentHistoryRepository assessmentRepository;

    /**
     * 获取系统数据统计
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSystemStats() {
        Map<String, Object> stats = new HashMap<>();

        // 用户统计
        long totalUsers = userRepository.count();
        long todayUsers = userRepository.countByCreatedAtAfter(
            LocalDateTime.now().minusDays(1).atZone(java.time.ZoneId.systemDefault()).toInstant()
        );

        // 评估统计
        long totalAssessments = assessmentRepository.count();
        long todayAssessments = assessmentRepository.countByAssessmentDateAfter(
            LocalDateTime.now().minusDays(1)
        );

        stats.put("totalUsers", totalUsers);
        stats.put("todayUsers", todayUsers);
        stats.put("totalAssessments", totalAssessments);
        stats.put("todayAssessments", todayAssessments);
        stats.put("lastUpdated", LocalDateTime.now());

        return ResponseEntity.ok(stats);
    }

    /**
     * 获取用户列表
     */
    @GetMapping("/users")
    public ResponseEntity<List<AppUser>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        // 这里应该使用分页，简化版本
        List<AppUser> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }

    /**
     * 数据备份状态
     */
    @GetMapping("/backup-status")
    public ResponseEntity<Map<String, Object>> getBackupStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("lastBackup", "手动备份 - 请使用mysqldump命令");
        status.put("backupLocation", "建议备份到云存储");
        status.put("autoBackupEnabled", false);
        status.put("recommendation", "建议启用自动备份");

        return ResponseEntity.ok(status);
    }
}

package com.fox.alibabadeepseekdemo.repository;

import com.fox.alibabadeepseekdemo.entity.ECMOAssessment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ECMOAssessmentRepository extends JpaRepository<ECMOAssessment, Long> {

    // 根据用户ID查找评估记录
    List<ECMOAssessment> findByUserIdOrderByCreatedAtDesc(Long userId);

    // 根据患者ID查找评估记录
    List<ECMOAssessment> findByPatientIdOrderByCreatedAtDesc(String patientId);

    // 根据风险等级查找评估记录
    List<ECMOAssessment> findByRiskLevelOrderByCreatedAtDesc(String riskLevel);

    // 根据用户ID和时间范围查找评估记录
    @Query("SELECT a FROM ECMOAssessment a WHERE a.userId = :userId AND a.createdAt BETWEEN :startTime AND :endTime ORDER BY a.createdAt DESC")
    List<ECMOAssessment> findByUserIdAndDateRange(@Param("userId") Long userId,
                                                  @Param("startTime") LocalDateTime startTime,
                                                  @Param("endTime") LocalDateTime endTime);

    // 根据用户ID和患者ID查找最新评估记录
    ECMOAssessment findFirstByUserIdAndPatientIdOrderByCreatedAtDesc(Long userId, String patientId);
}

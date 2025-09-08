package com.fox.alibabadeepseekdemo.repository;

import com.fox.alibabadeepseekdemo.entity.AssessmentHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AssessmentHistoryRepository extends JpaRepository<AssessmentHistory, Long> {

    // 根据用户ID查找历史记录（仅已保存的）
    List<AssessmentHistory> findByUserIdAndIsSavedOrderByAssessmentDateDesc(Long userId, Integer isSaved);

    // 根据用户ID和风险等级查找历史记录
    List<AssessmentHistory> findByUserIdAndRiskLevelAndIsSavedOrderByAssessmentDateDesc(Long userId, String riskLevel, Integer isSaved);

    // 根据患者ID搜索历史记录
    @Query("SELECT h FROM AssessmentHistory h WHERE h.userId = :userId AND h.isSaved = 1 AND (h.patientId LIKE %:keyword% OR h.patientName LIKE %:keyword% OR h.diagnosisSummary LIKE %:keyword%) ORDER BY h.assessmentDate DESC")
    List<AssessmentHistory> searchByKeyword(@Param("userId") Long userId, @Param("keyword") String keyword);

    // 根据用户ID和时间范围查找历史记录
    @Query("SELECT h FROM AssessmentHistory h WHERE h.userId = :userId AND h.isSaved = 1 AND h.assessmentDate BETWEEN :startTime AND :endTime ORDER BY h.assessmentDate DESC")
    List<AssessmentHistory> findByUserIdAndDateRange(@Param("userId") Long userId,
                                                     @Param("startTime") LocalDateTime startTime,
                                                     @Param("endTime") LocalDateTime endTime);

    // 查找收藏的记录
    List<AssessmentHistory> findByUserIdAndIsFavoriteAndIsSavedOrderByAssessmentDateDesc(Long userId, Integer isFavorite, Integer isSaved);

    // 统计用户的评估记录数量
    long countByUserIdAndIsSaved(Long userId, Integer isSaved);
}

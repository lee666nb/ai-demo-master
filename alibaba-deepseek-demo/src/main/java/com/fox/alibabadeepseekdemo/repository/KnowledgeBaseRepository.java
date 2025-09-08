package com.fox.alibabadeepseekdemo.repository;

import com.fox.alibabadeepseekdemo.entity.KnowledgeBase;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface KnowledgeBaseRepository extends JpaRepository<KnowledgeBase, Long> {

    // 根据分类查找知识
    List<KnowledgeBase> findByCategoryAndStatusOrderBySortOrderAscCreatedAtDesc(String category, Integer status);

    // 根据难度等级查找知识
    List<KnowledgeBase> findByDifficultyLevelAndStatusOrderBySortOrderAscCreatedAtDesc(String difficultyLevel, Integer status);

    // 全文搜索
    @Query("SELECT k FROM KnowledgeBase k WHERE k.status = 1 AND (k.title LIKE %:keyword% OR k.content LIKE %:keyword% OR k.summary LIKE %:keyword% OR k.tags LIKE %:keyword%) ORDER BY k.sortOrder ASC, k.createdAt DESC")
    List<KnowledgeBase> searchByKeyword(@Param("keyword") String keyword);

    // 根据标签查找知识
    @Query("SELECT k FROM KnowledgeBase k WHERE k.status = 1 AND k.tags LIKE %:tag% ORDER BY k.sortOrder ASC, k.createdAt DESC")
    List<KnowledgeBase> findByTag(@Param("tag") String tag);

    // 获取所有已发布的知识，按分类和排序
    List<KnowledgeBase> findByStatusOrderByCategoryAscSortOrderAscCreatedAtDesc(Integer status);

    // 获取热门知识（根据浏览次数）
    List<KnowledgeBase> findByStatusOrderByViewCountDescCreatedAtDesc(Integer status);

    // 统计各分类的知识数量
    @Query("SELECT k.category, COUNT(k) FROM KnowledgeBase k WHERE k.status = 1 GROUP BY k.category")
    List<Object[]> countByCategory();
}

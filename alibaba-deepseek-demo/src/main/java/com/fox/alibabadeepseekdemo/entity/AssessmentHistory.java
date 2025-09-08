package com.fox.alibabadeepseekdemo.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "assessment_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssessmentHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "assessment_id", nullable = false)
    private Long assessmentId;

    @Column(name = "patient_id", length = 50)
    private String patientId;

    @Column(name = "patient_name", length = 100)
    private String patientName;

    @Column(name = "assessment_title", length = 200)
    private String assessmentTitle;

    @Column(name = "risk_level", length = 20)
    private String riskLevel;

    @Column(name = "risk_score", precision = 5, scale = 2)
    private BigDecimal riskScore;

    @Column(name = "diagnosis_summary", length = 500)
    private String diagnosisSummary;

    @Column(name = "assessment_date")
    private LocalDateTime assessmentDate;

    @Column(name = "is_saved", columnDefinition = "TINYINT DEFAULT 1")
    private Integer isSaved = 1;

    @Column(name = "is_favorite", columnDefinition = "TINYINT DEFAULT 0")
    private Integer isFavorite = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // 与User实体的关联
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private User user;

    // 与ECMOAssessment实体的关联
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assessment_id", insertable = false, updatable = false)
    private ECMOAssessment assessment;
}

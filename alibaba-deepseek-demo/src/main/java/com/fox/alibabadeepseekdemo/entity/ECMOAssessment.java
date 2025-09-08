package com.fox.alibabadeepseekdemo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * ECMO评估结果实体类
 * 包含完整的ECMO评估信息和诊断结果
 */
@Entity
@Table(name = "ecmo_assessments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ECMOAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "patient_id", length = 50)
    private String patientId;

    @Column(name = "assessment_title", length = 200)
    private String assessmentTitle;

    // 基本信息
    @Column(nullable = false)
    private Integer age;

    @Column(nullable = false, length = 10)
    private String gender;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal weight;

    @Column(precision = 5, scale = 2)
    private BigDecimal height;

    // 生命体征
    @Column(name = "heart_rate", nullable = false)
    private Integer heartRate;

    @Column(name = "systolic_bp", nullable = false)
    private Integer systolicBp;

    @Column(name = "diastolic_bp", nullable = false)
    private Integer diastolicBp;

    @Column(precision = 4, scale = 2)
    private BigDecimal temperature;

    @Column(name = "respiratory_rate", nullable = false)
    private Integer respiratoryRate;

    @Column(name = "oxygen_saturation", nullable = false, precision = 5, scale = 2)
    private BigDecimal oxygenSaturation;

    // 血气分析
    @Column(nullable = false, precision = 4, scale = 3)
    private BigDecimal ph;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal pco2;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal po2;

    @Column(precision = 5, scale = 2)
    private BigDecimal hco3;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal lactate;

    // 心脏功能
    @Column(name = "ejection_fraction", precision = 5, scale = 2)
    private BigDecimal ejectionFraction;

    @Column(name = "troponin_i", precision = 8, scale = 3)
    private BigDecimal troponinI;

    @Column(precision = 8, scale = 2)
    private BigDecimal bnp;

    @Column(name = "ecg_findings", columnDefinition = "TEXT")
    private String ecgFindings;

    // 临床状况
    @Column(name = "glasgow_coma_scale")
    private Integer glasgowComaScale;

    @Column(name = "on_ventilator", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean onVentilator = false;

    @Column(name = "on_vasopressors", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean onVasopressors = false;

    @Column(name = "primary_diagnosis", length = 500)
    private String primaryDiagnosis;

    @Column(name = "clinical_presentation", columnDefinition = "TEXT")
    private String clinicalPresentation;

    // 评估结果 - 数据库字段
    @Column(name = "risk_level", length = 20)
    private String riskLevel;

    @Column(name = "risk_score", precision = 5, scale = 2)
    private BigDecimal riskScore;

    @Column(columnDefinition = "TEXT")
    private String recommendation;

    @Column(name = "diagnosis_conclusion", columnDefinition = "TEXT")
    private String diagnosisConclusion;

    @Column(name = "ecmo_indication", columnDefinition = "BOOLEAN")
    private Boolean ecmoIndication;

    // 其他信息
    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "assessment_type", length = 20)
    private String assessmentType = "STANDARD";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ===== 非持久化字段 - 用于业务逻辑 =====

    // 评估ID (用于前端)
    @Transient
    private String assessmentId;

    // ECMO可用性
    @Transient
    private Boolean canUseECMO;

    // 诊断信息
    @Transient
    private String diagnosis;

    @Transient
    private String evidence;

    @Transient
    private Double confidence;

    // 最终建议
    @Transient
    private String finalRecommendation;

    // 禁忌症和注意事项
    @Transient
    private String contraindications;

    @Transient
    private String precautions;

    // 风险颜色
    @Transient
    private String riskColor;

    // 支持和反对理由
    @Transient
    private List<String> supportReasons;

    @Transient
    private List<String> opposeReasons;

    // 建议列表
    @Transient
    private List<String> recommendations;

    // 关键风险因素
    @Transient
    private List<String> keyRiskFactors;

    // 指南参考
    @Transient
    private Map<String, String> guidelineReferences;

    // 详细评分
    @Transient
    private Map<String, Object> detailedScores;

    // 评估时间
    @Transient
    private LocalDateTime assessmentTime;

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
}

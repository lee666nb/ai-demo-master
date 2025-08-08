package com.fox.alibabadeepseekdemo.entity;

import java.util.Date;
import java.util.List;
import java.util.Map;

/**
 * ECMO评估结果实体类
 * 包含4个核心输出：诊断结果、诊断原因、诊断依据、置信度
 */
public class ECMOAssessment {
    private String patientId;
    private String assessmentId;
    private Date assessmentTime;
    
    // 4个核心输出
    private boolean canUseECMO; // ECMO诊断结果（推荐/不推荐）
    private String diagnosis; // 诊断原因
    private String evidence; // 诊断依据
    private Double confidence; // 置信度 (0-1)
    
    // 动态风险评分
    private Double riskScore; // ECMO实施推荐指数 (0-100)
    private String riskLevel; // 风险等级：HIGH(推荐)、MEDIUM(谨慎)、LOW(不推荐)
    private String riskColor; // 颜色标识：green(推荐)、yellow(谨慎)、red(不推荐)
    private List<String> keyRiskFactors; // 关键扣分点
    
    // 决策辅助卡
    private List<String> supportReasons; // 支持使用依据
    private List<String> opposeReasons; // 反对使用依据
    private String finalRecommendation; // 建议结论
    private Map<String, String> guidelineReferences; // 专家共识/指南原文
    
    // 详细评估
    private List<String> recommendations; // 详细建议
    private Map<String, Object> detailedScores; // 各项指标得分
    private String contraindications; // 禁忌症
    private String precautions; // 注意事项
    
    // 构造函数
    public ECMOAssessment() {
        this.assessmentTime = new Date();
    }
    
    // Getter和Setter方法
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    
    public String getAssessmentId() { return assessmentId; }
    public void setAssessmentId(String assessmentId) { this.assessmentId = assessmentId; }
    
    public Date getAssessmentTime() { return assessmentTime; }
    public void setAssessmentTime(Date assessmentTime) { this.assessmentTime = assessmentTime; }
    
    public boolean isCanUseECMO() { return canUseECMO; }
    public void setCanUseECMO(boolean canUseECMO) { this.canUseECMO = canUseECMO; }
    
    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }
    
    public String getEvidence() { return evidence; }
    public void setEvidence(String evidence) { this.evidence = evidence; }
    
    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }
    
    public Double getRiskScore() { return riskScore; }
    public void setRiskScore(Double riskScore) { this.riskScore = riskScore; }
    
    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }
    
    public String getRiskColor() { return riskColor; }
    public void setRiskColor(String riskColor) { this.riskColor = riskColor; }
    
    public List<String> getKeyRiskFactors() { return keyRiskFactors; }
    public void setKeyRiskFactors(List<String> keyRiskFactors) { this.keyRiskFactors = keyRiskFactors; }
    
    public List<String> getSupportReasons() { return supportReasons; }
    public void setSupportReasons(List<String> supportReasons) { this.supportReasons = supportReasons; }
    
    public List<String> getOpposeReasons() { return opposeReasons; }
    public void setOpposeReasons(List<String> opposeReasons) { this.opposeReasons = opposeReasons; }
    
    public String getFinalRecommendation() { return finalRecommendation; }
    public void setFinalRecommendation(String finalRecommendation) { this.finalRecommendation = finalRecommendation; }
    
    public Map<String, String> getGuidelineReferences() { return guidelineReferences; }
    public void setGuidelineReferences(Map<String, String> guidelineReferences) { this.guidelineReferences = guidelineReferences; }
    
    public List<String> getRecommendations() { return recommendations; }
    public void setRecommendations(List<String> recommendations) { this.recommendations = recommendations; }
    
    public Map<String, Object> getDetailedScores() { return detailedScores; }
    public void setDetailedScores(Map<String, Object> detailedScores) { this.detailedScores = detailedScores; }
    
    public String getContraindications() { return contraindications; }
    public void setContraindications(String contraindications) { this.contraindications = contraindications; }
    
    public String getPrecautions() { return precautions; }
    public void setPrecautions(String precautions) { this.precautions = precautions; }
}

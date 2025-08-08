package com.fox.alibabadeepseekdemo.controller;

import com.fox.alibabadeepseekdemo.entity.ECMOAssessment;
import com.fox.alibabadeepseekdemo.entity.PatientParameters;
import com.fox.alibabadeepseekdemo.service.ECMOExpertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/ecmo")
@CrossOrigin(origins = "*")
public class ECMOExpertController {

    @Autowired
    private ECMOExpertService ecmoExpertService;

    // 存储评估历史记录
    private final Map<String, List<ECMOAssessment>> userAssessments = new ConcurrentHashMap<>();
    private final Map<String, ECMOAssessment> assessmentById = new ConcurrentHashMap<>();

    /**
     * ECMO适应症评估 - 增强版
     * 返回4个核心输出：诊断结果、诊断原因、诊断依据、置信度
     * 以及动态风险评分和决策辅助卡
     */
    @PostMapping("/assess")
    public ResponseEntity<Map<String, Object>> assessECMO(@RequestBody PatientParameters patient) {
        Map<String, Object> response = new HashMap<>();

        try {
            // 验证必要参数
            if (patient.getPatientId() == null || patient.getPatientId().trim().isEmpty()) {
                patient.setPatientId("PATIENT_" + System.currentTimeMillis());
            }

            // 进行ECMO评估
            ECMOAssessment assessment = ecmoExpertService.assessPatientForECMO(patient);

            // 生成评估ID
            String assessmentId = "ECMO_ASSESS_" + System.currentTimeMillis() + "_" +
                                 UUID.randomUUID().toString().substring(0, 8);
            assessment.setAssessmentId(assessmentId);

            // 存储评估结果
            assessmentById.put(assessmentId, assessment);

            // 构建增强响应
            response.put("success", true);
            response.put("assessmentId", assessmentId);
            response.put("patientId", assessment.getPatientId());

            // 4个核心输出
            response.put("ecmoResult", assessment.isCanUseECMO() ? "推荐" : "不推荐");
            response.put("diagnosis", assessment.getDiagnosis());
            response.put("evidence", assessment.getEvidence());
            response.put("confidence", Math.round(assessment.getConfidence() * 100.0) / 100.0);

            // 动态风险评分
            Map<String, Object> riskAssessment = new HashMap<>();
            riskAssessment.put("riskScore", Math.round(assessment.getRiskScore() * 10.0) / 10.0);
            riskAssessment.put("riskLevel", assessment.getRiskLevel());
            riskAssessment.put("riskColor", assessment.getRiskColor());
            riskAssessment.put("keyRiskFactors", assessment.getKeyRiskFactors());
            response.put("riskAssessment", riskAssessment);

            // 决策辅助卡
            Map<String, Object> decisionCard = new HashMap<>();
            decisionCard.put("supportReasons", assessment.getSupportReasons());
            decisionCard.put("opposeReasons", assessment.getOpposeReasons());
            decisionCard.put("finalRecommendation", assessment.getFinalRecommendation());
            decisionCard.put("guidelineReferences", assessment.getGuidelineReferences());
            response.put("decisionCard", decisionCard);

            // 详细信息
            response.put("recommendations", assessment.getRecommendations());
            response.put("contraindications", assessment.getContraindications());
            response.put("precautions", assessment.getPrecautions());
            response.put("detailedScores", assessment.getDetailedScores());
            response.put("assessmentTime", assessment.getAssessmentTime());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "ECMO评估失败，请检查输入参数或稍后重试");
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 获取风险评分详情
     */
    @GetMapping("/risk-analysis/{assessmentId}")
    public ResponseEntity<Map<String, Object>> getRiskAnalysis(@PathVariable String assessmentId) {
        Map<String, Object> response = new HashMap<>();

        try {
            ECMOAssessment assessment = assessmentById.get(assessmentId);
            if (assessment == null) {
                response.put("success", false);
                response.put("message", "评估记录不存在");
                return ResponseEntity.notFound().build();
            }

            response.put("success", true);
            response.put("riskScore", assessment.getRiskScore());
            response.put("riskLevel", assessment.getRiskLevel());
            response.put("riskColor", assessment.getRiskColor());
            response.put("keyRiskFactors", assessment.getKeyRiskFactors());
            response.put("detailedScores", assessment.getDetailedScores());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取风险分析失败");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 获取决策辅助信息
     */
    @GetMapping("/decision-support/{assessmentId}")
    public ResponseEntity<Map<String, Object>> getDecisionSupport(@PathVariable String assessmentId) {
        Map<String, Object> response = new HashMap<>();

        try {
            ECMOAssessment assessment = assessmentById.get(assessmentId);
            if (assessment == null) {
                response.put("success", false);
                response.put("message", "评估记录不存在");
                return ResponseEntity.notFound().build();
            }

            response.put("success", true);
            response.put("supportReasons", assessment.getSupportReasons());
            response.put("opposeReasons", assessment.getOpposeReasons());
            response.put("finalRecommendation", assessment.getFinalRecommendation());
            response.put("recommendations", assessment.getRecommendations());
            response.put("guidelineReferences", assessment.getGuidelineReferences());
            response.put("contraindications", assessment.getContraindications());
            response.put("precautions", assessment.getPrecautions());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取决策支持信息失败");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 获取评估历史
     */
    @GetMapping("/assessments/{username}")
    public ResponseEntity<Map<String, Object>> getAssessmentHistory(@PathVariable String username) {
        Map<String, Object> response = new HashMap<>();

        try {
            List<ECMOAssessment> assessments = userAssessments.getOrDefault(username, new ArrayList<>());
            List<Map<String, Object>> assessmentList = new ArrayList<>();

            for (ECMOAssessment assessment : assessments) {
                Map<String, Object> assessmentInfo = new HashMap<>();
                assessmentInfo.put("assessmentId", assessment.getAssessmentId());
                assessmentInfo.put("patientId", assessment.getPatientId());
                assessmentInfo.put("canUseECMO", assessment.isCanUseECMO());
                assessmentInfo.put("confidence", assessment.getConfidence());
                assessmentInfo.put("riskScore", assessment.getRiskScore());
                assessmentInfo.put("riskLevel", assessment.getRiskLevel());
                assessmentInfo.put("finalRecommendation", assessment.getFinalRecommendation());
                assessmentInfo.put("assessmentTime", assessment.getAssessmentTime());
                assessmentList.add(assessmentInfo);
            }

            response.put("success", true);
            response.put("assessments", assessmentList);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取评估历史失败");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 获取完整评估报告
     */
    @GetMapping("/report/{assessmentId}")
    public ResponseEntity<Map<String, Object>> getFullReport(@PathVariable String assessmentId) {
        Map<String, Object> response = new HashMap<>();

        try {
            ECMOAssessment assessment = assessmentById.get(assessmentId);
            if (assessment == null) {
                response.put("success", false);
                response.put("message", "评估记录不存在");
                return ResponseEntity.notFound().build();
            }

            response.put("success", true);
            response.put("assessment", assessment);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取评估报告失败");
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * 健康检查接口
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "healthy");
        response.put("service", "ECMO Expert System");
        response.put("version", "2.0");
        response.put("features", Arrays.asList(
            "4核心输出", "动态风险评分", "决策辅助卡", "专家共识引用"
        ));
        response.put("timestamp", new Date());
        return ResponseEntity.ok(response);
    }
}

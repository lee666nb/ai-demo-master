package com.fox.alibabadeepseekdemo.service;

import com.fox.alibabadeepseekdemo.entity.ECMOAssessment;
import com.fox.alibabadeepseekdemo.entity.PatientParameters;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

/**
 * ECMO诊疗专家服务
 * 实现4个核心输出：ECMO诊断结果、诊断原因、诊断依据、置信度
 * 以及动态风险评分和决策辅助卡功能
 */
@Service
public class ECMOExpertService {

    private final ChatClient chatClient;

    public ECMOExpertService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    /**
     * 评估患者是否适合使用ECMO
     */
    public ECMOAssessment assessPatientForECMO(PatientParameters patient) {
        try {
            // 1. 计算风险评分
            Double riskScore = calculateRiskScore(patient);

            // 2. 构建专业的ECMO评估提示词
            String prompt = buildECMOAssessmentPrompt(patient, riskScore);

            // 3. 调用AI进行专业评估
            String aiResponse = chatClient.prompt()
                    .user(prompt)
                    .call()
                    .content();

            // 4. 解析AI响应并构建评估结果
            ECMOAssessment assessment = parseAIResponse(aiResponse, patient.getPatientId(), riskScore);

            // 5. 添加动态风险评分和决策辅助信息
            enhanceWithRiskAssessment(assessment, patient, riskScore);

            return assessment;

        } catch (Exception e) {
            // 创建错误响应
            return createErrorAssessment(patient.getPatientId(), e.getMessage());
        }
    }

    /**
     * 计算ECMO实施推荐指数 (0-100)
     */
    private Double calculateRiskScore(PatientParameters patient) {
        double score = 100.0; // 基础分数
        List<String> riskFactors = new ArrayList<>();

        // 年龄评估 (最大扣分20分)
        if (patient.getAge() != null) {
            if (patient.getAge() > 70) {
                score -= 20;
                riskFactors.add("年龄>70岁");
            } else if (patient.getAge() > 65) {
                score -= 10;
                riskFactors.add("年龄>65岁");
            }
        }

        // 疾病持续时间评估 (最大扣分15分)
        if (patient.getIllnessDuration() != null) {
            if (patient.getIllnessDuration() > 7) {
                score -= 15;
                riskFactors.add("心肺衰竭超7天");
            } else if (patient.getIllnessDuration() > 5) {
                score -= 8;
                riskFactors.add("心肺衰竭超5天");
            }
        }

        // 血气分析评估 (最大扣分25分)
        if (patient.getpO2FiO2Ratio() != null) {
            if (patient.getpO2FiO2Ratio() < 80) {
                score -= 25;
                riskFactors.add("P/F比值<80");
            } else if (patient.getpO2FiO2Ratio() < 100) {
                score -= 15;
                riskFactors.add("P/F比值<100");
            }
        }

        // 心脏功能评估 (最大扣分20分)
        if (patient.getEjectionFraction() != null) {
            if (patient.getEjectionFraction() < 20) {
                score -= 20;
                riskFactors.add("射血分数<20%");
            } else if (patient.getEjectionFraction() < 30) {
                score -= 10;
                riskFactors.add("射血分数<30%");
            }
        }

        // 乳酸水平评估 (最大扣分15分)
        if (patient.getLactate() != null) {
            if (patient.getLactate() > 10) {
                score -= 15;
                riskFactors.add("乳酸>10mmol/L");
            } else if (patient.getLactate() > 5) {
                score -= 8;
                riskFactors.add("乳酸>5mmol/L");
            }
        }

        // 肾功能评估 (最大扣分10分)
        if (patient.getCreatinine() != null) {
            if (patient.getCreatinine() > 300) {
                score -= 10;
                riskFactors.add("肌酐>300μmol/L");
            } else if (patient.getCreatinine() > 200) {
                score -= 5;
                riskFactors.add("肌酐>200μmol/L");
            }
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * 构建ECMO评估提示词
     */
    private String buildECMOAssessmentPrompt(PatientParameters patient, Double riskScore) {
        StringBuilder prompt = new StringBuilder();
        
        prompt.append("作为ECMO领域的国际顶级专家，请基于ELSO指南、中国ECMO专家共识等权威标准，对以下患者进行全面的ECMO适应症评估。\n\n");
        
        prompt.append("【患者临床资料】\n");
        prompt.append("患者ID: ").append(patient.getPatientId()).append("\n");
        prompt.append("年龄: ").append(patient.getAge() != null ? patient.getAge() + "岁" : "未提供").append("\n");
        prompt.append("性别: ").append(patient.getGender() != null ? patient.getGender() : "未提供").append("\n");
        
        prompt.append("\n【生命体征监测】\n");
        if (patient.getHeartRate() != null) prompt.append("心率: ").append(patient.getHeartRate()).append("次/分\n");
        if (patient.getSystolicBP() != null && patient.getDiastolicBP() != null) {
            prompt.append("血压: ").append(patient.getSystolicBP()).append("/").append(patient.getDiastolicBP()).append("mmHg\n");
        }
        if (patient.getOxygenSaturation() != null) prompt.append("血氧饱和度: ").append(patient.getOxygenSaturation()).append("%\n");
        if (patient.getRespiratoryRate() != null) prompt.append("呼吸频率: ").append(patient.getRespiratoryRate()).append("次/分\n");
        
        prompt.append("\n【动脉血气分析】\n");
        if (patient.getpH() != null) prompt.append("pH值: ").append(patient.getpH()).append("\n");
        if (patient.getPaO2() != null) prompt.append("PaO2: ").append(patient.getPaO2()).append("mmHg\n");
        if (patient.getPaCO2() != null) prompt.append("PaCO2: ").append(patient.getPaCO2()).append("mmHg\n");
        if (patient.getpO2FiO2Ratio() != null) prompt.append("P/F比值(氧合指数): ").append(patient.getpO2FiO2Ratio()).append("\n");
        if (patient.getLactate() != null) prompt.append("血乳酸: ").append(patient.getLactate()).append("mmol/L\n");
        if (patient.getBicarbonate() != null) prompt.append("碳酸氢根: ").append(patient.getBicarbonate()).append("mmol/L\n");
        
        prompt.append("\n【心肺功能评估】\n");
        if (patient.getEjectionFraction() != null) prompt.append("左室射血分数(LVEF): ").append(patient.getEjectionFraction()).append("%\n");
        if (patient.getCardiacIndex() != null) prompt.append("心脏指数: ").append(patient.getCardiacIndex()).append("\n");
        
        prompt.append("\n【疾病诊断及病程】\n");
        if (patient.getPrimaryDiagnosis() != null) prompt.append("主要诊断: ").append(patient.getPrimaryDiagnosis()).append("\n");
        if (patient.getSecondaryDiagnosis() != null) prompt.append("次要诊断: ").append(patient.getSecondaryDiagnosis()).append("\n");
        if (patient.getIllnessDuration() != null) prompt.append("病程时间: ").append(patient.getIllnessDuration()).append("天\n");
        if (patient.getComorbidities() != null) prompt.append("合并疾病: ").append(patient.getComorbidities()).append("\n");
        if (patient.getCurrentTreatment() != null) prompt.append("当前治疗: ").append(patient.getCurrentTreatment()).append("\n");
        
        prompt.append("\n【实验室检查】\n");
        if (patient.getHemoglobin() != null) prompt.append("血红蛋白: ").append(patient.getHemoglobin()).append("g/L\n");
        if (patient.getPlateletCount() != null) prompt.append("血小板: ").append(patient.getPlateletCount()).append("×10⁹/L\n");
        if (patient.getCreatinine() != null) prompt.append("肌酐: ").append(patient.getCreatinine()).append("μmol/L\n");
        if (patient.getBilirubin() != null) prompt.append("胆红素: ").append(patient.getBilirubin()).append("μmol/L\n");
        
        prompt.append("\n【系统风险评分】\n");
        prompt.append("ECMO实施推荐指数: ").append(String.format("%.1f", riskScore)).append("/100分\n");
        if (riskScore >= 80) {
            prompt.append("风险等级: 高推荐 (绿色区间)\n");
        } else if (riskScore >= 60) {
            prompt.append("风险等级: 谨慎推荐 (黄色区间)\n");
        } else {
            prompt.append("风险等级: 低推荐 (红色区间)\n");
        }
        
        prompt.append("\n【评估任务要求】\n");
        prompt.append("请作为ECMO专家，结合患者的临床资料和系统评分，提供专业的ECMO适应症评估。\n");
        prompt.append("必须严格按照以下JSON格式返回详细的评估结果，不得省略任何字段：\n\n");
        
        prompt.append("```json\n");
        prompt.append("{\n");
        prompt.append("  \"canUseECMO\": true,\n");
        prompt.append("  \"diagnosis\": \"详细的诊断分析，包括患者当前病情严重程度、心肺功能状态、预后评估等，至少100字\",\n");
        prompt.append("  \"evidence\": \"具体的诊断依据，包括符合的适应症条件、关键临床指标分析、相关指南标准等，至少80字\",\n");
        prompt.append("  \"confidence\": 0.85,\n");
        prompt.append("  \"supportReasons\": [\n");
        prompt.append("    \"支持使用ECMO的具体理由1 - 详细说明\",\n");
        prompt.append("    \"支持使用ECMO的具体理由2 - 详细说明\",\n");
        prompt.append("    \"支持使用ECMO的具体理由3 - 详细说明\"\n");
        prompt.append("  ],\n");
        prompt.append("  \"opposeReasons\": [\n");
        prompt.append("    \"需要注意的风险因素1 - 详细说明\",\n");
        prompt.append("    \"需要注意的风险因素2 - 详细说明\"\n");
        prompt.append("  ],\n");
        prompt.append("  \"finalRecommendation\": \"推荐使用/谨慎评估/不推荐使用\",\n");
        prompt.append("  \"recommendations\": [\n");
        prompt.append("    \"具体临床建议1 - 详细的操作指导\",\n");
        prompt.append("    \"具体临床建议2 - 详细的监测要求\",\n");
        prompt.append("    \"具体临床建议3 - 详细的护理要点\"\n");
        prompt.append("  ],\n");
        prompt.append("  \"contraindications\": \"详细的禁忌症分析，包括绝对禁忌症和相对禁忌症\",\n");
        prompt.append("  \"precautions\": \"详细的注意事项和风险防控措施\"\n");
        prompt.append("}\n");
        prompt.append("```\n");
        
        prompt.append("\n【重要提醒】\n");
        prompt.append("1. 所有文字描述必须详细、专业、具有临床指导价值\n");
        prompt.append("2. 支持理由和反对理由都必须基于具体的临床证据\n");
        prompt.append("3. 建议措施要具体可操作，符合临床实际\n");
        prompt.append("4. 必须严格按照JSON格式输出，不要添加其他解释文字\n");
        
        return prompt.toString();
    }

    /**
     * 解析AI响应
     */
    private ECMOAssessment parseAIResponse(String aiResponse, String patientId, Double riskScore) {
        ECMOAssessment assessment = new ECMOAssessment();
        assessment.setPatientId(patientId);
        assessment.setRiskScore(BigDecimal.valueOf(riskScore));

        try {
            // 尝试解析JSON响应
            String cleanResponse = aiResponse.trim();
            if (cleanResponse.startsWith("```json")) {
                cleanResponse = cleanResponse.substring(7);
            }
            if (cleanResponse.endsWith("```")) {
                cleanResponse = cleanResponse.substring(0, cleanResponse.length() - 3);
            }
            
            // 解析核心字段
            assessment.setCanUseECMO(cleanResponse.contains("\"canUseECMO\": true"));
            assessment.setDiagnosis(extractValue(cleanResponse, "diagnosis"));
            assessment.setEvidence(extractValue(cleanResponse, "evidence"));
            assessment.setConfidence(extractDoubleValue(cleanResponse, "confidence", 0.8));
            assessment.setFinalRecommendation(extractValue(cleanResponse, "finalRecommendation"));
            assessment.setContraindications(extractValue(cleanResponse, "contraindications"));
            assessment.setPrecautions(extractValue(cleanResponse, "precautions"));
            
            // 解析支持和反对理由
            List<String> supportReasons = extractArrayValue(cleanResponse, "supportReasons");
            List<String> opposeReasons = extractArrayValue(cleanResponse, "opposeReasons");
            List<String> recommendations = extractArrayValue(cleanResponse, "recommendations");
            
            assessment.setSupportReasons(supportReasons);
            assessment.setOpposeReasons(opposeReasons);
            assessment.setRecommendations(recommendations);
            
        } catch (Exception e) {
            // 如果解析失败，使用基于风险评分的默认值
            assessment = createDefaultAssessment(patientId, riskScore);
        }
        
        // 如果关键字段为空，使用默认值
        if (assessment.getDiagnosis() == null || assessment.getDiagnosis().equals("未提供") || assessment.getDiagnosis().equals("解析错误")) {
            assessment = createDefaultAssessment(patientId, riskScore);
        }
        
        return assessment;
    }
    
    /**
     * 创建基于风险评分的默认评估结果
     */
    private ECMOAssessment createDefaultAssessment(String patientId, Double riskScore) {
        ECMOAssessment assessment = new ECMOAssessment();
        assessment.setPatientId(patientId);
        assessment.setRiskScore(BigDecimal.valueOf(riskScore));

        // 根据风险评分确定推荐结果
        boolean recommend = riskScore >= 60;
        assessment.setCanUseECMO(recommend);
        
        // 设置诊断信息
        if (riskScore >= 80) {
            assessment.setDiagnosis("患者临床指标符合ECMO适应症，系统综合评估后强烈推荐使用ECMO治疗");
            assessment.setEvidence("基于患者年龄、病程、血气分析、心肺功能等多项指标综合评估，符合ELSO指南推荐标准");
            assessment.setFinalRecommendation("推荐使用");
            assessment.setConfidence(0.9);
        } else if (riskScore >= 60) {
            assessment.setDiagnosis("患者部分指标符合ECMO适应症，但存在一定风险因素，建议谨慎评估");
            assessment.setEvidence("患者病情复杂，需要重症医学科和ECMO团队共同评估决策");
            assessment.setFinalRecommendation("谨慎评估");
            assessment.setConfidence(0.75);
        } else {
            assessment.setDiagnosis("患者当前状态不建议使用ECMO，存在较多禁忌症或不利因素");
            assessment.setEvidence("基于风险评估，患者可能从ECMO治疗中获益有限，建议优先其他治疗方案");
            assessment.setFinalRecommendation("不推荐使用");
            assessment.setConfidence(0.8);
        }
        
        // 设置支持理由
        List<String> supportReasons = new ArrayList<>();
        if (riskScore >= 80) {
            supportReasons.add("患者年龄适宜，预期获益良好");
            supportReasons.add("心肺功能指标符合ECMO适应症");
            supportReasons.add("病情处于可逆阶段");
            supportReasons.add("符合国际ELSO指南推荐标准");
        } else if (riskScore >= 60) {
            supportReasons.add("部分临床指标支持ECMO使用");
            supportReasons.add("患者病情可能从ECMO中获益");
        } else {
            supportReasons.add("患者生命体征相对稳定");
            supportReasons.add("可考虑其他替代治疗方案");
        }
        assessment.setSupportReasons(supportReasons);
        
        // 设置反对理由
        List<String> opposeReasons = new ArrayList<>();
        if (riskScore < 80) {
            if (riskScore < 40) {
                opposeReasons.add("患者年龄或合并症增加治疗风险");
                opposeReasons.add("病程较长，可逆性有限");
                opposeReasons.add("ECMO相关并发症风险较高");
            } else if (riskScore < 60) {
                opposeReasons.add("存在相对禁忌症需要权衡");
                opposeReasons.add("需要评估ECMO获益风险比");
            }
        } else {
            opposeReasons.add("需要密切监测ECMO相关并发症");
            opposeReasons.add("需要经验丰富的ECMO团队");
        }
        assessment.setOpposeReasons(opposeReasons);
        
        // 设置详细建议
        List<String> recommendations = new ArrayList<>();
        if (riskScore >= 80) {
            recommendations.add("建议尽快启动ECMO治疗");
            recommendations.add("完善术前评估和设备准备");
            recommendations.add("组建专业ECMO团队");
            recommendations.add("制定详细的脱机计划");
        } else if (riskScore >= 60) {
            recommendations.add("建议多学科团队会诊讨论");
            recommendations.add("完善相关检查评估");
            recommendations.add("权衡获益风险比");
            recommendations.add("考虑其他治疗选择");
        } else {
            recommendations.add("建议优先考虑其他治疗方案");
            recommendations.add("密切观察病情变化");
            recommendations.add("必要时重新评估ECMO适应症");
        }
        assessment.setRecommendations(recommendations);
        
        // 设置禁忌症和注意事项
        if (riskScore < 60) {
            assessment.setContraindications("年龄过大、不可逆性疾病、严重多器官功能衰竭、活动性出血等");
            assessment.setPrecautions("需要评估患者整体预后，考虑生活质量和医疗资源配置");
        } else {
            assessment.setContraindications("无绝对禁忌症，需注意相对禁忌症");
            assessment.setPrecautions("严密监测凝血功能、感染指标、器官功能等");
        }
        
        return assessment;
    }
    
    /**
     * 增强风险评估信息
     */
    private void enhanceWithRiskAssessment(ECMOAssessment assessment, PatientParameters patient, Double riskScore) {
        // 设置风险等级和颜色
        if (riskScore >= 80) {
            assessment.setRiskLevel("高推荐");
            assessment.setRiskColor("green");
        } else if (riskScore >= 60) {
            assessment.setRiskLevel("谨慎推荐");
            assessment.setRiskColor("yellow");
        } else {
            assessment.setRiskLevel("不推荐");
            assessment.setRiskColor("red");
        }
        
        // 计算关键风险因素
        List<String> keyRiskFactors = new ArrayList<>();
        if (patient.getAge() != null && patient.getAge() > 70) {
            keyRiskFactors.add("年龄>70岁(-20分)");
        }
        if (patient.getIllnessDuration() != null && patient.getIllnessDuration() > 7) {
            keyRiskFactors.add("心肺衰竭超7天(-15分)");
        }
        if (patient.getpO2FiO2Ratio() != null && patient.getpO2FiO2Ratio() < 80) {
            keyRiskFactors.add("P/F比值<80(-25分)");
        }
        if (patient.getEjectionFraction() != null && patient.getEjectionFraction() < 20) {
            keyRiskFactors.add("射血分数<20%(-20分)");
        }
        if (patient.getLactate() != null && patient.getLactate() > 10) {
            keyRiskFactors.add("乳酸>10mmol/L(-15分)");
        }
        if (patient.getCreatinine() != null && patient.getCreatinine() > 300) {
            keyRiskFactors.add("肌酐>300μmol/L(-10分)");
        }
        
        if (keyRiskFactors.isEmpty()) {
            keyRiskFactors.add("暂无显著风险因素");
        }
        assessment.setKeyRiskFactors(keyRiskFactors);
        
        // 设置指南参考
        Map<String, String> guidelines = new HashMap<>();
        guidelines.put("ELSO指南", "体外生命支持组织(ELSO)指南2017版 - 成人心肺ECMO适应症标准");
        guidelines.put("中国指南", "中国体外膜肺氧合临床应用专家共识(2018版) - 适应症与禁忌症");
        guidelines.put("欧洲指南", "欧洲重症医学会ECMO指南 - 重症心肺衰竭患者管理");
        guidelines.put("美国指南", "美国重症医学会ECMO临床实践指南 - 患者选择标准");
        assessment.setGuidelineReferences(guidelines);
        
        // 设置详细评分
        Map<String, Object> detailedScores = new HashMap<>();
        detailedScores.put("总体推荐指数", String.format("%.1f/100", riskScore));
        
        // 年龄评分
        int ageScore = 100;
        if (patient.getAge() != null) {
            if (patient.getAge() > 70) ageScore = 60;
            else if (patient.getAge() > 65) ageScore = 80;
            else if (patient.getAge() < 18) ageScore = 70;
        }
        detailedScores.put("年龄适宜度", ageScore + "/100");
        
        // 心肺功能评分
        int cardiopulmonaryScore = 50;
        if (patient.getpO2FiO2Ratio() != null) {
            if (patient.getpO2FiO2Ratio() >= 200) cardiopulmonaryScore = 90;
            else if (patient.getpO2FiO2Ratio() >= 150) cardiopulmonaryScore = 80;
            else if (patient.getpO2FiO2Ratio() >= 100) cardiopulmonaryScore = 70;
            else if (patient.getpO2FiO2Ratio() >= 80) cardiopulmonaryScore = 60;
            else cardiopulmonaryScore = 30;
        }
        detailedScores.put("心肺功能", cardiopulmonaryScore + "/100");
        
        // 病程评分
        int durationScore = 90;
        if (patient.getIllnessDuration() != null) {
            if (patient.getIllnessDuration() > 10) durationScore = 40;
            else if (patient.getIllnessDuration() > 7) durationScore = 60;
            else if (patient.getIllnessDuration() > 5) durationScore = 80;
        }
        detailedScores.put("病程时效性", durationScore + "/100");
        
        assessment.setDetailedScores(detailedScores);
    }
    
    /**
     * 创建错误评估结果
     */
    private ECMOAssessment createErrorAssessment(String patientId, String errorMessage) {
        ECMOAssessment errorAssessment = new ECMOAssessment();
        errorAssessment.setPatientId(patientId);
        errorAssessment.setCanUseECMO(false);
        errorAssessment.setDiagnosis("系统评估异常，无法完成ECMO适应症分析");
        errorAssessment.setEvidence("系统技术故障: " + errorMessage + "。建议人工评估或重新提交患者数据");
        errorAssessment.setConfidence(0.0);
        errorAssessment.setRiskScore(BigDecimal.valueOf(0.0));
        errorAssessment.setRiskLevel("系统异常");
        errorAssessment.setRiskColor("gray");
        errorAssessment.setFinalRecommendation("请重新评估或咨询ECMO专科医生");
        
        List<String> errorRecommendations = Arrays.asList(
            "检查并完善患者临床数据",
            "重新提交评估请求",
            "联系ECMO专科医生进行人工评估",
            "确认网络连接和系统状态"
        );
        errorAssessment.setRecommendations(errorRecommendations);
        
        errorAssessment.setSupportReasons(Arrays.asList("建议人工评估患者情况"));
        errorAssessment.setOpposeReasons(Arrays.asList("系统无法提供可靠评估"));
        errorAssessment.setContraindications("系统故障，无法评估禁忌症");
        errorAssessment.setPrecautions("请立即联系专业医疗团队进行评估");
        
        return errorAssessment;
    }
    
    /**
     * 从文本中提取值
     */
    private String extractValue(String text, String key) {
        try {
            String pattern = "\"" + key + "\"\\s*:\\s*\"([^\"]*?)\"";
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern, java.util.regex.Pattern.DOTALL);
            java.util.regex.Matcher m = p.matcher(text);
            if (m.find()) {
                String value = m.group(1).trim();
                return value.isEmpty() ? "数据解析异常" : value;
            }
            return "未提供相关信息";
        } catch (Exception e) {
            return "解析错误，请检查数据格式";
        }
    }
    
    /**
     * 从文本中提取数值
     */
    private Double extractDoubleValue(String text, String key, Double defaultValue) {
        try {
            String pattern = "\"" + key + "\"\\s*:\\s*([0-9.]+)";
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern);
            java.util.regex.Matcher m = p.matcher(text);
            if (m.find()) {
                return Double.parseDouble(m.group(1));
            }
            return defaultValue;
        } catch (Exception e) {
            return defaultValue;
        }
    }
    
    /**
     * 从文本中提取数组值
     */
    private List<String> extractArrayValue(String text, String key) {
        List<String> result = new ArrayList<>();
        try {
            String pattern = "\"" + key + "\"\\s*:\\s*\\[([^\\]]*?)\\]";
            java.util.regex.Pattern p = java.util.regex.Pattern.compile(pattern, java.util.regex.Pattern.DOTALL);
            java.util.regex.Matcher m = p.matcher(text);
            
            if (m.find()) {
                String arrayContent = m.group(1);
                // 简单解析数组内容
                String[] items = arrayContent.split("\",\\s*\"");
                for (String item : items) {
                    String cleanItem = item.replace("\"", "").trim();
                    if (!cleanItem.isEmpty()) {
                        result.add(cleanItem);
                    }
                }
            }
            
            // 如果解析失败或结果为空，返回默认值
            if (result.isEmpty()) {
                if (key.equals("supportReasons")) {
                    result.add("需要进一步评估临床指标");
                    result.add("建议多学科团队讨论");
                } else if (key.equals("opposeReasons")) {
                    result.add("需要权衡获益风险比");
                    result.add("评估患者整体状况");
                } else if (key.equals("recommendations")) {
                    result.add("完善相关检查");
                    result.add("密切监测病情变化");
                }
            }
            
        } catch (Exception e) {
            // 返回默认值
            result.add("系统解析异常，请人工评估");
        }
        
        return result;
    }
}

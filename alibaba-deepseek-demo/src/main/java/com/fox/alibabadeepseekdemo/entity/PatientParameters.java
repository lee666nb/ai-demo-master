package com.fox.alibabadeepseekdemo.entity;

import java.util.Date;

/**
 * 患者参数实体类
 */
public class PatientParameters {
    private String patientId;
    private String patientName;
    private Integer age;
    private String gender;
    private Double weight;
    private Double height;
    
    // 生命体征
    private Integer heartRate;
    private Integer systolicBP;
    private Integer diastolicBP;
    private Double temperature;
    private Integer respiratoryRate;
    private Double oxygenSaturation;
    
    // 血气分析
    private Double pH;
    private Double paCO2;
    private Double paO2;
    private Double bicarbonate;
    private Double lactate;
    private Double baseExcess;
    
    // 心脏功能指标
    private Double ejectionFraction;
    private String cardiacIndex;
    private String centralVenousPressure;
    private String pulmonaryWedgePressure;
    
    // 肺功能指标
    private Double pO2FiO2Ratio;
    private String peep;
    private String plateauPressure;
    private String compliance;
    
    // 实验室检查
    private Double hemoglobin;
    private Double plateletCount;
    private Double whiteBloodCell;
    private Double creatinine;
    private Double bilirubin;
    private Double albumin;
    
    // 疾病信息
    private String primaryDiagnosis;
    private String secondaryDiagnosis;
    private Integer illnessDuration; // 疾病持续天数
    private String comorbidities;
    private String currentTreatment;
    
    // ECMO相关
    private String ecmoIndication;
    private String contraindications;
    private String riskFactors;
    
    private Date assessmentTime;
    
    // 构造函数
    public PatientParameters() {
        this.assessmentTime = new Date();
    }
    
    // Getter和Setter方法
    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }
    
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    
    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }
    
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    
    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { this.weight = weight; }
    
    public Double getHeight() { return height; }
    public void setHeight(Double height) { this.height = height; }
    
    public Integer getHeartRate() { return heartRate; }
    public void setHeartRate(Integer heartRate) { this.heartRate = heartRate; }
    
    public Integer getSystolicBP() { return systolicBP; }
    public void setSystolicBP(Integer systolicBP) { this.systolicBP = systolicBP; }
    
    public Integer getDiastolicBP() { return diastolicBP; }
    public void setDiastolicBP(Integer diastolicBP) { this.diastolicBP = diastolicBP; }
    
    public Double getTemperature() { return temperature; }
    public void setTemperature(Double temperature) { this.temperature = temperature; }
    
    public Integer getRespiratoryRate() { return respiratoryRate; }
    public void setRespiratoryRate(Integer respiratoryRate) { this.respiratoryRate = respiratoryRate; }
    
    public Double getOxygenSaturation() { return oxygenSaturation; }
    public void setOxygenSaturation(Double oxygenSaturation) { this.oxygenSaturation = oxygenSaturation; }
    
    public Double getpH() { return pH; }
    public void setpH(Double pH) { this.pH = pH; }
    
    public Double getPaCO2() { return paCO2; }
    public void setPaCO2(Double paCO2) { this.paCO2 = paCO2; }
    
    public Double getPaO2() { return paO2; }
    public void setPaO2(Double paO2) { this.paO2 = paO2; }
    
    public Double getBicarbonate() { return bicarbonate; }
    public void setBicarbonate(Double bicarbonate) { this.bicarbonate = bicarbonate; }
    
    public Double getLactate() { return lactate; }
    public void setLactate(Double lactate) { this.lactate = lactate; }
    
    public Double getBaseExcess() { return baseExcess; }
    public void setBaseExcess(Double baseExcess) { this.baseExcess = baseExcess; }
    
    public Double getEjectionFraction() { return ejectionFraction; }
    public void setEjectionFraction(Double ejectionFraction) { this.ejectionFraction = ejectionFraction; }
    
    public String getCardiacIndex() { return cardiacIndex; }
    public void setCardiacIndex(String cardiacIndex) { this.cardiacIndex = cardiacIndex; }
    
    public String getCentralVenousPressure() { return centralVenousPressure; }
    public void setCentralVenousPressure(String centralVenousPressure) { this.centralVenousPressure = centralVenousPressure; }
    
    public String getPulmonaryWedgePressure() { return pulmonaryWedgePressure; }
    public void setPulmonaryWedgePressure(String pulmonaryWedgePressure) { this.pulmonaryWedgePressure = pulmonaryWedgePressure; }
    
    public Double getpO2FiO2Ratio() { return pO2FiO2Ratio; }
    public void setpO2FiO2Ratio(Double pO2FiO2Ratio) { this.pO2FiO2Ratio = pO2FiO2Ratio; }
    
    public String getPeep() { return peep; }
    public void setPeep(String peep) { this.peep = peep; }
    
    public String getPlateauPressure() { return plateauPressure; }
    public void setPlateauPressure(String plateauPressure) { this.plateauPressure = plateauPressure; }
    
    public String getCompliance() { return compliance; }
    public void setCompliance(String compliance) { this.compliance = compliance; }
    
    public Double getHemoglobin() { return hemoglobin; }
    public void setHemoglobin(Double hemoglobin) { this.hemoglobin = hemoglobin; }
    
    public Double getPlateletCount() { return plateletCount; }
    public void setPlateletCount(Double plateletCount) { this.plateletCount = plateletCount; }
    
    public Double getWhiteBloodCell() { return whiteBloodCell; }
    public void setWhiteBloodCell(Double whiteBloodCell) { this.whiteBloodCell = whiteBloodCell; }
    
    public Double getCreatinine() { return creatinine; }
    public void setCreatinine(Double creatinine) { this.creatinine = creatinine; }
    
    public Double getBilirubin() { return bilirubin; }
    public void setBilirubin(Double bilirubin) { this.bilirubin = bilirubin; }
    
    public Double getAlbumin() { return albumin; }
    public void setAlbumin(Double albumin) { this.albumin = albumin; }
    
    public String getPrimaryDiagnosis() { return primaryDiagnosis; }
    public void setPrimaryDiagnosis(String primaryDiagnosis) { this.primaryDiagnosis = primaryDiagnosis; }
    
    public String getSecondaryDiagnosis() { return secondaryDiagnosis; }
    public void setSecondaryDiagnosis(String secondaryDiagnosis) { this.secondaryDiagnosis = secondaryDiagnosis; }
    
    public Integer getIllnessDuration() { return illnessDuration; }
    public void setIllnessDuration(Integer illnessDuration) { this.illnessDuration = illnessDuration; }
    
    public String getComorbidities() { return comorbidities; }
    public void setComorbidities(String comorbidities) { this.comorbidities = comorbidities; }
    
    public String getCurrentTreatment() { return currentTreatment; }
    public void setCurrentTreatment(String currentTreatment) { this.currentTreatment = currentTreatment; }
    
    public String getEcmoIndication() { return ecmoIndication; }
    public void setEcmoIndication(String ecmoIndication) { this.ecmoIndication = ecmoIndication; }
    
    public String getContraindications() { return contraindications; }
    public void setContraindications(String contraindications) { this.contraindications = contraindications; }
    
    public String getRiskFactors() { return riskFactors; }
    public void setRiskFactors(String riskFactors) { this.riskFactors = riskFactors; }
    
    public Date getAssessmentTime() { return assessmentTime; }
    public void setAssessmentTime(Date assessmentTime) { this.assessmentTime = assessmentTime; }
}

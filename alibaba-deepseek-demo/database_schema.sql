-- ECMO诊疗专家系统数据库表结构
-- 适用于alibaba-deepseek-demo项目
-- 字符集: utf8mb4, 排序规则: utf8mb4_unicode_ci

-- 创建数据库(如果不存在)
CREATE DATABASE IF NOT EXISTS `ECMO`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE `ECMO`;

-- 1. 用户表 (users) - 存储医生登录信息
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(255) NOT NULL COMMENT '密码(BCrypt加密)',
    email VARCHAR(100) COMMENT '邮箱',
    real_name VARCHAR(50) COMMENT '真实姓名',
    department VARCHAR(100) COMMENT '科室',
    title VARCHAR(50) COMMENT '职称',
    hospital VARCHAR(200) COMMENT '医院名称',
    avatar_url VARCHAR(255) DEFAULT '/static/image/default-avatar.jpg' COMMENT '头像URL',
    phone VARCHAR(20) COMMENT '电话号码',
    status TINYINT DEFAULT 1 COMMENT '状态: 1-正常, 0-禁用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 2. ECMO评估记录表 (ecmo_assessments) - 存储评估的详细数据
CREATE TABLE ecmo_assessments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '评估ID',
    user_id BIGINT NOT NULL COMMENT '医生用户ID',
    patient_id VARCHAR(50) COMMENT '患者ID',
    assessment_title VARCHAR(200) COMMENT '评估标题',

    -- 基本信息
    age INT NOT NULL COMMENT '年龄',
    gender VARCHAR(10) NOT NULL COMMENT '性别',
    weight DECIMAL(5,2) NOT NULL COMMENT '体重(kg)',
    height DECIMAL(5,2) COMMENT '身高(cm)',

    -- 生命体征
    heart_rate INT NOT NULL COMMENT '心率(次/分)',
    systolic_bp INT NOT NULL COMMENT '收缩压(mmHg)',
    diastolic_bp INT NOT NULL COMMENT '舒张压(mmHg)',
    temperature DECIMAL(4,2) COMMENT '体温(°C)',
    respiratory_rate INT NOT NULL COMMENT '呼吸频率(次/分)',
    oxygen_saturation DECIMAL(5,2) NOT NULL COMMENT '血氧饱和度(%)',

    -- 血气分析
    ph DECIMAL(4,3) NOT NULL COMMENT 'pH值',
    pco2 DECIMAL(5,2) NOT NULL COMMENT 'PCO2(mmHg)',
    po2 DECIMAL(5,2) NOT NULL COMMENT 'PO2(mmHg)',
    hco3 DECIMAL(5,2) COMMENT 'HCO3-(mEq/L)',
    lactate DECIMAL(5,2) NOT NULL COMMENT '乳酸(mmol/L)',

    -- 心脏功能
    ejection_fraction DECIMAL(5,2) COMMENT '射血分数(%)',
    troponin_i DECIMAL(8,3) COMMENT '肌钙蛋白I(ng/mL)',
    bnp DECIMAL(8,2) COMMENT 'BNP(pg/mL)',
    ecg_findings TEXT COMMENT '心电图表现',

    -- 临床状况
    glasgow_coma_scale INT COMMENT 'GCS评分',
    on_ventilator BOOLEAN DEFAULT FALSE COMMENT '是否机械通气',
    on_vasopressors BOOLEAN DEFAULT FALSE COMMENT '是否使用血管活性药物',
    primary_diagnosis VARCHAR(500) COMMENT '主要诊断',
    clinical_presentation TEXT COMMENT '临床表现',

    -- 评估结果
    risk_level VARCHAR(20) COMMENT '风险等级: LOW/MEDIUM/HIGH/CRITICAL',
    risk_score DECIMAL(5,2) COMMENT '风险评分',
    recommendation TEXT COMMENT '建议措施',
    diagnosis_conclusion TEXT COMMENT '诊断结论',
    ecmo_indication BOOLEAN COMMENT '是否有ECMO指征',

    -- 其他信息
    notes TEXT COMMENT '备注',
    assessment_type VARCHAR(20) DEFAULT 'STANDARD' COMMENT '评估类型: STANDARD/QUICK',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '评估时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_user_id (user_id),
    INDEX idx_patient_id (patient_id),
    INDEX idx_created_at (created_at),
    INDEX idx_risk_level (risk_level),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ECMO评估记录表';

-- 3. 评估历史表 (assessment_history) - 用于快速查询和管理历史记录
CREATE TABLE assessment_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '历史记录ID',
    user_id BIGINT NOT NULL COMMENT '医生用户ID',
    assessment_id BIGINT NOT NULL COMMENT '评估记录ID',
    patient_id VARCHAR(50) COMMENT '患者ID',
    patient_name VARCHAR(100) COMMENT '患者姓名',
    assessment_title VARCHAR(200) COMMENT '评估标题',
    risk_level VARCHAR(20) COMMENT '风险等级',
    risk_score DECIMAL(5,2) COMMENT '风险评分',
    diagnosis_summary VARCHAR(500) COMMENT '诊断摘要',
    assessment_date TIMESTAMP COMMENT '评估时间',
    is_saved TINYINT DEFAULT 1 COMMENT '是否保存: 1-已保存, 0-已删除',
    is_favorite TINYINT DEFAULT 0 COMMENT '是否收藏: 1-收藏, 0-未收藏',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_user_id (user_id),
    INDEX idx_assessment_id (assessment_id),
    INDEX idx_assessment_date (assessment_date),
    INDEX idx_risk_level (risk_level),
    INDEX idx_is_saved (is_saved),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assessment_id) REFERENCES ecmo_assessments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评估历史表';

-- 4. ECMO诊疗数据库 (knowledge_base) - 存储医学知识
CREATE TABLE knowledge_base (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '知识ID',
    category VARCHAR(50) NOT NULL COMMENT '分类: 适应症,禁忌症,参数标准,并发症,指南等',
    title VARCHAR(200) NOT NULL COMMENT '标题',
    content TEXT NOT NULL COMMENT '内容',
    summary VARCHAR(500) COMMENT '内容摘要',
    tags VARCHAR(500) COMMENT '标签(逗号分隔)',
    difficulty_level VARCHAR(20) DEFAULT 'MEDIUM' COMMENT '难度等级: BASIC/MEDIUM/ADVANCED',
    source VARCHAR(200) COMMENT '来源',
    author VARCHAR(100) COMMENT '作者',
    version VARCHAR(20) DEFAULT '1.0' COMMENT '版本',
    reference_url VARCHAR(500) COMMENT '参考链接',
    publish_date DATE COMMENT '发布日期',
    status TINYINT DEFAULT 1 COMMENT '状态: 1-发布, 0-草稿',
    view_count INT DEFAULT 0 COMMENT '查看次数',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',

    INDEX idx_category (category),
    INDEX idx_title (title),
    INDEX idx_tags (tags),
    INDEX idx_status (status),
    INDEX idx_sort_order (sort_order),
    FULLTEXT KEY ft_content (title, content, summary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='ECMO诊疗数据库';

-- 5. 系统配置表 (system_config) - 存储系统设置
CREATE TABLE system_config (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '配置ID',
    config_key VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    config_type VARCHAR(20) DEFAULT 'STRING' COMMENT '配置类型: STRING/INTEGER/BOOLEAN/JSON',
    description VARCHAR(500) COMMENT '描述',
    is_system TINYINT DEFAULT 0 COMMENT '是否系统配置: 1-是, 0-否',
    is_encrypted TINYINT DEFAULT 0 COMMENT '是否加密: 1-是, 0-否',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- 插入默认用户数据(密码都是: 123456)
INSERT INTO users (username, password, real_name, department, title, hospital) VALUES
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EF2g./eJhQwl0zGGmf3b7e', '系统管理员', 'ICU', '主任医师', '示例医院'),
('doctor01', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EF2g./eJhQwl0zGGmf3b7e', '张医生', 'ICU', '副主任医师', '示例医院'),
('doctor02', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EF2g./eJhQwl0zGGmf3b7e', '李医生', '心外科', '主治医师', '示例医院');

-- 插入知识库数据
INSERT INTO knowledge_base (category, title, content, summary, tags, difficulty_level, sort_order) VALUES
('适应症', 'ECMO呼吸系统适应症',
'严重ARDS: P/F比 < 80，持续6小时以上\n难治性呼吸衰竭: FiO2 > 90%，PEEP ≥ 15cmH2O\n肺移植术后原发性移植物功能障碍\n支气管胸膜瘘伴严重呼吸衰竭\n严重哮喘持续状态\n肺出血伴呼吸衰竭',
'ECMO在呼吸系统疾病中的主要适应症标准',
'ECMO,适应症,呼吸衰竭,ARDS', 'BASIC', 1),

('适应症', 'ECMO循环系统适应症',
'心源性休克: CI < 2.2L/min/m²\n急性心肌梗死并发心源性休克\n暴发性心肌炎\n心脏术后低心排综合征\n心脏骤停后综合征\n药物中毒致心脏停跳',
'ECMO在循环系统疾病中的主要适应症标准',
'ECMO,适应症,心源性休克,心肌梗死', 'BASIC', 2),

('禁忌症', 'ECMO绝对禁忌症',
'不可逆转的疾病终末期\n晚期恶性肿瘤(预期生存期<6个月)\n严重不可逆性脑损伤\n不可控制的出血\n严重免疫缺陷病\n患者/家属拒绝',
'ECMO使用的绝对禁忌症标准',
'ECMO,禁忌症,绝对禁忌症', 'BASIC', 3),

('禁忌症', 'ECMO相对禁忌症',
'年龄 > 75岁\n机械通气 > 7天\n多器官功能衰竭 > 48小时\n不可逆性神经系统疾病\n严重外周血管疾病\n严重肥胖(BMI > 40)',
'ECMO使用的相对禁忌症标准',
'ECMO,禁忌症,相对禁忌症,年龄', 'BASIC', 4),

('参数标准', 'ECMO评估关键指标',
'P/F比值: 正常>300, ECMO考虑100-150, 紧急指征<80\n左室射血分数: 正常55-70%, ECMO考虑20-30%, 紧急指征<20%\n心脏指数: 正常2.5-4.0L/min/m², ECMO考虑1.8-2.2, 紧急指征<1.8\n乳酸: 正常0.5-2.2mmol/L, ECMO考虑4.0-8.0, 紧急指征>10',
'ECMO评估中的关键临床指标正常值与异常标准',
'ECMO,参数,指标,P/F比,射血分数,乳酸', 'MEDIUM', 5),

('并发症', 'ECMO出血并发症管理',
'发生率: 30-50%\n颅内出血: 最严重，发生率3-8%\n胃肠道出血: 常见，需要内镜检查\n插管部位出血: 局部压迫止血\n手术部位出血: 可能需要再次手术\n预防措施: 合理抗凝，监测凝血功能',
'ECMO最常见的出血并发症类型及处理策略',
'ECMO,并发症,出血,颅内出血,抗凝', 'MEDIUM', 6),

('并发症', 'ECMO神经系统并发症',
'发生率: 10-15%\n脑梗塞: 血栓栓塞所致\n脑出血: 抗凝过度或血小板减少\n癫痫: 脑血流灌注异常\n意识障碍: 多因素导致\n预防: 合理抗凝，避免血压波动',
'ECMO相关神经系统并发症的识别与处理',
'ECMO,并发症,神经系统,脑梗塞,脑出血', 'MEDIUM', 7);

-- 插入系统配置
INSERT INTO system_config (config_key, config_value, config_type, description, is_system) VALUES
('system.title', 'ECMO诊疗专家系统', 'STRING', '系统标题', 1),
('system.version', '1.0.0', 'STRING', '系统版本', 1),
('assessment.auto_save', 'true', 'BOOLEAN', '是否自动保存评估结果', 0),
('assessment.max_history', '100', 'INTEGER', '最大历史记录数', 0),
('knowledge.page_size', '20', 'INTEGER', '知识库分页大小', 0),
('user.default_avatar', '/static/image/default-avatar.jpg', 'STRING', '默认头像路径', 0);

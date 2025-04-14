-- 创建数据库
CREATE DATABASE IF NOT EXISTS showroom_system;
USE showroom_system;

-- 创建展厅记录表
CREATE TABLE IF NOT EXISTS showroom_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    department VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    borrowSample BOOLEAN DEFAULT false,
    expectedReturnTime DATETIME,
    sampleId VARCHAR(50),
    actualReturnTime DATETIME,
    remark TEXT,
    date DATE NOT NULL,
    enterTime DATETIME NOT NULL,
    leaveTime DATETIME,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建管理员邀请码表
CREATE TABLE IF NOT EXISTS admin_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入默认管理员邀请码
INSERT IGNORE INTO admin_codes (code) VALUES ('admin123'); 
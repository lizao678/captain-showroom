require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// 创建数据库连接
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// 连接数据库
db.connect((err) => {
  if (err) {
    console.error('数据库连接失败:', err);
    return;
  }
  console.log('数据库连接成功');
  
  // 创建数据表
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS showroom_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      department VARCHAR(50) NOT NULL,
      reason TEXT NOT NULL,
      borrowSample BOOLEAN DEFAULT false,
      expectedReturnTime DATETIME,
      actualReturnTime DATETIME,
      remark TEXT,
      date DATE NOT NULL,
      enterTime DATETIME NOT NULL,
      leaveTime DATETIME,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  db.query(createTableSQL, (err) => {
    if (err) {
      console.error('创建数据表失败:', err);
      return;
    }
    console.log('数据表创建/确认成功');
  });
});

// 配置邮件发送
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: process.env.MAIL_PORT === '465',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// 发送邮件通知
async function sendNotificationEmail(record) {
  try {
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_TO,
      subject: '新的展厅登记申请',
      html: `
        <h2>新的展厅登记申请</h2>
        <p><strong>姓名：</strong>${record.name}</p>
        <p><strong>部门：</strong>${record.department}</p>
        <p><strong>日期：</strong>${record.date}</p>
        <p><strong>进入时间：</strong>${record.enterTime}</p>
        <p><strong>事由：</strong>${record.reason}</p>
        ${record.borrowSample ? `
          <p><strong>借用样衣：</strong>是</p>
          <p><strong>预计归还时间：</strong>${record.expectedReturnTime || '未设置'}</p>
        ` : ''}
        ${record.remark ? `<p><strong>备注：</strong>${record.remark}</p>` : ''}
      `
    });
    console.log('邮件发送成功');
  } catch (error) {
    console.error('邮件发送失败:', error);
  }
}

// API 路由
// 提交申请
app.post('/api/submit', (req, res) => {
  const record = req.body;
  
  // 格式化日期时间
  const formattedEnterTime = formatDateTime(record.enterTime);
  const formattedExpectedReturnTime = formatDateTime(record.expectedReturnTime);
  
  const data = {
    name: record.name,
    department: record.department,
    reason: record.reason,
    borrowSample: record.borrowSample,
    expectedReturnTime: formattedExpectedReturnTime,
    remark: record.remark,
    date: record.date,
    enterTime: formattedEnterTime
  };
  
  db.query('INSERT INTO showroom_log SET ?', data, async (err, result) => {
    if (err) {
      console.error('保存记录失败:', err);
      return res.status(500).json({ error: '保存记录失败' });
    }
    
    // 发送邮件通知
    await sendNotificationEmail(record);
    
    res.json({ 
      success: true, 
      id: result.insertId 
    });
  });
});

// 获取历史记录
app.get('/api/records', (req, res) => {
  db.query('SELECT * FROM showroom_log ORDER BY createdAt DESC', (err, results) => {
    if (err) {
      console.error('获取记录失败:', err);
      return res.status(500).json({ error: '获取记录失败' });
    }
    res.json(results);
  });
});

// 更新记录状态
app.put('/api/records/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  db.query(
    'UPDATE showroom_log SET status = ? WHERE id = ?',
    [status, id],
    (err) => {
      if (err) {
        console.error('更新状态失败:', err);
        return res.status(500).json({ error: '更新状态失败' });
      }
      res.json({ success: true });
    }
  );
});

// 更新离开时间
app.put('/api/records/:id/leave', (req, res) => {
  const { id } = req.params;
  const leaveTime = new Date();
  
  db.query(
    'UPDATE showroom_log SET leaveTime = ? WHERE id = ?',
    [leaveTime, id],
    (err) => {
      if (err) {
        console.error('更新离开时间失败:', err);
        return res.status(500).json({ error: '更新离开时间失败' });
      }
      res.json({ success: true });
    }
  );
});

// 更新实际归还时间
app.put('/api/records/:id/return', (req, res) => {
  const { id } = req.params;
  const actualReturnTime = new Date();
  
  db.query(
    'UPDATE showroom_log SET actualReturnTime = ? WHERE id = ?',
    [actualReturnTime, id],
    (err) => {
      if (err) {
        console.error('更新归还时间失败:', err);
        return res.status(500).json({ error: '更新归还时间失败' });
      }
      res.json({ success: true });
    }
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
}); 
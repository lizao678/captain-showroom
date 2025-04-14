require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const XLSX = require('xlsx');

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

// 创建数据表
const createTablesSQL = [
  `CREATE TABLE IF NOT EXISTS showroom_log (
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
  )`,
  `CREATE TABLE IF NOT EXISTS admin_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`
];

// 数据库连接重试函数
const connectWithRetry = (retries = 5, delay = 5000) => {
  return new Promise((resolve, reject) => {
    const attempt = (retryCount) => {
      db.connect((err) => {
        if (err) {
          console.error(`数据库连接失败 (尝试 ${retryCount}/${retries}):`, err);
          if (retryCount > 0) {
            console.log(`等待 ${delay/1000} 秒后重试...`);
            setTimeout(() => attempt(retryCount - 1), delay);
          } else {
            reject(err);
          }
        } else {
          console.log('数据库连接成功');
          resolve();
        }
      });
    };
    attempt(retries);
  });
};

// 连接数据库
connectWithRetry()
  .then(() => {
    // 创建数据表
    createTablesSQL.forEach((sql, index) => {
      db.query(sql, (err) => {
        if (err) {
          console.error(`创建数据表 ${index + 1} 失败:`, err);
          return;
        }
        console.log(`数据表 ${index + 1} 创建/确认成功`);
      });
    });

    // 初始化管理员邀请码
    const initAdminCode = 'admin123'; // 设置默认管理员邀请码
    db.query('INSERT IGNORE INTO admin_codes (code) VALUES (?)', [initAdminCode], (err) => {
      if (err) {
        console.error('初始化管理员邀请码失败:', err);
        return;
      }
      console.log('管理员邀请码初始化成功');
    });
  })
  .catch((err) => {
    console.error('数据库连接失败，退出应用:', err);
    process.exit(1);
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
          <p><strong>样衣编号：</strong>${record.sampleId || '未提供'}</p>
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
const formatDateTime = (dateTime) => {
    if (!dateTime) return null;
    // 将ISO格式转换为MySQL格式 (YYYY-MM-DD HH:mm:ss)
    return new Date(dateTime).toISOString().slice(0, 19).replace('T', ' ');
  };
  
  
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
    enterTime: formattedEnterTime,
    sampleId:record.sampleId
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

// 获取已审核记录
app.get('/api/reviewed-records', (req, res) => {
  const adminCode = req.headers['x-admin-code'];
  if (!adminCode) {
    return res.status(401).json({ error: '未授权访问' });
  }

  db.query('SELECT * FROM showroom_log WHERE status != "pending" ORDER BY date DESC, enterTime DESC', (err, results) => {
    if (err) {
      console.error('获取已审核记录失败:', err);
      return res.status(500).json({ error: '获取记录失败' });
    }
    res.json(results);
  });
});

// 获取所有记录
app.get('/api/records', (req, res) => {
  const adminCode = req.headers['x-admin-code'];
  if (!adminCode) {
    return res.status(401).json({ error: '未授权访问' });
  }

  db.query('SELECT * FROM showroom_log ORDER BY date DESC, enterTime DESC', (err, results) => {
    if (err) {
      console.error('获取记录失败:', err);
      return res.status(500).json({ error: '获取记录失败' });
    }
    res.json(results);
  });
});

// 管理员验证中间件
const checkAdmin = (req, res, next) => {
  const adminCode = req.headers['x-admin-code'];
  if (!adminCode) {
    return res.status(401).json({ error: '未提供管理员邀请码' });
  }

  db.query('SELECT * FROM admin_codes WHERE code = ?', [adminCode], (err, results) => {
    if (err) {
      console.error('验证管理员失败:', err);
      return res.status(500).json({ error: '验证管理员失败' });
    }
    if (results.length === 0) {
      return res.status(403).json({ error: '无效的管理员邀请码' });
    }
    next();
  });
};

// 验证管理员邀请码
app.post('/api/verify-admin', (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: '请提供邀请码' });
  }

  db.query('SELECT * FROM admin_codes WHERE code = ?', [code], (err, results) => {
    if (err) {
      console.error('验证邀请码失败:', err);
      return res.status(500).json({ error: '验证邀请码失败' });
    }
    if (results.length === 0) {
      return res.status(403).json({ error: '无效的邀请码' });
    }
    res.json({ isAdmin: true });
  });
});

// 获取待审核记录
app.get('/api/pending-records', checkAdmin, (req, res) => {
  db.query('SELECT * FROM showroom_log WHERE status = "pending" ORDER BY createdAt DESC', (err, results) => {
    if (err) {
      console.error('获取待审核记录失败:', err);
      return res.status(500).json({ error: '获取待审核记录失败' });
    }
    res.json(results);
  });
});

// 更新记录状态
app.put('/api/records/:id/status', checkAdmin, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: '无效的状态值' });
  }

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

// 导出Excel
app.get('/api/export-excel', (req, res) => {
  const adminCode = req.headers['x-admin-code'];
  const exportType = req.headers['export-type'];

  if (!adminCode) {
    return res.status(401).json({ error: '未授权访问' });
  }

  // 验证管理员权限
  db.query('SELECT * FROM admin_codes WHERE code = ?', [adminCode], (err, results) => {
    if (err || results.length === 0) {
      return res.status(403).json({ error: '无效的管理员邀请码' });
    }

    // 构建查询条件
    let query = 'SELECT * FROM showroom_log';
    if (exportType === 'pending') {
      query += ' WHERE status = "pending"';
    } else if (exportType === 'reviewed') {
      query += ' WHERE status != "pending"';
    }
    query += ' ORDER BY date DESC, enterTime DESC';

    // 获取数据
    db.query(query, (err, results) => {
      if (err) {
        console.error('获取导出数据失败:', err);
        return res.status(500).json({ error: '获取数据失败' });
      }

      // 格式化数据
      const formattedData = results.map(record => ({
        '姓名': record.name,
        '部门': record.department,
        '事由': record.reason,
        '进入时间': new Date(record.enterTime).toLocaleString('zh-CN'),
        '是否借出样衣': record.borrowSample ? '是' : '否',
        '样衣编号': record.sampleId || '',
        '预计归还时间': record.expectedReturnTime ? new Date(record.expectedReturnTime).toLocaleString('zh-CN') : '',
        '状态': record.status === 'pending' ? '待审核' : (record.status === 'approved' ? '已通过' : '已拒绝'),
        '备注': record.remark || ''
      }));

      // 创建工作簿
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(formattedData);

      // 设置列宽
      const colWidths = [
        { wch: 10 }, // 姓名
        { wch: 15 }, // 部门
        { wch: 30 }, // 事由
        { wch: 20 }, // 进入时间
        { wch: 12 }, // 是否借出样衣
        { wch: 15 }, // 样衣编号
        { wch: 20 }, // 预计归还时间
        { wch: 10 }, // 状态
        { wch: 20 }  // 备注
      ];
      ws['!cols'] = colWidths;

      // 将工作表添加到工作簿
      XLSX.utils.book_append_sheet(wb, ws, '展厅记录');

      // 生成Excel文件并转换为base64
      const excelBuffer = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

      // 设置文件名
      const fileName = `展厅记录_${exportType}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // 返回base64数据和文件名
      res.json({
        success: true,
        data: excelBuffer,
        fileName: fileName
      });
    });
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
}); 
import React, { useState, useEffect } from 'react';
import { View, Text, Input, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './index.scss';

// 定义记录类型
interface Record {
  id: number;
  name: string;
  department: string;
  reason: string;
  borrowSample: boolean;
  expectedReturnTime?: string;
  sampleId?: string;
  enterTime: string;
  status: 'pending' | 'approved' | 'rejected';
}

// 定义tab类型
type TabType = 'pending' | 'reviewed' | 'all';

const AdminPage = () => {
  // 状态管理
  const [adminCode, setAdminCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('pending');

  // 验证管理员身份
  const verifyAdmin = async () => {
    if (!adminCode) {
      Taro.showToast({
        title: '请输入邀请码',
        icon: 'none'
      });
      return;
    }

    try {
      setLoading(true);
      const res = await Taro.request({
        url: `${API_BASE_URL}/api/verify-admin`,
        method: 'POST',
        data: { code: adminCode }
      });

      if (res.statusCode === 200) {
        setIsVerified(true);
        // 存储邀请码到本地存储
        Taro.setStorageSync('adminCode', adminCode);
        fetchRecords();
      }
    } catch (error) {
      Taro.showToast({
        title: '验证失败',
        icon: 'none'
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取记录
  const fetchRecords = async () => {
    try {
      const storedCode = Taro.getStorageSync('adminCode');
      let url = `${API_BASE_URL}/api/records`;
      
      // 根据当前tab选择不同的API
      if (activeTab === 'pending') {
        url = `${API_BASE_URL}/api/pending-records`;
      } else if (activeTab === 'reviewed') {
        url = `${API_BASE_URL}/api/reviewed-records`;
      }

      const res = await Taro.request({
        url,
        method: 'GET',
        header: {
          'x-admin-code': storedCode
        }
      });

      if (res.statusCode === 200) {
        setRecords(res.data);
      }
    } catch (error) {
      console.error('获取记录失败:', error);
    }
  };

  // 处理审核
  const handleReview = async (id: number, status: 'approved' | 'rejected') => {
    try {
      const storedCode = Taro.getStorageSync('adminCode');
      const res = await Taro.request({
        url: `${API_BASE_URL}/api/records/${id}/status`,
        method: 'PUT',
        header: {
          'x-admin-code': storedCode
        },
        data: { status }
      });

      if (res.statusCode === 200) {
        Taro.showToast({
          title: '审核成功',
          icon: 'success'
        });
        fetchRecords(); // 刷新列表
      }
    } catch (error) {
      Taro.showToast({
        title: '审核失败',
        icon: 'none'
      });
    }
  };

  // 切换tab
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // 监听tab变化
  useEffect(() => {
    if (isVerified) {
      fetchRecords();
    }
  }, [activeTab, isVerified]);

  // 页面加载时检查是否已验证
  useEffect(() => {
    const storedCode = Taro.getStorageSync('adminCode');
    if (storedCode) {
      setAdminCode(storedCode);
      setIsVerified(true);
      fetchRecords();
    }
  }, []);

  // 获取tab标题
  const getTabTitle = (tab: TabType) => {
    switch (tab) {
      case 'pending':
        return '待审核';
      case 'reviewed':
        return '已审核';
      case 'all':
        return '全部记录';
      default:
        return '';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '待审核';
      case 'approved':
        return '已通过';
      case 'rejected':
        return '已拒绝';
      default:
        return '';
    }
  };

  // 格式化时间
  const formatTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return '';
    const date = new Date(dateTimeStr);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  // 导出Excel
  const exportToExcel = async () => {
    try {
      const storedCode = Taro.getStorageSync('adminCode');
      let url = `${API_BASE_URL}/api/export-excel`;
      
      // 根据当前tab选择不同的导出类型
      const exportType = activeTab;
      
      const res = await Taro.request({
        url,
        method: 'GET',
        header: {
          'x-admin-code': storedCode,
          'export-type': exportType
        }
      });

      if (res.statusCode === 200 && res.data.success) {
        // 创建下载链接
        const link = document.createElement('a');
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${res.data.data}`;
        link.download = res.data.fileName as string;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Taro.showToast({
          title: '导出成功',
          icon: 'success'
        });
      } else {
        throw new Error('导出失败');
      }
    } catch (error) {
      console.error('导出失败', error);
      Taro.showToast({
        title: '导出失败',
        icon: 'none'
      });
    }
  };

  return (
    <View className='admin-container'>
      {!isVerified ? (
        <View className='verify-section'>
          <Text className='title'>管理员验证</Text>
          <Input
            className='input'
            placeholder='请输入管理员邀请码'
            value={adminCode}
            onInput={e => setAdminCode(e.detail.value)}
          />
          <Button 
            className='verify-btn' 
            onClick={verifyAdmin}
            loading={loading}
          >
            验证
          </Button>
        </View>
      ) : (
        <View className='records-section'>
          <View className='tabs'>
            {(['pending', 'reviewed', 'all'] as TabType[]).map(tab => (
              <View
                key={tab}
                className={`tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => handleTabChange(tab)}
              >
                <Text>{getTabTitle(tab)}</Text>
              </View>
            ))}
          </View>
          <ScrollView className='records-list'>
            {records.length === 0 ? (
              <Text className='empty-text'>暂无记录</Text>
            ) : (
              records.map(record => (
                <View key={record.id} className='record-card'>
                  <View className='record-info'>
                    <View>姓名：{record.name}</View>
                    <View>部门：{record.department}</View>
                    <View>事由：{record.reason}</View>
                    <View>进入时间：{formatTime(record.enterTime)}</View>
                    {record.borrowSample && (
                      <>
                        <View>样衣编号：{record.sampleId}</View>
                        <View>预计归还时间：{formatTime(record.expectedReturnTime)}</View>
                      </>
                    )}
                    <View className={`status status-${record.status}`}>
                      状态：{getStatusText(record.status)}
                    </View>
                  </View>
                  {record.status === 'pending' && (
                    <View className='action-buttons'>
                      <Button 
                        className='approve-btn'
                        onClick={() => handleReview(record.id, 'approved')}
                      >
                        通过
                      </Button>
                      <Button 
                        className='reject-btn'
                        onClick={() => handleReview(record.id, 'rejected')}
                      >
                        拒绝
                      </Button>
                    </View>
                  )}
                </View>
              ))
            )}
          </ScrollView>
          <Button className='export-btn' onClick={exportToExcel}>
            导出Excel
          </Button>
        </View>
      )}
    </View>
  );
};

export default AdminPage; 
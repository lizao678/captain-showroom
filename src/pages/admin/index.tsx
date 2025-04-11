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
        url: 'http://localhost:3000/api/verify-admin',
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
      let url = 'http://localhost:3000/api/records';
      
      // 根据当前tab选择不同的API
      if (activeTab === 'pending') {
        url = 'http://localhost:3000/api/pending-records';
      } else if (activeTab === 'reviewed') {
        url = 'http://localhost:3000/api/reviewed-records';
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
        url: `http://localhost:3000/api/records/${id}/status`,
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
                    <Text>姓名：{record.name}</Text>
                    <Text>部门：{record.department}</Text>
                    <Text>事由：{record.reason}</Text>
                    <Text>进入时间：{record.enterTime}</Text>
                    {record.borrowSample && (
                      <>
                        <Text>样衣编号：{record.sampleId}</Text>
                        <Text>预计归还时间：{record.expectedReturnTime}</Text>
                      </>
                    )}
                    <Text className={`status status-${record.status}`}>
                      状态：{getStatusText(record.status)}
                    </Text>
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
        </View>
      )}
    </View>
  );
};

export default AdminPage; 
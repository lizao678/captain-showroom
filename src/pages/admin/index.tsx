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

const AdminPage = () => {
  // 状态管理
  const [adminCode, setAdminCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);

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
        fetchPendingRecords();
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

  // 获取待审核记录
  const fetchPendingRecords = async () => {
    try {
      const storedCode = Taro.getStorageSync('adminCode');
      const res = await Taro.request({
        url: 'http://localhost:3000/api/pending-records',
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
        fetchPendingRecords(); // 刷新列表
      }
    } catch (error) {
      Taro.showToast({
        title: '审核失败',
        icon: 'none'
      });
    }
  };

  // 页面加载时检查是否已验证
  useEffect(() => {
    const storedCode = Taro.getStorageSync('adminCode');
    if (storedCode) {
      setAdminCode(storedCode);
      setIsVerified(true);
      fetchPendingRecords();
    }
  }, []);

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
        <ScrollView className='records-section'>
          <Text className='title'>待审核记录</Text>
          {records.length === 0 ? (
            <Text className='empty-text'>暂无待审核记录</Text>
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
                </View>
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
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

export default AdminPage; 
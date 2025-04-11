import { View, Text } from '@tarojs/components'
import { useState, useEffect } from 'react'
import Taro from '@tarojs/taro'
import './index.scss'

// 记录类型定义
interface Record {
  id: number
  name: string
  department: string
  date: string
  enterTime: string
  leaveTime: string | null
  reason: string
  borrowSample: boolean
  expectedReturnTime: string | null
  actualReturnTime: string | null
  remark: string
  status: 'pending' | 'approved' | 'rejected'
  sampleId:string
}

export default function History() {
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)

  // 获取历史记录
  const fetchRecords = async () => {
    try {
      const res = await Taro.request({
        url: 'http://localhost:3000/api/records',
        method: 'GET'
      })

      if (res.statusCode === 200) {
        
        // 将下划线命名转换为驼峰命名
        const formattedRecords = res.data.map(record => ({
            ...record,
          id: record.id,
          name: record.name,
          department: record.department,
          date: record.date,
          reason: record.reason,
          remark: record.remark,
          status: record.status
        }))
        setRecords(formattedRecords)
      }
    } catch (error) {
      console.error('获取记录失败', error)
      Taro.showToast({
        title: '获取记录失败',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  // 格式化时间
  const formatDateTime = (dateTimeStr: string) => {
    
    const date = new Date(dateTimeStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  // 获取状态标签样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'approved':
        return 'status-approved'
      case 'rejected':
        return 'status-rejected'
      default:
        return 'status-pending'
    }
  }

  return (
    <View className='history'>
      <View className='header'>历史记录</View>
      
      {loading ? (
        <View className='loading'>加载中...</View>
      ) : records.length === 0 ? (
        <View className='empty'>暂无记录</View>
      ) : (
        <View className='record-list'>
          {records.map(record => (
            <View key={record.id} className='record-item'>
              <View className='record-header'>
                <Text className='name'>{record.name}</Text>
                <Text className={`status ${getStatusStyle(record.status)}`}>
                  {record.status === 'approved' ? '已批准' : 
                   record.status === 'rejected' ? '已拒绝' : '待审核'}
                </Text>
              </View>

              <View className='record-info'>
                <View className='info-item'>
                  <Text className='label'>部门：</Text>
                  <Text className='value'>{record.department}</Text>
                </View>

                <View className='info-item'>
                  <Text className='label'>申请日期：</Text>
                  <Text className='value'>{formatDateTime(record.date).slice(0, -5)}</Text>
                </View>

                <View className='info-item'>
                  <Text className='label'>进入时间：</Text>
                  <Text className='value'>{formatDateTime(record.enterTime)}</Text>
                </View>

                {record.leaveTime && (
                  <View className='info-item'>
                    <Text className='label'>离开时间：</Text>
                    <Text className='value'>{formatDateTime(record.leaveTime)}</Text>
                  </View>
                )}

                <View className='info-item'>
                  <Text className='label'>事由：</Text>
                  <Text className='value'>{record.reason}</Text>
                </View>

                {record.borrowSample && (
                  <>
                    <View className='info-item'>
                        <Text className='label'>样衣编号：</Text>
                        <Text className='value'>{record.sampleId}</Text>
                    </View>
                    <View className='info-item'>
                      <Text className='label'>预计归还：</Text>
                      <Text className='value'>
                        {record.expectedReturnTime ? formatDateTime(record.expectedReturnTime) : '未设置'}
                      </Text>
                    </View>

                    <View className='info-item'>
                      <Text className='label'>实际归还：</Text>
                      <Text className='value'>
                        {record.actualReturnTime ? formatDateTime(record.actualReturnTime) : '未归还'}
                      </Text>
                    </View>
                  </>
                )}

                {record.remark && (
                  <View className='info-item'>
                    <Text className='label'>备注：</Text>
                    <Text className='value'>{record.remark}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  )
} 
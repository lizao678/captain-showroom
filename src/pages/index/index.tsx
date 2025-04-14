import React, { useCallback, useState } from "react";
import { View, Text, Button, Image, Form, Input, Picker, Switch, Textarea } from "@tarojs/components";
import { useEnv, useNavigationBar, useModal, useToast } from "taro-hooks";
import logo from "./hook.png";
import Taro from '@tarojs/taro'

import './index.scss'

// 表单数据接口定义
interface FormData {
  name: string
  department: string
  reason: string
  borrowSample: boolean
  expectedReturnTime?: string
  remark?: string
  sampleId?: string
  enterTime: string
}

const Index = () => {
//   const env = useEnv();
//   const { setTitle } = useNavigationBar({ title: "Taro Hooks" });
//   const showModal = useModal({
//     title: "Taro Hooks Canary!",
//     showCancel: false,
//     confirmColor: "#8c2de9",
//     confirmText: "支持一下"
//   });
//   const { show } = useToast({ mask: true });

  // 表单状态
  const [formData, setFormData] = useState<FormData>({
    name: '',
    department: '',
    reason: '',
    borrowSample: false,
    expectedReturnTime: '',
    remark: '',
    sampleId: '',
    enterTime: ''
  })

//   const handleModal = useCallback(() => {
//     showModal({ content: "不如给一个star⭐️!" }).then(() => {
//       show({ title: "点击了支持!" });
//     });
//   }, [show, showModal]);

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      // 验证必填字段
      if (!formData.name || !formData.department || !formData.reason) {
        Taro.showToast({
          title: '请填写必填项',
          icon: 'none'
        })
        return
      }

      // 构建提交数据
      const submitData = {
        ...formData,
        date: new Date().toISOString().split('T')[0],
        enterTime: new Date().toISOString(),
      }

      // 发送请求
      const res = await Taro.request({
        url: `${API_BASE_URL}/api/submit`,
        method: 'POST',
        data: submitData
      })

      if (res.statusCode === 200) {
        Taro.showToast({
          title: '提交成功',
          icon: 'success'
        })

        // 重置表单
        setFormData({
          name: '',
          department: '',
          reason: '',
          borrowSample: false,
          expectedReturnTime: '',
          remark: '',
          sampleId: '',
          enterTime: ''
        })
      }
    } catch (error) {
      console.error('提交失败', error)
      Taro.showToast({
        title: '提交失败，请重试',
        icon: 'none'
      })
    }
  }

  // 跳转到历史记录页面
//   const navigateToHistory = () => {
//     Taro.navigateTo({
//       url: '/pages/history/index'
//     })
//   }

   // 跳转到审核后台
//    const navigateToAdmin = () => {
//     Taro.navigateTo({
//       url: '/pages/admin/index'
//     })
//   }

  return (
    <View className="wrapper">
      <Image className="logo" src={logo} />
      {/* <Text className="title">为Taro而设计的Hooks Library</Text>
      <Text className="desc">
        目前覆盖70%官方API. 抹平部分API在H5端短板. 提供近40+Hooks!
        并结合ahook适配Taro! 更多信息可以查看新版文档: https://next-version-taro-hooks.vercel.app/
      </Text>
      <View className="list">
        <Text className="label">运行环境</Text>
        <Text className="note">{env}</Text>
      </View>
      <Button className="button" onClick={() => setTitle("Taro Hooks Nice!")}>
        设置标题
      </Button>
      <Button className="button" onClick={handleModal}>
        使用Modal
      </Button> */}

      <View className='index'>
        <View className='form-header'>展厅登记系统</View>
        
        <Form onSubmit={handleSubmit}>
          <View className='form-item'>
            <View className='label'> 
                姓名 <Text className='required'>*</Text>
            </View>
            <Input
              className='input'
              value={formData.name}
              onInput={e => setFormData(prev => ({ ...prev, name: e.detail.value }))}
              placeholder='请输入姓名'
            />
          </View>

          <View className='form-item'>
            <View className='label'> 
                部门 <Text className='required'>*</Text>
            </View>
            <Input
              className='input'
              value={formData.department}
              onInput={e => setFormData(prev => ({ ...prev, department: e.detail.value }))}
              placeholder='请输入部门'
            />
          </View>

          <View className='form-item'>
            <View className='label'>
                事由 <Text className='required'>*</Text>
            </View>
            <Textarea
              className='textarea'
              value={formData.reason}
              onInput={e => setFormData(prev => ({ ...prev, reason: e.detail.value }))}
              placeholder='请输入进入事由'
            />
          </View>
          <View className='form-item'>
            <View className='label'> 
            进入时间：<Text className='required'>*</Text>
            </View>
            <Picker
                mode='time'
                defaultValue={new Date().toTimeString().slice(0, 5)}
                onChange={e => setFormData(prev => ({ ...prev, enterTime: e.detail.value }))}
              >
                <View className='picker'>
                  {formData.enterTime || '请选择进入时间'}
                </View>
              </Picker>
          </View>

          <View className='form-item'>
            <View className='label'>是否借出样衣</View>
            <Switch
              checked={formData.borrowSample}
              onChange={e => setFormData(prev => ({ ...prev, borrowSample: e.detail.value }))}
            />
          </View>
          {formData.borrowSample && (
            <View className='form-item'>
              <View className='label'>样衣编号</View>
              <Input
                className='input'
                value={formData.sampleId}
                onInput={e => setFormData(prev => ({ ...prev, sampleId: e.detail.value }))}
                placeholder='请输入样衣编号'
                />
            </View>
          )}

          {formData.borrowSample && (
            <View className='form-item'>
              <View className='label'>预计归还时间</View>
              <Picker
                mode='date'
                onChange={e => setFormData(prev => ({ ...prev, expectedReturnTime: e.detail.value }))}
              >
                <View className='picker'>
                  {formData.expectedReturnTime || '请选择预计归还时间'}
                </View>
              </Picker>
            </View>
          )}
         

          <View className='form-item'>
            <View className='label'>备注</View>
            <Textarea
              className='textarea'
              value={formData.remark}
              onInput={e => setFormData(prev => ({ ...prev, remark: e.detail.value }))}
              placeholder='请输入备注信息'
            />
          </View>

          <View className='button-group'>
            <Button className='submit-btn' formType='submit' type='primary'>
              提交
            </Button>
            {/* <Button className='history-btn' onClick={navigateToHistory}>
              查看历史记录
            </Button> */}
            {/* <Button className='admin-btn' onClick={navigateToAdmin}>
              进入审核后台
            </Button> */}
          </View>
        </Form>
      </View>
    </View>
  );
};

export default Index;

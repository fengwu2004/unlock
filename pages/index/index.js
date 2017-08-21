//index.js
//获取应用实例
var app = getApp()
Page({
  data: {
    open: '开启蓝牙',
    search:'搜索蓝牙设备',
    getdevice:'获取蓝牙设备',
    connect:'连接蓝牙设备',
    senddata:'发送数据',
    result:'未连接',
    devices: [],
    userInfo: {}
  },
  //事件处理函数
  openDevice: function() {
    var self = this
    wx.openBluetoothAdapter({
      success: function(res) {
        self.setData({
          result:'开启成功'
        })
      },
      fail: function(res) {
        self.setData({
          result:'开启蓝牙失败'
        })
      }
    })
  },
  searchDevice: function() {

    var self = this

    wx.startBluetoothDevicesDiscovery({
      services:['FEE7'],
      success: function(res) {
        self.setData({
          result: '搜索成功'
        })
      },
      fail:function (res) {
        self.setData({
          result:'搜索失败'
        })
      }
    })
  },
  getDevice: function() {
    var self = this
    wx.getBluetoothDevices({
      success: function(res) {
        console.log(JSON.stringify(res))
        self.setData({
          result: '获取蓝牙设备成功',
          devices:res.devices
        })
      },
    })
  },
  onLoad: function () {
    console.log('onLoad')
    var that = this
    //调用应用实例的方法获取全局数据
    app.getUserInfo(function(userInfo){
      //更新数据
      that.setData({
        userInfo:userInfo
      })
    })
  }
})

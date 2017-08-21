//index.js
//获取应用实例
var app = getApp()
Page({
  data: {
    open: '开启蓝牙',
    search:'搜索蓝牙设备',
    getdevice:'获取蓝牙设备',
    connect:'连接蓝牙设备',
    connect:'连接',
    senddata: '发送数据',
    receivedata:'读取蓝牙数据',
    result:'未连接',
    deviceId:'',
    servierId:'',
    writecharacteristicId:'',
    indicatecharacteristicId: '',
    devices: [],
    userInfo: {}
  },
  //事件处理函数
  openDevice: function() {
    var self = this
    wx.openBluetoothAdapter({
      success: function(res) {
        self.setTip('开启成功')
      },
      fail: function(res) {
        self.setTip('开启蓝牙失败')
      }
    })
  },
  setTip: function(str) {
    this.setData({
      result: str
    })
  },
  searchDevice: function() {

    var self = this

    wx.startBluetoothDevicesDiscovery({
      services:['FEE7'],
      success: function(res) {
        self.setTip('搜索成功')
      },
      fail:function (res) {
        self.setTip('搜索失败')
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
      fail: function(res) {
        console.log(JSON.stringify(res))
      },
      complete: function(res) {
        console.log(JSON.stringify(res))
      }
    })
  },
  connectDevice: function () {

    var self = this

    this.data.deviceId = ''

    if (this.data.devices.length <= 0) {

      self.setTip('请先点击获取蓝牙设备')

      return
    }

    this.data.deviceId = this.data.devices[0].deviceId

    wx.createBLEConnection({

      deviceId: self.data.deviceId,

      success: function(res) {

        wx.getBLEDeviceServices({

          deviceId: self.data.deviceId,

          success: function (res) {

            self.data.serverId = res.services[0].uuid

            wx.getBLEDeviceCharacteristics({

              deviceId: self.data.deviceId,

              serviceId: self.data.serverId,

              success: function (res) {

                var hasReadCharater = false

                var hasWriteCharater = false

                for (var i = 0; i < res.characteristics.length; ++i) {

                  if (res.characteristics[i].properties.indicate) {

                    self.data.indicatecharacteristicId = res.characteristics[i].uuid

                    hasReadCharater = true

                    break
                  }
                }

                for (var i = 0; i < res.characteristics.length; ++i) {

                  if (res.characteristics[i].properties.write) {

                    self.data.writecharacteristicId = res.characteristics[i].uuid

                    hasWriteCharater = true

                    break
                  }
                }

                if (hasReadCharater) {

                  self.setTip('蓝牙设备支持读')
                }
                else {

                  self.setTip('蓝牙设备不支持读')
                }
              },
            })
          }
        })
      },
    })
  },
  sendData: function (){

    var self = this

    if (self.data.deviceId === '' || self.data.serverId === '' || self.data.writecharacteristicId === '') {

      self.setTip('请先连接')

      return
    }

    var buffer = new ArrayBuffer(1)

    wx.writeBLECharacteristicValue({

      deviceId: self.data.deviceId,

      serviceId: self.data.serverId,

      characteristicId: self.data.writecharacteristicId,

      value: buffer,

      success: function (res) {

        console.log('writeBLECharacteristicValue success', res.errMsg)
      }
    })
  },
  receiveData: function() {

    var self = this

    if (self.data.deviceId === '' || self.data.serverId === '' || self.data.indicatecharacteristicId === '') {

      self.setTip('请先连接')

      return
    }

    wx.notifyBLECharacteristicValueChange({

      state: true, // 启用 notify 功能
      // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
      deviceId: self.data.deviceId,
      // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
      serviceId: self.data.serverId,
      // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取
      characteristicId: self.data.indicatecharacteristicId,

      success: function (res) {
        self.setTip('notifyBLECharacteristicValueChange success', res.errMsg)
      }
    })

    wx.onBLECharacteristicValueChange(function (res) {

      var buffer = res.value

      const dataView = new DataView(buffer)

      self.setTip('读取到的值是' + ':' + dataView.getUint8(1))
    })

    wx.readBLECharacteristicValue({
      
      deviceId: self.data.deviceId,
      
      serviceId: self.data.serverId,
      
      characteristicId: self.data.indicatecharacteristicId,

      success: function (res) {

        self.setTip(writecharacteristicId + ':' + JSON.stringify(res))
      }
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

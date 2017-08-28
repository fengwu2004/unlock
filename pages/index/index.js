//index.js
//获取应用实例

var app = getApp()
Page({
  data: {
    open: '开启蓝牙',
    search: '搜索蓝牙设备',
    getdevice: '获取蓝牙设备',
    connect: '连接蓝牙设备',
    connect: '连接',
    senddata: '发送数据',
    receivedata: '读取蓝牙数据',
    result: '未连接',
    deviceId: '',
    servierId: '',
    writecharacteristicId: '',
    indicatecharacteristicId: '',
    beginReceive: false,
    receivechars: '',
    receiveLength: 0,
    devices: [],
    userInfo: {}
  },
  //事件处理函数
  openDevice: function () {
    var self = this
    wx.openBluetoothAdapter({
      success: function (res) {
        self.setTip('开启成功')
      },
      fail: function (res) {
        self.setTip('开启蓝牙失败')
      }
    })
  },
  setTip: function (str) {
    this.setData({
      result: str
    })
  },
  searchDevice: function () {

    var self = this

    wx.startBluetoothDevicesDiscovery({
      services: ['FEE7'],
      success: function (res) {
        self.setTip('搜索成功')
      },
      fail: function (res) {
        self.setTip('搜索失败')
      }
    })
  },
  getDevice: function () {
    var self = this
    wx.getBluetoothDevices({
      success: function (res) {
        console.log(JSON.stringify(res))
        self.setData({
          result: '获取蓝牙设备成功',
          devices: res.devices
        })
      },
      fail: function (res) {
        console.log(JSON.stringify(res))
      },
      complete: function (res) {
        console.log(JSON.stringify(res))
      }
    })
  },
  connectDevice: function () {

    var self = this

    this.data.deviceId = 'F4:B8:5E:DD:8F:6E'

    wx.createBLEConnection({

      deviceId: self.data.deviceId,

      success: function (res) {

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

  splictPackage: function (str) {

    var totallength = str.length + 8

    var packs = []

    var buffer = new ArrayBuffer(totallength)

    var dv = new DataView(buffer)

    dv.setUint8(0, 0xFE)
    dv.setInt8(1, 1)
    dv.setUint16(2, str.length)
    dv.setUint16(4, 0)
    dv.setUint16(6, 0)

    for (var i = 0; i < str.length; ++i) {

      dv.setUint8(i + 8, str.charCodeAt(i))
    }

    var packcount = Math.ceil(totallength / 20)

    for (var i = 0; i < packcount; ++i) {

      var pack = new ArrayBuffer(20)

      var dataview = new DataView(pack)

      for (var j = 0; j < 20 && j + i * 20 < totallength; ++j) {

        var value = dv.getUint8(j + i * 20)

        dataview.setUint8(j, value)
      }

      packs.push(pack)
    }

    return packs
  },

  sendData: function () {

    var self = this

    if (self.data.deviceId === '' || self.data.serverId === '' || self.data.writecharacteristicId === '') {

      self.setTip('请先连接')

      return
    }

    var str = '11111111112222222222333333333344'

    var packs = self.splictPackage(str)

    function queueSend(pack) {

      return new Promise(function (resolve, reject) {

        wx.writeBLECharacteristicValue({
          deviceId: self.data.deviceId,
          serviceId: self.data.serverId,
          characteristicId: self.data.writecharacteristicId,
          value: pack,
          complete: function (res) {
            // console.log('发送包:' + index)
            resolve(res)
          },
          fail: function (res) {
            // console.log('发送包:' + index + '失败')
            reject(res)
          }
        })
      })
    }

    var result = Promise.resolve()

    packs.forEach((pack) => {

      result = result.then(() => {

        return queueSend(pack)
      })
    })

    result.then(() => {

      self.setTip('发送完毕')
    })
  },
  receiveData: function () {

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

      var arr = new Uint8Array(buffer)

      var dv = new DataView(buffer)

      if (self.receiveLength == 0) {

        self.receiveLength = dv.getUint16(2)

        for (var i = 0; i < self.receiveLength && i < 12; ++i) {

          self.receivechars += String.fromCharCode(dv.getUint8(8 + i))
        }

        console.log('接收到的字符串:' + self.receivechars)

        return
      }
      
      for (var i = 0; i < arr.length; ++i) {

        self.receivechars += String.fromCharCode(dv.getUint8(i))
      }
      
      console.log('接收到的字符串:' + self.receivechars)
    })

    wx.readBLECharacteristicValue({

      deviceId: self.data.deviceId,

      serviceId: self.data.serverId,

      characteristicId: self.data.indicatecharacteristicId,

      success: function (res) {

        self.setTip(writecharacteristicId + ':' + JSON.stringify(res))
      },
      complete: function () {

        self.receiveLength = 0
      }
    })
  },
  onLoad: function () {
    console.log('onLoad')
    var that = this
    //调用应用实例的方法获取全局数据
    app.getUserInfo(function (userInfo) {
      //更新数据
      that.setData({
        userInfo: userInfo
      })
    })
  }
})

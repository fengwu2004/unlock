
var SparkMD5 = require('./SparkMD5.js')
//app.js
App({
  onLaunch: function() {
    //调用API从本地缓存中获取数据
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    var res = wx.getSystemInfoSync()
    this.globalData.ios = (res.system.indexOf('iOS') != -1)
  },

  onShow:function() {


  },

  getUserInfo: function(cb) {
    var that = this
    if (this.globalData.userInfo) {
      typeof cb == "function" && cb(this.globalData.userInfo)
    } else {
      //调用登录接口
      wx.getUserInfo({
        withCredentials: false,
        success: function(res) {
          that.globalData.userInfo = res.userInfo
          console.log(res.userInfo)
          typeof cb == "function" && cb(that.globalData.userInfo)
        }
      })
    }
  },
  promiseOfOpenDevice: function () {
  	var self = this
		console.log('开启....')
    return new Promise((resolve, reject) => {
      wx.openBluetoothAdapter({
				success:()=>{ self.globalData.openSuccess = true; console.log('开启成功') },
				complete: function (res) { console.log('开启完毕'); resolve(res) },
        fail: function (res) { self.globalData.openSuccess = false; reject(res) }
      })
    })
  },

  promiseOfConnect: function () {
    var self = this
    return new Promise((resolve, reject) => {
      wx.createBLEConnection({
        deviceId: self.globalData.deviceId,
        success: (res) => { resolve(res) },
        fail: (res) => { reject(res) }
      })
    })
  },

  promiseOfGetBLEDeviceServices: function () {

    var self = this
    return new Promise((resolve, reject) => {
      wx.getBLEDeviceServices({
        deviceId: self.globalData.deviceId,
        success: (res) => { resolve(res) },
        fail: (res) => { reject(res) }
      })
    })
  },

  promiseOfGetBLEDeviceCharacteristics: function (res) {
    var self = this
    self.globalData.serverId = res.services[0].uuid
    return new Promise((resolve, reject) => {
      wx.getBLEDeviceCharacteristics({
        deviceId: self.globalData.deviceId,
        serviceId: self.globalData.serverId,
        success: (res) => { resolve(res) },
        fail: (res) => { reject(res) }
      })
    })
  },

  promiseOfGetCharacters: function (res) {
    var self = this
    for (var i = 0; i < res.characteristics.length; ++i) {
      if (res.characteristics[i].properties.indicate) {
        self.globalData.indicatecharacteristicId = res.characteristics[i].uuid
        break
      }
    }

    for (var i = 0; i < res.characteristics.length; ++i) {
      if (res.characteristics[i].properties.write) {
        self.globalData.writecharacteristicId = res.characteristics[i].uuid
        break
      }
    }

    return new Promise((resolve) => {
      resolve()
    })
  },

  promiseOfBeginNotify: function () {
    var self = this
    return new Promise((resolove, reject) => {
      wx.notifyBLECharacteristicValueChange({
        state: true, // 启用 notify 功能
        deviceId: self.globalData.deviceId,
        serviceId: self.globalData.serverId,
        characteristicId: self.globalData.indicatecharacteristicId,
        success: (res) => { resolove(res) },
        fail: (res) => { reject(res) }
      })
    })
  },

  promiseOfBeginReadData: function () {
    var self = this
    return new Promise((resolve, reject) => {
      wx.readBLECharacteristicValue({
        deviceId: self.globalData.deviceId,
        serviceId: self.globalData.serverId,
        characteristicId: self.globalData.indicatecharacteristicId,
        success: (res) => { resolve(res) },
        complete: (res) => { reject(res) }
      })
    })
  },

  promiseOfGetBluetoothAdapterState: function () {

    var self = this
    return new Promise((resolve, reject) => {

      wx.getBluetoothAdapterState({

        success: ((res) => { })
      })
    })
  },

  doConnect: function (cb) {

    var self = this

    this.globalData.connectCallback = cb

    if (this.globalData.ios) {

      this.globalData.deviceId = '7AF78A03-34B8-451E-9CD4-ADDB48ADAB21'
    }
    else {

      this.globalData.deviceId = '18:93:D7:28:7A:E4'
    }

    self.promiseOfOpenDevice()
      .then(() => {

    		if (self.globalData.openSuccess) {
			
					console.log('开始连接')
			
					return self.promiseOfConnect()
				}
				else {
    	
					return Promise.reject()
				}
      })
      .then((res) => {

        return self.promiseOfGetBLEDeviceServices(res)
      })
      .then((res) => {

        return self.promiseOfGetBLEDeviceCharacteristics(res)
      })
      .then((res) => {

        return self.promiseOfGetCharacters(res)
      })
      .then(() => {

        return self.promiseOfBeginNotify()
      })
      .then(() => {

        wx.onBLECharacteristicValueChange((res) => {

          self.doReceive(res)
        })
      })
      .catch((res) => {
	
				if (self.globalData.connectedCount < 0) {
		
					self.globalData.connectedCount += 1
					
					self.doDisconnect(()=> {
						
						self.doConnect(cb)
					})
		
					return
				}
				
        self.globalData.connectCallback && self.globalData.connectCallback(false)

        console.log(JSON.stringify(res))
      })
  },

  logBuff: function (buff) {

    var uint8arry = new Uint8Array(buff)

    var str = ''

    for (var i = 0; i < uint8arry.length; ++i) {

      str += uint8arry[i].toString(16)
    }

    return str
  },

  promiseOfSendData: function (str, type) {

    var self = this

    var packs = self.splictPackage(str, type)

    function queueSend(pack) {
      console.log('发送数据:' + self.logBuff(pack))
			console.log('发送数据serviceId:' + self.globalData.serverId)
      return new Promise(function (resolve, reject) {
        wx.writeBLECharacteristicValue({
          deviceId: self.globalData.deviceId,
          serviceId: self.globalData.serverId,
          characteristicId: self.globalData.writecharacteristicId,
          value: pack,
          complete: (res) => { resolve(res) },
          fail: (res) => { console.log('发送数据错误'); reject(res) }
        })
      })
    }

    var result = Promise.resolve()

    packs.forEach((pack) => {

      result = result.then(() => {

        return queueSend(pack)
      })
    })

    return result
  },

  setTip: function (str) {

  },

  exist:function(devices, deviceId) {
		
    for (var i = 0; i < devices.length; ++i) {

      if (devices[i].deviceId == deviceId) {

        return true
      }
    }

    return false
  },

  promiseCheckConneted:function() {

    var self = this

    return new Promise((resolve, reject)=>{

      wx.getBluetoothDevices({
        success:(res)=>{

        	if (self.exist(res.devices, self.globalData.deviceId)) {
		
        		console.log('连接正常')
        		
						resolve()
						
						return
					}
	
					console.log('连接断开')
					
					reject()
        },
        fail:(res) => { reject(res) }
      })
    })
  },

  unLock: function (cb) {

    var self = this
		
		self.globalData.unlockCallback = cb

    console.log('准备发送payorderid')

    self.promiseCheckConneted()
		.catch(()=>{
		
				self.doConnect(function() {
			
					Promise.resolve()
				
						.then(()=>{
					
							return self.promiseOfSendData(self.globalData.payorderId, 1)
						})
						.then(()=>{
					
							return self.promiseOfSendData(self.globalData.serverMd5str, 2)
						})
						.then(()=>{
					
							wx.onBLECharacteristicValueChange((res) => {
						
								self.doReceive(res)
							})
						})
						.catch((res)=>{
						
							console.log(JSON.stringify(res))
						})
				})
		})
    .then(()=>{

      return self.promiseOfSendData(self.globalData.payorderId, 1)
    })
		.then(() => {
			
			return self.promiseOfSendData(self.globalData.serverMd5str, 2)
		})
		.then(() => {

			wx.onBLECharacteristicValueChange((res) => {

				self.doReceive(res)
			})
		})
  },

  onResetReceiveData: function () {

    var self = this

    self.globalData.receivechars = ''

    self.globalData.receiveLength = 0

    self.globalData.receiveType = -1
  },

  onReceiveFinish: function () {

    var self = this

    var str = self.globalData.receivechars.slice(8)

    console.log('数据接收完毕, 类型为' + self.globalData.receiveType)

    console.log('数据值为:' + str)

    if (self.globalData.receiveType == 0) {

      self.globalData.token = str

      self.globalData.serverMd5str = SparkMD5.hash(self.globalData.token + 'sodixvhn3grledjs90' + self.globalData.payorderId)

      self.onResetReceiveData()

      self.setTip('连接成功')

      self.globalData.connectCallback && self.globalData.connectCallback(true)

      console.log('token: ' + self.globalData.token)

      return
    }

    if (self.globalData.receiveType == 3) {

      self.globalData.unlockresult = str

      self.onResetReceiveData()

      if (self.globalData.unlockresult == '1') {

        self.setTip('开锁成功')
	
				self.globalData.unlockCallback && self.globalData.unlockCallback(true)
				
        self.doDisconnect()
      }
      else {

        self.setTip('开锁失败')
	
				self.globalData.unlockCallback && self.globalData.unlockCallback(false)
      }

      console.log('unlockresult: ' + self.globalData.unlockresult)

      return
    }
  },
	
	doDisconnect: function(cb) {
		
  	var self = this
		
  	wx.closeBLEConnection({
			
			deviceId:self.globalData.deviceId,
			success:()=>{},
			fail:()=>{},
			complete:()=>{
        wx.closeBluetoothAdapter({
          success: ()=> {
          	
          	console.log('断开蓝牙成功')
          },
					complete:()=>{
      
						if (cb) {
							
							setTimeout(()=>{ cb() }, 1000)
						}
					}
        })
      },
    })
	},

  doReceive: function (res) {

    var self = this

    var buffer = res.value

    var arr = new Uint8Array(buffer)

    var dv = new DataView(buffer)

    if (self.globalData.receiveLength == 0) {

      self.globalData.receiveLength = dv.getUint16(2)

      self.globalData.receiveType = dv.getUint16(4)

      console.log('接收数据, 类型为' + self.globalData.receiveType)
    }

    var length = self.globalData.receivechars.length

    for (var i = 0; i < arr.length && i + length < self.globalData.receiveLength; ++i) {

      self.globalData.receivechars += String.fromCharCode(dv.getUint8(i))
    }

    if (self.globalData.receivechars.length == self.globalData.receiveLength) {

      self.onReceiveFinish()
    }
  },

  splictPackage: function (str, type) {

    var totallength = str.length + 8

    var buffer = new ArrayBuffer(totallength)

    var dv = new DataView(buffer)

    dv.setUint8(0, 0xFE)
    dv.setInt8(1, 1)
    dv.setUint16(2, totallength)
    dv.setUint16(4, type)
    dv.setUint16(6, 0)

    for (var i = 0; i < str.length; ++i) {

      dv.setUint8(i + 8, str.charCodeAt(i))
    }

    var packcount = Math.ceil(totallength / 20)

    var packs = []

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

  globalData: {
    ios:false,
		deviceId: '',
		connectedCount:0,
		openSuccess:false,
		servierId: '',
		writecharacteristicId: '',
		indicatecharacteristicId: '',
		payorderId: 'abcdekfislkjoweifjsd23r0s',
		token: null,
    userInfo: null,
    unlockresult: null,
    serverMd5str: null,
    receivechars: '',
    receiveLength: 0,
    receiveType: -1,
    connectCallback:null,
		unlockCallback:null
  }
})
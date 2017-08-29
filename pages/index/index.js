//index.js
//获取应用实例
var SparkMD5 = require('./SparkMD5.js')

var a = SparkMD5.hash('abcd')

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
		unlock: '开闸',
		deviceId: '',
		servierId: '',
		writecharacteristicId: '',
		indicatecharacteristicId: '',
		payorderId: 'abcdekfislkjoweifjsd23r0s',
		beginReceive: false,
		token: null,
		unlockresult: null,
		serverMd5str: null,
		receivechars: '',
		receiveLength: 0,
		receiveType:-1,
		userInfo: {}
	},
	
	setTip: function(str) {
		
		this.setData({
			'result': str
		})
	},
	
	promiseOfOpenDevice: function () {
		return new Promise((resolve, reject) => {
			wx.openBluetoothAdapter({
				success: function (res) { resolve(res) },
				fail: function (res) { reject(res) }
			})
		})
	},
	
	promiseOfConnect: function () {
		var self = this
		return new Promise((resolve, reject) => {
			wx.createBLEConnection({
				deviceId: self.data.deviceId,
				success: (res) => { resolve(res) },
				fail: (res) => { reject(res) }
			})
		})
	},
	
	promiseOfGetBLEDeviceServices: function () {
		
		var self = this
		return new Promise((resolve, reject) => {
			wx.getBLEDeviceServices({
				deviceId: self.data.deviceId,
				success: (res) => { resolve(res) },
				fail: (res) => { reject(res) }
			})
		})
	},
	
	promiseOfGetBLEDeviceCharacteristics: function (res) {
		var self = this
		self.data.serverId = res.services[0].uuid
		return new Promise((resolve, reject) => {
			wx.getBLEDeviceCharacteristics({
				deviceId: self.data.deviceId,
				serviceId: self.data.serverId,
				success: (res) => { resolve(res) },
				fail: (res) => { reject(res) }
			})
		})
	},
	
	promiseOfGetCharacters:function (res) {
		var self = this
		for (var i = 0; i < res.characteristics.length; ++i) {
			if (res.characteristics[i].properties.indicate) {
				self.data.indicatecharacteristicId = res.characteristics[i].uuid
				break
			}
		}
		
		for (var i = 0; i < res.characteristics.length; ++i) {
			if (res.characteristics[i].properties.write) {
				self.data.writecharacteristicId = res.characteristics[i].uuid
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
				deviceId: self.data.deviceId,
				serviceId: self.data.serverId,
				characteristicId: self.data.indicatecharacteristicId,
				success: (res) => { resolove(res) },
				fail: (res) => { reject(res) }
			})
		})
	},
	
	promiseOfBeginReadData: function () {
		var self = this
		return new Promise((resolve, reject) => {
			wx.readBLECharacteristicValue({
				deviceId: self.data.deviceId,
				serviceId: self.data.serverId,
				characteristicId: self.data.indicatecharacteristicId,
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
	
	doConnect: function () {
		
		this.setTip('连接中')
		
		wx.showModal({
			title: '连接中',
			content: '',
			showCancel:false
		})
		
		var self = this
		
		this.data.deviceId = 'F4:B8:5E:DD:8F:6E'
		
		self.promiseOfOpenDevice()
			.then((res) => {
				
				return self.promiseOfConnect()
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
			.then((res) => {
				
				return self.promiseOfBeginNotify()
			})
			.then(() => {
    
				wx.onBLECharacteristicValueChange((res) => {
					
					self.doReceive(res)
				})
			})
			.catch((res) => {
				
				// console.log('error6')
				console.log('error5' + JSON.stringify(res))
			})
	},
	
	logBuff: function(buff){
		
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
			return new Promise(function (resolve, reject) {
				wx.writeBLECharacteristicValue({
					deviceId: self.data.deviceId,
					serviceId: self.data.serverId,
					characteristicId: self.data.writecharacteristicId,
					value: pack,
					complete: (res) => { resolve(res) },
					fail: (res) => { reject(res) }
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
	
	unLock: function () {
		
		var self = this
		
		console.log('准备发送payorderid')
		self.promiseOfSendData(self.data.payorderId, 1)
			.then(() => {
				
				console.log('准备发送md5')
				return self.promiseOfSendData(self.data.serverMd5str, 2)
			})
			.then(() => {
				
				wx.onBLECharacteristicValueChange((res) => {
					
					self.doReceive(res)
				})
			})
	},
	
	onResetReceiveData: function() {
		
		var self = this
		
		self.data.receivechars = ''
		
		self.data.receiveLength = 0
		
		self.data.receiveType = -1
	},
	
	onReceiveFinish:function(){
		
		var self = this
		
		var str = self.data.receivechars.slice(8)
		
		console.log('数据接收完毕, 类型为' + self.data.receiveType)
		
		console.log('数据值为:' + str)
		
		if (self.data.receiveType == 0) {
			
			self.data.token = str
			
			self.data.serverMd5str = SparkMD5.hash(self.data.token + 'sodixvhn3grledjs90' + self.data.payorderId)
      
      self.onResetReceiveData()
			
			self.setTip('连接成功')
			
			console.log('token: ' + self.data.token)
      
      return
		}
		
		if (self.data.receiveType == 3) {
			
			self.data.unlockresult = str
			
			self.onResetReceiveData()
   
			if (self.data.unlockresult == '1') {
				
				self.setTip('开锁成功')
			}
			else {
				
				self.setTip('开锁失败')
			}
			
			console.log('unlockresult: ' + self.data.unlockresult)
			
			return
		}
	},
	
	doReceive: function (res) {
		
		var self = this
		
		var buffer = res.value
		
		var arr = new Uint8Array(buffer)
		
		var dv = new DataView(buffer)
		
		if (self.data.receiveLength == 0) {
			
			self.data.receiveLength = dv.getUint16(2)
			
			self.data.receiveType = dv.getUint16(4)
      
      console.log('接收数据, 类型为' + self.data.receiveType)
		}
		
		var length = self.data.receivechars.length
		
		for (var i = 0; i < arr.length && i + length < self.data.receiveLength; ++i) {
			
			self.data.receivechars += String.fromCharCode(dv.getUint8(i))
		}
		
		if (self.data.receivechars.length == self.data.receiveLength) {
			
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
	
	onLoad: function () {
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

//index.js
//获取应用实例
var app = getApp()
Page({
  data: {
    connect: {
      connectstatus:0
    },
  },
  //事件处理函数

  updateData:function(keyvalue) {

    this.setData(keyvalue)
  },

  onConnectFailed: function(){

    this.updateData({
      connect: {
        connectstatus: 1
      }
    })
  },

  onConnectSuccess: function () {
    wx.navigateTo({
      url: '../main/main'
    })
  },

  onLoad: function (options) {
  	
  	app.doConnect((result) => {
	
			if (result) {
				
				this.onConnectSuccess()
			}
			else {
				
				this.onConnectFailed()
			}
		})
  },
})

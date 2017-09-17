// main.js
var app = getApp()

var doorStatus = {
		payfailed: 0,
		unlockfailed: 1,
		unlocksuccess: 2,
		unlocking: 3,
		unpay: 4
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    ticket:{
      doorStatus:4,
      message: '全程统一票价', 
    },
    bottom: {
    	needReunlock:0,
      paysuccess:0,
			title:'立即支付'
    },
    card: {
      userHeadicon:'http://wx.indoorun.com/indoorun/indoorun/unlock/dist/static/avatar.png'
    }
  },

  onLoad: function (options) {
    var that = this
    //调用应用实例的方法获取全局数据
    app.getUserInfo(function (userInfo) {
      //更新数据
      that.setData({
        card: {
          userHeadicon: userInfo.avatarUrl
        } 
      })
    })
  },

  promisePayOrder:function(){

		return new Promise(function(resolve, reject) {
			
			setTimeout(function() {
				
				resolve(true)
				
			}, 1000)
		})
  },

  unlock: function () {
  
  	this.promisePayOrder()
			.then(()=>{
				
				this.setData({
					'bottom.paysuccess':1,
					'ticket.doorStatus': doorStatus.unlocking,
					'ticket.message' : '开闸中...!'
				})
				
				return Promise.resolve()
			})
			.catch(()=> {
				
				this.setData({
					'bottom.paysuccess':0,
					'ticket.doorStatus': doorStatus.payfailed,
					'ticket.message' : '支付失败，请重新支付!'
				})
				
				return Promise.reject()
			})
			.then(()=> {
				
				app.unLock((result) => {
					
					if (result) {
						
						this.setData({
							'ticket.doorStatus': doorStatus.unlocksuccess,
							'ticket.message' : '闸机开启成功，祝您乘车愉快!'
						})
					}
					else {
						
						this.setData({
							'ticket.doorStatus': doorStatus.unlockfailed,
							'ticket.message' : '闸机开启失败，请重试!',
							'bottom.title' : '重新开闸'
						})
					}
				})
			})
			.catch(()=>{
  	
			})
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
  
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  }
})
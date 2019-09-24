// pages/jsonTest/jsonTest.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    array: [{
      groupId: 1,
      identifyItemId: 12,
      categoryType: 0,
      imgUrl: "http://static.bddvip.com/image/u/150589340320190830/20190830172013_364.jpg"
    },
      {
        groupId: 1,
        identifyItemId: 13,
        categoryType: 30,
        imgUrl: "http://static.bddvip.com/image/u/150589340320190830/20190830172017_807.jpg"
      },
      {
        groupId: 2,
        identifyItemId: 12,
        categoryType: 31,
        imgUrl: "http://static.bddvip.com/image/u/150589340320190830/20190830172022_907.png"
      }],
      type:{
        categoryType:"wujin"
      }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.changeArraytoJson();
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

  },


  changeArraytoJson:function (){
    var _this = this
    var _array = _this.data.type;

    console.log(JSON.stringify(_array))
  }
})
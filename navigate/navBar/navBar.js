// components/navBar/navBar.js
var app = getApp();
Component({
  properties: {
    navbarData: {   //navbarData   由父页面传递的数据，变量名字自命名
      type: Object,
      value: {},
      observer: function (newVal, oldVal) { }
    }
  },
  data: {
    statusBarHeight: app.globalData.statusBarHeight,
  },
  attached: function () {
    console.log(this.data.navbarData)
  },
  methods: {
    // 返回上一页面
    backHome: function () {
      wx.switchTab({
        url: '/pages/hire/hire/hire',
      })
    },
    /**
  * 返回上一页面，可以自定义
  */
    backPrePage: function () {
      app.backPrePage();
    },
  }

}) 
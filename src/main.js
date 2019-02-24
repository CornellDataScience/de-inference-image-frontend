import Vue from 'vue'
import App from './App.vue'
import {WebCam} from 'vue-web-cam'

Vue.component(WebCam.name, WebCam)

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')

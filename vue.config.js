<<<<<<< HEAD
module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/vue-frontend/'
    : '/'
};
=======
const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true
})
>>>>>>> 23716fe (Initial commit for Vue frontend)

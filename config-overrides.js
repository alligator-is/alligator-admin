let path = require("path")
var webpack = require('webpack');
module.exports={
    webpack: function(config, env) {
     
        config.resolve.alias.path=require.resolve("path-browserify")
        config.node.net=config.resolve.alias.net=require.resolve('net-browserify/browser');
        config.node.net = false

        config.resolve.alias["icebreaker-network$"]=path.resolve(__dirname, 'node_modules/icebreaker-network/browser.js')
        config.resolve.alias[" chloride$"]=path.resolve(__dirname, 'node_modules/chloride/browser.js')

        
     
        // ...add your webpack config
        return config;
      }
  }
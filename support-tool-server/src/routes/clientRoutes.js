const express = require('express'),
fs = require('fs'),
request = require('request'),
compression = require('compression'),
MobileDetect = require('mobile-detect'),
_ = require('lodash'),
path = require('path'),
envHelper = require('../helpers/environmentVariablesHelper'),
oneDayMS = 86400000,
pathMap = {},
cdnIndexFileExist = ""

const setZipConfig = (req, res, type, encoding, dist = '../../../support-tool-react-client/build/') => {
    if (pathMap[req.path + type] && pathMap[req.path + type] === 'notExist') {
      return false;
    }
    if(pathMap[req.path + '.'+ type] === 'exist' ||
      fs.existsSync(path.join(__dirname, dist) + req.path + '.' + type)){
        if (req.path.endsWith('.css')) {
          res.set('Content-Type', 'text/css');
        } else if (req.path.endsWith('.js')) {
          res.set('Content-Type', 'text/javascript');
        }
        req.url = req.url + '.' + type;
        res.set('Content-Encoding', encoding);
        pathMap[req.path + type] = 'exist';
        return true
    } else {
      pathMap[req.path + type] = 'notExist';
      logger.info({msg:'zip file not exist' ,
      additionalInfo: {
        url: req.url,
        type: type
      }})
      return false;
    }
}

module.exports = (app, keycloak) => {
  console.log(" in here");
    app.set('view engine', 'ejs')

  app.get(['*.js', '*.css'], (req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=' + oneDayMS * 30)
    res.setHeader('Expires', new Date(Date.now() + oneDayMS * 30).toUTCString())
    if(req.get('Accept-Encoding') && req.get('Accept-Encoding').includes('br')){ // send br files
      if(!setZipConfig(req, res, 'br', 'br') && req.get('Accept-Encoding').includes('gzip')){
        setZipConfig(req, res, 'gz', 'gzip') // send gzip if br file not found
      }
    } else if(req.get('Accept-Encoding') && req.get('Accept-Encoding').includes('gzip')){
      setZipConfig(req, res, 'gz', 'gzip')
    }
    next();
  });

  app.get(['/dist/*.ttf', '/dist/*.woff2', '/dist/*.woff', '/dist/*.eot', '/dist/*.svg',
    '/*.ttf', '/*.woff2', '/*.woff', '/*.eot', '/*.svg', '/*.html'], compression(),
    (req, res, next) => {
      res.setHeader('Cache-Control', 'public, max-age=' + oneDayMS * 30)
      res.setHeader('Expires', new Date(Date.now() + oneDayMS * 30).toUTCString())
      next()
  })

  app.use(express.static(path.join(__dirname, '../../../support-tool-react-client/build/'), { extensions: ['ejs'], index: false }))

  app.use('/dist', express.static(path.join(__dirname, '../../../support-tool-react-client/build/'), { extensions: ['ejs'], index: false }))

  app.get('/assets/images/*', (req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=' + oneDayMS)
    res.setHeader('Expires', new Date(Date.now() + oneDayMS).toUTCString())
    next()
  })
  
  console.log("in the client routes keycloak");

  app.all(['/','/home'],keycloak.protect(),(req,res)=>{
    console.log("in here");
    let session = req.session;
      if(JSON.parse(session['keycloak-token'])['access_token']){
        res.cookie("auth",JSON.parse(session['keycloak-token'])['access_token']);
        res.cookie("uid",session.userId);
        res.render(path.join(__dirname, '../../../support-tool-react-client/build/', 'index.ejs'))
      }else{

      }
  });

}

const indexPage = (loggedInRoute) => {
    return async (req, res) => {
      //console.log(req.session);
      let session = req.session;
      //console.log(JSON.parse(session['keycloak-token'])['access_token']);
      if(JSON.parse(session['keycloak-token'])['access_token']){
        //console.log("In the valid check if");
        res.cookie("auth",JSON.parse(session['keycloak-token'])['access_token']);
        renderDefaultIndexPage(req, res);
      }else{

      }

      }
};
  
  const renderDefaultIndexPage = (req, res) => {
        res.render(path.join(__dirname, '../../../support-tool-react-client/build/', 'index.ejs'))
};
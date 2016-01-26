var Log = require('./log.js')
var Torrent = require('./torrent.js')
var Directory = require('./directory.js')

var fs = require('fs')
var auth = require('http-auth')
var express = require('express')
var compression = require('compression')
var http = require('http')
var bodyParser = require('body-parser')

http.globalAgent.maxSockets = Infinity

function Server () {
  this.config = require('./config.json')

  this.basic = auth.basic({
    realm: this.config.server.message,
    file: this.config.server.htpasswd
  })

  this.app = express()
  this.app.use(compression())
  this.app.use(express.static(__dirname + '/public'))
  this.app.use(bodyParser.json())
  this.app.use(bodyParser.urlencoded({ extended: true }))

  this.server = http.createServer(this.basic, this.app)
  this.server.listen(this.config.server.port, function () {
    Log.print('Server listening at port ' + instServer.config.server.port)
  })

  this.app.get('/files', function (req, res) {
    var filename = instServer.config.directory.path + req.query.f
    Log.print(req.user + ' download file: ' + req.query.f)
    fs.stat(filename, function (err, stats) {
      if (stats) {
        res.setHeader('Content-disposition', 'attachment; filename="' + req.query.f.split('\/').pop() + '"')
        res.setHeader('Content-Length', stats.size)
        res.setHeader('Content-type', 'application/octet-stream')
        var fReadStream = fs.createReadStream(filename)
        fReadStream.pipe(res)
      } else {
        res.end("Le fichier n'existe pas")
      }
    })
  })

  this.app.post('/download-t', function (req, res) {
    if (req.body.url) {
      Log.print(req.user + ' download torrent: ' + req.body.url)
      Torrent.start(req.body.url)
      res.end()
    } else {
      res.end()
    }
  })

  this.app.post('/list-t', function (req, res) {
    res.end(JSON.stringify(Torrent.info))
  })

  this.app.post('/list-d', function (req, res) {
    if (req.body.dir) {
      res.end(JSON.stringify(Directory.list(req.body.dir)))
    } else {
      res.end()
    }
  })

  this.app.post('/remove-t', function (req, res) {
    if (req.body.hash) {
      Log.print(req.user + ' remove torrent: ' + req.body.hash)
      Torrent.remove(req.body.hash)
      res.end(req.body.hash)
    } else {
      res.end()
    }
  })

  this.app.post('/remove-d', function (req, res) {
    if (req.body.file) {
      Log.print(req.user + ' remove file: ' + req.body.file)
      Directory.remove(req.body.file)
      res.end(req.body.file)
    } else {
      res.end()
    }
  })

  this.app.post('/rename-d', function (req, res) {
    if (req.body.path && req.body.oldname && req.body.newname) {
      Directory.rename(req.body.path, req.body.oldname, req.body.newname)
      res.end(JSON.stringify({path: req.body.path, oldname: req.body.oldname, newname: req.body.newname}))
    } else {
      res.end()
    }
  })

  this.app.post('/mkdir-d', function (req, res) {
    if (req.body.path && req.body.name) {
      Directory.mkdir(req.body.path, req.body.name)
      res.end(req.body.name)
    } else {
      res.end()
    }
  })

  this.app.post('/mv-d', function (req, res) {
    if (req.body.path && req.body.file && req.body.folder) {
      Directory.mv(req.body.path, req.body.file, req.body.folder)
      res.end(req.body.file)
    } else {
      res.end()
    }
  })

}

var instServer = new Server()
module.exports = instServer

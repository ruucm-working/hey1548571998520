'use strict';

var express = require('express'),
    path = require('path'),
    multer = require('multer'),
    bodyParser = require('body-parser'),
    app = express();

var cors = require('cors');
var fileUpload = require('express-fileupload');
var admZip = require('adm-zip');
var shell = require('shelljs');

var _require = require('../shared/consts'),
    gitOrigin = _require.gitOrigin;

app.use(cors());
app.use(fileUpload());

app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer({ dest: 'uploads' })); // dest is not necessary if you are happy with the default: /tmp
app.use(express.static(path.join(__dirname, 'bower_components')));

// routes
app.get('/', function (req, res) {
  res.send('<html><head><title>Dropzone example</title><link href="/dropzone/downloads/css/dropzone.css" rel="stylesheet"></head><body><h1>Using Dropzone</h1><form method="post" action="/upload" class="dropzone" id="dropzone-example"><div class="fallback"><input name="file" type="file" multiple /></div></form><p><a href="/old">Old form version</a></p><script src="/dropzone/downloads/dropzone.js"></script></body></html>');
});

app.get('/old', function (req, res) {
  res.send('<html><head><title>Dropzone example</title><link href="/dropzone/downloads/css/dropzone.css" rel="stylesheet"></head><body><h1>Old form</h1><form method="post" action="/" id="old-example" enctype="multipart/form-data"><input name="file" type="file" multiple /><button>Save</button></form><script src="/dropzone/downloads/dropzone.js"></script></body></html>');
});

app.post('/upload', function (req, res, next) {
  var file = req.files.file;
  console.log('file : ', file);
  var path = __dirname + '/uploads/' + file.name;

  file.mv(path, function (err) {
    if (err) {
      return res.status(500).send(err);
    }

    var zip = new admZip(path);
    // zip.extractAllTo(path.slice(0, -4), true)
    zip.extractAllTo('uploads/', true);

    var repoName = file.name.slice(0, -4) + Date.now();
    shell.exec('sh scripts/git-create ' + repoName);
    shell.exec('sh scripts/git-push ' + file.name.slice(0, -4) + ' ' + repoName);

    // shell.exec('sh scripts/netlify')

    res.json({
      file: 'uploads/' + file.name,
      gitRepo: 'https://github.com/' + gitOrigin + '/' + repoName
    });
  });
});

var server = app.listen(8000, function () {
  var host = server.address().address,
      port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});

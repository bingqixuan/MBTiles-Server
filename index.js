/**
 * Created by bingqixuan on 2018/8/22.
 */
var express = require('express');
var app = express();
var tilelive = require('tilelive');
require('mbtiles').registerProtocols(tilelive);
var fs = require('fs');
var path = require('path');

var dataDir = 'data';

const MBSources = {};

//设置跨域访问
app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

fileDisplay(dataDir);

function fileDisplay(filePath){
    fs.readdir(filePath, function (err, files) {
        if (err) {
            console.warn(err)
        } else {
            //遍历读取到的文件列表
            files.forEach(function (filename) {
                //获取当前文件的绝对路径
                var filedir = path.join(filePath, filename);
                //根据文件路径获取文件信息，返回一个fs.Stats对象
                fs.stat(filedir, function (eror, stats) {
                    if (eror) {
                        console.warn('获取文件stats失败');
                    } else {
                        var isFile = stats.isFile();//是文件
                        var isDir = stats.isDirectory();//是文件夹
                        if (isFile) {
                            // console.log(filedir);
                            addSource('mbtiles://' + filedir)
                        }
                        if (isDir) {
                            fileDisplay(filedir);//递归，如果是文件夹，就继续遍历该文件夹下面的文件
                        }
                    }
                })
            });
        }
    });
}


function addSource(path) {
    console.log(path);
    tilelive.load(path, function (err, source) {
        if (err) {
            throw err;
        }
        let name = path.split('.')[0].split('\\')[1];
        MBSources[name] = source;
    });
}


// http://localhost:3000/tiles/:name/{z}/{x}/{y}.pbf
app.get(/^\/tiles\/(\S+)\/(\d+)\/(\d+)\/(\d+).pbf$/, function(req, res) {
    let name = req.params[0];
    if(!MBSources[name]){
        console.log("没有该MBTiles!");
        res.status(404);
        res.send("没有该MBTiles!");
        return;
    }
    let source = MBSources[name];
    var z = req.params[1];
    var x = req.params[2];
    var y = req.params[3];
    console.log('get tile %d, %d, %d', z, x, y);

    source.getTile(z, x, y, function (err, tile, headers) {
        if (err) {
            res.status(404);
            res.send(err.message);
            console.log(err.message);
        } else {
            res.set(headers);
            res.send(tile);
        }
    });
});

const server = app.listen(3000, () => {
    let port = server.address().port;
    console.log(`server listen on http://localhost:${port}`)
});
const requireDir = require('require-dir')
const path = require('path')
const fs = require('fs')
const config = require('../config/zlcconfig')
const compiler = require('./compiler')
const portfinder = require('portfinder')
const connect = require('gulp-connect')
const watch = require("gulp-watch")
const proxy = require('http-proxy-middleware')

//-------将smt下的node_modules加到环境中--------------
var ms = require("module");
let f = ms._nodeModulePaths;
ms._nodeModulePaths = function () {
    let p = f.apply(ms, arguments);
    p.push(path.join(__dirname, "../node_modules"));
    p.push(path.join(__dirname, "../"));
    return p;
}

class Tools {
    constructor() {

    }
    copyBabel(cwd = process.cwd) {
        const dir = path.join(cwd, ".babelrc")
        if (!fs.existsSync(dir)) {
            const c = fs.readFileSync(path.join(__dirname, "../.babelrc"), "utf-8")
            fs.writeFileSync(dir, c)
        }
    }
    build(...args) {
        console.log('start build all:')
        // 调用 compiler 文件的每个 js， 构造编译文件对应的 compiler
        requireDir('./template')
        compiler.all(config, function () {
            console.log("end build!")
        })
    }

    // 监听文件变化
    watch() {
        requireDir("./template")
        for (let [k, v] of Object.entries(config.build)) {
            if (!(v instanceof Array)) {
                continue
            }
            for (let i = 0, len = v.length; i < len; i++) {
                const item = v[i]

                if (!item.src) {
                    continue
                }
                const src = item.watch ? item.watch : item.src
                watch(src, file => {
                    // 合并编译
                    if (item.dist.indexOf(".") != -1) {
                        console.log(`build: ${item.src}`)
                        compiler.build(k, item, {}, function () {
                            console.log(`end build: ${item.src}`)
                        })
                        return
                    }
                    // 单个文件编译
                    let src = typeof item.src == "string" ? item.src : item.src[0]
                    let i = src.indexOf("**")
                    if (i != -1) {
                        src = file.history[0].substr(i)
                    } else {
                        src = ""
                    }

                    let dist = src ? path.dirname(path.join(item.dist, src)) : item.dist
                    console.log(`build: ${file.history}`)
                    const b = JSON.parse(JSON.stringify(item))
                    b.src = file.history
                    b.dist = dist
                    compiler.build(k, b, {}, function () {
                        console.log(`end build: ${file.history[0]}`)
                    })
                })
            }
        }
    }

    // 启动服务监听
    connect() {
        const root = config.dist()
        portfinder.basePort = config.server.port
        portfinder.getPortPromise().then(port => {
            portfinder.basePort = 35729
            portfinder.getPortPromise().then(liveport => {
                connect.server({
                    root: root,
                    port: port,
                    livereload: {
                        port: liveport
                    },
                    middleware: function (connect, opt) {
                        const p = function () {
                            // 服务转发，可以配置多个
                            var a = []
                            if (config.server.proxy) {
                                for (let [k, v] of Object.entries(config.server.proxy)) {
                                    a.push(proxy(k, v))
                                }
                            }
                            return a
                        }
                        return p()
                    }
                })
                watch(config.dist('**/*.*'), file => {
                    console.log(`changed:  ${file.history}`)
                }).pipe(connect.reload())
            })

        }).catch(err => {
            console.log(`get port err: ${err}`)
        })
    }

}

module.exports = new Tools()
#!/usr/bin/env node

const zlc = require('./utils/zlc')
const tools = require('./utils/tools')
const fs = require('fs')
const path = require('path')


// 注册编译命令
zlc.task('build', (...args) => {
    tools.copyBabel(zlc.cwd)
    tools.build.apply(tools, args)
})
zlc.task("default", function () {
    // tools.copyBabel(zlc.cwd)
    tools.connect()
    tools.watch()
})
// 生成配置
zlc.task("config", function () {
    const data = fs.readFileSync(path.join(__dirname, 'config', 'zlcfile.js'), 'utf-8')
    fs.writeFileSync(path.join(zlc.cwd, 'zlcfile.js'), data)
})
// 生成配置
zlc.task("-v", function () {
    let data = fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8')
    try {
        data = JSON.parse(data)
    } catch (e) {
        console.log(`err:${e}`)
    }
    console.log(`v${data.version}`)
})
zlc.run()
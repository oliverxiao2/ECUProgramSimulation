var grunt = require('grunt');

grunt.config.init({
    pkg: grunt.file.readJSON('pakage.json'),
    'create-windows-installer': {
        ia32: {
            version: '0.2.0',
            authors: 'Akai',
            owners: 'Akai, UAES',
            appDirectory: './',
            iconUrl: './style/app_icon/app.ico',
            outputDirectory: './dist',
            exe: 'CCF.exe'
        }
    }
})

grunt.loadNpmTasks('grunt-electron-installer')

grunt.registerTask('default', ['create-windows-installer'])
module.exports = function(grunt) {

require("load-grunt-tasks")(grunt);
grunt.initConfig({
    babel: {
        options: {

            presets: ['es2015']
        },
        es6: {
            files: {
                'public/javascripts/pokemap.js': 'views/pokemap.js'
            }
        }
    }
});
grunt.loadNpmTasks('grunt-babel');
grunt.registerTask('default', ['babel']);
}

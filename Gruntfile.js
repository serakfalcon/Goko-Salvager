module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jst: {
      compile: {
        options: {
          processName: function (filepath) {
            return filepath.slice('src/templates/'.length, -'.html'.length);
          }
        },
        files: {
          'src/ext/templates.js': 'src/templates/**/*.html'
        }
      }
    }

  });

  grunt.loadNpmTasks('grunt-contrib-jst');
};

var gulp = require('gulp');
var uglify = require('gulp-uglify')
var sourcemaps = require('gulp-sourcemaps');
var concat = require('gulp-concat');

var config = require('../config');

gulp.task('minify', ['browserify'], function() {
  return gulp.src(config.browserify.dest + '/' + config.browserify.outputName)
    .pipe(sourcemaps.init())
      .pipe(concat(config.minified.name))
      .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(config.dest))
});

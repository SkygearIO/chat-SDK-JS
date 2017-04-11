var gutil = require('gulp-util');

module.exports = {
  src: './lib/**/*.js',
  dest: './dist',
  testSrc: './test/**/*.js',
  browserify: {
    settings: {
      transform: ['babelify']
    },
    standalone: 'skygearChat',
    src: './lib/index.js',
    dest: './dist',
    outputName: 'bundle.js',
    debug: gutil.env.type === 'dev'
  },
  minified: {
    name: 'skygear-chat.min.js'
  },
  cdn: {
    region: 'us-east-1',
    bucket: 'code.skygear.io',
    path: 'js',
    distribution: 'E1PUX937CX882Y'
 }
};


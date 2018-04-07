const path = require('path');
const gulp = require('gulp');
const del = require('del');
const through = require('through2');
const i18n = require('gulp-html-i18n');
const connect = require('gulp-connect');
const sass = require('gulp-sass');
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const handlebarsCompiler = require('gulp-compile-handlebars');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const preprocess = require('gulp-preprocess');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const awspublish = require('gulp-awspublish');
const remoteSrc = require('gulp-remote-src');
const babel = require('gulp-babel');

gulp.task("clean", function (cb) {
  del(["./dist"], cb);
});

gulp.task('build:handlebars', function () {
  let templateData = {
    firstName: 'Kaanon'
  },
    options = {
      ignorePartials: false, //ignores the unknown footer2 partial in the handlebars template, defaults to false
      batch: ['./src/partials', './routes'],
      helpers: {
        capitals: function (str) {
          return str.toUpperCase();
        }
      }
    }

  return gulp.src('src/index.hbs')
    .pipe(handlebarsCompiler(templateData, options))
    .pipe(rename('index.html'))
    .pipe(gulp.dest('dist/'));
});

gulp.task('build:html', [
  'build:handlebars'
]);

gulp.task("build:css:camera", function () {
  return gulp.src("./public/css/camera.css").pipe(gulp.dest("./dist/css"));
});
gulp.task("build:css:grid", function () {
  return gulp.src("./public/css/grid.css").pipe(gulp.dest("./dist/css"));
});
gulp.task("build:css:icons", function () {
  return gulp.src("./public/css/icons.css").pipe(gulp.dest("./dist/css"));
});
gulp.task("build:css:styles", function () {
  return gulp.src("./public/css/styles.css").pipe(gulp.dest("./dist/css"));
});

gulp.task('build:css', [
  'build:css:camera',
  'build:css:styles',
  'build:css:grid',
  'build:css:icons'
]);

gulp.task('build:assets:images', function () {
  return gulp.src(['./public/img/**']).pipe(gulp.dest('./dist/img'));
});

gulp.task('build:assets', ['build:assets:images']);

// Generic function to process all JS
function processJs(fileName) {
  let b = browserify({
    entries: './src/js/' + fileName,
    debug: true
  });
  let resultFileName = arguments[1] || fileName;

  return b
    .bundle()
    .pipe(source(fileName))
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
    .pipe(
    babel({
      presets: ['es2015']
    })
    )
    .pipe(uglify())
    .pipe(
    through.obj(function (chunk, encoding, done) {
      chunk.path = chunk.path.replace(fileName, resultFileName);
      let contents =
        '(function () { const define = undefined; ' +
        chunk.contents.toString('utf8') +
        ' })();';
      chunk.contents = new Buffer(contents);
      done(null, chunk);
    })
    )
    .pipe(
    sourcemaps.write('.', {
      includeContent: false,
      sourceRoot: 'http://localhost:8000/',
      mapSources: function (sourcePath) {
        return sourcePath;
      }
    })
    )
    .pipe(gulp.dest('./dist'));
}

// gulp.task('build:js:app', function () {
//   return processJs('app.js').pipe(connect.reload());
// });

gulp.task('build:js:app', function () {
  return processJs('app.js').pipe(connect.reload());
});

gulp.task('build:js', [
  'build:js:app'
]);

gulp.task("build", ["build:js", "build:html", "build:css"]);


gulp.task("connect", ["build"], function () {
  connect.server({
    root: "",
    livereload: true,
    port: 8000
  });
});

gulp.task("watch", function () {
  gulp.watch(["./src/*.js"], ["build:js"]);
  gulp.watch(['./src/*.hbs', './src/partials/*.hbs'], ["build:html"]);
  gulp.watch(["./public/css/*.css"], ["build:css"]);
  gulp.watch(['./public/img/*'], ['build:assets']);
});

gulp.task("default", ["connect", "watch"]);

const gulp = require('gulp');
const browserify = require('browserify');
const watchify = require('watchify');
const source = require('vinyl-source-stream')
const gutil = require('gulp-util');

const bundle = (b) => () => (
  b.bundle()
    .pipe(source('perseus-1.js'))
    .pipe(gulp.dest('./build/'))
);

let b = {};
b.build = browserify({
  entries: './src/perseus.js',
  plugin: ['bundle-collapser/plugin'],
  standalone: 'Perseus',
  transform: ['babelify'],
}).transform('envify', {global: true, _: 'purge', NODE_ENV: 'production'});

b.watch = watchify(browserify({
  entries: './src/perseus.js',
  standalone: 'Perseus',
  transform: ['babelify'],
}));

b.watch.on('update', bundle(b.watch));
b.watch.on('log', gutil.log);

gulp.task('build:javascript', bundle(b.build));
gulp.task('watch:javascript', bundle(b.watch));

gulp.task('build', [
  'build:javascript',
]);

gulp.task('watch', ['watch:javascript']);

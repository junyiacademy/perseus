const gulp = require('gulp');
const browserify = require('browserify');
const watchify = require('watchify');
const babelify = require('babelify');
const envify = require('envify/custom');
const source = require('vinyl-source-stream')
const gutil = require('gulp-util');
const bundleCollapser = require('bundle-collapser/plugin');

const bundle = (b) => () => (
  b.bundle()
    .pipe(source('perseus-1.js'))
    .pipe(gulp.dest('./build/'))
);

let b = {};
b.build = browserify({
  entries: `${__dirname}/src/perseus.js`,
  plugin: [bundleCollapser],
  standalone: 'Perseus',
  transform: [babelify],
}).transform(envify({_: 'purge', NODE_ENV: 'production'}), {global: true});

b.watch = watchify(browserify({
  entries: `${__dirname}/src/perseus.js`,
  standalone: 'Perseus',
  transform: [babelify],
}));

b.watch.on('update', bundle(b.watch));
b.watch.on('log', gutil.log);

gulp.task('build:javascript', bundle(b.build));
gulp.task('watch:javascript', bundle(b.watch));

gulp.task('build', [
  'build:javascript',
]);

gulp.task('watch', ['watch:javascript']);

'use strict';

/*global: require*/

var watchify = require('watchify');
var browserify = require('browserify');
var gulp = require('gulp');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var gutil = require('gulp-util');
var uglify = require('gulp-uglify');
var sourcemaps = require('gulp-sourcemaps');
var assign = require('lodash.assign');
var less = require('gulp-less');
var minifycss = require('gulp-minify-css');
var rename = require('gulp-rename');
var del = require('del');
var hbsfy = require('hbsfy');

var customOpts = {
    entries: './cli/js/app/main.js',
    debug: true,
    transform: ["browserify-shim", "hbsfy"]
};

var b = browserify(customOpts);


gulp.task('styles', function () {
    return gulp.src('cli/less/styles.less')
        .pipe(less())
        .pipe(minifycss({keepSpecialComments: true}))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('./dist/css'));
});

var KEEP_GOING = false;
function logError(err) {
    /*jshint validthis: true */
    gutil.log("Browserify Error: ", err);
    if (KEEP_GOING) {
        this.emit('end');
    }
}

function bundle() {
    return b.bundle()
        .on('error', logError)
        .pipe(source('app.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        // Add transformation tasks to the pipeline here.

        //.pipe(uglify({mangle: false})) // disabled for ease of debugging. reenable for faster code.

        .pipe(sourcemaps.write('./', {includeContent: true}))
        .pipe(gulp.dest('./dist/js/'));
}

gulp.task('js', bundle);

gulp.task('html', function () {
    return gulp.src(['cli/index.html', 'cli/favicon.ico'])
        .pipe(gulp.dest("./dist/"));
});

gulp.task('watch', function () {
    KEEP_GOING = true;
    gulp.watch('cli/js/**/*.hbs', ['js']);
    gulp.watch('cli/js/**/*.js', ['js']);
    gulp.watch('cli/less/**/*.less', ['styles']);
    gulp.watch('cli/*.html', ['html']);
    gulp.watch('cli/images/**', ['images']);
});

gulp.task('fonts', function () {
    return gulp.src('node_modules/bootstrap/dist/fonts/*')
        .pipe(gulp.dest("./dist/fonts/"));
});

gulp.task('images', function () {
    return gulp.src('cli/images/**', {base: "cli/images/"})
        .pipe(gulp.dest("./dist/images/"));
});

gulp.task('clean', function () {
    return del(["./dist/*"]);
});

gulp.task('build', ['js', 'styles', 'html', 'images', 'fonts']);
gulp.task('default', ['build']);

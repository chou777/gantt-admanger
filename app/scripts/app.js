'use strict';

/**
 * @ngdoc overview
 * @name bhAdManager
 * @description
 * # bhAdManager
 *
 * Main module of the application.
 */
angular.module('bhAdManager', [
    'gantt', // angular-gantt.
    'gantt.movable',
    'gantt.drawtask',
    'gantt.tooltips',
    'gantt.bounds',
    'gantt.progress',
    'gantt.table',
    'gantt.tree',
    'gantt.groups',
    'gantt.overlap',
    'gantt.resizeSensor',
    'ngSanitize',
    'mgcrea.ngStrap',
]).config(['$compileProvider', '$modalProvider', function($compileProvider, $modalProvider) {
    $compileProvider.debugInfoEnabled(true); // Remove debug info (angularJS >= 1.3)

    angular.extend($modalProvider.defaults, {
        html: true
    });
}]);

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
    'gantt.tooltips',
    'gantt.bounds',
    'gantt.table',
    'gantt.tree',
    'gantt.groups',
    'gantt.resizeSensor',
    'ngSanitize',
    'mgcrea.ngStrap',
    'colorpicker.module',
]).config(['$compileProvider', '$modalProvider', '$alertProvider', function($compileProvider, $modalProvider, $alertProvider) {
    $compileProvider.debugInfoEnabled(true); // Remove debug info (angularJS >= 1.3)

    angular.extend($modalProvider.defaults, {
        html: true,
        container: '#main-ctrl'
    });

    angular.extend($alertProvider.defaults, {
        container: '#alerts-container',
        duration: 3,
    });

}]);

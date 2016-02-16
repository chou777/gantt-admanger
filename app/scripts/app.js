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
    'gantt.contextmenus',
    'ngSanitize',
    'mgcrea.ngStrap',
    'colorpicker.module',
    'admanager.templates',
    'ngAnimate'
]).config(['$compileProvider', '$modalProvider', '$alertProvider', '$asideProvider', function($compileProvider, $modalProvider, $alertProvider, $asideProvider) {
    $compileProvider.debugInfoEnabled(true); // Remove debug info (angularJS >= 1.3)

    angular.extend($modalProvider.defaults, {
        html: true,
        container: '#main-ctrl'
    });

    angular.extend($alertProvider.defaults, {
        container: '#alerts-container',
        duration: 3,
    });

  angular.extend($asideProvider.defaults, {
    animation: 'am-slide-left',
    placement: 'left'
  })
}]);



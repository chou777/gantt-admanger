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

'use strict';

/**
 * @ngdoc function
 * @name bhAdManager.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the bhAdManager
 */
const environment = "TEST";

angular.module('bhAdManager')
    .controller('MainCtrl', ['$scope', '$timeout', '$log', 'ganttUtils', 'GanttObjectModel', 'Sample', 'ganttMouseOffset', 'ganttDebounce', 'moment', '$modal', '$popover', '$http', '$sce', function($scope, $timeout, $log, utils, ObjectModel, Sample, mouseOffset, debounce, moment, $modal, $popover, $http, $sce) {
        var objectModel;
        var dataToRemove;

        var _jumpTrigger = false;

        $scope.alert = {
          "title": "Holy guacamole!",
          "content": "Best check yo self, you're not looking too good.",
          "type": "info"
        };

        $scope.options = {
            setSideWidth: 250,
            mode: 'custom',
            scale: 'day',
            sortMode: undefined,
            isLoading: false,
            sideMode: 'Tree',
            daily: true,
            maxHeight: false,
            width: true,
            zoom: 1,
            columns: ['model.name'],
            treeTableColumns: [],
            tooltipsContent: '<div class="tooltip-content"><div ng-repeat="tContent in task.model.tooltipsContent track by $index">{{ tContent }}</div></div class="tooltip-content">',
            columnsHeaders: {'model.name' : 'Name'},
            columnsClasses: {'model.name' : 'gantt-column-name', 'from': 'gantt-column-from', 'to': 'gantt-column-to'},
            columnsFormatters: {
                'from': function(from) {
                    return from !== undefined ? from.format('lll') : undefined;
                },
                'to': function(to) {
                    return to !== undefined ? to.format('lll') : undefined;
                }
            },
            treeHeaderContent: '<i class="fa fa-align-justify"></i> {{getHeader()}}',
            columnsHeaderContents: {
                'model.name': '<i class="fa fa-align-justify"></i> {{getHeader()}}',
                'from': '<i class="fa fa-calendar"></i> {{getHeader()}}',
                'to': '<i class="fa fa-calendar"></i> {{getHeader()}}'
            },
            autoExpand: 'left',
            taskOutOfRange: 'truncate',
            fromDate: undefined,
            toDate: undefined,
            rowContent: '<i class="fa fa-align-justify"></i> {{row.model.name}}',
            taskContent : '<i class="fa fa-tasks"></i> {{task.model.name}}',
            allowSideResizing: true,
            labelsEnabled: true,
            currentDate: 'none',
            currentDateValue: new Date(),
            draw: false,
            readOnly: true,
            groupDisplayMode: 'Disabled',
            filterTask: '',
            filterRow: '',
            // timeFrames: {
            //     'day': {
            //         start: moment('8:00', 'HH:mm'),
            //         end: moment('20:00', 'HH:mm'),
            //         working: true,
            //         default: true
            //     },
            //     'noon': {
            //         start: moment('12:00', 'HH:mm'),
            //         end: moment('13:30', 'HH:mm'),
            //         working: false,
            //         default: true
            //     },
            //     'weekend': {
            //         working: false
            //     },
            //     'holiday': {
            //         working: false,
            //         color: 'red',
            //         classes: ['gantt-timeframe-holiday']
            //     }
            // },
            // dateFrames: {
            //     'weekend': {
            //         evaluator: function(date) {
            //             return date.isoWeekday() === 6 || date.isoWeekday() === 7;
            //         },
            //         targets: ['weekend']
            //     },
            //     '11-november': {
            //         evaluator: function(date) {
            //             return date.month() === 10 && date.date() === 11;
            //         },
            //         targets: ['holiday']
            //     }
            // },
            // timeFramesNonWorkingMode: 'hidden',
            columnMagnet: '1 day',
            // timeFramesMagnet: true,
            canDraw: function(event) {
                var isLeftMouseButton = event.button === 0 || event.button === 1;
                return $scope.options.draw && !$scope.options.readOnly && isLeftMouseButton;
            },
            drawTaskFactory: function() {
                return {
                    id: utils.randomUuid(),  // Unique id of the task.
                    name: 'Drawn task', // Name shown on top of each task.
                    color: '#AA8833' // Color of the task in HEX format (Optional).
                };
            },
            api: function(api) {
                // API Object is used to control methods and events from angular-gantt.
                $scope.api = api;

                api.data.on.load($scope, addEventName('core.on.load', function(){
                    console.log('data on load');
                    $scope.api.side.setWidth($scope.options.setSideWidth);
                    $timeout(function() {
                        api.scroll.toDate(new Date());
                    },500);
                    $timeout(function() {
                        $scope.options.isLoading = false;
                    },3000);
                }));

                api.core.on.ready($scope, function() {
                    $scope.load();

                    api.directives.on.new($scope, function(directiveName, directiveScope, element) {
                        switch(directiveName) {
                            case 'ganttTask':
                                element.on('click', function(event) {
                                    $log.info('Task Click', event.which);
                                    // return false;

                                });
                                element.on('contextmenu', function(event) {
                                    event.stopPropagation();
                                    event.preventDefault();
                                    $log.info('Task Right Click');
                                    $scope.$digest();
                                });
                            break;
                            case 'ganttRow':
                                element.bind('click', function(event) {
                                    // event.stopPropagation();
                                    $log.info('Row Click');
                                });
                                element.bind('mousedown touchstart', function(event) {
                                    $scope.$digest();
                                });
                                element.on('contextmenu', function(event) {
                                    $scope.$digest();
                                });
                            break;
                            case 'ganttRowLabel':

                            break;
                        };
                    });

                    objectModel = new ObjectModel(api);
                });
            }
        };


        $scope.expandAll = function() {
            $scope.api.tree.expandAll();
        };

        $scope.collapseAll = function() {
            $scope.api.tree.collapseAll();
        };

        $scope.canAutoWidth = function(scale) {
            return true;
        };

        $scope.getColumnWidth = function(widthEnabled, scale, zoom) {
            if (!widthEnabled && $scope.canAutoWidth(scale)) {
                return undefined;
            }

            if (scale.match(/.*?week.*?/)) {
                return 150 * zoom;
            }

            if (scale.match(/.*?month.*?/)) {
                return 300 * zoom;
            }

            if (scale.match(/.*?quarter.*?/)) {
                return 500 * zoom;
            }

            if (scale.match(/.*?year.*?/)) {
                return 800 * zoom;
            }

            return 40 * zoom;
        };

        // Reload data action
        $scope.data = [];
        $scope.load = function() {
            $log.info('Start load');
            $scope.options.isLoading = true;
            if (environment === 'TEST') {
                Sample.getSampleData().success(function(response) {
                    $scope.data = response.data;
                });
            } else {
                $http({
                  method: 'GET',
                  url: '/gantt/ajax'
                }).then(function successCallback(response) {
                    $scope.data = response.data;
                }, function errorCallback(response) {

                // called asynchronously if an error occurs
                // or server returns response with an error status.
                });
            }
            dataToRemove = undefined;
        };

        $scope.reload = function() {
            $log.info('reload')
            $scope.data = undefined;
            $scope.load();
        };
        $scope.resetDate = function() {
            $scope.options.fromDate = undefined;
            $scope.options.toDate = undefined;

        }
        // Event handler
        var logLabelsEvent = function(eventName, width) {
            $log.info('[Event] ' + eventName + ': ' + width);
        };
        // Event utility function
        var addEventName = function(eventName, func) {
            return function(data) {
                return func(eventName, data);
            };
        };

    }]);

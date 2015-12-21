'use strict';

/**
 * @ngdoc function
 * @name bhAdManager.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the bhAdManager
 */

angular.module('bhAdManager')
    .controller('MainCtrl', ['$scope', '$timeout', '$log', 'ganttUtils', 'GanttObjectModel', 'Sample', 'ganttMouseOffset', 'ganttDebounce', 'moment', '$modal', '$popover', function($scope, $timeout, $log, utils, ObjectModel, Sample, mouseOffset, debounce, moment, $modal, $popover) {
        var objectModel;
        var dataToRemove;


        $scope.options = {
            mode: 'custom',
            scale: 'day',
            sortMode: undefined,
            sideMode: 'TreeTable',
            daily: true,
            maxHeight: false,
            width: false,
            zoom: 1,
            columns: ['model.name'],
            treeTableColumns: [],
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
            autoExpand: 'none',
            taskOutOfRange: 'truncate',
            fromDate: moment(null),
            toDate: undefined,
            rowContent: '<i class="fa fa-align-justify"></i> {{row.model.name}}',
            taskContent : '<i class="fa fa-tasks"></i> {{task.model.name}}',
            allowSideResizing: true,
            labelsEnabled: true,
            currentDate: 'none',
            currentDateValue: new Date(),
            draw: false,
            readOnly: false,
            groupDisplayMode: 'Disabled',
            filterTask: '',
            filterRow: '',
            timeFrames: {
                'day': {
                    start: moment('8:00', 'HH:mm'),
                    end: moment('20:00', 'HH:mm'),
                    working: true,
                    default: true
                },
                'noon': {
                    start: moment('12:00', 'HH:mm'),
                    end: moment('13:30', 'HH:mm'),
                    working: false,
                    default: true
                },
                'weekend': {
                    working: false
                },
                'holiday': {
                    working: false,
                    color: 'red',
                    classes: ['gantt-timeframe-holiday']
                }
            },
            dateFrames: {
                'weekend': {
                    evaluator: function(date) {
                        return date.isoWeekday() === 6 || date.isoWeekday() === 7;
                    },
                    targets: ['weekend']
                },
                '11-november': {
                    evaluator: function(date) {
                        return date.month() === 10 && date.date() === 11;
                    },
                    targets: ['holiday']
                }
            },
            timeFramesNonWorkingMode: 'hidden',
            columnMagnet: '1 day',
            timeFramesMagnet: true,
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

                api.core.on.ready($scope, function() {

                    // When gantt is ready, load data.
                    // `data` attribute could have been used too.
                    $scope.load();

                    // Add some DOM events
                    api.directives.on.new($scope, function(directiveName, directiveScope, element) {
                        switch(directiveName) {
                            case 'ganttTask':
                                element.on('click', function(event) {
                                    $log.info('Task Click', event.which);

                                    return false;
                                });
                                element.on('contextmenu', function(event) {
                                    event.stopPropagation();
                                    event.preventDefault();

                                    $scope.togglePopover(element);

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
                                    // event.stopPropagation();
                                    // 更新live data
                                    $scope.live.row = directiveScope.row.model;
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
                    api.tasks.on.rowChange($scope, function(task) {
                        $log.info('On Row Change');
                        $scope.live.row = task.row.model;
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

        $scope.$watch('options.sideMode', function(newValue, oldValue) {
            if (newValue !== oldValue) {
                $scope.api.side.setWidth(undefined);
                $timeout(function() {
                    $scope.api.columns.refresh();
                });
            }
        });

        $scope.canAutoWidth = function(scale) {
            if (scale.match(/.*?hour.*?/) || scale.match(/.*?minute.*?/)) {
                return false;
            }
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
        $scope.load = function() {
            $scope.data = Sample.getSampleData();
            dataToRemove = undefined;

            // $scope.timespans = Sample.getSampleTimespans();
        };

        $scope.reload = function() {
            $log.info('reload')
            $scope.load();
        };

        // Remove data action
        $scope.remove = function() {
            $scope.api.data.remove(dataToRemove);
        };

        // Clear data action
        $scope.clear = function() {
            $scope.data = [];
        };

        $scope.addAdContent = function() {
            $log.info('Add Ad Content');
        }

        // Visual two way binding.
        $scope.live = {};

        var debounceValue = 1000;

        var listenTaskJson = debounce(function(taskJson) {
            if (taskJson !== undefined) {
                var task = angular.fromJson(taskJson);
                objectModel.cleanTask(task);
                var model = $scope.live.task;
                angular.extend(model, task);
            }
        }, debounceValue);
        $scope.$watch('live.taskJson', listenTaskJson);

        var listenRowJson = debounce(function(rowJson) {
            if (rowJson !== undefined) {
                var row = angular.fromJson(rowJson);
                objectModel.cleanRow(row);
                var tasks = row.tasks;

                delete row.tasks;
                var rowModel = $scope.live.row;

                angular.extend(rowModel, row);

                var newTasks = {};
                var i, l;

                if (tasks !== undefined) {
                    for (i = 0, l = tasks.length; i < l; i++) {
                        objectModel.cleanTask(tasks[i]);
                    }

                    for (i = 0, l = tasks.length; i < l; i++) {
                        newTasks[tasks[i].id] = tasks[i];
                    }

                    if (rowModel.tasks === undefined) {
                        rowModel.tasks = [];
                    }
                    for (i = rowModel.tasks.length - 1; i >= 0; i--) {
                        var existingTask = rowModel.tasks[i];
                        var newTask = newTasks[existingTask.id];
                        if (newTask === undefined) {
                            rowModel.tasks.splice(i, 1);
                        } else {
                            objectModel.cleanTask(newTask);
                            angular.extend(existingTask, newTask);
                            delete newTasks[existingTask.id];
                        }
                    }
                } else {
                    delete rowModel.tasks;
                }

                angular.forEach(newTasks, function(newTask) {
                    rowModel.tasks.push(newTask);
                });
            }
        }, debounceValue);

        $scope.$watch('live.rowJson', listenRowJson);

        $scope.$watchCollection('live.task', function(task) {
            $scope.live.taskJson = angular.toJson(task, true);
            $scope.live.rowJson = angular.toJson($scope.live.row, true);
        });

        $scope.$watchCollection('live.row', function(row) {
            $scope.live.rowJson = angular.toJson(row, true);
            if (row !== undefined && row.tasks !== undefined && row.tasks.indexOf($scope.live.task) < 0) {
                $scope.live.task = row.tasks[0];
            }
        });

        $scope.$watchCollection('live.row.tasks', function() {
            $scope.live.rowJson = angular.toJson($scope.live.row, true);
        });



        var adForm = $modal({scope: $scope, template: '/templates/adForm.tpl.html', show: false});

        // 自訂事件開始
        $scope.showModal = function() {
            adForm.$promise.then(adForm.show);
        };

        var myPopover;

        $scope.togglePopover = function(element) {
            if (myPopover !== undefined) {
                myPopover.hide();
                myPopover = undefined;
            }
            myPopover = $popover(element, {title: 'My Title', content: 'My Content', autoClose: true, trigger: 'manual'});
            myPopover.$promise.then(function() {
                $timeout(function() {
                    myPopover.show();
                    $scope.$digest();
                });
            });
        }


    }]);

'use strict';

/**
 * @ngdoc function
 * @name bhAdManager.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the bhAdManager
 */

angular.module('bhAdManager')
    .controller('OneGantt', ['$scope', '$timeout', '$log', 'ganttUtils', 'GanttObjectModel', 'Sample', 'ganttMouseOffset', 'ganttDebounce', 'moment', '$modal', '$popover', '$http', '$sce', '$alert', '$rootScope',
        function($scope, $timeout, $log, utils, ObjectModel, Sample, mouseOffset, debounce, moment, $modal, $popover, $http, $sce, $alert, $rootScope) {

        var objectModel;

        $scope.options = {
            setSideWidth: 250,
            mode: 'custom',
            scale: 'day',
            sortMode: undefined,
            isLoading: true,
            sideMode: 'none',
            daily: true,
            maxHeight: false,
            width: true,
            zoom: 1,
            columns: ['model.name'],
            treeTableColumns: [],
            tooltipsContent: '<table class="tooltip-content table table-hover"><tbody><tr ng-repeat="tContent in task.model.tooltipsContent track by $index"><td>{{ tContent.label }}</td><td>{{ tContent.data }}</td></tr></tbody></table>',
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
            treeHeaderContent: '<i class="fa fa-align-justify"></i> 委刊項',
            columnsHeaderContents: {
                'model.name': '<i class="fa fa-align-justify"></i> {{getHeader()}}',
                'from': '<i class="fa fa-calendar"></i> {{getHeader()}}',
                'to': '<i class="fa fa-calendar"></i> {{getHeader()}}'
            },
            autoExpand: 'none',
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
            // filterRow: { isVisible: true },
            columnMagnet: '1 day',
            api: function(api) {
                // API Object is used to control methods and events from angular-gantt.
                $scope.api = api;

                api.data.on.change($scope,function(newData, oldData){
                    $log.info('data on change')
                    var dateRange = angular.copy($scope.adUnitOne.dateRange);
                    $timeout(function() {
                        api.scroll.to(api.core.getPositionByDate(dateRange[0]));
                    }, 1000);

                    $timeout(function() {
                        $scope.options.isLoading = false;
                    }, 2000);

                });

                api.scroll.on.scroll($scope,function(left, date, direction){
                    refreshIsVisableData();
                });

                api.core.on.ready($scope, function() {
                    $scope.load();
                    api.directives.on.new($scope, function(directiveName, directiveScope, element) {
                        switch(directiveName) {
                            case 'ganttTask':
                                element.on('click', function(event) {
                                });
                                element.bind('mouseenter', function(event) {
                                    element.addClass('task-highlight');
                                });
                                element.bind('mouseleave', function(event) {
                                    element.removeClass('task-highlight');
                                });
                                element.on('contextmenu', function(event) {
                                    event.stopPropagation();
                                    event.preventDefault();
                                    $scope.$digest();
                                });
                            break;
                            case 'ganttRow':
                            break;
                            case 'ganttRowLabel':
                            break;
                        };
                    });

                    objectModel = new ObjectModel(api);
                });
            }
        };


        $scope.$watchGroup(['options.fromDate', 'options.toDate'], function(){
            if (!($scope.options.fromDate === undefined && $scope.options.toDate === undefined)) {
                refreshIsVisableData();
            }
        });

        var checkRowIsVisible = function(from, to, rangeFrom, rangeTo) {
            if ((moment(from) >= moment(rangeFrom) && moment(from) <= moment(rangeTo)) ||
                 moment(to) >= moment(rangeFrom) && moment(to) <= moment(rangeTo) ||
                 (moment(from) <= moment(rangeFrom) && moment(to) >= moment(rangeTo))) {
                return true;
            }else {
                return false;
            }
        };

        var refreshIsVisableData = function() {
            $log.info('refreshIsVisableData');
            var dateRange = $scope.api.columns.getDateRange(true)
            var data = $scope.api.data.get();
            if (data.length > 0) {
                for (var i = data.length - 1; i >= 0; i--) {
                    if ( checkRowIsVisible(data[i].from, data[i].to, dateRange[0], dateRange[1]) === true) {
                        data[i].classes = ['isShow'];
                    }else {
                        data[i].classes = ['isHide'];
                    }
                };
            }

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

        // load data action
        $scope.load = function() {

            $log.info('Start one gantt load');
            $scope.data = [];

            for (var i = $scope.adUnitOne.row.tasks.length - 1; i >= 0; i--) {
                var newRow = {
                    classes: ['isHide'],
                    name: $scope.adUnitOne.row.tasks[i].name,
                    tasks: [$scope.adUnitOne.row.tasks[i]],
                    from: $scope.adUnitOne.row.tasks[i].from,
                    to: $scope.adUnitOne.row.tasks[i].to,
                    isVisible: false,
                };
                $scope.data.push(newRow);
            }

        };

        $scope.reload = function() {
            $scope.load();
        };

        $scope.resetDate = function() {
            $scope.options.fromDate = undefined;
            $scope.options.toDate = undefined;
        }

    }]);

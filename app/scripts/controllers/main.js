'use strict';

/**
 * @ngdoc function
 * @name bhAdManager.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the bhAdManager
 */
var environment = "TEST";

angular.module('bhAdManager')
    .controller('MainCtrl', ['$scope', '$timeout', '$log', 'ganttUtils', 'GanttObjectModel', 'Sample', 'ganttMouseOffset', 'ganttDebounce', 'moment', '$modal', '$popover', '$http', '$sce', '$alert', '$rootScope', '$aside',
        function($scope, $timeout, $log, utils, ObjectModel, Sample, mouseOffset, debounce, moment, $modal, $popover, $http, $sce, $alert, $rootScope, $aside) {
            var objectModel;
            var dataToRemove;
            $scope.orders = undefined;
            $scope.selectedOrder = undefined;
            $scope.selectedLineItem = undefined;
            var changeColorAside = $aside({scope: $scope, title: "編輯委刊單顏色", templateUrl: '../app/scripts/views/changeColorForm.tpl.html', show: false, backdrop: "static"});

            $scope.options = {
                updateTime: undefined,
                tabSelected: 'gantt', // gantt | lineItemList
                setSideWidth: 250,
                mode: 'custom',
                scale: 'day',
                sortMode: undefined,
                isLoading: false,
                sideMode: 'Table',
                daily: true,
                maxHeight: false,
                width: true,
                zoom: 1,
                columns: ['model.name'],
                treeTableColumns: [],
                tooltipsContent: '<table class="tooltip-content table table-hover"><tbody><tr ng-repeat="tContent in task.model.tooltipsContent track by $index"><td>{{ tContent.label }}</td><td>{{ tContent.data }}</td></tr></tbody></table>',
                columnsHeaders: {
                    'model.name': 'Name'
                },
                columnsClasses: {
                    'model.name': 'gantt-column-name',
                    'from': 'gantt-column-from',
                    'to': 'gantt-column-to'
                },
                columnsFormatters: {
                    'from': function(from) {
                        return from !== undefined ? from.format('lll') : undefined;
                    },
                    'to': function(to) {
                        return to !== undefined ? to.format('lll') : undefined;
                    }
                },
                contextMenuOptions:{
                    'task':
                        [['更新booking資料', function ($itemScope, $event, model) {
                            $scope.handleBooking(model);
                        },function ($itemScope, $event, model) {
                            if (model.status === 'BOOKING') {
                                return true;
                            }else {
                                return false;
                            }
                        }],
                        ['編輯背景色', function ($itemScope, $event, model) {
                            $scope.changeColorModel = angular.copy(model);
                            changeColorAside.$promise.then(function() {
                                changeColorAside.show();
                            });
                        }]
                        ],
                    // 'rowLabel':
                    //     [['row model', function ($itemScope, $event, model) {
                    //         console.log(model);
                    //     }],
                    //     ['Clear Data', function ($itemScope, $event, model) {
                    //         $scope.clear();
                    //     }]],
                },
                treeHeaderContent: '<i class="fa fa-align-justify"></i> 廣告單元',
                columnsHeaderContents: {
                    'model.name': '<i class="fa fa-align-justify"></i> {{getHeader()}}',
                },
                headersFormats: {
                    week: function(column) {
                        return Math.ceil(column.date.format('D') / 7);
                    },
                },
                autoExpand: 'both',
                taskOutOfRange: 'truncate',
                fromDate: undefined,
                toDate: undefined,
                rowContent: '<i class="fa fa-align-justify"></i> {{row.model.name}}',
                taskContentEnabled: true,
                taskContent: '{{ task.model.orderName}} - {{task.model.lineItemName}} - {{ task.model.status}}',
                allowSideResizing: true,
                labelsEnabled: true,
                currentDate: 'none',
                currentDateValue: new Date(),
                draw: false,
                readOnly: true,
                groupDisplayMode: 'Disabled',
                filterTask: {
                    name: undefined,
                    orderId: undefined,
                    status: undefined,
                    id: undefined,
                },
                filterRow: '',
                filterTaskStatusOptions: [
                    {name: '延長放送' , key: 'DELIVERY_EXTENDED'},
                    {name: '放送中' , key: 'DELIVERING'},
                    {name: '準備中' , key: 'READY'},
                    {name: '暫停' , key: 'PAUSED'},
                    {name: '缺素材or禁用' , key: 'INACTIVE'},
                    {name: '暫停廣告資源' , key: 'PAUSED_INVENTORY_RELEASED'},
                    {name: '待審核' , key: 'PENDING_APPROVAL'},
                    {name: '放送完成' , key: 'COMPLETED'},
                    {name: '不合格' , key: 'DISAPPROVED'},
                    {name: '草稿' , key: 'DRAFT'},
                    {name: '取消' , key: 'CANCELED'},
                    {name: 'BOOKING' , key: 'BOOKING'},
                ],
                columnMagnet: '1 day',
                api: function(api) {
                    // API Object is used to control methods and events from angular-gantt.
                    $scope.api = api;

                    api.data.on.change($scope,function(newData, oldData){
                        var fromDate = undefined;
                        $scope.api.side.setWidth($scope.options.setSideWidth);
                        if ($scope.options.fromDate === undefined) {
                            fromDate = new Date();
                        } else {
                            fromDate = $scope.options.fromDate;
                        }
                        $timeout(function() {
                            api.scroll.toDate(new Date());
                        }, 1000);

                        $timeout(function() {
                            $scope.options.isLoading = false;
                        }, 3000);
                    });

                    api.core.on.ready($scope, function() {
                        $scope.load();
                        $log.info('api on ready');
                        api.directives.on.new($scope, function(directiveName, directiveScope, element) {
                            switch (directiveName) {
                                case 'ganttTask':
                                    element.on('click', function(event) {
                                        if (directiveScope.task.model.status !== 'BOOKING') {
                                           if ($scope.selectedOrder === undefined) {
                                                $scope.handleSelectOrder(directiveScope.task.model.orderId)
                                            } else {
                                                $scope.handleSelectLineItem(directiveScope.task.model.orderId, directiveScope.task.model.id);
                                            }
                                        }
                                        $scope.$digest();
                                    });

                                    element.bind('mouseenter', function(event) {
                                        element.addClass('task-highlight');
                                    });
                                    element.bind('mouseleave', function(event) {
                                        element.removeClass('task-highlight');
                                    });
                                    break;
                                case 'ganttRow':
                                    element.bind('click', function(event) {
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
                                    element.bind('click', function(event) {
                                        var dateRange = api.columns.getDateRange(true)
                                        var adUnitOne = {
                                            row: directiveScope.row.model,
                                            dateRange: dateRange,
                                        };

                                        var $modalScope = $scope.$new(true);
                                        $modalScope.adUnitOne = adUnitOne;

                                        $scope._saveGanttModal = $modal({
                                            scope: $modalScope,
                                            title: directiveScope.row.model.name,
                                            content: 'Prepare your gantt data, please wait one moment...',
                                            templateUrl: '../app/scripts/views/oneGantt.tpl.html',
                                            show: false
                                        });

                                        $scope._saveGanttModal.$promise.then($scope._saveGanttModal.show);

                                        $scope.$digest();

                                    });
                                    break;
                            };
                        });

                        objectModel = new ObjectModel(api);
                    });
                }
            };

            $rootScope.$on('isLoading', function(event, args) {
                $log.info('emit isLoading');
                $scope.options.isLoading = args;
            });

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

            var getReady = function(data) {
                for (var i = 0; i < (data.length); i++) {
                    if (data[i].tasks !== undefined) {
                        for (var j = (data[i].tasks.length - 1); j >= 0; j--) {
                            var taskClasses = [];

                            if (backgroundColor(data[i].tasks[j].color)) {
                                taskClasses.push('isLight');
                            } else {
                                taskClasses.push('isDark');
                            }
                            // Add class is[Status].
                            if (data[i].tasks[j].status != undefined) {
                                var status = data[i].tasks[j].status;
                                status = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
                                taskClasses.push('is' + status);
                            }
                            data[i].tasks[j].classes = taskClasses;
                        }
                    }
                    $scope.data.push(data[i]);
                };
            };

            var backgroundColor = function(colorHexCode) {
                if (colorHexCode.substr(1, 1) === '#') {
                    colorHexCode = colorHexCode.substr(2, 6);
                }
                var R = parseInt(colorHexCode.substr(1, 2), 16);
                var G = parseInt(colorHexCode.substr(3, 2), 16);
                var B = parseInt(colorHexCode.substr(5, 2), 16);
                // http://softpixel.com/~cwright/programming/colorspace/yuv/
                // convert RGB Colorspace to YUV Colorspace
                var Y = R * 0.299000 + G * 0.587000 + B * 0.114000; // determines the brightness of the color
                var U = R * -0.168736 + G * -0.331264 + B * 0.500000 + 128; // determines the chrominance of the color
                var V = R * 0.500000 + G * -0.418688 + B * -0.081312 + 128; // determines the chroma of the color
                return Y <= 149;
            };

            // load data action
            $scope.load = function() {
                $log.info('Start load');
                $scope.data = [];
                $scope.options.isLoading = true;
                if (environment === 'TEST') {
                    Sample.getSampleData().success(function(response) {
                        getReady(response.ganttData.data);
                        $scope.options.updateTime = response.ganttData.updateTime;
                        $scope.orders = response.ganttData.orders;
                    });
                } else {
                    $http({
                        method: 'GET',
                        url: '/gantt/ajax/load'
                    }).then(function(response) {
                        if (response.data.status === 'ok') {
                            getReady(response.data.ganttData.data);
                            $scope.options.updateTime = response.data.ganttData.updateTime;
                            $scope.orders = response.data.ganttData.orders;
                        } else {
                            alert('Load Data Error');
                        }
                    }, function(response) {
                        alert('Load Data Error');
                    });
                }
                dataToRemove = undefined;
            };

            $scope.reload = function() {
                $scope.load();
            };

            $scope.resetDate = function() {
                $scope.options.fromDate = undefined;
                $scope.options.toDate = undefined;
            };

            $scope.handleUpdateDFP = function() {
                $log.info('handleUpdateDFP');
                $scope.updateLoading = true;
                $scope.options.isLoading = true;
                if (environment === 'TEST') {
                    Sample.getSampleData().success(function(response) {
                        $scope.data = response.data;
                    });
                } else {
                    $http({
                        method: 'GET',
                        url: '/gantt/ajax/updateDFP'
                    }).then(function(response) {
                        if (response.data.status === 'ok') {
                            $scope.updateLoading = true;
                            alert('Update Data Success.');
                            $scope.reload();
                        } else {
                            alert('Update Data Error');
                        }
                    }, function(response) {
                        alert('Update Data Error');
                    });
                }
            };

            $scope.taskSaveColor = function() {
                $scope.options.isLoading = true;
                if (environment === 'TEST') {
                    changeColor($scope.changeColorModel.orderId, $scope.changeColorModel.color);
                    $scope.options.isLoading = false;
                    $scope.changeColorModel = undefined;

                    $alert({
                        title: 'Success!',
                        content: '顏色更新成功',
                        type: 'success',
                        keyboard: true,
                        show: true
                    });
                    changeColorAside.hide();
                } else {
                    $http({
                        method: 'POST',
                        url: '/gantt/ajax/updateTask',
                        data: $scope.changeColorModel
                    }).then(function(response) {
                        if (response.data.status === 'ok') {
                            changeColor($scope.changeColorModel.orderId, $scope.changeColorModel.color);
                            $scope.options.isLoading = false;
                            $scope.changeColorModel = undefined;
                            changeColorAside.hide();
                            $alert({
                                title: 'Success!',
                                content: '顏色更新成功',
                                type: 'success',
                                keyboard: true,
                                show: true
                            });

                        } else {
                            alert('Update Data Error');
                        }
                    }, function(response) {
                        alert('Update Data Error');
                    });
                }
            };

            var changeColor = function(orderId, color) {
                var bgColor;
                if (backgroundColor(color)) {
                    bgColor = 'isLight';
                } else {
                    bgColor = 'isDark';
                }
                for (var i = $scope.data.length - 1; i >= 0; i--) {
                    if ($scope.data[i].tasks !== undefined) {
                        for (var j = $scope.data[i].tasks.length - 1; j >= 0; j--) {
                            if ($scope.data[i].tasks[j].orderId === orderId) {
                                $scope.data[i].tasks[j].color = color;
                                if ($scope.data[i].tasks[j].classes !== undefined && $scope.data[i].tasks[j].classes.length > 0) {
                                    var classes = [];
                                    for (var k = $scope.data[i].tasks[j].classes.length - 1; k >= 0; k--) {
                                        if ($scope.data[i].tasks[j].classes[k] !== 'isLight' && $scope.data[i].tasks[j].classes[k] !== 'isDark') {
                                            classes.push($scope.data[i].tasks[j].classes[k]);
                                        }
                                    };
                                    classes.push(bgColor);
                                    $scope.data[i].tasks[j].classes = classes;
                                }
                            }
                        };
                    }
                };
            };



            $scope.$watch('options.filterTask', function(newValue, oldValue) {
                $scope.options.filterTask = angular.copy(newValue);
            },true);

            $scope.handleSelectOrder = function(orderId){
                $scope.options.filterTask = {orderId: orderId, id: ''};
                $scope.selectedOrder = $scope.orders[orderId];
                $scope.selectedLineItem = undefined;
            };

            $scope.handleSelectLineItem = function(orderId,lineItemId) {
                if ($scope.selectedLineItem === undefined) {
                    $scope.options.filterTask.id = lineItemId;
                    $scope.selectedLineItem =  $scope.orders[orderId].lineItems[lineItemId];
                    for (var i = 0; i <  $scope.selectedLineItem.creatives.length; i++) {
                        if ($scope.selectedLineItem.creatives[i].previewUrl !== undefined || $scope.selectedLineItem.creatives[i].previewUrl !== '') {
                            $scope.selectedLineItem.creatives[i].iframeUrl = $sce.trustAsResourceUrl(angular.copy($scope.selectedLineItem.creatives[i].previewUrl));
                        }
                    }
                    $scope.options.tabSelected = 'gantt';
                }

            };

            $scope.resizeIframe
            $scope.handleInit = function(){
                $scope.options.filterTask = {orderId: '', id: ''};
                $scope.selectedOrder =  undefined;
                $scope.selectedLineItem = undefined;
                $scope.options.tabSelected = 'gantt';
            };

            $scope.handleBooking = function(editOrderData) {
                $log.info('handleBooking');
                var $bookingFormScope = $scope.$new(true);
                $bookingFormScope.ganttData = $scope.data;
                if (editOrderData !== undefined) {
                    $bookingFormScope.editOrderData = editOrderData;
                }else {
                    $bookingFormScope.editOrderData = undefined;
                }

                $scope._bookingForm = $modal({
                    scope: $bookingFormScope,
                    title: '新增委刊單',
                    content: 'Prepare your gantt data, please wait one moment...',
                    templateUrl: '../app/scripts/views/bookingForm.tpl.html',
                    show: false,
                });
                $scope._bookingForm.$promise.then($scope._bookingForm.show);
            };

            $rootScope.$on('filterOrderId', function(event, taskModel) {
                $scope.options.filterTask.orderId = taskModel.orderId;
                $scope.selectedOrder = angular.copy(taskModel);
            });

            $rootScope.$on('deleteBooking', function(event, args) {
                // delete Orders.
                if (args.deleteOrderId !== undefined) {
                    var deleteOrderId = args.deleteOrderId;
                }
                if (args.reload === false) {
                    for (var i = 0; i < $scope.data.length; i++) {
                        if ($scope.data[i].tasks.length > 0) {
                            for (var j = 0; j < $scope.data[i].tasks.length; j++) {
                                 if ($scope.data[i].tasks[j].orderId === deleteOrderId) {
                                    $scope.data[i].tasks.splice(j, 1);
                                 }
                            };
                        }

                    };
                    $alert({
                        title: 'Success!',
                        content: 'Deleted Booking order success!',
                        type: 'success',
                        duration: 5,
                        show: true
                    });
                }else {
                    $scope.reload();
                    $alert({
                        title: 'Success!',
                        content: 'Deleted Booking order success!',
                        type: 'success',
                        duration: 5,
                        show: true
                    });
                }
            });
            $rootScope.$on('reload', function(event, args) {
                $scope.reload();
            });
            $rootScope.$on('addTasks', function(event, args) {
                // Push New Tasks.
                var taskDatas = args.taskDatas;
                if (args.reload === false) {
                    for (var i = 0; i < $scope.data.length; i++) {
                         for (var j = 0; j < taskDatas.length; j++) {
                             if (taskDatas[j].ad_unit_id === $scope.data[i].id) {
                                // Change Tasks color.
                                var taskClasses = [];
                                taskClasses.push('isBooking');
                                if (backgroundColor(taskDatas[j].color)) {
                                    taskClasses.push('isLight');
                                } else {
                                    taskClasses.push('isDark');
                                }
                                taskDatas[j].classes = taskClasses;
                                $scope.data[i].tasks.push(taskDatas[j]);
                             }
                         };
                    };
                }else {
                    $scope.reload();
                    $alert({
                        title: 'Success!',
                        content: 'Booking order success!',
                        type: 'success',
                        duration: 5,
                        show: true
                    });
                }
            });
        }
    ]);

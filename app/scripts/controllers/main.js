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
    .controller('MainCtrl', ['$scope', '$timeout', '$log', 'ganttUtils', 'GanttObjectModel', 'bhAdResources', 'Sample', 'ganttMouseOffset', 'ganttDebounce', 'moment', '$modal', '$popover', '$http', '$sce', '$alert', '$rootScope', '$aside', '$q',
        function($scope, $timeout, $log, utils, ObjectModel, bhAdResources, Sample, mouseOffset, debounce, moment, $modal, $popover, $http, $sce, $alert, $rootScope, $aside, $q) {
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
                            $scope.handleUpdateBooking(model);
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
                        },function(itemScoep, $event, model) {
                            if (model.status === 'BOOKING') {
                                return false;
                            }else {
                                return true;
                            }
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
                    isArchived: false,
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
                        $scope.dfpNetworkCode = response.ganttData.dfpNetworkCode;
                        $scope.dfpEndPoint = 'https://www.google.com/dfp/main?networkCode=' + $scope.dfpNetworkCode +'#delivery/';

                        Sample.getSamplatUsers().success(function(response) {
                            $scope.traffickerUsers = response.data;
                        });
                    });
                } else {
                    bhAdResources.getGanttData().then(function(response) {
                        if (response.data.status === 'ok') {
                            getReady(response.data.ganttData.data);
                            $scope.options.updateTime = response.data.ganttData.updateTime;
                            $scope.orders = response.data.ganttData.orders;
                            $scope.dfpNetworkCode = response.data.ganttData.dfpNetworkCode;
                            $scope.dfpEndPoint = 'https://www.google.com/dfp/main?networkCode=' + $scope.dfpNetworkCode +'#delivery/';
                            bhAdResources.getTraffickerUsers().then(function(response) {
                                $scope.traffickerUsers = response.data.data;

                            }, function(response) {
                                $rootScope.$emit('handleAlert',{message: 'Get Trafficker Users Data Error!', type: 'danger'});
                            });
                        } else {
                            $rootScope.$emit('handleAlert',{message: 'Load Data Error!', type: 'danger'});
                        }


                    }, function(response) {
                        $rootScope.$emit('handleAlert',{message: 'Load Data Error!', type: 'danger'});
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
                    $rootScope.$emit('handleAlert',{message: 'Update Data Success!', type: 'success.'});
                    $scope.updateLoading = false;
                    $scope.reload();
                } else {
                    bhAdResources.updateDfp().then(function(response) {
                        if (response.data.status === 'ok') {
                            $scope.updateLoading = false;
                            $rootScope.$emit('handleAlert',{message: 'Update Data Success!', type: 'success.'});
                            $scope.reload();
                        } else {
                            $rootScope.$emit('handleAlert',{message: 'Update Data Error!', type: 'danger'});
                        }
                    }, function(response) {
                        $rootScope.$emit('handleAlert',{message: 'Update Data Error!', type: 'danger'});
                    });
                }
            };

            $scope.taskSaveColor = function() {
                $scope.options.isLoading = true;
                if (environment === 'TEST') {
                    changeColor($scope.changeColorModel.orderId, $scope.changeColorModel.color);
                    $scope.options.isLoading = false;
                    $scope.changeColorModel = undefined;
                    $rootScope.$emit('handleAlert',{message: '顏色更新成功!', type: 'success'});
                    changeColorAside.hide();
                } else {
                    bhAdResources.updateTask($scope.changeColorModel).then(function(response) {
                        if (response.data.status === 'ok') {
                            changeColor($scope.changeColorModel.orderId, $scope.changeColorModel.color);
                            $scope.options.isLoading = false;
                            $scope.changeColorModel = undefined;
                            changeColorAside.hide();
                            $rootScope.$emit('handleAlert',{message: '顏色更新成功!', type: 'success'});

                        } else {
                            $rootScope.$emit('handleAlert',{message: 'Update Data Error!', type: 'danger'});
                        }
                    }, function(response) {
                        $rootScope.$emit('handleAlert',{message: 'Update Data Error!', type: 'danger'});
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
                if (environment === 'TEST') {　
                    Sample.getSampleOrder().success(function(response) {
                        $scope.selectedOrder = response.data;
                    });
                }else {
                    bhAdResources.getOrder(orderId).then(function(response) {
                        if (response.data.status === 'ok') {
                            $scope.selectedOrder = response.data.data;
                        } else {
                            $rootScope.$emit('handleAlert',{message: 'Get Order Data Error!', type: 'danger'});
                        }
                    }, function(response) {
                        $rootScope.$emit('handleAlert',{message: 'Get Order Data Error!', type: 'danger'});
                    });
                }
                $scope.selectedLineItem = undefined;
            };

            $scope.handleSelectLineItem = function(orderId,lineItemId) {
                if ($scope.selectedLineItem === undefined) {
                    $scope.options.filterTask.id = lineItemId;
                    if (environment === 'TEST') {　
                        var lineItemFirst =  Object.keys($scope.selectedOrder.lineItems)[0];
                        $scope.selectedLineItem = $scope.selectedOrder.lineItems[lineItemFirst]
                    } else {
                        $scope.selectedLineItem = $scope.selectedOrder.lineItems[lineItemId];
                    }
                    for (var i = 0; i <  $scope.selectedLineItem.creatives.length; i++) {
                        if ($scope.selectedLineItem.creatives[i].previewUrl !== undefined || $scope.selectedLineItem.creatives[i].previewUrl !== '') {
                            $scope.selectedLineItem.creatives[i].iframeUrl = $sce.trustAsResourceUrl(angular.copy($scope.selectedLineItem.creatives[i].previewUrl));
                        }
                    }
                    $scope.options.tabSelected = 'gantt';
                }
            };

            $scope.handleInit = function(){
                $scope.options.filterTask = {};
                $scope.selectedOrder =  undefined;
                $scope.selectedLineItem = undefined;
                $scope.options.tabSelected = 'gantt';
            };
            $scope.createBooking = function() {
                var $bookingFormScope = $scope.$new(true);
                $bookingFormScope.traffickerUsers = $scope.traffickerUsers;
                $bookingFormScope.ganttData = $scope.data;
                $scope._bookingForm = $modal({
                    scope: $bookingFormScope,
                    title: '新增委刊單',
                    content: 'Prepare your gantt data, please wait one moment...',
                    templateUrl: '../app/scripts/views/bookingForm.tpl.html',
                    show: false,
                });
                $scope._bookingForm.$promise.then($scope._bookingForm.show);
            };

            $scope.handleUpdateBooking = function(editBookingData) {
                $log.info('handleUpdateBooking');
                var bookingAjax;
                if (environment === 'TEST') {
                    bookingAjax = Sample.getSampleBooking();
                } else {
                    bookingAjax = bhAdResources.getBooking(editBookingData.bookingId);
                }

                var $bookingFormScope = $scope.$new(true);

                bookingAjax.then(function(response) {
                    $bookingFormScope.ganttData = $scope.data;
                    $bookingFormScope.editBookingData = response.data.data;
                    $bookingFormScope.traffickerUsers = $scope.traffickerUsers;
                    $scope._bookingForm = $modal({
                        scope: $bookingFormScope,
                        title: '新增委刊單',
                        content: 'Prepare your gantt data, please wait one moment...',
                        templateUrl: '../app/scripts/views/bookingForm.tpl.html',
                        show: false,
                    });
                    $scope._bookingForm.$promise.then($scope._bookingForm.show);
                },function(){
                    $rootScope.$emit('handleAlert',{message: 'get Booking Data Error!', type: 'danger'});
                });
            };
            $scope.redirectEditOrder = function(orderId) {
                var editPath = $scope.dfpEndPoint + 'OrderDetail/orderId=' + orderId;
                window.open(editPath, '_blank');
                updateDfpNotification();
            };
            $scope.redirectEditLineItem = function(orderId, lineItemId) {
                var editPath = $scope.dfpEndPoint + 'LineItemDetail/orderId=' + orderId + '&lineItemId=' + lineItemId;
                window.open(editPath, '_blank');
                updateDfpNotification();
            };
            $scope.redirectCreateCreative = function(orderId, lineItemId) {
                var editPath = $scope.dfpEndPoint + 'CreateCreative/orderId=' + orderId + '&lineItemId=' + lineItemId;
                window.open(editPath, '_blank');
                updateDfpNotification();
            };
            $scope.redirectEditCreative = function(creativeId) {
                var editPath = $scope.dfpEndPoint + 'CreativeDetail/creativeId=' + creativeId;
                window.open(editPath, '_blank');
                updateDfpNotification();
            };

            $scope.updateDfpForNotification = function(){
                $scope.handleUpdateDFP();
                $scope.checkDfpUpdateModal.$promise.then($scope.checkDfpUpdateModal.hide);
            }
            var updateDfpNotification = function() {
                var $checkDfpUpdateScope = $scope.$new(true);
                $checkDfpUpdateScope.handleUpdateDFP = $scope.updateDfpForNotification;
                $scope.checkDfpUpdateModal = $modal({
                    scope: $checkDfpUpdateScope,
                    title: '確認更新DFP',
                    templateUrl: '../app/scripts/views/checkDfpUpdate.tpl.html',
                    show: false,
                });
                $scope.checkDfpUpdateModal.$promise.then($scope.checkDfpUpdateModal.show);
            }

            $rootScope.$on('filterOrderId', function(event, taskModel) {
                $scope.options.filterTask.orderId = taskModel.orderId;
                $scope.selectedOrder = angular.copy(taskModel);
            });

            $rootScope.$on('deleteBooking', function(event, args) {
                // delete Orders.
                if (args.deleteBookingId !== undefined) {
                    var deleteBookingId = args.deleteBookingId;
                }
                if (args.reload === false) {
                    for (var i = 0; i < $scope.data.length; i++) {
                        if ($scope.data[i].tasks.length > 0) {
                            for (var j = 0; j < $scope.data[i].tasks.length; j++) {
                                 if ($scope.data[i].tasks[j].bookingId === deleteBookingId) {
                                    $scope.data[i].tasks.splice(j, 1);
                                 }
                            };
                        }

                    };
                    $rootScope.$emit('handleAlert',{message: 'Deleted Booking order success!', type: 'success'});
                }else {
                    $scope.reload();
                    $rootScope.$emit('handleAlert',{message: 'Deleted Booking order success!', type: 'success'});

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
                }
                $rootScope.$emit('handleAlert',{message: 'Booking order success!', type: 'success'});
            });

            $rootScope.$on('handleAlert', function(event, args) {
                var type = 'success';
                var message = args.message;
                var duration = 10;
                if (args.type !== undefined) {
                    type = args.type;
                }

                if (args.duration !== undefined) {
                    duration = args.duration;
                }

                $alert({
                    title: type.charAt(0).toUpperCase() + type.slice(1) + '!',
                    content: message,
                    type: type,
                    duration: duration,
                    show: true
                });
            });
        }
    ]);

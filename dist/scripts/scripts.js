'use strict';


angular.module('dfpDateFormat', []).filter('dfpDate', function() {
    return function(input, format) {
        var date = input.date.year + '-' + (parseInt(input.date.month, 10) < 10 ? '0'+input.date.month : input.date.month)
         + '-' + (parseInt(input.date.day, 10) < 10 ? '0'+input.date.day : input.date.day);
        date = date + ' ' + (parseInt(input.hour, 10) < 10 ? '0'+input.hour : input.hour) + ':' + (parseInt(input.minute, 10) < 10 ? '0'+input.minute : input.minute)
         + ':'+ (parseInt(input.second, 10) < 10 ? '0'+input.second : input.second);
        return moment(date).format(format);
    };
});

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
    'ngAnimate',
    'dfpDateFormat'
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
    });
}]);



'use strict';

/**
 * @ngdoc service
 * @name bhAdManager.bhAdResources
 * @description
 * # bhAdResources
 * Service in the bhAdManager.
 */
angular.module('bhAdManager')
    .service('bhAdResources', ['$http', '$log', function bhAdResources($http, $log) {
        return {
            getGanttData: function() {
                return $http({
                    url: '/gantt/ajax/load',
                    method: 'GET',
                    responseType: 'json',
                    timeout: 5000,
                });
            },
            updateDfp: function() {
                return $http({
                    url: '/gantt/ajax/updateDFP',
                    method: 'GET',
                    responseType: 'json',
                });
            },
            updateTask: function(data) {
                return $http({
                    url: '/gantt/ajax/updateTask',
                    method: 'POST',
                    data: data,
                    responseType: 'json',
                    timeout: 5000,
                });
            },
            getOrder: function(orderId) {
                return $http({
                    url: '/dfp/orders/' + orderId,
                    method: 'GET',
                    responseType: 'json',
                    timeout: 5000,
                });
            },
            getBooking: function(bookingId) {
                return $http({
                    url: '/booking/' + bookingId,
                    method: 'GET',
                    responseType: 'json',
                    timeout: 5000,
                });
            },
            createBooking: function(bookingData) {
                return $http({
                    url: '/booking/create',
                    method: 'POST',
                    data: bookingData,
                    responseType: 'json',
                    timeout: 5000,
                });
            },
            updateBooking: function(bookingId, bookingData) {
                return $http({
                    url: '/booking/' + bookingId + '/update',
                    data: bookingData,
                    method: 'PUT',
                    responseType: 'json',
                    timeout: 5000,
                });
            },
            deleteBooking: function(bookingId, bookingData) {
                return $http({
                    url: '/booking/' + bookingId + '/delete',
                    data: bookingData,
                    method: 'DELETE',
                    responseType: 'json',
                    timeout: 5000,
                });
            },
            syncingToDFP: function(bookingId, bookingData) {
                return $http({
                    url: '/booking/' + bookingId + '/syncingToDFP',
                    data: bookingData,
                    method: 'POST',
                    responseType: 'json',
                });
            }
        };
    }])
;

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
                    bhAdResources.getGanttData().then(function(response) {
                        if (response.data.status === 'ok') {
                            getReady(response.data.ganttData.data);
                            $scope.options.updateTime = response.data.ganttData.updateTime;
                            $scope.orders = response.data.ganttData.orders;
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
                    Sample.getSampleData().success(function(response) {
                        $scope.data = response.data;
                    });
                } else {
                    bhAdResources.updateDfp().then(function(response) {
                        if (response.data.status === 'ok') {
                            $scope.updateLoading = true;
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
                            $scope.selectedOrder = response.data;
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
                $scope.options.filterTask = {orderId: '', id: ''};
                $scope.selectedOrder =  undefined;
                $scope.selectedLineItem = undefined;
                $scope.options.tabSelected = 'gantt';
            };
            $scope.createBooking = function() {
                var $bookingFormScope = $scope.$new(true);
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
                $bookingFormScope.ganttData = $scope.data;

                bookingAjax.then(function(response) {
                    $bookingFormScope.editBookingData = response.data.data;
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
            headersFormats: {
                week: function(column) {
                    return Math.ceil(column.date.format('D') / 7);
                },
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
                                    $rootScope.$emit('filterOrderId', directiveScope.task.model);
                                    $scope.$hide();
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

'use strict';

/**
 * @ngdoc function
 * @name bhAdManager.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the bhAdManager
 */

angular.module('bhAdManager')
    .controller('bookingForm', ['$scope', '$timeout', '$log', 'moment', '$modal', '$http', 'bhAdResources', '$alert', '$rootScope', '$filter', '$popover',
        function($scope, $timeout, $log, moment, $modal, $http, bhAdResources, $alert, $rootScope, $filter, $popover) {
            var defaultLineItem = {
                id: undefined,
                name: undefined,
                adUnits: undefined,
                fromDate: undefined,
                toDate: undefined,
            };

            $scope.bookingForm = {
                bookingId: undefined,
                isEdit: false,
                orderName: undefined,
                orderColor: undefined,
                lineItems: [],
            };
            // Is Edit Form
            if ($scope.editBookingData !== undefined) {
                $scope.bookingForm = {
                    isEdit: true,
                    bookingId: $scope.editBookingData.id,
                    orderName: $scope.editBookingData.orderName,
                    orderColor: $scope.editBookingData.orderColor,
                    lineItems: $scope.editBookingData.lineItems,
                }

                var deleteBookingOptions = {
                    title: '請確認是否刪除',
                    content: '確認是否刪除booking項目',
                    templateUrl: '../app/scripts/views/confirmForm.tpl.html',
                    trigger: 'manual',
                    placement: 'top'
                };

                var SyncingDfpOptions = {
                    title: '確認同步到DFP',
                    content: '確認是否同步到DFP?',
                    templateUrl: '../app/scripts/views/confirmForm.tpl.html',
                    trigger: 'manual',
                    placement: 'top'
                };
                $timeout(function() {
                    $scope.myPopover = {
                        handleDeleteBooking: $popover(angular.element(document.querySelector('#handle-delete-booking')), deleteBookingOptions),
                        handleSyncingToDFP: $popover(angular.element(document.querySelector('#handle-sycing-dfp')), SyncingDfpOptions),
                    }
                });

            }

            $scope.handleAddLineItem = function() {
                if ($scope.bForm !== undefined) {
                    $scope.bForm.$submitted = false;
                }
                $scope.bookingForm.lineItems.push(angular.copy(defaultLineItem));
            }

            $scope.handleReduceLineItem = function(index) {
                if ($scope.bookingForm.lineItems.length > 1) {
                    $scope.bookingForm.lineItems.splice(index, 1);
                } else {
                    $rootScope.$emit('handleAlert',{message: '必須至少一個委刊項目!', type: 'danger'});
                }
            }

            $scope.handlePopoverConfirm = function(action, $event) {
                if ($scope.myPopover[action] !== undefined) {
                    $scope.myPopover[action].$promise.then(function() {
                        $scope.myPopover[action].$scope.saved = function($event) {
                            $scope[action]();
                        };
                        $scope.myPopover[action].toggle();
                    });
                }
            };

            $scope.handleDeleteBooking = function() {
                $log.info('handleDeleteBooking');
                if (environment === 'TEST') {
                    $scope.$hide();
                    $rootScope.$emit('deleteBooking', {deleteBookingId: $scope.bookingForm.bookingId, reload: false});
                } else {
                    deleteBooking();
                }
            };

            $scope.handleSaveBooking = function(){
                $log.info('handleSaveBooking');
                if (vaildationBookingForm($scope.bookingForm) !== false ){
                    if (environment === 'TEST') {
                        var newTaskDatas = [];
                        var bookingId = uuid();
                        for (var i = 0; i < $scope.bookingForm.lineItems.length; i++) {
                            var taskData = {
                                ad_unit_id: $scope.bookingForm.lineItems[i].adUnits,
                                color: $scope.bookingForm.orderColor,
                                creatives: [],
                                from: $scope.bookingForm.lineItems[i].fromDate,
                                to: $scope.bookingForm.lineItems[i].toDate,
                                lineItemName: $scope.bookingForm.lineItems[i].name,
                                name: $scope.bookingForm.lineItems[i].name + "(BOOKING)",
                                orderName: $scope.bookingForm.orderName,
                                status: "BOOKING",
                                id: uuid(),
                                bookingId: bookingId,
                                tooltipsContent: []
                            }
                            newTaskDatas.push(taskData);
                        }
                        var args = {
                            taskDatas: newTaskDatas,
                            reload: false
                        }
                        $rootScope.$emit('addTasks', args);
                        $scope.$hide();
                    } else {
                        saveBooking();
                    }
                }　else {
                    $rootScope.$emit('handleAlert',{message: '請檢查資料是否填寫正確!', type: 'danger'});
                }
            }
            $scope.handleSyncingToDFP = function() {
                $log.info('handleSyncingToDFP');
                if (vaildationBookingForm($scope.bookingForm) !== false ){
                    if (environment === 'TEST') {
                        $rootScope.$emit('handleAlert',{message: 'Test Success to DFP!', type: 'success'});
                        $scope.$hide();
                    } else {
                        syncingToDFP();
                    }
                }　else {
                    $rootScope.$emit('handleAlert',{message: '請檢查資料是否填寫正確!', type: 'danger'});
                }
            };

            var saveBooking = function() {
                var bookingForm = angular.copy($scope.bookingForm);
                angular.forEach(bookingForm.lineItems, function(lineItem, key){
                    lineItem.fromDate = moment(lineItem.fromDate).format('YYYY-MM-DD HH:mm:ss');
                    lineItem.toDate = moment(lineItem.toDate).format('YYYY-MM-DD HH:mm:ss');
                });
                if ($scope.bookingForm.isEdit === true) {
                    bhAdResources.updateBooking(bookingForm.bookingId, bookingForm).then(function(response) {
                        if (response.data.status === 'ok') {
                            $scope.$hide();
                            $rootScope.$emit('addTasks', {reload: true});
                        } else {
                           if (response.data.message !== undefined) {
                                $rootScope.$emit('handleAlert',{message: response.data.message, type: 'danger'});
                            }else {
                                $rootScope.$emit('handleAlert',{message: 'Save Order Data Error!', type: 'danger'});
                            }
                        }
                    }, function(response) {
                           if (response.data.message !== undefined) {
                                $rootScope.$emit('handleAlert',{message: response.data.message, type: 'danger'});
                            }else {
                                $rootScope.$emit('handleAlert',{message: 'Save Order Data Error.', type: 'danger'});
                            }
                    });
                }else {
                   bhAdResources.createBooking(bookingForm).then(function(response) {
                        if (response.data.status === 'ok') {
                            $scope.$hide();
                            $rootScope.$emit('addTasks', {reload: true});
                        } else {
                           if (response.data.message !== undefined) {
                                $rootScope.$emit('handleAlert',{message: response.data.message, type: 'danger'});
                            }else {
                                $rootScope.$emit('handleAlert',{message: 'Save Order Data Error!', type: 'danger'});
                            }
                        }
                    }, function(response) {
                           if (response.data.message !== undefined) {
                                $rootScope.$emit('handleAlert',{message: response.data.message, type: 'danger'});
                            }else {
                                $rootScope.$emit('handleAlert',{message: 'Save Order Data Error.', type: 'danger'});
                            }
                    });
                }

            }

            var deleteBooking = function() {
                bhAdResources.deleteBooking($scope.bookingForm.bookingId, $scope.bookingForm).then(function(response) {
                    if (response.data.status === 'ok') {
                        $scope.$hide();
                        $rootScope.$emit('deleteBooking', {deleteBookingId: $scope.bookingForm.bookingId, reload: false});
                    } else {
                        $rootScope.$emit('handleAlert',{message: 'Delete Order Data Error.', type: 'danger'});
                    }
                }, function(response) {
                    $rootScope.$emit('handleAlert',{message: 'Delete Order Data Error.', type: 'danger'});

                });
            };

            var syncingToDFP = function() {
                var bookingForm = angular.copy($scope.bookingForm);
                angular.forEach(bookingForm.lineItems, function(lineItem, key){
                    lineItem.fromDate = moment(lineItem.fromDate).format('YYYY-MM-DD HH:mm:ss');
                    lineItem.toDate = moment(lineItem.toDate).format('YYYY-MM-DD HH:mm:ss');
                });
                $rootScope.$emit('isLoading', true);
                bhAdResources.syncingToDFP(bookingForm.bookingId, bookingForm).then(function(response) {
                    if (response.data.status === 'ok') {
                        $scope.$hide();
                        $rootScope.$emit('reload', true);
                        $rootScope.$emit('handleAlert',{message: 'Syncing To DFP Success.', type: 'success'});

                    } else {
                       if (response.data.message !== undefined) {
                             $rootScope.$emit('handleAlert',{message: response.data.message, type: 'danger'});
                        }else {
                            $rootScope.$emit('handleAlert',{message: 'Syncing To DFP Error.', type: 'danger'});
                        }
                        $rootScope.$emit('isLoading', false);
                    }
                }, function(response) {
                   if (response.data.message !== undefined) {
                        $rootScope.$emit('handleAlert',{message: response.data.message, type: 'danger'});
                    }else {
                        $rootScope.$emit('handleAlert',{message: 'Syncing To DFP Error.', type: 'danger'});
                    }
                    $rootScope.$emit('isLoading', false);
                });
            };

            var random4 = function() {
                return Math.floor(Math.random() * 10).toString(10);
            };
            var uuid = function() {
                return random4() + random4() + random4() + random4() +
                    random4() + random4() + random4() + random4() + random4() + random4();
            };

            var vaildationBookingForm = function(bookingForm) {
                var vail = true;
                if (bookingForm.orderName === undefined) {
                    vail = false;
                }

                if (bookingForm.orderColor === undefined) {
                    vail = false;
                }
                if (bookingForm.lineItems.length > 0) {
                    for (var i = 0; i <  bookingForm.lineItems.length; i++) {
                        var lineItem = bookingForm.lineItems[i];
                        if (lineItem.name === undefined ||
                            lineItem.adUnits === undefined ||
                            lineItem.fromDate === undefined ||
                            lineItem.toDate === undefined) {
                            vail = false;
                        }
                    }
                } else {
                    vail = false;
                }
                return vail;
            };

            if ($scope.bookingForm.lineItems.length === 0) {
                $scope.handleAddLineItem();
            }
    }]);

'use strict';
angular.module('admanager.templates', []).run(['$templateCache', function($templateCache) {
    $templateCache.put('../app/scripts/views/bookingForm.tpl.html',
        '<div id="bookingForm" class="modal" tabindex="-1" role="dialog" ng-controller="bookingForm">\n' +
        '    <div class="modal-dialog modal-lg">\n' +
        '        <div class="modal-content">\n' +
        '            <div class="modal-header" ng-show="title">\n' +
        '                <button type="button" class="close" ng-click="$hide()">&times;</button>\n' +
        '                <h4 class="modal-title" ng-bind-html="title"></h4>\n' +
        '            </div>\n' +
        '            <div class="modal-body" ng-show="content">\n' +
        '                <div class="row top-buffer">\n' +
        '                    <div class="col-md-12">\n' +
        '                        <form id="bForm" class="form-horizontal" role="form" name="bForm" novalidate>\n' +
        '                            <div class="panel panel-default">\n' +
        '                                <div class="panel-heading">委刊單</div>\n' +
        '                                <div class="panel-body" class="panel panel-default position-fixed">\n' +
        '                                    <div class="form-group">\n' +
        '                                        <label class="control-label col-sm-2" for="orderName">委刊單名稱</label>\n' +
        '                                        <div class="col-sm-10">\n' +
        '                                            <input type="text" class="form-control" id="orderName" name="orderName" ng-model="bookingForm.orderName" required>\n' +
        '                                            <div ng-show="bForm.$submitted || bForm.orderName.$touched">\n' +
        '                                              <div class="error" ng-show="bForm.orderName.$error.required">填寫委刊單</div>\n' +
        '                                            </div>\n' +
        '                                        </div>\n' +
        '                                    </div>\n' +
        '                                    <div class="form-group">\n' +
        '                                        <label class="control-label col-sm-2">背景顏色:</label>\n' +
        '                                        <div class="col-sm-10">\n' +
        '                                            <div class="input-group col-sm-12">\n' +
        '                                                <label class="input-group-addon" ng-style="{\'background-color\': bookingForm.orderColor}">&nbsp;&nbsp;&nbsp;&nbsp;</label>\n' +
        '                                                <input type="text" class="form-control" name="orderColor"  colorpicker colorpicker-parent="true" ng-model="bookingForm.orderColor" required>\n' +
        '                                            </div>\n' +
        '                                            <div class="col-sm-12" ng-show="bForm.$submitted || bForm.orderColor.$touched">\n' +
        '                                                <div class="error" ng-show="bForm.orderColor.$error.required">選取背景色</div>\n' +
        '                                            </div>\n' +
        '                                        </div>\n' +
        '                                    </div>\n' +
        '                                </div>\n' +
        '                            </div>\n' +
        '                            <div class="lineItems">\n' +
        '                                <div class="panel panel-default" ng-repeat="lineItem in bookingForm.lineItems track by $index">\n' +
        '                                    <div class="panel-heading">委刊項目</div>\n' +
        '                                    <div class="panel-body" class="panel panel-default position-fixed">\n' +
        '                                        <div class="form-group">\n' +
        '                                            <label class="control-label col-sm-2" for="{{ \'lineItemName\' + $index }}">委刊項名稱</label>\n' +
        '                                            <div class="col-sm-10">\n' +
        '                                                <input type="text" class="form-control" name="{{ \'lineItemName\' + $index }}" ng-model="lineItem.name" required>\n' +
        '                                                <div ng-show="bForm.$submitted || bForm[\'lineItemName\'+$index].$touched">\n' +
        '                                                    <div class="error" ng-show="bForm[\'lineItemName\'+$index].$error.required">填寫委刊項名稱</div>\n' +
        '                                                </div>\n' +
        '                                            </div>\n' +
        '                                        </div>\n' +
        '                                        <div class="form-group">\n' +
        '                                            <label class="control-label col-sm-2" for="{{ \'lineItemAdUnits\' + $index }}">廣告單元</label>\n' +
        '                                            <div class="col-sm-10">\n' +
        '                                                <select name="{{ \'lineItemAdUnits\' + $index }}" class="form-control"  ng-model="lineItem.adUnits" required>\n' +
        '                                                    <option ng-repeat="option in ganttData track by option.id " value="{{option.id}}" ng-selected="option.id === lineItem.adUnits">{{option.name}}</option>\n' +
        '                                                </select>\n' +
        '                                                <div ng-show="bForm.$submitted || bForm[\'lineItemAdUnits\'+ $index].$touched">\n' +
        '                                                    <div class="error" ng-show="bForm[\'lineItemAdUnits\'+ $index].$error.required">填寫廣告單元</div>\n' +
        '                                                </div>\n' +
        '                                            </div>\n' +
        '                                        </div>\n' +
        '                                        <div class="form-group">\n' +
        '                                            <label class="control-label col-sm-2" for="{{ \'lineItemFromDate\' + $index }}">開始時間</label>\n' +
        '                                            <div class="col-sm-10">\n' +
        '                                                <input type="text" class="form-control" name="{{ \'lineItemFromDate\' + $index }}" ng-model="lineItem.fromDate" min-date="today" max-date="{{ lineItem.toDate }}" start-date="{{ lineItem.currentDateValue.toString() }}" start-week="1" placeholder="From" bs-datepicker required>\n' +
        '                                                <div ng-show="bForm.$submitted || bForm[\'lineItemFromDate\'+$index].$touched">\n' +
        '                                                    <div class="error" ng-show="bForm[\'lineItemFromDate\'+$index].$error.required">填寫開始時間</div>\n' +
        '                                                </div>\n' +
        '                                            </div>\n' +
        '                                        </div>\n' +
        '                                        <div class="form-group">\n' +
        '                                            <label class="control-label col-sm-2" for="{{ \'lineItemToDate\' + $index }}">結束時間</label>\n' +
        '                                            <div class="col-sm-10">\n' +
        '                                                <input type="text" class="form-control" name="{{ \'lineItemToDate\' + $index }}" ng-model="lineItem.toDate" min-date="{{ lineItem.fromDate }}" start-date="{{ lineItem.currentDateValue.toString() }}" start-week="1" placeholder="To" bs-datepicker required>\n' +
        '                                                <div ng-show="bForm.$submitted || bForm[\'lineItemToDate\'+$index].$touched">\n' +
        '                                                    <div class="error" ng-show="bForm[\'lineItemToDate\'+$index].$error.required">填寫結束時間</div>\n' +
        '                                                </div>\n' +
        '                                            </div>\n' +
        '                                        </div>\n' +
        '                                        <div class="form-group">\n' +
        '                                            <div class="col-sm-10"></div>\n' +
        '                                            <div class="btn-group col-sm-2">\n' +
        '                                                <button type="button" style="float: right" class="btn btn-default" ng-click="handleReduceLineItem($index)">移除委刊項</button>\n' +
        '                                            </div>\n' +
        '                                        </div>\n' +
        '                                    </div>\n' +
        '                                </div>\n' +
        '                                <div class="btn-group">\n' +
        '                                    <button class="btn btn-default" type="button" ng-click="handleAddLineItem()">新增委刊項</button>\n' +
        '                                </div>\n' +
        '                            </div>\n' +
        '\n' +
        '                        </form>\n' +
        '                    </div>\n' +
        '                </div>\n' +
        '                <div class="modal-footer">\n' +
        '                <div class="form-actions">\n' +
        '                    <button id="handle-delete-booking" ng-if="bookingForm.isEdit" class="btn btn-danger" ng-click="handlePopoverConfirm(\'handleDeleteBooking\', $event)"><i class="glyphicon glyphicon-trash"></i>Delete</button>\n' +
        '                    <button class="btn btn-primary" type="submit" ng-click="handleSaveBooking()">儲存 Booking</button>\n' +
        '                    <button id="handle-sycing-dfp" ng-if="bookingForm.isEdit" class="btn btn-success" type="submit" ng-click="handlePopoverConfirm(\'handleSyncingToDFP\', $event)">同步到DFP</button>\n' +
        '                </div>\n' +
        '\n' +
        '\n' +
        '                    <!-- <button type="button" class="btn btn-default" ng-click="$hide()">Close</button> -->\n' +
        '                </div>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '    </div>\n' +
        '</div>\n' +
        '');
    $templateCache.put('../app/scripts/views/changeColorForm.tpl.html',
        '<div class="aside" tabindex="-1" role="dialog">\n' +
        '    <div class="aside-dialog">\n' +
        '        <div class="aside-content">\n' +
        '            <div class="aside-header" ng-show="title">\n' +
        '                <button type="button" class="close" ng-click="$hide()">&times;</button>\n' +
        '                <h4 class="aside-title" ng-bind-html="title"></h4>\n' +
        '            </div>\n' +
        '            <div class="aside-body" ng-show="changeColorModel">\n' +
        '                <form id="change-color-form" class="form-horizontal task-model" role="form">\n' +
        '                    <div class="row">\n' +
        '                        <div class="col-sm-12">\n' +
        '                            <div class="form-group">\n' +
        '                                <label class="control-label col-sm-3">委刊單:</label>\n' +
        '                                <div class="col-sm-8">\n' +
        '                                    <input type="text" class="form-control" value="{{ changeColorModel.orderName }}" disabled="disabled" />\n' +
        '                                </div>\n' +
        '                            </div>\n' +
        '                            <div class="form-group">\n' +
        '                                <label class="control-label col-sm-3">背景顏色:</label>\n' +
        '                                <div class="col-sm-8">\n' +
        '                                    <div class="input-group ">\n' +
        '                                        <span class="input-group-addon" ng-style="{\'background-color\':changeColorModel.color}">&nbsp;&nbsp;&nbsp;&nbsp;</span>\n' +
        '                                        <input type="text" class="form-control" colorpicker colorpicker-parent="true" ng-model="changeColorModel.color">\n' +
        '                                    </div>\n' +
        '                                </div>\n' +
        '                            </div>\n' +
        '                        </div>\n' +
        '                    </div>\n' +
        '                </form>\n' +
        '            </div>\n' +
        '            <div class="aside-footer">\n' +
        '                <div class="col-sm-11">\n' +
        '                    <button type="button" ng-click="taskSaveColor()" class="btn btn-primary">儲存顏色</button>\n' +
        '                    <button type="button" class="btn btn-default" ng-click="$hide()">取消編輯</button>\n' +
        '                </div>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '    </div>\n' +
        '</div>\n' +
        '');
    $templateCache.put('../app/scripts/views/confirmForm.tpl.html',
        '<div class="popover" tabindex="-1" ng-show="content">\n' +
        '  <div class="arrow"></div>\n' +
        '  <h3 class="popover-title" ng-bind-html="title" ng-show="title"></h3>\n' +
        '  <div class="popover-content">\n' +
        '    <form name="popoverForm">\n' +
        '      <p ng-bind-html="content" style="min-width:300px;"></p>\n' +
        '      <div class="form-actions">\n' +
        '        <button type="button" class="btn btn-danger" ng-click="$hide()">關閉</button>\n' +
        '        <button type="button" class="btn btn-primary" ng-click="saved($event)">儲存</button>\n' +
        '      </div>\n' +
        '    </form>\n' +
        '  </div>\n' +
        '</div>\n' +
        '');
    $templateCache.put('../app/scripts/views/oneGantt.tpl.html',
        '<div id="one-gantt" class="modal" tabindex="-1" role="dialog" ng-controller="OneGantt">\n' +
        '    <div class="modal-dialog">\n' +
        '        <div class="modal-content">\n' +
        '            <div class="is-loading-wrap" ng-if="options.isLoading">\n' +
        '                <div class="is-loading-box container-fluid">\n' +
        '                    <div class="row top-buffer">\n' +
        '                        <div class="col-md-12 modal-content">\n' +
        '                            <h4><i class="fa fa-cog fa-spin"></i>   讀取資料中</h4>\n' +
        '                            <div class="progress"><div class="progress-bar progress-bar-info progress-bar-striped active" role="progressbar" aria-valuenow="20" aria-valuemin="0" aria-valuemax="100" style="width: 100%"><span class="sr-only">Loading!</span></div></div>\n' +
        '                        </div>\n' +
        '                    </div>\n' +
        '                </div>\n' +
        '            </div>\n' +
        '            <div class="modal-header" ng-show="title">\n' +
        '                <button type="button" class="close" ng-click="$hide()">&times;</button>\n' +
        '                <h4 class="modal-title" ng-bind-html="title"></h4>\n' +
        '            </div>\n' +
        '            <div class="modal-body" ng-show="content">\n' +
        '                <div class="container-fluid">\n' +
        '                    <div class="row">\n' +
        '                        <div class="col-md-12">\n' +
        '                            <div class="form-inline">\n' +
        '                                <div class="form-group text-center">\n' +
        '                                    <label class="control-label"><i class="fa fa-calendar"></i> <i class="fa fa-arrows-h"></i> <i class="fa fa-calendar"></i>   時間區間</label><br>\n' +
        '                                    <div class="form-group">\n' +
        '                                        <input type="text" class="form-control" ng-model="options.fromDate" max-date="{{ ng(\'options.toDate\')}}" start-date="{{ ng(\'options.currentDateValue.toString()\')}}" start-week="1" placeholder="From" bs-datepicker>\n' +
        '                                    </div>\n' +
        '                                    <div class="form-group">\n' +
        '                                        <input type="text" class="form-control" ng-model="options.toDate" min-date="{{ ng(\'options.fromDate\')}}" start-date="{{ ng(\'options.currentDateValue.toString()\')}}" start-week="1" placeholder="To" bs-datepicker>\n' +
        '                                    </div>\n' +
        '                                </div>\n' +
        '                                <div class="form-group">\n' +
        '                                    <label class="control-label"><i class="fa fa-database"></i>  時間操作</label><br>\n' +
        '                                    <div class="btn-group">\n' +
        '                                        <button class="btn btn-default" ng-click="resetDate()">重設時間</button>\n' +
        '                                    </div>\n' +
        '                                </div>\n' +
        '                            </div>\n' +
        '                        </div>\n' +
        '                    </div>\n' +
        '                </div>\n' +
        '\n' +
        '                <div class="row top-buffer">\n' +
        '                    <div class="col-md-12">\n' +
        '                        <div class="panel-group" bs-collapse>\n' +
        '                            <div class="panel panel-default">\n' +
        '                                <div class="panel-collapse" bs-collapse-target>\n' +
        '                                    <div class="panel-body" class="panel panel-default position-fixed" data-target="menu-{{ ng(\'$index\') }}">\n' +
        '                                        <div gantt\n' +
        '                                             data="data"\n' +
        '                                             timespans="timespans"\n' +
        '                                             show-side="options.labelsEnabled"\n' +
        '                                             daily="options.daily"\n' +
        '                                             filter-task="{\'name\': options.filterTask}"\n' +
        '                                             filter-row="options.filterRow"\n' +
        '                                             sort-mode="options.sortMode"\n' +
        '                                             view-scale="options.scale"\n' +
        '                                             column-width="getColumnWidth(options.width, options.scale, options.zoom)"\n' +
        '                                             auto-expand="options.autoExpand"\n' +
        '                                             task-out-of-range="options.taskOutOfRange"\n' +
        '                                             from-date = "options.fromDate"\n' +
        '                                             to-date = "options.toDate"\n' +
        '                                             allow-side-resizing = "options.allowSideResizing"\n' +
        '                                             task-content = "options.taskContentEnabled ? options.taskContent : undefined"\n' +
        '                                             row-content = "options.rowContentEnabled ? options.rowContent : undefined"\n' +
        '                                             current-date="options.currentDate"\n' +
        '                                             current-date-value="options.currentDateValue"\n' +
        '                                             headers="options.width && options.shortHeaders || options.longHeaders"\n' +
        '                                             headers-formats="options.headersFormats"\n' +
        '                                             max-height="options.maxHeight && 300 || 0"\n' +
        '                                             time-frames="options.timeFrames"\n' +
        '                                             date-frames="options.dateFrames"\n' +
        '                                             time-frames-non-working-mode="options.timeFramesNonWorkingMode"\n' +
        '                                             time-frames-magnet="options.timeFramesMagnet"\n' +
        '                                             api="options.api"\n' +
        '                                             column-magnet="options.columnMagnet"\n' +
        '                                             >\n' +
        '                                            <gantt-tree enabled="options.sideMode === \'Tree\' || options.sideMode === \'TreeTable\'"\n' +
        '                                                        header-content="options.treeHeaderContent"\n' +
        '                                                        keep-ancestor-on-filter-row="true">\n' +
        '                                            </gantt-tree>\n' +
        '                                            <gantt-table enabled="options.sideMode === \'Table\' || options.sideMode === \'TreeTable\'"\n' +
        '                                                         columns="options.sideMode === \'TreeTable\' ? options.treeTableColumns : options.columns"\n' +
        '                                                         headers="options.columnsHeaders"\n' +
        '                                                         classes="options.columnsClasses"\n' +
        '                                                         formatters="options.columnsFormatters"\n' +
        '                                                         contents="options.columnsContents"\n' +
        '                                                         header-contents="options.columnsHeaderContents">\n' +
        '                                            </gantt-table>\n' +
        '                                            <gantt-tooltips content="options.tooltipsContent"></gantt-tooltips>\n' +
        '                                            <gantt-tooltips delay="100" content="options.tooltipsContent"></gantt-tooltips>\n' +
        '                                            <gantt-resize-sensor></gantt-resize-sensor>\n' +
        '                                        </div>\n' +
        '                                    </div>\n' +
        '                                </div>\n' +
        '                            </div>\n' +
        '                        </div>\n' +
        '                    </div>\n' +
        '                </div>\n' +
        '                <div class="modal-footer">\n' +
        '                    <button type="button" class="btn btn-default" ng-click="$hide()">Close</button>\n' +
        '                </div>\n' +
        '            </div>\n' +
        '        </div>\n' +
        '    </div>\n' +
        '</div>\n' +
        '');
}]);

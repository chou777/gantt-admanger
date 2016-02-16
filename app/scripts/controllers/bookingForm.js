'use strict';

/**
 * @ngdoc function
 * @name bhAdManager.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the bhAdManager
 */

angular.module('bhAdManager')
    .controller('bookingForm', ['$scope', '$timeout', '$log', 'moment', '$modal', '$http', '$alert', '$rootScope', '$filter', '$popover',
        function($scope, $timeout, $log, moment, $modal, $http, $alert, $rootScope, $filter, $popover) {
            var defaultLineItem = {
                id: undefined,
                name: undefined,
                adUnits: undefined,
                fromDate: undefined,
                toDate: undefined,
            };

            $scope.bookingForm = {
                orderId: undefined,
                isEdit: false,
                orderName: undefined,
                orderColor: undefined,
                lineItems: [],
            };


            var filterOrderLineItems = function() {
                var ganttData = $scope.ganttData;
                var tasks = [];
                var filterTask = {
                    orderId: $scope.editOrderData.orderId,
                }

                for (var i = 0; i < ganttData.length; i++) {
                    if (ganttData[i].tasks !== undefined && ganttData[i].tasks.length > 0) {
                        for (var j = 0; j < ganttData[i].tasks.length; j++) {
                            var task = angular.copy(ganttData[i].tasks[j]);
                            task.adUnitId = ganttData[i].id;
                            tasks.push(task);
                        };
                    }
                };
                return $filter('filter')(tasks, filterTask, undefined);
            }

            // Is Edit Form
            if ($scope.editOrderData !== undefined) {
                var filterLineItems = filterOrderLineItems();
                var lineItems = [];
                for (var i = 0; i < filterLineItems.length; i++) {
                    var item = angular.copy(defaultLineItem);
                    item.id = filterLineItems[i].id;
                    item.name = filterLineItems[i].lineItemName;
                    item.adUnits = filterLineItems[i].adUnitId;
                    item.fromDate = filterLineItems[i].from;
                    item.toDate = filterLineItems[i].to;
                    lineItems.push(item);
                };
                $scope.bookingForm = {
                    isEdit: true,
                    orderId: $scope.editOrderData.orderId,
                    orderName: $scope.editOrderData.orderName,
                    orderColor: $scope.editOrderData.color,
                    lineItems: lineItems,
                }

                $scope.popover = {title: '請確認是否刪除?', content: '確認是否刪除booking項目'};
                var asAServiceOptions = {
                    title: $scope.popover.title,
                    content: $scope.popover.content,
                    templateUrl: '../app/scripts/views/confirmForm.tpl.html',
                    trigger: 'manual',
                    placement: 'top'
                };
                $timeout(function() {
                    $scope.myPopover = $popover(angular.element(document.querySelector('#handle-delete-booking')), asAServiceOptions);
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
                    alert('必須至少一個委刊巷');
                }
            }

            $scope.handlePopoverConfirm = function(action, $event) {
                if ($scope.myPopover !== undefined) {
                    $scope.myPopover.$promise.then(function() {
                        $scope.myPopover.$scope.saved = function($event) {
                            $scope[action]();
                        };
                        $scope.myPopover.toggle();
                    });
                }
            };

            $scope.handleDeleteBooking = function() {
                $log.info('handleDeleteBooking');
                if (environment === 'TEST') {
                    $scope.$hide();
                    $rootScope.$emit('deleteBooking', {deleteOrderId: $scope.bookingForm.orderId, reload: false});
                } else {
                    deleteBooking();
                }
            };

            $scope.handleSaveBooking = function(){
                $log.info('handleSaveBooking');
                if (vaildationBookingForm($scope.bookingForm) !== false ){
                    if (environment === 'TEST') {
                        var newTaskDatas = [];
                        var orderId = uuid();
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
                                orderId: orderId,
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
                    alert('請檢查資料是否填寫正確');
                }
            }
            var saveBooking = function() {
                $http({
                    method: $scope.bookingForm.isEdit === true ? 'PUT': 'POST',
                    url: '/gantt/ajax/saveBooking',
                    data: $scope.bookingForm
                }).then(function(response) {
                    if (response.data.status === 'ok') {
                        $scope.$hide();
                        $rootScope.$emit('addTasks', {reload: true});
                    } else {
                        alert('Save Order Data Error');
                    }
                }, function(response) {
                     alert('Save Order Data Error');
                });
            }

            var deleteBooking = function() {
                $http({
                    method: 'DELETE',
                    url: '/gantt/ajax/deleteBooking',
                    data: $scope.bookingForm
                }).then(function(response) {
                    if (response.data.status === 'ok') {
                        $scope.$hide();
                        $rootScope.$emit('deleteBooking', {deleteOrderId: $scope.bookingForm.orderId, reload: false});
                    } else {
                        alert('Delete Order Data Error');
                    }
                }, function(response) {
                     alert('Delete Order Data Error');
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

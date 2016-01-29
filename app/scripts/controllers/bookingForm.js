'use strict';

/**
 * @ngdoc function
 * @name bhAdManager.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the bhAdManager
 */

angular.module('bhAdManager')
    .controller('bookingForm', ['$scope', '$timeout', '$log', 'moment', '$modal', '$http', '$alert', '$rootScope',
        function($scope, $timeout, $log, moment, $modal, $http, $alert, $rootScope) {
            var defaultLineItem = {
                name: undefined,
                adUnits: undefined,
                fromDate: undefined,
                toDate: undefined,
            };

            $scope.bookingForm = {
                orderName: undefined,
                orderColor: undefined,
                lineItems: [],
            };

            $scope.handleAddLineItem = function() {
                if ($scope.bForm !== undefined) {
                    $scope.bForm.$submitted = false;
                    $log.info($scope.bForm.lineItemAdUnits0);
                }
                $scope.bookingForm.lineItems.push(angular.copy(defaultLineItem));
            }

            $scope.handleReduceLineItem = function(index) {
                if ($scope.bookingForm.lineItems.length > 1) {
                    $scope.bookingForm.lineItems.splice(index, 1);
                } else {
                }
            }

            $scope.handleSaveBooking = function(){
                $log.info('handleSaveBooking', $scope.bookingForm);
                if (vaildationBookingForm($scope.bookingForm) !== false ){
                    $log.info('vaildation is ok');
                    var newTaskDatas = [];
                    var order_id = uuid();
                    for (var i = 0; i < $scope.bookingForm.lineItems.length; i++) {
                        $log.info($scope.bookingForm.lineItems[i]);
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
                            order_id: order_id,
                            tooltipsContent: []
                        }
                        newTaskDatas.push(taskData);
                    }
                    var args = {
                        taskDatas: newTaskDatas
                    }
                    console.log(args);
                    if (environment === 'TEST') {
                        $rootScope.$emit('addTasks', args);
                        $scope.$hide();
                    } else {
                        $http({
                            method: 'GET',
                            url: '/gantt/ajax/saveOrder',
                            data: newTaskDatas
                        }).then(function(response) {
                            if (response.data.status === 'ok') {
                                $rootScope.$emit('addTasks', args);
                            } else {
                                alert('Save Order Data Error');
                            }
                        }, function(response) {
                             alert('Save Order Data Error');
                        });
                    }
                }
            }
            var random4 = function() {
                return Math.floor(Math.random() * 10).toString(10);
            }
            var uuid = function() {
                return random4() + random4() + random4() + random4() +
                    random4() + random4() + random4() + random4() + random4() + random4();
            }

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
            }

            if ($scope.bookingForm.lineItems.length === 0) {
                $scope.handleAddLineItem();
            }
    }]);

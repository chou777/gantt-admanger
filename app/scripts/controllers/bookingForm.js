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

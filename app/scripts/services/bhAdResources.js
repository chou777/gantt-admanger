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
            getTraffickerUsers: function() {
                return $http({
                    url: '/dfp/users',
                    method: 'GET',
                    responseType: 'json',
                    timeout: 5000,
                });
            },
            getCompanies: function(params) {
                return $http({
                    url: '/dfp/companies',
                    method: 'GET',
                    responseType: 'json',
                    timeout: 5000,
                    params: params
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

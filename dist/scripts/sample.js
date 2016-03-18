'use strict';

/**
 * @ngdoc service
 * @name bhAdManager.Sample
 * @description
 * # Sample
 * Service in the bhAdManager.
 */
angular.module('bhAdManager')
    .service('Sample', ['$http', '$log', function Sample($http, $log) {
        return {
            getSampleData: function() {
                return $http({
                    url: '/data/data.json',
                    type: 'get',
                    responseType: 'json',
                    timeout: 1000,
                });
            },
            getSampleOrder: function() {
                return $http({
                    url: '/data/order.json',
                    type: 'get',
                    responseType: 'json',
                    timeout: 1000,
                });
            },
            getSampleBooking: function() {
                return $http({
                    url: '/data/booking.json',
                    type: 'get',
                    responseType: 'json',
                    timeout: 1000,
                });
            },
            getSamplatUsers: function() {
                return $http({
                    url: '/data/users.json',
                    type: 'get',
                    responseType: 'json',
                    timeout: 1000,
                });
            },
            getSampleCompanies: function() {
                return $http({
                    url: '/data/companies.json',
                    type: 'get',
                    responseType: 'json',
                    timeout: 1000,
                });
            }
        };
    }])
;

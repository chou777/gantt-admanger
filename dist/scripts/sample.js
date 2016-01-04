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
        };
    }])
;

'use strict';


angular.module('dfpDateFormat', []).filter('dfpDate', function() {
    return function(input, format) {
        var date = input.date.year + '-' + input.date.month + '-' + input.date.day;
        date = date + ' ' + input.hour + ':' + input.minute + ':'+ input.second;
        return moment( new Date(date)).format(format);
    };
});

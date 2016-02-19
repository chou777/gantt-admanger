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

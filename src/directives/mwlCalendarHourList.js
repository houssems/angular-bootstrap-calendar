'use strict';

var angular = require('angular');
var calendarUtils = require('calendar-utils');

angular
  .module('mwl.calendar')
  .controller('MwlCalendarHourListCtrl', function($scope, moment, calendarHelper, calendarConfig, $attrs) {
    var vm = this;

    vm.horizontalView = $attrs.view && $attrs.view === 'day' && !calendarConfig.dayView.verticalView;

    if (vm.horizontalView) {
      vm.dayTimeWidth = calendarHelper.getDayWidth(vm.dayViewStart, vm.dayViewEnd);
      vm.hourWidth = calendarConfig.dayView.hourWidth;
    }

    vm.todayTimePosition = calendarHelper.getTodayWeekPosition(vm.dayViewSplit, vm.viewDate, vm.dayViewStart, vm.dayViewEnd);
    function updateDays() {

      vm.showWeekTimeisNow = $attrs.view && $attrs.view === 'week' && calendarConfig.weekView.showNowBar && moment().isSame(vm.viewDate, 'day');
      vm.dayViewSplit = parseInt(vm.dayViewSplit);
      var dayStart = (vm.dayViewStart || '00:00').split(':');
      var dayEnd = (vm.dayViewEnd || '23:59').split(':');
      vm.hourGrid = calendarUtils.getDayViewHourGrid({
        viewDate: calendarConfig.showTimesOnWeekView ? moment(vm.viewDate).startOf('week').toDate() : moment(vm.viewDate).toDate(),
        hourSegments: 60 / vm.dayViewSplit,
        dayStart: {
          hour: dayStart[0],
          minute: dayStart[1]
        },
        dayEnd: {
          hour: dayEnd[0],
          minute: dayEnd[1]
        }
      });

      vm.hourGrid.forEach(function(hour) {
        hour.segments.forEach(function(segment) {

          segment.date = moment(segment.date);

          if (calendarConfig.showTimesOnWeekView) {

            segment.days = [];

            for (var i = 0; i < 7; i++) {
              var day = {
                date: moment(segment.date).add(i, 'days')
              };
              vm.cellModifier({calendarCell: day});
              segment.days.push(day);
            }

          } else {
            vm.cellModifier({calendarCell: segment});
          }
        });
      });

    }

    var originalLocale = moment.locale();

    $scope.$on('calendar.refreshView', function() {

      if (originalLocale !== moment.locale()) {
        originalLocale = moment.locale();
        updateDays();
      }

    });

    $scope.$watchGroup([
      'vm.dayViewStart',
      'vm.dayViewEnd',
      'vm.dayViewSplit',
      'vm.viewDate'
    ], function() {
      updateDays();
    });

    vm.eventDropped = function(event, date) {
      var newStart = moment(date);
      var newEnd = calendarHelper.adjustEndDateFromStartDiff(event.startsAt, newStart, event.endsAt);

      vm.onEventTimesChanged({
        calendarEvent: event,
        calendarDate: date,
        calendarNewEventStart: newStart.toDate(),
        calendarNewEventEnd: newEnd ? newEnd.toDate() : null
      });
    };

    vm.getClickedDate = function(baseDate, minutes, days) {
      return moment(baseDate).clone().startOf('hour').add(minutes, 'minutes').add(days || 0, 'days').toDate();
    };

    vm.onDragSelectStart = function(date, dayIndex) {
      if (!vm.dateRangeSelect) {
        vm.dateRangeSelect = {
          active: true,
          startDate: date,
          endDate: date,
          dayIndex: dayIndex
        };
      }
    };

    vm.onDragSelectMove = function(date) {
      if (vm.dateRangeSelect) {
        vm.dateRangeSelect.endDate = date;
      }
    };

    vm.onDragSelectEnd = function(date) {
      if (vm.dateRangeSelect) {
        vm.dateRangeSelect.endDate = date;
        if (vm.dateRangeSelect.endDate > vm.dateRangeSelect.startDate) {
          vm.onDateRangeSelect({calendarRangeStartDate: vm.dateRangeSelect.startDate, calendarRangeEndDate: vm.dateRangeSelect.endDate});
        }
        delete vm.dateRangeSelect;
      }
    };

  })
  .directive('mwlCalendarHourList', function() {

    return {
      restrict: 'E',
      template: '<div mwl-dynamic-directive-template name="calendarHourList" overrides="vm.customTemplateUrls"></div>',
      controller: 'MwlCalendarHourListCtrl as vm',
      scope: {
        viewDate: '=',
        view: '@',
        dayViewStart: '=',
        dayViewEnd: '=',
        dayViewSplit: '=',
        dayWidth: '=?',
        onTimespanClick: '=',
        onDateRangeSelect: '=',
        onEventTimesChanged: '=',
        customTemplateUrls: '=?',
        cellModifier: '=',
        templateScope: '='
      },
      bindToController: true
    };

  });

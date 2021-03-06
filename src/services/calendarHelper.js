'use strict';

var angular = require('angular');
var calendarUtils = require('calendar-utils');

angular
  .module('mwl.calendar')
  .factory('calendarHelper', function($q, $templateRequest, dateFilter, moment, calendarConfig) {

    function formatDate(date, format) {
      if (calendarConfig.dateFormatter === 'angular') {
        return dateFilter(moment(date).toDate(), format);
      } else if (calendarConfig.dateFormatter === 'moment') {
        return moment(date).format(format);
      } else {
        throw new Error('Unknown date formatter: ' + calendarConfig.dateFormatter);
      }
    }

    function adjustEndDateFromStartDiff(oldStart, newStart, oldEnd) {
      if (!oldEnd) {
        return oldEnd;
      }
      var diffInSeconds = moment(newStart).diff(moment(oldStart));
      return moment(oldEnd).add(diffInSeconds);
    }

    function getRecurringEventPeriod(eventPeriod, recursOn, containerPeriodStart) {

      var eventStart = moment(eventPeriod.start);
      var eventEnd = moment(eventPeriod.end);
      var periodStart = moment(containerPeriodStart);

      if (recursOn) {

        switch (recursOn) {
          case 'year':
            eventStart.set({
              year: periodStart.year()
            });
            break;

          case 'month':
            eventStart.set({
              year: periodStart.year(),
              month: periodStart.month()
            });
            break;

          default:
            throw new Error('Invalid value (' + recursOn + ') given for recurs on. Can only be year or month.');
        }

        eventEnd = adjustEndDateFromStartDiff(eventPeriod.start, eventStart, eventEnd);

      }

      return {start: eventStart, end: eventEnd};

    }

    function eventIsInPeriod(event, periodStart, periodEnd) {

      periodStart = moment(periodStart);
      periodEnd = moment(periodEnd);

      var eventPeriod = getRecurringEventPeriod({start: event.startsAt, end: event.endsAt || event.startsAt}, event.recursOn, periodStart);
      var eventStart = eventPeriod.start;
      var eventEnd = eventPeriod.end;

      return (eventStart.isAfter(periodStart) && eventStart.isBefore(periodEnd)) ||
        (eventEnd.isAfter(periodStart) && eventEnd.isBefore(periodEnd)) ||
        (eventStart.isBefore(periodStart) && eventEnd.isAfter(periodEnd)) ||
        eventStart.isSame(periodStart) ||
        eventEnd.isSame(periodEnd);

    }

    function filterEventsInPeriod(events, startPeriod, endPeriod) {
      return events.filter(function(event) {
        return eventIsInPeriod(event, startPeriod, endPeriod);
      });
    }

    function getEventsInPeriod(calendarDate, period, allEvents) {
      var startPeriod = moment(calendarDate).startOf(period);
      var endPeriod = moment(calendarDate).endOf(period);
      return filterEventsInPeriod(allEvents, startPeriod, endPeriod);
    }

    function getBadgeTotal(events) {
      return events.filter(function(event) {
        return event.incrementsBadgeTotal !== false;
      }).length;
    }

    function getWeekDayNames() {
      var weekdays = [];
      var count = 0;
      while (count < 7) {
        weekdays.push(formatDate(moment().weekday(count++), calendarConfig.dateFormats.weekDay));
      }
      return weekdays;
    }

    function getYearView(events, viewDate, cellModifier) {

      var view = [];
      var eventsInPeriod = getEventsInPeriod(viewDate, 'year', events);
      var month = moment(viewDate).startOf('year');
      var count = 0;
      while (count < 12) {
        var startPeriod = month.clone();
        var endPeriod = startPeriod.clone().endOf('month');
        var periodEvents = filterEventsInPeriod(eventsInPeriod, startPeriod, endPeriod);
        var cell = {
          label: formatDate(startPeriod, calendarConfig.dateFormats.month),
          isToday: startPeriod.isSame(moment().startOf('month')),
          events: periodEvents,
          date: startPeriod,
          badgeTotal: getBadgeTotal(periodEvents)
        };

        cellModifier({calendarCell: cell});
        view.push(cell);
        month.add(1, 'month');
        count++;
      }

      return view;

    }

    function getMonthView(events, viewDate, cellModifier) {

      // hack required to work with the calendar-utils api
      events.forEach(function(event) {
        event.start = event.startsAt;
        event.end = event.endsAt;
      });

      var view = calendarUtils.getMonthView({
        events: events,
        viewDate: viewDate,
        weekStartsOn: moment().startOf('week').day()
      });

      view.days = view.days.map(function(day) {
        day.date = moment(day.date);
        day.label = day.date.date();
        day.badgeTotal = getBadgeTotal(day.events);
        if (!calendarConfig.displayAllMonthEvents && !day.inMonth) {
          day.events = [];
        }
        cellModifier({calendarCell: day});
        return day;
      });

      // remove hack
      events.forEach(function(event) {
        delete event.start;
        delete event.end;
      });

      return view;

    }

    function getWeekView(events, viewDate) {

      var days = calendarUtils.getWeekViewHeader({
        viewDate: viewDate,
        weekStartsOn: moment().startOf('week').day()
      }).map(function(day) {
        day.date = moment(day.date);
        day.weekDayLabel = formatDate(day.date, calendarConfig.dateFormats.weekDay);
        day.dayLabel = formatDate(day.date, calendarConfig.dateFormats.day);
        return day;
      });

      var startOfWeek = moment(viewDate).startOf('week');
      var endOfWeek = moment(viewDate).endOf('week');

      var eventRows = calendarUtils.getWeekView({
        viewDate: viewDate,
        weekStartsOn: moment().startOf('week').day(),
        events: filterEventsInPeriod(events, startOfWeek, endOfWeek).map(function(event) {

          var weekViewStart = moment(startOfWeek).startOf('day');

          var eventPeriod = getRecurringEventPeriod({
            start: moment(event.startsAt),
            end: moment(event.endsAt || event.startsAt).add(1, 'second')
          }, event.recursOn, weekViewStart);

          eventPeriod.originalEvent = event;

          return eventPeriod;

        })
      }).map(function(eventRow) {

        eventRow.row = eventRow.row.map(function(rowEvent) {
          rowEvent.event = rowEvent.event.originalEvent;
          return rowEvent;
        });

        return eventRow;

      });

      return {days: days, eventRows: eventRows};

    }

    function getDayView(events, viewDate, dayViewStart, dayViewEnd, dayViewSplit) {

      var dayStart = (dayViewStart || '00:00').split(':');
      var dayEnd = (dayViewEnd || '23:59').split(':');

      var view = calendarUtils.getDayView({
        events: events.map(function(event) { // hack required to work with event API
          event.start = event.startsAt;
          event.end = event.endsAt;
          return event;
        }),
        viewDate: viewDate,
        hourSegments: 60 / dayViewSplit,
        dayStart: {
          hour: dayStart[0],
          minute: dayStart[1]
        },
        dayEnd: {
          hour: dayEnd[0],
          minute: dayEnd[1]
        },
        eventWidth: 150,
        segmentHeight: 30
      });

      // remove hack to work with new event API
      events.forEach(function(event) {
        delete event.start;
        delete event.end;
      });

      return view;

    }

    function getEventsWidth(events, dayViewStart, dayViewEnd) {

      var minuteWidth = calendarConfig.dayView.hourWidth / 60;
      var divCenter = calendarConfig.dayView.hourWidth / 2;

      return events.map(function(event) {

        var startDay = moment(dayViewStart || '00:00', 'HH:mm');
        var dayInMinutes = moment(dayViewEnd || '23:59', 'HH:mm').diff(startDay, 'minutes');

        var startEvent = moment(event.event.startsAt).format('HH:mm');
        startEvent = moment(startEvent, 'HH:mm');

        var endEvent = moment(event.event.endsAt).format('HH:mm');
        endEvent = moment(endEvent, 'HH:mm');

        var diff = startEvent.diff(startDay, 'minutes');

        event.left = (diff <= 0) ? 0 : (diff * minuteWidth + divCenter);

        var width = endEvent.diff(startEvent, 'minutes');

        if (diff + width > dayInMinutes) {
          width = dayInMinutes - diff;
        }

        event.width = (width * minuteWidth);

        return event;
      });
    }

    function getDayWidth(dayViewStart, dayViewEnd) {
      var startDay = moment(dayViewStart || '00:00', 'HH:mm');
      var dayInHours = moment(dayViewEnd || '23:59', 'HH:mm').diff(startDay, 'hours') + 1;

      var hour = calendarConfig.dayView.hourWidth;
      return dayInHours * hour;

    }

    function getAttendeeList(events) {

      var results = [];

      events.forEach(function(event) {
        if (results.indexOf(event.event.eventAssigned) === -1) {
          results.push(event.event.eventAssigned);
        }
      });

      return results;
    }

    function getTodayWeekPosition(dayViewSplit, viewDate, dayViewStart, dayViewEnd) {

      if (moment().isSame(viewDate, 'day')) {

        // get day time limit
        var dayViewStartM = moment(dayViewStart || '00:00', 'HH:mm');
        var dayViewEndM = moment(dayViewEnd || '23:59', 'HH:mm');

        var numberOfDivs = 60 / dayViewSplit,
          blockHeight = numberOfDivs * 30; // 30px

        var oneMinute = blockHeight / 60;

        // get minutes between startOfDay and time selected
        var diff = moment(viewDate).diff(dayViewStartM, 'minutes'),
          checkEndDayLimit = moment(viewDate).isBefore(dayViewEndM, 'minutes');

        if (diff > 0 && checkEndDayLimit) {
          return diff * oneMinute;
        }

      }

      return -1;
    }

    function getTodayPosition(daySelected, dayViewStart, dayViewEnd) {

      if (moment().isSame(daySelected, 'day')) {

        // get day time limit
        var dayViewStartM = moment(dayViewStart || '00:00', 'HH:mm');
        var dayViewEndM = moment(dayViewEnd || '23:59', 'HH:mm');

        // get minute width
        var minuteWidth = calendarConfig.dayView.hourWidth / 60,
          divCenter = calendarConfig.dayView.hourWidth / 2;

        // get minutes between startOfDay and time selected
        var diff = moment(daySelected).diff(dayViewStartM, 'minutes'),
          checkEndDayLimit = moment(daySelected).isBefore(dayViewEndM, 'minutes');

        if (diff > 0 && checkEndDayLimit) {
          return diff * minuteWidth + divCenter;
        }
      }

      return -1;
    }

    function getWeekViewWithTimes(events, viewDate, dayViewStart, dayViewEnd, dayViewSplit) {
      var weekView = getWeekView(events, viewDate);
      var newEvents = [];
      var flattenedEvents = [];
      weekView.eventRows.forEach(function(row) {
        row.row.forEach(function(eventRow) {
          flattenedEvents.push(eventRow.event);
        });
      });
      weekView.days.forEach(function(day) {
        var dayEvents = flattenedEvents.filter(function(event) {
          return moment(event.startsAt).startOf('day').isSame(moment(day.date).startOf('day'));
        });
        var newDayEvents = getDayView(
          dayEvents,
          day.date,
          dayViewStart,
          dayViewEnd,
          dayViewSplit
        ).events;
        newEvents = newEvents.concat(newDayEvents);
      });
      weekView.eventRows = [{
        row: newEvents.map(function(dayEvent) {
          var event = dayEvent.event;
          return {
            event: event,
            top: dayEvent.top,
            height: dayEvent.height,
            offset: calendarUtils.getWeekViewEventOffset(
              {start: event.startsAt, end: event.endsAt},
              moment(viewDate).startOf('week')
            )
          };
        })
      }];
      return weekView;
    }

    function getDayViewHeight(dayViewStart, dayViewEnd, dayViewSplit) {
      var dayViewStartM = moment(dayViewStart || '00:00', 'HH:mm');
      var dayViewEndM = moment(dayViewEnd || '23:59', 'HH:mm');
      var hourHeight = (60 / dayViewSplit) * 30;
      return ((dayViewEndM.diff(dayViewStartM, 'minutes') / 60) * hourHeight) + 3;
    }

    function loadTemplates() {

      var templatePromises = Object.keys(calendarConfig.templates).map(function(key) {
        var templateUrl = calendarConfig.templates[key];
        return $templateRequest(templateUrl);
      });

      return $q.all(templatePromises);

    }

    return {
      getWeekDayNames: getWeekDayNames,
      getYearView: getYearView,
      getMonthView: getMonthView,
      getWeekView: getWeekView,
      getDayView: getDayView,
      getWeekViewWithTimes: getWeekViewWithTimes,
      getDayViewHeight: getDayViewHeight,
      adjustEndDateFromStartDiff: adjustEndDateFromStartDiff,
      formatDate: formatDate,
      loadTemplates: loadTemplates,
      eventIsInPeriod: eventIsInPeriod, //expose for testing only
      getAttendeeList: getAttendeeList,
      getEventsWidth: getEventsWidth,
      getTodayPosition: getTodayPosition,
      getTodayWeekPosition: getTodayWeekPosition,
      getDayWidth: getDayWidth
    };

  });

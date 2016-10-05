angular
  .module('mwl.calendar.docs') //you will need to declare your module with the dependencies ['mwl.calendar', 'ui.bootstrap', 'ngAnimate']
  .config(function (calendarConfig) {
    calendarConfig.dayView.hasAttendee = true;
    calendarConfig.dayView.verticalView = false;
    calendarConfig.dayView.attendeeBlockHeight = 60;
    calendarConfig.dayView.eventHeight = 50;

  })
  .controller('KitchenSinkCtrl', function(moment, alert, calendarConfig) {

    var vm = this;

    //These variables MUST be set as a minimum for the calendar to work
    vm.calendarView = 'day';
    vm.viewDate = new Date();
    var actions = [{
      label: '<i class=\'glyphicon glyphicon-pencil\'></i>',
      onClick: function(args) {
        alert.show('Edited', args.calendarEvent);
      }
    }, {
      label: '<i class=\'glyphicon glyphicon-remove\'></i>',
      onClick: function(args) {
        alert.show('Deleted', args.calendarEvent);
      }
    }];
    vm.events = [
      {
        title: 'Jule Vilard',
        color: calendarConfig.colorTypes.warning,
        startsAt: moment().startOf('day').hour(1).minute(20).toDate(),
        endsAt: moment().startOf('day').hour(2).minute(40).toDate(),
        draggable: true,
        resizable: true,
        actions: actions,
        eventAssigned: 'Ghassen',
        class: 'bgOne'
      }, {
        title: 'Lucienne Dumond',
        color: calendarConfig.colorTypes.info,
        startsAt: moment().startOf('day').hour(3).toDate(),
        endsAt: moment().startOf('day').hour(5).minute(26).toDate(),
        draggable: true,
        resizable: true,
        actions: actions,
        eventAssigned: 'Ghassen',
        class: 'bgTwo'
      }, {
        title: 'Louis Renaud'
        color: calendarConfig.colorTypes.important,
        startsAt: moment().startOf('day').hour(4).toDate(),
        endsAt: moment().startOf('day').hour(5).minute(26).toDate(),
        recursOn: 'year',
        draggable: true,
        resizable: true,
        actions: actions,
        eventAssigned: 'Houssem',
        class: 'bgthree'
      }
    ];

    vm.cellIsOpen = true;

    vm.addEvent = function() {
      vm.events.push({
        title: 'New event',
        startsAt: moment().startOf('day').toDate(),
        endsAt: moment().endOf('day').toDate(),
        color: calendarConfig.colorTypes.important,
        draggable: true,
        resizable: true
      });
    };

    vm.eventClicked = function(event) {
      alert.show('Clicked', event);
    };

    vm.eventEdited = function(event) {
      alert.show('Edited', event);
    };

    vm.eventDeleted = function(event) {
      alert.show('Deleted', event);
    };

    vm.eventTimesChanged = function(event) {
      alert.show('Dropped or resized', event);
    };

    vm.toggle = function($event, field, event) {
      $event.preventDefault();
      $event.stopPropagation();
      event[field] = !event[field];
    };

    vm.timespanClicked = function(date, cell) {

      if (vm.calendarView === 'month') {
        if ((vm.cellIsOpen && moment(date).startOf('day').isSame(moment(vm.viewDate).startOf('day'))) || cell.events.length === 0 || !cell.inMonth) {
          vm.cellIsOpen = false;
        } else {
          vm.cellIsOpen = true;
          vm.viewDate = date;
        }
      } else if (vm.calendarView === 'year') {
        if ((vm.cellIsOpen && moment(date).startOf('month').isSame(moment(vm.viewDate).startOf('month'))) || cell.events.length === 0) {
          vm.cellIsOpen = false;
        } else {
          vm.cellIsOpen = true;
          vm.viewDate = date;
        }
      }

    };

  });

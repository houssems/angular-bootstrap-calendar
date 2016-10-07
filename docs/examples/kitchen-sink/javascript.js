angular
  .module('mwl.calendar.docs') //you will need to declare your module with the dependencies ['mwl.calendar', 'ui.bootstrap', 'ngAnimate']
  .config(function (calendarConfig) {

    calendarConfig.dateFormatter = 'moment';
    calendarConfig.dayView.hasAttendee = true;
    calendarConfig.dayView.verticalView = false;
    calendarConfig.dayView.attendeeBlockHeight = 85;
    calendarConfig.dayView.eventHeight = 80;
    calendarConfig.dayView.showNowBar = true;
    calendarConfig.weekView.showNowBar = true;
    calendarConfig.weekView.uniqueEvents = true;
    calendarConfig.showTimesOnWeekView = true;

  })
  .controller('KitchenSinkCtrl', function(moment, alert, calendarConfig, $ocLazyLoad, $window) {

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

    $window.moment = $window.moment || moment;
    $ocLazyLoad.load('https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.10.6/locale/fr.js').then(function() {
      moment.locale('fr', {
        week: {
          dow: 1 // Monday is the first day of the week
        }
      });
      moment.locale('fr'); // change the locale to french
    });

    vm.events = [
      {
        title: 'Jule Vilard',
        phoneNumber: '06 10 10 11 19',
        color: {primary: '#88c75a'},
        startsAt: moment().startOf('day').hour(4).minute(0).toDate(),
        endsAt: moment().startOf('day').hour(5).minute(15).toDate(),
        draggable: true,
        resizable: true,
        actions: actions,
        eventAssigned: 'Ghassen',
        // cssClass: 'bgOne'
      }, {
        title: 'Lucienne Dumond',
        phoneNumber: '06 10 10 11 19',
        color: {primary: '#736ae4'},
        startsAt: moment().startOf('day').hour(6).toDate(),
        endsAt: moment().startOf('day').hour(7).minute(26).toDate(),
        draggable: true,
        resizable: true,
        actions: actions,
        eventAssigned: 'Ghassen',
        // cssClass: 'bgTwo'
      }, {
        title: 'Louis Renaud',
        phoneNumber: '06 10 10 11 19',
        color: {primary: '#f7941e'},
        startsAt: moment().startOf('day').hour(8).minute(15).toDate(),
        endsAt: moment().startOf('day').hour(10).minute(10).toDate(),
        recursOn: 'year',
        draggable: true,
        resizable: true,
        actions: actions,
        eventAssigned: 'Houssem',
        // cssClass: 'bgthree'
      }
    ];

    console.log(moment().startOf('day').hour(4).toDate());

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

'use strict';

angular.module('myApp.view1', ['ngRoute'])

.config(['$routeProvider', function($routeProvider) {
  $routeProvider.when('/view1', {
    templateUrl: 'view1/view1.html',
    controller: 'View1Ctrl'
  });
}])

    .config(function(calendarConfig) {

      console.log(calendarConfig); //view all available config

      calendarConfig.templates.calendarHourList = 'calendar/views/calendarHourList.html'; //change the month view template globally to a custom template
      calendarConfig.templates.calendarDayView = 'calendar/views/calendarDayView.html'; //change the month view template globally to a custom template

      calendarConfig.dateFormatter = 'moment'; //use either moment or angular to format dates on the calendar. Default angular. Setting this will override any date formats you have already set.

      calendarConfig.allDateFormats.moment.date.hour = 'HH:mm'; //this will configure times on the day view to display in 24 hour format rather than the default of 12 hour

      calendarConfig.allDateFormats.moment.title.day = 'ddd D MMM'; //this will configure the day view title to be shorter

      calendarConfig.i18nStrings.weekNumber = 'Week {week}'; //This will set the week number hover label on the month view

      calendarConfig.displayAllMonthEvents = true; //This will display all events on a month view even if they're not in the current month. Default false.

      calendarConfig.showTimesOnWeekView = true; //Make the week view more like the day view, with the caveat that event end times are ignored.

    })

.controller('View1Ctrl', [ '$scope', function($scope) {

  $scope.calendarView = 'day';
  $scope.events = [{
    title: 'My event title', // The title of the event
    startsAt: new Date(), // A javascript date object for when the event starts
    endsAt: new Date(2016,10,3,15), // Optional - a javascript date object for when the event ends
    color: { // can also be calendarConfig.colorTypes.warning for shortcuts to the deprecated event types
      primary: '#e3bc08', // the primary event color (should be darker than secondary)
      secondary: '#fdf1ba' // the secondary event color (should be lighter than primary)
    },
    actions: [{ // an array of actions that will be displayed next to the event title
      label: '<i class=\'glyphicon glyphicon-pencil\'></i>', // the label of the action
      cssClass: 'edit-action', // a CSS class that will be added to the action element so you can implement custom styling
      onClick: function(args) { // the action that occurs when it is clicked. The first argument will be an object containing the parent event
        console.log('Edit event', args.calendarEvent);
      }
    }],
    draggable: true, //Allow an event to be dragged and dropped
    resizable: true, //Allow an event to be resizable
    incrementsBadgeTotal: true, //If set to false then will not count towards the badge total amount on the month and year view
    recursOn: 'year', // If set the event will recur on the given period. Valid values are year or month
    cssClass: 'a-css-class-name', //A CSS class (or more, just separate with spaces) that will be added to the event when it is displayed on each view. Useful for marking an event as selected / active etc
    allDay: false, // set to true to display the event as an all day event on the day view
    eventAssigned: 'Houssem'
  }];

  $scope.viewDate = new Date();
}]);
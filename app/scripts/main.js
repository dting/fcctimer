'use strict';

var app = angular.module('PomodoroApp', ['ngMaterial']);
app.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('green')
    .accentPalette('red')
    .warnPalette('yellow');
});

app.controller('AppCtrl', function($scope, $interval, Hexagons) {
  var vm = this;
  vm.session = 30;
  vm.break = 5;
  vm.currentTimer = 'session';
  vm.timeRemaining = moment.duration(vm.session, 'minutes');

  Hexagons.create(200, 200, 180).attr({
    stroke: "#888",
    strokeWidth: 20
  });

  var outerHexagon = Hexagons.create(200, 200, 180).attr({
    fill: "#b0b0b0",
    stroke: "#90a959",
    strokeWidth: 10
  });

  // Rotating inner hexagon
  var innerHexagon = Hexagons.create(200, 200, 100).attr({
    fill: "#d0d0d0",
    stroke: "#90a959",
    strokeWidth: 10,
    opacity: 0.75
  });
  Hexagons.infRotate(innerHexagon);

  $scope.$watch('vm.session', function(newVal) {
    vm.timeRemaining = moment.duration(newVal, 'minutes');
  });

  vm.start = function() {
    vm.started = true;
    vm.timer = startTimer();
  };

  vm.resume = function() {
    vm.timer = startTimer();
  };

  function startTimer() {
    vm.running = true;
    outerHexagon.animateCountdown(vm.timeRemaining.valueOf());
    return $interval(function() {
      vm.timeRemaining.subtract(100, 'ms');
    }, 100);
  }

  vm.cancel = function() {
    vm.started = false;
    stopTimer();
    outerHexagon.attr({
      'stroke-dashoffset': 0,
      'stroke': '#90a959'
    });
    innerHexagon.attr({'stroke': '#90a959'});
    vm.timeRemaining = moment.duration(vm.session, 'minutes');
  };

  vm.pause = function() {
    stopTimer();
  };

  function stopTimer() {
    vm.running = false;
    $interval.cancel(vm.timer);
    outerHexagon.stop();
  }

  var time = Snap('#svg').text(200, 225, []).attr({
    'text-anchor': 'middle',
    'font-size': '50px'
  });

  $scope.$watch('vm.timeRemaining.valueOf()', function(newVal) {
    var fmt;
    if (newVal < 60000) {
      fmt = "ss.SS";
    } else if (newVal < 3600000) {
      fmt = "mm:ss";
    } else {
      fmt = "HH:mm:ss";
    }
    time.attr({text: moment.utc(newVal).format(fmt)});
    if (!newVal) {
      stopTimer();
      $scope.$evalAsync(startNextTimer);
    }
  });

  function startNextTimer() {
    vm.currentTimer = vm.currentTimer === 'session' ? 'break' : 'session';

    var stroke = vm.currentTimer === 'session' ? '#90a959' : '#ac4142';
    outerHexagon.stop();
    outerHexagon.attr({
      'stroke-dashoffset': 0,
      'stroke': stroke
    });
    innerHexagon.attr({stroke: stroke});

    vm.timeRemaining = moment.duration(vm[vm.currentTimer], 'minutes');
    vm.timer = startTimer();
  }
});

app.factory('Hexagons', function() {
  var s = Snap('#svg');

  // http://www.thelow.co.uk/?p=128
  function hexagonPath(x, y, r) {
    var x1 = x;
    var y1 = y - r;
    var x2 = x + (Math.cos(Math.PI / 6) * r);
    var y2 = y - (Math.sin(Math.PI / 6) * r);
    var x3 = x + (Math.cos(Math.PI / 6) * r);
    var y3 = y + (Math.sin(Math.PI / 6) * r);
    var x4 = x;
    var y4 = y + r;
    var x5 = x - (Math.cos(Math.PI / 6) * r);
    var y5 = y + (Math.sin(Math.PI / 6) * r);
    var x6 = x - (Math.cos(Math.PI / 6) * r);
    var y6 = y - (Math.sin(Math.PI / 6) * r);

    return "M" + x1 + " " + y1 +
           " L" + x2 + " " + y2 +
           " L" + x3 + " " + y3 +
           " L" + x4 + " " + y4 +
           " L" + x5 + " " + y5 +
           " L" + x6 + " " + y6 + "z";
  }

  return {
    create: function(x, y, r) {
      var path = hexagonPath(x, y, r);
      var loopLength = Snap.path.getTotalLength(path);
      var hexagon = s.path({
        path: path,
        "stroke-dasharray": loopLength + " " + loopLength,
        "stroke-dashoffset": 0
      });

      hexagon.animateCountdown = function(timeRemaining) {
        return hexagon.animate({'stroke-dashoffset': loopLength},
          timeRemaining);
      };

      return hexagon;
    },
    infRotate: function infRotate(el) {
      el.transform('r0,200,200');
      el.animate({
        transform: 'r360,200,200'
      }, 60000, mina.linear, infRotate.bind(null, el));
    }
  };
});

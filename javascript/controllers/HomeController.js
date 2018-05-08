editApp.controller('HomeController', ['$scope', '$http', '$routeParams',
function($scope, $http, $routeParams){
    $scope.createBlankHandler = function() {
        console.log("creating blan now");
    }
}]);
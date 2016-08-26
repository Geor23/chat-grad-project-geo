(function() {
    var app = angular.module("ChatApp", []);

    app.controller("ChatController", function($scope, $http) {
        $scope.loggedIn = false;
        $scope.showConversation = false;
        $scope.messagingNow = "";
        $scope.newMessage = "";
        $scope.messages = [];
        $scope.toggle = false;
        $scope.ctoggle = false;
        $scope.inputno = [];

        $scope.startConversation = function() {
            $scope.inputno.pop();
            $scope.inputno.push($scope.user.name);
            console.log($scope.inputno);
            $http.post("/api/conv", $scope.inputno).then(function(response){
                console.log(response.data);
                //$scope.getMessages($scope.user, $scope.messagingNow);
            }, function(response) {
                console.log(response);
            });
            $scope.showConversation = true;
            //$scope.messagingNow = user;
            //$scope.getMessages($scope.user, $scope.messagingNow);
        };

        $scope.isAlreadyInConv = function(user) {
            for (var i =0; i<$scope.inputno.length; i++) {
                if ($scope.inputno[i] == user.name) {
                    return true;
                }
            }
            return false;
        };

        $scope.addUserToConv = function(user) {
            for (var i =0; i<$scope.inputno.length; i++) {
                if ($scope.inputno[i] == "Add User") {
                    $scope.inputno[i] = user.name;
                }
            }
            $scope.inputno.push("Add User");
            console.log($scope.inputno);
        };

        $scope.sendMessage = function(msg) {
            console.log($scope.user);
            console.log(msg);
            console.log($scope.messagingNow);
            $scope.newMessage = "";
            var data= { 
                    from: $scope.user._id,
                    to: $scope.messagingNow.id,
                    messageText: msg 
            };
            $http.post("/api/messages", data).then(function(response){
                $scope.getMessages($scope.user, $scope.messagingNow);
            }, function(response) {
                console.log(response);
            });
        };

        $scope.getMessages = function(from, to) {

            $http.get("/api/messages", {
                params: {
                    from: from, 
                    to: to
                }
            })
                .then(function(res) {
                    $scope.messages = res.data;
                    }, function(response) {
                    }
                );
        };

        $http.get("/api/user").then(function(userResult) {
            $scope.loggedIn = true;
            $scope.user = userResult.data;
            $http.get("/api/users").then(function(result) {
                $scope.users = result.data;
            });
        }, function() {
            $http.get("/api/oauth/uri").then(function(result) {
                $scope.loginUri = result.data.uri;
            });
        });
    });
})();

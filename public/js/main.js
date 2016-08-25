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
        $scope.inputno = 1;
        $scope.inputno = [];

        $scope.startConversation = function(user) {
            $scope.showConversation = true;
            $scope.messagingNow = user;
            $scope.getMessages($scope.user, $scope.messagingNow);
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

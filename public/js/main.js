(function() {
    var app = angular.module("ChatApp", []);

    app.controller("ChatController", function($scope, $http) {
        $scope.loggedIn = false;
        $scope.showConversation = false;
        $scope.newMessage = "";
        $scope.messages = [];
        $scope.toggle = false;
        $scope.ctoggle = false;
        $scope.inputno = [];
        $scope.conv = {};
        $scope.conversations = []; 

        $scope.convSize = [];
        $scope.convCol = [];

        $scope.setRandom = function() {
            for (var i = 0; i < $scope.conversations.length; i++ ) {
                $scope.convSize[i] = getRandomSize();
                $scope.convCol[i] = getRandomColor();
            }
        };

        var colors = ['rgba(65, 0, 0, 0.5)', 'rgba(241, 18, 18, 0.5)', 'rgba(237, 241, 18, 0.5)', 'rgba(104, 241, 18, 0.5)', 'rgba(47, 108, 8, 0.5)', 'rgba(40, 244, 112, 0.5)', 'rgba(40, 244, 210, 0.5)', 'rgba(5, 112, 94, 0.5)', 'rgba(34, 170, 204, 0.5)', 'rgba(34, 37, 204, 0.5)', 'rgba(5, 6, 101, 0.5)', 'rgba(107, 32, 238, 0.5)', 'rgba(43, 7, 104, 0.5)', 'rgba(104, 43, 7, 0.5)', 'rgba(20, 104, 7, 0.5)', 'rgba(7, 20, 104, 0.5)', 'rgba(96, 7, 104, 0.5)', 'rgba(218, 12, 237, 0.5)', 'rgba(222, 16, 133, 0.5)', 'rgba(222, 16, 58, 0.5)', 'rgba(147, 0, 29, 0.5)', 'rgba(216, 12, 16, 0.5)'];

        function getRandomSize() {
            return (Math.random() * 90 ) + 50 ;
        }

         function getRandomColor() {
            return colors[Math.floor(Math.random() * colors.length)];
        }

        $scope.startConversation = function() {
            $scope.inputno.pop();
            $scope.inputno.push($scope.user.name);
            $http.post("/api/conv", $scope.inputno).then(function(response){
                $scope.conv = response.data;
                $scope.getMessages();

            }, function(response) {
                console.log(response);
            });
            $scope.showConversation = true;
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
            var data = { 
                    conv_id: $scope.conv._id,
                    from: $scope.user._id,
                    messageText: msg 
            };
            $http.post("/api/messages", data).then(function(response){
                $scope.getMessages($scope.user, $scope.messagingNow);
            }, function(response) {
                console.log(response);
            });
        };

        $scope.getConv = function() {
            $http.get("/api/conv")
                .then(function(res) {
                    $scope.conversations = res.data;
                    $scope.convSize = new Array($scope.conversations.length);
                    $scope.convCol = new Array($scope.conversations.length);
                    $scope.setRandom();
                    }, function(response) {
                    }
                );
        }

        $scope.getMessages = function() {

            $http.get("/api/messages", {
                params: {
                    conv_id: $scope.conv._id
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

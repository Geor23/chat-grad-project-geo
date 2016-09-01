(function() {
    var app = angular.module("ChatApp", []);

    app.controller("ChatController", function($scope, $http, $interval) {
        
        /* 
            DESIGN VARIABLES 
        */
        $scope.loggedIn = false;
        $scope.showConversation = false;
        $scope.toggle = false;
        $scope.ctoggle = false;
        $scope.convSize = [];
        $scope.convCol = [];
        $scope.aligs = [];
        var colors = ['rgba(65, 0, 0, 0.5)', 'rgba(241, 18, 18, 0.5)', 'rgba(237, 241, 18, 0.5)', 'rgba(104, 241, 18, 0.5)', 'rgba(47, 108, 8, 0.5)', 'rgba(40, 244, 112, 0.5)', 'rgba(40, 244, 210, 0.5)', 'rgba(5, 112, 94, 0.5)', 'rgba(34, 170, 204, 0.5)', 'rgba(34, 37, 204, 0.5)', 'rgba(5, 6, 101, 0.5)', 'rgba(107, 32, 238, 0.5)', 'rgba(43, 7, 104, 0.5)', 'rgba(104, 43, 7, 0.5)', 'rgba(20, 104, 7, 0.5)', 'rgba(7, 20, 104, 0.5)', 'rgba(96, 7, 104, 0.5)', 'rgba(218, 12, 237, 0.5)', 'rgba(222, 16, 133, 0.5)', 'rgba(222, 16, 58, 0.5)', 'rgba(147, 0, 29, 0.5)', 'rgba(216, 12, 16, 0.5)'];
        var align = ['flex-start', 'flex-end', 'center', 'baseline' , 'stretch' ]


        /* 
            DATA INPUT VARIABLES 
        */
        $scope.newMessage = "";
        $scope.inputno = [];
        $scope.inputConvName = '';

        var int, int_conv ;



        $scope.openConversation = function(conversation) {
            $scope.conv = conversation ;
            $scope.showConversation = true;
            int = $interval($scope.getMessages, 300);
        };

        $scope.clearConversation = function() {
            var data = { conv_id: $scope.conv._id };
            $http.post("/api/messages/clear", data).then(function(response){
            }, function(response) {
                console.log(response);
            });
        };

        $scope.startConversation = function(name) {
            console.log(name);
            var d = new Date();
            $scope.inputno.pop();
            $scope.inputno.push($scope.user._id);

            var data = {
                users: $scope.inputno,
                name: name,
                time: d
            };

            $http.post("/api/conv", data).then(function(response) {

                $scope.conv = response.data;
                $scope.getMessages();

            }, function(response) {
                console.log(response);
            });

            $scope.showConversation = true;
        };

        $scope.sendMessage = function(msg) {
            var d = new Date();
            var data = { 
                conv_id: $scope.conv._id,
                from: $scope.user._id,
                messageText: msg,
                time: d
            };
            $http.post("/api/messages", data).then(function(response){
                $scope.getMessages();
                $scope.newMessage = "";
            }, function(response) {
                console.log(response);
            });
        };

        $scope.getConv = function() {

            $http.get("/api/conv", {
                params: {
                    user: $scope.user._id
                }
            })
                .then(function(res) {
                    $scope.conversations = res.data;
                    $scope.convSize = new Array($scope.conversations.length);
                    $scope.convCol = new Array($scope.conversations.length);
                    $scope.aligs = new Array($scope.conversations.length);
                    $scope.setRandom();
                    int_conv = $interval(updateConvAndSetNotification, 1000);
                    }, function(response) {
                    }
                );
        };

        $scope.getMessages = function() {

            $http.get("/api/messages", {
                params: {
                    conv_id: $scope.conv._id
                }
            })
                .then(function(res) {
                    updateLastOpened();
                    $scope.messages = res.data;
                }, function(response) {
                }
            );
        };

        function updateConvAndSetNotification() {
            $http.get("/api/conv", {
                params: {
                    user: $scope.user._id
                }
            })
                .then(function(res) {

                    pushNewConv($scope.conversations.length, res.data);

                     $http.get("/api/lastopened", {
                        params: {
                            user: $scope.user._id
                        }
                    })
                        .then(function(resp) {

                            $scope.conversations.forEach(function(conv) {
                                //console.log(conv._id);
                                //console.log(resp.data);
                                var time;
                                resp.data.forEach(function(obj) {
                                    if (obj.conv_id === conv._id)
                                        time = obj.last_opened;
                                });

                                if (conv.last_msg > time ) {
                                    // pull no of unred msg from server
                                    // set conv unread_msg to unred
                                    getCountUnreadMsg(conv._id, time);
                                }
                            });

                        });
                    });
        }

        function pushNewConv(l1, l2) {
            if (l1<l2.length) {
                for (var i = l1; i<l2.length; i++) {
                    $scope.conversations.push(l2[i]);
                    $scope.convSize.push(getRandomSize());
                    $scope.convCol.push(getRandomColor());
                    $scope.aligs.push(getRandomAlign());
                }
            }
        }

        function getCountUnreadMsg(id, time) {
            $http.get("/api/messagescount", {
                params: {
                    conv_id: id,
                    time: time
                }
            }).then(function(res) {
                console.log(res.data);
            });
        }

        function updateLastOpened() {
            var d = new Date();
            var data = {
                    user: $scope.user._id,
                    conv_id: $scope.conv._id,
                    time: d
                };

            $http.post("/api/lastopened", data).then(function(response) {
            });
        }

        $http.get("/api/user").then(function(userResult) {
            $scope.loggedIn = true;
            $scope.user = userResult.data;
            $http.get("/api/users").then(function(result) {
                $scope.users = result.data;
            });
            $scope.getConv();
        }, function() {
            $http.get("/api/oauth/uri").then(function(result) {
                $scope.loginUri = result.data.uri;
            });
        });



        /*
            DESIGN FUNCTIONS
        */


        $scope.isAlreadyInConv = function(user) {

            for (var i =0; i<$scope.inputno.length; i++) {
                if ($scope.inputno[i] == user._id) {
                    return true;
                }
            }
            return false;
        };

        $scope.addUserToConv = function(user) {
            for (var i =0; i<$scope.inputno.length; i++) {
                if ($scope.inputno[i] == "Add User") {
                    $scope.inputno[i] = user._id;
                }
            }
            $scope.inputno.push("Add User");
        };


        $scope.getUserNameFromId = function(userid) {
            $scope.users.forEach(function(user) {
                if ( user._id === userid )
                    return user.name;
            });
        };

        $scope.getListOfUsers = function(arr) {
            var index = arr.indexOf($scope.user._id);
            if (index > -1)
                arr.splice(arr.indexOf($scope.user._id), 1);
            return arr.join(', ');
        }; 


        $scope.setRandom = function() {
            for (var i = 0; i < $scope.conversations.length; i++ ) {
                $scope.convSize[i] = getRandomSize();
                $scope.convCol[i] = getRandomColor();
                $scope.aligs[i] = getRandomAlign();
            }
        };


        function getRandomSize() {
            return (Math.random() * 90 ) + 50 ;
        }

         function getRandomColor() {
            return colors[Math.floor(Math.random() * colors.length)];
        }

        function getRandomAlign() {
            return align[Math.floor(Math.random() * align.length)];
        }


    });
})();

(function() {
    var app = angular.module("ChatApp", ["ngMaterial"]);

    app.controller("ChatController", function($scope, $http, $interval, $mdDialog) {


        $scope.customFullscreen = false;


        $scope.showPrompt = function(ev) {
            var confirm = $mdDialog.prompt()
            .parent(angular.element(document.querySelector('#popupContainer')))
            .clickOutsideToClose(true)
            .title('How would you like to rename your chat?')
            .placeholder('Chat name')
            .ariaLabel('Chat name')
            .initialValue($scope.conv.name)
            .targetEvent(ev)
            .ok('Okay!')
            .cancel('Cancel');

            $mdDialog.show(confirm).then(function(result) {
                if (result !== $scope.conv.name){
                    $scope.updateNameConv(result);
                }
            });
        };


       $scope.showPrerenderedDialog = function(ev) {
        $mdDialog.show({
          contentElement: '#users-in-conv',
          parent: angular.element(document.querySelector('#popupContainer')),
          targetEvent: ev,
          clickOutsideToClose: true
        });
      };

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
        $scope.edittingName = false;
        var colors = ["rgba(218, 12, 237, 0.5)", "rgba(20, 104, 7, 0.5)", "rgba(7, 20, 104, 0.5)"];
        colors.push.apply(colors, ["rgba(216, 12, 16, 0.5)", "rgba(147, 0, 29, 0.5)", "rgba(222, 16, 58, 0.5)"]);
        colors.push.apply(colors, ["rgba(222, 16, 133, 0.5)", "rgba(241, 18, 18, 0.5)", "rgba(237, 241, 18, 0.5)"]);
        colors.push.apply(colors, ["rgba(40, 244, 112, 0.5)", "rgba(40, 244, 210, 0.5)", "rgba(5, 112, 94, 0.5)"]);
        colors.push.apply(colors, ["rgba(34, 170, 204, 0.5)", "rgba(34, 37, 204, 0.5)", "rgba(5, 6, 101, 0.5)"]);
        colors.push.apply(colors, ["rgba(107, 32, 238, 0.5)", "rgba(43, 7, 104, 0.5)", "rgba(104, 43, 7, 0.5)"]);
        var align = ["flex-start", "flex-end", "center", "baseline" , "stretch"];

        /*
            DATA INPUT VARIABLES
        */
        $scope.newMessage = "";
        $scope.inputno = [];
        $scope.inputConvName = "";

        var int;
        var int_conv ;

        $scope.leaveConversation = function() {
            var data = {
                conv_id: $scope.conv._id,
                user: $scope.user._id
            };
            $http.post("/api/conv/rem/users", data).then(function(response) {
            });
            $scope.stopAndBackToHome();
        };

        $scope.updateNameConv = function(newname) {
            $scope.conv.name = newname;
            var data = {
                conv_id: $scope.conv._id,
                name: newname
            };
            $http.post("/api/conv/name", data).then(function(response) {
            });
        };

        $scope.addUsersToConversation = function() {
            var data = {
                conv_id: $scope.conv._id,
                users: $scope.inputno
            };
            $http.post("/api/conv/add/users", data).then(function(response) {
            });
        };

        $scope.stopAndBackToHome = function() {
            $scope.showConversation = false;
            $scope.conv = undefined;
            cancelInt();
        };

        function cancelInt() {
            $interval.cancel(int);
            int = undefined;
        }

        $scope.openConversation = function(conversation) {
            changeTab();
            $scope.conv = conversation;
            $scope.showConversation = true;
            int = $interval($scope.getMessages, 300);
        };

        $scope.clearConversation = function() {
            var data = {conv_id: $scope.conv._id};
            $http.post("/api/messages/clear", data).then(function(response) {
            }, function(response) {
            });
        };

        $scope.startConversation = function(name) {
            var d = new Date();
            $scope.inputno.push($scope.user._id);
            var data = {
                users: $scope.inputno,
                name: name,
                time: d
            };
            
            $http.post("/api/conv", data).then(function(response) {
                $scope.conv = response.data;
                console.log(JSON.stringify($scope.conv));
                $scope.getMessages();
                $scope.showConversation = true;
                changeTab();
            }, function(response) {
            });
            
        };

        function changeTab() {
            $scope.selectedIndex=1;
            $scope.inputConvName='';
            $scope.inputno = [];
        }

        $scope.sendMessage = function(msg) {
            var d = new Date();
            var data = {
                conv_id: $scope.conv._id,
                from: $scope.user._id,
                messageText: msg,
                time: d
            };
            $http.post("/api/messages", data).then(function(response) {
                $scope.getMessages();
            }, function(response) {
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
                    updateConv($scope.conversations, res.data);
                    $http.get("/api/lastopened", {
                        params: {
                            user: $scope.user._id
                        }
                    })
                        .then(function(resp) {
                            $scope.conversations.forEach(function(conv) {
                                var time;
                                resp.data.forEach(function(obj) {
                                    if (obj.conv_id === conv._id) {
                                        time = obj.last_opened;
                                    }
                                });

                                if (conv.last_msg > time) {
                                    $http.get("/api/messagescount", {
                                        params: {
                                            conv_id: conv._id,
                                            time: time
                                        }
                                    }).then(function(res) {
                                        conv.unread = res.data;
                                    });
                                } else {
                                    conv.unread = 0;
                                }
                            });
                        });
                });
        }

        function updateConv(l1, l2) {
            var i;
            if (l1.length < l2.length) {
                for (i = l1.length; i < l2.length; i++) {
                    $scope.conversations.push(l2[i]);
                    $scope.convSize.push(getRandomSize());
                    $scope.convCol.push(getRandomColor());
                    $scope.aligs.push(getRandomAlign());
                }
            } else if (l1.length > l2.length) {
                for (i = 0; i < l1.length; i++) {
                    if (l2.indexOf(l1[i]) < 0) {
                        $scope.conversations.splice(i, 1);
                    }
                }
            }
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
            return $scope.inputno.indexOf(user._id) >= 0;
        };

        $scope.addUserToConv = function(user) {
            if ($scope.inputno.indexOf(user._id) < 0) {
                $scope.inputno.push(user._id);
            }
            else {
                $scope.inputno.splice($scope.inputno.indexOf(user._id), 1);
            }
        };

        $scope.getUserNameFromId = function(userid) {
            var res = '';
            $scope.users.forEach(function(user) {
                if (user._id === userid) {
                    res = user.name;
                }
            });
            return res;
        };

        $scope.getAvatarFromId = function(userid) {
            var res = '';
            $scope.users.forEach(function(user) {
                if (user._id === userid) {
                    res = user.avatarUrl;
                }
            });
            return res;
        };

        $scope.getListOfUsers = function(arr) {
            var index = arr.indexOf($scope.user._id);
            if (index > -1) {
                arr.splice(arr.indexOf($scope.user._id), 1);
            }
            return arr.join(", ");
        };

        $scope.setRandom = function() {
            for (var i = 0; i < $scope.conversations.length; i++) {
                $scope.convSize[i] = getRandomSize();
                $scope.convCol[i] = getRandomColor();
                $scope.aligs[i] = getRandomAlign();
            }
        };

        function getRandomSize() {
            return (Math.random() * 90) + 50 ;
        }

        function getRandomColor() {
            return colors[Math.floor(Math.random() * colors.length)];
        }

        function getRandomAlign() {
            return align[Math.floor(Math.random() * align.length)];
        }
    });
})();

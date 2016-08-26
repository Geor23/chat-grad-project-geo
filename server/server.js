var express = require("express");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");

module.exports = function(port, db, githubAuthoriser) {
    var app = express();

    app.use(express.static("public"));
    app.use(cookieParser());
    app.use(bodyParser());

    var users = db.collection("users");
    var messages = db.collection("messages");
    var conversations = db.collection("conversations");
    var sessions = {};

    app.get("/oauth", function(req, res) {
        githubAuthoriser.authorise(req, function(githubUser, token) {
            if (githubUser) {
                users.findOne({
                    _id: githubUser.login
                }, function(err, user) {
                    if (!user) {
                        // TODO: Wait for this operation to complete
                        users.insertOne({
                            _id: githubUser.login,
                            name: githubUser.name,
                            avatarUrl: githubUser.avatar_url
                        });
                    }
                    sessions[token] = {
                        user: githubUser.login
                    };
                    res.cookie("sessionToken", token);
                    res.header("Location", "/");
                    res.sendStatus(302);
                });
            }
            else {
                res.sendStatus(400);
            }

        });
    });

    app.get("/api/oauth/uri", function(req, res) {
        res.json({
            uri: githubAuthoriser.oAuthUri
        });
    });

    app.post("/api/conv", function(req, res){

        conversations.findOne( { users: req.body } , function(err, conv) {
            
            console.log(conv);
             
            if (conv!==null) {
                res.json(conv._id);
            } else {
                conversations.insertOne({ users: req.body}, function(err, c) {
                    res.json(c._id);
                });
            } 
        });

    });



    app.post("/api/messages", function(req, res){
        messages.insertOne({
            conv_id: req.body.conv_id,
            fromUser: req.body.from,
            toUser: req.body.to,
            messageText: req.body.messageText
        }, function(err) {
            if (err)
            res.sendStatus(401);
            else res.sendStatus(200);
        });
        
    });

    app.use(function(req, res, next) {
        if (req.cookies.sessionToken) {
            req.session = sessions[req.cookies.sessionToken];
            if (req.session) {
                next();
            } else {
                res.sendStatus(401);
            }
        } else {
            res.sendStatus(401);
        }
    });

    app.get("/api/user", function(req, res) {
        users.findOne({
            _id: req.session.user
        }, function(err, user) {
            if (!err) {
                res.json(user);
            } else {
                res.sendStatus(500);
            }
        });
    });


    app.get("/api/messages", function(req, res) { 
        console.log("Q: " + JSON.stringify(req.query));
        messages.find({ conv_id: req.query.conv_id }).toArray(function(err, docs) {
            if (!err) {
                res.json(docs.map(function(msg) {
                    return {
                        id: msg._id,
                        from: msg.fromUser,
                        to: msg.toUser,
                        messageText: msg.messageText
                    };
                }));
            } else {
                res.sendStatus(500);
            }
        });
    });

    app.get("/api/users", function(req, res) {
        users.find().toArray(function(err, docs) {
            if (!err) {
                res.json(docs.map(function(user) {
                    return {
                        id: user._id,
                        name: user.name,
                        avatarUrl: user.avatarUrl
                    };
                }));
            } else {
                res.sendStatus(500);
            }
        });
    });

    return app.listen(port);
};

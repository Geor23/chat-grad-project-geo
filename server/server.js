var express = require("express");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var ObjectId = require('mongodb').ObjectID;

module.exports = function(port, db, githubAuthoriser) {
    var app = express();

    app.use(express.static("public"));
    app.use(cookieParser());
    app.use(bodyParser());

    var users = db.collection("users");
    var messages = db.collection("messages");
    var conversations = db.collection("conversations");
    var lastopened = db.collection("lastopened");
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


    // create conversation and set the last opened for all users in conv to the time of creation
    app.post("/api/conv", function(req, res) {

        conversations.insertOne({ 
            users: req.body.users,
            name: req.body.name,
            last_msg: new Date(req.body.time)
        }, function(err, c) {
            res.json(c);
            req.body.users.forEach(function(user){
                lastopened.insertOne({
                    user: user,
                    conv_id: c.insertedId,
                    last_opened: new Date(req.body.time)
                }, function(err, docs) {
                });
            });
        });
    });


    // update the last time the conversation was opened
    app.post("/api/lastopened", function(req, res) {
        lastopened.updateOne(
            { $and: [
                {user : req.body.user}, 
                {conv_id : ObjectId(req.body.conv_id)} 
            ]} ,
            { $set: { "last_opened" : new Date(req.body.time) } } 
        );
        res.sendStatus(200);
    });

    // get all the conversations that a specific user belongs to
    app.get("/api/lastopened", function(req, res) { 
        //messages.drop(); conversations.drop(); lastopened.drop();
        lastopened.find({ user: req.query.user }).toArray(function(err, docs) {
            if (!err) {
                res.json(docs);
            } else {
                res.sendStatus(500);
            }
        });
    });

    // get all the conversations that a specific user belongs to
    app.get("/api/conv", function(req, res) { 

        conversations.find({ users: { "$in" : [req.query.user]} }).toArray(function(err, docs) {
            if (!err) {
                res.json(docs);
            } else {
                res.sendStatus(500);
            }
        });
    });


    // insert a message someone just sent
    app.post("/api/messages", function(req, res) {
        messages.insertOne({
            conv_id: req.body.conv_id,
            from: req.body.from,
            messageText: req.body.messageText,
            time: new Date(req.body.time)
        });
        updateLastMsg(new Date(req.body.time), req.body.conv_id);
        res.sendStatus(200);
    });


    // get all messages from a conversation
    app.get("/api/messages", function(req, res) { 
        messages.find({ conv_id: req.query.conv_id }).toArray(function(err, docs) {

            if (!err) {
                res.json(docs);
            } else {
                res.sendStatus(500);
            }
        });
    });


    // get a count for unread msgs in a conv
    app.get("/api/messagescount", function(req, res) { 
        messages.count({
            $and: [
                { conv_id: req.query.conv_id },
                { time: { $gt: new Date(req.query.time) } }
            ]      
        }, function(err, docs) {
            if (!err) {
                res.json(docs);
            } else {
                res.sendStatus(500);
            }
        });
    });

    // clear all messages in a conversation
    app.post("/api/messages/clear", function(req, res) {

        messages.deleteMany({
            conv_id: req.body.conv_id
        }, function(err) {
            if (err) res.sendStatus(401);
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

    app.get("/api/users", function(req, res) {
        users.find().toArray(function(err, docs) {
            if (!err) {
                res.json(docs);
            } else {
                res.sendStatus(500);
            }
        });
    });

    function updateLastMsg(date, conv_id) {
        conversations.update({
            _id: ObjectId(conv_id)
        },
        {
            $set: {
                last_msg: date
            }
        });
    }

    return app.listen(port);
};

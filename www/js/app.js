/*jslint browser:true, node: true */
/*jslint indent: 4 */
/*global FileUploadOptions, FileTransfer, angular, cordova, StatusBar*/
/*jshint strict: true */
'use strict';

var app = angular.module("starter", ['ionic']);

app.run(function ($ionicPlatform) {
    $ionicPlatform.ready(function () {
        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }
    });
});

app.config(function ($stateProvider, $urlRouterProvider) {
    $stateProvider.state('index', {
        url: '/index',
        templateUrl: 'templates/forms.html',
        controller: 'forms'
    }).state('forms', {
        url: '/forms',
        templateUrl: 'templates/forms.html',
        controller: 'forms'
    }).state('snapshot', {
        url: '/snapshot',
        templateUrl: 'templates/main.html',
        controller: 'snapshot'
    }).state('contact', {
        url: '/contact',
        templateUrl: 'templates/contact.html',
        controller: "snapshot"
    }).state('snapView', {
        url: '/snapView',
        templateUrl: 'templates/snapView.html',
        controller: 'snapView'
    });
    $urlRouterProvider.otherwise('/index');
});

app.controller('forms', function ($scope, $http) {
    $scope.showLogin = true;
    $scope.showRegister = false;
    $scope.switchRegister = function () {
        $scope.showLogin = false;
        $scope.showRegister = true;
    };
    $scope.switchLogin = function () {
        $scope.showLogin = true;
        $scope.showRegister = false;
    };
    $scope.connection = function ($event) {
        $http.post('http://remikel.fr/api.php?option=connexion', {
            password: document.getElementById('lpwd').value,
            email: document.getElementById('lmail').value
        }).success(function (res) {
            res.stayConnected = document.getElementById('stay').checked;
            console.log(res);
            if (res.token !== null) {
                $scope.stockIn(res);
                $scope.showLogin = false;
                window.location.href = '#/snapshot';
            } else {
                document.getElementById('wrong').innerHTML = "Mail/Mot de passe incorrect";
            }
        });
        $event.preventDefault();
        return false;
    };
    $scope.registration = function ($event) {
        if (document.getElementById('rpwd').value.length > 0 && document.getElementById('rmail').value.length > 0) {
            $http.post('http://remikel.fr/api.php?option=inscription', {
                password: document.getElementById('rpwd').value,
                email: document.getElementById('rmail').value
            }).success(function (res) {
                console.log(res);
                $scope.switchLogin();
            });
        }
        $event.preventDefault();
        return false;
    };
    $scope.stockIn = function (obj) {
        var obj2 = {};
        obj2.id = obj.data[0].id;
        obj2.curToken = obj.token;
        obj2.username = obj.data[0].username;
        obj2.stayConnected = obj.stayConnected;
        localStorage.setItem('connected', JSON.stringify(obj2));
    };
});

app.factory('Camera', ['$q', function ($q) {
    return {
        getPicture: function (options) {
            var q = $q.defer();
            navigator.camera.getPicture(function (result) {
                q.resolve(result);
            }, function (err) {
                q.reject(err);
            }, options);
            return q.promise;
        }
    };
}]);

app.controller('snapshot', function ($scope, $http, Camera) {
    $scope.contacts = null;
    var options = {
        quality: 45/*,
        destinationType: Camera.DestinationType.FILE_URI, //FILE_URI
        sourceType: CameraPictureSourceType.CAMERA*/
    };
    $scope.getPhoto = function () {
        Camera.getPicture(options).then(function (imageURI) {
            console.log(imageURI);
            var img = document.getElementById('pict');
            img.src = imageURI;
        }, function (err) {
            console.info(err);
        });
    };
    $scope.contactList = function () {
        var email = JSON.parse(localStorage.getItem('connected')).username,
            tok = JSON.parse(localStorage.getItem('connected')).curToken;
        console.log('tok : ' + tok + ' username : ' + email);
        $http.post('http://remikel.fr/api.php?option=toutlemonde', {
            email: email,
            token: tok
        }).success(function (res) {
            $scope.contacts = res.data;
            console.log(res.data);
            console.log(res);
        });
    };
    $scope.sendToFriend = function () {
        var select,
            choice,
            friends,
            selectTime,
            choixTimer,
            time,
            options2,
            ft;
        //\\//\\//\\//\\//\\//\\//\\
        select = document.getElementById('friendsList');
        choice = select.selectedIndex;
        friends = select.options[choice].value;
        selectTime = document.getElementById('time');
        choixTimer = selectTime.selectedIndex;
        time = selectTime.options[choixTimer].value;
        options2 = new FileUploadOptions();
        options2.fileKey = "file";//document.getElementById('pict').src;
        options2.mimeType = "image/jpeg";
        options.fileName = document.getElementById('pict').src.substr(document.getElementById('pict').src.lastIndexOf('/') + 1);
        options2.params = {};
        options2.params.email = JSON.parse(localStorage.getItem('connected')).username;
        options2.params.u2 = friends;
        options2.params.temps = time;
        options2.params.token = JSON.parse(localStorage.getItem('connected')).curToken;
        ft = new FileTransfer();
        ft.upload(document.getElementById('pict').src, 'http://remikel.fr/api.php?option=image', function (res) {
            console.log(res);
        }, function (err) {
            console.log(err);
        }, options2);
        window.location.href = "#/snapView";
    };
});

app.controller('snapView', function ($scope, $http) {
    $scope.mySnap = [];
    $scope.fetchSnap = function () {
        $http.post('http://remikel.fr/api.php?option=newsnap', {
            email: JSON.parse(localStorage.getItem('connected')).username,
            token: JSON.parse(localStorage.getItem('connected')).curToken
        }).success(function (res) {
            $scope.mySnap = res.data;
            console.log(res);
        });
    };
    $scope.displaySnap = function () {
        var hide,
            url,
            time,
            id;
        hide = document.getElementById('listSnap').options[document.getElementById('listSnap').selectedIndex].value;
        url = hide.split(' ')[0];
        time = hide.split(' ')[1];
        id = hide.split(' ')[2];
        console.log('url : ' + url + ' time : ' + time);
        document.getElementById('curSnapTache').src = url;
        document.getElementById('curSnapTache').style.display = "block";
        document.getElementById('curSnapTache').style.zIndex = "15";
        setTimeout(function () {
            document.getElementById('curSnapTache').src = "";
            document.getElementById('curSnapTache').style.display = "none";
            document.getElementById('curSnapTache').style.zIndex = "0";
            $http.post('http://remikel.fr/api.php?option=vu', {
                email: JSON.parse(localStorage.getItem('connected')).username,
                token: JSON.parse(localStorage.getItem('connected')).curToken,
                id: id
            });
            window.location.reload();
        }, parseInt(time, 10) * 1000);
    };
});
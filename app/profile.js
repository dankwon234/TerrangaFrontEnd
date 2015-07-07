var app = angular.module('ProfileModule', []);
app.controller('ProfileController', ['$scope', '$http', '$upload', function($scope, $http, $upload){
	$scope.currentUser = {'loggedIn':'no'};
	$scope.profile = {'firstName':'', 'lastName':'', 'age':'', 'city':'', 'country':'', 'bio':'', 'homeCity':'', 'image':'', 'homeCountry':'', 'profession':'', 'languages':[], 'points':''}; // insert empty values so angular doesn't freak out
	$scope.newMessage = {'recipientID':'', 'senderID':'', 'subject':'', 'threadID':'', 'body':''};
	$scope.messages = null;
	$scope.pageVersion = null;
	$scope.languages = null;
	$scope.insight = {'description':'', 'category':''};
	$scope.endorser = null;
	$scope.selectedInsight = null;
	$scope.selectedDream = null;
	$scope.reviewers = new Array();

	$scope.init = function(){
		console.log('Profile (app) Controller: INIT ');
		
    	var requestInfo = parseLocation('site');
    	console.log(JSON.stringify(requestInfo));
    	
    	if (requestInfo.identifier==null){
        	console.log('ProfileController: MISSING PROFILE ID');
        	return;
    	}
    	
		fetchProfile(requestInfo.identifier);
		fetchPageVersion();
		
	}
	
	function fetchPageVersion(){
		var url = '/api/profilePage';
		$http.get(url).success(function(data, status, headers, config) {
            var confirmation = data['confirmation'];
            console.log('CONFIRMATION: '+JSON.stringify(data));
            
            if (confirmation != 'success'){
                alert(data['message']);
                return;
            }
          
            $scope.pageVersion = data['profilePages'][0]['page']
           
        }).error(function(data, status, headers, config) {
            console.log("error", data, status, headers, config);
        });
	}
	
	$scope.formattedDate = function(dateStr){
		return moment(new Date(dateStr)).format('MMM D h:mm a');
	}
	
	$scope.formattedReviewData = function(dateStr){
		return moment(new Date(dateStr)).format('MMMM YYYY');
	}
	
	$scope.sendMessage = function(){
		$scope.newMessage.recipientID = $scope.profile.id;
		$scope.newMessage.senderID = $scope.currentUser.id;
		if ($scope.newMessage.senderID==null){
			alert("Please log in to message " + $scope.profile.firstName);
			return;
		}
		var json = JSON.stringify($scope.newMessage);
		var url = '/api/messages';
        $http.post(url, json).success(function(data, status, headers, config) {
            var confirmation = data['confirmation'];
            console.log('CONFIRMATION: '+JSON.stringify(data));
            
            if (confirmation != 'success'){
                alert(data['message']);
                return;
            }
            $scope.messages.push(data['message']);
            $scope.newMessage = {'recipientID':'', 'senderID':'', 'subject':'', 'threadID':'', 'body':''};
            
        }).error(function(data, status, headers, config) {
            console.log("error", data, status, headers, config);
        });
	}
	
	function fetchMessages(){
		if ($scope.currentUser.loggedIn=='no')
			return;
		var url = '/api/messages?senderID='+$scope.currentUser.id+'&recipientID='+$scope.profile.id;
        $http.get(url).success(function(data, status, headers, config) {
            var confirmation = data['confirmation'];
            console.log('CONFIRMATION: '+JSON.stringify(data));
            
            if (confirmation != 'success'){
                alert(data['message']);
                return;
            }
           $scope.messages = data['messages'];
           
           var objDiv = document.getElementById("messages");
           objDiv.scrollTop = objDiv.scrollHeight;
           
        }).error(function(data, status, headers, config) {
            console.log("error", data, status, headers, config);
        });
	}
	
	function fetchReviewers(){
		for (var i=0; i<$scope.profile.reviews.length; i++){
			var url = '/api/profiles/'+$scope.profile.reviews[i].reviewedBy;
			$http.get(url).success(function(data, status, headers, config) {
	            var confirmation = data['confirmation'];

	            if (confirmation != 'success'){
	                alert(data['message']);
	                return;
	            }
	            $scope.reviewers.push(data['profile']);
	    		console.log('Reviewers: '+ JSON.stringify($scope.reviewers));

			}).error(function(data, status, headers, config) {
	            console.log("error", data, status, headers, config);
	        });
		}
	}
	
	function fetchProfile(profileId){
		console.log('FETCH PROFILE: '+profileId);
		var url = '/api/profiles/'+profileId;
		$http.get(url).success(function(data, status, headers, config) {
            var confirmation = data['confirmation'];
            console.log('CONFIRMATION : '+ JSON.stringify(data));

            if (data['currentUser'] != null)
            	$scope.currentUser = data['currentUser'];

            if (confirmation != 'success'){
                alert(data['message']);
                return;
            }
            
            var p = data['profile'];
            $scope.profile = p;
    		fetchMessages();
    		fetchReviewers();
    		$scope.languages = getLanguages();
    		if ($scope.profile.endorsements[0]!=null){
    			var url2 = '/api/profiles/'+$scope.profile.endorsements[0].endorsedBy;
    			$http.get(url2).success(function(data, status, headers, config) {
    	            var confirmation = data['confirmation'];
    	            console.log('CONFIRMATION : '+ JSON.stringify(data));
    	            
    	            if (confirmation != 'success'){
    	                alert(data['message']);
    	                return;
    	            }
    	            $scope.endorser = data['profile'];
    	            
    			}).error(function(data, status, headers, config) {
    	            console.log("error", data, status, headers, config);
    	        });
    			
    		}

            
        }).error(function(data, status, headers, config) {
            console.log("error", data, status, headers, config);
        });
	}
	
	
	
	$scope.logout = function(){
		console.log('LOG OUT: ');
		var url = '/api/logout';
        $http.post(url).success(function(data, status, headers, config) {
            var confirmation = data['confirmation'];
            console.log('CONFIRMATION: '+ JSON.stringify(data));
            
            if (confirmation != 'success'){
                alert(data['message']);
                return;
            }
            
            window.location.href = '/';
            
        }).error(function(data, status, headers, config) {
            console.log("error", data, status, headers, config);
        });
	}
	
	
	
	
	$scope.login = function(){
		if ($scope.currentUser.email.length==0){
			alert('Please enter your email.');
			return;
		}
		if ($scope.currentUser.email.indexOf('@')==-1){
			alert('Please enter a valid email.');
			return;
		}
		if ($scope.currentUser.password.length==0){
			alert('Please enter your password.');
			return;
		}
		
		console.log('LOG IN'+JSON.stringify($scope.currentUser));
		
		var json = JSON.stringify($scope.currentUser);
    	var url = '/api/login';
    	
        $http.post(url, json).success(function(data, status, headers, config) {
            var confirmation = data['confirmation'];
            console.log('CONFIRMATION: '+ JSON.stringify(data));
            
            if (confirmation != 'success'){
                alert(data['message']);
                return;
            }
            
            window.location.href = '/site/account';
            
        }).error(function(data, status, headers, config) {
            console.log("error", data, status, headers, config);
        });
        
        
	}
	
    $scope.capitalize = function(string) {
    	var parts = string.split(' ');
    	var capitalizedString = '';
    	
    	for (var i=0; i<parts.length; i++){
    		var s = parts[i];
    		if (s.length <= 1){
    			capitalizedString = capitalizedString+' '+s.toUpperCase();
    			continue;
    		}
    		
    		s = s.charAt(0).toUpperCase() + s.slice(1);
			capitalizedString = capitalizedString+' '+s;
    	}
    	
		capitalizedString = capitalizedString.trim();
		return capitalizedString;
    }

    $scope.lastInitial = function(string){
    	return string.substring(0,1).toUpperCase();
    }
    
    function parseLocation(stem){
    	console.log('PARSE LOCATION: '+stem);
    	var resourcePath = location.href.replace(window.location.origin, ''); // strip out the domain root (e.g. http://localhost:8888)
    	var requestInfo = {"resource":null, "identifier":null, 'params':{}};

    	// parse out the parameters:
    	var p = resourcePath.split('?');
    	if (p.length > 1){
    		var paramString = p[1];
    		var a = paramString.split('&');
    		var params = {};
    		for (var i=0; i<a.length; i++){
    			var keyValue = a[i].split('=');
    			if (keyValue.length<1)
    				continue;
    			
    			params[keyValue[0]] = keyValue[1];
    		}
    		
    		requestInfo['params'] = params;
    	}
    	
    	resourcePath = p[0];

    	var parts = resourcePath.split(stem+'/');
    	if (parts.length > 1){
    		var hierarchy = parts[1].split('/');
    		for (var i=0; i<hierarchy.length; i++){
    			if (i==0)
    				requestInfo['resource'] = hierarchy[i]

    			if (i==1) 
    			    requestInfo['identifier'] = hierarchy[i];
    			
    		}
    	}

    	return requestInfo;
    }
    
    function getLanguages(){
    	var languages = $scope.profile.languages;
    	var langString = "";
    	for (var i = 0; i<languages.length; i++){
    		if (i!=0)
    			langString = langString.concat(", "+$scope.capitalize(languages[i]));
    		else
    			langString = $scope.capitalize(languages[0]);
    	}
    	return langString;
    }
    
    $scope.viewInsight = function(index){
		$scope.selectedInsight = $scope.profile.insights[index];
		console.log(JSON.stringify($scope.selectedInsight));
	}
    
    $scope.viewDream = function(index){
		$scope.selectedDream = $scope.profile.dreams[index];
		console.log(JSON.stringify($scope.selectedDream));
	}
    
    $scope.getWidth = function(){
    	var percent = $scope.selectedDream.fundraisingCurrent / $scope.selectedDream.fundraisingGoal * 100;
    	return percent.concat("%");
    }

	
}]);

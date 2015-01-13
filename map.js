//Map Initialization
var mapOptions, map, infowindow;

//Search Box
var searchBox;

//Map Marker
var marker = null, myLatlng, place;

//Marker Images
var markerGreen, markerPurple;

//Overlapping Marker Spiderifier
var oms, iw;

//For query
var keywords, llat, llong, radius;

//For post-query marking
var eventData, eventMarkers;

function initialize()
{		
		//Create Map
		mapOptions = {  center: { lat: 0, lng: 0}, zoom: 2 };
        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
		
		//Create Spiderifier
		oms = new OverlappingMarkerSpiderfier(map);
		
		//OMS listener - set infowindow to open and close.
		iw = new google.maps.InfoWindow({ maxWidth: 500 });
		oms.addListener('click', function(marker, event) {
		  iw.setContent(marker.desc);
		  iw.open(map, marker);
		});
		
		oms.addListener('spiderfy', function(markers) {
		  iw.close();
		});
		
		// Create the search box and link it to the UI element.
		var input = /** @type {HTMLInputElement} */(document.getElementById('pac-input'));
		map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
		searchBox = new google.maps.places.Autocomplete( /** @type {HTMLInputElement} */(input) );
		
		//Add event keywords input
		input = /** @type {HTMLFormElement} */(document.getElementById('keyform'));
		map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
		
		//Add footer text to map
		input = /** @type {HTMLDivElement} */(document.getElementById('footer'));
		map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(input);
	
		//Default Location Marker
		myLatlng = new google.maps.LatLng(0.1,0.1);
		marker = new google.maps.Marker({
			position: myLatlng,
			map: map,
			title: '0,0'
			});
			
		
		//Attempt to change starting location to user's current location.
		geolocate();
		
		//Event for search bar - Move map to new location and set marker
		google.maps.event.addListener(searchBox, 'place_changed', function()
		{
			place = searchBox.getPlace();
			myLatlng = new google.maps.LatLng(place.geometry.location.lat(),place.geometry.location.lng());
			if(map.getZoom() < 13)
				map.setZoom(13);
			map.setCenter(myLatlng);
			marker.setPosition(myLatlng);
			marker.setTitle(place.name.toString());
		});
		
}

function query()
{
	//Get search terms

	var bounds = map.getBounds();
	var center = bounds.getCenter();
	llat = center.lat();
	llong = center.lng();
	
	radius = getMapRadius();
	keywords = document.getElementById('pac-input-keyword').value;
	
	//Send AJAX request for meetup query
	var url = './meetup.php?lat='+llat+'&long='+llong+'&q='+keywords+'&r='+radius;
	xmlhttp=new XMLHttpRequest();
	xmlhttp.onreadystatechange=function()
	  {
		  if (xmlhttp.readyState==4 && xmlhttp.status==200)
			{
				eventData = eval("("+xmlhttp.responseText+")");
				document.getElementById("loading").style.display = "none";
				processEvents();
			}
	  }
	document.getElementById("loading").style.display = "block";
	xmlhttp.open("GET",'./meetup.php?lat='+llat+'&long='+llong+'&q='+keywords+'&r='+radius,true);
	xmlhttp.send();
}

//Add markers after running API query
function processEvents()
{
	//If no results are returned, stop.
	if(eventData == '0')
	{
		return 0;
	}
	
	//Delete older event markers
	if(eventMarkers != null)
		for(var i=0; i<eventMarkers.length; i++)
			eventMarkers[i].setMap(null);
	
	eventMarkers = new Array();
	
	var mIcon, mSize;
	
	//For each item in query result, initialize marker and info window
	for(var i=0; i< eventData.length; i++)
	{
		if(eventData[i]['fee'] == 0)
			mIcon = 'green';
		else
			mIcon = 'purple';
			
		mSize = 32+eventData[i]['yes_rsvp_count']/2;

		  var image = {
			url: './images/'+mIcon+'-dot.png',
			scaledSize: new google.maps.Size(mSize, mSize),
			};	

		//Create an event marker
		eventMarkers[i] =  new google.maps.Marker({
								position: new google.maps.LatLng(eventData[i]['group_lat'], eventData[i]['group_lon']),
								map: map,
								icon: image,
								title: eventData[i]['name'],
								size: new google.maps.Size(mSize, mSize)
							});
		
		//Set description (to be used as InfoWindow text)
		eventMarkers[i].desc = '<h3><a href="'+eventData[i]['event_url']+'" target="_blank">'+eventData[i]['name']+'</a></h3>'+'<i>'+eventData[i]['group_name']+
								 '</i><br>'+eventData[i]['yes_rsvp_count']+' attending<br>'+
								 'Fee: '+eventData[i]['fee']+'<br>'+new Date(eventData[i]['time']);
		
		//Add marker to OMS
		oms.addMarker(eventMarkers[i]);
		
	}
}

//Geolocation feature
function geolocate()
{
	if(navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
		myLatlng = new google.maps.LatLng(position.coords.latitude,
                                       position.coords.longitude);
		
		if(map.getZoom() < 13)
				map.setZoom(13);
		marker.setPosition(myLatlng);
		marker.setTitle("Your Location");							   
		map.setCenter(myLatlng);
    }, function() {
      handleNoGeolocation(true);
    });
  } else {
    // Browser doesn't support Geolocation
    handleNoGeolocation(false);
  }
}

function getMapRadius()
{
	//Source: http://stackoverflow.com/questions/3525670/radius-of-viewable-region-in-google-maps-v3
		
	var bounds = map.getBounds();
	var center = bounds.getCenter();
	var ne = bounds.getNorthEast();

	// r = radius of the earth in statute miles
	var r = 3963.0;  

	// Convert lat or lng from decimal degrees into radians (divide by 57.2958)
	var lat1 = center.lat() / 57.2958; 
	var lon1 = center.lng() / 57.2958;
	var lat2 = ne.lat() / 57.2958;
	var lon2 = ne.lng() / 57.2958;

	// distance = circle radius from center to Northeast corner of bounds
	var dis = r * Math.acos(Math.sin(lat1) * Math.sin(lat2) + 
	  Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1));
	  
	return dis;
}

//Initialize Map
google.maps.event.addDomListener(window, 'load', initialize);


<?php

$api_key = 'INSERT_YOUR_API_KEY_HERE';

$url = 'https://api.meetup.com/2/open_events?and_text=1&sign=true&photo-host=secure&key='.$api_key.'&text=';

//Get input parameters from query string
$lat = isset($_GET['lat'])?urlencode($_GET['lat']):'';

if(empty($lat))
	exit();
	
$radius = isset($_GET['r'])?urlencode($_GET['r']):'';
$lon = isset($_GET['long'])?urlencode($_GET['long']):'';
$text = isset($_GET['q'])?urlencode($_GET['q']):'';

//Maximum radius is 100.
if($radius > 100)
	$radius = 100;

//This is the final API query URL
$url = $url.$text.'&lat='.$lat.'&lon='.$lon.'&radius='.$radius;

//Run query
$result =  json_decode(file_get_contents($url), true);

//$result =  json_decode(file_get_contents('events.json'), true);

//If no results are found..
if($result['meta']['total_count'] == 0)
	exit('0');
	
//Write necessary information to array
$markers = array();

//Push each event's data into array
foreach($result['results'] as $r)
{
	
	$fee = isset($r['fee'])?$r['fee']['amount']:0;
	$m = array(
				'name' => $r['name'], 'yes_rsvp_count' => $r['yes_rsvp_count'], 'time' => $r['time'],
				'event_url' => $r['event_url'], 'group_name' => $r['group']['name'], 'fee' => $fee,
				'group_lat' => $r['group']['group_lat'], 'group_lon' => $r['group']['group_lon']
			   );
	array_push($markers, $m);
}

//Print result as JSON
echo json_encode($markers);

?>
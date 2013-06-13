<?php

	$gpx = $_REQUEST['gpx'];
	$format = 'xml';

	if (isset($_REQUEST['format'])) {
		$format = $_REQUEST['format'];
	}

	$curl = curl_init($gpx);
	curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($curl, CURLOPT_FOLLOWLOCATION, 1);
	curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
	curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
	$xml = curl_exec($curl);
	curl_close($curl);

	if ($xml) {
		if ($format == 'json') { 
			header('Content-Type: application/json');
			echo json_encode(new SimpleXMLElement($xml));
		} else {
			header('Content-type: application/xml');
			echo $xml;
		}
	} else {
		echo '{"error":true}';
	}

?>
(function(window) {

	var params = {};
	window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
	  params[key] = value;
	});

	var grunnkart = L.tileLayer.kartverket('norges_grunnkart'),
		topo2 = L.tileLayer.kartverket('topo2'),
		toporaster = L.tileLayer.kartverket('toporaster2_rik'),
		sjokart = L.tileLayer.kartverket('sjo_hovedkart2'),
		europa = L.tileLayer.kartverket('europa'),	
		dybdedata = L.tileLayer.kartverket.wms('wms.dybdedata', { layers: 'Dybdedata_MS_WMS' }),
		kommuner = L.tileLayer.kartverket.wms('wms.abas', { layers: 'Kommunegrenser,Kommunenavn' }),
		fylker = L.tileLayer.kartverket.wms('wms.abas', { layers: 'Fylkesgrenser,Fylkesnavn' }),
		historisk = L.tileLayer.kartverket.wms('wms.historiskekart', { layers: 'historiskekart', 'maxZoom': 10 }),
		maritim = L.tileLayer.kartverket.wms('wms.nmg', { layers: 'nmg_WMS'});

	var map = new L.Map('map', {
		crs: new L.Proj.CRS('EPSG:32633', '+proj=utm +zone=33 +ellps=WGS84 +datum=WGS84 +units=m +no_defs', {
			origin: [-2500000, 9045984], 
	    	resolutions: [21664, 10832, 5416, 2708, 1354, 677, 338.5, 169.25, 84.625, 42.3125, 21.15625, 10.578125, 5.2890625, 2.64453125, 1.322265625, 0.6611328125, 0.33056640625, 0.165283203125],
	  	}),
		layers: [ grunnkart ],
		minZoom: 0,
		maxZoom: 17,
		continuousWorld: true
	});

	map.attributionControl.setPrefix('Levert av thematicmapping.org - Kart: © Kartverket');

	L.control.layers({  
		'Norges grunnkart': grunnkart,
		'Topografisk': topo2,
		'Papirkart': toporaster,	
		'Sjøkart': sjokart,
		'Historiske kart': historisk
	}, {
		'Sjødybder': dybdedata,
		'Fylker': fylker,
		'Kommuner': kommuner,
		'Maritime grenser': maritim
	}).addTo(map);

	var hash = new L.Hash(map);

	L.control.scale({
		imperial: false
	}).addTo(map);

	if (params.gpx) {
		
		new L.GPX('proxy/gpx.php?gpx=' + params.gpx, {
			async: true,
			marker_options: {
			    startIconUrl: 'img/pin-icon-start.png',
			    endIconUrl:   'img/pin-icon-end.png',
			    shadowUrl:    'img/pin-shadow.png',
		    }
		}).on('loaded', function(evt) {
			var gpx = evt.target,
				popup = '{distance}';

			gpx.bindPopup(L.Util.template(popup, {
				distance: (gpx.get_distance() / 1000).toFixed(2) + ' km'
			}));

			map.fitBounds(gpx.getBounds());
		}).addTo(map);

	} else {

		map.locate({
			setView: true, 
			maxZoom: 10
		});

		map.on('locationerror', function(evt){
			map.fitBounds([[58.4, 4.1], [71.1, 29.2]]);
		});

	}

})(window);


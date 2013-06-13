/*
 * L.TileLayer.Kartverket is used for fetch cached WMTS map tiles from Kartverket.
 * http://statkart.no/Kart/Kartverksted/Visningstjenester/
 */

L.TileLayer.Kartverket = L.TileLayer.extend({
	options: {
		service: 'WMTS',
		request: 'GetTile',
		version: '1.0.0',
		layer: '',
		style: 'default',
		format: 'image/png',
		continuousWorld: true,
		projectedBounds: [-2500000, 3500000, 3045984, 9045984]
	},

	initialize: function (layer, options) {
		options = options || {};
		options.layer = layer;
		var url = 'http://opencache.statkart.no/gatekeeper/gk/gk.open_wmts?SERVICE={service}&REQUEST={request}&VERSION={version}&LAYER={layer}&STYLE={style}&TILEMATRIXSET={crs}&TILEMATRIX={crs}:{z}&TILEROW={y}&TILECOL={x}&FORMAT={format}';	
		L.TileLayer.prototype.initialize.call(this, url, options);
	},

	onAdd: function (map) {
		if (!this.options.crs) {
			this.options.crs = map.options.crs.code;
		}
		L.TileLayer.prototype.onAdd.call(this, map);
	},

	_tileShouldBeLoaded: function (tilePoint) {
		if ((tilePoint.x + ':' + tilePoint.y) in this._tiles) {
			return false; // already loaded
		}

		var options = this.options;

		if (options.projectedBounds) {
			var map = this._map,
				tileSize = options.tileSize,
			    projectedTileSize = tileSize / map.options.crs.scale(map.getZoom());
			    bounds = this.options.projectedBounds,
				numTiles = (bounds[2] - bounds[0]) / projectedTileSize;

			if (tilePoint.x < 0 || tilePoint.y < 0 || tilePoint.x >= numTiles || tilePoint.y >= numTiles) {
				return false;
			}
		}

		return true;
	}

});

L.tileLayer.kartverket = function (layer, options) {
	return new L.TileLayer.Kartverket(layer, options);
};


/*
 * L.TileLayer.Kartverket.WMS
 * http://statkart.no/Kart/Kartverksted/Visningstjenester/WMS-tjenester/
 */

L.TileLayer.Kartverket.WMS = L.TileLayer.WMS.extend({

	options: {
		tileSize: 1024,	
		projectedBounds: [-2500000, 3500000, 3045984, 9045984]
	},

	defaultWmsParams: {
		service: 'WMS',
		request: 'GetMap',
		version: '1.1.1',
		layers: '',
		styles: '',
		format: 'image/png',
		transparent: true
	},

	initialize: function (layer, options) {
		var url = 'http://openwms.statkart.no/skwms1/' + layer;	
		L.TileLayer.WMS.prototype.initialize.call(this, url, options);
	},

	_loadTile: function (tile, tilePoint) {
		tile._layer  = this;
		tile.onload  = this._tileOnLoad;
		tile.onerror = this._tileOnError;

		this._adjustTilePoint(tilePoint);
		tile.src     = this.getTileUrl(tilePoint);
	},

	_tileShouldBeLoaded: function (tilePoint) {
		if ((tilePoint.x + ':' + tilePoint.y) in this._tiles) {
			return false; // already loaded
		}

		var options = this.options;

		if (options.projectedBounds) {
			var map = this._map,
				tileSize = options.tileSize,
			    projectedTileSize = tileSize / map.options.crs.scale(map.getZoom());
			    bounds = this.options.projectedBounds,
				numTiles = (bounds[2] - bounds[0]) / projectedTileSize;

			if (tilePoint.x < 0 || tilePoint.y < 0 || tilePoint.x >= numTiles || tilePoint.y >= numTiles) {
				return false;
			}
		}

		return true;
	},

	getTileUrl: function (tilePoint) { 
		var map = this._map,
			zoom = map.zoom,
		    crs = map.options.crs,
		    tileSize = this.options.tileSize,
		    projectedTileSize = tileSize / map.options.crs.scale(map.getZoom());
		    bounds = this.options.projectedBounds,

		    left = bounds[0] + (projectedTileSize * tilePoint.x),
		    right = left + projectedTileSize,
		    topx = bounds[3] - (projectedTileSize * tilePoint.y),
		    bottom = topx - projectedTileSize,

		    bbox = [left, bottom, right, topx].join(','),
		    url = L.Util.template(this._url, {s: this._getSubdomain(tilePoint)});

		return url + L.Util.getParamString(this.wmsParams, url) + '&bbox=' + bbox;
	}


});

L.tileLayer.kartverket.wms = function (layer, options) {
	return new L.TileLayer.Kartverket.WMS(layer, options);
};


/*
 * L.Control.Stedsnavnsok 
 * http://statkart.no/Kart/Kartverksted/Stedsnavnsok/
 * http://statkart.no/Documents/Kart/Stedsnavn/Veledning_indeksert_stedsnavnsok.pdf
 */

L.Control.Stedsnavnsok = L.Control.extend({
	options: {
		position: 'topleft',
		popup: '<strong>{stedsnavn}</strong><br>{navnetype}<br>{kommunenavn}<br>{fylkesnavn}'
	},

	initialize: function (options) {
		L.setOptions(this, options);
	},

	onAdd: function (map) {
		this._initLayout();
		this._search();
		return this._container;
	},

	_initLayout: function () {
		var className = 'leaflet-control-layers',
		    container = this._container = L.DomUtil.create('div', className);
	},

	_search: function () {
		var params = {
				navn: 'Jelsa' 
			},
			//crs = this._map.options.crs,
			//bounds = this._map.getBounds(),
			//southWest = crs.project(bounds.getSouthWest()),
			//northEast = crs.project(bounds.getNorthEast()),
			self = this;

		/*
		params.nordLL = Math.round(southWest.y);
		params.ostLL  = Math.round(southWest.x);
		params.nordUR = Math.round(northEast.y);
		params.ostUR  = Math.round(northEast.x);
		*/

		reqwest({
			url: 'proxy/stedsnavn.php',
		    type: 'json',
		    method: 'post',
		    data: params,
		    error: function (err) {}, 
		    success: function (resp) {
		    	self._showResult(resp);
		    },
		    scope: this
		});
	},

	_showResult: function (data) {
		if (data.stedsnavn) {
			var group = L.featureGroup();

			for (var i = 0; i < data.stedsnavn.length; i++) {
				var sted = data.stedsnavn[i],
				    marker = L.marker([sted.nord, sted.aust]);//.addTo(map);

				group.addLayer(marker);

				marker.bindPopup(L.Util.template(this.options.popup, sted));
			};

			group.addTo(this._map);
			this._map.fitBounds(group.getBounds());
		}

	}


});

L.control.stedsnavnsok = function (options) {
	return new L.Control.Stedsnavnsok(options);
};


/*
 * L.Control.Hoydeprofil 
 * http://statkart.no/Kart/Kartverksted/Hoydeprofil/
 */

L.Control.Hoydeprofil = L.Control.extend({
	options: {
		position: 'topleft'
	}
});

L.control.hoydeprofil = function (options) {
	return new L.Control.Hoydeprofil(options);
};
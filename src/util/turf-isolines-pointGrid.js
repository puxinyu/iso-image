/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});

	var _pointGrid = __webpack_require__(10);

	var _pointGrid2 = _interopRequireDefault(_pointGrid);

	var _isolines = __webpack_require__(5);

	var _isolines2 = _interopRequireDefault(_isolines);

	var _bezierSpline = __webpack_require__(15);

	var _bezierSpline2 = _interopRequireDefault(_bezierSpline);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	var lineString = function lineString(coordinates, properties, options) {
	  if (options === void 0) {
	    options = {};
	  }
	  if (coordinates.length < 2) {
	    throw new Error('coordinates must be an array of two or more positions');
	  }
	  var geom = {
	    type: 'LineString',
	    coordinates: coordinates
	  };
	  return feature(geom, properties, options);
	};

	if (window) {
		window['turfPointGrid'] = _pointGrid2.default;
		window['turfIsolines'] = _isolines2.default;
		window['turfBezierSpline'] = _bezierSpline2.default;
		window['turfLineString'] = lineString;
	}

	exports.default = _pointGrid2.default;

/***/ }),
/* 1 */,
/* 2 */,
/* 3 */,
/* 4 */,
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

	var bbox = _interopDefault(__webpack_require__(6));
	var meta = __webpack_require__(7);
	var invariant = __webpack_require__(9);
	var helpers = __webpack_require__(8);

	/**
	 * @license GNU Affero General Public License.
	 * Copyright (c) 2015, 2015 Ronny Lorenz <ronny@tbi.univie.ac.at>
	 * v. 1.2.0
	 * https://github.com/RaumZeit/MarchingSquares.js
	 */

	/**
	 * Compute the isocontour(s) of a scalar 2D field given
	 * a certain threshold by applying the Marching Squares
	 * Algorithm. The function returns a list of path coordinates
	 */
	var defaultSettings = {
	    successCallback: null,
	    verbose: false
	};

	var settings = {};

	function isoContours(data, threshold, options) {
	    /* process options */
	    options = options ? options : {};

	    var optionKeys = Object.keys(defaultSettings);

	    for (var i = 0; i < optionKeys.length; i++) {
	        var key = optionKeys[i];
	        var val = options[key];
	        val = ((typeof val !== 'undefined') && (val !== null)) ? val : defaultSettings[key];

	        settings[key] = val;
	    }

	    if (settings.verbose)
	        console.log('MarchingSquaresJS-isoContours: computing isocontour for ' + threshold);

	    var ret = contourGrid2Paths(computeContourGrid(data, threshold));

	    if (typeof settings.successCallback === 'function')
	        settings.successCallback(ret);

	    return ret;
	}

	/*
	  Thats all for the public interface, below follows the actual
	  implementation
	*/

	/*
	################################
	Isocontour implementation below
	################################
	*/

	/* assume that x1 == 1 &&  x0 == 0 */
	function interpolateX(y, y0, y1) {
	    return (y - y0) / (y1 - y0);
	}

	/* compute the isocontour 4-bit grid */
	function computeContourGrid(data, threshold) {
	    var rows = data.length - 1;
	    var cols = data[0].length - 1;
	    var ContourGrid = { rows: rows, cols: cols, cells: [] };

	    for (var j = 0; j < rows; ++j) {
	        ContourGrid.cells[j] = [];
	        for (var i = 0; i < cols; ++i) {
	            /* compose the 4-bit corner representation */
	            var cval = 0;

	            var tl = data[j + 1][i];
	            var tr = data[j + 1][i + 1];
	            var br = data[j][i + 1];
	            var bl = data[j][i];

	            if (isNaN(tl) || isNaN(tr) || isNaN(br) || isNaN(bl)) {
	                continue;
	            }
	            cval |= ((tl >= threshold) ? 8 : 0);
	            cval |= ((tr >= threshold) ? 4 : 0);
	            cval |= ((br >= threshold) ? 2 : 0);
	            cval |= ((bl >= threshold) ? 1 : 0);

	            /* resolve ambiguity for cval == 5 || 10 via averaging */
	            var flipped = false;
	            if (cval === 5 || cval === 10) {
	                var average = (tl + tr + br + bl) / 4;
	                if (cval === 5 && (average < threshold)) {
	                    cval = 10;
	                    flipped = true;
	                } else if (cval === 10 && (average < threshold)) {
	                    cval = 5;
	                    flipped = true;
	                }
	            }

	            /* add cell to ContourGrid if it contains edges */
	            if (cval !== 0 && cval !== 15) {
	                var top, bottom, left, right;
	                top = bottom = left = right = 0.5;
	                /* interpolate edges of cell */
	                if (cval === 1) {
	                    left    = 1 - interpolateX(threshold, tl, bl);
	                    bottom  = 1 - interpolateX(threshold, br, bl);
	                } else if (cval === 2) {
	                    bottom  = interpolateX(threshold, bl, br);
	                    right   = 1 - interpolateX(threshold, tr, br);
	                } else if (cval === 3) {
	                    left    = 1 - interpolateX(threshold, tl, bl);
	                    right   = 1 - interpolateX(threshold, tr, br);
	                } else if (cval === 4) {
	                    top     = interpolateX(threshold, tl, tr);
	                    right   = interpolateX(threshold, br, tr);
	                } else if (cval === 5) {
	                    top     = interpolateX(threshold, tl, tr);
	                    right   = interpolateX(threshold, br, tr);
	                    bottom  = 1 - interpolateX(threshold, br, bl);
	                    left    = 1 - interpolateX(threshold, tl, bl);
	                } else if (cval === 6) {
	                    bottom  = interpolateX(threshold, bl, br);
	                    top     = interpolateX(threshold, tl, tr);
	                } else if (cval === 7) {
	                    left    = 1 - interpolateX(threshold, tl, bl);
	                    top     = interpolateX(threshold, tl, tr);
	                } else if (cval === 8) {
	                    left    = interpolateX(threshold, bl, tl);
	                    top     = 1 - interpolateX(threshold, tr, tl);
	                } else if (cval === 9) {
	                    bottom  = 1 - interpolateX(threshold, br, bl);
	                    top     = 1 - interpolateX(threshold, tr, tl);
	                } else if (cval === 10) {
	                    top     = 1 - interpolateX(threshold, tr, tl);
	                    right   = 1 - interpolateX(threshold, tr, br);
	                    bottom  = interpolateX(threshold, bl, br);
	                    left    = interpolateX(threshold, bl, tl);
	                } else if (cval === 11) {
	                    top     = 1 - interpolateX(threshold, tr, tl);
	                    right   = 1 - interpolateX(threshold, tr, br);
	                } else if (cval === 12) {
	                    left    = interpolateX(threshold, bl, tl);
	                    right   = interpolateX(threshold, br, tr);
	                } else if (cval === 13) {
	                    bottom  = 1 - interpolateX(threshold, br, bl);
	                    right   = interpolateX(threshold, br, tr);
	                } else if (cval === 14) {
	                    left    = interpolateX(threshold, bl, tl);
	                    bottom  = interpolateX(threshold, bl, br);
	                } else {
	                    console.log('MarchingSquaresJS-isoContours: Illegal cval detected: ' + cval);
	                }
	                ContourGrid.cells[j][i] = {
	                    cval: cval,
	                    flipped: flipped,
	                    top: top,
	                    right: right,
	                    bottom: bottom,
	                    left: left
	                };
	            }

	        }
	    }

	    return ContourGrid;
	}

	function isSaddle(cell) {
	    return cell.cval === 5 || cell.cval === 10;
	}

	function isTrivial(cell) {
	    return cell.cval === 0 || cell.cval === 15;
	}

	function clearCell(cell) {
	    if ((!isTrivial(cell)) && (cell.cval !== 5) && (cell.cval !== 10)) {
	        cell.cval = 15;
	    }
	}

	function getXY(cell, edge) {
	    if (edge === 'top') {
	        return [cell.top, 1.0];
	    } else if (edge === 'bottom') {
	        return [cell.bottom, 0.0];
	    } else if (edge === 'right') {
	        return [1.0, cell.right];
	    } else if (edge === 'left') {
	        return [0.0, cell.left];
	    }
	}

	function contourGrid2Paths(grid) {
	    var paths = [];
	    var path_idx = 0;
	    var rows = grid.rows;
	    var cols = grid.cols;
	    var epsilon = 1e-7;

	    grid.cells.forEach(function (g, j) {
	        g.forEach(function (gg, i) {
	            if ((typeof gg !== 'undefined') && (!isSaddle(gg)) && (!isTrivial(gg))) {
	                var p = tracePath(grid.cells, j, i);
	                var merged = false;
	                /* we may try to merge paths at this point */
	                if (p.info === 'mergeable') {
	                    /*
	            search backwards through the path array to find an entry
	            that starts with where the current path ends...
	          */
	                    var x = p.path[p.path.length - 1][0],
	                        y = p.path[p.path.length - 1][1];

	                    for (var k = path_idx - 1; k >= 0; k--) {
	                        if ((Math.abs(paths[k][0][0] - x) <= epsilon) && (Math.abs(paths[k][0][1] - y) <= epsilon)) {
	                            for (var l = p.path.length - 2; l >= 0; --l) {
	                                paths[k].unshift(p.path[l]);
	                            }
	                            merged = true;
	                            break;
	                        }
	                    }
	                }
	                if (!merged)
	                    paths[path_idx++] = p.path;
	            }
	        });
	    });

	    return paths;
	}

	/*
	  construct consecutive line segments from starting cell by
	  walking arround the enclosed area clock-wise
	  */
	function tracePath(grid, j, i) {
	    var maxj = grid.length;
	    var p = [];
	    var dxContour = [0, 0, 1, 1, 0, 0, 0, 0, -1, 0, 1, 1, -1, 0, -1, 0];
	    var dyContour = [0, -1, 0, 0, 1, 1, 1, 1, 0, -1, 0, 0, 0, -1, 0, 0];
	    var dx, dy;
	    var startEdge = ['none', 'left', 'bottom', 'left', 'right', 'none', 'bottom', 'left', 'top', 'top', 'none', 'top', 'right', 'right', 'bottom', 'none'];
	    var nextEdge  = ['none', 'bottom', 'right', 'right', 'top', 'top', 'top', 'top', 'left', 'bottom', 'right', 'right', 'left', 'bottom', 'left', 'none'];
	    var edge;

	    var startCell   = grid[j][i];
	    var currentCell = grid[j][i];

	    var cval = currentCell.cval;
	    var edge = startEdge[cval];

	    var pt = getXY(currentCell, edge);

	    /* push initial segment */
	    p.push([i + pt[0], j + pt[1]]);
	    edge = nextEdge[cval];
	    pt = getXY(currentCell, edge);
	    p.push([i + pt[0], j + pt[1]]);
	    clearCell(currentCell);

	    /* now walk arround the enclosed area in clockwise-direction */
	    var k = i + dxContour[cval];
	    var l = j + dyContour[cval];
	    var prev_cval = cval;

	    while ((k >= 0) && (l >= 0) && (l < maxj) && ((k != i) || (l != j))) {
	        currentCell = grid[l][k];
	        if (typeof currentCell === 'undefined') { /* path ends here */
	            //console.log(k + " " + l + " is undefined, stopping path!");
	            break;
	        }
	        cval = currentCell.cval;
	        if ((cval === 0) || (cval === 15)) {
	            return { path: p, info: 'mergeable' };
	        }
	        edge  = nextEdge[cval];
	        dx    = dxContour[cval];
	        dy    = dyContour[cval];
	        if ((cval === 5) || (cval === 10)) {
	            /* select upper or lower band, depending on previous cells cval */
	            if (cval === 5) {
	                if (currentCell.flipped) { /* this is actually a flipped case 10 */
	                    if (dyContour[prev_cval] === -1) {
	                        edge  = 'left';
	                        dx    = -1;
	                        dy    = 0;
	                    } else {
	                        edge  = 'right';
	                        dx    = 1;
	                        dy    = 0;
	                    }
	                } else { /* real case 5 */
	                    if (dxContour[prev_cval] === -1) {
	                        edge  = 'bottom';
	                        dx    = 0;
	                        dy    = -1;
	                    }
	                }
	            } else if (cval === 10) {
	                if (currentCell.flipped) { /* this is actually a flipped case 5 */
	                    if (dxContour[prev_cval] === -1) {
	                        edge  = 'top';
	                        dx    = 0;
	                        dy    = 1;
	                    } else {
	                        edge  = 'bottom';
	                        dx    = 0;
	                        dy    = -1;
	                    }
	                } else {  /* real case 10 */
	                    if (dyContour[prev_cval] === 1) {
	                        edge  = 'left';
	                        dx    = -1;
	                        dy    = 0;
	                    }
	                }
	            }
	        }
	        pt = getXY(currentCell, edge);
	        p.push([k + pt[0], l + pt[1]]);
	        clearCell(currentCell);
	        k += dx;
	        l += dy;
	        prev_cval = cval;
	    }

	    return { path: p, info: 'closed' };
	}

	/**
	 * Takes a {@link Point} grid and returns a correspondent matrix {Array<Array<number>>}
	 * of the 'property' values
	 *
	 * @name gridToMatrix
	 * @param {FeatureCollection<Point>} grid of points
	 * @param {Object} [options={}] Optional parameters
	 * @param {string} [options.zProperty='elevation'] the property name in `points` from which z-values will be pulled
	 * @param {boolean} [options.flip=false] returns the matrix upside-down
	 * @param {boolean} [options.flags=false] flags, adding a `matrixPosition` array field ([row, column]) to its properties,
	 * the grid points with coordinates on the matrix
	 * @returns {Array<Array<number>>} matrix of property values
	 * @example
	 *   var extent = [-70.823364, -33.553984, -70.473175, -33.302986];
	 *   var cellSize = 3;
	 *   var grid = turf.pointGrid(extent, cellSize);
	 *   // add a random property to each point between 0 and 60
	 *   for (var i = 0; i < grid.features.length; i++) {
	 *     grid.features[i].properties.elevation = (Math.random() * 60);
	 *   }
	 *   gridToMatrix(grid);
	 *   //= [
	 *     [ 1, 13, 10,  9, 10, 13, 18],
	 *     [34,  8,  5,  4,  5,  8, 13],
	 *     [10,  5,  2,  1,  2,  5,  4],
	 *     [ 0,  4, 56, 19,  1,  4,  9],
	 *     [10,  5,  2,  1,  2,  5, 10],
	 *     [57,  8,  5,  4,  5,  0, 57],
	 *     [ 3, 13, 10,  9,  5, 13, 18],
	 *     [18, 13, 10,  9, 78, 13, 18]
	 *   ]
	 */
	function gridToMatrix(grid, options) {
	    // Optional parameters
	    options = options || {};
	    if (!helpers.isObject(options)) throw new Error('options is invalid');
	    var zProperty = options.zProperty || 'elevation';
	    var flip = options.flip;
	    var flags = options.flags;

	    // validation
	    invariant.collectionOf(grid, 'Point', 'input must contain Points');

	    var pointsMatrix = sortPointsByLatLng(grid, flip);

	    var matrix = [];
	    // create property matrix from sorted points
	    // looping order matters here
	    for (var r = 0; r < pointsMatrix.length; r++) {
	        var pointRow = pointsMatrix[r];
	        var row = [];
	        for (var c = 0; c < pointRow.length; c++) {
	            var point = pointRow[c];
	            // Check if zProperty exist
	            if (point.properties[zProperty]) row.push(point.properties[zProperty]);
	            else row.push(0);
	            // add flags
	            if (flags === true) point.properties.matrixPosition = [r, c];
	        }
	        matrix.push(row);
	    }

	    return matrix;
	}

	/**
	 * Sorts points by latitude and longitude, creating a 2-dimensional array of points
	 *
	 * @private
	 * @param {FeatureCollection<Point>} points GeoJSON Point features
	 * @param {boolean} [flip=false] returns the matrix upside-down
	 * @returns {Array<Array<Point>>} points ordered by latitude and longitude
	 */
	function sortPointsByLatLng(points, flip) {
	    var pointsByLatitude = {};

	    // divide points by rows with the same latitude
	    meta.featureEach(points, function (point) {
	        var lat = invariant.getCoords(point)[1];
	        if (!pointsByLatitude[lat]) pointsByLatitude[lat] = [];
	        pointsByLatitude[lat].push(point);
	    });

	    // sort points (with the same latitude) by longitude
	    var orderedRowsByLatitude = Object.keys(pointsByLatitude).map(function (lat) {
	        var row = pointsByLatitude[lat];
	        var rowOrderedByLongitude = row.sort(function (a, b) {
	            return invariant.getCoords(a)[0] - invariant.getCoords(b)[0];
	        });
	        return rowOrderedByLongitude;
	    });

	    // sort rows (of points with the same latitude) by latitude
	    var pointMatrix = orderedRowsByLatitude.sort(function (a, b) {
	        if (flip) return invariant.getCoords(a[0])[1] - invariant.getCoords(b[0])[1];
	        else return invariant.getCoords(b[0])[1] - invariant.getCoords(a[0])[1];
	    });

	    return pointMatrix;
	}

	/**
	 * Takes a grid {@link FeatureCollection} of {@link Point} features with z-values and an array of
	 * value breaks and generates [isolines](http://en.wikipedia.org/wiki/Isoline).
	 *
	 * @name isolines
	 * @param {FeatureCollection<Point>} pointGrid input points
	 * @param {Array<number>} breaks values of `zProperty` where to draw isolines
	 * @param {Object} [options={}] Optional parameters
	 * @param {string} [options.zProperty='elevation'] the property name in `points` from which z-values will be pulled
	 * @param {Object} [options.commonProperties={}] GeoJSON properties passed to ALL isolines
	 * @param {Array<Object>} [options.breaksProperties=[]] GeoJSON properties passed, in order, to the correspondent isoline;
	 * the breaks array will define the order in which the isolines are created
	 * @returns {FeatureCollection<MultiLineString>} a FeatureCollection of {@link MultiLineString} features representing isolines
	 * @example
	 * // create a grid of points with random z-values in their properties
	 * var extent = [0, 30, 20, 50];
	 * var cellWidth = 100;
	 * var pointGrid = turf.pointGrid(extent, cellWidth, {units: 'miles'});
	 *
	 * for (var i = 0; i < pointGrid.features.length; i++) {
	 *     pointGrid.features[i].properties.temperature = Math.random() * 10;
	 * }
	 * var breaks = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
	 *
	 * var lines = turf.isolines(pointGrid, breaks, {zProperty: 'temperature'});
	 *
	 * //addToMap
	 * var addToMap = [lines];
	 */
	function isolines(pointGrid, breaks, options) {
	    // Optional parameters
	    options = options || {};
	    if (!helpers.isObject(options)) throw new Error('options is invalid');
	    var zProperty = options.zProperty || 'elevation';
	    var commonProperties = options.commonProperties || {};
	    var breaksProperties = options.breaksProperties || [];

	    // Input validation
	    invariant.collectionOf(pointGrid, 'Point', 'Input must contain Points');
	    if (!breaks) throw new Error('breaks is required');
	    if (!Array.isArray(breaks)) throw new Error('breaks must be an Array');
	    if (!helpers.isObject(commonProperties)) throw new Error('commonProperties must be an Object');
	    if (!Array.isArray(breaksProperties)) throw new Error('breaksProperties must be an Array');

	    // Isoline methods
	    var matrix = gridToMatrix(pointGrid, {zProperty: zProperty, flip: true});
	    var createdIsoLines = createIsoLines(matrix, breaks, zProperty, commonProperties, breaksProperties);
	    var scaledIsolines = rescaleIsolines(createdIsoLines, matrix, pointGrid);

	    return helpers.featureCollection(scaledIsolines);
	}

	/**
	 * Creates the isolines lines (featuresCollection of MultiLineString features) from the 2D data grid
	 *
	 * Marchingsquares process the grid data as a 3D representation of a function on a 2D plane, therefore it
	 * assumes the points (x-y coordinates) are one 'unit' distance. The result of the isolines function needs to be
	 * rescaled, with turfjs, to the original area and proportions on the map
	 *
	 * @private
	 * @param {Array<Array<number>>} matrix Grid Data
	 * @param {Array<number>} breaks Breaks
	 * @param {string} zProperty name of the z-values property
	 * @param {Object} [commonProperties={}] GeoJSON properties passed to ALL isolines
	 * @param {Object} [breaksProperties=[]] GeoJSON properties passed to the correspondent isoline
	 * @returns {Array<MultiLineString>} isolines
	 */
	function createIsoLines(matrix, breaks, zProperty, commonProperties, breaksProperties) {
	    var results = [];
	    for (var i = 1; i < breaks.length; i++) {
	        var threshold = +breaks[i]; // make sure it's a number

	        var properties = Object.assign(
	            {},
	            commonProperties,
	            breaksProperties[i]
	        );
	        properties[zProperty] = threshold;
	        var isoline = helpers.multiLineString(isoContours(matrix, threshold), properties);

	        results.push(isoline);
	    }
	    return results;
	}

	/**
	 * Translates and scales isolines
	 *
	 * @private
	 * @param {Array<MultiLineString>} createdIsoLines to be rescaled
	 * @param {Array<Array<number>>} matrix Grid Data
	 * @param {Object} points Points by Latitude
	 * @returns {Array<MultiLineString>} isolines
	 */
	function rescaleIsolines(createdIsoLines, matrix, points) {

	    // get dimensions (on the map) of the original grid
	    var gridBbox = bbox(points); // [ minX, minY, maxX, maxY ]
	    var originalWidth = gridBbox[2] - gridBbox[0];
	    var originalHeigth = gridBbox[3] - gridBbox[1];

	    // get origin, which is the first point of the last row on the rectangular data on the map
	    var x0 = gridBbox[0];
	    var y0 = gridBbox[1];

	    // get number of cells per side
	    var matrixWidth = matrix[0].length - 1;
	    var matrixHeight = matrix.length - 1;

	    // calculate the scaling factor between matrix and rectangular grid on the map
	    var scaleX = originalWidth / matrixWidth;
	    var scaleY = originalHeigth / matrixHeight;

	    var resize = function (point) {
	        point[0] = point[0] * scaleX + x0;
	        point[1] = point[1] * scaleY + y0;
	    };

	    // resize and shift each point/line of the createdIsoLines
	    createdIsoLines.forEach(function (isoline) {
	        meta.coordEach(isoline, resize);
	    });
	    return createdIsoLines;
	}

	module.exports = isolines;
	module.exports.default = isolines;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var meta = __webpack_require__(7);

	/**
	 * Takes a set of features, calculates the bbox of all input features, and returns a bounding box.
	 *
	 * @name bbox
	 * @param {GeoJSON} geojson any GeoJSON object
	 * @returns {BBox} bbox extent in [minX, minY, maxX, maxY] order
	 * @example
	 * var line = turf.lineString([[-74, 40], [-78, 42], [-82, 35]]);
	 * var bbox = turf.bbox(line);
	 * var bboxPolygon = turf.bboxPolygon(bbox);
	 *
	 * //addToMap
	 * var addToMap = [line, bboxPolygon]
	 */
	function bbox(geojson) {
	    var BBox = [Infinity, Infinity, -Infinity, -Infinity];
	    meta.coordEach(geojson, function (coord) {
	        if (BBox[0] > coord[0]) BBox[0] = coord[0];
	        if (BBox[1] > coord[1]) BBox[1] = coord[1];
	        if (BBox[2] < coord[0]) BBox[2] = coord[0];
	        if (BBox[3] < coord[1]) BBox[3] = coord[1];
	    });
	    return BBox;
	}

	module.exports = bbox;
	module.exports.default = bbox;


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', { value: true });

	var helpers = __webpack_require__(8);

	/**
	 * Callback for coordEach
	 *
	 * @callback coordEachCallback
	 * @param {Array<number>} currentCoord The current coordinate being processed.
	 * @param {number} coordIndex The current index of the coordinate being processed.
	 * @param {number} featureIndex The current index of the Feature being processed.
	 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
	 * @param {number} geometryIndex The current index of the Geometry being processed.
	 */

	/**
	 * Iterate over coordinates in any GeoJSON object, similar to Array.forEach()
	 *
	 * @name coordEach
	 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
	 * @param {Function} callback a method that takes (currentCoord, coordIndex, featureIndex, multiFeatureIndex)
	 * @param {boolean} [excludeWrapCoord=false] whether or not to include the final coordinate of LinearRings that wraps the ring in its iteration.
	 * @returns {void}
	 * @example
	 * var features = turf.featureCollection([
	 *   turf.point([26, 37], {"foo": "bar"}),
	 *   turf.point([36, 53], {"hello": "world"})
	 * ]);
	 *
	 * turf.coordEach(features, function (currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) {
	 *   //=currentCoord
	 *   //=coordIndex
	 *   //=featureIndex
	 *   //=multiFeatureIndex
	 *   //=geometryIndex
	 * });
	 */
	function coordEach(geojson, callback, excludeWrapCoord) {
	    // Handles null Geometry -- Skips this GeoJSON
	    if (geojson === null) return;
	    var j, k, l, geometry, stopG, coords,
	        geometryMaybeCollection,
	        wrapShrink = 0,
	        coordIndex = 0,
	        isGeometryCollection,
	        type = geojson.type,
	        isFeatureCollection = type === 'FeatureCollection',
	        isFeature = type === 'Feature',
	        stop = isFeatureCollection ? geojson.features.length : 1;

	    // This logic may look a little weird. The reason why it is that way
	    // is because it's trying to be fast. GeoJSON supports multiple kinds
	    // of objects at its root: FeatureCollection, Features, Geometries.
	    // This function has the responsibility of handling all of them, and that
	    // means that some of the `for` loops you see below actually just don't apply
	    // to certain inputs. For instance, if you give this just a
	    // Point geometry, then both loops are short-circuited and all we do
	    // is gradually rename the input until it's called 'geometry'.
	    //
	    // This also aims to allocate as few resources as possible: just a
	    // few numbers and booleans, rather than any temporary arrays as would
	    // be required with the normalization approach.
	    for (var featureIndex = 0; featureIndex < stop; featureIndex++) {
	        geometryMaybeCollection = (isFeatureCollection ? geojson.features[featureIndex].geometry :
	            (isFeature ? geojson.geometry : geojson));
	        isGeometryCollection = (geometryMaybeCollection) ? geometryMaybeCollection.type === 'GeometryCollection' : false;
	        stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1;

	        for (var geomIndex = 0; geomIndex < stopG; geomIndex++) {
	            var multiFeatureIndex = 0;
	            var geometryIndex = 0;
	            geometry = isGeometryCollection ?
	                geometryMaybeCollection.geometries[geomIndex] : geometryMaybeCollection;

	            // Handles null Geometry -- Skips this geometry
	            if (geometry === null) continue;
	            coords = geometry.coordinates;
	            var geomType = geometry.type;

	            wrapShrink = (excludeWrapCoord && (geomType === 'Polygon' || geomType === 'MultiPolygon')) ? 1 : 0;

	            switch (geomType) {
	            case null:
	                break;
	            case 'Point':
	                if (callback(coords, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) === false) return false;
	                coordIndex++;
	                multiFeatureIndex++;
	                break;
	            case 'LineString':
	            case 'MultiPoint':
	                for (j = 0; j < coords.length; j++) {
	                    if (callback(coords[j], coordIndex, featureIndex, multiFeatureIndex, geometryIndex) === false) return false;
	                    coordIndex++;
	                    if (geomType === 'MultiPoint') multiFeatureIndex++;
	                }
	                if (geomType === 'LineString') multiFeatureIndex++;
	                break;
	            case 'Polygon':
	            case 'MultiLineString':
	                for (j = 0; j < coords.length; j++) {
	                    for (k = 0; k < coords[j].length - wrapShrink; k++) {
	                        if (callback(coords[j][k], coordIndex, featureIndex, multiFeatureIndex, geometryIndex) === false) return false;
	                        coordIndex++;
	                    }
	                    if (geomType === 'MultiLineString') multiFeatureIndex++;
	                    if (geomType === 'Polygon') geometryIndex++;
	                }
	                if (geomType === 'Polygon') multiFeatureIndex++;
	                break;
	            case 'MultiPolygon':
	                for (j = 0; j < coords.length; j++) {
	                    if (geomType === 'MultiPolygon') geometryIndex = 0;
	                    for (k = 0; k < coords[j].length; k++) {
	                        for (l = 0; l < coords[j][k].length - wrapShrink; l++) {
	                            if (callback(coords[j][k][l], coordIndex, featureIndex, multiFeatureIndex, geometryIndex) === false) return false;
	                            coordIndex++;
	                        }
	                        geometryIndex++;
	                    }
	                    multiFeatureIndex++;
	                }
	                break;
	            case 'GeometryCollection':
	                for (j = 0; j < geometry.geometries.length; j++)
	                    if (coordEach(geometry.geometries[j], callback, excludeWrapCoord) === false) return false;
	                break;
	            default:
	                throw new Error('Unknown Geometry Type');
	            }
	        }
	    }
	}

	/**
	 * Callback for coordReduce
	 *
	 * The first time the callback function is called, the values provided as arguments depend
	 * on whether the reduce method has an initialValue argument.
	 *
	 * If an initialValue is provided to the reduce method:
	 *  - The previousValue argument is initialValue.
	 *  - The currentValue argument is the value of the first element present in the array.
	 *
	 * If an initialValue is not provided:
	 *  - The previousValue argument is the value of the first element present in the array.
	 *  - The currentValue argument is the value of the second element present in the array.
	 *
	 * @callback coordReduceCallback
	 * @param {*} previousValue The accumulated value previously returned in the last invocation
	 * of the callback, or initialValue, if supplied.
	 * @param {Array<number>} currentCoord The current coordinate being processed.
	 * @param {number} coordIndex The current index of the coordinate being processed.
	 * Starts at index 0, if an initialValue is provided, and at index 1 otherwise.
	 * @param {number} featureIndex The current index of the Feature being processed.
	 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
	 * @param {number} geometryIndex The current index of the Geometry being processed.
	 */

	/**
	 * Reduce coordinates in any GeoJSON object, similar to Array.reduce()
	 *
	 * @name coordReduce
	 * @param {FeatureCollection|Geometry|Feature} geojson any GeoJSON object
	 * @param {Function} callback a method that takes (previousValue, currentCoord, coordIndex)
	 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
	 * @param {boolean} [excludeWrapCoord=false] whether or not to include the final coordinate of LinearRings that wraps the ring in its iteration.
	 * @returns {*} The value that results from the reduction.
	 * @example
	 * var features = turf.featureCollection([
	 *   turf.point([26, 37], {"foo": "bar"}),
	 *   turf.point([36, 53], {"hello": "world"})
	 * ]);
	 *
	 * turf.coordReduce(features, function (previousValue, currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) {
	 *   //=previousValue
	 *   //=currentCoord
	 *   //=coordIndex
	 *   //=featureIndex
	 *   //=multiFeatureIndex
	 *   //=geometryIndex
	 *   return currentCoord;
	 * });
	 */
	function coordReduce(geojson, callback, initialValue, excludeWrapCoord) {
	    var previousValue = initialValue;
	    coordEach(geojson, function (currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex) {
	        if (coordIndex === 0 && initialValue === undefined) previousValue = currentCoord;
	        else previousValue = callback(previousValue, currentCoord, coordIndex, featureIndex, multiFeatureIndex, geometryIndex);
	    }, excludeWrapCoord);
	    return previousValue;
	}

	/**
	 * Callback for propEach
	 *
	 * @callback propEachCallback
	 * @param {Object} currentProperties The current Properties being processed.
	 * @param {number} featureIndex The current index of the Feature being processed.
	 */

	/**
	 * Iterate over properties in any GeoJSON object, similar to Array.forEach()
	 *
	 * @name propEach
	 * @param {FeatureCollection|Feature} geojson any GeoJSON object
	 * @param {Function} callback a method that takes (currentProperties, featureIndex)
	 * @returns {void}
	 * @example
	 * var features = turf.featureCollection([
	 *     turf.point([26, 37], {foo: 'bar'}),
	 *     turf.point([36, 53], {hello: 'world'})
	 * ]);
	 *
	 * turf.propEach(features, function (currentProperties, featureIndex) {
	 *   //=currentProperties
	 *   //=featureIndex
	 * });
	 */
	function propEach(geojson, callback) {
	    var i;
	    switch (geojson.type) {
	    case 'FeatureCollection':
	        for (i = 0; i < geojson.features.length; i++) {
	            if (callback(geojson.features[i].properties, i) === false) break;
	        }
	        break;
	    case 'Feature':
	        callback(geojson.properties, 0);
	        break;
	    }
	}


	/**
	 * Callback for propReduce
	 *
	 * The first time the callback function is called, the values provided as arguments depend
	 * on whether the reduce method has an initialValue argument.
	 *
	 * If an initialValue is provided to the reduce method:
	 *  - The previousValue argument is initialValue.
	 *  - The currentValue argument is the value of the first element present in the array.
	 *
	 * If an initialValue is not provided:
	 *  - The previousValue argument is the value of the first element present in the array.
	 *  - The currentValue argument is the value of the second element present in the array.
	 *
	 * @callback propReduceCallback
	 * @param {*} previousValue The accumulated value previously returned in the last invocation
	 * of the callback, or initialValue, if supplied.
	 * @param {*} currentProperties The current Properties being processed.
	 * @param {number} featureIndex The current index of the Feature being processed.
	 */

	/**
	 * Reduce properties in any GeoJSON object into a single value,
	 * similar to how Array.reduce works. However, in this case we lazily run
	 * the reduction, so an array of all properties is unnecessary.
	 *
	 * @name propReduce
	 * @param {FeatureCollection|Feature} geojson any GeoJSON object
	 * @param {Function} callback a method that takes (previousValue, currentProperties, featureIndex)
	 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
	 * @returns {*} The value that results from the reduction.
	 * @example
	 * var features = turf.featureCollection([
	 *     turf.point([26, 37], {foo: 'bar'}),
	 *     turf.point([36, 53], {hello: 'world'})
	 * ]);
	 *
	 * turf.propReduce(features, function (previousValue, currentProperties, featureIndex) {
	 *   //=previousValue
	 *   //=currentProperties
	 *   //=featureIndex
	 *   return currentProperties
	 * });
	 */
	function propReduce(geojson, callback, initialValue) {
	    var previousValue = initialValue;
	    propEach(geojson, function (currentProperties, featureIndex) {
	        if (featureIndex === 0 && initialValue === undefined) previousValue = currentProperties;
	        else previousValue = callback(previousValue, currentProperties, featureIndex);
	    });
	    return previousValue;
	}

	/**
	 * Callback for featureEach
	 *
	 * @callback featureEachCallback
	 * @param {Feature<any>} currentFeature The current Feature being processed.
	 * @param {number} featureIndex The current index of the Feature being processed.
	 */

	/**
	 * Iterate over features in any GeoJSON object, similar to
	 * Array.forEach.
	 *
	 * @name featureEach
	 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
	 * @param {Function} callback a method that takes (currentFeature, featureIndex)
	 * @returns {void}
	 * @example
	 * var features = turf.featureCollection([
	 *   turf.point([26, 37], {foo: 'bar'}),
	 *   turf.point([36, 53], {hello: 'world'})
	 * ]);
	 *
	 * turf.featureEach(features, function (currentFeature, featureIndex) {
	 *   //=currentFeature
	 *   //=featureIndex
	 * });
	 */
	function featureEach(geojson, callback) {
	    if (geojson.type === 'Feature') {
	        callback(geojson, 0);
	    } else if (geojson.type === 'FeatureCollection') {
	        for (var i = 0; i < geojson.features.length; i++) {
	            if (callback(geojson.features[i], i) === false) break;
	        }
	    }
	}

	/**
	 * Callback for featureReduce
	 *
	 * The first time the callback function is called, the values provided as arguments depend
	 * on whether the reduce method has an initialValue argument.
	 *
	 * If an initialValue is provided to the reduce method:
	 *  - The previousValue argument is initialValue.
	 *  - The currentValue argument is the value of the first element present in the array.
	 *
	 * If an initialValue is not provided:
	 *  - The previousValue argument is the value of the first element present in the array.
	 *  - The currentValue argument is the value of the second element present in the array.
	 *
	 * @callback featureReduceCallback
	 * @param {*} previousValue The accumulated value previously returned in the last invocation
	 * of the callback, or initialValue, if supplied.
	 * @param {Feature} currentFeature The current Feature being processed.
	 * @param {number} featureIndex The current index of the Feature being processed.
	 */

	/**
	 * Reduce features in any GeoJSON object, similar to Array.reduce().
	 *
	 * @name featureReduce
	 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
	 * @param {Function} callback a method that takes (previousValue, currentFeature, featureIndex)
	 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
	 * @returns {*} The value that results from the reduction.
	 * @example
	 * var features = turf.featureCollection([
	 *   turf.point([26, 37], {"foo": "bar"}),
	 *   turf.point([36, 53], {"hello": "world"})
	 * ]);
	 *
	 * turf.featureReduce(features, function (previousValue, currentFeature, featureIndex) {
	 *   //=previousValue
	 *   //=currentFeature
	 *   //=featureIndex
	 *   return currentFeature
	 * });
	 */
	function featureReduce(geojson, callback, initialValue) {
	    var previousValue = initialValue;
	    featureEach(geojson, function (currentFeature, featureIndex) {
	        if (featureIndex === 0 && initialValue === undefined) previousValue = currentFeature;
	        else previousValue = callback(previousValue, currentFeature, featureIndex);
	    });
	    return previousValue;
	}

	/**
	 * Get all coordinates from any GeoJSON object.
	 *
	 * @name coordAll
	 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
	 * @returns {Array<Array<number>>} coordinate position array
	 * @example
	 * var features = turf.featureCollection([
	 *   turf.point([26, 37], {foo: 'bar'}),
	 *   turf.point([36, 53], {hello: 'world'})
	 * ]);
	 *
	 * var coords = turf.coordAll(features);
	 * //= [[26, 37], [36, 53]]
	 */
	function coordAll(geojson) {
	    var coords = [];
	    coordEach(geojson, function (coord) {
	        coords.push(coord);
	    });
	    return coords;
	}

	/**
	 * Callback for geomEach
	 *
	 * @callback geomEachCallback
	 * @param {Geometry} currentGeometry The current Geometry being processed.
	 * @param {number} featureIndex The current index of the Feature being processed.
	 * @param {Object} featureProperties The current Feature Properties being processed.
	 * @param {Array<number>} featureBBox The current Feature BBox being processed.
	 * @param {number|string} featureId The current Feature Id being processed.
	 */

	/**
	 * Iterate over each geometry in any GeoJSON object, similar to Array.forEach()
	 *
	 * @name geomEach
	 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
	 * @param {Function} callback a method that takes (currentGeometry, featureIndex, featureProperties, featureBBox, featureId)
	 * @returns {void}
	 * @example
	 * var features = turf.featureCollection([
	 *     turf.point([26, 37], {foo: 'bar'}),
	 *     turf.point([36, 53], {hello: 'world'})
	 * ]);
	 *
	 * turf.geomEach(features, function (currentGeometry, featureIndex, featureProperties, featureBBox, featureId) {
	 *   //=currentGeometry
	 *   //=featureIndex
	 *   //=featureProperties
	 *   //=featureBBox
	 *   //=featureId
	 * });
	 */
	function geomEach(geojson, callback) {
	    var i, j, g, geometry, stopG,
	        geometryMaybeCollection,
	        isGeometryCollection,
	        featureProperties,
	        featureBBox,
	        featureId,
	        featureIndex = 0,
	        isFeatureCollection = geojson.type === 'FeatureCollection',
	        isFeature = geojson.type === 'Feature',
	        stop = isFeatureCollection ? geojson.features.length : 1;

	    // This logic may look a little weird. The reason why it is that way
	    // is because it's trying to be fast. GeoJSON supports multiple kinds
	    // of objects at its root: FeatureCollection, Features, Geometries.
	    // This function has the responsibility of handling all of them, and that
	    // means that some of the `for` loops you see below actually just don't apply
	    // to certain inputs. For instance, if you give this just a
	    // Point geometry, then both loops are short-circuited and all we do
	    // is gradually rename the input until it's called 'geometry'.
	    //
	    // This also aims to allocate as few resources as possible: just a
	    // few numbers and booleans, rather than any temporary arrays as would
	    // be required with the normalization approach.
	    for (i = 0; i < stop; i++) {

	        geometryMaybeCollection = (isFeatureCollection ? geojson.features[i].geometry :
	            (isFeature ? geojson.geometry : geojson));
	        featureProperties = (isFeatureCollection ? geojson.features[i].properties :
	            (isFeature ? geojson.properties : {}));
	        featureBBox = (isFeatureCollection ? geojson.features[i].bbox :
	            (isFeature ? geojson.bbox : undefined));
	        featureId = (isFeatureCollection ? geojson.features[i].id :
	            (isFeature ? geojson.id : undefined));
	        isGeometryCollection = (geometryMaybeCollection) ? geometryMaybeCollection.type === 'GeometryCollection' : false;
	        stopG = isGeometryCollection ? geometryMaybeCollection.geometries.length : 1;

	        for (g = 0; g < stopG; g++) {
	            geometry = isGeometryCollection ?
	                geometryMaybeCollection.geometries[g] : geometryMaybeCollection;

	            // Handle null Geometry
	            if (geometry === null) {
	                if (callback(null, featureIndex, featureProperties, featureBBox, featureId) === false) return false;
	                continue;
	            }
	            switch (geometry.type) {
	            case 'Point':
	            case 'LineString':
	            case 'MultiPoint':
	            case 'Polygon':
	            case 'MultiLineString':
	            case 'MultiPolygon': {
	                if (callback(geometry, featureIndex, featureProperties, featureBBox, featureId) === false) return false;
	                break;
	            }
	            case 'GeometryCollection': {
	                for (j = 0; j < geometry.geometries.length; j++) {
	                    if (callback(geometry.geometries[j], featureIndex, featureProperties, featureBBox, featureId) === false) return false;
	                }
	                break;
	            }
	            default:
	                throw new Error('Unknown Geometry Type');
	            }
	        }
	        // Only increase `featureIndex` per each feature
	        featureIndex++;
	    }
	}

	/**
	 * Callback for geomReduce
	 *
	 * The first time the callback function is called, the values provided as arguments depend
	 * on whether the reduce method has an initialValue argument.
	 *
	 * If an initialValue is provided to the reduce method:
	 *  - The previousValue argument is initialValue.
	 *  - The currentValue argument is the value of the first element present in the array.
	 *
	 * If an initialValue is not provided:
	 *  - The previousValue argument is the value of the first element present in the array.
	 *  - The currentValue argument is the value of the second element present in the array.
	 *
	 * @callback geomReduceCallback
	 * @param {*} previousValue The accumulated value previously returned in the last invocation
	 * of the callback, or initialValue, if supplied.
	 * @param {Geometry} currentGeometry The current Geometry being processed.
	 * @param {number} featureIndex The current index of the Feature being processed.
	 * @param {Object} featureProperties The current Feature Properties being processed.
	 * @param {Array<number>} featureBBox The current Feature BBox being processed.
	 * @param {number|string} featureId The current Feature Id being processed.
	 */

	/**
	 * Reduce geometry in any GeoJSON object, similar to Array.reduce().
	 *
	 * @name geomReduce
	 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
	 * @param {Function} callback a method that takes (previousValue, currentGeometry, featureIndex, featureProperties, featureBBox, featureId)
	 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
	 * @returns {*} The value that results from the reduction.
	 * @example
	 * var features = turf.featureCollection([
	 *     turf.point([26, 37], {foo: 'bar'}),
	 *     turf.point([36, 53], {hello: 'world'})
	 * ]);
	 *
	 * turf.geomReduce(features, function (previousValue, currentGeometry, featureIndex, featureProperties, featureBBox, featureId) {
	 *   //=previousValue
	 *   //=currentGeometry
	 *   //=featureIndex
	 *   //=featureProperties
	 *   //=featureBBox
	 *   //=featureId
	 *   return currentGeometry
	 * });
	 */
	function geomReduce(geojson, callback, initialValue) {
	    var previousValue = initialValue;
	    geomEach(geojson, function (currentGeometry, featureIndex, featureProperties, featureBBox, featureId) {
	        if (featureIndex === 0 && initialValue === undefined) previousValue = currentGeometry;
	        else previousValue = callback(previousValue, currentGeometry, featureIndex, featureProperties, featureBBox, featureId);
	    });
	    return previousValue;
	}

	/**
	 * Callback for flattenEach
	 *
	 * @callback flattenEachCallback
	 * @param {Feature} currentFeature The current flattened feature being processed.
	 * @param {number} featureIndex The current index of the Feature being processed.
	 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
	 */

	/**
	 * Iterate over flattened features in any GeoJSON object, similar to
	 * Array.forEach.
	 *
	 * @name flattenEach
	 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
	 * @param {Function} callback a method that takes (currentFeature, featureIndex, multiFeatureIndex)
	 * @example
	 * var features = turf.featureCollection([
	 *     turf.point([26, 37], {foo: 'bar'}),
	 *     turf.multiPoint([[40, 30], [36, 53]], {hello: 'world'})
	 * ]);
	 *
	 * turf.flattenEach(features, function (currentFeature, featureIndex, multiFeatureIndex) {
	 *   //=currentFeature
	 *   //=featureIndex
	 *   //=multiFeatureIndex
	 * });
	 */
	function flattenEach(geojson, callback) {
	    geomEach(geojson, function (geometry, featureIndex, properties, bbox, id) {
	        // Callback for single geometry
	        var type = (geometry === null) ? null : geometry.type;
	        switch (type) {
	        case null:
	        case 'Point':
	        case 'LineString':
	        case 'Polygon':
	            if (callback(helpers.feature(geometry, properties, {bbox: bbox, id: id}), featureIndex, 0) === false) return false;
	            return;
	        }

	        var geomType;

	        // Callback for multi-geometry
	        switch (type) {
	        case 'MultiPoint':
	            geomType = 'Point';
	            break;
	        case 'MultiLineString':
	            geomType = 'LineString';
	            break;
	        case 'MultiPolygon':
	            geomType = 'Polygon';
	            break;
	        }

	        for (var multiFeatureIndex = 0; multiFeatureIndex < geometry.coordinates.length; multiFeatureIndex++) {
	            var coordinate = geometry.coordinates[multiFeatureIndex];
	            var geom = {
	                type: geomType,
	                coordinates: coordinate
	            };
	            if (callback(helpers.feature(geom, properties), featureIndex, multiFeatureIndex) === false) return false;
	        }
	    });
	}

	/**
	 * Callback for flattenReduce
	 *
	 * The first time the callback function is called, the values provided as arguments depend
	 * on whether the reduce method has an initialValue argument.
	 *
	 * If an initialValue is provided to the reduce method:
	 *  - The previousValue argument is initialValue.
	 *  - The currentValue argument is the value of the first element present in the array.
	 *
	 * If an initialValue is not provided:
	 *  - The previousValue argument is the value of the first element present in the array.
	 *  - The currentValue argument is the value of the second element present in the array.
	 *
	 * @callback flattenReduceCallback
	 * @param {*} previousValue The accumulated value previously returned in the last invocation
	 * of the callback, or initialValue, if supplied.
	 * @param {Feature} currentFeature The current Feature being processed.
	 * @param {number} featureIndex The current index of the Feature being processed.
	 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
	 */

	/**
	 * Reduce flattened features in any GeoJSON object, similar to Array.reduce().
	 *
	 * @name flattenReduce
	 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON object
	 * @param {Function} callback a method that takes (previousValue, currentFeature, featureIndex, multiFeatureIndex)
	 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
	 * @returns {*} The value that results from the reduction.
	 * @example
	 * var features = turf.featureCollection([
	 *     turf.point([26, 37], {foo: 'bar'}),
	 *     turf.multiPoint([[40, 30], [36, 53]], {hello: 'world'})
	 * ]);
	 *
	 * turf.flattenReduce(features, function (previousValue, currentFeature, featureIndex, multiFeatureIndex) {
	 *   //=previousValue
	 *   //=currentFeature
	 *   //=featureIndex
	 *   //=multiFeatureIndex
	 *   return currentFeature
	 * });
	 */
	function flattenReduce(geojson, callback, initialValue) {
	    var previousValue = initialValue;
	    flattenEach(geojson, function (currentFeature, featureIndex, multiFeatureIndex) {
	        if (featureIndex === 0 && multiFeatureIndex === 0 && initialValue === undefined) previousValue = currentFeature;
	        else previousValue = callback(previousValue, currentFeature, featureIndex, multiFeatureIndex);
	    });
	    return previousValue;
	}

	/**
	 * Callback for segmentEach
	 *
	 * @callback segmentEachCallback
	 * @param {Feature<LineString>} currentSegment The current Segment being processed.
	 * @param {number} featureIndex The current index of the Feature being processed.
	 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
	 * @param {number} geometryIndex The current index of the Geometry being processed.
	 * @param {number} segmentIndex The current index of the Segment being processed.
	 * @returns {void}
	 */

	/**
	 * Iterate over 2-vertex line segment in any GeoJSON object, similar to Array.forEach()
	 * (Multi)Point geometries do not contain segments therefore they are ignored during this operation.
	 *
	 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON
	 * @param {Function} callback a method that takes (currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex)
	 * @returns {void}
	 * @example
	 * var polygon = turf.polygon([[[-50, 5], [-40, -10], [-50, -10], [-40, 5], [-50, 5]]]);
	 *
	 * // Iterate over GeoJSON by 2-vertex segments
	 * turf.segmentEach(polygon, function (currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex) {
	 *   //=currentSegment
	 *   //=featureIndex
	 *   //=multiFeatureIndex
	 *   //=geometryIndex
	 *   //=segmentIndex
	 * });
	 *
	 * // Calculate the total number of segments
	 * var total = 0;
	 * turf.segmentEach(polygon, function () {
	 *     total++;
	 * });
	 */
	function segmentEach(geojson, callback) {
	    flattenEach(geojson, function (feature$$1, featureIndex, multiFeatureIndex) {
	        var segmentIndex = 0;

	        // Exclude null Geometries
	        if (!feature$$1.geometry) return;
	        // (Multi)Point geometries do not contain segments therefore they are ignored during this operation.
	        var type = feature$$1.geometry.type;
	        if (type === 'Point' || type === 'MultiPoint') return;

	        // Generate 2-vertex line segments
	        var previousCoords;
	        if (coordEach(feature$$1, function (currentCoord, coordIndex, featureIndexCoord, mutliPartIndexCoord, geometryIndex) {
	            // Simulating a meta.coordReduce() since `reduce` operations cannot be stopped by returning `false`
	            if (previousCoords === undefined) {
	                previousCoords = currentCoord;
	                return;
	            }
	            var currentSegment = helpers.lineString([previousCoords, currentCoord], feature$$1.properties);
	            if (callback(currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex) === false) return false;
	            segmentIndex++;
	            previousCoords = currentCoord;
	        }) === false) return false;
	    });
	}

	/**
	 * Callback for segmentReduce
	 *
	 * The first time the callback function is called, the values provided as arguments depend
	 * on whether the reduce method has an initialValue argument.
	 *
	 * If an initialValue is provided to the reduce method:
	 *  - The previousValue argument is initialValue.
	 *  - The currentValue argument is the value of the first element present in the array.
	 *
	 * If an initialValue is not provided:
	 *  - The previousValue argument is the value of the first element present in the array.
	 *  - The currentValue argument is the value of the second element present in the array.
	 *
	 * @callback segmentReduceCallback
	 * @param {*} previousValue The accumulated value previously returned in the last invocation
	 * of the callback, or initialValue, if supplied.
	 * @param {Feature<LineString>} currentSegment The current Segment being processed.
	 * @param {number} featureIndex The current index of the Feature being processed.
	 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed.
	 * @param {number} geometryIndex The current index of the Geometry being processed.
	 * @param {number} segmentIndex The current index of the Segment being processed.
	 */

	/**
	 * Reduce 2-vertex line segment in any GeoJSON object, similar to Array.reduce()
	 * (Multi)Point geometries do not contain segments therefore they are ignored during this operation.
	 *
	 * @param {FeatureCollection|Feature|Geometry} geojson any GeoJSON
	 * @param {Function} callback a method that takes (previousValue, currentSegment, currentIndex)
	 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
	 * @returns {void}
	 * @example
	 * var polygon = turf.polygon([[[-50, 5], [-40, -10], [-50, -10], [-40, 5], [-50, 5]]]);
	 *
	 * // Iterate over GeoJSON by 2-vertex segments
	 * turf.segmentReduce(polygon, function (previousSegment, currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex) {
	 *   //= previousSegment
	 *   //= currentSegment
	 *   //= featureIndex
	 *   //= multiFeatureIndex
	 *   //= geometryIndex
	 *   //= segmentInex
	 *   return currentSegment
	 * });
	 *
	 * // Calculate the total number of segments
	 * var initialValue = 0
	 * var total = turf.segmentReduce(polygon, function (previousValue) {
	 *     previousValue++;
	 *     return previousValue;
	 * }, initialValue);
	 */
	function segmentReduce(geojson, callback, initialValue) {
	    var previousValue = initialValue;
	    var started = false;
	    segmentEach(geojson, function (currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex) {
	        if (started === false && initialValue === undefined) previousValue = currentSegment;
	        else previousValue = callback(previousValue, currentSegment, featureIndex, multiFeatureIndex, geometryIndex, segmentIndex);
	        started = true;
	    });
	    return previousValue;
	}

	/**
	 * Callback for lineEach
	 *
	 * @callback lineEachCallback
	 * @param {Feature<LineString>} currentLine The current LineString|LinearRing being processed
	 * @param {number} featureIndex The current index of the Feature being processed
	 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed
	 * @param {number} geometryIndex The current index of the Geometry being processed
	 */

	/**
	 * Iterate over line or ring coordinates in LineString, Polygon, MultiLineString, MultiPolygon Features or Geometries,
	 * similar to Array.forEach.
	 *
	 * @name lineEach
	 * @param {Geometry|Feature<LineString|Polygon|MultiLineString|MultiPolygon>} geojson object
	 * @param {Function} callback a method that takes (currentLine, featureIndex, multiFeatureIndex, geometryIndex)
	 * @example
	 * var multiLine = turf.multiLineString([
	 *   [[26, 37], [35, 45]],
	 *   [[36, 53], [38, 50], [41, 55]]
	 * ]);
	 *
	 * turf.lineEach(multiLine, function (currentLine, featureIndex, multiFeatureIndex, geometryIndex) {
	 *   //=currentLine
	 *   //=featureIndex
	 *   //=multiFeatureIndex
	 *   //=geometryIndex
	 * });
	 */
	function lineEach(geojson, callback) {
	    // validation
	    if (!geojson) throw new Error('geojson is required');

	    flattenEach(geojson, function (feature$$1, featureIndex, multiFeatureIndex) {
	        if (feature$$1.geometry === null) return;
	        var type = feature$$1.geometry.type;
	        var coords = feature$$1.geometry.coordinates;
	        switch (type) {
	        case 'LineString':
	            if (callback(feature$$1, featureIndex, multiFeatureIndex, 0, 0) === false) return false;
	            break;
	        case 'Polygon':
	            for (var geometryIndex = 0; geometryIndex < coords.length; geometryIndex++) {
	                if (callback(helpers.lineString(coords[geometryIndex], feature$$1.properties), featureIndex, multiFeatureIndex, geometryIndex) === false) return false;
	            }
	            break;
	        }
	    });
	}

	/**
	 * Callback for lineReduce
	 *
	 * The first time the callback function is called, the values provided as arguments depend
	 * on whether the reduce method has an initialValue argument.
	 *
	 * If an initialValue is provided to the reduce method:
	 *  - The previousValue argument is initialValue.
	 *  - The currentValue argument is the value of the first element present in the array.
	 *
	 * If an initialValue is not provided:
	 *  - The previousValue argument is the value of the first element present in the array.
	 *  - The currentValue argument is the value of the second element present in the array.
	 *
	 * @callback lineReduceCallback
	 * @param {*} previousValue The accumulated value previously returned in the last invocation
	 * of the callback, or initialValue, if supplied.
	 * @param {Feature<LineString>} currentLine The current LineString|LinearRing being processed.
	 * @param {number} featureIndex The current index of the Feature being processed
	 * @param {number} multiFeatureIndex The current index of the Multi-Feature being processed
	 * @param {number} geometryIndex The current index of the Geometry being processed
	 */

	/**
	 * Reduce features in any GeoJSON object, similar to Array.reduce().
	 *
	 * @name lineReduce
	 * @param {Geometry|Feature<LineString|Polygon|MultiLineString|MultiPolygon>} geojson object
	 * @param {Function} callback a method that takes (previousValue, currentLine, featureIndex, multiFeatureIndex, geometryIndex)
	 * @param {*} [initialValue] Value to use as the first argument to the first call of the callback.
	 * @returns {*} The value that results from the reduction.
	 * @example
	 * var multiPoly = turf.multiPolygon([
	 *   turf.polygon([[[12,48],[2,41],[24,38],[12,48]], [[9,44],[13,41],[13,45],[9,44]]]),
	 *   turf.polygon([[[5, 5], [0, 0], [2, 2], [4, 4], [5, 5]]])
	 * ]);
	 *
	 * turf.lineReduce(multiPoly, function (previousValue, currentLine, featureIndex, multiFeatureIndex, geometryIndex) {
	 *   //=previousValue
	 *   //=currentLine
	 *   //=featureIndex
	 *   //=multiFeatureIndex
	 *   //=geometryIndex
	 *   return currentLine
	 * });
	 */
	function lineReduce(geojson, callback, initialValue) {
	    var previousValue = initialValue;
	    lineEach(geojson, function (currentLine, featureIndex, multiFeatureIndex, geometryIndex) {
	        if (featureIndex === 0 && initialValue === undefined) previousValue = currentLine;
	        else previousValue = callback(previousValue, currentLine, featureIndex, multiFeatureIndex, geometryIndex);
	    });
	    return previousValue;
	}

	/**
	 * Finds a particular 2-vertex LineString Segment from a GeoJSON using `@turf/meta` indexes.
	 *
	 * Negative indexes are permitted.
	 * Point & MultiPoint will always return null.
	 *
	 * @param {FeatureCollection|Feature|Geometry} geojson Any GeoJSON Feature or Geometry
	 * @param {Object} [options={}] Optional parameters
	 * @param {number} [options.featureIndex=0] Feature Index
	 * @param {number} [options.multiFeatureIndex=0] Multi-Feature Index
	 * @param {number} [options.geometryIndex=0] Geometry Index
	 * @param {number} [options.segmentIndex=0] Segment Index
	 * @param {Object} [options.properties={}] Translate Properties to output LineString
	 * @param {BBox} [options.bbox={}] Translate BBox to output LineString
	 * @param {number|string} [options.id={}] Translate Id to output LineString
	 * @returns {Feature<LineString>} 2-vertex GeoJSON Feature LineString
	 * @example
	 * var multiLine = turf.multiLineString([
	 *     [[10, 10], [50, 30], [30, 40]],
	 *     [[-10, -10], [-50, -30], [-30, -40]]
	 * ]);
	 *
	 * // First Segment (defaults are 0)
	 * turf.findSegment(multiLine);
	 * // => Feature<LineString<[[10, 10], [50, 30]]>>
	 *
	 * // First Segment of 2nd Multi Feature
	 * turf.findSegment(multiLine, {multiFeatureIndex: 1});
	 * // => Feature<LineString<[[-10, -10], [-50, -30]]>>
	 *
	 * // Last Segment of Last Multi Feature
	 * turf.findSegment(multiLine, {multiFeatureIndex: -1, segmentIndex: -1});
	 * // => Feature<LineString<[[-50, -30], [-30, -40]]>>
	 */
	function findSegment(geojson, options) {
	    // Optional Parameters
	    options = options || {};
	    if (!helpers.isObject(options)) throw new Error('options is invalid');
	    var featureIndex = options.featureIndex || 0;
	    var multiFeatureIndex = options.multiFeatureIndex || 0;
	    var geometryIndex = options.geometryIndex || 0;
	    var segmentIndex = options.segmentIndex || 0;

	    // Find FeatureIndex
	    var properties = options.properties;
	    var geometry;

	    switch (geojson.type) {
	    case 'FeatureCollection':
	        if (featureIndex < 0) featureIndex = geojson.features.length + featureIndex;
	        properties = properties || geojson.features[featureIndex].properties;
	        geometry = geojson.features[featureIndex].geometry;
	        break;
	    case 'Feature':
	        properties = properties || geojson.properties;
	        geometry = geojson.geometry;
	        break;
	    case 'Point':
	    case 'MultiPoint':
	        return null;
	    case 'LineString':
	    case 'Polygon':
	    case 'MultiLineString':
	    case 'MultiPolygon':
	        geometry = geojson;
	        break;
	    default:
	        throw new Error('geojson is invalid');
	    }

	    // Find SegmentIndex
	    if (geometry === null) return null;
	    var coords = geometry.coordinates;
	    switch (geometry.type) {
	    case 'Point':
	    case 'MultiPoint':
	        return null;
	    case 'LineString':
	        if (segmentIndex < 0) segmentIndex = coords.length + segmentIndex - 1;
	        return helpers.lineString([coords[segmentIndex], coords[segmentIndex + 1]], properties, options);
	    case 'Polygon':
	        if (geometryIndex < 0) geometryIndex = coords.length + geometryIndex;
	        if (segmentIndex < 0) segmentIndex = coords[geometryIndex].length + segmentIndex - 1;
	        return helpers.lineString([coords[geometryIndex][segmentIndex], coords[geometryIndex][segmentIndex + 1]], properties, options);
	    case 'MultiLineString':
	        if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex;
	        if (segmentIndex < 0) segmentIndex = coords[multiFeatureIndex].length + segmentIndex - 1;
	        return helpers.lineString([coords[multiFeatureIndex][segmentIndex], coords[multiFeatureIndex][segmentIndex + 1]], properties, options);
	    case 'MultiPolygon':
	        if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex;
	        if (geometryIndex < 0) geometryIndex = coords[multiFeatureIndex].length + geometryIndex;
	        if (segmentIndex < 0) segmentIndex = coords[multiFeatureIndex][geometryIndex].length - segmentIndex - 1;
	        return helpers.lineString([coords[multiFeatureIndex][geometryIndex][segmentIndex], coords[multiFeatureIndex][geometryIndex][segmentIndex + 1]], properties, options);
	    }
	    throw new Error('geojson is invalid');
	}

	/**
	 * Finds a particular Point from a GeoJSON using `@turf/meta` indexes.
	 *
	 * Negative indexes are permitted.
	 *
	 * @param {FeatureCollection|Feature|Geometry} geojson Any GeoJSON Feature or Geometry
	 * @param {Object} [options={}] Optional parameters
	 * @param {number} [options.featureIndex=0] Feature Index
	 * @param {number} [options.multiFeatureIndex=0] Multi-Feature Index
	 * @param {number} [options.geometryIndex=0] Geometry Index
	 * @param {number} [options.coordIndex=0] Coord Index
	 * @param {Object} [options.properties={}] Translate Properties to output Point
	 * @param {BBox} [options.bbox={}] Translate BBox to output Point
	 * @param {number|string} [options.id={}] Translate Id to output Point
	 * @returns {Feature<Point>} 2-vertex GeoJSON Feature Point
	 * @example
	 * var multiLine = turf.multiLineString([
	 *     [[10, 10], [50, 30], [30, 40]],
	 *     [[-10, -10], [-50, -30], [-30, -40]]
	 * ]);
	 *
	 * // First Segment (defaults are 0)
	 * turf.findPoint(multiLine);
	 * // => Feature<Point<[10, 10]>>
	 *
	 * // First Segment of the 2nd Multi-Feature
	 * turf.findPoint(multiLine, {multiFeatureIndex: 1});
	 * // => Feature<Point<[-10, -10]>>
	 *
	 * // Last Segment of last Multi-Feature
	 * turf.findPoint(multiLine, {multiFeatureIndex: -1, coordIndex: -1});
	 * // => Feature<Point<[-30, -40]>>
	 */
	function findPoint(geojson, options) {
	    // Optional Parameters
	    options = options || {};
	    if (!helpers.isObject(options)) throw new Error('options is invalid');
	    var featureIndex = options.featureIndex || 0;
	    var multiFeatureIndex = options.multiFeatureIndex || 0;
	    var geometryIndex = options.geometryIndex || 0;
	    var coordIndex = options.coordIndex || 0;

	    // Find FeatureIndex
	    var properties = options.properties;
	    var geometry;

	    switch (geojson.type) {
	    case 'FeatureCollection':
	        if (featureIndex < 0) featureIndex = geojson.features.length + featureIndex;
	        properties = properties || geojson.features[featureIndex].properties;
	        geometry = geojson.features[featureIndex].geometry;
	        break;
	    case 'Feature':
	        properties = properties || geojson.properties;
	        geometry = geojson.geometry;
	        break;
	    case 'Point':
	    case 'MultiPoint':
	        return null;
	    case 'LineString':
	    case 'Polygon':
	    case 'MultiLineString':
	    case 'MultiPolygon':
	        geometry = geojson;
	        break;
	    default:
	        throw new Error('geojson is invalid');
	    }

	    // Find Coord Index
	    if (geometry === null) return null;
	    var coords = geometry.coordinates;
	    switch (geometry.type) {
	    case 'Point':
	        return helpers.point(coords, properties, options);
	    case 'MultiPoint':
	        if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex;
	        return helpers.point(coords[multiFeatureIndex], properties, options);
	    case 'LineString':
	        if (coordIndex < 0) coordIndex = coords.length + coordIndex;
	        return helpers.point(coords[coordIndex], properties, options);
	    case 'Polygon':
	        if (geometryIndex < 0) geometryIndex = coords.length + geometryIndex;
	        if (coordIndex < 0) coordIndex = coords[geometryIndex].length + coordIndex;
	        return helpers.point(coords[geometryIndex][coordIndex], properties, options);
	    case 'MultiLineString':
	        if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex;
	        if (coordIndex < 0) coordIndex = coords[multiFeatureIndex].length + coordIndex;
	        return helpers.point(coords[multiFeatureIndex][coordIndex], properties, options);
	    case 'MultiPolygon':
	        if (multiFeatureIndex < 0) multiFeatureIndex = coords.length + multiFeatureIndex;
	        if (geometryIndex < 0) geometryIndex = coords[multiFeatureIndex].length + geometryIndex;
	        if (coordIndex < 0) coordIndex = coords[multiFeatureIndex][geometryIndex].length - coordIndex;
	        return helpers.point(coords[multiFeatureIndex][geometryIndex][coordIndex], properties, options);
	    }
	    throw new Error('geojson is invalid');
	}

	exports.coordEach = coordEach;
	exports.coordReduce = coordReduce;
	exports.propEach = propEach;
	exports.propReduce = propReduce;
	exports.featureEach = featureEach;
	exports.featureReduce = featureReduce;
	exports.coordAll = coordAll;
	exports.geomEach = geomEach;
	exports.geomReduce = geomReduce;
	exports.flattenEach = flattenEach;
	exports.flattenReduce = flattenReduce;
	exports.segmentEach = segmentEach;
	exports.segmentReduce = segmentReduce;
	exports.lineEach = lineEach;
	exports.lineReduce = lineReduce;
	exports.findSegment = findSegment;
	exports.findPoint = findPoint;


/***/ }),
/* 8 */
/***/ (function(module, exports) {

	'use strict';

	Object.defineProperty(exports, '__esModule', { value: true });

	/**
	 * Earth Radius used with the Harvesine formula and approximates using a spherical (non-ellipsoid) Earth.
	 */
	var earthRadius = 6371008.8;

	/**
	 * Unit of measurement factors using a spherical (non-ellipsoid) earth radius.
	 */
	var factors = {
	    meters: earthRadius,
	    metres: earthRadius,
	    millimeters: earthRadius * 1000,
	    millimetres: earthRadius * 1000,
	    centimeters: earthRadius * 100,
	    centimetres: earthRadius * 100,
	    kilometers: earthRadius / 1000,
	    kilometres: earthRadius / 1000,
	    miles: earthRadius / 1609.344,
	    nauticalmiles: earthRadius / 1852,
	    inches: earthRadius * 39.370,
	    yards: earthRadius / 1.0936,
	    feet: earthRadius * 3.28084,
	    radians: 1,
	    degrees: earthRadius / 111325,
	};

	/**
	 * Units of measurement factors based on 1 meter.
	 */
	var unitsFactors = {
	    meters: 1,
	    metres: 1,
	    millimeters: 1000,
	    millimetres: 1000,
	    centimeters: 100,
	    centimetres: 100,
	    kilometers: 1 / 1000,
	    kilometres: 1 / 1000,
	    miles: 1 / 1609.344,
	    nauticalmiles: 1 / 1852,
	    inches: 39.370,
	    yards: 1 / 1.0936,
	    feet: 3.28084,
	    radians: 1 / earthRadius,
	    degrees: 1 / 111325,
	};

	/**
	 * Area of measurement factors based on 1 square meter.
	 */
	var areaFactors = {
	    meters: 1,
	    metres: 1,
	    millimeters: 1000000,
	    millimetres: 1000000,
	    centimeters: 10000,
	    centimetres: 10000,
	    kilometers: 0.000001,
	    kilometres: 0.000001,
	    acres: 0.000247105,
	    miles: 3.86e-7,
	    yards: 1.195990046,
	    feet: 10.763910417,
	    inches: 1550.003100006
	};

	/**
	 * Wraps a GeoJSON {@link Geometry} in a GeoJSON {@link Feature}.
	 *
	 * @name feature
	 * @param {Geometry} geometry input geometry
	 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
	 * @param {string|number} [options.id] Identifier associated with the Feature
	 * @returns {Feature} a GeoJSON Feature
	 * @example
	 * var geometry = {
	 *   "type": "Point",
	 *   "coordinates": [110, 50]
	 * };
	 *
	 * var feature = turf.feature(geometry);
	 *
	 * //=feature
	 */
	function feature(geometry, properties, options) {
	    // Optional Parameters
	    options = options || {};
	    if (!isObject(options)) throw new Error('options is invalid');
	    var bbox = options.bbox;
	    var id = options.id;

	    // Validation
	    if (geometry === undefined) throw new Error('geometry is required');
	    if (properties && properties.constructor !== Object) throw new Error('properties must be an Object');
	    if (bbox) validateBBox(bbox);
	    if (id) validateId(id);

	    // Main
	    var feat = {type: 'Feature'};
	    if (id) feat.id = id;
	    if (bbox) feat.bbox = bbox;
	    feat.properties = properties || {};
	    feat.geometry = geometry;
	    return feat;
	}

	/**
	 * Creates a GeoJSON {@link Geometry} from a Geometry string type & coordinates.
	 * For GeometryCollection type use `helpers.geometryCollection`
	 *
	 * @name geometry
	 * @param {string} type Geometry Type
	 * @param {Array<number>} coordinates Coordinates
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Geometry
	 * @returns {Geometry} a GeoJSON Geometry
	 * @example
	 * var type = 'Point';
	 * var coordinates = [110, 50];
	 *
	 * var geometry = turf.geometry(type, coordinates);
	 *
	 * //=geometry
	 */
	function geometry(type, coordinates, options) {
	    // Optional Parameters
	    options = options || {};
	    if (!isObject(options)) throw new Error('options is invalid');
	    var bbox = options.bbox;

	    // Validation
	    if (!type) throw new Error('type is required');
	    if (!coordinates) throw new Error('coordinates is required');
	    if (!Array.isArray(coordinates)) throw new Error('coordinates must be an Array');
	    if (bbox) validateBBox(bbox);

	    // Main
	    var geom;
	    switch (type) {
	    case 'Point': geom = point(coordinates).geometry; break;
	    case 'LineString': geom = lineString(coordinates).geometry; break;
	    case 'Polygon': geom = polygon(coordinates).geometry; break;
	    case 'MultiPoint': geom = multiPoint(coordinates).geometry; break;
	    case 'MultiLineString': geom = multiLineString(coordinates).geometry; break;
	    case 'MultiPolygon': geom = multiPolygon(coordinates).geometry; break;
	    default: throw new Error(type + ' is invalid');
	    }
	    if (bbox) geom.bbox = bbox;
	    return geom;
	}

	/**
	 * Creates a {@link Point} {@link Feature} from a Position.
	 *
	 * @name point
	 * @param {Array<number>} coordinates longitude, latitude position (each in decimal degrees)
	 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
	 * @param {string|number} [options.id] Identifier associated with the Feature
	 * @returns {Feature<Point>} a Point feature
	 * @example
	 * var point = turf.point([-75.343, 39.984]);
	 *
	 * //=point
	 */
	function point(coordinates, properties, options) {
	    if (!coordinates) throw new Error('coordinates is required');
	    if (!Array.isArray(coordinates)) throw new Error('coordinates must be an Array');
	    if (coordinates.length < 2) throw new Error('coordinates must be at least 2 numbers long');
	    if (!isNumber(coordinates[0]) || !isNumber(coordinates[1])) throw new Error('coordinates must contain numbers');

	    return feature({
	        type: 'Point',
	        coordinates: coordinates
	    }, properties, options);
	}

	/**
	 * Creates a {@link Point} {@link FeatureCollection} from an Array of Point coordinates.
	 *
	 * @name points
	 * @param {Array<Array<number>>} coordinates an array of Points
	 * @param {Object} [properties={}] Translate these properties to each Feature
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the FeatureCollection
	 * @param {string|number} [options.id] Identifier associated with the FeatureCollection
	 * @returns {FeatureCollection<Point>} Point Feature
	 * @example
	 * var points = turf.points([
	 *   [-75, 39],
	 *   [-80, 45],
	 *   [-78, 50]
	 * ]);
	 *
	 * //=points
	 */
	function points(coordinates, properties, options) {
	    if (!coordinates) throw new Error('coordinates is required');
	    if (!Array.isArray(coordinates)) throw new Error('coordinates must be an Array');

	    return featureCollection(coordinates.map(function (coords) {
	        return point(coords, properties);
	    }), options);
	}

	/**
	 * Creates a {@link Polygon} {@link Feature} from an Array of LinearRings.
	 *
	 * @name polygon
	 * @param {Array<Array<Array<number>>>} coordinates an array of LinearRings
	 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
	 * @param {string|number} [options.id] Identifier associated with the Feature
	 * @returns {Feature<Polygon>} Polygon Feature
	 * @example
	 * var polygon = turf.polygon([[[-5, 52], [-4, 56], [-2, 51], [-7, 54], [-5, 52]]], { name: 'poly1' });
	 *
	 * //=polygon
	 */
	function polygon(coordinates, properties, options) {
	    if (!coordinates) throw new Error('coordinates is required');

	    for (var i = 0; i < coordinates.length; i++) {
	        var ring = coordinates[i];
	        if (ring.length < 4) {
	            throw new Error('Each LinearRing of a Polygon must have 4 or more Positions.');
	        }
	        for (var j = 0; j < ring[ring.length - 1].length; j++) {
	            // Check if first point of Polygon contains two numbers
	            if (i === 0 && j === 0 && !isNumber(ring[0][0]) || !isNumber(ring[0][1])) throw new Error('coordinates must contain numbers');
	            if (ring[ring.length - 1][j] !== ring[0][j]) {
	                throw new Error('First and last Position are not equivalent.');
	            }
	        }
	    }

	    return feature({
	        type: 'Polygon',
	        coordinates: coordinates
	    }, properties, options);
	}

	/**
	 * Creates a {@link Polygon} {@link FeatureCollection} from an Array of Polygon coordinates.
	 *
	 * @name polygons
	 * @param {Array<Array<Array<Array<number>>>>} coordinates an array of Polygon coordinates
	 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
	 * @param {string|number} [options.id] Identifier associated with the FeatureCollection
	 * @returns {FeatureCollection<Polygon>} Polygon FeatureCollection
	 * @example
	 * var polygons = turf.polygons([
	 *   [[[-5, 52], [-4, 56], [-2, 51], [-7, 54], [-5, 52]]],
	 *   [[[-15, 42], [-14, 46], [-12, 41], [-17, 44], [-15, 42]]],
	 * ]);
	 *
	 * //=polygons
	 */
	function polygons(coordinates, properties, options) {
	    if (!coordinates) throw new Error('coordinates is required');
	    if (!Array.isArray(coordinates)) throw new Error('coordinates must be an Array');

	    return featureCollection(coordinates.map(function (coords) {
	        return polygon(coords, properties);
	    }), options);
	}

	/**
	 * Creates a {@link LineString} {@link Feature} from an Array of Positions.
	 *
	 * @name lineString
	 * @param {Array<Array<number>>} coordinates an array of Positions
	 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
	 * @param {string|number} [options.id] Identifier associated with the Feature
	 * @returns {Feature<LineString>} LineString Feature
	 * @example
	 * var linestring1 = turf.lineString([[-24, 63], [-23, 60], [-25, 65], [-20, 69]], {name: 'line 1'});
	 * var linestring2 = turf.lineString([[-14, 43], [-13, 40], [-15, 45], [-10, 49]], {name: 'line 2'});
	 *
	 * //=linestring1
	 * //=linestring2
	 */
	function lineString(coordinates, properties, options) {
	    if (!coordinates) throw new Error('coordinates is required');
	    if (coordinates.length < 2) throw new Error('coordinates must be an array of two or more positions');
	    // Check if first point of LineString contains two numbers
	    if (!isNumber(coordinates[0][1]) || !isNumber(coordinates[0][1])) throw new Error('coordinates must contain numbers');

	    return feature({
	        type: 'LineString',
	        coordinates: coordinates
	    }, properties, options);
	}

	/**
	 * Creates a {@link LineString} {@link FeatureCollection} from an Array of LineString coordinates.
	 *
	 * @name lineStrings
	 * @param {Array<Array<number>>} coordinates an array of LinearRings
	 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the FeatureCollection
	 * @param {string|number} [options.id] Identifier associated with the FeatureCollection
	 * @returns {FeatureCollection<LineString>} LineString FeatureCollection
	 * @example
	 * var linestrings = turf.lineStrings([
	 *   [[-24, 63], [-23, 60], [-25, 65], [-20, 69]],
	 *   [[-14, 43], [-13, 40], [-15, 45], [-10, 49]]
	 * ]);
	 *
	 * //=linestrings
	 */
	function lineStrings(coordinates, properties, options) {
	    if (!coordinates) throw new Error('coordinates is required');
	    if (!Array.isArray(coordinates)) throw new Error('coordinates must be an Array');

	    return featureCollection(coordinates.map(function (coords) {
	        return lineString(coords, properties);
	    }), options);
	}

	/**
	 * Takes one or more {@link Feature|Features} and creates a {@link FeatureCollection}.
	 *
	 * @name featureCollection
	 * @param {Feature[]} features input features
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
	 * @param {string|number} [options.id] Identifier associated with the Feature
	 * @returns {FeatureCollection} FeatureCollection of Features
	 * @example
	 * var locationA = turf.point([-75.343, 39.984], {name: 'Location A'});
	 * var locationB = turf.point([-75.833, 39.284], {name: 'Location B'});
	 * var locationC = turf.point([-75.534, 39.123], {name: 'Location C'});
	 *
	 * var collection = turf.featureCollection([
	 *   locationA,
	 *   locationB,
	 *   locationC
	 * ]);
	 *
	 * //=collection
	 */
	function featureCollection(features, options) {
	    // Optional Parameters
	    options = options || {};
	    if (!isObject(options)) throw new Error('options is invalid');
	    var bbox = options.bbox;
	    var id = options.id;

	    // Validation
	    if (!features) throw new Error('No features passed');
	    if (!Array.isArray(features)) throw new Error('features must be an Array');
	    if (bbox) validateBBox(bbox);
	    if (id) validateId(id);

	    // Main
	    var fc = {type: 'FeatureCollection'};
	    if (id) fc.id = id;
	    if (bbox) fc.bbox = bbox;
	    fc.features = features;
	    return fc;
	}

	/**
	 * Creates a {@link Feature<MultiLineString>} based on a
	 * coordinate array. Properties can be added optionally.
	 *
	 * @name multiLineString
	 * @param {Array<Array<Array<number>>>} coordinates an array of LineStrings
	 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
	 * @param {string|number} [options.id] Identifier associated with the Feature
	 * @returns {Feature<MultiLineString>} a MultiLineString feature
	 * @throws {Error} if no coordinates are passed
	 * @example
	 * var multiLine = turf.multiLineString([[[0,0],[10,10]]]);
	 *
	 * //=multiLine
	 */
	function multiLineString(coordinates, properties, options) {
	    if (!coordinates) throw new Error('coordinates is required');

	    return feature({
	        type: 'MultiLineString',
	        coordinates: coordinates
	    }, properties, options);
	}

	/**
	 * Creates a {@link Feature<MultiPoint>} based on a
	 * coordinate array. Properties can be added optionally.
	 *
	 * @name multiPoint
	 * @param {Array<Array<number>>} coordinates an array of Positions
	 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
	 * @param {string|number} [options.id] Identifier associated with the Feature
	 * @returns {Feature<MultiPoint>} a MultiPoint feature
	 * @throws {Error} if no coordinates are passed
	 * @example
	 * var multiPt = turf.multiPoint([[0,0],[10,10]]);
	 *
	 * //=multiPt
	 */
	function multiPoint(coordinates, properties, options) {
	    if (!coordinates) throw new Error('coordinates is required');

	    return feature({
	        type: 'MultiPoint',
	        coordinates: coordinates
	    }, properties, options);
	}

	/**
	 * Creates a {@link Feature<MultiPolygon>} based on a
	 * coordinate array. Properties can be added optionally.
	 *
	 * @name multiPolygon
	 * @param {Array<Array<Array<Array<number>>>>} coordinates an array of Polygons
	 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
	 * @param {string|number} [options.id] Identifier associated with the Feature
	 * @returns {Feature<MultiPolygon>} a multipolygon feature
	 * @throws {Error} if no coordinates are passed
	 * @example
	 * var multiPoly = turf.multiPolygon([[[[0,0],[0,10],[10,10],[10,0],[0,0]]]]);
	 *
	 * //=multiPoly
	 *
	 */
	function multiPolygon(coordinates, properties, options) {
	    if (!coordinates) throw new Error('coordinates is required');

	    return feature({
	        type: 'MultiPolygon',
	        coordinates: coordinates
	    }, properties, options);
	}

	/**
	 * Creates a {@link Feature<GeometryCollection>} based on a
	 * coordinate array. Properties can be added optionally.
	 *
	 * @name geometryCollection
	 * @param {Array<Geometry>} geometries an array of GeoJSON Geometries
	 * @param {Object} [properties={}] an Object of key-value pairs to add as properties
	 * @param {Object} [options={}] Optional Parameters
	 * @param {Array<number>} [options.bbox] Bounding Box Array [west, south, east, north] associated with the Feature
	 * @param {string|number} [options.id] Identifier associated with the Feature
	 * @returns {Feature<GeometryCollection>} a GeoJSON GeometryCollection Feature
	 * @example
	 * var pt = {
	 *     "type": "Point",
	 *       "coordinates": [100, 0]
	 *     };
	 * var line = {
	 *     "type": "LineString",
	 *     "coordinates": [ [101, 0], [102, 1] ]
	 *   };
	 * var collection = turf.geometryCollection([pt, line]);
	 *
	 * //=collection
	 */
	function geometryCollection(geometries, properties, options) {
	    if (!geometries) throw new Error('geometries is required');
	    if (!Array.isArray(geometries)) throw new Error('geometries must be an Array');

	    return feature({
	        type: 'GeometryCollection',
	        geometries: geometries
	    }, properties, options);
	}

	/**
	 * Round number to precision
	 *
	 * @param {number} num Number
	 * @param {number} [precision=0] Precision
	 * @returns {number} rounded number
	 * @example
	 * turf.round(120.4321)
	 * //=120
	 *
	 * turf.round(120.4321, 2)
	 * //=120.43
	 */
	function round(num, precision) {
	    if (num === undefined || num === null || isNaN(num)) throw new Error('num is required');
	    if (precision && !(precision >= 0)) throw new Error('precision must be a positive number');
	    var multiplier = Math.pow(10, precision || 0);
	    return Math.round(num * multiplier) / multiplier;
	}

	/**
	 * Convert a distance measurement (assuming a spherical Earth) from radians to a more friendly unit.
	 * Valid units: miles, nauticalmiles, inches, yards, meters, metres, kilometers, centimeters, feet
	 *
	 * @name radiansToLength
	 * @param {number} radians in radians across the sphere
	 * @param {string} [units='kilometers'] can be degrees, radians, miles, or kilometers inches, yards, metres, meters, kilometres, kilometers.
	 * @returns {number} distance
	 */
	function radiansToLength(radians, units) {
	    if (radians === undefined || radians === null) throw new Error('radians is required');

	    if (units && typeof units !== 'string') throw new Error('units must be a string');
	    var factor = factors[units || 'kilometers'];
	    if (!factor) throw new Error(units + ' units is invalid');
	    return radians * factor;
	}

	/**
	 * Convert a distance measurement (assuming a spherical Earth) from a real-world unit into radians
	 * Valid units: miles, nauticalmiles, inches, yards, meters, metres, kilometers, centimeters, feet
	 *
	 * @name lengthToRadians
	 * @param {number} distance in real units
	 * @param {string} [units='kilometers'] can be degrees, radians, miles, or kilometers inches, yards, metres, meters, kilometres, kilometers.
	 * @returns {number} radians
	 */
	function lengthToRadians(distance, units) {
	    if (distance === undefined || distance === null) throw new Error('distance is required');

	    if (units && typeof units !== 'string') throw new Error('units must be a string');
	    var factor = factors[units || 'kilometers'];
	    if (!factor) throw new Error(units + ' units is invalid');
	    return distance / factor;
	}

	/**
	 * Convert a distance measurement (assuming a spherical Earth) from a real-world unit into degrees
	 * Valid units: miles, nauticalmiles, inches, yards, meters, metres, centimeters, kilometres, feet
	 *
	 * @name lengthToDegrees
	 * @param {number} distance in real units
	 * @param {string} [units='kilometers'] can be degrees, radians, miles, or kilometers inches, yards, metres, meters, kilometres, kilometers.
	 * @returns {number} degrees
	 */
	function lengthToDegrees(distance, units) {
	    return radiansToDegrees(lengthToRadians(distance, units));
	}

	/**
	 * Converts any bearing angle from the north line direction (positive clockwise)
	 * and returns an angle between 0-360 degrees (positive clockwise), 0 being the north line
	 *
	 * @name bearingToAzimuth
	 * @param {number} bearing angle, between -180 and +180 degrees
	 * @returns {number} angle between 0 and 360 degrees
	 */
	function bearingToAzimuth(bearing) {
	    if (bearing === null || bearing === undefined) throw new Error('bearing is required');

	    var angle = bearing % 360;
	    if (angle < 0) angle += 360;
	    return angle;
	}

	/**
	 * Converts an angle in radians to degrees
	 *
	 * @name radiansToDegrees
	 * @param {number} radians angle in radians
	 * @returns {number} degrees between 0 and 360 degrees
	 */
	function radiansToDegrees(radians) {
	    if (radians === null || radians === undefined) throw new Error('radians is required');

	    var degrees = radians % (2 * Math.PI);
	    return degrees * 180 / Math.PI;
	}

	/**
	 * Converts an angle in degrees to radians
	 *
	 * @name degreesToRadians
	 * @param {number} degrees angle between 0 and 360 degrees
	 * @returns {number} angle in radians
	 */
	function degreesToRadians(degrees) {
	    if (degrees === null || degrees === undefined) throw new Error('degrees is required');

	    var radians = degrees % 360;
	    return radians * Math.PI / 180;
	}

	/**
	 * Converts a length to the requested unit.
	 * Valid units: miles, nauticalmiles, inches, yards, meters, metres, kilometers, centimeters, feet
	 *
	 * @param {number} length to be converted
	 * @param {string} originalUnit of the length
	 * @param {string} [finalUnit='kilometers'] returned unit
	 * @returns {number} the converted length
	 */
	function convertLength(length, originalUnit, finalUnit) {
	    if (length === null || length === undefined) throw new Error('length is required');
	    if (!(length >= 0)) throw new Error('length must be a positive number');

	    return radiansToLength(lengthToRadians(length, originalUnit), finalUnit || 'kilometers');
	}

	/**
	 * Converts a area to the requested unit.
	 * Valid units: kilometers, kilometres, meters, metres, centimetres, millimeters, acres, miles, yards, feet, inches
	 * @param {number} area to be converted
	 * @param {string} [originalUnit='meters'] of the distance
	 * @param {string} [finalUnit='kilometers'] returned unit
	 * @returns {number} the converted distance
	 */
	function convertArea(area, originalUnit, finalUnit) {
	    if (area === null || area === undefined) throw new Error('area is required');
	    if (!(area >= 0)) throw new Error('area must be a positive number');

	    var startFactor = areaFactors[originalUnit || 'meters'];
	    if (!startFactor) throw new Error('invalid original units');

	    var finalFactor = areaFactors[finalUnit || 'kilometers'];
	    if (!finalFactor) throw new Error('invalid final units');

	    return (area / startFactor) * finalFactor;
	}

	/**
	 * isNumber
	 *
	 * @param {*} num Number to validate
	 * @returns {boolean} true/false
	 * @example
	 * turf.isNumber(123)
	 * //=true
	 * turf.isNumber('foo')
	 * //=false
	 */
	function isNumber(num) {
	    return !isNaN(num) && num !== null && !Array.isArray(num);
	}

	/**
	 * isObject
	 *
	 * @param {*} input variable to validate
	 * @returns {boolean} true/false
	 * @example
	 * turf.isObject({elevation: 10})
	 * //=true
	 * turf.isObject('foo')
	 * //=false
	 */
	function isObject(input) {
	    return (!!input) && (input.constructor === Object);
	}

	/**
	 * Validate BBox
	 *
	 * @private
	 * @param {Array<number>} bbox BBox to validate
	 * @returns {void}
	 * @throws Error if BBox is not valid
	 * @example
	 * validateBBox([-180, -40, 110, 50])
	 * //=OK
	 * validateBBox([-180, -40])
	 * //=Error
	 * validateBBox('Foo')
	 * //=Error
	 * validateBBox(5)
	 * //=Error
	 * validateBBox(null)
	 * //=Error
	 * validateBBox(undefined)
	 * //=Error
	 */
	function validateBBox(bbox) {
	    if (!bbox) throw new Error('bbox is required');
	    if (!Array.isArray(bbox)) throw new Error('bbox must be an Array');
	    if (bbox.length !== 4 && bbox.length !== 6) throw new Error('bbox must be an Array of 4 or 6 numbers');
	    bbox.forEach(function (num) {
	        if (!isNumber(num)) throw new Error('bbox must only contain numbers');
	    });
	}

	/**
	 * Validate Id
	 *
	 * @private
	 * @param {string|number} id Id to validate
	 * @returns {void}
	 * @throws Error if Id is not valid
	 * @example
	 * validateId([-180, -40, 110, 50])
	 * //=Error
	 * validateId([-180, -40])
	 * //=Error
	 * validateId('Foo')
	 * //=OK
	 * validateId(5)
	 * //=OK
	 * validateId(null)
	 * //=Error
	 * validateId(undefined)
	 * //=Error
	 */
	function validateId(id) {
	    if (!id) throw new Error('id is required');
	    if (['string', 'number'].indexOf(typeof id) === -1) throw new Error('id must be a number or a string');
	}

	// Deprecated methods
	function radians2degrees() {
	    throw new Error('method has been renamed to `radiansToDegrees`');
	}

	function degrees2radians() {
	    throw new Error('method has been renamed to `degreesToRadians`');
	}

	function distanceToDegrees() {
	    throw new Error('method has been renamed to `lengthToDegrees`');
	}

	function distanceToRadians() {
	    throw new Error('method has been renamed to `lengthToRadians`');
	}

	function radiansToDistance() {
	    throw new Error('method has been renamed to `radiansToLength`');
	}

	function bearingToAngle() {
	    throw new Error('method has been renamed to `bearingToAzimuth`');
	}

	function convertDistance() {
	    throw new Error('method has been renamed to `convertLength`');
	}

	exports.earthRadius = earthRadius;
	exports.factors = factors;
	exports.unitsFactors = unitsFactors;
	exports.areaFactors = areaFactors;
	exports.feature = feature;
	exports.geometry = geometry;
	exports.point = point;
	exports.points = points;
	exports.polygon = polygon;
	exports.polygons = polygons;
	exports.lineString = lineString;
	exports.lineStrings = lineStrings;
	exports.featureCollection = featureCollection;
	exports.multiLineString = multiLineString;
	exports.multiPoint = multiPoint;
	exports.multiPolygon = multiPolygon;
	exports.geometryCollection = geometryCollection;
	exports.round = round;
	exports.radiansToLength = radiansToLength;
	exports.lengthToRadians = lengthToRadians;
	exports.lengthToDegrees = lengthToDegrees;
	exports.bearingToAzimuth = bearingToAzimuth;
	exports.radiansToDegrees = radiansToDegrees;
	exports.degreesToRadians = degreesToRadians;
	exports.convertLength = convertLength;
	exports.convertArea = convertArea;
	exports.isNumber = isNumber;
	exports.isObject = isObject;
	exports.validateBBox = validateBBox;
	exports.validateId = validateId;
	exports.radians2degrees = radians2degrees;
	exports.degrees2radians = degrees2radians;
	exports.distanceToDegrees = distanceToDegrees;
	exports.distanceToRadians = distanceToRadians;
	exports.radiansToDistance = radiansToDistance;
	exports.bearingToAngle = bearingToAngle;
	exports.convertDistance = convertDistance;


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, '__esModule', { value: true });

	var helpers = __webpack_require__(8);

	/**
	 * Unwrap a coordinate from a Point Feature, Geometry or a single coordinate.
	 *
	 * @name getCoord
	 * @param {Array<number>|Geometry<Point>|Feature<Point>} coord GeoJSON Point or an Array of numbers
	 * @returns {Array<number>} coordinates
	 * @example
	 * var pt = turf.point([10, 10]);
	 *
	 * var coord = turf.getCoord(pt);
	 * //= [10, 10]
	 */
	function getCoord(coord) {
	    if (!coord) throw new Error('coord is required');
	    if (coord.type === 'Feature' && coord.geometry !== null && coord.geometry.type === 'Point') return coord.geometry.coordinates;
	    if (coord.type === 'Point') return coord.coordinates;
	    if (Array.isArray(coord) && coord.length >= 2 && coord[0].length === undefined && coord[1].length === undefined) return coord;

	    throw new Error('coord must be GeoJSON Point or an Array of numbers');
	}

	/**
	 * Unwrap coordinates from a Feature, Geometry Object or an Array
	 *
	 * @name getCoords
	 * @param {Array<any>|Geometry|Feature} coords Feature, Geometry Object or an Array
	 * @returns {Array<any>} coordinates
	 * @example
	 * var poly = turf.polygon([[[119.32, -8.7], [119.55, -8.69], [119.51, -8.54], [119.32, -8.7]]]);
	 *
	 * var coords = turf.getCoords(poly);
	 * //= [[[119.32, -8.7], [119.55, -8.69], [119.51, -8.54], [119.32, -8.7]]]
	 */
	function getCoords(coords) {
	    if (!coords) throw new Error('coords is required');

	    // Feature
	    if (coords.type === 'Feature' && coords.geometry !== null) return coords.geometry.coordinates;

	    // Geometry
	    if (coords.coordinates) return coords.coordinates;

	    // Array of numbers
	    if (Array.isArray(coords)) return coords;

	    throw new Error('coords must be GeoJSON Feature, Geometry Object or an Array');
	}

	/**
	 * Checks if coordinates contains a number
	 *
	 * @name containsNumber
	 * @param {Array<any>} coordinates GeoJSON Coordinates
	 * @returns {boolean} true if Array contains a number
	 */
	function containsNumber(coordinates) {
	    if (coordinates.length > 1 && helpers.isNumber(coordinates[0]) && helpers.isNumber(coordinates[1])) {
	        return true;
	    }

	    if (Array.isArray(coordinates[0]) && coordinates[0].length) {
	        return containsNumber(coordinates[0]);
	    }
	    throw new Error('coordinates must only contain numbers');
	}

	/**
	 * Enforce expectations about types of GeoJSON objects for Turf.
	 *
	 * @name geojsonType
	 * @param {GeoJSON} value any GeoJSON object
	 * @param {string} type expected GeoJSON type
	 * @param {string} name name of calling function
	 * @throws {Error} if value is not the expected type.
	 */
	function geojsonType(value, type, name) {
	    if (!type || !name) throw new Error('type and name required');

	    if (!value || value.type !== type) {
	        throw new Error('Invalid input to ' + name + ': must be a ' + type + ', given ' + value.type);
	    }
	}

	/**
	 * Enforce expectations about types of {@link Feature} inputs for Turf.
	 * Internally this uses {@link geojsonType} to judge geometry types.
	 *
	 * @name featureOf
	 * @param {Feature} feature a feature with an expected geometry type
	 * @param {string} type expected GeoJSON type
	 * @param {string} name name of calling function
	 * @throws {Error} error if value is not the expected type.
	 */
	function featureOf(feature, type, name) {
	    if (!feature) throw new Error('No feature passed');
	    if (!name) throw new Error('.featureOf() requires a name');
	    if (!feature || feature.type !== 'Feature' || !feature.geometry) {
	        throw new Error('Invalid input to ' + name + ', Feature with geometry required');
	    }
	    if (!feature.geometry || feature.geometry.type !== type) {
	        throw new Error('Invalid input to ' + name + ': must be a ' + type + ', given ' + feature.geometry.type);
	    }
	}

	/**
	 * Enforce expectations about types of {@link FeatureCollection} inputs for Turf.
	 * Internally this uses {@link geojsonType} to judge geometry types.
	 *
	 * @name collectionOf
	 * @param {FeatureCollection} featureCollection a FeatureCollection for which features will be judged
	 * @param {string} type expected GeoJSON type
	 * @param {string} name name of calling function
	 * @throws {Error} if value is not the expected type.
	 */
	function collectionOf(featureCollection, type, name) {
	    if (!featureCollection) throw new Error('No featureCollection passed');
	    if (!name) throw new Error('.collectionOf() requires a name');
	    if (!featureCollection || featureCollection.type !== 'FeatureCollection') {
	        throw new Error('Invalid input to ' + name + ', FeatureCollection required');
	    }
	    for (var i = 0; i < featureCollection.features.length; i++) {
	        var feature = featureCollection.features[i];
	        if (!feature || feature.type !== 'Feature' || !feature.geometry) {
	            throw new Error('Invalid input to ' + name + ', Feature with geometry required');
	        }
	        if (!feature.geometry || feature.geometry.type !== type) {
	            throw new Error('Invalid input to ' + name + ': must be a ' + type + ', given ' + feature.geometry.type);
	        }
	    }
	}

	/**
	 * Get Geometry from Feature or Geometry Object
	 *
	 * @param {Feature|Geometry} geojson GeoJSON Feature or Geometry Object
	 * @returns {Geometry|null} GeoJSON Geometry Object
	 * @throws {Error} if geojson is not a Feature or Geometry Object
	 * @example
	 * var point = {
	 *   "type": "Feature",
	 *   "properties": {},
	 *   "geometry": {
	 *     "type": "Point",
	 *     "coordinates": [110, 40]
	 *   }
	 * }
	 * var geom = turf.getGeom(point)
	 * //={"type": "Point", "coordinates": [110, 40]}
	 */
	function getGeom(geojson) {
	    if (!geojson) throw new Error('geojson is required');
	    if (geojson.geometry !== undefined) return geojson.geometry;
	    if (geojson.coordinates || geojson.geometries) return geojson;
	    throw new Error('geojson must be a valid Feature or Geometry Object');
	}

	/**
	 * Get Geometry Type from Feature or Geometry Object
	 *
	 * @throws {Error} **DEPRECATED** in v5.0.0 in favor of getType
	 */
	function getGeomType() {
	    throw new Error('invariant.getGeomType has been deprecated in v5.0 in favor of invariant.getType');
	}

	/**
	 * Get GeoJSON object's type, Geometry type is prioritize.
	 *
	 * @param {GeoJSON} geojson GeoJSON object
	 * @param {string} [name="geojson"] name of the variable to display in error message
	 * @returns {string} GeoJSON type
	 * @example
	 * var point = {
	 *   "type": "Feature",
	 *   "properties": {},
	 *   "geometry": {
	 *     "type": "Point",
	 *     "coordinates": [110, 40]
	 *   }
	 * }
	 * var geom = turf.getType(point)
	 * //="Point"
	 */
	function getType(geojson, name) {
	    if (!geojson) throw new Error((name || 'geojson') + ' is required');
	    // GeoJSON Feature & GeometryCollection
	    if (geojson.geometry && geojson.geometry.type) return geojson.geometry.type;
	    // GeoJSON Geometry & FeatureCollection
	    if (geojson.type) return geojson.type;
	    throw new Error((name || 'geojson') + ' is invalid');
	}

	exports.getCoord = getCoord;
	exports.getCoords = getCoords;
	exports.containsNumber = containsNumber;
	exports.geojsonType = geojsonType;
	exports.featureOf = featureOf;
	exports.collectionOf = collectionOf;
	exports.getGeom = getGeom;
	exports.getGeomType = getGeomType;
	exports.getType = getType;


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

	var within = _interopDefault(__webpack_require__(11));
	var distance = _interopDefault(__webpack_require__(14));
	var invariant = __webpack_require__(9);
	var helpers = __webpack_require__(8);

	/**
	 * Creates a {@link Point} grid from a bounding box, {@link FeatureCollection} or {@link Feature}.
	 *
	 * @name pointGrid
	 * @param {Array<number>} bbox extent in [minX, minY, maxX, maxY] order
	 * @param {number} cellSide the distance between points, in units
	 * @param {Object} [options={}] Optional parameters
	 * @param {string} [options.units='kilometers'] used in calculating cellSide, can be degrees, radians, miles, or kilometers
	 * @param {Feature<Polygon|MultiPolygon>} [options.mask] if passed a Polygon or MultiPolygon, the grid Points will be created only inside it
	 * @param {Object} [options.properties={}] passed to each point of the grid
	 * @returns {FeatureCollection<Point>} grid of points
	 * @example
	 * var extent = [-70.823364, -33.553984, -70.473175, -33.302986];
	 * var cellSide = 3;
	 * var options = {units: 'miles'};
	 *
	 * var grid = turf.pointGrid(extent, cellSide, options);
	 *
	 * //addToMap
	 * var addToMap = [grid];
	 */
	function pointGrid(bbox, cellSide, options) {
	    // Optional parameters
	    options = options || {};
	    if (!helpers.isObject(options)) throw new Error('options is invalid');
	    // var units = options.units;
	    var mask = options.mask;
	    var properties = options.properties;

	    // Containers
	    var results = [];

	    // Input Validation
	    if (cellSide === null || cellSide === undefined) throw new Error('cellSide is required');
	    if (!helpers.isNumber(cellSide)) throw new Error('cellSide is invalid');
	    if (!bbox) throw new Error('bbox is required');
	    if (!Array.isArray(bbox)) throw new Error('bbox must be array');
	    if (bbox.length !== 4) throw new Error('bbox must contain 4 numbers');
	    if (mask && ['Polygon', 'MultiPolygon'].indexOf(invariant.getType(mask)) === -1) throw new Error('options.mask must be a (Multi)Polygon');

	    var west = bbox[0];
	    var south = bbox[1];
	    var east = bbox[2];
	    var north = bbox[3];

	    var xFraction = cellSide / (distance([west, south], [east, south], options));
	    var cellWidth = xFraction * (east - west);
	    var yFraction = cellSide / (distance([west, south], [west, north], options));
	    var cellHeight = yFraction * (north - south);

	    var bboxWidth = (east - west);
	    var bboxHeight = (north - south);
	    var columns = Math.floor(bboxWidth / cellWidth);
	    var rows = Math.floor(bboxHeight / cellHeight);
	    // adjust origin of the grid
	    var deltaX = (bboxWidth - columns * cellWidth) / 2;
	    var deltaY = (bboxHeight - rows * cellHeight) / 2;

	    var currentX = west + deltaX;
	    while (currentX <= east) {
	        var currentY = south + deltaY;
	        while (currentY <= north) {
	            var cellPt = helpers.point([currentX, currentY], properties);
	            if (mask) {
	                if (within(cellPt, mask)) results.push(cellPt);
	            } else {
	                results.push(cellPt);
	            }
	            currentY += cellHeight;
	        }
	        currentX += cellWidth;
	    }

	    return helpers.featureCollection(results);
	}

	module.exports = pointGrid;
	module.exports.default = pointGrid;


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

	var calcBbox = _interopDefault(__webpack_require__(6));
	var booleanPointOnLine = _interopDefault(__webpack_require__(12));
	var booleanPointInPolygon = _interopDefault(__webpack_require__(13));
	var invariant = __webpack_require__(9);

	/**
	 * Boolean-within returns true if the first geometry is completely within the second geometry.
	 * The interiors of both geometries must intersect and, the interior and boundary of the primary (geometry a)
	 * must not intersect the exterior of the secondary (geometry b).
	 * Boolean-within returns the exact opposite result of the `@turf/boolean-contains`.
	 *
	 * @name booleanWithin
	 * @param {Geometry|Feature<any>} feature1 GeoJSON Feature or Geometry
	 * @param {Geometry|Feature<any>} feature2 GeoJSON Feature or Geometry
	 * @returns {boolean} true/false
	 * @example
	 * var line = turf.lineString([[1, 1], [1, 2], [1, 3], [1, 4]]);
	 * var point = turf.point([1, 2]);
	 *
	 * turf.booleanWithin(point, line);
	 * //=true
	 */
	function booleanWithin(feature1, feature2) {
	    var type1 = invariant.getType(feature1);
	    var type2 = invariant.getType(feature2);
	    var geom1 = invariant.getGeom(feature1);
	    var geom2 = invariant.getGeom(feature2);

	    switch (type1) {
	    case 'Point':
	        switch (type2) {
	        case 'MultiPoint':
	            return isPointInMultiPoint(geom1, geom2);
	        case 'LineString':
	            return booleanPointOnLine(geom1, geom2, {ignoreEndVertices: true});
	        case 'Polygon':
	            return booleanPointInPolygon(geom1, geom2, {ignoreBoundary: true});
	        default:
	            throw new Error('feature2 ' + type2 + ' geometry not supported');
	        }
	    case 'MultiPoint':
	        switch (type2) {
	        case 'MultiPoint':
	            return isMultiPointInMultiPoint(geom1, geom2);
	        case 'LineString':
	            return isMultiPointOnLine(geom1, geom2);
	        case 'Polygon':
	            return isMultiPointInPoly(geom1, geom2);
	        default:
	            throw new Error('feature2 ' + type2 + ' geometry not supported');
	        }
	    case 'LineString':
	        switch (type2) {
	        case 'LineString':
	            return isLineOnLine(geom1, geom2);
	        case 'Polygon':
	            return isLineInPoly(geom1, geom2);
	        default:
	            throw new Error('feature2 ' + type2 + ' geometry not supported');
	        }
	    case 'Polygon':
	        switch (type2) {
	        case 'Polygon':
	            return isPolyInPoly(geom1, geom2);
	        default:
	            throw new Error('feature2 ' + type2 + ' geometry not supported');
	        }
	    default:
	        throw new Error('feature1 ' + type1 + ' geometry not supported');
	    }
	}

	function isPointInMultiPoint(point, multiPoint) {
	    var i;
	    var output = false;
	    for (i = 0; i < multiPoint.coordinates.length; i++) {
	        if (compareCoords(multiPoint.coordinates[i], point.coordinates)) {
	            output = true;
	            break;
	        }
	    }
	    return output;
	}

	function isMultiPointInMultiPoint(multiPoint1, multiPoint2) {
	    for (var i = 0; i < multiPoint1.coordinates.length; i++) {
	        var anyMatch = false;
	        for (var i2 = 0; i2 < multiPoint2.coordinates.length; i2++) {
	            if (compareCoords(multiPoint1.coordinates[i], multiPoint2.coordinates[i2])) {
	                anyMatch = true;
	            }
	        }
	        if (!anyMatch) {
	            return false;
	        }
	    }
	    return true;
	}

	function isMultiPointOnLine(multiPoint, lineString) {
	    var foundInsidePoint = false;

	    for (var i = 0; i < multiPoint.coordinates.length; i++) {
	        if (!booleanPointOnLine(multiPoint.coordinates[i], lineString)) {
	            return false;
	        }
	        if (!foundInsidePoint) {
	            foundInsidePoint = booleanPointOnLine(multiPoint.coordinates[i], lineString, {ignoreEndVertices: true});
	        }
	    }
	    return foundInsidePoint;
	}

	function isMultiPointInPoly(multiPoint, polygon) {
	    var output = true;
	    var oneInside = false;
	    for (var i = 0; i < multiPoint.coordinates.length; i++) {
	        var isInside = booleanPointInPolygon(multiPoint.coordinates[1], polygon);
	        if (!isInside) {
	            output = false;
	            break;
	        }
	        if (!oneInside) {
	            isInside = booleanPointInPolygon(multiPoint.coordinates[1], polygon, {ignoreBoundary: true});
	        }
	    }
	    return output && isInside;
	}

	function isLineOnLine(lineString1, lineString2) {
	    for (var i = 0; i < lineString1.coordinates.length; i++) {
	        if (!booleanPointOnLine(lineString1.coordinates[i], lineString2)) {
	            return false;
	        }
	    }
	    return true;
	}

	function isLineInPoly(linestring, polygon) {
	    var polyBbox = calcBbox(polygon);
	    var lineBbox = calcBbox(linestring);
	    if (!doBBoxOverlap(polyBbox, lineBbox)) {
	        return false;
	    }
	    var foundInsidePoint = false;

	    for (var i = 0; i < linestring.coordinates.length - 1; i++) {
	        if (!booleanPointInPolygon(linestring.coordinates[i], polygon)) {
	            return false;
	        }
	        if (!foundInsidePoint) {
	            foundInsidePoint = booleanPointInPolygon(linestring.coordinates[i], polygon, {ignoreBoundary: true});
	        }
	        if (!foundInsidePoint) {
	            var midpoint = getMidpoint(linestring.coordinates[i], linestring.coordinates[i + 1]);
	            foundInsidePoint = booleanPointInPolygon(midpoint, polygon, {ignoreBoundary: true});

	        }
	    }
	    return foundInsidePoint;
	}

	/**
	 * Is Polygon2 in Polygon1
	 * Only takes into account outer rings
	 *
	 * @private
	 * @param {Geometry|Feature<Polygon>} feature1 Polygon1
	 * @param {Geometry|Feature<Polygon>} feature2 Polygon2
	 * @returns {boolean} true/false
	 */
	function isPolyInPoly(feature1, feature2) {
	    var poly1Bbox = calcBbox(feature1);
	    var poly2Bbox = calcBbox(feature2);
	    if (!doBBoxOverlap(poly2Bbox, poly1Bbox)) {
	        return false;
	    }
	    for (var i = 0; i < feature1.coordinates[0].length; i++) {
	        if (!booleanPointInPolygon(feature1.coordinates[0][i], feature2)) {
	            return false;
	        }
	    }
	    return true;
	}

	function doBBoxOverlap(bbox1, bbox2) {
	    if (bbox1[0] > bbox2[0]) return false;
	    if (bbox1[2] < bbox2[2]) return false;
	    if (bbox1[1] > bbox2[1]) return false;
	    if (bbox1[3] < bbox2[3]) return false;
	    return true;
	}

	/**
	 * compareCoords
	 *
	 * @private
	 * @param {Position} pair1 point [x,y]
	 * @param {Position} pair2 point [x,y]
	 * @returns {boolean} true/false if coord pairs match
	 */
	function compareCoords(pair1, pair2) {
	    return pair1[0] === pair2[0] && pair1[1] === pair2[1];
	}

	/**
	 * getMidpoint
	 *
	 * @private
	 * @param {Position} pair1 point [x,y]
	 * @param {Position} pair2 point [x,y]
	 * @returns {Position} midpoint of pair1 and pair2
	 */
	function getMidpoint(pair1, pair2) {
	    return [(pair1[0] + pair2[0]) / 2, (pair1[1] + pair2[1]) / 2];
	}

	module.exports = booleanWithin;
	module.exports.default = booleanWithin;


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var invariant = __webpack_require__(9);
	var helpers = __webpack_require__(8);

	/**
	 * Returns true if a point is on a line. Accepts a optional parameter to ignore the start and end vertices of the linestring.
	 *
	 * @name booleanPointOnLine
	 * @param {Coord} pt GeoJSON Point
	 * @param {Feature<LineString>} line GeoJSON LineString
	 * @param {Object} [options={}] Optional parameters
	 * @param {boolean} [options.ignoreEndVertices=false] whether to ignore the start and end vertices.
	 * @returns {boolean} true/false
	 * @example
	 * var pt = turf.point([0, 0]);
	 * var line = turf.lineString([[-1, -1],[1, 1],[1.5, 2.2]]);
	 * var isPointOnLine = turf.booleanPointOnLine(pt, line);
	 * //=true
	 */
	function booleanPointOnLine(pt, line, options) {
	    // Optional parameters
	    options = options || {};
	    var ignoreEndVertices = options.ignoreEndVertices;
	    if (!helpers.isObject(options)) throw new Error('invalid options');

	    // Validate input
	    if (!pt) throw new Error('pt is required');
	    if (!line) throw new Error('line is required');

	    // Normalize inputs
	    var ptCoords = invariant.getCoord(pt);
	    var lineCoords = invariant.getCoords(line);

	    // Main
	    for (var i = 0; i < lineCoords.length - 1; i++) {
	        var ignoreBoundary = false;
	        if (ignoreEndVertices) {
	            if (i === 0) ignoreBoundary = 'start';
	            if (i === lineCoords.length - 2) ignoreBoundary = 'end';
	            if (i === 0 && i + 1 === lineCoords.length - 1) ignoreBoundary = 'both';
	        }
	        if (isPointOnLineSegment(lineCoords[i], lineCoords[i + 1], ptCoords, ignoreBoundary)) return true;
	    }
	    return false;
	}

	// See http://stackoverflow.com/a/4833823/1979085
	/**
	 * @private
	 * @param {Position} lineSegmentStart coord pair of start of line
	 * @param {Position} lineSegmentEnd coord pair of end of line
	 * @param {Position} pt coord pair of point to check
	 * @param {boolean|string} excludeBoundary whether the point is allowed to fall on the line ends. If true which end to ignore.
	 * @returns {boolean} true/false
	 */
	function isPointOnLineSegment(lineSegmentStart, lineSegmentEnd, pt, excludeBoundary) {
	    var x = pt[0];
	    var y = pt[1];
	    var x1 = lineSegmentStart[0];
	    var y1 = lineSegmentStart[1];
	    var x2 = lineSegmentEnd[0];
	    var y2 = lineSegmentEnd[1];
	    var dxc = pt[0] - x1;
	    var dyc = pt[1] - y1;
	    var dxl = x2 - x1;
	    var dyl = y2 - y1;
	    var cross = dxc * dyl - dyc * dxl;
	    if (cross !== 0) {
	        return false;
	    }
	    if (!excludeBoundary) {
	        if (Math.abs(dxl) >= Math.abs(dyl)) {
	            return dxl > 0 ? x1 <= x && x <= x2 : x2 <= x && x <= x1;
	        }
	        return dyl > 0 ? y1 <= y && y <= y2 : y2 <= y && y <= y1;
	    } else if (excludeBoundary === 'start') {
	        if (Math.abs(dxl) >= Math.abs(dyl)) {
	            return dxl > 0 ? x1 < x && x <= x2 : x2 <= x && x < x1;
	        }
	        return dyl > 0 ? y1 < y && y <= y2 : y2 <= y && y < y1;
	    } else if (excludeBoundary === 'end') {
	        if (Math.abs(dxl) >= Math.abs(dyl)) {
	            return dxl > 0 ? x1 <= x && x < x2 : x2 < x && x <= x1;
	        }
	        return dyl > 0 ? y1 <= y && y < y2 : y2 < y && y <= y1;
	    } else if (excludeBoundary === 'both') {
	        if (Math.abs(dxl) >= Math.abs(dyl)) {
	            return dxl > 0 ? x1 < x && x < x2 : x2 < x && x < x1;
	        }
	        return dyl > 0 ? y1 < y && y < y2 : y2 < y && y < y1;
	    }
	}

	module.exports = booleanPointOnLine;
	module.exports.default = booleanPointOnLine;


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var invariant = __webpack_require__(9);

	// http://en.wikipedia.org/wiki/Even%E2%80%93odd_rule
	// modified from: https://github.com/substack/point-in-polygon/blob/master/index.js
	// which was modified from http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

	/**
	 * Takes a {@link Point} and a {@link Polygon} or {@link MultiPolygon} and determines if the point resides inside the polygon. The polygon can
	 * be convex or concave. The function accounts for holes.
	 *
	 * @name booleanPointInPolygon
	 * @param {Coord} point input point
	 * @param {Feature<Polygon|MultiPolygon>} polygon input polygon or multipolygon
	 * @param {Object} [options={}] Optional parameters
	 * @param {boolean} [options.ignoreBoundary=false] True if polygon boundary should be ignored when determining if the point is inside the polygon otherwise false.
	 * @returns {boolean} `true` if the Point is inside the Polygon; `false` if the Point is not inside the Polygon
	 * @example
	 * var pt = turf.point([-77, 44]);
	 * var poly = turf.polygon([[
	 *   [-81, 41],
	 *   [-81, 47],
	 *   [-72, 47],
	 *   [-72, 41],
	 *   [-81, 41]
	 * ]]);
	 *
	 * turf.booleanPointInPolygon(pt, poly);
	 * //= true
	 */
	function booleanPointInPolygon(point, polygon, options) {
	    // Optional parameters
	    options = options || {};
	    if (typeof options !== 'object') throw new Error('options is invalid');
	    var ignoreBoundary = options.ignoreBoundary;

	    // validation
	    if (!point) throw new Error('point is required');
	    if (!polygon) throw new Error('polygon is required');

	    var pt = invariant.getCoord(point);
	    var polys = invariant.getCoords(polygon);
	    var type = (polygon.geometry) ? polygon.geometry.type : polygon.type;
	    var bbox = polygon.bbox;

	    // Quick elimination if point is not inside bbox
	    if (bbox && inBBox(pt, bbox) === false) return false;

	    // normalize to multipolygon
	    if (type === 'Polygon') polys = [polys];

	    for (var i = 0, insidePoly = false; i < polys.length && !insidePoly; i++) {
	        // check if it is in the outer ring first
	        if (inRing(pt, polys[i][0], ignoreBoundary)) {
	            var inHole = false;
	            var k = 1;
	            // check for the point in any of the holes
	            while (k < polys[i].length && !inHole) {
	                if (inRing(pt, polys[i][k], !ignoreBoundary)) {
	                    inHole = true;
	                }
	                k++;
	            }
	            if (!inHole) insidePoly = true;
	        }
	    }
	    return insidePoly;
	}

	/**
	 * inRing
	 *
	 * @private
	 * @param {Array<number>} pt [x,y]
	 * @param {Array<Array<number>>} ring [[x,y], [x,y],..]
	 * @param {boolean} ignoreBoundary ignoreBoundary
	 * @returns {boolean} inRing
	 */
	function inRing(pt, ring, ignoreBoundary) {
	    var isInside = false;
	    if (ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]) ring = ring.slice(0, ring.length - 1);

	    for (var i = 0, j = ring.length - 1; i < ring.length; j = i++) {
	        var xi = ring[i][0], yi = ring[i][1];
	        var xj = ring[j][0], yj = ring[j][1];
	        var onBoundary = (pt[1] * (xi - xj) + yi * (xj - pt[0]) + yj * (pt[0] - xi) === 0) &&
	            ((xi - pt[0]) * (xj - pt[0]) <= 0) && ((yi - pt[1]) * (yj - pt[1]) <= 0);
	        if (onBoundary) return !ignoreBoundary;
	        var intersect = ((yi > pt[1]) !== (yj > pt[1])) &&
	        (pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi);
	        if (intersect) isInside = !isInside;
	    }
	    return isInside;
	}

	/**
	 * inBBox
	 *
	 * @private
	 * @param {Position} pt point [x,y]
	 * @param {BBox} bbox BBox [west, south, east, north]
	 * @returns {boolean} true/false if point is inside BBox
	 */
	function inBBox(pt, bbox) {
	    return bbox[0] <= pt[0] &&
	           bbox[1] <= pt[1] &&
	           bbox[2] >= pt[0] &&
	           bbox[3] >= pt[1];
	}

	module.exports = booleanPointInPolygon;
	module.exports.default = booleanPointInPolygon;


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var invariant = __webpack_require__(9);
	var helpers = __webpack_require__(8);

	//http://en.wikipedia.org/wiki/Haversine_formula
	//http://www.movable-type.co.uk/scripts/latlong.html

	/**
	 * Calculates the distance between two {@link Point|points} in degrees, radians,
	 * miles, or kilometers. This uses the
	 * [Haversine formula](http://en.wikipedia.org/wiki/Haversine_formula)
	 * to account for global curvature.
	 *
	 * @name distance
	 * @param {Coord} from origin point
	 * @param {Coord} to destination point
	 * @param {Object} [options={}] Optional parameters
	 * @param {string} [options.units='kilometers'] can be degrees, radians, miles, or kilometers
	 * @returns {number} distance between the two points
	 * @example
	 * var from = turf.point([-75.343, 39.984]);
	 * var to = turf.point([-75.534, 39.123]);
	 * var options = {units: 'miles'};
	 *
	 * var distance = turf.distance(from, to, options);
	 *
	 * //addToMap
	 * var addToMap = [from, to];
	 * from.properties.distance = distance;
	 * to.properties.distance = distance;
	 */
	function distance(from, to, options) {
	    // Optional parameters
	    options = options || {};
	    if (!helpers.isObject(options)) throw new Error('options is invalid');
	    var units = options.units;

	    var coordinates1 = invariant.getCoord(from);
	    var coordinates2 = invariant.getCoord(to);
	    var dLat = helpers.degreesToRadians((coordinates2[1] - coordinates1[1]));
	    var dLon = helpers.degreesToRadians((coordinates2[0] - coordinates1[0]));
	    var lat1 = helpers.degreesToRadians(coordinates1[1]);
	    var lat2 = helpers.degreesToRadians(coordinates2[1]);

	    var a = Math.pow(Math.sin(dLat / 2), 2) +
	          Math.pow(Math.sin(dLon / 2), 2) * Math.cos(lat1) * Math.cos(lat2);

	    return helpers.radiansToLength(2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)), units);
	}

	module.exports = distance;
	module.exports.default = distance;


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';

	var helpers = __webpack_require__(8);
	var invariant = __webpack_require__(9);

	/* eslint-disable */

	 /**
	   * BezierSpline
	   * https://github.com/leszekr/bezier-spline-js
	   *
	   * @private
	   * @copyright
	   * Copyright (c) 2013 Leszek Rybicki
	   *
	   * Permission is hereby granted, free of charge, to any person obtaining a copy
	   * of this software and associated documentation files (the "Software"), to deal
	   * in the Software without restriction, including without limitation the rights
	   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	   * copies of the Software, and to permit persons to whom the Software is
	   * furnished to do so, subject to the following conditions:
	   *
	   * The above copyright notice and this permission notice shall be included in all
	   * copies or substantial portions of the Software.
	   *
	   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	   * SOFTWARE.
	   */
	var Spline = function (options) {
	    this.points = options.points || [];
	    this.duration = options.duration || 10000;
	    this.sharpness = options.sharpness || 0.85;
	    this.centers = [];
	    this.controls = [];
	    this.stepLength = options.stepLength || 60;
	    this.length = this.points.length;
	    this.delay = 0;
	    // this is to ensure compatibility with the 2d version
	    for (var i = 0; i < this.length; i++) this.points[i].z = this.points[i].z || 0;
	    for (var i = 0; i < this.length - 1; i++) {
	        var p1 = this.points[i];
	        var p2 = this.points[i + 1];
	        this.centers.push({
	            x: (p1.x + p2.x) / 2,
	            y: (p1.y + p2.y) / 2,
	            z: (p1.z + p2.z) / 2
	        });
	    }
	    this.controls.push([this.points[0], this.points[0]]);
	    for (var i = 0; i < this.centers.length - 1; i++) {
	        var p1 = this.centers[i];
	        var p2 = this.centers[i + 1];
	        var dx = this.points[i + 1].x - (this.centers[i].x + this.centers[i + 1].x) / 2;
	        var dy = this.points[i + 1].y - (this.centers[i].y + this.centers[i + 1].y) / 2;
	        var dz = this.points[i + 1].z - (this.centers[i].y + this.centers[i + 1].z) / 2;
	        this.controls.push([{
	            x: (1.0 - this.sharpness) * this.points[i + 1].x + this.sharpness * (this.centers[i].x + dx),
	            y: (1.0 - this.sharpness) * this.points[i + 1].y + this.sharpness * (this.centers[i].y + dy),
	            z: (1.0 - this.sharpness) * this.points[i + 1].z + this.sharpness * (this.centers[i].z + dz)},
	            {
	                x: (1.0 - this.sharpness) * this.points[i + 1].x + this.sharpness * (this.centers[i + 1].x + dx),
	                y: (1.0 - this.sharpness) * this.points[i + 1].y + this.sharpness * (this.centers[i + 1].y + dy),
	                z: (1.0 - this.sharpness) * this.points[i + 1].z + this.sharpness * (this.centers[i + 1].z + dz)}]);
	    }
	    this.controls.push([this.points[this.length - 1], this.points[this.length - 1]]);
	    this.steps = this.cacheSteps(this.stepLength);
	    return this;
	};

	  /*
	    Caches an array of equidistant (more or less) points on the curve.
	  */
	Spline.prototype.cacheSteps = function (mindist) {
	    var steps = [];
	    var laststep = this.pos(0);
	    steps.push(0);
	    for (var t = 0; t < this.duration; t += 10) {
	        var step = this.pos(t);
	        var dist = Math.sqrt((step.x - laststep.x) * (step.x - laststep.x) + (step.y - laststep.y) * (step.y - laststep.y) + (step.z - laststep.z) * (step.z - laststep.z));
	        if (dist > mindist) {
	            steps.push(t);
	            laststep = step;
	        }
	    }
	    return steps;
	};

	  /*
	    returns angle and speed in the given point in the curve
	  */
	Spline.prototype.vector = function (t) {
	    var p1 = this.pos(t + 10);
	    var p2 = this.pos(t - 10);
	    return {
	        angle:180 * Math.atan2(p1.y - p2.y, p1.x - p2.x) / 3.14,
	        speed:Math.sqrt((p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y) + (p2.z - p1.z) * (p2.z - p1.z))
	    };
	};

	  /*
	    Gets the position of the point, given time.

	    WARNING: The speed is not constant. The time it takes between control points is constant.

	    For constant speed, use Spline.steps[i];
	  */
	Spline.prototype.pos = function (time) {

	    function bezier(t, p1, c1, c2, p2) {
	        var B = function (t) {
	            var t2 = t * t, t3 = t2 * t;
	            return [(t3), (3 * t2 * (1 - t)), (3 * t * (1 - t) * (1 - t)), ((1 - t) * (1 - t) * (1 - t))];
	        };
	        var b = B(t);
	        var pos = {
	            x : p2.x * b[0] + c2.x * b[1] + c1.x * b[2] + p1.x * b[3],
	            y : p2.y * b[0] + c2.y * b[1] + c1.y * b[2] + p1.y * b[3],
	            z : p2.z * b[0] + c2.z * b[1] + c1.z * b[2] + p1.z * b[3]
	        };
	        return pos;
	    }
	    var t = time - this.delay;
	    if (t < 0) t = 0;
	    if (t > this.duration) t = this.duration - 1;
	    //t = t-this.delay;
	    var t2 = (t) / this.duration;
	    if (t2 >= 1) return this.points[this.length - 1];

	    var n = Math.floor((this.points.length - 1) * t2);
	    var t1 = (this.length - 1) * t2 - n;
	    return bezier(t1, this.points[n], this.controls[n][1], this.controls[n + 1][0], this.points[n + 1]);
	};

	/**
	 * Takes a {@link LineString|line} and returns a curved version
	 * by applying a [Bezier spline](http://en.wikipedia.org/wiki/B%C3%A9zier_spline)
	 * algorithm.
	 *
	 * The bezier spline implementation is by [Leszek Rybicki](http://leszek.rybicki.cc/).
	 *
	 * @name bezierSpline
	 * @param {Feature<LineString>} line input LineString
	 * @param {Object} [options={}] Optional parameters
	 * @param {number} [options.resolution=10000] time in milliseconds between points
	 * @param {number} [options.sharpness=0.85] a measure of how curvy the path should be between splines
	 * @returns {Feature<LineString>} curved line
	 * @example
	 * var line = turf.lineString([
	 *   [-76.091308, 18.427501],
	 *   [-76.695556, 18.729501],
	 *   [-76.552734, 19.40443],
	 *   [-74.61914, 19.134789],
	 *   [-73.652343, 20.07657],
	 *   [-73.157958, 20.210656]
	 * ]);
	 *
	 * var curved = turf.bezierSpline(line);
	 *
	 * //addToMap
	 * var addToMap = [line, curved]
	 * curved.properties = { stroke: '#0F0' };
	 */
	function bezier(line, options) {
	    // Optional params
	    options = options || {};
	    if (!helpers.isObject(options)) throw new Error('options is invalid');
	    var resolution = options.resolution || 10000;
	    var sharpness = options.sharpness || 0.85;

	    // validation
	    if (!line) throw new Error('line is required');
	    if (!helpers.isNumber(resolution)) throw new Error('resolution must be an number');
	    if (!helpers.isNumber(sharpness)) throw new Error('sharpness must be an number');

	    var coords = [];
	    var spline = new Spline({
	        points: invariant.getGeom(line).coordinates.map(function (pt) {
	            return {x: pt[0], y: pt[1]};
	        }),
	        duration: resolution,
	        sharpness: sharpness
	    });

	    for (var i = 0; i < spline.duration; i += 10) {
	        var pos = spline.pos(i);
	        if (Math.floor(i / 100) % 2 === 0) {
	            coords.push([pos.x, pos.y]);
	        }
	    }

	    return helpers.lineString(coords, line.properties);
	}

	module.exports = bezier;
	module.exports.default = bezier;


/***/ })
/******/ ]);
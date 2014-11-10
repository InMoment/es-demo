/*
 * Calaca - Search UI for Elasticsearch
 * https://github.com/romansanchez/Calaca
 * http://romansanchez.me
 * @rooomansanchez
 *
 * v1.1.0
 * MIT License
 */

/* Calaca Controller
 *
 * On change in search box, search() will be called, and results are bind to scope as results[]
 *
 */
Calaca.controller('calacaCtrl', ['calacaService', '$scope', '$location',
  function(results, $scope, $location) {

    //Init empty array
    $scope.results = [];

    //Init offset
    $scope.offset = 0;

    var paginationTriggered;

    var piechart, linechart;

    //On search, reinitialize array, then perform search and load results
    $scope.search = function(m) {
      $scope.results = [];
      $scope.offset = m == 0 ? 0 : $scope.offset; //Clear offset if new query
      $scope.loading = m == 0 ? false : true; //Reset loading flag if new query

      if (m == -1 && paginationTriggered) {
        if ($scope.offset - maxResultsSize >= 0) $scope.offset -= maxResultsSize;
      }
      if (m == 1 && paginationTriggered) {
        $scope.offset += maxResultsSize;
      }
      $scope.paginationLowerBound = $scope.offset + 1;
      $scope.paginationUpperBound = ($scope.offset == 0) ? maxResultsSize : $scope.offset + maxResultsSize;
      $scope.loadResults(m);
    };

    //Load search results into array
    $scope.loadResults = function(m) {
      results.search($scope.query, m, $scope.offset)
      //Load comment results
      .then(function(a) {
        var i = 0;
        for (; i < a.hits.length; i++) {
          var hit = a.hits[i];

          var result = {
            org: hit.location.organizationId,
            location: hit.location.locationId,
            comment: hit.data[0].valueComment.text
          };

          $scope.results.push(result);
        }

        // Set query metadata

        //Set time took
        $scope.timeTook = a.timeTook;

        //Set total number of hits that matched query
        $scope.hits = a.hitsCount;

        //Pluralization
        $scope.resultsLabel = ($scope.hits != 1) ? "results" : "result";

        //Check if pagination is triggered
        paginationTriggered = $scope.hits > maxResultsSize ? true : false;

        //Set loading flag if pagination has been triggered
        if (paginationTriggered) {
          $scope.loading = true;
        }

        // Load by location aggregation results
        if (googleChartsLoaded && a.hits && a.hits.length && a.hits.length > 0) {
          if (a.aggregations && a.aggregations["location_terms"] && a.aggregations["location_terms"].buckets) {
            var table = a.aggregations["location_terms"].buckets.map(function(agg) {
              return [agg["key"].toString(), agg["doc_count"]];
            });
            table.unshift(["Location ID", "Count"]);
            var data = google.visualization.arrayToDataTable(table);

            var options = {
              title: 'Comments by Location',
              pieHole: 0.4
            };

            piechart = piechart || new google.visualization.PieChart(document.getElementById('piechart'));

            piechart.draw(data, options);
          }
          if (a.aggregations && a.aggregations["comment_histogram"] && a.aggregations["comment_histogram"].buckets) {
            var table = a.aggregations["comment_histogram"].buckets.map(function(agg) {
              return [agg["key_as_string"].toString(), agg["doc_count"]];
            });
            table.unshift(["Date", "Count"]);
            var data = google.visualization.arrayToDataTable(table);

            var options = {
              title: 'Comment Count over Time',
              curveType: 'function',
              animation: {
                duration: 100
              }

            };

            linechart = linechart || new google.visualization.LineChart(document.getElementById('histogram'));

            linechart.draw(data, options);

          }
        } else {
          piechart.clearChart();
          linechart.clearChart();
        }
      });
    };

    $scope.paginationEnabled = function() {
      return paginationTriggered ? true : false;
    };


  }
]);
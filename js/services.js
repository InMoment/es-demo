/*
 * Calaca - Search UI for Elasticsearch
 * https://github.com/romansanchez/Calaca
 * http://romansanchez.me
 * @rooomansanchez
 *
 * v1.1.0
 * MIT License
 */

/* Service to Elasticsearch */
Calaca.factory('calacaService', ['$q', 'esFactory', '$location',
  function($q, elasticsearch, $location) {

    //Set defaults if host and port aren't configured
    var esHost = (host.length > 0) ? host : $location.host();
    var esPort = (port.length > 0) ? port : 9200;

    var client = elasticsearch({
      host: esHost + ":" + esPort
    });

    var search = function(query, mode, offset) {

      var deferred = $q.defer();

      client.search(
        /*{
        "index": indexName,
        "type": docType,
        "body": {
          "_source": ["location", "data.valueComment"],
          "size": maxResultsSize,
          "from": offset,
          "query": {
            "filtered": {
              "filter": {
                "term": {
                  "data.valueComment.text": query
                }
              }
            }
          }
        }
      }*/
        /*{
          "index": indexName,
          "type": docType,
          "body": {
            "_source": ["location", "data.valueComment"],
            "size": maxResultsSize,
            "from": offset,
            "query": {
              "simple_query_string": {
                "fields": ["data.valueComment.text"],
                "query": query,
                "default_operator": "and"
              }
            }
          }
        }*/
        {
          "index": indexName,
          "type": docType,
          "body": {
            // only return these fields in the _source result
            "_source": ["location", "data.valueComment", "responseDateTime.utcDateTime"],
            "size": 10,
            "from": 0,
            "query": {
              // use lucene simple string query analyzer syntax
              "simple_query_string": {
                "fields": ["data.valueComment.text"],
                "query": query,
                "default_operator": "and"
              }

            },
            "aggregations": {
              // aggregation of comments by location
              "location_terms": {
                "terms": {
                  "field": "location.locationId"
                  //"size": 10
                }
              },
              // aggregation of number of comments grouped by month
              "comment_histogram": {
                "date_histogram": {
                  "field": "responseDateTime.utcDateTime",
                  "interval": "1M",
                  "format": "yyyy-MM"
                }/*,
                "aggregations": {
                  // sub aggregation to get top locations per month
                  "location_terms": {
                    "terms": {
                      "field": "location.locationId"
                    }
                  }
                }*/
              }
            }
          }
        }

      ).then(function(result) {
        var i = 0,
          hitsIn, hitsOut = [];
        hitsIn = (result.hits || {}).hits || [];
        for (; i < hitsIn.length; i++) {
          hitsOut.push(hitsIn[i]._source);
        }
        deferred.resolve({
          timeTook: result.took,
          hitsCount: result.hits.total,
          hits: hitsOut,
          aggregations: result.aggregations
        });
      }, deferred.reject);

      return deferred.promise;
    };

    return {
      "search": search
    };

  }
]);
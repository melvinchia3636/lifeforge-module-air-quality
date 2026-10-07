export const contract = {
  "getStations": {
    "method": "get",
    "description": "Get air quality monitoring stations within a bounding box",
    "noAuth": false,
    "encrypted": true,
    "isDownloadable": false,
    "media": null,
    "input": {
      "query": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
          "south": {
            "type": "string"
          },
          "west": {
            "type": "string"
          },
          "north": {
            "type": "string"
          },
          "east": {
            "type": "string"
          }
        },
        "required": [
          "south",
          "west",
          "north",
          "east"
        ],
        "additionalProperties": false
      }
    },
    "output": {
      "OK": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "lat": {
              "type": "number"
            },
            "lng": {
              "type": "number"
            },
            "aqi": {
              "anyOf": [
                {
                  "type": "number"
                },
                {
                  "type": "null"
                }
              ]
            },
            "time": {
              "type": "string"
            }
          },
          "required": [
            "id",
            "name",
            "lat",
            "lng",
            "aqi",
            "time"
          ],
          "additionalProperties": false
        }
      }
    }
  },
  "getStationDetail": {
    "method": "get",
    "description": "Get detailed air quality data for a single station",
    "noAuth": false,
    "encrypted": true,
    "isDownloadable": false,
    "media": null,
    "input": {
      "query": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
          "idx": {
            "type": "string"
          }
        },
        "required": [
          "idx"
        ],
        "additionalProperties": false
      }
    },
    "output": {
      "OK": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
          "idx": {
            "type": "string"
          },
          "start": {
            "type": "number"
          },
          "step": {
            "type": "number"
          },
          "current": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "key": {
                  "type": "string"
                },
                "value": {
                  "type": "number"
                }
              },
              "required": [
                "key",
                "value"
              ],
              "additionalProperties": false
            }
          },
          "series": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "key": {
                  "type": "string"
                },
                "values": {
                  "type": "array",
                  "items": {
                    "anyOf": [
                      {
                        "type": "number"
                      },
                      {
                        "type": "null"
                      }
                    ]
                  }
                }
              },
              "required": [
                "key",
                "values"
              ],
              "additionalProperties": false
            }
          }
        },
        "required": [
          "idx",
          "start",
          "step",
          "current",
          "series"
        ],
        "additionalProperties": false
      }
    }
  },
  "image": {
    "method": "get",
    "description": "Generate a 384px-wide black and white image of a station detail",
    "noAuth": true,
    "encrypted": false,
    "isDownloadable": true,
    "media": null,
    "input": {
      "query": {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
          "idx": {
            "type": "string"
          },
          "t": {
            "type": "string"
          }
        },
        "required": [
          "idx"
        ],
        "additionalProperties": false
      }
    },
    "output": "custom"
  }
} as const

export default contract

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
  },
  "selection": {
    "get": {
      "method": "get",
      "description": "Get the station selected for the dashboard widget",
      "noAuth": false,
      "encrypted": true,
      "isDownloadable": false,
      "media": null,
      "input": {},
      "output": {
        "OK": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "station": {
              "anyOf": [
                {
                  "type": "object",
                  "properties": {
                    "id": {
                      "type": "string",
                      "format": "uuid",
                      "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
                    },
                    "station_id": {
                      "type": "string"
                    },
                    "name": {
                      "type": "string"
                    },
                    "lat": {
                      "type": "number",
                      "minimum": -140737488355328,
                      "maximum": 140737488355327
                    },
                    "lng": {
                      "type": "number",
                      "minimum": -140737488355328,
                      "maximum": 140737488355327
                    },
                    "created": {
                      "type": "string",
                      "format": "date-time"
                    },
                    "updated": {
                      "type": "string",
                      "format": "date-time"
                    }
                  },
                  "required": [
                    "id",
                    "station_id",
                    "name",
                    "lat",
                    "lng",
                    "created",
                    "updated"
                  ],
                  "additionalProperties": false
                },
                {
                  "type": "null"
                }
              ]
            }
          },
          "required": [
            "station"
          ],
          "additionalProperties": false
        }
      }
    },
    "set": {
      "method": "post",
      "description": "Set the station displayed in the dashboard widget",
      "noAuth": false,
      "encrypted": true,
      "isDownloadable": false,
      "media": null,
      "input": {
        "body": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "stationId": {
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
            }
          },
          "required": [
            "stationId",
            "name",
            "lat",
            "lng"
          ],
          "additionalProperties": false
        }
      },
      "output": {
        "OK": {
          "$schema": "https://json-schema.org/draft/2020-12/schema",
          "type": "object",
          "properties": {
            "id": {
              "type": "string",
              "format": "uuid",
              "pattern": "^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$"
            },
            "station_id": {
              "type": "string"
            },
            "name": {
              "type": "string"
            },
            "lat": {
              "type": "number",
              "minimum": -140737488355328,
              "maximum": 140737488355327
            },
            "lng": {
              "type": "number",
              "minimum": -140737488355328,
              "maximum": 140737488355327
            },
            "created": {
              "type": "string",
              "format": "date-time"
            },
            "updated": {
              "type": "string",
              "format": "date-time"
            }
          },
          "required": [
            "id",
            "station_id",
            "name",
            "lat",
            "lng",
            "created",
            "updated"
          ],
          "additionalProperties": false
        }
      }
    }
  }
} as const

export default contract

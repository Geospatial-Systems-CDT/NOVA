// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import swaggerJsdoc from "swagger-jsdoc";
import { Application } from "express";
import swaggerUi from "swagger-ui-express";

/**
 * Swagger configuration class
 */
export class SwaggerConfig {
  private readonly options: swaggerJsdoc.Options;

  /**
   * Constructor for SwaggerConfig
   * @param apiPath - Path to the API documentation
   */
  constructor(private readonly apiPath: string = "/api/docs") {
    this.options = {
      definition: {
        openapi: "3.0.0",
        info: {
          title: "NOVA API",
          version: "1.0.0",
          description:
            "API for determining user details and access rights based on inbound JWT tokens.",
        },
        components: {
          schemas: {
            PositionDTO: {
              type: "object",
              properties: {
                latitude: {
                  type: "number",
                  description: "Latitude coordinate"
                },
                longitude: {
                  type: "number",
                  description: "Longitude coordinate"
                }
              },
              required: ["latitude", "longitude"]
            },
            AttributeDTO: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "Unique identifier for the attribute"
                },
                description: {
                  type: "string",
                  description: "Human-readable description of the attribute"
                },
                defaultValue: {
                  oneOf: [
                    { type: "number" },
                    { type: "string" }
                  ],
                  description: "Default value for the attribute"
                },
                valueType: {
                  type: "string",
                  description: "Data type of the attribute value"
                },
                options: {
                  type: "array",
                  items: {
                    type: "string"
                  },
                  description: "Optional list of available options for string attributes"
                }
              },
              required: ["id", "description", "defaultValue", "valueType"]
            },
            ItemDTO: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "id of the item"
                },
                name: {
                  type: "string",
                  description: "Name of the item"
                },
                attributes: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/AttributeDTO"
                  },
                  description: "List of configurable attributes for this item"
                },
                active: {
                  type: "boolean",
                  description: "Indicates whether the item is active",
                  default: false
                }
              },
              required: ["name", "attributes"]
            },
            CategoryDTO: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "Name of the category"
                },
                items: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/ItemDTO"
                  },
                  description: "List of items in this category"
                }
              },
              required: ["name", "items"]
            },
            LayersDTO: {
              type: "object",
              properties: {
                categories: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/CategoryDTO"
                  },
                  description: "List of categories containing layer items"
                }
              },
              required: ["categories"]
            },
            GeoJSONDTO: {
              type: "object",
              description: "A GeoJSON object as defined by RFC 7946",
              oneOf: [
                { $ref: "#/components/schemas/GeometryObject" },
                { $ref: "#/components/schemas/Feature" },
                { $ref: "#/components/schemas/FeatureCollection" }
              ]
            },
            GeometryObject: {
              type: "object",
              description: "A GeoJSON Geometry object",
              oneOf: [
                { $ref: "#/components/schemas/Point" },
                { $ref: "#/components/schemas/MultiPoint" },
                { $ref: "#/components/schemas/LineString" },
                { $ref: "#/components/schemas/MultiLineString" },
                { $ref: "#/components/schemas/Polygon" },
                { $ref: "#/components/schemas/MultiPolygon" },
                { $ref: "#/components/schemas/GeometryCollection" }
              ]
            },
            Position: {
              type: "array",
              description: "A position is an array of numbers representing a point in space. In GeoJSON, positions are in the format [longitude, latitude] or [longitude, latitude, elevation]",
              items: {
                type: "number"
              },
              minItems: 2
            },
            Point: {
              type: "object",
              description: "A GeoJSON Point geometry",
              properties: {
                type: {
                  type: "string",
                  enum: ["Point"],
                  description: "The geometry type"
                },
                coordinates: {
                  $ref: "#/components/schemas/Position",
                  description: "The coordinates of the point"
                },
                bbox: {
                  $ref: "#/components/schemas/BBox",
                  description: "Optional bounding box"
                }
              },
              required: ["type", "coordinates"]
            },
            MultiPoint: {
              type: "object",
              description: "A GeoJSON MultiPoint geometry",
              properties: {
                type: {
                  type: "string",
                  enum: ["MultiPoint"],
                  description: "The geometry type"
                },
                coordinates: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/Position"
                  },
                  description: "Array of positions"
                },
                bbox: {
                  $ref: "#/components/schemas/BBox",
                  description: "Optional bounding box"
                }
              },
              required: ["type", "coordinates"]
            },
            LineString: {
              type: "object",
              description: "A GeoJSON LineString geometry",
              properties: {
                type: {
                  type: "string",
                  enum: ["LineString"],
                  description: "The geometry type"
                },
                coordinates: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/Position"
                  },
                  description: "Array of positions forming the line"
                },
                bbox: {
                  $ref: "#/components/schemas/BBox",
                  description: "Optional bounding box"
                }
              },
              required: ["type", "coordinates"]
            },
            MultiLineString: {
              type: "object",
              description: "A GeoJSON MultiLineString geometry",
              properties: {
                type: {
                  type: "string",
                  enum: ["MultiLineString"],
                  description: "The geometry type"
                },
                coordinates: {
                  type: "array",
                  items: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/Position"
                    }
                  },
                  description: "Array of LineString coordinate arrays"
                },
                bbox: {
                  $ref: "#/components/schemas/BBox",
                  description: "Optional bounding box"
                }
              },
              required: ["type", "coordinates"]
            },
            Polygon: {
              type: "object",
              description: "A GeoJSON Polygon geometry",
              properties: {
                type: {
                  type: "string",
                  enum: ["Polygon"],
                  description: "The geometry type"
                },
                coordinates: {
                  type: "array",
                  items: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/Position"
                    }
                  },
                  description: "Array of linear ring coordinate arrays. The first ring is the exterior ring, and any subsequent rings are interior rings (holes)"
                },
                bbox: {
                  $ref: "#/components/schemas/BBox",
                  description: "Optional bounding box"
                }
              },
              required: ["type", "coordinates"]
            },
            MultiPolygon: {
              type: "object",
              description: "A GeoJSON MultiPolygon geometry",
              properties: {
                type: {
                  type: "string",
                  enum: ["MultiPolygon"],
                  description: "The geometry type"
                },
                coordinates: {
                  type: "array",
                  items: {
                    type: "array",
                    items: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Position"
                      }
                    }
                  },
                  description: "Array of Polygon coordinate arrays"
                },
                bbox: {
                  $ref: "#/components/schemas/BBox",
                  description: "Optional bounding box"
                }
              },
              required: ["type", "coordinates"]
            },
            GeometryCollection: {
              type: "object",
              description: "A GeoJSON GeometryCollection",
              properties: {
                type: {
                  type: "string",
                  enum: ["GeometryCollection"],
                  description: "The geometry type"
                },
                geometries: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/GeometryObject"
                  },
                  description: "Array of geometry objects"
                },
                bbox: {
                  $ref: "#/components/schemas/BBox",
                  description: "Optional bounding box"
                }
              },
              required: ["type", "geometries"]
            },
            Feature: {
              type: "object",
              description: "A GeoJSON Feature",
              properties: {
                type: {
                  type: "string",
                  enum: ["Feature"],
                  description: "The feature type"
                },
                geometry: {
                  oneOf: [
                    { $ref: "#/components/schemas/GeometryObject" },
                    { type: "null" }
                  ],
                  description: "The feature geometry"
                },
                properties: {
                  type: ["object", "null"],
                  description: "Properties associated with this feature"
                },
                id: {
                  type: ["string", "number"],
                  description: "Optional feature identifier"
                },
                bbox: {
                  $ref: "#/components/schemas/BBox",
                  description: "Optional bounding box"
                }
              },
              required: ["type", "properties", "geometry"]
            },
            FeatureCollection: {
              type: "object",
              description: "A GeoJSON FeatureCollection",
              properties: {
                type: {
                  type: "string",
                  enum: ["FeatureCollection"],
                  description: "The collection type"
                },
                features: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/Feature"
                  },
                  description: "Array of features"
                },
                bbox: {
                  $ref: "#/components/schemas/BBox",
                  description: "Optional bounding box"
                }
              },
              required: ["type", "features"]
            },
            BBox: {
              type: "array",
              description: "A GeoJSON bounding box. For 2D coordinates: [west, south, east, north]. For 3D coordinates: [west, south, min_elevation, east, north, max_elevation]",
              items: {
                type: "number"
              },
              minItems: 4
            },
            AnalysisRequestDTO: {
              type: "object",
              properties: {
                location: {
                  $ref: "#/components/schemas/GeoJSONDTO",
                  description: "GeoJSON of the selected area"
                },
                layers: {
                  $ref: "#/components/schemas/LayersDTO",
                  description: "Layers configuration for the analysis"
                },
                asset: {
                  $ref: "#/components/schemas/AssetDTO",
                  description: "Asset to be analyzed"
                }
              },
              required: ["location", "layers", "asset"]
            }
          }
        },
      },
      apis: ["./src/routes/*.ts", "./src/controllers/*.ts", "./src/models/*.ts"], // Look for Swagger comments in routes, controllers, and models
    };
  }

  /**
   * Configure Swagger for the Express application
   * @param app - Express application
   */
  public setup(app: Application): void {
    const swaggerSpec = swaggerJsdoc(this.options);
    app.use(this.apiPath, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    console.log(`Swagger documentation available at ${this.apiPath}`);
  }
}

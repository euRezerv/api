import { OpenAPIV3 } from "openapi-types";

export type SwaggerPath = Record<string, OpenAPIV3.PathItemObject>;

export class SwaggerDocsManager {
  private docs: SwaggerPath;

  constructor() {
    this.docs = {};
  }

  /**
   * Add a new documentation object.
   * @param doc - A Swagger documentation object.
   */
  add(doc: SwaggerPath) {
    for (const [path, methods] of Object.entries(doc)) {
      if (!this.docs[path]) {
        this.docs[path] = {};
      }
      Object.assign(this.docs[path], methods);
    }
  }

  /**
   * Get the aggregated Swagger documentation.
   * @returns The combined Swagger documentation object.
   */
  getDocs(): SwaggerPath {
    return this.docs;
  }
}

export const paginationQueryParams: OpenAPIV3.ParameterObject[] = [
  {
    in: "query",
    name: "pageSize",
    required: true,
    schema: { type: "integer" },
    description: "Page size",
  },
  {
    in: "query",
    name: "page",
    required: false,
    schema: { type: "integer" },
    description: "Page number",
  },
];

export const cookieSecurity = {
  security: [
    {
      cookieAuth: [],
    },
  ],
};

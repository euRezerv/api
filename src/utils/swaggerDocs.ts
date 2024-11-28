import { OpenAPIV3 } from "openapi-types";

/**
 * Manages and aggregates Swagger/OpenAPI documentation for API routes.
 *
 * This class allows you to dynamically add and retrieve Swagger documentation paths
 * in a structured and type-safe way. It is useful for modularizing route-specific
 * Swagger documentation and consolidating them into a single object for Swagger UI setup.
 *
 * @example
 * const AuthDocs = new SwaggerDocsManager();
 *
 * AuthDocs.add( routeDocumentationObject1 );
 * AuthDocs.add( routeDocumentationObject2 );
 *
 * export { AuthDocs };
 */
export class SwaggerDocsManager {
  private docs: Record<string, OpenAPIV3.PathItemObject>;

  constructor() {
    this.docs = {};
  }

  /**
   * Add a new documentation object.
   * @param doc - A Swagger documentation object.
   */
  add(doc: Record<string, OpenAPIV3.PathItemObject>) {
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
  getDocs(): Record<string, OpenAPIV3.PathItemObject> {
    return this.docs;
  }
}

/**
 * A collection of boilerplate HTTP response objects for OpenAPI 3.0.
 * @param props - Additional properties to override or extend the default response object.
 *                This can include custom headers, content, or other OpenAPI response fields.
 * @returns An OpenAPI `ResponsesObject` for the specified HTTP status code,
 *          which can be directly added to your Swagger documentation.
 * @example
 * // Add a response with default description
 * responses: {
 *   ...HTTP_RESPONSES.OK200(),
 * }
 * @example
 * // Add a response with a custom description
 * responses: {
 *   ...HTTP_RESPONSES.BAD_REQUEST400({ description: "Invalid request payload." }),
 * }
 */
export const HTTP_RESPONSES: Record<string, (props?: Partial<OpenAPIV3.ResponseObject>) => OpenAPIV3.ResponsesObject> = {
  OK200: (props) => ({
    200: {
      description: "Success",
      ...props,
    },
  }),
  CREATED201: (props) => ({
    201: {
      description: "Created",
      ...props,
    },
  }),
  BAD_REQUEST400: (props) => ({
    400: {
      description: "Bad request",
      ...props,
    },
  }),
  UNAUTHORIZED401: (props) => ({
    401: {
      description: "Unauthorized",
      ...props,
    },
  }),
  NOT_FOUND404: (props) => ({
    404: {
      description: "Not found",
      ...props,
    },
  }),
  CONFLICT409: (props) => ({
    409: {
      description: "Conflict",
      ...props,
    },
  }),
  INTERNAL_SERVER_ERROR500: (props) => ({
    500: {
      description: "Internal server error",
      ...props,
    },
  }),
};

/**
 * Creates a JSON request body object for OpenAPI 3.0.
 * @param properties - A map of property names to OpenAPI ReferenceObject or SchemaObject.
 * @param extras - Additional properties to include in the RequestBodyObject.
 * @returns An OpenAPI ReferenceObject or RequestBodyObject.
 */
export const jsonRequestBody = (
  properties: Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>,
  extras: Omit<OpenAPIV3.RequestBodyObject, "content"> = {}
): OpenAPIV3.RequestBodyObject => ({
  required: true,
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: properties,
      },
    },
  },
  ...extras,
});

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

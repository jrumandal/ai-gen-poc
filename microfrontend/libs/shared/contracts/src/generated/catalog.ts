/**
 * AUTO-GENERATED FILE — DO NOT EDIT BY HAND.
 * Generated from openapi/catalog.yaml by scripts/generate-contracts.mjs
 * Run `node scripts/generate-contracts.mjs` to regenerate.
 */
export interface paths {
    "/catalog/products": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List products with optional filters */
        get: operations["listProducts"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/catalog/products/{productId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a product by id */
        get: operations["getProduct"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/catalog/categories": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List all categories */
        get: operations["listCategories"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Money: {
            /** @description Amount in minor units (cents) */
            amount: number;
            /** @example USD */
            currency: string;
        };
        ProductAttribute: {
            name: string;
            value: string;
        };
        Product: {
            id: string;
            name: string;
            description?: string;
            price: components["schemas"]["Money"];
            imageUrl?: string;
            inStock: boolean;
            categories: components["schemas"]["Category"][];
            attributes?: components["schemas"]["ProductAttribute"][];
        };
        Category: {
            id: string;
            name: string;
            slug: string;
            parentId?: string | null;
            children: components["schemas"]["Category"][];
        };
        Error: {
            code: string;
            message: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    listProducts: {
        parameters: {
            query?: {
                category?: string;
                minPrice?: number;
                maxPrice?: number;
                inStock?: boolean;
                sort?: "PRICE_ASC" | "PRICE_DESC" | "NAME_ASC" | "NAME_DESC";
                search?: string;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of products */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Product"][];
                };
            };
        };
    };
    getProduct: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                productId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The product */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Product"];
                };
            };
            /** @description Product not found */
            404: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Error"];
                };
            };
        };
    };
    listCategories: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description A list of categories */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Category"][];
                };
            };
        };
    };
}

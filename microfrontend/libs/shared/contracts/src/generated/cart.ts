/**
 * AUTO-GENERATED FILE — DO NOT EDIT BY HAND.
 * Generated from openapi/cart.yaml by scripts/generate-contracts.mjs
 * Run `node scripts/generate-contracts.mjs` to regenerate.
 */
export interface paths {
    "/cart/{cartId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get a cart by id */
        get: operations["getCart"];
        put?: never;
        post?: never;
        /** Remove all items from the cart */
        delete: operations["clearCart"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cart/{cartId}/items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Add an item to the cart */
        post: operations["addItemToCart"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/cart/{cartId}/items/{itemId}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        /** Remove an item from the cart */
        delete: operations["removeItemFromCart"];
        options?: never;
        head?: never;
        /** Update the quantity of a cart item */
        patch: operations["updateCartItem"];
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        Money: {
            amount: number;
            currency: string;
        };
        ProductRef: {
            id: string;
            name: string;
            imageUrl: string;
        };
        CartItem: {
            id: string;
            productId: string;
            quantity: number;
            unitPrice: components["schemas"]["Money"];
            product: components["schemas"]["ProductRef"];
        };
        Cart: {
            id: string;
            items: components["schemas"]["CartItem"][];
            subtotal: components["schemas"]["Money"];
            itemCount: number;
        };
        AddItemInput: {
            productId: string;
            quantity: number;
        };
        UpdateItemInput: {
            quantity: number;
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
    getCart: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                cartId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The cart */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Cart"];
                };
            };
            /** @description Cart not found */
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
    clearCart: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                cartId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The cleared cart */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Cart"];
                };
            };
        };
    };
    addItemToCart: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                cartId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AddItemInput"];
            };
        };
        responses: {
            /** @description The updated cart */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Cart"];
                };
            };
        };
    };
    removeItemFromCart: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                cartId: string;
                itemId: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description The updated cart */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Cart"];
                };
            };
        };
    };
    updateCartItem: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                cartId: string;
                itemId: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UpdateItemInput"];
            };
        };
        responses: {
            /** @description The updated cart */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Cart"];
                };
            };
        };
    };
}

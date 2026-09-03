import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import {
  ROUTER_NAVIGATED,
  type RouterNavigatedAction,
} from '@ngrx/router-store';
import { catchError, from, map, of, switchMap, take } from 'rxjs';
import { gql } from '@apollo/client';
import type { Cart, Category, Product, User } from '@jrumandal/contracts';
import { getSharedApolloClient } from '../mf-client-bootstrap';
import * as catalogActions from './catalog.actions';
import * as cartActions from './cart.actions';
import * as userActions from './user.actions';
import * as navigationActions from './navigation.actions';
import { selectUserFeature } from './user.selectors';

/**
 * Shell effects.
 *
 * These effects are the single place where the shell talks to the gateway.
 * Each feature slice (catalog, cart, user) exposes a `load` action; the
 * matching effect performs the GraphQL query and dispatches the
 * `loadSuccess` / `loadFailure` action. The pages then subscribe to the
 * selectors and push the resulting state into the `<mf-*>` custom elements.
 *
 * The `navigation` effect listens to `@ngrx/router-store`'s
 * `ROUTER_NAVIGATED` action and records every completed navigation in the
 * `navigation` slice — this is the "backtracing of navigation" trail.
 *
 * The cart effect is the only one with a cross-slice dependency: the cart is
 * scoped to the signed-in user, so it first ensures the user is present in the
 * store (dispatching `user/load` if necessary) before fetching the cart.
 */
@Injectable({ providedIn: 'root' })
export class ShellEffects {
  private readonly apollo = getSharedApolloClient();

  /** Fetch the catalog (products + categories) when `catalog/load` is dispatched. */
  readonly catalogLoad$ = createEffect(() =>
    this.actions$.pipe(
      ofType(catalogActions.load),
      switchMap(() =>
        from(this.apollo.query<CatalogQueryData>({ query: CATALOG_QUERY })).pipe(
          map((res) =>
            catalogActions.loadSuccess({
              products: res.data?.products ?? [],
              categories: res.data?.categories ?? [],
            })
          ),
          catchError((err) =>
            of(
              catalogActions.loadFailure({
                error: ShellEffects.errorMessage(err),
              })
            )
          )
      )
    )
  )
);

  /**
   * Fetch the cart for the signed-in user when `cart/load` is dispatched.
   *
   * The cart is scoped to the user, so this effect first ensures the user is
   * present in the store. If the user is already loaded it fetches the cart
   * immediately; otherwise it dispatches `user/load`, waits for
   * `user/loadSuccess`, and then fetches the cart.
   */
  readonly cartLoad$ = createEffect(() =>
    this.actions$.pipe(
      ofType(cartActions.load),
      switchMap(() =>
        this.store.pipe(select(selectUserFeature), take(1)).pipe(
          switchMap((userState) => {
            // The user is already in the store (loaded or not): fetch the cart
            // for that user, or resolve to an empty cart if signed out.
            if (userState.loaded) {
              return userState.user
                ? this.fetchCart(userState.user.id)
                : of(cartActions.loadSuccess({ cart: null }));
            }
            // User not loaded yet: load it, then fetch the cart for that user.
            this.store.dispatch(userActions.load());
            return this.actions$.pipe(
              ofType(userActions.loadSuccess),
              take(1),
              switchMap((action) =>
                action.user
                  ? this.fetchCart(action.user.id)
                  : of(cartActions.loadSuccess({ cart: null }))
              )
            );
          })
        )
      )
    )
  );

  /** Fetch the signed-in user when `user/load` is dispatched. */
  readonly userLoad$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userActions.load),
      switchMap(() =>
        from(this.apollo.query<MeQueryData>({ query: ME_QUERY })).pipe(
          map((res) =>
            userActions.loadSuccess({
              user: res.data?.me ?? null,
            })
          ),
          catchError((err) =>
            of(
              userActions.loadFailure({
                error: ShellEffects.errorMessage(err),
              })
            )
          )
      )
    )
  )
);

  /**
   * Record every completed navigation in the `navigation` slice.
   *
   * `ROUTER_NAVIGATED` is dispatched by `@ngrx/router-store` after a
   * navigation ends, so `payload.routerState.url` is the final, active URL.
   */
  readonly navigation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ROUTER_NAVIGATED),
      map((action: RouterNavigatedAction) =>
        navigationActions.routeChanged({
          route: action.payload.routerState.url,
          timestamp: Date.now(),
        })
      )
    )
  );

  constructor(
    private readonly actions$: Actions,
    private readonly store: Store
  ) {}

  /** Fetch the cart for a given user id. */
  private fetchCart(userId: string) {
    return from(
      this.apollo.query<CartForUserData>({
        query: CART_FOR_USER_QUERY,
        variables: { userId },
      })
    ).pipe(
      map((res) =>
        cartActions.loadSuccess({
          cart: res.data?.cartForUser ?? null,
        })
      ),
      catchError((err) =>
        of(
          cartActions.loadFailure({
            error: ShellEffects.errorMessage(err),
          })
        )
      )
    );
  }

  /** Extract a human-readable message from an Apollo/RxJS error. */
  private static errorMessage(err: unknown): string {
    if (err && typeof err === 'object' && 'message' in err) {
      return String((err as { message: unknown }).message);
    }
    return String(err);
  }
}

/** Catalog query — products + categories. */
const CATALOG_QUERY = gql`
  query Catalog {
    products {
      id
      name
      description
      price {
        amount
        currency
      }
      imageUrl
      inStock
      categories {
        id
        name
        slug
      }
    }
    categories {
      id
      name
      slug
    }
  }
`;

/** Signed-in user query. */
const ME_QUERY = gql`
  query Me {
    me {
      id
      name
      email
      address {
        line1
        city
        state
        postalCode
        country
      }
    }
  }
`;

/** Cart-for-user query. */
const CART_FOR_USER_QUERY = gql`
  query CartForUser($userId: ID!) {
    cartForUser(userId: $userId) {
      id
      itemCount
      subtotal {
        amount
        currency
      }
      items {
        id
        productId
        quantity
        unitPrice {
          amount
          currency
        }
        product {
          id
          name
          imageUrl
        }
      }
    }
  }
`;

/** Shape of the catalog query response data. */
interface CatalogQueryData {
  products: Product[];
  categories: Category[];
}

/** Shape of the me query response data. */
interface MeQueryData {
  me: User | null;
}

/** Shape of the cart-for-user query response data. */
interface CartForUserData {
  cartForUser: Cart | null;
}

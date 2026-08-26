/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  DateTime: { input: unknown; output: unknown; }
};

export type AddItemInput = {
  readonly productId: Scalars['ID']['input'];
  readonly quantity: Scalars['Int']['input'];
};

export type Address = {
  readonly __typename: 'Address';
  readonly city: Scalars['String']['output'];
  readonly country: Scalars['String']['output'];
  readonly line1: Scalars['String']['output'];
  readonly postalCode: Scalars['String']['output'];
  readonly state: Maybe<Scalars['String']['output']>;
};

export type AddressInput = {
  readonly city: Scalars['String']['input'];
  readonly country: Scalars['String']['input'];
  readonly line1: Scalars['String']['input'];
  readonly postalCode: Scalars['String']['input'];
  readonly state: InputMaybe<Scalars['String']['input']>;
};

export type Cart = {
  readonly __typename: 'Cart';
  readonly id: Scalars['ID']['output'];
  readonly itemCount: Scalars['Int']['output'];
  readonly items: ReadonlyArray<CartItem>;
  readonly subtotal: Money;
};

export type CartItem = {
  readonly __typename: 'CartItem';
  readonly id: Scalars['ID']['output'];
  readonly product: ProductRef;
  readonly productId: Scalars['ID']['output'];
  readonly quantity: Scalars['Int']['output'];
  readonly unitPrice: Money;
};

export type Category = {
  readonly __typename: 'Category';
  readonly children: ReadonlyArray<Category>;
  readonly id: Scalars['ID']['output'];
  readonly name: Scalars['String']['output'];
  readonly parentId: Maybe<Scalars['ID']['output']>;
  readonly slug: Scalars['String']['output'];
};

export type LoginInput = {
  readonly email: Scalars['String']['input'];
  readonly password: Scalars['String']['input'];
};

export type Money = {
  readonly __typename: 'Money';
  readonly amount: Scalars['Int']['output'];
  readonly currency: Scalars['String']['output'];
};

export type Mutation = {
  readonly __typename: 'Mutation';
  readonly addItemToCart: Cart;
  readonly clearCart: Cart;
  readonly login: User;
  readonly removeItemFromCart: Cart;
  readonly updateCartItem: Cart;
  readonly updateProfile: User;
};


export type MutationAddItemToCartArgs = {
  cartId: Scalars['ID']['input'];
  input: AddItemInput;
};


export type MutationClearCartArgs = {
  cartId: Scalars['ID']['input'];
};


export type MutationLoginArgs = {
  input: LoginInput;
};


export type MutationRemoveItemFromCartArgs = {
  cartId: Scalars['ID']['input'];
  itemId: Scalars['ID']['input'];
};


export type MutationUpdateCartItemArgs = {
  cartId: Scalars['ID']['input'];
  input: UpdateItemInput;
  itemId: Scalars['ID']['input'];
};


export type MutationUpdateProfileArgs = {
  input: UpdateProfileInput;
};

export type Order = {
  readonly __typename: 'Order';
  readonly createdAt: Scalars['DateTime']['output'];
  readonly id: Scalars['ID']['output'];
  readonly items: ReadonlyArray<OrderItem>;
  readonly status: OrderStatus;
  readonly total: Money;
};

export type OrderItem = {
  readonly __typename: 'OrderItem';
  readonly productId: Scalars['ID']['output'];
  readonly quantity: Scalars['Int']['output'];
  readonly unitPrice: Money;
};

export enum OrderStatus {
  Cancelled = 'CANCELLED',
  Confirmed = 'CONFIRMED',
  Delivered = 'DELIVERED',
  Placed = 'PLACED',
  Shipped = 'SHIPPED'
}

export type Product = {
  readonly __typename: 'Product';
  readonly attributes: ReadonlyArray<ProductAttribute>;
  readonly categories: ReadonlyArray<Category>;
  readonly description: Maybe<Scalars['String']['output']>;
  readonly id: Scalars['ID']['output'];
  readonly imageUrl: Maybe<Scalars['String']['output']>;
  readonly inStock: Scalars['Boolean']['output'];
  readonly name: Scalars['String']['output'];
  readonly price: Money;
};

export type ProductAttribute = {
  readonly __typename: 'ProductAttribute';
  readonly name: Scalars['String']['output'];
  readonly value: Scalars['String']['output'];
};

export type ProductFilterInput = {
  readonly category: InputMaybe<Scalars['String']['input']>;
  readonly inStock: InputMaybe<Scalars['Boolean']['input']>;
  readonly maxPrice: InputMaybe<Scalars['Int']['input']>;
  readonly minPrice: InputMaybe<Scalars['Int']['input']>;
  readonly search: InputMaybe<Scalars['String']['input']>;
  readonly sort: InputMaybe<ProductSort>;
};

export type ProductRef = {
  readonly __typename: 'ProductRef';
  readonly id: Scalars['ID']['output'];
  readonly imageUrl: Maybe<Scalars['String']['output']>;
  readonly name: Scalars['String']['output'];
};

export enum ProductSort {
  NameAsc = 'NAME_ASC',
  NameDesc = 'NAME_DESC',
  PriceAsc = 'PRICE_ASC',
  PriceDesc = 'PRICE_DESC'
}

export type Query = {
  readonly __typename: 'Query';
  readonly cart: Maybe<Cart>;
  readonly categories: ReadonlyArray<Category>;
  readonly me: Maybe<User>;
  readonly orders: ReadonlyArray<Order>;
  readonly product: Maybe<Product>;
  readonly products: ReadonlyArray<Product>;
};


export type QueryCartArgs = {
  cartId: Scalars['ID']['input'];
};


export type QueryProductArgs = {
  id: Scalars['ID']['input'];
};


export type QueryProductsArgs = {
  input: InputMaybe<ProductFilterInput>;
};

export type UpdateItemInput = {
  readonly quantity: Scalars['Int']['input'];
};

export type UpdateProfileInput = {
  readonly address: AddressInput;
  readonly name: Scalars['String']['input'];
};

export type User = {
  readonly __typename: 'User';
  readonly address: Address;
  readonly email: Scalars['String']['output'];
  readonly id: Scalars['ID']['output'];
  readonly name: Scalars['String']['output'];
};

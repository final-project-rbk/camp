/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams: { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/all-places`; params?: Router.UnknownInputParams; } | { pathname: `/hints-screen`; params?: Router.UnknownInputParams; } | { pathname: `/onbording`; params?: Router.UnknownInputParams; } | { pathname: `/setting`; params?: Router.UnknownInputParams; } | { pathname: `/market/new`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/favorites` | `/favorites`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/hints` | `/hints`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/home` | `/home`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}` | `/`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/market` | `/market`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/market/new` | `/market/new`; params?: Router.UnknownInputParams; } | { pathname: `/+not-found`, params: Router.UnknownInputParams & {  } } | { pathname: `/market/[id]`, params: Router.UnknownInputParams & { id: string | number; } } | { pathname: `/place/[id]`, params: Router.UnknownInputParams & { id: string | number; } };
      hrefOutputParams: { pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/all-places`; params?: Router.UnknownOutputParams; } | { pathname: `/hints-screen`; params?: Router.UnknownOutputParams; } | { pathname: `/onbording`; params?: Router.UnknownOutputParams; } | { pathname: `/setting`; params?: Router.UnknownOutputParams; } | { pathname: `/market/new`; params?: Router.UnknownOutputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/favorites` | `/favorites`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/hints` | `/hints`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/home` | `/home`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}` | `/`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/market` | `/market`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/market/new` | `/market/new`; params?: Router.UnknownOutputParams; } | { pathname: `/+not-found`, params: Router.UnknownOutputParams & {  } } | { pathname: `/market/[id]`, params: Router.UnknownOutputParams & { id: string; } } | { pathname: `/place/[id]`, params: Router.UnknownOutputParams & { id: string; } };
      href: Router.RelativePathString | Router.ExternalPathString | `/all-places${`?${string}` | `#${string}` | ''}` | `/hints-screen${`?${string}` | `#${string}` | ''}` | `/onbording${`?${string}` | `#${string}` | ''}` | `/setting${`?${string}` | `#${string}` | ''}` | `/market/new${`?${string}` | `#${string}` | ''}` | `/_sitemap${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/favorites${`?${string}` | `#${string}` | ''}` | `/favorites${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/hints${`?${string}` | `#${string}` | ''}` | `/hints${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/home${`?${string}` | `#${string}` | ''}` | `/home${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}${`?${string}` | `#${string}` | ''}` | `/${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/market${`?${string}` | `#${string}` | ''}` | `/market${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/market/new${`?${string}` | `#${string}` | ''}` | `/market/new${`?${string}` | `#${string}` | ''}` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/all-places`; params?: Router.UnknownInputParams; } | { pathname: `/hints-screen`; params?: Router.UnknownInputParams; } | { pathname: `/onbording`; params?: Router.UnknownInputParams; } | { pathname: `/setting`; params?: Router.UnknownInputParams; } | { pathname: `/market/new`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/favorites` | `/favorites`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/hints` | `/hints`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/home` | `/home`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}` | `/`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/market` | `/market`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/market/new` | `/market/new`; params?: Router.UnknownInputParams; } | `/+not-found` | `/market/${Router.SingleRoutePart<T>}` | `/place/${Router.SingleRoutePart<T>}` | { pathname: `/+not-found`, params: Router.UnknownInputParams & {  } } | { pathname: `/market/[id]`, params: Router.UnknownInputParams & { id: string | number; } } | { pathname: `/place/[id]`, params: Router.UnknownInputParams & { id: string | number; } };
    }
  }
}

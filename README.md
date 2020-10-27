# next-app-builder

[![Version Badge][npm-version-svg]][package-url]
[![GZipped size][npm-minzip-svg]][bundlephobia-url]
![Test](https://github.com/thebuilder/react-intersection-observer/workflows/Test/badge.svg)
[![dependency status][deps-svg]][deps-url]
[![dev dependency status][dev-deps-svg]][dev-deps-url]
[![License][license-image]][license-url]
[![Downloads][downloads-image]][downloads-url]

Custom App builder for Next.js.

## What is a Custom `App`?

Next.js uses the App component to initialize pages. You can override it and control the page initialization. Which allows you to do amazing things like:

- Persisting layout between page changes
- Keeping state when navigating pages
- Custom error handling using componentDidCatch
- Inject additional data into pages
- Add global CSS

For more details, see [offical documentation](https://nextjs.org/docs/advanced-features/custom-app).

## Why a builder?

Generates a custom next App using middleware.

Before:

```javascript
class CustomNextApp extends App {
  static async getInitialProps({ Component, ctx, router }) {
    const initialPageProps = await (Component.getInitialProps ? Component.getInitialProps : {});
    const data = await fetch(getDataForPage(router.pathname));
    return {
      pageProps: {
        ...initialPageProps,
        data
      }
    };
  }

  render() {
    const { Component, pageProps } = this.props;
    return (
      <SsrDataProvider data={pageProps.ssrData}>
        <LayoutComponent>
          <Component {...pageProps} />
        </LayoutComponent>
      </SsrDataProvider>
    );
  }
}
```

After:

```javascript
const ssrDataMiddleware = {
  Component: SsrDataProvider,
  getInitialProps: ({ router }) => {
    const data = await fetch(getDataForPage(router.pathname));
    return { data };
  }
};

const layoutMiddleware = { Component: LayoutComponent };

nextAppBuilder({
  middleware: [ssrDataMiddleware, layoutMiddleware]
});
```

## Caveats

Internally, you will be adding a custom getInitialProps in your App. This will disable Automatic Static Optimization in pages without Static Generation.

For more details, see [offical documentation](https://nextjs.org/docs/advanced-features/custom-app#caveats).

## Contributing

Let's build together our v1! Pull-requests and issue reports are welcome.

[npm-version-svg]: https://img.shields.io/npm/v/@scacap/next-app-builder.svg
[package-url]: https://www.npmjs.com/package/@scacap/next-app-builder
[bundlephobia-url]: https://bundlephobia.com/result?p=@scacap/next-app-builder
[npm-minzip-svg]: https://img.shields.io/bundlephobia/minzip/@scacap/next-app-builder
[deps-url]: https://david-dm.org/scacap/next-app-builder
[deps-svg]: https://david-dm.org/scacap/next-app-builder.svg
[dev-deps-url]: https://david-dm.org/scacap/next-app-builder?type=dev
[dev-deps-svg]: https://david-dm.org/scacap/next-app-builder/dev-status.svg
[license-url]: [https://www.apache.org/licenses/LICENSE-2.0]
[license-image]: https://img.shields.io/npm/l/@scacap/next-app-builder.svg
[downloads-url]: https://npm-stat.com/charts.html?package=@scacap/next-app-builder
[downloads-image]: https://img.shields.io/npm/dm/@scacap/next-app-builder.svg

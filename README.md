# Custom `App` builder for Next.js

### What is a Custom `App`?

Next.js uses the App component to initialize pages. You can override it and control the page initialization. Which allows you to do amazing things like:
- Persisting layout between page changes
- Keeping state when navigating pages
- Custom error handling using componentDidCatch
- Inject additional data into pages
- Add global CSS

For more details, see [offical documentation](https://nextjs.org/docs/advanced-features/custom-app).

### Why a builder?

Generates a custom next App using middleware.

Before:

 ```
 class CustomNextApp extends App {
   static async getInitialProps({ Component, ctx, router }) {
     const initialPageProps = await (Component.getInitialProps ? (Component.getInitialProps) : {});
     const data = await fetch(getDataForPage(router.pathname));
     return {
       pageProps: {
         ...initialPageProps,
         data
       }
     }
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
 ```

 const getInitialProps = ({ router }) => {
    const data = await fetch(getDataForPage(router.pathname));
    return { data };
 }

 const ssrDataMiddleware = {
   Component: SsrDataProvider,
   getInitialProps
 };
 const layoutMiddleware = { Component: LayoutComponent };

 nextAppBuilder({
   middleware: [
     ssrDataMiddleware,
     layoutMiddleware
   ]
 })

 ```

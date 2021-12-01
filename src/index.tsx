import React, { ErrorInfo, FunctionComponent } from 'react';
import App from 'next/app';
import { AppContext } from 'next/dist/pages/_app';

export type NextAppMiddleware<T = Record<string, unknown>> = {
  /**
   * human readable identifier of middleware
   */
  name?: string;
  /**
   * Static function which is executed before rendering.
   * Used for blocking data requirements for every single page in your application, e.g. server side data fetching.
   */
  getInitialProps?(appContext: AppContext): T | Promise<T>;
  /**
   * Component which is rendered in custom App.
   */
  Component?: FunctionComponent<T>;
  componentDidCatch?(error: Error, errorInfo: ErrorInfo): App['componentDidCatch'];
};

type NextAppBuilderOptions = {
  middleware: NextAppMiddleware[];
};

type NextAppMiddlewareBuilder = (options: NextAppBuilderOptions) => typeof App;

type ExecuteComponentDidCatchMiddleware = (allMiddlewarec, error: Error, _errorInfo: ErrorInfo) => void;

const executeComponentDidCatchMiddleware: ExecuteComponentDidCatchMiddleware = (allMiddleware, error, errorInfo) =>
  allMiddleware.forEach(({ componentDidCatch }) => {
    if (componentDidCatch) {
      componentDidCatch(error, errorInfo);
    }
  });

const renderPage = (allMiddleware, { Component: PageComponent, pageProps: { middlewareProps, ...props } }) =>
  allMiddleware
    .filter(({ Component: MiddlewareComponent }) => !!MiddlewareComponent)
    .reduceRight(
      (nestedElement, { Component: MiddlewareComponent, id }) => (
        <MiddlewareComponent {...props} {...middlewareProps[id]}>
          {nestedElement}
        </MiddlewareComponent>
      ),
      <PageComponent {...props} />
    );

/**
 * Generates a custom next App using middleware.
 *
 * Usage
 *
 * ```
 *
 * const getInitialProps = ({ router }) => {
 *    const data = await fetch(getDataForPage(router.pathname));
 *    return { data };
 * }
 *
 * const ssrDataMiddleware = {
 *   Component: SsrDataProvider,
 *   getInitialProps
 * };
 * const layoutMiddleware = { Component: LayoutComponent };
 *
 * nextAppBuilder({
 *   middleware: [
 *     ssrDataMiddleware,
 *     layoutMiddleware
 *   ]
 * })
 *
 * ```
 *
 * @param middleware
 */
const nextAppBuilder: NextAppMiddlewareBuilder = ({ middleware = [] }) => {
  const allMiddleware = middleware.map((singleMiddleware, index) => ({
    ...singleMiddleware,
    id: `nextAppMiddleware-${index}`
  }));

  class NextAppMiddlewareComponent extends App {
    static async getInitialProps({ Component, ctx, router }): Promise<{ pageProps: any }> {
      let pageProps = {};
      const { AppTree } = ctx;
      const extendPageProps = props => {
        pageProps = {
          ...pageProps,
          ...props
        };
      };
      if (Component.getInitialProps) {
        extendPageProps(await Component.getInitialProps(ctx));
      }

      let middlewareProps;

      const InternalAppTree = props => {
        const enhancedPageProps = { ...pageProps, middlewareProps, ...props };
        return <AppTree pageProps={enhancedPageProps} />;
      };

      const allInitialProps = await Promise.all(
        allMiddleware.map(async ({ getInitialProps, id, name }) => {
          let initialProps = {};
          if (getInitialProps) {
            try {
              initialProps = await getInitialProps({
                Component,
                router,
                ctx,
                AppTree: InternalAppTree
              });
            } catch (error) {
              console.warn(`getInitialProps failed for middleware with name ${name || 'unnamed'}`, error);
            }
          }
          return { initialProps, id };
        })
      );

      middlewareProps = allInitialProps.reduce(
        (props, { id, initialProps }) => ({
          ...props,
          [id]: initialProps
        }),
        {}
      );

      extendPageProps({ middlewareProps });
      return { pageProps };
    }

    componentDidCatch(error, errorInfo): void {
      executeComponentDidCatchMiddleware(allMiddleware, error, errorInfo);
      // This is needed to render errors correctly in development / production
      // @ts-ignore
      super.componentDidCatch(error, errorInfo);
    }

    render(): JSX.Element {
      const { Component, pageProps, ...otherProps } = this.props;
      return renderPage(allMiddleware, {
        Component,
        pageProps: { ...pageProps, ...otherProps }
      });
    }
  }
  return NextAppMiddlewareComponent;
};

export default nextAppBuilder;

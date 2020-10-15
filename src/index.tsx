import React, { ErrorInfo, FunctionComponent } from 'react';
import App from 'next/app';
import { AppContext } from 'next/dist/pages/_app';

// -----------------
// ----- types -----
// -----------------

export type NextAppMiddleware<T = Record<string, unknown>> = {
    getInitialProps?(appContext: AppContext): T | Promise<T>;

    Component?: FunctionComponent<T>;
    /**
     * Catches exceptions generated in descendant components. Unhandled exceptions will cause
     * the entire component tree to unmount.
     */
    componentDidCatch?(error: Error, errorInfo: ErrorInfo): App['componentDidCatch'];
};

type NextAppBuilderOptions = {
    middleware: NextAppMiddleware[];
};

type NextAppMiddlewareBuilder = (options: NextAppBuilderOptions) => typeof App;

// -----------------
// ---- helpers ----
// -----------------
const executeComponentDidCatchMiddleware = (allMiddleware, error, errorInfo) =>
    allMiddleware.forEach(({ componentDidCatch }) => {
        if (componentDidCatch) {
            componentDidCatch(error, errorInfo);
        }
    });

const renderPage = (allMiddleware, { Component, pageProps: { middlewareProps, ...props } }) =>
    allMiddleware
        .filter(({ Component: RenderComponent }) => !!RenderComponent)
        .reduceRight(
            (nestedElement, { Component: RenderComponent, id }) => (
                <RenderComponent {...props} {...middlewareProps[id]}>
                    {nestedElement}
                </RenderComponent>
            ),
            <Component {...props} />
        );
// -----------------
// ---- builder ----
// -----------------
const nextAppBuilder: NextAppMiddlewareBuilder = ({ middleware = [] }) => {
    const allMiddleware = middleware.map((singleMiddleware, index) => ({
        ...singleMiddleware,
        id: `nextAppMiddleware-${index}`
    }));

    class NextAppMiddlewareComponent extends App {
        static async getInitialProps({ Component, ctx, router }) {
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
                allMiddleware
                    .filter(({ getInitialProps }) => !!getInitialProps)
                    .map(async ({ getInitialProps, id }) => {
                        const initialProps = await getInitialProps({
                            Component,
                            router,
                            ctx,
                            AppTree: InternalAppTree
                        });
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

        componentDidCatch(error, errorInfo) {
            executeComponentDidCatchMiddleware(allMiddleware, error, errorInfo);
            // This is needed to render errors correctly in development / production
            super.componentDidCatch(error, errorInfo);
        }

        render() {
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

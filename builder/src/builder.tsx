import React, { ErrorInfo, FunctionComponent } from 'react';
import App from 'next/app';
import { AppContext } from 'next/dist/pages/_app';

// -----------------
// ----- types -----
// -----------------
type NextAppBuilderOptions = {
    middleware: NextAppMiddleware[];
};

type NextAppMiddlewareBuilder = (options: NextAppBuilderOptions) => App;

export type NextAppMiddleware<T = {}> = {
    id: string;

    getInitialProps?(appContext: AppContext): T | Promise<T>;

    Component?: FunctionComponent<T>;
    /**
     * Catches exceptions generated in descendant components. Unhandled exceptions will cause
     * the entire component tree to unmount.
     */
    componentDidCatch?(error: Error, errorInfo: ErrorInfo): App['componentDidCatch'];
};
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
        .filter(({ Component }) => !!Component)
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
// @ts-ignore
const nextAppBuilder: NextAppMiddlewareBuilder = ({ middleware: allMiddleware = [] }) => {
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

            const middlewareProps = {};
            const InternalAppTree = props => {
                const enhancedPageProps = { ...pageProps, middlewareProps, ...props };
                return <AppTree pageProps={enhancedPageProps} />;
            };

            for (let i = 0; i < allMiddleware.length; i += 1) {
                const { getInitialProps, id } = allMiddleware[i];
                if (getInitialProps) {
                    // each loop iteration is delayed until the entire asynchronous operation completes
                    middlewareProps[id] =
                        (await getInitialProps({
                            Component,
                            router,
                            ctx,
                            AppTree: InternalAppTree
                        })) || {}; // eslint-disable-line
                }
            }
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

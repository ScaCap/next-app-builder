import React from 'react';
import _reduceRight from 'lodash/reduceRight';
import App from 'next/app';

import helpers from './helpers';
import { MiddlewareFunctionName, NextAppMiddleware } from './types';

type NextAppBuilderOptions = {
    middleware: NextAppMiddleware[];
};

type NextAppMiddlewareBuilder = (options: NextAppBuilderOptions) => App;

const nextAppBuilder: NextAppMiddlewareBuilder = ({ middleware: allMiddleware = [] }) => {
    const { extractMiddleware, executeMiddleware, executeMiddlewareSync } = helpers(allMiddleware);

    const componentMiddleware = extractMiddleware(MiddlewareFunctionName.Component);
    const getInitialPropsMiddleware = extractMiddleware(MiddlewareFunctionName.getInitialProps);

    const renderPage = ({ Component, pageProps: { middlewareProps, ...props } }) =>
        _reduceRight(
            componentMiddleware,
            (nestedElement, { middleware: RenderComponent, id }) =>
                <RenderComponent {...props} {...middlewareProps[id]}>
                    {nestedElement}
                </RenderComponent>,
            <Component {...props} />
        );

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
                const enhancedPageProps = { ...pageProps, middlewareProps, ...props }
                return (
                    <AppTree pageProps={enhancedPageProps}/>
                );
            }
            for (let i = 0; i < getInitialPropsMiddleware.length; i += 1) {
                const { middleware, id } = getInitialPropsMiddleware[i];
                // each loop iteration is delayed until the entire asynchronous operation completes
                /* eslint-disable no-await-in-loop */
                middlewareProps[id] =
                    (await middleware(
                        { Component, router, ctx, AppTree: InternalAppTree },
                        extendPageProps
                    )) || {};
                /* eslint-enable no-await-in-loop */
            }
            return { pageProps: { ...pageProps, middlewareProps } };
        }

        /**
         * Allows middleware to execute code
         */
        async componentDidCatch(error, errorInfo) {
            await executeMiddlewareSync('componentDidCatch', error, errorInfo);
            // This is needed to render errors correctly in development / production
            super.componentDidCatch(error, errorInfo);
        }

        render() {
            const { Component, pageProps, ...otherProps } = this.props;
            return renderPage({ Component, pageProps: { ...pageProps, ...otherProps } });
        }
    }
    NextAppMiddlewareComponent.displayName = 'NextAppMiddlewareComponent';
    return NextAppMiddlewareComponent;
};

export default nextAppBuilder;

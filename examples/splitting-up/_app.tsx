import App from 'next/app';
import React from 'react';
import { MuiThemeProvider } from '@material-ui/core/styles';
import { ApolloProvider } from '@apollo/react-common';
import ApolloClient from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { getDataFromTree } from '@apollo/react-ssr';
import * as Sentry from '@sentry/browser';
import theme from '../theme';

const getClient = ({ initialState = {}, ctx } = {}) => {
    return new ApolloClient({
        uri: '/graphql',
        cache: new InMemoryCache().restore(initialState)
    });
};

class CustomApp extends App {
    static async getInitialProps({ Component, ctx }) {
        let pageProps = {};
        if (Component.getInitialProps) {
            pageProps = await Component.getInitialProps(ctx);
        }
        const client = getClient({ ctx });
        if (typeof window === 'undefined') {
            // Collects all graphql queries & executes them
            // Any query is cached
            try {
                const { AppTree } = ctx;
                getDataFromTree(
                    <AppTree
                        pageProps={{
                            ...pageProps,
                            graphQLInitialState: {}
                        }}
                    />
                );
            } catch (e) {
                console.error('Prefetching API data failed', e.message);
            }
        }

        return { pageProps: { graphQLInitialState: client.extract() } };
    }

    componentDidMount() {
        // Remove the server-side injected CSS from the client page
        const jssStyles = document.querySelector('#jss-server-side');

        if (jssStyles && jssStyles.parentNode) {
            jssStyles.parentNode.removeChild(jssStyles);
        }
    }

    componentDidCatch(error, errorInfo) {
        Sentry.configureScope(scope => {
            Object.keys(errorInfo).forEach(key => {
                scope.setExtra(key, errorInfo[key]);
            });
        });
        Sentry.captureException(error);
    }

    render() {
        const { pageProps, Component } = this.props;
        return (
            <MuiThemeProvider theme={theme}>
                <ApolloProvider client={getClient({ initialState: pageProps.graphQLInitialState })}>
                    <Component {...pageProps} />
                </ApolloProvider>
            </MuiThemeProvider>
        );
    }
}
export default CustomApp;

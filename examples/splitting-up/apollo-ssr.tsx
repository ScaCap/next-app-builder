import React, { useEffect } from 'react';
import { ApolloProvider } from '@apollo/react-common';
import ApolloClient from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { getDataFromTree } from '@apollo/react-ssr';
import { AppContext } from 'next/app';
import { NextAppMiddleware } from '../../src';

const getApolloClient = ({ initialState = {} } = {}) => {
    return new ApolloClient({
        uri: '/graphql',
        cache: new InMemoryCache().restore(initialState)
    });
};

const getInitialProps = ({ ctx }: AppContext) => {
    const client = getApolloClient({});
    if (typeof window === 'undefined') {
        // Collects all graphql queries & executes them
        // Any query is cached
        try {
            const { AppTree } = ctx;
            getDataFromTree(
                <AppTree
                    pageProps={{
                        graphQLInitialState: {}
                    }}
                />
            );
        } catch (e) {
            console.error('Prefetching API data failed', e.message);
        }
    }

    return { graphQLInitialState: client.extract() };
};

const apolloClientMiddleware: NextAppMiddleware = {
    id: 'material-ui',
    getInitialProps,
    Component: ({ client, graphQLInitialState, children }) => (
        <ApolloProvider client={client || getApolloClient({ initialState: graphQLInitialState })}>
            {children}
        </ApolloProvider>
    )
};

export default apolloClientMiddleware;

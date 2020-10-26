import React from 'react';
import { shallow, mount } from 'enzyme';
import appBuilder from '.';

describe('App Builder', () => {
    const Page = ({ name }) => <div>{`Hello ${name}!`}</div>;
    Page.getInitialProps = () => ({ name: 'Maria' });

    const shallowPage = async middleware => {
        const App = appBuilder({ middleware });
        const props = await App.getInitialProps({ Component: Page, ctx: { AppTree: () => null } });
        return shallow(<App {...props} Component={Page} router={{ pathname: '/' }} />);
    };

    it('should render Page correctly', async () => {
        const wrapper = await shallowPage([]);
        const page = wrapper.find(Page);
        expect(page.exists()).toBe(true);
        expect(page.html()).toContain('Hello Maria!');
        expect(page.props()).toEqual(expect.objectContaining({ name: 'Maria' }));
    });

    it('should render middleware Components & page in correct order', async () => {
        const middleware1 = { Component: ({ children }) => <div>{children}</div> };
        const middleware2 = { Component: ({ children }) => <div>{children}</div> };

        const wrapper = await shallowPage([middleware1, middleware2]);

        const firstElement = wrapper.childAt(0);
        expect(firstElement.is(middleware1.Component));
        expect(firstElement.childAt(0).is(Page));
    });

    it('should pass getInitialProps only to same middleware Component', async () => {
        const middleware1 = {
            Component: ({ children }) => <div>{children}</div>,
            getInitialProps: () => ({ value: 7 })
        };
        const middleware2 = {
            Component: ({ children }) => <div>{children}</div>,
            getInitialProps: () => ({ value: 42, name: 'Max' })
        };
        const wrapper = await shallowPage([middleware1, middleware2]);
        expect(wrapper.find(Page).props()).toEqual(expect.objectContaining({ name: 'Maria' }));
        expect(wrapper.find(middleware1.Component).props()).toEqual(
            // partial comparison because it contains children
            expect.objectContaining({ value: 7, name: 'Maria' })
        );
        expect(wrapper.find(middleware2.Component).props()).toEqual(
            // partial comparison because it contains children
            expect.objectContaining({ value: 42, name: 'Max' })
        );
    });

    it('should pass the props correctly to the Component, when the internalRenderPage is called', async () => {
        let render;
        const middleware = {
            Component: jest.fn(({ children }) => <div>{children}</div>),
            getInitialProps: ({ AppTree }) => {
                // we are "rendering" the component
                render = shallow(<AppTree internal />);
                return { internal: false };
            }
        };

        const App = appBuilder({ middleware: [middleware] });
        const AppTree = jest.fn(() => null);
        const props = await App.getInitialProps({ Component: Page, ctx: { AppTree } });
        expect(render.find(AppTree).exists()).toBe(true);
        expect(render.find(AppTree).prop('pageProps').internal).toBe(true);

        mount(<App router={{}} {...props} Component={Page} />);

        expect(middleware.Component).toHaveBeenCalledTimes(1);

        expect(middleware.Component.mock.calls[0][0]).toEqual(
            expect.objectContaining({ internal: false })
        );
    });
});

import React, {useEffect} from 'react';
import { NextAppMiddleware } from '../../src';
import { MuiThemeProvider } from '@material-ui/core/styles';

const MaterialUiAppMiddlewareComponent = ({children, theme}) => {
    useEffect(() => {
        // Remove the server-side injected CSS from the client page
        const jssStyles = document.querySelector('#jss-server-side');

        if (jssStyles && jssStyles.parentNode) {
            jssStyles.parentNode.removeChild(jssStyles);
        }
    })
    return (
        <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    )
}

const materialUiAppMiddleware: (theme: Theme) => NextAppMiddleware = (theme) => ({
    id: 'material-ui',
    Component: props => <MaterialUiAppMiddlewareComponent {...props} theme={theme} />
})

export default materialUiAppMiddleware;
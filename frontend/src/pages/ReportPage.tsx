import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from '../theme';
import './ReportPage.css';
import { Deck, Slide } from '@revealjs/react';
import 'reveal.js/reveal.css';
import 'reveal.js/theme/black.css';

const ReportPage = () => {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <h1>Report Page</h1>
        <Deck>
            <Slide>
                <h1>Hello</h1>
                <p>My first Reveal deck in React.</p>
            </Slide>
            <Slide background="#111827">
                <h2>Second slide</h2>
            </Slide>
        </Deck>            
        </ThemeProvider>

    );
};

export default ReportPage;

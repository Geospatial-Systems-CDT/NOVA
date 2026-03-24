import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from '../theme';
import './ReportPage.css';
import { Deck, Slide } from '@revealjs/react';
import 'reveal.js/reveal.css';
import 'reveal.js/theme/black.css';

const ReportPage = () => {
    const isPrintView = new URLSearchParams(window.location.search).has('print-pdf');

    const openPrintView = () => {
        const url = new URL(window.location.href);
        url.searchParams.set('print-pdf', '');
        window.open(url.toString(), '_blank');
    };

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className={isPrintView ? undefined : 'report-page'}>
                <Deck>
                    <Slide>
                        <p>My first Reveal deck in React.</p>
                        {!isPrintView && <button onClick={openPrintView}>Open Print View</button>}
                    </Slide>
                    <Slide background="#111827">
                        <h2>Second slide</h2>
                    </Slide>
                </Deck>
            </div>
        </ThemeProvider>
    );
};

export default ReportPage;

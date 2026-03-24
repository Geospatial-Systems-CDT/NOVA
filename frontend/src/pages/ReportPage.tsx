import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from '../theme';
import './ReportPage.css';
import { Deck, Slide } from '@revealjs/react';
import 'reveal.js/reveal.css';
import 'reveal.js/theme/black.css';
import type { ReportDTO } from '../types/report';
import { CACHED_REPORT_STORAGE_KEY } from '../types/report';

const loadCachedReport = (): ReportDTO | null => {
    try {
        const raw = localStorage.getItem(CACHED_REPORT_STORAGE_KEY);
        return raw ? (JSON.parse(raw) as ReportDTO) : null;
    } catch {
        return null;
    }
};

const ReportPage = () => {
    const isPrintView = new URLSearchParams(window.location.search).has('print-pdf');
    const report = loadCachedReport();

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
                        {report && (
                            <p>
                                {report.totalRegions} candidate region{report.totalRegions !== 1 ? 's' : ''} found.
                            </p>
                        )}
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

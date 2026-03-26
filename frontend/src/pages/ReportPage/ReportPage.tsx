import { Button, CssBaseline, ThemeProvider } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import theme from '../../theme';
import './ReportPage.css';
import { Deck, Slide } from '@revealjs/react';
import 'reveal.js/reveal.css';
import 'reveal.js/theme/white.css';
import type { ReportDTO } from '../../types/report';
import { CACHED_REPORT_STORAGE_KEY } from '../../types/report';
import novaLogo from '../../assets/nova-logo.svg';
import RegionSlide from './components/RegionSlide/RegionSlide';
import { formatNumber } from './utils/satelliteImagery';

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
    const regions = report?.regions ?? [];
    const sharedLayerValues = report?.layerValues ?? [];
    const assumptions = report?.assumptions ?? [];

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {!isPrintView && (
                <Button
                    variant="contained"
                    startIcon={<PrintIcon />}
                    onClick={() => {
                        const url = new URL(window.location.href);
                        url.searchParams.set('print-pdf', '');
                        window.open(url.toString(), '_blank');
                    }}
                    sx={{
                        position: 'fixed',
                        top: 16,
                        right: 16,
                        zIndex: 9999,
                    }}
                >
                    Printable Format
                </Button>
            )}
            <div className={isPrintView ? undefined : 'report-page'}>
                <Deck>
                    <Slide>
                        <section data-state="title-page" data-background-color="#001e3f">
                            <a href="https://revealjs.com">
                                <img
                                    src={novaLogo}
                                    alt="NOVA logo"
                                    style={{ height: '180px', margin: '0 auto 4rem auto', background: 'transparent' }}
                                    className="demo-logo"
                                />
                            </a>
                            <h3>Report Documentation</h3>
                            <p>
                                <small>
                                    Created by
                                    <a href="https://ndtp.co.uk/demonstrators/nova-energy-system/"> NOVA</a>
                                </small>
                            </p>
                        </section>
                    </Slide>

                    <Slide>
                        <section className="report-slide table-only" data-auto-animate>
                            <h2>Analysis Constraints</h2>
                            {assumptions.length > 0 && (
                                <>
                                    <div className="layer-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Parameter</th>
                                                    <th>Value</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {assumptions.map((assumption) => (
                                                    <tr key={`${assumption.layerId}-${assumption.attributeId}`}>
                                                        <td>{assumption.label}</td>
                                                        <td>{assumption.value}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                            {sharedLayerValues.length > 0 && (
                                <>
                                    <h4>Layer Values</h4>
                                    <div className="layer-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Metric</th>
                                                    <th>Value</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sharedLayerValues.map((layer) => (
                                                    <tr key={layer.layerId}>
                                                        <td>{layer.label}</td>
                                                        <td>
                                                            {formatNumber(layer.value)} {layer.unit}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </section>
                    </Slide>

                    {regions.length === 0 ? (
                        <Slide>
                            <section className="report-slide">
                                <h3>No Regions Available</h3>
                                <p className="subtitle">No regions found that match the selected constraints</p>
                            </section>
                        </Slide>
                    ) : (
                        regions.map((region) => <RegionSlide key={region.id} region={region} />)
                    )}
                </Deck>
            </div>
        </ThemeProvider>
    );
};

export default ReportPage;

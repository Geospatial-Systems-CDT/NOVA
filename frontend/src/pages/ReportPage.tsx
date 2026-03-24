import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from '../theme';

const ReportPage = () => {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <h1>Report Page</h1>
        </ThemeProvider>
    );
};

export default ReportPage;

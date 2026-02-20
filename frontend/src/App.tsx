// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import React, { useState } from 'react';
import { CssBaseline, ThemeProvider, Box } from '@mui/material';
import Header from './components/header/Header';
import MapComponent from './components/map/MapComponent';
import PrivacyNotice from './components/privacy-notice/PrivacyNotice';
import theme from './theme';
import './App.scss';

const App: React.FC = () => {
    const [showPrivacy, setShowPrivacy] = useState(false);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                <Header onOpenPrivacy={() => setShowPrivacy(true)} />
                <Box sx={{ flex: 1, minHeight: 0 }}>
                    {showPrivacy ? (
                        <Box sx={{ height: '100%', overflowY: 'auto', bgcolor: '#fff' }}>
                            <PrivacyNotice onClose={() => setShowPrivacy(false)} />
                        </Box>
                    ) : (
                        <Box sx={{ height: '100%', overflow: 'hidden' }}>
                            <MapComponent />
                        </Box>
                    )}
                </Box>
            </Box>
        </ThemeProvider>
    );
};

export default App;

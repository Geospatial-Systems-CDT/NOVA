// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import React from 'react';
import { Box, Typography } from '@mui/material';

const ReportPage: React.FC = () => {
    return (
        <Box sx={{ fontFamily: 'Arial, sans-serif', margin: '2rem' }}>
            <Typography variant="h3" color="primary" gutterBottom>
                Layer Report
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.2rem', marginTop: '1rem' }}>
                <strong>Total Area:</strong> {/* Area value to be injected dynamically */} km²
            </Typography>
            {/* Add more report details here as needed */}
        </Box>
    );
};

export default ReportPage;

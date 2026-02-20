// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { app } from './app';
import { envConfig } from './config/env';

app.listen(envConfig.port, '0.0.0.0', () => {
    console.log(`Server is running on port ${envConfig.port}.`);
});

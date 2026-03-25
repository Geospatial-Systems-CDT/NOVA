// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Alert, Box, Button, Card, CardActionArea, CardContent, CircularProgress, Divider, Paper, Stack, Typography } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMapStore } from '../../stores/useMapStore';
import type { Scenario, ScenarioCollection } from '../../types/scenario';
import { loadUserScenarios } from '../../utils/scenarioStorage';

function isScenarioCollection(value: unknown): value is ScenarioCollection {
    if (!value || typeof value !== 'object') return false;
    const maybeCollection = value as Partial<ScenarioCollection>;
    if (!Array.isArray(maybeCollection.scenarios)) return false;

    return maybeCollection.scenarios.every((scenario) => {
        return (
            typeof scenario.id === 'string' &&
            typeof scenario.name === 'string' &&
            Array.isArray(scenario.layers) &&
            scenario.layers.every(
                (layer) =>
                    typeof layer.layerId === 'string' &&
                    Array.isArray(layer.attributes) &&
                    layer.attributes.every((attribute) => typeof attribute.id === 'string' && ['string', 'number'].includes(typeof attribute.value))
            )
        );
    });
}

const ScenarioPanel = () => {
    const panelRenderStartRef = useRef(performance.now());
    const scenarioListLoggedRef = useRef(false);
    const polygonStatus = useMapStore((s) => s.polygonStatus);
    const selectedScenario = useMapStore((s) => s.selectedScenario);
    const setSelectedScenario = useMapStore((s) => s.setSelectedScenario);
    const setScenarioIsCustom = useMapStore((s) => s.setScenarioIsCustom);
    const setPlanningMode = useMapStore((s) => s.setPlanningMode);
    const setCreatingScenario = useMapStore((s) => s.setCreatingScenario);
    const userScenariosVersion = useMapStore((s) => s.userScenariosVersion);

    const [predefinedScenarios, setPredefinedScenarios] = useState<Scenario[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        if (polygonStatus !== 'confirmed' || predefinedScenarios.length > 0) return;

        let cancelled = false;

        const fetchScenarios = async () => {
            const fetchStart = performance.now();
            setLoading(true);
            setLoadError(null);

            try {
                const response = await fetch('/data/scenarios.json');
                if (!response.ok) throw new Error('Unable to load scenarios');

                const data: unknown = await response.json();
                if (!isScenarioCollection(data)) throw new Error('Scenario JSON is invalid');

                if (!cancelled) {
                    setPredefinedScenarios(data.scenarios.map((scenario) => ({ ...scenario, source: 'predefined' as const })));
                    console.info(`[perf] predefined scenarios fetched in ${(performance.now() - fetchStart).toFixed(2)}ms`);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('Failed to load scenarios', error);
                    setLoadError('Failed to load scenarios.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchScenarios();

        return () => {
            cancelled = true;
        };
    }, [polygonStatus, predefinedScenarios.length]);

    const scenarios = useMemo(() => {
        return [...predefinedScenarios, ...loadUserScenarios()];
    }, [predefinedScenarios, userScenariosVersion]);

    useEffect(() => {
        if (!loading && !loadError && scenarios.length > 0 && !scenarioListLoggedRef.current) {
            scenarioListLoggedRef.current = true;
            console.info(
                `[perf] scenario panel ready with ${scenarios.length} scenarios in ${(performance.now() - panelRenderStartRef.current).toFixed(2)}ms`
            );
        }
    }, [loadError, loading, scenarios.length]);

    if (polygonStatus !== 'confirmed') return null;

    return (
        <Paper
            elevation={4}
            sx={{
                position: 'absolute',
                top: '3.75rem',
                left: '1rem',
                width: '400px',
                maxHeight: '24vh',
                zIndex: 1001,
                p: 1.5,
                overflowY: 'auto',
            }}
        >
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                Predefined scenarios
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Select a scenario to prefill layers and parameters.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                        setCreatingScenario(true);
                        setPlanningMode('layers');
                    }}
                >
                    Add scenario
                </Button>
                <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                    User scenarios stay local to this browser.
                </Typography>
            </Stack>
            <Divider sx={{ mb: 1 }} />

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                </Box>
            )}

            {!loading && loadError && <Alert severity="error">{loadError}</Alert>}

            {!loading && !loadError && scenarios.length === 0 && <Alert severity="info">No scenarios configured.</Alert>}

            {!loading && !loadError && scenarios.length > 0 && (
                <Box sx={{ display: 'grid', gap: 1 }}>
                    {scenarios.map((scenario) => {
                        const isSelected = selectedScenario?.id === scenario.id;

                        return (
                            <Card
                                key={scenario.id}
                                variant={isSelected ? 'elevation' : 'outlined'}
                                sx={{ borderColor: isSelected ? 'primary.main' : 'divider' }}
                            >
                                <CardActionArea
                                    onClick={() => {
                                        setSelectedScenario(scenario);
                                        setScenarioIsCustom(false);
                                        setCreatingScenario(false);
                                        setPlanningMode('layers');
                                    }}
                                >
                                    <CardContent sx={{ py: 1.25, '&:last-child': { pb: 1.25 } }}>
                                        <Stack direction="row" justifyContent="space-between" spacing={1}>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                {scenario.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {scenario.source === 'user' ? 'User' : 'Predefined'}
                                            </Typography>
                                        </Stack>
                                        {scenario.description && (
                                            <Typography variant="body2" color="text.secondary">
                                                {scenario.description}
                                            </Typography>
                                        )}
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        );
                    })}
                </Box>
            )}
        </Paper>
    );
};

export default ScenarioPanel;

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Chip,
    Checkbox,
    CircularProgress,
    Divider,
    Drawer,
    IconButton,
    InputAdornment,
    MenuItem,
    Paper,
    TextField,
    Typography,
} from '@mui/material';
import area from '@turf/area';
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

import type MapboxDraw from '@mapbox/mapbox-gl-draw';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import type { MapRef } from 'react-map-gl/maplibre';
import { useMapStore } from '../../stores/useMapStore';
import type { Scenario } from '../../types/scenario';
import { MapVisualHelper } from '../../utils/MapVisualHelper';
import { createUserScenarioId, saveUserScenario } from '../../utils/scenarioStorage';

interface LayerControlPanelProps {
    mapRef: React.RefObject<MapRef>;
    drawRef: React.RefObject<MapboxDraw | null>;
    resetLayers: boolean;
    setResetLayers: React.Dispatch<React.SetStateAction<boolean>>;
}

interface Attribute {
    id: string;
    description: string;
    defaultValue: string | number;
    valueType: 'number' | 'string';
    options?: string[];
    maxValue?: number;
}

type AttributeValue = string | number;

interface LayerItem {
    id: string;
    name: string;
    attributes: Attribute[];
}

interface LayerApiResponse {
    categories: {
        name: string;
        items: LayerItem[];
    }[];
}

const LayerControlPanel = ({ mapRef, drawRef, resetLayers, setResetLayers }: LayerControlPanelProps) => {
    const panelRenderStartRef = useRef(performance.now());
    const layerPanelReadyLoggedRef = useRef(false);
    const polygonStatus = useMapStore((s) => s.polygonStatus);
    const layersPanelOpen = useMapStore((s) => s.layersPanelOpen);
    const setLayersPanelOpen = useMapStore((s) => s.setLayersPanelOpen);
    const idPrefix = useId();
    const [layers, setLayers] = useState<Record<string, LayerItem[]>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [checkedLayers, setCheckedLayers] = useState<Record<string, boolean>>({});
    const [layerSettings, setLayerSettings] = useState<Record<string, Record<string, AttributeValue>>>({});
    const [expandedPanels, setExpandedPanels] = useState<string[]>([]);
    const [propOpen, setPropOpen] = useState(false);
    const [currentLayer, setCurrentLayer] = useState<string | null>(null);
    const [layersLoaded, setLayersLoaded] = useState(false);
    const [loadError, setLoadError] = useState(false);
    const setCachedHeatmap = useMapStore((s) => s.setCachedHeatmap);
    const [tempLayerSettings, setTempLayerSettings] = useState<Record<string, Record<string, AttributeValue>>>({});
    const setCachedReport = useMapStore((s) => s.setCachedReport);
    const setReportJobId = useMapStore((s) => s.setReportJobId);
    const setReportLoading = useMapStore((s) => s.setReportLoading);
    const selectedScenario = useMapStore((s) => s.selectedScenario);
    const scenarioIsCustom = useMapStore((s) => s.scenarioIsCustom);
    const setScenarioIsCustom = useMapStore((s) => s.setScenarioIsCustom);
    const creatingScenario = useMapStore((s) => s.creatingScenario);
    const setCreatingScenario = useMapStore((s) => s.setCreatingScenario);
    const setSelectedScenario = useMapStore((s) => s.setSelectedScenario);
    const bumpUserScenariosVersion = useMapStore((s) => s.bumpUserScenariosVersion);
    const [newScenarioName, setNewScenarioName] = useState('');
    const [newScenarioDescription, setNewScenarioDescription] = useState('');

    const buildDefaultLayerState = useCallback(
        (defaultChecked: boolean) => {
            const checks: Record<string, boolean> = {};
            const defaults: Record<string, Record<string, AttributeValue>> = {};

            Object.values(layers).forEach((items) => {
                items.forEach((item) => {
                    checks[item.name] = defaultChecked;
                    defaults[item.name] = {};
                    item.attributes.forEach((attribute) => {
                        defaults[item.name][attribute.description] = attribute.defaultValue;
                    });
                });
            });

            return { checks, defaults };
        },
        [layers]
    );

    const buildScenarioLayerState = useCallback(
        (scenario: Scenario) => {
            const { checks, defaults } = buildDefaultLayerState(false);
            const allLayers = Object.values(layers).flat();
            const layersById = new Map(allLayers.map((layer) => [layer.id, layer]));

            scenario.layers.forEach((scenarioLayer) => {
                const layer = layersById.get(scenarioLayer.layerId);
                if (!layer) return;

                checks[layer.name] = true;

                scenarioLayer.attributes.forEach((scenarioAttribute) => {
                    const matchingAttribute = layer.attributes.find((attribute) => attribute.id === scenarioAttribute.id);
                    if (!matchingAttribute) return;

                    defaults[layer.name][matchingAttribute.description] = scenarioAttribute.value;
                });
            });

            return { checks, defaults };
        },
        [buildDefaultLayerState, layers]
    );

    const fetchLayers = async () => {
        const fetchStart = performance.now();
        try {
            setLoadError(false);
            const response = await fetch('/api/ui/layers');
            if (!response.ok) throw new Error('API error');
            const data: LayerApiResponse = await response.json();

            const transformed: Record<string, LayerItem[]> = {};
            const checks: Record<string, boolean> = {};
            const defaults: Record<string, Record<string, AttributeValue>> = {};

            data.categories.forEach((category) => {
                if (!category.items?.length) return;

                transformed[category.name] = category.items.map((item) => {
                    const attributes = item.attributes;

                    checks[item.name] = true;
                    defaults[item.name] = {};
                    attributes.forEach((a) => {
                        defaults[item.name][a.description] = a.defaultValue;
                    });

                    return {
                        id: item.id,
                        name: item.name,
                        attributes,
                    };
                });
            });

            setLayers(transformed);
            setCheckedLayers(checks);
            setLayerSettings(defaults);

            const allCategories = Object.keys(transformed);
            setExpandedPanels(allCategories);

            setLayersLoaded(true);
            console.info(`[perf] layer metadata fetched in ${(performance.now() - fetchStart).toFixed(2)}ms`);
        } catch (err) {
            console.error('Failed to load layers', err);
            setLoadError(true);
        }
    };

    useEffect(() => {
        if (resetLayers) {
            const state = selectedScenario ? buildScenarioLayerState(selectedScenario) : buildDefaultLayerState(true);
            const resetCheckedLayers = state.checks;
            const resetLayerSettings = state.defaults;
            setCheckedLayers(resetCheckedLayers);
            setLayerSettings(resetLayerSettings);

            setResetLayers(false);
        }
    }, [buildDefaultLayerState, buildScenarioLayerState, resetLayers, selectedScenario, setResetLayers]);

    useEffect(() => {
        fetchLayers();
    }, []);

    useEffect(() => {
        if (layersLoaded && !loadError && !layerPanelReadyLoggedRef.current) {
            layerPanelReadyLoggedRef.current = true;
            console.info(`[perf] layer panel ready in ${(performance.now() - panelRenderStartRef.current).toFixed(2)}ms`);
        }
    }, [layersLoaded, loadError]);

    useEffect(() => {
        if (!layersLoaded || !selectedScenario) return;

        const scenarioState = buildScenarioLayerState(selectedScenario);
        setCheckedLayers(scenarioState.checks);
        setLayerSettings(scenarioState.defaults);
    }, [buildScenarioLayerState, layersLoaded, selectedScenario]);

    useEffect(() => {
        if (propOpen && currentLayer && layerSettings[currentLayer]) {
            setTempLayerSettings((prev) => ({
                ...prev,
                [currentLayer]: { ...layerSettings[currentLayer] },
            }));
        }
    }, [layerSettings, currentLayer, propOpen]);

    const handleCheckboxChange = (name: string) => {
        setCheckedLayers((prev) => ({ ...prev, [name]: !prev[name] }));
        if (selectedScenario) setScenarioIsCustom(true);
    };

    const handleAccordionToggle = (category: string) => {
        setExpandedPanels((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        setSearchTerm(v);

        if (!v.trim()) {
            const firstCategory = Object.keys(layers)[0];
            setExpandedPanels(firstCategory ? [firstCategory] : []);
            return;
        }

        const lower = v.toLowerCase();
        const matches = Object.entries(layers)
            .filter(([, items]) => items.some((item) => item.name.toLowerCase().includes(lower)))
            .map(([cat]) => cat);

        setExpandedPanels(matches);
    };

    const clearSearch = () => {
        setSearchTerm('');
        const allCategories = Object.keys(layers);
        setExpandedPanels(allCategories);
    };

    const openProps = useCallback(
        (name: string) => {
            setCurrentLayer(name);
            setTempLayerSettings((prev) => ({
                ...prev,
                [name]: { ...layerSettings[name] },
            }));
            setPropOpen(true);
        },
        [layerSettings]
    );

    const closeProps = () => {
        setPropOpen(false);
        setCurrentLayer(null);
    };

    const handleParamChange = (attr: Attribute, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!currentLayer) return;
        const raw = e.target.value;
        setTempLayerSettings((prev) => ({
            ...prev,
            [currentLayer]: {
                ...prev[currentLayer],
                [attr.description]: attr.valueType === 'number' ? Number(raw) : raw,
            },
        }));
    };

    const handleParamBlur = (attr: Attribute) => {
        if (!currentLayer) return;
        if (attr.valueType !== 'number') return;

        const txt = tempLayerSettings[currentLayer][attr.description];
        const num = Number(txt);
        const final = Number.isNaN(num) ? '' : String(num);
        setTempLayerSettings((prev) => ({
            ...prev,
            [currentLayer]: {
                ...prev[currentLayer],
                [attr.description]: Number(final),
            },
        }));
    };

    const confirmProps = () => {
        if (currentLayer) {
            const updatedSettings = tempLayerSettings[currentLayer];
            setLayerSettings((prev) => ({
                ...prev,
                [currentLayer]: {
                    ...updatedSettings,
                },
            }));
            if (selectedScenario) setScenarioIsCustom(true);
        }
        closeProps();
    };

    const handleSaveScenario = () => {
        const saveStart = performance.now();
        const trimmedName = newScenarioName.trim();
        if (!trimmedName) {
            alert('Enter a scenario name.');
            return;
        }

        const allLayers = Object.values(layers).flat();
        const scenarioLayers = allLayers
            .filter((layer) => checkedLayers[layer.name])
            .map((layer) => ({
                layerId: layer.id,
                attributes: layer.attributes.map((attr) => ({
                    id: attr.id,
                    value: layerSettings[layer.name]?.[attr.description] ?? attr.defaultValue,
                })),
            }));

        const scenario: Scenario = {
            id: createUserScenarioId(trimmedName),
            name: trimmedName,
            description: newScenarioDescription.trim() || undefined,
            source: 'user',
            layers: scenarioLayers,
        };

        saveUserScenario(scenario);
        bumpUserScenariosVersion();
        setSelectedScenario(scenario);
        setScenarioIsCustom(false);
        setCreatingScenario(false);
        setNewScenarioName('');
        setNewScenarioDescription('');
        console.info(`[perf] user scenario saved in ${(performance.now() - saveStart).toFixed(2)}ms`);
    };

    const handleApply = async () => {
        if (!mapRef.current || !drawRef.current) return;

        const userDrawnPolygon = MapVisualHelper.getFirstPolygon(drawRef.current);
        if (!userDrawnPolygon) {
            console.warn('No user drawn polygon found');
            return;
        }
        const featureCollection = MapVisualHelper.getFeatureCollection(drawRef.current);

        const allLayers: LayerItem[] = Object.values(layers).flat();

        const dataLayers = allLayers.map((layer) => {
            const attributes = layer.attributes.map((attr) => ({
                id: attr.id,
                label: attr.description,
                value: layerSettings[layer.name]?.[attr.description] ?? attr.defaultValue,
            }));

            return {
                id: layer.id,
                attributes,
                analyze: checkedLayers[layer.name] ?? true,
            };
        });

        const payload = {
            location: featureCollection,
            dataLayers,
            maxIssues: 1,
        };

        setLoading(true);
        try {
            const response = await fetch('/api/ui/location/analyse', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Failed to submit analysis request');
            }

            const { heatmap, jobId } = await response.json();

            setCachedHeatmap(heatmap);
            // Clear any previously cached report and signal that a new one is loading.
            setCachedReport(null);
            if (jobId) {
                setReportJobId(jobId);
                setReportLoading(true);
            }
            MapVisualHelper.addOrUpdateHeatmapLayer(mapRef, heatmap);
            setLayersPanelOpen(false);
        } catch (err) {
            console.error('Analysis request failed', err);
        } finally {
            setLoading(false);
        }
        setLoading(false);
    };

    const filteredLayerEntries = useMemo(() => {
        return Object.entries(layers).map(([category, items]) => {
            const visible = items.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
            if (!visible.length) return null;

            return (
                <Accordion
                    key={category}
                    expanded={expandedPanels.includes(category)}
                    onChange={() => handleAccordionToggle(category)}
                    className="layer-accordion"
                    disableGutters
                >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} className="layer-accordion-summary">
                        <Typography>{category}</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0.5, pb: 0 }}>
                        {visible.map((item) => {
                            const checkboxId = `${idPrefix}-${item.name.replace(/\s+/g, '-')}`;
                            return (
                                <Box key={item.name} className="layer-item">
                                    <label htmlFor={checkboxId}>
                                        <Typography variant="body2">{item.name}</Typography>
                                        <Checkbox id={checkboxId} checked={checkedLayers[item.name]} onChange={() => handleCheckboxChange(item.name)} />
                                    </label>
                                    <IconButton size="small" onClick={() => openProps(item.name)}>
                                        <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            );
                        })}
                    </AccordionDetails>
                </Accordion>
            );
        });
    }, [searchTerm, expandedPanels, checkedLayers, idPrefix, layers, openProps]);

    const hasSearchResults = filteredLayerEntries.some(Boolean);

    const isVisible = polygonStatus === 'confirmed';
    if (!isVisible) return null;
    const layerPanelTop = '3.75rem';
    const handleGenerateReport = () => {
        if (!drawRef.current) {
            alert('No polygon selected.');
            return;
        }
        const polygon = MapVisualHelper.getFirstPolygon(drawRef.current);
        if (!polygon) {
            alert('No polygon selected.');
            return;
        }
        let areaSqMeters = 0;
        try {
            // @ts-ignore: turf/area expects a GeoJSON geometry
            areaSqMeters = area({ type: 'Feature', geometry: polygon, properties: {} });
        } catch (e) {
            alert('Could not calculate area.');
            return;
        }
        const areaSqKm = areaSqMeters / 1e6;
        const htmlContent = `
            <html>
            <head>
                <title>Layer Report</title>
                <meta charset="UTF-8" />
                <style>
                    body { font-family: Arial, sans-serif; margin: 2rem; }
                    h1 { color: #1976d2; }
                    .area { font-size: 1.2rem; margin-top: 1rem; }
                </style>
            </head>
            <body>
                <h1>Layer Report</h1>
                <div class="area">
                    <strong>Total Area:</strong> ${areaSqKm.toLocaleString(undefined, { maximumFractionDigits: 3 })} km²
                </div>
            </body>
            </html>
        `;
        const reportWindow = window.open('', '_blank');
        if (reportWindow) {
            reportWindow.document.open();
            reportWindow.document.write(htmlContent);
            reportWindow.document.close();
        } else {
            alert('Unable to open report window. Please allow pop-ups.');
        }
    };
    return (
        <>
            <Box className="layer-panel-toggle" sx={{ left: layersPanelOpen ? '430px' : '1rem', top: layerPanelTop }}>
                <IconButton onClick={() => setLayersPanelOpen(!layersPanelOpen)}>
                    <ArrowBackIosNewIcon fontSize="small" sx={{ transform: !layersPanelOpen ? 'rotate(180deg)' : 'none' }} />
                </IconButton>
            </Box>

            {layersPanelOpen && (
                <Paper className="layer-panel" elevation={4} sx={{ top: layerPanelTop }}>
                    <Box className="layer-panel-header">
                        <LayersOutlinedIcon color="primary" sx={{ mr: 1 }} />
                        <Typography variant="subtitle1">Layers</Typography>
                    </Box>

                    {selectedScenario && (
                        <Box sx={{ px: 2, pb: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body2" color="text.secondary">
                                Scenario: {selectedScenario.name}
                            </Typography>
                            <Chip size="small" label={selectedScenario.source === 'user' ? 'User scenario' : 'Predefined scenario'} />
                            {scenarioIsCustom && <Chip size="small" color="warning" label="Customized" />}
                        </Box>
                    )}

                    {creatingScenario && (
                        <Box sx={{ px: 2, pb: 1 }}>
                            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                                Save current settings as a new scenario
                            </Typography>
                            <TextField
                                size="small"
                                fullWidth
                                label="Scenario name"
                                value={newScenarioName}
                                onChange={(e) => setNewScenarioName(e.target.value)}
                                sx={{ mb: 1 }}
                            />
                            <TextField
                                size="small"
                                fullWidth
                                label="Description (optional)"
                                value={newScenarioDescription}
                                onChange={(e) => setNewScenarioDescription(e.target.value)}
                                sx={{ mb: 1 }}
                            />
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button size="small" variant="contained" onClick={handleSaveScenario}>
                                    Save scenario
                                </Button>
                                <Button
                                    size="small"
                                    variant="text"
                                    onClick={() => {
                                        setCreatingScenario(false);
                                        setNewScenarioName('');
                                        setNewScenarioDescription('');
                                    }}
                                >
                                    Cancel
                                </Button>
                            </Box>
                        </Box>
                    )}

                    {!layersLoaded && !loadError && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress size={32} />
                        </Box>
                    )}

                    {loadError && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                Failed to load layers. Please try again.
                            </Typography>
                            <Button variant="contained" onClick={fetchLayers}>
                                Retry
                            </Button>
                        </Box>
                    )}

                    {layersLoaded && !loadError && (
                        <>
                            <Box className="layer-panel-search">
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    placeholder="Search for layers"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon sx={{ fontSize: 20, color: 'grey.600' }} />
                                                </InputAdornment>
                                            ),
                                            endAdornment: searchTerm && (
                                                <InputAdornment position="end">
                                                    <IconButton size="small" onClick={clearSearch} aria-label="Clear search">
                                                        <HighlightOffIcon />
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                            sx: { borderRadius: 2 },
                                        },
                                    }}
                                />
                            </Box>

                            <Box className="layer-panel-selectable-layers">
                                {hasSearchResults ? (
                                    filteredLayerEntries
                                ) : (
                                    <Box sx={{ px: 2, pt: 2 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            No results
                                        </Typography>
                                    </Box>
                                )}
                            </Box>

                            <Divider sx={{ my: 2, opacity: 0.3 }} />
                            <Box className="layer-panel-footer" sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Button variant="contained" onClick={handleApply} sx={{ px: 4 }}>
                                    APPLY
                                </Button>
                                {/* <Button variant="outlined" onClick={handleGenerateReport} sx={{ px: 4 }}>
                                    Generate Report
                                </Button> */}
                            </Box>
                        </>
                    )}
                </Paper>
            )}

            <Drawer anchor="left" open={propOpen} onClose={closeProps}>
                <Box sx={{ width: 280 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            pl: 2,
                            pr: 1,
                            pt: 1,
                            mb: 2,
                        }}
                    >
                        <Typography variant="h6">Properties</Typography>
                        <IconButton onClick={closeProps}>
                            <HighlightOffIcon />
                        </IconButton>
                    </Box>

                    <Box sx={{ px: 2 }}>
                        {currentLayer &&
                            (() => {
                                const currentLayerItem = Object.values(layers)
                                    .flat()
                                    .find((li) => li.name === currentLayer);

                                if (!currentLayerItem) return null;

                                let hasErrors = false;

                                const attributeFields = currentLayerItem.attributes.map((attr) => {
                                    const value = tempLayerSettings[currentLayer]?.[attr.description] ?? '';
                                    const numericValue = Number(value);

                                    const isError =
                                        attr.valueType === 'number' && (numericValue < 0 || (attr.maxValue !== undefined && numericValue > attr.maxValue));

                                    if (isError) hasErrors = true;

                                    return (
                                        <Box key={attr.id} sx={{ mb: 3 }}>
                                            <TextField
                                                label={attr.description}
                                                type={attr.valueType === 'number' ? 'number' : 'text'}
                                                InputProps={
                                                    attr.valueType === 'number'
                                                        ? {
                                                              inputProps: {
                                                                  min: 0,
                                                                  ...(attr.maxValue !== undefined && { max: attr.maxValue }),
                                                              },
                                                          }
                                                        : {}
                                                }
                                                select={(attr.options?.length ?? 0) > 0}
                                                fullWidth
                                                value={value}
                                                onChange={(e) => handleParamChange(attr, e)}
                                                onBlur={() => handleParamBlur(attr)}
                                                error={isError}
                                                helperText={
                                                    attr.valueType === 'number' &&
                                                    (numericValue < 0
                                                        ? 'Must be ≥ 0'
                                                        : attr.maxValue !== undefined && numericValue > attr.maxValue
                                                          ? `Must be ≤ ${attr.maxValue}`
                                                          : '')
                                                }
                                            >
                                                {attr.options?.map((option) => (
                                                    <MenuItem key={option} value={option}>
                                                        {option}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                            {attr.id === 'classificationThreshold' && (
                                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                                                    Selecting a grade flags all land with that grade and better agricultural grades (e.g. Grade 3 flags Grades
                                                    1, 2 and 3).
                                                </Typography>
                                            )}
                                        </Box>
                                    );
                                });

                                return (
                                    <>
                                        {attributeFields}

                                        <Button variant="contained" fullWidth onClick={confirmProps} disabled={hasErrors}>
                                            CONFIRM
                                        </Button>
                                    </>
                                );
                            })()}
                    </Box>
                </Box>
            </Drawer>

            {loading && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'rgba(255,255,255,0.6)',
                        zIndex: 1400,
                    }}
                >
                    <CircularProgress />
                </Box>
            )}
        </>
    );
};

export default LayerControlPanel;

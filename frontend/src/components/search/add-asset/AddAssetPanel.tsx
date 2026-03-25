// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { Box, Button, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useEffect, useState } from 'react';
import type { Asset, Variation } from './AddAsset';
import AssetDetails from './AssetDetails';
import AssetTypeSelector from './AssetTypeSelector';
import AssetVariantSelector from './AssetVariantSelector';
import { useMapStore } from '../../../stores/useMapStore';

const AddAssetPanelContainer = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[3],
    display: 'flex',
    flexDirection: 'column',
    left: 0,
    position: 'absolute',
    top: 'calc(100% + 16px)',
    width: 280,
    zIndex: 1000,
}));

const PanelContent = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    padding: theme.spacing(2),
}));

const PanelFooter = styled(Box)(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
    justifyContent: 'center',
    paddingBottom: theme.spacing(2),
}));

interface AddAssetPanelProps {
    onClose: () => void;
    onSelect: (variant: Variation) => void;
}

const AddAssetPanel = ({ onClose, onSelect }: AddAssetPanelProps) => {
    const assets = useMapStore((s) => s.cachedAssets);
    const setAssets = useMapStore((s) => s.setCachedAssets);
    const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
    const setSelectedVariant = useMapStore((s) => s.setMarkerVariant);
    const selectedVariant = useMapStore((s) => s.markerVariant);

    useEffect(() => {
        const fetchAssets = async () => {
            try {
                const res = await fetch('/data/assets.json');
                const data: Asset[] = await res.json();
                setAssets(data);

                if (data.length > 0) {
                    // If there's already a variant in the store, find and restore
                    // its parent asset so the UI shows the correct type/variant.
                    // Only fall back to defaults when nothing is selected yet.
                    const currentVariant = useMapStore.getState().markerVariant;
                    if (currentVariant) {
                        const parentAsset = data.find((a) =>
                            a.variations.some((v) => v.name === currentVariant.name)
                        );
                        setSelectedAsset(parentAsset ?? data[0]);
                    } else {
                        setSelectedAsset(data[0]);
                        if (data[0].variations.length > 0) {
                            setSelectedVariant(data[0].variations[0]);
                        }
                    }
                }
            } catch (err) {
                console.error('Failed to fetch assets:', err);
            }
        };

        fetchAssets();
    }, [setSelectedVariant, setAssets]);

    const handleAssetChange = (assetId: string) => {
        const asset = assets?.find((a) => a.id === assetId);
        if (asset) {
            setSelectedAsset(asset);
            setSelectedVariant(asset.variations.length > 0 ? asset.variations[0] : null);
        }
    };

    if (!selectedAsset) {
        return (
            <AddAssetPanelContainer>
                <PanelContent>
                    <CircularProgress />
                </PanelContent>
            </AddAssetPanelContainer>
        );
    }

    return (
        <AddAssetPanelContainer>
            <PanelContent>
                <AssetTypeSelector assets={assets ?? []} selectedAsset={selectedAsset} onChange={handleAssetChange} />
                {selectedVariant && <AssetDetails selectedAsset={selectedAsset} selectedVariant={selectedVariant} />}
                <AssetVariantSelector selectedAsset={selectedAsset} selectedVariant={selectedVariant} onChange={setSelectedVariant} />
            </PanelContent>
            <PanelFooter>
                <Button onClick={onClose}>CANCEL</Button>
                <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => selectedVariant && onSelect(selectedVariant)}
                    disabled={!selectedVariant}
                >
                    SELECT
                </Button>
            </PanelFooter>
        </AddAssetPanelContainer>
    );
};

export default AddAssetPanel;
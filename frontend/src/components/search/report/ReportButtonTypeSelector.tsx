// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { FormControl, MenuItem, Select, styled } from '@mui/material';
import type { Asset } from './ReportButton';

const StyledSelect = styled(Select)(({ theme }) => ({
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.shape.borderRadius,
    '& .MuiSelect-select': {
        paddingBottom: theme.spacing(2),
        paddingTop: theme.spacing(2),
    },
    '&:before, &:after': {
        borderBottom: 'none !important',
    },
}));

interface AssetTypeSelectorProps {
    assets: Asset[];
    selectedAsset: Asset;
    onChange: (assetId: string) => void;
}

const AssetTypeSelector = ({ assets, selectedAsset, onChange }: AssetTypeSelectorProps) => (
    <FormControl fullWidth>
        <StyledSelect variant="filled" value={selectedAsset.id} onChange={(e) => onChange(e.target.value as string)} label="Asset Type">
            {assets.map((asset) => (
                <MenuItem key={asset.id} value={asset.id}>
                    {asset.name}
                </MenuItem>
            ))}
        </StyledSelect>
    </FormControl>
);

export default AssetTypeSelector;

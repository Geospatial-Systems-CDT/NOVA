// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { FormControl, FormControlLabel, Radio, RadioGroup, styled } from '@mui/material';
import type { Asset, Variation } from './AddAsset';

const StyledRadioGroup = styled(RadioGroup)(({ theme }) => ({
    display: 'grid',
    gap: theme.spacing(2),
    gridTemplateColumns: 'repeat(2, 1fr)',
    justifyItems: 'center',
    '& .MuiFormControlLabel-label': {
        fontSize: '0.875rem',
        textAlign: 'center',
    },
}));

interface AssetVariantSelectorProps {
    selectedAsset: Asset;
    selectedVariant: Variation | null;
    onChange: (variant: Variation | null) => void;
}

const AssetVariantSelector = ({ selectedAsset, selectedVariant, onChange }: AssetVariantSelectorProps) => (
    <FormControl>
        <StyledRadioGroup
            value={selectedVariant?.name || ''}
            onChange={(e) => onChange(selectedAsset.variations.find((v) => v.name === e.target.value) || null)}
        >
            {selectedAsset.variations.map((variant) => (
                <FormControlLabel key={variant.name} value={variant.name} control={<Radio color="secondary" />} label={variant.name} labelPlacement="bottom" />
            ))}
        </StyledRadioGroup>
    </FormControl>
);

export default AssetVariantSelector;

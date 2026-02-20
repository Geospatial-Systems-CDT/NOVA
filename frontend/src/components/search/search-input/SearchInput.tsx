// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import { Autocomplete, CircularProgress, InputAdornment, styled, TextField } from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import type { SearchResponse } from '../../../types/searchResponse';

const StyledTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        height: 48,
        minHeight: 48,
        padding: '0 16px',
        '& fieldset': { border: 'none', margin: 0, top: 0 },
        '&:hover fieldset': {
            outline: '4px solid',
            outlineColor: theme.palette.secondary.dark,
        },
        '&.Mui-focused fieldset': {
            outline: '4px solid',
            outlineColor: theme.palette.secondary.main,
        },
    },
}));

interface SearchInputProps {
    onSearchResultClick: (lat: number, lon: number, zoom: number) => void;
}

const MIN_INPUT_LENGTH = 2;

const SearchInput: React.FC<SearchInputProps> = ({ onSearchResultClick }) => {
    const [input, setInput] = useState('');
    const [options, setOptions] = useState<SearchResponse[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        if (input.trim().length < MIN_INPUT_LENGTH) {
            setOptions([]);
            return;
        }

        setLoading(true);

        const timeout = setTimeout(() => {
            fetch(`/api/ui/search?location=${encodeURIComponent(input)}`, { signal: controller.signal })
                .then((res) => res.json())
                .then((data: SearchResponse[]) => setOptions(data))
                .catch(() => setOptions([]))
                .finally(() => setLoading(false));
        }, 300);

        return () => {
            clearTimeout(timeout);
            controller.abort();
        };
    }, [input]);

    const handleInputChange = useCallback((_e: unknown, value: string) => setInput(value), []);

    const handleChange = useCallback(
        (_e: unknown, value: SearchResponse | null) => {
            if (value && 'latitude' in value && 'longitude' in value) {
                onSearchResultClick(value.latitude, value.longitude, value.zoom);
            }
        },
        [onSearchResultClick]
    );

    return (
        <Autocomplete<SearchResponse>
            fullWidth
            loading={loading}
            options={options}
            getOptionLabel={(option) => option.name}
            inputValue={input}
            onInputChange={handleInputChange}
            onChange={handleChange}
            clearIcon={<ClearIcon />}
            disableClearable={false}
            noOptionsText={input.trim().length < MIN_INPUT_LENGTH ? '' : 'No options'}
            popupIcon={options.length > 0 ? undefined : null}
            filterOptions={(opts) => (input.trim().length >= MIN_INPUT_LENGTH ? opts : [])}
            slotProps={{
                popper: {
                    modifiers: [{ name: 'offset', options: { offset: [0, 8] } }],
                },
            }}
            renderInput={(params) => (
                <StyledTextField
                    {...params}
                    placeholder="Search"
                    variant="outlined"
                    fullWidth
                    slotProps={{
                        input: {
                            'aria-label': 'Search',
                            ...params.InputProps,
                            inputProps: { ...params.inputProps },
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <>
                                    {loading && (
                                        <InputAdornment position="end">
                                            <CircularProgress size={20} color="inherit" />
                                        </InputAdornment>
                                    )}
                                    {params.InputProps.endAdornment}
                                </>
                            ),
                        },
                    }}
                />
            )}
        />
    );
};

export default SearchInput;

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AssetControls from './AssetControls';

describe('AssetControls', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders all buttons', () => {
        render(
            <AssetControls
                onBoltClick={function (): void {
                    throw new Error('Function not implemented.');
                }}
                onDeleteClick={function (): void {
                    throw new Error('Function not implemented.');
                }}
                onEditClick={function (): void {
                    throw new Error('Function not implemented.');
                }}
                onMoveClick={function (): void {
                    throw new Error('Function not implemented.');
                }}
            />
        );

        expect(screen.getByLabelText('Edit')).toBeInTheDocument();
        expect(screen.getByLabelText('Connect to grid')).toBeInTheDocument();
        expect(screen.getByLabelText('Delete Asset')).toBeInTheDocument();
        expect(screen.getByLabelText('Move')).toBeInTheDocument();
    });

    it('highlights connect to grid button when substations list is open', () => {
        render(
            <AssetControls
                onBoltClick={function (): void {
                    throw new Error('Function not implemented.');
                }}
                onDeleteClick={function (): void {
                    throw new Error('Function not implemented.');
                }}
                onEditClick={function (): void {
                    throw new Error('Function not implemented.');
                }}
                onMoveClick={function (): void {
                    throw new Error('Function not implemented.');
                }}
                isSubstationsListOpen={true}
            />
        );

        const connectButton = screen.getByLabelText('Connect to grid button');
        expect(connectButton).toHaveAttribute('aria-pressed', 'true');
    });

    it('does not highlight connect to grid button when substations list is closed', () => {
        render(
            <AssetControls
                onBoltClick={function (): void {
                    throw new Error('Function not implemented.');
                }}
                onDeleteClick={function (): void {
                    throw new Error('Function not implemented.');
                }}
                onEditClick={function (): void {
                    throw new Error('Function not implemented.');
                }}
                onMoveClick={function (): void {
                    throw new Error('Function not implemented.');
                }}
                isSubstationsListOpen={false}
            />
        );

        const connectButton = screen.getByLabelText('Connect to grid button');
        expect(connectButton).toHaveAttribute('aria-pressed', 'false');
    });
});

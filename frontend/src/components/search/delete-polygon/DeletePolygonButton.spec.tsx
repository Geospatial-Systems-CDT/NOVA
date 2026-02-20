// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import DeletePolygonButton from './DeletePolygonButton';
import { useMapStore } from '../../../stores/useMapStore';

// Mock zustand store
vi.mock('../../../stores/useMapStore', () => ({
    useMapStore: vi.fn(),
}));

describe('DeletePolygonButton', () => {
    const deletePolygonMock = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not render when polygonStatus is neither "editing" nor "confirmed"', () => {
        (useMapStore as unknown as Mock).mockImplementation((selector) => selector({ polygonStatus: 'idle' }));

        render(<DeletePolygonButton deletePolygon={deletePolygonMock} />);
        expect(screen.queryByLabelText('Delete polygon')).not.toBeInTheDocument();
    });

    it('renders the button when polygonStatus is "editing"', () => {
        (useMapStore as unknown as Mock).mockImplementation((selector) => selector({ polygonStatus: 'editing' }));

        render(<DeletePolygonButton deletePolygon={deletePolygonMock} />);
        expect(screen.getByLabelText('Delete polygon')).toBeInTheDocument();
    });

    it('renders the button when polygonStatus is "confirmed"', () => {
        (useMapStore as unknown as Mock).mockImplementation((selector) => selector({ polygonStatus: 'confirmed' }));

        render(<DeletePolygonButton deletePolygon={deletePolygonMock} />);
        expect(screen.getByLabelText('Delete polygon')).toBeInTheDocument();
    });
});

// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ControlIcon from './ControlIcon';

describe('ControlIcon', () => {
    it('renders with correct aria label', () => {
        render(
            <ControlIcon onClick={() => {}} aria-label="Test Button">
                <span>Test</span>
            </ControlIcon>
        );

        const button = screen.getByLabelText('Test Button');
        expect(button).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
        const handleClick = vi.fn();
        render(
            <ControlIcon onClick={handleClick} aria-label="Test Button">
                <span>Test</span>
            </ControlIcon>
        );

        const button = screen.getByLabelText('Test Button');
        fireEvent.click(button);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders children correctly', () => {
        render(
            <ControlIcon onClick={() => {}} aria-label="Test Button">
                <span>Test Content</span>
            </ControlIcon>
        );

        const content = screen.getByText('Test Content');
        expect(content).toBeInTheDocument();
    });

    it('applies correct styling', () => {
        render(
            <ControlIcon onClick={() => {}} aria-label="Test Button">
                <span>Test</span>
            </ControlIcon>
        );

        const button = screen.getByLabelText('Test Button');
        expect(button).toHaveStyle({
            width: '3rem',
            height: '3rem',
            padding: '0',
        });
    });
});

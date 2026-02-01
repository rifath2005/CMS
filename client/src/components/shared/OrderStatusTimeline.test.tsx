import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderStatusTimeline } from './OrderStatusTimeline';
import { OrderStatus } from '../../types';

describe('OrderStatusTimeline', () => {
    it('should render timeline with correct status', () => {
        render(<OrderStatusTimeline currentStatus={OrderStatus.PREPARING} />);

        // Check that the component renders
        expect(screen.getByText('Order Placed')).toBeInTheDocument();
        expect(screen.getByText('Preparing')).toBeInTheDocument();
        expect(screen.getByText('Ready for Pickup')).toBeInTheDocument();
        expect(screen.getByText('Delivered')).toBeInTheDocument();
    });

    it('should show expired state for expired orders', () => {
        render(<OrderStatusTimeline currentStatus={OrderStatus.EXPIRED} />);

        expect(screen.getByText('Order Expired')).toBeInTheDocument();
        expect(screen.getByText('This order was not picked up in time')).toBeInTheDocument();
    });

    it('should render horizontal orientation', () => {
        const { container } = render(
            <OrderStatusTimeline currentStatus={OrderStatus.READY} orientation="horizontal" />
        );

        // Check that horizontal layout is applied
        expect(container.querySelector('.flex.items-center.justify-between')).toBeInTheDocument();
    });

    it('should render vertical orientation by default', () => {
        const { container } = render(
            <OrderStatusTimeline currentStatus={OrderStatus.PENDING} />
        );

        // Check that vertical layout is applied
        expect(container.querySelector('.flex.flex-col')).toBeInTheDocument();
    });
});

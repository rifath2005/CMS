import { describe, it, expect } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { CountdownTimer } from './CountdownTimer';

/**
 * Feature: cms-ui-ux-enhancement, Property 22: Countdown timer color progression
 * 
 * For any countdown timer, the color should be green when time remaining exceeds
 * 5 minutes, amber when 5 minutes or less remain, and red when expired
 * 
 * Validates: Requirements 12.3, 12.4, 12.5
 */
describe('CountdownTimer - Property 22: Countdown timer color progression', () => {
    it('should display green color when time remaining exceeds 5 minutes', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 301, max: 3600 }), // seconds > 5 minutes
                async (secondsFromNow) => {
                    const expiresAt = new Date(Date.now() + secondsFromNow * 1000);

                    const { container } = render(
                        <CountdownTimer expiresAt={expiresAt} />
                    );

                    // Wait for the useEffect to run
                    await waitFor(() => {
                        const display = container.querySelector('[data-testid="countdown-display"]') as HTMLElement;
                        expect(display).toBeTruthy();
                    });

                    const display = container.querySelector('[data-testid="countdown-display"]') as HTMLElement;
                    const classList = Array.from(display.classList);
                    expect(classList.includes('text-green-600')).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should display amber color when time remaining is 5 minutes or less', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.integer({ min: 1, max: 300 }), // seconds <= 5 minutes
                async (secondsFromNow) => {
                    const expiresAt = new Date(Date.now() + secondsFromNow * 1000);

                    const { container } = render(
                        <CountdownTimer expiresAt={expiresAt} />
                    );

                    // Wait for the useEffect to run
                    await waitFor(() => {
                        const display = container.querySelector('[data-testid="countdown-display"]') as HTMLElement;
                        expect(display).toBeTruthy();
                    });

                    const display = container.querySelector('[data-testid="countdown-display"]') as HTMLElement;
                    const classList = Array.from(display.classList);
                    expect(classList.includes('text-amber-600')).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should display red color when expired', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 3600 }), // seconds in the past
                (secondsAgo) => {
                    const expiresAt = new Date(Date.now() - secondsAgo * 1000);

                    const { container } = render(
                        <CountdownTimer expiresAt={expiresAt} />
                    );

                    const display = container.querySelector('[data-testid="countdown-display"]') as HTMLElement;
                    expect(display).toBeTruthy();

                    const classList = Array.from(display.classList);
                    expect(classList.includes('text-red-600')).toBe(true);

                    // Also verify the expired data attribute
                    expect(display.getAttribute('data-expired')).toBe('true');
                }
            ),
            { numRuns: 100 }
        );
    });
});

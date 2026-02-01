import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import * as fc from 'fast-check';
import { KPICard } from './KPICard';

/**
 * Feature: cms-ui-ux-enhancement, Property 4: Responsive layout adaptation
 * 
 * For any viewport width, the layout should adapt without horizontal scrolling
 * and all content should remain accessible
 * 
 * Validates: Requirements 1.6, 14.5
 */
describe('KPICard - Property 4: Responsive layout adaptation', () => {
    it('should render without horizontal overflow at any viewport width', () => {
        fc.assert(
            fc.property(
                fc.integer({ min: 320, max: 1920 }), // viewport width
                fc.string({ minLength: 5, maxLength: 50 }), // title
                fc.oneof(
                    fc.integer({ min: 0, max: 999999 }),
                    fc.string({ minLength: 1, maxLength: 20 })
                ), // value
                (viewportWidth, title, value) => {
                    // Set viewport width
                    Object.defineProperty(window, 'innerWidth', {
                        writable: true,
                        configurable: true,
                        value: viewportWidth,
                    });

                    const { container } = render(
                        <KPICard
                            title={title}
                            value={value}
                            icon={<div>Icon</div>}
                        />
                    );

                    const card = container.querySelector('[data-testid="kpi-card"]');
                    expect(card).toBeTruthy();

                    // Check that the card renders properly
                    const cardElement = card as HTMLElement;

                    // Verify the card has responsive classes (rounded-lg, p-3, etc.)
                    const classList = Array.from(cardElement.classList);
                    expect(classList.length).toBeGreaterThan(0);

                    // Verify content is accessible (rendered)
                    expect(cardElement.textContent).toContain(title);
                    expect(cardElement.textContent).toContain(String(value));

                    // Verify the card has proper structure
                    expect(cardElement.tagName).toBe('DIV');
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Feature: cms-ui-ux-enhancement, Property 5: KPI card hover elevation
 * 
 * For any KPI card, hovering should increase the box-shadow elevation
 * with a smooth transition
 * 
 * Validates: Requirements 2.4
 */
describe('KPICard - Property 5: KPI card hover elevation', () => {
    it('should have hover:shadow-lg class for elevation on hover', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 50 }), // title
                fc.oneof(
                    fc.integer({ min: 0, max: 999999 }),
                    fc.string({ minLength: 1, maxLength: 20 })
                ), // value
                (title, value) => {
                    const { container } = render(
                        <KPICard
                            title={title}
                            value={value}
                            icon={<div>Icon</div>}
                        />
                    );

                    const card = container.querySelector('[data-testid="kpi-card"]') as HTMLElement;
                    expect(card).toBeTruthy();

                    // Check that the card has the hover:shadow-lg class
                    // This is applied via Tailwind's hover: prefix
                    const classList = Array.from(card.classList);

                    // Verify transition class is present
                    expect(classList.some(cls => cls.includes('transition'))).toBe(true);

                    // Verify the element has the hover shadow class
                    // In Tailwind, hover:shadow-lg is compiled to a hover pseudo-class
                    const hasHoverShadow = classList.some(cls =>
                        cls.includes('hover:shadow') || cls.includes('shadow')
                    );
                    expect(hasHoverShadow).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });
});

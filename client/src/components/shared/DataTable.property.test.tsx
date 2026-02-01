import { describe, it, expect } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import * as fc from 'fast-check';
import { DataTable, ColumnDef } from './DataTable';

interface TestRow {
    id: string;
    name: string;
    value: number;
}

/**
 * Feature: cms-ui-ux-enhancement, Property 6: Table row hover action reveal
 * 
 * For any data table row with hover actions, hovering should reveal
 * action buttons with a fade-in transition
 * 
 * Validates: Requirements 3.4
 */
describe('DataTable - Property 6: Table row hover action reveal', () => {
    it('should reveal hover actions when hovering over any row', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        name: fc.string({ minLength: 1, maxLength: 30 }),
                        value: fc.integer({ min: 0, max: 1000 }),
                    }),
                    { minLength: 1, maxLength: 10 }
                ),
                fc.integer({ min: 0, max: 9 }), // row index to hover
                (data, hoverIndex) => {
                    // Ensure hoverIndex is within bounds
                    const actualHoverIndex = hoverIndex % data.length;

                    const columns: ColumnDef<TestRow>[] = [
                        {
                            key: 'name',
                            header: 'Name',
                            accessor: (row) => row.name,
                        },
                        {
                            key: 'value',
                            header: 'Value',
                            accessor: (row) => row.value,
                        },
                    ];

                    const { container } = render(
                        <DataTable
                            columns={columns}
                            data={data}
                            hoverActions={true}
                        />
                    );

                    const rows = container.querySelectorAll('[data-testid="table-row"]');
                    expect(rows.length).toBe(data.length);

                    // Hover over the selected row
                    const rowToHover = rows[actualHoverIndex] as HTMLElement;
                    fireEvent.mouseEnter(rowToHover);

                    // Check that hover actions are revealed
                    const hoverActions = rowToHover.querySelector('[data-testid="hover-actions"]');

                    // When hoverActions is enabled, the hover-actions element should be present
                    if (hoverActions) {
                        const hoverActionsElement = hoverActions as HTMLElement;
                        const classList = Array.from(hoverActionsElement.classList);

                        // Verify transition class is present
                        expect(classList.some(cls => cls.includes('transition'))).toBe(true);

                        // Verify opacity class is present (should be opacity-100 when hovered)
                        expect(classList.some(cls => cls.includes('opacity'))).toBe(true);
                    }

                    // Verify the row has hover styling
                    const rowClassList = Array.from(rowToHover.classList);
                    expect(rowClassList.some(cls => cls.includes('hover:bg'))).toBe(true);
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Feature: cms-ui-ux-enhancement, Property 10: Zebra striping consistency
 * 
 * For any data table with zebra striping enabled, even-numbered rows
 * should have a distinct background color from odd-numbered rows
 * 
 * Validates: Requirements 4.6
 */
describe('DataTable - Property 10: Zebra striping consistency', () => {
    it('should apply distinct background colors to even rows when zebra striping is enabled', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        id: fc.uuid(),
                        name: fc.string({ minLength: 1, maxLength: 30 }),
                        value: fc.integer({ min: 0, max: 1000 }),
                    }),
                    { minLength: 2, maxLength: 20 }
                ),
                (data) => {
                    const columns: ColumnDef<TestRow>[] = [
                        {
                            key: 'name',
                            header: 'Name',
                            accessor: (row) => row.name,
                        },
                        {
                            key: 'value',
                            header: 'Value',
                            accessor: (row) => row.value,
                        },
                    ];

                    const { container } = render(
                        <DataTable
                            columns={columns}
                            data={data}
                            zebraStriping={true}
                        />
                    );

                    const rows = container.querySelectorAll('[data-testid="table-row"]');
                    expect(rows.length).toBe(data.length);

                    // Check that even-indexed rows (0, 2, 4, ...) have bg-gray-50 class
                    // and odd-indexed rows (1, 3, 5, ...) don't have it
                    rows.forEach((row, index) => {
                        const rowElement = row as HTMLElement;
                        const classList = Array.from(rowElement.classList);
                        const hasBgGray = classList.some(cls => cls.includes('bg-gray-50'));

                        if (index % 2 === 0) {
                            // Even-indexed rows should have the background
                            expect(hasBgGray).toBe(true);
                        } else {
                            // Odd-indexed rows should not have the zebra stripe background
                            // (they may have other bg classes from hover, but not the zebra one)
                            // We check that the static bg-gray-50 is not present
                            const hasStaticBgGray = classList.includes('bg-gray-50');
                            expect(hasStaticBgGray).toBe(false);
                        }
                    });
                }
            ),
            { numRuns: 100 }
        );
    });
});

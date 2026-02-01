import React, { useState } from 'react';
import clsx from 'clsx';

export interface ColumnDef<T> {
    key: string;
    header: string;
    accessor: (row: T) => React.ReactNode;
    width?: string;
    align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
    columns: ColumnDef<T>[];
    data: T[];
    onRowClick?: (row: T) => void;
    stickyHeader?: boolean;
    zebraStriping?: boolean;
    hoverActions?: boolean;
    getRowKey?: (row: T, index: number) => string;
}

export function DataTable<T>({
    columns,
    data,
    onRowClick,
    stickyHeader = false,
    zebraStriping = false,
    hoverActions = false,
}: DataTableProps<T>) {
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" data-testid="data-table">
                <thead
                    className={clsx('bg-gray-50', stickyHeader && 'sticky top-0 z-10')}
                    data-testid="table-header"
                >
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className={clsx(
                                    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700',
                                    column.align === 'center' && 'text-center',
                                    column.align === 'right' && 'text-right'
                                )}
                                style={column.width ? { width: column.width } : undefined}
                            >
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {data.map((row, rowIndex) => (
                        <tr
                            key={rowIndex}
                            className={clsx(
                                'transition-colors duration-fast',
                                zebraStriping && rowIndex % 2 === 0 && 'bg-gray-50',
                                onRowClick && 'cursor-pointer hover:bg-gray-100',
                                !onRowClick && hoverActions && 'hover:bg-gray-100'
                            )}
                            onClick={() => onRowClick?.(row)}
                            onMouseEnter={() => setHoveredRow(rowIndex)}
                            onMouseLeave={() => setHoveredRow(null)}
                            data-testid="table-row"
                            data-row-index={rowIndex}
                        >
                            {columns.map((column) => (
                                <td
                                    key={column.key}
                                    className={clsx(
                                        'px-4 py-4 text-sm text-gray-900',
                                        column.align === 'center' && 'text-center',
                                        column.align === 'right' && 'text-right'
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        {column.accessor(row)}
                                        {hoverActions && hoveredRow === rowIndex && (
                                            <div
                                                className="ml-auto flex gap-1 opacity-100 transition-opacity duration-fast"
                                                data-testid="hover-actions"
                                            >
                                                {/* Actions will be rendered here by the accessor */}
                                            </div>
                                        )}
                                    </div>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const VendorDashboardSkeleton = () => {
    return (
        <div className="min-h-screen bg-gray-50 animate-pulse">
            {/* Header Skeleton */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="h-8 w-48 bg-gray-200 rounded"></div>
                        <div className="flex space-x-2">
                            <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
                            <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
                            <div className="h-10 w-28 bg-gray-200 rounded-lg"></div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="h-6 w-32 bg-gray-200 rounded"></div>
                        <div className="h-10 w-28 bg-gray-200 rounded-lg"></div>
                        <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Stats Cards Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-lg shadow p-4">
                            <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                            <div className="h-8 w-16 bg-gray-200 rounded"></div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Live Orders Skeleton */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow">
                            <div className="border-b border-gray-200 px-6 py-4">
                                <div className="h-6 w-32 bg-gray-200 rounded"></div>
                            </div>
                            <div className="p-6 space-y-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="border-2 rounded-lg p-4 border-gray-200">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="space-y-2">
                                                <div className="h-6 w-32 bg-gray-200 rounded"></div>
                                                <div className="h-4 w-48 bg-gray-200 rounded"></div>
                                            </div>
                                            <div className="h-6 w-20 bg-gray-200 rounded"></div>
                                        </div>
                                        <div className="space-y-2 mb-4">
                                            <div className="h-4 w-full bg-gray-200 rounded"></div>
                                            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <div className="h-10 flex-1 bg-gray-200 rounded"></div>
                                            <div className="h-10 flex-1 bg-gray-200 rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Batch View Skeleton */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <div className="h-6 w-24 bg-gray-200 rounded"></div>
                        </div>
                        <div className="p-6 space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="space-y-2">
                                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VendorDashboardSkeleton

import { useState, useEffect } from 'react'
import { canteenService, CreateCanteenData } from '../services/canteenService'
import { Canteen } from '../types'
import { useAuthStore } from '../store/authStore'
import { Plus, Building2, MapPin, Clock } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorAlert from '../components/ErrorAlert'
import { StepDrawer, StepConfig } from '../components/shared/StepDrawer'
import { DataTable, ColumnDef } from '../components/shared/DataTable'
import { StatusChip } from '../components/shared/StatusChip'

export default function Canteens() {
    const { user } = useAuthStore()
    const [canteens, setCanteens] = useState<Canteen[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [showCreateDrawer, setShowCreateDrawer] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)

    useEffect(() => {
        if (user?.institutionId) {
            loadCanteens()
        }
    }, [user])

    const loadCanteens = async () => {
        if (!user?.institutionId) return

        try {
            setLoading(true)
            const data = await canteenService.getCanteensByInstitution(user.institutionId)
            setCanteens(data)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load canteens')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateCanteen = async (data: CreateCanteenData) => {
        try {
            await canteenService.createCanteen(data)
            setShowCreateDrawer(false)
            setCurrentStep(0)
            loadCanteens()
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create canteen')
        }
    }

    const handleCloseDrawer = () => {
        setShowCreateDrawer(false)
        setCurrentStep(0)
    }

    // Define table columns
    const columns: ColumnDef<Canteen>[] = [
        {
            key: 'vendorId',
            header: 'Vendor ID',
            accessor: (canteen) => (
                <span className="font-mono font-semibold text-blue-600">{canteen.vendorId}</span>
            ),
            width: '120px',
        },
        {
            key: 'name',
            header: 'Canteen Name',
            accessor: (canteen) => (
                <div className="flex items-center space-x-2">
                    <Building2 className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{canteen.name}</span>
                </div>
            ),
        },
        {
            key: 'location',
            header: 'Location',
            accessor: (canteen) => (
                <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>{canteen.location}</span>
                </div>
            ),
        },
        {
            key: 'operatingHours',
            header: 'Operating Hours',
            accessor: (canteen) => (
                canteen.operatingHours ? (
                    <div className="flex items-center space-x-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                            {canteen.operatingHours.open} - {canteen.operatingHours.close}
                        </span>
                    </div>
                ) : (
                    <span className="text-gray-400">Not set</span>
                )
            ),
        },
        {
            key: 'status',
            header: 'Status',
            accessor: (canteen) => (
                <StatusChip
                    status={canteen.isActive ? 'active' : 'inactive'}
                    size="sm"
                />
            ),
            width: '120px',
            align: 'center',
        },
    ]

    if (loading) return <LoadingSpinner />

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Canteens</h1>
                <button
                    onClick={() => setShowCreateDrawer(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 min-h-[44px]"
                >
                    <Plus className="h-5 w-5" />
                    <span>Register Canteen</span>
                </button>
            </div>

            {error && <ErrorAlert message={error} onClose={() => setError('')} />}

            {canteens.length > 0 ? (
                <div className="bg-white rounded-lg shadow">
                    <DataTable
                        columns={columns}
                        data={canteens}
                        stickyHeader={true}
                        zebraStriping={true}
                        hoverActions={false}
                    />
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No canteens registered yet</p>
                    <button
                        onClick={() => setShowCreateDrawer(true)}
                        className="mt-4 text-blue-600 hover:text-blue-700"
                    >
                        Register your first canteen
                    </button>
                </div>
            )}

            {/* Create Canteen Drawer */}
            {user?.institutionId && (
                <CreateCanteenDrawer
                    institutionId={user.institutionId}
                    isOpen={showCreateDrawer}
                    currentStep={currentStep}
                    onStepChange={setCurrentStep}
                    onClose={handleCloseDrawer}
                    onCreate={handleCreateCanteen}
                />
            )}
        </div>
    )
}

// Create Canteen Drawer Component
function CreateCanteenDrawer({
    institutionId,
    isOpen,
    currentStep,
    onStepChange,
    onClose,
    onCreate,
}: {
    institutionId: string
    isOpen: boolean
    currentStep: number
    onStepChange: (step: number) => void
    onClose: () => void
    onCreate: (data: CreateCanteenData) => void
}) {
    const [formData, setFormData] = useState<CreateCanteenData>({
        institutionId,
        name: '',
        location: '',
        operatingHours: {
            open: '08:00',
            close: '20:00',
        },
    })

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

    // Validate each step
    const validateStep = (step: number): boolean => {
        const errors: Record<string, string> = {}

        if (step === 0) {
            // Identity section
            if (!formData.name.trim()) {
                errors.name = 'Canteen name is required'
            }
        } else if (step === 1) {
            // Location section
            if (!formData.location.trim()) {
                errors.location = 'Location is required'
            }
        }
        // Operating hours are optional, so step 2 is always valid

        setValidationErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleComplete = () => {
        if (validateStep(currentStep)) {
            onCreate(formData)
        }
    }

    // Step 1: Identity
    const identityStep: StepConfig = {
        title: 'Identity',
        description: 'Basic canteen information',
        isValid: formData.name.trim().length > 0,
        content: (
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Canteen Name *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => {
                            setFormData({ ...formData, name: e.target.value })
                            setValidationErrors({ ...validationErrors, name: '' })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                        placeholder="e.g., Student Canteen 1"
                    />
                    {validationErrors.name && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                    )}
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vendor ID
                    </label>
                    <div className="flex items-center space-x-2">
                        <div className="flex-1 px-3 py-2 bg-white border-2 border-blue-300 rounded-md font-mono font-semibold text-blue-600 min-h-[44px] flex items-center">
                            Auto-generated after registration
                        </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-600">
                        A unique vendor ID (e.g., SS1, SS2) will be automatically assigned upon registration
                    </p>
                </div>
            </div>
        ),
    }

    // Step 2: Location
    const locationStep: StepConfig = {
        title: 'Location',
        description: 'Where is the canteen located?',
        isValid: formData.location.trim().length > 0,
        content: (
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location *
                    </label>
                    <input
                        type="text"
                        required
                        value={formData.location}
                        onChange={(e) => {
                            setFormData({ ...formData, location: e.target.value })
                            setValidationErrors({ ...validationErrors, location: '' })
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                        placeholder="e.g., Building A, Ground Floor"
                    />
                    {validationErrors.location && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.location}</p>
                    )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-gray-700">Location Tips</p>
                            <p className="text-xs text-gray-600 mt-1">
                                Provide a clear, specific location that students can easily find.
                                Include building name, floor, or nearby landmarks.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        ),
    }

    // Step 3: Operating Hours
    const operatingHoursStep: StepConfig = {
        title: 'Operating Hours',
        description: 'Set the canteen operating schedule',
        isValid: true, // Operating hours are optional
        content: (
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Opening Time
                        </label>
                        <input
                            type="time"
                            value={formData.operatingHours?.open}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    operatingHours: {
                                        ...formData.operatingHours!,
                                        open: e.target.value,
                                    },
                                })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Closing Time
                        </label>
                        <input
                            type="time"
                            value={formData.operatingHours?.close}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    operatingHours: {
                                        ...formData.operatingHours!,
                                        close: e.target.value,
                                    },
                                })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                        />
                    </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                        <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-gray-700">Operating Hours</p>
                            <p className="text-xs text-gray-600 mt-1">
                                Set the hours when the canteen is open for orders. You can update these later if needed.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        ),
    }

    const steps: StepConfig[] = [identityStep, locationStep, operatingHoursStep]

    return (
        <StepDrawer
            isOpen={isOpen}
            onClose={onClose}
            steps={steps}
            currentStep={currentStep}
            onStepChange={onStepChange}
            onComplete={handleComplete}
        />
    )
}

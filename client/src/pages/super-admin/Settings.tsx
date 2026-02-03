import { useState, useEffect } from 'react'
import { Save, Server, Globe, Shield, Activity, DollarSign } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

interface SystemSettings {
    enable_payments_globally: boolean
    enable_new_institution_creation: boolean
    maintenance_mode: boolean
    enable_sockets: boolean
    system_announcement: string
}

const Settings = () => {
    const [settings, setSettings] = useState<SystemSettings | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            // TODO: Implement API call
            // Mock data
            setSettings({
                enable_payments_globally: true,
                enable_new_institution_creation: true,
                maintenance_mode: false,
                enable_sockets: true,
                system_announcement: ''
            })
        } catch (error) {
            console.error('Failed to fetch settings:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleToggle = (key: keyof SystemSettings, value: boolean) => {
        setSettings(prev => prev ? { ...prev, [key]: value } : null)
        setHasChanges(true)
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            // TODO: Implement API calls
            console.log('Saving settings:', settings)
            setTimeout(() => {
                setHasChanges(false)
                setIsSaving(false)
            }, 1000)
        } catch (error) {
            console.error('Failed to save settings:', error)
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        )
    }

    if (!settings) {
        return <div>Settings not found</div>
    }

    return (
        <div>
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
                    <p className="text-gray-600 mt-2">Manage global platform configurations</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="w-5 h-5" />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Platform Controls */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <Globe className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Platform Controls</h2>
                    </div>
                    
                    <div className="space-y-6">
                         <ToggleSwitch
                            enabled={settings.enable_new_institution_creation}
                            onChange={(val: boolean) => handleToggle('enable_new_institution_creation', val)}
                            label="Allow New Institutions"
                            description="Enable or disable onboarding of new institutions"
                        />
                         <ToggleSwitch
                            enabled={settings.enable_payments_globally}
                            onChange={(val: boolean) => handleToggle('enable_payments_globally', val)}
                            label="Global Payments Processor"
                            description="Master switch for all payment gateways"
                        />
                    </div>
                </div>

                {/* System Status */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-red-100 p-2 rounded-lg">
                            <Server className="w-6 h-6 text-red-600" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">System Status</h2>
                    </div>

                    <div className="space-y-6">
                         <ToggleSwitch
                            enabled={settings.maintenance_mode}
                            onChange={(val: boolean) => handleToggle('maintenance_mode', val)}
                            label="Maintenance Mode"
                            description="Put the entire platform in read-only mode"
                            isDangerous
                        />
                         <ToggleSwitch
                            enabled={settings.enable_sockets}
                            onChange={(val: boolean) => handleToggle('enable_sockets', val)}
                            label="Real-Time Sync (Socket.IO)"
                            description="Enable live updates for orders and notifications"
                        />
                    </div>
                </div>
            </div>
            
            {/* Announcement Banner */}
             <div className="mt-6 bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-yellow-100 p-2 rounded-lg">
                        <Activity className="w-6 h-6 text-yellow-600" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">System Announcement</h2>
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Global Banner Message</label>
                    <textarea
                        value={settings.system_announcement}
                        onChange={(e) => {
                            setSettings(prev => prev ? { ...prev, system_announcement: e.target.value } : null)
                            setHasChanges(true)
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent h-24"
                        placeholder="Enter a message to display on all user dashboards (e.g. Scheduled maintenance...)"
                    />
                </div>
            </div>
        </div>
    )
}

const ToggleSwitch = ({ enabled, onChange, label, description, isDangerous }: any) => (
    <div className="flex items-center justify-between py-1">
        <div className="flex-1 pr-4">
            <div className={`font-medium ${isDangerous ? 'text-red-900' : 'text-gray-900'}`}>{label}</div>
            {description && <div className="text-sm text-gray-500 mt-1">{description}</div>}
        </div>
        <button
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                isDangerous 
                    ? (enabled ? 'bg-red-600 focus:ring-red-500' : 'bg-gray-300 focus:ring-red-500')
                    : (enabled ? 'bg-primary-600 focus:ring-primary-500' : 'bg-gray-300 focus:ring-primary-500')
                }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
            />
        </button>
    </div>
)

export default Settings

import { useState, useEffect } from 'react'
import { Save, Server, Globe, Shield, Activity, DollarSign, AlertTriangle, CloudLightning } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import { api } from '../../services/api'

interface SystemSettings {
    enable_payments_globally: boolean
    enable_new_institution_creation: boolean
    maintenance_mode: boolean
    enable_sockets: boolean
    system_announcement: string
}

const SystemSettings = () => {
    const [settings, setSettings] = useState<SystemSettings | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        setIsLoading(true)
        try {
            const response = await api.get('/super-admin/settings');
            if (response.data.success) {
                const data = response.data.data;
                setSettings({
                    enable_payments_globally: data.global_payments_enabled,
                    enable_new_institution_creation: data.new_institution_creation_enabled,
                    maintenance_mode: data.maintenance_mode,
                    enable_sockets: data.global_real_time_enabled,
                    system_announcement: data.platform_announcement || ''
                })
            }
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
        if (!settings) return;
        setIsSaving(true)
        try {
            const keyMap: Record<string, string> = {
                enable_payments_globally: 'global_payments_enabled',
                enable_new_institution_creation: 'new_institution_creation_enabled',
                maintenance_mode: 'maintenance_mode',
                enable_sockets: 'global_real_time_enabled',
                system_announcement: 'platform_announcement'
            };

            const promises = Object.entries(settings).map(([key, value]) => {
                return api.patch(`/super-admin/settings/${keyMap[key]}`, { 
                    value,
                    reason: 'Admin updated from dashboard' 
                });
            });

            await Promise.all(promises);
            setHasChanges(false)
            alert('Settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error)
            alert('Failed to save settings');
        } finally {
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

    if (!settings) return null

    return (
        <div className="space-y-8 pb-12">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 bg-gray-50/95 backdrop-blur-sm z-10 py-4 border-b border-gray-200/50">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Settings</h1>
                    <p className="text-gray-500 mt-1">Global platform controls and safety switches.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200 font-medium"
                >
                    <Save className="w-5 h-5" />
                    {isSaving ? 'Saving Changes...' : 'Save Configuration'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Platform Controls */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Platform Features</h2>
                                <p className="text-sm text-gray-500">Core functionality toggles</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6 space-y-6">
                         <ToggleSwitch
                            enabled={settings.enable_new_institution_creation}
                            onChange={(val: boolean) => handleToggle('enable_new_institution_creation', val)}
                            label="Institution Onboarding"
                            description="Allow creation of new institution accounts from the dashboard"
                        />
                        <div className="h-px bg-gray-100" />
                         <ToggleSwitch
                            enabled={settings.enable_payments_globally}
                            onChange={(val: boolean) => handleToggle('enable_payments_globally', val)}
                            label="Global Payment Processing"
                            description="Master switch for all payment gateways across the platform"
                            icon={<DollarSign className="w-4 h-4 text-emerald-600" />}
                        />
                    </div>
                </div>

                {/* Infrastructure */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                <Server className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Infrastructure</h2>
                                <p className="text-sm text-gray-500">System performance and syncing</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                         <ToggleSwitch
                            enabled={settings.enable_sockets}
                            onChange={(val: boolean) => handleToggle('enable_sockets', val)}
                            label="Real-Time Sync (Socket.IO)"
                            description="Enable live updates for orders, notifications, and inventory"
                            icon={<CloudLightning className="w-4 h-4 text-yellow-600" />}
                        />
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-white rounded-2xl shadow-sm border border-red-100 overflow-hidden lg:col-span-2">
                    <div className="p-6 border-b border-red-50 bg-red-50/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                <Shield className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Emergency Controls</h2>
                                <p className="text-sm text-gray-500">High-impact system overrides</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-6">
                         <ToggleSwitch
                            enabled={settings.maintenance_mode}
                            onChange={(val: boolean) => handleToggle('maintenance_mode', val)}
                            label="Maintenance Mode"
                            description="Immediately puts the entire platform into read-only mode. Users will see a maintenance banner."
                            isDangerous
                            icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
                        />
                    </div>
                </div>
            </div>
            
            {/* Announcement Banner */}
             <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white shadow-xl">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
                        <Activity className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold">Global System Announcement</h2>
                        <p className="text-gray-400 text-sm mt-1 mb-4">Broadcast a message to all users on their dashboards.</p>
                        
                        <div className="relative">
                            <textarea
                                value={settings.system_announcement}
                                onChange={(e) => {
                                    setSettings(prev => prev ? { ...prev, system_announcement: e.target.value } : null)
                                    setHasChanges(true)
                                }}
                                className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-500 transition-all min-h-[100px]"
                                placeholder="Example: Scheduled maintenance will occur on Sunday at 2 AM..."
                            />
                            {settings.system_announcement && (
                                <div className="absolute bottom-4 right-4 text-xs text-gray-400 flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                    Live Preview
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

const ToggleSwitch = ({ enabled, onChange, label, description, isDangerous, icon }: any) => (
    <div className="flex items-start justify-between group">
        <div className="flex-1 pr-8">
            <div className="flex items-center gap-2">
                {icon && <span>{icon}</span>}
                <div className={`font-semibold text-base ${isDangerous ? 'text-red-900' : 'text-gray-900'}`}>{label}</div>
            </div>
            {description && <div className="text-sm text-gray-500 mt-1.5 leading-relaxed">{description}</div>}
        </div>
        <button
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-4 ${
                isDangerous 
                    ? (enabled ? 'bg-red-600 focus:ring-red-100' : 'bg-gray-200 focus:ring-red-50')
                    : (enabled ? 'bg-indigo-600 focus:ring-indigo-100' : 'bg-gray-200 focus:ring-indigo-50')
                }`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
            />
        </button>
    </div>
)

export default SystemSettings

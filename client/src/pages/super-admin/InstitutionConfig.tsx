import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Save, ArrowLeft, Shield, Palette, BarChart3,
    ShoppingCart, Wallet, Store, Users, Bell, FileText
} from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import { api } from '../../services/api'

interface InstitutionConfig {
    id: string
    name: string
    emailDomain: string
    contactEmail: string
    status: string
    plan: string
    features: any
    limits: any
    branding: any
    security: any
}

const OrgConfiguration = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const [config, setConfig] = useState<InstitutionConfig | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('ordering')
    const [hasChanges, setHasChanges] = useState(false)

    useEffect(() => {
        fetchConfig()
    }, [id])

    const fetchConfig = async () => {
        setIsLoading(true)
        try {
            const response = await api.get(`/super-admin/institutions/${id}/config`);
            if (response.data.success) {
                setConfig(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch config:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleFeatureToggle = (key: string, value: boolean) => {
        setConfig(prev => prev ? {
            ...prev,
            features: { ...prev.features, [key]: value }
        } : null)
        setHasChanges(true)
    }

    const handleLimitChange = (key: string, value: number) => {
        setConfig(prev => prev ? {
            ...prev,
            limits: { ...prev.limits, [key]: value }
        } : null)
        setHasChanges(true)
    }
    
    // Generic handler for nested updates
    const handleUpdate = (section: 'branding' | 'security' | 'features', key: string, value: any) => {
         setConfig(prev => prev ? {
            ...prev,
            [section]: { ...prev[section], [key]: value }
        } : null)
        setHasChanges(true)
    }

    const handleSave = async () => {
        if (!config) return;
        setIsSaving(true)
        try {
            await Promise.all([
                api.patch(`/super-admin/institutions/${id}/features`, config.features),
                api.patch(`/super-admin/institutions/${id}/limits`, config.limits),
                api.patch(`/super-admin/institutions/${id}/branding`, config.branding),
                api.patch(`/super-admin/institutions/${id}/security`, config.security),
            ]);
            setHasChanges(false)
            alert('Configuration saved successfully');
        } catch (error) {
            console.error('Failed to save config:', error)
            alert('Failed to save configuration');
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

    if (!config) {
        return <div className="p-8 text-center text-gray-500">Organization not found</div>
    }

    const tabs = [
        { id: 'ordering', label: 'Ordering', icon: ShoppingCart },
        { id: 'payment', label: 'Payment', icon: Wallet },
        { id: 'vendors', label: 'Vendors', icon: Store },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'reporting', label: 'Reporting', icon: FileText },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'limits', label: 'Limits', icon: BarChart3 },
        { id: 'branding', label: 'Branding', icon: Palette }
    ]

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white/90 backdrop-blur-md z-20 border-b border-gray-200 shadow-sm px-6 py-4">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <button
                            onClick={() => navigate('/main-admin/organizations')}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-gray-900">{config.name}</h1>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {config.status.toUpperCase()}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">Configuration & Settings ({config.emailDomain})</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        <button
                            onClick={handleSave}
                            disabled={!hasChanges || isSaving}
                            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow transition-all font-medium text-sm"
                        >
                            {isSaving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
                 <div className="flex flex-col lg:flex-row gap-8">
                    {/* Vertical Tabs (Desktop) / Horizontal Tabs (Mobile) */}
                    <div className="w-full lg:w-64 flex-shrink-0">
                         <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
                            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Settings Menu</span>
                            </div>
                             <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible p-2 gap-1">
                                {tabs.map(tab => {
                                    const Icon = tab.icon
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                                                activeTab === tab.id
                                                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                                    : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            <Icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                                            {tab.label}
                                            {activeTab === tab.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-600 lg:block hidden" />}
                                        </button>
                                    )
                                })}
                            </nav>
                         </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 min-h-[500px]">
                            {activeTab === 'ordering' && (
                                <OrderingTab config={config} onToggle={handleFeatureToggle} />
                            )}
                            {activeTab === 'payment' && (
                                <PaymentTab config={config} onToggle={handleFeatureToggle} />
                            )}
                            {activeTab === 'vendors' && (
                                <VendorsTab config={config} onToggle={handleFeatureToggle} />
                            )}
                            {activeTab === 'users' && (
                                <UsersTab config={config} onToggle={handleFeatureToggle} />
                            )}
                            {activeTab === 'notifications' && (
                                <NotificationsTab config={config} onToggle={handleFeatureToggle} />
                            )}
                             {activeTab === 'reporting' && (
                                <ReportingTab config={config} onToggle={handleFeatureToggle} />
                            )}
                            {activeTab === 'security' && (
                                <SecurityTab config={config} onUpdate={handleUpdate} />
                            )}
                            {activeTab === 'limits' && (
                                <LimitsTab config={config} onChange={handleLimitChange} />
                            )}
                            {activeTab === 'branding' && (
                                <BrandingTab config={config} onUpdate={handleUpdate} />
                            )}
                        </div>
                    </div>
                 </div>
            </div>
        </div>
    )
}

// Reusable Components
const SectionHeader = ({ title, description }: { title: string, description?: string }) => (
    <div className="mb-6 pb-4 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
    </div>
)

const ToggleSwitch = ({ enabled, onChange, label, description }: any) => (
    <div 
        className="flex items-start justify-between py-4 group cursor-pointer"
        onClick={() => onChange(!enabled)}
    >
        <div className="flex-1 pr-4 select-none">
            <div className={`font-medium transition-colors ${enabled ? 'text-gray-900' : 'text-gray-600'}`}>{label}</div>
            {description && <div className="text-sm text-gray-500 mt-1">{description}</div>}
        </div>
        <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enabled ? 'bg-indigo-600' : 'bg-gray-200'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </div>
    </div>
)

/* --- Tab Content Components --- */

const OrderingTab = ({ config, onToggle }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
        <div>
            <SectionHeader title="Availability & Flow" description="Control when and how orders are placed." />
            <ToggleSwitch
                enabled={config.features.enable_orders}
                onChange={(val: boolean) => onToggle('enable_orders', val)}
                label="Enable Ordering"
                description="Master switch to enable/disable all ordering."
            />
            <ToggleSwitch
                enabled={config.features.allow_same_day_orders}
                onChange={(val: boolean) => onToggle('allow_same_day_orders', val)}
                label="Same-Day Orders"
            />
            <ToggleSwitch
                enabled={config.features.allow_future_date_orders}
                onChange={(val: boolean) => onToggle('allow_future_date_orders', val)}
                label="Future Orders"
                description="Allow scheduling orders for later dates."
            />
            <ToggleSwitch
                enabled={config.features.enforce_ordering_time_window}
                onChange={(val: boolean) => onToggle('enforce_ordering_time_window', val)}
                label="Enforce Time Window"
                description={`Only allow ordering between ${config.features.ordering_start_time} and ${config.features.ordering_end_time}.`}
            />
        </div>
        <div>
           <SectionHeader title="Restrictions" description="Safety limits per order." />
            <ToggleSwitch
                enabled={config.features.enforce_one_active_order}
                onChange={(val: boolean) => onToggle('enforce_one_active_order', val)}
                label="One Active Order Limit"
                description="User must complete current order before placing another."
            />
            <ToggleSwitch
                enabled={config.features.limit_items_per_order}
                onChange={(val: boolean) => onToggle('limit_items_per_order', val)}
                label="Limit Items per Order"
            />
             <ToggleSwitch
                enabled={config.features.disable_orders_on_weekends}
                onChange={(val: boolean) => onToggle('disable_orders_on_weekends', val)}
                label="Block Weekend Orders"
            />
        </div>
    </div>
)

const PaymentTab = ({ config, onToggle }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
        <div>
            <SectionHeader title="Payment Methods" />
            <ToggleSwitch
                enabled={config.features.enable_wallet}
                onChange={(val: boolean) => onToggle('enable_wallet', val)}
                label="Digital Wallet"
            />
            <ToggleSwitch
                enabled={config.features.enable_mock_upi}
                onChange={(val: boolean) => onToggle('enable_mock_upi', val)}
                label="UPI Integration"
            />
            <ToggleSwitch
                enabled={config.features.enable_cash_on_delivery}
                onChange={(val: boolean) => onToggle('enable_cash_on_delivery', val)}
                label="Cash on Delivery"
            />
        </div>
        <div>
            <SectionHeader title="Wallet Rules" />
            <ToggleSwitch
                enabled={config.features.enable_auto_debit}
                onChange={(val: boolean) => onToggle('enable_auto_debit', val)}
                label="Auto-Debit"
                description="Automatically deduct from wallet on order."
            />
            <ToggleSwitch
                enabled={config.features.enable_wallet_topup}
                onChange={(val: boolean) => onToggle('enable_wallet_topup', val)}
                label="Allow Top-Ups"
            />
             <ToggleSwitch
                enabled={config.features.require_payment_before_acceptance}
                onChange={(val: boolean) => onToggle('require_payment_before_acceptance', val)}
                label="Pre-Payment Required"
                description="Reject orders without successful payment."
            />
        </div>
    </div>
)

const VendorsTab = ({ config, onToggle }: any) => (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
        <div>
            <SectionHeader title="Onboarding" />
            <ToggleSwitch
                enabled={config.features.allow_vendor_self_registration}
                onChange={(val: boolean) => onToggle('allow_vendor_self_registration', val)}
                label="Self-Registration"
            />
             <ToggleSwitch
                enabled={config.features.require_vendor_approval}
                onChange={(val: boolean) => onToggle('require_vendor_approval', val)}
                label="Require Approval"
                description="New vendors must be approved by admin."
            />
        </div>
        <div>
             <SectionHeader title="Permissions" />
              <ToggleSwitch
                enabled={config.features.allow_vendors_edit_prices}
                onChange={(val: boolean) => onToggle('allow_vendors_edit_prices', val)}
                label="Edit Prices"
            />
            <ToggleSwitch
                enabled={config.features.allow_vendors_reject_orders}
                onChange={(val: boolean) => onToggle('allow_vendors_reject_orders', val)}
                label="Reject Orders"
            />
        </div>
    </div>
)

const UsersTab = ({ config, onToggle }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
        <div>
            <SectionHeader title="Registration" />
             <ToggleSwitch
                enabled={config.features.allow_user_self_registration}
                onChange={(val: boolean) => onToggle('allow_user_self_registration', val)}
                label="Open Registration"
            />
             <ToggleSwitch
                enabled={config.features.restrict_registration_by_domain}
                onChange={(val: boolean) => onToggle('restrict_registration_by_domain', val)}
                label="Domain Restriction"
                description={`Only allow emails from @${config.emailDomain}`}
            />
        </div>
    </div>
)

const NotificationsTab = ({ config, onToggle }: any) => (
     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
        <div>
            <SectionHeader title="Channels" />
             <ToggleSwitch
                enabled={config.features.enable_email_notifications}
                onChange={(val: boolean) => onToggle('enable_email_notifications', val)}
                label="Email"
            />
             <ToggleSwitch
                enabled={config.features.enable_inapp_notifications}
                onChange={(val: boolean) => onToggle('enable_inapp_notifications', val)}
                label="In-App Feed"
            />
        </div>
    </div>
)

const ReportingTab = ({ config, onToggle }: any) => (
    <div>
        <SectionHeader title="Visibility" />
         <ToggleSwitch
            enabled={config.features.enable_analytics_dashboard}
            onChange={(val: boolean) => onToggle('enable_analytics_dashboard', val)}
            label="Analytics Dashboard"
        />
        <ToggleSwitch
            enabled={config.features.allow_export_reports}
            onChange={(val: boolean) => onToggle('allow_export_reports', val)}
            label="Allow CSV Exports"
        />
    </div>
)

const SecurityTab = ({ config, onUpdate }: any) => (
    <div>
        <SectionHeader title="Logging & Audits" />
        <ToggleSwitch
            enabled={config.security.enable_audit_logging}
            onChange={(val: boolean) => onUpdate('security', 'enable_audit_logging', val)}
            label="Enable Audit Logging"
        />
        <ToggleSwitch
            enabled={config.security.log_payment_attempts}
            onChange={(val: boolean) => onUpdate('security', 'log_payment_attempts', val)}
            label="Log Payment Attempts"
        />
    </div>
)

const LimitsTab = ({ config, onChange }: any) => (
    <div>
        <SectionHeader title="Hard Limits" description="System-level capacity constraints." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Users</label>
                <input
                    type="number"
                    value={config.limits.max_users}
                    onChange={(e) => onChange('max_users', parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-gray-900"
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Daily Orders</label>
                <input
                    type="number"
                    value={config.limits.max_orders_per_day}
                    onChange={(e) => onChange('max_orders_per_day', parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-gray-900"
                />
            </div>
        </div>
    </div>
)

const BrandingTab = ({ config, onUpdate }: any) => (
    <div>
        <SectionHeader title="Look & Feel" />
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                <div className="flex items-center gap-2">
                     <input
                    type="color"
                    value={config.branding.custom_theme_color}
                    onChange={(e) => onUpdate('branding', 'custom_theme_color', e.target.value)}
                    className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                />
                <span className="text-sm text-gray-500 font-mono">{config.branding.custom_theme_color}</span>
                </div>
            </div>
        </div>
    </div>
)

export default OrgConfiguration

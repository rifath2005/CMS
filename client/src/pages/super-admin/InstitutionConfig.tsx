import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Save, ArrowLeft, Shield, Palette, BarChart3,
    ShoppingCart, Wallet, Store, Users, Bell, FileText
} from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'

interface InstitutionConfig {
    id: string
    name: string
    emailDomain: string
    status: string
    plan: string
    features: any
    limits: any
    branding: any
    security: any
}

const InstitutionConfig = () => {
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
        try {
            // TODO: Implement API call
            // const response = await api.get(`/institutions/${id}/config`)
            // setConfig(response.data)

            // Mock data
            setConfig({
                id: id || '1',
                name: 'ABC University',
                emailDomain: 'abc.edu',
                status: 'active',
                plan: 'custom',
                features: {
                    // 1. Ordering & Flow
                    enable_orders: true,
                    allow_same_day_orders: true,
                    allow_future_date_orders: true,
                    allow_multiple_orders_per_day: true,
                    enforce_one_active_order: false,
                    enforce_ordering_time_window: true,
                    ordering_start_time: '09:00',
                    ordering_end_time: '18:00',
                    disable_orders_on_holidays: true,
                    disable_orders_on_weekends: true,
                    limit_items_per_order: false,
                    max_items_per_order: 10,
                    limit_quantity_per_product: false,
                    allow_bulk_orders: false,
                    
                    // 2. Payment
                    enable_wallet: true,
                    enable_mock_upi: true,
                    enable_cash_on_delivery: true,
                    enable_post_paid: false,
                    enable_wallet_topup: true,
                    enable_auto_debit: false,
                    enforce_wallet_balance_limit: true,
                    min_wallet_balance_required: 0,
                    require_payment_before_acceptance: true,
                    allow_pay_after_pickup: false,
                    auto_cancel_unpaid_orders_mins: 15,

                    // 3. Vendor
                    allow_vendor_self_registration: false,
                    require_vendor_approval: true,
                    allow_vendor_suspension: true,
                    allow_vendor_deletion: false,
                    allow_vendors_edit_prices: true,
                    allow_vendors_disable_products: true,
                    allow_vendors_see_user_details: true,
                    allow_vendors_reject_orders: true,
                    
                    // 4. User Access
                    allow_user_self_registration: true,
                    require_email_verification: true,
                    restrict_registration_by_domain: true,
                    require_admin_approval_for_users: false,
                    enforce_password_policy: true,
                    force_logout_on_role_change: true,
                    enable_multi_device_login: true,
                    enforce_single_session: false,
                    allow_order_cancellation_by_user: true,

                    // 5. Fulfillment
                    enable_scheduled_pickup: true,
                    enable_instant_pickup: true,
                    require_qr_code_for_pickup: true,
                    require_otp_for_pickup: false,
                    vendor_must_accept_order: true,
                    auto_accept_orders: false,
                    auto_complete_orders_after_pickup: true,

                    // 6. Notifications
                    enable_realtime_updates: true,
                    enable_inapp_notifications: true,
                    enable_email_notifications: true,
                    enable_sms_notifications: false,
                    notify_vendor_on_new_order: true,
                    notify_user_on_status_change: true,
                    notify_admin_on_failed_payments: true,

                    // 7. Reporting
                    enable_analytics_dashboard: true,
                    allow_institution_admin_view_revenue: true,
                    allow_vendor_view_sales_reports: true,
                    allow_export_reports: true,
                },
                limits: {
                    max_users: 10000,
                    max_vendors: 50,
                    max_orders_per_day: 5000,
                    max_wallet_balance: 10000,
                    max_concurrent_sessions: 3
                },
                branding: {
                    custom_theme_color: '#3B82F6',
                    custom_logo_url: '',
                    show_institution_name_in_app: true,
                    disable_platform_branding: false
                },
                security: {
                    enable_audit_logging: true,
                    log_payment_attempts: true,
                    log_failed_logins: true,
                    mask_user_data_for_vendors: true,
                    auto_lock_on_multiple_failures: true
                }
            })
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
        setIsSaving(true)
        try {
            // TODO: Implement API calls
            console.log('Saving config:', config)
            setTimeout(() => {
                setHasChanges(false)
                setIsSaving(false)
            }, 1000)
        } catch (error) {
            console.error('Failed to save config:', error)
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
        return <div>Institution not found</div>
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
        <div>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/super-admin/institutions')}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{config.name}</h1>
                        <p className="text-gray-600 mt-1">Configure features and settings</p>
                    </div>
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

            {/* Status Bar */}
            <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div>
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${config.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {config.status}
                        </span>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600">Plan:</span>
                        <span className="ml-2 px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                            {config.plan}
                        </span>
                    </div>
                    <div>
                        <span className="text-sm text-gray-600">Domain:</span>
                        <span className="ml-2 font-medium">{config.emailDomain}</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow">
                <div className="border-b border-gray-200 overflow-x-auto">
                    <div className="flex">
                        {tabs.map(tab => {
                            const Icon = tab.icon
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === tab.id
                                            ? 'border-primary-600 text-primary-600'
                                            : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="p-6">
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
    )
}

// Tab Components
const ToggleSwitch = ({ enabled, onChange, label, description }: any) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 px-2 transition-colors rounded">
        <div className="flex-1 pr-4">
            <div className="font-medium text-gray-900">{label}</div>
            {description && <div className="text-sm text-gray-500 mt-1">{description}</div>}
        </div>
        <button
            onClick={() => onChange(!enabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${enabled ? 'bg-primary-600' : 'bg-gray-300'
                }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
            />
        </button>
    </div>
)

const OrderingTab = ({ config, onToggle }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4 text-primary-900 bg-primary-50 p-2 rounded">Core Ordering</h3>
                <ToggleSwitch
                    enabled={config.features.enable_orders}
                    onChange={(val: boolean) => onToggle('enable_orders', val)}
                    label="Enable Ordering"
                    description="Master kill-switch for all ordering functionality"
                />
                <ToggleSwitch
                    enabled={config.features.allow_same_day_orders}
                    onChange={(val: boolean) => onToggle('allow_same_day_orders', val)}
                    label="Allow Same-Day Orders"
                    description="Users can place orders for pickup today"
                />
                <ToggleSwitch
                    enabled={config.features.allow_future_date_orders}
                    onChange={(val: boolean) => onToggle('allow_future_date_orders', val)}
                    label="Allow Future-Date Orders"
                    description="Users can schedule orders for upcoming days"
                />
                <ToggleSwitch
                    enabled={config.features.allow_multiple_orders_per_day}
                    onChange={(val: boolean) => onToggle('allow_multiple_orders_per_day', val)}
                    label="Allow Multiple Orders per Day"
                />
                <ToggleSwitch
                    enabled={config.features.enforce_one_active_order}
                    onChange={(val: boolean) => onToggle('enforce_one_active_order', val)}
                    label="Enforce One Active Order"
                    description="User cannot place another order until current one is completed"
                />
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4 text-primary-900 bg-primary-50 p-2 rounded">Time Constraints</h3>
                <ToggleSwitch
                    enabled={config.features.enforce_ordering_time_window}
                    onChange={(val: boolean) => onToggle('enforce_ordering_time_window', val)}
                    label="Enforce Ordering Time Window"
                />
                 <ToggleSwitch
                    enabled={config.features.disable_orders_on_holidays}
                    onChange={(val: boolean) => onToggle('disable_orders_on_holidays', val)}
                    label="Disable Orders on Holidays"
                />
                <ToggleSwitch
                    enabled={config.features.disable_orders_on_weekends}
                    onChange={(val: boolean) => onToggle('disable_orders_on_weekends', val)}
                    label="Disable Orders on Weekends"
                />
            </div>
             <div>
                <h3 className="text-lg font-semibold mb-4 text-primary-900 bg-primary-50 p-2 rounded">Quantity Rules</h3>
                <ToggleSwitch
                    enabled={config.features.limit_items_per_order}
                    onChange={(val: boolean) => onToggle('limit_items_per_order', val)}
                    label="Limit Items per Order"
                />
                 <ToggleSwitch
                    enabled={config.features.limit_quantity_per_product}
                    onChange={(val: boolean) => onToggle('limit_quantity_per_product', val)}
                    label="Limit Quantity per Product"
                />
                 <ToggleSwitch
                    enabled={config.features.allow_bulk_orders}
                    onChange={(val: boolean) => onToggle('allow_bulk_orders', val)}
                    label="Allow Bulk Orders"
                />
            </div>
        </div>

        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4 text-primary-900 bg-primary-50 p-2 rounded">Pickup Options</h3>
                <ToggleSwitch
                    enabled={config.features.enable_scheduled_pickup}
                    onChange={(val: boolean) => onToggle('enable_scheduled_pickup', val)}
                    label="Enable Scheduled Pickup"
                />
                <ToggleSwitch
                    enabled={config.features.enable_instant_pickup}
                    onChange={(val: boolean) => onToggle('enable_instant_pickup', val)}
                    label="Enable Instant Pickup"
                />
                <ToggleSwitch
                    enabled={config.features.require_qr_code_for_pickup}
                    onChange={(val: boolean) => onToggle('require_qr_code_for_pickup', val)}
                    label="Require QR Code for Pickup"
                />
                <ToggleSwitch
                    enabled={config.features.require_otp_for_pickup}
                    onChange={(val: boolean) => onToggle('require_otp_for_pickup', val)}
                    label="Require OTP for Pickup"
                />
            </div>
            
            <div>
                <h3 className="text-lg font-semibold mb-4 text-primary-900 bg-primary-50 p-2 rounded">Status Flow</h3>
                <ToggleSwitch
                    enabled={config.features.vendor_must_accept_order}
                    onChange={(val: boolean) => onToggle('vendor_must_accept_order', val)}
                    label="Vendor Must Accept Order"
                />
                <ToggleSwitch
                    enabled={config.features.auto_accept_orders}
                    onChange={(val: boolean) => onToggle('auto_accept_orders', val)}
                    label="Auto-Accept Orders"
                />
                 <ToggleSwitch
                    enabled={config.features.auto_complete_orders_after_pickup}
                    onChange={(val: boolean) => onToggle('auto_complete_orders_after_pickup', val)}
                    label="Auto-Complete Orders After Pickup"
                />
            </div>
        </div>
    </div>
)

const PaymentTab = ({ config, onToggle }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4 text-primary-900 bg-primary-50 p-2 rounded">Payment Methods</h3>
                <ToggleSwitch
                    enabled={config.features.enable_wallet}
                    onChange={(val: boolean) => onToggle('enable_wallet', val)}
                    label="Enable Wallet"
                />
                <ToggleSwitch
                    enabled={config.features.enable_mock_upi}
                    onChange={(val: boolean) => onToggle('enable_mock_upi', val)}
                    label="Enable Mock UPI"
                />
                <ToggleSwitch
                    enabled={config.features.enable_cash_on_delivery}
                    onChange={(val: boolean) => onToggle('enable_cash_on_delivery', val)}
                    label="Enable Cash on Delivery"
                />
                <ToggleSwitch
                    enabled={config.features.enable_post_paid}
                    onChange={(val: boolean) => onToggle('enable_post_paid', val)}
                    label="Enable Post-Paid (Pay Later)"
                />
            </div>

            <div>
                <h3 className="text-lg font-semibold mb-4 text-primary-900 bg-primary-50 p-2 rounded">Wallet Rules</h3>
                <ToggleSwitch
                    enabled={config.features.enable_wallet_topup}
                    onChange={(val: boolean) => onToggle('enable_wallet_topup', val)}
                    label="Enable Wallet Top-Up"
                />
                <ToggleSwitch
                    enabled={config.features.enable_auto_debit}
                    onChange={(val: boolean) => onToggle('enable_auto_debit', val)}
                    label="Enable Auto-Debit"
                />
                <ToggleSwitch
                    enabled={config.features.enforce_wallet_balance_limit}
                    onChange={(val: boolean) => onToggle('enforce_wallet_balance_limit', val)}
                    label="Enforce Wallet Balance Limit"
                />
            </div>
        </div>
        
        <div className="space-y-6">
             <div>
                <h3 className="text-lg font-semibold mb-4 text-primary-900 bg-primary-50 p-2 rounded">Payment Enforcement</h3>
                <ToggleSwitch
                    enabled={config.features.require_payment_before_acceptance}
                    onChange={(val: boolean) => onToggle('require_payment_before_acceptance', val)}
                    label="Require Payment Before Order"
                    description="User must pay to place order"
                />
                <ToggleSwitch
                    enabled={config.features.allow_pay_after_pickup}
                    onChange={(val: boolean) => onToggle('allow_pay_after_pickup', val)}
                    label="Allow Pay After Pickup"
                />
            </div>
        </div>
    </div>
)

const VendorsTab = ({ config, onToggle }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4 text-primary-900 bg-primary-50 p-2 rounded">Vendor Lifecycle</h3>
                <ToggleSwitch
                    enabled={config.features.allow_vendor_self_registration}
                    onChange={(val: boolean) => onToggle('allow_vendor_self_registration', val)}
                    label="Allow Vendor Self-Registration"
                />
                <ToggleSwitch
                    enabled={config.features.require_vendor_approval}
                    onChange={(val: boolean) => onToggle('require_vendor_approval', val)}
                    label="Require Admin Approval"
                />
                <ToggleSwitch
                    enabled={config.features.allow_vendor_suspension}
                    onChange={(val: boolean) => onToggle('allow_vendor_suspension', val)}
                    label="Allow Vendor Suspension"
                />
                 <ToggleSwitch
                    enabled={config.features.allow_vendor_deletion}
                    onChange={(val: boolean) => onToggle('allow_vendor_deletion', val)}
                    label="Allow Vendor Deletion"
                />
            </div>
        </div>
        
        <div className="space-y-6">
             <div>
                <h3 className="text-lg font-semibold mb-4 text-primary-900 bg-primary-50 p-2 rounded">Vendor Operations</h3>
                <ToggleSwitch
                    enabled={config.features.allow_vendors_edit_prices}
                    onChange={(val: boolean) => onToggle('allow_vendors_edit_prices', val)}
                    label="Allow Vendors to Edit Prices"
                />
                <ToggleSwitch
                    enabled={config.features.allow_vendors_disable_products}
                    onChange={(val: boolean) => onToggle('allow_vendors_disable_products', val)}
                    label="Allow Vendors to Disable Products"
                />
                <ToggleSwitch
                    enabled={config.features.allow_vendors_see_user_details}
                    onChange={(val: boolean) => onToggle('allow_vendors_see_user_details', val)}
                    label="Allow Vendors to See User Details"
                />
                <ToggleSwitch
                    enabled={config.features.allow_vendors_reject_orders}
                    onChange={(val: boolean) => onToggle('allow_vendors_reject_orders', val)}
                    label="Allow Vendors to Reject Orders"
                />
            </div>
        </div>
    </div>
)

const UsersTab = ({ config, onToggle }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4 text-primary-900 bg-primary-50 p-2 rounded">Registration</h3>
                <ToggleSwitch
                    enabled={config.features.allow_user_self_registration}
                    onChange={(val: boolean) => onToggle('allow_user_self_registration', val)}
                    label="Allow User Self-Registration"
                />
                <ToggleSwitch
                    enabled={config.features.require_email_verification}
                    onChange={(val: boolean) => onToggle('require_email_verification', val)}
                    label="Require Email Verification"
                />
                <ToggleSwitch
                    enabled={config.features.restrict_registration_by_domain}
                    onChange={(val: boolean) => onToggle('restrict_registration_by_domain', val)}
                    label="Restrict Registration by Domain"
                />
                 <ToggleSwitch
                    enabled={config.features.require_admin_approval_for_users}
                    onChange={(val: boolean) => onToggle('require_admin_approval_for_users', val)}
                    label="Require Admin Approval"
                />
            </div>
             <div>
                <h3 className="text-lg font-semibold mb-4 text-primary-900 bg-primary-50 p-2 rounded">User Behavior</h3>
                <ToggleSwitch
                    enabled={config.features.allow_order_cancellation_by_user}
                    onChange={(val: boolean) => onToggle('allow_order_cancellation_by_user', val)}
                    label="Allow Order Cancellation by User"
                />
            </div>
        </div>
        
        <div className="space-y-6">
             <div>
                <h3 className="text-lg font-semibold mb-4 text-primary-900 bg-primary-50 p-2 rounded">Authentication</h3>
                <ToggleSwitch
                    enabled={config.features.enforce_password_policy}
                    onChange={(val: boolean) => onToggle('enforce_password_policy', val)}
                    label="Enforce Password Policy"
                />
                 <ToggleSwitch
                    enabled={config.features.force_logout_on_role_change}
                    onChange={(val: boolean) => onToggle('force_logout_on_role_change', val)}
                    label="Force Logout on Role Change"
                />
                <ToggleSwitch
                    enabled={config.features.enable_multi_device_login}
                    onChange={(val: boolean) => onToggle('enable_multi_device_login', val)}
                    label="Enable Multi-Device Login"
                />
                <ToggleSwitch
                    enabled={config.features.enforce_single_session}
                    onChange={(val: boolean) => onToggle('enforce_single_session', val)}
                    label="Enforce Single Session per User"
                />
            </div>
        </div>
    </div>
)

const NotificationsTab = ({ config, onToggle }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4 text-primary-900 bg-primary-50 p-2 rounded">Channels</h3>
                <ToggleSwitch
                    enabled={config.features.enable_realtime_updates}
                    onChange={(val: boolean) => onToggle('enable_realtime_updates', val)}
                    label="Enable Real-Time Updates"
                    description="Socket.IO based live updates"
                />
                <ToggleSwitch
                    enabled={config.features.enable_inapp_notifications}
                    onChange={(val: boolean) => onToggle('enable_inapp_notifications', val)}
                    label="Enable In-App Notifications"
                />
                <ToggleSwitch
                    enabled={config.features.enable_email_notifications}
                    onChange={(val: boolean) => onToggle('enable_email_notifications', val)}
                    label="Enable Email Notifications"
                />
                 <ToggleSwitch
                    enabled={config.features.enable_sms_notifications}
                    onChange={(val: boolean) => onToggle('enable_sms_notifications', val)}
                    label="Enable SMS Notifications"
                    description="Additional charges may apply"
                />
            </div>
        </div>

        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-4 text-primary-900 bg-primary-50 p-2 rounded">Event Toggles</h3>
                <ToggleSwitch
                    enabled={config.features.notify_vendor_on_new_order}
                    onChange={(val: boolean) => onToggle('notify_vendor_on_new_order', val)}
                    label="Notify Vendor on New Order"
                />
                <ToggleSwitch
                    enabled={config.features.notify_user_on_status_change}
                    onChange={(val: boolean) => onToggle('notify_user_on_status_change', val)}
                    label="Notify User on Order Status"
                />
                <ToggleSwitch
                    enabled={config.features.notify_admin_on_failed_payments}
                    onChange={(val: boolean) => onToggle('notify_admin_on_failed_payments', val)}
                    label="Notify Admin on Failed Payments"
                />
            </div>
        </div>
    </div>
)

const ReportingTab = ({ config, onToggle }: any) => (
    <div className="space-y-6 max-w-2xl">
         <div>
            <h3 className="text-lg font-semibold mb-4 text-primary-900 bg-primary-50 p-2 rounded">Reporting & Visibility</h3>
            <ToggleSwitch
                enabled={config.features.enable_analytics_dashboard}
                onChange={(val: boolean) => onToggle('enable_analytics_dashboard', val)}
                label="Enable Analytics Dashboard"
            />
             <ToggleSwitch
                enabled={config.features.allow_institution_admin_view_revenue}
                onChange={(val: boolean) => onToggle('allow_institution_admin_view_revenue', val)}
                label="Allow Institution Admin View Revenue"
            />
             <ToggleSwitch
                enabled={config.features.allow_vendor_view_sales_reports}
                onChange={(val: boolean) => onToggle('allow_vendor_view_sales_reports', val)}
                label="Allow Vendor View Sales Reports"
            />
             <ToggleSwitch
                enabled={config.features.allow_export_reports}
                onChange={(val: boolean) => onToggle('allow_export_reports', val)}
                label="Allow Export Reports (CSV)"
            />
        </div>
    </div>
)

const SecurityTab = ({ config, onUpdate }: any) => (
    <div className="space-y-6 max-w-2xl">
        <div>
            <h3 className="text-lg font-semibold mb-4 text-primary-900 bg-primary-50 p-2 rounded">Security & Compliance</h3>
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
            <ToggleSwitch
                enabled={config.security.log_failed_logins}
                onChange={(val: boolean) => onUpdate('security', 'log_failed_logins', val)}
                label="Log Failed Logins"
            />
            <ToggleSwitch
                enabled={config.security.mask_user_data_for_vendors}
                onChange={(val: boolean) => onUpdate('security', 'mask_user_data_for_vendors', val)}
                label="Mask User Personal Data"
            />
            <ToggleSwitch
                enabled={config.security.auto_lock_on_multiple_failures}
                onChange={(val: boolean) => onUpdate('security', 'auto_lock_on_multiple_failures', val)}
                label="Auto-Lock on Failed Login"
            />
        </div>
    </div>
)

const LimitsTab = ({ config, onChange }: any) => (
    <div className="space-y-6">
        <div>
            <h3 className="text-lg font-semibold mb-4 text-primary-900 bg-primary-50 p-2 rounded">Hard Limits & Quotas</h3>
            <p className="text-sm text-gray-600 mb-6">These limits are enforced by the backend and cannot be bypassed by frontend controls.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Users</label>
                    <input
                        type="number"
                        value={config.limits.max_users}
                        onChange={(e) => onChange('max_users', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Vendors</label>
                    <input
                        type="number"
                        value={config.limits.max_vendors}
                        onChange={(e) => onChange('max_vendors', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Orders per Day</label>
                    <input
                        type="number"
                        value={config.limits.max_orders_per_day}
                        onChange={(e) => onChange('max_orders_per_day', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Wallet Balance</label>
                    <input
                        type="number"
                        value={config.limits.max_wallet_balance}
                        onChange={(e) => onChange('max_wallet_balance', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Concurrent Sessions</label>
                    <input
                        type="number"
                        value={config.limits.max_concurrent_sessions}
                        onChange={(e) => onChange('max_concurrent_sessions', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                </div>
            </div>
        </div>
    </div>
)

const BrandingTab = ({ config, onUpdate }: any) => (
    <div className="space-y-6 max-w-2xl">
        <div>
            <h3 className="text-lg font-semibold mb-4 text-primary-900 bg-primary-50 p-2 rounded">Branding & Experience</h3>
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme Color</label>
                    <div className="flex items-center gap-4">
                        <input
                            type="color"
                            value={config.branding.custom_theme_color}
                            onChange={(e) => onUpdate('branding', 'custom_theme_color', e.target.value)}
                            className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                        />
                         <span className="text-gray-500">{config.branding.custom_theme_color}</span>
                    </div>
                </div>
                 <ToggleSwitch
                    enabled={config.branding.show_institution_name_in_app}
                    onChange={(val: boolean) => onUpdate('branding', 'show_institution_name_in_app', val)}
                    label="Show Institution Name in User App"
                />
                 <ToggleSwitch
                    enabled={config.branding.disable_platform_branding}
                    onChange={(val: boolean) => onUpdate('branding', 'disable_platform_branding', val)}
                    label="Disable Platform Branding"
                />
            </div>
        </div>
    </div>
)

export default InstitutionConfig

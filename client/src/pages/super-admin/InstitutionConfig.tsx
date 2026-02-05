import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    Save, ArrowLeft, Shield, Palette, BarChart3,
    ShoppingCart, Wallet, Store, Users, Bell, FileText,
    CheckCircle2, XCircle, ChevronRight, Settings2, ShieldCheck,
    Smartphone, Zap, Info, Activity, Download, Mail, UserPlus,
    Building2, Search
} from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import { api } from '../../services/api'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'

interface Institution {
    id: string
    name: string
}

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
    const [institutions, setInstitutions] = useState<Institution[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('ordering')
    const [hasChanges, setHasChanges] = useState(false)
    const [selectedInstId, setSelectedInstId] = useState<string>(id || '')

    useEffect(() => {
        fetchInstitutions()
        if (id) {
            fetchConfig(id)
        } else {
             setIsLoading(false)
        }
    }, [id])

    const fetchInstitutions = async () => {
        try {
            const response = await api.get('/institutions')
            setInstitutions(response.data.data)
        } catch (error) {
            console.error('Failed to fetch institutions:', error)
        }
    }

    const fetchConfig = async (instId: string) => {
        setIsLoading(true)
        try {
            const response = await api.get(`/super-admin/institutions/${instId}/config`);
            if (response.data.success) {
                setConfig(response.data.data);
                setSelectedInstId(instId)
            }
        } catch (error) {
            console.error('Failed to fetch config:', error)
            setConfig(null)
        } finally {
            setIsLoading(false)
        }
    }

    const handleInstitutionSelect = (instId: string) => {
        if (instId) {
            navigate(`/main-admin/organizations/${instId}/configure`)
        } else {
            navigate('/main-admin/organisation-permissions')
            setConfig(null)
            setSelectedInstId('')
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
    
    const handleUpdate = (section: 'branding' | 'security' | 'features', key: string, value: any) => {
         setConfig(prev => prev ? {
            ...prev,
            [section]: { ...prev[section], [key]: value }
        } : null)
        setHasChanges(true)
    }

    const handleSave = async () => {
        if (!config || !selectedInstId) return;
        setIsSaving(true)
        try {
            await Promise.all([
                api.patch(`/super-admin/institutions/${selectedInstId}/features`, config.features),
                api.patch(`/super-admin/institutions/${selectedInstId}/limits`, config.limits),
                api.patch(`/super-admin/institutions/${selectedInstId}/branding`, config.branding),
                api.patch(`/super-admin/institutions/${selectedInstId}/security`, config.security),
            ]);
            setHasChanges(false)
        } catch (error) {
            console.error('Failed to save config:', error)
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

    const tabs = [
        { id: 'ordering', label: 'Ordering', icon: ShoppingCart, description: 'Order flows and timing' },
        { id: 'payment', label: 'Payment', icon: Wallet, description: 'Gateways and wallet rules' },
        { id: 'vendors', label: 'Vendors', icon: Store, description: 'Merchant onboarding' },
        { id: 'users', label: 'Users', icon: Users, description: 'Access and domain rules' },
        { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Alert channels' },
        { id: 'reporting', label: 'Reporting', icon: FileText, description: 'Analytics and exports' },
        { id: 'security', label: 'Security', icon: Shield, description: 'Audit logs and tracing' },
        { id: 'limits', label: 'Limits', icon: BarChart3, description: 'Capacity constraints' },
        { id: 'branding', label: 'Branding', icon: Palette, description: 'Identity and themes' }
    ]

    return (
        <div className="min-h-screen bg-transparent pb-20 animate-in fade-in duration-500">
            {/* Action Bar */}
            <div className="bg-background/80 backdrop-blur-xl sticky top-0 z-30 border-b border-border shadow-sm px-6 py-4 mb-8 -mx-6 rounded-b-3xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/main-admin/organizations')}
                            className="rounded-xl hover:bg-muted py-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="h-10 w-px bg-border hidden md:block" />
                        
                        <div className="relative min-w-[240px]">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <select
                                value={selectedInstId}
                                onChange={(e) => handleInstitutionSelect(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-muted/40 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all font-bold text-sm appearance-none"
                            >
                                <option value="">Select Organization...</option>
                                {institutions.map(inst => (
                                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                                ))}
                            </select>
                        </div>

                        {config && (
                            <div className="hidden lg:flex items-center gap-3 ml-4">
                                <Badge variant={config.status === 'active' ? 'success' : 'secondary'} className="rounded-md uppercase tracking-widest text-[10px] font-bold">
                                    {config.status}
                                </Badge>
                                <Badge variant="outline" className="rounded-md bg-primary/5 text-primary border-primary/10 uppercase tracking-widest text-[10px] font-bold">
                                    {config.plan}
                                </Badge>
                            </div>
                        )}
                    </div>
                    
                    {config && (
                        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                            <Button
                                onClick={handleSave}
                                disabled={!hasChanges || isSaving}
                                className={cn(
                                    "min-w-[140px] gap-2 shadow-xl transition-all duration-300 rounded-xl",
                                    hasChanges ? "shadow-primary/20" : "shadow-none"
                                )}
                            >
                                {isSaving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
                                <span className="font-bold">{isSaving ? 'Synchronizing...' : 'Commit Changes'}</span>
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto">
                {!config ? (
                    <Card className="border-dashed py-20 bg-muted/20">
                        <CardContent className="text-center">
                            <div className="h-16 w-16 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6">
                                <ShieldCheck className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-black text-foreground mb-2">Organisation Permissions</h2>
                            <p className="text-muted-foreground max-w-md mx-auto mb-8 font-medium">
                                Select an organization from the dropdown above to manage its feature toggles, usage limits, and security configuration.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Sidebar Navigation */}
                        <div className="w-full lg:w-72 flex-shrink-0">
                             <Card className="border-none shadow-xl shadow-gray-200/50 p-2 sticky top-28 bg-white/80 backdrop-blur-md">
                                <div className="p-3 mb-2">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-60 flex items-center gap-2">
                                        <Zap className="w-3 h-3 text-primary" /> Configuration Matrix
                                    </span>
                                </div>
                                 <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-1 scrollbar-hide pb-2 lg:pb-0">
                                    {tabs.map(tab => {
                                        const Icon = tab.icon
                                        const isActive = activeTab === tab.id
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 text-left group min-w-[180px] lg:min-w-0 relative",
                                                    isActive
                                                        ? 'bg-primary text-white shadow-xl shadow-primary/20 translate-x-1'
                                                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                                                )}
                                            >
                                                <Icon className={cn("w-5 h-5 shrink-0", isActive ? 'text-white' : 'text-primary/40 group-hover:text-primary transition-colors')} />
                                                <div className="flex flex-col">
                                                    <span>{tab.label}</span>
                                                    <span className={cn("text-[10px] font-medium opacity-60 line-clamp-1", isActive ? "text-white/80" : "text-muted-foreground")}>{tab.description}</span>
                                                </div>
                                                {isActive && (
                                                    <div className="absolute right-3">
                                                        <ChevronRight className="w-4 h-4 opacity-40" />
                                                    </div>
                                                )}
                                            </button>
                                        )
                                    })}
                                </nav>
                             </Card>
                        </div>

                        {/* Content Panel */}
                        <div className="flex-1 min-w-0">
                            <Card className="border-none shadow-2xl shadow-gray-100 min-h-[600px] overflow-hidden rounded-3xl bg-white">
                                <CardHeader className="p-8 pb-4 border-b border-border/50 bg-muted/20">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                            <Settings2 className="w-5 h-5" />
                                        </div>
                                        <CardTitle className="text-2xl font-black tracking-tight uppercase text-foreground">
                                            {tabs.find(t => t.id === activeTab)?.label} Settings
                                        </CardTitle>
                                    </div>
                                    <CardDescription className="text-sm font-medium">Fine-tune the behavior of the platform for this institution.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 pt-6">
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
                                </CardContent>
                            </Card>
                        </div>
                     </div>
                )}
            </div>
        </div>
    )
}

const SectionTitle = ({ title, icon: Icon, description }: any) => (
    <div className="mb-8 p-4 bg-muted/30 rounded-2xl border border-border/50">
        <div className="flex items-center gap-3 mb-1">
            <Icon className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-black text-foreground uppercase tracking-[0.1em]">{title}</h3>
        </div>
        {description && <p className="text-xs font-medium text-muted-foreground">{description}</p>}
    </div>
)

const PremiumToggle = ({ enabled, onChange, label, description, icon: Icon }: any) => (
    <div 
        className={cn(
            "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none group h-full",
            enabled 
                ? "bg-primary/5 border-primary/20 shadow-sm" 
                : "bg-background border-border hover:border-primary/20"
        )}
        onClick={() => onChange(!enabled)}
    >
        <div className="flex items-start gap-3">
            {Icon && (
                <div className={cn(
                    "p-2 rounded-xl shrink-0 transition-colors",
                    enabled ? "bg-primary text-white" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}>
                    <Icon className="w-4 h-4" />
                </div>
            )}
            <div className="flex flex-col">
                <span className={cn("text-sm font-bold transition-colors", enabled ? "text-primary" : "text-foreground")}>{label}</span>
                {description && <p className="text-[11px] font-medium text-muted-foreground mt-0.5 leading-relaxed">{description}</p>}
            </div>
        </div>
        <div className={cn(
            "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
            enabled ? "bg-primary" : "bg-muted"
        )}>
            <span className={cn(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                enabled ? "translate-x-6" : "translate-x-1"
            )} />
        </div>
    </div>
)

/* --- Tab Content Components --- */

const OrderingTab = ({ config, onToggle }: any) => (
    <div className="space-y-10">
        <div>
            <SectionTitle title="Core Ordering Flow" icon={Zap} description="Primary switches for order management system." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PremiumToggle
                    enabled={config.features.enable_orders}
                    onChange={(val: boolean) => onToggle('enable_orders', val)}
                    label="Enable Merchant Feed"
                    icon={ShoppingCart}
                    description="Allow users to browse menus and place new orders."
                />
                <PremiumToggle
                    enabled={config.features.allow_same_day_orders}
                    onChange={(val: boolean) => onToggle('allow_same_day_orders', val)}
                    label="Instant (Same-Day) Orders"
                    icon={Zap}
                />
                <PremiumToggle
                    enabled={config.features.allow_future_date_orders}
                    onChange={(val: boolean) => onToggle('allow_future_date_orders', val)}
                    label="Advance Scheduling"
                    icon={Smartphone}
                    description="Enable ordering for future dates/shifts."
                />
                <PremiumToggle
                    enabled={config.features.enforce_ordering_time_window}
                    onChange={(val: boolean) => onToggle('enforce_ordering_time_window', val)}
                    label="Time-Window Check"
                    icon={ShieldCheck}
                    description={`Window: ${config.features.ordering_start_time} - ${config.features.ordering_end_time}`}
                />
            </div>
        </div>
        <div>
            <SectionTitle title="Inventory & Limits" icon={Shield} description="Safety constraints to prevent platform abuse." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PremiumToggle
                    enabled={config.features.enforce_one_active_order}
                    onChange={(val: boolean) => onToggle('enforce_one_active_order', val)}
                    label="Single Order Lock"
                    icon={Shield}
                    description="Limit concurrent active orders per user profile."
                />
                 <PremiumToggle
                    enabled={config.features.disable_orders_on_weekends}
                    onChange={(val: boolean) => onToggle('disable_orders_on_weekends', val)}
                    label="Weekend Lockdown"
                    icon={XCircle}
                />
            </div>
        </div>
    </div>
)

const PaymentTab = ({ config, onToggle }: any) => (
    <div className="space-y-10">
        <div>
            <SectionTitle title="Authorization Channels" icon={Wallet} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PremiumToggle
                    enabled={config.features.enable_wallet}
                    onChange={(val: boolean) => onToggle('enable_wallet', val)}
                    label="Organization Wallet"
                    icon={Wallet}
                    description="Allow payment via platform credits/wallet."
                />
                <PremiumToggle
                    enabled={config.features.enable_mock_upi}
                    onChange={(val: boolean) => onToggle('enable_mock_upi', val)}
                    label="UPI Gateway (Sandbox)"
                    icon={Smartphone}
                />
                <PremiumToggle
                    enabled={config.features.enable_cash_on_delivery}
                    onChange={(val: boolean) => onToggle('enable_cash_on_delivery', val)}
                    label="Cash Settlements"
                    icon={Store}
                />
            </div>
        </div>
        <div>
            <SectionTitle title="Financial Settlement Rules" icon={ShieldCheck} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PremiumToggle
                    enabled={config.features.enable_auto_debit}
                    onChange={(val: boolean) => onToggle('enable_auto_debit', val)}
                    label="Direct Checkout Deacuation"
                    icon={Zap}
                />
                <PremiumToggle
                    enabled={config.features.require_payment_before_acceptance}
                    onChange={(val: boolean) => onToggle('require_payment_before_acceptance', val)}
                    label="Escrow Enforcement"
                    icon={ShieldCheck}
                    description="Vendor only sees order after payment capture."
                />
            </div>
        </div>
    </div>
)

const VendorsTab = ({ config, onToggle }: any) => (
      <div className="space-y-10">
        <div>
            <SectionTitle title="Merchant Lifecycle" icon={Store} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PremiumToggle
                    enabled={config.features.allow_vendor_self_registration}
                    onChange={(val: boolean) => onToggle('allow_vendor_self_registration', val)}
                    label="Public Onboarding"
                    icon={UserPlus}
                />
                 <PremiumToggle
                    enabled={config.features.require_vendor_approval}
                    onChange={(val: boolean) => onToggle('require_vendor_approval', val)}
                    label="Admin Pre-Audit"
                    icon={ShieldCheck}
                />
            </div>
        </div>
    </div>
)

const UsersTab = ({ config, onToggle }: any) => (
    <div className="space-y-10">
        <div>
            <SectionTitle title="Identity Governance" icon={Users} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PremiumToggle
                    enabled={config.features.allow_user_self_registration}
                    onChange={(val: boolean) => onToggle('allow_user_self_registration', val)}
                    label="Open User Enrolment"
                    icon={UserPlus}
                />
                 <PremiumToggle
                    enabled={config.features.restrict_registration_by_domain}
                    onChange={(val: boolean) => onToggle('restrict_registration_by_domain', val)}
                    label="Institutional Whitelist"
                    icon={ShieldCheck}
                    description={`Exclusive to @${config.emailDomain}`}
                />
            </div>
        </div>
    </div>
)

const NotificationsTab = ({ config, onToggle }: any) => (
     <div className="space-y-10">
        <div>
            <SectionTitle title="Dispatch Infrastructure" icon={Bell} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PremiumToggle
                    enabled={config.features.enable_email_notifications}
                    onChange={(val: boolean) => onToggle('enable_email_notifications', val)}
                    label="Transactional Email"
                    icon={Mail}
                />
                 <PremiumToggle
                    enabled={config.features.enable_inapp_notifications}
                    onChange={(val: boolean) => onToggle('enable_inapp_notifications', val)}
                    label="WebSocket Alerts"
                    icon={Bell}
                />
            </div>
        </div>
    </div>
)

const ReportingTab = ({ config, onToggle }: any) => (
    <div className="space-y-10">
        <div>
            <SectionTitle title="Business Intelligence" icon={BarChart3} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PremiumToggle
                    enabled={config.features.enable_analytics_dashboard}
                    onChange={(val: boolean) => onToggle('enable_analytics_dashboard', val)}
                    label="Live Metric Engine"
                    icon={Activity}
                />
                <PremiumToggle
                    enabled={config.features.allow_export_reports}
                    onChange={(val: boolean) => onToggle('allow_export_reports', val)}
                    label="Data Exfiltration (CSV/XLS)"
                    icon={Download}
                />
            </div>
        </div>
    </div>
)

const SecurityTab = ({ config, onUpdate }: any) => (
    <div className="space-y-10">
        <div>
            <SectionTitle title="Threat Monitoring" icon={Shield} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PremiumToggle
                    enabled={config.security.enable_audit_logging}
                    onChange={(val: boolean) => onUpdate('security', 'enable_audit_logging', val)}
                    label="Full Forensic Trail"
                    icon={FileText}
                />
                <PremiumToggle
                    enabled={config.security.log_payment_attempts}
                    onChange={(val: boolean) => onUpdate('security', 'log_payment_attempts', val)}
                    label="Financial Tracing"
                    icon={ShieldCheck}
                />
            </div>
        </div>
    </div>
)

const LimitsTab = ({ config, onChange }: any) => (
    <div className="space-y-10">
        <div>
            <SectionTitle title="Scaling Parameters" icon={BarChart3} description="Define hard ceiling limits for this instance." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-muted/10 border-border/40 overflow-hidden group hover:ring-2 hover:ring-primary/20 transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                             <Users className="w-4 h-4 text-primary" />
                             <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Active User Ceiling</label>
                        </div>
                        <input
                            type="number"
                            value={config.limits.max_users}
                            onChange={(e) => onChange('max_users', parseInt(e.target.value))}
                            className="bg-transparent text-4xl font-black text-foreground w-full focus:outline-none focus:text-primary transition-colors"
                        />
                        <p className="text-[10px] font-bold text-muted-foreground mt-2 opacity-50">Current Tier Max: Unlimited (Pro)</p>
                    </CardContent>
                </Card>
                 <Card className="bg-muted/10 border-border/40 overflow-hidden group hover:ring-2 hover:ring-primary/20 transition-all">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                             <Zap className="w-4 h-4 text-primary" />
                             <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Daily Request Quota</label>
                        </div>
                        <input
                            type="number"
                            value={config.limits.max_orders_per_day}
                            onChange={(e) => onChange('max_orders_per_day', parseInt(e.target.value))}
                            className="bg-transparent text-4xl font-black text-foreground w-full focus:outline-none focus:text-primary transition-colors"
                        />
                        <p className="text-[10px] font-bold text-muted-foreground mt-2 opacity-50">Hard limit on generated transactions.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
)

const BrandingTab = ({ config, onUpdate }: any) => (
    <div className="space-y-10">
        <div>
            <SectionTitle title="Identity & Theming" icon={Palette} />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-muted/10 border-border/40 group overflow-hidden">
                    <CardContent className="p-6">
                         <div className="flex items-center gap-2 mb-4">
                             <Palette className="w-4 h-4 text-primary" />
                             <label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Brand Accent Color</label>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="h-16 w-16 rounded-2xl shadow-lg border-2 border-white ring-2 ring-border/50 overflow-hidden relative group/color">
                                  <input
                                    type="color"
                                    value={config.branding.custom_theme_color}
                                    onChange={(e) => onUpdate('branding', 'custom_theme_color', e.target.value)}
                                    className="absolute inset-0 w-full h-full scale-150 cursor-pointer opacity-0 z-10"
                                />
                                <div className="absolute inset-0" style={{ backgroundColor: config.branding.custom_theme_color }} />
                             </div>
                             <div className="flex flex-col">
                                  <span className="text-2xl font-black text-foreground font-mono">{config.branding.custom_theme_color.toUpperCase()}</span>
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">HSL Calculated Palette Locked</span>
                             </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
)

export default OrgConfiguration

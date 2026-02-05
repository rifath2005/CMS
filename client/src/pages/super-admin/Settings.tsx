import { useState, useEffect } from 'react'
import { Save, Server, Globe, Shield, Activity, DollarSign, AlertTriangle, CloudLightning, Megaphone, Zap, ShieldAlert, Sparkles } from 'lucide-react'
import LoadingSpinner from '../../components/LoadingSpinner'
import { api } from '../../services/api'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { cn } from '../../lib/utils'

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
        } catch (error) {
            console.error('Failed to save settings:', error)
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
        <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 bg-background/80 backdrop-blur-xl z-30 py-4 -mx-6 px-6 border-b border-border/50 rounded-b-3xl shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">System Core</h1>
                    <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mt-0.5 opacity-70">Global Instance Parameters & Safety Overrides</p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className={cn(
                        "min-w-[200px] h-12 gap-3 shadow-2xl transition-all duration-500 rounded-2xl",
                        hasChanges ? "shadow-primary/30 scale-105" : "shadow-none"
                    )}
                >
                    {isSaving ? <LoadingSpinner size="sm" /> : <Save className="w-5 h-5" />}
                    <span className="font-black uppercase tracking-widest text-xs">{isSaving ? 'Synchronizing Pulse...' : 'Commit Configuration'}</span>
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Platform Controls */}
                <Card className="border-none shadow-2xl shadow-gray-100 overflow-hidden rounded-3xl group">
                    <CardHeader className="p-8 pb-4 bg-primary/5 transition-colors group-hover:bg-primary/10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight uppercase">Platform Federation</CardTitle>
                                <CardDescription className="font-bold text-xs uppercase tracking-widest opacity-60">Core Access & Transaction Switches</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-8 space-y-6">
                         <PremiumToggle
                            enabled={settings.enable_new_institution_creation}
                            onChange={(val: boolean) => handleToggle('enable_new_institution_creation', val)}
                            label="Institutional Onboarding"
                            description="Toggle the ability to provision new organization sub-accounts globally."
                            icon={Zap}
                        />
                        <div className="h-px bg-border/50" />
                         <PremiumToggle
                            enabled={settings.enable_payments_globally}
                            onChange={(val: boolean) => handleToggle('enable_payments_globally', val)}
                            label="Global Transaction Feed"
                            description="Master switch for all wallet and gateway operations across every instance."
                            icon={DollarSign}
                        />
                    </CardContent>
                </Card>

                {/* Infrastructure */}
                <Card className="border-none shadow-2xl shadow-gray-100 overflow-hidden rounded-3xl group">
                    <CardHeader className="p-8 pb-4 bg-muted/30 transition-colors group-hover:bg-muted/50">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-muted text-foreground rounded-2xl shadow-lg border border-border">
                                <Server className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight uppercase">Synapse Network</CardTitle>
                                <CardDescription className="font-bold text-xs uppercase tracking-widest opacity-60">Real-time Data Propagation</CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-8 space-y-6">
                         <PremiumToggle
                            enabled={settings.enable_sockets}
                            onChange={(val: boolean) => handleToggle('enable_sockets', val)}
                            label="Quantum Link Service"
                            description="Maintain persistent WebSocket tunnels for sub-millisecond data synchronization."
                            icon={CloudLightning}
                        />
                         <div className="h-px bg-border/50" />
                         <div className="p-6 rounded-2xl bg-muted/20 border border-dashed border-border text-center">
                             <Sparkles className="w-6 h-6 text-primary mx-auto mb-2 opacity-50" />
                             <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">More infrastructure gears coming soon</p>
                         </div>
                    </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-none shadow-2xl shadow-semantic-error/5 overflow-hidden rounded-3xl lg:col-span-2 border-t-4 border-t-semantic-error/30 ring-1 ring-semantic-error/10">
                    <CardHeader className="p-8 pb-4 bg-semantic-error/5 border-b border-semantic-error/10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-semantic-error text-white rounded-2xl shadow-xl shadow-semantic-error/20">
                                <ShieldAlert className="w-6 h-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black tracking-tight uppercase text-semantic-error">Blackout Protocols</CardTitle>
                                <CardDescription className="font-bold text-xs uppercase tracking-widest text-semantic-error opacity-70">Immediate Platform Suspension Overrides</CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className="p-10">
                         <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                             <div className="flex-1">
                                 <h3 className="text-lg font-black text-foreground mb-2 flex items-center gap-2">
                                     <AlertTriangle className="w-5 h-5 text-semantic-error" />
                                     TOTAL BLACKOUT (MAINTENANCE)
                                 </h3>
                                 <p className="text-sm font-medium text-muted-foreground leading-relaxed max-w-2xl">
                                     Activating this protocol will immediately decouple all database writing operations and present a structural maintenance screen to all users globally. 
                                     <span className="text-semantic-error font-black ml-1 uppercase">USE ONLY DURING SEVERE INCIDENTS OR MAJOR SECURITY DEPLOYMENTS.</span>
                                 </p>
                             </div>
                             <Button
                                onClick={() => handleToggle('maintenance_mode', !settings.maintenance_mode)}
                                variant={settings.maintenance_mode ? 'outline' : 'destructive'}
                                className={cn(
                                    "h-14 min-w-[240px] rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-2xl transition-all duration-300",
                                    settings.maintenance_mode ? "shadow-semantic-success/20 border-semantic-success text-semantic-success hover:bg-semantic-success/10" : "shadow-semantic-error/30"
                                )}
                             >
                                {settings.maintenance_mode ? 'Deactivate Blackout' : 'Engage Blackout'}
                             </Button>
                         </div>
                    </CardContent>
                </Card>
            </div>
            
            {/* Announcement Banner */}
             <Card className="bg-black/95 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-20 -mr-10 -mt-10 bg-primary/10 rounded-full blur-[100px] group-hover:bg-primary/20 transition-all duration-700" />
                <div className="flex flex-col md:flex-row items-start gap-10 relative z-10">
                    <div className="p-5 bg-white/10 rounded-2xl backdrop-blur-2xl ring-1 ring-white/20 shadow-2xl">
                        <Megaphone className="w-10 h-10 text-primary" />
                    </div>
                    <div className="flex-1 w-full">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-2xl font-black tracking-tight uppercase">Neural Broadcast Hub</h2>
                                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Global System HUD Announcement Propagation</p>
                            </div>
                            <Badge className="bg-primary/20 text-primary border-primary/20 px-3 py-1 font-black uppercase tracking-widest text-[9px] h-fit">
                                Live Ingress Active
                            </Badge>
                        </div>
                        
                        <div className="relative">
                            <textarea
                                value={settings.system_announcement}
                                onChange={(e) => {
                                    setSettings(prev => prev ? { ...prev, system_announcement: e.target.value } : null)
                                    setHasChanges(true)
                                }}
                                className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl focus:ring-4 focus:ring-primary/20 focus:border-primary/40 text-white placeholder-white/20 transition-all min-h-[140px] text-lg font-medium resize-none shadow-inner"
                                placeholder="Transmit a global directive to every active user session..."
                            />
                            {settings.system_announcement && (
                                <div className="absolute bottom-4 right-4 text-[9px] font-black text-white/30 uppercase tracking-[0.3em] flex items-center gap-3 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full border border-white/5">
                                    <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping"></span>
                                    Signal Synchronized
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    )
}

const PremiumToggle = ({ enabled, onChange, label, description, icon: Icon }: any) => (
    <div 
        className={cn(
            "flex items-center justify-between p-5 rounded-2xl border-2 transition-all duration-500 cursor-pointer select-none group",
            enabled 
                ? "bg-primary/5 border-primary/20 shadow-xl shadow-primary/5 ring-4 ring-primary/5" 
                : "bg-background border-border hover:border-primary/10 hover:bg-muted/30"
        )}
        onClick={() => onChange(!enabled)}
    >
        <div className="flex items-start gap-4">
            <div className={cn(
                "p-3 rounded-xl shrink-0 transition-all duration-300 group-hover:rotate-12",
                enabled ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
            )}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
                <span className={cn("text-base font-black uppercase tracking-tight transition-colors", enabled ? "text-primary" : "text-foreground")}>{label}</span>
                <p className="text-xs font-medium text-muted-foreground mt-1 leading-relaxed opacity-70">{description}</p>
            </div>
        </div>
        <div className={cn(
            "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-all duration-500",
            enabled ? "bg-primary shadow-lg shadow-primary/20" : "bg-muted"
        )}>
            <span className={cn(
                "inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-500 shadow-xl",
                enabled ? "translate-x-6" : "translate-x-1"
            )} />
        </div>
    </div>
)

export default SystemSettings

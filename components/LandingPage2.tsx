import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  MessageSquare, 
  ShieldCheck, 
  Zap, 
  Users, 
  Globe, 
  ArrowRight, 
  CheckCircle2, 
  Plus,
  Truck,
  Package,
  Layers,
  ChevronDown,
  LayoutDashboard,
  Smartphone,
  Menu,
  X
} from 'lucide-react';

export const LandingPage2: React.FC = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Navigation */}
      <nav 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Layers className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">KRAMIZ</span>
            <span className="hidden sm:block text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full tracking-widest uppercase">Beta</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors">Features</a>
            <a href="#solutions" className="text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors">Solutions</a>
            <a href="#network" className="text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors">Network</a>
            <div className="h-4 w-px bg-slate-200 mx-2"></div>
            <button 
                onClick={() => navigate('/login')}
                className="text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors"
            >
                Log In
            </button>
            <button 
                onClick={() => navigate('/signup')}
                className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-95"
            >
                Start Free
            </button>
          </div>

          <button 
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-white p-8 flex flex-col"
          >
            <div className="flex justify-between items-center mb-12">
              <span className="text-2xl font-black tracking-tighter">KRAMIZ</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400">
                <X className="w-8 h-8" />
              </button>
            </div>
            <div className="flex flex-col gap-8">
              {['Features', 'Solutions', 'Network', 'Support'].map((item) => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-2xl font-bold text-slate-900" onClick={() => setMobileMenuOpen(false)}>{item}</a>
              ))}
            </div>
            <div className="mt-auto pt-8 border-t border-slate-100 flex flex-col gap-4">
              <button 
                onClick={() => navigate('/login')}
                className="w-full py-4 rounded-2xl font-bold text-slate-900 border border-slate-200"
              >
                Log In
              </button>
              <button 
                onClick={() => navigate('/signup')}
                className="w-full py-4 rounded-2xl font-bold text-white bg-emerald-600"
              >
                Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 -z-10 opacity-60"></div>
        
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-3xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-700 text-xs font-bold uppercase tracking-widest mb-8"
            >
              <Zap className="w-3 h-3 fill-emerald-600" />
              Revolutionizing Textile Production
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl lg:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight mb-8"
            >
              Track Every Meter. <br />
              <span className="text-emerald-600 italic">Eliminate The Chaos.</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl text-slate-500 leading-relaxed max-w-2xl mb-10"
            >
              The first production operating system designed for the factory floor. Connect your suppliers, track orders, and manage DCs in one powerful flow.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <button 
                onClick={() => navigate('/signup')}
                className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 group"
              >
                Launch Your Dashboard
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold text-lg border border-slate-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                Watch Demo
              </button>
            </motion.div>
          </div>
        </div>

        {/* Dashboard Mockup Component */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 lg:mt-32 max-w-7xl mx-auto px-6"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-600/5 blur-[100px] -z-10 rounded-3xl"></div>
            <div className="bg-slate-900 rounded-3xl p-4 shadow-2xl border border-slate-800">
              <div className="bg-slate-800 h-10 rounded-t-2xl flex items-center px-4 gap-2 border-b border-slate-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                </div>
                <div className="mx-auto bg-slate-700 px-4 py-1 rounded text-[10px] text-slate-400 font-mono tracking-wider">APP.KRAMIZ.COM/DASHBOARD</div>
              </div>
              <div className="grid grid-cols-12 gap-4 p-4 lg:p-6 bg-slate-900 rounded-b-2xl overflow-hidden min-h-[400px]">
                {/* Sidebar Mock */}
                <div className="col-span-3 hidden lg:flex flex-col gap-6 pr-6 border-r border-slate-800">
                  <div className="flex flex-col gap-2">
                    {[
                      { icon: LayoutDashboard, label: 'Overview', active: true },
                      { icon: Package, label: 'Active Orders' },
                      { icon: Truck, label: 'Dispatches' },
                      { icon: Users, label: 'Suppliers' },
                      { icon: MessageSquare, label: 'Chat Engine' }
                    ].map((item, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${item.active ? 'bg-emerald-600/10 text-emerald-500' : 'text-slate-500'}`}>
                        <item.icon className="w-5 h-5" />
                        <span className="text-sm font-bold">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Main Content Mock */}
                <div className="col-span-12 lg:col-span-9 flex flex-col gap-6">
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Total Orders', val: '124', change: '+12%' },
                      { label: 'In Production', val: '48', change: '+4' },
                      { label: 'Dispatched', val: '862', change: '+24' }
                    ].map((stat, i) => (
                      <div key={i} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">{stat.label}</div>
                        <div className="text-2xl font-black text-white">{stat.val}</div>
                        <div className="text-[10px] text-emerald-500 font-bold">{stat.change} vs last month</div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-slate-800/30 rounded-2xl border border-slate-700 flex-1 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <div className="font-bold text-white uppercase text-xs tracking-widest">Active Production Flow</div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] text-emerald-500 font-bold">LIVE SYNC</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {[
                        { order: 'ORD-772', client: 'Essentials Co', status: 'Dyeing', progress: 65 },
                        { order: 'ORD-775', client: 'Urban Wear', status: 'Knitting', progress: 40 },
                        { order: 'ORD-778', client: 'Nova Textile', status: 'Finishing', progress: 90 }
                      ].map((row, i) => (
                        <div key={i} className="flex items-center gap-6 group">
                          <div className="w-16 text-[11px] font-mono text-slate-400">{row.order}</div>
                          <div className="flex-1">
                            <div className="flex justify-between mb-1.5">
                              <span className="text-xs font-bold text-white">{row.client}</span>
                              <span className="text-[10px] text-emerald-500 font-black uppercase">{row.status}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${row.progress}%` }}
                                transition={{ duration: 1, delay: 0.6 + (i * 0.1) }}
                                className="h-full bg-emerald-600 rounded-full"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile Notification Floating Mockup */}
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.2 }}
              className="absolute -right-4 lg:-right-12 top-1/2 -translate-y-1/2 w-48 lg:w-64 bg-white rounded-3xl shadow-2xl p-4 border border-slate-100 hidden sm:block"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kramiz App</div>
                  <div className="text-[11px] font-bold text-slate-900">Push Notification</div>
                </div>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100">
                <div className="text-[10px] font-black text-emerald-700 mb-1">DYEING COMPLETED</div>
                <div className="text-[12px] font-bold text-slate-800 leading-tight">Dyer uploaded DC #4421 for Order #772.</div>
                <div className="mt-2 text-[10px] text-slate-400 font-medium">Just now</div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Stats/Social Proof */}
      <section className="py-20 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { val: '24M+', label: 'Meters Tracked' },
              { val: '450+', label: 'Factories Connected' },
              { val: '98%', label: 'DC Retrieval Rate' },
              { val: '12%', label: 'Average Delay Reduction' }
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl lg:text-4xl font-black text-slate-900 mb-2">{stat.val}</div>
                <div className="text-[11px] lg:text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 lg:py-32 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-20 gap-8">
            <div className="max-w-2xl">
              <span className="text-emerald-600 font-black uppercase tracking-widest text-xs">Platform Capabilities</span>
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mt-4 mb-6">Engineered for the reality of manufacturing.</h2>
              <p className="text-lg text-slate-500 font-medium">We built what factories actually need—not what corporate boards want to see. High-speed, offline-ready, and simple enough for the floor.</p>
            </div>
            <button className="flex items-center gap-2 text-slate-900 font-bold hover:text-emerald-600 transition-colors group">
              View all features
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: 'Data Sovereignty',
                desc: 'Admins control exactly who sees what. Your proprietary style data stays secure, visible only to authorized vendors.'
              },
              {
                icon: Zap,
                title: 'Instant DC Sync',
                desc: 'Suppliers upload Delivery Challans directly from their phone. Digital copies are instantly pinned to the order flow.'
              },
              {
                icon: Users,
                title: 'Vendor Portal',
                desc: 'Give your dyers and knitters a simplified interface to update status. No training required—if they use WhatsApp, they can use Kramiz.'
              },
              {
                icon: BarChart3,
                title: 'Live WIP Tracking',
                desc: 'See exactly where every order stands across multiple vendors. From greige knitting to final garment packing.'
              },
              {
                icon: Globe,
                title: 'Supplier Network',
                desc: 'Invite your existing partners or discover new ones. Build a digital ecosystem that moves as fast as your brand.'
              },
              {
                icon: MessageSquare,
                title: 'Contextual Chat',
                desc: 'Stop searching through endless WhatsApp threads. Every order gets a dedicated, organized channel for communication.'
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-emerald-900/5 transition-all"
              >
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-8">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{feature.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions / The "How it Works" replacement */}
      <section id="solutions" className="py-24 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative">
              <div className="absolute -inset-10 bg-emerald-100 rounded-full blur-[100px] -z-10 opacity-30"></div>
              <div className="space-y-4">
                {[
                  {
                    step: '01',
                    title: 'The Brand Setup',
                    desc: 'Management initializes an order with style numbers and target dates.'
                  },
                  {
                    step: '02',
                    title: 'Supplier Activation',
                    desc: 'Invite dyer, knitter, or printer. They accept the invitation via mobile link.'
                  },
                  {
                    step: '03',
                    title: 'Live Production',
                    desc: 'Status updates and DC uploads flow in real-time. No more manual phone calls.'
                  },
                  {
                    step: '04',
                    title: 'Analytics & Closure',
                    desc: 'Review vendor performance and archive completed order threads.'
                  }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-6 p-6 rounded-3xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                  >
                    <div className="text-2xl font-black text-emerald-200">{item.step}</div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-1">{item.title}</h3>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            
            <div>
              <span className="text-emerald-600 font-black uppercase tracking-widest text-xs">Order Lifecycle</span>
              <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mt-4 mb-8 leading-[1.1]">One system. <br />Infinite visibility.</h2>
              <p className="text-lg text-slate-500 font-medium mb-10 leading-relaxed">Kramiz transforms the fragmented production process into a single, cohesive digital thread. From the moment the order is placed to the final dispatch, every step is captured, verified, and visible.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-slate-900 rounded-3xl">
                  <div className="text-emerald-400 font-black text-3xl mb-1">10X</div>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Faster DC Retrieval</div>
                </div>
                <div className="p-6 bg-emerald-50 rounded-3xl">
                  <div className="text-emerald-700 font-black text-3xl mb-1">0%</div>
                  <div className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Data Leakage Risk</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA / Final Section */}
      <section className="py-24 lg:py-40">
        <div className="max-w-7xl mx-auto px-6">
          <div className="relative bg-slate-900 rounded-[3rem] overflow-hidden p-12 lg:p-24 text-center">
            {/* Grain/Noise Overlay */}
            <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-4xl lg:text-6xl font-black text-white mb-8 tracking-tight">Ready to modernize your production?</h2>
              <p className="text-xl text-slate-400 mb-12">Join the brands and factories that have swapped chaos for Kramiz.</p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                    onClick={() => navigate('/signup')}
                    className="bg-emerald-600 text-white px-10 py-5 rounded-2xl font-bold text-xl hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-900/40"
                >
                    Get Early Access
                </button>
                <button className="bg-white/10 text-white backdrop-blur-md px-10 py-5 rounded-2xl font-bold text-xl border border-white/20 hover:bg-white/20 transition-all">
                    Contact Sales
                </button>
              </div>
              
              <div className="mt-12 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Card Required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Fast Setup</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-xl font-black tracking-tighter">KRAMIZ</span>
              </div>
              <p className="text-slate-500 text-sm max-w-xs mb-8 font-medium">The production operating system for the global textile industry.</p>
              <div className="flex gap-4">
                {['twitter', 'linkedin', 'instagram'].map(i => (
                  <div key={i} className="w-10 h-10 bg-slate-50 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-100 hover:text-slate-900 transition-all uppercase text-[8px] font-black">{i}</div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-24">
              <div>
                <div className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Platform</div>
                <ul className="space-y-4">
                  {['Features', 'Security', 'Supplier App', 'Network'].map(i => (
                    <li key={i}><a href="#" className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors">{i}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Legal</div>
                <ul className="space-y-4">
                  {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map(i => (
                    <li key={i}><a href="#" className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors">{i}</a></li>
                  ))}
                </ul>
              </div>
              <div className="col-span-2 lg:col-span-1">
                <div className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6">Status</div>
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs font-bold text-emerald-800">All systems operational</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">© 2024 KNITNEXUS TECH PRIVATE LIMITED. ALL RIGHTS RESERVED.</p>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Built with</span>
              <div className="px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black uppercase tracking-widest">Advanced AI</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

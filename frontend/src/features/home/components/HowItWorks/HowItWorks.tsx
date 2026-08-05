import type { HowItWorksProps } from './HowItWorks.types';
import { MOCK_STEPS } from './HowItWorks.data';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { HelpCircle, ArrowRight, CheckCircle2, Zap } from 'lucide-react';

/**
 * Production-ready, mobile-first "How It Works" section component.
 * Clearly articulates the 4-step rental journey (Search -> Select -> Booking Mode -> Pick Up/Operate).
 */
export const HowItWorks = ({
  steps = MOCK_STEPS,
  onGetStartedClick,
  className,
}: HowItWorksProps) => {
  return (
    <section
      className={cn(
        'relative py-16 sm:py-24 bg-slate-900 text-white overflow-hidden border-b border-slate-800',
        className
      )}
      aria-label="How Farm Equipment Rental Works"
    >
      {/* Background Decorative Glows */}
      <div
        className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Simple Rental Process</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight">
            How Renting Machinery Works
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Rent high-performance farm equipment in 4 easy steps with guaranteed transparent
            pricing and flexible booking modes.
          </p>
        </div>

        {/* 4-Step Process Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;

            return (
              <div
                key={step.stepNumber}
                className="relative bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 border border-slate-700/80 flex flex-col justify-between hover:border-emerald-500/50 hover:bg-slate-800 transition-all duration-300 group"
              >
                {/* Step Connector Line (Desktop Only) */}
                {!isLast && (
                  <div
                    className="hidden lg:block absolute top-12 -right-4 w-8 h-[2px] bg-slate-700 group-hover:bg-emerald-500/50 transition-colors z-10"
                    aria-hidden="true"
                  />
                )}

                <div>
                  {/* Header Row: Step Number Code + Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-3xl font-extrabold text-slate-500 group-hover:text-emerald-400 transition-colors tracking-tight">
                      {step.stepCode}
                    </span>

                    <div className="w-12 h-12 rounded-xl bg-slate-700/60 border border-slate-600/60 flex items-center justify-center shadow-inner group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-all">
                      {step.icon}
                    </div>
                  </div>

                  {/* Step Title */}
                  <h3 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-white transition-colors">
                    {step.title}
                  </h3>

                  {/* Step Description */}
                  <p className="text-sm text-slate-400 font-normal leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Optional Badge / Verification Footer */}
                {step.badgeText ? (
                  <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center gap-1.5 text-xs text-amber-400 font-semibold">
                    <Zap className="w-3.5 h-3.5 fill-amber-400 shrink-0" />
                    <span>{step.badgeText}</span>
                  </div>
                ) : (
                  <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>Verified Step</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Banner / CTA Row */}
        <div className="mt-12 sm:mt-16 bg-gradient-to-r from-emerald-900/60 via-slate-800/80 to-teal-900/60 border border-emerald-500/20 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-100">
              Ready to Rent Machinery for Your Farm?
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              Browse available tractors and implements near your location now.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={onGetStartedClick}
            rightIcon={<ArrowRight className="w-5 h-5" />}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shrink-0"
          >
            Start Renting
          </Button>
        </div>
      </div>
    </section>
  );
};

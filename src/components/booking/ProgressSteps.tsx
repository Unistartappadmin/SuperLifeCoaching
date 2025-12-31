type ProgressStepsProps = {
  currentStep: number;
  isPaidService?: boolean;
};

export default function ProgressSteps({ currentStep, isPaidService = false }: ProgressStepsProps) {
  const steps = isPaidService
    ? ["Select session", "Your details", "Payment", "Confirmation"]
    : ["Select session", "Your details", "Confirmation"];

  return (
    <div className={`grid gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ${isPaidService ? 'grid-cols-4' : 'grid-cols-3'}`}>
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;
        return (
          <div key={step} className="flex flex-col items-center gap-1 text-[10px] sm:text-xs md:text-sm">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full border font-semibold transition-all ${
                isCompleted
                  ? "bg-black text-white border-black"
                  : isActive
                  ? "border-[#D4AF37] text-ink"
                  : "border-gray-300 text-gray-400"
              }`}
            >
              {stepNumber}
            </div>
            <span className={`${isActive ? "text-ink font-semibold" : "text-gray-400"} leading-tight text-center`}>{step}</span>
          </div>
        );
      })}
    </div>
  );
}

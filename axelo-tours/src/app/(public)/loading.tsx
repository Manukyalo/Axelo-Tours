export default function PublicLoading() {
  return (
    <div className="min-h-screen bg-[#FAFAF7] flex flex-col items-center justify-center space-y-8">
      {/* Premium Spinner */}
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 bg-accent rounded-full animate-pulse" />
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl font-bold text-foreground">Preparing Your Journey</h2>
        <p className="text-muted-foreground font-medium animate-pulse">Scanning the savanna...</p>
      </div>
    </div>
  );
}

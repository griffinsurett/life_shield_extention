export const AboutTab = () => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 animate-fade-in">
      <div className="text-center mb-8">
        <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-3xl flex items-center justify-center text-5xl mx-auto mb-4 shadow-xl">
          🌿
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Wellness Filter</h2>
        <p className="text-gray-600">Version 1.0.0</p>
      </div>

      <div className="space-y-6">
        <div className="p-6 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl">
          <h3 className="font-semibold text-gray-800 mb-2">About This Extension</h3>
          <p className="text-gray-600 leading-relaxed">
            Wellness Filter helps you maintain healthy browsing habits by filtering unwanted content 
            and replacing it with positive, wellness-focused alternatives. Take control of your 
            digital experience and promote mental wellbeing.
          </p>
        </div>

        <div className="p-6 bg-gray-50 rounded-xl text-center">
          <p className="text-gray-600 mb-4">Made with 💚 for healthier browsing</p>
        </div>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { LocationType, tunisiaGovernorates } from '@/utils/tunisiaLocations';

interface LocationPickerProps {
  value: LocationType | null;
  onChange: (location: LocationType) => void;
  className?: string;
}

export default function LocationPicker({ value, onChange, className = '' }: LocationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGovernorate, setSelectedGovernorate] = useState<string | null>(value?.governorate || null);
  const [selectedCity, setSelectedCity] = useState<string | null>(value?.city || null);
  const [step, setStep] = useState<'governorate' | 'city'>('governorate');

  useEffect(() => {
    if (value) {
      setSelectedGovernorate(value.governorate);
      setSelectedCity(value.city);
    }
  }, [value]);

  const handleGovernorateSelect = (governorateName: string) => {
    setSelectedGovernorate(governorateName);
    setStep('city');
  };

  const handleCitySelect = (cityName: string) => {
    setSelectedCity(cityName);
    onChange({ governorate: selectedGovernorate!, city: cityName });
    setIsOpen(false);
    setStep('governorate');
  };

  const handleBackToGovernorates = () => {
    setStep('governorate');
  };

  const selectedGovernorateData = tunisiaGovernorates.find(g => g.name === selectedGovernorate);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`w-full p-3 rounded-lg bg-[#1D2D50] text-[#CCD6F6] border border-[#64FFDA] focus:ring-2 focus:ring-[#64FFDA] focus:border-transparent text-left ${className}`}
      >
        {value ? `${value.city}, ${value.governorate}, Tunisia` : 'Select location'}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#112240] rounded-lg w-full max-w-md">
            {/* Header */}
            <div className="p-4 border-b border-[#1D2D50] flex items-center">
              {step === 'city' && (
                <button
                  onClick={handleBackToGovernorates}
                  className="mr-2 text-[#64FFDA] hover:text-[#45E6C4]"
                >
                  ← Back
                </button>
              )}
              <h2 className="text-xl font-semibold text-[#64FFDA]">
                {step === 'governorate' ? 'Select Governorate' : 'Select City'}
              </h2>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setStep('governorate');
                }}
                className="ml-auto text-[#8892B0] hover:text-[#CCD6F6]"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {step === 'governorate' ? (
                <div className="grid grid-cols-1 gap-2">
                  {tunisiaGovernorates.map((governorate) => (
                    <button
                      key={governorate.id}
                      onClick={() => handleGovernorateSelect(governorate.name)}
                      className={`p-3 rounded-lg text-left transition-colors duration-200 ${
                        selectedGovernorate === governorate.name
                          ? 'bg-[#64FFDA] text-[#112240]'
                          : 'bg-[#1D2D50] text-[#CCD6F6] hover:bg-[#2A3E63]'
                      }`}
                    >
                      {governorate.name}
                    </button>
                  ))}
                </div>
              ) : selectedGovernorateData ? (
                <div className="grid grid-cols-1 gap-2">
                  {selectedGovernorateData.cities.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleCitySelect(city.name)}
                      className={`p-3 rounded-lg text-left transition-colors duration-200 ${
                        selectedCity === city.name
                          ? 'bg-[#64FFDA] text-[#112240]'
                          : 'bg-[#1D2D50] text-[#CCD6F6] hover:bg-[#2A3E63]'
                      }`}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
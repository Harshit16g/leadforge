"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface LocationContextType {
  city: string;
  setCity: (city: string) => void;
  isLoading: boolean;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const SUPPORTED_CITIES = [
  "New Delhi",
  "Mumbai",
  "Bangalore",
  "Hyderabad",
  "Chennai",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Lucknow",
  "Gurgaon",
  "Noida",
  "Chandigarh",
];

export function LocationProvider({ children }: { children: ReactNode }) {
  const [city, setCityState] = useState<string>("New Delhi");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const setCity = (newCity: string) => {
    setCityState(newCity);
    localStorage.setItem("selected_city", newCity);
  };

  const fetchCityFromCoords = async (lat: number, lon: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );
      const data = await response.json();
      const detectedCity = data.address.city || data.address.town || data.address.village || data.address.state_district;
      
      if (detectedCity) {
        // Find the closest supported city or just use the detected one if we want to be flexible
        // For now, let's just use the detected city if it's reasonably a city name
        setCity(detectedCity);
      }
    } catch (error) {
      console.error("Error fetching city from coords:", error);
    }
  };

  const refreshLocation = async () => {
    setIsLoading(true);
    if (!navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await fetchCityFromCoords(latitude, longitude);
        setIsLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    const savedCity = localStorage.getItem("selected_city");
    if (savedCity) {
      setCityState(savedCity);
      setIsLoading(false);
    } else {
      refreshLocation();
    }
  }, []);

  return (
    <LocationContext.Provider value={{ city, setCity, isLoading, refreshLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}

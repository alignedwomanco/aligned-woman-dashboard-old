import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

export default function PlaceAutocomplete({ value, onChange, className, placeholder }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google?.maps?.places) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsLoaded(true));
      existingScript.addEventListener('error', () => setError(true));
      return;
    }

    // Load Google Maps script with Places library
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&libraries=places&callback=Function.prototype`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.maps?.places) {
        setIsLoaded(true);
      } else {
        setError(true);
      }
    };
    script.onerror = () => setError(true);
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current || error) return;

    try {
      // Initialize autocomplete with proper options
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ["(cities)"],
        fields: ["formatted_address", "name", "address_components"],
      });

      // Listen for place selection
      const listener = autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace();
        if (place.formatted_address) {
          onChange(place.formatted_address);
        } else if (place.name) {
          onChange(place.name);
        }
      });

      return () => {
        if (listener) {
          window.google.maps.event.removeListener(listener);
        }
      };
    } catch (err) {
      console.error("Error initializing Google Places:", err);
      setError(true);
    }
  }, [isLoaded, onChange, error]);

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      placeholder={error ? "Type city name manually" : placeholder}
      autoComplete="off"
    />
  );
}
import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

export default function PlaceAutocomplete({ value, onChange, className, placeholder }) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load Google Maps script
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setIsLoaded(true);
      document.head.appendChild(script);
    } else {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return;

    // Initialize autocomplete
    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ["(cities)"],
      fields: ["formatted_address", "name"],
    });

    // Listen for place selection
    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current.getPlace();
      if (place.formatted_address) {
        onChange(place.formatted_address);
      } else if (place.name) {
        onChange(place.name);
      }
    });

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, onChange]);

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
      placeholder={placeholder}
      autoComplete="off"
    />
  );
}
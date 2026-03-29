/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  safelist: [
    // Brand bg / text helpers used dynamically
    "bg-brand-burgundy", "bg-brand-rose", "bg-brand-purple",
    "text-brand-burgundy", "text-brand-rose", "text-brand-purple",
    "border-brand-burgundy", "border-brand-rose",
  ],
  theme: {
    extend: {
      /* ── Border radius ──────────────────────────── */
      borderRadius: {
        "2xl":  "1rem",
        "3xl":  "1.5rem",
        "4xl":  "2rem",
        lg:     "var(--radius)",
        md:     "calc(var(--radius) - 2px)",
        sm:     "calc(var(--radius) - 4px)",
      },

      /* ── Colors ─────────────────────────────────── */
      colors: {
        /* Shadcn semantic */
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input:  "hsl(var(--input))",
        ring:   "hsl(var(--ring))",

        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },

        sidebar: {
          DEFAULT:              "hsl(var(--sidebar-background))",
          foreground:           "hsl(var(--sidebar-foreground))",
          primary:              "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent:               "hsl(var(--sidebar-accent))",
          "accent-foreground":  "hsl(var(--sidebar-accent-foreground))",
          border:               "hsl(var(--sidebar-border))",
          ring:                 "hsl(var(--sidebar-ring))",
        },

        /* ── Aligned Woman brand palette ─────────── */
        brand: {
          burgundy:   "#6B1B3D",
          "burgundy-deep": "#3B1028",
          rose:       "#C4687D",
          "rose-light": "#C67793",
          purple:     "#3C224F",
          "purple-mid": "#4B397F",
          violet:     "#7340B9",
          cream:      "#FAF5F0",
        },
      },

      /* ── Typography ─────────────────────────────── */
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans:    ["var(--font-sans)", "system-ui", "sans-serif"],
      },

      /* ── Box shadows ────────────────────────────── */
      boxShadow: {
        "brand-sm":  "0 2px 20px rgba(107, 27, 61, 0.06)",
        "brand-md":  "0 8px 30px rgba(107, 27, 61, 0.10)",
        "brand-lg":  "0 20px 60px rgba(107, 27, 61, 0.14)",
        "rose-glow": "0 4px 20px rgba(196, 104, 125, 0.30)",
      },

      /* ── Background images / gradients ─────────── */
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #3C224F 0%, #6B1B3D 60%, #C4687D 100%)",
        "gradient-rose":  "linear-gradient(135deg, #C67793 0%, #C4687D 100%)",
        "gradient-warm":  "linear-gradient(135deg, #FAF5F0 0%, #F5EAF0 100%)",
      },

      /* ── Animations ─────────────────────────────── */
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-in":        "fade-in 0.4s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
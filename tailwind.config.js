module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        display: ['system-ui', 'ui-sans-serif', 'sans-serif'],
        body: ['system-ui', 'ui-sans-serif', 'sans-serif'],
      },
      colors: {
        // Brand
        primary: {
          DEFAULT: "#2CD416",
          soft: "#E7FBD5",
          muted: "#9FEF8A",
          dark: "#1A8F0D",
        },
        secondary: {
          DEFAULT: "#7C3AED",
          soft: "#EDE9FE",
          dark: "#5B21B6",
        },
        accent: {
          DEFAULT: "#06B6D4",
          soft: "#E0F7FB",
          dark: "#0E7490",
        },

        // Semantic
        success: {
          DEFAULT: "#16A34A",
          soft: "#DCFCE7",
        },
        warning: {
          DEFAULT: "#F59E0B",
          soft: "#FEF3C7",
        },
        danger: {
          DEFAULT: "#DC2626",
          soft: "#FEE2E2",
        },

        // Surfaces
        background: {
          DEFAULT: "#050816",
          soft: "#070B1F",
          elevated: "#0B1023",
        },
        border: {
          subtle: "#1F2937",
          strong: "#374151",
        },
        text: {
          DEFAULT: "#F9FAFB",
          muted: "#9CA3AF",
          subtle: "#6B7280",
        },
      },
      boxShadow: {
        "soft-card":
          "0 18px 45px rgba(15, 23, 42, 0.45), 0 0 0 1px rgba(148, 163, 184, 0.12)",
      },
      backgroundImage: {
        "radial-grid":
          "radial-gradient(circle at 1px 1px, rgba(148,163,184,0.25) 1px, transparent 0)",
        "brand-gradient":
          "linear-gradient(135deg, #2CD416 0%, #06B6D4 45%, #7C3AED 100%)",
      },
    },
  },
  plugins: [],
};

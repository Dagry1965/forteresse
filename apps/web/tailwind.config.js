import tailwindcss from "tailwindcss";
import { shadcnPreset } from "shadcn/preset";

export default {
  presets: [shadcnPreset],

  content: [
    "./app/**/*.{ts,tsx,js,jsx}",
    "./pages/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
  ],

  theme: {
    extend: {},
  },

  plugins: [tailwindcss()],
};

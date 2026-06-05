/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        stonebrand: {
          charcoal: "#171717",
          graphite: "#2f3437",
          gold: "#b88a35",
          amber: "#d5aa57",
          mist: "#f5f7f8",
        },
      },
      boxShadow: {
        auth: "0 24px 70px rgba(23, 23, 23, 0.16)",
      },
    },
  },
  plugins: [],
};

module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                customDarkGray: "#3E3D3D",
                customGray: "#2E2E2E",
                customLightGray: "#4A4A4A",
                customBlack: "#020C19",
                customBlue: "#044ED6",
                primitive: "#BD3C1C",
                modifier: "#7DA119",
                composite: "#51A4D3"
            },

            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)"
            },
            fontFamily: {
                sans: ["Roboto"]
            }
        }
    },
    plugins: [
        require("tailwindcss-animate"),
        require("@tailwindcss/line-clamp"),
        require("tailwind-scrollbar-hide"),
        require("tailwind-scrollbar")
    ]
};

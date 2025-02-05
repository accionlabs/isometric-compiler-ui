module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                customGray: "#2E2E2E",
                customLightGray: "#4A4A4A",
                customBorderColor: "#575757",
                custom2D: "#61C5FF",
                custom3D: "#FC97FF",
                customLayer: "#E3FF96",
                customComponent: "#FFAD00",
                customTextSecondary: "#BFBFBF",
                customBlack: "#020C19",
                customBlue: "#044ED6"
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)"
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

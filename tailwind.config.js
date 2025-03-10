module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            colors: {
                customDarkGray: "#3E3D3D",
                customGray: "#2E2E2E",
                customLightGray: "#4A4A4A",
                lightGray2: "#DEDEDE",
                customGray2: "#3B3B3B",
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
                roboto: ["Roboto"]
            },
            keyframes: {
                dots: {
                    "0%, 20%": { content: "'.'" },
                    "40%": { content: "'..'" },
                    "60%": { content: "'...'" },
                    "80%, 100%": { content: "'....'" }
                }
            },
            animation: {
                dots: "dots 1.5s steps(4) infinite"
            }
        }
    },
    plugins: [
        require("tailwindcss-animate"),
        require("tailwind-scrollbar-hide"),
        require("tailwind-scrollbar")
    ]
};

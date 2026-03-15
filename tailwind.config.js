/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                bgBase: '#0f0f12',
                bgCard: '#15161a',
                mainAccent: '#e94b28',
                accentHover: '#f75d3c',
                textMain: '#f0f0f5',
                textMuted: '#8e8e99',
                glassBorder: '#26262b',
                brandGradient: 'linear-gradient(to right, #e94b28, #f75d3c)'
            },
            fontFamily: {
                inter: ['Inter', 'sans-serif'],
                bodoni: ['Bodoni Moda', 'serif'],
            },
            animation: {
                blob: "blob 15s infinite alternate ease-in-out",
                tilt: "tilt 10s infinite linear",
            },
            keyframes: {
                blob: {
                    "0%": { transform: "translate(0px, 0px) scale(1)" },
                    "33%": { transform: "translate(30px, -50px) scale(1.1)" },
                    "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
                    "100%": { transform: "translate(0px, 0px) scale(1)" },
                },
                tilt: {
                    "0%, 50%, 100%": { transform: "rotate(0deg)" },
                    "25%": { transform: "rotate(0.5deg)" },
                    "75%": { transform: "rotate(-0.5deg)" },
                }
            }
        },
    },
    plugins: [],
}

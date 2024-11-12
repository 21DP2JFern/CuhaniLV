import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors:{
        "main-white" : "#fdfdec",
        "main-gray" : "#232e42",
        "main-red" : "#e6000c",
      },
      fontFamily: {
      }
    },
  },
  plugins: [],
} satisfies Config;

module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // _layout.js এর সাথে হুবহু মিল রেখে ফন্টের নামগুলো টেইলউইন্ডে ম্যাপ করা হলো
        'bengali': ['NotoSansBengali_400Regular'],
        'bengali-bold': ['NotoSansBengali_700Bold'],
        'poppins': ['Poppins_400Regular'],
        'poppins-bold': ['Poppins_700Bold'],
      }
    }
  },
  plugins: [],
}
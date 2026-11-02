/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
export default function Logo() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* <!-- Blue background with rounded corners --> */}
        <rect width="64" height="64" rx="16" fill="#2196F3"/>
        <ellipse cx="48" cy="20" rx="18" ry="8" fill="#F57C00" opacity="0.85"/>
        <ellipse cx="24" cy="44" rx="16" ry="7" fill="#4CAF50" opacity="0.75"/>
        <ellipse cx="32" cy="32" rx="28" ry="12" fill="#FFF3E0" opacity="0.5"/>
        {/* <!-- Playful checkmark (success color) --> */}
        {/* <path d="M18 34 L28 44 L46 22" stroke="#4CAF50" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/> */}
        {/* <path d="M30 34 L32 38 L36 30" stroke="#4CAF50" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/> */}
        <path d="M12 10 L32 37 L48 20" stroke="#4CAF50" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        {/* <!-- Star for gamification (warning color) --> */}
        {/* <polygon points="32,14 35,24 46,24 37,30 40,40 32,34 24,40 27,30 18,24 29,24" */}
              {/* fill="#FDD835" stroke="#E65100" stroke-width="1"/>  */}

        {/* <!-- Abstract "face" with playful, energetic style --> */}
        {/* <!-- Orange arc for a big smile --> */}
        <path d="M18 34 Q32 50 48 34" stroke="#F57C00" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
        {/* <!-- Two eyes: one winking, one open --> */}
        <ellipse cx="26" cy="30" rx="3" ry="4" fill="#fff" stroke="#0D47A1" strokeWidth="1.5"/>
        <ellipse cx="38" cy="30" rx="3" ry="1.2" fill="#fff" stroke="#0D47A1" strokeWidth="1.5"/>
        {/* <!-- Cheek dots for energy --> */}
        <circle cx="14" cy="28" r="1.6" fill="#FDD835"/>
        <circle cx="50" cy="32" r="1.4" fill="#f50000"/>
        {/* <!-- Subtle green "eyebrow" for character --> */}
        <path d="M23 25 Q26 23 29 25" stroke="#f50000" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
        {/* <!-- Subtle red "eyebrow" for character --> */}
        <path d="M32 25 Q36 23 41 25" stroke="#f5f500" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
        {/* <!-- Colorful abstract spheres for energy and fun --> */}
        {/* <ellipse cx="48" cy="20" rx="5" ry="5" fill="#F57C00" opacity="0.85"/> */}
        {/* <ellipse cx="24" cy="48" rx="4" ry="4" fill="#4CAF50" opacity="0.75"/> */}
        {/* <ellipse cx="16" cy="18" rx="3" ry="3" fill="#FDD835" opacity="0.8"/> */}
        {/* <ellipse cx="50" cy="48" rx="3" ry="3" fill="#E53935" opacity="0.7"/> */}
        {/* <!-- App name, bold and white, theme font --> */}
        <text x="32" y="56" textAnchor="middle" fontFamily="Fredoka, Roboto, Helvetica, Arial, sans-serif"
            fontSize="13" fill="#fff" fontWeight="bold" letterSpacing="1">DoDone</text>
</svg>
 );
}
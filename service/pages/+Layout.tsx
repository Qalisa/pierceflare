import "@/style/global.css";
import "@/style/tailwind.css";

import logoUrl from "@/assets/images/logoIvyText.png?format=webp";
import logoQalsa from "@/assets/images/logoQalisa.png?format=webp";
import { Link } from "@/components/Link";
import { usePageContext } from "vike-react/usePageContext";
import { motion, Variants } from "framer-motion";
import { useState } from "react";
import { linkedinUrl, prodBranchName } from "@/utils/infos";

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div data-theme="dark" className="relative w-full">
      <FullViewportPlaceholder>
        <Headbar />
        <Content>{children}</Content>
      </FullViewportPlaceholder>
      <Footer />
    </div>
  );
};
export default Layout;

//
//
//

/** Will take at least the whole viewport height size */
const FullViewportPlaceholder = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return <div className="relative flex min-h-screen flex-col">{children}</div>;
};

//
const Content = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative flex flex-1 overflow-x-hidden">
      <div className="relative z-10 flex w-full flex-col">{children}</div>
      <AnimatedBg />
    </div>
  );
};

const AnimatedBg = () => {
  const [enhanceBackground, setEnhanceBackground] = useState(
    import.meta.env.DEV,
  );

  //
  const bubblesColor = "gold" as const;
  const gridOpacity = "0.4" as const;
  const opacity = enhanceBackground ? "1" : "0.1";

  const circleVariants: Variants = {
    animate: {
      x: ["0%", "-7%"],
      transition: {
        duration: 20,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut",
      },
    },
  };

  //
  return (
    <>
      {import.meta.env.DEV && (
        <button
          className="btn-secondary btn-xs btn"
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            zIndex: "20",
          }}
          onClick={() => setEnhanceBackground(!enhanceBackground)}
        >
          🐛 Enhance background
        </button>
      )}
      <motion.svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "1000%",
          height: "100%",
          pointerEvents: "none",
        }}
        animate="animate"
        variants={circleVariants}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id="grid"
            x="0"
            y="0"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M20 0 L0 0 L0 20"
              fill="none"
              stroke="grey"
              strokeWidth="0.5"
            />
          </pattern>
          <pattern
            id="bubbles"
            x="0"
            y="0"
            width="1200"
            height="1200"
            patternUnits="userSpaceOnUse"
            viewBox="10 0 100 100"
          >
            <g className="text-accent">
              <circle
                cx={20}
                cy="20"
                r="15"
                fill="url(#layoutCircleGradient)"
              />
              <circle
                cx={80}
                cy="40"
                r="20"
                fill="url(#layoutCircleGradient)"
              />
              <circle
                cx={40}
                cy="70"
                r="25"
                fill="url(#layoutCircleGradient)"
              />
              <circle
                cx={70}
                cy="85"
                r="12"
                fill="url(#layoutCircleGradient)"
              />
              <circle
                cx={50}
                cy="30"
                r="18"
                fill="url(#layoutCircleGradient)"
              />
            </g>
          </pattern>
        </defs>
        <defs>
          <radialGradient id="layoutCircleGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={bubblesColor} stopOpacity="1" />
            <stop offset="50%" stopColor={bubblesColor} stopOpacity="0.5" />
            <stop offset="100%" stopColor={bubblesColor} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect
          width="100%"
          height="100%"
          opacity={gridOpacity}
          fill="url(#grid)"
        />
        <rect
          width="100%"
          height="100%"
          opacity={opacity}
          fill="url(#bubbles)"
        />
      </motion.svg>
    </>
  );
};

//
//
//

const Headbar = () => {
  const { urlPathname } = usePageContext();
  const items = [
    {
      href: "/",
      text: "Accueil",
    },
    {
      href: "/fonctionnement",
      text: "Fonctionnement",
    },
    {
      href: "/mobileApp",
      text: "L'appli",
    },
    {
      href: "/desktopApp",
      text: "Le tableau de bord",
    },
  ];

  return (
    <header className="navbar bg-primary text-base-100 sticky top-0 z-50 w-full justify-between px-4 text-xl md:text-3xl">
      {/* Logo et nom à gauche */}
      <Logo />

      {/* Menu desktop (caché sur mobile) */}
      <div className="relative">
        <ul className="menu menu-horizontal relative hidden justify-center gap-x-4 gap-y-4 px-1 text-lg md:flex">
          {items.map(({ href, text }) => (
            <li key={href}>
              <Link
                href={href}
                variant="ghost"
                className={
                  urlPathname == href
                    ? "menu-selected btn-disabled text-amber-300"
                    : undefined
                }
              >
                {text}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <Link href="/contact" variant="base" className="hidden md:flex">
        Contactez-nous
      </Link>

      {/* Zone droite mobile (bouton contact + menu burger) */}
      <Dropdown />
    </header>
  );
};

//
//
//

const Dropdown = () => {
  //
  const handleClick = () => {
    const elem = document.activeElement;
    if (elem) {
      // @ts-ignore
      elem?.blur();
    }
  };

  //
  return (
    <div className="flex items-center gap-4 md:hidden">
      <Link href="/contact" variant="base" className="p-2 text-sm">
        Contactez-nous
      </Link>
      <div className="dropdown-end dropdown">
        <div tabIndex={0} className="btn-ghost btn menu-selected">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </div>
        <ul
          tabIndex={0}
          className="dropdown-content menu bg-primary z-1 mt-3 w-52 items-start p-2"
          style={{ top: "2.5rem", boxShadow: "1px 2px 5px 2px #00000073" }}
        >
          <li>
            <Link href="/" variant="ghost" onClick={handleClick}>
              Accueil
            </Link>
          </li>
          <li>
            <Link href="/fonctionnement" variant="ghost" onClick={handleClick}>
              Fonctionnement
            </Link>
          </li>
          <li>
            <Link href="/mobileApp" variant="ghost" onClick={handleClick}>
              L&apos;appli
            </Link>
          </li>
          <li>
            <Link href="/desktopApp" variant="ghost" onClick={handleClick}>
              Le tableau de bord
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
};

//
//
//

const Footer = () => {
  return (
    <footer className="bg-primary text-base-100 relative z-10 w-full">
      <div className="flex flex-col items-center justify-between px-4 py-6 md:flex-row md:px-8">
        {/* Logo et nom */}
        <div className="mb-4 flex flex-wrap items-center justify-center gap-1 md:mb-0">
          <Logo />
          <span className="ml-4">-</span>
          <DeveloppedBy />
        </div>
        {/* Navigation liens - Vertical sur mobile, Horizontal sur desktop */}
        <div className="flex flex-col gap-4 text-center md:flex-row md:gap-8 md:text-left">
          <Link href="/about" variant="ghost">
            À propos
          </Link>
          <Link href="/legal/mentions" variant="ghost">
            Mentions légales
          </Link>
          <Link href="/legal/cgu" variant="ghost">
            CGU
          </Link>
        </div>
        <AppVersionDigest />
        {/* LinkedIn */}
        <div className="mt-4 md:mt-0">
          <a
            href={linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-2xl"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="hover:text-secondary transition-colors"
            >
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
};

const DeveloppedBy = () => {
  return (
    <div className="flex items-center gap-0">
      <span
        className="text-sm font-normal"
        style={{ textAlign: "end", marginLeft: ".75rem" }}
      >
        Développé par
      </span>
      <img src={logoQalsa} height={48} width={48} alt="logo" />
    </div>
  );
};

const AppVersionDigest = () => {
  const {
    k8sApp: { imageRevision, imageVersion, version },
  } = usePageContext();

  const hiddenable = imageVersion.includes(prodBranchName);
  const [hidden, setHidden] = useState(hiddenable);

  return (
    <div onClick={hiddenable ? () => setHidden(!hidden) : undefined}>
      <div
        className={`text-xxs flex flex-col items-center text-gray-400 ${hidden ? "invisible" : ""}`}
      >
        <div>
          {version}:{imageVersion}
        </div>
        <div>{imageRevision}</div>
      </div>
    </div>
  );
};

const Logo = () => {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <a href="/">
        <img src={logoUrl} height={80} width={80} alt="logo" />
      </a>
    </div>
  );
};

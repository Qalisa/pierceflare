import FormBlock from "@/components/FormBlock";
import { GotoContactFormButton } from "@/components/GotoContactFormButton";
import { AnimatedBlock } from "@/components/AnimatedBlock";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import phones from "@/assets/images/phones.png?format=webp";
import phoneMockup1 from "@/assets/images/phoneMockup1.png?format=webp";
import desktopMockup1 from "@/assets/images/desktopMockup1.png?format=webp";
import { contactThematics } from "@/utils/contactHelper";
import Link from "@/components/Link";

// Variants pour l'animation du hero
const containerVariants = {
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const elementVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
    },
  },
};

const circleVariants = {
  animate: {
    x: ["-80%", "80%"],
    transition: {
      duration: 10,
      repeat: Infinity,
      ease: "linear",
    },
  },
};

const IndexPage = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Premier bloc - Hero section */}
      <div className="bg-primary relative mx-0 mb-16 min-h-screen max-w-1/1 overflow-hidden p-5 md:mb-32">
        {/* Pattern de fond */}
        <motion.div
          className="absolute inset-0 opacity-[0.1]"
          animate="animate"
          variants={circleVariants}
        >
          <svg
            className="h-full w-full"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <radialGradient id="circleGradient" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="white" stopOpacity="1" />
                <stop offset="50%" stopColor="white" stopOpacity="0.5" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g className="text-base-100">
              <circle cx="20" cy="20" r="15" fill="url(#circleGradient)" />
              <circle cx="80" cy="40" r="20" fill="url(#circleGradient)" />
              <circle cx="40" cy="70" r="25" fill="url(#circleGradient)" />
              <circle cx="70" cy="85" r="12" fill="url(#circleGradient)" />
              <circle cx="50" cy="30" r="18" fill="url(#circleGradient)" />
            </g>
          </svg>
        </motion.div>

        <div className="flex flex-col items-center md:flex-row">
          {/* Contenu hero */}
          <motion.div
            className="relative z-10 mt-20 mb-10 w-full px-4 md:mt-60 md:mb-32 md:ml-[10%] md:w-[50%] md:px-0"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              className="text-secondary mb-6 text-4xl font-bold md:text-6xl"
              variants={elementVariants}
            >
              L&apos;informel au service <br className="hidden md:block" />
              du collectif
            </motion.h1>
            <motion.p
              className="text-base-100 text-xl leading-relaxed md:text-2xl"
              variants={elementVariants}
            >
              Générez du lien social au-delà des silos.{" "}
              <br className="hidden md:block" />
              Proposez et recueillez les aspirations de vos collaborateurs.{" "}
              <br className="hidden md:block" />
              Mesurez fidèlement le climat social au sein de votre organisation.
            </motion.p>
            <motion.div variants={elementVariants}>
              <GotoContactFormButton
                type="demo"
                className="btn-secondary btn mt-10 font-normal"
              />
            </motion.div>
          </motion.div>

          {/* Image phones */}
          <div className="pointer-events-none z-0 w-full md:absolute md:right-0 md:h-[80vh] md:w-[50%]">
            <motion.div
              className="flex h-full w-full items-center justify-center"
              variants={elementVariants}
              initial="hidden"
              animate="visible"
            >
              <img
                src={phones}
                className="h-auto w-full object-contain"
                alt="Phones illustration"
              />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Deuxième bloc - Application mobile */}
      <AnimatedBlock
        side="left"
        isMobile={isMobile}
        mockup={
          <div className="flex w-full items-center justify-center">
            <img
              src={phoneMockup1}
              className="w-[60%] object-contain md:w-[40%]"
              alt="Application mobile mockup"
            />
          </div>
        }
      >
        <h2 className="text-secondary text-3xl font-bold md:text-5xl">
          Une application pour <br className="hidden md:block" /> vos
          collaborateurs
        </h2>
        <p className="text-lg leading-relaxed md:text-xl">
          Offrez une opportunité à vos équipes de TOUS se réunir autour de leurs
          centres d&apos;intérêt.
          <br />
          <br />
          Après avoir complété leur profil, les utilisateurs se verront proposer
          des opportunités de rencontre et d&apos;échange avec d&apos;autres
          collaborateurs aux centres d&apos;intérêt communs.
          <br />
          <br />
          Ce canal leur permettra également de faire des remontées et suivre
          périodiquement leur humeur.
        </p>
        <GotoButton
          href="/mobileApp"
          className="btn-secondary btn mt-10 font-normal"
        />
      </AnimatedBlock>

      {/* Troisième bloc - Application desktop */}
      <AnimatedBlock
        side="right"
        isMobile={isMobile}
        mockup={
          <div className="flex w-full items-center justify-center">
            <img
              src={desktopMockup1}
              className="w-[80%] object-contain md:w-[60%]"
              alt="Application desktop mockup"
            />
          </div>
        }
      >
        <h2 className="text-secondary text-3xl font-bold md:text-5xl">
          Une webapp pour les administrateurs
        </h2>
        <p className="text-lg leading-relaxed md:text-xl">
          Définissez vos administrateurs et offrez-leur l&apos;opportunité de
          s&apos;impliquer dans la vie sociale de l&apos;organisation selon
          leurs prérogatives.
          <br />
          <br />
          <b className="text-2xl">CSE</b> – Proposez et sondez les envies des
          salariés sur un canal unique, sans vous baser sur des prévisions
          hypothétiques et épargnez-vous le temps de prospection.
          <br />
          <br />
          <b className="text-2xl">RH</b> – Devenez plus réactifs en profitant
          d&apos;un outil de suivi personnalisé du climat social de vos
          sous-entités et adaptez votre réponse aux besoins des équipes.
        </p>
        <GotoButton
          href="/desktopApp"
          className="btn-secondary btn mt-10 font-normal"
        />
      </AnimatedBlock>

      {/* Formulaire de contact */}
      <FormBlock />
    </>
  );
};

const GotoButton = ({
  className,
  href,
}: {
  href: string;
  className?: string;
}) => {
  return (
    <Link href={href} className={className} variant="base">
      {contactThematics["info"].text}
    </Link>
  );
};

export default IndexPage;

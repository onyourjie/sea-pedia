"use client";

import Image from "next/image";
import {
  ArrowDown,
  Clock3,
  Mail,
  MapPin,
  Phone,
  Send,
  Waves,
  Star
} from "lucide-react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { useRef } from "react";

const CONTACTS = [
  {
    icon: Phone,
    title: "Nomor Telepon",
    value: "0838 9916 7705",
    note: "Siap membantu Senin–Jumat",
    href: "#",
    tone: "bg-cyan-50 text-cyan-600",
  },
  {
    icon: Mail,
    title: "Email",
    value: "filzahmufidah@student.ub.ac.id",
    note: "Kami membalas maksimal 1×24 jam",
    href: "mailto:filzahmufidah@student.ub.ac.id",
    tone: "bg-blue-50 text-blue-600",
  },
  {
    icon: MapPin,
    title: "Studio SEAPEDIA",
    value: "Malang, Jawa Timur",
    note: "Indonesia",
    href: "https://maps.google.com/?q=Malang,+Jawa+Timur",
    tone: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: Clock3,
    title: "Jam Layanan",
    value: "08.00 – 17.00 WIB",
    note: "Senin sampai Jumat",
    tone: "bg-orange-50 text-orange-600",
    href: "https://www.timeanddate.com/worldclock/indonesia/malang",
  },
];

const container = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.09 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" as const },
  },
};

export function ContactPageContent() {
  const founderRef = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: founderRef,
    offset: ["start start", "end start"],
  });

  const portraitY = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [0, 90],
  );
  const portraitScale = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [1, 1] : [1, 1.08],
  );
  const copyY = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [0, 38],
  );
  const bubbleY = useTransform(
    scrollYProgress,
    [0, 1],
    reduceMotion ? [0, 0] : [0, -120],
  );

  return (
    <main className="overflow-hidden bg-white">
      <section
        ref={founderRef}
        className="relative isolate min-h-[720px] overflow-hidden border-b border-cyan-100 bg-gradient-to-br from-white via-cyan-50/70 to-blue-50"
      >
        <motion.div
          style={{ y: bubbleY }}
          className="pointer-events-none absolute -left-20 top-24 h-72 w-72 rounded-full bg-cyan-200/35 blur-3xl"
        />
        <motion.div
          style={{ y: portraitY }}
          className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl"
        />
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />

        <div className="relative mx-auto grid min-h-[720px] max-w-7xl items-center gap-12 px-4 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:px-6 lg:py-20">
          <motion.div
            style={{ y: portraitY, scale: portraitScale }}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative mx-auto flex w-full max-w-[460px] items-center justify-center"
          >
            <div className="absolute h-[86%] w-[86%] rounded-full border border-dashed border-cyan-300" />

            <div className="relative h-72 w-72 overflow-hidden rounded-full border-[10px] border-white bg-cyan-100 shadow-[0_30px_80px_rgba(8,145,178,0.25)] sm:h-96 sm:w-96">
              <Image
                src="/founder.jpeg"
                alt="Filzah Mufidah, founder SEAPEDIA"
                fill
                priority
                sizes="(max-width: 640px) 288px, 384px"
                className="object-cover object-[50%_55%]"
              />
              <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-cyan-950/25 to-transparent" />
            </div>

            <motion.div
              initial={{ opacity: 0, x: -20, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border border-cyan-100 bg-white px-5 py-3 text-sm font-semibold text-gray-800 shadow-xl shadow-cyan-900/10"
            >
              <Star className="h-4 w-4 text-cyan-500" />
              Building waves impact
            </motion.div>
          </motion.div>

          <motion.div style={{ y: copyY }} className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700 shadow-sm backdrop-blur"
            >
              <Waves className="h-4 w-4" />
              Meet Our Founder
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-4xl font-black leading-[1.05] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl"
            >
              Filzah Mufidah
              <span className="mt-2 block bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                Founder of SEAPEDIA
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mx-auto mt-6 max-w-2xl text-base leading-8 text-gray-600 lg:mx-0 lg:text-lg"
            >
              Berawal dari keyakinan bahwa potensi laut Indonesia layak
              terhubung dengan teknologi yang ramah dan mudah digunakan,
              SEAPEDIA hadir untuk mendekatkan produk, pelaku usaha, dan
              masyarakat dalam satu ekosistem maritim.
            </motion.p>

            <motion.div
              variants={container}
              initial="hidden"
              animate="visible"
              className="mt-8 grid grid-cols-2 gap-3 sm:max-w-lg lg:mx-0"
            >
              <motion.div variants={item} className="rounded-2xl border border-white bg-white/75 p-4 text-left shadow-sm backdrop-blur">
                <div className="text-2xl font-black text-cyan-600">2026</div>
                <div className="mt-1 text-xs font-medium text-gray-500">Tahun perjalanan dimulai</div>
              </motion.div>
              <motion.div variants={item} className="rounded-2xl border border-white bg-white/75 p-4 text-left shadow-sm backdrop-blur">
                <div className="text-2xl font-black text-cyan-600">1 Laut</div>
                <div className="mt-1 text-xs font-medium text-gray-500">Jutaan peluang terhubung</div>
              </motion.div>
            </motion.div>

            <motion.a
              href="#contact-us"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75 }}
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 transition hover:text-cyan-900"
            >
              Hubungi kami
              <motion.span
                animate={reduceMotion ? undefined : { y: [0, 5, 0] }}
                transition={{ duration: 1.7, repeat: Infinity }}
              >
                <ArrowDown className="h-4 w-4" />
              </motion.span>
            </motion.a>
          </motion.div>
        </div>
      </section>

      <section id="contact-us" className="relative scroll-mt-24 bg-gray-50 py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-600">
              Contact Us
            </span>
            <h2 className="mt-3 text-3xl font-black text-gray-900 sm:text-4xl">
              Mari terhubung dengan SEAPEDIA
            </h2>
            <p className="mt-4 leading-7 text-gray-500">
              Punya pertanyaan, ide kolaborasi, atau ingin ngobrol tentang
              ekosistem maritim? Pilih jalur yang paling nyaman untukmu.
            </p>
          </motion.div>

          <motion.div
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {CONTACTS.map((contact) => {
              const Icon = contact.icon;
              const content = (
                <>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${contact.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-bold text-gray-900">{contact.title}</h3>
                  <p className="mt-2 break-words text-sm font-semibold leading-6 text-gray-700">
                    {contact.value}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-400">{contact.note}</p>
                </>
              );

              return (
                <motion.div key={contact.title} variants={item}>
                  {contact.href ? (
                    <a
                      href={contact.href}
                      target={contact.href.startsWith("http") ? "_blank" : undefined}
                      rel={contact.href.startsWith("http") ? "noreferrer" : undefined}
                      className="group block h-full rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-xl hover:shadow-cyan-900/5"
                    >
                      {content}
                    </a>
                  ) : (
                    <div className="h-full rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                      {content}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.65 }}
            className="relative mt-10 overflow-hidden rounded-[2rem] bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-9 text-white shadow-2xl shadow-cyan-500/20 sm:px-10"
          >
            <Image
              src="/waves.svg"
              alt=""
              width={320}
              height={320}
              aria-hidden="true"
              className="pointer-events-none absolute -right-10 top-1/2 w-64 -translate-y-1/2 scale-[2.2] opacity-15 brightness-0 invert sm:right-8 sm:w-72"
            />
            <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-cyan-50">
                  <Send className="h-4 w-4" />
                  Punya ide besar?
                </div>
                <h3 className="mt-2 text-2xl font-black">
                  Mari buat dampak untuk laut Indonesia.
                </h3>
              </div>
              <a
                href="mailto:filzahmufidah@student.ub.ac.id?subject=Halo%20SEAPEDIA"
                className="inline-flex shrink-0 items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-cyan-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-50"
              >
                Kirim Pesan
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  );
}

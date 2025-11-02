'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { FiCalendar, FiClock, FiShoppingCart } from 'react-icons/fi';

interface WorkingSunday {
  date: Date;
  description: string;
}

interface Translations {
  title: string;
  subtitle: string;
  nextWorkingSunday: string;
  timeRemaining: string;
  allWorkingSundays: string;
  next: string;
  past: string;
  infoTitle: string;
  infoText: string;
  rulesTitle: string;
  rules: string[];
  noteLabel: string;
  noteText: string;
  technicalNote: string;
  lastSundayJanuary: string;
  sundayBeforeEaster: string;
  lastSundayApril: string;
  lastSundayJune: string;
  lastSundayAugust: string;
  thirdSundayBeforeChristmas: string;
  secondSundayBeforeChristmas: string;
  firstSundayBeforeChristmas: string;
  started: string;
}

const translations: Record<string, Translations> = {
  pl: {
    title: 'Niedziele Handlowe',
    subtitle: 'Niedziele handlowe w Polsce - kiedy sklepy są otwarte',
    nextWorkingSunday: 'Najbliższa Niedziela Handlowa',
    timeRemaining: 'Pozostały czas:',
    allWorkingSundays: 'Wszystkie Niedziele Handlowe',
    next: 'NASTĘPNA',
    past: 'PRZESZŁA',
    infoTitle: 'ℹ️ Informacja',
    infoText:
      'W Polsce większość sklepów jest zamknięta w niedziele z powodu ustawy o zakazie handlu. Jednak w ciągu roku są określone niedziele, kiedy sklepy mogą być otwarte.',
    rulesTitle: 'Niedziele handlowe obowiązują według następujących zasad:',
    rules: [
      'Ostatnia niedziela stycznia, kwietnia, czerwca i sierpnia',
      'Jedna niedziela przed Wielkanocą (obliczana rocznie)',
      'Trzy niedziele przed Bożym Narodzeniem (od 2025 roku, wcześniej dwie)'
    ],
    noteLabel: 'Uwaga:',
    noteText:
      'Niektóre przedsiębiorstwa są zwolnione z zakazu, w tym apteki, stacje benzynowe, piekarnie i sklepy, w których pracuje sam właściciel.',
    technicalNote: 'Daty obliczane automatycznie zgodnie z polskim prawem handlowym',
    lastSundayJanuary: 'Ostatnia niedziela stycznia',
    sundayBeforeEaster: 'Niedziela przed Wielkanocą',
    lastSundayApril: 'Ostatnia niedziela kwietnia',
    lastSundayJune: 'Ostatnia niedziela czerwca',
    lastSundayAugust: 'Ostatnia niedziela sierpnia',
    thirdSundayBeforeChristmas: 'Trzecia niedziela przed Bożym Narodzeniem',
    secondSundayBeforeChristmas: 'Druga niedziela przed Bożym Narodzeniem',
    firstSundayBeforeChristmas: 'Pierwsza niedziela przed Bożym Narodzeniem',
    started: 'Rozpoczęta!'
  },
  en: {
    title: 'Trading Sundays',
    subtitle: 'Trading Sundays in Poland - When shops are open',
    nextWorkingSunday: 'Next Working Sunday',
    timeRemaining: 'Time remaining:',
    allWorkingSundays: 'All Working Sundays',
    next: 'NEXT',
    past: 'PAST',
    infoTitle: 'ℹ️ Information',
    infoText:
      'In Poland, most shops are closed on Sundays due to the trading ban law introduced in 2018. However, there are specific Sundays throughout the year when retail stores are allowed to open.',
    rulesTitle: 'Trading Sundays follow these rules:',
    rules: [
      'Last Sunday of January, April, June, and August',
      'One Sunday before Easter (calculated annually)',
      'Three Sundays before Christmas (since 2025, previously two)'
    ],
    noteLabel: 'Note:',
    noteText:
      'Some businesses are exempt from the ban, including pharmacies, gas stations, bakeries, and shops where the owner works alone.',
    technicalNote: 'Dates calculated automatically using official Polish trading law rules',
    lastSundayJanuary: 'Last Sunday of January',
    sundayBeforeEaster: 'Sunday before Easter',
    lastSundayApril: 'Last Sunday of April',
    lastSundayJune: 'Last Sunday of June',
    lastSundayAugust: 'Last Sunday of August',
    thirdSundayBeforeChristmas: 'Third Sunday before Christmas',
    secondSundayBeforeChristmas: 'Second Sunday before Christmas',
    firstSundayBeforeChristmas: 'First Sunday before Christmas',
    started: 'Started!'
  }
};

export default function TradingSundaysSection() {
  const [workingSundays, setWorkingSundays] = useState<WorkingSunday[]>([]);
  const [nextWorkingSunday, setNextWorkingSunday] = useState<WorkingSunday | null>(null);
  const [timeUntilNext, setTimeUntilNext] = useState<string>('');
  const [language, setLanguage] = useState<string>('en');

  useEffect(() => {
    const browserLang = navigator.language.toLowerCase();
    const lang = browserLang.startsWith('pl') ? 'pl' : 'en';
    setLanguage(lang);
  }, []);

  useEffect(() => {
    const sundays = getWorkingSundaysForPoland();
    setWorkingSundays(sundays);

    const now = new Date();
    const upcoming = sundays.find(sunday => sunday.date > now);
    setNextWorkingSunday(upcoming || null);
  }, [language]);

  useEffect(() => {
    if (!nextWorkingSunday) return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = nextWorkingSunday.date.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeUntilNext(t.started);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeUntilNext(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [nextWorkingSunday, language]);

  const t = translations[language];

  const getDescriptionKey = (description: string): string => {
    const map: Record<string, keyof Translations> = {
      'Last Sunday of January': 'lastSundayJanuary',
      'Sunday before Easter': 'sundayBeforeEaster',
      'Last Sunday of April': 'lastSundayApril',
      'Last Sunday of June': 'lastSundayJune',
      'Last Sunday of August': 'lastSundayAugust',
      'Third Sunday before Christmas': 'thirdSundayBeforeChristmas',
      'Second Sunday before Christmas': 'secondSundayBeforeChristmas',
      'First Sunday before Christmas': 'firstSundayBeforeChristmas'
    };
    return map[description] || description;
  };

  const translateDescription = (description: string): string => {
    const key = getDescriptionKey(description);
    return (t[key as keyof Translations] as string) || description;
  };

  const getLastSundayOfMonth = (year: number, month: number): Date => {
    const lastDay = new Date(year, month + 1, 0);
    const dayOfWeek = lastDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek;
    const lastSunday = new Date(year, month, lastDay.getDate() - daysToSubtract);
    return lastSunday;
  };

  const getEasterSunday = (year: number): Date => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month, day);
  };

  const getSundayBeforeEaster = (year: number): Date => {
    const easterSunday = getEasterSunday(year);
    const sundayBeforeEaster = new Date(easterSunday);
    sundayBeforeEaster.setDate(easterSunday.getDate() - 7);
    return sundayBeforeEaster;
  };

  const getSundaysBeforeChristmas = (year: number): Date[] => {
    const christmas = new Date(year, 11, 25);
    const sundays: Date[] = [];

    const currentDate = new Date(christmas);
    while (currentDate.getDay() !== 0) {
      currentDate.setDate(currentDate.getDate() - 1);
    }

    if (currentDate.getTime() === christmas.getTime()) {
      currentDate.setDate(currentDate.getDate() - 7);
    }

    for (let i = 0; i < 3; i++) {
      sundays.unshift(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() - 7);
    }

    return sundays.reverse();
  };

  const getWorkingSundaysForPoland = (): WorkingSunday[] => {
    const currentYear = new Date().getFullYear();
    const sundays: WorkingSunday[] = [];

    for (let year = currentYear; year <= currentYear + 1; year++) {
      sundays.push({
        date: getLastSundayOfMonth(year, 0),
        description: 'Last Sunday of January'
      });

      sundays.push({
        date: getSundayBeforeEaster(year),
        description: 'Sunday before Easter'
      });

      sundays.push({
        date: getLastSundayOfMonth(year, 3),
        description: 'Last Sunday of April'
      });

      sundays.push({
        date: getLastSundayOfMonth(year, 5),
        description: 'Last Sunday of June'
      });

      sundays.push({
        date: getLastSundayOfMonth(year, 7),
        description: 'Last Sunday of August'
      });

      if (year >= 2025) {
        const christmasSundays = getSundaysBeforeChristmas(year);
        christmasSundays.forEach((sunday, index) => {
          sundays.push({
            date: sunday,
            description: `${
              index === 0 ? 'Third' : index === 1 ? 'Second' : 'First'
            } Sunday before Christmas`
          });
        });
      } else {
        const christmasSundays = getSundaysBeforeChristmas(year).slice(1);
        christmasSundays.forEach((sunday, index) => {
          sundays.push({
            date: sunday,
            description: `${index === 0 ? 'Second' : 'First'} Sunday before Christmas`
          });
        });
      }
    }

    const uniqueSundays = sundays.filter(
      (sunday, index, self) =>
        index === self.findIndex(s => s.date.getTime() === sunday.date.getTime())
    );

    const now = new Date();
    return uniqueSundays
      .filter(sunday => sunday.date >= new Date(now.getFullYear(), 0, 1))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const formatDate = (date: Date): string => {
    const locale = language === 'pl' ? 'pl-PL' : 'en-US';
    return date.toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isPastDate = (date: Date): boolean => {
    return date < new Date();
  };

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">{t.title}</h1>
        <p className="text-gray-400">{t.subtitle}</p>
      </motion.div>

      {/* Countdown Section */}
      {nextWorkingSunday && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg p-8 mb-8 shadow-xl"
        >
          <div className="flex items-center justify-center mb-4">
            <FiClock className="w-8 h-8 text-white mr-3" />
            <h2 className="text-2xl font-bold text-white">{t.nextWorkingSunday}</h2>
          </div>

          <div className="text-center mb-6">
            <p className="text-3xl font-bold text-white mb-2">
              {formatDate(nextWorkingSunday.date)}
            </p>
            <p className="text-lg text-blue-100">
              {translateDescription(nextWorkingSunday.description)}
            </p>
          </div>

          <div className="bg-white bg-opacity-20 rounded-lg p-6 backdrop-blur-sm">
            <p className="text-sm text-blue-100 mb-2 text-center">{t.timeRemaining}</p>
            <p className="text-4xl font-bold text-white text-center font-mono">
              {timeUntilNext}
            </p>
          </div>
        </motion.div>
      )}

      {/* All Working Sundays List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800 rounded-lg p-6 shadow-xl"
      >
        <div className="flex items-center mb-6">
          <FiCalendar className="w-6 h-6 text-blue-400 mr-3" />
          <h2 className="text-2xl font-bold text-white">{t.allWorkingSundays}</h2>
        </div>

        <div className="space-y-3">
          {workingSundays.map((sunday, index) => {
            const isPast = isPastDate(sunday.date);
            const isNext = nextWorkingSunday?.date.getTime() === sunday.date.getTime();

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  isNext
                    ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                    : isPast
                    ? 'border-gray-700 bg-gray-700 bg-opacity-30 opacity-50'
                    : 'border-gray-700 bg-gray-700 bg-opacity-50 hover:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <FiShoppingCart
                      className={`w-5 h-5 mr-3 ${
                        isNext ? 'text-blue-400' : isPast ? 'text-gray-500' : 'text-green-400'
                      }`}
                    />
                    <div>
                      <p
                        className={`font-semibold ${
                          isNext ? 'text-blue-300' : isPast ? 'text-gray-400' : 'text-white'
                        }`}
                      >
                        {formatDate(sunday.date)}
                      </p>
                      <p
                        className={`text-sm ${
                          isNext ? 'text-blue-200' : isPast ? 'text-gray-500' : 'text-gray-400'
                        }`}
                      >
                        {translateDescription(sunday.description)}
                      </p>
                    </div>
                  </div>

                  {isNext && (
                    <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      {t.next}
                    </span>
                  )}

                  {isPast && (
                    <span className="bg-gray-600 text-gray-300 text-xs font-bold px-3 py-1 rounded-full">
                      {t.past}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-800 rounded-lg p-6 mt-6 border border-gray-700"
      >
        <h3 className="text-lg font-semibold text-white mb-3">{t.infoTitle}</h3>
        <div className="text-gray-400 text-sm leading-relaxed space-y-2">
          <p>{t.infoText}</p>
          <p className="font-semibold text-gray-300">{t.rulesTitle}</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            {t.rules.map((rule, index) => (
              <li key={index}>{rule}</li>
            ))}
          </ul>
          <p className="pt-2">
            <span className="font-semibold text-gray-300">{t.noteLabel}</span> {t.noteText}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-4 text-center text-gray-500 text-xs"
      >
        {t.technicalNote}
      </motion.div>
    </div>
  );
}

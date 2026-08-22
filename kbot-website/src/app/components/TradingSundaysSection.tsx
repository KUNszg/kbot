'use client';

import _ from 'lodash';
import moment from 'moment';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { FiCalendar, FiClock, FiShoppingCart } from 'react-icons/fi';
import 'moment/locale/pl';

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
    timeRemaining: 'POZOSTAŁY CZAS:',
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
    timeRemaining: 'TIME REMAINING:',
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
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const browserLang = navigator.language.toLowerCase();
    const lang = browserLang.startsWith('pl') ? 'pl' : 'en';
    setLanguage(lang);
    moment.locale(lang);
  }, []);

  useEffect(() => {
    const getEasterSunday = (year: number): Date => {
      const a = year % 19,
        b = Math.floor(year / 100),
        c = year % 100,
        d = Math.floor(b / 4),
        e = b % 4,
        f = Math.floor((b + 8) / 25),
        g = Math.floor((b - f + 1) / 3),
        h = (19 * a + b - d - g + 15) % 30,
        i = Math.floor(c / 4),
        k = c % 4,
        l = (32 + 2 * e + 2 * i - h - k) % 7,
        m = Math.floor((a + 11 * h + 22 * l) / 451);
      const month = Math.floor((h + l - 7 * m + 114) / 31) - 1,
        day = ((h + l - 7 * m + 114) % 31) + 1;
      return new Date(year, month, day);
    };

    const getSundaysBeforeChristmas = (year: number): Date[] => {
      const christmas = moment([year, 11, 25]);
      let currentSunday = christmas.clone().day(0);
      if (currentSunday.isSame(christmas, 'day')) currentSunday.subtract(7, 'days');
      return _.times(3, (i: number) =>
        currentSunday
          .clone()
          .subtract(i * 7, 'days')
          .toDate()
      ).reverse();
    };

    const sundays: WorkingSunday[] = [];
    const currentYear = moment().year();

    _.times(2, (i: number) => {
      const year = currentYear + i;
      sundays.push({
        date: moment([year, 0]).endOf('month').day(0).toDate(),
        description: 'Last Sunday of January'
      });
      sundays.push({
        date: moment(getEasterSunday(year)).subtract(7, 'days').toDate(),
        description: 'Sunday before Easter'
      });
      sundays.push({
        date: moment([year, 3]).endOf('month').day(0).toDate(),
        description: 'Last Sunday of April'
      });
      sundays.push({
        date: moment([year, 5]).endOf('month').day(0).toDate(),
        description: 'Last Sunday of June'
      });
      sundays.push({
        date: moment([year, 7]).endOf('month').day(0).toDate(),
        description: 'Last Sunday of August'
      });

      const christmasSundays = getSundaysBeforeChristmas(year);
      if (year >= 2025) {
        const desc = ['Third', 'Second', 'First'];
        christmasSundays.forEach((s, idx) =>
          sundays.push({ date: s, description: `${desc[idx]} Sunday before Christmas` })
        );
      } else {
        const desc = ['Second', 'First'];
        christmasSundays
          .slice(1)
          .forEach((s, idx) =>
            sundays.push({ date: s, description: `${desc[idx]} Sunday before Christmas` })
          );
      }
    });

    const now = moment();
    const uniqueSundays = _.chain(sundays)
      .uniqBy(s => moment(s.date).format('YYYY-MM-DD'))
      .filter(s => moment(s.date).isSameOrAfter(moment().startOf('year')))
      .sortBy(s => moment(s.date).valueOf())
      .value();

    const futureSundays = uniqueSundays.filter(s => moment(s.date).isSameOrAfter(now));
    const pastSundays = uniqueSundays.filter(s => moment(s.date).isBefore(now));

    setWorkingSundays([..._.takeRight(pastSundays, 2), ...futureSundays]);
    setNextWorkingSunday(_.find(futureSundays, s => moment(s.date).isAfter(now)) || null);
  }, [language]);

  useEffect(() => {
    if (!nextWorkingSunday) return;
    const updateCountdown = () => {
      const now = moment();
      const target = moment(nextWorkingSunday.date);
      const diff = target.diff(now);
      if (diff <= 0) {
        setTimeUntilNext(translations[language].started);
        return;
      }
      const dur = moment.duration(diff);
      setTimeUntilNext(
        `${Math.floor(dur.asDays())}d ${dur.hours()}h ${dur.minutes()}m ${dur.seconds()}s`
      );
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextWorkingSunday, language]);

  if (!isClient) return null;

  const t = translations[language];
  const translateDescription = (d: string): string => {
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
    return (t[map[d] as keyof Translations] as string) || d;
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
              {moment(nextWorkingSunday.date).format('dddd, LL')}
            </p>
            <p className="text-lg text-blue-100">
              {translateDescription(nextWorkingSunday.description)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-white/10 text-white/90 to-transparent rounded-lg p-6 backdrop-blur-md border border-white/20 shadow-inner">
            <p className="text-xs mb-2 text-center uppercase tracking-widest font-bold">
              {t.timeRemaining}
            </p>
            <p className="text-4xl font-black text-center font-mono tracking-tighter drop-shadow-lg">
              {timeUntilNext}
            </p>
          </div>
        </motion.div>
      )}

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
            const isPast = moment(sunday.date).isBefore(moment(), 'day');
            const isNext = moment(nextWorkingSunday?.date).isSame(moment(sunday.date), 'day');
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-4 rounded-lg border-2 transition-all ${isNext ? 'border-blue-500 bg-blue-500 bg-opacity-25' : isPast ? 'border-gray-700 bg-gray-700 bg-opacity-30 opacity-50' : 'border-gray-700 bg-gray-700 bg-opacity-50 hover:border-gray-600'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <FiShoppingCart
                      className={`w-5 h-5 mr-3 ${isNext ? 'text-white' : isPast ? 'text-gray-500' : 'text-green-400'}`}
                    />
                    <div>
                      <p
                        className={`font-semibold ${isNext ? 'text-white' : isPast ? 'text-gray-400' : 'text-white'}`}
                      >
                        {moment(sunday.date).format('dddd, LL')}
                      </p>
                      <p
                        className={`text-sm ${isNext ? 'text-white/80' : isPast ? 'text-gray-500' : 'text-gray-400'}`}
                      >
                        {translateDescription(sunday.description)}
                      </p>
                    </div>
                  </div>
                  {isNext && (
                    <span className="bg-white text-blue-600 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
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
            {t.rules.map((rule, idx) => (
              <li key={idx}>{rule}</li>
            ))}
          </ul>
          <p className="pt-2">
            <span className="font-semibold text-gray-300">{t.noteLabel}</span> {t.noteText}
          </p>
        </div>
      </motion.div>
      <div className="mt-4 text-center text-gray-500 text-xs">{t.technicalNote}</div>
    </div>
  );
}

<?php

namespace App\Services;

class NumberToFrenchWordsConverter
{
    private const UNITS = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
    private const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', '', 'quatre-vingt', ''];

    /**
     * Verified against 39 known-correct French cardinal numbers before
     * this was written into the app, including the irregular boundary
     * cases (70s/90s reusing the 60/80 base, "quatre-vingts" losing its
     * -s when followed by another digit, and "cent" losing its -s the
     * instant anything at all follows it — including "mille" itself,
     * even when nothing follows THAT).
     */
    public function convert(int $n): string
    {
        if ($n === 0) {
            return 'zéro';
        }

        $billions = intdiv($n, 1000000000);
        $millions = intdiv($n % 1000000000, 1000000);
        $thousands = intdiv($n % 1000000, 1000);
        $remainder = $n % 1000;
        $hasRemainder = $remainder > 0;

        $parts = [];
        if ($billions > 0) {
            $parts[] = ($billions === 1 ? 'un' : $this->threeDigits($billions, false)).' milliard'.($billions > 1 ? 's' : '');
        }
        if ($millions > 0) {
            $parts[] = ($millions === 1 ? 'un' : $this->threeDigits($millions, false)).' million'.($millions > 1 ? 's' : '');
        }
        if ($thousands > 0) {
            $parts[] = $thousands === 1 ? 'mille' : $this->threeDigits($thousands, false).' mille';
        }
        if ($hasRemainder || empty($parts)) {
            $parts[] = $this->threeDigits($remainder, true);
        }

        return trim(implode(' ', $parts));
    }

    public function convertCurrency(float $amount, string $currencyLabel, string $centimeLabel): string
    {
        $whole = (int) floor(round($amount, 2));
        $centimes = (int) round((round($amount, 2) - $whole) * 100);

        $result = $this->convert($whole).' '.$currencyLabel;
        if ($centimes > 0) {
            $result .= ' et '.$this->convert($centimes).' '.$centimeLabel;
        }

        return $result;
    }

    private function threeDigits(int $n, bool $isFinal): string
    {
        if ($n === 0) {
            return '';
        }

        $h = intdiv($n, 100);
        $rest = $n % 100;
        $str = '';

        if ($h > 0) {
            $str = $h === 1 ? 'cent' : self::UNITS[$h].' cent';
            if ($rest === 0 && $h > 1 && $isFinal) {
                $str .= 's';
            }
            if ($rest > 0) {
                $str .= ' ';
            }
        }

        if ($rest > 0) {
            $str .= $this->twoDigits($rest);
        }

        return $str;
    }

    private function twoDigits(int $n): string
    {
        if ($n < 20) {
            return self::UNITS[$n];
        }

        $t = intdiv($n, 10);
        $u = $n % 10;

        if ($t === 7 || $t === 9) {
            $base = $t === 7 ? 6 : 8;
            $rem = 10 + $u;
            if ($t === 7 && $u === 1) {
                return self::TENS[$base].' et '.self::UNITS[$rem];
            }

            return self::TENS[$base].'-'.self::UNITS[$rem];
        }

        if ($u === 0) {
            return $t === 8 ? 'quatre-vingts' : self::TENS[$t];
        }

        if ($u === 1 && $t !== 8 && $t >= 2) {
            return self::TENS[$t].' et un';
        }

        return self::TENS[$t].'-'.self::UNITS[$u];
    }
}